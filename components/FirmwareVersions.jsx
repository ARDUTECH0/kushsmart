'use client';

import { useEffect, useState } from 'react';

// Shows the latest firmware version published for each board — read live from the
// server (uploaded by the admin console). Purely informational for visitors.
const FW_BASE = 'https://smart.kushsmart.space';
const LABELS = {
  smarthome: 'المنزل الذكي (ESP32)',
  esp32: 'مفاتيح وإضاءة — ESP32',
  esp8266: 'مفاتيح وإضاءة — ESP8266',
  lock: 'القفل الذكي',
  power: 'عدّاد الطاقة',
};

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
    return <p className="shot-cap">جارٍ تحميل أحدث الإصدارات…</p>;
  }
  const keys = Object.keys(boards);
  if (!keys.length) {
    return <p className="shot-cap">لا توجد إصدارات منشورة بعد.</p>;
  }
  // Newest upload first.
  keys.sort((a, b) => (boards[b].updatedAt || 0) - (boards[a].updatedAt || 0));

  return (
    <div className="fw-vers">
      {keys.map((k) => {
        const m = boards[k];
        const date = m.updatedAt
          ? new Date(m.updatedAt).toLocaleDateString('ar-EG', {
              year: 'numeric', month: 'long', day: 'numeric',
            })
          : '';
        return (
          <div className="fw-ver" key={k}>
            <div>
              <b>{LABELS[k] || k}</b>
              <span className="fw-ver-date">{date && `آخر تحديث: ${date}`}</span>
            </div>
            <span className="fw-ver-badge">النسخة {m.version}</span>
          </div>
        );
      })}
    </div>
  );
}
