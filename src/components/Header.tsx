import { useEffect, useState } from "react";
import { Zap, Rocket, BookOpenText, HelpCircle } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 2.89-.39c.98 0 1.97.13 2.89.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2.5" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 ${
            scrolled ? "glass" : "border border-transparent"
          }`}
        >
          <a href="#top" className="group flex items-center gap-3">
            <span className="btn-brand flex h-10 w-10 items-center justify-center rounded-xl text-night-900">
              <Zap className="h-5 w-5" strokeWidth={2.6} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-extrabold tracking-tight text-white">
                کارخانه کانفیگ ابری
              </span>
              <span className="num text-[10px] font-bold uppercase tracking-[0.3em] text-brand-400">
                CF FORGE
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="#generator" icon={<Rocket className="h-4 w-4" />} label="کانفیگ‌ساز" />
            <NavLink href="#guide" icon={<BookOpenText className="h-4 w-4" />} label="راهنمای دپلوی" />
            <NavLink href="#faq" icon={<HelpCircle className="h-4 w-4" />} label="سوالات" />
          </nav>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="glass-soft flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-white/80 transition hover:border-brand-500/50 hover:text-white"
          >
            <GithubIcon className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">گیت‌هاب</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white"
    >
      {icon}
      {label}
    </a>
  );
}
