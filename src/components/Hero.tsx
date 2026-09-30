import { useMemo } from "react";
import { ArrowDown, CloudLightning, Infinity as InfinityIcon, LockKeyhole, ServerOff, MousePointerClick } from "lucide-react";
import Reveal from "./Reveal";
import { buildVlessLink, DEFAULT_UUID } from "../lib/vless";
import { CLEAN_IPS } from "../lib/cleanIPs";

const STATS = [
  { icon: InfinityIcon, label: "بدون سقف تعداد", sub: "هر چندتا که بخوای" },
  { icon: LockKeyhole, label: "TLS + WebSocket", sub: "ترافیک کاملا رمزنگاری‌شده" },
  { icon: ServerOff, label: "بدون سرور شخصی", sub: "فقط حساب رایگان کلادفلر" },
];

export default function Hero() {
  const sampleLinks = useMemo(() => {
    const hosts = ["188.114.96.7", "104.16.85.20", "172.64.80.1", "icook.tw", "188.114.97.3", "104.21.2.3", "198.41.222.106", "ts.hpc.tw"];
    return hosts.map((h, i) =>
      buildVlessLink({
        uuid: DEFAULT_UUID,
        address: h,
        port: 443,
        host: "your-site.pages.dev",
        path: "",
        name: `Forge-${String(i + 1).padStart(3, "0")}`,
        tls: true,
      })
    );
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pb-10 pt-36 md:pt-44">
      {/* backdrop */}
      <div className="bg-scene pointer-events-none absolute inset-0" />
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="bg-noise pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Reveal>
            <div className="glass-soft mb-7 inline-flex items-center gap-2.5 rounded-full py-2 pe-4 ps-2">
              <span className="btn-brand flex h-7 w-7 items-center justify-center rounded-full text-night-900">
                <CloudLightning className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="text-[13px] font-semibold text-white/75">
                اتصال مستقیم روی زیرساخت کلادفلر — بدون VPS
              </span>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="text-[42px] font-black leading-[1.15] tracking-tight text-white sm:text-6xl md:text-[68px]">
              کانفیگ <span className="text-gradient">VLESS</span> و{" "}
              <span className="text-gradient">Trojan</span> بساز؛
              <br />
              نامحدود، واقعی،
              <br />
              آماده‌ی اتصال.
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-[15px] leading-8 text-white/55 md:text-base">
              دامنه‌ات را بده، تعداد را مشخص کن، دکمه را بزن. هر کانفیگ با یک
              آی‌پی تمیز کلادفلر روی وب‌سوکتِ امن ساخته می‌شود و مستقیم داخل
              <span className="num text-white/80"> v2rayNG</span>،
              <span className="num text-white/80"> Streisand</span> و
              <span className="num text-white/80"> sing-box</span> کار می‌کند.
              کل این صفحه + موتور پروکسی، روی اکانت رایگان کلادفلرِ خودت اجرا می‌شود.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#generator"
                className="btn-brand group flex h-14 items-center gap-3 rounded-2xl px-8 text-base font-extrabold text-night-900"
              >
                <MousePointerClick className="h-5 w-5 transition-transform group-hover:rotate-12" />
                شروع ساخت کانفیگ
              </a>
              <a
                href="#guide"
                className="glass flex h-14 items-center gap-2 rounded-2xl px-7 text-base font-bold text-white/85 transition hover:border-brand-500/40 hover:text-white"
              >
                راهنمای ۵ دقیقه‌ای دپلوی
                <ArrowDown className="h-4.5 w-4.5 opacity-60" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-12 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.label} className="glass-soft rounded-2xl px-4 py-3.5">
                  <s.icon className="mb-2 h-5 w-5 text-brand-400" />
                  <div className="text-[13px] font-bold text-white/90">{s.label}</div>
                  <div className="mt-0.5 text-[11px] text-white/40">{s.sub}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* decorative live config stream */}
        <Reveal delay={200} className="relative hidden lg:block">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="animate-pulse-glow absolute -inset-10 rounded-full bg-brand-500/15 blur-3xl" />
            <div className="glass relative overflow-hidden rounded-3xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="num text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                  live output
                </span>
              </div>
              <div className="mask-fade-y h-[380px] overflow-hidden" dir="ltr">
                <div className="animate-marquee-y flex flex-col gap-2.5">
                  {[...sampleLinks, ...sampleLinks].map((l, i) => (
                    <div
                      key={i}
                      className="glass-soft num rounded-xl px-3.5 py-2.5 text-[10px] leading-relaxed text-white/45"
                      style={{ wordBreak: "break-all" }}
                    >
                      <span className="text-brand-400/90">{l.split("?")[0].slice(0, 44)}…</span>
                      <span className="block text-white/25">
                        {l.split("#")[1] ? decodeURIComponent(l.split("#")[1]!) : ""} · TLS · ws
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shine-line mt-4 w-full" />
              <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
                <span>ظرفیت: نامحدود</span>
                <span className="num font-bold text-emerald-400/90">ONLINE</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {CLEAN_IPS.length > 0 && (
        <div className="relative mx-auto mt-14 max-w-6xl px-4">
          <Reveal delay={120}>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
              <span className="text-xs text-white/35">
                <span className="num font-bold text-white/70">{CLEAN_IPS.length}+</span> آی‌پی تمیز داخلی
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/35">به‌روز با رنج‌های Anycast کلادفلر</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/35">قابل ترکیب با آی‌پی‌های تمیز خودت</span>
            </div>
          </Reveal>
        </div>
      )}
    </section>
  );
}
