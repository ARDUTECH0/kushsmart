'use client';

import { useEffect, useState } from 'react';

// Browser flasher with a BOARD PICKER. Reads the published firmware from the
// server, lets the visitor choose which board to flash, and flashes the latest
// version of it over WebSerial (Chrome/Edge desktop, HTTPS). No files, no tools.
const FW_BASE = 'https://smart.kushsmart.space';
const LABELS = {
  smarthome: 'المنزل الذكي (ESP32)',
  esp32: 'مفاتيح وإضاءة — ESP32',
  esp8266: 'مفاتيح وإضاءة — ESP8266',
  lock: 'القفل الذكي',
  power: 'عدّاد الطاقة',
};

export default function WebFlasher() {
  const [boards, setBoards] = useState(null); // null=loading, []=none
  const [pick, setPick] = useState('');
  const [ready, setReady] = useState(false);

  // Load the esp-web-tools web component once.
  useEffect(() => {
    const id = 'esp-web-tools-script';
    if (document.getElementById(id)) { setReady(true); return; }
    const s = document.createElement('script');
    s.id = id; s.type = 'module';
    s.src = 'https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module';
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);

  // Which boards have a complete, published firmware.
  useEffect(() => {
    let alive = true;
    fetch(`${FW_BASE}/firmware/index.json`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const b = Object.entries(j.boards || {}).filter(([, m]) => m.complete);
        setBoards(b);
        if (b.length) setPick((p) => p || b[0][0]);
      })
      .catch(() => alive && setBoards([]));
    return () => { alive = false; };
  }, []);

  if (boards === null) return <p className="shot-cap">جارٍ تحميل النسخ المتاحة…</p>;
  if (!boards.length) {
    return (
      <div className="callout warn" style={{ marginTop: 0 }}>
        <span className="em">⚠️</span>
        <div>لا توجد نسخة منشورة بعد. يرفعها فريق كوش سمارت من لوحة التحكّم قريبًا.</div>
      </div>
    );
  }

  const meta = boards.find(([k]) => k === pick)?.[1];

  return (
    <div className="flasher">
      <div className="fl-label">اختر البوردة التي تريد رفع السوفت وير عليها:</div>
      <div className="fl-boards">
        {boards.map(([k, m]) => (
          <button key={k} className={`fl-board ${pick === k ? 'active' : ''}`} onClick={() => setPick(k)}>
            <b>{LABELS[k] || k}</b>
            <small>النسخة {m.version}</small>
          </button>
        ))}
      </div>
      {meta && (
        // key forces a fresh install button whenever the board changes.
        <esp-web-install-button manifest={meta.manifestUrl} key={pick}>
          <button className="btn lg" slot="activate" disabled={!ready}>
            ⚡ {ready ? 'ارفع السوفت وير الآن' : 'جارٍ التحميل…'}
          </button>
          <span slot="unsupported">
            متصفّحك لا يدعم الرفع المباشر. افتح الموقع على <b>كمبيوتر</b> بـ <b>Chrome</b> أو <b>Edge</b>.
          </span>
          <span slot="not-allowed">يجب فتح الصفحة عبر <b>HTTPS</b> لتفعيل الرفع المباشر.</span>
        </esp-web-install-button>
      )}
    </div>
  );
}
