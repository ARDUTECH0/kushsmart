'use client';

import { useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initFirebase } from '@/lib/firebase';

const FW_BASE = 'https://smart.kushsmart.space';
const MQTT_URL = 'wss://smart.kushsmart.space/mqtt';

// Firmware may send the old full-word state keys or the new short ones (see
// "the JSON key-shortening plan" — bridge/registry.js and lib/home.dart do the
// same aliasing). Normalize once at the entry point so the rest of this file
// only ever deals with the familiar long-form field names.
function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const j = { ...raw };
  const alias = (long, short) => {
    if (j[long] === undefined && j[short] !== undefined) j[long] = j[short];
  };
  alias('device', 'd');
  alias('type', 't');
  alias('project', 'pj');
  alias('name', 'n');
  alias('board', 'bd');
  alias('licensed', 'lc');
  alias('states', 'st');
  alias('names', 'nm');
  alias('dimmers', 'dm');
  alias('fans', 'fn');
  alias('shutters', 'sh');
  alias('buttons', 'bn');
  alias('sensors', 'sn');
  alias('rssi', 'rs');
  alias('heap', 'hp');
  alias('uptime', 'up');
  if (j.rgbs === undefined && Array.isArray(j.rg)) j.rgbs = j.rg;

  const aliasItems = (key, map) => {
    const list = j[key];
    if (!Array.isArray(list)) return;
    j[key] = list.map((it) => {
      if (!it || typeof it !== 'object') return it;
      const o = { ...it };
      for (const [longK, shortK] of map) {
        if (o[longK] === undefined && o[shortK] !== undefined) o[longK] = o[shortK];
      }
      return o;
    });
  };
  aliasItems('dimmers', [['index', 'i'], ['name', 'n'], ['value', 'v']]);
  aliasItems('rgbs', [['index', 'i'], ['name', 'n'], ['color', 'co']]);
  aliasItems('fans', [['index', 'i'], ['name', 'n'], ['value', 'v']]);
  aliasItems('shutters', [['index', 'i'], ['name', 'n'], ['state', 's']]);
  aliasItems('buttons', [['name', 'n'], ['proto', 'pr'], ['raw', 'rw'], ['medium', 'md']]);
  aliasItems('sensors', [['index', 'i'], ['name', 'n'], ['type', 't'], ['temp', 'tp'], ['hum', 'hm'], ['value', 'v']]);
  return j;
}

// Port of lib/util/ir_remote_store.dart's prettyIrButtonLabel — the structured
// A/C/TV/receiver slots are named "__<type>_<id>_<key>" on the wire; this is
// what turns "__ac_l7x2_power_off" into "التكييف: إيقاف", exactly as the app
// shows it. A free-form custom button name is returned unchanged.
function prettyIrLabel(raw) {
  if (!raw.startsWith('__')) return raw;
  const body = raw.slice(2);
  const firstUs = body.indexOf('_');
  if (firstUs < 0) return raw;
  const type = body.slice(0, firstUs);
  const afterType = body.slice(firstUs + 1);
  const secondUs = afterType.indexOf('_');
  if (secondUs < 0) return raw;
  const key = afterType.slice(secondUs + 1);

  const typeName = { ac: 'التكييف', tv: 'التلفزيون', rc: 'الرسيفر' }[type] || 'ريموت';

  let keyLabel;
  if (type === 'ac' && key === 'power') keyLabel = 'تشغيل';
  else if (type === 'ac' && key === 'power_off') keyLabel = 'إيقاف';
  else if (type === 'ac' && key.startsWith('mode_')) {
    const m = key.slice(5);
    keyLabel = 'وضع ' + ({ cool: 'تبريد', heat: 'تدفئة', dry: 'تجفيف', fan: 'مروحة' }[m] || 'تلقائي');
  } else if (type === 'ac' && key.startsWith('temp_')) {
    keyLabel = `${key.slice(5)}°`;
  } else if (type === 'ac' && key.startsWith('fan_')) {
    const f = key.slice(4);
    keyLabel = 'مروحة ' + ({ low: 'منخفض', medium: 'متوسط', high: 'عالٍ' }[f] || 'تلقائي');
  } else {
    keyLabel = key.replaceAll('_', ' ');
  }
  return `${typeName}: ${keyLabel}`;
}

const RGB_PALETTE = [
  [255, 180, 80], [255, 255, 255], [255, 59, 48],
  [52, 199, 89], [10, 132, 255], [175, 82, 222],
];

// Splits a unit's learned buttons into distinct remotes — same slot naming as
// lib/pages/IrRemotePage.dart's _deriveRemotes: "__<ac|rc|tv>_<id>_<key>". One
// physical unit can carry several remotes (an A/C and a TV both learned into
// the same HALO), so this groups by (type, id), not just by device. Anything
// that doesn't parse (a free-form custom button) falls through untouched.
function groupIrButtons(buttons) {
  const groups = new Map(); // "type:id" -> { type, id, keys: {key: slotName} }
  const custom = [];
  for (const b of buttons) {
    const name = (b && b.name) || '';
    if (!name.startsWith('__')) { if (name) custom.push(b); continue; }
    const body = name.slice(2);
    const u1 = body.indexOf('_');
    if (u1 < 0) { custom.push(b); continue; }
    const tc = body.slice(0, u1);
    const rest = body.slice(u1 + 1);
    const u2 = rest.indexOf('_');
    if (u2 < 0) { custom.push(b); continue; }
    const id = rest.slice(0, u2);
    const key = rest.slice(u2 + 1);
    const type = tc === 'ac' ? 'ac' : tc === 'rc' ? 'receiver' : tc === 'tv' ? 'tv' : null;
    if (!type) { custom.push(b); continue; }
    const gid = `${type}:${id}`;
    if (!groups.has(gid)) groups.set(gid, { type, id, keys: {} });
    groups.get(gid).keys[key] = name;
  }
  return { groups: Array.from(groups.values()), custom };
}

const ERR_MSG = {
  'auth/user-not-found': 'مفيش حساب بالإيميل ده',
  'auth/wrong-password': 'كلمة السر غلط',
  'auth/invalid-credential': 'كلمة السر غلط',
  'auth/invalid-email': 'الإيميل مش صحيح',
  'auth/too-many-requests': 'محاولات كتير — جرّب بعد شوية',
  'auth/network-request-failed': 'تأكّد من الاتصال بالإنترنت',
};

// Small line-icon set (currentColor, 1em) — used in place of emoji for the
// chrome elements that repeat on every card, since emoji render inconsistently
// across platforms and read as informal rather than the app's own icon system.
const IconHome = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="currentColor"><path d="M10 2.3 2.3 9h2.4v8.2h4.1V12h2.4v5.2h4.1V9h2.4L10 2.3z" /></svg>
);
const IconPencil = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="currentColor"><path d="M12.9 3.6l3.5 3.5L7.4 16.1 3 17l.9-4.4L12.9 3.6z" /></svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="currentColor"><path d="M11 2 4 12h5l-1 6 8-11h-5l1-5z" /></svg>
);
const IconPower = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4v6M6 6a6 6 0 108 0" /></svg>
);
const IconWifi = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3.5 8a9.5 9.5 0 0113 0" /><path d="M6 10.8a5.7 5.7 0 018 0" /><circle cx="10" cy="14.3" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const IconCloud = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="currentColor"><path d="M6.2 15a3.4 3.4 0 01-.3-6.8A4.4 4.4 0 0113.8 8.3 3.1 3.1 0 0113.4 15H6.2z" /></svg>
);
const IconChip = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="5" width="10" height="10" rx="2.5" /><path d="M8 5V2.5M12 5V2.5M8 17.5V15M12 17.5V15M5 8H2.5M5 12H2.5M17.5 8H15M17.5 12H15" strokeLinecap="round" /></svg>
);
const IconLink = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8 12l4-4" /><path d="M7 13.3L5.4 15a2.7 2.7 0 01-3.8-3.8L3.3 9.5M12.7 6.5L14.3 5a2.7 2.7 0 013.8 3.8L16.4 10.3" /></svg>
);
const IconGroup = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="currentColor"><circle cx="7" cy="6.5" r="3" /><circle cx="14" cy="7.5" r="2.4" opacity=".55" /><path d="M2 17c.4-3.2 2.3-5 5-5s4.6 1.8 5 5" /><path d="M12.3 17c.3-2.5 1.5-3.9 3.3-3.9s3 1.4 3.4 3.9" opacity=".55" /></svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4v12M4 10h12" /></svg>
);
const IconGrip = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="currentColor"><circle cx="7" cy="5" r="1.3" /><circle cx="13" cy="5" r="1.3" /><circle cx="7" cy="10" r="1.3" /><circle cx="13" cy="10" r="1.3" /><circle cx="7" cy="15" r="1.3" /><circle cx="13" cy="15" r="1.3" /></svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6" /></svg>
);
const IconAntenna = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 3l4 4-4 4M14 3l-4 4 4 4" /><path d="M10 11v6" /><path d="M7 17h6" /></svg>
);
const IconMute = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em"><path d="M3 7v6h3l5 4V3L6 7H3z" fill="currentColor" /><path d="M14 7l3.5 3.5M17.5 7L14 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" /></svg>
);
const IconSnow = () => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M10 2v16M3.5 5.5l13 9M16.5 5.5l-13 9" /></svg>
);

function hasControllable(d) {
  return (Array.isArray(d.states) && d.states.length) ||
    (Array.isArray(d.dimmers) && d.dimmers.length) ||
    (Array.isArray(d.rgbs) && d.rgbs.length) ||
    (Array.isArray(d.fans) && d.fans.length) ||
    (Array.isArray(d.shutters) && d.shutters.length) ||
    (Array.isArray(d.sensors) && d.sensors.length);
}

function greetingNow() {
  const h = new Date().getHours();
  if (h < 5) return 'تصبح على خير';
  if (h < 12) return 'صباح الخير';
  return 'مساء الخير';
}

export default function ControlPanel() {
  const fb = useRef(null);
  const client = useRef(null);
  const pendingTimers = useRef({});

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [linkState, setLinkState] = useState('connecting'); // connecting | on | error | off
  const [devices, setDevices] = useState({});   // serial -> normalized state
  const [online, setOnline] = useState({});     // serial -> bool
  const [nicknames, setNicknames] = useState({}); // "<deviceName>_<i>" -> nickname
  const [groups, setGroups] = useState([]);       // UserConfig.groups, as-is from the app
  const [rename, setRename] = useState(null);   // { kind: 'device'|'switch', serial, idx?, value }
  const [view, setView] = useState('devices');  // 'devices' | 'groups'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groupEditor, setGroupEditor] = useState(null); // { id?, name, members: [{deviceId,switchId}] }
  const [voiceLinks, setVoiceLinks] = useState({});      // voice_links/{uid}: {google, googleLinkedAt, alexa, alexaLinkedAt}
  const [haLinks, setHaLinks] = useState([]);            // [{id, at}] from POST /ha/links
  const [order, setOrder] = useState([]);                 // UserConfig.panelOrder: serials in the order the user dragged them to
  const dragSerial = useRef(null);
  const [pending, setPending] = useState({});   // serial -> true while a just-sent command is unconfirmed

  useEffect(() => {
    fb.current = initFirebase();
    return onAuthStateChanged(fb.current.auth, (u) => { setUser(u); setAuthChecked(true); });
  }, []);

  // Once signed in: read this account's saved switch nicknames + groups
  // (UserConfig/{uid}), then connect straight to the broker with per-account
  // MQTT credentials — the same mechanism the app and the admin console's
  // live feed use.
  useEffect(() => {
    // A fresh account (or a sign-out) must start from a clean slate — without
    // this, switching accounts kept showing the previous account's devices
    // mixed in with the new one's, since nothing ever cleared the old state.
    setDevices({});
    setOnline({});
    setNicknames({});
    setGroups([]);
    setOrder([]);
    setPending({});
    if (!user) return;
    let cancelled = false;

    getDoc(doc(fb.current.db, 'UserConfig', user.uid))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.data() || {};
        const channels = data.channels || {};
        const map = {};
        Object.entries(channels).forEach(([id, c]) => {
          if (c && c.nickname) map[id] = c.nickname;
        });
        setNicknames(map);
        setGroups(Array.isArray(data.groups) ? data.groups : []);
        setOrder(Array.isArray(data.panelOrder) ? data.panelOrder : []);
      })
      .catch(() => {});

    (async () => {
      setLinkState('connecting');
      try {
        const token = await user.getIdToken();
        const r = await fetch(`${FW_BASE}/mqtt/credentials`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        });
        const creds = await r.json();
        if (cancelled || !creds.username) { setLinkState('error'); return; }

        const mqtt = await import('mqtt');
        const c = mqtt.default.connect(MQTT_URL, {
          username: creds.username,
          password: creds.password,
          reconnectPeriod: 4000,
          connectTimeout: 8000,
        });
        client.current = c;
        c.on('connect', () => {
          setLinkState('on');
          c.subscribe(`${user.uid}/+/state`);
          c.subscribe(`${user.uid}/+/status`);
        });
        c.on('error', () => setLinkState('error'));
        c.on('close', () => setLinkState((s) => (s === 'on' ? 'off' : s)));
        c.on('message', (topic, payload) => {
          const parts = topic.split('/');
          const serial = parts[1];
          if (!serial) return;
          let j;
          try { j = JSON.parse(payload.toString()); } catch { return; }
          if (topic.endsWith('/status')) {
            const st = j.status ?? j.s;
            setOnline((m) => ({ ...m, [serial]: st === 'online' }));
          } else if (topic.endsWith('/state')) {
            const n = normalize(j);
            setDevices((m) => ({ ...m, [serial]: n }));
            setOnline((m) => ({ ...m, [serial]: true }));
            // The unit's own report is the confirmation — stop glowing.
            clearTimeout(pendingTimers.current[serial]);
            setPending((m) => (m[serial] ? { ...m, [serial]: false } : m));
          }
        });
      } catch {
        if (!cancelled) setLinkState('error');
      }
    })();

    return () => {
      cancelled = true;
      client.current?.end(true);
      client.current = null;
    };
  }, [user]);

  // Settings → integration status. Alexa/Google Home linkage is mirrored into
  // Firestore by the bridge itself (voice_links/{uid}, see bridge/auth.js
  // recordVoiceLink) — owner-readable directly, no bridge round-trip needed.
  // Home Assistant has no Firestore record (it's short-lived pairing-code
  // sessions), so that one goes through POST /ha/links with the ID token.
  useEffect(() => {
    setVoiceLinks({});
    setHaLinks([]);
    if (!user) return;
    let cancelled = false;
    getDoc(doc(fb.current.db, 'voice_links', user.uid))
      .then((snap) => { if (!cancelled) setVoiceLinks(snap.data() || {}); })
      .catch(() => {});
    user.getIdToken()
      .then((token) => fetch(`${FW_BASE}/ha/links`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token }),
      }))
      .then((r) => r.json())
      .then((j) => { if (!cancelled && Array.isArray(j.links)) setHaLinks(j.links); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  async function unlinkHa() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`${FW_BASE}/ha/links/remove`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token }),
      });
    } catch {}
    setHaLinks([]);
  }

  async function login(e) {
    e.preventDefault();
    setAuthErr('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(fb.current.auth, email.trim(), pass);
    } catch (err) {
      setAuthErr(ERR_MSG[err?.code] || 'تعذّر تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  }

  // Marks the card as "confirming" — cleared by the unit's next /state report,
  // or after 4s if it never comes. Mirrors the app's own optimistic-pending UX.
  function markPending(serial) {
    setPending((m) => ({ ...m, [serial]: true }));
    clearTimeout(pendingTimers.current[serial]);
    pendingTimers.current[serial] = setTimeout(() => {
      setPending((m) => ({ ...m, [serial]: false }));
    }, 4000);
  }

  function command(serial, payload) {
    markPending(serial);
    if (!client.current || !user) return;
    client.current.publish(`${user.uid}/${serial}/set`, JSON.stringify(payload));
  }

  // Sends the FULL relay snapshot (every switch on the device, not just the one
  // toggled) — matches the app's own convention (see lib/home.dart _toggleSwitch):
  // the unit sets every relay from one command, so its report back is clean.
  function toggleSwitch(serial, dev, idx) {
    const states = Array.isArray(dev.states) ? dev.states : [];
    const relays = {};
    states.forEach((v, i) => { relays[i] = i === idx ? !v : !!v; });
    setDevices((m) => ({
      ...m,
      [serial]: { ...dev, states: states.map((v, i) => (i === idx ? !v : v)) },
    }));
    command(serial, { relays });
  }

  // "All on" / "all off" — one command sets every relay on the device at once,
  // same as the app's onAllOn/onAllOff (see lib/home.dart _setAllSwitches).
  function setAllSwitches(serial, dev, on) {
    const states = Array.isArray(dev.states) ? dev.states : [];
    if (!states.length) return;
    const relays = {};
    states.forEach((_, i) => { relays[i] = on; });
    setDevices((m) => ({ ...m, [serial]: { ...dev, states: states.map(() => on) } }));
    command(serial, { relays });
  }

  function nameOf(dev, idx) {
    const devName = dev.project || dev.name || '';
    const id = `${devName}_${idx}`;
    return nicknames[id] || (Array.isArray(dev.names) && dev.names[idx]) || `مفتاح ${idx + 1}`;
  }

  // Resolves one GroupMember (see lib/util/group_repository.dart) against live
  // state. switchId is either a plain SwitchModel.id ("<deviceName>_<index>")
  // or a "dim:N" / "fan:N" / "rgb:N" / "sht:N" tag for the other channel kinds
  // — same encoding the app writes when a group is built.
  function resolveGroupMember(m) {
    const dev = devices[m.deviceId];
    if (!dev) return null;
    const sid = m.switchId || '';
    const tagged = sid.match(/^(dim|fan|rgb|sht):(\d+)$/);
    if (tagged) {
      const [, kind, idxStr] = tagged;
      const idx = parseInt(idxStr, 10);
      const list = dev[kind === 'dim' ? 'dimmers' : kind === 'fan' ? 'fans' : kind === 'rgb' ? 'rgbs' : 'shutters'] || [];
      const item = list.find((x) => x.index === idx);
      if (!item) return null;
      const on = kind === 'rgb' ? (Array.isArray(item.color) && item.color.some(Boolean)) : (item.value ?? 0) > 0;
      return { kind, serial: m.deviceId, idx, on };
    }
    const devName = dev.project || dev.name || '';
    const states = Array.isArray(dev.states) ? dev.states : [];
    const idx = states.findIndex((_, i) => `${devName}_${i}` === sid);
    if (idx < 0) return null;
    return { kind: 'switch', serial: m.deviceId, idx, on: !!states[idx] };
  }

  // One tap turns every switch/dimmer/fan in the group on or off together —
  // the "group by room/purpose, one-tap control" pattern every mainstream
  // smart-home dashboard (Home Assistant, SmartThings, Apple Home) leads with.
  // RGB/shutter members are shown as part of the group but aren't bulk-toggled
  // — "on" has no single well-defined target colour/position for those.
  function setGroupAll(group, on) {
    const bySerial = {};
    for (const m of group.members || []) {
      const r = resolveGroupMember(m);
      if (!r || r.kind === 'rgb' || r.kind === 'sht') continue;
      bySerial[r.serial] = bySerial[r.serial] || {};
      if (r.kind === 'switch') {
        bySerial[r.serial].relayIdx = bySerial[r.serial].relayIdx || [];
        bySerial[r.serial].relayIdx.push(r.idx);
      } else {
        bySerial[r.serial][r.kind] = bySerial[r.serial][r.kind] || {};
        bySerial[r.serial][r.kind][r.idx] = on ? 100 : 0;
      }
    }
    Object.entries(bySerial).forEach(([serial, payload]) => {
      const dev = devices[serial];
      if (payload.relayIdx) {
        const states = Array.isArray(dev?.states) ? dev.states : [];
        const relays = {};
        states.forEach((v, i) => { relays[i] = payload.relayIdx.includes(i) ? on : !!v; });
        command(serial, { relays });
      }
      if (payload.dim) command(serial, { dim: payload.dim });
      if (payload.fan) command(serial, { fan: payload.fan });
    });
  }

  // Every controllable channel across every device, for the group editor's
  // member picker — same channel-kind encoding resolveGroupMember reads back.
  function pickableChannels() {
    const out = [];
    Object.entries(devices).forEach(([serial, dev]) => {
      const devTitle = dev.project || dev.name || serial;
      (Array.isArray(dev.states) ? dev.states : []).forEach((_, i) =>
        out.push({ deviceId: serial, switchId: `${devTitle}_${i}`, deviceTitle: devTitle, label: nameOf(dev, i) }));
      (Array.isArray(dev.dimmers) ? dev.dimmers : []).forEach((d) =>
        out.push({ deviceId: serial, switchId: `dim:${d.index}`, deviceTitle: devTitle, label: d.name || `إضاءة ${d.index + 1}` }));
      (Array.isArray(dev.fans) ? dev.fans : []).forEach((f) =>
        out.push({ deviceId: serial, switchId: `fan:${f.index}`, deviceTitle: devTitle, label: f.name || `مروحة ${f.index + 1}` }));
      (Array.isArray(dev.rgbs) ? dev.rgbs : []).forEach((c) =>
        out.push({ deviceId: serial, switchId: `rgb:${c.index}`, deviceTitle: devTitle, label: c.name || `إضاءة ملوّنة ${c.index + 1}` }));
      (Array.isArray(dev.shutters) ? dev.shutters : []).forEach((s) =>
        out.push({ deviceId: serial, switchId: `sht:${s.index}`, deviceTitle: devTitle, label: s.name || `ستارة ${s.index + 1}` }));
    });
    return out;
  }

  // Groups live in UserConfig.groups as a plain array (see
  // lib/util/group_repository.dart) — unlike the channels MAP, Firestore
  // replaces arrays wholesale, so every save/delete writes the full list back.
  async function saveGroup({ id, name, members }) {
    const next = id
      ? groups.map((g) => (g.id === id ? { ...g, name, members } : g))
      : [...groups, { id: crypto.randomUUID(), name, iconCodePoint: 0, members }];
    setGroups(next);
    setGroupEditor(null);
    try {
      await setDoc(doc(fb.current.db, 'UserConfig', user.uid), { groups: next }, { merge: true });
    } catch {}
  }

  async function deleteGroup(id) {
    const next = groups.filter((g) => g.id !== id);
    setGroups(next);
    try {
      await setDoc(doc(fb.current.db, 'UserConfig', user.uid), { groups: next }, { merge: true });
    } catch {}
  }

  // The unit's own name lives on the board and is renamed by sending it a
  // {"name": ...} command — the same mechanism the app uses.
  function openRenameDevice(serial, dev) {
    setRename({ kind: 'device', serial, value: dev.project || dev.name || '' });
  }

  // A switch's nickname isn't part of the device's own MQTT state — the app
  // stores it in Firestore (UserConfig/{uid}.channels), keyed by
  // "<deviceName>_<switchIndex>", so that's exactly where we write it too.
  function openRenameSwitch(serial, dev, idx) {
    setRename({ kind: 'switch', serial, idx, value: nameOf(dev, idx) });
  }

  async function saveRename() {
    if (!rename) return;
    const value = rename.value.trim();
    if (!value) { setRename(null); return; }
    if (rename.kind === 'device') {
      command(rename.serial, { name: value });
    } else {
      const dev = devices[rename.serial] || {};
      const devName = dev.project || dev.name || '';
      const id = `${devName}_${rename.idx}`;
      setNicknames((m) => ({ ...m, [id]: value }));
      try {
        await setDoc(doc(fb.current.db, 'UserConfig', user.uid),
          { channels: { [id]: { nickname: value } } }, { merge: true });
      } catch {}
    }
    setRename(null);
  }

  if (!authChecked) {
    return <div className="cp"><div className="cp-center">جارٍ التحميل…</div></div>;
  }

  if (!user) {
    return (
      <div className="cp" dir="rtl">
        <div className="cp-center">
          <form className="cp-card cp-login" onSubmit={login}>
            <div className="cp-seal"><span className="cp-seal-ring" /><IconHome /></div>
            <h1>أجهزتك</h1>
            <p>ادخل بنفس بيانات حسابك في تطبيق كوش سمارت</p>
            <input type="email" placeholder="الإيميل" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            <input type="password" placeholder="كلمة السر" value={pass}
              onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
            {authErr && <div className="cp-err">{authErr}</div>}
            <button className="cp-btn" disabled={busy} type="submit">{busy ? '…' : 'دخول'}</button>
          </form>
        </div>
        <Style />
      </div>
    );
  }

  const entries = Object.entries(devices);
  const relayDevices = entries.filter(([, d]) => hasControllable(d));
  const remoteDevices = entries.filter(([, d]) => Array.isArray(d.buttons) && d.buttons.length);

  // One draggable list, devices and remotes mixed — the customer arranges
  // their own dashboard, not "switches first, remotes after". Anything not
  // in the saved order yet (a new device) is appended, in encounter order.
  const cards = [
    ...relayDevices.map(([serial, dev]) => ({ kind: 'device', serial, dev })),
    ...remoteDevices.map(([serial, dev]) => ({ kind: 'remote', serial, dev })),
  ];
  const orderedCards = [...cards].sort((a, b) => {
    const ia = order.indexOf(a.serial), ib = order.indexOf(b.serial);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  function saveOrder(next) {
    setOrder(next);
    if (user) setDoc(doc(fb.current.db, 'UserConfig', user.uid), { panelOrder: next }, { merge: true }).catch(() => {});
  }
  function handleDrop(targetSerial) {
    const from = dragSerial.current;
    dragSerial.current = null;
    if (!from || from === targetSerial) return;
    const current = orderedCards.map((c) => c.serial);
    const fromIdx = current.indexOf(from);
    const toIdx = current.indexOf(targetSerial);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...current];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, from);
    saveOrder(next);
  }

  const totalUnits = entries.length;
  const onlineCount = entries.filter(([s]) => online[s] !== false).length;
  const onCount = relayDevices.reduce(
    (n, [, d]) => n + (Array.isArray(d.states) ? d.states.filter(Boolean).length : 0), 0);

  const linkLabel = linkState === 'on' ? 'متصل' : linkState === 'connecting' ? 'جارٍ الاتصال' : 'غير متصل';
  const heroText = totalUnits === 0
    ? (linkState === 'on' ? 'جارٍ استقبال أجهزتك…' : 'جارٍ الاتصال…')
    : `${greetingNow()} — ${onlineCount} من ${totalUnits} وحدة متصلة${onCount ? ` · ${onCount} مفتاح شغّال دلوقتي` : ''}`;

  return (
    <div className="cp" dir="rtl">
      <div className="cp-shell">
        {sidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand"><IconHome /> KUSH</div>
          <nav className="sidebar-nav">
            <button className={`sidebar-link ${view === 'devices' ? 'active' : ''}`}
              onClick={() => { setView('devices'); setSidebarOpen(false); }}>
              <IconChip /> الأجهزة
            </button>
            <button className={`sidebar-link ${view === 'groups' ? 'active' : ''}`}
              onClick={() => { setView('groups'); setSidebarOpen(false); }}>
              <IconGroup /> المجموعات
              {groups.length > 0 && <span className="sidebar-badge">{groups.length}</span>}
            </button>
            <button className={`sidebar-link ${view === 'settings' ? 'active' : ''}`}
              onClick={() => { setView('settings'); setSidebarOpen(false); }}>
              <IconLink /> الإعدادات
            </button>
          </nav>
          <div className="sidebar-spacer" />
          <div className="sidebar-foot">
            <div className="sidebar-status"><span className={`cp-led ${linkState}`} />{linkLabel}</div>
            <div className="sidebar-email">{user.email}</div>
            <button className="cp-ghost" onClick={() => signOut(fb.current.auth)}>تسجيل خروج</button>
          </div>
        </aside>

        <div className="cp-main-col">
          <header className="cp-bar">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <b>{view === 'devices' ? 'أجهزتي' : view === 'groups' ? 'المجموعات' : 'الإعدادات'}</b>
            <span className={`cp-led ${linkState}`} title={linkLabel} />
          </header>

          {view === 'devices' ? (
            <>
              <div className="cp-hero"><p>{heroText}</p></div>
              <main className="cp-main">
                {groups.length > 0 && (
                  <div className="groups-row">
                    {groups.map((g) => {
                      const resolved = (g.members || []).map(resolveGroupMember).filter(Boolean);
                      const controllable = resolved.filter((r) => r.kind !== 'rgb' && r.kind !== 'sht');
                      const anyOn = resolved.some((r) => r.on);
                      return (
                        <button key={g.id} className={`group-chip ${anyOn ? 'on' : ''}`}
                          disabled={controllable.length === 0}
                          onClick={() => setGroupAll(g, !anyOn)}>
                          <span className="group-chip-icon"><IconChip /></span>
                          <span className="group-chip-name">{g.name}</span>
                          <span className="group-chip-count">{resolved.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {relayDevices.length === 0 && remoteDevices.length === 0 ? (
                  <div className="cp-empty">
                    {linkState === 'on'
                      ? 'لسه معندناش أجهزة نتحكّم فيها — تأكّد إن وحداتك شغّالة ومتصلة بالإنترنت.'
                      : 'جارٍ الاتصال بأجهزتك…'}
                  </div>
                ) : (
                  <div className="cp-grid">
                    {orderedCards.map(({ kind, serial, dev }, i) => kind === 'device' ? (
                      <DeviceCard
                        key={serial}
                        serial={serial}
                        dev={dev}
                        enterDelay={i}
                        online={online[serial] !== false}
                        pending={!!pending[serial]}
                        nameOf={(i) => nameOf(dev, i)}
                        onToggle={(i) => toggleSwitch(serial, dev, i)}
                        onDim={(i, v) => command(serial, { dim: { [i]: v } })}
                        onRgb={(i, rgb) => command(serial, { rgb: { [i]: rgb } })}
                        onFan={(i, v) => command(serial, { fan: { [i]: v } })}
                        onShutter={(i, cmd) => command(serial, { shutter: { [i]: cmd } })}
                        onAllOn={() => setAllSwitches(serial, dev, true)}
                        onAllOff={() => setAllSwitches(serial, dev, false)}
                        onRenameDevice={() => openRenameDevice(serial, dev)}
                        onRenameSwitch={(i) => openRenameSwitch(serial, dev, i)}
                        onDragStart={() => { dragSerial.current = serial; }}
                        onDropCard={() => handleDrop(serial)}
                      />
                    ) : (
                      <RemoteCard
                        key={serial}
                        serial={serial}
                        dev={dev}
                        enterDelay={i}
                        online={online[serial] !== false}
                        pending={!!pending[serial]}
                        onSend={(name) => command(serial, { send: name })}
                        onRenameDevice={() => openRenameDevice(serial, dev)}
                        onDragStart={() => { dragSerial.current = serial; }}
                        onDropCard={() => handleDrop(serial)}
                      />
                    ))}
                  </div>
                )}
              </main>
            </>
          ) : view === 'groups' ? (
            <main className="cp-main">
              <GroupsManager
                groups={groups}
                resolveMember={resolveGroupMember}
                onToggle={setGroupAll}
                onEdit={(g) => setGroupEditor(g
                  ? { id: g.id, name: g.name, members: g.members || [] }
                  : { name: '', members: [] })}
                onDelete={deleteGroup}
              />
            </main>
          ) : (
            <main className="cp-main">
              <SettingsView voiceLinks={voiceLinks} haLinks={haLinks} onUnlinkHa={unlinkHa} />
            </main>
          )}
        </div>
      </div>

      {groupEditor && (
        <GroupEditorModal
          editor={groupEditor}
          channels={pickableChannels()}
          onChange={setGroupEditor}
          onCancel={() => setGroupEditor(null)}
          onSave={() => saveGroup(groupEditor)}
        />
      )}
      {rename && (
        <RenameDialog
          title={rename.kind === 'device' ? 'اسم الجهاز' : 'اسم المفتاح'}
          value={rename.value}
          onChange={(v) => setRename((r) => ({ ...r, value: v }))}
          onCancel={() => setRename(null)}
          onSave={saveRename}
        />
      )}
      <Style />
    </div>
  );
}

// Mirrors DeviceGroupCard/_Header in lib/util/device_widgets.dart: a 40×40
// accent-tinted icon box, the unit name (tap to rename), Wi-Fi/cloud dots +
// switch count, then "all on" / "all off" chips.
function DeviceHead({ title, online, pending, switchCount, onRenameDevice, onAllOn, onAllOff, icon: Icon = IconChip, gripProps }) {
  return (
    <div className="dc-head">
      <span className="dc-grip" title="اسحب لإعادة الترتيب" {...gripProps}><IconGrip /></span>
      <div className="dc-icon"><span className={pending ? 'pulse' : ''}><Icon /></span></div>
      <div className="dc-title">
        <div className="dc-name-row">
          <b>{title}</b>
          <button className="dc-pencil" title="إعادة تسمية الجهاز" onClick={onRenameDevice}><IconPencil /></button>
        </div>
        <div className="dc-sub">
          <span className={`dc-conn ${online ? 'on' : ''}`}><IconWifi /></span>
          <span className={`dc-conn ${online ? 'on' : ''}`}><IconCloud /></span>
          {switchCount > 0 && <span className="dc-count">{switchCount} مفتاح</span>}
        </div>
      </div>
      {switchCount > 0 && (
        <>
          <button className="dc-chip on" onClick={onAllOn}><IconBolt /> الكل تشغيل</button>
          <button className="dc-chip off" onClick={onAllOff}><IconPower /> الكل إيقاف</button>
        </>
      )}
    </div>
  );
}

// Every channel — switch, dimmer, fan, RGB, shutter — is an equally-sized
// square tile in one responsive grid (2/3/4 columns), exactly like _Grid in
// the app: no channel type looks bigger or smaller than its neighbours.
function DeviceCard({ serial, dev, online, pending, nameOf, onToggle, onDim, onRgb, onFan, onShutter, onAllOn, onAllOff, onRenameDevice, onRenameSwitch, enterDelay = 0, onDragStart, onDropCard }) {
  const title = dev.project || dev.name || serial;
  const states = Array.isArray(dev.states) ? dev.states : [];
  const dimmers = Array.isArray(dev.dimmers) ? dev.dimmers : [];
  const rgbs = Array.isArray(dev.rgbs) ? dev.rgbs : [];
  const fans = Array.isArray(dev.fans) ? dev.fans : [];
  const shutters = Array.isArray(dev.shutters) ? dev.shutters : [];
  const sensors = Array.isArray(dev.sensors) ? dev.sensors : [];
  const [dragReady, setDragReady] = useState(false);
  const gripProps = {
    onMouseDown: () => setDragReady(true), onMouseUp: () => setDragReady(false),
    onTouchStart: () => setDragReady(true), onTouchEnd: () => setDragReady(false),
  };

  return (
    <div className="dc dc-enter" style={{ animationDelay: `${Math.min(enterDelay, 6) * 70}ms` }}
      draggable={dragReady} onDragStart={onDragStart} onDragEnd={() => setDragReady(false)}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDropCard?.(); }}>
      <DeviceHead title={title} online={online} pending={pending} switchCount={states.length}
        onRenameDevice={onRenameDevice} onAllOn={onAllOn} onAllOff={onAllOff} gripProps={gripProps} />
      <div className={`dc-grid ${online ? '' : 'offline'}`}>
        {states.map((on, i) => (
          <SwitchTile key={`sw${i}`} on={!!on} label={nameOf(i)}
            onTap={() => onToggle(i)} onRename={() => onRenameSwitch(i)} />
        ))}
        {dimmers.map((d) => (
          <DimmerTile key={`dm${d.index}`} value={d.value ?? 0} label={d.name || `إضاءة ${d.index + 1}`}
            onChange={(v) => onDim(d.index, v)} />
        ))}
        {fans.map((f) => (
          <FanTile key={`fn${f.index}`} value={f.value ?? 0} label={f.name || `مروحة ${f.index + 1}`}
            onChange={(v) => onFan(f.index, v)} />
        ))}
        {rgbs.map((c) => (
          <RgbTile key={`rg${c.index}`} color={Array.isArray(c.color) && c.color.length === 3 ? c.color : [255, 180, 80]}
            label={c.name || `إضاءة ملوّنة ${c.index + 1}`} onPick={(p) => onRgb(c.index, p)} />
        ))}
        {shutters.map((s) => (
          <ShutterTile key={`sh${s.index}`} state={s.state} label={s.name || `ستارة ${s.index + 1}`}
            onCommand={(cmd) => onShutter(s.index, cmd)} />
        ))}
        {sensors.map((s) => (
          <SensorTile key={`sn${s.index}`} s={s} />
        ))}
      </div>
    </div>
  );
}

// ── Tiles — same chrome recipe as the app's SwitchCard/DimmerCard/etc:
// icon box top, control top-right, name, extra control beneath. ─────────────

function SwitchTile({ on, label, onTap, onRename }) {
  return (
    <div className={`tile ${on ? 'on' : ''}`} onClick={onTap}>
      <div className="tile-top">
        <div className="tile-icon lg">💡</div>
        <div className="tile-actions">
          <button className="tile-pencil" title="إعادة تسمية"
            onClick={(e) => { e.stopPropagation(); onRename(); }}><IconPencil /></button>
          <span className={`toggle ${on ? 'on' : ''}`}><span /></span>
        </div>
      </div>
      <span className="tile-label">{label}</span>
    </div>
  );
}

function DimmerTile({ value, label, onChange }) {
  const on = value > 0;
  return (
    <div className={`tile ${on ? 'on' : ''}`}>
      <div className="tile-top">
        <div className="tile-icon">🔆</div>
        <span className="tile-pct">{value}%</span>
      </div>
      <span className="tile-label">{label}</span>
      <input className="tile-slider" type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function FanTile({ value, label, onChange }) {
  const on = value > 0;
  return (
    <div className={`tile ${on ? 'on' : ''}`}>
      <div className="tile-top">
        <div className="tile-icon">🌀</div>
        <span className="tile-pct">{value}%</span>
      </div>
      <span className="tile-label">{label}</span>
      <input className="tile-slider" type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function RgbTile({ color, label, onPick }) {
  const on = color[0] + color[1] + color[2] > 0;
  return (
    <div className={`tile ${on ? 'on' : ''}`}>
      <div className="tile-top">
        <div className="tile-icon" style={{ background: `rgba(${color.join(',')},.22)`, borderColor: `rgba(${color.join(',')},.6)` }}>🎨</div>
        <span className="tile-swatch" style={{ background: `rgb(${color.join(',')})` }} />
      </div>
      <span className="tile-label">{label}</span>
      <div className="tile-palette">
        {RGB_PALETTE.map((p) => (
          <button key={p.join(',')} className="tile-dot"
            style={{ background: `rgb(${p.join(',')})`, outline: p.join(',') === color.join(',') ? '2px solid #fff' : 'none' }}
            onClick={() => onPick(p)} />
        ))}
      </div>
    </div>
  );
}

function ShutterTile({ state, label, onCommand }) {
  const moving = state === 'open' || state === 'close';
  return (
    <div className={`tile ${moving ? 'on' : ''}`}>
      <div className="tile-top">
        <div className="tile-icon">🪟</div>
      </div>
      <span className="tile-label">{label}</span>
      <div className="tile-shbtns">
        <button className={state === 'open' ? 'active' : ''} onClick={() => onCommand('open')}>▲</button>
        <button className={state === 'stop' ? 'active' : ''} onClick={() => onCommand('stop')}>■</button>
        <button className={state === 'close' ? 'active' : ''} onClick={() => onCommand('close')}>▼</button>
      </div>
    </div>
  );
}

// Read-only — a DHT sensor shows temperature + humidity; a digital sensor
// (door/motion/433MHz) shows detected/idle. No control surface, same as the
// app's SensorCard: this is a reading, not a switch.
function SensorTile({ s }) {
  if (s.type === 'dht') {
    return (
      <div className="tile sensor">
        <div className="tile-top"><div className="tile-icon">🌡️</div></div>
        <span className="tile-label">{s.name || 'حرارة ورطوبة'}</span>
        <div className="sensor-readings">
          <span>{s.temp != null && !isNaN(s.temp) ? `${s.temp}°` : '—'}</span>
          <span>{s.hum != null && !isNaN(s.hum) ? `${s.hum}%` : '—'}</span>
        </div>
      </div>
    );
  }
  const active = s.value === true || s.value === 1;
  return (
    <div className={`tile sensor ${active ? 'on' : ''}`}>
      <div className="tile-top"><div className="tile-icon">{active ? '🔔' : '📴'}</div></div>
      <span className="tile-label">{s.name || `حسّاس ${(s.index ?? 0) + 1}`}</span>
      <span className="sensor-state">{active ? 'نشط' : 'غير نشط'}</span>
    </div>
  );
}

// One unit can carry several distinct remotes (an A/C and a TV both learned
// into the same HALO) plus free-form custom buttons — each structured remote
// renders as its own remote-shaped widget; anything left over is a plain pill.
function RemoteCard({ serial, dev, online, pending, onSend, onRenameDevice, enterDelay = 0, onDragStart, onDropCard }) {
  const title = dev.project || dev.name || serial;
  const buttons = Array.isArray(dev.buttons) ? dev.buttons : [];
  const { groups, custom } = groupIrButtons(buttons);
  const [dragReady, setDragReady] = useState(false);
  const gripProps = {
    onMouseDown: () => setDragReady(true), onMouseUp: () => setDragReady(false),
    onTouchStart: () => setDragReady(true), onTouchEnd: () => setDragReady(false),
  };

  return (
    <div className="dc dc-remote dc-enter" style={{ animationDelay: `${Math.min(enterDelay, 6) * 70}ms` }}
      draggable={dragReady} onDragStart={onDragStart} onDragEnd={() => setDragReady(false)}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDropCard?.(); }}>
      <DeviceHead title={title} online={online} pending={pending} switchCount={0} icon={IconAntenna}
        onRenameDevice={onRenameDevice} onAllOn={() => {}} onAllOff={() => {}} gripProps={gripProps} />
      {groups.length === 0 && custom.length === 0 ? (
        <p className="dc-muted">لسه مفيش أزرار متعلَّمة على الريموت ده.</p>
      ) : (
        <div className="remotes-wrap">
          {groups.map((g) => (
            g.type === 'ac'
              ? <AcRemoteWidget key={`${g.type}:${g.id}`} g={g} onSend={onSend} />
              : <TvRemoteWidget key={`${g.type}:${g.id}`} g={g} onSend={onSend} />
          ))}
          {custom.length > 0 && (
            <div className="dc-pills">
              {custom.map((b, i) => (
                <button key={`${b.name}${i}`} className="dc-pill" onClick={() => onSend(b.name)}>
                  {prettyIrLabel(b.name || '')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── A/C remote — power, recorded degrees, mode/fan chips. Only shows keys the
// customer actually learned, same as the app (no greyed-out placeholders). ──
const AC_MODE_LABEL = { cool: 'تبريد', heat: 'تدفئة', dry: 'تجفيف', fan: 'مروحة', auto: 'تلقائي' };
const AC_FAN_LABEL = { auto: 'تلقائي', low: 'منخفض', medium: 'متوسط', high: 'عالٍ' };

function AcRemoteWidget({ g, onSend }) {
  const has = (k) => g.keys[k] !== undefined;
  const fire = (k) => has(k) && onSend(g.keys[k]);
  const degrees = Object.keys(g.keys)
    .filter((k) => k.startsWith('temp_'))
    .map((k) => parseInt(k.slice(5), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  const modes = Object.keys(g.keys).filter((k) => k.startsWith('mode_')).map((k) => k.slice(5));
  const fans = Object.keys(g.keys).filter((k) => k.startsWith('fan_')).map((k) => k.slice(4));

  return (
    <div className="remote remote-ac">
      <div className="remote-label"><IconSnow /> تكييف</div>
      {(has('power') || has('power_off')) && (
        <div className="remote-power-row">
          {has('power') && <button className="remote-power on" onClick={() => fire('power')}><IconPower /> تشغيل</button>}
          {has('power_off') && <button className="remote-power off" onClick={() => fire('power_off')}><IconPower /> إيقاف</button>}
        </div>
      )}
      {degrees.length > 0 && (
        <div className="remote-degrees">
          {degrees.map((t) => (
            <button key={t} className="remote-deg" onClick={() => onSend(g.keys[`temp_${t}`])}>{t}°</button>
          ))}
        </div>
      )}
      {modes.length > 0 && (
        <div className="remote-chips">
          {modes.map((m) => (
            <button key={m} className="remote-chip" onClick={() => onSend(g.keys[`mode_${m}`])}>{AC_MODE_LABEL[m] || m}</button>
          ))}
        </div>
      )}
      {fans.length > 0 && (
        <div className="remote-chips">
          {fans.map((f) => (
            <button key={f} className="remote-chip" onClick={() => onSend(g.keys[`fan_${f}`])}>{AC_FAN_LABEL[f] || f}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TV / receiver remote — an actual remote-body shape: top row, numpad,
// volume/dpad/channel, menu row, colour row — mirrors _remoteGraphic in
// lib/pages/IrRemotePage.dart, showing only the keys that were learned. ──────
function TvRemoteWidget({ g, onSend }) {
  const has = (k) => g.keys[k] !== undefined;
  const fire = (k) => has(k) && onSend(g.keys[k]);
  const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const hasNumpad = nums.some(has) || has('num_0');
  const hasRocker = has('vol_up') || has('vol_dn') || has('ch_up') || has('ch_dn');
  const hasDpad = has('up') || has('down') || has('left') || has('right') || has('ok');
  const hasMenuRow = has('menu') || has('home') || has('back') || has('exit');
  const hasColors = has('red') || has('green') || has('yellow') || has('blue');

  return (
    <div className="remote remote-tv">
      <div className="remote-label">{g.type === 'receiver' ? <IconAntenna /> : null} {g.type === 'receiver' ? 'رسيفر' : 'تلفزيون'}</div>
      <div className="remote-body">
        <div className="remote-top">
          {has('power') ? <button className="rk power" onClick={() => fire('power')}><IconPower /></button> : <span />}
          {has('source') ? <button className="rk pill" onClick={() => fire('source')}>مصدر</button> : <span />}
          {has('mute') ? <button className="rk" onClick={() => fire('mute')}><IconMute /></button> : <span />}
        </div>

        {hasNumpad && (
          <div className="remote-numpad">
            {nums.map((n) => has(`num_${n}`)
              ? <button key={n} className="rk" onClick={() => fire(`num_${n}`)}>{n}</button>
              : <span key={n} />)}
            <span />
            {has('num_0') ? <button className="rk" onClick={() => fire('num_0')}>0</button> : <span />}
            <span />
          </div>
        )}

        {(hasRocker || hasDpad) && (
          <div className="remote-mid">
            {(has('vol_up') || has('vol_dn')) ? (
              <div className="rocker">
                <button className="rk pill sm" disabled={!has('vol_up')} onClick={() => fire('vol_up')}>+</button>
                <span className="rocker-label">صوت</span>
                <button className="rk pill sm" disabled={!has('vol_dn')} onClick={() => fire('vol_dn')}>−</button>
              </div>
            ) : <span />}
            {hasDpad ? (
              <div className="dpad">
                <button className="dk up" disabled={!has('up')} onClick={() => fire('up')}>▲</button>
                <button className="dk left" disabled={!has('left')} onClick={() => fire('left')}>◀</button>
                <button className="dk ok" disabled={!has('ok')} onClick={() => fire('ok')}>OK</button>
                <button className="dk right" disabled={!has('right')} onClick={() => fire('right')}>▶</button>
                <button className="dk down" disabled={!has('down')} onClick={() => fire('down')}>▼</button>
              </div>
            ) : <span />}
            {(has('ch_up') || has('ch_dn')) ? (
              <div className="rocker">
                <button className="rk pill sm" disabled={!has('ch_up')} onClick={() => fire('ch_up')}>+</button>
                <span className="rocker-label">قناة</span>
                <button className="rk pill sm" disabled={!has('ch_dn')} onClick={() => fire('ch_dn')}>−</button>
              </div>
            ) : <span />}
          </div>
        )}

        {hasMenuRow && (
          <div className="remote-bottom">
            {has('menu') ? <button className="rk pill sm" onClick={() => fire('menu')}>قائمة</button> : <span />}
            {has('home') ? <button className="rk sm" onClick={() => fire('home')}>⌂</button> : <span />}
            {has('back') ? <button className="rk sm" onClick={() => fire('back')}>↩</button> : <span />}
            {has('exit') ? <button className="rk pill sm" onClick={() => fire('exit')}>خروج</button> : <span />}
          </div>
        )}

        {hasColors && (
          <div className="remote-colors">
            {has('red') && <button className="ck" style={{ background: '#e53935' }} onClick={() => fire('red')} />}
            {has('green') && <button className="ck" style={{ background: '#43a047' }} onClick={() => fire('green')} />}
            {has('yellow') && <button className="ck" style={{ background: '#f9a825' }} onClick={() => fire('yellow')} />}
            {has('blue') && <button className="ck" style={{ background: '#1e88e5' }} onClick={() => fire('blue')} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Groups management page — create/edit/delete, same UserConfig.groups data
// the app's own Groups tab reads and writes. ─────────────────────────────────
// ── Settings — integration status. Alexa/Google Home linking itself happens
// from inside those apps (this page can't complete an OAuth flow FOR them,
// only report whether it succeeded); Home Assistant is unlinked right here
// since the bridge already exposes that as a plain endpoint. ───────────────
function SettingsView({ voiceLinks, haLinks, onUnlinkHa }) {
  const rows = [
    { key: 'alexa', name: 'Amazon Alexa', linked: voiceLinks.alexa === true, doc: '/docs/alexa' },
    { key: 'google', name: 'Google Home', linked: voiceLinks.google === true, doc: '/docs/google-home' },
  ];
  return (
    <>
      <div className="groups-head">
        <p className="groups-head-sub">حالة ربط حسابك بالمساعدات الصوتية ومنصّات المنزل الذكي.</p>
      </div>
      <div className="group-list">
        {rows.map((it) => (
          <div key={it.key} className="group-row">
            <div className={`group-row-icon ${it.linked ? 'linked' : ''}`}><IconLink /></div>
            <div className="group-row-body">
              <b>{it.name}</b>
              <span>{it.linked ? 'مرتبط بحسابك' : 'مش مرتبط لسه'}</span>
            </div>
            <span className={`status-pill ${it.linked ? 'on' : ''}`}>{it.linked ? 'مرتبط' : 'غير مرتبط'}</span>
            <a className="cp-ghost" href={it.doc} target="_blank" rel="noreferrer">التفاصيل</a>
          </div>
        ))}
        <div className="group-row">
          <div className={`group-row-icon ${haLinks.length ? 'linked' : ''}`}><IconLink /></div>
          <div className="group-row-body">
            <b>Home Assistant</b>
            <span>{haLinks.length ? `${haLinks.length} ${haLinks.length === 1 ? 'ربط نشط' : 'روابط نشطة'}` : 'مش مرتبط لسه'}</span>
          </div>
          <span className={`status-pill ${haLinks.length ? 'on' : ''}`}>{haLinks.length ? 'مرتبط' : 'غير مرتبط'}</span>
          {haLinks.length > 0 && (
            <button className="cp-ghost" onClick={() => { if (confirm('إلغاء ربط Home Assistant؟')) onUnlinkHa(); }}>إلغاء الربط</button>
          )}
          <a className="cp-ghost" href="/docs/home-assistant" target="_blank" rel="noreferrer">التفاصيل</a>
        </div>
      </div>
    </>
  );
}

function GroupsManager({ groups, resolveMember, onToggle, onEdit, onDelete }) {
  return (
    <>
      <div className="groups-head">
        <p className="groups-head-sub">جمّع أي مفاتيح أو إضاءات أو مراوح من أي جهاز في زر واحد.</p>
        <button className="cp-btn sm" onClick={() => onEdit(null)}><IconPlus /> مجموعة جديدة</button>
      </div>
      {groups.length === 0 ? (
        <div className="cp-empty">لسه معملتش أي مجموعة. اضغط «مجموعة جديدة» فوق.</div>
      ) : (
        <div className="group-list">
          {groups.map((g) => {
            const resolved = (g.members || []).map(resolveMember).filter(Boolean);
            const controllable = resolved.filter((r) => r.kind !== 'rgb' && r.kind !== 'sht');
            const anyOn = resolved.some((r) => r.on);
            return (
              <div key={g.id} className="group-row">
                <div className={`group-row-icon ${anyOn ? 'active' : ''}`}><IconGroup /></div>
                <div className="group-row-body">
                  <b>{g.name}</b>
                  <span>{resolved.length} {resolved.length === 1 ? 'عنصر' : 'عناصر'}{resolved.length !== (g.members || []).length ? ' (بعضها مش ظاهر دلوقتي)' : ''}</span>
                </div>
                <button className={`dc-chip ${anyOn ? 'on' : 'off'}`} disabled={controllable.length === 0}
                  onClick={() => onToggle(g, !anyOn)}>
                  {anyOn ? <><IconPower /> إيقاف الكل</> : <><IconBolt /> تشغيل الكل</>}
                </button>
                <button className="tile-pencil" title="تعديل" onClick={() => onEdit(g)}><IconPencil /></button>
                <button className="tile-pencil danger" title="حذف" onClick={() => { if (confirm(`حذف مجموعة «${g.name}»؟`)) onDelete(g.id); }}><IconTrash /></button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function GroupEditorModal({ editor, channels, onChange, onCancel, onSave }) {
  const selected = new Set((editor.members || []).map((m) => `${m.deviceId}|${m.switchId}`));
  const toggle = (deviceId, switchId) => {
    const key = `${deviceId}|${switchId}`;
    const members = selected.has(key)
      ? (editor.members || []).filter((m) => `${m.deviceId}|${m.switchId}` !== key)
      : [...(editor.members || []), { deviceId, switchId }];
    onChange({ ...editor, members });
  };
  const byDevice = {};
  channels.forEach((c) => { (byDevice[c.deviceTitle] = byDevice[c.deviceTitle] || []).push(c); });

  return (
    <div className="cp-overlay" onClick={onCancel}>
      <div className="cp-card cp-dialog group-editor" onClick={(e) => e.stopPropagation()}>
        <b>{editor.id ? 'تعديل المجموعة' : 'مجموعة جديدة'}</b>
        <input autoFocus placeholder="اسم المجموعة، مثلاً «الصالة»" value={editor.name}
          onChange={(e) => onChange({ ...editor, name: e.target.value })} />
        <div className="group-picker">
          {Object.keys(byDevice).length === 0 ? (
            <p className="dc-muted">مفيش قنوات متاحة دلوقتي.</p>
          ) : Object.entries(byDevice).map(([devTitle, chans]) => (
            <div key={devTitle} className="group-picker-dev">
              <span className="group-picker-dev-name">{devTitle}</span>
              {chans.map((c) => {
                const key = `${c.deviceId}|${c.switchId}`;
                return (
                  <label key={key} className="group-picker-row">
                    <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(c.deviceId, c.switchId)} />
                    <span>{c.label}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cp-dialog-actions">
          <button className="cp-ghost" onClick={onCancel}>إلغاء</button>
          <button className="cp-btn sm" disabled={!editor.name.trim()} onClick={onSave}>حفظ</button>
        </div>
      </div>
    </div>
  );
}

function RenameDialog({ title, value, onChange, onCancel, onSave }) {
  return (
    <div className="cp-overlay" onClick={onCancel}>
      <div className="cp-card cp-dialog" onClick={(e) => e.stopPropagation()}>
        <b>{title}</b>
        <input autoFocus value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }} />
        <div className="cp-dialog-actions">
          <button className="cp-ghost" onClick={onCancel}>إلغاء</button>
          <button className="cp-btn sm" onClick={onSave}>حفظ</button>
        </div>
      </div>
    </div>
  );
}

function Style() {
  return (
    <style jsx global>{`
      /* Tokens copied 1:1 from the app's dark theme (lib/util/device_widgets.dart
         _C, lib/util/ui_tokens.dart AppTokens) — this page must read as the same
         product, not a reskin, so the palette isn't ours to reinvent. */
      .cp {
        --bg-0: #f3f5f9;
        --card: #ffffff; --card-el: #eff2f7; --line: #e4e9f1; --line-l: #d8dee9;
        --brand: #1868a8; --brand-soft: rgba(24,104,168,.08); --brand-mid: rgba(24,104,168,.14); --brand-border: rgba(24,104,168,.33);
        --good: #12b76a; --good-soft: rgba(18,183,106,.1); --good-border: rgba(18,183,106,.3);
        --bad: #ef4444; --bad-soft: rgba(239,68,68,.1); --bad-border: rgba(239,68,68,.3);
        --warn: #f59e0b;
        --ink: #18202e; --ink-dim: #515e75; --ink-faint: #7c889c;
        --on-tint: #eaf1ff; --toggle-off: #d7dde8;
        min-height: 100vh;
        background:
          radial-gradient(900px 420px at 15% -8%, #e7f0fb 0%, transparent 60%),
          radial-gradient(700px 380px at 100% 0%, #eef2fb 0%, transparent 55%),
          var(--bg-0);
        color: var(--ink);
        font-family: var(--font-cairo), sans-serif;
      }
      .cp-center { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }

      .cp-card {
        background: var(--card); border: 1px solid var(--line); border-radius: 16px;
        padding: 16px 16px 16px 20px;
        box-shadow: 0 4px 16px rgba(16,24,40,.06);
      }

      /* ── Login ─────────────────────────────────────────────────────────── */
      .cp-login { width: 100%; max-width: 340px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
      .cp-seal {
        position: relative; width: 60px; height: 60px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #eaf1ff, #ffffff 70%);
        border: 1px solid var(--line-l);
        display: flex; align-items: center; justify-content: center;
        font-size: 24px; margin-bottom: 6px; color: var(--brand);
      }
      .cp-seal-ring {
        position: absolute; inset: -5px; border-radius: 50%;
        border: 1px solid var(--brand); opacity: .35;
        animation: cpBreathe 3s ease-in-out infinite;
      }
      .cp-login h1 { font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -.2px; }
      .cp-login p { font-size: 13px; color: var(--ink-dim); margin: 0 0 6px; }
      .cp-login input {
        width: 100%; box-sizing: border-box; background: var(--bg-0); border: 1px solid var(--line);
        border-radius: 10px; padding: 12px 14px; color: var(--ink); font-size: 14px;
      }
      .cp-login input:focus { outline: none; border-color: var(--brand); }
      .cp-err { color: var(--bad); font-size: 12.5px; }
      .cp-btn {
        width: 100%; background: var(--brand); color: #fff; border: 0; border-radius: 10px;
        padding: 12px; font-weight: 700; font-size: 14.5px; cursor: pointer; transition: transform .1s;
      }
      .cp-btn:active { transform: scale(.97); }
      .cp-btn:disabled { opacity: .6; }
      .cp-btn.sm { width: auto; padding: 8px 16px; font-size: 13px; }
      .cp-ghost {
        background: transparent; border: 1px solid var(--line); color: var(--ink);
        border-radius: 8px; padding: 7px 14px; font-size: 13px; cursor: pointer;
        text-decoration: none; display: inline-flex; align-items: center; white-space: nowrap;
      }
      .cp-ghost:hover { border-color: var(--brand); }

      /* ── Sidebar shell ─────────────────────────────────────────────────── */
      .cp-shell { display: flex; align-items: flex-start; min-height: 100vh; }
      .sidebar {
        width: 216px; flex: none; background: var(--card); border-inline-end: 1px solid var(--line);
        display: flex; flex-direction: column; padding: 16px 12px;
        position: sticky; top: 0; height: 100vh;
      }
      .sidebar-brand { display: flex; align-items: center; gap: 8px; padding: 6px 10px 16px; margin-bottom: 8px; font-weight: 800; font-size: 15px; color: var(--brand); letter-spacing: .5px; border-bottom: 1px solid var(--line); }
      .sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
      .sidebar-link {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
        border: 0; background: transparent; color: var(--ink-dim); font-size: 13.5px; font-weight: 700;
        cursor: pointer; text-align: start; font-family: inherit;
      }
      .sidebar-link:hover { background: var(--card-el); color: var(--ink); }
      .sidebar-link { position: relative; transition: background .15s, color .15s; }
      .sidebar-link.active { background: var(--brand-soft); color: var(--brand); }
      .sidebar-link.active::before {
        content: ''; position: absolute; inset-inline-start: -12px; top: 8px; bottom: 8px; width: 3px;
        background: var(--brand); border-radius: 0 3px 3px 0;
      }
      .sidebar-badge {
        margin-inline-start: auto; background: var(--card-el); color: var(--ink-faint); border-radius: 8px;
        min-width: 18px; height: 18px; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;
      }
      .sidebar-link.active .sidebar-badge { background: var(--brand); color: #fff; }
      .sidebar-spacer { flex: 1; }
      .sidebar-foot { border-top: 1px solid var(--line); padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
      .sidebar-status { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--ink-faint); padding: 0 4px; }
      .sidebar-email { font-size: 11px; color: var(--ink-faint); padding: 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-inter), sans-serif; }
      .menu-btn { display: none; background: transparent; border: 0; color: var(--ink); font-size: 18px; cursor: pointer; padding: 4px; }
      .sidebar-scrim { display: none; }
      @media (max-width: 860px) {
        .sidebar {
          position: fixed; inset-inline-start: 0; top: 0; bottom: 0; z-index: 30; width: 240px;
          transform: translateX(-100%); transition: transform .2s ease; box-shadow: 0 0 30px rgba(0,0,0,.15);
        }
        [dir="rtl"] .sidebar { transform: translateX(100%); }
        .sidebar.open { transform: translateX(0); }
        .sidebar-scrim { display: block; position: fixed; inset: 0; background: rgba(10,14,20,.4); z-index: 29; }
        .menu-btn { display: flex; }
      }

      .cp-main-col { flex: 1; min-width: 0; }

      /* ── Top bar + hero ────────────────────────────────────────────────── */
      .cp-bar {
        position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 10px;
        padding: 13px 20px; background: rgba(255,255,255,.85); backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--line);
      }
      .cp-bar b { font-size: 15px; font-weight: 800; flex: 1; }
      .cp-led { width: 9px; height: 9px; border-radius: 50%; background: var(--ink-faint); flex: none; }
      .cp-led.on { background: var(--good); box-shadow: 0 0 8px #12b76a99; }
      .cp-led.connecting { background: var(--warn); animation: cpBreathe 1.4s ease-in-out infinite; }
      .cp-led.error, .cp-led.off { background: var(--bad); }

      .cp-hero { max-width: 900px; margin: 0 auto; padding: 22px 20px 4px; }
      .cp-hero p { margin: 0; font-size: 15.5px; color: var(--ink-dim); font-weight: 600; font-variant-numeric: tabular-nums; }

      .cp-main { padding: 16px 20px 40px; max-width: 900px; margin: 0 auto; }
      .cp-empty { text-align: center; color: var(--ink-dim); padding: 60px 20px; font-size: 14px; }
      /* One device = one full-width block, stacked — exactly like the app's
         home screen (each DeviceGroupCard is its own row, never side-by-side). */
      .cp-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 14px; }

      /* Groups — one-tap control of a room/purpose, same idea Home Assistant's
         Mushroom cards and Apple/SmartThings home screens lead with. */
      .groups-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
      .group-chip {
        display: inline-flex; align-items: center; gap: 7px;
        background: var(--card); border: 1px solid var(--line); border-radius: 30px;
        padding: 8px 8px 8px 14px; font-size: 12.5px; font-weight: 700; color: var(--ink);
        cursor: pointer; transition: transform .1s, background .2s, border-color .2s;
      }
      .group-chip:active { transform: scale(.96); }
      .group-chip:disabled { opacity: .5; cursor: default; }
      .group-chip.on { background: var(--brand-soft); border-color: var(--brand-border); color: var(--brand); }
      .group-chip-icon {
        width: 22px; height: 22px; border-radius: 50%; background: var(--card-el);
        display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--ink-dim);
      }
      .group-chip.on .group-chip-icon { background: var(--brand); color: #fff; }
      .group-chip-count {
        background: var(--card-el); color: var(--ink-faint); border-radius: 10px;
        min-width: 18px; height: 18px; padding: 0 5px; font-size: 10px; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
      }

      /* ── Groups management page ───────────────────────────────────────── */
      .groups-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
      .groups-head-sub { margin: 0; font-size: 13px; color: var(--ink-dim); }
      .group-list { display: flex; flex-direction: column; gap: 10px; }
      .group-row {
        display: flex; align-items: center; gap: 12px; background: var(--card); border: 1px solid var(--line);
        border-radius: 16px; padding: 12px 14px; box-shadow: 0 2px 10px rgba(16,24,40,.04);
        animation: dcEnter .4s cubic-bezier(.16,1,.3,1) both; transition: transform .12s, box-shadow .2s;
      }
      .group-row:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,24,40,.07); }
      .group-row-icon {
        width: 38px; height: 38px; border-radius: 11px; background: var(--card-el); color: var(--ink-faint);
        display: flex; align-items: center; justify-content: center; font-size: 16px; flex: none; transition: background .2s, color .2s;
      }
      .group-row-icon.linked { background: var(--good-soft); color: var(--good); }
      .group-row-icon.active { background: var(--brand-soft); color: var(--brand); }
      .group-row-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
      .group-row-body b { font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .group-row-body span { font-size: 11.5px; color: var(--ink-faint); }
      .tile-pencil.danger:hover { color: var(--bad); }
      .status-pill {
        font-size: 10.5px; font-weight: 800; padding: 4px 10px; border-radius: 20px; flex: none;
        background: var(--card-el); color: var(--ink-faint); border: 1px solid var(--line);
      }
      .status-pill.on { background: var(--good-soft); color: var(--good); border-color: var(--good-border); }

      .group-editor { max-width: 380px; }
      .group-picker { max-height: 300px; overflow-y: auto; border: 1px solid var(--line); border-radius: 12px; padding: 4px 10px; }
      .group-picker-dev { padding: 8px 0; }
      .group-picker-dev + .group-picker-dev { border-top: 1px solid var(--line); }
      .group-picker-dev-name { display: block; font-size: 11px; font-weight: 800; color: var(--ink-faint); margin-bottom: 4px; }
      .group-picker-row { display: flex; align-items: center; gap: 8px; padding: 5px 2px; font-size: 12.5px; color: var(--ink); cursor: pointer; }
      .group-picker-row input { accent-color: var(--brand); width: 15px; height: 15px; }

      /* ── Device head — mirrors _Header in device_widgets.dart ────────────── */
      .dc { background: var(--card); border: 1px solid var(--line); border-radius: 22px; overflow: hidden; box-shadow: 0 2px 10px rgba(16,24,40,.05); }
      /* The one orchestrated motion moment on this page: the fleet arrives in a
         soft upward cascade instead of popping in all at once — a single
         deliberate beat, not scattered animation everywhere. */
      .dc-enter { animation: dcEnter .5s cubic-bezier(.16,1,.3,1) both; }
      @keyframes dcEnter { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      .dc-head { display: flex; align-items: center; padding: 16px 16px 12px 12px; gap: 12px; }
      .dc-grip { color: var(--ink-faint); font-size: 13px; flex: none; cursor: grab; }
      .dc-grip:active { cursor: grabbing; }
      .dc[draggable="true"]:active { opacity: .85; }
      .dc-icon {
        width: 40px; height: 40px; border-radius: 12px; background: var(--brand-soft);
        border: 1px solid var(--brand-border); flex: none;
        display: flex; align-items: center; justify-content: center; font-size: 17px; color: var(--brand);
      }
      .dc-icon .pulse { animation: cpPulse 1s ease-in-out infinite; }
      .dc-title { flex: 1; min-width: 0; }
      .dc-name-row { display: flex; align-items: center; gap: 4px; }
      .dc-name-row b { font-size: 14px; font-weight: 700; color: var(--ink); letter-spacing: -.2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dc-sub { display: flex; align-items: center; gap: 7px; margin-top: 3px; }
      .dc-conn { font-size: 12px; opacity: .4; filter: grayscale(1); }
      .dc-conn.on { opacity: 1; filter: none; }
      .dc-count { font-size: 11px; color: var(--ink-faint); }
      .dc-pencil { background: transparent; border: 0; color: var(--ink-faint); font-size: 13px; cursor: pointer; padding: 3px; border-radius: 6px; line-height: 1; flex: none; }
      .dc-pencil:hover { color: var(--brand); background: var(--brand-soft); }
      .dc-chip {
        display: inline-flex; align-items: center; gap: 5px; border: 0; border-radius: 10px;
        padding: 8px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; white-space: nowrap;
        transition: transform .1s;
      }
      .dc-chip:active { transform: scale(.94); }
      .dc-chip.on { background: var(--good-soft); color: var(--good); border: 1px solid var(--good-border); }
      .dc-chip.off { background: var(--bad-soft); color: var(--bad); border: 1px solid var(--bad-border); margin-inline-start: 6px; }

      /* ── Channel tile grid — mirrors _Grid: every channel is an equally-
         sized square tile, 2 columns on phones, 3/4 as the screen widens. ──── */
      .dc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 12px 14px; transition: opacity .2s; }
      .dc-grid.offline { opacity: .45; pointer-events: none; }
      @media (min-width: 640px) { .dc-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 980px) { .dc-grid { grid-template-columns: repeat(4, 1fr); } }

      .tile {
        background: var(--card); border: 1px solid var(--line); border-radius: 18px;
        padding: 14px; aspect-ratio: 1 / 0.86; min-height: 140px;
        display: flex; flex-direction: column; cursor: default;
        transition: background .2s, border-color .2s, transform .12s, box-shadow .2s;
      }
      .tile.on { background: var(--on-tint); border-color: var(--brand-border); }
      .tile:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16,24,40,.08); }
      .tile:active { transform: scale(.98); }
      .tile-top { display: flex; align-items: flex-start; justify-content: space-between; }
      .tile-icon {
        width: 36px; height: 36px; border-radius: 10px; background: var(--card-el); border: 1px solid var(--line-l);
        display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--ink-dim);
      }
      .tile-icon.lg { width: 40px; height: 40px; border-radius: 12px; }
      .tile.on .tile-icon { background: var(--brand-mid); border-color: var(--brand-border); }
      .tile-actions { display: flex; align-items: center; gap: 8px; }
      .tile-pencil { background: transparent; border: 0; color: var(--ink-faint); font-size: 12px; cursor: pointer; padding: 3px; line-height: 1; }
      .tile-pencil:hover { color: var(--brand); }
      .tile-label { font-size: 13px; font-weight: 600; color: var(--ink); margin-top: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tile-pct { font-size: 14px; font-weight: 700; color: var(--ink); font-family: var(--font-inter), sans-serif; font-variant-numeric: tabular-nums; }
      .tile-swatch { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--line-l); }
      .tile-slider { width: 100%; accent-color: var(--brand); margin-top: auto; cursor: pointer; }
      .tile-palette { display: flex; gap: 6px; margin-top: auto; }
      .tile-dot { width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--line-l); cursor: pointer; padding: 0; }
      .tile-shbtns { display: flex; gap: 6px; margin-top: auto; }
      .tile-shbtns button { flex: 1; height: 28px; border-radius: 8px; border: 1px solid var(--line); background: var(--card-el); color: var(--ink); cursor: pointer; }
      .tile-shbtns button.active { background: var(--brand); border-color: var(--brand); color: #fff; }

      /* Sensors are read-only — no toggle, no hover-lift invitation to tap. */
      .tile.sensor { cursor: default; }
      .tile.sensor:hover { transform: none; box-shadow: none; }
      .sensor-readings { display: flex; gap: 10px; margin-top: auto; }
      .sensor-readings span { font-size: 17px; font-weight: 800; color: var(--ink); font-family: var(--font-inter), sans-serif; font-variant-numeric: tabular-nums; }
      .sensor-state { margin-top: auto; font-size: 12px; font-weight: 700; color: var(--ink-faint); }
      .tile.sensor.on .sensor-state { color: var(--warn); }
      .tile.sensor.on { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.3); }

      /* Premium toggle — same geometry as _PremiumToggle in the app. Thumb
         always slides to the physical right when on, matching the Flutter
         widget (it hardcodes Alignment.centerRight, not RTL-aware). */
      .toggle { position: relative; display: inline-block; width: 38px; height: 21px; border-radius: 11px; background: var(--toggle-off); border: 0.5px solid var(--line); flex: none; transition: background .2s; }
      .toggle.on { background: var(--brand); border-color: var(--brand-border); }
      .tile:active .toggle span { transform: scale(.9) translateX(0); }
      .tile.on:active .toggle span { transform: scale(.9) translateX(17px); }
      .toggle span { position: absolute; width: 17px; height: 17px; top: 1.5px; left: 2px; background: #fff; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,.3); transition: transform .2s ease; }
      .toggle.on span { transform: translateX(17px); }

      /* ── Remote card ───────────────────────────────────────────────────── */
      .dc-remote .dc-icon { background: rgba(142,36,170,.13); border-color: rgba(142,36,170,.35); color: #c77ee0; }
      .dc-muted { font-size: 12.5px; color: var(--ink-dim); margin: 0 16px 14px; }
      .dc-pills { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 16px; }
      .dc-pill {
        background: var(--card-el); border: 1px solid var(--line); color: var(--ink);
        border-radius: 20px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
        transition: transform .1s, border-color .15s, color .15s;
      }
      .dc-pill:hover { border-color: var(--brand); color: var(--brand); }
      .dc-pill:active { background: var(--brand); color: #fff; border-color: var(--brand); transform: scale(.95); }

      /* ── Remote-shaped widgets — mirrors the app's own A/C panel and
         _remoteGraphic (see lib/pages/IrRemotePage.dart): only the keys that
         were actually learned are drawn, nothing greyed-out or hypothetical. ── */
      .remotes-wrap { display: flex; flex-wrap: wrap; gap: 16px; padding: 0 16px 16px; align-items: flex-start; }
      .remote { display: flex; flex-direction: column; gap: 8px; }
      .remote-label { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: var(--ink-dim); }

      .remote-ac { width: 210px; background: var(--card-el); border: 1px solid var(--line); border-radius: 16px; padding: 12px; gap: 10px; }
      .remote-power-row { display: flex; gap: 8px; }
      .remote-power {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--card);
        font-weight: 700; font-size: 12px; cursor: pointer; transition: transform .1s;
      }
      .remote-power.on { color: var(--good); border-color: var(--good-border); background: var(--good-soft); }
      .remote-power.off { color: var(--bad); border-color: var(--bad-border); background: var(--bad-soft); }
      .remote-degrees, .remote-chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .remote-deg {
        min-width: 40px; padding: 8px; border-radius: 10px; border: 1px solid var(--line);
        background: var(--card); font-weight: 800; font-size: 13px; cursor: pointer; transition: transform .1s;
      }
      .remote-chip {
        padding: 6px 10px; border-radius: 8px; border: 1px solid var(--line);
        background: var(--card); font-size: 11px; font-weight: 700; cursor: pointer; transition: transform .1s;
      }
      .remote-deg:active, .remote-chip:active, .remote-power:active { transform: scale(.93); }

      /* The TV/receiver body is deliberately shaped like an actual remote —
         tall, narrow, rounded — the signature this whole redesign was asked for. */
      .remote-tv { width: 176px; }
      .remote-body {
        background: linear-gradient(180deg, var(--card), var(--card-el));
        border: 1px solid var(--line); border-radius: 26px; padding: 16px 12px;
        display: flex; flex-direction: column; gap: 12px; align-items: center;
        box-shadow: 0 4px 14px rgba(16,24,40,.06);
      }
      .remote-top { display: flex; align-items: center; justify-content: space-between; width: 100%; }
      .rk {
        width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line); background: var(--card);
        color: var(--ink); font-size: 12.5px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: transform .1s;
      }
      .rk.power { color: var(--bad); }
      .rk.pill { width: auto; border-radius: 14px; padding: 0 10px; font-size: 10.5px; font-weight: 700; }
      .rk.sm { width: 28px; height: 28px; font-size: 10.5px; }
      .rk:disabled { opacity: .25; cursor: default; }
      .rk:not(:disabled):active { transform: scale(.88); }
      .remote-numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; justify-items: center; }
      .remote-mid { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px; }
      .rocker { display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .rocker-label { font-size: 8.5px; color: var(--ink-faint); font-weight: 700; letter-spacing: .5px; }
      .dpad { position: relative; width: 76px; height: 76px; border-radius: 50%; background: var(--card-el); border: 1px solid var(--line); flex: none; }
      .dk { position: absolute; background: transparent; border: 0; color: var(--ink-dim); cursor: pointer; font-size: 10px; }
      .dk.up { top: 3px; left: 50%; transform: translateX(-50%); }
      .dk.down { bottom: 3px; left: 50%; transform: translateX(-50%); }
      .dk.left { left: 3px; top: 50%; transform: translateY(-50%); }
      .dk.right { right: 3px; top: 50%; transform: translateY(-50%); }
      .dk.ok {
        left: 50%; top: 50%; transform: translate(-50%,-50%); width: 28px; height: 28px;
        border-radius: 50%; background: var(--brand); color: #fff; font-size: 8.5px; font-weight: 800;
      }
      .remote-bottom { display: flex; align-items: center; justify-content: space-between; width: 100%; }
      .remote-colors { display: flex; gap: 8px; }
      .ck { width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--line-l); cursor: pointer; padding: 0; transition: transform .1s; }
      .ck:active { transform: scale(.85); }

      /* ── Rename dialog ─────────────────────────────────────────────────── */
      .cp-overlay { position: fixed; inset: 0; background: rgba(5,8,12,.6); display: flex; align-items: center; justify-content: center; z-index: 20; padding: 20px; }
      .cp-dialog { width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 12px; }
      .cp-dialog b { font-size: 14.5px; }
      .cp-dialog input {
        width: 100%; box-sizing: border-box; background: var(--bg-0); border: 1px solid var(--line);
        border-radius: 10px; padding: 11px 13px; color: var(--ink); font-size: 14px;
      }
      .cp-dialog input:focus { outline: none; border-color: var(--brand); }
      .cp-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }

      @keyframes cpPulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
      @keyframes cpBreathe { 0%, 100% { opacity: .35; transform: scale(1); } 50% { opacity: .8; transform: scale(1.06); } }
      @media (prefers-reduced-motion: reduce) {
        .dc-icon .pulse, .cp-seal-ring, .cp-led.connecting, .dc-enter { animation: none; }
        .tile:hover, .tile:active, .cp-btn:active, .dc-chip:active, .dc-pill:active { transform: none; }
      }
    `}</style>
  );
}
