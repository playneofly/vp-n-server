import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "کانفیگ‌ها با چه پروتکل‌هایی ساخته می‌شوند؟",
    a: "VLESS و Trojan — هر دو روی WebSocket + TLS و هر دو به‌صورت واقعی روی همین سرور کلادفلر اجرا می‌شوند. در حالت «ترکیبی شانسی» هر کانفیگ تصادفی یکی از این دو می‌شود. VMess عمدا پشتیبانی نمی‌شود چون رمزنگاری داخلی‌اش روی کلادفلر قابل اجرای مطمئن نیست و عملا هم منسوخ شده؛ همه‌ی کلاینت‌ها (v2rayNG، Streisand، sing-box، Shadowrocket) هم VLESS و هم Trojan را قبول دارند.",
  },
  {
    q: "آیا کانفیگ‌ها واقعا کار می‌کنند؟",
    a: "بله — به شرط اینکه همین پروژه را طبق راهنمای بالا روی Cloudflare Pages (یا Worker) دپلوی کرده باشی و UUID سایت با متغیر محیطی سرور یکی باشد. موتور پروکسی داخل پوشه‌ی functions پروژه است و کلادفلر خودکار اجرایش می‌کند. سایت به‌تنهایی فقط لینک‌ساز است؛ جادو در ترکیب سایت + functions است.",
  },
  {
    q: "چرا به جای آی‌پی سایت، آی‌پی‌های دیگر داخل کانفیگ گذاشته می‌شود؟",
    a: "کلادفلر مسیر را با SNI/Host تعیین می‌کند، نه آی‌پی مقصد. پس هر آی‌پی یا دامنه‌ای که پشت کلادفلر باشد (آی‌پی‌های «تمیز») می‌تواند ورودی باشد و ترافیک به سایت تو برسد. این ترفند باعث می‌شود حتی اگر یک آی‌پی کند یا محدود شد، بقیه وصل شوند.",
  },
  {
    q: "محدودیت تعداد کانفیگ چقدر است؟",
    a: "هیچ محدودیتی نیست — همه‌ی لینک‌ها داخل مرورگر خودت ساخته می‌شوند و چیزی به سرور ارسال نمی‌شود. تا ۲۰۰۰ کانفیگ در هر نوبت می‌توانی بسازی و نامحدود تکرارش کنی. در کلاینت هم می‌توانی لینک اشتراک (/sub/) را بگذاری تا لیست خودکار مدیریت شود.",
  },
  {
    q: "هزینه‌اش چقدر است؟",
    a: "صفر. پلن رایگان کلادفلر شامل Pages، Pages Functions و WebSocket است و روزانه ۱۰۰ هزار درخواست رایگان می‌دهد که برای مصرف شخصی از همه‌ی دستگاه‌هایت کفایت می‌کند.",
  },
  {
    q: "چطور مطمئن شوم همه‌ی کانفیگ‌ها پینگ دارند و قطع نیستند؟",
    a: "دکمه‌ی سبز «اسکن زنده» را بزن: سایت همان‌جا از داخل اینترنت خودت (اپراتور خودت، همان لحظه) همه‌ی دامنه‌ها و آی‌پی‌های کاندید را پینگ می‌گیرد، آی‌پی‌های edge سالم را از DNS کلادفلر استخراج می‌کند، پورت‌های باز را هم تست می‌کند و بعد کانفیگ‌ها فقط از مسیرهای تأییدشده ساخته می‌شوند. علاوه بر آن، نشان وضعیت بالای فرم خودکار چک می‌کند که موتور پروکسی دپلوی شده و کلیدها با سرور یکی‌اند.",
  },
  {
    q: "اگر بعضی کانفیگ‌ها وصل نشدند چه کار کنم؟",
    a: "اول «اسکن زنده» را دوباره بزن — وضعیت شبکه اپراتورها لحظه‌ای عوض می‌شود. اگر باز مشکل داشتی، آی‌پی‌های تمیز مخصوص اپراتور خودت (همراه‌اول، ایرانسل، مخابرات…) را با ابزارهای اسکن آی‌پی کلادفلر پیدا کن و در کادر «آی‌پی‌های سفارشی» بگذار تا سازنده فقط از لیست تو استفاده کند.",
  },
  {
    q: "اطلاعات من کجا می‌رود؟",
    a: "هیچ‌جا. UUID و تنظیمات فقط در localStorage مرورگر خودت ذخیره می‌شوند. پروکسی هم روی اکانت کلادفلر خودت است؛ یعنی کل زنجیره مال توست و واسطه‌ای در کار نیست.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-28 px-4 py-16 md:py-24">
      <Reveal>
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-bold tracking-wider text-brand-400">
          <MessageCircleQuestion className="h-4 w-4" />
          سوالات متداول
        </div>
        <h2 className="text-center text-3xl font-black text-white md:text-5xl">هرچه باید بدانی</h2>
      </Reveal>

      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={i} delay={i * 60}>
              <div
                className={`glass overflow-hidden rounded-2xl transition-all duration-300 ${
                  isOpen ? "border-brand-500/30" : ""
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
                >
                  <span className={`text-[15px] font-extrabold transition ${isOpen ? "text-brand-300" : "text-white"}`}>
                    {f.q}
                  </span>
                  <span
                    className={`glass-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white/60 transition-transform duration-300 ${
                      isOpen ? "rotate-180 border-brand-500/40 text-brand-300" : ""
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-400 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[13px] leading-8 text-white/55">{f.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
