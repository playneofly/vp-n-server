// Core VLESS link engine.

export const DEFAULT_UUID = "b3311f0d-72e4-4f9c-9a3d-5c6b7a8f9e0d";

// Cloudflare supports these ports for proxied (orange-cloud) hostnames.
export const TLS_PORTS = [443, 8443, 2053, 2083, 2087, 2096];
export const PLAIN_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];

export interface GenConfig {
  id: string;
  name: string;
  uri: string;
  address: string;
  port: number;
  tls: boolean;
}

export interface GenOptions {
  uuid: string;
  domain: string;
  tlsPorts: number[];
  plainPorts: number[];
  path: string; // without leading slash, may be empty
  prefix: string;
  count: number;
  pool: string[]; // clean addresses to place in the "address" slot
}

export function randomUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(s: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s.trim()
  );
}

export function sanitizePath(p: string): string {
  return p.trim().replace(/^\/+/, "").replace(/\s+/g, "");
}

export function sanitizeDomain(d: string): string {
  return d
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export function buildVlessLink(args: {
  uuid: string;
  address: string;
  port: number;
  host: string;
  path: string;
  name: string;
  tls: boolean;
}): string {
  const { uuid, address, port, host, path, name, tls } = args;
  const encPath = path ? `%2F${encodeURIComponent(path)}` : "%2F";
  const params = new URLSearchParams();
  params.set("encryption", "none");
  params.set("security", tls ? "tls" : "none");
  if (tls) {
    params.set("sni", host);
    params.set("fp", "randomized");
    params.set("alpn", "http/1.1");
  }
  params.set("type", "ws");
  params.set("host", host);
  params.set("path", encPath);
  return `vless://${uuid}@${address}:${port}?${params.toString()}#${encodeURIComponent(name)}`;
}

export function generateConfigs(opts: GenOptions): GenConfig[] {
  const { uuid, domain, tlsPorts, plainPorts, path, prefix, count, pool } = opts;
  const host = sanitizeDomain(domain);
  const cleanPath = sanitizePath(path);
  const addresses = pool.length ? pool : [host];

  const portPlan: { port: number; tls: boolean }[] = [
    ...tlsPorts.map((port) => ({ port, tls: true })),
    ...plainPorts.map((port) => ({ port, tls: false })),
  ];
  if (portPlan.length === 0) portPlan.push({ port: 443, tls: true });

  const out: GenConfig[] = [];
  for (let i = 0; i < count; i++) {
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    const plan = portPlan[i % portPlan.length];
    const name = `${prefix}-${String(i + 1).padStart(3, "0")}`;
    out.push({
      id: `${i}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      address,
      port: plan.port,
      tls: plan.tls,
      uri: buildVlessLink({
        uuid,
        address,
        port: plan.port,
        host,
        path: cleanPath,
        name,
        tls: plan.tls,
      }),
    });
  }
  return out;
}

export function toBase64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

export function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
