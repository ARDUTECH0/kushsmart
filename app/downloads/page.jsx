import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import { asset } from '@/lib/site';
import { Android, Apple, Download, Cpu, Bulb, Lock, Bolt, Bell } from '@/components/Icons';

export const metadata = {
  title: 'التحميل | كوش سمارت — KUSH SMART',
  description:
    'حمّل تطبيق كوش سمارت لأندرويد وآيفون، وملفات الفيرموير (binary) لبوردات ESP32 و ESP8266 والقفل الذكي وعدّاد الطاقة.',
};

const NAV = [
  { href: '/#features', label: 'المميزات' },
  { href: '/#how', label: 'إزاي بيشتغل' },
  { href: '/docs', label: 'الدليل' },
  { href: '/downloads', label: 'التحميل', active: true, btn: true },
];

// App release — edit the version + links, drop the APK at public/downloads/.
const APP = { version: 'v1.0.5', apk: '/downloads/kushsmart.apk', play: '#', appstore: '#' };

// Firmware binaries — drop each .bin into public/downloads/ and it goes live.
const FIRMWARE = [
  { Ic: Bulb, name: 'مفاتيح وإضاءة — ESP32', chip: 'ESP32', desc: 'بوردات الريليه والمفاتيح والدِمر.', file: 'atsmart_esp32.bin' },
  { Ic: Bulb, name: 'مفاتيح وإضاءة — ESP8266', chip: 'ESP8266', desc: 'بوردات الريليه والمفاتيح (NodeMCU / Wemos).', file: 'atsmart_esp8266.bin' },
  { Ic: Lock, name: 'القفل الذكي', chip: 'ESP32', desc: 'RFID / بصمة / كود / تحكّم من التطبيق.', file: 'kushsmart_lock.bin' },
  { Ic: Bolt, name: 'عدّاد الطاقة', chip: 'ESP32', desc: 'قياس الكهرباء (PZEM-004T) حتى 10 عدّادات.', file: 'kushsmart_power.bin' },
];

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
            <p>تحكّم في بيتك من موبايلك. سجّل بإيميلك وابدأ في دقائق — متاح لأندرويد وآيفون.</p>
            <div className="store-row">
              <a className="btn lg" href={asset(APP.apk)} download><Android /> تحميل APK</a>
              <a className="btn ghost lg" href={APP.play}><Android /> Google Play</a>
              <a className="btn ghost lg" href={APP.appstore}><Apple /> App Store</a>
            </div>
            <div className="meta-note">
              <span><Download /> الإصدار {APP.version}</span>
              <span><Bell /> تحديثات مستمرة</span>
              <span>أندرويد و iOS</span>
            </div>
          </div>
          <div className="dlhero-art">
            <div className="dl-glass"><img src={asset('/assets/icon.png')} alt="KUSH SMART" /></div>
          </div>
        </div>
      </header>

      {/* FIRMWARE */}
      <section className="section">
        <div className="wrap">
          <div className="h-center" style={{ marginBottom: '30px' }}>
            <span className="eyebrow">الفيرموير</span>
            <h2>ملفات السوفت وير (Binary)</h2>
            <p>اختار البورد بتاعك وحمّل ملف الـ .bin الخاص بيه.</p>
          </div>

          <div className="fw-grid">
            {FIRMWARE.map((f) => (
              <div className="fw" key={f.file}>
                <span className="ic"><f.Ic /></span>
                <div className="info">
                  <h3>{f.name}</h3>
                  <p><span className="chip">{f.chip}</span>{f.desc}</p>
                </div>
                <a className="dlbtn" href={asset(`/downloads/${f.file}`)} download>
                  <Download /> تحميل
                </a>
              </div>
            ))}
          </div>

          <div className="callout info" style={{ marginTop: '28px' }}>
            <span className="em"><Cpu /></span>
            <div>
              ارفع ملف الـ <code>.bin</code> على البورد بأداة <b>esptool</b> أو من <b>Arduino IDE</b>،
              وبعدها وصّل الوحدة بالواي فاي من التطبيق. التفاصيل في <Link href="/docs#add">الدليل</Link>.
            </div>
          </div>
        </div>
      </section>

      <SlimFooter />
    </>
  );
}
