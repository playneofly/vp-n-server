// ═══════════════════════════════════════════════════════════════════
//  CF Forge — Standalone Worker version of the VLESS edge proxy.
//  Use this ONLY if you prefer a separate Cloudflare Worker instead of
//  the built-in Pages Function. Quick start:
//    npx wrangler deploy worker.js --name cf-forge --compatibility-date 2025-01-01
//  Then set variable UUID in Settings → Variables.
// ═══════════════════════════════════════════════════════════════════

import { connect } from "cloudflare:sockets";

const DEFAULT_UUID = "b3311f0d-72e4-4f9c-9a3d-5c6b7a8f9e0d";

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
    const upgrade = String(request.headers.get("Upgrade") || "").toLowerCase();

    if (upgrade === "websocket") {
      return handleVlessWS(request, userID, String((env && env.PROXYIP) || ""));
    }

    const url = new URL(request.url);
    if (url.pathname === `/sub/${userID}`) {
      return subscriptionResponse(url, userID);
    }
    return infoResponse(url, userID);
  },
};

// ── VLESS over WebSocket ────────────────────────────────────────────

async function handleVlessWS(request, userID, proxyIP) {
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
          const parsed = parseVlessHeader(u8, userID);
          if (parsed.error) throw new Error(parsed.error);

          const socket = await connectRemote(parsed.address, parsed.port, proxyIP);
          remoteWriter = socket.writable.getWriter();

          safeSend(server, new Uint8Array([0, 0]));

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
    for (let i = 0; i < 16; i += 2) {
      hex.push(dv.getUint16(offset + i).toString(16));
    }
    address = hex.join(":");
    addrLen = 16;
  } else {
    return { error: "bad atyp" };
  }

  const raw = u8.subarray(offset + addrLen);
  return { address, port, raw };
}

function bytesToUUID(b) {
  let hex = "";
  for (let i = 0; i < b.length; i++) hex += b[i].toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function buildLink({ uuid, address, host, port, name }) {
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

function subscriptionResponse(url, userID) {
  const host = url.host;
  const prefix = (url.searchParams.get("name") || "CF-Forge").slice(0, 24);
  const links = [];
  let i = 1;
  for (const port of TLS_PORTS) {
    for (const address of shuffle([...SUB_ADDRESSES]).slice(0, 2)) {
      if (links.length >= 12) break;
      links.push(buildLink({ uuid: userID, address, host, port, name: `${prefix}-${String(i).padStart(2, "0")}` }));
      i++;
    }
    if (links.length >= 12) break;
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
<body><div><h1>⚡ موتور پروکسی فعال است</h1><p>این سرور VLESS روی کلادفلر در حال اجراست.<br>لینک اشتراک شما:</p><code>${url.origin}/sub/${userID}</code></div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

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
