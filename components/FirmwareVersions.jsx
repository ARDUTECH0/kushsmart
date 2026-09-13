'use client';

import { useEffect, useState } from 'react';
import L from './L';

// Shows the latest firmware version published for each board — read live from the
// server (uploaded by the admin console). Purely informational for visitors.
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

const dateIn = (ms, locale) => new Date(ms).toLocaleDateString(locale, {
  year: 'numeric', month: 'long', day: 'numeric',
});

export default function FirmwareVersions() {
  const [boards, setBoards] = useState(null); // null = loading, {} = none

  useEffect(() => {
    let alive = true;
    fetch(`${FW_BASE}/firmware/index.json`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (alive) setBoards(j.boards || {}); })
      .catch(() => { if (alive) setBoards({}); });
    return () => { alive = false; };
  }, []);

  if (boards === null) {
    return <p className="shot-cap"><L ar="جارٍ تحميل أحدث الإصدارات…" en="Loading the latest releases…" /></p>;
  }
  const keys = Object.keys(boards);
  if (!keys.length) {
    return <p className="shot-cap"><L ar="لا توجد إصدارات منشورة بعد." en="Nothing has been published yet." /></p>;
  }
  // Newest upload first.
  keys.sort((a, b) => (boards[b].updatedAt || 0) - (boards[a].updatedAt || 0));

  return (
    <div className="fw-vers">
      {keys.map((k) => {
        const m = boards[k];
        const [ar, en] = LABELS[k] || [k, k];
        const version = m.version && m.version !== '—' ? m.version : null;
        return (
          <div className="fw-ver" key={k}>
            <div>
              <b><L ar={ar} en={en} /></b>
              {m.updatedAt ? (
                <span className="fw-ver-date">
                  <L ar={`آخر تحديث: ${dateIn(m.updatedAt, 'ar-EG-u-nu-latn')}`}
                    en={`Updated ${dateIn(m.updatedAt, 'en-GB')}`} />
                </span>
              ) : null}
            </div>
            {version
              ? <span className="fw-ver-badge"><L ar={`النسخة ${version}`} en={`Version ${version}`} /></span>
              : <span className="fw-ver-badge none"><L ar="لم تُنشر بعد" en="Not published yet" /></span>}
          </div>
        );
      })}
    </div>
  );
}
