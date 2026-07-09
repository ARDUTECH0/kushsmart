import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { asset } from '@/lib/site';
import { Android, Apple, Download, Bell } from '@/components/Icons';
import WebFlasher from '@/components/WebFlasher';
import FirmwareVersions from '@/components/FirmwareVersions';
import L from '@/components/L';

export const metadata = {
  title: 'Download & flash | KUSH SMART — كوش سمارت',
  description:
    'Download the KUSH SMART app for Android and iPhone, and flash an ESP32 board straight from your browser in one click — no tools, no code.',
};

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/downloads', label: 'التحميل', en: 'Download', active: true, btn: true },
];

// App release — the APK is published as a GitHub release (public), so it isn't
// committed to this repo. Bump `version` + the release URL for each new build.
const APP = {
  version: 'v1.0.9',
  apk: 'https://github.com/ARDUTECH0/kushsmart/releases/download/v1.0.9/KushSmart.apk',
  play: '#',
  appstore: '#',
};

export default function DownloadsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      {/* HERO = app download */}
      <header className="page-head">
        <div className="wrap dlhero">
          <div>
            <span className="eyebrow"><L ar="التحميل" en="Download" /></span>
            <h1 data-ar="">حمّل تطبيق <span className="accent">كوش سمارت</span></h1>
            <h1 data-en="">Download the <span className="accent">KUSH SMART</span> app</h1>
            <L tag="p" ar="تحكّم في منزلك من هاتفك. سجّل ببريدك الإلكتروني وابدأ خلال دقائق — متاح لأندرويد وآيفون."
              en="Control your home from your phone. Sign up with your email and get started in minutes — for Android and iPhone." />
            <div className="store-row">
              <a className="btn lg" href={APP.apk} download="KUSH SMART.apk"><Android /> <L ar="تحميل APK" en="Download APK" /></a>
              <a className="btn ghost lg" href={APP.play}><Android /> Google Play</a>
              <a className="btn ghost lg" href={APP.appstore}><Apple /> App Store</a>
            </div>
            <div className="meta-note">
              <span><Download /> <L ar={`الإصدار ${APP.version}`} en={`Version ${APP.version}`} /></span>
              <span><Bell /> <L ar="تحديثات مستمرّة" en="Regular updates" /></span>
              <span><L ar="أندرويد و iOS" en="Android & iOS" /></span>
            </div>
          </div>
          <div className="dlhero-art">
            <div className="dl-glass"><img src={asset('/assets/icon.png')} alt="KUSH SMART" /></div>
          </div>
        </div>
      </header>

      {/* LATEST FIRMWARE — live from the server */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap" style={{ maxWidth: '760px' }}>
          <div className="h-center" style={{ marginBottom: '20px' }}>
            <span className="eyebrow"><L ar="أحدث الإصدارات" en="Latest releases" /></span>
            <L tag="h2" ar="آخر تحديثات السوفت وير" en="Latest firmware" />
            <L tag="p" ar="أحدث نسخة منشورة لكل بوردة — تُحدَّث الأجهزة إليها لاسلكيًا من داخل التطبيق."
              en="The newest published version for each board — devices update to it wirelessly from the app." />
          </div>
          <div className="card">
            <FirmwareVersions />
          </div>
        </div>
      </section>

      {/* WEB FLASHER — primary path */}
      <section className="section">
        <div className="wrap" style={{ maxWidth: '900px' }}>
          <div className="h-center" style={{ marginBottom: '30px' }}>
            <span className="eyebrow"><L ar="رفع السوفت وير" en="Flashing" /></span>
            <L tag="h2" ar="ارفع السوفت وير على البوردة من المتصفح" en="Flash the board from your browser" />
            <p data-ar="">وصّل بوردة <b>ESP32</b> بالكمبيوتر عبر USB وارفع السوفت وير مباشرةً — بدون تثبيت أي برنامج، وبدون أي أكواد.</p>
            <p data-en="">Connect an <b>ESP32</b> board to your computer over USB and flash it directly — no software to install, no code.</p>
          </div>

          <div className="card">
            <div className="callout tip" style={{ marginTop: 0 }}>
              <span className="em">✅</span>
              <div data-ar=""><b>أسهل طريقة:</b> بضغطة واحدة من المتصفح. لا تحتاج إلى esptool ولا Arduino ولا أي خبرة تقنية.</div>
              <div data-en=""><b>Easiest way:</b> one click in the browser. No esptool, no Arduino, no technical skills.</div>
            </div>

            <L tag="h3" ar="الخطوات" en="Steps" />
            <ol className="steps" data-ar="">
              <li>وصّل بوردة <b>ESP32</b> بالكمبيوتر بكابل <b>USB</b> (تأكّد أنه كابل بيانات وليس شحن فقط).</li>
              <li>اضغط زر <b>«ارفع السوفت وير الآن»</b> بالأسفل.</li>
              <li>ستظهر نافذة لاختيار <b>منفذ البوردة (Serial Port)</b> — اخترها ثم اضغط <b>Connect</b>.</li>
              <li>اضغط <b>Install</b> وأكّد، ثم انتظر اكتمال الرفع. <b>لا تفصل الكابل أثناء العملية.</b></li>
              <li>بعد الانتهاء، أعِد تشغيل البوردة، ثم افتح التطبيق و<b>أضِف الجهاز</b> ووصّله بالواي فاي.</li>
            </ol>
            <ol className="steps" data-en="">
              <li>Connect the <b>ESP32</b> board to your computer with a <b>USB</b> cable (make sure it's a data cable, not charge-only).</li>
              <li>Press the <b>“Flash now”</b> button below.</li>
              <li>A window opens to pick the board's <b>serial port</b> — choose it and press <b>Connect</b>.</li>
              <li>Press <b>Install</b> and confirm, then wait for it to finish. <b>Don't unplug the cable during the process.</b></li>
              <li>When it's done, restart the board, then open the app, <b>add the device</b> and connect it to Wi-Fi.</li>
            </ol>

            <div style={{ margin: '22px 0 8px' }}>
              <WebFlasher />
            </div>

            <div className="callout info">
              <span className="em">🌐</span>
              <div data-ar="">الرفع المباشر يعمل على <b>Google Chrome</b> أو <b>Microsoft Edge</b> على <b>كمبيوتر</b> (ويندوز / ماك / لينكس). لا يعمل من الهاتف، ويتطلّب اتصالًا آمنًا (HTTPS).</div>
              <div data-en="">Browser flashing works in <b>Google Chrome</b> or <b>Microsoft Edge</b> on a <b>computer</b> (Windows / Mac / Linux). It doesn't work on phones, and needs a secure (HTTPS) connection.</div>
            </div>
            <div className="callout warn">
              <span className="em">🔌</span>
              <div data-ar="">لو لم يظهر منفذ البوردة، فقد تحتاج إلى تثبيت <b>تعريف USB</b> الخاص بالشريحة (CP2102 أو CH340) على الكمبيوتر، ثم أعد المحاولة.</div>
              <div data-en="">If the board's port doesn't show up, you may need to install the chip's <b>USB driver</b> (CP2102 or CH340) on your computer, then try again.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Post-flash guidance */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', paddingTop: '60px' }}>
        <div className="wrap" style={{ maxWidth: '760px' }}>
          <div className="h-center" style={{ marginBottom: '24px' }}>
            <span className="eyebrow"><L ar="بعد الرفع" en="After flashing" /></span>
            <L tag="h2" ar="وبعد رفع السوفت وير؟" en="What's next?" />
            <L tag="p" ar="الرفع يتمّ من المتصفح مباشرةً بضغطة واحدة — لا حاجة لتحميل أي ملفات أو أدوات."
              en="Flashing happens right in the browser with one click — no files or tools to download." />
          </div>
          <div className="card">
            <ol className="steps" data-ar="">
              <li>بعد اكتمال الرفع، أعِد تشغيل البوردة.</li>
              <li>راجع <Link href="/docs/configuration">دليل إعداد البوردة</Link> لتعريف القنوات (مفاتيح / حسّاسات / إضاءة…).</li>
              <li>افتح التطبيق و<Link href="/docs#add">أضِف الجهاز</Link> ووصّله بالواي فاي.</li>
            </ol>
            <ol className="steps" data-en="">
              <li>When flashing finishes, restart the board.</li>
              <li>See the <Link href="/docs/configuration">board setup guide</Link> to define the channels (switches / sensors / lights…).</li>
              <li>Open the app, <Link href="/docs#add">add the device</Link>, and connect it to Wi-Fi.</li>
            </ol>
          </div>
          <div className="callout info">
            <span className="em">🔄</span>
            <div data-ar="">التحديثات القادمة تصل للأجهزة <b>لاسلكيًا</b> من داخل التطبيق — لا تحتاج إلى إعادة الرفع من الموقع. راجع <Link href="/docs#update">دليل التحديث عن بُعد</Link>.</div>
            <div data-en="">Future updates reach your devices <b>wirelessly</b> from inside the app — no need to re-flash from the website. See the <Link href="/docs#update">over-the-air update guide</Link>.</div>
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
