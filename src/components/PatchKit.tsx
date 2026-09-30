import { useState } from "react";
import { Package, FileCode2, BadgeCheck, LoaderCircle, Download, Table2 } from "lucide-react";
import { PATCH_FILES, GUIDE_MD, downloadPatchZip } from "../lib/patchkit";
import { Section, Reveal, CodeBlock, CopyBtn } from "./ui";

export default function PatchKit() {
  const [zipping, setZipping] = useState(false);
  const [done, setDone] = useState(false);

  const grab = async () => {
    setZipping(true);
    const ok = await downloadPatchZip();
    setZipping(false);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }
  };

  return (
    <Section
      id="patch"
      kicker="PATCH KIT"
      title={
        <>
          کیت پچ برای گیت‌هاب — <span className="text-volt">سه فایل، یک هدف: ایران</span>
        </>
      }
      desc={
        <>
          این‌ها جایگزین آماده‌ی فایل‌های پروژه‌ی تو هستند. موتور پروکسی بازنویسی شده:
          <span className="text-ink"> رله PROXYIP چندتایی</span> برای وقتی اتصال مستقیم fail می‌شود،
          <span className="text-ink"> سایت پوششی FALLBACK_SITE</span> تا ورکرت کمتر لو برود، و
          <span className="text-ink"> لینک اشتراک /sub چندپورتی</span> با fingerprint تصادفی.
          فقط کپی و push کن.
        </>
      }
    >
      <Reveal>
        <div className="panel rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-edge2 bg-pane2 text-volt">
                <Package size={19} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-ink">vp-n-server-iran-patch.zip</div>
                <div className="mt-0.5 font-mono text-[10.5px] text-dim" dir="ltr">
                  functions/[[path]].js · src/lib/cleanIPs.ts · worker/worker.js · PATCH-GUIDE-fa.md
                </div>
              </div>
            </div>
            <button
              onClick={grab}
              disabled={zipping}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-volt px-6 py-3 text-sm font-extrabold text-[#04140c] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgba(61,250,168,0.6)] disabled:opacity-60"
            >
              {zipping ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : done ? (
                <BadgeCheck size={16} />
              ) : (
                <Download size={16} />
              )}
              {done ? "دانلود شد" : "دانلود کیت کامل (ZIP)"}
            </button>
          </div>

          {/* env vars table */}
          <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
            <table className="w-full text-right text-[12.5px]">
              <thead>
                <tr className="border-b border-edge bg-pane2/60 font-mono text-[10.5px] text-dim">
                  <th className="px-4 py-2.5 font-medium">متغیر محیطی</th>
                  <th className="px-4 py-2.5 font-medium">مقدار پیشنهادی</th>
                  <th className="px-4 py-2.5 font-medium">چه کاری می‌کند</th>
                </tr>
              </thead>
              <tbody className="text-mute">
                <tr className="border-b border-edge/50">
                  <td className="px-4 py-2.5 font-mono text-volt" dir="ltr">UUID</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]" dir="ltr">همان UUID فعلی‌ات</td>
                  <td className="px-4 py-2.5">کلید احراز VLESS؛ بدون تغییر</td>
                </tr>
                <tr className="border-b border-edge/50">
                  <td className="px-4 py-2.5 font-mono text-volt" dir="ltr">PROXYIP</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]" dir="ltr">proxyip.sg.fxxk.dedyn.io:443,104.16.60.8:443</td>
                  <td className="px-4 py-2.5">رله جایگزین با جداکننده کاما؛ وقتی اتصال مستقیم fail شد</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-volt" dir="ltr">FALLBACK_SITE</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]" dir="ltr">www.speedtest.net</td>
                  <td className="px-4 py-2.5">پوشش: بازدیدکننده‌ی غیروب‌سوکت یک سایت واقعی را می‌بیند</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-dim">
            <Table2 size={12} className="text-ember" />
            بعد از تنظیم متغیرها حتما
            <span className="font-mono text-[10.5px] text-ink"> Deployments → Retry deployment </span>
            بزن تا اعمال شوند.
          </div>
        </div>
      </Reveal>

      {/* files */}
      <div className="mt-8 space-y-6">
        {PATCH_FILES.map((f, i) => (
          <Reveal key={f.path} delay={i * 0.08}>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <FileCode2 size={15} className="text-volt" />
              <span className="text-sm font-bold text-ink">{f.title}</span>
              <span className="font-mono text-[10.5px] text-dim" dir="ltr">{f.path}</span>
              <span className="text-[11px] text-dim">{f.desc}</span>
            </div>
            <CodeBlock title={f.path} code={f.code} maxH={300} />
          </Reveal>
        ))}

        <Reveal delay={0.12}>
          <div className="mb-3 flex items-center gap-3">
            <FileCode2 size={15} className="text-ember" />
            <span className="text-sm font-bold text-ink">راهنمای پچ (فارسی)</span>
            <CopyBtn text={GUIDE_MD} label="کپی راهنما" />
          </div>
          <CodeBlock title="PATCH-GUIDE-fa.md" code={GUIDE_MD} maxH={300} tone="ember" />
        </Reveal>
      </div>
    </Section>
  );
}
