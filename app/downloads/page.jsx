import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { asset } from '@/lib/site';
import { pageMeta } from '@/lib/seo';
import AppDownload from '@/components/AppDownload';
import L from '@/components/L';
import { Upload, ArrowEnd } from '@/components/Icons';

export const metadata = pageMeta({
  title: 'تحميل التطبيق — Download the KUSH SMART app',
  description:
    'حمّل تطبيق كوش سمارت مجانًا وتحكّم في منزلك من هاتفك — سجّل ببريدك وابدأ خلال دقائق. Download the free KUSH SMART app and control your home from your phone.',
  path: '/downloads/',
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', active: true, btn: true },
];

// Fallback app release, baked into the static HTML. The live version + APK link
// come from the bridge (published from the admin console), so shipping a new
// build no longer needs a site rebuild. Keep this roughly current anyway — it is
// what visitors get before the fetch resolves, or if the bridge is unreachable.
const APP = {
  version: 'v1.0.11',
  apk: 'https://github.com/ARDUTECH0/kushsmart/releases/download/v1.0.11/KushSmart.apk',
  play: '#',
  appstore: '#',
};

// The app download. Flashing a board has its own page (/flash/), reached from
// the button here.
export default function DownloadsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <header className="page-head">
        <div className="wrap dlhero">
          <div>
            <span className="eyebrow"><L ar="التحميل" en="Download" /></span>
            <h1 data-ar="">حمّل تطبيق <span className="accent">كوش سمارت</span></h1>
            <h1 data-en="">Download the <span className="accent">KUSH SMART</span> app</h1>
            <L tag="p" ar="تحكّم في منزلك من هاتفك. التطبيق مجاني — سجّل ببريدك الإلكتروني وابدأ خلال دقائق."
              en="Control your home from your phone. The app is free — sign up with your email and start in minutes." />
            <AppDownload fallback={APP} />
            <div className="meta-note" style={{ marginTop: 14 }}>
              <Link href="/flash" style={{ color: '#9CC3E6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Upload /><L ar="عندك بوردة؟ ارفع السوفت وير عليها" en="Have a board? Flash it" />
              </Link>
            </div>
          </div>
          <div className="dlhero-art">
            <div className="dl-glass"><img src={asset('/assets/icon.png')} alt="" width="132" height="132" /></div>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="wrap" style={{ maxWidth: '760px' }}>
          <div className="h-center" style={{ marginBottom: '26px' }}>
            <span className="eyebrow"><L ar="بعد التحميل" en="After downloading" /></span>
            <L tag="h2" ar="ابدأ في ثلاث خطوات" en="Get started in three steps" />
          </div>
          <div className="card">
            <ol className="steps" data-ar="">
              <li>ثبّت التطبيق وافتحه، ثم أنشئ حسابك ببريدك الإلكتروني.</li>
              <li>اضغط <b>إضافة جهاز</b> واتبع الخطوات لتوصيل الوحدة بشبكة الواي فاي في منزلك.</li>
              <li>تظهر أجهزتك تلقائيًا — وتحكّم فيها من أي مكان. يشرح <Link href="/docs">الدليل</Link> كل خطوة.</li>
            </ol>
            <ol className="steps" data-en="">
              <li>Install the app, open it, and create your account with your email.</li>
              <li>Tap <b>Add device</b> and follow the steps to connect the unit to your home Wi-Fi.</li>
              <li>Your devices appear on their own — control them from anywhere. The <Link href="/docs">guide</Link> covers every step.</li>
            </ol>
          </div>

          {/* The way to the flasher. */}
          <div className="cta-band">
            <div>
              <b data-ar="">رفع السوفت وير على البوردة</b>
              <b data-en="">Flash a board</b>{' '}
              <span data-ar="">— وصّل البوردة بالكمبيوتر وارفع أحدث نسخة من المتصفح بضغطة واحدة.</span>
              <span data-en="">— connect the board to a computer and flash the latest version from your browser in one click.</span>
            </div>
            <Link className="btn" href="/flash">
              <Upload /><L ar="اذهب لصفحة الرفع" en="Go to flashing" /><ArrowEnd className="flip" />
            </Link>
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
