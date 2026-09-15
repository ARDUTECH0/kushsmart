import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { pageMeta } from '@/lib/seo';
import ConfigFileViewer from '@/components/ConfigFileViewer';
import L from '@/components/L';

// Opens a board setup file (.kscfg) saved from the app and shows its layout.
// Reached from the flashing page and from links; not something to search for.
export const metadata = pageMeta({
  title: 'عارض ملف إعداد البوردة — Board setup file viewer',
  description:
    'افتح ملف إعداد البوردة (.kscfg) المحفوظ من تطبيق كوش سمارت واعرض ترتيب القنوات والمنافذ والإعدادات. Open a KUSH SMART board setup file and see its layout.',
  path: '/config-file/',
  noindex: true,
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

export default function ConfigFilePage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <header className="page-head">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <span className="eyebrow"><L ar="ملف الإعداد" en="Setup file" /></span>
          <h1 data-ar="">اعرض <span className="accent">ملف إعداد البوردة</span></h1>
          <h1 data-en="">View a <span className="accent">board setup file</span></h1>
          <L tag="p" style={{ maxWidth: 620, margin: '0 auto' }}
            ar={<>افتح الملف الذي حفظته من التطبيق (<bdi dir="ltr">.kscfg</bdi>) واطّلع على ترتيب القنوات والمنافذ والإعدادات — دون الحاجة إلى البوردة.</>}
            en="Open the file you saved from the app (.kscfg) and see its channels, pins and settings — no board needed." />
        </div>
      </header>

      <section className="section">
        <div className="wrap" style={{ maxWidth: '960px' }}>
          <ConfigFileViewer />
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
