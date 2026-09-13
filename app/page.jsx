import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import HaLogo from '@/components/HaLogo';
import GoogleHomeLogo from '@/components/GoogleHomeLogo';
import AlexaLogo from '@/components/AlexaLogo';
import AppShot from '@/components/AppShot';
import L from '@/components/L';
import { SUPPORT_EMAIL } from '@/lib/site';
import { SITE, pageMeta } from '@/lib/seo';
import {
  Bulb, Fan, Sensor, Timer, Automation, Groups, Remote, Bell, Lock,
  Bolt, Signal, Cloud, Hand, Key, Check, Globe, Android, ArrowEnd,
} from '@/components/Icons';

export const metadata = pageMeta({
  title: 'كوش سمارت KUSH SMART — منزل ذكي يُركَّب خلف مفاتيحك الحالية',
  description:
    'تُركَّب وحدات كوش سمارت خلف المفاتيح أو في لوحة الكهرباء، فتتحكّم في الإضاءة والمراوح والستائر والتكييف من هاتفك وبصوتك — داخل المنزل وخارجه. Smart home units that fit behind your existing switches.',
  path: '/',
  absolute: true,
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

// Structured data: who makes it, what it is, and that the app is free.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: 'KUSH SMART',
      alternateName: 'كوش سمارت',
      url: SITE,
      logo: `${SITE}/assets/icon.png`,
      email: SUPPORT_EMAIL,
      parentOrganization: { '@type': 'Organization', name: 'ATGENX' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'KUSH SMART — كوش سمارت',
      inLanguage: ['ar', 'en'],
      publisher: { '@id': `${SITE}/#org` },
    },
    {
      '@type': 'Product',
      name: 'KUSH SMART smart home units',
      alternateName: 'وحدات كوش سمارت للمنزل الذكي',
      brand: { '@type': 'Brand', name: 'KUSH SMART' },
      manufacturer: { '@type': 'Organization', name: 'ATGENX' },
      image: `${SITE}/assets/icon.png`,
      description:
        'Smart home units that fit behind existing switches or in the breaker panel: lights, fans, curtains, AC remotes, power meters and smart locks, controlled from the app, by voice, or automatically.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'KUSH SMART',
      operatingSystem: 'Android',
      applicationCategory: 'LifestyleApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP' },
      publisher: { '@id': `${SITE}/#org` },
    },
  ],
};

// The hero is a distribution board: KUSH SMART units sit on a DIN rail (or
// behind the wall switch), so that's what the page opens with.
// [ar, en, channel label, on?]
const MODULES = [
  ['الصالة', 'Living room', 'CH1', true],
  ['المطبخ', 'Kitchen', 'CH2', true],
  ['التكييف', 'AC', 'IR', false],
  ['السخّان', 'Heater', 'CH4', true],
];

// Things that are true of the product, not marketing numbers.
// [Icon, arTitle, arDesc, enTitle, enDesc]
const FACTS = [
  [Signal, 'يعمل دون إنترنت', 'داخل المنزل يمرّ التحكّم عبر شبكتك مباشرةً.',
    'Works without internet', 'At home, control runs straight over your own network.'],
  [Hand, 'مفاتيح الحائط تظلّ تعمل', 'يبقى المفتاح العادي كما هو، ويتحدّث التطبيق فورًا.',
    'Wall switches still work', 'The ordinary switch stays as it is, and the app updates instantly.'],
  [Key, 'تحديثات آمنة', 'تصل التحديثات لاسلكيًا، ولا تقبل الوحدة إلا التحديثات الصادرة منّا.',
    'Secure updates', 'Updates arrive wirelessly, and a unit only accepts updates that come from us.'],
  [Globe, 'بالعربية والإنجليزية', 'التطبيق والدليل والدعم باللغتين.',
    'Arabic & English', 'The app, the guide and support, in both languages.'],
];

// Features, grouped by the job they do rather than listed as nine equal tiles.
const GROUPS = [
  {
    ar: 'التحكّم', en: 'Control',
    pAr: 'كل ما في المنزل، من مكان واحد.', pEn: 'Everything in the house, from one place.',
    items: [
      [Bulb, 'إضاءة ومفاتيح', 'تشغيل وإطفاء، وخفوت الإضاءة، والإضاءة الملوّنة.',
        'Lights & switches', 'On and off, dimming, and colour lighting.'],
      [Fan, 'مراوح وستائر', 'سرعة المراوح، وفتح وغلق الستائر والشتر الكهربائي.',
        'Fans & curtains', 'Fan speed, and motorised curtains and roller shutters.'],
      [Groups, 'مجموعات', 'اجمع عدّة أجهزة وتحكّم فيها جميعًا بضغطة واحدة.',
        'Groups', 'Put several devices together and run them with one tap.'],
      [Remote, 'الريموت', 'اربط ريموت التكييف والتلفزيون والريموت اللاسلكي بالتطبيق.',
        'Remotes', 'Bring your AC, TV and wireless remotes into the app.'],
    ],
  },
  {
    ar: 'الاستشعار والتنبيه', en: 'Sensing & alerts',
    pAr: 'اعرف ما يحدث في منزلك لحظة حدوثه.', pEn: 'Know what happens at home as it happens.',
    items: [
      [Sensor, 'حسّاسات', 'الحرارة والرطوبة، وفتح الأبواب، والحركة.',
        'Sensors', 'Temperature and humidity, doors opening, and motion.'],
      [Bell, 'إشعارات لحظية', 'إشعار فور وقوع أي حدث — حتى والتطبيق مغلق.',
        'Instant alerts', 'A notification the moment something happens — even with the app closed.'],
      [Lock, 'مفاتيح مخفيّة', 'مفاتيح محميّة برمز سرّي لمزيد من الخصوصية.',
        'Hidden switches', 'Switches locked behind a PIN, for extra privacy.'],
    ],
  },
  {
    ar: 'الأتمتة', en: 'Automation',
    pAr: 'دع المنزل يتصرّف بنفسه.', pEn: 'Let the house act on its own.',
    items: [
      [Timer, 'مؤقّتات وجدولة', 'عدّاد تنازلي، وجدولة أسبوعية، وإطفاء تلقائي بعد مدّة محدّدة.',
        'Timers & schedules', 'Countdowns, weekly schedules, and auto-off after a set time.'],
      [Automation, 'قواعد ذكية', '«عند تجاوز الحرارة 30 درجة، شغّل المروحة» — وتعمل حتى والتطبيق مغلق.',
        'Smart rules', '“When it goes above 30°, turn on the fan” — and it runs even with the app closed.'],
    ],
  },
];

// The product line. [Icon, ar, en, arDesc, enDesc]
const UNITS = [
  [Bulb, 'مفاتيح وإضاءة', 'Switches & lighting',
    'للإضاءة والمراوح والستائر، مع الخفوت والإضاءة الملوّنة.', 'For lights, fans and curtains, with dimming and colour.'],
  [Remote, 'ريموت التكييف والتلفزيون', 'AC & TV remote',
    'يتحكّم في التكييف والتلفزيون والرسيفر من التطبيق.', 'Runs the AC, the TV and the receiver from the app.'],
  [Bolt, 'عدّاد الطاقة', 'Power meter',
    'استهلاك الكهرباء في منزلك، لحظة بلحظة.', 'Your home’s electricity use, live.'],
  [Lock, 'القفل الذكي', 'Smart lock',
    'افتح الباب من التطبيق، مع إشعار عند كل استخدام.', 'Unlock from the app, with an alert on every use.'],
];

// [arTitle, arDesc, enTitle, enDesc]
const STEPS = [
  ['ركّب الوحدة', 'يُركّب الفنّي وحدة كوش سمارت خلف المفتاح أو في لوحة الكهرباء.',
    'Fit the unit', 'A technician fits the KUSH SMART unit behind the switch or in the breaker panel.'],
  ['وصّلها بالواي فاي', 'تعرض الوحدة الشبكات المتاحة في التطبيق — اختر شبكتك وأدخل كلمة المرور.',
    'Connect to Wi-Fi', 'The unit lists the networks it can see in the app — pick yours and enter the password.'],
  ['تحكّم في كل شيء', 'تظهر أجهزتك تلقائيًا، وتتحكّم فيها من الهاتف أو بصوتك ومن أي مكان.',
    'Control everything', 'Your devices appear on their own — run them from your phone, your voice, or anywhere.'],
];

// What happens to a command, in the three situations a customer is ever in.
// [Icon, ar, en, arDesc, enDesc, arTag, enTag]
const PATHS = [
  [Signal, 'داخل المنزل', 'At home',
    'يصل الأمر مباشرةً عبر شبكة منزلك — فيكون فوريًا.', 'The command goes straight over your home network — instantly.',
    'الأسرع', 'Fastest'],
  [Hand, 'إن انقطع الإنترنت', 'If the internet drops',
    'يستمرّ التحكّم داخل المنزل، وتعمل مفاتيح الحائط كالمعتاد.', 'Control keeps working at home, and the wall switches work as usual.',
    'دون انقطاع', 'Uninterrupted'],
  [Cloud, 'خارج المنزل', 'Away from home',
    'تتحكّم في منزلك من أي مكان عبر اتصال آمن.', 'Run your home from anywhere over a secure connection.',
    'من أي مكان', 'Anywhere'],
];

// [ar, en]
const LICENCE = [
  ['تفعيل دائم للوحدة — دفعة واحدة', 'Lifetime activation — one payment'],
  ['تحكّم كامل من التطبيق ومن Home Assistant', 'Full control from the app and Home Assistant'],
  ['تحديثات لاسلكية مجّانية', 'Free wireless updates'],
  ['دعم فنّي', 'Technical support'],
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <SiteHeader links={NAV} />

      {/* HERO */}
      <section className="hero">
        <div className="wrap hm-hero-in">
          <div>
            <span className="eyebrow"><L ar="يُركَّب خلف مفاتيحك الحالية" en="Fits behind the switches you already have" /></span>
            <h1 data-ar="">منزلك الذكي… <span className="accent">بين يديك</span></h1>
            <h1 data-en="">Your smart home, <span className="accent">in your hand</span></h1>
            <p className="lead">
              <L
                ar="تُركَّب وحدات كوش سمارت خلف المفاتيح أو في لوحة الكهرباء، فتتحكّم في الإضاءة والمراوح والستائر والتكييف من هاتفك وبصوتك — داخل المنزل وخارجه."
                en="KUSH SMART units fit behind your switches or in the breaker panel, so you run the lights, fans, curtains and AC from your phone or your voice — at home and away."
              />
            </p>
            <div className="hm-cta">
              <Link className="btn lg" href="/downloads"><Android /><L ar="حمّل التطبيق" en="Get the app" /></Link>
              <Link className="btn ghost lg" href="/pricing"><L ar="الأسعار والترخيص" en="Pricing & licence" /></Link>
            </div>
            <div className="hm-works">
              <span><L ar="يعمل مع" en="Works with" /></span>
              <span className="hm-chip"><span><GoogleHomeLogo size={18} /></span>Google Home</span>
              <span className="hm-chip"><span><AlexaLogo size={18} /></span>Alexa</span>
              <span className="hm-chip"><span><HaLogo size={18} /></span>Home Assistant</span>
            </div>
          </div>

          <div className="hm-board" aria-hidden="true">
            <div className="hm-board-top">
              <b>KUSH SMART</b>
              <span className="hm-live"><i /><L ar="متّصل · 4 قنوات" en="Online · 4 channels" /></span>
            </div>
            <div className="hm-rail">
              {MODULES.map(([ar, en, ch, on], i) => (
                <div className={`hm-mod ${on ? 'on' : ''}`} key={en} style={{ '--d': `${0.35 + i * 0.22}s` }}>
                  <span className="hm-mod-lamp" />
                  <span className="hm-mod-sw" />
                  <b><L ar={ar} en={en} /></b>
                  <small>{ch}</small>
                </div>
              ))}
            </div>
            <div className="hm-board-bus">
              <span className="hm-bus"><Signal /><span><L ar="شبكة المنزل" en="Home network" /></span><i /></span>
              <span className="hm-bus"><Cloud /><span><L ar="عن بُعد" en="Remote" /></span><i /></span>
              <span className="hm-bus"><Bell /><span><L ar="الإشعارات" en="Alerts" /></span><i /></span>
            </div>
          </div>
        </div>
      </section>

      {/* FACTS */}
      <div className="wrap">
        <div className="hm-facts">
          {FACTS.map(([Ic, ah, ap, eh, ep]) => (
            <div className="hm-fact" key={eh}>
              <span className="hm-ic"><Ic /></span>
              <div>
                <b><L ar={ah} en={eh} /></b>
                <span><L ar={ap} en={ep} /></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="wrap">
          <div className="h-start">
            <span className="eyebrow"><L ar="المميزات" en="Features" /></span>
            <L tag="h2" ar="من مفتاح واحد… إلى منزل كامل" en="From one switch to the whole house" />
            <L tag="p" ar="ابدأ بوحدة واحدة وأضف ما تحتاجه متى شئت — كل شيء يعمل من التطبيق نفسه."
              en="Start with a single unit and add more whenever you like — it all runs from the same app." />
          </div>

          <div className="hm-groups">
            {GROUPS.map((g) => (
              <div className="hm-group" key={g.en}>
                <div className="hm-group-h">
                  <h3><L ar={g.ar} en={g.en} /></h3>
                  <p><L ar={g.pAr} en={g.pEn} /></p>
                </div>
                {g.items.map(([Ic, ah, ap, eh, ep]) => (
                  <div className="hm-feat" key={eh}>
                    <span className="hm-ic"><Ic /></span>
                    <div>
                      <h4><L ar={ah} en={eh} /></h4>
                      <p><L ar={ap} en={ep} /></p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="hm-units-h">
            <L tag="h3" ar="الوحدات" en="The units" />
            <Link href="/pricing"><L ar="الأسعار والترخيص" en="Pricing & licence" /><ArrowEnd className="flip" /></Link>
          </div>
          <div className="hm-units">
            {UNITS.map(([Ic, ar, en, ap, ep]) => (
              <div className="hm-unit" key={en}>
                <span className="hm-ic"><Ic /></span>
                <b><L ar={ar} en={en} /></b>
                <p><L ar={ap} en={ep} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section hm-band" id="how">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow"><L ar="كيف يعمل" en="How it works" /></span>
            <L tag="h2" ar="ثلاث خطوات ويصبح منزلك ذكيًا" en="Three steps to a smart home" />
          </div>
          <ol className="hm-steps">
            {STEPS.map(([ah, ap, eh, ep], i) => (
              <li className="hm-step" key={eh}>
                <span className="hm-step-n">{i + 1}</span>
                <h3><L ar={ah} en={eh} /></h3>
                <p><L ar={ap} en={ep} /></p>
              </li>
            ))}
          </ol>
          <div className="hm-steps-cta">
            <Link className="btn ghost lg" href="/docs">
              <L ar="الدليل الكامل خطوة بخطوة" en="The full step-by-step guide" /><ArrowEnd className="flip" />
            </Link>
          </div>
        </div>
      </section>

      {/* RELIABILITY */}
      <section className="section">
        <div className="wrap hm-split">
          <div>
            <span className="eyebrow"><L ar="يعتمد عليه" en="Dependable" /></span>
            <L tag="h2" ar="يعمل في كل الأحوال" en="It works, whatever happens" />
            <p data-ar="">
              حين تكون في المنزل، يصل الأمر إلى الوحدة عبر شبكتك مباشرةً — فيكون <b>فوريًا</b>. وإن انقطع
              الإنترنت يستمرّ التحكّم داخل المنزل كما هو. وحين تكون خارجه، تتحكّم في منزلك من أي مكان.
            </p>
            <p data-en="">
              At home, a command goes straight to the unit over your own network — so it’s <b>instant</b>. If the
              internet drops, control at home carries on as usual. And away from home, you run it from anywhere.
            </p>
            <p data-ar="">وتؤكّد الوحدة حالتها بعد كل أمر، فما تراه في التطبيق هو ما يحدث فعلًا.</p>
            <p data-en="">The unit confirms its state after every command, so what the app shows is what really happened.</p>
          </div>

          <div className="hm-paths">
            {PATHS.map(([Ic, ar, en, ad, ed, at, et], i) => (
              <div className={`hm-path ${i === 0 ? 'first' : ''}`} key={en}>
                <span className="hm-ic"><Ic /></span>
                <div>
                  <b><L ar={ar} en={en} /></b>
                  <small><L ar={ad} en={ed} /></small>
                </div>
                <span className="hm-path-tag"><L ar={at} en={et} /></span>
              </div>
            ))}
            <div className="hm-paths-f"><Check /><L ar="وتتأكّد الوحدة من تنفيذ كل أمر." en="And the unit confirms every command." /></div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="section int-band">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow"><L ar="يتكامل مع" en="Integrates with" /></span>
            <L tag="h2" ar="يعمل مع الأنظمة التي تستخدمها" en="Works with the systems you already use" />
            <L tag="p"
              ar="اربطه بأيٍّ منها في دقائق — تظهر أجهزتك تلقائيًا وتتزامن حالتها لحظيًا مع التطبيق."
              en="Link it to any of them in minutes — your devices show up automatically and stay in sync with the app." />
          </div>
          <div className="int-grid">
            <Link className="int-card" href="/docs/google-home">
              <span className="int-badge"><GoogleHomeLogo size={44} /></span>
              <h3>Google Home</h3>
              <p><L ar="تحكّم بصوتك مع مساعد Google." en="Voice control with Google Assistant." /></p>
              <span className="int-cta"><L ar="دليل الربط" en="Setup guide" /><ArrowEnd className="flip" /></span>
            </Link>
            <Link className="int-card" href="/docs/alexa">
              <span className="int-badge"><AlexaLogo size={44} /></span>
              <h3>Amazon Alexa</h3>
              <p><L ar="تحكّم بصوتك مع Alexa." en="Voice control with Alexa." /></p>
              <span className="int-cta"><L ar="دليل الربط" en="Setup guide" /><ArrowEnd className="flip" /></span>
            </Link>
            <Link className="int-card" href="/docs/home-assistant">
              <span className="int-badge"><HaLogo size={44} /></span>
              <h3>Home Assistant</h3>
              <p><L ar="كل أجهزتك داخل Home Assistant، تلقائيًا." en="Every device inside Home Assistant, automatically." /></p>
              <span className="int-cta"><L ar="دليل الربط" en="Setup guide" /><ArrowEnd className="flip" /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* INSIDE THE APP */}
      <section className="section">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow"><L ar="من داخل التطبيق" en="Inside the app" /></span>
            <L tag="h2" ar="واجهة بسيطة… وتحكّم كامل" en="A simple interface, full control" />
            <L tag="p" ar="كل أجهزتك في مكان واحد — منظّمة وسريعة وسهلة." en="All your devices in one place — organised, fast and easy." />
          </div>
          <div className="mk-showcase">
            {/* Real captures from the app's demo mode — an invented home, no account data. */}
            <figure>
              <AppShot name="app-living" alt="غرف المنزل في تطبيق كوش سمارت — KUSH SMART app: switches, dimmer and temperature" />
              <figcaption className="mk-cap"><L ar="كل غرفة — المفاتيح والخفوت والحرارة" en="Each room — switches, dimming and temperature" /></figcaption>
            </figure>
            <figure>
              <AppShot name="app-home" alt="الشاشة الرئيسية في تطبيق كوش سمارت — KUSH SMART app home screen" />
              <figcaption className="mk-cap"><L ar="الشاشة الرئيسية — القفل والطاقة والتكييف" en="Home screen — lock, power and AC" /></figcaption>
            </figure>
            <figure>
              <AppShot name="app-groups" alt="المجموعات في تطبيق كوش سمارت — KUSH SMART app groups" />
              <figcaption className="mk-cap"><L ar="المجموعات — عدّة أجهزة بضغطة واحدة" en="Groups — several devices with one tap" /></figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="dl" id="download">
        <div className="wrap hm-final">
          <div>
            <span className="eyebrow"><L ar="ابدأ الآن" en="Get started" /></span>
            <L tag="h2" ar="ابدأ بمفتاح واحد" en="Start with one switch" />
            <L tag="p"
              ar="حمّل التطبيق مجانًا، وأضف وحدتك الأولى خلال دقائق. وإن احتجت مساعدة، فالدليل يشرح كل خطوة."
              en="Download the app for free and add your first unit in minutes. If you need help, the guide walks through every step." />
            <div className="dl-row">
              <Link className="btn lg" href="/downloads"><Android /><L ar="تحميل لأندرويد" en="Download for Android" /></Link>
              <Link className="btn ghost lg" href="/docs"><L ar="اقرأ الدليل" en="Read the guide" /></Link>
            </div>
          </div>
          <div className="hm-licence">
            <b><L ar="ترخيص دائم بدفعة واحدة" en="A lifetime licence, one payment" /></b>
            <span><L ar="لكل وحدة — دون اشتراك شهري." en="Per unit — no monthly subscription." /></span>
            <ul>
              {LICENCE.map(([ar, en]) => (
                <li key={en}><Check /><L ar={ar} en={en} /></li>
              ))}
            </ul>
            <Link href="/pricing"><L ar="الأسعار واطلب الترخيص" en="Pricing & request a licence" /><ArrowEnd className="flip" /></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
