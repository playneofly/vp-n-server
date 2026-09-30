import { ShieldCheck, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/6">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="btn-brand flex h-9 w-9 items-center justify-center rounded-xl text-night-900">
              <Zap className="h-4.5 w-4.5" strokeWidth={2.6} />
            </span>
            <div>
              <div className="text-sm font-extrabold text-white">کارخانه کانفیگ ابری</div>
              <div className="num text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                CF Forge · Cloudflare Pages
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11.5px] leading-5 text-white/40">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/70" />
            فقط برای استفاده‌های قانونی و شخصی؛ مسئولیت بهره‌برداری بر عهده‌ی کاربر است.
          </div>
        </div>
      </div>
    </footer>
  );
}
