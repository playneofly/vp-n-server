import { type ReactNode, useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, FileCode2 } from "lucide-react";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export function Reveal({
  children,
  delay = 0,
  className,
  y = 26,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Section({
  id,
  kicker,
  title,
  desc,
  children,
}: {
  id: string;
  kicker: string;
  title: ReactNode;
  desc?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative mx-auto w-full max-w-6xl scroll-mt-28 px-5 py-24 sm:px-8">
      <Reveal>
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.25em] text-volt" dir="ltr">
            [ {kicker} ]
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-edge2 to-transparent" />
        </div>
        <h2 className="max-w-3xl text-3xl font-extrabold leading-snug text-ink sm:text-4xl">
          {title}
        </h2>
        {desc && <p className="mt-4 max-w-2xl leading-8 text-mute">{desc}</p>}
      </Reveal>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export function CopyBtn({
  text,
  label = "کپی",
  className = "",
  onCopied,
}: {
  text: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const done = await copyText(text);
        if (done) {
          setOk(true);
          onCopied?.();
          setTimeout(() => setOk(false), 1400);
        }
      }}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 font-mono text-[11px] transition-all hover:border-volt hover:text-volt ${
        ok ? "border-volt text-volt" : "text-mute"
      } ${className}`}
    >
      {ok ? <Check size={13} /> : <Copy size={13} />}
      {ok ? "کپی شد" : label}
    </button>
  );
}

export function CodeBlock({
  title,
  code,
  maxH = 340,
  tone = "volt",
}: {
  title: string;
  code: string;
  maxH?: number;
  tone?: "volt" | "ember";
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-[#050c08]" dir="ltr">
      <div className="flex items-center justify-between border-b border-edge bg-pane2/70 px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[11px] text-mute">
          <FileCode2 size={13} className={tone === "volt" ? "text-volt" : "text-ember"} />
          {title}
        </div>
        <div className="flex items-center gap-2" dir="rtl">
          <CopyBtn text={code} />
        </div>
      </div>
      <pre
        className="code-scroll overflow-auto p-4 font-mono text-[11.5px] leading-6 text-[#b8e6cf]"
        style={{ maxHeight: maxH }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Pill({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] ${
        active ? "border-volt bg-volt/10 text-volt" : "border-edge text-mute"
      }`}
    >
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-edge bg-pane2 px-2 py-0.5 font-mono text-[10px] text-dim">
      {children}
    </span>
  );
}
