// Clean Cloudflare address database.
// Any IP inside Cloudflare's anycast ranges can front a Pages/Worker site,
// because routing is decided by the TLS SNI / Host header of the request.
// Ranges below are Cloudflare's public anycast ranges (cloudflare.com/ips).

export const CLEAN_IPS: string[] = [
  // 188.114.96.0/20 — the classic "clean" range for Iranian ISPs
  "188.114.96.3", "188.114.96.6", "188.114.96.7", "188.114.96.11",
  "188.114.96.16", "188.114.96.21", "188.114.96.60", "188.114.96.110",
  "188.114.97.3", "188.114.97.5", "188.114.97.7", "188.114.97.12",
  "188.114.97.20", "188.114.97.66", "188.114.98.224", "188.114.98.229",
  "188.114.98.232", "188.114.99.224", "188.114.99.227", "188.114.99.230",
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
  // 173.245.48.0/20 & 198.41.128.0/17
  "173.245.49.66", "173.245.58.171", "173.245.60.194",
  "198.41.128.78", "198.41.177.168", "198.41.222.106",
  // 131.0.72.0/22 & 190.93.240.0/20 & 197.234.240.0/22
  "131.0.72.44", "131.0.74.225",
  "190.93.240.143", "190.93.245.93", "190.93.247.4",
  "197.234.240.165", "197.234.241.39",
];

// Cloudflare-fronted hostnames — they resolve to Cloudflare edge IPs and are
// often less congested than raw IPs. The live scanner probes these from the
// user's own network and keeps only the ones that actually respond.
export const CLEAN_DOMAINS: string[] = [
  "cloudflare.com",
  "www.cloudflare.com",
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

// These anycast IPs present valid TLS certificates for direct-IP access,
// so the browser can truly measure them (other raw IPs can't be TLS-probed).
export const PINGABLE_IPS: string[] = ["1.1.1.1", "1.0.0.1"];

export type IpMode = "mix" | "ip" | "domain" | "custom";

export function buildPool(mode: IpMode, custom: string): string[] {
  const customList = custom
    .split(/[\s,،;\n]+/)
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
