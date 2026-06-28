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
  { href: '/#how', label: 'إزاي بيشتغل' },
  { href: '/docs', label: 'الدليل' },
  { href: '/downloads', label: 'التحميل', btn: true },
];

const FEATURES = [
  [Bulb, 'إضاءة ومفاتيح', 'تشغيل/إطفاء كل المفاتيح، وخفت الإضاءة (Dimmer)، وإضاءة ملوّنة RGB / WS2812.'],
  [Fan, 'مراوح وستائر', 'تحكّم في سرعة المراوح وفتح/قفل الستائر والشتر الكهربائي.'],
  [Sensor, 'حسّاسات', 'حرارة ورطوبة (DHT)، حسّاسات أبواب وحركة، وحسّاسات لاسلكية 433MHz.'],
  [Timer, 'مؤقتات وجدولة', 'عدّاد تنازلي، جدولة بالوقت، وإطفاء تلقائي «يطفّي بعد كذا دقيقة».'],
  [Automation, 'أتمتة ذكية', '«لما الحرارة تعدّي 30 شغّل المروحة» — قواعد تربط الحسّاسات بالأفعال.'],
  [Groups, 'مجموعات', 'اجمع أجهزة في مجموعة وتحكّم فيها كلها بضغطة واحدة.'],
  [Remote, 'ريموت 433MHz و IR', 'اربط ريموتات لاسلكية وأشعة بأجهزتك بخاصية «تعلّم الزر».'],
  [Bell, 'إشعارات لحظية', 'إشعار أول ما يحصل أي حدث — حتى والتطبيق مقفول.'],
  [Lock, 'مفاتيح مخفية', 'مفاتيح محمية بكلمة سر لخصوصية وأمان أكتر.'],
];

const STEPS = [
  ['1', 'ركّب الوحدة', 'الفني بيركّب وحدة كوش سمارت مكان المفتاح أو في لوحة الكهرباء.'],
  ['2', 'وصّلها بالواي فاي', 'من التطبيق، اختار شبكتك واكتب الباسورد — والوحدة تتصل في ثواني.'],
  ['3', 'اتحكّم في كل حاجة', 'أجهزتك بتظهر لوحدها، وتتحكم فيها من الموبايل أو بصوتك أو من أي مكان.'],
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
            <h1>منزلك الذكي… <span className="accent">في إيدك</span></h1>
            <p>
              تحكّم في إضاءة بيتك ومراوحه وستائره وأجهزته من موبايلك، بصوتك، ومن أي
              مكان — بسهولة وبدون أي تعقيد.
            </p>
            <div className="cta">
              <Link className="btn lg" href="/downloads">حمّل التطبيق</Link>
              <Link className="btn ghost lg" href="/docs">اعرف إزاي تبدأ</Link>
            </div>
            <div className="hero-badges">
              <span><Bolt /> تحكّم محلي فوري</span>
              <span><Signal /> ريموت 433MHz / IR</span>
              <span><Bell /> إشعارات لحظية</span>
            </div>
          </div>

          {/* signature: a live control panel */}
          <div className="panel" aria-hidden="true">
            <div className="panel-head">
              <span className="panel-room">غرفة المعيشة</span>
              <span className="panel-live"><i />متصل</span>
            </div>
            <div className="row">
              <span className="ricon"><Bulb /></span>
              <span className="rmeta"><b>نور رئيسي</b><span>مُشغّل</span></span>
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
          <div className="stat"><b>أي مكان</b><span>تحكّم من الموبايل عن بُعد</span></div>
          <div className="stat"><b>محلي + سحابي</b><span>سريع جوه البيت، ثابت بره</span></div>
          <div className="stat"><b>+10 أنواع</b><span>إضاءة، مراوح، ستائر، حسّاسات…</span></div>
          <div className="stat"><b>24/7</b><span>تشغيل مستقر وآمن</span></div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="wrap">
          <div className="h-center">
            <span className="eyebrow">المميزات</span>
            <h2>كل اللي محتاجه لبيت ذكي بالكامل</h2>
            <p>من مفتاح واحد لحد بيت كامل — كوش سمارت بيتحكم في كل حاجة.</p>
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
            <span className="eyebrow">إزاي بيشتغل</span>
            <h2>3 خطوات وبيتك يبقى ذكي</h2>
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
              تحكّم فوري في البيت… وثابت وانت بره
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '16.5px' }}>
              لما تكون في البيت، التحكم بيمشي على شبكتك مباشرة فبيبقى <b>فوري جدًا</b>.
              ولما تكون بره، بيشتغل عن طريق الإنترنت بشكل طبيعي. والمفاتيح على الحيطة
              بتفضل شغّالة عادي، والحالة بتتحدّث في التطبيق على طول.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <span className="pill"><Bolt /> تحكّم محلي سريع</span>
              <span className="pill"><Cloud /> سحابي من أي مكان</span>
              <span className="pill"><Hand /> المفاتيح اليدوية تفضل شغّالة</span>
              <span className="pill"><Sync /> مزامنة فورية للحالة</span>
            </div>
          </div>
          <div className="panel" aria-hidden="true">
            <div className="panel-head">
              <span className="panel-room">المطبخ</span>
              <span className="panel-live"><i />متصل</span>
            </div>
            <div className="row">
              <span className="ricon"><Bulb /></span>
              <span className="rmeta"><b>سبوت لايت</b><span>السطوع 80%</span></span>
              <span className="dim"><span className="track"><span className="fill" style={{ width: '80%' }} /></span></span>
            </div>
            <div className="row">
              <span className="ricon"><Sensor /></span>
              <span className="rmeta"><b>حرارة ورطوبة</b><span>26° · 48%</span></span>
              <span className="tgl on" />
            </div>
            <div className="row">
              <span className="ricon"><Bolt /></span>
              <span className="rmeta"><b>السخان</b><span>يطفّي بعد 20 دقيقة</span></span>
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
            <p>كل أجهزتك في مكان واحد — منظّمة، سريعة، وسهلة.</p>
          </div>
          <div className="shots-grid">
            <figure>
              <div className="shot"><img src={asset('/assets/screens/home.png')} alt="الشاشة الرئيسية" /></div>
              <p className="shot-cap">الشاشة الرئيسية — كل أجهزتك وحالتها</p>
            </figure>
            <figure>
              <div className="shot"><img src={asset('/assets/screens/groups.png')} alt="المجموعات" /></div>
              <p className="shot-cap">المجموعات — تحكّم في أجهزة كتير بضغطة</p>
            </figure>
          </div>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section className="section dl" id="download">
        <div className="wrap">
          <h2>حمّل كوش سمارت دلوقتي</h2>
          <p>متاح لأندرويد وآيفون. سجّل بإيميلك وابدأ في دقائق.</p>
          <div className="dl-row">
            <Link className="btn lg" href="/downloads">تحميل لأندرويد (APK)</Link>
            <Link className="btn lg" href="/downloads">Google Play</Link>
            <Link className="btn ghost lg" href="/downloads">App Store</Link>
          </div>
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#9fb8cd' }}>
            محتاج مساعدة في الإعداد؟{' '}
            <Link href="/docs" style={{ color: '#fff', textDecoration: 'underline' }}>
              شوف الدليل خطوة بخطوة
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
