import { Zap, GitBranch, HeartHandshake } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-edge bg-pane/60">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-edge2 bg-pane text-volt">
              <Zap size={16} />
            </span>
            <div>
              <div className="font-mono text-sm font-bold text-ink" dir="ltr">
                CF·FORGE <span className="text-volt">//IR</span>
              </div>
              <div className="mt-0.5 text-[11px] text-dim">
                پچ سازگاری با اینترنت ایران — برای پروژه‌ی vp-n-server
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[12px] text-dim">
            <a
              href="https://github.com/playneofly/vp-n-server"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-volt"
            >
              <GitBranch size={14} />
              ریپوی اصلی
            </a>
            <span className="inline-flex items-center gap-2">
              <HeartHandshake size={14} className="text-ember" />
              ساخته شده برای اینترنت آزاد
            </span>
          </div>
        </div>

        <p className="mt-8 border-t border-edge/50 pt-6 text-[11.5px] leading-6 text-dim">
          این ابزار برای دسترسی آزاد و قانونی به اینترنت ساخته شده است. مسئولیت استفاده بر عهده‌ی
          کاربر است. آی‌پی‌ها و دامنه‌های کلادفلر مِتعلق به Cloudflare Inc. هستند.
        </p>
      </div>
    </footer>
  );
}
