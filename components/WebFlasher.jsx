'use client';

import { useEffect, useState } from 'react';
import { Upload } from './Icons';
import L from './L';

// Browser flasher with a BOARD PICKER. Reads the published firmware from the
// server, lets the visitor choose which board to flash, and flashes the latest
// version of it over WebSerial (Chrome/Edge desktop, HTTPS). No files, no tools.
const FW_BASE = 'https://smart.kushsmart.space';
// [ar, en] — a board missing here falls back to its key.
const LABELS = {
  smarthome: ['المنزل الذكي (ESP32)', 'Smart home (ESP32)'],
  esp32: ['مفاتيح وإضاءة — ESP32', 'Switches & lighting — ESP32'],
  esp8266: ['مفاتيح وإضاءة — ESP8266', 'Switches & lighting — ESP8266'],
  lock: ['القفل الذكي', 'Smart lock'],
  power: ['عدّاد الطاقة', 'Power meter'],
  halo: ['ATGENX HALO (تكييف + RF + IR)', 'ATGENX HALO (AC + RF + IR)'],
  ir: ['ريموت IR', 'IR remote'],
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

  if (boards === null) {
    return <p className="shot-cap"><L ar="جارٍ تحميل النسخ المتاحة…" en="Loading the available versions…" /></p>;
  }
  if (!boards.length) {
    return (
      <div className="callout warn" style={{ marginTop: 0 }}>
        <L tag="div" ar="لا توجد نسخة منشورة بعد. يرفعها فريق كوش سمارت قريبًا."
          en="Nothing is published yet. The KUSH SMART team will publish it soon." />
      </div>
    );
  }

  const meta = boards.find(([k]) => k === pick)?.[1];

  return (
    <div className="flasher">
      <L tag="div" className="fl-label" ar="اختر البوردة التي تريد رفع السوفت وير عليها:" en="Choose the board you want to flash:" />
      <div className="fl-boards" role="group">
        {boards.map(([k, m]) => {
          const [ar, en] = LABELS[k] || [k, k];
          return (
            <button key={k} type="button" className={`fl-board ${pick === k ? 'active' : ''}`}
              aria-pressed={pick === k} onClick={() => setPick(k)}>
              <b><L ar={ar} en={en} /></b>
              <small><L ar={`النسخة ${m.version}`} en={`Version ${m.version}`} /></small>
            </button>
          );
        })}
      </div>
      {meta && (
        // key forces a fresh install button whenever the board changes.
        <esp-web-install-button manifest={meta.manifestUrl} key={pick}>
          <button className="btn lg" slot="activate" disabled={!ready}>
            <Upload />
            {ready
              ? <L ar="ارفع السوفت وير الآن" en="Flash now" />
              : <L ar="جارٍ التحميل…" en="Loading…" />}
          </button>
          <span slot="unsupported">
            <L ar="متصفّحك لا يدعم الرفع المباشر. افتح الموقع على كمبيوتر بـ Chrome أو Edge."
              en="Your browser can’t flash directly. Open this page on a computer in Chrome or Edge." />
          </span>
          <span slot="not-allowed">
            <L ar="يجب فتح الصفحة عبر HTTPS لتفعيل الرفع المباشر." en="The page must be opened over HTTPS to flash directly." />
          </span>
        </esp-web-install-button>
      )}
    </div>
  );
}
