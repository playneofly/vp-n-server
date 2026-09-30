import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  link: string | null;
  onClose: () => void;
}

export default function QrModal({ link, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
    if (!link) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [link, onClose]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <AnimatePresence>
      {link && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-[min(92vw,380px)] rounded-3xl border border-emerald-400/20 bg-[#08110e] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            <button
              onClick={onClose}
              className="absolute end-4 top-4 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition hover:text-zinc-100"
              aria-label="بستن"
            >
              <X className="size-4" />
            </button>
            <p className="text-center text-sm font-bold text-zinc-200">
              اسکن با v2rayNG / Streisand / sing-box
            </p>
            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3.5 ring-4 ring-emerald-400/15">
              <QRCodeSVG value={link} size={236} level="M" fgColor="#062a1f" bgColor="#ffffff" />
            </div>
            <div className="ltr-run mono mt-4 truncate rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-center text-[10px] leading-5 text-zinc-500">
              {link}
            </div>
            <button onClick={copy} className="btn-forge mt-4 w-full py-3 text-sm">
              {copied ? (
                <>
                  <Check className="size-4" /> کپی شد
                </>
              ) : (
                <>
                  <Copy className="size-4" /> کپی کانفیگ
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
