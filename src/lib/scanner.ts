// Live network scanner — probes candidates AND verifies every final
// (address, port) pair from the USER'S browser, so generated configs only
// use paths proven to work right now, on this network.

export interface ScanItem {
  host: string;
  ms: number | null; // null = dead after retries
}

export interface PortScan {
  port: number;
  ok: boolean;
  ms: number | null;
}

export interface VerifiedPair {
  address: string;
  port: number;
  ms: number;
}

const PING_TIMEOUT = 3000;
const CONCURRENCY = 6;

/** True latency-ish measurement: DNS + TCP + TLS + first response. null = blocked/dead. */
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

/** Retry-aware host probe: up to 3 attempts before calling a host dead. */
export async function pingHost(host: string, port = 443): Promise<number | null> {
  const url = port === 443 ? `https://${host}/` : `https://${host}:${port}/`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ms = await pingUrl(url);
    if (ms !== null) return ms;
  }
  return null;
}

export function isIPv4(s: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(s.trim());
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

/** Probe each candidate host (retry-aware), sorted by latency. */
export async function scanCandidates(
  hosts: string[],
  onProgress?: (done: number, total: number) => void
): Promise<ScanItem[]> {
  let done = 0;
  const results = await mapLimit(hosts, CONCURRENCY, async (host): Promise<ScanItem> => {
    const ms = await pingHost(host, 443);
    done++;
    onProgress?.(done, hosts.length);
    return { host, ms };
  });
  return results.sort((a, b) => (a.ms ?? 1e9) - (b.ms ?? 1e9));
}

/** Probe TLS ports on a known-good host — catches ISP-level port throttling. */
export async function scanPorts(host: string, ports: number[]): Promise<PortScan[]> {
  return mapLimit(ports, CONCURRENCY, async (port): Promise<PortScan> => {
    const ms = await pingHost(host, port);
    return { port, ok: ms !== null, ms };
  });
}

/** Final gate: probe every (address, port) pair the configs will use. */
export async function verifyPairs(
  pairs: { address: string; port: number }[],
  onProgress?: (done: number, total: number) => void
): Promise<VerifiedPair[]> {
  let done = 0;
  const results = await mapLimit(pairs, CONCURRENCY, async (p): Promise<VerifiedPair | null> => {
    const ms = await pingHost(p.address, p.port);
    done++;
    onProgress?.(done, pairs.length);
    return ms === null ? null : { address: p.address, port: p.port, ms };
  });
  return results.filter((p): p is VerifiedPair => p !== null).sort((a, b) => a.ms - b.ms);
}

export function msTone(ms: number | null): "good" | "mid" | "dead" {
  if (ms === null) return "dead";
  if (ms < 350) return "good";
  return "mid";
}
