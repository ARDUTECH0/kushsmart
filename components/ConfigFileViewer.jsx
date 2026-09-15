'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Alert } from './Icons';
import SendToBoard from './SendToBoard';
import s from './ConfigFileViewer.module.css';

const BRIDGE = 'https://smart.kushsmart.space';
const MAX_BYTES = 256 * 1024;

const TYPES = {
  onoff: ['مفتاح (ريليه)', 'Switch (relay)'],
  dimmer: ['إضاءة معتّمة', 'Dimmable light'],
  fan: ['مروحة', 'Fan'],
  rgb: ['إضاءة RGB', 'RGB light'],
  ws2812: ['شريط LED (WS2812)', 'LED strip (WS2812)'],
  shutter: ['ستارة', 'Shutter'],
  dht: ['حساس حرارة ورطوبة', 'Temperature & humidity'],
  analog: ['دخل تناظري', 'Analog input'],
  digital: ['دخل رقمي', 'Digital input'],
  bl0942: ['عدّاد كهرباء BL0942', 'BL0942 energy meter'],
};

const ERRORS = {
  not_ours: ['هذا ليس ملف إعداد من كوش سمارت (.kscfg).', 'This isn’t a KUSH SMART setup file (.kscfg).'],
  damaged: ['الملف تالف أو جرى تعديله، ولا يمكن فتحه.', 'The file is damaged or was changed — it can’t be opened.'],
  newer_version: ['هذا الملف من إصدار أحدث — حاول مجددًا بعد تحديث الموقع.', 'This file is from a newer version — try again later.'],
  too_big: ['حجم الملف أكبر من أن يكون ملف إعداد.', 'The file is too large to be a setup file.'],
  too_fast: ['محاولات كثيرة متتالية — انتظر دقيقة ثم حاول مجددًا.', 'Too many tries in a row — wait a minute and try again.'],
  unavailable: ['العارض غير متاح حاليًا — حاول بعد قليل.', 'The viewer isn’t available right now — try again shortly.'],
  network: ['تعذّر الاتصال — تحقّق من اتصالك بالإنترنت ثم حاول مجددًا.', 'Connection failed — check your internet and try again.'],
};

export default function ConfigFileViewer() {
  const [lang, setLang] = useState('ar');
  const [st, setSt] = useState({ status: 'idle' }); // idle | busy | done | error
  const [drag, setDrag] = useState(false);
  const input = useRef(null);
  const t = (ar, en) => (lang === 'en' ? en : ar);
  const tp = (pair) => (pair ? pair[lang === 'en' ? 1 : 0] : '');

  useEffect(() => {
    setLang(document.documentElement.lang === 'en' ? 'en' : 'ar');
    const onLang = (e) => setLang(e.detail === 'en' ? 'en' : 'ar');
    window.addEventListener('langchange', onLang);
    return () => window.removeEventListener('langchange', onLang);
  }, []);

  async function read(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) { setSt({ status: 'error', error: 'too_big' }); return; }
    setSt({ status: 'busy', name: file.name });
    try {
      const r = await fetch(`${BRIDGE}/configfile/open`, {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: await file.arrayBuffer(),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok && j.layout) setSt({ status: 'done', name: file.name, layout: j.layout });
      else setSt({ status: 'error', error: ERRORS[j.error] ? j.error : 'damaged' });
    } catch (_) {
      setSt({ status: 'error', error: 'network' });
    }
  }

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    read(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={s.root}>
      <label
        className={`${s.drop} ${drag ? s.dragging : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <input ref={input} type="file" accept=".kscfg" className={s.file}
          onChange={(e) => { read(e.target.files?.[0]); e.target.value = ''; }} />
        <span className={s.dropIc}><Upload /></span>
        <b>{st.status === 'busy' ? t('جارٍ فتح الملف…', 'Opening the file…') : t('اختر ملف الإعداد أو اسحبه هنا', 'Choose a setup file or drop it here')}</b>
        <span className={s.dropSub}>
          {st.name ? <bdi dir="ltr">{st.name}</bdi> : lang === 'en'
            ? <>A <bdi dir="ltr">.kscfg</bdi> file saved from the app</>
            : <>ملف بامتداد <bdi dir="ltr">.kscfg</bdi> محفوظ من التطبيق</>}
        </span>
      </label>

      <p className={s.privacy}>
        {t('يُفتح الملف لعرضه هنا فقط، ولا يُحفَظ أو يُسجَّل لدينا.',
          'The file is only opened to show it here — it isn’t stored or logged.')}
      </p>

      {st.status === 'error' && (
        <div className={s.err} role="alert"><Alert /><span>{tp(ERRORS[st.error])}</span></div>
      )}

      {st.status === 'done' && (
        <>
          <Layout layout={st.layout} t={t} tp={tp} lang={lang} />
          <SendToBoard layout={st.layout} t={t} />
        </>
      )}
    </div>
  );
}

function Layout({ layout, t, tp, lang }) {
  const board = layout.board || '—';
  const pinName = (p) => (p == null ? '—' : board === 'ESP8266' && p === 17 ? 'A0' : `GPIO ${p}`);
  const used = layout.lines.filter((l) => l.type !== 'none' && l.gpio != null);

  // Every pin and what it does — duplicates are marked, same as the app does.
  const map = [];
  for (const l of used) {
    const who = l.name || tp(TYPES[l.type]);
    const add = (p, role) => p != null && map.push({ p, what: role ? `${who} · ${role}` : who });
    if (l.type === 'rgb') { add(l.gpio, 'R'); add(l.gpio2, 'G'); add(l.gpio3, 'B'); }
    else if (l.type === 'shutter') { add(l.gpio, t('رفع', 'Up')); add(l.gpio2, t('خفض', 'Down')); }
    else if (l.type === 'bl0942') { add(l.gpio, 'RX'); add(l.gpio2, 'TX'); }
    else add(l.gpio);
    if (l.type === 'onoff') add(l.switchGpio, t('مفتاح الحائط', 'wall switch'));
  }
  const hw = layout.hardware;
  const HW = [
    ['buttonGpio', t('زر الإعداد', 'Config button')],
    ['wifiLedPin', t('مؤشّر الواي فاي', 'Wi-Fi LED')],
    ['configLedPin', t('مؤشّر الإعداد', 'Config LED')],
    ['cloudLedPin', t('مؤشّر السحابة', 'Cloud LED')],
    ['rfGpio', t('مستقبل RF 433', '433MHz RF receiver')],
    ['irGpio', t('مستقبل IR', 'IR receiver')],
  ];
  HW.forEach(([k, label]) => hw[k] != null && map.push({ p: hw[k], what: label }));
  map.sort((a, b) => a.p - b.p);
  const count = map.reduce((m, x) => ({ ...m, [x.p]: (m[x.p] || 0) + 1 }), {});

  const pins = (l) => {
    if (l.type === 'rgb') return `R ${pinName(l.gpio)} · G ${pinName(l.gpio2)} · B ${pinName(l.gpio3)}`;
    if (l.type === 'shutter') return `${t('رفع', 'Up')} ${pinName(l.gpio)} · ${t('خفض', 'Down')} ${pinName(l.gpio2)}`;
    if (l.type === 'bl0942') return `RX ${pinName(l.gpio)} · TX ${pinName(l.gpio2)}`;
    return pinName(l.gpio);
  };
  const extra = (l) => {
    if (l.type === 'onoff' && l.switchGpio != null) return `${t('مفتاح الحائط', 'Wall switch')}: ${pinName(l.switchGpio)}`;
    if (l.type === 'ws2812' && l.count) return `${l.count} LED`;
    if (l.type === 'dht') return l.dhtType === 'dht11' ? 'DHT11' : 'DHT22';
    return '';
  };

  const st = layout.settings;
  const yesNo = (v, a, b) => (v ? a : b);
  const SETTINGS = [
    [t('اسم شبكة الإعداد', 'Config AP name'), st.apName || 'UNIT'],
    [t('وضع المفاتيح', 'Switches mode'), [t('عادي', 'Normal'), t('ثلاثي', '3-way'), t('ضغط', 'Press')][st.switchMode]],
    [t('معالجة المفاتيح', 'Switches handling'), yesNo(st.switchInterrupts, t('مقاطعات', 'Interrupts'), t('استطلاع', 'Polling'))],
    [t('توصيل المفاتيح', 'Switches wiring'), yesNo(st.switchPullup, t('رفع', 'Pullup'), t('خفض', 'Pulldown'))],
    [t('وضع المرحّلات', 'Relays mode'), yesNo(st.relayActiveLow, t('فعّال-منخفض', 'Active-low'), t('فعّال-مرتفع', 'Active-high'))],
    [t('مؤشّر الواي فاي', 'Wi-Fi LED'), st.wifiLedMode === 1 ? t('صامت', 'Quiet') : t('الحالة', 'Status')],
    [t('توصيل مؤشّرات LED', 'Indicator LEDs'), yesNo(st.ledActiveLow, t('فعّال-منخفض', 'Active-low'), t('فعّال-مرتفع', 'Active-high'))],
    [t('توصيل زر الإعداد', 'Config button wiring'), yesNo(st.buttonPullup, t('رفع', 'Pullup'), t('خفض', 'Pulldown'))],
  ];

  let saved = '';
  try {
    if (layout.savedAt) saved = new Date(layout.savedAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (_) { /* no date */ }

  return (
    <div className={s.result}>
      <div className={s.head}>
        <div>
          <span className={s.k}>{t('المشروع', 'Project')}</span>
          <h2 dir="auto">{layout.project || t('بدون اسم', 'Untitled')}</h2>
        </div>
        <dl className={s.facts}>
          <div><dt>{t('البوردة', 'Board')}</dt><dd><bdi dir="ltr">{board}</bdi></dd></div>
          <div><dt>{t('القنوات', 'Channels')}</dt><dd>{used.length}</dd></div>
          {saved && <div><dt>{t('تاريخ الحفظ', 'Saved')}</dt><dd>{saved}</dd></div>}
        </dl>
      </div>

      <h3 className={s.h}>{t('ترتيب القنوات', 'Channel layout')}</h3>
      {!used.length ? (
        <p className={s.empty}>{t('لا توجد قنوات معرَّفة في هذا الملف.','No channels are defined in this file.')}</p>
      ) : (
        <div className={s.scroll}>
          <table className={s.table}>
            <thead>
              <tr><th>#</th><th>{t('الاسم', 'Name')}</th><th>{t('النوع', 'Type')}</th><th>{t('المنافذ', 'Pins')}</th><th>{t('تفاصيل', 'Details')}</th></tr>
            </thead>
            <tbody>
              {used.map((l) => (
                <tr key={l.n}>
                  <td className={s.num}>{l.n}</td>
                  <td dir="auto"><b>{l.name || '—'}</b></td>
                  <td>{tp(TYPES[l.type]) || l.type}</td>
                  <td className={s.pins}><bdi dir="ltr">{pins(l)}</bdi></td>
                  <td>{extra(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={s.grid}>
        <section>
          <h3 className={s.h}>{t('خريطة المنافذ', 'Pin map')}</h3>
          <ul className={s.map}>
            {map.map((x, i) => (
              <li key={`${x.p}-${i}`} className={count[x.p] > 1 ? s.clash : ''}>
                <bdi dir="ltr" className={s.pin}>{pinName(x.p)}</bdi>
                <span dir="auto">{x.what}</span>
                {count[x.p] > 1 && <em>{t('مستخدم مرتين', 'used twice')}</em>}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className={s.h}>{t('الإعدادات', 'Settings')}</h3>
          <dl className={s.kv}>
            {SETTINGS.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd dir="auto">{v}</dd></div>))}
          </dl>
        </section>
      </div>
    </div>
  );
}
