import { GitBranch, CloudUpload, SlidersHorizontal, Rocket, Link2, Wrench } from "lucide-react";
import { Section, Reveal, CodeBlock, CopyBtn } from "./ui";
import { subUrl } from "../lib/forge";
import { useStore } from "../lib/state";

const STEPS = [
  {
    icon: GitBranch,
    title: "فایل‌ها را جایگزین کن",
    body: "دو فایل کیت پچ (بخش قبل) را داخل ریپوی playneofly/vp-n-server جایگزین و push کن. اسم‌ها عوض نمی‌شود؛ Cloudflare خودش ساخت دوباره را شروع می‌کند.",
  },
  {
    icon: CloudUpload,
    title: "صبر کن Pages بازسازی کند",
    body: "از داشبورد → پروژه‌ات → تب Deployments وضعیت را ببین تا Build سبز شود. معمولا زیر دو دقیقه است.",
  },
  {
    icon: SlidersHorizontal,
    title: "متغیرهای محیطی را بزن",
    body: "Settings → Environment variables → Production: مقدار UUID (بدون تغییر)، PROXYIP (با کاما) و FALLBACK_SITE را وارد کن. حتما بعدش از تب Deployments گزینه Retry deployment را بزن.",
  },
  {
    icon: Link2,
    title: "سابسکریپشن چندپورتی را وصل کن",
    body: "لینک /sub/UUIDت را در v2rayN یا Hiddify به‌عنوان اشتراک اضافه کن؛ الان ۶۰ کانفیگ می‌گیری: ۲۰ ورودی × ۳ پورت.",
  },
  {
    icon: Wrench,
    title: "فرگمنت را روشن کن",
    body: "بدون این قدم هنوز ممکن است DPI هلو را شکار کند. مقادیر JSON آماده را از بخش «فرگمنت» بردار و روشنش کن؛ بعد با Test server real delay از بین ساب بهترین را نگه دار.",
  },
  {
    icon: Rocket,
    title: "جایزه: دامنه‌ی شخصی",
    body: "اگر دامنه داری، در Pages → Custom domains وصلش کن تا آدرس pages.dev کمتر در معرض فیلتر باشد؛ از Custom domains معمولی (نه Workers route) بایاس استفاده شود.",
  },
];

export default function Guide() {
  const { domain, uuid } = useStore();
  const sub = subUrl(domain || "your-project.pages.dev", uuid);

  return (
    <Section
      id="deploy"
      kicker="DEPLOY"
      title={
        <>
          استقرار پچ — <span className="text-volt">۱۵ دقیقه تا کانفیگ سالم</span>
        </>
      }
      desc="مسیر کامل از push تا اتصال اول؛ فرض بر این است که پروژه‌ات الان روی Cloudflare Pages بالاست."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.07}>
            <div className="panel group relative h-full rounded-2xl p-6">
              <span className="outline-text absolute -top-2 left-4 font-mono text-5xl font-bold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-edge2 bg-pane2 text-volt transition-shadow group-hover:shadow-[0_0_24px_rgba(61,250,168,0.25)]">
                <s.icon size={19} />
              </div>
              <h3 className="mb-2 text-[15px] font-extrabold text-ink">{s.title}</h3>
              <p className="text-[12.5px] leading-7 text-mute">{s.body}</p>
              {i === 3 && (
                <div className="mt-4">
                  <div className="mb-2 font-mono text-[10px] text-dim" dir="ltr">
                    {sub}
                  </div>
                  <CopyBtn text={sub} label="کپی لینک ساب" />
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-8">
          <CodeBlock
            title="optional — standalone worker route"
            code={`cd worker
npx wrangler login
npx wrangler deploy
# afterwards set env vars UUID / PROXYIP / FALLBACK_SITE
# in Workers → Settings → Variables`}
            maxH={180}
            tone="ember"
          />
        </div>
      </Reveal>
    </Section>
  );
}
