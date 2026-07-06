import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import PricingClient from '@/components/PricingClient';
import L from '@/components/L';

export const metadata = {
  title: 'Pricing & licence | KUSH SMART — كوش سمارت',
  description:
    'KUSH SMART licence — a one-time, lifetime activation for your device, with full control from the app and Home Assistant, wireless updates and support. Leave your details and we will get in touch.',
};

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing', active: true },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <header className="page-head">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <span className="eyebrow"><L ar="الترخيص" en="Licence" /></span>
          <h1 data-ar="">فعّل جهازك مع <span className="accent">كوش سمارت</span></h1>
          <h1 data-en="">Activate your device with <span className="accent">KUSH SMART</span></h1>
          <L tag="p" style={{ maxWidth: 560, margin: '0 auto' }}
            ar="ترخيص دائم بدفعة واحدة — تحكّم كامل، تحديثات مجّانية، ودعم متواصل."
            en="A one-time, lifetime licence — full control, free updates, and ongoing support." />
        </div>
      </header>

      <section className="section" style={{ paddingTop: 36 }}>
        <PricingClient />
      </section>

      <SlimFooter />
    </>
  );
}
