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
// Firmware store + OTA (uploads go to the bridge; units download from /fw/).
const FW_BASE = 'https://smart.kushsmart.space';
const FW_BOARDS = [
  { key: 'smarthome', label: 'المنزل الذكي (ESP32)', match: (d) => d.board === 'ESP32' && d.type === 'relay' },
  { key: 'esp32',     label: 'مفاتيح/إضاءة ESP32',   match: (d) => d.board === 'ESP32' && d.type === 'relay' },
  { key: 'esp8266',   label: 'مفاتيح/إضاءة ESP8266', match: (d) => d.board === 'ESP8266' },
  { key: 'lock',      label: 'القفل الذكي',          match: (d) => d.type === 'lock' },
  { key: 'power',     label: 'عدّاد الطاقة',         match: (d) => d.type === 'power' },
];
// Each firmware file goes into its OWN slot — the SLOT decides the offset, so any
// file works (no filename matching). Filled status comes from meta.slots[key].
const ESP32_SLOTS = [
  { key: 'boot', label: 'Bootloader', hint: '0x1000' },
  { key: 'part', label: 'Partitions', hint: '0x8000' },
  { key: 'oboot', label: 'Boot app0', hint: '0xe000' },
  { key: 'app', label: 'التطبيق', hint: '0x10000' },
];
const ESP8266_SLOTS = [{ key: 'app', label: 'التطبيق', hint: '0x0' }];
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
  const [newAdmin, setNewAdmin] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [usersMap, setUsersMap] = useState({}); // uid -> { name, country }
  const [tab, setTab] = useState('fleet');      // fleet | firmware | invoices | countries | admins
  const [fwIndex, setFwIndex] = useState({});  // board -> { version, url, size, updatedAt }
  const [fwBusy, setFwBusy] = useState('');     // board currently uploading
  const [fwVer, setFwVer] = useState({});       // board -> version input

  // Broadcast notifications
  const [nAudience, setNAudience] = useState('all'); // all | board | user
  const [nBoard, setNBoard] = useState('smarthome');
  const [nEmail, setNEmail] = useState('');
  const [nTitle, setNTitle] = useState('');
  const [nBody, setNBody] = useState('');
  const [nBusy, setNBusy] = useState(false);
  const [nResult, setNResult] = useState(null);

  // Licensing: price the admin sets + buyer requests from the website.
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [priceNote, setPriceNote] = useState('');
  const [priceEnabled, setPriceEnabled] = useState(true);
  const [priceBusy, setPriceBusy] = useState(false);
  const [licReqs, setLicReqs] = useState([]);

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

  // ---- licence price (config/pricing) ----
  useEffect(() => {
    if (!fb.current || !allowed) return;
    return onSnapshot(
      doc(fb.current.db, 'config', 'pricing'),
      (snap) => {
        const x = snap.exists() ? snap.data() : {};
        setPrice(x.price != null ? String(x.price) : '');
        setCurrency(x.currency || 'EGP');
        setPriceNote(x.note || '');
        setPriceEnabled(x.enabled !== false);
      },
      () => {},
    );
  }, [user, allowList]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- licence purchase requests (from the bridge) ----
  useEffect(() => {
    if (allowed) loadLicReqs();
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

  // ---- firmware versions ----
  useEffect(() => {
    if (allowed) loadFwIndex();
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

  // ---- firmware store + OTA ----
  async function loadFwIndex() {
    try {
      const r = await fetch(`${FW_BASE}/firmware/index.json`, { cache: 'no-store' });
      const j = await r.json();
      setFwIndex(j.boards || {});
    } catch (_) { /* offline — leave as-is */ }
  }

  // Upload ONE firmware file INTO a slot (the slot decides the offset, not the
  // file's name — so any file works in any slot).
  async function uploadOneFile(board, slot, file) {
    if (!file) return;
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash('انتهت الجلسة — سجّل الدخول من جديد'); return; }
    setFwBusy(board);
    try {
      const token = await cu.getIdToken();
      const buf = await file.arrayBuffer();
      const r = await fetch(
        `${FW_BASE}/firmware/${board}/file?slot=${encodeURIComponent(slot)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
          body: buf,
        },
      );
      const j = await r.json().catch(() => ({}));
      if (j.ok) { flash(`تم رفع «${file.name}»`); await loadFwIndex(); }
      else if (j.error === 'forbidden') flash('غير مصرّح — الإيميل مش في قائمة أدمن السيرفر');
      else flash('تعذّر الرفع: ' + (j.error || r.status));
    } catch (e) { flash('فشل الرفع: ' + (e?.message || e)); }
    setFwBusy('');
  }

  // Publish the uploaded files: builds the web-flasher manifest + records the
  // version. Enabled only once every slot for the board is filled.
  async function publishFw(board) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash('انتهت الجلسة — سجّل الدخول من جديد'); return; }
    setFwBusy(board);
    try {
      const token = await cu.getIdToken();
      const ver = (fwVer[board] || '').trim();
      const pr = await fetch(
        `${FW_BASE}/firmware/${board}/publish?version=${encodeURIComponent(ver)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      );
      const pj = await pr.json().catch(() => ({}));
      if (pj.ok) flash(`تم النشر — النسخة ${pj.version} ✓`);
      else if (pj.error === 'incomplete')
        flash('ناقص: ' + ((pj.missing || []).join('، ') || 'ملفات البوردة'));
      else flash('فشل النشر: ' + (pj.error || pr.status));
      await loadFwIndex();
    } catch (e) { flash('فشل النشر'); }
    setFwBusy('');
  }

  // Erase a board's published firmware version entirely (all slots + manifest).
  async function deleteFw(board) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash('انتهت الجلسة — سجّل الدخول من جديد'); return; }
    const meta = fwIndex[board];
    const label = meta && meta.version && meta.version !== '—' ? `النسخة ${meta.version}` : 'هذه النسخة';
    if (!window.confirm(`مسح ${label} لبوردة «${board}»؟ لن تظهر بعدها في التحميل ولا في التطبيق.`)) return;
    setFwBusy(board);
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/firmware/${board}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) flash('تم مسح النسخة ✓');
      else flash('فشل المسح: ' + (j.error || r.status));
      await loadFwIndex();
    } catch (e) { flash('فشل المسح: ' + (e?.message || '')); }
    setFwBusy('');
  }

  // Broadcast a notification to users (server-side FCM via the bridge).
  async function sendBroadcast() {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash('انتهت الجلسة — سجّل الدخول من جديد'); return; }
    if (!nTitle.trim()) { flash('اكتب عنوان الإشعار'); return; }
    if (nAudience === 'user' && !nEmail.trim()) { flash('اكتب بريد المستخدم'); return; }
    const count = nAudience === 'all'
      ? 'كل المستخدمين'
      : nAudience === 'board' ? `أصحاب بوردة «${nBoard}»` : nEmail.trim();
    if (!window.confirm(`إرسال الإشعار إلى ${count}؟`)) return;
    setNBusy(true); setNResult(null);
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/notify/broadcast`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          title: nTitle.trim(), body: nBody.trim(),
          audience: nAudience, board: nBoard, email: nEmail.trim(),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) {
        setNResult(j);
        flash(`تم الإرسال — ${j.sent} إشعار إلى ${j.recipients} مستخدم ✓`);
      } else {
        flash('فشل الإرسال: ' + (j.error || r.status));
      }
    } catch (e) { flash('فشل الإرسال: ' + (e?.message || '')); }
    setNBusy(false);
  }

  // ---- licensing ----
  async function savePricing() {
    if (!fb.current) return;
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) { flash('اكتب سعرًا صحيحًا'); return; }
    setPriceBusy(true);
    try {
      await setDoc(doc(fb.current.db, 'config', 'pricing'), {
        price: p,
        currency: currency.trim() || 'EGP',
        note: priceNote.trim(),
        enabled: priceEnabled,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      flash('تم حفظ السعر ✓');
    } catch (e) { flash('فشل الحفظ: ' + (e?.message || '')); }
    setPriceBusy(false);
  }

  async function loadLicReqs() {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) return;
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/license/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (Array.isArray(j.requests)) setLicReqs(j.requests);
    } catch (_) {}
  }

  async function setReqStatus(id, status) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) return;
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/license/requests/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) { setLicReqs((v) => v.map((x) => (x.id === id ? { ...x, status } : x))); }
      else flash('فشل التحديث: ' + (j.error || r.status));
    } catch (e) { flash('فشل التحديث'); }
  }

  // Notify the owners of a board that a new firmware version is out — a polished
  // message with the version, so they open the app and pull the update.
  async function announceUpdate(b) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash('انتهت الجلسة — سجّل الدخول من جديد'); return; }
    const meta = fwIndex[b.key];
    if (!meta || !meta.complete) { flash('انشر نسخة أولاً'); return; }
    const ver = meta.version;
    if (!window.confirm(`إبلاغ كل أصحاب «${b.label}» بالتحديث الجديد (النسخة ${ver})؟`)) return;
    setFwBusy(b.key);
    try {
      const token = await cu.getIdToken();
      const title = `تحديث جديد متاح لـ ${b.label} 🎉`;
      const body =
        `يسرّنا إصدار النسخة ${ver} من كوش سمارت لجهازك «${b.label}» — بأداء أفضل ومزايا جديدة.\n`
        + `للتحديث: افتح التطبيق ← اضغط مطوّلًا على الجهاز ← «فحص التحديث» ← «تحديث». يتم كل شيء لاسلكيًا وتبقى إعداداتك كما هي.`;
      const r = await fetch(`${FW_BASE}/notify/broadcast`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title, body, audience: 'board', board: b.key }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) flash(`تم إبلاغ ${j.recipients} مستخدم بالنسخة ${ver} ✓`);
      else flash('فشل الإرسال: ' + (j.error || r.status));
    } catch (e) { flash('فشل الإرسال: ' + (e?.message || '')); }
    setFwBusy('');
  }

  // Publish the OTA command to every online device that runs this board's firmware.
  function pushOta(board) {
    const meta = fwIndex[board];
    if (!meta || !meta.url) { flash('ارفع الفيرموير أولاً'); return; }
    const c = mqttRef.current;
    if (!c || mqttState !== 'on') { flash('اتصل بالبث الحيّ (kushadmin) أولاً'); return; }
    const bd = FW_BOARDS.find((b) => b.key === board);
    const targets = devices.filter((d) => bd.match(d) && d.online && d.owner);
    if (!targets.length) { flash('لا توجد أجهزة متصلة مطابقة'); return; }
    if (!window.confirm(`إرسال تحديث «${meta.version}» إلى ${targets.length} جهاز؟`)) return;
    let n = 0;
    for (const d of targets) {
      c.publish(`${d.owner}/${d.serial}/update`,
        JSON.stringify({ url: meta.url, version: meta.version }));
      n++;
    }
    flash(`تم إرسال التحديث إلى ${n} جهاز`);
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
          <span className="ops-who">{user.email}</span>
          <button className="ops-ghost" onClick={() => signOut(fb.current.auth)}>خروج</button>
        </div>
      </header>

      {/* primary tabs */}
      <nav className="ops-tabs">
        {[
          ['fleet', 'الأسطول', stats.total],
          ['firmware', 'التحديثات', null],
          ['notify', 'الإشعارات', null],
          ['license', 'الترخيص', licReqs.filter((r) => r.status === 'new').length || null],
          ['invoices', 'الفواتير', invoices.length || null],
          ['countries', 'الدول', byCountry.length || null],
          ['admins', 'المسؤولون', null],
        ].map(([k, label, n]) => (
          <button key={k} className={`ops-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {label}{n != null && <span className="ops-tab-n">{n}</span>}
          </button>
        ))}
      </nav>

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
        {tab === 'fleet' && (<>
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
        </>)}

        {tab === 'firmware' && (
          <section className="ops-panel">
            <div className="ops-panel-h">
              <div>
                <h2>التحديثات والفيرموير</h2>
                <p>ارفع نسخة السوفت وير لكل بوردة، وحدّث الأجهزة المتصلة لاسلكيًا بضغطة.</p>
              </div>
              <button className="ops-ghost sm" onClick={loadFwIndex}>↻ تحديث</button>
            </div>
            <div className="fw-cards">
              {FW_BOARDS.map((b) => {
                const meta = fwIndex[b.key];
                const st = (meta && meta.slots) || {};
                const slots = b.key === 'esp8266' ? ESP8266_SLOTS : ESP32_SLOTS;
                const filled = slots.filter((s) => st[s.key]).length;
                const ready = filled === slots.length;
                const online = devices.filter((d) => b.match(d) && d.online && d.owner).length;
                const busy = fwBusy === b.key;
                return (
                  <div className="fw-card" key={b.key}>
                    <div className="fw-card-h">
                      <b>{b.label}</b>
                      <span className={`seal ${meta && meta.complete ? 'ok' : ''}`}>
                        {meta && meta.complete ? `النسخة ${meta.version}` : `${filled}/${slots.length}`}
                      </span>
                    </div>

                    {/* one slot per file — pick each on its own (any file fits) */}
                    <div className="fw-slots">
                      {slots.map((s) => {
                        const done = !!st[s.key];
                        return (
                          <label className={`fw-slot ${done ? 'done' : ''} ${busy ? 'busy' : ''}`} key={s.key}>
                            <span className="fw-slot-l">
                              <span className="fw-slot-c">{done ? '✓' : '+'}</span>
                              {s.label}
                            </span>
                            <span className="fw-slot-v">{done ? 'تم الرفع' : `اختر ملف · ${s.hint}`}</span>
                            <input type="file" style={{ display: 'none' }} disabled={busy}
                              onChange={(e) => { uploadOneFile(b.key, s.key, e.target.files?.[0]); e.target.value = ''; }} />
                          </label>
                        );
                      })}
                    </div>

                    <div className="fw-card-act">
                      <input placeholder="النسخة (مثال 4.2)" value={fwVer[b.key] || ''}
                        onChange={(e) => setFwVer((v) => ({ ...v, [b.key]: e.target.value }))} />
                      <button className="ops-btn sm" disabled={!ready || busy} onClick={() => publishFw(b.key)}>
                        {busy ? '…' : 'نشر النسخة'}
                      </button>
                      <button className="ops-annc" disabled={!(meta && meta.complete) || busy} onClick={() => announceUpdate(b)} title="إرسال إشعار للمستخدمين بالتحديث الجديد">
                        🔔 أبلغ بالتحديث
                      </button>
                      <button className="ops-ota" disabled={!(meta && meta.complete) || !online} onClick={() => pushOta(b.key)} title="دفع التحديث الآن للأجهزة المتصلة عبر البثّ الحيّ">
                        تحديث {online} جهاز
                      </button>
                      <button className="ops-del" disabled={!filled || busy} onClick={() => deleteFw(b.key)} title="مسح هذه النسخة">
                        🗑 مسح
                      </button>
                    </div>
                    {meta && meta.complete && (
                      <div className="fw-card-meta">
                        منشور · <a href={meta.manifestUrl} target="_blank" rel="noreferrer">manifest</a>
                        {meta.updatedAt ? ` · ${new Date(meta.updatedAt).toLocaleDateString('ar')}` : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="ops-note">
              ارفع <b>كل ملف في خانته</b> ثم اكتب رقم النسخة واضغط <b>«نشر النسخة»</b>. بعد النشر:
              <br /><b>🔔 أبلغ بالتحديث</b> — يبعت إشعارًا احترافيًا بالنسخة الجديدة لكل أصحاب البوردة، فيفتحون التطبيق ويحدّثون بأنفسهم (الطريقة المفضّلة).
              <br /><b>تحديث N جهاز</b> — يدفع التحديث فورًا للأجهزة المتصلة الآن عبر البثّ الحيّ (يتطلّب حساب <b>kushadmin</b>).
            </div>
          </section>
        )}

        {tab === 'notify' && (
          <section className="ops-panel">
            <div className="ops-panel-h">
              <div>
                <h2>الإشعارات</h2>
                <p>ابعت إشعارًا للمستخدمين — إعلان، عرض ترويجي، أو تنبيه بتحديث جديد. يصل حتى والتطبيق مغلق.</p>
              </div>
            </div>

            <div className="nt-wrap">
              {/* Audience */}
              <label className="nt-label">إلى مَن؟</label>
              <div className="nt-aud">
                {[
                  ['all', 'كل المستخدمين', 'كل من ثبّت التطبيق'],
                  ['board', 'أصحاب بوردة', 'من عنده جهاز بهذه البوردة'],
                  ['user', 'مستخدم محدّد', 'عبر البريد الإلكتروني'],
                ].map(([k, t, d]) => (
                  <button key={k} type="button"
                    className={`nt-aud-b ${nAudience === k ? 'active' : ''}`}
                    onClick={() => setNAudience(k)}>
                    <b>{t}</b><small>{d}</small>
                  </button>
                ))}
              </div>

              {nAudience === 'board' && (
                <div className="nt-row">
                  <label className="nt-label">البوردة</label>
                  <select className="nt-input" value={nBoard} onChange={(e) => setNBoard(e.target.value)}>
                    <option value="smarthome">المنزل الذكي (ESP32)</option>
                    <option value="esp32">مفاتيح وإضاءة — ESP32</option>
                    <option value="esp8266">مفاتيح وإضاءة — ESP8266</option>
                    <option value="lock">القفل الذكي</option>
                    <option value="power">عدّاد الطاقة</option>
                  </select>
                </div>
              )}
              {nAudience === 'user' && (
                <div className="nt-row">
                  <label className="nt-label">بريد المستخدم</label>
                  <input className="nt-input" type="email" dir="ltr" placeholder="user@example.com"
                    value={nEmail} onChange={(e) => setNEmail(e.target.value)} />
                </div>
              )}

              <label className="nt-label">العنوان</label>
              <input className="nt-input" placeholder="مثال: تحديث جديد متاح 🎉" maxLength={80}
                value={nTitle} onChange={(e) => setNTitle(e.target.value)} />

              <label className="nt-label">النص</label>
              <textarea className="nt-input nt-area" rows={4} maxLength={400}
                placeholder="اكتب نص الإشعار هنا…"
                value={nBody} onChange={(e) => setNBody(e.target.value)} />

              {/* Live preview */}
              <div className="nt-preview">
                <span className="nt-preview-ic">🔔</span>
                <div>
                  <b>{nTitle.trim() || 'عنوان الإشعار'}</b>
                  <p>{nBody.trim() || 'نص الإشعار سيظهر هنا…'}</p>
                </div>
              </div>

              <div className="nt-actions">
                <button className="ops-btn" disabled={nBusy} onClick={sendBroadcast}>
                  {nBusy ? 'جارٍ الإرسال…' : '📣 إرسال الإشعار'}
                </button>
                {nResult && (
                  <span className="nt-result">
                    تم إرسال <b>{nResult.sent}</b> إشعار إلى <b>{nResult.recipients}</b> مستخدم
                    {nResult.failed ? ` · فشل ${nResult.failed}` : ''}
                  </span>
                )}
              </div>
              <div className="ops-note">
                الإشعارات تُرسَل من السيرفر مباشرةً (FCM) لكل الأجهزة المسجّلة للمستخدمين المستهدفين. التوكنات غير الصالحة تُنظَّف تلقائيًا.
              </div>
            </div>
          </section>
        )}

        {tab === 'license' && (
          <section className="ops-panel">
            <div className="ops-panel-h">
              <div>
                <h2>الترخيص والتسعير</h2>
                <p>حدّد سعر الترخيص المعروض على الموقع، وراجع طلبات الشراء الواردة.</p>
              </div>
              <button className="ops-ghost sm" onClick={loadLicReqs}>↻ تحديث</button>
            </div>

            {/* Price setter */}
            <div className="lic-price">
              <div className="lic-price-row">
                <div className="lic-fld">
                  <label>السعر</label>
                  <input type="number" min="0" step="1" value={price} placeholder="0"
                    onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="lic-fld lic-fld-sm">
                  <label>العملة</label>
                  <input value={currency} placeholder="EGP"
                    onChange={(e) => setCurrency(e.target.value)} />
                </div>
                <div className="lic-fld">
                  <label>ملاحظة (اختياري)</label>
                  <input value={priceNote} placeholder="مثال: ترخيص دائم لكل جهاز"
                    onChange={(e) => setPriceNote(e.target.value)} />
                </div>
              </div>
              <label className="lic-check">
                <input type="checkbox" checked={priceEnabled}
                  onChange={(e) => setPriceEnabled(e.target.checked)} />
                إظهار السعر وزر الشراء على الموقع
              </label>
              <div className="lic-price-act">
                <button className="ops-btn" disabled={priceBusy} onClick={savePricing}>
                  {priceBusy ? 'جارٍ الحفظ…' : 'حفظ السعر'}
                </button>
                {price && (
                  <span className="lic-preview">المعروض: <b>{price} {currency}</b></span>
                )}
              </div>
            </div>

            {/* Requests */}
            <h3 className="lic-h">طلبات الشراء ({licReqs.length})</h3>
            {licReqs.length === 0 ? (
              <div className="ops-empty">لا توجد طلبات بعد.</div>
            ) : (
              <div className="lic-reqs">
                {licReqs.map((r) => (
                  <div className={`lic-req st-${r.status}`} key={r.id}>
                    <div className="lic-req-h">
                      <b>{r.name || '—'}</b>
                      <span className={`lic-badge b-${r.status}`}>
                        {r.status === 'new' ? 'جديد' : r.status === 'contacted' ? 'تم التواصل'
                          : r.status === 'done' ? 'مكتمل' : 'مرفوض'}
                      </span>
                    </div>
                    <div className="lic-req-meta">
                      {r.email && <span>✉️ <a href={`mailto:${r.email}`}>{r.email}</a></span>}
                      {r.phone && <span>📞 <a href={`tel:${r.phone}`}>{r.phone}</a></span>}
                      {r.qty > 1 && <span>الكمية: {r.qty}</span>}
                      {r.serial && <span>الجهاز: <code>{r.serial}</code></span>}
                    </div>
                    {r.message && <p className="lic-req-msg">{r.message}</p>}
                    <div className="lic-req-act">
                      <button onClick={() => setReqStatus(r.id, 'contacted')}>تم التواصل</button>
                      <button onClick={() => setReqStatus(r.id, 'done')}>مكتمل</button>
                      <button className="danger" onClick={() => setReqStatus(r.id, 'rejected')}>رفض</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'invoices' && (
          <section className="ops-panel">
            <div className="ops-panel-h">
              <div><h2>الفواتير</h2><p>سجلّ عمليات شراء وتفعيل التراخيص ({invoices.length}).</p></div>
            </div>
            <div className="ops-list">
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
          </section>
        )}

        {tab === 'countries' && (
          <section className="ops-panel">
            <div className="ops-panel-h">
              <div><h2>الأجهزة حسب الدولة</h2><p>توزيع الأسطول على الدول.</p></div>
            </div>
            <div className="ops-list">
              {byCountry.map(([c, n]) => (
                <div className="ops-admin" key={c}><span>{c}</span><span className="seal ok">{n} جهاز</span></div>
              ))}
              {!byCountry.length && <div className="ops-empty" style={{ border: 0 }}>لا توجد بيانات.</div>}
            </div>
          </section>
        )}

        {tab === 'admins' && (
          <section className="ops-panel">
            <div className="ops-panel-h">
              <div><h2>إدارة المسؤولين</h2><p>مين يقدر يدخل لوحة العمليات.</p></div>
            </div>
            <div className="ops-add" style={{ marginBottom: 14 }}>
              <input style={{ flex: 1, width: 'auto', textAlign: 'start', direction: 'ltr', fontFamily: 'inherit' }}
                placeholder="admin@email.com" value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAdmin()} />
              <button className="ops-btn" onClick={addAdmin}>إضافة</button>
            </div>
            <div className="ops-list">
              {ADMIN_EMAILS.map((em) => (
                <div className="ops-admin" key={em}><span className="mono">{em}</span><span className="seal">أساسي</span></div>
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
            <div className="ops-note">الإيميلات «الأساسية» ثابتة في الكود. الباقي يُسجَّل في Firestore: <span className="mono">config/admins</span>.</div>
          </section>
        )}
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
