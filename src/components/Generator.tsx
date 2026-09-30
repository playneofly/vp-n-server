import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Copy,
  Dices,
  Download,
  FileDown,
  Globe,
  Hash,
  KeyRound,
  Link2,
  Lock,
  LockOpen,
  QrCode,
  Shuffle,
  Sparkles,
  Unlock,
  X,
  Zap,
} from "lucide-react";
import Reveal from "./Reveal";
import { toast } from "../lib/toast";
import {
  DEFAULT_TROJAN_PASSWORD,
  DEFAULT_UUID,
  PLAIN_PORTS,
  TLS_PORTS,
  downloadText,
  faNum,
  generateConfigs,
  isValidUUID,
  randomPassword,
  randomUUID,
  sanitizeDomain,
  toBase64,
  type GenConfig,
  type ProtocolMode,
} from "../lib/vless";
import { buildPool, CLEAN_DOMAINS, CLEAN_IPS, type IpMode } from "../lib/cleanIPs";

const LS_KEY = "cf-forge.settings.v1";
const QUICK_COUNTS = [20, 50, 100, 200, 500];
const MAX_COUNT = 2000;

interface Settings {
  domain: string;
  uuid: string;
  trojanPassword: string;
  protocolMode: ProtocolMode;
  tlsPorts: number[];
  plainPorts: number[];
  path: string;
  prefix: string;
  ipMode: IpMode;
  customIPs: string;
  count: number;
}

function loadSettings(): Settings {
  const fallback: Settings = {
    domain: typeof window !== "undefined" ? window.location.host : "",
    uuid: DEFAULT_UUID,
    trojanPassword: DEFAULT_TROJAN_PASSWORD,
    protocolMode: "mix",
    tlsPorts: [443],
    plainPorts: [],
    path: "",
    prefix: "Forge",
    ipMode: "mix",
    customIPs: "",
    count: 50,
  };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const merged = { ...fallback, ...parsed };
    const badHosts = ["localhost", "127.0.0.1", "[::1]"];
    if (badHosts.some((h) => (merged.domain || "").includes(h))) merged.domain = "";
    return merged;
  } catch {
    return fallback;
  }
}

export default function Generator() {
  const [s, setS] = useState<Settings>(loadSettings);
  const [results, setResults] = useState<GenConfig[]>([]);
  const [qrFor, setQrFor] = useState<GenConfig | null>(null);
  const [justMade, setJustMade] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const pool = useMemo(() => buildPool(s.ipMode, s.customIPs), [s.ipMode, s.customIPs]);
  const uuidOk = isValidUUID(s.uuid);
  const domainOk = sanitizeDomain(s.domain).length > 3 && sanitizeDomain(s.domain).includes(".");
  const portCount = s.tlsPorts.length + s.plainPorts.length;

  const generate = () => {
    if (!domainOk) return toast("اول دامنه‌ی معتبر سایت/ورکرت را وارد کن", "err");
    if (s.protocolMode !== "trojan" && !uuidOk) return toast("فرمت UUID معتبر نیست", "err");
    if (s.protocolMode !== "vless" && !s.trojanPassword.trim())
      return toast("رمز Trojan را وارد کن یا حالت را روی VLESS بگذار", "err");
    if (pool.length === 0) return toast("هیچ آی‌پی تمیزی موجود نیست — چندتا آی‌پی سفارشی وارد کن", "err");
    const configs = generateConfigs({
      uuid: s.uuid.trim(),
      trojanPassword: s.trojanPassword,
      protocolMode: s.protocolMode,
      domain: s.domain,
      tlsPorts: s.tlsPorts,
      plainPorts: s.plainPorts,
      path: s.path,
      prefix: s.prefix.trim() || "Forge",
      count: Math.min(Math.max(1, Math.floor(s.count) || 1), MAX_COUNT),
      pool,
    });
    setResults(configs);
    setJustMade(false);
    requestAnimationFrame(() => setJustMade(true));
    toast(`${faNum(configs.length)} کانفیگ ساخته شد`);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(label);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast(label);
    }
  };

  const copyAll = () => copyText(results.map((r) => r.uri).join("\n"), "همه‌ی کانفیگ‌ها کپی شد");
  const subUrl = `https://${sanitizeDomain(s.domain)}/sub/${s.uuid.trim()}`;

  const togglePort = (list: "tlsPorts" | "plainPorts", p: number) => {
    setS((prev) => {
      const cur = prev[list];
      const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p].sort((a, b) => a - b);
      return { ...prev, [list]: next };
    });
  };

  return (
    <section id="generator" className="relative mx-auto max-w-6xl scroll-mt-28 px-4 py-16 md:py-24">
      <Reveal>
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-brand-400">
              <Sparkles className="h-4 w-4" />
              کانفیگ‌ساز
            </div>
            <h2 className="text-3xl font-black text-white md:text-5xl">سه قدم تا اتصال</h2>
          </div>
          <p className="hidden max-w-xs text-left text-xs leading-6 text-white/40 md:block" dir="rtl">
            همه‌چیز داخل مرورگر خودت تولید می‌شود؛ هیچ کلیدی به جایی ارسال نمی‌شود.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ─────────────── settings ─────────────── */}
        <div className="flex flex-col gap-5">
          <Reveal delay={60}>
            <div className="glass rounded-3xl p-6">
              <StepTitle n="۱" icon={<Globe className="h-4.5 w-4.5" />} title="دامنه‌ی سایتت روی کلادفلر" />

              <div className="glass-soft mt-4 flex items-center gap-2 rounded-2xl p-1.5" dir="ltr">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Link2 className="h-4.5 w-4.5" />
                </span>
                <input
                  value={s.domain}
                  onChange={(e) => set("domain", e.target.value)}
                  placeholder="my-pages.pages.dev"
                  spellCheck={false}
                  className="num w-full bg-transparent pe-3 text-sm text-white outline-none placeholder:text-white/25"
                />
                {domainOk && <Check className="me-2 h-4 w-4 shrink-0 text-emerald-400" />}
              </div>
              <p className="mt-2.5 text-[11px] leading-5 text-white/40">
                آدرس Pages یا Worker خودت — بعد از دپلوی روی کلادفلر فعال می‌شود.
                {s.domain === window.location.host && " (از آدرس فعلی سایت پر شد)"}
              </p>

              <div className="mt-6">
                <StepTitle n="۲" icon={<KeyRound className="h-4.5 w-4.5" />} title="کلید UUID" small />
                <div className="glass-soft mt-3 flex items-center gap-2 rounded-2xl p-1.5" dir="ltr">
                  <input
                    value={s.uuid}
                    onChange={(e) => set("uuid", e.target.value)}
                    spellCheck={false}
                    className={`num w-full bg-transparent px-3 text-[12.5px] outline-none ${
                      uuidOk ? "text-white" : "text-red-400"
                    }`}
                  />
                  <button
                    onClick={() => set("uuid", randomUUID())}
                    title="UUID تصادفی"
                    className="btn-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-night-900"
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyText(s.uuid, "UUID کپی شد")}
                    title="کپی"
                    className="glass-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 transition hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-brand-500/25 bg-brand-500/8 p-3 text-[11px] leading-5 text-brand-300/90">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  این UUID باید دقیقا با متغیر <span className="num font-bold">UUID</span> در تنظیمات
                  کلادفلر یکی باشد — در راهنمای دپلوی توضیح داده‌ام.
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="glass rounded-3xl p-6">
              <StepTitle n="۳" icon={<Hash className="h-4.5 w-4.5" />} title="پروتکل، پورت‌ها و آی‌پی‌ها" />

              <div className="mt-4">
                <div className="mb-2 text-[11px] font-bold text-white/50">پروتکل کانفیگ‌ها</div>
                <div className="glass-soft grid grid-cols-3 gap-1 rounded-2xl p-1">
                  {(
                    [
                      ["mix", "ترکیبی شانسی", <Dices key="m" className="h-3.5 w-3.5" />],
                      ["vless", "VLESS", null],
                      ["trojan", "Trojan", null],
                    ] as [ProtocolMode, string, React.ReactNode][]
                  ).map(([m, label, icon]) => (
                    <button
                      key={m}
                      data-on={s.protocolMode === m}
                      onClick={() => set("protocolMode", m)}
                      className="chip flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-bold text-white/55"
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
                {s.protocolMode === "mix" && (
                  <p className="mt-2 text-[11px] text-white/35">
                    هر کانفیگ شانسی VLESS یا Trojan می‌شود — تنوع بیشتر، شناسایی سخت‌تر.
                  </p>
                )}
              </div>

              {s.protocolMode !== "vless" && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/50">
                    <KeyRound className="h-3.5 w-3.5 text-violet-400" /> رمز Trojan
                  </div>
                  <div className="glass-soft flex items-center gap-2 rounded-2xl p-1.5" dir="ltr">
                    <input
                      value={s.trojanPassword}
                      onChange={(e) => set("trojanPassword", e.target.value)}
                      spellCheck={false}
                      className="num w-full bg-transparent px-3 text-[12.5px] text-white outline-none placeholder:text-white/25"
                    />
                    <button
                      onClick={() => set("trojanPassword", randomPassword())}
                      title="رمز تصادفی"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/90 text-white transition hover:bg-violet-400"
                    >
                      <Dices className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => copyText(s.trojanPassword, "رمز Trojan کپی شد")}
                      title="کپی"
                      className="glass-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 transition hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-violet-400/25 bg-violet-400/8 p-3 text-[11px] leading-5 text-violet-300/90">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    این رمز باید با متغیر <span className="num font-bold">TROJAN_PASSWORD</span> در
                    کلادفلر یکی باشد — مثل همان کاری که برای UUID کردی.
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/50">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" /> پورت‌های TLS (امن — پیش‌نهادی)
                </div>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {TLS_PORTS.map((p) => (
                    <button
                      key={p}
                      data-on={s.tlsPorts.includes(p)}
                      onClick={() => togglePort("tlsPorts", p)}
                      className="chip num glass-soft rounded-xl px-3.5 py-2 text-xs font-bold text-white/60"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/50">
                  <LockOpen className="h-3.5 w-3.5 text-white/40" /> پورت‌های بدون TLS (اختیاری)
                </div>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {PLAIN_PORTS.map((p) => (
                    <button
                      key={p}
                      data-on={s.plainPorts.includes(p)}
                      onClick={() => togglePort("plainPorts", p)}
                      className="chip num glass-soft rounded-xl px-3.5 py-2 text-xs font-bold text-white/60"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-white/35">
                  کانفیگ‌ها به‌ترتیب بین پورت‌های انتخاب‌شده پخش می‌شوند.
                </p>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-[11px] font-bold text-white/50">منبع آی‌پی تمیز</div>
                <div className="glass-soft grid grid-cols-4 gap-1 rounded-2xl p-1">
                  {(
                    [
                      ["mix", "ترکیبی"],
                      ["ip", "فقط IP"],
                      ["domain", "دامنه"],
                      ["custom", "سفارشی"],
                    ] as [IpMode, string][]
                  ).map(([m, label]) => (
                    <button
                      key={m}
                      data-on={s.ipMode === m}
                      onClick={() => set("ipMode", m)}
                      className="chip rounded-xl py-2 text-[11.5px] font-bold text-white/55"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                  <span>
                    {s.ipMode === "mix" && `${faNum(CLEAN_IPS.length)} IP + ${faNum(CLEAN_DOMAINS.length)} دامنه‌ی تمیز داخلی`}
                    {s.ipMode === "ip" && `${faNum(CLEAN_IPS.length)} آی‌پی تمیز داخلی`}
                    {s.ipMode === "domain" && `${faNum(CLEAN_DOMAINS.length)} دامنه‌ی تمیز داخلی`}
                    {s.ipMode === "custom" && "فقط لیست خودت استفاده می‌شود"}
                  </span>
                  <span className="num rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                    pool: {pool.length}
                  </span>
                </div>
                <textarea
                  value={s.customIPs}
                  onChange={(e) => set("customIPs", e.target.value)}
                  rows={s.ipMode === "custom" ? 4 : 2}
                  spellCheck={false}
                  dir="ltr"
                  placeholder={"آی‌پی‌های تمیز خودت را اینجا بگذار (اختیاری)\n1.1.1.1, 188.114.96.7, ..."}
                  className="num glass-soft mt-3 w-full resize-none rounded-2xl p-3.5 text-xs leading-6 text-white/85 outline-none placeholder:text-white/25 focus:border-brand-500/40"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="glass-soft block rounded-2xl p-3">
                  <span className="mb-1 block text-[10.5px] font-bold text-white/45">مسیر (Path) — اختیاری</span>
                  <input
                    value={s.path}
                    onChange={(e) => set("path", e.target.value)}
                    placeholder="/"
                    dir="ltr"
                    spellCheck={false}
                    className="num w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                  />
                </label>
                <label className="glass-soft block rounded-2xl p-3">
                  <span className="mb-1 block text-[10.5px] font-bold text-white/45">پیشوند نام</span>
                  <input
                    value={s.prefix}
                    onChange={(e) => set("prefix", e.target.value)}
                    placeholder="Forge"
                    dir="ltr"
                    spellCheck={false}
                    className="num w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                  />
                </label>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ─────────────── count + results ─────────────── */}
        <div className="flex flex-col gap-5">
          <Reveal delay={100}>
            <div className="glass relative overflow-hidden rounded-3xl p-6">
              <div className="animate-pulse-glow pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />

              <div className="relative">
                <StepTitle n="★" icon={<Zap className="h-4.5 w-4.5" />} title="چندتا کانفیگ می‌خوای؟" />

                <div className="mt-5 flex items-center gap-4">
                  <div className="glass-soft num flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl text-4xl font-extrabold text-brand-300">
                    {faNum(s.count)}
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={1}
                      max={MAX_COUNT}
                      value={s.count}
                      onChange={(e) => set("count", Number(e.target.value))}
                      className="w-full"
                      style={{ ["--fill" as string]: `${(s.count / MAX_COUNT) * 100}%` }}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {QUICK_COUNTS.map((c) => (
                        <button
                          key={c}
                          data-on={s.count === c}
                          onClick={() => set("count", c)}
                          className="chip num glass-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-white/55"
                        >
                          {faNum(c)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={generate}
                  className="btn-brand group mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-black text-night-900"
                >
                  <Zap className="h-6 w-6 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                  ساخت {faNum(Math.min(s.count, MAX_COUNT))} کانفیگ
                </button>
                <p className="mt-3 text-center text-[11px] text-white/35">
                  تولید آنی در مرورگر — {portCount > 0 ? `${faNum(portCount)} پورت فعال` : "پورت پیش‌فرض ۴۴۳"} ·{" "}
                  <span className="num">{pool.length}</span> مقصد تمیز
                </p>
              </div>
            </div>
          </Reveal>

          {/* results */}
          <Reveal delay={160}>
            <div className="glass rounded-3xl p-6">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 py-16 text-center">
                  <div className="glass-soft mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white/30">
                    <QrCode className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-bold text-white/60">هنوز کانفیگی نساختی</p>
                  <p className="mt-1 text-xs text-white/35">
                    تعداد را انتخاب کن و دکمه‌ی نارنجی را بزن — خروجی اینجا می‌آید
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-white">
                        {faNum(results.length)} کانفیگ آماده
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
                        <span>
                          {faNum(new Set(results.map((r) => r.address)).size)} مقصد یکتا ·{" "}
                          {faNum(new Set(results.map((r) => r.port)).size)} پورت
                        </span>
                        <span className="num rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                          {results.filter((r) => r.protocol === "vless").length} VLESS
                        </span>
                        <span className="num rounded-full bg-violet-400/12 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                          {results.filter((r) => r.protocol === "trojan").length} Trojan
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn onClick={copyAll} icon={<ClipboardCopy className="h-4 w-4" />} label="کپی همه" primary />
                      <ActionBtn
                        onClick={() => {
                          downloadText("forge-configs.txt", results.map((r) => r.uri).join("\n"));
                          toast("فایل کانفیگ‌ها دانلود شد");
                        }}
                        icon={<FileDown className="h-4 w-4" />}
                        label="txt"
                      />
                      <ActionBtn
                        onClick={() => {
                          downloadText("forge-sub.txt", toBase64(results.map((r) => r.uri).join("\n")));
                          toast("فایل اشتراک Base64 دانلود شد");
                        }}
                        icon={<Download className="h-4 w-4" />}
                        label="Sub"
                      />
                    </div>
                  </div>

                  <div className="glass-soft mb-4 flex items-center gap-2 rounded-2xl p-2" dir="ltr">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-400">
                      <Link2 className="h-4 w-4" />
                    </span>
                    <span className="num min-w-0 flex-1 truncate text-[11px] text-white/60">{subUrl}</span>
                    <button
                      onClick={() => copyText(subUrl, "لینک اشتراک کپی شد")}
                      className="glass-soft flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold text-white/75 transition hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" /> کپی
                    </button>
                  </div>
                  <p className="-mt-2 mb-4 text-[10.5px] leading-5 text-white/35">
                    این «لینک اشتراک» بعد از دپلوی روی کلادفلر فعال می‌شود؛ داخل کلاینت‌ها به‌عنوان
                    Subscription اضافه‌اش کن تا لیست همیشه خودکار به‌روز شود.
                  </p>

                  <div className="max-h-[430px] space-y-2 overflow-y-auto pe-1">
                    {results.map((r, i) => (
                      <div
                        key={r.id}
                        className="glass-soft group flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:border-brand-500/35"
                        style={
                          justMade
                            ? { animation: `row-in .5s ${Math.min(i * 28, 700)}ms cubic-bezier(.22,1,.36,1) backwards` }
                            : undefined
                        }
                      >
                        <span className="num w-8 shrink-0 text-center text-[10px] font-bold text-white/30">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1" dir="ltr">
                          <div className="num truncate text-left text-[12.5px] font-bold text-white/90">
                            {r.name}
                          </div>
                          <div className="num mt-0.5 truncate text-left text-[10.5px] text-white/40">
                            {r.address}:{r.port}
                          </div>
                        </div>
                        <span
                          className={`num hidden shrink-0 rounded-full px-2 py-1 text-[9.5px] font-black uppercase sm:block ${
                            r.protocol === "trojan"
                              ? "bg-violet-400/12 text-violet-300"
                              : "bg-brand-500/12 text-brand-300"
                          }`}
                        >
                          {r.protocol}
                        </span>
                        <span
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-black ${
                            r.tls
                              ? "bg-emerald-400/12 text-emerald-400"
                              : "bg-white/8 text-white/45"
                          }`}
                        >
                          {r.tls ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {r.tls ? "TLS" : "HTTP"}
                        </span>
                        <button
                          onClick={() => setQrFor(r)}
                          title="QR"
                          className="glass-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/55 transition hover:text-brand-300"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <CopyBtn text={r.uri} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`@keyframes row-in { from { opacity:0; transform: translateY(14px) scale(.98);} to {opacity:1; transform:none;} }`}</style>

      {qrFor && <QrModal config={qrFor} onClose={() => setQrFor(null)} onCopy={copyText} />}
    </section>
  );
}

/* ───────────── helpers ───────────── */

function StepTitle({
  n,
  icon,
  title,
  small,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="btn-brand num flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[13px] font-black text-night-900">
        {n}
      </span>
      <h3 className={`flex items-center gap-2 font-extrabold text-white ${small ? "text-sm" : "text-[17px]"}`}>
        {title}
        <span className="text-brand-400/70">{icon}</span>
      </h3>
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold transition ${
        primary
          ? "btn-brand text-night-900"
          : "glass-soft text-white/75 hover:border-brand-500/40 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setOk(true);
        toast("کانفیگ کپی شد");
        setTimeout(() => setOk(false), 1600);
      }}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
        ok ? "bg-emerald-400/15 text-emerald-400" : "glass-soft text-white/55 hover:text-brand-300"
      }`}
      title="کپی"
    >
      {ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function QrModal({
  config,
  onClose,
  onCopy,
}: {
  config: GenConfig;
  onClose: () => void;
  onCopy: (t: string, l: string) => void;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(config.uri, {
      margin: 1,
      width: 420,
      errorCorrectionLevel: "M",
      color: { dark: "#0b0d15", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(""));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config, onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-night-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      style={{ animation: "fade-in .25s ease" }}
    >
      <div
        className="glass w-full max-w-sm rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "pop-in .35s cubic-bezier(.34,1.56,.64,1)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="num text-sm font-bold text-white" dir="ltr">
            {config.name}
          </div>
          <button
            onClick={onClose}
            className="glass-soft flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto w-fit rounded-2xl bg-white p-3">
          {src ? <img src={src} alt="QR" className="h-56 w-56" /> : <div className="h-56 w-56" />}
        </div>
        <div className="num glass-soft mt-4 max-h-20 overflow-y-auto rounded-xl p-3 text-[10px] leading-5 text-white/45" dir="ltr" style={{ wordBreak: "break-all" }}>
          {config.uri}
        </div>
        <button
          onClick={() => onCopy(config.uri, "کانفیگ کپی شد")}
          className="btn-brand mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-night-900"
        >
          <Copy className="h-4 w-4" />
          کپی کانفیگ
        </button>
      </div>
      <style>{`@keyframes fade-in {from{opacity:0}} @keyframes pop-in {from{opacity:0; transform:scale(.92)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}
