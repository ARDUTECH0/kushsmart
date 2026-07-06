import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { asset } from '@/lib/site';
import HaLogo from '@/components/HaLogo';
import L from '@/components/L';
import {
  Bulb, Fan, Sensor, Timer, Automation, Groups, Remote, Bell, Lock,
  Bolt, Signal, Cloud, Hand, Sync, Curtain,
} from '@/components/Icons';

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide' },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

// [Icon, arTitle, arDesc, enTitle, enDesc]
const FEATURES = [
  [Bulb, 'إضاءة ومفاتيح', 'تشغيل وإطفاء جميع المفاتيح، والتحكّم في خفوت الإضاءة (Dimmer)، والإضاءة الملوّنة RGB / WS2812.',
    'Lights & switches', 'Turn any switch on or off, dim your lights, and set the colour of RGB / WS2812 strips.'],
  [Fan, 'مراوح وستائر', 'التحكّم في سرعة المراوح وفتح وغلق الستائر والشتر الكهربائي.',
    'Fans & curtains', 'Set fan speed, and open or close motorised curtains and roller shutters.'],
  [Sensor, 'حسّاسات', 'حسّاسات الحرارة والرطوبة (DHT)، وحسّاسات الأبواب والحركة، والحسّاسات اللاسلكية 433MHz.',
    'Sensors', 'Temperature and humidity (DHT), door and motion sensors, and 433MHz wireless sensors.'],
  [Timer, 'مؤقّتات وجدولة', 'عدّاد تنازلي، وجدولة زمنية، وإطفاء تلقائي بعد مدّة محدّدة.',
    'Timers & schedules', 'Countdown timers, weekly schedules, and auto-off after a set time.'],
  [Automation, 'أتمتة ذكية', '«عند تجاوز الحرارة 30 درجة، شغّل المروحة» — قواعد تربط الحسّاسات بالإجراءات.',
    'Smart automations', '“When the temperature goes above 30°, turn on the fan.” Rules that link sensors to actions.'],
  [Groups, 'مجموعات', 'اجمع عدّة أجهزة في مجموعة وتحكّم فيها جميعًا بضغطة واحدة.',
    'Groups', 'Put several devices in one group and control them all with a single tap.'],
  [Remote, 'تحكّم 433MHz و IR', 'اربط أجهزة التحكّم اللاسلكية وبالأشعّة بأجهزتك عبر خاصيّة «تعلّم الزرّ».',
    '433MHz & IR remotes', 'Pair your RF and infrared remotes to your devices with learn-a-button.'],
  [Bell, 'إشعارات لحظية', 'إشعار فور وقوع أي حدث — حتى والتطبيق مغلق.',
    'Instant alerts', 'Get a notification the moment something happens — even when the app is closed.'],
  [Lock, 'مفاتيح مخفيّة', 'مفاتيح محميّة بكلمة سرّ لمزيد من الخصوصية والأمان.',
    'Hidden switches', 'Lock individual switches behind a PIN for extra privacy and security.'],
];

// [num, arTitle, arDesc, enTitle, enDesc]
const STEPS = [
  ['1', 'ركّب الوحدة', 'يُركّب الفنّي وحدة كوش سمارت مكان المفتاح أو في لوحة الكهرباء.',
    'Fit the unit', 'A technician fits the KUSH SMART unit behind your switch or in the breaker panel.'],
  ['2', 'وصّلها بالواي فاي', 'من التطبيق، اختر شبكتك وأدخل كلمة المرور — وتتّصل الوحدة خلال ثوانٍ.',
    'Connect to Wi-Fi', 'In the app, pick your network and enter the password — the unit connects in seconds.'],
  ['3', 'تحكّم في كل شيء', 'تظهر أجهزتك تلقائيًا، وتتحكّم فيها من الهاتف أو بصوتك أو من أي مكان.',
    'Control everything', 'Your devices show up on their own. Control them from your phone, your voice, or anywhere.'],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader links={NAV} />

      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <span className="eyebrow"><L ar="نظام المنزل الذكي" en="Smart home system" /></span>
            <h1 data-ar="">منزلك الذكي… <span className="accent">بين يديك</span></h1>
            <h1 data-en="">Your smart home, <span className="accent">in your hand</span></h1>
            <p>
              <L
                ar="تحكّم في إضاءة منزلك ومراوحه وستائره وأجهزته من هاتفك، وبصوتك، ومن أي مكان — بسهولة ودون أي تعقيد."
                en="Control your home's lights, fans, curtains and appliances from your phone, your voice, or anywhere — simply, with no fuss."
              />
            </p>
            <div className="cta">
              <Link className="btn lg" href="/downloads"><L ar="حمّل التطبيق" en="Get the app" /></Link>
              <Link className="btn ghost lg" href="/docs"><L ar="تعرّف على كيفية البدء" en="See how to start" /></Link>
            </div>
            <div className="hero-badges">
              <span><Bolt /> <L ar="تحكّم محلي فوري" en="Instant local control" /></span>
              <span><Signal /> <L ar="تحكّم 433MHz / IR" en="433MHz / IR remotes" /></span>
              <span><Bell /> <L ar="إشعارات لحظية" en="Instant alerts" /></span>
            </div>
          </div>

          {/* signature: a live control panel */}
          <div className="panel" aria-hidden="true">
            <div className="panel-head">
              <span className="panel-room"><L ar="غرفة المعيشة" en="Living room" /></span>
              <span className="panel-live"><i /><L ar="متّصل" en="Online" /></span>
            </div>
            <div className="row">
              <span className="ricon"><Bulb /></span>
              <span className="rmeta"><b><L ar="الإضاءة الرئيسية" en="Main lights" /></b><span><L ar="مُشغّلة" en="On" /></span></span>
              <span className="tgl on" />
            </div>
            <div className="row">
              <span className="ricon"><Fan /></span>
              <span className="rmeta"><b><L ar="مروحة السقف" en="Ceiling fan" /></b><span><L ar="السرعة 60%" en="Speed 60%" /></span></span>
              <span className="dim"><span className="track"><span className="fill" style={{ width: '60%' }} /></span></span>
            </div>
            <div className="row">
              <span className="ricon"><Curtain /></span>
              <span className="rmeta"><b><L ar="الستارة" en="Curtain" /></b><span><L ar="مفتوحة" en="Open" /></span></span>
              <span className="tgl on" />
            </div>
            <div className="row">
              <span className="ricon"><Lock /></span>
              <span className="rmeta"><b><L ar="باب المدخل" en="Front door" /></b><span><L ar="مُقفل" en="Locked" /></span></span>
              <span className="tgl" />
            </div>
          </div>
        </div>
      </section>

      {/* TELEMETRY STRIP */}
      <div className="wrap">
        <div className="stats">
          <div className="stat"><b><L ar="أي مكان" en="Anywhere" /></b><span><L ar="تحكّم من الهاتف عن بُعد" en="Control from your phone, remotely" /></span></div>
          <div className="stat"><b><L ar="محلي + سحابي" en="Local + cloud" /></b><span><L ar="سريع داخل المنزل، ومستقرّ خارجه" en="Fast at home, reliable away" /></span></div>
          <div className="stat"><b><L ar="+10 أنواع" en="10+ types" /></b><span><L ar="إضاءة، مراوح، ستائر، حسّاسات…" en="Lights, fans, curtains, sensors…" /></span></div>
          <div className="stat"><b>24/7</b><span><L ar="تشغيل مستقرّ وآمن" en="Stable and secure" /></span></div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow"><L ar="المميزات" en="Features" /></span>
            <L tag="h2" ar="كل ما تحتاجه لمنزل ذكي متكامل" en="Everything a complete smart home needs" />
            <L tag="p" ar="من مفتاح واحد إلى منزل كامل — كوش سمارت يتحكّم في كل شيء." en="From a single switch to a whole house — KUSH SMART runs all of it." />
          </div>
          <div className="fgrid">
            {FEATURES.map(([Ic, ah, ap, eh, ep]) => (
              <div className="fcard" key={eh}>
                <div className="ic"><Ic /></div>
                <h3><L ar={ah} en={eh} /></h3>
                <p><L ar={ap} en={ep} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow"><L ar="كيف يعمل" en="How it works" /></span>
            <L tag="h2" ar="٣ خطوات ويُصبح منزلك ذكيًا" en="Three steps to a smart home" />
          </div>
          <div className="steps3">
            {STEPS.map(([n, ah, ap, eh, ep]) => (
              <div className="step3" key={n}>
                <div className="num">{n}</div>
                <h3><L ar={ah} en={eh} /></h3>
                <p><L ar={ap} en={ep} /></p>
              </div>
            ))}
          </div>
          <div className="h-center" style={{ margin: '40px auto 0' }}>
            <Link className="btn lg" href="/docs"><L ar="الدليل الكامل خطوة بخطوة ←" en="The full step-by-step guide →" /></Link>
          </div>
        </div>
      </section>

      {/* CONTROL ANYWHERE */}
      <section className="section">
        <div
          className="wrap"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '44px', alignItems: 'center' }}
        >
          <div>
            <span className="eyebrow"><L ar="محلي + سحابي" en="Local + cloud" /></span>
            <L tag="h2" style={{ fontSize: '30px', marginBottom: '14px', color: 'var(--ink)' }}
              ar="تحكّم فوري داخل المنزل… ومستقرّ خارجه" en="Instant at home, reliable away" />
            <p style={{ color: 'var(--muted)', fontSize: '16.5px' }} data-ar="">
              عندما تكون داخل المنزل، يعمل التحكّم عبر شبكتك مباشرةً فيكون <b>فوريًا للغاية</b>.
              وعندما تكون خارجه، يعمل عبر الإنترنت بشكل طبيعي. وتظلّ المفاتيح على الحائط
              تعمل كالمعتاد، وتتحدّث الحالة في التطبيق فورًا.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '16.5px' }} data-en="">
              At home, control runs straight over your own network, so it's <b>instant</b>.
              Away, it works over the internet as usual. Your wall switches keep working too,
              and the app updates in real time.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <span className="pill"><Bolt /> <L ar="تحكّم محلي سريع" en="Fast local control" /></span>
              <span className="pill"><Cloud /> <L ar="سحابي من أي مكان" en="Cloud from anywhere" /></span>
              <span className="pill"><Hand /> <L ar="المفاتيح اليدوية تظلّ تعمل" en="Manual switches still work" /></span>
              <span className="pill"><Sync /> <L ar="مزامنة فورية للحالة" en="Real-time status sync" /></span>
            </div>
          </div>
          <div className="panel" aria-hidden="true">
            <div className="panel-head">
              <span className="panel-room"><L ar="المطبخ" en="Kitchen" /></span>
              <span className="panel-live"><i /><L ar="متّصل" en="Online" /></span>
            </div>
            <div className="row">
              <span className="ricon"><Bulb /></span>
              <span className="rmeta"><b><L ar="إضاءة موجّهة" en="Spotlights" /></b><span><L ar="السطوع 80%" en="Brightness 80%" /></span></span>
              <span className="dim"><span className="track"><span className="fill" style={{ width: '80%' }} /></span></span>
            </div>
            <div className="row">
              <span className="ricon"><Sensor /></span>
              <span className="rmeta"><b><L ar="حرارة ورطوبة" en="Temp & humidity" /></b><span>26° · 48%</span></span>
              <span className="tgl on" />
            </div>
            <div className="row">
              <span className="ricon"><Bolt /></span>
              <span className="rmeta"><b><L ar="السخّان" en="Water heater" /></b><span><L ar="يُطفأ بعد 20 دقيقة" en="Off in 20 min" /></span></span>
              <span className="tgl on" />
            </div>
          </div>
        </div>
      </section>

      {/* WORKS WITH HOME ASSISTANT */}
      <section className="section ha-band">
        <div className="wrap ha-band-in">
          <div className="ha-band-badge"><HaLogo size={72} /></div>
          <div className="ha-band-txt">
            <span className="eyebrow"><L ar="يعمل مع Home Assistant" en="Works with Home Assistant" /></span>
            <L tag="h2" ar="اربطه بـ Home Assistant — محلي وسحابي معًا" en="Connect it to Home Assistant — local and cloud together" />
            <L tag="p"
              ar="اكتشاف تلقائي لكل أجهزتك — مفاتيح، إضاءة، RGB، ستائر، حسّاسات، قفل وعدّاد طاقة. تحكّم محلي فوري داخل المنزل وسحابي من أي مكان، في آنٍ واحد."
              en="Every device is found automatically — switches, lights, RGB, curtains, sensors, locks and power meters. Control it locally at home and over the cloud away, at the same time." />
            <Link className="btn lg" href="/docs/home-assistant"><L ar="دليل الربط مع Home Assistant ←" en="Home Assistant setup guide →" /></Link>
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="section showcase">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow"><L ar="من داخل التطبيق" en="Inside the app" /></span>
            <L tag="h2" ar="واجهة بسيطة… وتحكّم كامل" en="A simple interface, full control" />
            <L tag="p" ar="كل أجهزتك في مكان واحد — منظّمة وسريعة وسهلة." en="All your devices in one place — organised, fast and easy." />
          </div>
          <div className="shots-grid">
            <figure>
              <div className="shot"><img src={asset('/assets/screens/home.png')} alt="KUSH SMART app home screen" /></div>
              <p className="shot-cap"><L ar="الشاشة الرئيسية — كل أجهزتك وحالتها" en="Home screen — all your devices and their status" /></p>
            </figure>
            <figure>
              <div className="shot"><img src={asset('/assets/screens/groups.png')} alt="KUSH SMART app groups" /></div>
              <p className="shot-cap"><L ar="المجموعات — تحكّم في عدّة أجهزة بضغطة" en="Groups — control several devices with one tap" /></p>
            </figure>
          </div>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section className="section dl" id="download">
        <div className="wrap">
          <L tag="h2" ar="حمّل كوش سمارت الآن" en="Download KUSH SMART" />
          <L tag="p" ar="متاح لأندرويد وآيفون. سجّل ببريدك الإلكتروني وابدأ خلال دقائق." en="Available for Android and iPhone. Sign up with your email and get started in minutes." />
          <div className="dl-row">
            <Link className="btn lg" href="/downloads"><L ar="تحميل لأندرويد (APK)" en="Download for Android (APK)" /></Link>
            <Link className="btn lg" href="/downloads">Google Play</Link>
            <Link className="btn ghost lg" href="/downloads">App Store</Link>
          </div>
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#9fb8cd' }}>
            <L ar="تحتاج مساعدة في الإعداد؟" en="Need help setting up?" />{' '}
            <Link href="/docs" style={{ color: '#fff', textDecoration: 'underline' }}>
              <L ar="اطّلع على الدليل خطوة بخطوة" en="Read the step-by-step guide" />
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
