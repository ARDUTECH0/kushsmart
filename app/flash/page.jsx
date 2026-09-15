import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { pageMeta } from '@/lib/seo';
import FirmwareVersions from '@/components/FirmwareVersions';
import WebFlasher from '@/components/WebFlasher';
import L from '@/components/L';
import { ArrowEnd } from '@/components/Icons';

// Flashing a board from the browser. Its own page, reached from the download
// page's "flash a board" button: the app download is for everyone, this is for
// whoever has a board on the desk and a USB cable in hand.
export const metadata = pageMeta({
  title: 'رفع السوفت وير على البوردة — Flash a board',
  description:
    'وصّل البوردة بالكمبيوتر وارفع أحدث سوفت وير كوش سمارت من المتصفح مباشرةً بضغطة واحدة، دون تثبيت أي برنامج. Flash a KUSH SMART board straight from your browser.',
  path: '/flash/',
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', active: true, btn: true },
];

export default function FlashPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <header className="page-head">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <span className="eyebrow"><L ar="رفع السوفت وير" en="Flashing" /></span>
          <h1 data-ar="">وصّل البوردة و<span className="accent">ارفع السوفت وير</span></h1>
          <h1 data-en="">Connect the board and <span className="accent">flash it</span></h1>
          <L tag="p" style={{ maxWidth: 600, margin: '0 auto 22px' }}
            ar="وصّل البوردة بالكمبيوتر بكابل USB وارفع أحدث نسخة من المتصفح بضغطة واحدة — دون تثبيت أي برنامج."
            en="Connect the board to a computer over USB and flash the latest version from your browser in one click — nothing to install." />
          <div className="store-row" style={{ justifyContent: 'center' }}>
            <a className="btn lg" href="#flasher"><L ar="ابدأ الرفع" en="Start flashing" /></a>
            <Link className="btn ghost lg" href="/downloads">
              <L ar="تحميل التطبيق" en="Download the app" /><ArrowEnd className="flip" />
            </Link>
          </div>
        </div>
      </header>

      {/* LATEST VERSIONS — live from the server */}
      <section className="section" style={{ paddingBottom: 0 }} id="versions">
        <div className="wrap" style={{ maxWidth: '760px' }}>
          <div className="h-center" style={{ marginBottom: '20px' }}>
            <span className="eyebrow"><L ar="أحدث الإصدارات" en="Latest releases" /></span>
            <L tag="h2" ar="آخر تحديثات السوفت وير" en="Latest software" />
            <L tag="p" ar="أحدث نسخة منشورة لكل بوردة. الأجهزة المركّبة تتحدّث إليها لاسلكيًا من داخل التطبيق."
              en="The newest published version for each board. Installed devices update to it wirelessly from the app." />
          </div>
          <div className="card">
            <FirmwareVersions />
          </div>
        </div>
      </section>

      {/* THE FLASHER */}
      <section className="section" id="flasher">
        <div className="wrap" style={{ maxWidth: '900px' }}>
          <div className="h-center" style={{ marginBottom: '30px' }}>
            <span className="eyebrow"><L ar="خطوة بخطوة" en="Step by step" /></span>
            <L tag="h2" ar="ارفع السوفت وير على البوردة" en="Flash the board" />
          </div>

          <div className="card">
            <L tag="h3" ar="الخطوات" en="Steps" />
            <ol className="steps" data-ar="">
              <li>وصّل البوردة بالكمبيوتر بكابل USB يدعم نقل البيانات (وليس كابل شحن فقط).</li>
              <li>اختر نوع البوردة بالأسفل، ثم اضغط <b>«ارفع السوفت وير الآن»</b>.</li>
              <li>اختر منفذ البوردة من النافذة التي تظهر، ثم اضغط <b>Connect</b>.</li>
              <li>اضغط <b>Install</b> وانتظر حتى يكتمل الرفع — <b>لا تفصل الكابل أثناء الرفع</b>.</li>
              <li>أعد تشغيل البوردة، ثم افتح التطبيق و<Link href="/docs#add">أضِف الجهاز</Link> ووصّله بالواي فاي.</li>
            </ol>
            <ol className="steps" data-en="">
              <li>Connect the board to the computer with a USB cable that carries data (not a charge-only cable).</li>
              <li>Choose the kind of board below, then press <b>“Flash now”</b>.</li>
              <li>Pick the board's port in the window that opens, then press <b>Connect</b>.</li>
              <li>Press <b>Install</b> and wait for it to finish — <b>don't unplug the cable while it flashes</b>.</li>
              <li>Restart the board, then open the app, <Link href="/docs#add">add the device</Link> and connect it to Wi-Fi.</li>
            </ol>

            <div style={{ margin: '22px 0 8px' }}>
              <WebFlasher />
            </div>

            <div className="callout info">
              <L tag="div"
                ar="الرفع من المتصفح يعمل على Google Chrome أو Microsoft Edge على كمبيوتر (ويندوز / ماك / لينكس)، ولا يعمل من الهاتف."
                en="Flashing from the browser works in Google Chrome or Microsoft Edge on a computer (Windows / Mac / Linux), not on a phone." />
            </div>
            <div className="callout warn">
              <L tag="div"
                ar="لو لم يظهر منفذ البوردة، فقد يحتاج الكمبيوتر إلى تعريف USB الخاص بها (CP2102 أو CH340)، ثم أعد المحاولة."
                en="If the board's port doesn't show up, the computer may need its USB driver (CP2102 or CH340); then try again." />
            </div>
          </div>

          <div className="callout tip">
            <L tag="div"
              ar={<>بعد الرفع، تصل التحديثات القادمة إلى الجهاز لاسلكيًا من داخل التطبيق — لا تحتاج إلى الرفع من الموقع مرة أخرى. ولضبط قنوات البوردة راجع <Link href="/docs/configuration">دليل إعداد البوردة</Link>.</>}
              en={<>After flashing, future updates reach the device wirelessly from the app — no need to flash from the website again. To set up the board's channels, see the <Link href="/docs/configuration">board setup guide</Link>.</>} />
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
