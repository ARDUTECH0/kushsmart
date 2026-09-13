import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { asset } from '@/lib/site';
import { pageMeta } from '@/lib/seo';
import AppDownload from '@/components/AppDownload';
import L from '@/components/L';

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

// The board flasher and firmware list used to live here too. They're tools for
// the technician who fits a unit, not for the person downloading the app, so
// they moved to /install/.
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
              <li>تظهر أجهزتك تلقائيًا — وتحكّم فيها من أي مكان.</li>
            </ol>
            <ol className="steps" data-en="">
              <li>Install the app, open it, and create your account with your email.</li>
              <li>Tap <b>Add device</b> and follow the steps to connect the unit to your home Wi-Fi.</li>
              <li>Your devices appear on their own — control them from anywhere.</li>
            </ol>
          </div>
          <div className="callout info">
            <L tag="div"
              ar={<>تحتاج مساعدة في أي خطوة؟ يشرح <Link href="/docs">الدليل</Link> كل شيء بالتفصيل.</>}
              en={<>Need help with a step? The <Link href="/docs">guide</Link> covers everything in detail.</>} />
          </div>
          <div className="callout tip">
            <L tag="div"
              ar="تصل تحديثات أجهزتك لاسلكيًا من داخل التطبيق — ولا تحتاج إلى أي شيء آخر."
              en="Updates for your devices arrive wirelessly from inside the app — there's nothing else to do." />
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
