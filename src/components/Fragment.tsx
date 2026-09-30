import { useMemo, useState } from "react";
import { Scissors, Sparkles, Check, MousePointerClick, Settings2 } from "lucide-react";
import { FRAGMENT_PROFILES, type FragmentProfile } from "../lib/data";
import { xrayFragmentJson, singBoxFragmentJson, xrayFragmentSnippet } from "../lib/forge";
import { useStore, DEFAULT_UUID } from "../lib/state";
import { Section, Reveal, CodeBlock, Pill } from "./ui";

type ClientId = "v2rayn" | "v2rayng" | "nekoray" | "hiddify";
const CLIENTS: { id: ClientId; label: string }[] = [
  { id: "v2rayn", label: "v2rayN — ویندوز" },
  { id: "v2rayng", label: "v2rayNG — اندروید" },
  { id: "nekoray", label: "NekoBox / sing-box" },
  { id: "hiddify", label: "Hiddify App" },
];

export default function Fragment() {
  const { domain, uuid, bestHost } = useStore();
  const [profile, setProfile] = useState<FragmentProfile>(FRAGMENT_PROFILES[1]);
  const [client, setClient] = useState<ClientId>("v2rayn");

  const d = domain.trim() || "your-project.pages.dev";
  const entry = bestHost || "time.is";
  const filled = domain.trim().length > 0;

  const xrayFull = useMemo(
    () => xrayFragmentJson(d, uuid || DEFAULT_UUID, entry, 443, profile),
    [d, uuid, entry, profile]
  );
  const singBoxFull = useMemo(
    () => singBoxFragmentJson(d, uuid || DEFAULT_UUID, entry, 443),
    [d, uuid, entry]
  );
  const snippet = useMemo(() => xrayFragmentSnippet(profile), [profile]);

  return (
    <Section
      id="fragment"
      kicker="FRAGMENT"
      title={
        <>
          فرگمنت — <span className="text-volt">کلید اصلی کار کردن در ایران</span>
        </>
      }
      desc={
        <>
          یک تنظیم سمت کلاینت که ClientHello را قبل از رسیدن به اپراتور می‌شکند. بدون آن،
          بهترین آی‌پی تمیز دنیا هم ممکن است به دام بیفتد. یک پروفایل انتخاب کن؛ مقادیر JSONها
          با <span className="text-ink">دامنه و UUID خودت</span> (بخش مولد) همگام‌اند.
          {filled && (
            <span className="mr-2 inline-flex items-center gap-1 text-volt">
              <Sparkles size={12} /> پر شده با داده‌های تو
            </span>
          )}
        </>
      }
    >
      {/* profiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FRAGMENT_PROFILES.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06}>
            <button
              onClick={() => setProfile(p)}
              className={`h-full w-full cursor-pointer rounded-2xl border p-5 text-right transition-all ${
                profile.id === p.id ? "border-volt bg-volt/8" : "panel"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-sm font-extrabold ${profile.id === p.id ? "text-volt" : "text-ink"}`}>
                  {p.name}
                </span>
                {profile.id === p.id && <Check size={15} className="text-volt" />}
              </div>
              <div className="mb-2.5 flex gap-1.5 font-mono text-[9.5px] text-dim" dir="ltr">
                <Pill active={profile.id === p.id}>len {p.length}</Pill>
                <Pill active={profile.id === p.id}>gap {p.interval}</Pill>
              </div>
              <p className="text-[11.5px] leading-6 text-mute">{p.desc}</p>
            </button>
          </Reveal>
        ))}
      </div>

      {/* client tabs */}
      <Reveal delay={0.1}>
        <div className="panel mt-8 rounded-2xl p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Settings2 size={16} className="text-volt" />
            <span className="text-sm font-bold text-ink">فعال‌سازی روی کلاینت:</span>
            <div className="flex flex-wrap gap-2">
              {CLIENTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClient(c.id)}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-[12px] font-bold transition-all ${
                    client === c.id
                      ? "border-volt bg-volt/10 text-volt"
                      : "border-edge text-mute hover:border-edge2"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {client === "v2rayn" && (
            <div className="space-y-5">
              <ol className="space-y-2.5 text-[13px] leading-7 text-mute">
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>
                    کانفیگ‌ها را از بخش مولد ایمپورت کن؛ بعد برو به
                    <span className="font-mono text-[11.5px] text-ink"> ⚙ Setting → OptionSetting → Fragment </span>
                    (v2rayN نسخه‌ی 6.40+)
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>این JSON را داخل کادر فرگمنت بگذار:</span>
                </li>
              </ol>
              <CodeBlock title={`fragment.json — profile: ${profile.name}`} code={snippet} maxH={180} />
              <div className="space-y-2.5 border-t border-edge pt-5 text-[13px] leading-7 text-mute">
                <p className="font-bold text-ink">روش قوی‌تر: کانفیگ سفارشی کامل</p>
                <p>
                  برای وقتی که تنظیمات GUI اعمال نمی‌شود، برو به
                  <span className="font-mono text-[11.5px] text-ink"> Add custom configuration server </span>
                  و این outbound کامل را بچسبان (همه‌چیز با داده‌های تو پر شده است):
                </p>
              </div>
              <CodeBlock title="vless-ws-tls + fragment — custom inbound for v2rayN" code={xrayFull} maxH={380} />
            </div>
          )}

          {client === "v2rayng" && (
            <div className="space-y-5">
              <ol className="space-y-2.5 text-[13px] leading-7 text-mute">
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>
                    لینک‌های مولد را ایمپورت کن. سپس روی کانفیگ نگه دار و
                    <span className="font-mono text-[11.5px] text-ink"> Edit full custom config </span>
                    را بزن و بخش خروجی را با JSON زیر جایگزین کن.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>
                    اگر نسخه‌ی v2rayNG قابلیت فرگمنت را در ادیتور ندارد، کلاینت
                    <span className="text-volt"> Hiddify App </span>
                    یا <span className="text-volt">NekoBox</span> را نصب کن (کلاد بعدی).
                  </span>
                </li>
              </ol>
              <CodeBlock title={`fragment snippet — ${profile.name}`} code={snippet} maxH={180} />
              <CodeBlock title="custom outbound for v2rayNG" code={xrayFull} maxH={380} />
            </div>
          )}

          {client === "nekoray" && (
            <div className="space-y-5">
              <ol className="space-y-2.5 text-[13px] leading-7 text-mute">
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>
                    در NekoBox روی کانفیگ کلیک راست ←
                    <span className="font-mono text-[11.5px] text-ink"> Edit → custom config (sing-box core) </span>
                    و outbound زیر را کامل جایگذاری کن.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>
                    بلوک <span className="font-mono text-[11.5px] text-volt"> tls.fragment </span>
                    همان فرگمنت است؛ بومیِ سینگ‌باکس و بسیار پایدار.
                  </span>
                </li>
              </ol>
              <CodeBlock title="sing-box outbound (vless + ws + tls + fragment)" code={singBoxFull} maxH={380} />
            </div>
          )}

          {client === "hiddify" && (
            <div className="space-y-5">
              <ol className="space-y-2.5 text-[13px] leading-7 text-mute">
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>
                    لینک‌ها/سابسکریپشن مولد را داخل Hiddify App ایمپورت کن؛ چیزی لازم نیست JSON
                    کنی.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <MousePointerClick size={16} className="mt-1 shrink-0 text-volt" />
                  <span>
                    برو به مسیر
                    <span className="font-mono text-[11.5px] text-ink"> Config Options → Fragment </span>
                    و این مقادیر را بده:
                  </span>
                </li>
              </ol>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { k: "Mode", v: "tlshello" },
                  { k: "Packets (Size)", v: profile.length },
                  { k: "Delay (Interval)", v: profile.interval },
                ].map((f) => (
                  <div key={f.k} className="rounded-xl border border-edge bg-[#050c08] p-4" dir="ltr">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-dim">{f.k}</div>
                    <div className="mt-1 font-mono text-lg font-bold text-volt">{f.v}</div>
                  </div>
                ))}
              </div>
              <p className="text-[12.5px] leading-7 text-mute">
                اگر جواب نگرفتی پروفایل را از «استاندارد» به «پهن» تغییر بده؛ روی بعضی شبکه‌ها
                حالت 1-3 بافاصله‌ی کم بیشترین بقا را دارد.
              </p>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-edge bg-pane/60 p-4">
          <Scissors size={16} className="mt-0.5 shrink-0 text-volt" />
          <p className="text-[12.5px] leading-7 text-mute">
            ترتیب درست عیب‌یابی: اول اسکن زنده ← ورودی سبز ● بعد کانفیگ چندپورت ← تست اتصال ●
            اگر باز قطع شد، فرگمنت را فعال کن ● آخر از لینک اشتراک <span className="font-mono text-[11px]">/sub</span>.
            هر مرحله را جدا تست کن تا بدانی کدام‌یک دردت را دوا کرد.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
