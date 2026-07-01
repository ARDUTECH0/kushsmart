'use client';

import { useEffect, useState } from 'react';

/**
 * Browser-based ESP32 flasher using ESP Web Tools (WebSerial).
 * The user connects the board over USB and flashes directly from the website —
 * no esptool, no Arduino, no source code. Works in Chrome/Edge desktop over HTTPS.
 */
export default function EspWebFlasher({ manifest }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = 'esp-web-tools-script';
    if (document.getElementById(id)) {
      setReady(true);
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.type = 'module';
    s.src =
      'https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module';
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);

  return (
    <div className="flasher">
      {/* esp-web-install-button is a web component registered by the script above */}
      <esp-web-install-button manifest={manifest}>
        <button className="btn lg" slot="activate" disabled={!ready}>
          ⚡ {ready ? 'ارفع السوفت وير الآن' : 'جارٍ التحميل…'}
        </button>
        <span slot="unsupported">
          متصفّحك لا يدعم الرفع المباشر. افتح الموقع على <b>كمبيوتر</b> باستخدام{' '}
          <b>Google Chrome</b> أو <b>Microsoft Edge</b>.
        </span>
        <span slot="not-allowed">
          يجب فتح الصفحة عبر <b>HTTPS</b> لتفعيل الرفع المباشر.
        </span>
      </esp-web-install-button>
    </div>
  );
}
