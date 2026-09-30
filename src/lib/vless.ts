// ============================================================
//  CF Forge — منطق ساخت کانفیگ VLESS
//  همه‌چیز داخل مرورگر خودِ کاربر ساخته می‌شود؛ هیچ اسکنی در کار نیست.
// ============================================================

export const DEFAULT_UUID = "b3311f0d-72e4-4f9c-9a3d-5c6b7a8f9e0d";
export const DEFAULT_BRAND = "CF.FORGE";
export const MAX_COUNT = 30;

// ورودی‌های ثابت و تمیز کلادفلر — رنج‌های رسمی Anycast کلادفلر.
// آی‌پی فقط «درِ ورودی» است؛ SNI/Host تعیین می‌کند ترافیک به کدام سایت برسد.
// (دقیقاً مثل همان نمونه‌ای که برایت کار کرد)
export const CLEAN_IPS: readonly string[] = [
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

export interface VlessConfig {
  id: string;
  index: number;
  entry: string;
  name: string;
  link: string;
}

export interface ForgeInput {
  domain: string;
  uuid: string;
  count: number;
  brand: string;
}

const TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomBytes(len: number): Uint8Array {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomToken(len = 12): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += TOKEN_CHARS[bytes[i] % TOKEN_CHARS.length];
  return out;
}

export function randomUUID(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]/g, "");
}

export function isValidDomain(value: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(value);
}

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * ساخت N کانفیگ VLESS با فرمت دقیق موردانتظار کلاینت‌ها
 * (همان ساختاری که روی Worker/Live کانفیگ نمونه کار کرد)
 */
export function forgeConfigs(input: ForgeInput): VlessConfig[] {
  const domain = normalizeDomain(input.domain);
  const uuid = input.uuid.trim().toLowerCase();
  const brand = (input.brand || DEFAULT_BRAND).trim() || DEFAULT_BRAND;
  const count = Math.max(1, Math.min(MAX_COUNT, Math.floor(input.count) || 1));
  const pool = shuffle(CLEAN_IPS);

  const out: VlessConfig[] = [];
  for (let i = 0; i < count; i++) {
    const entry = pool[i % pool.length];
    const num = i + 1;
    const path = `/vl/${randomToken(12)}?ed=2560`;
    const params = [
      "encryption=none",
      "security=tls",
      `sni=${domain}`,
      "fp=chrome",
      "alpn=http%2F1.1",
      "type=ws",
      `host=${domain}`,
      `path=${encodeURIComponent(path)}`,
    ].join("&");
    const name = `${brand} NUM.${num}`;
    const link = `vless://${uuid}@${entry}:443?${params}#${encodeURIComponent(name)}`;
    out.push({ id: `${entry}-${num}-${randomToken(6)}`, index: num, entry, name, link });
  }
  return out;
}

// تبدیل ارقام به فارسی برای نمایش
export function toFaDigits(value: string | number): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return String(value).replace(/\d/g, (d) => fa[Number(d)]);
}
