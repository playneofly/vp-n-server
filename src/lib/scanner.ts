// Live network scanner — probes candidate addresses from the USER'S browser,
// so the generated pool only contains paths that really work on their network.

export interface ScanItem {
  host: string;
  ms: number | null; // null = dead
  ips: string[]; // verified edge IPs resolved via Cloudflare DoH
}

export interface PortScan {
  port: number;
  ok: boolean;
  ms: number | null;
}

const PING_TIMEOUT = 3200;
const CONCURRENCY = 6;

/** True latency-ish measurement: TCP + TLS + first response. null = blocked/dead. */
export async function pingUrl(url: string, timeoutMs = PING_TIMEOUT): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      redirect: "follow",
      signal: ctrl.signal,
    });
    return Math.round(performance.now() - t0);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve A records through Cloudflare DNS-over-HTTPS (CORS-enabled). */
export async function resolveA(name: string, timeoutMs = PING_TIMEOUT): Promise<string[]> {
  if (isIPv4(name)) return [name];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=A`, {
      headers: { accept: "application/dns-json" },
      cache: "no-store",
      signal: ctrl.signal,
    });
    const j = await r.json();
    const ips = (j.Answer || [])
      .filter((a: { type: number }) => a.type === 1)
      .map((a: { data: string }) => a.data)
      .filter((ip: string) => isIPv4(ip));
    return [...new Set<string>(ips)];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export function isIPv4(s: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(s.trim());
}

function isCFish(ip: string): boolean {
  // Only keep addresses inside public Cloudflare anycast ranges.
  const [a, b] = ip.split(".").map(Number);
  if (a === 104 && b >= 16 && b <= 27) return true;
  if (a === 172 && b >= 64 && b <= 71) return true;
  if (a === 162 && (b === 158 || b === 159)) return true;
  if (a === 108 && b === 162) return true;
  if (a === 141 && b === 101) return true;
  if (a === 173 && b === 245) return true;
  if (a === 188 && b === 114) return true;
  if (a === 190 && b === 93) return true;
  if (a === 197 && b === 234) return true;
  if (a === 198 && b === 41) return true;
  if (a === 131 && b === 0) return true;
  if (a === 103 && (b === 21 || b === 22 || b === 31)) return true;
  if (a === 1 && (b === 0 || b === 1)) return true;
  return false;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Probe each candidate host + pull its verified edge IPs via DoH. */
export async function scanCandidates(
  hosts: string[],
  onProgress?: (done: number, total: number) => void
): Promise<ScanItem[]> {
  let done = 0;
  const results = await mapLimit(hosts, CONCURRENCY, async (host): Promise<ScanItem> => {
    // two pings; keep the best (first network spike shouldn't kill a good host)
    let ms = await pingUrl(`https://${host}/`);
    if (ms !== null) {
      const second = await pingUrl(`https://${host}/`);
      if (second !== null) ms = Math.min(ms, second);
    }
    const ipsRaw = ms !== null && !isIPv4(host) ? await resolveA(host) : isIPv4(host) ? [host] : [];
    const ips = ipsRaw.filter(isCFish).slice(0, 3);
    done++;
    onProgress?.(done, hosts.length);
    return { host, ms, ips };
  });
  return results.sort((a, b) => (a.ms ?? 1e9) - (b.ms ?? 1e9));
}

/** Probe TLS ports on a known-good host — catches ISP-level port throttling. */
export async function scanPorts(host: string, ports: number[]): Promise<PortScan[]> {
  return mapLimit(ports, CONCURRENCY, async (port): Promise<PortScan> => {
    const url = port === 443 ? `https://${host}/` : `https://${host}:${port}/`;
    const ms = await pingUrl(url);
    return { port, ok: ms !== null, ms };
  });
}

export function msTone(ms: number | null): "good" | "mid" | "dead" {
  if (ms === null) return "dead";
  if (ms < 350) return "good";
  return "mid";
}
