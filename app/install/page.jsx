import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { pageMeta } from '@/lib/seo';
import WebFlasher from '@/components/WebFlasher';
import FirmwareVersions from '@/components/FirmwareVersions';
import L from '@/components/L';

// Technician tools: the latest firmware per board, and flashing a board from
// the browser. These used to sit on the public download page; they're for the
// person fitting a unit, so they live here — linked from the footer, kept out
// of search results, and blocked in robots.txt.
export const metadata = pageMeta({
  title: 'أدوات الفنيين — Installer tools',
  description: 'أدوات الفنيين المعتمدين لتجهيز وحدات كوش سمارت. Tools for KUSH SMART installers.',
  path: '/install/',
  noindex: true,
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

export default function InstallPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <header className="page-head">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <span className="eyebrow"><L ar="للفنيين" en="For installers" /></span>
          <h1 data-ar="">أدوات <span className="accent">الفنيين</span></h1>
          <h1 data-en="">Installer <span className="accent">tools</span></h1>
          <L tag="p" style={{ maxWidth: 580, margin: '0 auto' }}
            ar="تجهيز وحدات كوش سمارت قبل تسليمها. إن كنت صاحب منزل، فكل ما تحتاجه موجود في التطبيق والدليل."
            en="Preparing KUSH SMART units before handover. If you're a homeowner, everything you need is in the app and the guide." />
        </div>
      </header>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap" style={{ maxWidth: '760px' }}>
          <div className="h-center" style={{ marginBottom: '20px' }}>
            <span className="eyebrow"><L ar="أحدث الإصدارات" en="Latest releases" /></span>
            <L tag="h2" ar="الإصدارات المنشورة" en="Published versions" />
            <L tag="p" ar="أحدث إصدار منشور لكل نوع من الوحدات. تُحدَّث الوحدات المركّبة إليه لاسلكيًا من التطبيق."
              en="The newest published version for each kind of unit. Installed units update to it wirelessly from the app." />
          </div>
          <div className="card">
            <FirmwareVersions />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap" style={{ maxWidth: '900px' }}>
          <div className="h-center" style={{ marginBottom: '30px' }}>
            <span className="eyebrow"><L ar="تجهيز وحدة جديدة" en="Preparing a new unit" /></span>
            <L tag="h2" ar="ثبّت البرنامج على الوحدة من المتصفح" en="Install the software from your browser" />
            <L tag="p" ar="وصّل الوحدة بالكمبيوتر بكابل USB وثبّت أحدث إصدار بضغطة واحدة — دون تثبيت أي برنامج."
              en="Connect the unit to a computer over USB and install the latest version in one click — nothing to install on the computer." />
          </div>

          <div className="card">
            <L tag="h3" ar="الخطوات" en="Steps" />
            <ol className="steps" data-ar="">
              <li>وصّل الوحدة بالكمبيوتر بكابل USB يدعم نقل البيانات.</li>
              <li>اختر نوع الوحدة، ثم اضغط <b>«ارفع السوفت وير الآن»</b>.</li>
              <li>اختر منفذ الوحدة من النافذة التي تظهر، ثم <b>Connect</b>.</li>
              <li>اضغط <b>Install</b> وانتظر حتى يكتمل — <b>لا تفصل الكابل أثناء التثبيت</b>.</li>
              <li>أعد تشغيل الوحدة، ثم أضِفها من التطبيق واضبط إعدادها قبل التسليم.</li>
            </ol>
            <ol className="steps" data-en="">
              <li>Connect the unit to the computer with a USB cable that carries data.</li>
              <li>Pick the kind of unit, then press <b>“Flash now”</b>.</li>
              <li>Choose the unit's port in the window that opens, then <b>Connect</b>.</li>
              <li>Press <b>Install</b> and wait for it to finish — <b>don't unplug the cable while it installs</b>.</li>
              <li>Restart the unit, then add it in the app and complete its setup before handover.</li>
            </ol>

            <div style={{ margin: '22px 0 8px' }}>
              <WebFlasher />
            </div>

            <div className="callout info">
              <L tag="div"
                ar="يعمل التثبيت من المتصفح على Google Chrome أو Microsoft Edge على كمبيوتر، ولا يعمل من الهاتف."
                en="Browser installation works in Google Chrome or Microsoft Edge on a computer, not on a phone." />
            </div>
            <div className="callout warn">
              <L tag="div"
                ar="إن لم يظهر منفذ الوحدة، فقد يحتاج الكمبيوتر إلى تعريف USB الخاص بها (CP2102 أو CH340)."
                en="If the unit's port doesn't show up, the computer may need its USB driver (CP2102 or CH340)." />
            </div>
          </div>

          <div className="cta-band">
            <div>
              <b data-ar="">إعداد الوحدة بعد التثبيت</b>
              <b data-en="">Setting up the unit afterwards</b>{' '}
              <span data-ar="">— شرح شاشة إعداد الوحدة في التطبيق خطوة بخطوة.</span>
              <span data-en="">— the unit setup screen in the app, step by step.</span>
            </div>
            <Link className="btn" href="/docs/configuration"><L ar="دليل إعداد الوحدة" en="Unit setup guide" /></Link>
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
