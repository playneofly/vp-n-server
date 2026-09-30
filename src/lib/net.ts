// Live probing engine — measures TLS latency from the visitor's own network.
// Same technique as the original project's scanner, extended with port sweeps
// and retry logic tuned for lossy Iranian routes.

export interface ScanItem {
  host: string;
  ms: number | null; // null => dead/blocked on this network
  tries: number;
}

export interface PortScan {
  port: number;
  ok: boolean;
  ms: number | null;
}

const TIMEOUT = 2800;
const CONCURRENCY = 6;

/** TLS handshake-ish measurement: DNS + TCP + TLS + response headers. */
export async function pingUrl(url: string, timeoutMs = TIMEOUT): Promise<number | null> {
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

/** Probe host:port up to `attempts` times; returns best latency or null. */
export async function pingHost(host: string, port = 443, attempts = 2): Promise<number | null> {
  const url = port === 443 ? `https://${host}/` : `https://${host}:${port}/`;
  let best: number | null = null;
  for (let i = 0; i < attempts; i++) {
    const ms = await pingUrl(url);
    if (ms !== null) best = best === null ? ms : Math.min(best, ms);
    else if (i + 1 < attempts) await new Promise((r) => setTimeout(r, 140));
  }
  return best;
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function scanHosts(
  hosts: string[],
  onTick?: (done: number, total: number) => void
): Promise<ScanItem[]> {
  let done = 0;
  const results = await mapLimit(hosts, CONCURRENCY, async (host): Promise<ScanItem> => {
    const ms = await pingHost(host, 443, 2);
    done++;
    onTick?.(done, hosts.length);
    return { host, ms, tries: 2 };
  });
  return results.sort((a, b) => (a.ms ?? 1e9) - (b.ms ?? 1e9));
}

export async function scanPorts(
  host: string,
  ports: number[],
  onTick?: (done: number, total: number) => void
): Promise<PortScan[]> {
  let done = 0;
  const res = await mapLimit(ports, CONCURRENCY, async (port): Promise<PortScan> => {
    const ms = await pingHost(host, port, 2);
    done++;
    onTick?.(done, ports.length);
    return { port, ok: ms !== null, ms };
  });
  return res.sort((a, b) => a.port - b.port);
}

export type Tone = "good" | "mid" | "dead";
export function tone(ms: number | null): Tone {
  if (ms === null) return "dead";
  return ms < 300 ? "good" : "mid";
}

export function toneColor(t: Tone): string {
  return t === "good" ? "text-volt" : t === "mid" ? "text-ember" : "text-blood";
}

export function fmtMs(ms: number | null): string {
  if (ms === null) return "خاموش";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
