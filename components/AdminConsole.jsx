'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { initFirebase, ADMIN_EMAILS } from '@/lib/firebase';
import { Cpu, Lock, Bell, Signal, Bolt, Bulb } from '@/components/Icons';

const DEFAULT_MQTT = 'wss://smart.kushsmart.space/mqtt';
// Bootstrap super-admins (always allowed, can't be locked out). Everyone else is
// managed live from Firestore: config/admins { emails: [...] }.
const isBootstrap = (u) => !!u && ADMIN_EMAILS.includes((u.email || '').toLowerCase());
const isAllowed = (u, list) =>
  isBootstrap(u) || (!!u && (list || []).includes((u.email || '').toLowerCase()));
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
  const [allowList, setAllowList] = useState(null); // null=loading, []=loaded
  const [showAdmins, setShowAdmins] = useState(false);
  const [newAdmin, setNewAdmin] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [showInvoices, setShowInvoices] = useState(false);
  const [usersMap, setUsersMap] = useState({}); // uid -> { name, country }
  const [showCountries, setShowCountries] = useState(false);

  const [mqttUrl, setMqttUrl] = useState(DEFAULT_MQTT);
  // Admin MQTT login (the `kushadmin` master account). Kept ONLY in the admin's
  // browser (localStorage), never baked into the public bundle.
  const [mqttUser, setMqttUser] = useState('');
  const [mqttPass, setMqttPass] = useState('');
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
      setMqttUser(window.localStorage.getItem('adm_mqtt_user') || '');
      setMqttPass(window.localStorage.getItem('adm_mqtt_pass') || '');
    }
    return onAuthStateChanged(fb.current.auth, (u) => { setUser(u); setAuthChecked(true); });
  }, []);

  // ---- admin allowlist (live from Firestore: config/admins) ----
  useEffect(() => {
    if (!fb.current || !user) { setAllowList(null); return; }
    return onSnapshot(
      doc(fb.current.db, 'config', 'admins'),
      (snap) => {
        const arr = (snap.exists() && Array.isArray(snap.data().emails)) ? snap.data().emails : [];
        setAllowList(arr.map((e) => String(e).toLowerCase()));
      },
      () => setAllowList([]), // can't read it → only bootstrap admins get in
    );
  }, [user]);

  const allowed = isAllowed(user, allowList);

  // ---- registry stream (auto) ----
  useEffect(() => {
    if (!fb.current || !allowed) return;
    return onSnapshot(
      collection(fb.current.db, 'device_registry'),
      (qs) => setRegistry(qs.docs.map((d) => {
        const x = d.data();
        return {
          serial: d.id,
          owner: x.owner || '',          // owner uid → used to look up name + country
          country: x.country || '',      // fallback if set directly on the device doc
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowList]);

  // ---- invoices / purchases stream ----
  useEffect(() => {
    if (!fb.current || !allowed) return;
    return onSnapshot(
      collection(fb.current.db, 'license_purchases'),
      (qs) => {
        const list = qs.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            serial: x.serial || '',
            platform: x.platform || 'google',
            amount: x.amount || '',
            by: x.by || '',
            test: x.test === true,
            verified: x.verified === true,
            needsReview: x.needsReview === true,
            at: toDate(x.createdAt),
          };
        });
        list.sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
        setInvoices(list);
      },
      () => {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowList]);

  // ---- users (names + countries) ----
  useEffect(() => {
    if (!fb.current || !allowed) return;
    return onSnapshot(
      collection(fb.current.db, 'users'),
      (qs) => {
        const m = {};
        qs.docs.forEach((d) => {
          const x = d.data();
          m[d.id] = { name: x.name || x.full_name || '', country: x.country || '' };
        });
        setUsersMap(m);
      },
      (e) => flash('تعذّر قراءة المستخدمين: ' + e.code),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowList]);

  // ---- MQTT live fleet (auto-connect) ----
  useEffect(() => {
    if (!allowed) return;
    connectMqtt(mqttUrl, mqttUser, mqttPass);
    return () => { mqttRef.current?.end(true); mqttRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowList]);

  function connectMqtt(url, user, pass) {
    mqttRef.current?.end(true);
    setMqttState('connecting');
    import('mqtt').then((mqtt) => {
      const opts = { reconnectPeriod: 4000, connectTimeout: 8000 };
      if (user) { opts.username = user; opts.password = pass; }
      const c = mqtt.default.connect(url, opts);
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
              owner: topic.split('/')[0] || '', // first topic segment is the owner uid
            },
          }));
        }
      });
    }).catch(() => setMqttState('error'));
  }

  function saveMqtt() {
    window.localStorage.setItem('adm_mqtt_url', mqttUrl);
    window.localStorage.setItem('adm_mqtt_user', mqttUser);
    window.localStorage.setItem('adm_mqtt_pass', mqttPass);
    setMqttEdit(false);
    connectMqtt(mqttUrl, mqttUser, mqttPass);
  }

  async function login(e) {
    e.preventDefault(); setAuthErr(''); setBusy(true);
    try {
      await signInWithEmailAndPassword(fb.current.auth, email.trim(), pass);
      // Authorization is decided after sign-in against the live allowlist.
    } catch { setAuthErr('بيانات الدخول غلط أو الحساب غير موجود.'); }
    finally { setBusy(false); }
  }

  async function addAdmin() {
    const em = newAdmin.trim().toLowerCase();
    if (!em || !em.includes('@')) return;
    try {
      await setDoc(doc(fb.current.db, 'config', 'admins'), { emails: arrayUnion(em) }, { merge: true });
      setNewAdmin(''); flash(`تمت إضافة ${em}`);
    } catch (e) { flash('فشل: ' + e.code); }
  }
  async function removeAdmin(em) {
    try {
      await setDoc(doc(fb.current.db, 'config', 'admins'), { emails: arrayRemove(em) }, { merge: true });
      flash(`تم حذف ${em}`);
    } catch (e) { flash('فشل: ' + e.code); }
  }

  async function setLicense(serial, value) {
    try {
      await setDoc(
        doc(fb.current.db, 'device_registry', serial),
        value ? { licensed: true, licensedAt: serverTimestamp(), licenseRequested: false }
              : { licensed: false },
        { merge: true },
      );
      // Admin activation → issue an invoice marked as admin-made.
      if (value) {
        try {
          await addDoc(collection(fb.current.db, 'license_purchases'), {
            serial,
            productId: 'kushsmart_license',
            platform: 'admin',
            by: user.email,
            amount: 'admin',
            verified: true,
            createdAt: serverTimestamp(),
          });
        } catch (_) {}
      }
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
    const arr = [...map.values()].map((d) => {
      const owner = d.owner || d.live?.owner || '';
      const u = usersMap[owner] || {};
      return {
        ...d,
        owner,
        name: d.unitName || d.live?.name || '',
        board: d.live?.board || d.board || '',
        type: d.live?.type || 'relay',
        ownerName: u.name || '',
        // device's own country field first, then the owner account's country.
        country: d.country || u.country || '',
        online: serialOnline(d.serial, liveStatus, d.lastSeen),
      };
    });
    arr.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      if (a.licensed !== b.licensed) return a.licensed ? 1 : -1;
      return a.serial.localeCompare(b.serial);
    });
    return arr;
  }, [registry, liveState, liveStatus, usersMap]);

  // Devices grouped by country (for the "by country" view).
  const byCountry = useMemo(() => {
    const m = {};
    for (const d of devices) {
      const c = d.country || 'غير معروف';
      m[c] = (m[c] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [devices]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return devices;
    return devices.filter((d) =>
      d.serial.toLowerCase().includes(t) ||
      (d.ownerEmail || '').toLowerCase().includes(t) ||
      (d.ownerName || '').toLowerCase().includes(t) ||
      (d.country || '').toLowerCase().includes(t) ||
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

  if (!user) {
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

  if (allowList === null) return <div className="ops"><div className="ops-center">جارٍ التحقّق من الصلاحية…</div></div>;

  if (!allowed) {
    return (
      <div className="ops">
        <div className="ops-center">
          <form className="ops-login" onSubmit={(e) => e.preventDefault()}>
            <div className="ops-seal"><Lock /></div>
            <h1>غير مصرّح</h1>
            <p>الحساب <span className="mono">{user.email}</span> مش مضاف لقائمة الأدمن.</p>
            <button className="ops-ghost lg" onClick={() => signOut(fb.current.auth)}>تسجيل خروج</button>
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
          <button className="ops-ghost" onClick={() => setShowCountries(true)}>الدول</button>
          <button className="ops-ghost" onClick={() => setShowInvoices(true)}>الفواتير</button>
          <button className="ops-ghost" onClick={() => setShowAdmins(true)}>المسؤولون</button>
          <span className="ops-who">{user.email}</span>
          <button className="ops-ghost" onClick={() => signOut(fb.current.auth)}>خروج</button>
        </div>
      </header>

      {mqttEdit && (
        <div className="ops-mbar">
          <span>عنوان البث (MQTT / WSS)</span>
          <input value={mqttUrl} onChange={(e) => setMqttUrl(e.target.value)} placeholder="wss://broker/mqtt" />
          <span>حساب الأدمن</span>
          <input value={mqttUser} onChange={(e) => setMqttUser(e.target.value)} placeholder="kushadmin" autoComplete="off" />
          <input type="password" value={mqttPass} onChange={(e) => setMqttPass(e.target.value)} placeholder="كلمة سر الأدمن" autoComplete="new-password" />
          <button className="ops-btn sm" onClick={saveMqtt}>اتصال</button>
          <small>أدخل حساب <b>kushadmin</b> لترى بثّ كل الأجهزة مباشرةً. يُحفظ في متصفّحك فقط. لو البث غير متاح، تُحسب الحالة من آخر ظهور.</small>
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
                <span className="c-unit"><b>{d.name || '—'}</b><small>{[d.ownerName, d.country].filter(Boolean).join(' · ') || d.ownerEmail || (d.inRegistry ? '—' : 'غير مسجّل')}</small></span>
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
              <Row k="المالك" v={selected.ownerName || selected.ownerEmail || '—'} />
              <Row k="الإيميل" v={selected.ownerEmail || '—'} />
              <Row k="الدولة" v={selected.country || '—'} />
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

      {/* devices by country */}
      {showCountries && (
        <>
          <div className="ops-scrim" onClick={() => setShowCountries(false)} />
          <aside className="ops-drawer">
            <div className="ops-dhead">
              <div>
                <div className="ops-dserial">الأجهزة حسب الدولة</div>
                <div className="ops-dname">توزيع الأسطول على الدول</div>
              </div>
              <button className="ops-x" onClick={() => setShowCountries(false)}>×</button>
            </div>
            <div className="ops-admins">
              {byCountry.map(([c, n]) => (
                <div className="ops-admin" key={c}>
                  <span>{c}</span>
                  <span className="seal ok">{n} جهاز</span>
                </div>
              ))}
              {!byCountry.length && <div className="ops-empty" style={{ border: 0 }}>لا توجد بيانات.</div>}
            </div>
          </aside>
        </>
      )}

      {/* invoices / purchases */}
      {showInvoices && (
        <>
          <div className="ops-scrim" onClick={() => setShowInvoices(false)} />
          <aside className="ops-drawer">
            <div className="ops-dhead">
              <div>
                <div className="ops-dserial">الفواتير</div>
                <div className="ops-dname">سجلّ عمليات شراء وتفعيل التراخيص ({invoices.length})</div>
              </div>
              <button className="ops-x" onClick={() => setShowInvoices(false)}>×</button>
            </div>
            <div className="ops-admins">
              {invoices.map((v) => {
                const plat = v.platform === 'admin' ? 'الأدمن'
                  : v.platform === 'apple' ? 'App Store'
                  : v.platform === 'test' || v.test ? 'تجريبي' : 'Google Play';
                return (
                  <div className="ops-inv" key={v.id}>
                    <div className="ops-inv-top">
                      <button className="ops-inv-serial mono" title="نسخ السيريال"
                        onClick={() => { navigator.clipboard?.writeText(v.serial); flash('تم نسخ السيريال'); }}>
                        {v.serial || '—'}
                      </button>
                      <span className={`seal ${v.verified ? 'ok' : v.needsReview ? 'warn' : ''}`}>
                        {v.verified ? 'مفعّل' : v.needsReview ? 'مراجعة' : 'معلّق'}
                      </span>
                    </div>
                    <div className="ops-inv-meta">
                      <span className="chip">{plat}</span>
                      {v.amount && v.amount !== 'admin' && <span>{v.amount}</span>}
                      {v.by && <span>بواسطة {v.by}</span>}
                      <span style={{ marginInlineStart: 'auto' }}>{v.at ? v.at.toLocaleString('ar-EG') : '—'}</span>
                    </div>
                  </div>
                );
              })}
              {!invoices.length && <div className="ops-empty" style={{ border: 0 }}>مفيش فواتير بعد.</div>}
            </div>
          </aside>
        </>
      )}

      {/* admins management */}
      {showAdmins && (
        <>
          <div className="ops-scrim" onClick={() => setShowAdmins(false)} />
          <aside className="ops-drawer">
            <div className="ops-dhead">
              <div>
                <div className="ops-dserial">إدارة المسؤولين</div>
                <div className="ops-dname">مين يقدر يدخل لوحة العمليات</div>
              </div>
              <button className="ops-x" onClick={() => setShowAdmins(false)}>×</button>
            </div>

            <div className="ops-add" style={{ width: '100%' }}>
              <input style={{ flex: 1, width: 'auto', textAlign: 'start', direction: 'ltr', fontFamily: 'inherit' }}
                placeholder="admin@email.com" value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAdmin()} />
              <button className="ops-btn" onClick={addAdmin}>إضافة</button>
            </div>

            <div className="ops-admins">
              {ADMIN_EMAILS.map((em) => (
                <div className="ops-admin" key={em}>
                  <span className="mono">{em}</span>
                  <span className="seal">أساسي</span>
                </div>
              ))}
              {(allowList || []).filter((em) => !ADMIN_EMAILS.includes(em)).map((em) => (
                <div className="ops-admin" key={em}>
                  <span className="mono">{em}</span>
                  <button className="ops-ghost sm" onClick={() => removeAdmin(em)}>حذف</button>
                </div>
              ))}
              {!(allowList || []).filter((em) => !ADMIN_EMAILS.includes(em)).length && (
                <div className="ops-empty" style={{ border: 0 }}>مفيش مسؤولين إضافيين بعد.</div>
              )}
            </div>
            <small style={{ color: 'var(--o-faint)', fontSize: 12 }}>
              الإيميلات «الأساسية» ثابتة في الكود وماينفعش تتشال من هنا. الباقي بيتسجّل في Firestore: <span className="mono">config/admins</span>.
            </small>
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
