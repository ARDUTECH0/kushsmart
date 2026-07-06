'use client';

import { useEffect, useState } from 'react';

// Flips the whole site between Arabic (RTL) and English (LTR). Sets the <html>
// lang/dir and saves the choice; CSS + the pre-paint script in layout do the
// rest. Shows the language you'd switch TO.
export default function LangToggle() {
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    setLang(document.documentElement.lang === 'en' ? 'en' : 'ar');
  }, []);

  function toggle() {
    const next = document.documentElement.lang === 'en' ? 'ar' : 'en';
    const d = document.documentElement;
    d.lang = next;
    d.dir = next === 'en' ? 'ltr' : 'rtl';
    try { localStorage.setItem('lang', next); } catch (e) {}
    setLang(next);
    // Let client components that render dynamic strings (forms, errors) react.
    window.dispatchEvent(new CustomEvent('langchange', { detail: next }));
  }

  return (
    <button className="langtoggle" onClick={toggle} aria-label="Switch language" type="button">
      {lang === 'en' ? 'العربية' : 'EN'}
    </button>
  );
}
