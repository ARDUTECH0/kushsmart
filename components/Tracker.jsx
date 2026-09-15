'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ENDPOINT = 'https://smart.kushsmart.space/v';

/**
 * Counts page views for the admin console's Visits page. Nothing personal is
 * sent: the page, whether this is the browser's first page today and the first
 * page of a visit, the screen size class, and — on that first page only — the
 * origin of the referring site and the utm_source / fbclid of the link.
 */
export default function Tracker() {
  const path = usePathname();

  useEffect(() => {
    if (!path || /^\/(admin|panel)(\/|$)/.test(path)) return;
    const w = window.innerWidth;
    const b = { p: path, w: w < 768 ? 'm' : w < 1100 ? 't' : 'd' };

    let newVisit = false;
    try {
      if (!sessionStorage.getItem('kv_s')) { newVisit = true; sessionStorage.setItem('kv_s', '1'); }
    } catch (_) {
      newVisit = !window.__kvS; window.__kvS = 1;
    }
    const today = new Date().toLocaleDateString('en-CA');
    try {
      if (localStorage.getItem('kv_day') !== today) { b.nv = 1; localStorage.setItem('kv_day', today); }
    } catch (_) {
      if (newVisit) b.nv = 1;
    }

    if (newVisit) {
      b.ns = 1;
      const q = new URLSearchParams(window.location.search);
      b.s = q.get('utm_source') || q.get('source') || '';
      if (q.has('fbclid')) b.fb = 1;
      if (q.has('gclid')) b.g = 1;
      try {
        const u = new URL(document.referrer);
        b.r = `${u.protocol}//${u.host}`;   // the site, never the page or its query
      } catch (_) { b.r = ''; }
    }

    const body = JSON.stringify(b);
    try {
      const sent = navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
      if (!sent) {
        fetch(ENDPOINT, { method: 'POST', body, keepalive: true, mode: 'no-cors', headers: { 'content-type': 'text/plain' } })
          .catch(() => {});
      }
    } catch (_) { /* counting is never worth an error */ }
  }, [path]);

  return null;
}
