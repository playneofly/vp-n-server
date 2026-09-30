import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Section, Reveal } from "./ui";

const FAQ = [
  {
    q: "کانفیگ پینگ دارد ولی صفحه‌ای لود نمی‌شود؛ چرا؟",
    a: "پینگ TCP/TLS یعنی ورودی باز است، اما لود نشدن یعنی بعد از هندشیک، ترافیک شناسایی و قطع می‌شود. این امضای کلاسیک SNI sniffing است و جوابش فقط فرگمنت است. پروفایل «استاندارد» را فعال و دوباره تست کن.",
  },
  {
    q: "پینگ -1 می‌دهد اما باز هم کار می‌کند. مشکل کجاست؟",
    a: "در v2rayN نوع تست مهم است: حالت «TCPing» از دستگاه خودت به آی‌پی می‌زند و ممکن است اپراتورت همان را بسته باشد، ولی مسیر واقعی (با SNI + TLS + فرگمنت) سالم رد شود. همیشه با «Test server real delay» قضاوت کن.",
  },
  {
    q: "سرعت خوبه ولی هر چند ساعت قطع می‌شود!",
    a: "ورودی‌ات دارد کش می‌شود و بعد فیلتر. دو راه: دامنه‌ی شخصی بزن، و ورودی‌ها را از دامنه‌های تمیز گرداننده (متغیر) انتخاب کن، نه یک آی‌پی ثابت. اسکنر این صفحه را هر بار که شبکه‌ات را عوض می‌کنی بزن و ساب را آپدیت کن.",
  },
  {
    q: "pages.dev گاهی برای بعضی اپراتورها کلا صفحه‌باز نمی‌کند!",
    a: "دامنه‌ی کارگر در قائله‌های فیلترینگ دچار اختلاط می‌شود. راه‌حل دائمی: Custom domain پشت کلادفلر. موقت: ورودی‌هایی مثل time.is یا speed.cloudflare.com با Host همان pages.dev — که همین مولد هم می‌سازد.",
  },
  {
    q: "Frament در لینک اشتراک نیست؛ یعنی ساب بی‌فایده است؟",
    a: "خیر. فرگمنت یک رفتار سمت کلاینت است نه بخشی از استاندارد لینک vless؛ وقتی در v2rayN/Hiddify سراسری روشنش کنی روی همه کانفیگ‌های ساب اعمال می‌شود. Hiddify حتی یک حالت built-in دارد که نیازی به JSON ندارد.",
  },
  {
    q: "PROXYIP دقیقا چه می‌کند و از کجا بگیرمش؟",
    a: "وقتی ورکر می‌خواهد به مقصد مستقیم وصل شود و socket fail می‌شود، بجای اول قطع، از یک ورکر/سرور رله عبور می‌کند. رله‌های عمومی در جامعه (مثل خانواده fxxk.dedyn.io) خوب آزمون شده‌اند؛ بهتر است رله‌ی خودت را هم بسازی و با کاما کنارشان بگذاری.",
  },
  {
    q: "پروژه با پلن رایگان کلادفلر برای چند نفر جواب می‌دهد؟",
    a: "سقف ۱۰۰هزار درخواست/روز برای Workers/Pages با مصرف معمولی (وب‌گردی، یوتیوب تکی) برای چند کاربر کافی است؛ برای تعداد بیشتر یا استریم سنگین، ترافیک WebSocket شمردن متفاوت می‌شود و به‌صرفه‌تر است هر نفر ورکر خودش را بسازد.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      kicker="FAQ"
      title={
        <>
          سوال‌هایی که <span className="text-volt">نصف‌وب‌شب</span> می‌پرسید
        </>
      }
    >
      <div className="space-y-3">
        {FAQ.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={i} delay={i * 0.04}>
              <div
                className={`panel overflow-hidden rounded-xl transition-colors ${
                  isOpen ? "border-edge2" : ""
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-right"
                >
                  <HelpCircle size={16} className={`shrink-0 ${isOpen ? "text-volt" : "text-dim"}`} />
                  <span className={`flex-1 text-[14px] font-bold ${isOpen ? "text-volt" : "text-ink"}`}>
                    {f.q}
                  </span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown size={16} className="text-dim" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <p className="border-t border-edge px-5 py-4 pb-5 text-[13px] leading-8 text-mute">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
