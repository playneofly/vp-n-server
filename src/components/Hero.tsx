import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Radar, Package, ShieldOff, Activity, ArrowDown, Ban, Wifi } from "lucide-react";

const SCRIPT = [
  { text: "$ ping 104.16.60.8:443  // ورودی پیش‌فرض", cls: "text-mute" },
  { text: "  timeout — مسیر توسط اپراتور شناسایی و قطع شد", cls: "text-blood" },
  { text: "$ apply fix: fragment=ON · port=8443 · clean-ip", cls: "text-mute" },
  { text: "$ ping time.is:8443", cls: "text-mute" },
  { text: "  96ms — TLS OK — SNI نامرئی برای DPI — متصل", cls: "text-volt" },
];

function Terminal() {
  const [lines, setLines] = useState<string[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    let li = 0;
    let ci = 0;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!alive) return;
      if (li >= SCRIPT.length) {
        timer = setTimeout(() => {
          if (!alive) return;
          setLines([]);
          setCurrent("");
          li = 0;
          ci = 0;
          tick();
        }, 4200);
        return;
      }
      const line = SCRIPT[li].text;
      if (ci < line.length) {
        ci += 2;
        setCurrent(line.slice(0, ci));
        timer = setTimeout(tick, li === 1 || li === 4 ? 34 : 16);
      } else {
        setLines((p) => [...p, line]);
        setCurrent("");
        li++;
        ci = 0;
        timer = setTimeout(tick, li === 2 || li === 4 ? 900 : 320);
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="panel relative overflow-hidden rounded-2xl">
      <div className="scanline" />
      <div className="flex items-center justify-between border-b border-edge px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blood/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ember/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-volt/70" />
        </div>
        <span className="font-mono text-[10px] tracking-widest text-dim" dir="ltr">
          vp-n-server — iran.patch.log
        </span>
      </div>
      <div dir="ltr" className="min-h-[190px] p-5 text-left font-mono text-[12px] leading-7">
        {lines.map((l, i) => (
          <div key={i} className={SCRIPT[i].cls}>
            {l}
          </div>
        ))}
        <div className={`caret ${current.startsWith("  ") ? "" : ""} ${
          lines.length <= 1 ? (current.includes("timeout") ? "text-blood" : "text-mute") : SCRIPT[Math.min(lines.length, 4)].cls
        }`}>
          {current}
        </div>
      </div>
      <div className="flex items-center gap-4 border-t border-edge px-5 py-3 font-mono text-[10px] text-dim">
        <span className="flex items-center gap-1.5">
          <Activity size={11} className="text-volt" /> FRAGMENT: ON
        </span>
        <span className="flex items-center gap-1.5">
          <Wifi size={11} className="text-volt" /> PORT: 8443/2096
        </span>
        <span className="flex items-center gap-1.5">
          <Ban size={11} className="text-ember" /> DPI: BYPASSED
        </span>
      </div>
    </div>
  );
}

const ISPS = [
  "همراه اول",
  "ایرانسل",
  "مخابرات ایران",
  "رایتل",
  "شاتل",
  "های‌وب (آسیاتک)",
  "پارس‌آنلاین",
  "نت‌میگ",
  "دیتک",
  "پیشگامان",
];

export default function Hero() {
  return (
    <div id="top" className="relative overflow-hidden pt-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-edge bg-pane px-4 py-1.5 text-[12px] font-medium text-volt"
            >
              <ShieldOff size={13} />
              پچ «سازگار با اینترنت ایران» برای vp-n-server
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-black leading-[1.35] text-ink sm:text-5xl sm:leading-[1.3]"
            >
              کانفیگ‌هات فقط با
              <span className="text-ember"> آی‌پی آمریکا</span> پینگ می‌گیرن؟
              <br />
              <span className="text-glow text-volt">اینجا ایرانی‌شون کن.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl leading-9 text-mute"
            >
              مشکل پروژه‌ات تنظیمات کلادفلر نیست؛ اپراتورها توی ایران رنج‌های خام را می‌بندند و
              هلوی TLS را صید می‌کنند. راه‌حل سه‌تکه است:
              <span className="text-ink"> اسکن زنده از شبکه‌ی خودت</span>،
              <span className="text-ink"> پورت‌های جایگزین</span> و
              <span className="text-volt"> فرگمنت کردن ClientHello</span>.
              همه را همین‌جا یکجا انجام بده.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <a
                href="#scan"
                className="inline-flex items-center gap-2.5 rounded-xl bg-volt px-6 py-3.5 text-sm font-extrabold text-[#04140c] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgba(61,250,168,0.6)]"
              >
                <Radar size={17} />
                اسکن زنده از شبکه‌ی من
              </a>
              <a
                href="#patch"
                className="inline-flex items-center gap-2.5 rounded-xl border border-edge2 px-6 py-3.5 text-sm font-bold text-ink transition-all hover:border-volt hover:text-volt"
              >
                <Package size={17} />
                دانلود کیت پچ گیت‌هاب
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] text-dim"
              dir="ltr"
            >
              <span>[[PATH]].JS — PATCHED</span>
              <span>VLESS + WS + TLS</span>
              <span>FRAGMENT READY</span>
              <span>PORTS 443→2096</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="floaty"
          >
            <Terminal />
          </motion.div>
        </div>
      </div>

      {/* ISP marquee */}
      <div className="relative mt-20 border-y border-edge bg-pane/40 py-4">
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="marquee-track flex w-max items-center gap-10" dir="ltr">
            {[...ISPS, ...ISPS].map((isp, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap text-sm font-semibold text-dim">
                {isp}
                <span className="h-1 w-1 rounded-full bg-volt/50" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl justify-center px-5 py-10">
        <a href="#diagnose" className="flex flex-col items-center gap-2 text-dim transition-colors hover:text-volt">
          <span className="text-[11px] font-medium">چرا الان کار نمی‌کند؟</span>
          <ArrowDown size={16} className="animate-bounce" />
        </a>
      </div>
    </div>
  );
}
