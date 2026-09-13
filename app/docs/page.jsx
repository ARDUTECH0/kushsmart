import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import DocsToc from '@/components/DocsToc';
import AppMock from '@/components/AppMock';
import L from '@/components/L';
import { SUPPORT_EMAIL } from '@/lib/site';
import { pageMeta } from '@/lib/seo';
import {
  Download, Signal, Globe, Bulb, Check, Groups, Megaphone, Timer, Sync, Automation,
  Sensor, Remote, Lock, Bolt, Key, Upload, Alert, Mail,
} from '@/components/Icons';

export const metadata = pageMeta({
  title: 'دليل الاستخدام — KUSH SMART guide',
  description:
    'دليل كوش سمارت خطوة بخطوة: تثبيت التطبيق، إضافة الأجهزة، المجموعات، المؤقّتات، الأتمتة، الحسّاسات والتحديثات. The KUSH SMART guide, step by step.',
  path: '/docs/',
});

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide', active: true },
  { href: '/pricing', label: 'الأسعار', en: 'Pricing' },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

// Written for the person who lives in the house, not the one who wired it:
// what to tap, and what happens. Wiring and board setup belong to the
// installer, and are covered inside the app where that screen lives.
const TOC = [
  {
    title: 'البداية', titleEn: 'Getting started',
    items: [
      { href: '#install', label: 'التطبيق والحساب', en: 'The app & your account' },
      { href: '#add', label: 'إضافة أول جهاز', en: 'Adding your first device' },
      { href: '#appearance', label: 'اللغة والمظهر', en: 'Language & appearance' },
    ],
  },
  {
    title: 'الاستخدام اليومي', titleEn: 'Everyday use',
    items: [
      { href: '#control', label: 'التحكّم في الأجهزة', en: 'Controlling devices' },
      { href: '#rename', label: 'تسمية الأجهزة', en: 'Naming devices' },
      { href: '#groups', label: 'المجموعات', en: 'Groups' },
      { href: '#voice', label: 'التحكّم بالصوت', en: 'Voice control' },
      { href: '#timers', label: 'المؤقّتات', en: 'Timers' },
      { href: '#schedule', label: 'الجدولة', en: 'Schedules' },
    ],
  },
  {
    title: 'الأتمتة والتنبيهات', titleEn: 'Automation & alerts',
    items: [
      { href: '#automations', label: 'الأتمتة', en: 'Automations' },
      { href: '#sensors', label: 'الحسّاسات والإشعارات', en: 'Sensors & alerts' },
      { href: '#remote', label: 'الريموت', en: 'Remotes' },
    ],
  },
  {
    title: 'أجهزة خاصة', titleEn: 'Special devices',
    items: [
      { href: '#lock', label: 'القفل الذكي', en: 'Smart lock' },
      { href: '#power', label: 'عدّاد الطاقة', en: 'Power meter' },
    ],
  },
  {
    title: 'الأمان والتحديثات', titleEn: 'Security & updates',
    items: [
      { href: '#hidden', label: 'المفاتيح المخفيّة', en: 'Hidden switches' },
      { href: '#update', label: 'تحديث الأجهزة', en: 'Updating devices' },
    ],
  },
  {
    title: 'الربط والمساعدة', titleEn: 'Linking & help',
    items: [
      { href: '/docs/google-home', label: 'Google Home', en: 'Google Home' },
      { href: '/docs/alexa', label: 'Amazon Alexa', en: 'Amazon Alexa' },
      { href: '/docs/home-assistant', label: 'Home Assistant', en: 'Home Assistant' },
      { href: '/pricing', label: 'الترخيص والأسعار', en: 'Licence & pricing' },
      { href: '#faq', label: 'حلّ المشكلات', en: 'Troubleshooting' },
    ],
  },
];

/* A section heading. Sections are topics, not a sequence, so each carries an
   icon for what it's about rather than a number. */
function H({ Ic, ar, en }) {
  return <h2><span className="n"><Ic /></span> <L ar={ar} en={en} /></h2>;
}

/* Numbered steps — here the order is real. */
function Steps({ ar, en }) {
  return (
    <>
      <div className="card" data-ar=""><ol className="steps">{ar.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
      <div className="card" data-en=""><ol className="steps">{en.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
    </>
  );
}

function Note({ kind = 'info', ar, en }) {
  return <div className={`callout ${kind}`}><L tag="div" ar={ar} en={en} /></div>;
}

export default function DocsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <div className="wrap docs">
        <DocsToc groups={TOC} />

        <main className="doc-main">
          <L tag="h1" ar="دليل كوش سمارت" en="The KUSH SMART guide" />
          <p className="sub"><L ar="كل ما تحتاج معرفته لاستخدام منزلك الذكي — خطوة بخطوة، ودون أي تعقيد."
            en="Everything you need to use your smart home — step by step, with nothing complicated." /></p>

          <section id="install">
            <H Ic={Download} ar="التطبيق والحساب" en="The app & your account" />
            <Steps
              ar={[
                <>حمّل تطبيق <b>كوش سمارت</b> على هاتفك من <Link href="/downloads">صفحة التحميل</Link>.</>,
                <>افتح التطبيق واضغط <b>إنشاء حساب</b>.</>,
                'أدخل بريدك الإلكتروني واختر كلمة مرور، ثم أكّد الحساب من الرسالة التي تصلك.',
                'سجّل الدخول — وحسابك جاهز.',
              ]}
              en={[
                <>Download the <b>KUSH SMART</b> app to your phone from the <Link href="/downloads">download page</Link>.</>,
                <>Open the app and tap <b>Create account</b>.</>,
                'Enter your email, pick a password, then confirm the account from the message you receive.',
                'Sign in — your account is ready.',
              ]}
            />
            <Note kind="tip"
              ar="أجهزتك مرتبطة بحسابك وحده، ولا يستطيع أحد غيرك رؤيتها أو التحكّم فيها إلا إذا شاركتها معه."
              en="Your devices belong to your account alone. No one else can see or control them unless you share them." />
            <Note
              ar="نسيت كلمة المرور؟ اضغط «نسيت كلمة المرور» في شاشة الدخول، واتبع الرابط الذي يصل إلى بريدك."
              en="Forgot your password? Tap “Forgot password” on the sign-in screen and follow the link sent to your email." />
          </section>

          <section id="add">
            <H Ic={Signal} ar="إضافة أول جهاز" en="Adding your first device" />
            <L tag="p" ar="عند تشغيل الوحدة لأول مرة تكون جاهزة للإعداد، ويرشدك التطبيق خطوة بخطوة."
              en="The first time a unit is powered on it's ready to set up, and the app walks you through it." />
            <Steps
              ar={[
                'تأكّد أن الوحدة موصولة بالكهرباء، وأن كلمة مرور الواي فاي في متناولك.',
                <>من الشاشة الرئيسية اضغط <b>إضافة جهاز</b>.</>,
                'اختر الوحدة الجديدة عندما يعثر عليها التطبيق.',
                <>تعرض الوحدة الشبكات المتاحة حولها — اختر <b>شبكة منزلك</b> وأدخل كلمة المرور.</>,
                'اضغط اتصال، فتُعيد الوحدة تشغيل نفسها وتتصل بالشبكة.',
                'خلال ثوانٍ تظهر الوحدة وكل أجهزتها في قائمتك.',
              ]}
              en={[
                'Make sure the unit has power and that you have your Wi-Fi password to hand.',
                <>On the home screen, tap <b>Add device</b>.</>,
                'Pick the new unit when the app finds it.',
                <>The unit lists the networks around it — choose <b>your home network</b> and enter the password.</>,
                'Tap Connect; the unit restarts and joins the network.',
                'Within seconds the unit and all its devices appear in your list.',
              ]}
            />
            <Note
              ar="تعمل الوحدات على شبكة الواي فاي 2.4 جيجاهرتز. إن كان الراوتر يجمع الشبكتين تحت اسم واحد، فقد يساعد فصلهما أثناء الإعداد."
              en="Units use the 2.4GHz Wi-Fi band. If your router combines both bands under one name, separating them during setup can help." />
            <Note kind="tip"
              ar="إذا احتاجت الوحدة إلى إعداد أوّلي بعد التركيب، فيتولّاه الفنّي الذي ركّبها."
              en="If a unit needs its first-time setup after fitting, the technician who installed it takes care of it." />
          </section>

          <section id="appearance">
            <H Ic={Globe} ar="اللغة والمظهر" en="Language & appearance" />
            <Steps
              ar={[
                <>افتح تبويب <b>حسابي</b> أسفل الشاشة.</>,
                <><b>اللغة:</b> اختر العربية أو English — وتتحوّل الواجهة كلها فورًا.</>,
                <><b>المظهر:</b> اختر فاتح أو داكن أو حسب إعداد الهاتف.</>,
              ]}
              en={[
                <>Open the <b>Account</b> tab at the bottom of the screen.</>,
                <><b>Language:</b> choose العربية or English — the whole interface switches instantly.</>,
                <><b>Theme:</b> choose Light, Dark or Follow system.</>,
              ]}
            />
            <Note
              ar="وفي «حسابي» أيضًا تجد بياناتك، وبريد الدعم، وتسجيل الخروج، وحذف الحساب."
              en="The Account tab is also where you'll find your details, the support email, sign-out and account deletion." />
          </section>

          <section id="control">
            <H Ic={Bulb} ar="التحكّم في الأجهزة" en="Controlling devices" />
            <L tag="p" ar="اضغط على أي جهاز لتشغيله أو إطفائه، أو افتح صفحته للتحكّم الكامل."
              en="Tap any device to switch it on or off, or open its page for full control." />
            <div className="mk-doc">
              <AppMock screen="home" ar="الشاشة الرئيسية في التطبيق" en="The app home screen" />
              <L tag="p" className="mk-cap" ar="الشاشة الرئيسية — كل أجهزتك وحالتها." en="The home screen — every device and its state." />
            </div>
            <table data-ar="">
              <tbody>
                <tr><th>ما تريده</th><th>كيف تفعله</th></tr>
                <tr><td>تشغيل / إطفاء</td><td>اضغط على الجهاز</td></tr>
                <tr><td>خفوت الإضاءة</td><td>حرّك الشريط</td></tr>
                <tr><td>سرعة المروحة</td><td>حرّك شريط السرعة</td></tr>
                <tr><td>لون الإضاءة</td><td>اختر اللون من دائرة الألوان</td></tr>
                <tr><td>الستائر</td><td>فتح / غلق / إيقاف</td></tr>
                <tr><td>صفحة الجهاز</td><td>اضغط على اسم الجهاز</td></tr>
                <tr><td>كل خيارات الجهاز</td><td>اضغط مطوّلًا على الجهاز</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>What you want</th><th>How</th></tr>
                <tr><td>On / off</td><td>Tap the device</td></tr>
                <tr><td>Dim a light</td><td>Drag the slider</td></tr>
                <tr><td>Fan speed</td><td>Drag the speed slider</td></tr>
                <tr><td>Light colour</td><td>Pick from the colour wheel</td></tr>
                <tr><td>Curtains</td><td>Open / close / stop</td></tr>
                <tr><td>The device page</td><td>Tap the device name</td></tr>
                <tr><td>All device options</td><td>Long-press the device</td></tr>
              </tbody>
            </table>
            <L tag="h3" ar="صفحة الجهاز" en="The device page" />
            <L tag="p"
              ar="في أعلاها الحالة الحيّة (تشغيل، نسبة الخفوت، اللون، أو الحرارة والرطوبة)، وتحتها أدوات التحكّم والمؤقّت والأتمتة وإعدادات الجهاز."
              en="At the top is the live state (on/off, brightness, colour, or temperature and humidity); below are the controls, the timer, automation and the device's settings." />
          </section>

          <section id="rename">
            <H Ic={Check} ar="تسمية الأجهزة" en="Naming devices" />
            <Steps
              ar={[
                <>اضغط مطوّلًا على الجهاز، ثم <b>إعادة تسمية</b>.</>,
                'اكتب اسمًا واضحًا مثل «إضاءة الصالة».',
                'احفظ.',
              ]}
              en={[
                <>Long-press the device, then <b>Rename</b>.</>,
                'Type a clear name like “Living-room light”.',
                'Save.',
              ]}
            />
            <Note kind="tip"
              ar="اختر أسماء تنطقها بسهولة — فهي نفسها التي تستخدمها في الأوامر الصوتية."
              en="Pick names that are easy to say — they're the same ones you use for voice commands." />
          </section>

          <section id="groups">
            <H Ic={Groups} ar="المجموعات" en="Groups" />
            <L tag="p" ar="اجمع عدّة أجهزة في مجموعة واحدة وتحكّم فيها جميعًا بضغطة (مثل «إضاءة الدور الأول»)."
              en="Put several devices in one group and run them all with a single tap (like “Ground-floor lights”)." />
            <div className="mk-doc">
              <AppMock screen="groups" ar="صفحة المجموعات في التطبيق" en="The groups page in the app" />
              <L tag="p" className="mk-cap" ar="المجموعات — عدّة أجهزة بضغطة واحدة." en="Groups — several devices with one tap." />
            </div>
            <Steps
              ar={[
                <>افتح تبويب <b>المجموعات</b> واضغط <b>مجموعة جديدة</b>.</>,
                'اكتب اسم المجموعة، واختر الأجهزة التي تضمّها.',
                'احفظ — ويمكنك الآن تشغيل المجموعة كلها أو إطفاؤها مرة واحدة.',
              ]}
              en={[
                <>Open the <b>Groups</b> tab and tap <b>New group</b>.</>,
                'Name the group and choose the devices in it.',
                'Save — now you can switch the whole group on or off at once.',
              ]}
            />
          </section>

          <section id="voice">
            <H Ic={Megaphone} ar="التحكّم بالصوت" en="Voice control" />
            <L tag="p" ar="تحكّم في أجهزتك بصوتك من داخل التطبيق، بالعربية أو الإنجليزية."
              en="Control your devices by voice, right inside the app — in Arabic or English." />
            <Steps
              ar={[
                <>اضغط زر <b>الميكروفون</b> في الشاشة الرئيسية.</>,
                'اسمح للتطبيق باستخدام الميكروفون عندما يطلب ذلك أول مرة.',
                'قل أمرًا واضحًا، مثل «شغّل إضاءة الصالة» أو «أطفئ المروحة».',
              ]}
              en={[
                <>Tap the <b>microphone</b> button on the home screen.</>,
                'Allow microphone access the first time the app asks.',
                'Say a clear command, like “Turn on the living-room light” or “Turn off the fan”.',
              ]}
            />
            <Note kind="tip"
              ar={<>للتحكّم بمساعد Google أو Alexa، راجع دليل <Link href="/docs/google-home">Google Home</Link> ودليل <Link href="/docs/alexa">Alexa</Link>.</>}
              en={<>To use Google Assistant or Alexa, see the <Link href="/docs/google-home">Google Home</Link> and <Link href="/docs/alexa">Alexa</Link> guides.</>} />
          </section>

          <section id="timers">
            <H Ic={Timer} ar="المؤقّتات" en="Timers" />
            <L tag="h3" ar="مؤقّت لمرة واحدة" en="A one-off timer" />
            <Steps
              ar={[
                <>افتح صفحة الجهاز، ثم <b>مؤقّت</b>.</>,
                'اختر المدّة — مثلًا يُطفأ بعد 30 دقيقة.',
                'أكّد، ويظهر المؤقّت في صفحة الجهاز حتى ينتهي.',
              ]}
              en={[
                <>Open the device page, then <b>Timer</b>.</>,
                'Choose how long — for example, off in 30 minutes.',
                'Confirm; the timer shows on the device page until it runs out.',
              ]}
            />
            <L tag="h3" ar="إطفاء تلقائي في كل مرة" en="Auto-off, every time" />
            <L tag="p" ar="«في كل مرة يعمل الجهاز، أطفئه بعد مدّة محدّدة» — مفيد لسخّان المياه أو إضاءة الحمّام."
              en="“Every time it turns on, turn it off after a set time” — handy for a water heater or a bathroom light." />
            <Steps
              ar={[<>افتح صفحة الجهاز، ثم <b>إطفاء تلقائي</b>.</>, 'حدّد المدّة واحفظ.']}
              en={[<>Open the device page, then <b>Auto-off</b>.</>, 'Set the time and save.']}
            />
          </section>

          <section id="schedule">
            <H Ic={Sync} ar="الجدولة" en="Schedules" />
            <L tag="p" ar="اجعل الأجهزة تعمل أو تتوقّف في مواعيد ثابتة — مثلًا تُضاء الإضاءة السادسة مساءً وتُطفأ الحادية عشرة."
              en="Have devices turn on or off at set times — say, lights on at 6pm and off at 11." />
            <Steps
              ar={[
                <>افتح <b>الجدولة</b> واضغط <b>موعد جديد</b>.</>,
                'اختر الجهاز والوقت والأيام.',
                'اختر تشغيل أو إطفاء، ثم احفظ.',
              ]}
              en={[
                <>Open <b>Schedules</b> and tap <b>New schedule</b>.</>,
                'Pick the device, the time and the days.',
                'Choose on or off, then save.',
              ]}
            />
          </section>

          <section id="automations">
            <H Ic={Automation} ar="الأتمتة" en="Automations" />
            <L tag="p" ar="«عندما يحدث شيء، افعل شيئًا» — دون أن تلمس هاتفك."
              en="“When something happens, do something” — without touching your phone." />
            <Steps
              ar={[
                <>افتح صفحة الجهاز أو الحسّاس، ثم <b>الأتمتة</b> ← <b>أتمتة جديدة</b>.</>,
                'اختر الشرط: مثلًا ارتفاع الحرارة فوق 30 درجة، أو فتح الباب، أو وقت الغروب.',
                'اختر ما يحدث: تشغيل جهاز أو إطفاؤه، أو زرّ من الريموت، أو إشعار يصلك.',
                'يمكنك إضافة شرط آخر أو استثناء، وتحديد وقت تعمل فيه القاعدة — ليلًا فقط مثلًا.',
                'احفظ — وتعمل الأتمتة تلقائيًا حتى والتطبيق مغلق.',
              ]}
              en={[
                <>Open the device or sensor page, then <b>Automation</b> → <b>New automation</b>.</>,
                'Pick the condition: for example, above 30°, the door opening, or sunset.',
                'Pick what happens: turn a device on or off, press a remote button, or send you an alert.',
                'You can add another condition or an exception, and limit when the rule applies — nights only, say.',
                'Save — it runs on its own, even with the app closed.',
              ]}
            />
            <Note kind="tip"
              ar="أمثلة: «إذا ارتفعت الحرارة شغّل المروحة»، «إذا فُتح الباب أرسل لي إشعارًا وأضئ المدخل»، «عند الغروب شغّل التكييف»."
              en="Examples: “If it gets hot, turn on the fan.” “If the door opens, alert me and light the hallway.” “At sunset, turn on the AC.”" />
          </section>

          <section id="sensors">
            <H Ic={Sensor} ar="الحسّاسات والإشعارات" en="Sensors & alerts" />
            <Steps
              ar={[
                'يظهر الحسّاس تلقائيًا مع قراءته — الحرارة والرطوبة، أو حالة الباب، أو الحركة.',
                'اضغط عليه لفتح صفحته ومتابعة الحالة الحيّة.',
                <>لتصلك الإشعارات: من صفحة الحسّاس افتح <b>الأتمتة</b> وفعّل <b>إرسال إشعار</b>.</>,
                'تأكّد من السماح بإشعارات التطبيق في إعدادات الهاتف.',
              ]}
              en={[
                'A sensor appears on its own with its reading — temperature and humidity, a door, or motion.',
                'Tap it to open its page and follow the live state.',
                <>To get alerts: on the sensor page, open <b>Automation</b> and turn on <b>Send an alert</b>.</>,
                'Make sure notifications for the app are allowed in your phone settings.',
              ]}
            />
            <Note ar="تصلك الإشعارات حتى والتطبيق مغلق." en="Alerts reach you even when the app is closed." />
          </section>

          <section id="remote">
            <H Ic={Remote} ar="الريموت" en="Remotes" />
            <L tag="p" ar="اجعل أزرار الريموت — ريموت التكييف أو التلفزيون أو الريموت اللاسلكي — تعمل من داخل التطبيق."
              en="Bring the buttons of your remotes — the AC, the TV, or a wireless remote — into the app." />
            <Steps
              ar={[
                <>افتح صفحة <b>أجهزة التحكّم</b>.</>,
                <>اضغط <b>تعلّم زرًّا جديدًا</b>، واختر ما يفعله الزر.</>,
                'وجّه الريموت نحو الوحدة واضغط الزر — فتتعلّمه الوحدة.',
                'الآن يعمل الزر من التطبيق، ومن الأتمتة أيضًا.',
              ]}
              en={[
                <>Open the <b>Remotes</b> page.</>,
                <>Tap <b>Learn a new button</b> and choose what the button does.</>,
                'Point the remote at the unit and press the button — the unit learns it.',
                'The button now works from the app, and from automations too.',
              ]}
            />
          </section>

          <section id="lock">
            <H Ic={Lock} ar="القفل الذكي" en="Smart lock" />
            <Steps
              ar={[
                <><b>القفل والفتح:</b> اضغط الزر الكبير في صفحة القفل، وترى حالة الباب ونسبة البطارية.</>,
                <><b>من يدخل:</b> من <b>بيانات الدخول</b> أضف أو احذف بطاقات الدخول أو البصمات أو الرموز السرّية.</>,
                <><b>التنبيهات:</b> يصلك إشعار عند فتح الباب أو عند أي محاولة عبث.</>,
              ]}
              en={[
                <><b>Lock and unlock:</b> tap the big button on the lock page; you'll see the door state and battery level.</>,
                <><b>Who gets in:</b> under <b>Access</b>, add or remove key cards, fingerprints or PIN codes.</>,
                <><b>Alerts:</b> you're notified when the door opens, or if anyone tampers with it.</>,
              ]}
            />
            <Note ar="راقب نسبة البطارية في التطبيق لتعرف مبكرًا متى تحتاج إلى تغييرها."
              en="Keep an eye on the battery level in the app, so you know early when it needs replacing." />
          </section>

          <section id="power">
            <H Ic={Bolt} ar="عدّاد الطاقة" en="Power meter" />
            <L tag="p" ar="تابع استهلاك الكهرباء في منزلك لحظة بلحظة."
              en="Follow your home's electricity use as it happens." />
            <Steps
              ar={[
                'اضغط على عدّاد الطاقة لفتح صفحته.',
                'ترى الجهد والتيار والقدرة والاستهلاك بالكيلوواط ساعة، مع رسم بياني قصير.',
                'يمكنك تسمية كل خط، وتصفير عدّاد الاستهلاك متى أردت.',
              ]}
              en={[
                'Tap the power meter to open its page.',
                'You see voltage, current, power and energy used in kWh, with a short chart.',
                'You can name each line, and reset the usage counter whenever you like.',
              ]}
            />
          </section>

          <section id="hidden">
            <H Ic={Key} ar="المفاتيح المخفيّة" en="Hidden switches" />
            <L tag="p" ar="مفاتيح لا تظهر إلا بعد إدخال رمز سرّي، لمزيد من الخصوصية."
              en="Switches that only appear once you enter a code, for extra privacy." />
            <Steps
              ar={['افتح صفحة المفاتيح المخفيّة واختر رمزًا سرّيًا.', 'اختر المفاتيح التي تريد إخفاءها.', 'لن تظهر بعد ذلك إلا بإدخال الرمز.']}
              en={['Open the Hidden switches page and choose a code.', 'Pick the switches you want to hide.', 'From then on they only show once the code is entered.']}
            />
            <L tag="h3" ar="حماية مفتاح برمز" en="Protecting one switch with a PIN" />
            <L tag="p" ar="لمفتاح بعينه — كسخّان المياه أو البوابة — يمكنك طلب رمز قبل تشغيله: اضغط مطوّلًا على الجهاز ← تعديل ← رمز الحماية."
              en="For a particular switch — a water heater or a gate — you can require a PIN before it turns on: long-press the device → Edit → PIN protection." />
          </section>

          <section id="update">
            <H Ic={Upload} ar="تحديث الأجهزة" en="Updating devices" />
            <L tag="p" ar="تصل التحديثات إلى أجهزتك لاسلكيًا، دون فكّها أو توصيلها بأي شيء — ولا يُثبَّت أي تحديث إلا عندما تطلبه."
              en="Updates reach your devices wirelessly, with nothing to take apart or plug in — and nothing installs until you ask." />
            <Steps
              ar={[
                <>اضغط مطوّلًا على الجهاز لفتح <b>معلومات الجهاز</b>.</>,
                <>عند <b>الإصدار</b> اضغط <b>فحص التحديث</b>؛ فإن توفّر تحديث ظهر زر <b>تحديث</b>.</>,
                'اضغط تحديث، وتابع نسبة التقدّم على الشاشة.',
                'عند الانتهاء تُعيد الوحدة تشغيل نفسها وتعود متّصلة.',
              ]}
              en={[
                <>Long-press the device to open <b>Device info</b>.</>,
                <>Next to <b>Version</b>, tap <b>Check for update</b>; if one is available, an <b>Update</b> button appears.</>,
                'Tap Update and follow the progress on screen.',
                'When it finishes, the unit restarts and comes back online on its own.',
              ]}
            />
            <Note kind="warn"
              ar="لا تفصل الكهرباء عن الجهاز أثناء التحديث. إعداداتك وأسماء أجهزتك محفوظة كما هي."
              en="Don't cut the power during an update. Your settings and device names are kept as they are." />
            <Note ar="يصلك إشعار من التطبيق عندما يتوفّر تحديث جديد لأجهزتك."
              en="The app notifies you when a new update is available for your devices." />
          </section>

          <section id="faq">
            <H Ic={Alert} ar="حلّ المشكلات" en="Troubleshooting" />
            <div className="card" data-ar="">
              <h3>يظهر الجهاز «غير متّصل»؟</h3>
              <p>تأكّد من وصول الكهرباء إليه، ومن عمل الواي فاي وقوّة الإشارة في مكانه. جرّب إطفاء الراوتر وتشغيله، ثم انتظر دقيقة.</p>
              <h3>لا يظهر جهاز جديد أضفته؟</h3>
              <p>تأكّد من إكمال خطوات الإضافة ومن اتصال الوحدة بالواي فاي، ثم أغلق التطبيق وافتحه من جديد.</p>
              <h3>مفتاح الحائط لا يعمل كما ينبغي؟</h3>
              <p>تواصل مع الفنّي الذي ركّب الوحدة أو مع الدعم — فقد يحتاج إعداد الوحدة إلى ضبط يناسب طريقة التوصيل في منزلك.</p>
              <h3>الاستجابة بطيئة؟</h3>
              <p>داخل المنزل تكون الاستجابة فورية. إن لاحظت بطئًا، فتأكّد أن هاتفك متصل بشبكة الواي فاي نفسها.</p>
              <h3>لا تصلني الإشعارات؟</h3>
              <p>تأكّد من السماح بإشعارات التطبيق في إعدادات الهاتف ومن تسجيل الدخول. راجع <a href="#sensors">الحسّاسات والإشعارات</a>.</p>
              <h3>التحكّم بالصوت لا يستجيب؟</h3>
              <p>اسمح للتطبيق باستخدام الميكروفون، وانطق اسم الجهاز كما هو مكتوب في التطبيق.</p>
              <h3>لا يظهر التحديث الجديد؟</h3>
              <p>اضغط مطوّلًا على الجهاز ثم «فحص التحديث». راجع <a href="#update">تحديث الأجهزة</a>.</p>
            </div>
            <div className="card" data-en="">
              <h3>A device shows “offline”?</h3>
              <p>Check it has power, and that Wi-Fi works with a good signal where it's installed. Try switching your router off and on, then wait a minute.</p>
              <h3>A new device doesn't appear?</h3>
              <p>Make sure you finished the add steps and the unit joined your Wi-Fi, then close the app and open it again.</p>
              <h3>A wall switch doesn't behave right?</h3>
              <p>Contact the technician who installed the unit, or support — the unit may need adjusting to match how your home is wired.</p>
              <h3>Responses feel slow?</h3>
              <p>At home, responses are instant. If you notice a delay, make sure your phone is on the same Wi-Fi network.</p>
              <h3>Not getting alerts?</h3>
              <p>Make sure notifications for the app are allowed in your phone settings and that you're signed in. See <a href="#sensors">Sensors & alerts</a>.</p>
              <h3>Voice control doesn't respond?</h3>
              <p>Allow the app to use the microphone, and say the device name exactly as it's written in the app.</p>
              <h3>A new update doesn't show?</h3>
              <p>Long-press the device, then “Check for update”. See <a href="#update">Updating devices</a>.</p>
            </div>
            <div className="cta-band">
              <div>
                <b data-ar="">تحتاج مزيدًا من المساعدة؟</b>
                <b data-en="">Need more help?</b>{' '}
                <span data-ar="">راسلنا، واذكر اسم الجهاز كما يظهر في التطبيق.</span>
                <span data-en="">Email us, and mention the device name as it appears in the app.</span>
              </div>
              <a className="btn" href={`mailto:${SUPPORT_EMAIL}`}><Mail /><L ar="راسل الدعم" en="Email support" /></a>
            </div>
          </section>
        </main>
      </div>

      <SlimFooter />
    </>
  );
}
