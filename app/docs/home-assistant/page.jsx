import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import HaLogo from '@/components/HaLogo';
import L from '@/components/L';
import CopyBox from '@/components/CopyBox';

export const metadata = {
  title: 'KUSH SMART × Home Assistant',
  description:
    'Connect your KUSH SMART home to Home Assistant. Local and cloud control at the same time, and every device appears automatically — switches, lights, curtains, sensors and locks.',
};

// One-shot install of the custom integration, for setups without HACS.
// Extracts to /tmp first (portable across the busybox tar in the SSH add-on),
// removes any previous copy, then moves the folder into place and cleans up.
const INSTALL_CMD = `cd /tmp && rm -rf ha-atsmart-main && \\
curl -sL https://github.com/ARDUTECH0/ha-atsmart/archive/refs/heads/main.tar.gz | tar xz && \\
rm -rf /config/custom_components/atsmart && \\
mkdir -p /config/custom_components && \\
mv ha-atsmart-main/custom_components/atsmart /config/custom_components/ && \\
rm -rf ha-atsmart-main && \\
echo "✅ Installed — now restart Home Assistant"`;

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

        {/* STEPS — the no-install path leads, because it needs nothing installed */}
        <section id="steps">
          <div className="ha-h">
            <span className="eyebrow"><L ar="بدون تثبيت" en="No install" /></span>
            <L tag="h2" ar="الطريقة الأسهل — في ٣ خطوات" en="The easiest way — in three steps" />
            <L tag="p" ar="‏Home Assistant فيه تكامل MQTT جاهز من الأساس. مش محتاج تنزّل أي إضافة ولا تعيد التشغيل." en="Home Assistant already includes MQTT. Nothing to download, nothing to restart." />
          </div>
          <div className="ha-steps">
            <div className="ha-step">
              <span className="ha-step-n">1</span>
              <L tag="h3" ar="افتح بيانات الاتصال" en="Open your settings" />
              <L tag="p" ar="في التطبيق: الملف الشخصي ← «ربط Home Assistant» ← «ربط بدون تثبيت». هتلاقي السيرفر واسم المستخدم وكلمة المرور، مع زر نسخ ورمز QR." en="In the app: Profile → “Link Home Assistant” → “Connect — no install”. You’ll find the broker, username and password, with a copy button and a QR code." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">2</span>
              <L tag="h3" ar="أضِف MQTT" en="Add MQTT" />
              <L tag="p" ar="في Home Assistant: الإعدادات ← الأجهزة والخدمات ← «إضافة تكامل» ← اختر MQTT، والصق البيانات." en="In Home Assistant: Settings → Devices & services → “Add integration” → pick MQTT, then paste the settings." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">3</span>
              <L tag="h3" ar="تظهر تلقائيًا" en="They appear on their own" />
              <L tag="p" ar="فعّل الاكتشاف واضبط «discovery prefix» بالقيمة الموجودة في التطبيق — وكل أجهزتك تظهر في Home Assistant من تلقاء نفسها." en="Enable discovery and set the “discovery prefix” to the value shown in the app — every device then shows up in Home Assistant by itself." />
            </div>
          </div>

          {/* one-click: opens HA's built-in MQTT setup directly */}
          <div className="ha-install">
            <div className="ha-install-txt">
              <span className="ha-install-ic">⚡</span>
              <div>
                <b><L ar="افتح إعداد MQTT بضغطة واحدة" en="Open MQTT setup in one click" /></b>
                <L tag="p" ar="يفتح معالج إضافة MQTT داخل Home Assistant بتاعك مباشرةً — انسخ البيانات من التطبيق والصقها." en="Opens the Add-MQTT wizard right inside your Home Assistant — copy the settings from the app and paste them." />
              </div>
            </div>
            <a
              className="btn lg"
              href="https://my.home-assistant.io/redirect/config_flow_start/?domain=mqtt"
              target="_blank"
              rel="noreferrer"
            >
              <L ar="افتح إعداد MQTT" en="Open MQTT setup" />
            </a>
            <span className="ha-install-alt">
              <L ar="مش محتاج HACS ولا أي تثبيت." en="No HACS, nothing to install." />
            </span>
          </div>

          {/* What each MQTT field means. Never print a real password here — it is
              per-account and only ever shown inside the app. */}
          <div className="ha-h" style={{ marginTop: '3rem' }}>
            <L tag="h3" ar="البيانات اللي هتلصقها" en="The settings you’ll paste" />
            <L tag="p" ar="كل البيانات دي تلاقيها في التطبيق: الملف الشخصي ← «ربط Home Assistant» ← «ربط بدون تثبيت»، مع زر نسخ ورمز QR." en="You’ll find all of these in the app: Profile → “Link Home Assistant” → “Connect — no install”, with a copy button and a QR code." />
          </div>
          <div className="ha-cfg">
            <div className="ha-cfg-row">
              <b><L ar="السيرفر (Broker)" en="Broker" /></b>
              <span><code>smart.kushsmart.space</code></span>
            </div>
            <div className="ha-cfg-row">
              <b><L ar="المنفذ (Port)" en="Port" /></b>
              <span><code>1883</code></span>
            </div>
            <div className="ha-cfg-row">
              <b><L ar="اسم المستخدم" en="Username" /></b>
              <span><L ar="معرّف حسابك — يظهر في التطبيق." en="Your account id — shown in the app." /></span>
            </div>
            <div className="ha-cfg-row">
              <b><L ar="كلمة المرور" en="Password" /></b>
              <span><L ar="خاصة بحسابك وتظهر في التطبيق فقط. ما تشاركهاش مع حد." en="Tied to your account and shown only inside the app. Never share it." /></span>
            </div>
            <div className="ha-cfg-row">
              <b><L ar="بادئة الاكتشاف (discovery prefix)" en="Discovery prefix" /></b>
              <span>
                <code>&lt;account-id&gt;/homeassistant</code>{' '}
                <L ar="— مهمة: من غيرها مش هتظهر الأجهزة. تلاقيها جاهزة للنسخ في التطبيق." en="— important: without it the devices won’t appear. The app shows it ready to copy." />
              </span>
            </div>
          </div>

          {/* Advanced — the custom integration, for instant local / offline control */}
          <div className="ha-h" style={{ marginTop: '3.5rem' }}>
            <span className="eyebrow"><L ar="للمستخدم المتقدّم" en="Advanced" /></span>
            <L tag="h2" ar="تكامل كوش سمارت" en="The KUSH SMART integration" />
            <L tag="p" ar="يضيف تحكّمًا محليًا فوريًا يعمل حتى لو انقطع الإنترنت. يتطلّب تثبيت HACS مرة واحدة." en="Adds instant local control that keeps working even if the internet drops. Needs HACS installed once." />
          </div>
          <div className="ha-steps">
            <div className="ha-step">
              <span className="ha-step-n">1</span>
              <L tag="h3" ar="أضِف كوش سمارت" en="Add KUSH SMART" />
              <L tag="p" ar="من داخل Home Assistant، أضِف تكامل «كوش سمارت» واختر «الربط عن طريق التطبيق»." en="In Home Assistant, add the “KUSH SMART” integration and choose “Link with the app”." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">2</span>
              <L tag="h3" ar="امسح الرمز" en="Scan the code" />
              <L tag="p" ar="يظهر رمز QR وكود قصير. افتح التطبيق ← الملف الشخصي ← «ربط Home Assistant»، وامسح الرمز أو اكتب الكود." en="A QR and short code appear. Open the app → Profile → “Link Home Assistant”, then scan the QR or type the code." />
            </div>
            <div className="ha-step">
              <span className="ha-step-n">3</span>
              <L tag="h3" ar="يربط تلقائيًا" en="Links itself" />
              <L tag="p" ar="يتأكّد الربط تلقائيًا وتظهر كل أجهزتك جاهزة للتحكّم — بدون كتابة أي كلمة سر في Home Assistant." en="It confirms on its own and all your devices appear, ready to control — with no password typed into Home Assistant." />
            </div>
          </div>

          {/* one-click install */}
          <div className="ha-install">
            <div className="ha-install-txt">
              <span className="ha-install-ic">⚡</span>
              <div>
                <b><L ar="تثبيت التكامل بضغطة واحدة" en="Install the integration in one click" /></b>
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
              <L ar="بعد التثبيت، ابدأ الإعداد من هنا:" en="After installing, start the setup here:" />{' '}
              <a
                href="https://my.home-assistant.io/redirect/config_flow_start/?domain=atsmart"
                target="_blank"
                rel="noreferrer"
              >
                <L ar="إضافة كوش سمارت" en="Add KUSH SMART" />
              </a>
              {' · '}
              <L ar="أو أضِفه يدويًا بنسخ هذا العنوان:" en="Or add it manually by copying this address:" />{' '}
              <code>ARDUTECH0/ha-atsmart</code>
            </span>
          </div>

          {/* Third path — one command over SSH, for installs without HACS */}
          <div className="ha-h" style={{ marginTop: '3rem' }}>
            <span className="eyebrow"><L ar="بدون HACS" en="Without HACS" /></span>
            <L tag="h3" ar="التثبيت بأمر واحد (SSH / Terminal)" en="Install with one command (SSH / Terminal)" />
            <L tag="p" ar="افتح الترمنال بتاع Home Assistant (إضافة «Terminal & SSH») والصق الأمر ده. بينزّل التكامل ويحطّه في مكانه ويشيل أي نسخة قديمة." en="Open your Home Assistant terminal (the “Terminal & SSH” add-on) and paste this. It downloads the integration, puts it in place and removes any older copy." />
          </div>
          <CopyBox code={INSTALL_CMD} />
          <div className="ha-cfg">
            <div className="ha-cfg-row">
              <b><L ar="بعد الأمر" en="After the command" /></b>
              <span><L ar="أعِد تشغيل Home Assistant، وبعدين أضِف تكامل «كوش سمارت» واربطه من التطبيق." en="Restart Home Assistant, then add the “KUSH SMART” integration and link it from the app." /></span>
            </div>
            <div className="ha-cfg-row">
              <b><L ar="مجلد الإعدادات" en="Config folder" /></b>
              <span>
                <L ar="الأمر بيستخدم" en="The command uses" /> <code>/config</code>{' '}
                <L ar="— وده صحيح لـ Home Assistant OS و Supervised و Container. لو مثبّت Core داخل بيئة افتراضية، غيّرها لـ" en="— correct for Home Assistant OS, Supervised and Container. If you run Core in a virtualenv, change it to" />{' '}
                <code>~/.homeassistant</code>
              </span>
            </div>
            <div className="ha-cfg-row">
              <b><L ar="تثبيت يدوي بالكامل" en="Fully manual" /></b>
              <span>
                <L ar="أو نزّل الريبو من" en="Or download the repository from" />{' '}
                <a href="https://github.com/ARDUTECH0/ha-atsmart" target="_blank" rel="noreferrer">github.com/ARDUTECH0/ha-atsmart</a>{' '}
                <L ar="وانسخ المجلد" en="and copy the folder" /> <code>custom_components/atsmart</code>{' '}
                <L ar="جوّه مجلد الإعدادات." en="into your config folder." />
              </span>
            </div>
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
