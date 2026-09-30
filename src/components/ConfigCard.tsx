import { motion } from "framer-motion";
import { Check, Copy, QrCode } from "lucide-react";
import { toFaDigits, type VlessConfig } from "../lib/vless";

interface Props {
  cfg: VlessConfig;
  i: number;
  copied: boolean;
  onCopy: (text: string, key: string) => void;
  onQr: (link: string) => void;
}

const iconBtn =
  "flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-200 active:scale-95";

export default function ConfigCard({ cfg, i, copied, onCopy, onQr }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.6), ease: [0.22, 0.9, 0.3, 1] }}
      className="group glass relative overflow-hidden rounded-2xl p-4 transition-colors duration-300 hover:border-emerald-400/25"
    >
      <div className="pointer-events-none absolute -start-10 -top-10 size-28 rounded-full bg-emerald-400/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/25 to-cyan-400/15 text-sm font-extrabold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            {toFaDigits(cfg.index)}
          </span>
          <div className="min-w-0">
            <div className="ltr-run mono truncate text-base font-semibold text-emerald-200">
              {cfg.entry}
            </div>
            <div className="ltr-run mono mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-zinc-400">
              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">443 / TLS</span>
              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">WS</span>
              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">fp=chrome</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => onCopy(cfg.link, cfg.id)} className={iconBtn} title="کپی کانفیگ">
            {copied ? <Check className="size-4 text-emerald-300" /> : <Copy className="size-4" />}
          </button>
          <button onClick={() => onQr(cfg.link)} className={iconBtn} title="نمایش QR">
            <QrCode className="size-4" />
          </button>
        </div>
      </div>
      <div className="ltr-run mono relative mt-3 truncate rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5 text-[10px] leading-5 text-zinc-500">
        {cfg.link}
      </div>
    </motion.div>
  );
}
