import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { ToastKind } from "../lib/toast";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as ToastItem;
      setItems((prev) => [...prev.slice(-2), d]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== d.id));
      }, 2600);
    };
    window.addEventListener("cf-toast", handler);
    return () => window.removeEventListener("cf-toast", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="glass pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl"
          style={{ animation: "toast-in .35s cubic-bezier(.34,1.56,.64,1)" }}
        >
          {t.kind === "ok" && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />}
          {t.kind === "err" && <AlertTriangle className="h-4.5 w-4.5 text-brand-400" />}
          {t.kind === "info" && <Info className="h-4.5 w-4.5 text-sky-400" />}
          <span className="text-white/90">{t.message}</span>
        </div>
      ))}
      <style>{`@keyframes toast-in { from { opacity:0; transform: translateY(16px) scale(.95);} to {opacity:1; transform:none;} }`}</style>
    </div>
  );
}
