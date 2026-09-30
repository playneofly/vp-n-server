import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Radar,
  Eraser,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Info,
  Trophy,
  Plus,
  Cable,
} from "lucide-react";
import { CANDIDATES, TLS_PORTS } from "../lib/data";
import { scanHosts, scanPorts, tone, fmtMs } from "../lib/net";
import { store, useStore } from "../lib/state";
import { Section, Reveal, CopyBtn, Tag } from "./ui";

type Phase = "idle" | "hosts" | "ports" | "done";

export default function Scanner() {
  const { scans, portScans, bestHost } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [custom, setCustom] = useState("");
  const [extraHosts, setExtraHosts] = useState<string[]>([]);

  const alive = useMemo(() => scans.filter((s) => s.ms !== null), [scans]);
  const alivePorts = useMemo(() => portScans.filter((p) => p.ok).map((p) => p.port), [portScans]);

  const startScan = async () => {
    const hosts = [...CANDIDATES.map((c) => c.host), ...extraHosts];
    setPhase("hosts");
    setProgress({ done: 0, total: hosts.length });
    store.set({ scans: [], portScans: [], bestHost: null });
    const results = await scanHosts(hosts, (d, t) => setProgress({ done: d, total: t }));
    const best = results.find((r) => r.ms !== null)?.host ?? null;
    store.set({ scans: results, bestHost: best, scannedAt: Date.now() });
    if (best) {
      setPhase("ports");
      setProgress({ done: 0, total: TLS_PORTS.length });
      const ps = await scanPorts(best, TLS_PORTS, (d, t) => setProgress({ done: d, total: t }));
      store.set({ portScans: ps });
    }
    setPhase("done");
  };

  const maxMs = Math.max(...alive.map((s) => s.ms ?? 0), 1);
  const scanning = phase === "hosts" || phase === "ports";

  const addCustom = () => {
    const list = custom
      .split(/[\s,،;\n]+/)
      .map((s) => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean);
    if (!list.length) return;
    setExtraHosts((p) => [...new Set([...p, ...list])]);
    setCustom("");
  };

  return (
    <Section
      id="scan"
      kicker="LIVE SCAN"
      title={
        <>
          اسکنر زنده — <span className="text-volt">از داخل شبکه‌ی خودت</span>
        </>
      }
      desc={
        <>
          مرورگرت همین حالا به همه‌ی نامزدها درخواست TLS می‌زند و زمان واقعی‌اش را می‌سنجد؛ یعنی
          نتیجه دقیقا برای <span className="text-ink">اپراتور و شهر خودت</span> معتبر است، نه برای
          یک سرور خارجی. ورودی‌های سبز را مستقیم ببر توی مولد کانفیگ.
        </>
      }
    >
      <Reveal>
        <div className="panel rounded-2xl p-6 sm:p-8">
          {/* controls */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={startScan}
              disabled={scanning}
              className={`inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-extrabold transition-all ${
                scanning
                  ? "cursor-wait border border-edge text-dim"
                  : "bg-volt text-[#04140c] hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgba(61,250,168,0.6)]"
              }`}
            >
              {scanning ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Radar size={17} />
              )}
              {scanning
                ? phase === "hosts"
                  ? "در حال تست نامزدها…"
                  : `اسکن پورت روی ${bestHost}`
                : phase === "done"
                  ? "اسکن دوباره"
                  : "شروع اسکن زنده"}
            </button>

            {scanning && (
              <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-full bg-pane2">
                <motion.div
                  className="h-full bg-volt"
                  animate={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
            )}

            {phase === "done" && (
              <div className="flex flex-wrap items-center gap-2">
                <Tag>
                  {alive.length} زنده از {scans.length}
                </Tag>
                {bestHost && <CopyBtn text={bestHost} label={`بهترین: ${bestHost}`} />}
                <button
                  onClick={() => {
                    store.set({ scans: [], portScans: [], bestHost: null });
                    setPhase("idle");
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 font-mono text-[11px] text-mute transition-colors hover:border-blood hover:text-blood"
                >
                  <Eraser size={13} />
                  پاک کردن
                </button>
              </div>
            )}
          </div>

          {/* custom host input */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              placeholder="دامنه‌ی شخصی هم تست کن — مثال: example.com"
              className="min-w-56 flex-1 rounded-lg border border-edge bg-[#050c08] px-3.5 py-2 text-[13px] text-ink placeholder:text-dim"
              dir="ltr"
            />
            <button
              onClick={addCustom}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-3.5 py-2 text-[12px] font-bold text-mute transition-colors hover:border-volt hover:text-volt"
            >
              <Plus size={14} />
              افزودن
            </button>
            {extraHosts.length > 0 && (
              <span className="font-mono text-[10px] text-dim" dir="ltr">
                +{extraHosts.length} custom
              </span>
            )}
          </div>

          {/* result rows */}
          <div className="mt-6 grid gap-1.5 md:grid-cols-2" dir="ltr">
            <AnimatePresence initial={false}>
              {scans.slice(0, 24).map((s, i) => {
                const t = tone(s.ms);
                return (
                  <motion.div
                    key={s.host}
                    layout
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.02 }}
                    className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left ${
                      t === "good"
                        ? "border-volt/25 bg-volt/4"
                        : t === "mid"
                          ? "border-ember/25 bg-ember/4"
                          : "border-edge bg-pane/40 opacity-60"
                    }`}
                  >
                    {s.ms !== null ? (
                      <CircleCheck size={15} className={t === "good" ? "text-volt" : "text-ember"} />
                    ) : (
                      <CircleX size={15} className="text-blood" />
                    )}
                    <span className="w-44 shrink-0 truncate font-mono text-[12px] text-ink">
                      {s.host}
                    </span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-pane2">
                      {s.ms !== null && (
                        <motion.div
                          className={`h-full ${t === "good" ? "bg-volt" : "bg-ember"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(4, 100 - (s.ms / maxMs) * 96)}%` }}
                        />
                      )}
                    </div>
                    <span
                      className={`w-16 shrink-0 text-right font-mono text-[11px] ${
                        t === "good" ? "text-volt" : t === "mid" ? "text-ember" : "text-blood"
                      }`}
                    >
                      {fmtMs(s.ms)}
                    </span>
                    {bestHost === s.host && <Trophy size={13} className="shrink-0 text-ember" />}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {scans.length > 24 && (
              <div className="col-span-full py-2 text-center font-mono text-[10px] text-dim">
                +{scans.length - 24} more — verified pool injected into forge below
              </div>
            )}
          </div>

          {/* port sweep output */}
          {portScans.length > 0 && (
            <Reveal className="mt-6">
              <div className="rounded-xl border border-edge bg-[#050c08] p-4">
                <div className="mb-3 flex items-center gap-2 font-mono text-[11px] text-dim" dir="ltr">
                  <Cable size={12} className="text-volt" />
                  PORT SWEEP — {bestHost}
                </div>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {portScans.map((p) => (
                    <div
                      key={p.port}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] ${
                        p.ok
                          ? "border-volt/35 bg-volt/8 text-volt"
                          : "border-blood/25 bg-blood/5 text-blood"
                      }`}
                    >
                      {p.ok ? <CircleCheck size={12} /> : <CircleX size={12} />}
                      {p.port}
                      {p.ok && <span className="opacity-70">{fmtMs(p.ms)}</span>}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-6 text-dim">
                  پورت‌های سبز در استراتژی «ترکیب هوشمندِ مولد» اولویت می‌گیرند. اگر 443 قرمز است
                  و جایگزینی سبز، دقیقا همان مورد معروف «گلوگاه 443» را گرفته‌ای.
                  {alivePorts.length > 0 && (
                    <span className="text-volt"> پورت‌های فعال: {alivePorts.join(" · ")}</span>
                  )}
                </p>
              </div>
            </Reveal>
          )}

          {/* honesty note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-edge bg-pane/60 p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-ember" />
            <p className="text-[12.5px] leading-7 text-mute">
              آی‌پی‌های خام (مثل 188.114.96.3) گواهی TLS ندارند، پس مرورگر نمی‌تواند مستقیم
              تست‌شان کند — به همین دلیل پروژه‌ی فعلی‌ات هم فقط بعضی‌ها را «پینگ بدون وصل» نشان
              می‌دهد. آن‌ها را از بخش «ساخت کانفیگ» وارد لینک کن و در v2rayN با دکمه‌ی
              <span className="font-mono text-[11px] text-volt"> Test server real delay </span>
              بسنج. دامنه‌های سبز این صفحه همان آی‌پی‌های تمیزند، با مزیت گواهی معتبر.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
