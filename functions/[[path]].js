// ============================================================
//  CF Forge — VLESS WebSocket Engine (Cloudflare Pages Functions)
//  مسیر فایل: functions/[[path]].js  ← دقیقاً همین نام، در ریشه‌ی مخزن
//
//  این فایل «سرور واقعی» VLESS است. لینک vless:// فقط یک آدرس است؛
//  چیزی که باعث می‌شود کانفیگ واقعاً وصل شود، همین موتور است که
//  کلادفلر به‌صورت خودکار روی Pages دپلوی می‌کند.
//
//  نکته: پوشه‌ی functions باید در «ریشه‌ی مخزن» باشد نه داخل dist.
// ============================================================

import { connect } from "cloudflare:sockets";

// اگر متغیر محیطی UUID ست نشود، این کلید استفاده می‌شود.
// بهترین کار: در Pages > Settings > Environment Variables مقدار UUID
// خودت را بگذار و بعد Retry deployment بزن.
const DEFAULT_UUID = "b3311f0d-72e4-4f9c-9a3d-5c6b7a8f9e0d";

// --- ورودی‌های ثابت و تمیز کلادفلر (هیچ اسکنی انجام نمی‌شود) ---
// همه در رنج‌های رسمی Anycast کلادفلرند؛ SNI/Host مسیر نهایی را تعیین می‌کند.
const CLEAN_IPS = [
  "172.67.136.197",
  "172.64.32.22",
  "172.67.73.163",
  "172.64.155.209",
  "172.67.182.145",
  "172.64.198.43",
  "104.16.210.110",
  "104.17.148.22",
  "104.18.32.47",
  "104.19.58.91",
  "104.20.26.231",
  "104.21.41.186",
  "104.22.5.140",
  "104.24.101.62",
  "104.25.152.30",
  "104.26.13.173",
  "104.27.200.88",
  "188.114.96.3",
  "188.114.97.3",
  "162.159.135.42",
  "162.159.44.51",
  "198.41.191.227",
  "190.93.244.18",
  "141.101.113.140",
  "108.162.196.77",
  "173.245.52.90",
  "103.21.244.15",
  "103.22.201.133",
  "103.31.5.77",
  "131.0.72.55",
  "www.speedtest.net",
  "www.cloudflare.com",
];

const SUB_BRAND = "CF.FORGE";
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;

// ------------------------------------------------------------
//  ورودی اصلی Pages Function
// ------------------------------------------------------------
export async function onRequest(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);

    // لینک اشتراک: /sub/YOUR-UUID
    if (url.pathname.startsWith("/sub/")) {
      return subscriptionResponse(url, env);
    }

    const upgradeHeader = (request.headers.get("Upgrade") || "").toLowerCase();
    if (upgradeHeader === "websocket") {
      return await handleVlessWebSocket(request, env);
    }

    // --- درخواست‌های عادی (مرورگر) ---
    if (url.pathname.startsWith("/vl/")) {
      // کسی مسیر پروکسی را دستی در مرورگر باز کرده → هدایت به سایت بی‌خطر (استلث)
      return Response.redirect("https://www.speedtest.net", 302);
    }

    // بقیه‌ی مسیرها (از جمله صفحه‌ی اصلی) → سایت اصلی از فایل‌های استاتیک
    try {
      if (env.ASSETS) {
        const assetsResponse = await env.ASSETS.fetch(request);
        if (assetsResponse && assetsResponse.status !== 404) {
          return assetsResponse;
        }
      }
    } catch (e) {}

    return fallbackPage();
  } catch (err) {
    return new Response(String((err && err.message) || err), { status: 500 });
  }
}

// ------------------------------------------------------------
//  ساخت لینک اشتراک (Base64 لیست کانفیگ‌ها)
// ------------------------------------------------------------
function subscriptionResponse(url, env) {
  const serverUUID = normalizeUUID(env.UUID || DEFAULT_UUID);
  const requested = (url.pathname.replace(/^\/sub\/?/, "").split("/")[0] || "").toLowerCase();
  if (requested !== serverUUID) {
    return new Response("Not Found", { status: 404 });
  }
  const host = url.host;
  const links = CLEAN_IPS.map((ip, i) => buildVlessLink(serverUUID, ip, host, i + 1)).join("\n");
  return new Response(btoa(links), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "profile-update-interval": "12",
    },
  });
}

function buildVlessLink(uuid, entry, host, num) {
  const path = encodeURIComponent("/vl/forge?ed=2560");
  const params =
    "encryption=none&security=tls&sni=" +
    host +
    "&fp=chrome&alpn=http%2F1.1&type=ws&host=" +
    host +
    "&path=" +
    path;
  const name = encodeURIComponent(SUB_BRAND + " NUM." + num);
  return "vless://" + uuid + "@" + entry + ":443?" + params + "#" + name;
}

// ------------------------------------------------------------
//  هندلر VLESS روی WebSocket
// ------------------------------------------------------------
async function handleVlessWebSocket(request, env) {
  const serverUUID = normalizeUUID(env.UUID || DEFAULT_UUID);
  const proxyIP = (env.PROXYIP || "").trim();

  const pair = new WebSocketPair();
  const [clientWS, serverWS] = Object.values(pair);
  serverWS.accept();

  // Early-Data (ed=2560): اولین پکت داخل هدر handshake می‌آید
  const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
  const readableStream = makeReadableWebSocketStream(serverWS, earlyDataHeader);

  const remoteTransport = { value: null };
  let udpStreamWrite = null;
  let isDns = false;

  readableStream
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          if (isDns) {
            return udpStreamWrite && udpStreamWrite(chunk);
          }
          if (remoteTransport.value) {
            const writer = remoteTransport.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          const parsed = parseVlessHeader(chunk, serverUUID);
          if (parsed.hasError) {
            throw new Error(parsed.message);
          }

          // هدر پاسخ VLESS: [version, 0]
          const responseHeader = new Uint8Array([parsed.vlessVersion[0], 0]);
          const rawClientData = chunk.slice(parsed.rawDataIndex);

          if (parsed.isUDP) {
            if (parsed.portRemote !== 53) {
              throw new Error("UDP proxy only supports DNS on port 53");
            }
            isDns = true;
            udpStreamWrite = handleUdpOutBound(serverWS, responseHeader);
            return udpStreamWrite && udpStreamWrite(rawClientData);
          }

          handleTCPOutBound(
            remoteTransport,
            parsed.addressRemote,
            parsed.portRemote,
            rawClientData,
            serverWS,
            responseHeader,
            proxyIP
          );
        },
        close() {
          closeSocket(remoteTransport.value);
          safeCloseWebSocket(serverWS);
        },
        abort() {
          closeSocket(remoteTransport.value);
          safeCloseWebSocket(serverWS);
        },
      })
    )
    .catch(() => {
      closeSocket(remoteTransport.value);
      safeCloseWebSocket(serverWS);
    });

  return new Response(null, { status: 101, webSocket: clientWS });
}

// ------------------------------------------------------------
//  تبدیل WebSocket به ReadableStream (+ پشتیبانی Early-Data)
// ------------------------------------------------------------
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader) {
  let streamCancelled = false;
  return new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener("message", (event) => {
        if (!streamCancelled) controller.enqueue(event.data);
      });
      webSocketServer.addEventListener("close", () => {
        if (!streamCancelled) {
          try {
            controller.close();
          } catch (e) {}
        }
      });
      webSocketServer.addEventListener("error", (err) => controller.error(err));

      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) controller.error(error);
      else if (earlyData) controller.enqueue(earlyData);
    },
    cancel(reason) {
      streamCancelled = true;
      if (reason) console.log("stream cancelled:", reason);
      safeCloseWebSocket(webSocketServer);
    },
  });
}

function base64ToArrayBuffer(base64Str) {
  if (!base64Str) return { earlyData: null, error: null };
  try {
    const normalized = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { earlyData: bytes.buffer, error: null };
  } catch (error) {
    return { earlyData: null, error };
  }
}

// ------------------------------------------------------------
//  پارس هدر پروتکل VLESS
// ------------------------------------------------------------
function parseVlessHeader(vlessBuffer, serverUUID) {
  if (!vlessBuffer || vlessBuffer.byteLength < 24) {
    return { hasError: true, message: "invalid header: too short" };
  }
  const view = new DataView(vlessBuffer);
  const version = new Uint8Array(vlessBuffer.slice(0, 1));
  const uuidBytes = new Uint8Array(vlessBuffer.slice(1, 17));

  if (stringifyUUID(uuidBytes) !== serverUUID) {
    return { hasError: true, message: "invalid user: uuid mismatch" };
  }

  const optLength = view.getUint8(17);
  const commandIndex = 18 + optLength;
  if (commandIndex + 4 > vlessBuffer.byteLength) {
    return { hasError: true, message: "invalid header: truncated" };
  }
  const command = view.getUint8(commandIndex);

  let isUDP = false;
  if (command === 1) {
    isUDP = false; // TCP
  } else if (command === 2) {
    isUDP = true; // UDP
  } else {
    return { hasError: true, message: "unsupported command: " + command };
  }

  const portRemote = view.getUint16(commandIndex + 1);
  const addressType = view.getUint8(commandIndex + 3);
  let addressIndex = commandIndex + 4;
  let addressRemote = "";

  if (addressType === 1) {
    // IPv4
    if (addressIndex + 4 > vlessBuffer.byteLength) return { hasError: true, message: "bad ipv4" };
    addressRemote = new Uint8Array(vlessBuffer.slice(addressIndex, addressIndex + 4)).join(".");
    addressIndex += 4;
  } else if (addressType === 2) {
    // دامنه
    const len = view.getUint8(addressIndex);
    addressIndex += 1;
    if (addressIndex + len > vlessBuffer.byteLength) return { hasError: true, message: "bad domain" };
    addressRemote = new TextDecoder().decode(vlessBuffer.slice(addressIndex, addressIndex + len));
    addressIndex += len;
  } else if (addressType === 3) {
    // IPv6
    if (addressIndex + 16 > vlessBuffer.byteLength) return { hasError: true, message: "bad ipv6" };
    const dv = new DataView(vlessBuffer.slice(addressIndex, addressIndex + 16));
    const groups = [];
    for (let i = 0; i < 8; i++) groups.push(dv.getUint16(i * 2).toString(16));
    addressRemote = groups.join(":");
    addressIndex += 16;
  } else {
    return { hasError: true, message: "invalid addressType: " + addressType };
  }

  return {
    hasError: false,
    addressRemote,
    portRemote,
    rawDataIndex: addressIndex,
    vlessVersion: version,
    isUDP,
  };
}

// ------------------------------------------------------------
//  پل‌زدن TCP به مقصد (با پشتیبان PROXYIP برای مقاومت در برابر قطعی)
// ------------------------------------------------------------
async function handleTCPOutBound(
  remoteTransport,
  addressRemote,
  portRemote,
  rawClientData,
  webSocket,
  responseHeader,
  proxyIP
) {
  async function connectAndWrite(address, port) {
    const tcpSocket = connect({ hostname: address, port: port });
    remoteTransport.value = tcpSocket;
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpSocket;
  }

  async function retryWithProxyIP() {
    if (!proxyIP) return safeCloseWebSocket(webSocket);
    const colonIndex = proxyIP.lastIndexOf(":");
    const host = colonIndex > 0 ? proxyIP.slice(0, colonIndex) : proxyIP;
    const port = colonIndex > 0 ? Number(proxyIP.slice(colonIndex + 1)) || 443 : 443;
    try {
      const tcpSocket = await connectAndWrite(host, port);
      await remoteSocketToWS(tcpSocket, webSocket, null, null);
    } catch (e) {
      safeCloseWebSocket(webSocket);
    }
  }

  try {
    const tcpSocket = await connectAndWrite(addressRemote, portRemote);
    await remoteSocketToWS(tcpSocket, webSocket, responseHeader, proxyIP ? retryWithProxyIP : null);
  } catch (e) {
    if (proxyIP) await retryWithProxyIP();
    else safeCloseWebSocket(webSocket);
  }
}

// جریان سوکت ریموت → WebSocket کلاینت (هدر VLESS فقط روی اولین پکت)
async function remoteSocketToWS(remoteSocket, webSocket, responseHeader, retry) {
  let hasIncomingData = false;
  let headerSent = responseHeader === null;
  try {
    await remoteSocket.readable.pipeTo(
      new WritableStream({
        write(chunk) {
          hasIncomingData = true;
          if (!headerSent) {
            const merged = new Uint8Array(responseHeader.byteLength + chunk.byteLength);
            merged.set(responseHeader, 0);
            merged.set(chunk, responseHeader.byteLength);
            chunk = merged;
            headerSent = true;
          }
          if (webSocket.readyState === WS_READY_STATE_OPEN) {
            webSocket.send(chunk);
          }
        },
        close() {},
        abort() {},
      })
    );
  } catch (e) {
    // اتصال ریموت قطع شد
  }
  // اگر مقصد مستقیم هیچ دیتایی نداد، از مسیر پشتیبان تلاش دوباره
  if (!hasIncomingData && retry) {
    await retry();
    return;
  }
  safeCloseWebSocket(webSocket);
}

// ------------------------------------------------------------
//  UDP (فقط DNS پورت 53 از طریق DoH)
// ------------------------------------------------------------
function handleUdpOutBound(webSocket, responseHeader) {
  let vlessHeaderSent = false;
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const view = new DataView(chunk);
      for (let index = 0; index < chunk.byteLength; ) {
        const length = view.getUint16(index);
        const udpData = chunk.slice(index + 2, index + 2 + length);
        index += 2 + length;
        controller.enqueue(udpData);
      }
    },
  });

  transformStream.readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          try {
            const resp = await fetch("https://dns.google/dns-query", {
              method: "POST",
              headers: { "content-type": "application/dns-message" },
              body: chunk,
            });
            const dnsResult = await resp.arrayBuffer();
            const udpSize = dnsResult.byteLength;
            const sizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);
            let out;
            if (vlessHeaderSent) {
              out = concatBytes(sizeBuffer, new Uint8Array(dnsResult));
            } else {
              out = concatBytes(responseHeader, sizeBuffer, new Uint8Array(dnsResult));
              vlessHeaderSent = true;
            }
            if (webSocket.readyState === WS_READY_STATE_OPEN) {
              webSocket.send(out);
            }
          } catch (e) {}
        },
      })
    )
    .catch(() => {});

  const writer = transformStream.writable.getWriter();
  return async function (chunk) {
    try {
      await writer.write(chunk);
    } catch (e) {}
  };
}

function concatBytes() {
  const arrays = Array.from(arguments);
  const total = arrays.reduce((sum, a) => sum + a.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(new Uint8Array(a.buffer || a, a.byteOffset || 0, a.byteLength), offset);
    offset += a.byteLength;
  }
  return out;
}

// ------------------------------------------------------------
//  ابزارها
// ------------------------------------------------------------
const byteToHex = [];
for (let i = 0; i < 256; i++) byteToHex[i] = (i + 0x100).toString(16).slice(1);

function stringifyUUID(arr) {
  return (
    byteToHex[arr[0]] + byteToHex[arr[1]] + byteToHex[arr[2]] + byteToHex[arr[3]] + "-" +
    byteToHex[arr[4]] + byteToHex[arr[5]] + "-" +
    byteToHex[arr[6]] + byteToHex[arr[7]] + "-" +
    byteToHex[arr[8]] + byteToHex[arr[9]] + "-" +
    byteToHex[arr[10]] + byteToHex[arr[11]] + byteToHex[arr[12]] + byteToHex[arr[13]] +
    byteToHex[arr[14]] + byteToHex[arr[15]]
  ).toLowerCase();
}

function normalizeUUID(uuid) {
  return String(uuid || "").trim().toLowerCase();
}

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (e) {}
}

function closeSocket(socket) {
  if (!socket) return;
  try {
    socket.close();
  } catch (e) {}
}

// اگر فایل‌های استاتیک در دسترس نبودند، یک صفحه‌ی راهنمای سبک نشان بده
function fallbackPage() {
  const html =
    '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>CF Forge</title>' +
    "<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#050b0a;color:#e4e4e7;font-family:Tahoma,sans-serif}" +
    ".card{max-width:520px;margin:20px;padding:32px;border:1px solid rgba(52,211,153,.25);border-radius:18px;background:rgba(255,255,255,.03)}" +
    "h1{color:#34d399;font-size:21px;margin-top:0}code{direction:ltr;display:inline-block;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);color:#6ee7b7;border-radius:8px;padding:2px 8px;font-size:12px}" +
    "p,li{line-height:2.1;font-size:14px;color:#a1a1aa}ol{padding-right:18px}</style></head><body>" +
    '<div class="card"><h1>CF Forge — موتور VLESS فعال است</h1>' +
    "<p>سرور پروکسی درست کار می‌کند، اما فایل‌های استاتیک سایت پیدا نشدند. برای نمایش رابط کاربری:</p>" +
    "<ol><li>در داشبورد Pages به Settings برو</li><li>Build command: <code>npm run build</code></li>" +
    "<li>Output directory: <code>dist</code></li><li>از تب Deployments گزینه‌ی Retry deployment را بزن</li></ol>" +
    "<p>کانفیگ‌ها و لینک اشتراک <code>/sub/YOUR-UUID</code> همین حالا هم فعال‌اند.</p></div></body></html>";
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
