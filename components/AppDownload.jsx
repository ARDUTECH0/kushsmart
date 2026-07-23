'use client';

import { useEffect, useState } from 'react';
import { Android, Apple, Download, Bell } from '@/components/Icons';
import L from '@/components/L';

const BRIDGE = 'https://smart.kushsmart.space';

// The download button + version badge.
//
// The published release lives on the bridge (the admin console sets it), so a
// new APK goes live without rebuilding this site. `fallback` is baked into the
// static HTML, so the link works before the fetch resolves — and still works if
// the bridge is unreachable.
export default function AppDownload({ fallback }) {
  const [rel, setRel] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BRIDGE}/app/release`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j || !j.version || !j.apk) return;
        setRel((cur) => ({ ...cur, version: j.version, apk: j.apk }));
      })
      .catch(() => { /* keep the baked-in fallback */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="store-row">
        <a className="btn lg" href={rel.apk} download="KUSH SMART.apk">
          <Android /> <L ar="تحميل APK" en="Download APK" />
        </a>
        <a className="btn ghost lg" href={fallback.play}><Android /> Google Play</a>
        <a className="btn ghost lg" href={fallback.appstore}><Apple /> App Store</a>
      </div>
      <div className="meta-note">
        <span><Download /> <L ar={`الإصدار ${rel.version}`} en={`Version ${rel.version}`} /></span>
        <span><Bell /> <L ar="تحديثات مستمرّة" en="Regular updates" /></span>
        <span><L ar="أندرويد و iOS" en="Android & iOS" /></span>
      </div>
    </>
  );
}
