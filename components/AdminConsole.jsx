'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  collection, onSnapshot, doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { initFirebase, ADMIN_EMAILS } from '@/lib/firebase';
import { Cpu, Lock, Bell, Signal, Bolt, Bulb } from '@/components/Icons';

const DEFAULT_MQTT = 'wss://api.waferhealth.com/mqtt/';
const isAdmin = (u) => !!u && ADMIN_EMAILS.includes((u.email || '').toLowerCase());
const toDate = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);

function rel(date, suffix) {
  if (!date) return '—';
  let ms = Date.now() - date.getTime();
  if (ms < 0) ms = 0;
  const d = Math.floor(ms / 86400000); if (d >= 1) return `${d} يوم${suffix || ''}`;
  const h = Math.floor(ms / 3600000); if (h >= 1) return `${h} ساعة${suffix || ''}`;
  const m = Math.floor(ms / 60000); if (m >= 1) return `${m} دقيقة${suffix || ''}`;
  return 'الآن';
}

const TYPE = {
  power: { Ic: Bolt, label: 'عدّاد طاقة' },
  lock: { Ic: Lock, label: 'قفل' },
  relay: { Ic: Bulb, label: 'مفاتيح' },
};

export default function AdminConsole() {
  const fb = useRef(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [registry, setRegistry] = useState([]);   // Firestore licence authority
  const [liveState, setLiveState] = useState({});  // serial -> telemetry (MQTT)
  const [liveStatus, setLiveStatus] = useState({}); // serial -> online (MQTT)
  const [q, setQ] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [sel, setSel] = useState(null);
  const [toast, setToast] = useState('');

  const [mqttUrl, setMqttUrl] = useState(DEFAULT_MQTT);
  const [mqttEdit, setMqttEdit] = useState(false);
  const [mqttState, setMqttState] = useState('off'); // off|connecting|on|error
  const mqttRef = useRef(null);

  function flash(m) { setToast(m); setTimeout(() => setToast(''), 2600); }

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
    return onSnapshot(
      collection(fb.current.db, 'device_registry'),
      (qs) => setRegistry(qs.docs.map((d) => {
        const x = d.data();
        return {
          serial: d.id,
          ownerEmail: x.ownerEmail || '',
          board: x.board || '',
          unitName: x.unitName || '',
          licensed: x.licensed === true,
          licenseRequested: x.licenseRequested === true,
          licensedAt: toDate(x.licensedAt) || toDate(x.createdAt),
          lastSeen: toDate(x.lastSeen),
        };
      })),
      (e) => flash('خطأ قراءة: ' + e.code),
    );
  }, [user]);

  // ---- MQTT live fleet (auto-connect) ----
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
        username: 'test', password: '123456', reconnectPeriod: 4000, connectTimeout: 8000,
      });
      mqttRef.current = c;
      c.on('connect', () => {
        setMqttState('on');
        ['+/+/state', '+/state', '+/+/status', '+/status'].forEach((t) => c.subscribe(t));
      });
      c.on('error', () => setMqttState('error'));
      c.on('close', () => setMqttState((s) => (s === 'on' ? 'off' : s)));
      c.on('message', (topic, payload) => {
        let j; try { j = JSON.parse(payload.toString()); } catch { return; }
        const serial = j.device || j.serial || topic.split('/').slice(-2, -1)[0];
        if (!serial) return;
        if (topic.endsWith('/status')) {
          setLiveStatus((m) => ({ ...m, [serial]: j.status === 'online' }));
        } else if (topic.endsWith('/state')) {
          const type = j.type === 'power' ? 'power' : j.type === 'lock' ? 'lock' : 'relay';
          const channels = type === 'power'
            ? (Array.isArray(j.meters) ? j.meters.length : null)
            : (Array.isArray(j.states) ? j.states.length : null);
          setLiveState((m) => ({
            ...m,
            [serial]: {
              name: j.project || j.name || '', board: j.board || '', type, channels,
              fw: j.fw != null ? String(j.fw) : '', ip: j.ip || '', rssi: j.rssi,
              boardLicensed: j.licensed === true,
            },
          }));
        }
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
    } catch { setAuthErr('بيانات الدخول غلط أو الحساب غير موجود.'); }
    finally { setBusy(false); }
  }

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

  // ---- merge registry + live ----
  const devices = useMemo(() => {
    const map = new Map();
    for (const r of registry) map.set(r.serial, { ...r, inRegistry: true });
    for (const [serial, s] of Object.entries(liveState)) {
      const cur = map.get(serial) || { serial, inRegistry: false, licensed: s.boardLicensed, licensedAt: null, licenseRequested: false, ownerEmail: '', unitName: '', lastSeen: null };
      map.set(serial, { ...cur, live: s });
    }
    const arr = [...map.values()].map((d) => ({
      ...d,
      name: d.unitName || d.live?.name || '',
      board: d.live?.board || d.board || '',
      type: d.live?.type || 'relay',
      online: serialOnline(d.serial, liveStatus, d.lastSeen),
    }));
    arr.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      if (a.licensed !== b.licensed) return a.licensed ? 1 : -1;
      return a.serial.localeCompare(b.serial);
    });
    return arr;
  }, [registry, liveState, liveStatus]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return devices;
    return devices.filter((d) =>
      d.serial.toLowerCase().includes(t) ||
      (d.ownerEmail || '').toLowerCase().includes(t) ||
      (d.name || '').toLowerCase().includes(t));
  }, [devices, q]);

  const stats = useMemo(() => ({
    total: devices.length,
    licensed: devices.filter((d) => d.licensed).length,
    pending: devices.filter((d) => !d.licensed && d.licenseRequested).length,
    online: devices.filter((d) => d.online).length,
  }), [devices]);

  const selected = sel ? devices.find((d) => d.serial === sel) : null;

  // ---- render ----
  if (!authChecked) return <div className="ops"><div className="ops-center">جارٍ التحميل…</div></div>;

  if (!isAdmin(user)) {
    return (
      <div className="ops">
        <div className="ops-center">
          <form className="ops-login" onSubmit={login}>
            <div className="ops-seal"><Lock /></div>
            <h1>لوحة العمليات</h1>
            <p>دخول مصرّح به — أدمن كوش سمارت</p>
            <input type="email" placeholder="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            <input type="password" placeholder="كلمة السر" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
            {authErr && <div className="ops-err">{authErr}</div>}
            <button className="ops-btn lg" disabled={busy} type="submit">{busy ? '…' : 'دخول'}</button>
          </form>
        </div>
      </div>
    );
  }

  const conn = mqttState === 'on' ? 'البث الحيّ متصل' : mqttState === 'connecting' ? 'جارٍ الاتصال…' : mqttState === 'error' ? 'البث الحيّ غير متاح' : 'غير متصل';

  return (
    <div className="ops">
      {/* command bar */}
      <header className="ops-bar">
        <div className="ops-id"><span className="ops-mark"><Lock /></span><b>KUSH</b> OPS<span className="ops-sub">لوحة العمليات</span></div>
        <button className={`ops-link ${mqttState}`} onClick={() => setMqttEdit((v) => !v)} title="حالة البث الحيّ">
          <span className={`led ${mqttState}`} />{conn}
        </button>
        <div className="ops-id-r">
          <span className="ops-who">{user.email}</span>
          <button className="ops-ghost" onClick={() => signOut(fb.current.auth)}>خروج</button>
        </div>
      </header>

      {mqttEdit && (
        <div className="ops-mbar">
          <span>عنوان البث (MQTT / WSS)</span>
          <input value={mqttUrl} onChange={(e) => setMqttUrl(e.target.value)} placeholder="wss://broker/mqtt" />
          <button className="ops-btn sm" onClick={saveMqtt}>اتصال</button>
          <small>لو البث مش متاح، الحالة بتتحسب من آخر ظهور للجهاز.</small>
        </div>
      )}

      <main className="ops-main">
        {/* readouts */}
        <div className="ops-kpis">
          <Kpi Ic={Cpu} n={stats.total} label="الأسطول" />
          <Kpi Ic={Lock} n={stats.licensed} label="مرخّصة" tone="ok" />
          <Kpi Ic={Bell} n={stats.pending} label="طلبات ترخيص" tone="warn" />
          <Kpi Ic={Signal} n={stats.online} label="متصلة الآن" tone="live" />
        </div>

        {/* command row */}
        <div className="ops-cmd">
          <div className="ops-search">
            <span className="prompt">›</span>
            <input
              placeholder="ابحث عن جهاز… سيريال / إيميل / اسم"
              value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && filtered.length) setSel(filtered[0].serial); }}
            />
            {q && <span className="hits">{filtered.length}</span>}
          </div>
          <div className="ops-add">
            <input placeholder="SERIAL" value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLicense()} />
            <button className="ops-btn" onClick={addLicense}>+ ترخيص</button>
          </div>
        </div>

        {/* fleet */}
        <div className="ops-grid">
          <div className="ops-row ops-head">
            <span>الحالة</span><span>السيريال</span><span>الوحدة</span><span>النوع</span><span>الترخيص</span><span></span>
          </div>
          {filtered.map((d) => {
            const t = TYPE[d.type] || TYPE.relay;
            return (
              <button key={d.serial} className={`ops-row ${sel === d.serial ? 'sel' : ''}`} onClick={() => setSel(d.serial)}>
                <span className="c-stat"><span className={`led ${d.online ? 'on' : 'off'}`} />{d.online ? 'متصل' : 'غير متصل'}</span>
                <span className="c-serial mono">{d.serial}</span>
                <span className="c-unit"><b>{d.name || '—'}</b><small>{d.ownerEmail || (d.inRegistry ? '—' : 'غير مسجّل')}</small></span>
                <span className="c-type"><t.Ic /> {t.label}{d.live?.channels != null ? ` · ${d.live.channels}` : ''}</span>
                <span className="c-lic">
                  {d.licensed
                    ? <span className="seal ok">مرخّص<i>{rel(d.licensedAt)}</i></span>
                    : d.licenseRequested
                      ? <span className="seal warn">طلب ترخيص</span>
                      : <span className="seal">غير مرخّص</span>}
                </span>
                <span className="c-chev">›</span>
              </button>
            );
          })}
          {!filtered.length && <div className="ops-empty">لا توجد أجهزة مطابقة.</div>}
        </div>
      </main>

      {/* spec-sheet drawer */}
      {selected && (
        <>
          <div className="ops-scrim" onClick={() => setSel(null)} />
          <aside className="ops-drawer">
            <div className="ops-dhead">
              <div>
                <div className="mono ops-dserial">{selected.serial}</div>
                <div className="ops-dname">{selected.name || 'وحدة كوش سمارت'}</div>
              </div>
              <button className="ops-x" onClick={() => setSel(null)}>×</button>
            </div>

            <div className="ops-dtags">
              <span className={`led ${selected.online ? 'on' : 'off'}`} />{selected.online ? 'متصل الآن' : 'غير متصل'}
              <span className={`seal ${selected.licensed ? 'ok' : selected.licenseRequested ? 'warn' : ''}`}>
                {selected.licensed ? 'مرخّص' : selected.licenseRequested ? 'طلب ترخيص' : 'غير مرخّص'}
              </span>
            </div>

            <div className="ops-spec">
              <Row k="المالك" v={selected.ownerEmail || '—'} />
              <Row k="النوع" v={(TYPE[selected.type] || TYPE.relay).label} />
              <Row k="البورد" v={selected.board || '—'} mono />
              <Row k="القنوات" v={selected.live?.channels != null ? String(selected.live.channels) : '—'} mono />
              <Row k="الإصدار (fw)" v={selected.live?.fw || '—'} mono />
              <Row k="IP" v={selected.live?.ip || '—'} mono />
              <Row k="الإشارة (RSSI)" v={selected.live?.rssi != null ? `${selected.live.rssi} dBm` : '—'} mono />
              <Row k="مدّة الترخيص" v={selected.licensed ? `بقاله ${rel(selected.licensedAt)}` : '—'} />
              <Row k="تاريخ الترخيص" v={selected.licensedAt ? selected.licensedAt.toLocaleString('ar-EG') : '—'} />
              <Row k="آخر ظهور" v={selected.lastSeen ? rel(selected.lastSeen, ' مضت') : '—'} />
              <Row k="مسجّل في النظام" v={selected.inRegistry ? 'نعم' : 'لا (من البث فقط)'} />
            </div>

            <div className="ops-dact">
              {selected.licensed
                ? <button className="ops-ghost lg" onClick={() => setLicense(selected.serial, false)}>سحب الترخيص</button>
                : <button className="ops-btn lg" onClick={() => setLicense(selected.serial, true)}>منح ترخيص</button>}
            </div>
          </aside>
        </>
      )}

      {toast && <div className="ops-toast">{toast}</div>}
    </div>
  );
}

function Kpi({ Ic, n, label, tone }) {
  return (
    <div className={`kpi ${tone || ''}`}>
      <span className="kpi-ic"><Ic /></span>
      <span className="kpi-n mono">{n}</span>
      <span className="kpi-l">{label}</span>
    </div>
  );
}
function Row({ k, v, mono }) {
  return <div className="ops-srow"><span>{k}</span><span className={mono ? 'mono' : ''}>{v}</span></div>;
}
function serialOnline(serial, liveStatus, lastSeen) {
  if (serial in liveStatus) return liveStatus[serial];
  return !!(lastSeen && Date.now() - lastSeen.getTime() < 90000);
}
