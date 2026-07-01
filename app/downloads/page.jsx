import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { asset } from '@/lib/site';
import { Android, Apple, Download, Cpu, Bell } from '@/components/Icons';
import EspWebFlasher from '@/components/EspWebFlasher';

export const metadata = {
  title: 'التحميل ورفع السوفت وير | كوش سمارت — KUSH SMART',
  description:
    'حمّل تطبيق كوش سمارت لأندرويد وآيفون، وارفع السوفت وير على بوردة ESP32 مباشرةً من المتصفح بضغطة واحدة — أو يدويًا عبر esptool. شرح احترافي خطوة بخطوة بالعربي.',
};

const NAV = [
  { href: '/#features', label: 'المميزات' },
  { href: '/#how', label: 'كيف يعمل' },
  { href: '/docs', label: 'الدليل' },
  { href: '/downloads', label: 'التحميل', active: true, btn: true },
];

// App release — edit the version + links, drop the APK at public/downloads/.
const APP = { version: 'v1.0.5', apk: '/downloads/kushsmart.apk', play: '#', appstore: '#' };

// The four ESP32 flash files + their addresses (Arduino/ESP-IDF layout).
const FW_DIR = '/firmware/esp32';
const FW_FILES = [
  { file: 'atsmart_smarthome.ino.bootloader.bin', offset: '0x1000', desc: 'البوت لودر (Bootloader)' },
  { file: 'atsmart_smarthome.ino.partitions.bin', offset: '0x8000', desc: 'جدول الأقسام (Partitions)' },
  { file: 'boot_app0.bin', offset: '0xe000', desc: 'مُحدِّد الإقلاع (OTA boot)' },
  { file: 'atsmart_smarthome.ino.bin', offset: '0x10000', desc: 'البرنامج الرئيسي (Application)' },
];

const ESPTOOL_CMD =
  'esptool --chip esp32 --port COM3 --baud 921600 write_flash ' +
  '0x1000 atsmart_smarthome.ino.bootloader.bin ' +
  '0x8000 atsmart_smarthome.ino.partitions.bin ' +
  '0xe000 boot_app0.bin ' +
  '0x10000 atsmart_smarthome.ino.bin';

export default function DownloadsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      {/* HERO = app download */}
      <header className="page-head">
        <div className="wrap dlhero">
          <div>
            <span className="eyebrow">التحميل</span>
            <h1>حمّل تطبيق <span className="accent">كوش سمارت</span></h1>
            <p>تحكّم في منزلك من هاتفك. سجّل ببريدك الإلكتروني وابدأ خلال دقائق — متاح لأندرويد وآيفون.</p>
            <div className="store-row">
              <a className="btn lg" href={asset(APP.apk)} download><Android /> تحميل APK</a>
              <a className="btn ghost lg" href={APP.play}><Android /> Google Play</a>
              <a className="btn ghost lg" href={APP.appstore}><Apple /> App Store</a>
            </div>
            <div className="meta-note">
              <span><Download /> الإصدار {APP.version}</span>
              <span><Bell /> تحديثات مستمرّة</span>
              <span>أندرويد و iOS</span>
            </div>
          </div>
          <div className="dlhero-art">
            <div className="dl-glass"><img src={asset('/assets/icon.png')} alt="KUSH SMART" /></div>
          </div>
        </div>
      </header>

      {/* WEB FLASHER — primary path */}
      <section className="section">
        <div className="wrap" style={{ maxWidth: '900px' }}>
          <div className="h-center" style={{ marginBottom: '30px' }}>
            <span className="eyebrow">رفع السوفت وير</span>
            <h2>ارفع السوفت وير على البوردة من المتصفح</h2>
            <p>وصّل بوردة <b>ESP32</b> بالكمبيوتر عبر USB وارفع السوفت وير مباشرةً — بدون تثبيت أي برنامج، وبدون أي أكواد.</p>
          </div>

          <div className="card">
            <div className="callout tip" style={{ marginTop: 0 }}>
              <span className="em">✅</span>
              <div><b>أسهل طريقة:</b> بضغطة واحدة من المتصفح. لا تحتاج إلى esptool ولا Arduino ولا أي خبرة تقنية.</div>
            </div>

            <h3>الخطوات</h3>
            <ol className="steps">
              <li>وصّل بوردة <b>ESP32</b> بالكمبيوتر بكابل <b>USB</b> (تأكّد أنه كابل بيانات وليس شحن فقط).</li>
              <li>اضغط زر <b>«ارفع السوفت وير الآن»</b> بالأسفل.</li>
              <li>ستظهر نافذة لاختيار <b>منفذ البوردة (Serial Port)</b> — اخترها ثم اضغط <b>Connect</b>.</li>
              <li>اضغط <b>Install</b> وأكّد، ثم انتظر اكتمال الرفع. <b>لا تفصل الكابل أثناء العملية.</b></li>
              <li>بعد الانتهاء، أعِد تشغيل البوردة، ثم افتح التطبيق و<b>أضِف الجهاز</b> ووصّله بالواي فاي.</li>
            </ol>

            <div style={{ textAlign: 'center', margin: '22px 0 8px' }}>
              <EspWebFlasher manifest={asset(`${FW_DIR}/manifest.json`)} />
            </div>

            <div className="callout info">
              <span className="em">🌐</span>
              <div>الرفع المباشر يعمل على <b>Google Chrome</b> أو <b>Microsoft Edge</b> على <b>كمبيوتر</b> (ويندوز / ماك / لينكس). لا يعمل من الهاتف، ويتطلّب اتصالًا آمنًا (HTTPS).</div>
            </div>
            <div className="callout warn">
              <span className="em">🔌</span>
              <div>لو لم يظهر منفذ البوردة، فقد تحتاج إلى تثبيت <b>تعريف USB</b> الخاص بالشريحة (CP2102 أو CH340) على الكمبيوتر، ثم أعد المحاولة.</div>
            </div>
          </div>
        </div>
      </section>

      {/* MANUAL — esptool for advanced users */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', paddingTop: '60px' }}>
        <div className="wrap" style={{ maxWidth: '860px' }}>
          <div className="h-center" style={{ marginBottom: '24px' }}>
            <span className="eyebrow">للمتقدّمين</span>
            <h2>الرفع اليدوي عبر esptool</h2>
            <p>إن كنت تفضّل أداة esptool، حمّل الملفات الأربعة وارفعها على العناوين الموضّحة.</p>
          </div>

          {/* The four files */}
          <div className="fw-grid">
            {FW_FILES.map((f) => (
              <div className="fw" key={f.file}>
                <span className="ic"><Cpu /></span>
                <div className="info">
                  <h3>{f.desc}</h3>
                  <p><span className="chip">{f.offset}</span><code>{f.file}</code></p>
                </div>
                <a className="dlbtn" href={asset(`${FW_DIR}/${f.file}`)} download>
                  <Download /> تحميل
                </a>
              </div>
            ))}
          </div>

          {/* Address table */}
          <h3 style={{ marginTop: '28px' }}>عناوين الرفع (Flash offsets)</h3>
          <table>
            <tbody>
              <tr><th>العنوان</th><th>الملف</th><th>الوظيفة</th></tr>
              {FW_FILES.map((f) => (
                <tr key={f.file}>
                  <td><code>{f.offset}</code></td>
                  <td><code>{f.file}</code></td>
                  <td>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Command */}
          <h3 style={{ marginTop: '28px' }}>الأمر الكامل</h3>
          <div className="card">
            <ol className="steps">
              <li>ثبّت الأداة: <code>pip install esptool</code></li>
              <li>وصّل البوردة وحدّد منفذها (مثل <code>COM3</code> على ويندوز أو <code>/dev/ttyUSB0</code> على لينكس).</li>
              <li>نفّذ الأمر التالي بعد تعديل المنفذ:</li>
            </ol>
            <pre style={{ overflowX: 'auto', background: 'var(--bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', direction: 'ltr', textAlign: 'left' }}>
              <code>{ESPTOOL_CMD}</code>
            </pre>
          </div>

          <div className="callout warn">
            <span className="em">⚠️</span>
            <div>هذه الملفات مخصّصة لشريحة <b>ESP32</b>. تأكّد من اختيار البوردة الصحيحة والعناوين الصحيحة قبل الرفع. عند أول تشغيل تكون الوحدة «غير مُعدّة» حتى تُكمل الإعداد من التطبيق.</div>
          </div>

          <div className="callout info">
            <span className="em"><Cpu /></span>
            <div>بعد الرفع، راجع <Link href="/docs/configuration">دليل إعداد البوردة</Link> لتعريف القنوات، و<Link href="/docs#add">الدليل</Link> لإضافة الجهاز للتطبيق.</div>
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
