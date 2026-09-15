import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { pageMeta } from '@/lib/seo';
import { SUPPORT_EMAIL } from '@/lib/site';
import L from '@/components/L';
import { Mail, Phone, Globe, Bulb, Lock, Bolt, Remote, Cpu, Cloud, Hand, ArrowEnd } from '@/components/Icons';
import s from './company.module.css';

// The company behind the product — reached from "ATGENX" in the footer.
export const metadata = pageMeta({
  title: 'ATGENX — الشركة المصنّعة لكوش سمارت',
  description:
    'ATGENX تصمّم وتصنع منتجات كوش سمارت للمنزل الذكي من البداية للنهاية: الوحدات، السوفت وير، التطبيق، والسحابة. تعرّف على الشركة وطرق التواصل. ATGENX designs and builds KUSH SMART, end to end.',
  path: '/company/',
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

// Kept in step with the product line the firmware store publishes.
const PRODUCTS = [
  [Bulb, 'مفاتيح وإضاءة', 'Switches & lighting',
    'وحدات تُركَّب خلف المفاتيح الحالية: تشغيل، تعتيم، مراوح، ستائر، وإضاءة RGB.',
    'Units that fit behind existing switches: on/off, dimming, fans, shutters and RGB lighting.'],
  [Lock, 'القفل الذكي', 'Smart lock',
    'افتح الباب من التطبيق، أو بالبصمة، أو بكارت، أو برقم سري.',
    'Open the door from the app, or by fingerprint, card or PIN.'],
  [Bolt, 'عدّاد الطاقة', 'Power meter',
    'استهلاك الكهرباء لحظة بلحظة، والطاقة المستهلكة على مدار الوقت.',
    'Live electricity use, and the energy used over time.'],
  [Remote, 'ريموت IR و ATGENX HALO', 'IR remote & ATGENX HALO',
    'تحكّم في التكييف والتلفزيون والرسيفر من الموبايل، ومستشعرات RF.',
    'Control the AC, TV and receiver from your phone, plus RF sensors.'],
];

const HOW = [
  [Cpu, 'العتاد والسوفت وير', 'Hardware & firmware',
    'بنصمّم البوردات ونكتب السوفت وير اللي بيشتغل عليها، وبنحدّثه لاسلكيًا.',
    'We design the boards and write the software on them, and update it over the air.'],
  [Hand, 'التطبيق', 'The app',
    'تطبيق واحد بالعربي والإنجليزي للتحكّم والأتمتة ومشاركة الأجهزة.',
    'One app, in Arabic and English, for control, automations and sharing.'],
  [Cloud, 'السحابة', 'The cloud',
    <>خوادمنا بتشغّل الأتمتة والإشعارات والربط مع <bdi dir="ltr" style={{ whiteSpace: 'nowrap' }}>Google Home</bdi> و<bdi dir="ltr">Alexa</bdi> حتى والتطبيق مقفول.</>,
    'Our servers run automations, notifications and Google Home / Alexa even with the app closed.'],
];

export default function CompanyPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <header className="page-head">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <span className="eyebrow"><L ar="الشركة" en="The company" /></span>
          <h1 data-ar=""><span className="accent">ATGENX</span> — صُنّاع كوش سمارت</h1>
          <h1 data-en=""><span className="accent">ATGENX</span> — the makers of KUSH SMART</h1>
          <L tag="p" style={{ maxWidth: 640, margin: '0 auto' }}
            ar="بنصمّم ونصنع منتجات المنزل الذكي من البداية للنهاية — الوحدة اللي في الحيطة، السوفت وير اللي عليها، التطبيق، والسحابة — عشان البيت يبقى أبسط."
            en="We design and build smart-home products end to end — the unit in the wall, the software on it, the app and the cloud — to make homes simpler." />
        </div>
      </header>

      {/* WHO */}
      <section className="section">
        <div className={`wrap ${s.about}`}>
          <div>
            <span className="eyebrow"><L ar="مين إحنا" en="Who we are" /></span>
            <L tag="h2" ar="شركة واحدة مسؤولة عن كل حاجة" en="One company responsible for all of it" />
          </div>
          <div className={s.aboutText}>
            <L tag="p"
              ar="ATGENX هي الشركة اللي بتصنع وتشغّل كوش سمارت. بنشتغل لسوق مصر والسودان، وبنبني كل جزء في المنتج بنفسنا بدل ما نجمّعه من أطراف مختلفة."
              en="ATGENX makes and operates KUSH SMART. We build for Egypt and Sudan, and we make every part of the product ourselves rather than assembling it from different vendors." />
            <L tag="p"
              ar="ده معناه إن اللي بيصمّم البوردة هو نفسه اللي بيحدّث السوفت وير وبيردّ على الدعم — فالمشكلة بتتحل من مكانها."
              en="That means the people who design the board are the ones who update its software and answer support — so a problem gets fixed where it starts." />
          </div>
        </div>
      </section>

      {/* WHAT WE MAKE */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="h-center" style={{ marginBottom: 26 }}>
            <span className="eyebrow"><L ar="منتجاتنا" en="What we make" /></span>
            <L tag="h2" ar="خط منتجات كوش سمارت" en="The KUSH SMART range" />
          </div>
          <div className={s.grid}>
            {PRODUCTS.map(([Ic, ar, en, dAr, dEn]) => (
              <div className={s.card} key={en}>
                <span className={s.ic}><Ic /></span>
                <L tag="h3" ar={ar} en={en} />
                <L tag="p" ar={dAr} en={dEn} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE BUILD */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="h-center" style={{ marginBottom: 26 }}>
            <span className="eyebrow"><L ar="إزاي بنشتغل" en="How we build" /></span>
            <L tag="h2" ar="من البوردة للسحابة" en="From the board to the cloud" />
          </div>
          <div className={s.grid3}>
            {HOW.map(([Ic, ar, en, dAr, dEn]) => (
              <div className={s.card} key={en}>
                <span className={s.ic}><Ic /></span>
                <L tag="h3" ar={ar} en={en} />
                <L tag="p" ar={dAr} en={dEn} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="section" id="contact" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="h-center" style={{ marginBottom: 26 }}>
            <span className="eyebrow"><L ar="تواصل معنا" en="Contact" /></span>
            <L tag="h2" ar="كلّمنا" en="Get in touch" />
            <L tag="p" ar="للدعم الفني، التراخيص، أو طلبات الشركات والتركيب." en="For support, licences, or business and installation enquiries." />
          </div>
          <div className={s.contacts}>
            <a className={s.contact} href={`mailto:${SUPPORT_EMAIL}`}>
              <span className={s.ic}><Mail /></span>
              <span><b><L ar="البريد الإلكتروني" en="Email" /></b><bdi dir="ltr">{SUPPORT_EMAIL}</bdi></span>
            </a>
            <a className={s.contact} href="tel:+201096448029">
              <span className={s.ic}><Phone /></span>
              <span><b><L ar="الهاتف" en="Phone" /></b><bdi dir="ltr">+20 109 644 8029</bdi></span>
            </a>
            <a className={s.contact} href="https://github.com/ARDUTECH0" target="_blank" rel="noopener noreferrer">
              <span className={s.ic}><Globe /></span>
              <span><b>GitHub</b><bdi dir="ltr">github.com/ARDUTECH0</bdi></span>
            </a>
          </div>

          <div className="cta-band">
            <div>
              <b data-ar="">عايز ترخيص أو تسعير لمشروع؟</b>
              <b data-en="">Need a licence or a project quote?</b>{' '}
              <span data-ar="">— اترك بياناتك وهنتواصل معاك.</span>
              <span data-en="">— leave your details and we’ll get back to you.</span>
            </div>
            <Link className="btn" href="/pricing#request">
              <L ar="اطلب الآن" en="Request now" /><ArrowEnd className="flip" />
            </Link>
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
