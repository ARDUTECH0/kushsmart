import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import DocsToc from '@/components/DocsToc';
import { asset } from '@/lib/site';
import L from '@/components/L';

export const metadata = {
  title: 'KUSH SMART Docs | دليل كوش سمارت',
  description:
    'The KUSH SMART guide, step by step — setup, adding devices, settings, groups, timers, automations and sensors.',
};

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide', active: true },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

const TOC = [
  {
    title: 'البداية', titleEn: 'Getting started',
    items: [
      { href: '#install', label: 'تثبيت التطبيق والحساب', en: 'Install & account' },
      { href: '#add', label: 'إضافة أول جهاز', en: 'Add your first device' },
      { href: '#config', label: 'الإعدادات العامة', en: 'General settings' },
    ],
  },
  {
    title: 'الاستخدام اليومي', titleEn: 'Everyday use',
    items: [
      { href: '#control', label: 'التحكّم في الأجهزة', en: 'Controlling devices' },
      { href: '#channel', label: 'صفحة تفاصيل القناة', en: 'Channel detail page' },
      { href: '#rename', label: 'تسمية الأجهزة', en: 'Naming devices' },
      { href: '#groups', label: 'المجموعات', en: 'Groups' },
      { href: '#voice', label: 'التحكّم الصوتي', en: 'Voice control' },
      { href: '#timers', label: 'المؤقّتات والإطفاء التلقائي', en: 'Timers & auto-off' },
      { href: '#schedule', label: 'الجدولة الزمنية', en: 'Scheduling' },
    ],
  },
  {
    title: 'أجهزة متخصّصة', titleEn: 'Specialised devices',
    items: [
      { href: '#lock', label: 'القفل الذكي', en: 'Smart lock' },
      { href: '#power', label: 'عدّاد الطاقة', en: 'Power meter' },
    ],
  },
  {
    title: 'المتقدّم', titleEn: 'Advanced',
    items: [
      { href: '#automations', label: 'الأتمتة', en: 'Automations' },
      { href: '#sensors', label: 'الحسّاسات والإشعارات', en: 'Sensors & alerts' },
      { href: '#remote', label: 'التحكّم 433MHz / IR', en: '433MHz / IR remotes' },
      { href: '#hidden', label: 'المفاتيح المخفيّة والقفل بالرمز', en: 'Hidden switches & PIN' },
      { href: '#update', label: 'تحديث الأجهزة لاسلكيًا (OTA)', en: 'Over-the-air updates' },
      { href: '/docs/home-assistant', label: 'الربط مع Home Assistant', en: 'Home Assistant' },
    ],
  },
  {
    title: 'الإعدادات والمساعدة', titleEn: 'Settings & help',
    items: [
      { href: '#appearance', label: 'اللغة والمظهر', en: 'Language & appearance' },
      { href: '/pricing', label: 'الترخيص والأسعار', en: 'Pricing & licence' },
      { href: '#faq', label: 'حلّ المشكلات', en: 'Troubleshooting' },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <div className="wrap docs">
        <DocsToc groups={TOC} />

        <main className="doc-main">
          <L tag="h1" ar="دليل كوش سمارت" en="KUSH SMART guide" />
          <p className="sub"><L ar="كل ما تحتاج معرفته لإعداد منزلك الذكي — خطوة بخطوة، ودون أي تعقيد."
            en="Everything you need to set up your smart home — step by step, with nothing complicated." /></p>

          <section id="install">
            <h2><span className="n">1</span> <L ar="تثبيت التطبيق وإنشاء حساب" en="Install the app & create an account" /></h2>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>حمّل تطبيق <b>كوش سمارت</b> من Google Play (أندرويد) أو App Store (آيفون).</li>
                <li>افتح التطبيق واضغط <b>إنشاء حساب</b>.</li>
                <li>أدخل بريدك الإلكتروني واختر كلمة مرور، وأكّد الحساب عبر البريد.</li>
                <li>سجّل الدخول — وبذلك يصبح حسابك جاهزًا.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Download the <b>KUSH SMART</b> app from Google Play (Android) or the App Store (iPhone).</li>
                <li>Open the app and tap <b>Create account</b>.</li>
                <li>Enter your email, pick a password, and confirm from the email you receive.</li>
                <li>Sign in — your account is ready.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🔒</span>
              <div data-ar="">ترتبط جميع أجهزتك بحسابك وحده. لا يمكن لأحد غيرك رؤيتها أو التحكّم فيها.</div>
              <div data-en="">All your devices are tied to your account alone. No one else can see or control them.</div>
            </div>
            <div className="callout info">
              <span className="em">🎨</span>
              <div data-ar="">في أول تشغيل يسألك التطبيق عن <b>اللغة</b> (العربية / English) و<b>المظهر</b> (فاتح / داكن / حسب النظام). تقدر تغيّرهم في أي وقت — راجع <a href="#appearance">اللغة والمظهر</a>. لو نسيت كلمة المرور، اضغط «نسيت كلمة المرور» في شاشة الدخول واتبع الرابط في بريدك.</div>
              <div data-en="">On first launch the app asks for your <b>language</b> (العربية / English) and <b>theme</b> (light / dark / follow system). You can change these any time — see <a href="#appearance">Language & appearance</a>. Forgot your password? Tap “Forgot password” on the sign-in screen and follow the link in your email.</div>
            </div>
          </section>

          <section id="add">
            <h2><span className="n">2</span> <L ar="إضافة أول جهاز (التوصيل بالواي فاي)" en="Add your first device (Wi-Fi setup)" /></h2>
            <L tag="p" ar="تُنشئ الوحدة في أول مرة شبكة واي فاي خاصة بها للإعداد، ويرشدك التطبيق خطوة بخطوة."
              en="On first power-up the unit creates its own Wi-Fi network for setup, and the app walks you through it." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>تأكّد من أن الوحدة تعمل، ومن توفّر كلمة مرور واي فاي المنزل لديك.</li>
                <li>من الشاشة الرئيسية اضغط <b>➕ إضافة جهاز</b>.</li>
                <li>سيعثر التطبيق على الوحدة الجديدة — اخترها.</li>
                <li>اختر <b>شبكة الواي فاي</b> (2.4 جيجا) وأدخل كلمة المرور.</li>
                <li>اضغط <b>حفظ / اتصال</b> — وستُعيد الوحدة التشغيل وتتّصل.</li>
                <li>خلال ثوانٍ ستظهر الوحدة وجميع مفاتيحها في قائمة أجهزتك. ✅</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Make sure the unit is powered, and have your home Wi-Fi password ready.</li>
                <li>On the home screen, tap <b>➕ Add device</b>.</li>
                <li>The app finds the new unit — select it.</li>
                <li>Pick your <b>Wi-Fi network</b> (2.4GHz) and enter the password.</li>
                <li>Tap <b>Save / Connect</b> — the unit restarts and connects.</li>
                <li>Within seconds the unit and all its switches appear in your device list. ✅</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">📶</span>
              <div data-ar="">تعمل الأجهزة الذكية على واي فاي <b>2.4 جيجا</b> (وليس 5 جيجا). إذا كان راوترك يدمج الشبكتين، يُفضَّل فصلهما أثناء الإعداد.</div>
              <div data-en="">Smart devices use <b>2.4GHz</b> Wi-Fi (not 5GHz). If your router combines both bands, it helps to split them during setup.</div>
            </div>
          </section>

          <section id="config">
            <h2><span className="n">3</span> <L ar="الإعدادات العامة" en="General settings" /></h2>
            <p data-ar="">من صفحة <b>الإعدادات / Configuration</b> الخاصة بالوحدة، يمكنك ضبط طريقة عمل المفاتيح وفقًا لتركيبتك الكهربائية. افتح تفاصيل الوحدة ← <b>الإعدادات العامة</b>.</p>
            <p data-en="">From the unit's <b>Settings / Configuration</b> page you can tune how the switches behave for your wiring. Open the unit's details → <b>General settings</b>.</p>
            <table data-ar="">
              <tbody>
                <tr><th>الإعداد</th><th>الوظيفة</th></tr>
                <tr><td>وضع المفتاح</td><td>عادي / مفتاح ثلاثي (Three-way) / ضغط (Push)</td></tr>
                <tr><td>توصيل المفتاح</td><td>Pull-up أو Pull-down حسب التوصيلة</td></tr>
                <tr><td>الريليه</td><td>Active-High أو Active-Low</td></tr>
                <tr><td>اسم نقطة الواي فاي (AP)</td><td>اسم الشبكة التي تُنشئها الوحدة أثناء الإعداد</td></tr>
                <tr><td>زر الإعداد</td><td>توصيل زر الإعداد على الوحدة</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Setting</th><th>What it does</th></tr>
                <tr><td>Switch mode</td><td>Normal / three-way / push button</td></tr>
                <tr><td>Switch wiring</td><td>Pull-up or pull-down, to match your wiring</td></tr>
                <tr><td>Relay</td><td>Active-high or active-low</td></tr>
                <tr><td>Access-point name (AP)</td><td>The network name the unit creates during setup</td></tr>
                <tr><td>Setup button</td><td>Wiring for the unit's setup button</td></tr>
              </tbody>
            </table>
            <div className="callout warn">
              <span className="em">⚠️</span>
              <div data-ar="">إذا كانت المفاتيح الخارجية لا تعمل بشكل صحيح، جرّب تغيير <b>وضع المفتاح</b> أو <b>نوع التوصيل (Pull-up/Pull-down)</b>. وإذا كان الريليه يعمل بشكل معكوس، غيّر <b>Active-High/Low</b>.</div>
              <div data-en="">If external switches don't behave right, try changing the <b>switch mode</b> or the <b>wiring type (pull-up / pull-down)</b>. If a relay works inverted, flip <b>Active-high / low</b>.</div>
            </div>
            <div className="callout tip">
              <span className="em">💾</span>
              <div data-ar="">يُحفظ أي إعداد تغيّره على الوحدة نفسها، فيظلّ محفوظًا حتى بعد فصل الكهرباء.</div>
              <div data-en="">Any setting you change is saved on the unit itself, so it survives a power cut.</div>
            </div>
            <div className="cta-band">
              <div>
                <b data-ar="">شرح مفصّل لصفحة إعداد البوردة</b>
                <b data-en="">The full board-setup walkthrough</b>{' '}
                <span data-ar="">— القوالب الجاهزة، القنوات، منافذ GPIO، وكل خيار خطوة بخطوة.</span>
                <span data-en="">— ready templates, channels, GPIO pins, and every option step by step.</span>
              </div>
              <Link className="btn" href="/docs/configuration"><L ar="دليل إعداد البوردة" en="Board setup guide" /></Link>
            </div>
          </section>

          <section id="control">
            <h2><span className="n">4</span> <L ar="التحكّم في الأجهزة" en="Controlling devices" /></h2>
            <div className="shot"><img src={asset('/assets/screens/home.png')} alt="KUSH SMART control home screen" /></div>
            <p className="shot-cap"><L ar="الشاشة الرئيسية — جميع أجهزتك وحالتها وأزرار التحكّم."
              en="Home screen — all your devices, their status and controls." /></p>
            <table data-ar="">
              <tbody>
                <tr><th>الإجراء</th><th>الطريقة</th></tr>
                <tr><td>تشغيل / إطفاء</td><td>اضغط على زر الجهاز</td></tr>
                <tr><td>خفوت الإضاءة (Dimmer)</td><td>حرّك الشريط لأعلى/لأسفل</td></tr>
                <tr><td>سرعة المروحة</td><td>حرّك شريط السرعة</td></tr>
                <tr><td>الألوان (RGB)</td><td>اختر اللون من دائرة الألوان</td></tr>
                <tr><td>الستائر / الشتر</td><td>أزرار فتح / غلق / إيقاف</td></tr>
                <tr><td>فتح صفحة تفاصيل القناة</td><td>اضغط ضغطة واحدة على أي قناة (حسّاس / إضاءة / RGB / مروحة)</td></tr>
                <tr><td>خيارات الجهاز الكاملة</td><td>اضغط مطوّلًا على الجهاز</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Action</th><th>How</th></tr>
                <tr><td>On / off</td><td>Tap the device button</td></tr>
                <tr><td>Dim a light</td><td>Drag the slider up / down</td></tr>
                <tr><td>Fan speed</td><td>Drag the speed slider</td></tr>
                <tr><td>Colour (RGB)</td><td>Pick a colour from the colour wheel</td></tr>
                <tr><td>Curtains / shutter</td><td>Open / close / stop buttons</td></tr>
                <tr><td>Open the channel detail page</td><td>Single-tap any channel (sensor / light / RGB / fan)</td></tr>
                <tr><td>Full device options</td><td>Long-press the device</td></tr>
              </tbody>
            </table>
          </section>

          <section id="channel">
            <h2><span className="n">4b</span> <L ar="صفحة تفاصيل القناة" en="Channel detail page" /></h2>
            <L tag="p" ar="أي قناة في التطبيق — مفتاح، إضاءة خافتة، RGB، مروحة، ستارة، أو حسّاس — تفتح صفحة تفاصيل خاصّة بها عند الضغط عليها. من هذه الصفحة ترى الحالة الحيّة وتتحكّم وتضبط الإعدادات في مكان واحد."
              en="Any channel in the app — a switch, dimmer, RGB, fan, curtain or sensor — opens its own detail page when you tap it. There you see the live status, control it, and adjust its settings, all in one place." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط على القناة لفتح صفحتها.</li>
                <li>في الأعلى تظهر <b>الحالة الحيّة</b> (تشغيل/إطفاء، نسبة الخفوت، اللون، درجة الحرارة والرطوبة…).</li>
                <li>بالأسفل أدوات <b>التحكّم</b>، و<b>الأتمتة</b> الخاصّة بهذه القناة، و<b>الإعدادات</b> (إعادة التسمية).</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Tap the channel to open its page.</li>
                <li>At the top you see the <b>live status</b> (on/off, brightness, colour, temperature and humidity…).</li>
                <li>Below are the <b>controls</b>, the channel's own <b>automation</b>, and <b>settings</b> (rename).</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🎛️</span>
              <div data-ar="">الأتمتة انتقلت إلى داخل صفحة القناة نفسها — افتح القناة أو الحسّاس واضغط <b>«الأتمتة»</b> لربط شرطٍ بنتيجة.</div>
              <div data-en="">Automation now lives inside the channel page itself — open the channel or sensor and tap <b>Automation</b> to link a condition to an action.</div>
            </div>
          </section>

          <section id="rename">
            <h2><span className="n">5</span> <L ar="تسمية الأجهزة" en="Naming devices" /></h2>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط مطوّلًا على الجهاز ← <b>إعادة تسمية</b>.</li>
                <li>أدخل اسمًا واضحًا مثل «إضاءة الصالة».</li>
                <li>احفظ.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Long-press the device → <b>Rename</b>.</li>
                <li>Enter a clear name like “Living-room light”.</li>
                <li>Save.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">💡</span>
              <div data-ar="">يُحفظ الاسم على الجهاز نفسه، فيظهر بالاسم ذاته في كل مكان داخل التطبيق.</div>
              <div data-en="">The name is stored on the device itself, so it shows the same everywhere in the app.</div>
            </div>
          </section>

          <section id="groups">
            <h2><span className="n">6</span> <L ar="المجموعات" en="Groups" /></h2>
            <L tag="p" ar="اجمع عدّة أجهزة في مجموعة وتحكّم فيها جميعًا بضغطة واحدة (مثلًا «إضاءة الطابق الأول»)."
              en="Put several devices in a group and control them all with one tap (e.g. “First-floor lights”)." />
            <div className="shots-grid">
              <figure>
                <div className="shot"><img src={asset('/assets/screens/groups.png')} alt="Groups page" /></div>
                <p className="shot-cap"><L ar="صفحة المجموعات" en="Groups page" /></p>
              </figure>
              <figure>
                <div className="shot"><img src={asset('/assets/screens/group_edit.png')} alt="Create / edit a group" /></div>
                <p className="shot-cap"><L ar="إنشاء وتعديل مجموعة" en="Create & edit a group" /></p>
              </figure>
            </div>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح صفحة <b>المجموعات</b> ← <b>➕ مجموعة جديدة</b>.</li>
                <li>أدخل اسم المجموعة واختر الأجهزة التي تتضمّنها.</li>
                <li>احفظ — والآن يمكنك تشغيل/إطفاء المجموعة بأكملها مرة واحدة.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the <b>Groups</b> page → <b>➕ New group</b>.</li>
                <li>Enter a group name and pick the devices it includes.</li>
                <li>Save — now you can switch the whole group on or off at once.</li>
              </ol>
            </div>
          </section>

          <section id="voice">
            <h2><span className="n">6b</span> <L ar="التحكّم الصوتي" en="Voice control" /></h2>
            <L tag="p" ar="تحكّم في أجهزتك بصوتك من داخل التطبيق مباشرةً، بالعربية أو الإنجليزية."
              en="Control your devices with your voice, right inside the app — in Arabic or English." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط زر <b>الميكروفون 🎤</b> في الشاشة الرئيسية.</li>
                <li>امنح الإذن باستخدام الميكروفون عند طلبه لأول مرة.</li>
                <li>انطق أمرًا واضحًا مثل: «شغّل إضاءة الصالة» أو «اطفي المروحة».</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Tap the <b>microphone 🎤</b> button on the home screen.</li>
                <li>Grant microphone permission the first time it asks.</li>
                <li>Say a clear command like “Turn on the living-room light” or “Turn off the fan”.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🗣️</span>
              <div data-ar="">استخدم <b>نفس اسم الجهاز</b> الظاهر في التطبيق ليتعرّف عليه بدقّة. الأوامر تُنفَّذ فورًا عبر شبكتك المحليّة.</div>
              <div data-en="">Use the <b>same device name</b> shown in the app so it's recognised accurately. Commands run instantly over your local network.</div>
            </div>
          </section>

          <section id="timers">
            <h2><span className="n">7</span> <L ar="المؤقّتات والإطفاء التلقائي" en="Timers & auto-off" /></h2>
            <L tag="h3" ar="عدّاد تنازلي (مرة واحدة)" en="One-off countdown" />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح تفاصيل الجهاز ← <b>مؤقّت</b>.</li>
                <li>اختر المدة (مثلًا يُطفأ بعد 30 دقيقة).</li>
                <li>أكّد — ويظهر المؤقّت الفعّال داخل صفحة الجهاز.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the device details → <b>Timer</b>.</li>
                <li>Pick a duration (e.g. turn off after 30 minutes).</li>
                <li>Confirm — the running timer shows on the device page.</li>
              </ol>
            </div>
            <L tag="h3" ar="إطفاء تلقائي دائم" en="Permanent auto-off" />
            <L tag="p" ar="«في كل مرة يعمل، يُطفأ بعد عدد من الثواني» — مفيدة لسخّان المياه أو إضاءة الحمّام."
              en="“Every time it turns on, turn it off after N seconds” — handy for a water heater or bathroom light." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح تفاصيل الجهاز ← <b>إطفاء تلقائي</b>.</li>
                <li>حدّد المدة بالثواني واحفظ — وسيعمل في كل مرة يُشغَّل فيها الجهاز.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the device details → <b>Auto-off</b>.</li>
                <li>Set the time in seconds and save — it applies every time the device turns on.</li>
              </ol>
            </div>
          </section>

          <section id="schedule">
            <h2><span className="n">8</span> <L ar="الجدولة الزمنية" en="Scheduling" /></h2>
            <L tag="p" ar="اجعل الأجهزة تعمل/تتوقّف في مواعيد ثابتة (مثلًا تُضاء الإضاءة 6 مساءً وتُطفأ 11)."
              en="Have devices switch on or off at fixed times (e.g. lights on at 6pm, off at 11)." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح صفحة <b>الجدولة</b> ← <b>➕ موعد جديد</b>.</li>
                <li>اختر الجهاز والوقت والأيام.</li>
                <li>اختر الإجراء (تشغيل / إطفاء) واحفظ.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the <b>Schedule</b> page → <b>➕ New schedule</b>.</li>
                <li>Pick the device, time and days.</li>
                <li>Choose the action (on / off) and save.</li>
              </ol>
            </div>
          </section>

          <section id="lock">
            <h2><span className="n">L</span> <L ar="القفل الذكي" en="Smart lock" /></h2>
            <L tag="p" ar="يظهر القفل الذكي في قائمة أجهزتك ككيان خاص. اضغط عليه لفتح صفحة التحكّم."
              en="The smart lock appears in your device list as its own entity. Tap it to open the control page." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li><b>القفل / الفتح:</b> اضغط الزر الكبير لقفل الباب أو فتحه، وتظهر الحالة الحيّة (مقفول / مفتوح) وحالة الباب والبطارية.</li>
                <li><b>إدارة الوصول:</b> من <b>بيانات الدخول</b> تضيف أو تحذف <b>بطاقات RFID</b>، أو <b>بصمات</b>، أو <b>أرقام PIN</b> لفتح القفل.</li>
                <li><b>الإشعارات:</b> يصلك تنبيه عند فتح الباب أو محاولة عبث — حتى والتطبيق مغلق.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li><b>Lock / unlock:</b> tap the big button to lock or unlock the door; the live state (locked / unlocked), door state and battery are shown.</li>
                <li><b>Access management:</b> under <b>Credentials</b>, add or remove <b>RFID cards</b>, <b>fingerprints</b> or <b>PINs</b> that open the lock.</li>
                <li><b>Alerts:</b> you're notified when the door opens or someone tampers — even when the app is closed.</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">🔋</span>
              <div data-ar="">تظهر نسبة بطارية القفل في التطبيق وفي Home Assistant، فتعرف مبكرًا متى تحتاج للشحن أو التغيير.</div>
              <div data-en="">The lock's battery level shows in the app and in Home Assistant, so you know early when it needs charging or replacing.</div>
            </div>
          </section>

          <section id="power">
            <h2><span className="n">P</span> <L ar="عدّاد الطاقة" en="Power meter" /></h2>
            <L tag="p" ar="وحدة قياس استهلاك الكهرباء تظهر ككيان خاص يعرض القراءات لحظيًا لكل خط."
              en="The energy-monitoring unit appears as its own entity with live readings per line." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط على عدّاد الطاقة لفتح صفحته.</li>
                <li>ترى <b>الجهد (V)</b>، <b>التيار (A)</b>، <b>القدرة (W)</b>، <b>القدرة الظاهرية (VA)</b>، <b>معامل القدرة</b>، و<b>الطاقة المستهلكة (kWh)</b> — مع رسم بياني قصير للحِمل.</li>
                <li>يمكنك <b>تسمية كل خط</b>، وإضافة عدّة عدّادات، و<b>تصفير عدّاد الطاقة</b> عند الحاجة.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Tap the power meter to open its page.</li>
                <li>You see <b>voltage (V)</b>, <b>current (A)</b>, <b>power (W)</b>, <b>apparent power (VA)</b>, <b>power factor</b> and <b>energy used (kWh)</b> — with a short load chart.</li>
                <li>You can <b>name each line</b>, add several meters, and <b>reset the energy counter</b> when needed.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">⚡</span>
              <div data-ar="">كل هذه القراءات تظهر أيضًا في Home Assistant كحسّاسات، فتبني لوحات ورسومًا لاستهلاكك على مدار الوقت.</div>
              <div data-en="">All of these readings also appear in Home Assistant as sensors, so you can build dashboards and charts of your usage over time.</div>
            </div>
          </section>

          <section id="automations">
            <h2><span className="n">9</span> <L ar="الأتمتة (عند حدوث شيء، نفّذ إجراءً)" en="Automations (when X happens, do Y)" /></h2>
            <p data-ar="">اربط الحسّاسات بالإجراءات تلقائيًا — دون لمس هاتفك. الأتمتة الآن جزء من <b>صفحة تفاصيل القناة</b>.</p>
            <p data-en="">Link sensors to actions automatically — without touching your phone. Automation is now part of the <b>channel detail page</b>.</p>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط على القناة أو الحسّاس لفتح صفحته ← <b>الأتمتة</b> ← <b>➕ أتمتة جديدة</b>.</li>
                <li>اختر <b>الشرط</b> (مثلًا: الحرارة أكبر من 30، أو فتح حسّاس الباب).</li>
                <li>اختر <b>النتيجة</b>: تشغيل/إطفاء جهاز، و/أو إرسال إشعار.</li>
                <li>احفظ — وتعمل الأتمتة تلقائيًا.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Tap the channel or sensor to open its page → <b>Automation</b> → <b>➕ New automation</b>.</li>
                <li>Pick the <b>condition</b> (e.g. temperature above 30, or the door sensor opens).</li>
                <li>Pick the <b>result</b>: turn a device on/off, and/or send an alert.</li>
                <li>Save — the automation runs on its own.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🤖</span>
              <div data-ar="">أمثلة: «إذا ارتفعت الحرارة شغّل المروحة»، «إذا فُتح الباب أرسل لي إشعارًا وشغّل الإضاءة».</div>
              <div data-en="">Examples: “If it gets hot, turn on the fan.” “If the door opens, alert me and turn on the light.”</div>
            </div>
          </section>

          <section id="sensors">
            <h2><span className="n">10</span> <L ar="الحسّاسات والإشعارات" en="Sensors & alerts" /></h2>
            <L tag="p" ar="يدعم كوش سمارت حسّاسات الحرارة والرطوبة (DHT)، والأبواب/الحركة، والحسّاسات اللاسلكية 433MHz."
              en="KUSH SMART supports temperature & humidity (DHT), door / motion, and 433MHz wireless sensors." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>يظهر الحسّاس تلقائيًا مع قراءته في التطبيق. اضغط عليه لفتح صفحة تفاصيله (الحالة الحيّة + الإعدادات + إعادة التسمية).</li>
                <li>حسّاس الحرارة والرطوبة (DHT): يمكنك تحديد نوعه <b>DHT11 أو DHT22</b> أثناء إعداد البوردة — راجع <Link href="/docs/configuration">دليل الإعداد</Link>.</li>
                <li>لتصلك الإشعارات: افتح الحسّاس ← <b>الأتمتة</b> ← فعّل <b>«إرسال إشعار عند وقوع حدث»</b>.</li>
                <li>تأكّد من تفعيل إشعارات التطبيق من إعدادات الهاتف.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>A sensor appears automatically with its reading. Tap it to open its detail page (live status + settings + rename).</li>
                <li>Temperature & humidity (DHT): you can choose the type <b>DHT11 or DHT22</b> during board setup — see the <Link href="/docs/configuration">setup guide</Link>.</li>
                <li>To get alerts: open the sensor → <b>Automation</b> → enable <b>“Send a notification on an event.”</b></li>
                <li>Make sure app notifications are enabled in your phone's settings.</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">🔔</span>
              <div data-ar="">تصلك الإشعارات حتى والتطبيق مغلق.</div>
              <div data-en="">Alerts reach you even when the app is closed.</div>
            </div>
          </section>

          <section id="remote">
            <h2><span className="n">11</span> <L ar="التحكّم اللاسلكي 433MHz و IR (الأشعّة)" en="433MHz & IR (infrared) remotes" /></h2>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح صفحة <b>أجهزة التحكّم</b>.</li>
                <li>اضغط <b>«تعلّم زرًّا جديدًا»</b>، واختر الجهاز الذي سيتحكّم فيه الزر (والإجراء: تشغيل/إطفاء/تبديل، أو إشعار للحسّاسات).</li>
                <li>اضغط الزر على جهاز التحكّم — وستتعلّم الوحدة الرمز.</li>
                <li>وبذلك يتحكّم الزر في الجهاز الذي اخترته.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the <b>Remotes</b> page.</li>
                <li>Tap <b>“Learn a new button”</b> and pick the device it controls (and the action: on / off / toggle, or an alert for sensors).</li>
                <li>Press the button on your remote — the unit learns the code.</li>
                <li>That button now controls the device you chose.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">📡</span>
              <div data-ar="">يمكنك أيضًا ربط حسّاسات 433MHz لاسلكية بإشعارات أو أتمتة بدلًا من التحكّم في مفتاح.</div>
              <div data-en="">You can also link 433MHz wireless sensors to alerts or automations instead of controlling a switch.</div>
            </div>
          </section>

          <section id="hidden">
            <h2><span className="n">12</span> <L ar="المفاتيح المخفيّة" en="Hidden switches" /></h2>
            <L tag="p" ar="مفاتيح محميّة بكلمة سرّ — لا تظهر إلا بعد إدخال الرمز، لمزيد من الخصوصية والأمان."
              en="Password-protected switches — they only appear after you enter the code, for extra privacy and security." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح صفحة <b>المفاتيح المخفيّة</b> وحدّد كلمة سرّ.</li>
                <li>اختر المفاتيح التي تريد إخفاءها.</li>
                <li>والآن لن تظهر إلا عند إدخال الرمز.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the <b>Hidden switches</b> page and set a password.</li>
                <li>Pick the switches you want to hide.</li>
                <li>They now only show once you enter the code.</li>
              </ol>
            </div>
            <L tag="h3" ar="قفل مفتاح واحد برمز (PIN)" en="Lock a single switch with a PIN" />
            <p data-ar="">يمكنك أيضًا حماية <b>مفتاح بعينه</b> برمز، فلا يعمل إلا بعد إدخاله — مفيد لمفاتيح حسّاسة كسخّان المياه أو البوابة.</p>
            <p data-en="">You can also protect <b>a specific switch</b> with a PIN, so it won't work until you enter it — handy for sensitive switches like a water heater or gate.</p>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط مطوّلًا على الجهاز ← <b>تعديل</b> (نفس مكان تغيير الاسم والأيقونة).</li>
                <li>اختر <b>رمز الحماية (PIN)</b> وحدّد رمزًا للمفتاح.</li>
                <li>بعدها يطلب التطبيق الرمز قبل تشغيل هذا المفتاح.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Long-press the device → <b>Edit</b> (the same place you change the name and icon).</li>
                <li>Choose <b>PIN protection</b> and set a code for the switch.</li>
                <li>The app then asks for the code before turning that switch on.</li>
              </ol>
            </div>
          </section>

          <section id="update">
            <h2><span className="n">13</span> <L ar="تحديث الأجهزة لاسلكيًا (OTA)" en="Over-the-air updates (OTA)" /></h2>
            <L tag="p" ar="تُحدّث أجهزة كوش سمارت نفسها لاسلكيًا — دون فكّها أو توصيلها بالكمبيوتر. التطبيق يفحص أحدث إصدار منشور ويقارنه برقم إصدار الجهاز، ولا يُرسل التحديث إلا عندما تطلبه أنت."
              en="KUSH SMART devices update themselves wirelessly — no dismantling, no plugging into a computer. The app checks the latest published version against the device's version, and only sends the update when you ask." />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط مطوّلًا على الجهاز لفتح <b>معلومات الجهاز</b>.</li>
                <li>في بند <b>«الإصدار»</b> اضغط <b>«فحص التحديث»</b> — فإن توفّر أحدث ظهر زر <b>«تحديث»</b>.</li>
                <li>اضغط <b>«تحديث»</b> — وتظهر نافذة تُبيّن <b>النسبة المئوية</b> للتقدّم و<b>كم تبقّى</b> لحظةً بلحظة.</li>
                <li>عند اكتمال 100% يُعيد الجهاز تشغيل نفسه على الإصدار الجديد ويعود متّصلًا تلقائيًا.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Long-press the device to open <b>Device info</b>.</li>
                <li>Under <b>“Firmware”</b> tap <b>“Check for update”</b> — if a newer one exists, an <b>Update</b> button appears.</li>
                <li>Tap <b>Update</b> — a dialog shows the <b>percentage</b> and <b>how much is left</b>, live.</li>
                <li>At 100% the device reboots into the new version and comes back online on its own.</li>
              </ol>
            </div>
            <div className="callout warn">
              <span className="em">🔌</span>
              <div data-ar="">لا تفصل الكهرباء عن الجهاز أثناء التحديث. إعداداتك وبيانات الواي فاي والتراخيص كلّها محفوظة — يُستبدل البرنامج فقط.</div>
              <div data-en="">Don't cut power to the device during an update. Your settings, Wi-Fi and licences are all kept — only the program is replaced.</div>
            </div>
            <div className="callout info">
              <span className="em">📥</span>
              <div data-ar="">تجد أحدث إصدار منشور لكل بوردة في صفحة <Link href="/downloads">التحميل</Link>. النُّسخ يرفعها فريق كوش سمارت من لوحة التحكّم.</div>
              <div data-en="">You'll find the latest published version for each board on the <Link href="/downloads">Download</Link> page. Versions are published by the KUSH SMART team from the console.</div>
            </div>
          </section>

          <section id="appearance">
            <h2><span className="n">⚙</span> <L ar="اللغة والمظهر" en="Language & appearance" /></h2>
            <p data-ar="">غيّر لغة التطبيق ومظهره في أي وقت من صفحة <b>حسابي</b> — ويُطبَّق فورًا على كل الشاشات دون فقدان الاتصال بأجهزتك.</p>
            <p data-en="">Change the app's language and theme any time from the <b>Account</b> page — it applies instantly across every screen without dropping the connection to your devices.</p>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح تبويب <b>حسابي</b> (أسفل الشاشة).</li>
                <li><b>اللغة:</b> بدّل بين <b>العربية</b> و<b>English</b> — تتحوّل الواجهة كاملةً بما فيها اتجاه الكتابة.</li>
                <li><b>المظهر:</b> اختر <b>فاتح</b> أو <b>داكن</b> أو <b>حسب النظام</b> (يتبع إعداد هاتفك تلقائيًا).</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the <b>Account</b> tab (bottom of the screen).</li>
                <li><b>Language:</b> switch between <b>العربية</b> and <b>English</b> — the whole interface flips, including text direction.</li>
                <li><b>Theme:</b> choose <b>Light</b>, <b>Dark</b>, or <b>Follow system</b> (matches your phone automatically).</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">👤</span>
              <div data-ar="">من <b>حسابي</b> أيضًا تجد بياناتك، وبريد الدعم، وتسجيل الخروج، وحذف الحساب.</div>
              <div data-en="">The <b>Account</b> page is also where you find your details, the support email, sign-out and account deletion.</div>
            </div>
          </section>

          <section id="faq">
            <h2><span className="n">?</span> <L ar="حلّ المشكلات" en="Troubleshooting" /></h2>
            <div className="card" data-ar="">
              <h3>يظهر الجهاز «غير متّصل»؟</h3>
              <p>تأكّد من وصول الكهرباء وعمل الواي فاي، ومن جودة الإشارة في مكان الجهاز. جرّب إيقاف الراوتر وتشغيله والانتظار دقيقة.</p>
              <h3>جهاز جديد لا يظهر؟</h3>
              <p>تأكّد من إتمام خطوات الإضافة ومن اتصال الوحدة بالواي فاي. أغلق التطبيق وأعد فتحه.</p>
              <h3>المفاتيح الخارجية لا تعمل بشكل صحيح؟</h3>
              <p>من <a href="#config">الإعدادات العامة</a> غيّر وضع المفتاح أو نوع التوصيل (Pull-up/Pull-down)، وإذا كان الريليه معكوسًا غيّر Active-High/Low.</p>
              <h3>الجهاز يستجيب ببطء؟</h3>
              <p>داخل المنزل يكون التحكّم محليًا وفوريًا. إذا كان بطيئًا، تأكّد من أن هاتفك على شبكة الواي فاي نفسها الخاصة بالأجهزة.</p>
              <h3>لا تصلني الإشعارات؟</h3>
              <p>تأكّد من تفعيل إذن الإشعارات للتطبيق من إعدادات الهاتف، ومن تسجيل الدخول. تصلك الإشعارات حتى والتطبيق مغلق. راجع <a href="#sensors">الحسّاسات والإشعارات</a>.</p>
              <h3>التحكّم الصوتي لا يعمل؟</h3>
              <p>امنح التطبيق إذن الميكروفون، وانطق <b>اسم الجهاز كما هو مكتوب</b> في التطبيق. تحقّق أيضًا من وجود خدمة تعرّف صوتي على هاتفك.</p>
              <h3>لم يظهر التحديث الجديد للجهاز؟</h3>
              <p>اضغط مطوّلًا على الجهاز ← «فحص التحديث». راجع <a href="#update">تحديث الأجهزة لاسلكيًا</a>.</p>
              <h3>نسيت كلمة المرور؟</h3>
              <p>من شاشة الدخول اضغط «نسيت كلمة المرور» واتبع الخطوات الواردة في بريدك.</p>
            </div>
            <div className="card" data-en="">
              <h3>A device shows “offline”?</h3>
              <p>Check it has power and Wi-Fi, and that the signal is good where it's installed. Try turning your router off and on and waiting a minute.</p>
              <h3>A new device won't appear?</h3>
              <p>Make sure you finished the add steps and the unit connected to Wi-Fi. Close the app and reopen it.</p>
              <h3>External switches don't behave right?</h3>
              <p>In <a href="#config">General settings</a>, change the switch mode or the wiring type (pull-up / pull-down); if a relay is inverted, flip Active-high / low.</p>
              <h3>The device responds slowly?</h3>
              <p>At home, control is local and instant. If it's slow, make sure your phone is on the same Wi-Fi network as the devices.</p>
              <h3>I'm not getting notifications?</h3>
              <p>Make sure the app's notification permission is on in your phone settings, and that you're signed in. Alerts arrive even when the app is closed. See <a href="#sensors">Sensors & alerts</a>.</p>
              <h3>Voice control isn't working?</h3>
              <p>Grant the app microphone permission, and say the <b>device name exactly as written</b> in the app. Also check your phone has a speech-recognition service.</p>
              <h3>A new update isn't showing?</h3>
              <p>Long-press the device → “Check for update”. See <a href="#update">Over-the-air updates</a>.</p>
              <h3>Forgot your password?</h3>
              <p>On the sign-in screen tap “Forgot password” and follow the steps in your email.</p>
            </div>
            <div className="cta-band">
              <div>
                <b data-ar="">تحتاج مزيدًا من المساعدة؟</b>
                <b data-en="">Need more help?</b>{' '}
                <span data-ar="">تواصل مع الدعم الفني ومعك اسم/سيريال الوحدة (من صفحة تفاصيل الجهاز).</span>
                <span data-en="">Contact support with the unit's name / serial (from the device details page).</span>
              </div>
              <Link className="btn" href="/downloads"><L ar="تحميل التطبيق" en="Get the app" /></Link>
            </div>
          </section>
        </main>
      </div>

      <SlimFooter />
    </>
  );
}
