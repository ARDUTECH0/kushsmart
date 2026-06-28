'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  collection, onSnapshot, doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { initFirebase, ADMIN_EMAILS } from '@/lib/firebase';
import { Cpu, Lock, Bell, Signal } from '@/components/Icons';

const DEFAULT_MQTT = 'wss://72.61.193.135:8084/mqtt';
const isAdmin = (u) => !!u && ADMIN_EMAILS.includes((u.email || '').toLowerCase());
const toDate = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);

function rel(date, future) {
  if (!date) return '—';
  let ms = future ? date.getTime() - Date.now() : Date.now() - date.getTime();
  if (ms < 0) ms = 0;
  const d = Math.floor(ms / 86400000); if (d >= 1) return `${d} يوم`;
  const h = Math.floor(ms / 3600000); if (h >= 1) return `${h} ساعة`;
  const m = Math.floor(ms / 60000); if (m >= 1) return `${m} دقيقة`;
  return 'الآن';
}

export default function AdminConsole() {
  const fb = useRef(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [devices, setDevices] = useState([]);
  const [q, setQ] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [sel, setSel] = useState(null); // selected serial -> detail drawer
  const [toast, setToast] = useState('');

  const [mqttUrl, setMqttUrl] = useState(DEFAULT_MQTT);
  const [mqttEdit, setMqttEdit] = useState(false);
  const [mqttState, setMqttState] = useState('off'); // off|connecting|on|error
  const [live, setLive] = useState({});
  const mqttRef = useRef(null);

  // ---- firebase auth ----
  useEffect(() => {
    fb.current = initFirebase();
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('adm_mqtt_url');
      if (saved) setMqttUrl(saved);
    }
    return onAuthStateChanged(fb.current.auth, (u) => { setUser(u); setAuthChecked(true); });
  }, []);

  // ---- registry stream (auto) ----
  useEffect(() => {
    if (!fb.current || !isAdmin(user)) return;
    const off = onSnapshot(
      collection(fb.current.db, 'device_registry'),
      (qs) => {
        const list = qs.docs.map((d) => {
          const x = d.data();
          return {
            serial: d.id,
            ownerEmail: x.ownerEmail || '',
            owner: x.owner || '',
            board: x.board || '',
            unitName: x.unitName || '',
            licensed: x.licensed === true,
            licenseRequested: x.licenseRequested === true,
            licensedAt: toDate(x.licensedAt) || toDate(x.createdAt),
            lastSeen: toDate(x.lastSeen),
          };
        });
        list.sort((a, b) => {
          if (a.licensed !== b.licensed) return a.licensed ? 1 : -1;
          if (a.licenseRequested !== b.licenseRequested) return a.licenseRequested ? -1 : 1;
          return a.serial.localeCompare(b.serial);
        });
        setDevices(list);
      },
      (e) => flash('خطأ قراءة: ' + e.code),
    );
    return off;
  }, [user]);

  // ---- MQTT (auto-connect once signed in) ----
  useEffect(() => {
    if (!isAdmin(user)) return;
    connectMqtt(mqttUrl);
    return () => { mqttRef.current?.end(true); mqttRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function connectMqtt(url) {
    mqttRef.current?.end(true);
    setMqttState('connecting');
    import('mqtt').then((mqtt) => {
      const c = mqtt.default.connect(url, {
        username: 'test', password: '123456', reconnectPeriod: 0, connectTimeout: 6000,
      });
      mqttRef.current = c;
      c.on('connect', () => { setMqttState('on'); c.subscribe('+/+/status'); c.subscribe('+/status'); });
      c.on('error', () => { setMqttState('error'); c.end(true); });
      c.on('close', () => setMqttState((s) => (s === 'on' ? 'off' : s)));
      c.on('message', (topic, payload) => {
        try {
          const j = JSON.parse(payload.toString());
          const serial = j.device || j.serial || topic.split('/').slice(-2, -1)[0];
          if (serial) setLive((m) => ({ ...m, [serial]: j.status === 'online' }));
        } catch (_) {}
      });
    }).catch(() => setMqttState('error'));
  }

  function saveMqtt() {
    window.localStorage.setItem('adm_mqtt_url', mqttUrl);
    setMqttEdit(false);
    connectMqtt(mqttUrl);
  }

  async function login(e) {
    e.preventDefault(); setAuthErr(''); setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(fb.current.auth, email.trim(), pass);
      if (!isAdmin(cred.user)) { setAuthErr('الحساب ده مش مصرّح له.'); await signOut(fb.current.auth); }
    } catch (_) { setAuthErr('بيانات الدخول غلط أو الحساب غير موجود.'); }
    finally { setBusy(false); }
  }

  function flash(m) { setToast(m); setTimeout(() => setToast(''), 2600); }

  async function setLicense(serial, value) {
    try {
      await setDoc(
        doc(fb.current.db, 'device_registry', serial),
        value ? { licensed: true, licensedAt: serverTimestamp(), licenseRequested: false }
              : { licensed: false },
        { merge: true },
      );
      flash(value ? `تم ترخيص ${serial} ✓` : `تم سحب ترخيص ${serial}`);
    } catch (e) { flash('فشل: ' + e.code); }
  }

  async function addLicense() {
    const s = newSerial.trim().toUpperCase();
    if (!s) return;
    await setLicense(s, true);
    setNewSerial(''); setSel(s);
  }

  const onlineOf = (d) =>
    d.serial in live ? live[d.serial] : !!(d.lastSeen && Date.now() - d.lastSeen.getTime() < 90000);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return devices;
    return devices.filter((d) =>
      d.serial.toLowerCase().includes(t) ||
      d.ownerEmail.toLowerCase().includes(t) ||
      d.unitName.toLowerCase().includes(t));
  }, [devices, q]);

  const stats = useMemo(() => ({
    total: devices.length,
    licensed: devices.filter((d) => d.licensed).length,
    pending: devices.filter((d) => !d.licensed && d.licenseRequested).length,
    online: devices.filter(onlineOf).length,
  }), [devices, live]);

  const selected = sel ? devices.find((d) => d.serial === sel) : null;

  // ---- render ----
  if (!authChecked) return <div className="adm-center">جارٍ التحميل…</div>;

  if (!isAdmin(user)) {
    return (
      <div className="adm-center">
        <form className="adm-login" onSubmit={login}>
          <div className="adm-login-badge"><Lock /></div>
          <h1>لوحة الأدمن</h1>
          <p>دخول بحساب الأدمن المصرّح به.</p>
          <input type="email" placeholder="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <input type="password" placeholder="كلمة السر" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          {authErr && <div className="adm-err">{authErr}</div>}
          <button className="btn lg" disabled={busy} type="submit">{busy ? '…' : 'دخول'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="adm">
      <div className="adm-bar">
        <div className="adm-brand"><span className="adm-logo"><Lock /></span> لوحة تحكّم الأدمن · كوش سمارت</div>
        <div className="adm-bar-r">
          <button className="adm-chip" onClick={() => setMqttEdit((v) => !v)} title="حالة الاتصال بالسيرفر">
            <span className={`dot ${mqttState}`} />
            {mqttState === 'on' ? 'متصل بالسيرفر' : mqttState === 'connecting' ? 'جارٍ الاتصال…' : mqttState === 'error' ? 'بيانات حيّة غير متاحة' : 'غير متصل'}
          </button>
          <span className="adm-who">{user.email}</span>
          <button className="adm-ghost" onClick={() => signOut(fb.current.auth)}>خروج</button>
        </div>
      </div>

      {mqttEdit && (
        <div className="adm-mqtt-bar">
          <span>عنوان السيرفر (MQTT over WSS):</span>
          <input value={mqttUrl} onChange={(e) => setMqttUrl(e.target.value)} placeholder="wss://broker:8084/mqtt" />
          <button className="btn sm" onClick={saveMqtt}>اتصال</button>
          <small>لو مش متاح، الحالة بتتحسب من آخر ظهور للجهاز تلقائيًا.</small>
        </div>
      )}

      <div className="adm-wrap">
        <div className="adm-cards">
          <div className="adm-card"><span className="ci"><Cpu /></span><div><b>{stats.total}</b><span>إجمالي الأجهزة</span></div></div>
          <div className="adm-card ok"><span className="ci"><Lock /></span><div><b>{stats.licensed}</b><span>مرخّصة</span></div></div>
          <div className="adm-card warn"><span className="ci"><Bell /></span><div><b>{stats.pending}</b><span>طلبات ترخيص</span></div></div>
          <div className="adm-card"><span className="ci"><Signal /></span><div><b>{stats.online}</b><span>متصلة الآن</span></div></div>
        </div>

        <div className="adm-tools">
          <div className="adm-search">
            <Signal />
            <input
              placeholder="ابحث عن جهاز بالسيريال أو الإيميل…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && filtered.length) setSel(filtered[0].serial); }}
            />
          </div>
          <div className="adm-add">
            <input placeholder="سيريال جديد…" value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLicense()} />
            <button className="btn" onClick={addLicense}>+ ترخيص جهاز</button>
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>الحالة</th><th>السيريال</th><th>المالك</th><th>الترخيص</th><th>مدّة الترخيص</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.serial} onClick={() => setSel(d.serial)} className={sel === d.serial ? 'on' : ''}>
                  <td><span className={`pin ${onlineOf(d) ? 'up' : 'down'}`} />{onlineOf(d) ? 'متصل' : 'غير متصل'}</td>
                  <td className="mono">{d.serial}</td>
                  <td>{d.ownerEmail || '—'}</td>
                  <td>{d.licensed ? <span className="tag ok">مرخّص</span> : d.licenseRequested ? <span className="tag warn">طلب ترخيص</span> : <span className="tag">غير مرخّص</span>}</td>
                  <td>{d.licensed ? `بقاله ${rel(d.licensedAt)}` : '—'}</td>
                  <td className="chev">›</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6} className="adm-empty">لا توجد أجهزة مطابقة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* device detail drawer */}
      {selected && (
        <>
          <div className="adm-scrim" onClick={() => setSel(null)} />
          <aside className="adm-drawer">
            <div className="adm-drawer-head">
              <div>
                <div className="adm-dserial mono">{selected.serial}</div>
                <div className="adm-dsub">{selected.unitName || 'وحدة كوش سمارت'}</div>
              </div>
              <button className="adm-x" onClick={() => setSel(null)}>×</button>
            </div>

            <div className="adm-dstate">
              <span className={`tag ${selected.licensed ? 'ok' : selected.licenseRequested ? 'warn' : ''}`}>
                {selected.licensed ? 'مرخّص' : selected.licenseRequested ? 'طلب ترخيص' : 'غير مرخّص'}
              </span>
              <span className={`tag ${onlineOf(selected) ? 'ok' : ''}`}>
                <span className={`pin ${onlineOf(selected) ? 'up' : 'down'}`} />{onlineOf(selected) ? 'متصل الآن' : 'غير متصل'}
              </span>
            </div>

            <dl className="adm-dl">
              <div><dt>المالك</dt><dd>{selected.ownerEmail || '—'}</dd></div>
              <div><dt>البورد</dt><dd>{selected.board || '—'}</dd></div>
              <div><dt>مدّة الترخيص</dt><dd>{selected.licensed ? `بقاله ${rel(selected.licensedAt)}` : '—'}</dd></div>
              <div><dt>تاريخ الترخيص</dt><dd>{selected.licensedAt ? selected.licensedAt.toLocaleString('ar-EG') : '—'}</dd></div>
              <div><dt>آخر ظهور</dt><dd>{selected.lastSeen ? `${rel(selected.lastSeen)} مضت` : '—'}</dd></div>
            </dl>

            <div className="adm-dactions">
              {selected.licensed
                ? <button className="adm-ghost lg" onClick={() => setLicense(selected.serial, false)}>سحب الترخيص</button>
                : <button className="btn lg" onClick={() => setLicense(selected.serial, true)}>منح ترخيص</button>}
            </div>
          </aside>
        </>
      )}

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  );
}
