import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import HaLogo from '@/components/HaLogo';
import L from '@/components/L';
import { SUPPORT_EMAIL } from '@/lib/site';
import { pageMeta } from '@/lib/seo';
import {
  Hand, Bulb, Palette, Curtain, Sensor, Door, Lock, Bolt, Cloud, Signal, Sync, Plus,
} from '@/components/Icons';

export const metadata = pageMeta({
  title: 'الربط مع Home Assistant — KUSH SMART × Home Assistant',
  description:
    'اربط كوش سمارت مع Home Assistant فتظهر كل أجهزتك تلقائيًا — الإضاءة والمفاتيح والستائر والحسّاسات والأقفال. Connect KUSH SMART to Home Assistant; every device appears automatically.',
  path: '/docs/home-assistant/',
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide', active: true },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

// [icon, ar, en]
const DEVICES = [
  [<Hand key="i" />, 'المفاتيح', 'Switches'],
  [<Bulb key="i" />, 'الإضاءة والخفوت', 'Lights & dimmers'],
  [<Palette key="i" />, 'الإضاءة الملوّنة', 'Colour lighting'],
  [<Curtain key="i" />, 'الستائر والشتر', 'Curtains & shutters'],
  [<Sensor key="i" />, 'الحرارة والرطوبة', 'Temperature & humidity'],
  [<Door key="i" />, 'حسّاسات الأبواب والحركة', 'Door & motion sensors'],
  [<Lock key="i" />, 'الأقفال الذكية', 'Smart locks'],
  [<Bolt key="i" />, 'عدّادات الطاقة', 'Power meters'],
];

// [icon, arTitle, arDesc, enTitle, enDesc]
const BENEFITS = [
  [<Signal key="i" />, 'يعمل دون إنترنت', 'مع إضافة كوش سمارت يستمرّ التحكّم داخل المنزل حتى لو انقطع الإنترنت.',
    'Works offline', 'With the KUSH SMART add-on, control at home keeps working even if the internet drops.'],
  [<Sync key="i" />, 'إضافة تلقائية', 'أي جهاز جديد تضيفه في التطبيق يظهر في Home Assistant من تلقاء نفسه.',
    'Added automatically', 'Any new device you add in the app shows up in Home Assistant on its own.'],
  [<Hand key="i" />, 'مفاتيح الحائط تعمل', 'تظلّ مفاتيح الحائط تعمل كالمعتاد، وتتحدّث الحالة فورًا.',
    'Wall switches work', 'Your wall switches keep working as usual, and the state updates instantly.'],
  [<Lock key="i" />, 'خصوصية كاملة', 'ترى أجهزتك أنت فقط — ولا يظهر شيء من أي حساب آخر.',
    'Full privacy', 'You only ever see your own devices — nothing from any other account.'],
];

export default function HomeAssistantPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      {/* HERO */}
      <header className="ha-hero">
        <div className="wrap ha-hero-in">
          <div className="ha-hero-badge"><HaLogo size={68} /></div>
          <span className="eyebrow"><L ar="يعمل مع Home Assistant" en="Works with Home Assistant" /></span>
          <h1 data-ar="">منزلك الذكي… داخل <span className="accent">Home Assistant</span></h1>
          <h1 data-en="">Your smart home, inside <span className="accent">Home Assistant</span></h1>
          <L tag="p"
            ar="اربط كوش سمارت مع Home Assistant، فتظهر كل أجهزتك تلقائيًا وتتحكّم فيها من داخل المنزل ومن خارجه — ببساطة ودون تعقيد."
            en="Connect KUSH SMART to Home Assistant and every device shows up automatically, ready to control at home and away — simply, with nothing complicated." />
          <div className="ha-hero-cta">
            <Link className="btn lg" href="/downloads"><L ar="حمّل التطبيق وابدأ" en="Get the app to start" /></Link>
          </div>
        </div>
      </header>

      <div className="wrap ha-body">
        {/* DEVICES */}
        <section id="devices">
          <div className="ha-h">
            <span className="eyebrow"><L ar="كل أجهزتك" en="All your devices" /></span>
            <L tag="h2" ar="تظهر جميعها تلقائيًا" en="They all appear automatically" />
            <L tag="p" ar="بمجرّد الربط تنتقل كل أجهزتك إلى Home Assistant بأسمائها، وتتحدّث حالتها لحظيًا."
              en="Once linked, every device moves into Home Assistant with its name, and its state updates live." />
          </div>
          <div className="ha-dev">
            {DEVICES.map(([ic, ar, en]) => (
              <div className="ha-dev-c" key={en}>
                <span className="ha-dev-ic">{ic}</span>
                <b><L ar={ar} en={en} /></b>
              </div>
            ))}
          </div>
        </section>

        {/* QUICK LINK — nothing to install */}
        <section id="steps">
          <div className="ha-h">
            <span className="eyebrow"><L ar="الربط السريع" en="Quick link" /></span>
            <L tag="h2" ar="في ثلاث خطوات، دون تثبيت" en="Three steps, nothing to install" />
            <L tag="p" ar="كل ما تحتاجه موجود داخل تطبيق كوش سمارت، جاهز للنسخ."
              en="Everything you need is inside the KUSH SMART app, ready to copy." />
          </div>
          <div className="ha-steps">
            <div className="ha-step">
              <span className="ha-step-n">1</span>
              <L tag="h3" ar="افتح التطبيق" en="Open the app" />
              <L tag="p" ar="من «الملف الشخصي» اضغط «ربط Home Assistant» ثم «ربط بدون تثبيت». يعرض التطبيق بيانات الربط الخاصة بحسابك مع زر نسخ."
                en="In Profile, tap “Link Home Assistant”, then “Connect — no install”. The app shows your account's link details with a copy button." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">2</span>
              <L tag="h3" ar="أضِف الربط" en="Add the link" />
              <L tag="p" ar="اضغط الزر أدناه لفتح صفحة الإضافة في Home Assistant، ثم الصق البيانات التي نسختها من التطبيق."
                en="Press the button below to open the add page in Home Assistant, then paste the details you copied from the app." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">3</span>
              <L tag="h3" ar="تظهر أجهزتك" en="Your devices appear" />
              <L tag="p" ar="بعد الحفظ تظهر كل أجهزتك بأسمائها، جاهزة للتحكّم وللاستخدام في لوحاتك وأتمتتك."
                en="Once saved, all your devices appear by name, ready to control and to use in your dashboards and automations." />
            </div>
          </div>

          <div className="ha-install">
            <div className="ha-install-txt">
              <span className="ha-install-ic"><Plus /></span>
              <div>
                <b><L ar="افتح صفحة الإضافة في Home Assistant" en="Open the add page in Home Assistant" /></b>
                <L tag="p" ar="تفتح مباشرةً داخل Home Assistant الخاص بك — ثم الصق بيانات الربط من التطبيق."
                  en="It opens straight inside your Home Assistant — then paste the link details from the app." />
              </div>
            </div>
            <a
              className="btn lg"
              href="https://my.home-assistant.io/redirect/config_flow_start/?domain=mqtt"
              target="_blank"
              rel="noreferrer"
            >
              <L ar="افتح Home Assistant" en="Open Home Assistant" />
            </a>
            <span className="ha-install-alt">
              <L ar="بيانات الربط خاصة بحسابك وتظهر داخل التطبيق فقط — لا تشاركها مع أحد."
                en="Your link details belong to your account and only ever appear inside the app — never share them." />
            </span>
          </div>
        </section>

        {/* THE ADD-ON — local control */}
        <section id="addon">
          <div className="ha-h">
            <span className="eyebrow"><L ar="للتحكّم دون إنترنت" en="For offline control" /></span>
            <L tag="h2" ar="إضافة كوش سمارت" en="The KUSH SMART add-on" />
            <L tag="p" ar="تثبّتها مرة واحدة، فتحصل على تحكّم فوري داخل المنزل يستمرّ حتى لو انقطع الإنترنت — ودون كتابة أي كلمة مرور."
              en="Install it once for instant control at home that keeps working even if the internet drops — with no password to type." />
          </div>
          <div className="ha-steps">
            <div className="ha-step">
              <span className="ha-step-n">1</span>
              <L tag="h3" ar="ثبّت الإضافة" en="Install the add-on" />
              <L tag="p" ar="اضغط «ثبّت في Home Assistant» أدناه، ثم أعِد تشغيل Home Assistant عندما يُطلب منك."
                en="Press “Install in Home Assistant” below, then restart Home Assistant when asked." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">2</span>
              <L tag="h3" ar="امسح الرمز" en="Scan the code" />
              <L tag="p" ar="أضِف «كوش سمارت» واختر «الربط عن طريق التطبيق». يظهر رمز — امسحه من التطبيق: الملف الشخصي ← «ربط Home Assistant»."
                en="Add “KUSH SMART” and choose “Link with the app”. A code appears — scan it from the app: Profile → “Link Home Assistant”." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">3</span>
              <L tag="h3" ar="يكتمل الربط" en="It links itself" />
              <L tag="p" ar="يتأكّد الربط تلقائيًا، وتظهر كل أجهزتك جاهزة للتحكّم."
                en="The link confirms on its own, and all your devices appear, ready to control." />
            </div>
          </div>

          <div className="ha-install">
            <div className="ha-install-txt">
              <span className="ha-install-ic"><Bolt /></span>
              <div>
                <b><L ar="ثبّت الإضافة بضغطة واحدة" en="Install the add-on in one click" /></b>
                <L tag="p" ar="تفتح إضافة كوش سمارت داخل Home Assistant جاهزة للتثبيت."
                  en="Opens the KUSH SMART add-on inside Home Assistant, ready to install." />
              </div>
            </div>
            <a
              className="btn lg"
              href="https://my.home-assistant.io/redirect/hacs_repository/?owner=ARDUTECH0&repository=ha-atsmart&category=integration"
              target="_blank"
              rel="noreferrer"
            >
              <L ar="ثبّت في Home Assistant" en="Install in Home Assistant" />
            </a>
            <span className="ha-install-alt">
              <L ar="بعد التثبيت:" en="After installing:" />{' '}
              <a href="https://my.home-assistant.io/redirect/config_flow_start/?domain=atsmart" target="_blank" rel="noreferrer">
                <L ar="أضِف كوش سمارت" en="Add KUSH SMART" />
              </a>
              {' · '}
              <L ar="تحتاج مساعدة؟" en="Need help?" />{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}><L ar="راسل الدعم" en="Email support" /></a>
            </span>
          </div>
        </section>

        {/* BENEFITS */}
        <section id="why">
          <div className="ha-h">
            <span className="eyebrow"><L ar="لماذا كوش سمارت" en="Why KUSH SMART" /></span>
            <L tag="h2" ar="راحة تدوم" en="Comfort that lasts" />
          </div>
          <div className="ha-ben">
            {BENEFITS.map(([ic, ah, ap, eh, ep]) => (
              <div className="ha-ben-c" key={eh}>
                <span className="ha-ben-ic">{ic}</span>
                <h3><L ar={ah} en={eh} /></h3>
                <p><L ar={ap} en={ep} /></p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="ha-cta">
          <HaLogo size={54} />
          <L tag="h2" ar="ابدأ منزلك الذكي المتكامل اليوم" en="Start your complete smart home today" />
          <L tag="p" ar="حمّل تطبيق كوش سمارت، أضِف أجهزتك، واربطها بـ Home Assistant في دقائق."
            en="Download the KUSH SMART app, add your devices, and connect them to Home Assistant in minutes." />
          <Link className="btn lg" href="/downloads"><L ar="حمّل التطبيق" en="Get the app" /></Link>
        </section>
      </div>

      <SlimFooter />
    </>
  );
}
