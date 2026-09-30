import { useState } from "react";
import {
  BookOpenText,
  Check,
  CloudCog,
  Copy,
  GitBranch,
  KeyRound,
  Rocket,
  Server,
  Settings2,
  Workflow,
} from "lucide-react";
import Reveal from "./Reveal";
import { toast } from "../lib/toast";
import { DEFAULT_UUID } from "../lib/vless";

export default function Guide() {
  return (
    <section id="guide" className="relative mx-auto max-w-6xl scroll-mt-28 px-4 py-16 md:py-24">
      <Reveal>
        <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-brand-400">
          <BookOpenText className="h-4 w-4" />
          راهنمای دپلوی
        </div>
        <h2 className="text-3xl font-black text-white md:text-5xl">
          ۵ دقیقه تا داشتن سرور رایگانِ خودت
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
          این پروژه دو بخش دارد: <b className="text-white/80">رابط کاربری</b> (همین صفحه) و{" "}
          <b className="text-white/80">موتور پروکسی</b> که داخل پوشه‌ی{" "}
          <code className="num rounded bg-white/8 px-1.5 py-0.5 text-[11px] text-brand-300">functions</code>{" "}
          قرار دارد. کلادفلر هر دو را با هم و به‌صورت خودکار دپلوی می‌کند — کانفیگ‌ها همین‌طوری واقعی کار می‌کنند.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <StepCard
          delay={0}
          num="۱"
          icon={<GitBranch className="h-5 w-5" />}
          title="آپلود پروژه در گیت‌هاب"
          body={
            <>
              <p>یک مخزن (Repository) جدید در github.com بساز و فایل‌های پروژه را آپلود کن:</p>
              <CodeBlock
                code={`git init
git add .
git commit -m "cf-forge"
git remote add origin https://github.com/USER/cf-forge.git
git push -u origin main`}
              />
              <p className="text-white/40">
                یا ساده‌تر: در گیت‌هاب <b>New repository</b> را بزن و فایل‌ها را با گزینه‌ی «uploading an existing file» بکش و رها کن.
              </p>
            </>
          }
        />

        <StepCard
          delay={80}
          num="۲"
          icon={<CloudCog className="h-5 w-5" />}
          title="اتصال به Cloudflare Pages"
          body={
            <>
              <p>
                وارد <span className="num text-brand-300">dash.cloudflare.com</span> شو و از منوی{" "}
                <b>Workers & Pages</b> گزینه‌ی <b>Create</b> ← تب <b>Pages</b> ←{" "}
                <b>Connect to Git</b> را انتخاب کن و مخزن را وصل کن. بعد این تنظیمات را بزن:
              </p>
              <SettingsTable
                rows={[
                  ["Framework preset", "Vite"],
                  ["Build command", "npm run build"],
                  ["Build output directory", "dist"],
                ]}
              />
              <p className="text-white/40">
                <b>Save and Deploy</b> را بزن. پوشه‌ی{" "}
                <code className="num rounded bg-white/8 px-1.5 py-0.5 text-[11px] text-brand-300">functions</code>{" "}
                خودکار شناسایی و موتور پروکسی فعال می‌شود — کار دیگری لازم نیست.
              </p>
              <div className="rounded-xl border border-brand-500/25 bg-brand-500/8 p-3 text-[11.5px] leading-6 text-brand-300/90">
                دقت کن حتما <b>Vite</b> انتخاب شده باشد، نه VitePress! اگر قبلا با تنظیمات اشتباه دپلوی
                کردی: برو به <b>Settings ← Builds & deployments</b>، روی ✎ بزن، خروجی را{" "}
                <span className="num font-bold">dist</span> کن و بعد از تب <b>Deployments</b> گزینه‌ی{" "}
                <b>Retry deployment</b> را بزن.
              </div>
            </>
          }
        />

        <StepCard
          delay={120}
          num="۳"
          icon={<KeyRound className="h-5 w-5" />}
          title="تنظیم UUID (خیلی مهم)"
          body={
            <>
              <p>
                داخل پروژه‌ی Pages برو به <b>Settings</b> ← <b>Environment variables</b> و برای{" "}
                <b>Production</b> این متغیر را اضافه کن:
              </p>
              <SettingsTable rows={[["Variable name", "UUID"], ["Value", "یک UUID تصادفی (از سازنده بالا بردار)"]]} />
              <p className="text-white/40">
                ⚠️ بعد از ذخیره، حتما از تب <b>Deployments</b> گزینه‌ی <b>Retry deployment</b> /{" "}
                <b>Create new deployment</b> را بزن تا متغیر اعمال شود. اگر متغیر نگذاری، مقدار پیش‌فرض
                پروژه استفاده می‌شود:
              </p>
              <CodeBlock code={DEFAULT_UUID} />
              <p className="text-white/40">
                همین UUID را در فیلد «کلید UUID» صفحه‌ی کانفیگ‌ساز وارد کن تا کانفیگ‌ها با سرور هماهنگ باشند.
              </p>
            </>
          }
        />

        <StepCard
          delay={160}
          num="۴"
          icon={<Rocket className="h-5 w-5" />}
          title="استفاده + دامنه‌ی شخصی (اختیاری)"
          body={
            <>
              <p>
                سایتت روی آدرس <span className="num text-brand-300">your-project.pages.dev</span> بالا می‌آید.
                بازش کن، تعداد بده و کانفیگ بساز. لینک اشتراک خودکار:
              </p>
              <CodeBlock code={`https://your-project.pages.dev/sub/YOUR-UUID`} />
              <p className="text-white/40">
                از تب <b>Custom domains</b> می‌توانی دامنه‌ی شخصی خودت را وصل کنی (پیشنهاد می‌شود — پایدارتر است).
                آنوقت همان دامنه را در فرم کانفیگ‌ساز بگذار.
              </p>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/8 p-3 text-[11.5px] leading-5 text-emerald-300/90">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                تمام شد! کانفیگ‌هایی که می‌سازی مستقیما به موتور پروکسیِ همین دامنه وصل می‌شوند و واقعی کار می‌کنند.
              </div>
            </> 
          }
        />
      </div>

      {/* alternative worker path */}
      <Reveal delay={200}>
        <div className="glass mt-6 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="glass-soft flex h-11 w-11 items-center justify-center rounded-2xl text-brand-400">
              <Server className="h-5.5 w-5.5" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-white">مسیر جایگزین: Worker جداگانه</h3>
              <p className="text-xs text-white/40">اگر Pages نمی‌خواهی یا می‌خواهی پروکسی از سایت جدا باشد</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="text-[13px] leading-7 text-white/55">
              فایل <code className="num rounded bg-white/8 px-1.5 py-0.5 text-[11px] text-brand-300">worker/worker.js</code>{" "}
              نسخه‌ی مستقلِ آماده است. در داشبورد کلادفلر برو به{" "}
              <b className="text-white/80">Workers</b> ← <b className="text-white/80">Create Worker</b>، محتوای
              فایل را جای‌گذاری کن، Deploy بزن و بعد متغیر <span className="num font-bold text-white/80">UUID</span>{" "}
              را در <b className="text-white/80">Settings ← Variables</b> ست کن. آدرس ورکر
              (<span className="num text-brand-300">name.workers.dev</span>) را در فرم کانفیگ‌ساز وارد کن.
            </div>
            <div>
              <CodeBlock
                code={`# یا با ترمینال (نیازمند Node.js 18+):
cd worker
npx wrangler login
npx wrangler deploy`}
              />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={240}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11.5px] text-white/40">
          <span className="glass-soft flex items-center gap-1.5 rounded-full px-3.5 py-2">
            <Settings2 className="h-3.5 w-3.5 text-brand-400" /> متغیر اختیاری دیگر: PROXYIP
          </span>
          <span className="glass-soft flex items-center gap-1.5 rounded-full px-3.5 py-2">
            <Workflow className="h-3.5 w-3.5 text-brand-400" /> سازگار با v2rayNG · Streisand · sing-box · Shadowrocket
          </span>
        </div>
      </Reveal>
    </section>
  );
}

function StepCard({
  num,
  icon,
  title,
  body,
  delay,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="glass h-full rounded-3xl p-6 md:p-7">
        <div className="flex items-center gap-3">
          <span className="btn-brand num flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-night-900">
            {num}
          </span>
          <h3 className="flex items-center gap-2 text-[17px] font-extrabold text-white">
            {title}
            <span className="text-brand-400/80">{icon}</span>
          </h3>
        </div>
        <div className="mt-4 space-y-3.5 text-[13px] leading-7 text-white/55">{body}</div>
      </div>
    </Reveal>
  );
}

function SettingsTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="glass-soft overflow-hidden rounded-2xl" dir="ltr">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`flex items-center justify-between gap-4 px-4 py-2.5 text-[11.5px] ${
            i !== rows.length - 1 ? "border-b border-white/6" : ""
          }`}
        >
          <span className="num text-white/40">{k}</span>
          <span className="num rounded-lg bg-brand-500/12 px-2.5 py-1 font-bold text-brand-300">{v}</span>
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="group relative" dir="ltr">
      <pre className="glass-soft num overflow-x-auto rounded-2xl p-4 text-[11px] leading-6 text-emerald-200/80">
        {code}
      </pre>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            toast("کپی شد");
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          } catch {
            /* ignore */
          }
        }}
        className="glass-soft absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 opacity-0 transition group-hover:opacity-100 hover:text-white"
      >
        {ok ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
