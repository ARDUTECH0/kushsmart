'use client';

import { useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  collection, onSnapshot, doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { initFirebase, ADMIN_EMAILS } from '@/lib/firebase';

const isAdmin = (u) => !!u && ADMIN_EMAILS.includes((u.email || '').toLowerCase());

function since(date) {
  if (!date) return '—';
  const ms = Date.now() - date.getTime();
  if (ms < 0) return 'الآن';
  const d = Math.floor(ms / 86400000);
  if (d >= 1) return `${d} يوم`;
  const h = Math.floor(ms / 3600000);
  if (h >= 1) return `${h} ساعة`;
  const m = Math.floor(ms / 60000);
  return `${m} دقيقة`;
}
const toDate = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);

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
  const [toast, setToast] = useState('');

  // MQTT (optional live status)
  const [mqttUrl, setMqttUrl] = useState('wss://72.61.193.135:8084/mqtt');
  const [mqttState, setMqttState] = useState('off'); // off | connecting | on | error
  const [live, setLive] = useState({}); // serial -> bool
  const mqttRef = useRef(null);

  // init firebase + watch auth
  useEffect(() => {
    fb.current = initFirebase();
    const off = onAuthStateChanged(fb.current.auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return off;
  }, []);

  // subscribe to the registry once an admin is signed in
  useEffect(() => {
    if (!fb.current || !isAdmin(user)) return;
    const col = collection(fb.current.db, 'device_registry');
    const off = onSnapshot(
      col,
      (qs) => {
        const list = qs.docs.map((d) => {
          const x = d.data();
          return {
            serial: d.id,
            owner: x.owner || '',
            ownerEmail: x.ownerEmail || '',
            board: x.board || '',
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
      (e) => setToast('خطأ في القراءة: ' + e.code),
    );
    return off;
  }, [user]);

  async function login(e) {
    e.preventDefault();
    setAuthErr(''); setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(fb.current.auth, email.trim(), pass);
      if (!isAdmin(cred.user)) {
        setAuthErr('الحساب ده مش مصرّح له بالدخول.');
        await signOut(fb.current.auth);
      }
    } catch (err) {
      setAuthErr('بيانات الدخول غلط أو الحساب غير موجود.');
    } finally {
      setBusy(false);
    }
  }

  function flash(m) { setToast(m); setTimeout(() => setToast(''), 2500); }

  async function setLicense(serial, value) {
    try {
      await setDoc(
        doc(fb.current.db, 'device_registry', serial),
        value
          ? { licensed: true, licensedAt: serverTimestamp(), licenseRequested: false }
          : { licensed: false },
        { merge: true },
      );
      flash(value ? `تم ترخيص ${serial}` : `تم سحب ترخيص ${serial}`);
    } catch (e) {
      flash('فشل: ' + e.code);
    }
  }

  async function addLicense() {
    const s = newSerial.trim().toUpperCase();
    if (!s) return;
    await setLicense(s, true);
    setNewSerial('');
  }

  function toggleMqtt() {
    if (mqttState === 'on' || mqttState === 'connecting') {
      mqttRef.current?.end(true);
      mqttRef.current = null;
      setMqttState('off');
      return;
    }
    setMqttState('connecting');
    import('mqtt').then((mqtt) => {
      const client = mqtt.default.connect(mqttUrl, {
        username: 'test', password: '123456', reconnectPeriod: 0, connectTimeout: 8000,
      });
      mqttRef.current = client;
      client.on('connect', () => { setMqttState('on'); client.subscribe('+/+/status'); client.subscribe('+/status'); });
      client.on('error', () => { setMqttState('error'); client.end(true); });
      client.on('close', () => setMqttState((s) => (s === 'on' ? 'off' : s)));
      client.on('message', (topic, payload) => {
        try {
          const j = JSON.parse(payload.toString());
          const serial = j.device || j.serial || topic.split('/').slice(-2, -1)[0];
          if (serial) setLive((m) => ({ ...m, [serial]: j.status === 'online' }));
        } catch (_) {}
      });
    }).catch(() => setMqttState('error'));
  }

  const onlineOf = (d) =>
    d.serial in live ? live[d.serial] : !!(d.lastSeen && Date.now() - d.lastSeen.getTime() < 90000);

  // ---------- render ----------
  if (!authChecked) return <div className="adm-center">جارٍ التحميل…</div>;

  if (!isAdmin(user)) {
    return (
      <div className="adm-center">
        <form className="adm-login" onSubmit={login}>
          <h1>لوحة الأدمن</h1>
          <p>سجّل دخول بحساب الأدمن.</p>
          <input type="email" placeholder="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <input type="password" placeholder="كلمة السر" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          {authErr && <div className="adm-err">{authErr}</div>}
          <button className="btn lg" disabled={busy} type="submit">{busy ? '…' : 'دخول'}</button>
        </form>
      </div>
    );
  }

  const filtered = devices.filter((d) =>
    !q || d.serial.toLowerCase().includes(q.toLowerCase()) || d.ownerEmail.toLowerCase().includes(q.toLowerCase()));
  const total = devices.length;
  const licensed = devices.filter((d) => d.licensed).length;
  const pending = devices.filter((d) => !d.licensed && d.licenseRequested).length;
  const online = devices.filter(onlineOf).length;

  return (
    <div className="adm">
      <div className="adm-bar">
        <div className="adm-brand">لوحة الأدمن · كوش سمارت</div>
        <div className="adm-bar-r">
          <span className="adm-who">{user.email}</span>
          <button className="adm-ghost" onClick={() => signOut(fb.current.auth)}>خروج</button>
        </div>
      </div>

      <div className="adm-wrap">
        {/* summary */}
        <div className="adm-cards">
          <div className="adm-card"><b>{total}</b><span>إجمالي الأجهزة</span></div>
          <div className="adm-card ok"><b>{licensed}</b><span>مرخّصة</span></div>
          <div className="adm-card warn"><b>{pending}</b><span>طلبات ترخيص</span></div>
          <div className="adm-card"><b>{online}</b><span>متصلة الآن</span></div>
        </div>

        {/* add + search + mqtt */}
        <div className="adm-tools">
          <div className="adm-add">
            <input placeholder="سيريال الجهاز…" value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLicense()} />
            <button className="btn" onClick={addLicense}>+ إضافة ترخيص</button>
          </div>
          <input className="adm-search" placeholder="بحث بالسيريال أو الإيميل…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="adm-mqtt">
            <span className={`dot ${mqttState}`} />
            <input value={mqttUrl} onChange={(e) => setMqttUrl(e.target.value)} placeholder="wss://broker:8084/mqtt" />
            <button className="adm-ghost" onClick={toggleMqtt}>
              {mqttState === 'on' ? 'إيقاف MQTT' : mqttState === 'connecting' ? '…' : 'MQTT حيّ'}
            </button>
          </div>
        </div>

        {/* table */}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>الحالة</th><th>السيريال</th><th>المالك</th><th>البورد</th>
                <th>الترخيص</th><th>مدّة الترخيص</th><th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.serial}>
                  <td><span className={`pin ${onlineOf(d) ? 'up' : 'down'}`} />{onlineOf(d) ? 'متصل' : 'غير متصل'}</td>
                  <td className="mono">{d.serial}</td>
                  <td>{d.ownerEmail || '—'}</td>
                  <td>{d.board || '—'}</td>
                  <td>
                    {d.licensed
                      ? <span className="tag ok">مرخّص</span>
                      : d.licenseRequested
                        ? <span className="tag warn">طلب ترخيص</span>
                        : <span className="tag">غير مرخّص</span>}
                  </td>
                  <td>{d.licensed ? `بقاله ${since(d.licensedAt)}` : '—'}</td>
                  <td>
                    {d.licensed
                      ? <button className="adm-ghost sm" onClick={() => setLicense(d.serial, false)}>سحب</button>
                      : <button className="btn sm" onClick={() => setLicense(d.serial, true)}>ترخيص</button>}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="adm-empty">لا توجد أجهزة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  );
}
