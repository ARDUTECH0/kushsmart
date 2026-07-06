import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import HaLogo from '@/components/HaLogo';
import L from '@/components/L';

export const metadata = {
  title: 'KUSH SMART × Home Assistant',
  description:
    'Connect your KUSH SMART home to Home Assistant. Local and cloud control at the same time, and every device appears automatically — switches, lights, curtains, sensors and locks.',
};

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide', active: true },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

// [icon, ar, en]
const DEVICES = [
  ['🔌', 'المفاتيح', 'Switches'],
  ['💡', 'الإضاءة والديمر', 'Lights & dimmers'],
  ['🌈', 'الإضاءة الملوّنة', 'RGB lights'],
  ['🪟', 'الستائر والشتر', 'Curtains & shutters'],
  ['🌡️', 'الحرارة والرطوبة', 'Temperature & humidity'],
  ['🚪', 'حسّاسات الأبواب والحركة', 'Door & motion sensors'],
  ['🔒', 'الأقفال الذكية', 'Smart locks'],
  ['⚡', 'عدّادات الطاقة', 'Power meters'],
];

// [icon, arTitle, arDesc, enTitle, enDesc]
const BENEFITS = [
  ['🌐', 'يعمل بدون إنترنت', 'داخل المنزل يتحكّم مباشرةً عبر شبكتك، حتى لو انقطع الإنترنت.',
    'Works offline', 'At home it controls straight over your network, even if the internet drops.'],
  ['✨', 'إضافة تلقائية', 'أي جهاز جديد تضيفه يظهر في Home Assistant من تلقاء نفسه.',
    'Added automatically', 'Any new device you add shows up in Home Assistant on its own.'],
  ['🖐️', 'المفاتيح اليدوية تعمل', 'تظلّ مفاتيح الحائط تعمل كالمعتاد، والحالة تتحدّث فورًا.',
    'Manual switches work', 'Your wall switches keep working as usual, and the state updates instantly.'],
  ['🔒', 'خصوصية كاملة', 'ترى أجهزتك أنت فقط — لا شيء من الحسابات الأخرى يظهر.',
    'Full privacy', 'You only ever see your own devices — nothing from other accounts appears.'],
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
          <p data-ar="">
            اربط كوش سمارت مع Home Assistant، فتظهر كل أجهزتك تلقائيًا وتتحكّم فيها
            <b> محليًا وسحابيًا في آنٍ واحد</b> — ببساطة تامة ومن دون أي تعقيد.
          </p>
          <p data-en="">
            Connect KUSH SMART to Home Assistant and every device shows up automatically —
            controlled <b>locally and over the cloud at the same time</b>. Simple, with
            nothing to configure.
          </p>
          <div className="ha-hero-cta">
            <Link className="btn lg" href="/downloads"><L ar="حمّل التطبيق وابدأ" en="Get the app to start" /></Link>
          </div>
        </div>
      </header>

      <div className="wrap ha-body">
        {/* DUAL CONTROL — the headline */}
        <section id="dual">
          <div className="ha-h">
            <span className="eyebrow"><L ar="الميزة الأبرز" en="The headline feature" /></span>
            <L tag="h2" ar="محلي وسحابي… في نفس الوقت" en="Local and cloud, at the same time" />
            <L tag="p" ar="لا تختار بين السرعة والوصول من بعيد — كوش سمارت يمنحك الاثنين معًا، ويبدّل بينهما وحده."
              en="You don't have to choose between speed and remote access — KUSH SMART gives you both and switches between them on its own." />
          </div>
          <div className="ha-dual">
            <div className="ha-dual-card">
              <span className="ha-dual-ic">⚡</span>
              <L tag="h3" ar="سريع داخل المنزل" en="Fast at home" />
              <L tag="p" ar="عندما تكون في المنزل، يعمل التحكّم عبر شبكتك مباشرةً — استجابة فورية بلا انتظار."
                en="At home, control runs straight over your network — instant, with no waiting." />
            </div>
            <div className="ha-dual-plus">+</div>
            <div className="ha-dual-card">
              <span className="ha-dual-ic">☁️</span>
              <L tag="h3" ar="متاح من أي مكان" en="Available anywhere" />
              <L tag="p" ar="وعندما تكون خارج المنزل، ينتقل تلقائيًا إلى الإنترنت لتتحكّم من أي مكان في العالم."
                en="Away from home, it switches to the internet automatically so you can control from anywhere." />
            </div>
          </div>
          <p className="ha-dual-note">
            <L ar="🔀 التبديل تلقائي وفوري — والحالة تتحدّث لحظيًا في الحالتين."
              en="🔀 Switching is automatic and instant — and the state updates live either way." />
          </p>
        </section>

        {/* DEVICES */}
        <section id="devices">
          <div className="ha-h">
            <span className="eyebrow"><L ar="كل أجهزتك" en="All your devices" /></span>
            <L tag="h2" ar="تظهر جميعها تلقائيًا" en="They all appear automatically" />
            <L tag="p" ar="بمجرّد الربط، تنتقل كل أجهزتك إلى Home Assistant بأسمائها — وتُحدَّث مباشرةً."
              en="Once connected, every device moves into Home Assistant with its name — and updates in real time." />
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

        {/* STEPS */}
        <section id="steps">
          <div className="ha-h">
            <span className="eyebrow"><L ar="سهل للغاية" en="Really easy" /></span>
            <L tag="h2" ar="الربط في ٣ خطوات" en="Connect in three steps" />
          </div>
          <div className="ha-steps">
            <div className="ha-step">
              <span className="ha-step-n">1</span>
              <L tag="h3" ar="أضِف كوش سمارت" en="Add KUSH SMART" />
              <L tag="p" ar="من داخل Home Assistant، اختر إضافة «كوش سمارت»." en="In Home Assistant, choose to add “KUSH SMART”." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">2</span>
              <L tag="h3" ar="سجّل بحسابك" en="Sign in" />
              <L tag="p" ar="أدخل بريدك وكلمة المرور نفسها التي تستخدمها في التطبيق." en="Enter the same email and password you use in the app." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">3</span>
              <L tag="h3" ar="استمتع" en="Enjoy" />
              <L tag="p" ar="تظهر كل أجهزتك تلقائيًا وجاهزة للتحكّم. هذا كل شيء!" en="All your devices appear, ready to control. That's it!" />
            </div>
          </div>

          {/* one-click install */}
          <div className="ha-install">
            <div className="ha-install-txt">
              <span className="ha-install-ic">⚡</span>
              <div>
                <b><L ar="أسهل طريقة — بضغطة واحدة" en="The easiest way — one click" /></b>
                <L tag="p" ar="يفتح كوش سمارت مباشرةً داخل Home Assistant جاهزًا للتثبيت." en="Opens KUSH SMART right inside Home Assistant, ready to install." />
              </div>
            </div>
            <a
              className="btn lg"
              href="https://my.home-assistant.io/redirect/hacs_repository/?owner=ARDUTECH0&repository=ha-atsmart&category=integration"
              target="_blank"
              rel="noreferrer"
            >
              <L ar="افتح في Home Assistant" en="Open in Home Assistant" />
            </a>
            <span className="ha-install-alt">
              <L ar="أو أضِفه يدويًا بنسخ هذا العنوان:" en="Or add it manually by copying this address:" />{' '}
              <code>ARDUTECH0/ha-atsmart</code>
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
