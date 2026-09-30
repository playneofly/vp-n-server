import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Menu, X, Radar } from "lucide-react";

const LINKS = [
  { href: "#diagnose", label: "تشخیص" },
  { href: "#scan", label: "اسکنر زنده" },
  { href: "#forge", label: "ساخت کانفیگ" },
  { href: "#fragment", label: "فرگمنت" },
  { href: "#patch", label: "کیت پچ" },
  { href: "#deploy", label: "دپلوی" },
  { href: "#faq", label: "سوالات" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass shadow-[0_10px_40px_-20px_rgba(0,0,0,0.9)]" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-edge2 bg-pane text-volt transition-shadow group-hover:shadow-[0_0_20px_rgba(61,250,168,0.35)]">
            <Zap size={17} />
          </span>
          <span className="font-mono text-sm font-bold tracking-wider text-ink" dir="ltr">
            CF·FORGE <span className="text-volt">//IR</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-mute transition-colors hover:text-volt"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#scan"
            className="hidden items-center gap-2 rounded-lg bg-volt px-4 py-2 text-[13px] font-bold text-[#04140c] transition-all hover:shadow-[0_0_24px_rgba(61,250,168,0.45)] sm:inline-flex"
          >
            <Radar size={15} />
            اسکن سریع
          </a>
          <button
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-edge text-mute lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="منو"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass overflow-hidden border-t border-edge lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-mute transition-colors hover:bg-volt/5 hover:text-volt"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
