'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfigFileViewer from './ConfigFileViewer';
import s from './ConfigFileViewer.module.css';

/**
 * The step after flashing: give the new board a saved setup file (.kscfg) right
 * here over USB, or set it up from scratch in the app.
 */
export default function FlashNextStep() {
  const [lang, setLang] = useState('ar');
  const [pick, setPick] = useState('');
  const t = (ar, en) => (lang === 'en' ? en : ar);

  useEffect(() => {
    setLang(document.documentElement.lang === 'en' ? 'en' : 'ar');
    const onLang = (e) => setLang(e.detail === 'en' ? 'en' : 'ar');
    window.addEventListener('langchange', onLang);
    return () => window.removeEventListener('langchange', onLang);
  }, []);

  const CHOICES = [
    ['file', t('عندي ملف إعداد', 'I have a setup file'),
      lang === 'en'
        ? <>A <bdi dir="ltr">.kscfg</bdi> saved from the app — the same layout as an earlier board, sent from here.</>
        : <>ملف <bdi dir="ltr">.kscfg</bdi> محفوظ من التطبيق — نفس ترتيب بوردة قبل كده، يتبعت للبوردة من هنا.</>],
    ['new', t('هعمل إعداد جديد', 'I’ll create a new setup'),
      t('عرّف القنوات والمنافذ خطوة بخطوة من داخل التطبيق.', 'Define the channels and pins step by step in the app.')],
  ];

  return (
    <div className={s.root}>
      <div className={s.choices} role="group" aria-label={t('إزاي تجهّز البوردة', 'How to set up the board')}>
        {CHOICES.map(([k, title, sub]) => (
          <button key={k} type="button" className={`${s.choice} ${pick === k ? s.choiceOn : ''}`}
            aria-pressed={pick === k} onClick={() => setPick(k)}>
            <b>{title}</b>
            <span>{sub}</span>
          </button>
        ))}
      </div>

      {pick === 'file' && <ConfigFileViewer />}

      {pick === 'new' && (
        <div className={s.result}>
          <ol className="steps">
            <li>{t('افتح تطبيق كوش سمارت وسجّل دخولك.', 'Open the KUSH SMART app and sign in.')}</li>
            <li>{t('اضغط «إضافة جهاز» ووصّل البوردة بالواي فاي.', 'Tap “Add device” and connect the board to Wi-Fi.')}</li>
            <li>{t('في شاشة «إعداد الجهاز» اختار قالب أو عرّف كل قناة ومنفذها، واضغط «إنشاء ملف التعريف».', 'On the “Device setup” screen pick a template or define each channel and pin, then tap “Create Info File”.')}</li>
            <li>{t('احفظ الإعداد كملف من نفس الشاشة، عشان تستخدمه لأي بوردة بنفس الترتيب بعد كده.', 'Save the setup as a file from the same screen, to reuse it for any board built the same way.')}</li>
          </ol>
          <p className={s.sendP}>
            <Link href="/downloads">{t('تحميل التطبيق', 'Download the app')}</Link>
            {' · '}
            <Link href="/docs/configuration">{t('دليل إعداد البوردة', 'Board setup guide')}</Link>
          </p>
        </div>
      )}
    </div>
  );
}
