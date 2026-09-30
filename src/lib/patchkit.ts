// ============================================================
// CF Forge IR — Patch sources for github.com/playneofly/vp-n-server
// Three drop-in files + guide. Everything here is plain source text
// that the user copies into their repo (or downloads as a zip).
// ============================================================

// ---------- 1) functions/[[path]].js — upgraded engine (Pages + Worker) ----------
export const WORKER_CODE = `// ============================================================
// CF Forge — IR PATCH v2
// VLESS over WebSocket engine for Cloudflare Pages / Workers
// Changes vs original repo build:
//   + PROXYIP env supports a comma separated relay list (random pick)
//   + FALLBACK_SITE env: camouflage — reverse-proxies a real site
//   + /sub/UUID subscription: multi-port, fp=randomized, spx decoy
//   + works both as Pages Function (onRequest) and Worker (default fetch)
// ============================================================

import { connect } from 'cloudflare:sockets';

const WS_OPEN = 1;
const WS_CLOSING = 2;

const FALLBACK_UUID = 'b3311f0d-72e4-4f9c-9a3d-5c6b7a8f9e0d';
const DEFAULT_PROXY_IPS = [
  'proxyip.sg.fxxk.dedyn.io:443',
  'proxyip.jp.fxxk.dedyn.io:443',
];
const DOH_URL = 'https://cloudflare-dns.com/dns-query';

// entry endpoints used by the auto subscription (clean anycast fronts)
const SUB_ENTRIES = [
  '188.114.96.3', '188.114.96.6', '188.114.96.11', '188.114.97.3',
  '188.114.97.5', '188.114.97.12', '188.114.98.224', '188.114.99.227',
  '104.16.60.8', '104.16.85.20', '104.21.2.3', '104.24.6.186',
  '172.64.80.1', '172.67.74.152', '108.162.192.72', '141.101.90.96',
  'time.is', 'speed.cloudflare.com', 'icook.tw', 'www.speedtest.net',
];
const SUB_PORTS = [443, 8443, 2096];

let cachedSub = null;

export async function onRequest(context) {
  return core(context.request, context.env, context.next.bind(context));
}

export default {
  async fetch(request, env) {
    return core(request, env, null);
  },
};

async function core(request, env, next) {
  try {
    const userID = (env.UUID || FALLBACK_UUID).toLowerCase();
    const proxyList = String(env.PROXYIP || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    const proxyIPs = proxyList.length ? proxyList : DEFAULT_PROXY_IPS;
    const proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
    const fakeSite = String(env.FALLBACK_SITE || '').trim();

    const url = new URL(request.url);
    const upgrade = request.headers.get('Upgrade') || '';

    if (url.pathname === '/sub/' + userID) {
      if (!cachedSub) cachedSub = buildSubscription(url.hostname, userID);
      return new Response(cachedSub, {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'profile-update-interval': '6',
          'cache-control': 'no-store',
          'access-control-allow-origin': '*',
        },
      });
    }

    if (upgrade.toLowerCase() !== 'websocket') {
      if (fakeSite) {
        const target = new URL('https://' + fakeSite + url.pathname + url.search);
        return fetch(new Request(target, request), { redirect: 'manual' });
      }
      if (next) {
        try {
          return await next();
        } catch (e) {
          // fall through to info page
        }
      }
      return new Response(infoPage(url, userID), {
        status: 200,
        headers: { 'content-type': 'text/html;charset=utf-8' },
      });
    }

    return vlessOverWS(request, userID, proxyIP);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    return new Response(msg, { status: 500 });
  }
}

async function vlessOverWS(request, userID, proxyIP) {
  const pair = new WebSocketPair();
  const values = Object.values(pair);
  const client = values[0];
  const webSocket = values[1];
  webSocket.accept();

  const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';
  const readableWS = makeReadableWebSocketStream(webSocket, earlyDataHeader);
  const remoteWrapper = { value: null };
  let udpWrite = null;

  readableWS
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          if (udpWrite) {
            return udpWrite(chunk);
          }
          const parsed = processVlessHeader(chunk, userID);
          if (parsed.hasError) {
            throw new Error(parsed.message);
          }
          const vlessResponseHeader = new Uint8Array([parsed.vlessVersion[0], 0]);
          const rawClientData = chunk.slice(parsed.rawDataIndex);

          if (parsed.isUDP) {
            if (parsed.portRemote === 53) {
              udpWrite = makeUdpWriter(webSocket, vlessResponseHeader);
              return udpWrite(rawClientData);
            }
            safeCloseWebSocket(webSocket);
            return;
          }

          handleTCPOutBound(
            remoteWrapper,
            parsed.addressRemote,
            parsed.portRemote,
            rawClientData,
            webSocket,
            vlessResponseHeader,
            proxyIP
          );
        },
        close() {},
        abort() {},
      })
    )
    .catch(function () {});

  return new Response(null, { status: 101, webSocket: client });
}

function processVlessHeader(vlessBuffer, userID) {
  if (vlessBuffer.byteLength < 24) {
    return { hasError: true, message: 'invalid data' };
  }
  const version = new Uint8Array(vlessBuffer.slice(0, 1));
  const uuidBytes = new Uint8Array(vlessBuffer.slice(1, 17));
  if (bytesToUuid(uuidBytes) !== userID) {
    return { hasError: true, message: 'invalid user' };
  }
  const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];

  const commandIdx = 18 + optLength;
  const command = new Uint8Array(vlessBuffer.slice(commandIdx, commandIdx + 1))[0];
  let isUDP = false;
  if (command === 2) {
    isUDP = true;
  } else if (command !== 1) {
    return { hasError: true, message: 'unsupported command: ' + command };
  }

  const portIndex = commandIdx + 1;
  const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);

  let addressIndex = portIndex + 2;
  const addressType = new Uint8Array(vlessBuffer.slice(addressIndex, addressIndex + 1))[0];
  addressIndex += 1;

  let addressLength = 0;
  let addressValue = '';
  switch (addressType) {
    case 1: {
      addressLength = 4;
      addressValue = new Uint8Array(vlessBuffer.slice(addressIndex, addressIndex + addressLength)).join('.');
      break;
    }
    case 2: {
      addressLength = new Uint8Array(vlessBuffer.slice(addressIndex, addressIndex + 1))[0];
      addressIndex += 1;
      addressValue = new TextDecoder().decode(
        vlessBuffer.slice(addressIndex, addressIndex + addressLength)
      );
      break;
    }
    case 3: {
      addressLength = 16;
      const dv = new DataView(vlessBuffer.slice(addressIndex, addressIndex + addressLength));
      const parts = [];
      for (let i = 0; i < 8; i++) parts.push(dv.getUint16(i * 2).toString(16));
      addressValue = parts.join(':');
      break;
    }
    default:
      return { hasError: true, message: 'invalid addressType: ' + addressType };
  }
  if (!addressValue) {
    return { hasError: true, message: 'empty destination' };
  }
  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: addressIndex + addressLength,
    vlessVersion: version,
    isUDP: isUDP,
  };
}

async function handleTCPOutBound(
  remoteWrapper,
  addressRemote,
  portRemote,
  rawClientData,
  webSocket,
  vlessResponseHeader,
  proxyIP
) {
  async function connectAndWrite(address, port) {
    const tcpSocket = connect({ hostname: address, port: port });
    remoteWrapper.value = tcpSocket;
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpSocket;
  }

  async function relayViaProxyIP() {
    const pair = proxyIP.split(':');
    const host = pair[0];
    const port = pair.length > 1 ? Number(pair[1]) : portRemote;
    const tcpSocket = await connectAndWrite(host, port);
    remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, null);
  }

  const tcpSocket = await connectAndWrite(addressRemote, portRemote);
  remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, relayViaProxyIP);
}

async function remoteSocketToWS(remoteSocket, webSocket, vlessResponseHeader, retryFn) {
  let vlessHeader = vlessResponseHeader;
  let hasIncomingData = false;
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          hasIncomingData = true;
          if (webSocket.readyState !== WS_OPEN) {
            throw new Error('webSocket not open');
          }
          if (vlessHeader) {
            webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
            vlessHeader = null;
          } else {
            webSocket.send(chunk);
          }
        },
        close() {
          safeCloseWebSocket(webSocket);
        },
        abort() {},
      })
    )
    .catch(function () {
      safeCloseWebSocket(webSocket);
    });
  if (hasIncomingData === false && retryFn) {
    retryFn();
  }
}

function makeReadableWebSocketStream(webSocket, earlyDataHeader) {
  let cancelled = false;
  return new ReadableStream({
    start(controller) {
      webSocket.addEventListener('message', function (event) {
        if (cancelled) return;
        controller.enqueue(event.data);
      });
      webSocket.addEventListener('close', function () {
        safeCloseWebSocket(webSocket);
        if (cancelled) return;
        controller.close();
      });
      webSocket.addEventListener('error', function (err) {
        controller.error(err);
      });
      const decoded = base64ToArrayBuffer(earlyDataHeader);
      if (decoded.error) {
        controller.error(decoded.error);
      } else if (decoded.earlyData) {
        controller.enqueue(decoded.earlyData);
      }
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      safeCloseWebSocket(webSocket);
    },
  });
}

function makeUdpWriter(webSocket, vlessResponseHeader) {
  let headerSent = false;
  const stream = new TransformStream({
    transform(chunk, controller) {
      for (let index = 0; index < chunk.byteLength; ) {
        const lenBuf = chunk.slice(index, index + 2);
        const len = new DataView(lenBuf).getUint16(0);
        controller.enqueue(new Uint8Array(chunk.slice(index + 2, index + 2 + len)));
        index = index + 2 + len;
      }
    },
  });
  stream.readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          const resp = await fetch(DOH_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/dns-message' },
            body: chunk,
          });
          const dnsResult = await resp.arrayBuffer();
          const size = dnsResult.byteLength;
          const sizeBuf = new Uint8Array([(size >> 8) & 0xff, size & 0xff]);
          if (webSocket.readyState === WS_OPEN) {
            if (headerSent) {
              webSocket.send(await new Blob([sizeBuf, dnsResult]).arrayBuffer());
            } else {
              webSocket.send(
                await new Blob([vlessResponseHeader, sizeBuf, dnsResult]).arrayBuffer()
              );
              headerSent = true;
            }
          }
        },
      })
    )
    .catch(function () {});
  const writer = stream.writable.getWriter();
  return function (chunk) {
    return writer.write(chunk);
  };
}

function bytesToUuid(arr) {
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += arr[i].toString(16).padStart(2, '0');
  }
  return (
    hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' +
    hex.slice(16, 20) + '-' + hex.slice(20)
  );
}

function base64ToArrayBuffer(base64Str) {
  if (!base64Str) return { error: null, earlyData: null };
  try {
    const norm = base64Str.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(norm);
    const buf = Uint8Array.from(decoded, function (c) {
      return c.charCodeAt(0);
    });
    return { error: null, earlyData: buf.buffer };
  } catch (error) {
    return { error: error, earlyData: null };
  }
}

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_OPEN || socket.readyState === WS_CLOSING) {
      socket.close();
    }
  } catch (e) {}
}

// ---------- subscription (multi-port, randomized fingerprint) ----------

function buildVlessLink(domain, uuid, entry, port, index) {
  const n = index + 1;
  const name = 'IRFORGE-' + (n < 10 ? '0' : '') + n;
  return (
    'vless://' + uuid + '@' + entry + ':' + port +
    '?encryption=none&security=tls&sni=' + domain +
    '&fp=randomized&spx=%2F&type=ws&host=' + domain +
    '&path=%2F#' + name
  );
}

function buildSubscription(domain, uuid) {
  const links = [];
  let idx = 0;
  for (let e = 0; e < SUB_ENTRIES.length; e++) {
    const entry = SUB_ENTRIES[e];
    for (let p = 0; p < SUB_PORTS.length; p++) {
      links.push(buildVlessLink(domain, uuid, entry, SUB_PORTS[p], idx++));
    }
  }
  return btoa(links.join('\\n'));
}

// ---------- info page (shown when nothing else matches) ----------

function infoPage(url, userID) {
  return (
    '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>CF Forge — Engine OK</title><style>' +
    'body{background:#070c09;color:#e9f7ef;font-family:tahoma,' +
    'segoe ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}' +
    '.c{max-width:640px;padding:32px;border:1px solid rgba(61,250,168,.25);' +
    'border-radius:16px;background:#0a120e;line-height:2}' +
    'h1{color:#3dfaa8;font-size:20px}code{direction:ltr;display:inline-block;' +
    'background:#050c08;border:1px solid rgba(61,250,168,.2);padding:2px 10px;' +
    'border-radius:8px;font-family:monospace;color:#7fffcc}' +
    '</style></head><body><div class="c">' +
    '<h1>موتور پروکسی (نسخه‌ی ایران) فعال است</h1>' +
    '<p>لینک اشتراک چندپورتی شما:</p>' +
    '<p><code>' + url.origin + '/sub/' + userID + '</code></p>' +
    '<p style="font-size:13px;color:#93b3a4">فراموش نشود: فرگمنت را سمت کلاینت ' +
    '(v2rayN / Hiddify / NekoBox) فعال کنید.</p>' +
    '</div></body></html>'
  );
}
`;

// ---------- 2) src/lib/cleanIPs.ts — drop-in replacement ----------
export const CLEANIPS_CODE = `// Clean Cloudflare address database — IR patch v2.
// Any IP inside Cloudflare anycast ranges can front a Pages/Worker site,
// because routing is decided by the TLS SNI / Host header of the request.
// Ranges below are Cloudflare public anycast ranges (cloudflare.com/ips).

export const CLEAN_IPS: string[] = [
  // 188.114.96.0/20 — the classic clean range for Iranian ISPs
  "188.114.96.2", "188.114.96.3", "188.114.96.6", "188.114.96.7",
  "188.114.96.9", "188.114.96.11", "188.114.96.16", "188.114.96.21",
  "188.114.96.33", "188.114.96.60", "188.114.96.110",
  "188.114.97.2", "188.114.97.3", "188.114.97.5", "188.114.97.7",
  "188.114.97.9", "188.114.97.12", "188.114.97.20", "188.114.97.44",
  "188.114.97.66", "188.114.98.220", "188.114.98.224", "188.114.98.229",
  "188.114.98.232", "188.114.99.222", "188.114.99.224", "188.114.99.227",
  "188.114.99.230",
  // 104.16.0.0/13
  "104.16.0.4", "104.16.5.5", "104.16.60.8", "104.16.85.20",
  "104.16.91.215", "104.16.132.229", "104.16.160.12", "104.16.200.99",
  "104.17.147.22", "104.18.6.5", "104.18.40.150", "104.18.101.200",
  "104.19.32.124", "104.20.4.66", "104.21.2.3", "104.21.38.90",
  "104.22.5.240", "104.24.6.186", "104.25.7.31", "104.26.0.59",
  "104.26.12.101", "104.27.101.222",
  // 172.64.0.0/13
  "172.64.32.121", "172.64.41.194", "172.64.80.1", "172.64.144.237",
  "172.64.167.5", "172.64.198.29", "172.65.32.16", "172.66.0.227",
  "172.66.160.3", "172.67.74.152",
  // 162.158.0.0/15
  "162.158.2.190", "162.158.15.67", "162.158.110.176", "162.159.1.45",
  "162.159.128.233", "162.159.200.10",
  // 141.101.64.0/18
  "141.101.64.200", "141.101.68.250", "141.101.90.96", "141.101.113.184",
  "141.101.122.30",
  // 108.162.192.0/18
  "108.162.192.72", "108.162.196.118", "108.162.204.245", "108.162.235.10",
  // 173.245.48.0/20 + 198.41.128.0/17 + باقی رنج‌ها
  "173.245.49.66", "173.245.58.171", "173.245.60.194",
  "198.41.128.78", "198.41.177.168", "198.41.222.106",
  "131.0.72.44", "131.0.74.225",
  "190.93.240.143", "190.93.245.93", "190.93.247.4",
  "197.234.240.165", "197.234.241.39",
];

// Cloudflare-fronted hostnames with VALID TLS certs — probeable from the
// browser and often smoother than raw IPs on Iranian ISPs.
export const CLEAN_DOMAINS: string[] = [
  "cloudflare.com",
  "www.cloudflare.com",
  "speed.cloudflare.com",
  "community.cloudflare.com",
  "time.is",
  "www.speedtest.net",
  "icook.tw",
  "ts.hpc.tw",
  "medium.com",
  "pastebin.com",
  "stackoverflow.com",
  "npmjs.com",
  "claude.ai",
  "notion.so",
  "figma.com",
  "gitlab.com",
  "canva.com",
  "codepen.io",
  "cdn.jsdelivr.net",
  "cdnjs.cloudflare.com",
  "unpkg.com",
  "registry.npmjs.org",
  "poe.com",
  "character.ai",
  "perplexity.ai",
  "mediafire.com",
  "fiverr.com",
  "upwork.com",
  "udemy.com",
  "imgur.com",
];

// Cert-valid anycast IPs — browsers can truly measure these.
export const PINGABLE_IPS: string[] = ["1.1.1.1", "1.0.0.1"];

// NEW: TLS ports accepted by Cloudflare for proxied traffic.
// Some ISPs throttle/inspect 443 — alternates often pass untouched.
export const TLS_PORTS: number[] = [443, 8443, 2096, 2053, 2083, 2087];

export type IpMode = "mix" | "ip" | "domain" | "custom";

export function buildPool(mode: IpMode, custom: string): string[] {
  const customList = custom
    .split(/[\\s,،;\\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  switch (mode) {
    case "ip":
      return CLEAN_IPS;
    case "domain":
      return CLEAN_DOMAINS;
    case "custom":
      return customList;
    case "mix":
    default:
      return [...CLEAN_IPS, ...CLEAN_DOMAINS, ...customList];
  }
}
`;

// ---------- 3) patch guide (fa) ----------
export const GUIDE_MD = `# پچ «سازگار با اینترنت ایران» برای vp-n-server

این کیت چهار مشکل نسخه فعلی را حل می‌کند:
۱) اتصال فقط با آی‌پی آمریکا → ورودی‌های تمیز بیشتر + اشتراک چندپورتی
۲) شکسته‌شدن TLS توسط DPI ایران → فرگمنت سمت کلاینت
۳) نبود مسیر فرار → رله PROXYIP با لیست جدا شده با کاما
۴) دامنه لو رفته → FALLBACK_SITE سایت پوششی واقعی نشان می‌دهد

## مرحله ۱ — جایگزینی فایل‌ها
- functions/[[path]].js را با نسخه جدید این کیت جایگزین کن.
- src/lib/cleanIPs.ts را با نسخه جدید جایگزین کن (نام export ها حفظ شده است).
- (اختیاری) اگر ورکر مستقل داری، worker.js را هم جایگزین کن؛
  همین یک فایل هم به شکل Pages Function و هم Worker کار می‌کند.

## مرحله ۲ — متغیرهای محیطی در Cloudflare Pages
Settings → Environment variables → Production:

| نام           | مقدار                                                 |
|-------------- |-------------------------------------------------------|
| UUID          | همان UUID فعلی‌ات (بدون تغییر)                          |
| PROXYIP       | مثلا: proxyip.sg.fxxk.dedyn.io:443,104.16.60.8:443     |
| FALLBACK_SITE | دامنه‌ای معمولی مثل www.speedtest.net (اختیاری)          |

بعد از ذخیره: Deployments → Retry deployment

## مرحله ۳ — لینک اشتراک جدید
https://YOUR-PROJECT.pages.dev/sub/YOUR-UUID
حالا ساب ۶۰ کانفیگ می‌دهد (۲۰ ورودی × ۳ پورت: 443, 8443, 2096)
با fp=randomized و spx=%2F تا الگوی ثابت ساخته نشود.

## مرحله ۴ — فرگمنت در کلاینت (مهم‌ترین قدم)
- v2rayN 6.40+: Setting → Fragment → {"packets":"tlshello","length":"50-100","interval":"10-30"}
- Hiddify App: Config Options → Fragment → mode tlshello
- NekoBox: sing-box outbound → tls.fragment.enabled = true
- v2rayNG: custom config و بلوک fragment را داخل streamSettings بگذار

بدون این قدم، روی بعضی اپراتورها SNI شناسایی و اتصال ریست می‌شود —
حتی با بهترین آی‌پی تمیز.

## مرحله ۵ (اختیاری ولی مفید) — استخر کانفیگ سایت
داخل src/lib/vless.ts یک آرایه‌ی جداگانه به نام CLEAN_IPS وجود دارد که
سایت برای ساخت کانفیگ از آن استفاده می‌کند. آن را با لیست جدیدِ داخل
src/lib/cleanIPs.ts این کیت همگام کن (کپی همان مقادیر) تا کانفیگ‌های
سایت هم از ورودی‌های به‌روز استفاده کنند.
برای لینک‌ها هم اگر جایی رشته‌ی vless ساخته می‌شود، این دو پارامتر را به
کوئری اضافه کن تا fingerprint ثابت نماند:
  fp=randomized  و  spx=%2F

## چرا به جای صفحه‌ی سایت از /sub استفاده کنیم؟
لینک‌های صفحه تک‌پورتی (443) هستند؛ اشتراک /sub داخل موتور جدید
ورودی × پورت را ترکیب می‌کند و از همه لحاظ به‌روزتر است.

## نکات
- دامنه‌ی شخصی (Custom domain) پشت کلادفلر بزن تا pages.dev کمتر لو برود.
- اگر UDP لازم داری (کال صوتی)، پورت 53 فقط از DNS-over-HTTPS عبور داده می‌شود.
- پارامتر ed=1280 را به لینک اضافه نکن؛ این موتور early-data را فقط وقتی
  می‌خواند که کلاینت ارسال کرده باشد.
`;

export const PATCH_FILES = [
  {
    path: "functions/[[path]].js",
    title: "موتور پروکسی — نسخه ایران v2",
    desc: "جایگزین اصلی: PROXYIP چندتایی + FALLBACK_SITE + ساب چندپورتی. هم به‌عنوان Pages Function و هم Worker مستقل کار می‌کند.",
    code: WORKER_CODE,
  },
  {
    path: "src/lib/cleanIPs.ts",
    title: "پایگاه آی‌پی تمیز — توسعه‌یافته",
    desc: "drop-in کامل؛ نام export ها حفظ شده، رنج 188 گسترده‌تر، دامنه‌های بیشتر و پورت‌های TLS جدید اضافه شده‌اند.",
    code: CLEANIPS_CODE,
  },
];

export async function downloadPatchZip(): Promise<boolean> {
  try {
    const mod = await import("jszip");
    const JSZip = mod.default;
    const zip = new JSZip();
    zip.file("functions/[[path]].js", WORKER_CODE);
    zip.file("src/lib/cleanIPs.ts", CLEANIPS_CODE);
    zip.file("worker/worker.js", WORKER_CODE);
    zip.file("PATCH-GUIDE-fa.md", GUIDE_MD);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vp-n-server-iran-patch.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch {
    return false;
  }
}
