import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  CopyCheck,
  Dices,
  Download,
  GitBranch,
  Globe,
  KeyRound,
  Link2,
  Loader2,
  Radar,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import ConfigCard from "./components/ConfigCard";
import NetworkBackground from "./components/NetworkBackground";
import QrModal from "./components/QrModal";
import {
  CLEAN_IPS,
  DEFAULT_BRAND,
  DEFAULT_UUID,
  MAX_COUNT,
  forgeConfigs,
  isValidDomain,
  isValidUUID,
  normalizeDomain,
  randomUUID,
  toFaDigits,
  type VlessConfig,
} from "./lib/vless";

const REPO_URL = "https://github.com/playneofly/vp-n-server";

export default function App() {
  const [domain, setDomain] = useState<string>(() =>
    normalizeDomain(window.location.host || "")
  );
  const [uuid, setUuid] = useState<string>(DEFAULT_UUID);
  const [brand, setBrand] = useState<string>(DEFAULT_BRAND);
  const [count, setCount] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<VlessConfig[] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toastTimer = useRef<number | undefined>(undefined);
  const copiedTimer = useRef<number | undefined>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(copiedTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const copyText = async (text: string, key: string, label = "کپی شد") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopiedKey(null), 1800);
    showToast(label);
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const uuidOk = useMemo(() => isValidUUID(uuid), [uuid]);
  const subUrl = useMemo(() => {
    const d = normalizeDomain(domain);
    return d ? `https://${d}/sub/${uuid.trim().toLowerCase()}` : "";
  }, [domain, uuid]);

  const handleForge = () => {
    const d = normalizeDomain(domain);
    if (!isValidDomain(d)) {
      showToast("دامنه معتبر نیست — دامنه‌ی Pages خودت را وارد کن");
      return;
    }
    if (!uuidOk) {
      showToast("UUID معتبر نیست — با دکمه‌ی تاس یکی بساز");
      return;
    }
    setDomain(d);
    setBusy(true);
    window.setTimeout(() => {
      const forged = forgeConfigs({ domain: d, uuid, count, brand });
      setResults(forged);
      setBusy(false);
      showToast(`${toFaDigits(forged.length)} کانفیگ واقعی ساخته شد`);
      window.setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    }, 520);
  };

  const handleNewUuid = () => {
    const fresh = randomUUID();
    setUuid(fresh);
    copyText(fresh, "uuid", "UUID جدید ساخته و کپی شد");
  };

  const downloadAll = () => {
    if (!results?.length) return;
    const blob = new Blob([results.map((r) => r.link).join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cf-forge-configs.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("فایل کانفیگ‌ها دانلود شد");
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-void font-vazir text-zinc-100">
      <NetworkBackground />

      {/* لایه‌های تزئینی */}
      <div className="grid-overlay pointer-events-none absolute inset-x-0 top-0 z-0 h-[720px]" />
      <div className="glow-orb absolute -top-32 start-1/2 z-0 size-[560px] -translate-x-1/2 bg-emerald-500/15" />
      <div className="glow-orb absolute top-[900px] -end-40 z-0 size-[420px] bg-cyan-500/10" />

      {/* ---------------- هدر ---------------- */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-cyan-400 shadow-[0_6px_20px_-4px_rgba(52,211,153,0.6)]">
              <Zap className="size-5 text-emerald-950" strokeWidth={2.6} />
            </span>
            <div>
              <div className="grotesk text-lg font-bold leading-5 tracking-tight">CF FORGE</div>
              <div className="text-[11px] text-zinc-400">کارخانه‌ی کانفیگ ابری</div>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <button onClick={() => scrollTo("builder")} className="transition hover:text-emerald-300">
              سازنده
            </button>
            <button onClick={() => scrollTo("why")} className="transition hover:text-emerald-300">
              چرا کار می‌کند؟
            </button>
            <button onClick={() => scrollTo("deploy")} className="transition hover:text-emerald-300">
              راه‌اندازی
            </button>
          </nav>
          <div className="flex items-center gap-2.5">
            <span className="chip hidden sm:inline-flex">
              <span className="relative size-2 rounded-full bg-emerald-400 pulse-ring" />
              <span className="text-emerald-300">موتور VLESS داخل پروژه</span>
            </span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-200"
              aria-label="گیت‌هاب"
            >
              <GitBranch className="size-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ---------------- هیرو ---------------- */}
        <section className="mx-auto max-w-6xl px-5 pt-16 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="chip mb-6 border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
              >
                <Sparkles className="size-3.5" />
                بدون اسکن · بدون سرور جداگانه · ۱۰۰٪ روی Cloudflare Pages
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08 }}
                className="text-4xl font-black leading-[1.25] tracking-tight md:text-6xl md:leading-[1.2]"
              >
                کانفیگ VLESSی که
                <br />
                <span className="text-gradient-mint">واقعاً وصل می‌شود.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16 }}
                className="mt-6 max-w-xl text-base leading-8 text-zinc-400 md:text-lg md:leading-9"
              >
                رازش جادو نیست: لینک vless فقط یک «آدرس» است. این نسخه علاوه بر سازنده،{" "}
                <span className="font-bold text-zinc-200">موتور واقعی VLESS</span> را هم با پوشه‌ی{" "}
                <span className="mono ltr-run text-sm text-emerald-300">functions</span> داخل خودش
                دارد — همان چیزی که کلادفلر دپلوی می‌کند و کانفیگ‌ها را زنده نگه می‌دارد. آی‌پی‌ها
                هم ثابت و تمیزند؛ هیچ اسکنی روی اینترنت تو انجام نمی‌شود.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.24 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <button onClick={() => scrollTo("builder")} className="btn-forge">
                  <Zap className="size-5" strokeWidth={2.5} />
                  ساخت کانفیگ
                </button>
                <button onClick={() => scrollTo("why")} className="btn-ghost px-5 py-3.5">
                  <ShieldCheck className="size-4.5" />
                  چرا این‌بار کار می‌کند؟
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32 }}
                className="mt-10 grid max-w-lg grid-cols-3 gap-3"
              >
                {[
                  { v: `+${toFaDigits(CLEAN_IPS.length)}`, l: "ورودی تمیز ثابت" },
                  { v: "TLS × WS", l: "پیلود استاندارد" },
                  { v: toFaDigits(0), l: "اسکن شبکه‌ی تو", mono: true },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-2xl px-4 py-3.5 text-center">
                    <div className="grotesk text-xl font-bold text-emerald-300">{s.v}</div>
                    <div className="mt-1 text-[11px] text-zinc-400">{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* کارت نمونه‌ی خروجی */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="glow-orb absolute -inset-6 -z-10 bg-emerald-500/10" />
              <div className="glass float-slow relative rounded-3xl p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-200">نمونه‌ی خروجی</span>
                  <span className="chip border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                    ساختار معتبر
                  </span>
                </div>
                <div className="ltr-run mono mt-5 rounded-xl border border-white/5 bg-black/40 p-4 text-start text-[11.5px] leading-7">
                  <span className="text-zinc-500">vless://</span>
                  <span className="text-cyan-300">b3311f0d-…-5c6b7a8f9e0d</span>
                  <span className="text-zinc-500">@</span>
                  <span className="text-emerald-300">172.67.136.197:443</span>
                  <span className="text-zinc-600">
                    ?encryption=none&amp;security=tls&amp;sni=<span className="text-emerald-200">you.pages.dev</span>
                    &amp;fp=chrome&amp;type=ws…
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="chip text-[10px]">سازگار با v2rayNG</span>
                  <span className="chip text-[10px]">Streisand</span>
                  <span className="chip text-[10px]">sing-box</span>
                  <span className="chip text-[10px]">Nekoray</span>
                </div>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-3.5 py-2.5 text-[11px] leading-5 text-amber-200/80">
                  <ShieldCheck className="size-4 shrink-0 text-amber-300" />
                  آی‌پی فقط «درِ ورودی» است؛ مسیر نهایی با SNI/Host به سایت خودت می‌رسد.
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ---------------- سازنده ---------------- */}
        <section id="builder" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">سازنده‌ی کانفیگ</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  تعداد بده، دکمه را بزن — هر بار ترکیب تازه‌ای از ورودی‌های تمیز کلادفلر.
                </p>
              </div>
              <span className="chip hidden md:inline-flex">
                <Radar className="size-3.5 text-emerald-300" />
                بدون اسکن
              </span>
            </div>

            <div className="glass relative overflow-hidden rounded-[28px] p-6 md:p-8">
              <div className="glow-orb absolute -top-24 -start-24 size-72 bg-emerald-500/10" />
              <div className="relative">
                <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-zinc-200">
                  <Settings2 className="size-4.5 text-emerald-300" />
                  تنظیمات اتصال
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {/* دامنه */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <Globe className="size-3.5 text-emerald-300" />
                      دامنه‌ی سایت (Pages) تو
                    </label>
                    <input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="forge-input ltr-run mono text-start"
                      placeholder="your-project.pages.dev"
                      spellCheck={false}
                    />
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                      دقیقاً دامنه‌ی Pages خودت — همین مقدار جای SNI و Host می‌نشیند. روی دامین خودِ
                      پروژه، خودکار پر شده است.
                    </p>
                  </div>

                  {/* UUID */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <KeyRound className="size-3.5 text-emerald-300" />
                      کلید UUID
                      {uuidOk && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={uuid}
                        onChange={(e) => setUuid(e.target.value)}
                        className={`forge-input ltr-run mono flex-1 text-start text-xs ${
                          uuid && !uuidOk ? "border-red-400/50" : ""
                        }`}
                        spellCheck={false}
                      />
                      <button onClick={handleNewUuid} className="btn-ghost shrink-0" title="ساخت UUID تصادفی">
                        <Dices className="size-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                      این کلید باید دقیقاً با متغیر <span className="mono text-emerald-300">UUID</span> در
                      کلادفلر یکی باشد — پیش‌فرض پروژه از قبل پر شده است.
                    </p>
                  </div>

                  {/* تعداد */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300">تعداد کانفیگ</label>
                      <span className="grotesk text-lg font-bold text-emerald-300">
                        {toFaDigits(count)}{" "}
                        <span className="text-[11px] font-medium text-zinc-500">کانفیگ</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={MAX_COUNT}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="forge-range"
                    />
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                      استخر: {toFaDigits(CLEAN_IPS.length)} ورودی ثابت و تمیز کلادفلر — ترکیب هر بار
                      به‌صورت تصادفی.
                    </p>
                  </div>

                  {/* برند */}
                  <div>
                    <label className="mb-2 block text-xs font-bold text-zinc-300">نام کانفیگ (برند)</label>
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="forge-input ltr-run mono text-start"
                      placeholder="CF.FORGE"
                      spellCheck={false}
                    />
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                      در انتهای لینک به‌صورت <span className="mono ltr-run">BRAND NUM.1</span> دیده
                      می‌شود.
                    </p>
                  </div>
                </div>

                <button onClick={handleForge} disabled={busy} className="btn-forge mt-8 w-full py-4 text-lg">
                  {busy ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      در حال ساخت…
                    </>
                  ) : (
                    <>
                      <Zap className="size-5" strokeWidth={2.5} />
                      ساخت کانفیگ
                    </>
                  )}
                  {busy && <span className="shimmer absolute inset-0 rounded-xl" />}
                </button>
              </div>
            </div>

            {/* ---------------- نتایج ---------------- */}
            <div ref={resultsRef} className="scroll-mt-24">
              {results ? (
                <div className="mt-8">
                  <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="relative size-2.5 rounded-full bg-emerald-400 pulse-ring" />
                      <span className="text-sm font-bold text-zinc-100">کانفیگ‌های آماده‌ی اتصال</span>
                      <span className="chip border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                        {toFaDigits(results.length)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          copyText(
                            results.map((r) => r.link).join("\n"),
                            "all",
                            "همه‌ی کانفیگ‌ها کپی شد"
                          )
                        }
                        className="btn-ghost text-xs"
                      >
                        {copiedKey === "all" ? (
                          <CopyCheck className="size-4 text-emerald-300" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                        کپی همه
                      </button>
                      <button onClick={downloadAll} className="btn-ghost text-xs">
                        <Download className="size-4" />
                        دانلود TXT
                      </button>
                      <button
                        onClick={() => copyText(subUrl, "sub", "لینک اشتراک کپی شد")}
                        className="btn-ghost text-xs"
                      >
                        {copiedKey === "sub" ? (
                          <Check className="size-4 text-emerald-300" />
                        ) : (
                          <Link2 className="size-4" />
                        )}
                        لینک اشتراک
                      </button>
                    </div>
                    <div className="ltr-run mono w-full truncate rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-[10px] leading-5 text-zinc-500">
                      {subUrl}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {results.map((cfg, i) => (
                      <ConfigCard
                        key={cfg.id}
                        cfg={cfg}
                        i={i}
                        copied={copiedKey === cfg.id}
                        onCopy={copyText}
                        onQr={setQrLink}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-10 text-center">
                  <Radar className="mx-auto mb-3 size-10 text-zinc-600" />
                  <p className="text-sm text-zinc-500">
                    هنوز کانفیگی نساخته‌ای — تنظیمات را چک کن و دکمه‌ی «ساخت کانفیگ» را بزن.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ---------------- چرا کار می‌کند ---------------- */}
        <section id="why" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-28">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              چرا این‌بار <span className="text-gradient-mint">واقعاً</span> وصل می‌شود؟
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              آن نمونه‌ای که برایت کار کرد، سه چیز داشت: سرور زنده، کلید یکسان و آی‌پی تمیز. هر سه را
              این‌جا قفل کرده‌ایم:
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="glass rounded-2xl p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
                  <Server className="size-5" />
                </span>
                <h3 className="mt-4 font-extrabold text-zinc-100">موتور داخل خودِ پروژه</h3>
                <p className="mt-2 text-[13px] leading-6 text-zinc-400">
                  فایل <span className="mono ltr-run text-[11px] text-emerald-300">functions/[[path]].js</span>{" "}
                  یک سرور واقعی VLESS روی WebSocket است که کلادفلر خودکار دپلوی می‌کند. لینک فقط
                  آدرس است؛ همین فایل است که «وصل» می‌کند — دقیقاً مثل Worker آن نمونه‌ی سالم.
                </p>
              </div>
              <div className="glass rounded-2xl p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/25">
                  <KeyRound className="size-5" />
                </span>
                <h3 className="mt-4 font-extrabold text-zinc-100">یک کلید، دو سرِ یکسان</h3>
                <p className="mt-2 text-[13px] leading-6 text-zinc-400">
                  کانفیگ فقط وقتی وصل می‌شود که UUID داخل لینک برابر متغیر{" "}
                  <span className="mono text-cyan-300">UUID</span> در کلادفلر باشد. پیش‌فرضِ هر دو
                  طرف یکی است؛ اگر عوضش کردی، بعدش حتماً{" "}
                  <span className="font-bold text-zinc-200">Retry deployment</span>.
                </p>
              </div>
              <div className="glass rounded-2xl p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
                  <Globe className="size-5" />
                </span>
                <h3 className="mt-4 font-extrabold text-zinc-100">ورودی‌های ثابت، بدون اسکن</h3>
                <p className="mt-2 text-[13px] leading-6 text-zinc-400">
                  به‌جای اسکن اینترنت تو، {toFaDigits(CLEAN_IPS.length)} ورودی تمیز و ثابت از
                  رنج‌های رسمی کلادفلر — مثل{" "}
                  <span className="mono ltr-run text-[11px] text-emerald-300">172.67.136.197</span>{" "}
                  که خودت گفتی کار می‌کند — به‌صورت تصادفی ترکیب می‌شوند.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" />
              <p className="text-[13px] leading-6 text-amber-100/85">
                <span className="font-extrabold text-amber-200">اگر باز هم قطعی دیدی،</span> تقریباً
                همیشه یکی از این سه است: ۱) بعد از ست‌کردن UUID، گزینه‌ی Retry deployment زده نشده؛
                ۲) در فرم، دامنه‌ای غیر از دامنه‌ی خودت مانده؛ ۳) مخزن بدون پوشه‌ی functions دپلوی
                شده. این چک‌لیست را رد کن — تمام.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ---------------- راه‌اندازی ---------------- */}
        <section id="deploy" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-28 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">راه‌اندازی در ۴ قدم</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              یک بار انجامش بده — برای همیشه. بعد از آن هر بار «ساخت» را بزنی، کانفیگ‌ها واقعی‌اند.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  n: 1,
                  t: "پوش به گیت‌هاب",
                  d: "کل پروژه را با پوشه‌ی functions در مخزنت بگذار؛ این پوشه همان موتور VLESS است و باید در ریشه‌ی مخزن باشد. فایل _routes.json هم می‌گوید فانکشن فقط روی مسیرهای پروکسی و اشتراک اجرا شود تا سایت همیشه بالا بیاید.",
                  chips: ["functions/[[path]].js", "_routes.json"],
                },
                {
                  n: 2,
                  t: "اتصال به Cloudflare Pages",
                  d: "Workers & Pages ← Create ← Connect to Git. گزینه‌ی Framework را روی None بگذار:",
                  chips: ["build: npm run build", "output: dist"],
                },
                {
                  n: 3,
                  t: "ست‌کردن کلید UUID",
                  d: "در Settings ← Environment variables ← Production متغیر UUID را بساز (دکمه‌ی تاس در سایت). بعد از ذخیره، از تب Deployments گزینه‌ی Retry deployment را بزن.",
                  chips: ["UUID = کلید تو"],
                },
                {
                  n: 4,
                  t: "ساخت و اتصال",
                  d: "سایت pages.dev را باز کن — دامنه خودکار پر می‌شود. UUID مرحله‌ی ۳ را بگذار، تعداد را انتخاب کن و «ساخت کانفیگ» را بزن. لینک اشتراک هم آماده است:",
                  chips: ["/sub/YOUR-UUID"],
                },
              ].map((step) => (
                <div key={step.n} className="glass relative overflow-hidden rounded-2xl p-6">
                  <span className="grotesk absolute -end-3 -top-7 text-[92px] font-bold leading-none text-white/[0.045]">
                    {step.n}
                  </span>
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-300 to-cyan-400 text-sm font-black text-emerald-950">
                        {toFaDigits(step.n)}
                      </span>
                      <h3 className="font-extrabold text-zinc-100">{step.t}</h3>
                    </div>
                    <p className="mt-3 text-[13px] leading-6 text-zinc-400">{step.d}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.chips.map((c) => (
                        <span key={c} className="code-chip">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      {/* ---------------- فوتر ---------------- */}
      <footer className="relative z-10 border-t border-white/5 bg-black/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-center sm:flex-row sm:text-start">
          <div className="flex items-center gap-2.5">
            <Zap className="size-4 text-emerald-300" />
            <span className="grotesk text-sm font-bold">CF FORGE</span>
            <span className="text-xs text-zinc-500">— ساخته‌شده برای Cloudflare Pages</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            کانفیگ‌ها داخل مرورگر خودت ساخته می‌شوند؛ چیزی جایی ارسال نمی‌شود. فقط برای مصرف قانونی و
            شخصی.
          </p>
        </div>
      </footer>

      {/* ---------------- تست ---------------- */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-[#0a1714]/95 px-5 py-2.5 text-sm font-semibold text-emerald-100 shadow-[0_14px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            >
              <CheckCircle2 className="size-4 text-emerald-300" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QrModal link={qrLink} onClose={() => setQrLink(null)} />
    </div>
  );
}
