import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import GoogleHomeLogo from '@/components/GoogleHomeLogo';
import L from '@/components/L';

export const metadata = {
  title: 'KUSH SMART × Google Home',
  description:
    'Control your KUSH SMART devices with your voice through Google Home / Google Assistant — switches, lights, RGB and sensors, synced live with the app.',
};

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide', active: true },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

// [icon, ar, en] — only what the Google Home integration actually exposes today.
const DEVICES = [
  ['🔌', 'المفاتيح', 'Switches'],
  ['💡', 'الإضاءة والديمر', 'Lights & dimmers'],
  ['🌈', 'الإضاءة الملوّنة', 'RGB lights'],
  ['🌡️', 'حسّاسات الحرارة', 'Temperature sensors'],
  ['🚪', 'حسّاسات الأبواب والحركة', 'Door & motion sensors'],
];

// [icon, arTitle, arDesc, enTitle, enDesc]
const BENEFITS = [
  ['🎙️', 'تحكّم بصوتك', 'اطلب من جوجل تشغيل أو إطفاء أي جهاز، أو اسأله عن الحرارة — بدون فتح التطبيق.',
    'Control by voice', 'Ask Google to turn any device on or off, or ask for the temperature — no need to open the app.'],
  ['⚡', 'تزامن لحظي', 'أي تغيير من التطبيق أو من المفتاح اليدوي يظهر في Google Home فورًا، والعكس صحيح.',
    'Instant sync', 'Any change from the app or a wall switch shows up in Google Home right away — and the other way around.'],
  ['✨', 'إضافة تلقائية', 'أي جهاز جديد تضيفه في التطبيق يظهر في Google Home من غير ما تعمل حاجة زيادة.',
    'Added automatically', 'Any new device you add in the app shows up in Google Home with nothing extra to do.'],
  ['🔒', 'خصوصية كاملة', 'ترى أجهزتك أنت فقط — الربط مبني على حسابك في التطبيق ولا شيء غيره.',
    'Full privacy', 'You only ever see your own devices — linking is tied to your own app account and nothing else.'],
];

const COMMANDS = [
  ['ok Google, شغّل نور الصالة', '“Hey Google, turn on the living room light”'],
  ['ok Google, اطفي كل حاجة', '“Hey Google, turn everything off”'],
  ['ok Google, درجة حرارة الأوضة كام؟', '“Hey Google, what’s the temperature in the bedroom?”'],
  ['ok Google, اعمل الإضاءة أحمر', '“Hey Google, make the lights red”'],
];

export default function GoogleHomePage() {
  return (
    <>
      <SiteHeader links={NAV} />

      {/* HERO */}
      <header className="ha-hero">
        <div className="wrap ha-hero-in">
          <div className="ha-hero-badge"><GoogleHomeLogo size={68} /></div>
          <span className="eyebrow"><L ar="يعمل مع Google Home" en="Works with Google Home" /></span>
          <h1 data-ar="">منزلك الذكي… بصوتك مع <span className="accent">Google Home</span></h1>
          <h1 data-en="">Your smart home, by voice with <span className="accent">Google Home</span></h1>
          <p data-ar="">
            اربط كوش سمارت بحساب Google بتاعك، وتحكّم في أجهزتك بصوتك من أي مكان في البيت —
            <b> ومتزامن لحظيًا مع التطبيق</b>.
          </p>
          <p data-en="">
            Link KUSH SMART to your Google Account and control your devices with your voice
            from anywhere in the house — <b>synced live with the app</b>.
          </p>
          <div className="ha-hero-cta">
            <Link className="btn lg" href="/downloads"><L ar="حمّل التطبيق وابدأ" en="Get the app to start" /></Link>
          </div>
        </div>
      </header>

      <div className="wrap ha-body">
        {/* DEVICES */}
        <section id="devices">
          <div className="ha-h">
            <span className="eyebrow"><L ar="مدعوم حاليًا" en="Supported today" /></span>
            <L tag="h2" ar="تظهر تلقائيًا في Google Home" en="They appear automatically in Google Home" />
            <L tag="p" ar="بمجرّد الربط، الأنواع دي تظهر فورًا بأسمائها وتتحدّث لحظيًا." en="Once linked, these appear right away with their real names and update live." />
          </div>
          <div className="ha-dev">
            {DEVICES.map(([ic, ar, en]) => (
              <div className="ha-dev-c" key={en}>
                <span className="ha-dev-ic">{ic}</span>
                <b><L ar={ar} en={en} /></b>
              </div>
            ))}
          </div>
          <p className="ha-dual-note">
            <L ar="الأقفال والستائر وعدّادات الطاقة متاحة حاليًا عن طريق التطبيق و Home Assistant، وجاري إضافتها لـ Google Home."
              en="Locks, curtains and power meters are available today through the app and Home Assistant — Google Home support for them is on the way." />
          </p>
        </section>

        {/* STEPS */}
        <section id="steps">
          <div className="ha-h">
            <span className="eyebrow"><L ar="الربط" en="Linking" /></span>
            <L tag="h2" ar="في ٣ خطوات بسيطة" en="Three simple steps" />
            <L tag="p" ar="من تطبيق Google Home مباشرةً — مفيش تنزيل ولا تثبيت إضافي." en="Straight from the Google Home app — nothing extra to download or install." />
          </div>
          <div className="ha-steps">
            <div className="ha-step">
              <span className="ha-step-n">1</span>
              <L tag="h3" ar="افتح تطبيق Google Home" en="Open the Google Home app" />
              <L tag="p" ar="دوس على «+» (إضافة) ← «إعداد جهاز» ← «يعمل مع Google» (Works with Google)." en="Tap “+” (Add) → “Set up device” → “Works with Google”." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">2</span>
              <L tag="h3" ar="ابحث عن KUSH SMART" en="Search for KUSH SMART" />
              <L tag="p" ar="اكتب «KUSH SMART» في البحث، اختاره، وسجّل الدخول بنفس بيانات حسابك في التطبيق." en="Type “KUSH SMART” in the search, pick it, then sign in with the same account you use in the app." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">3</span>
              <L tag="h3" ar="تظهر تلقائيًا" en="They appear on their own" />
              <L tag="p" ar="بعد تسجيل الدخول، كل أجهزتك المدعومة تظهر في Google Home جاهزة للتحكّم بالصوت أو باللمس." en="Once you're signed in, every supported device shows up in Google Home, ready for voice or tap control." />
            </div>
          </div>
        </section>

        {/* VOICE COMMANDS */}
        <section id="commands">
          <div className="ha-h">
            <span className="eyebrow"><L ar="جرّب تقول" en="Try saying" /></span>
            <L tag="h2" ar="أمثلة أوامر صوتية" en="Example voice commands" />
          </div>
          <div className="ha-cfg">
            {COMMANDS.map(([ar, en]) => (
              <div className="ha-cfg-row" key={en}>
                <b dir="rtl">{ar}</b>
                <span dir="ltr">{en}</span>
              </div>
            ))}
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
          <GoogleHomeLogo size={54} />
          <L tag="h2" ar="ابدأ منزلك الذكي المتكامل اليوم" en="Start your complete smart home today" />
          <L tag="p" ar="حمّل تطبيق كوش سمارت، أضِف أجهزتك، واربطها بـ Google Home في دقائق."
            en="Download the KUSH SMART app, add your devices, and connect them to Google Home in minutes." />
          <Link className="btn lg" href="/downloads"><L ar="حمّل التطبيق" en="Get the app" /></Link>
        </section>
      </div>

      <SlimFooter />
    </>
  );
}
