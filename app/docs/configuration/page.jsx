import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import DocsToc from '@/components/DocsToc';
import L from '@/components/L';

export const metadata = {
  title: 'Board setup (device profile) | KUSH SMART — كوش سمارت',
  description:
    'A full walkthrough of the KUSH SMART board setup page — ready templates, channels and types, GPIO pins, advanced settings and the setup button. Step by step for anyone.',
};

const NAV = [
  { href: '/#features', label: 'المميزات', en: 'Features' },
  { href: '/#how', label: 'كيف يعمل', en: 'How it works' },
  { href: '/docs', label: 'الدليل', en: 'Guide', active: true },
  { href: '/downloads', label: 'التحميل', en: 'Download', btn: true },
];

const TOC = [
  {
    title: 'الأساسيات', titleEn: 'Basics',
    items: [
      { href: '#overview', label: 'ما هي هذه الصفحة؟', en: 'What is this page?' },
      { href: '#open', label: 'كيف تفتحها', en: 'How to open it' },
      { href: '#templates', label: 'البداية السريعة بالقوالب', en: 'Quick start with templates' },
    ],
  },
  {
    title: 'القنوات', titleEn: 'Channels',
    items: [
      { href: '#channels', label: 'القنوات وأنواعها', en: 'Channels & types' },
      { href: '#gpio', label: 'ما هو منفذ GPIO؟', en: 'What is a GPIO pin?' },
      { href: '#wallswitch', label: 'مفتاح الحائط الإضافي', en: 'Extra wall switch' },
    ],
  },
  {
    title: 'المتقدّم', titleEn: 'Advanced',
    items: [
      { href: '#settings', label: 'تبويب الإعدادات', en: 'Settings tab' },
      { href: '#hardware', label: 'تبويب العتاد', en: 'Hardware tab' },
      { href: '#button', label: 'زر الإعداد ومؤشّرات LED', en: 'Setup button & LEDs' },
    ],
  },
  {
    title: 'الإنهاء', titleEn: 'Finishing',
    items: [
      { href: '#save', label: 'الحفظ والقفل', en: 'Save & lock' },
      { href: '#faq', label: 'حلّ المشكلات', en: 'Troubleshooting' },
    ],
  },
];

export default function ConfigDocsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <div className="wrap docs">
        <DocsToc groups={TOC} />

        <main className="doc-main">
          <p className="sub" style={{ marginBottom: 6 }}>
            <Link href="/docs"><L ar="الدليل" en="Guide" /></Link>{' '}<L ar="←" en="→" />{' '}<L ar="إعداد البوردة" en="Board setup" />
          </p>
          <L tag="h1" ar="إعداد البوردة (ملف التعريف)" en="Board setup (device profile)" />
          <p className="sub">
            <L ar="هذه الصفحة تشرح كل زر وخيار في صفحة «إعداد الجهاز» داخل التطبيق — بطريقة مبسّطة يفهمها أي شخص، حتى لو لأول مرة."
              en="This page explains every button and option on the “Device setup” screen in the app — in plain terms anyone can follow, even first-time." />
          </p>

          <div className="callout tip">
            <span className="em">⏱️</span>
            <div data-ar=""><b>أسرع طريقة في ٣ خطوات:</b> افتح تبويب <b>القنوات</b> ← اضغط <b>قالبًا جاهزًا</b> يناسب بوردتك ← اضغط <b>إنشاء ملف التعريف</b>. خلاص! باقي الصفحة شرح تفصيلي لو حابب تتعمّق أو تعدّل يدويًا.</div>
            <div data-en=""><b>Fastest way, in 3 steps:</b> open the <b>Channels</b> tab → tap a <b>ready template</b> that matches your board → tap <b>Create profile</b>. Done! The rest of this page is detail for when you want to go deeper or edit by hand.</div>
          </div>

          <section id="overview">
            <h2><span className="n">1</span> <L ar="ما هي هذه الصفحة؟" en="What is this page?" /></h2>
            <p data-ar="">كل بوردة (ESP32 / ESP8266) عبارة عن «عقل» فيه عدّة أطراف كهربائية تُسمّى <b>منافذ GPIO</b>. صفحة الإعداد هي المكان الذي <b>تُخبر فيه البوردة بما هو موصّل بكل طرف</b> — مفتاح إضاءة؟ ديمر؟ إضاءة ملوّنة؟ حسّاس حرارة؟ — وعلى أي منفذ.</p>
            <p data-en="">Each board (ESP32 / ESP8266) is a small “brain” with several electrical pins called <b>GPIO pins</b>. This page is where you <b>tell the board what's wired to each pin</b> — a light switch? a dimmer? RGB lighting? a temperature sensor? — and on which pin.</p>
            <p data-ar="">بعد أن تحفظ، تُكتب هذه التعريفات داخل البوردة <b>وتُقفل بشكل دائم</b>، فتعرف البوردة وظيفتها وتعمل وحدها حتى بدون إنترنت.</p>
            <p data-en="">Once you save, these definitions are written into the board <b>and locked permanently</b>, so it knows its job and runs on its own — even with no internet.</p>
            <div className="callout info">
              <span className="em">🧩</span>
              <div data-ar="">فكّر فيها كـ«قائمة توصيلات»: لكل سطر تقول «النوع» (إيه الموصّل) و«المنفذ» (على أي رِجل في البوردة).</div>
              <div data-en="">Think of it as a “wiring list”: for each row you set the <b>type</b> (what's connected) and the <b>pin</b> (which leg of the board).</div>
            </div>
          </section>

          <section id="open">
            <h2><span className="n">2</span> <L ar="كيف تفتح الصفحة" en="How to open the page" /></h2>
            <div className="card" data-ar="">
              <ol className="steps">
                <li><b>أثناء إضافة جهاز جديد:</b> تظهر تلقائيًا للوحدة الجديدة التي لم تُعرَّف بعد.</li>
                <li><b>لاحقًا:</b> اضغط مطوّلًا على الجهاز ← <b>إعداد الوحدة</b>، أو من شاشة «الجهاز يحتاج إعداد» اضغط <b>إضافة التعريفات</b>.</li>
                <li>بالأعلى يمين الصفحة زر <b>؟</b> يفتح هذا الشرح في أي وقت.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li><b>While adding a new device:</b> it opens automatically for a new, unconfigured unit.</li>
                <li><b>Later:</b> long-press the device → <b>Configure unit</b>, or from the “Device needs setup” screen tap <b>Add definitions</b>.</li>
                <li>A <b>?</b> button at the top of the page opens this guide any time.</li>
              </ol>
            </div>
            <p><L ar="الصفحة فيها ثلاثة تبويبات بالأعلى:" en="The page has three tabs at the top:" /></p>
            <table data-ar="">
              <tbody>
                <tr><th>التبويب</th><th>ماذا يحتوي</th></tr>
                <tr><td><b>القنوات</b></td><td>تعريف كل مخرج/مدخل (الأهم — ابدأ من هنا)</td></tr>
                <tr><td><b>الإعدادات</b></td><td>سلوك متقدّم للمفاتيح والريليه (اختياري)</td></tr>
                <tr><td><b>العتاد</b></td><td>اسم المشروع ومنافذ الأزرار والمؤشّرات (اختياري)</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Tab</th><th>What it holds</th></tr>
                <tr><td><b>Channels</b></td><td>Define each output/input (the important one — start here)</td></tr>
                <tr><td><b>Settings</b></td><td>Advanced switch and relay behaviour (optional)</td></tr>
                <tr><td><b>Hardware</b></td><td>Project name, button and indicator pins (optional)</td></tr>
              </tbody>
            </table>
          </section>

          <section id="templates">
            <h2><span className="n">3</span> <L ar="البداية السريعة بالقوالب الجاهزة" en="Quick start with ready templates" /></h2>
            <p data-ar="">أسهل طريقة على الإطلاق. في أعلى تبويب <b>القنوات</b> ستجد صفًّا من <b>القوالب الجاهزة</b> تتنقّل بينها بالسحب يمينًا/يسارًا.</p>
            <p data-en="">By far the easiest way. At the top of the <b>Channels</b> tab you'll find a row of <b>ready templates</b> you swipe through.</p>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>افتح تبويب <b>القنوات</b> (أول تبويب بالأعلى).</li>
                <li>اسحب صفّ القوالب لتشاهد كل الخيارات، ثم <b>اضغط القالب</b> الذي يطابق بوردتك (مثلًا «4 مفاتيح»).</li>
                <li>سيملأ التطبيق القنوات فورًا، ويختار <b>منافذ GPIO المتاحة تلقائيًا</b>، ويسمّيها أسماءً افتراضية (مفتاح 1، مفتاح 2…).</li>
                <li>انزل لقائمة القنوات بالأسفل و<b>عدّل الأسماء</b> لتصير واضحة (مثلًا «إضاءة الصالة»). <i>اختياري.</i></li>
                <li>تأكّد أن شريط الملخّص بالأعلى <b>أخضر بدون تنبيهات</b>، ثم اضغط <b>إنشاء ملف التعريف</b>.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Open the <b>Channels</b> tab (the first tab at the top).</li>
                <li>Swipe the template row to see all options, then <b>tap the template</b> that matches your board (e.g. “4 switches”).</li>
                <li>The app fills the channels instantly, picks <b>free GPIO pins automatically</b>, and gives them default names (Switch 1, Switch 2…).</li>
                <li>Scroll to the channel list below and <b>edit the names</b> to be clear (e.g. “Living-room light”). <i>Optional.</i></li>
                <li>Check the summary bar at the top is <b>green with no warnings</b>, then tap <b>Create profile</b>.</li>
              </ol>
            </div>
            <p><L ar="الجدول التالي يوضّح أي قالب يناسب أي حالة:" en="This table shows which template fits which case:" /></p>
            <table data-ar="">
              <tbody>
                <tr><th>القالب</th><th>يناسب</th></tr>
                <tr><td>مفتاح واحد</td><td>إضاءة أو جهاز واحد</td></tr>
                <tr><td>مفتاحان / 4 / 6 مفاتيح</td><td>لوحات المفاتيح المتعددة</td></tr>
                <tr><td>إضاءة معتّمة (ديمر)</td><td>إضاءة قابلة للتعتيم</td></tr>
                <tr><td>إضاءة RGB</td><td>إضاءة ملوّنة (3 منافذ)</td></tr>
                <tr><td>ستارة</td><td>ستارة/شتر كهربائي (فتح وغلق)</td></tr>
                <tr><td>حسّاس حرارة</td><td>حسّاس حرارة ورطوبة DHT</td></tr>
                <tr><td>مفاتيح + حسّاس</td><td>3 مفاتيح مع حسّاس حرارة</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Template</th><th>Best for</th></tr>
                <tr><td>Single switch</td><td>One light or appliance</td></tr>
                <tr><td>2 / 4 / 6 switches</td><td>Multi-gang switch panels</td></tr>
                <tr><td>Dimmable light</td><td>A light you can dim</td></tr>
                <tr><td>RGB light</td><td>Colour lighting (3 pins)</td></tr>
                <tr><td>Curtain</td><td>Motorised curtain / shutter (open & close)</td></tr>
                <tr><td>Temperature sensor</td><td>A DHT temperature & humidity sensor</td></tr>
                <tr><td>Switches + sensor</td><td>3 switches with a temperature sensor</td></tr>
              </tbody>
            </table>
            <div className="callout tip">
              <span className="em">✏️</span>
              <div data-ar="">بعد تطبيق القالب يمكنك تعديل أي اسم أو منفذ بسهولة في قائمة القنوات بالأسفل. القالب مجرّد بداية سريعة — لست مضطرًّا لاستخدامه.</div>
              <div data-en="">After applying a template you can easily tweak any name or pin in the channel list below. A template is just a quick start — you don't have to use one.</div>
            </div>
          </section>

          <section id="channels">
            <h2><span className="n">4</span> <L ar="القنوات وأنواعها" en="Channels & their types" /></h2>
            <p data-ar="">كل قناة (سطر) لها: <b>اسم</b> تختاره، و<b>نوع</b> يحدّد ما هو الموصّل، و<b>منفذ GPIO</b> واحد أو أكثر. اختر النوع <b>«بلا»</b> لأي قناة غير مستخدمة.</p>
            <p data-en="">Each channel (row) has: a <b>name</b> you choose, a <b>type</b> that says what's connected, and one or more <b>GPIO pins</b>. Set the type to <b>“None”</b> for any unused channel.</p>
            <L tag="h3" ar="تعريف قناة يدويًا — خطوة بخطوة" en="Defining a channel by hand — step by step" />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>اضغط على خانة <b>النوع</b> في القناة، واختر ما هو موصّل بها (مثلًا «تشغيل/إيقاف» لمفتاح إضاءة).</li>
                <li>اضغط على خانة <b>GPIO</b> واختر رقم المنفذ الذي وصّلت إليه السلك على البوردة.</li>
                <li>لو النوع <b>RGB</b> ستظهر خانتان إضافيتان (G وB) — حدّدهما. ولو <b>ستارة</b> ستظهر خانة «منفذ الخفض».</li>
                <li>لو النوع <b>حرارة/رطوبة (DHT)</b> اختر <b>نوع الحسّاس</b> الذي وصّلته: <b>DHT22</b> (AM2302) أو <b>DHT11</b>.</li>
                <li>اكتب <b>اسمًا</b> واضحًا للقناة في الخانة العلوية.</li>
                <li>كرّر لكل قناة مستخدمة، واترك الباقي على «بلا».</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Tap the channel's <b>Type</b> field and choose what's wired to it (e.g. “On/Off” for a light switch).</li>
                <li>Tap the <b>GPIO</b> field and pick the pin number you wired the cable to on the board.</li>
                <li>For type <b>RGB</b>, two extra fields appear (G and B) — set them. For <b>Curtain</b>, a “down pin” field appears.</li>
                <li>For type <b>Temp/Humidity (DHT)</b>, choose the <b>sensor type</b> you connected: <b>DHT22</b> (AM2302) or <b>DHT11</b>.</li>
                <li>Type a clear <b>name</b> for the channel in the top field.</li>
                <li>Repeat for each used channel, and leave the rest on “None”.</li>
              </ol>
            </div>
            <table data-ar="">
              <tbody>
                <tr><th>النوع</th><th>الاستخدام</th><th>عدد المنافذ</th></tr>
                <tr><td>تشغيل/إيقاف</td><td>مفتاح إضاءة أو جهاز عادي (ريليه)</td><td>1</td></tr>
                <tr><td>باهت (ديمر)</td><td>إضاءة قابلة للتعتيم</td><td>1</td></tr>
                <tr><td>مروحة</td><td>مروحة بسرعات</td><td>1</td></tr>
                <tr><td>إضاءة RGB</td><td>إضاءة ملوّنة (أحمر/أخضر/أزرق)</td><td>3 (R + G + B)</td></tr>
                <tr><td>شريط RGB</td><td>شريط LED ملوّن (WS2812) + عدد اللمبات</td><td>1 (منفذ البيانات)</td></tr>
                <tr><td>ستارة</td><td>ستارة/شتر — رفع وخفض</td><td>2 (رفع + خفض)</td></tr>
                <tr><td>حرارة/رطوبة (DHT)</td><td>حسّاس حرارة ورطوبة</td><td>1</td></tr>
                <tr><td>تناظري</td><td>قراءة حسّاس تناظري (قيمة متغيّرة)</td><td>1</td></tr>
                <tr><td>رقمي</td><td>مدخل رقمي (باب/حركة: مفتوح/مغلق)</td><td>1</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Type</th><th>Use</th><th>Pins</th></tr>
                <tr><td>On/Off</td><td>A light switch or plain appliance (relay)</td><td>1</td></tr>
                <tr><td>Dimmer</td><td>A dimmable light</td><td>1</td></tr>
                <tr><td>Fan</td><td>A multi-speed fan</td><td>1</td></tr>
                <tr><td>RGB light</td><td>Colour light (red/green/blue)</td><td>3 (R + G + B)</td></tr>
                <tr><td>RGB strip</td><td>Addressable LED strip (WS2812) + LED count</td><td>1 (data pin)</td></tr>
                <tr><td>Curtain</td><td>Curtain / shutter — up and down</td><td>2 (up + down)</td></tr>
                <tr><td>Temp/Humidity (DHT)</td><td>Temperature & humidity sensor</td><td>1</td></tr>
                <tr><td>Analog</td><td>An analog sensor reading (variable value)</td><td>1</td></tr>
                <tr><td>Digital</td><td>A digital input (door/motion: open/closed)</td><td>1</td></tr>
              </tbody>
            </table>
            <div className="callout warn">
              <span className="em">⚠️</span>
              <div data-ar="">إضاءة RGB تحتاج تحديد <b>ثلاثة منافذ</b> (R وG وB)، والستارة تحتاج <b>منفذين</b> (رفع وخفض). لو نسيت واحدًا سينبّهك التطبيق عند الحفظ.</div>
              <div data-en="">RGB lighting needs <b>three pins</b> (R, G and B), and a curtain needs <b>two</b> (up and down). If you miss one, the app warns you when you save.</div>
            </div>
            <div className="callout tip">
              <span className="em">🌡️</span>
              <div data-ar=""><b>حسّاس الحرارة والرطوبة (DHT):</b> عند اختيار النوع «حرارة/رطوبة» يظهر لك اختيار <b>نوع الحسّاس (DHT22 / DHT11)</b> — اختر ما وصّلته. حتى لو اخترت النوع الخطأ، تكتشف اللوحة النوع الصحيح تلقائيًا. إذا لم تظهر قراءات نهائيًا، تأكّد من وجود <b>مقاومة 10 كيلو أوم (Pull-up)</b> بين خط الداتا و+3.3 فولت.</div>
              <div data-en=""><b>Temperature & humidity (DHT):</b> when you pick “Temp/Humidity”, a <b>sensor type (DHT22 / DHT11)</b> choice appears — pick what you wired. Even if you pick the wrong one, the board auto-detects the correct type. If you get no readings at all, make sure there's a <b>10kΩ pull-up resistor</b> between the data line and +3.3V.</div>
            </div>
          </section>

          <section id="gpio">
            <h2><span className="n">5</span> <L ar="ما هو منفذ GPIO؟" en="What is a GPIO pin?" /></h2>
            <p data-ar="">GPIO هو رقم الطرف الكهربائي على البوردة الذي وصّلت إليه السلك. عند توصيل المفتاح أو الحسّاس بالبوردة، تكون قد وصّلته إلى رقم منفذ معيّن — اختر <b>نفس الرقم</b> هنا.</p>
            <p data-en="">A GPIO is the number of the electrical pin on the board that you wired the cable to. When you connect a switch or sensor to the board, you connect it to a specific pin number — choose <b>that same number</b> here.</p>
            <L tag="h3" ar="كيف تعرف رقم المنفذ؟" en="How do you find the pin number?" />
            <div className="card" data-ar="">
              <ol className="steps">
                <li>انظر إلى البوردة نفسها — الأرقام مطبوعة بجانب الأطراف (مثل <code>D5</code> أو <code>GPIO14</code> أو رقم فقط).</li>
                <li>الرقم الذي وصّلت إليه سلك المفتاح/الجهاز هو ما تختاره في خانة GPIO.</li>
                <li>لو لم تركّب الأسلاك بعد، استخدم قالبًا جاهزًا ودع التطبيق يقترح المنافذ، ثم وصّل أسلاكك على نفس الأرقام التي ظهرت.</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Look at the board itself — the numbers are printed next to the pins (like <code>D5</code>, <code>GPIO14</code>, or just a number).</li>
                <li>The number you wired the switch/device cable to is what you pick in the GPIO field.</li>
                <li>If you haven't wired yet, apply a template and let the app suggest the pins, then wire to the same numbers it shows.</li>
              </ol>
            </div>
            <div className="callout warn">
              <span className="em">🚫</span>
              <div data-ar="">بعض المنافذ على ESP32/ESP8266 لها وظائف خاصة عند الإقلاع (مثل GPIO0). لو لم تكن خبيرًا، التزم بالمنافذ التي يقترحها القالب لتجنّب أي تعارض.</div>
              <div data-en="">Some ESP32/ESP8266 pins have special roles at boot (like GPIO0). If you're not an expert, stick to the pins the template suggests to avoid conflicts.</div>
            </div>
            <div className="callout tip">
              <span className="em">💡</span>
              <div data-ar="">لو استخدمت أحد <b>القوالب الجاهزة</b> فلن تحتاج لمعرفة هذه الأرقام — يختارها التطبيق لك من المنافذ المتاحة. غيّرها فقط إن كانت توصيلتك مختلفة.</div>
              <div data-en="">If you use a <b>ready template</b> you won't need to know these numbers — the app picks them from the free pins. Only change them if your wiring is different.</div>
            </div>
            <div className="callout info">
              <span className="em">🔢</span>
              <div data-ar="">كل منفذ يُستخدم <b>مرّة واحدة</b> فقط. إذا كرّرت نفس الرقم في قناتين سيظهر تنبيه أحمر، ويجب تصحيحه قبل الحفظ.</div>
              <div data-en="">Each pin is used <b>only once</b>. If you repeat the same number on two channels, a red warning shows and must be fixed before saving.</div>
            </div>
          </section>

          <section id="wallswitch">
            <h2><span className="n">6</span> <L ar="مفتاح الحائط الإضافي (اختياري)" en="Extra wall switch (optional)" /></h2>
            <p data-ar="">لأي قناة من نوع <b>تشغيل/إيقاف</b> يمكنك إضافة <b>مفتاح حائط فيزيائي</b> — أي مفتاح الإضاءة التقليدي على الحائط — فيتحكّم في نفس الخرج جنبًا إلى جنب مع التطبيق. اختر له منفذ GPIO الخاص به في خانة «مفتاح حائط».</p>
            <p data-en="">For any <b>On/Off</b> channel you can add a <b>physical wall switch</b> — the traditional light switch on the wall — so it controls the same output alongside the app. Give it its own GPIO pin in the “Wall switch” field.</p>
          </section>

          <section id="settings">
            <h2><span className="n">7</span> <L ar="تبويب «الإعدادات» (متقدّم)" en="The “Settings” tab (advanced)" /></h2>
            <p data-ar="">هذه الخيارات تضبط <b>طريقة عمل</b> المفاتيح والريليه حسب تركيبتك الكهربائية. <b>اتركها كما هي إن لم تكن متأكدًا</b> — القيم الافتراضية تناسب معظم اللوحات.</p>
            <p data-en="">These options tune <b>how</b> the switches and relays behave for your wiring. <b>Leave them as-is if unsure</b> — the defaults suit most boards.</p>
            <table data-ar="">
              <tbody>
                <tr><th>الإعداد</th><th>الوظيفة</th><th>افتراضي</th></tr>
                <tr><td>اسم شبكة الإعداد</td><td>اسم نقطة الواي فاي التي تنشئها الوحدة عند الإعداد</td><td>UNIT</td></tr>
                <tr><td>وضع المفاتيح</td><td>عادي / ثلاثي (تتبّع الحالة الحقيقية) / ضغط (زر لحظي)</td><td>عادي</td></tr>
                <tr><td>معالجة المفاتيح</td><td>استطلاع (ثابت، موصى به) / مقاطعات (أسرع)</td><td>استطلاع</td></tr>
                <tr><td>توصيل المفاتيح</td><td>رفع (Pull-up) / خفض (Pull-down)</td><td>رفع</td></tr>
                <tr><td>وضع المرحّلات</td><td>فعّال-مرتفع / فعّال-منخفض</td><td>فعّال-مرتفع</td></tr>
                <tr><td>سلوك مؤشّر الواي فاي</td><td>الحالة (يضيء حسب الاتصال) / صامت (مطفأ)</td><td>الحالة</td></tr>
                <tr><td>توصيل مؤشّرات LED</td><td>فعّال-مرتفع / فعّال-منخفض</td><td>فعّال-مرتفع</td></tr>
                <tr><td>توصيل زر الإعداد</td><td>رفع / خفض</td><td>رفع</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Setting</th><th>What it does</th><th>Default</th></tr>
                <tr><td>Setup network name</td><td>Name of the Wi-Fi access point the unit creates during setup</td><td>UNIT</td></tr>
                <tr><td>Switch mode</td><td>Normal / three-way (follow real state) / push (momentary)</td><td>Normal</td></tr>
                <tr><td>Switch handling</td><td>Polling (stable, recommended) / interrupts (faster)</td><td>Polling</td></tr>
                <tr><td>Switch wiring</td><td>Pull-up / pull-down</td><td>Pull-up</td></tr>
                <tr><td>Relay mode</td><td>Active-high / active-low</td><td>Active-high</td></tr>
                <tr><td>Wi-Fi LED behaviour</td><td>Status (lights by connection) / silent (off)</td><td>Status</td></tr>
                <tr><td>LED wiring</td><td>Active-high / active-low</td><td>Active-high</td></tr>
                <tr><td>Setup-button wiring</td><td>Pull-up / pull-down</td><td>Pull-up</td></tr>
              </tbody>
            </table>
            <div className="callout warn">
              <span className="em">🔧</span>
              <div data-ar="">لو المفاتيح الخارجية لا تعمل صحيحًا: جرّب تغيير <b>وضع المفاتيح</b> أو <b>نوع التوصيل (رفع/خفض)</b>. ولو الريليه يعمل بشكل معكوس: غيّر <b>وضع المرحّلات</b>.</div>
              <div data-en="">If external switches don't work right: try changing the <b>switch mode</b> or the <b>wiring type (pull-up / pull-down)</b>. If a relay works inverted: flip the <b>relay mode</b>.</div>
            </div>
          </section>

          <section id="hardware">
            <h2><span className="n">8</span> <L ar="تبويب «العتاد» (متقدّم)" en="The “Hardware” tab (advanced)" /></h2>
            <p><L ar="هنا تحدّد منافذ الأزرار والمؤشّرات والمستقبِلات على البوردة:" en="Here you set the pins for buttons, indicators and receivers on the board:" /></p>
            <table data-ar="">
              <tbody>
                <tr><th>العنصر</th><th>الوظيفة</th></tr>
                <tr><td>المشروع</td><td>اسم وصفي للوحة (مثلًا «غرفة المعيشة»)</td></tr>
                <tr><td>زر الإعداد</td><td>منفذ زر الدخول لوضع الإعداد</td></tr>
                <tr><td>مؤشّر حالة الواي فاي</td><td>لمبة تبيّن حالة الاتصال</td></tr>
                <tr><td>مؤشّر الإعداد / السحابة</td><td>لمبات حالة إضافية (اختياري)</td></tr>
                <tr><td>مستقبل RF 433 ميجاهرتز</td><td>لاستقبال الريموتات والحسّاسات اللاسلكية</td></tr>
                <tr><td>مستقبل الأشعّة (IR)</td><td>لاستقبال أوامر ريموت الأشعّة</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Item</th><th>What it's for</th></tr>
                <tr><td>Project</td><td>A descriptive name for the board (e.g. “Living room”)</td></tr>
                <tr><td>Setup button</td><td>Pin for the button that enters setup mode</td></tr>
                <tr><td>Wi-Fi status LED</td><td>An LED that shows connection state</td></tr>
                <tr><td>Setup / cloud LED</td><td>Extra status LEDs (optional)</td></tr>
                <tr><td>433MHz RF receiver</td><td>For receiving remotes and wireless sensors</td></tr>
                <tr><td>Infrared (IR) receiver</td><td>For receiving IR remote commands</td></tr>
              </tbody>
            </table>
            <div className="callout tip">
              <span className="em">📡</span>
              <div data-ar="">حدّد منافذ RF أو IR فقط إذا كانت بوردتك تحتوي على هذه المستقبِلات وتريد استخدام الريموتات.</div>
              <div data-en="">Only set the RF or IR pins if your board actually has those receivers and you want to use remotes.</div>
            </div>
          </section>

          <section id="button">
            <h2><span className="n">9</span> <L ar="زر الإعداد ومؤشّرات LED" en="Setup button & LED indicators" /></h2>
            <table data-ar="">
              <tbody>
                <tr><th>الإجراء على زر الإعداد</th><th>النتيجة</th></tr>
                <tr><td>ضغطة سريعة</td><td>إعادة تشغيل الوحدة</td></tr>
                <tr><td>استمرار الضغط 3 ثوانٍ</td><td>الدخول لوضع إعداد الواي فاي (مع الحفاظ على التعريفات)</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Setup-button action</th><th>Result</th></tr>
                <tr><td>Quick press</td><td>Restart the unit</td></tr>
                <tr><td>Hold 3 seconds</td><td>Enter Wi-Fi setup mode (keeps the definitions)</td></tr>
              </tbody>
            </table>
            <div className="callout info">
              <span className="em">💡</span>
              <div data-ar="">الزر <b>لا يمسح</b> تعريفات البوردة أبدًا. لتغيير ملف التعريف يجب إعادة رفع السوفت وير على البوردة من جديد.</div>
              <div data-en="">The button <b>never erases</b> the board's definitions. To change the profile you must re-flash the board.</div>
            </div>
            <table data-ar="">
              <tbody>
                <tr><th>المؤشّر</th><th>المعنى</th></tr>
                <tr><td>مؤشّر الواي فاي — وميض</td><td>يبحث عن الشبكة</td></tr>
                <tr><td>مؤشّر الواي فاي — ثابت</td><td>متّصل</td></tr>
                <tr><td>مؤشّر الإعداد/السحابة — وميض</td><td>في وضع الإعداد</td></tr>
                <tr><td>مؤشّر الإعداد/السحابة — ثابت</td><td>متّصل بالخدمة</td></tr>
              </tbody>
            </table>
            <table data-en="">
              <tbody>
                <tr><th>Indicator</th><th>Meaning</th></tr>
                <tr><td>Wi-Fi LED — blinking</td><td>Searching for the network</td></tr>
                <tr><td>Wi-Fi LED — steady</td><td>Connected</td></tr>
                <tr><td>Setup/cloud LED — blinking</td><td>In setup mode</td></tr>
                <tr><td>Setup/cloud LED — steady</td><td>Connected to the service</td></tr>
              </tbody>
            </table>
          </section>

          <section id="save">
            <h2><span className="n">10</span> <L ar="الحفظ والقفل" en="Save & lock" /></h2>
            <div className="card" data-ar="">
              <ol className="steps">
                <li>راجع شريط الملخّص بالأعلى — يبيّن عدد القنوات وأي تعارض في المنافذ.</li>
                <li>تأكّد من عدم وجود تنبيه أحمر (منفذ مكرّر، أو RGB/ستارة ناقصة منافذ).</li>
                <li>اضغط <b>إنشاء ملف التعريف</b> بالأسفل.</li>
                <li>تُرسَل التعريفات إلى البوردة وتظهر القنوات في التطبيق فورًا. ✅</li>
              </ol>
            </div>
            <div className="card" data-en="">
              <ol className="steps">
                <li>Review the summary bar at the top — it shows the channel count and any pin conflicts.</li>
                <li>Make sure there's no red warning (a duplicate pin, or an RGB/curtain missing pins).</li>
                <li>Tap <b>Create profile</b> at the bottom.</li>
                <li>The definitions are sent to the board and the channels appear in the app instantly. ✅</li>
              </ol>
            </div>
            <div className="callout warn">
              <span className="em">🔒</span>
              <div data-ar="">يُكتب ملف التعريف <b>مرة واحدة ويُقفل</b>. لتغييره لاحقًا يجب إعادة رفع السوفت وير على البوردة (مسح وإعادة برمجة). تأكّد من صحّة الإعداد قبل الحفظ.</div>
              <div data-en="">The profile is written <b>once and locked</b>. To change it later you must re-flash the board (erase and reprogram). Make sure the setup is right before saving.</div>
            </div>
          </section>

          <section id="faq">
            <h2><span className="n">?</span> <L ar="حلّ المشكلات" en="Troubleshooting" /></h2>
            <div className="card" data-ar="">
              <h3>تنبيه «منفذ GPIO مستخدم أكثر من مرة»؟</h3>
              <p>اخترت نفس رقم المنفذ في قناتين. غيّر إحداهما إلى رقم آخر متاح حتى يختفي التنبيه الأحمر.</p>
              <h3>«القناة تحتاج منافذ R وG وB»؟</h3>
              <p>إضاءة RGB تتطلّب ثلاثة منافذ. أكمل تحديد المنافذ الثلاثة (G وB بعد المنفذ الأساسي).</p>
              <h3>«الستارة تحتاج منفذي رفع وخفض»؟</h3>
              <p>حدّد منفذ الرفع ومنفذ الخفض معًا للستارة.</p>
              <h3>«عيّن نوعًا ومنفذ GPIO لقناة واحدة على الأقل»؟</h3>
              <p>كل القنوات مضبوطة على «بلا». فعّل قناة واحدة على الأقل بنوع ومنفذ — أو استخدم قالبًا جاهزًا.</p>
              <h3>أريد تغيير الإعداد بعد الحفظ؟</h3>
              <p>ملف التعريف مقفول. يجب إعادة رفع السوفت وير على البوردة (مسح الذاكرة + برمجة من جديد) لإعادة الإعداد.</p>
            </div>
            <div className="card" data-en="">
              <h3>“GPIO pin used more than once” warning?</h3>
              <p>You picked the same pin number on two channels. Change one to another free number until the red warning clears.</p>
              <h3>“Channel needs R, G and B pins”?</h3>
              <p>RGB lighting needs three pins. Finish setting all three (G and B after the main pin).</p>
              <h3>“Curtain needs up and down pins”?</h3>
              <p>Set both the up pin and the down pin for the curtain.</p>
              <h3>“Set a type and GPIO for at least one channel”?</h3>
              <p>All channels are on “None”. Enable at least one with a type and pin — or use a ready template.</p>
              <h3>I want to change the setup after saving?</h3>
              <p>The profile is locked. You must re-flash the board (erase memory + reprogram) to set it up again.</p>
            </div>
            <div className="cta-band">
              <div>
                <b data-ar="">محتاج مساعدة أكثر؟</b>
                <b data-en="">Need more help?</b>{' '}
                <span data-ar="">تواصل مع الدعم الفني ومعك اسم/سيريال الوحدة من صفحة تفاصيل الجهاز.</span>
                <span data-en="">Contact support with the unit's name / serial from the device details page.</span>
              </div>
              <Link className="btn" href="/docs"><L ar="العودة إلى الدليل" en="Back to the guide" /></Link>
            </div>
          </section>
        </main>
      </div>

      <SlimFooter />
    </>
  );
}
