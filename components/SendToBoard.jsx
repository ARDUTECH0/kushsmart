'use client';

import { useState } from 'react';
import Link from 'next/link';
import { openBoard, serialSupported, utf8Bytes, MAX_LINE_BYTES } from '@/lib/boardSerial';
import { Upload, Check, Alert } from './Icons';
import s from './ConfigFileViewer.module.css';

/**
 * Turns a saved layout into the Info File the board takes — the same payload
 * the app's setup screen sends (lib/pages/Configurationio.dart `_send`).
 * Names go separately: with them inline a full 12-channel board can pass the
 * 1200-byte line the firmware's USB console accepts.
 */
export function buildInfoFile(layout) {
  const problems = [];
  const channels = [];
  const names = [];
  const uses = {};
  const use = (p) => { if (p != null) uses[p] = (uses[p] || 0) + 1; };

  (layout.lines || []).forEach((l, i) => {
    if (l.type === 'none' || l.gpio == null) return;
    const n = i + 1;
    if (l.type === 'rgb' && (l.gpio2 == null || l.gpio3 == null)) problems.push(['rgb', n]);
    if ((l.type === 'shutter' || l.type === 'bl0942') && l.gpio2 == null) problems.push([l.type, n]);
    const c = { index: i, type: l.type, gpio: l.gpio };
    use(l.gpio);
    if (l.type === 'rgb') { c.gpio2 = l.gpio2; c.gpio3 = l.gpio3; use(l.gpio2); use(l.gpio3); }
    if (l.type === 'shutter' || l.type === 'bl0942') { c.gpio2 = l.gpio2; use(l.gpio2); }
    if (l.type === 'ws2812') c.count = l.count || 8;
    if (l.type === 'dht') c.dhtType = l.dhtType === 'dht11' ? 'dht11' : 'dht22';
    if (l.type === 'onoff' && l.switchGpio != null) { c.switchGpio = l.switchGpio; use(l.switchGpio); }
    channels.push(c);
    if (l.name) names.push({ index: i, name: l.name });
  });

  const hw = layout.hardware || {};
  const st = layout.settings || {};
  ['buttonGpio', 'wifiLedPin', 'configLedPin', 'cloudLedPin', 'rfGpio', 'irGpio'].forEach((k) => use(hw[k]));
  const clashes = Object.keys(uses).filter((p) => uses[p] > 1);
  if (clashes.length) problems.push(['clash', clashes.join(', ')]);
  if (!channels.length) problems.push(['empty']);
  if (channels.filter((c) => c.type === 'bl0942').length > 2) problems.push(['meters']);

  const infofile = {
    board: layout.board,
    channels,
    buttonGpio: hw.buttonGpio ?? 0,
    ...(hw.wifiLedPin != null && { wifiLedPin: hw.wifiLedPin }),
    wifiLedMode: st.wifiLedMode === 1 ? 1 : 0,
    ledActiveLow: st.ledActiveLow === true,
    ...(hw.configLedPin != null && { configLedPin: hw.configLedPin }),
    ...(hw.cloudLedPin != null && { cloudLedPin: hw.cloudLedPin }),
    ...(hw.rfGpio != null && { rfGpio: hw.rfGpio }),
    ...(hw.irGpio != null && { irGpio: hw.irGpio }),
    apName: (st.apName || '').trim() || 'UNIT',
    relayActiveLow: st.relayActiveLow === true,
    switchMode: [0, 1, 2].includes(st.switchMode) ? st.switchMode : 0,
    switchInterrupts: st.switchInterrupts === true,
    switchPullup: st.switchPullup !== false,
    buttonPullup: st.buttonPullup !== false,
  };
  const line = JSON.stringify({ infofile });
  if (utf8Bytes(line) > MAX_LINE_BYTES) problems.push(['big']);
  return { line, names, expected: channels.length, problems };
}

const isInfo = (j) => j && typeof j.locked === 'boolean' && Array.isArray(j.channels);

export default function SendToBoard({ layout, t }) {
  const [phase, setPhase] = useState('idle'); // idle | busy | done | error
  const [step, setStep] = useState('');
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);
  const plan = buildInfoFile(layout);

  const PROBLEMS = {
    rgb: (n) => t(`القناة ${n}: RGB محتاجة منافذ R وG وB.`, `Channel ${n}: RGB needs R, G and B pins.`),
    shutter: (n) => t(`القناة ${n}: الستارة محتاجة منفذ رفع وخفض.`, `Channel ${n}: the shutter needs Up and Down pins.`),
    bl0942: (n) => t(`القناة ${n}: العدّاد محتاج منفذ RX وTX.`, `Channel ${n}: the meter needs RX and TX pins.`),
    clash: (p) => t(`منفذ ${p} مستخدم أكتر من مرة.`, `Pin ${p} is used more than once.`),
    empty: () => t('مفيش قنوات متعرّفة في الملف.', 'The file defines no channels.'),
    meters: () => t('أقصى عدد لعدّادات BL0942 هو 2.', 'At most 2 BL0942 meters.'),
    big: () => t('الإعداد أكبر من اللي البوردة تستقبله مرة واحدة.', 'The setup is larger than the board accepts at once.'),
  };

  const STEPS = [
    ['connect', t('الاتصال بالبوردة', 'Connecting to the board')],
    ['check', t('التأكد من البوردة', 'Checking the board')],
    ['send', t('إرسال التعريف', 'Sending the definition')],
    ['names', t('كتابة أسماء القنوات', 'Writing channel names')],
    ['verify', t('التحقّق', 'Verifying')],
  ];

  const fail = (code, extra) => { setErr({ code, extra }); setPhase('error'); };

  async function run() {
    setErr(null); setResult(null); setPhase('busy'); setStep('connect');
    let board;
    try {
      board = await openBoard();
    } catch (e) {
      if (e && e.name === 'NotFoundError') { setPhase('idle'); return; } // closed the port picker
      fail('open');
      return;
    }
    try {
      setStep('check');
      const info = await board.request('info', isInfo, { tries: 12, every: 900 });
      if (!info) return fail('no_reply');
      if (layout.board && info.board && info.board !== layout.board) return fail('mismatch', info.board);
      if (info.locked) return fail('locked');

      setStep('send');
      const r = await board.command(plan.line, 5000);
      if (!r || r.error) return fail('rejected');

      setStep('names');
      for (const nm of plan.names) {
        const line = JSON.stringify({ chanConfig: [nm] });
        if (utf8Bytes(line) <= MAX_LINE_BYTES) await board.command(line, 3000);
      }

      setStep('verify');
      const after = await board.request('info', isInfo, { tries: 4, every: 1200 });
      if (!after || !after.locked) return fail('not_locked');
      setResult({ serial: after.serial, count: after.channels.length });
      setPhase('done');
    } catch (_) {
      fail('lost');
    } finally {
      await board.close();
    }
  }

  const ERR = {
    open: t('تعذّر فتح منفذ البوردة — اقفل أي برنامج تاني بيستخدمه (زي نافذة الرفع) وجرّب تاني.', 'Couldn’t open the board’s port — close anything else using it (like the flashing window) and try again.'),
    no_reply: t('البوردة مردّتش. اتأكد إنك رفعت السوفت وير عليها، وافصلها ووصّلها تاني، وجرّب.', 'The board didn’t answer. Make sure it was flashed, unplug and replug it, and try again.'),
    mismatch: t(`الملف ده لبوردة ${layout.board} والمتوصلة ${err?.extra} — المنافذ مختلفة، استخدم ملف للنوع ده.`, `This file is for a ${layout.board} but the connected board is a ${err?.extra} — the pins differ; use a file for this board.`),
    locked: t('البوردة دي متعرّفة قبل كده، والتعريف بيتقفل بعد أول مرة. عشان تغيّره لازم تتمسح بالكامل وتترفع من جديد.', 'This board already has a definition, and it locks after the first time. Changing it needs a full erase and a fresh flash.'),
    rejected: t('البوردة رفضت التعريف. افصلها ووصّلها تاني وجرّب.', 'The board refused the definition. Unplug it, plug it back and try again.'),
    not_locked: t('التعريف موصلش كامل للبوردة. افصلها ووصّلها تاني وجرّب.', 'The definition didn’t reach the board completely. Unplug it, plug it back and try again.'),
    lost: t('الاتصال بالبوردة اتقطع. وصّلها تاني وجرّب.', 'The connection to the board dropped. Plug it back and try again.'),
  };

  if (!serialSupported()) {
    return (
      <div className={s.send}>
        <h3 className={s.h}>{t('ابعت الإعداد للبوردة', 'Send this setup to a board')}</h3>
        <p className={s.sendP}>{t('إرسال الإعداد للبوردة بيشتغل من Chrome أو Edge على كمبيوتر.', 'Sending to a board works in Chrome or Edge on a computer.')}</p>
      </div>
    );
  }

  const at = STEPS.findIndex(([k]) => k === step);

  return (
    <div className={s.send}>
      <h3 className={s.h}>{t('ابعت الإعداد للبوردة', 'Send this setup to a board')}</h3>
      <p className={s.sendP}>
        {t('وصّل البوردة اللي رفعت عليها السوفت وير بالكمبيوتر بنفس كابل USB، واقفل نافذة الرفع لو لسه مفتوحة، واضغط الزرار واختار منفذها.',
          'Connect the freshly flashed board with the same USB cable, close the flashing window if it’s still open, then press the button and pick its port.')}
      </p>

      {plan.problems.length > 0 ? (
        <div className={s.err} role="alert"><Alert />
          <span>{plan.problems.map(([k, a]) => PROBLEMS[k](a)).join(' ')}</span>
        </div>
      ) : phase === 'done' ? (
        <div className={s.ok} role="status">
          <span className={s.okIc}><Check /></span>
          <div>
            <b>{t('البوردة اتجهّزت ✓', 'The board is set up ✓')}</b>
            <p>
              {t(`اتكتب التعريف (${result.count} قناة) واتقفل على البوردة ${result.serial || ''}. دلوقتي افتح التطبيق وأضِف الجهاز ووصّله بالواي فاي.`,
                `The definition (${result.count} channels) is written and locked on board ${result.serial || ''}. Now open the app, add the device and connect it to Wi-Fi.`)}
              {' '}<Link href="/docs#add">{t('إزاي أضيف الجهاز', 'How to add a device')}</Link>
            </p>
          </div>
        </div>
      ) : (
        <>
          {phase !== 'idle' && (
            <ol className={s.progress}>
              {STEPS.map(([k, label], i) => (
                <li key={k} className={phase === 'error' && i === at ? s.stepBad : i < at ? s.stepDone : i === at ? s.stepNow : ''}>
                  <span aria-hidden="true">{i < at ? '✓' : i + 1}</span>{label}
                </li>
              ))}
            </ol>
          )}
          {phase === 'error' && err && <div className={s.err} role="alert"><Alert /><span>{ERR[err.code]}</span></div>}
          <button type="button" className="btn lg" onClick={run} disabled={phase === 'busy'}>
            <Upload />
            {phase === 'busy' ? t('جارٍ الإرسال… متفصلش الكابل', 'Sending… keep the cable in')
              : phase === 'error' ? t('جرّب تاني', 'Try again')
              : t('وصّل البوردة وابعت الإعداد', 'Connect the board and send')}
          </button>
        </>
      )}
    </div>
  );
}
