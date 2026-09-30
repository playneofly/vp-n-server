import { motion } from "motion/react";
import { Ban, ScanEye, TrafficCone, Unplug, ArrowLeftRight, X, Check } from "lucide-react";
import { Section, Reveal } from "./ui";

const PROBLEMS = [
  {
    icon: Ban,
    n: "01",
    title: "رنج‌های خام مسدودند",
    desc: "اپراتورهای ایرانی خیلی از رنج‌های Anycast کلادفلر را می‌بندند یا شدیدا کندی می‌دهند. این دقیقا همان دلیلی است که فقط بعضی آی‌پی‌ها (معمولا روت‌شده از آمریکا) پینگ می‌گیرند.",
    fix: "اسکن زنده از داخل شبکه‌ی خودت → انتخاب ورودی پایدار",
  },
  {
    icon: ScanEye,
    n: "02",
    title: "شکار SNI در ClientHello",
    desc: "DPI اپراتور هلوی TLS را می‌خواند؛ وقتی SNI به دامنه‌ی pages.dev اشاره دارد، الگوی چهره‌شناخته پروکسی تشخیص داده و اتصال ریست می‌شود.",
    fix: "فرگمنت: تکه‌تکه کردن ClientHello تا SNI خوانده نشود",
  },
  {
    icon: TrafficCone,
    n: "03",
    title: "گلوگاه پورت ۴۴۳",
    desc: "روی پورت 443 شیت‌سنوی ترافیک سنگین است. همان کانفیگ روی 8443 یا 2096 (که کلادفلر پشتیبانی می‌کند) اغلب بدون دست‌خوردگی عبور می‌کند.",
    fix: "ساخت کانفیگ چندپورتی با چرخش خودکار",
  },
  {
    icon: Unplug,
    n: "04",
    title: "بدون مسیر فرار (PROXYIP)",
    desc: "موتور پروکسی پروژه وقتی اتصال مستقیم fail شود، مسیر جایگزینی ندارد. متغیر PROXYIP و fallback site در کیت پچ اضافه شده‌اند.",
    fix: "کیت پچ: رله‌ی PROXYIP + سایت پوششی",
  },
];

function PacketDiagram() {
  return (
    <div className="panel relative overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-2 font-mono text-[11px] tracking-widest text-dim" dir="ltr">
        <ArrowLeftRight size={13} className="text-volt" />
        CLIENTHELLO — TRANSMIT VS. FRAGMENT
      </div>

      {/* lane A: blocked */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-mute">کانفیگ فعلی — بدون فرگمنت</span>
          <span className="font-mono text-[10px] text-blood" dir="ltr">RST @ DPI</span>
        </div>
        <div className="relative flex items-center gap-3" dir="ltr">
          <div className="rounded-lg border border-edge2 bg-pane2 px-3 py-2 font-mono text-[10px] text-ink">
            TLS&nbsp;Hello
            <span className="mt-1 block text-[9px] text-dim">sni=…pages.dev (کاملا خوانا)</span>
          </div>
          <div className="relative h-0.5 flex-1 rounded bg-pane2">
            <motion.span
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-ink"
              animate={{ left: ["0%", "56%", "58%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="relative grid h-12 w-12 place-items-center rounded-lg border border-blood/40 bg-blood/10">
            <ScanEye size={18} className="text-blood" />
            <motion.span
              className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-blood text-void"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              <X size={12} />
            </motion.span>
          </div>
          <div className="w-18 truncate rounded-lg border border-dashed border-edge px-3 py-2 font-mono text-[9px] text-dim">
            edge.cf
          </div>
        </div>
      </div>

      {/* lane B: fragmented */}
      <div>
        <div className="mb-3 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-volt">نسخه‌ی ایران — فرگمنت فعال</span>
          <span className="font-mono text-[10px] text-volt" dir="ltr">200 OK · CONNECTED</span>
        </div>
        <div className="relative flex items-center gap-3" dir="ltr">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="grid h-10 w-7 place-items-center rounded-md border border-volt/40 bg-volt/10 font-mono text-[9px] text-volt"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
              >
                {`h${i}`}
              </motion.div>
            ))}
          </div>
          <div className="relative h-0.5 flex-1 rounded bg-pane2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-volt"
                animate={{ left: ["2%", "86%"] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.35,
                  ease: "linear",
                }}
              />
            ))}
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-lg border border-volt/40 bg-volt/10">
            <Check size={18} className="text-volt" />
          </div>
          <div className="w-18 truncate rounded-lg border border-volt/40 bg-pane2 px-3 py-2 font-mono text-[9px] text-volt">
            edge.cf
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-6 text-dim">
          هلوی TLS به چند تکه‌ی کوچک شکسته می‌شود؛ هیچ‌کدام به‌تنهایی الگوی تشخیص‌پذیر نیستند.
          اپراتور اجازه‌ی عبور می‌دهد، کلادفلر تکه‌ها را کنار هم می‌چیند.
        </p>
      </div>
    </div>
  );
}

export default function Diagnose() {
  return (
    <Section
      id="diagnose"
      kicker="DIAGNOSE"
      title={
        <>
          چرا کانفیگ‌های پروژه‌ات{" "}
          <span className="text-ember">در ایران نیمه‌کاره</span> می‌مانند؟
        </>
      }
      desc="پروژه‌ی vp-n-server معماری درستی دارد؛ اما چهار دیوار توی راهش است. سه تای آن مستقیم تو به تحت سماجت کلاینت و لایه‌ی اتصال حل می‌شود، چهارمی با یک پچ کوچک سروری."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {PROBLEMS.map((p, i) => (
          <Reveal key={p.n} delay={i * 0.08}>
            <div className="panel group relative h-full overflow-hidden rounded-2xl p-6">
              <span className="outline-text absolute -top-3 left-3 font-mono text-6xl font-bold">
                {p.n}
              </span>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-edge2 bg-pane2 text-volt transition-shadow group-hover:shadow-[0_0_24px_rgba(61,250,168,0.25)]">
                <p.icon size={20} />
              </div>
              <h3 className="mb-2.5 text-lg font-bold text-ink">{p.title}</h3>
              <p className="mb-4 text-[13.5px] leading-7 text-mute">{p.desc}</p>
              <div className="inline-flex items-center gap-2 rounded-lg bg-volt/8 px-3 py-1.5 text-[11.5px] font-semibold text-volt">
                <Check size={13} />
                {p.fix}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15} className="mt-8">
        <PacketDiagram />
      </Reveal>
    </Section>
  );
}
