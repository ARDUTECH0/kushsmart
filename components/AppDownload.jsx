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
//
// A store without a real listing yet ('#') is shown as "coming soon" rather
// than as a button that goes nowhere.
function Store({ href, Icon, name }) {
  if (!href || href === '#') {
    return (
      <span className="btn ghost lg" aria-disabled="true">
        <Icon /> {name} <span className="soon"><L ar="قريبًا" en="Soon" /></span>
      </span>
    );
  }
  return <a className="btn ghost lg" href={href}><Icon /> {name}</a>;
}

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
        <Store href={fallback.play} Icon={Android} name="Google Play" />
        <Store href={fallback.appstore} Icon={Apple} name="App Store" />
      </div>
      <div className="meta-note">
        <span><Download /> <L ar={`الإصدار ${rel.version}`} en={`Version ${rel.version}`} /></span>
        <span><Bell /> <L ar="تحديثات مستمرّة" en="Regular updates" /></span>
      </div>
    </>
  );
}
