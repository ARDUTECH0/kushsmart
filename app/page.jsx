import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { asset } from '@/lib/site';
import {
  Bulb, Fan, Sensor, Timer, Automation, Groups, Remote, Bell, Lock,
  Bolt, Signal, Cloud, Hand, Sync, Curtain,
} from '@/components/Icons';

const NAV = [
  { href: '/#features', label: 'المميزات' },
  { href: '/#how', label: 'كيف يعمل' },
  { href: '/docs', label: 'الدليل' },
  { href: '/downloads', label: 'التحميل', btn: true },
];

const FEATURES = [
  [Bulb, 'إضاءة ومفاتيح', 'تشغيل وإطفاء جميع المفاتيح، والتحكّم في خفوت الإضاءة (Dimmer)، والإضاءة الملوّنة RGB / WS2812.'],
  [Fan, 'مراوح وستائر', 'التحكّم في سرعة المراوح وفتح وغلق الستائر والشتر الكهربائي.'],
  [Sensor, 'حسّاسات', 'حسّاسات الحرارة والرطوبة (DHT)، وحسّاسات الأبواب والحركة، والحسّاسات اللاسلكية 433MHz.'],
  [Timer, 'مؤقّتات وجدولة', 'عدّاد تنازلي، وجدولة زمنية، وإطفاء تلقائي بعد مدّة محدّدة.'],
  [Automation, 'أتمتة ذكية', '«عند تجاوز الحرارة 30 درجة، شغّل المروحة» — قواعد تربط الحسّاسات بالإجراءات.'],
  [Groups, 'مجموعات', 'اجمع عدّة أجهزة في مجموعة وتحكّم فيها جميعًا بضغطة واحدة.'],
  [Remote, 'تحكّم 433MHz و IR', 'اربط أجهزة التحكّم اللاسلكية وبالأشعّة بأجهزتك عبر خاصيّة «تعلّم الزرّ».'],
  [Bell, 'إشعارات لحظية', 'إشعار فور وقوع أي حدث — حتى والتطبيق مغلق.'],
  [Lock, 'مفاتيح مخفيّة', 'مفاتيح محميّة بكلمة سرّ لمزيد من الخصوصية والأمان.'],
];

const STEPS = [
  ['1', 'ركّب الوحدة', 'يُركّب الفنّي وحدة كوش سمارت مكان المفتاح أو في لوحة الكهرباء.'],
  ['2', 'وصّلها بالواي فاي', 'من التطبيق، اختر شبكتك وأدخل كلمة المرور — وتتّصل الوحدة خلال ثوانٍ.'],
  ['3', 'تحكّم في كل شيء', 'تظهر أجهزتك تلقائيًا، وتتحكّم فيها من الهاتف أو بصوتك أو من أي مكان.'],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader links={NAV} />

      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <span className="eyebrow">نظام المنزل الذكي</span>
            <h1>منزلك الذكي… <span className="accent">بين يديك</span></h1>
            <p>
              تحكّم في إضاءة منزلك ومراوحه وستائره وأجهزته من هاتفك، وبصوتك، ومن أي
              مكان — بسهولة ودون أي تعقيد.
            </p>
            <div className="cta">
              <Link className="btn lg" href="/downloads">حمّل التطبيق</Link>
              <Link className="btn ghost lg" href="/docs">تعرّف على كيفية البدء</Link>
            </div>
            <div className="hero-badges">
              <span><Bolt /> تحكّم محلي فوري</span>
              <span><Signal /> تحكّم 433MHz / IR</span>
              <span><Bell /> إشعارات لحظية</span>
            </div>
          </div>

          {/* signature: a live control panel */}
          <div className="panel" aria-hidden="true">
            <div className="panel-head">
              <span className="panel-room">غرفة المعيشة</span>
              <span className="panel-live"><i />متّصل</span>
            </div>
            <div className="row">
              <span className="ricon"><Bulb /></span>
              <span className="rmeta"><b>الإضاءة الرئيسية</b><span>مُشغّلة</span></span>
              <span className="tgl on" />
            </div>
            <div className="row">
              <span className="ricon"><Fan /></span>
              <span className="rmeta"><b>مروحة السقف</b><span>السرعة 60%</span></span>
              <span className="dim"><span className="track"><span className="fill" style={{ width: '60%' }} /></span></span>
            </div>
            <div className="row">
              <span className="ricon"><Curtain /></span>
              <span className="rmeta"><b>الستارة</b><span>مفتوحة</span></span>
              <span className="tgl on" />
            </div>
            <div className="row">
              <span className="ricon"><Lock /></span>
              <span className="rmeta"><b>باب المدخل</b><span>مُقفل</span></span>
              <span className="tgl" />
            </div>
          </div>
        </div>
      </section>

      {/* TELEMETRY STRIP */}
      <div className="wrap">
        <div className="stats">
          <div className="stat"><b>أي مكان</b><span>تحكّم من الهاتف عن بُعد</span></div>
          <div className="stat"><b>محلي + سحابي</b><span>سريع داخل المنزل، ومستقرّ خارجه</span></div>
          <div className="stat"><b>+10 أنواع</b><span>إضاءة، مراوح، ستائر، حسّاسات…</span></div>
          <div className="stat"><b>24/7</b><span>تشغيل مستقرّ وآمن</span></div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow">المميزات</span>
            <h2>كل ما تحتاجه لمنزل ذكي متكامل</h2>
            <p>من مفتاح واحد إلى منزل كامل — كوش سمارت يتحكّم في كل شيء.</p>
          </div>
          <div className="fgrid">
            {FEATURES.map(([Ic, h, p]) => (
              <div className="fcard" key={h}>
                <div className="ic"><Ic /></div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow">كيف يعمل</span>
            <h2>٣ خطوات ويُصبح منزلك ذكيًا</h2>
          </div>
          <div className="steps3">
            {STEPS.map(([n, h, p]) => (
              <div className="step3" key={n}>
                <div className="num">{n}</div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
          <div className="h-center" style={{ margin: '40px auto 0' }}>
            <Link className="btn lg" href="/docs">الدليل الكامل خطوة بخطوة →</Link>
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
            <span className="eyebrow">محلي + سحابي</span>
            <h2 style={{ fontSize: '30px', marginBottom: '14px', color: 'var(--ink)' }}>
              تحكّم فوري داخل المنزل… ومستقرّ خارجه
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '16.5px' }}>
              عندما تكون داخل المنزل، يعمل التحكّم عبر شبكتك مباشرةً فيكون <b>فوريًا للغاية</b>.
              وعندما تكون خارجه، يعمل عبر الإنترنت بشكل طبيعي. وتظلّ المفاتيح على الحائط
              تعمل كالمعتاد، وتتحدّث الحالة في التطبيق فورًا.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <span className="pill"><Bolt /> تحكّم محلي سريع</span>
              <span className="pill"><Cloud /> سحابي من أي مكان</span>
              <span className="pill"><Hand /> المفاتيح اليدوية تظلّ تعمل</span>
              <span className="pill"><Sync /> مزامنة فورية للحالة</span>
            </div>
          </div>
          <div className="panel" aria-hidden="true">
            <div className="panel-head">
              <span className="panel-room">المطبخ</span>
              <span className="panel-live"><i />متّصل</span>
            </div>
            <div className="row">
              <span className="ricon"><Bulb /></span>
              <span className="rmeta"><b>إضاءة موجّهة</b><span>السطوع 80%</span></span>
              <span className="dim"><span className="track"><span className="fill" style={{ width: '80%' }} /></span></span>
            </div>
            <div className="row">
              <span className="ricon"><Sensor /></span>
              <span className="rmeta"><b>حرارة ورطوبة</b><span>26° · 48%</span></span>
              <span className="tgl on" />
            </div>
            <div className="row">
              <span className="ricon"><Bolt /></span>
              <span className="rmeta"><b>السخّان</b><span>يُطفأ بعد 20 دقيقة</span></span>
              <span className="tgl on" />
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="section showcase">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow">من داخل التطبيق</span>
            <h2>واجهة بسيطة… وتحكّم كامل</h2>
            <p>كل أجهزتك في مكان واحد — منظّمة وسريعة وسهلة.</p>
          </div>
          <div className="shots-grid">
            <figure>
              <div className="shot"><img src={asset('/assets/screens/home.png')} alt="الشاشة الرئيسية" /></div>
              <p className="shot-cap">الشاشة الرئيسية — كل أجهزتك وحالتها</p>
            </figure>
            <figure>
              <div className="shot"><img src={asset('/assets/screens/groups.png')} alt="المجموعات" /></div>
              <p className="shot-cap">المجموعات — تحكّم في عدّة أجهزة بضغطة</p>
            </figure>
          </div>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section className="section dl" id="download">
        <div className="wrap">
          <h2>حمّل كوش سمارت الآن</h2>
          <p>متاح لأندرويد وآيفون. سجّل ببريدك الإلكتروني وابدأ خلال دقائق.</p>
          <div className="dl-row">
            <Link className="btn lg" href="/downloads">تحميل لأندرويد (APK)</Link>
            <Link className="btn lg" href="/downloads">Google Play</Link>
            <Link className="btn ghost lg" href="/downloads">App Store</Link>
          </div>
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#9fb8cd' }}>
            تحتاج مساعدة في الإعداد؟{' '}
            <Link href="/docs" style={{ color: '#fff', textDecoration: 'underline' }}>
              اطّلع على الدليل خطوة بخطوة
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
