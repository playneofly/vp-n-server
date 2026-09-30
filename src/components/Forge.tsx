import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import {
  Hammer,
  RefreshCw,
  Copy,
  Download,
  QrCode,
  X,
  Link2,
  CircleCheck,
  KeyRound,
  Globe,
  Shuffle,
  Layers,
} from "lucide-react";
import { RAW_IPS, CANDIDATES, PORT_STRATEGIES, type PortStrategy } from "../lib/data";
import {
  forge,
  buildSubscription,
  subUrl,
  randomUUID,
  isValidUUID,
  normalizeDomain,
  downloadText,
  type ForgeConfig,
} from "../lib/forge";
import { store, useStore } from "../lib/state";
import { Section, Reveal, CopyBtn, copyText } from "./ui";

type PoolMode = "verified" | "domains" | "ips" | "mix";
const POOLS: { id: PoolMode; title: string; hint: string }[] = [
  { id: "verified", title: "زنده‌های اسکن", hint: "فقط چیزهایی که الان از شبکه‌ات جواب دادند" },
  { id: "mix", title: "ترکیب کامل", hint: "زنده‌ها + آی‌پی خام + دامنه" },
  { id: "domains", title: "دامنه‌های تمیز", hint: "گواهی معتبر، بدون نیاز به اسکن" },
  { id: "ips", title: "آی‌پی خام", hint: "رنج‌های کلاسیک؛ تست در v2rayN" },
];

function QrModal({ cfg, onClose }: { cfg: ForgeConfig; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="glass w-full max-w-xs rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-mute" dir="ltr">
            {cfg.entry}:{cfg.port}
          </span>
          <button
            onClick={onClose}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-edge text-mute hover:text-blood"
          >
            <X size={15} />
          </button>
        </div>
        <div className="grid place-items-center rounded-xl bg-white p-4">
          <QRCodeSVG value={cfg.link} size={200} level="M" />
        </div>
        <p className="mt-4 text-center text-[11.5px] leading-6 text-dim">
          با v2rayNG / Streisand / sing-box اسکن کن
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function Forge() {
  const { domain, uuid, scans, portScans } = useStore();
  const [count, setCount] = useState(8);
  const [strategy, setStrategy] = useState<PortStrategy>("mix");
  const [poolMode, setPoolMode] = useState<PoolMode>("mix");
  const [configs, setConfigs] = useState<ForgeConfig[]>([]);
  const [qr, setQr] = useState<ForgeConfig | null>(null);
  const [bulkState, setBulkState] = useState<"" | "links" | "sub">("");

  const aliveHosts = useMemo(() => scans.filter((s) => s.ms !== null).map((s) => s.host), [scans]);
  const alivePorts = useMemo(() => portScans.filter((p) => p.ok).map((p) => p.port), [portScans]);

  const entries = useMemo(() => {
    const domains = CANDIDATES.map((c) => c.host);
    switch (poolMode) {
      case "verified":
        return aliveHosts;
      case "domains":
        return domains;
      case "ips":
        return RAW_IPS;
      case "mix":
      default:
        return [...aliveHosts, ...RAW_IPS, ...domains];
    }
  }, [poolMode, aliveHosts]);

  const uuidOk = isValidUUID(uuid);
  const domainOk = normalizeDomain(domain).length > 3;

  const generate = () => {
    const out = forge({
      domain: domain || "your-project.pages.dev",
      uuid: uuidOk ? uuid : randomUUID(),
      count,
      strategy,
      alivePorts,
      entries,
      scans,
    });
    setConfigs(out);
  };

  const bulkCopy = async (kind: "links" | "sub") => {
    const links = configs.map((c) => c.link);
    await copyText(kind === "links" ? links.join("\n") : buildSubscription(links));
    setBulkState(kind);
    setTimeout(() => setBulkState(""), 1500);
  };

  return (
    <Section
      id="forge"
      kicker="FORGE V2"
      title={
        <>
          مولد کانفیگ ایرانی — <span className="text-volt">چندپورت، FP تصادفی، خوراک اسکنر</span>
        </>
      }
      desc={
        <>
          همان مولد پروژه‌ات، با سه تفاوت سرنوشت‌ساز: آدرس‌ها از بین
          <span className="text-ink"> ورودی‌های اثبات‌شده روی شبکه‌ی تو</span> چیده می‌شوند،
          پورت‌ها بین گزینه‌های آزاد کلادفلر چرخش می‌کنند، و هر لینک
          <span className="text-ink"> fingerprint تصادفی + spiderX </span>
          دارد تا الگوی ثابت نسازد.
        </>
      }
    >
      <Reveal>
        <div className="panel rounded-2xl p-6 sm:p-8">
          {/* inputs */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-mute">
                <Globe size={13} className="text-volt" />
                دامنه‌ی Pages پروژه‌ات
              </label>
              <input
                value={domain}
                onChange={(e) => store.set({ domain: e.target.value })}
                placeholder="your-project.pages.dev"
                dir="ltr"
                className={`w-full rounded-xl border bg-[#050c08] px-4 py-3 font-mono text-[13px] text-ink placeholder:text-dim ${
                  domain && !domainOk ? "border-blood" : "border-edge"
                }`}
              />
              <p className="mt-1.5 text-[11px] leading-5 text-dim">
                همانی که در Cloudflare Pages دپلوی کرده‌ای. کانفیگ‌ها به SNI/Host این دامنه
                می‌رسند.
              </p>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-mute">
                <KeyRound size={13} className="text-volt" />
                UUID (متغیر محیطی پروژه)
              </label>
              <div className="flex gap-2" dir="ltr">
                <input
                  value={uuid}
                  onChange={(e) => store.set({ uuid: e.target.value })}
                  dir="ltr"
                  className={`flex-1 rounded-xl border bg-[#050c08] px-4 py-3 font-mono text-[12px] text-ink ${
                    uuidOk ? "border-edge" : "border-blood"
                  }`}
                />
                <button
                  onClick={() => store.set({ uuid: randomUUID() })}
                  className="grid w-12 cursor-pointer place-items-center rounded-xl border border-edge text-mute transition-colors hover:border-volt hover:text-volt"
                  title="UUID تصادفی"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-dim">
                باید دقیقا با متغیر UUID در تنظیمات Pages یکی باشد — وگرنه ورکر رد می‌کند.
              </p>
            </div>
          </div>

          {/* strategy + pool */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-mute">
                <Layers size={13} className="text-volt" />
                استراتژی پورت
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PORT_STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id)}
                    className={`cursor-pointer rounded-xl border p-3 text-right transition-all ${
                      strategy === s.id
                        ? "border-volt bg-volt/8"
                        : "border-edge hover:border-edge2"
                    }`}
                  >
                    <div className={`text-[12.5px] font-bold ${strategy === s.id ? "text-volt" : "text-ink"}`}>
                      {s.title}
                    </div>
                    <div className="mt-1 text-[10.5px] leading-4 text-dim">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-mute">
                <Shuffle size={13} className="text-volt" />
                منبع آدرس‌ها
              </div>
              <div className="grid grid-cols-2 gap-2">
                {POOLS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPoolMode(p.id)}
                    className={`cursor-pointer rounded-xl border p-3 text-right transition-all ${
                      poolMode === p.id ? "border-volt bg-volt/8" : "border-edge hover:border-edge2"
                    }`}
                  >
                    <div className={`text-[12.5px] font-bold ${poolMode === p.id ? "text-volt" : "text-ink"}`}>
                      {p.title}
                    </div>
                    <div className="mt-1 text-[10.5px] leading-4 text-dim">{p.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* count + generate */}
          <div className="mt-6 flex flex-wrap items-end gap-5">
            <div className="min-w-52 flex-1">
              <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-mute">
                <span>تعداد کانفیگ</span>
                <span className="font-mono text-volt">{count}</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-emerald-400"
                dir="ltr"
              />
            </div>
            <button
              onClick={generate}
              className="inline-flex items-center gap-2.5 rounded-xl bg-volt px-7 py-3.5 text-sm font-extrabold text-[#04140c] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgba(61,250,168,0.6)]"
            >
              <Hammer size={17} />
              ساخت کانفیگ‌های ایرانی
            </button>
          </div>

          {/* output */}
          <AnimatePresence>
            {configs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-edge pt-6">
                  <button
                    onClick={() => bulkCopy("links")}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-3.5 py-2 text-[12px] font-bold text-mute transition-colors hover:border-volt hover:text-volt"
                  >
                    {bulkState === "links" ? <CircleCheck size={14} /> : <Copy size={14} />}
                    کپی همه لینک‌ها
                  </button>
                  <button
                    onClick={() => bulkCopy("sub")}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-3.5 py-2 text-[12px] font-bold text-mute transition-colors hover:border-volt hover:text-volt"
                  >
                    {bulkState === "sub" ? <CircleCheck size={14} /> : <Link2 size={14} />}
                    کپی سابسکریپشن (base64)
                  </button>
                  <button
                    onClick={() => downloadText("irforge-configs.txt", configs.map((c) => c.link).join("\n"))}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-3.5 py-2 text-[12px] font-bold text-mute transition-colors hover:border-volt hover:text-volt"
                  >
                    <Download size={14} />
                    دانلود TXT
                  </button>
                  <div className="flex-1" />
                  <span className="w-full font-mono text-[10px] text-dim sm:w-auto" dir="ltr">
                    {subUrl(domain, uuid)}
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {configs.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-[#050c08] px-4 py-3 transition-colors hover:border-edge2"
                    >
                      <span className="font-mono text-[10px] text-dim" dir="ltr">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[12px] text-ink" dir="ltr">
                        {c.entry}
                        <span className="text-volt">:{c.port}</span>
                      </span>
                      {c.ms !== null && (
                        <span className="rounded-md bg-volt/10 px-2 py-0.5 font-mono text-[10px] text-volt" dir="ltr">
                          {c.ms}ms
                        </span>
                      )}
                      <span className="w-52 max-w-full grow truncate font-mono text-[10px] text-dim" dir="ltr">
                        {c.link}
                      </span>
                      <button
                        onClick={() => setQr(c)}
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-edge text-mute transition-colors hover:border-volt hover:text-volt"
                        title="نمایش QR"
                      >
                        <QrCode size={14} />
                      </button>
                      <CopyBtn text={c.link} />
                    </motion.div>
                  ))}
                </div>

                <p className="mt-4 text-[12px] leading-7 text-dim">
                  نکته‌ی مهم: پارامتر فرگمنت داخل لینک vless استاندارد جا نمی‌شود؛ برای فعال‌سازی،
                  مرحله‌ی بعد (بخش فرگمنت) را روی کلاینت انجام بده. بدون فرگمنت هم همین لینک‌ها
                  به‌خاطر ورودی سالم و پورت جایگزین نسبت به نسخه‌ی قبلی بسیار پایدارترند.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>

      <AnimatePresence>{qr && <QrModal cfg={qr} onClose={() => setQr(null)} />}</AnimatePresence>
    </Section>
  );
}
