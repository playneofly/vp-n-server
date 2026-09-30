// Config forge — Iran-ready edition.
// Differences vs. the original repo:
//  · multi-port generation (443 is DPI-magnet on some ISPs; 8443/2096 often fly)
//  · fp=randomized + spx decoy params on every link
//  · pool biased toward browser-verified endpoints
//  · subscription builder + client fragment JSON generators

import { TLS_PORTS, type PortStrategy, type FragmentProfile } from "./data";
import type { ScanItem } from "./net";
import { DEFAULT_UUID } from "./state";

export interface ForgeConfig {
  id: number;
  entry: string;
  port: number;
  ms: number | null;
  name: string;
  link: string;
}

export function randomUUID(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const isValidUUID = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());

export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]/g, "");
}

export const isValidDomain = (v: string) =>
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(v);

function shuffle<T>(arr: readonly T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

export function portsFor(strategy: PortStrategy, alive: number[]): number[] {
  const base =
    strategy === "443"
      ? [443]
      : strategy === "alt"
        ? TLS_PORTS.filter((p) => p !== 443)
        : TLS_PORTS;
  // prefer ports proven alive on this network, but never starve the list
  const good = alive.length ? base.filter((p) => alive.includes(p)) : [];
  return (good.length ? good : base).slice(0, base.length);
}

function buildLink(domain: string, uuid: string, entry: string, port: number, name: string): string {
  const q = new URLSearchParams({
    encryption: "none",
    security: "tls",
    sni: domain,
    alpn: "h2,http/1.1",
    fp: "randomized",
    spx: "/",
    type: "ws",
    host: domain,
    path: "/",
  });
  return `vless://${uuid}@${entry}:${port}?${q.toString()}#${encodeURIComponent(name)}`;
}

export function forge(opts: {
  domain: string;
  uuid: string;
  count: number;
  strategy: PortStrategy;
  alivePorts: number[];
  entries: string[]; // verified winners first
  scans: ScanItem[];
}): ForgeConfig[] {
  const domain = normalizeDomain(opts.domain) || "your-project.pages.dev";
  const uuid = (opts.uuid || DEFAULT_UUID).trim().toLowerCase();
  const ports = portsFor(opts.strategy, opts.alivePorts);
  const pool = shuffle(opts.entries.length ? opts.entries : ["speed.cloudflare.com"]);
  const lat = new Map(opts.scans.map((s) => [s.host, s.ms]));
  const out: ForgeConfig[] = [];
  const count = Math.max(1, Math.min(30, Math.floor(opts.count) || 6));
  for (let i = 0; i < count; i++) {
    const entry = pool[i % pool.length];
    const port = ports[i % ports.length];
    const short = entry.length > 14 ? entry.slice(0, 14) : entry;
    const name = `IRFORGE-${String(i + 1).padStart(2, "0")}·${port}·${short}`;
    out.push({
      id: i,
      entry,
      port,
      ms: lat.get(entry) ?? null,
      name,
      link: buildLink(domain, uuid, entry, port, name),
    });
  }
  return out;
}

export function buildSubscription(links: string[]): string {
  const text = links.join("\n");
  return btoa(unescape(encodeURIComponent(text)));
}

export function subUrl(domain: string, uuid: string): string {
  return `https://${normalizeDomain(domain) || "your-project.pages.dev"}/sub/${uuid}`;
}

// ---------- client fragment configs (live-filled with your domain/uuid) ----------

export function xrayFragmentJson(
  domain: string,
  uuid: string,
  entry: string,
  port: number,
  p: FragmentProfile
): string {
  const d = normalizeDomain(domain) || "your-project.pages.dev";
  return JSON.stringify(
    {
      remarks: `${d} + FRAGMENT`,
      outbounds: [
        {
          protocol: "vless",
          settings: {
            vnext: [
              {
                address: entry,
                port,
                users: [{ id: uuid, encryption: "none" }],
              },
            ],
          },
          streamSettings: {
            network: "ws",
            security: "tls",
            wsSettings: { path: "/", headers: { Host: d } },
            tlsSettings: {
              serverName: d,
              allowInsecure: false,
              fingerprint: "chrome",
            },
            sockopt: { tcpFastOpen: true },
            fragment: { packets: p.packets, length: p.length, interval: p.interval },
          },
        },
      ],
    },
    null,
    2
  );
}

export function singBoxFragmentJson(
  domain: string,
  uuid: string,
  entry: string,
  port: number
): string {
  const d = normalizeDomain(domain) || "your-project.pages.dev";
  return JSON.stringify(
    {
      type: "vless",
      tag: `${d}-fragment`,
      server: entry,
      server_port: port,
      uuid,
      tls: {
        enabled: true,
        server_name: d,
        utls: { enabled: true, fingerprint: "chrome" },
        fragment: { enabled: true, packets: "tlshello", record_fragment: false },
      },
      transport: { type: "ws", path: "/", headers: { Host: d } },
    },
    null,
    2
  );
}

export function xrayFragmentSnippet(p: FragmentProfile): string {
  return JSON.stringify(
    { fragment: { packets: p.packets, length: p.length, interval: p.interval } },
    null,
    2
  );
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
