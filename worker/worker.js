// ═══════════════════════════════════════════════════════════════════
//  CF Forge — VLESS + Trojan over WebSocket edge proxy
//  Standalone Worker version. Deploy with:  cd worker && npx wrangler deploy
//
//  Environment variables (Worker → Settings → Variables):
//    UUID            → key for VLESS configs
//    TROJAN_PASSWORD → key for Trojan configs
//    PROXYIP         → optional fallback relay (host or host:port)
// ═══════════════════════════════════════════════════════════════════

import { connect } from "cloudflare:sockets";

const DEFAULT_UUID = "b3311f0d-72e4-4f9c-9a3d-5c6b7a8f9e0d";
const DEFAULT_TROJAN_PASSWORD = "ForgeTrojan9217";

const TLS_PORTS = [443, 8443, 2053, 2083, 2087, 2096];
const SUB_ADDRESSES = [
  "188.114.96.7",
  "188.114.97.3",
  "104.16.85.20",
  "104.21.2.3",
  "172.64.80.1",
  "162.159.128.233",
  "198.41.222.106",
  "icook.tw",
];

export default {
  async fetch(request, env) {
    const userID = String((env && env.UUID) || DEFAULT_UUID).toLowerCase();
    const trojanPassword = String((env && env.TROJAN_PASSWORD) || DEFAULT_TROJAN_PASSWORD);
    const upgrade = String(request.headers.get("Upgrade") || "").toLowerCase();

    // ── WebSocket traffic = proxy (VLESS or Trojan) ──────────────────
    if (upgrade === "websocket") {
      const secrets = { userID, trojanSha: sha224hex(trojanPassword) };
      return handleWS(request, secrets, String((env && env.PROXYIP) || ""));
    }

    const url = new URL(request.url);

    // ── Subscription endpoint: mixed VLESS + Trojan ──────────────────
    if (url.pathname === `/sub/${userID}`) {
      return subscriptionResponse(url, userID, trojanPassword);
    }

    return infoResponse(url, userID);
  },
};

// ────────────────────────────────────────────────────────────────────
//  WebSocket proxy core (protocol-agnostic relay)
// ────────────────────────────────────────────────────────────────────

async function handleWS(request, secrets, proxyIP) {
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);
  server.accept();

  const earlyHeader = request.headers.get("sec-websocket-protocol") || "";
  const wsStream = makeReadableWSStream(server, earlyHeader);

  let remoteWriter = null;

  wsStream
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          const u8 = toU8(chunk);
          if (remoteWriter) {
            await remoteWriter.write(u8);
            return;
          }
          // First frame → detect & parse protocol (VLESS or Trojan)
          const parsed = parseAnyHeader(u8, secrets);
          if (parsed.error) throw new Error(parsed.error);

          const socket = await connectRemote(parsed.address, parsed.port, proxyIP);
          remoteWriter = socket.writable.getWriter();

          // VLESS requires a 2-byte response header; Trojan sends payload directly
          if (parsed.respHeader) safeSend(server, parsed.respHeader);
          if (parsed.raw.byteLength > 0) {
            await remoteWriter.write(parsed.raw);
          }
          pumpRemoteToWS(socket, server);
        },
        close() {
          try {
            remoteWriter && remoteWriter.close();
          } catch {}
        },
        abort() {
          try {
            remoteWriter && remoteWriter.close();
          } catch {}
        },
      })
    )
    .catch(() => {
      safeCloseWS(server);
      try {
        remoteWriter && remoteWriter.close();
      } catch {}
    });

  return new Response(null, { status: 101, webSocket: client });
}

function makeReadableWSStream(ws, earlyHeader) {
  let cancelled = false;
  return new ReadableStream({
    start(controller) {
      ws.addEventListener("message", (event) => {
        if (!cancelled) controller.enqueue(event.data);
      });
      ws.addEventListener("close", () => {
        if (!cancelled) {
          try {
            controller.close();
          } catch {}
        }
      });
      ws.addEventListener("error", (err) => {
        try {
          controller.error(err);
        } catch {}
      });
      const { data, error } = base64ToBytes(earlyHeader);
      if (error) {
        try {
          controller.error(error);
        } catch {}
      } else if (data && data.byteLength) {
        controller.enqueue(data);
      }
    },
    cancel() {
      cancelled = true;
      safeCloseWS(ws);
    },
  });
}

function pumpRemoteToWS(socket, ws) {
  socket.readable
    .pipeTo(
      new WritableStream({
        write(chunk) {
          safeSend(ws, chunk);
        },
        close() {
          safeCloseWS(ws);
        },
        abort() {
          safeCloseWS(ws);
        },
      })
    )
    .catch(() => safeCloseWS(ws));
}

async function connectRemote(address, port, proxyIP) {
  const attempts = [{ host: address, port }];
  if (proxyIP) {
    const [h, p] = proxyIP.split(":");
    if (h) attempts.push({ host: h.trim(), port: p ? Number(p) : port });
  }
  let lastErr = null;
  for (const t of attempts) {
    try {
      const socket = connect({ hostname: t.host, port: t.port }, { allowHalfOpen: false });
      socket.closed.catch(() => {});
      await socket.opened;
      return socket;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("connect failed");
}

// ────────────────────────────────────────────────────────────────────
//  Protocol detection & parsing
// ────────────────────────────────────────────────────────────────────

function parseAnyHeader(u8, secrets) {
  // Trojan frames start with 56 hex chars (SHA-224 of password) + CRLF
  if (
    u8.byteLength >= 62 &&
    u8[56] === 0x0d &&
    u8[57] === 0x0a &&
    isHexBytes(u8, 0, 56)
  ) {
    return parseTrojanHeader(u8, secrets.trojanSha);
  }
  return parseVlessHeader(u8, secrets.userID);
}

function isHexBytes(u8, start, end) {
  for (let i = start; i < end; i++) {
    const c = u8[i];
    const ok = (c >= 48 && c <= 57) || (c >= 97 && c <= 102) || (c >= 65 && c <= 70);
    if (!ok) return false;
  }
  return true;
}

// VLESS: ver(1) uuid(16) addonsLen(1) addons(n) cmd(1) port(2) atyp(1) addr payload
function parseVlessHeader(u8, userID) {
  if (!u8 || u8.byteLength < 24) return { error: "short header" };
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

  const uuid = bytesToUUID(u8.subarray(1, 17));
  if (uuid !== userID) return { error: "invalid user" };

  const addonsLen = dv.getUint8(17);
  const cmdOffset = 18 + addonsLen;
  if (cmdOffset + 4 > u8.byteLength) return { error: "short command" };

  const command = dv.getUint8(cmdOffset);
  if (command !== 1) return { error: "only tcp supported" };

  const port = dv.getUint16(cmdOffset + 1);
  const atyp = dv.getUint8(cmdOffset + 3);
  let offset = cmdOffset + 4;
  let address = "";
  let addrLen = 0;

  if (atyp === 1) {
    address = u8.subarray(offset, offset + 4).join(".");
    addrLen = 4;
  } else if (atyp === 2) {
    const len = dv.getUint8(offset);
    address = new TextDecoder().decode(u8.subarray(offset + 1, offset + 1 + len));
    addrLen = len + 1;
  } else if (atyp === 3) {
    const hex = [];
    for (let i = 0; i < 16; i += 2) hex.push(dv.getUint16(offset + i).toString(16));
    address = hex.join(":");
    addrLen = 16;
  } else {
    return { error: "bad atyp" };
  }

  return {
    proto: "vless",
    address,
    port,
    raw: u8.subarray(offset + addrLen),
    respHeader: new Uint8Array([0, 0]),
  };
}

// Trojan: sha224hex(56 ascii) CRLF cmd(1) atyp(1) addr port(2) CRLF payload
// atyp: 1=IPv4, 3=Domain, 4=IPv6
function parseTrojanHeader(u8, expectedSha) {
  const clientSha = new TextDecoder().decode(u8.subarray(0, 56)).toLowerCase();
  if (clientSha !== expectedSha) return { error: "bad trojan password" };

  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const command = dv.getUint8(58);
  if (command !== 1) return { error: "only tcp supported" };

  const atyp = dv.getUint8(59);
  let offset = 60;
  let address = "";
  let addrLen = 0;

  if (atyp === 1) {
    address = u8.subarray(offset, offset + 4).join(".");
    addrLen = 4;
  } else if (atyp === 3) {
    const len = dv.getUint8(offset);
    address = new TextDecoder().decode(u8.subarray(offset + 1, offset + 1 + len));
    addrLen = len + 1;
  } else if (atyp === 4) {
    const hex = [];
    for (let i = 0; i < 16; i += 2) hex.push(dv.getUint16(offset + i).toString(16));
    address = hex.join(":");
    addrLen = 16;
  } else {
    return { error: "bad atyp" };
  }

  const port = dv.getUint16(offset + addrLen);
  const raw = u8.subarray(offset + addrLen + 2 + 2); // skip port + CRLF

  return { proto: "trojan", address, port, raw, respHeader: null };
}

function bytesToUUID(b) {
  let hex = "";
  for (let i = 0; i < b.length; i++) hex += b[i].toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ────────────────────────────────────────────────────────────────────
//  SHA-224 (pure JS — WebCrypto does not provide it)
// ────────────────────────────────────────────────────────────────────

function sha224hex(text) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4].map((x) => x | 0);
  const rr = (x, n) => ((x >>> n) | (x << (32 - n))) | 0;

  const msg = new TextEncoder().encode(text);
  const totalLen = Math.ceil((msg.length + 9) / 64) * 64;
  const padded = new Uint8Array(totalLen);
  padded.set(msg);
  padded[msg.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(totalLen - 4, (msg.length * 8) >>> 0);

  const W = new Int32Array(64);
  for (let block = 0; block < totalLen; block += 64) {
    for (let t = 0; t < 16; t++) W[t] = dv.getInt32(block + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = (rr(W[t - 15], 7) ^ rr(W[t - 15], 18) ^ (W[t - 15] >>> 3)) | 0;
      const s1 = (rr(W[t - 2], 17) ^ rr(W[t - 2], 19) ^ (W[t - 2] >>> 10)) | 0;
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) | 0;
      const ch = ((e & f) ^ (~e & g)) | 0;
      const t1 = (h + S1 + ch + K[t] + W[t]) | 0;
      const S0 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) | 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) | 0;
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  let out = "";
  for (let i = 0; i < 7; i++) out += (H[i] >>> 0).toString(16).padStart(8, "0");
  return out; // 56 hex chars
}

// ────────────────────────────────────────────────────────────────────
//  Subscription (mixed VLESS + Trojan) + info page
// ────────────────────────────────────────────────────────────────────

function buildVlessLink({ uuid, address, host, port, name }) {
  const q = new URLSearchParams({
    encryption: "none",
    security: "tls",
    sni: host,
    fp: "randomized",
    alpn: "http/1.1",
    type: "ws",
    host,
    path: "/",
  });
  return `vless://${uuid}@${address}:${port}?${q.toString()}#${encodeURIComponent(name)}`;
}

function buildTrojanLink({ password, address, host, port, name }) {
  const q = new URLSearchParams({
    security: "tls",
    sni: host,
    fp: "randomized",
    alpn: "http/1.1",
    type: "ws",
    host,
    path: "/",
  });
  return `trojan://${encodeURIComponent(password)}@${address}:${port}?${q.toString()}#${encodeURIComponent(name)}`;
}

function subscriptionResponse(url, userID, trojanPassword) {
  const host = url.host;
  const prefix = (url.searchParams.get("name") || "CF-Forge").slice(0, 24);
  const links = [];
  const addrs = shuffle([...SUB_ADDRESSES]);
  for (let i = 0; i < TLS_PORTS.length; i++) {
    const port = TLS_PORTS[i];
    const a1 = addrs[(i * 2) % addrs.length];
    const a2 = addrs[(i * 2 + 1) % addrs.length];
    links.push(buildVlessLink({ uuid: userID, address: a1, host, port, name: `${prefix}-VL-${String(i + 1).padStart(2, "0")}` }));
    links.push(buildTrojanLink({ password: trojanPassword, address: a2, host, port, name: `${prefix}-TR-${String(i + 1).padStart(2, "0")}` }));
  }
  const body = utf8ToBase64(links.join("\n"));
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "profile-title": utf8ToBase64("CF Forge"),
      "profile-update-interval": "12",
      "access-control-allow-origin": "*",
    },
  });
}

function infoResponse(url, userID) {
  const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CF Forge Proxy</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#07080d;color:#eef1f8;font-family:Tahoma,sans-serif}div{max-width:520px;padding:32px;text-align:center}h1{font-size:20px;margin:0 0 12px}p{color:#9aa3b5;font-size:13px;line-height:2}code{background:#f6821f22;color:#fdad01;padding:3px 10px;border-radius:8px;font-family:monospace;direction:ltr;display:inline-block;margin-top:6px}</style></head>
<body><div><h1>⚡ موتور پروکسی فعال است</h1><p>VLESS + Trojan روی کلادفلر در حال اجراست.<br>لینک اشتراک شما:</p><code>${url.origin}/sub/${userID}</code></div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

// ────────────────────────────────────────────────────────────────────
//  tiny utils
// ────────────────────────────────────────────────────────────────────

function toU8(chunk) {
  if (chunk instanceof Uint8Array) return chunk;
  if (chunk instanceof ArrayBuffer) return new Uint8Array(chunk);
  if (ArrayBuffer.isView(chunk)) return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  return new TextEncoder().encode(String(chunk));
}

function base64ToBytes(b64) {
  if (!b64) return { data: null };
  try {
    const std = b64.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(std);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return { data: out };
  } catch (error) {
    return { error };
  }
}

function safeSend(ws, data) {
  try {
    ws.send(data);
  } catch {}
}

function safeCloseWS(ws) {
  try {
    ws.close(1000, "done");
  } catch {}
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function utf8ToBase64(s) {
  return btoa(unescape(encodeURIComponent(s)));
}
