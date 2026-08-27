'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp,
  arrayUnion, arrayRemove,
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
  // HALO must be matched (and thus excluded from the plain 'ir' row below)
  // BEFORE the 'ir' check — its own board name doesn't contain "IR" at all,
  // but its live-state type is folded into 'ir' upstream (see the mqtt 'state'
  // handler), so 'ir' would otherwise also claim it.
  { key: 'halo',      label: 'ATGENX HALO (تكييف + RF + IR)', match: (d) => (d.board || '').toUpperCase().includes('HALO') },
  { key: 'ir',        label: 'ريموت IR (تكييف/رسيفر/تلفزيون)', match: (d) => (d.type === 'ir' || (d.board || '').includes('IR')) && !(d.board || '').toUpperCase().includes('HALO') },
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

// What a scoped admin can be allowed to do. A SUPER admin always has all of it.
// The same keys are enforced server-side (bridge/admin_auth.js) and in
// firestore.rules — hiding a tab here is only the convenience half.
//
// 'admins' is deliberately absent: whoever manages the admin list could grant
// themselves everything, so it stays with the super admins.
const PERMS = [
  ['fleet', 'الأسطول', 'يشوف الأجهزة وحالتها ويقدر يشيلها'],
  ['firmware', 'التحديثات', 'يرفع سوفت وير للبوردات وينشر نسخة التطبيق'],
  ['notify', 'الإشعارات', 'يبعت إشعارات للمستخدمين'],
  ['licenses', 'التراخيص', 'يفعّل التراخيص ويتابع طلبات الشراء'],
  ['invoices', 'الفواتير', 'يشوف الفواتير'],
  ['countries', 'الدول', 'يغيّر الأسعار حسب الدولة'],
];
const PERM_KEYS = PERMS.map(([k]) => k);
const toDate = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);

// ── Language ─────────────────────────────────────────────────────────────────
// The console followed the site's <html lang/dir>, so switching the site to
// English left the console's Arabic text laid out left-to-right — every label
// misaligned. It now owns its own direction: `dir` is set on the console root
// from the active language, so each language is correct on its own terms.
const STR = {
  // shell
  console: ['لوحة العمليات', 'Operations'],
  signout: ['خروج', 'Sign out'],
  superRole: ['أدمن أساسي — كل الصلاحيات', 'Owner — full access'],
  nPerms: ['صلاحية', 'permissions'],
  liveOn: ['البث الحيّ متصل', 'Live feed connected'],
  liveConnecting: ['جارٍ الاتصال…', 'Connecting…'],
  liveErr: ['البث الحيّ غير متاح', 'Live feed unavailable'],
  liveOff: ['غير متصل', 'Not connected'],
  refresh: ['↻ تحديث', '↻ Refresh'],
  noPerms: ['مالكش صلاحيات لسه. كلّم الأدمن الأساسي يحدّد لك تعمل إيه.',
            'You have no permissions yet. Ask the owner to grant you access.'],
  // sections
  s_fleet: ['الأسطول', 'Fleet'],
  s_fleet_sub: ['كل وحدة، حالتها، ومين مالكها.', 'Every unit, its state, and who owns it.'],
  s_firmware: ['التحديثات', 'Updates'],
  s_firmware_sub: ['انشر نسخة التطبيق وسوفت وير البوردات.',
                   'Publish the app release and each board’s firmware.'],
  s_notify: ['الإشعارات', 'Notifications'],
  s_notify_sub: ['ابعت إشعار للمستخدمين — يوصل والتطبيق مقفول.',
                 'Send a notification — it arrives even when the app is closed.'],
  s_license: ['الترخيص', 'Licensing'],
  s_license_sub: ['فعّل التراخيص وتابع طلبات الشراء.',
                  'Activate licences and follow up purchase requests.'],
  s_invoices: ['الفواتير', 'Invoices'],
  s_invoices_sub: ['كل ترخيص اتباع أو اتفعّل.', 'Every licence sold or activated.'],
  s_countries: ['الدول', 'Countries'],
  s_countries_sub: ['توزيع الأسطول والسعر لكل دولة.',
                    'Where the fleet is, and the price per country.'],
  s_admins: ['المسؤولون', 'Admins'],
  s_admins_sub: ['مين يدخل اللوحة، ويعمل إيه بالظبط.',
                 'Who gets in, and exactly what they can do.'],
  // fleet
  kFleet: ['الأسطول', 'Units'],
  kLicensed: ['مرخّصة', 'Licensed'],
  kPending: ['طلبات ترخيص', 'Requests'],
  kOnline: ['متصلة الآن', 'Online now'],
  search: ['ابحث عن جهاز… سيريال / إيميل / اسم', 'Search a unit… serial / email / name'],
  // the credit section
  s_credit: ['الرصيد والسعر', 'Credit & price'],
  s_credit_sub: ['حدّد سعر الترخيص، وحط رصيد لكل مسؤول يفعّل منه.',
                 'Set the licence price, and give each admin a balance to activate from.'],
  priceT: ['سعر الترخيص', 'Licence price'],
  priceP: ['ده سعر الترخيص الواحد — بيتخصم من رصيد المسؤول مع كل تفعيل، وبيظهر على الموقع.',
           'The price of one licence — spent from an admin’s balance on each activation, and shown on the website.'],
  balancesT: ['أرصدة المسؤولين', 'Admin balances'],
  balancesP: ['المسؤول اللي معاه صلاحية التراخيص بس هو اللي بيصرف رصيد.',
              'Only an admin with the licences permission spends credit.'],
  noLicAdmins: ['مفيش مسؤول معاه صلاحية التراخيص. ادِّي الصلاحية الأول من «المسؤولون».',
                'No admin has the licences permission yet. Grant it first, under “Admins”.'],
  kTotalCredit: ['رصيد موزّع', 'Credit issued'],
  kTotalSpent: ['اتصرف', 'Spent'],
  kLicAdmins: ['مسؤول بيفعّل', 'Admins licensing'],
  canActivate: ['يقدر يفعّل', 'Can activate'],
  licences: ['ترخيص', 'licences'],
  addCredit: ['إضافة', 'Add'],
  // licence credit
  creditT: ['الرصيد', 'Credit'],
  creditP: ['حط رصيد للمسؤول. كل تفعيل ترخيص بيخصم سعر الترخيص من رصيده.',
            'Give an admin a balance. Each activation spends the licence price from it.'],
  balanceL: ['الرصيد', 'Balance'],
  spentL: ['اتصرف', 'Spent'],
  setBalance: ['حفظ', 'Save'],
  creditSet: ['اتظبط الرصيد — {0} ✓', 'Balance set — {0} ✓'],
  creditFailed: ['تعذّر حفظ الرصيد', 'Could not save the balance'],
  badBalance: ['اكتب رقم صحيح', 'Enter a valid number'],
  unlimited: ['رصيد مفتوح', 'Unlimited'],
  left: ['فاضل', 'left'],
  myBalance: ['رصيدك', 'Your credit'],
  perLicence: ['سعر الترخيص', 'Licence price'],
  noCredit: ['رصيدك مش كفاية للترخيص ({0}). كلّم الأدمن الرئيسي يزوّده.',
             'Not enough credit for this licence ({0}). Ask the main admin to top you up.'],
  licCharged: ['اتفعّل ✓ — اتخصم {0}', 'Activated ✓ — charged {0}'],
  licFree: ['اتفعّل {0} ✓', 'Activated {0} ✓'],
  licAlready: ['{0} مرخّص بالفعل', '{0} is already licensed'],
  licRevoked: ['اتسحب ترخيص {0}', 'Revoked the licence on {0}'],
  licFailed: ['فشل التفعيل', 'Activation failed'],
  priceSuperOnly: ['السعر بيغيّره الأدمن الأساسي بس.', 'Only the main admin can change the price.'],
  priceHere: ['السعر والأرصدة بتتظبط من صفحة «الرصيد والسعر».',
              'The price and balances are set on the “Credit & price” page.'],
  // the licensing workspace
  activateT: ['فعّل جهاز', 'Activate a unit'],
  activateP: ['اكتب سيريال الجهاز. سعر الترخيص هيتخصم من رصيدك.',
              'Enter the unit’s serial. The licence price comes out of your balance.'],
  activateP_super: ['اكتب سيريال الجهاز. إنت الأدمن الأساسي — مش بيتخصم منك رصيد.',
                    'Enter the unit’s serial. You’re the main admin — nothing is charged.'],
  waitingT: ['أجهزة مستنية ترخيص', 'Units awaiting a licence'],
  waitingP: ['دي الأجهزة اللي اتوصلت وطلبت ترخيص.',
             'These units connected and asked to be licensed.'],
  waitingNone: ['مفيش جهاز مستني.', 'Nothing is waiting.'],
  outOfCredit: ['رصيدك خلص.', 'You’re out of credit.'],
  outOfCreditP: ['مش هتقدر تفعّل ترخيص جديد لحد ما الأدمن الأساسي يزوّد رصيدك.',
                 'You can’t activate another licence until the main admin tops you up.'],
  revokeSuperOnly: ['سحب الترخيص للأدمن الأساسي بس.', 'Only the main admin can revoke a licence.'],
  badSerial: ['السيريال ده مش صحيح.', 'That serial isn’t valid.'],
  // sign-in errors — each one says what to do about it
  errNoUser: ['مفيش حساب بالإيميل ده. كلّم الأدمن الرئيسي يعمل لك حساب.',
              'No account with that email. Ask the main admin to create one for you.'],
  errWrongPass: ['كلمة السر غلط.', 'That password is wrong.'],
  errBadEmail: ['الإيميل ده مش صحيح.', 'That email isn’t valid.'],
  errTooMany: ['محاولات كتير. استنى شوية وحاول تاني.',
               'Too many attempts. Wait a moment and try again.'],
  errNetwork: ['مفيش اتصال بالإنترنت.', 'No connection.'],
  errGeneric: ['تعذّر الدخول. حاول تاني.', 'Could not sign in. Try again.'],
  // adding an admin (the login and the permissions are two different things)
  newPassL: ['كلمة سر الدخول', 'Sign-in password'],
  newPassHint: ['٦ حروف على الأقل. لو الحساب موجود بالفعل، هيفضل بكلمة سره.',
                'At least 6 characters. If the account already exists, it keeps its own password.'],
  addedNew: ['اتعمل حساب لـ {0} وممكن يدخل دلوقتي ✓',
             'Created an account for {0} — they can sign in now ✓'],
  addedExisting: ['{0} عنده حساب بالفعل — اداله الصلاحيات، وبيدخل بكلمة سره ✓',
                  '{0} already had an account — permissions granted, they sign in with their own password ✓'],
  addFailed: ['فشلت الإضافة', 'Could not add them'],
  badEmail: ['اكتب إيميل صحيح', 'Enter a valid email'],
  weakPass: ['كلمة السر لازم ٦ حروف على الأقل', 'The password needs at least 6 characters'],
  pickPerms: ['اختار الصلاحيات الأول', 'Pick their permissions first'],
  alreadySuper: ['ده أدمن أساسي بالفعل', 'That is already a super admin'],
  sessionEnded: ['انتهت الجلسة — سجّل الدخول من جديد', 'Session ended — sign in again'],
  resetPass: ['ابعت رابط كلمة سر', 'Send a password link'],
  resetSent: ['اتبعت لـ {0} رابط يعيّن به كلمة سره ✓', 'Sent {0} a link to set their password ✓'],
  resetFailed: ['تعذّر إرسال الرابط', 'Could not send the link'],
  noAccount: ['مفيش حساب بالإيميل ده', 'There is no account with that email'],
  fAll: ['الكل', 'All'],
  fOnline: ['متصل', 'Online'],
  fPending: ['بيطلب ترخيص', 'Awaiting licence'],
  fUnlicensed: ['غير مرخّص', 'Not licensed'],
  grant: ['منح ترخيص', 'Grant licence'],
  noMatch: ['لا توجد أجهزة مطابقة.', 'No units match.'],
  online: ['متصل', 'Online'],
  offline: ['غير متصل', 'Offline'],
  unregistered: ['غير مسجّل', 'Not registered'],
  licensed: ['مرخّص', 'Licensed'],
  unlicensed: ['غير مرخّص', 'Not licensed'],
  licRequested: ['طلب ترخيص', 'Licence requested'],
  // device sheet
  unit: ['وحدة كوش سمارت', 'KUSH SMART unit'],
  gOwner: ['المالك', 'Owner'],
  gDevice: ['الجهاز', 'Device'],
  gConn: ['الاتصال', 'Connection'],
  gLicence: ['الترخيص', 'Licence'],
  fName: ['الاسم', 'Name'],
  fEmail: ['الإيميل', 'Email'],
  fCountry: ['الدولة', 'Country'],
  fManufacturer: ['الشركة المصنّعة', 'Manufacturer'],
  fModel: ['الموديل', 'Model'],
  fBoard: ['البورد', 'Board'],
  fChannels: ['القنوات', 'Channels'],
  fFw: ['الإصدار', 'Firmware'],
  fRegistered: ['مسجّل في النظام', 'In the registry'],
  fIp: ['IP', 'IP'],
  fSignal: ['الإشارة', 'Signal'],
  fLastSeen: ['آخر ظهور', 'Last seen'],
  fRuntime: ['مدّة التشغيل', 'Runtime'],
  fMemory: ['الذاكرة الحرّة', 'Free memory'],
  fState: ['الحالة', 'State'],
  fLicSince: ['مرخّص من', 'Licensed for'],
  fLicDate: ['تاريخ الترخيص', 'Licensed on'],
  gSharing: ['المشاركة', 'Sharing'],
  fSharedWith: ['مُشارك مع', 'Shared with'],
  noShares: ['مش متشارك مع حد', 'Not shared with anyone'],
  sharedBadge: ['مُشارك', 'Shared'],
  yes: ['نعم', 'Yes'],
  noBroadcastOnly: ['لا (من البث فقط)', 'No (live feed only)'],
  revoke: ['سحب الترخيص', 'Revoke licence'],
  removeDev: ['حذف من السجل', 'Remove from registry'],
  // live feed (broker) settings
  brokerT: ['البث الحيّ', 'Live feed'],
  brokerP: ['حساب الأدمن اللي بيقرأ بثّ كل الأجهزة. بيتحفظ في متصفّحك بس.',
            'The admin account that reads every unit’s feed. Stored in your browser only.'],
  brokerUrl: ['عنوان البث', 'Broker address'],
  brokerUser: ['اسم المستخدم', 'Username'],
  brokerPass: ['كلمة السر', 'Password'],
  brokerSave: ['اتصال', 'Connect'],
  brokerNote: ['لو البث مش متاح، الحالة بتتحسب من آخر ظهور للجهاز.',
               'Without the feed, a unit’s state is inferred from when it was last seen.'],
  // licence-request alerts
  reqTitle: ['جهاز جديد عايز ترخيص', 'A unit is asking to be licensed'],
  bellT: ['طلبات الترخيص', 'Licence requests'],
  bellEmpty: ['مفيش طلبات جديدة.', 'No new requests.'],
  bellEnable: ['فعّل إشعارات سطح المكتب', 'Turn on desktop alerts'],
  bellBlocked: ['الإشعارات متمنوعة من المتصفّح.', 'Alerts are blocked in your browser.'],
  notifOn: ['هيوصلك إشعار أول ما جهاز يطلب ترخيص ✓', 'You’ll be alerted the moment a unit asks ✓'],
  notifUnsupported: ['المتصفّح ده مش بيدعم الإشعارات.', 'This browser doesn’t support alerts.'],
  view: ['افتح', 'Open'],
  // junk
  junkT: ['سجلات تالفة', 'Broken records'],
  junkP: ['دي مش أجهزة — اتسجّلت بالغلط من نسخة قديمة من التطبيق. امسحها.',
          'These aren’t units — an older app build registered them by mistake. Delete them.'],
  del: ['حذف', 'Delete'],
};

const isEn = (lang) => lang === 'en';

// "3 يوم" / "3d" — the units differ, and so does the shape of the sentence.
function fmtDur(sec, lang) {
  if (sec == null || sec <= 0) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (isEn(lang)) {
    if (d >= 1) return `${d}d ${h}h`;
    if (h >= 1) return `${h}h ${m}m`;
    return `${m}m`;
  }
  if (d >= 1) return `${d} يوم و${h} ساعة`;
  if (h >= 1) return `${h} ساعة و${m} دقيقة`;
  return `${m} دقيقة`;
}

// A real unit id: a hex MAC, optionally with a legacy board prefix (ESP32-…).
// Anything else in device_registry is junk a buggy client wrote and should be
// deleted, not shown as a device.
const isSerial = (s) => /^(?:[A-Za-z0-9]+-)?[0-9A-Fa-f]{6,16}$/.test(String(s || '').trim());

function rel(date, lang, suffix) {
  if (!date) return '—';
  let ms = Date.now() - date.getTime();
  if (ms < 0) ms = 0;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000);
  if (isEn(lang)) {
    if (d >= 1) return `${d}d${suffix ? ' ago' : ''}`;
    if (h >= 1) return `${h}h${suffix ? ' ago' : ''}`;
    if (m >= 1) return `${m}m${suffix ? ' ago' : ''}`;
    return 'just now';
  }
  if (d >= 1) return `${d} يوم${suffix || ''}`;
  if (h >= 1) return `${h} ساعة${suffix || ''}`;
  if (m >= 1) return `${m} دقيقة${suffix || ''}`;
  return 'الآن';
}

const TYPE = {
  power: { Ic: Bolt, label: ['عدّاد طاقة', 'Power meter'] },
  lock: { Ic: Lock, label: ['قفل', 'Smart lock'] },
  ir: { Ic: Signal, label: ['ريموت IR', 'IR remote'] },
  relay: { Ic: Bulb, label: ['مفاتيح', 'Switches'] },
};

export default function AdminConsole() {
  const fb = useRef(null);
  // The console owns its language (and therefore its direction) rather than
  // inheriting the marketing site's — an Arabic console laid out LTR is broken.
  const [lang, setLang] = useState('ar');
  // `{0}` in a string is replaced by the argument, so a message can name the
  // thing it happened to instead of being vague.
  const t = (k, a) => {
    const s = STR[k] ? STR[k][isEn(lang) ? 1 : 0] : k;
    return a == null ? s : s.replace('{0}', a);
  };
  const tl = (pair) => (Array.isArray(pair) ? pair[isEn(lang) ? 1 : 0] : pair);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [registry, setRegistry] = useState([]);   // Firestore licence authority
  const [sharesBySerial, setSharesBySerial] = useState({}); // serial -> [{ email, uid, createdAt }]
  const [liveState, setLiveState] = useState({});  // serial -> telemetry (MQTT)
  const [liveStatus, setLiveStatus] = useState({}); // serial -> online (MQTT)
  const [q, setQ] = useState('');
  const [view, setView] = useState('all'); // all | online | pending | unlicensed
  const [newSerial, setNewSerial] = useState('');
  const [sel, setSel] = useState(null);
  const [toast, setToast] = useState('');
  const [allowList, setAllowList] = useState(null); // null=loading, []=loaded
  const [newAdmin, setNewAdmin] = useState('');
  const [newPerms, setNewPerms] = useState([]); // ticked while adding an admin
  const [newPass, setNewPass] = useState('');   // their sign-in password
  // Licence credit. `myCredit` is what the signed-in admin can spend; `creditMap`
  // is everyone's balance (super admin only).
  const [myCredit, setMyCredit] = useState(null);
  const [creditMap, setCreditMap] = useState({});
  const [creditDraft, setCreditDraft] = useState({});  // email -> input value
  // email -> ["licenses", ...] for every scoped admin (from admin_perms/*)
  const [permsMap, setPermsMap] = useState({});
  const [permBusy, setPermBusy] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [usersMap, setUsersMap] = useState({}); // uid -> { name, country }
  const [tab, setTab] = useState('fleet');      // fleet | firmware | invoices | countries | admins
  const [fwIndex, setFwIndex] = useState({});  // board -> { version, url, size, updatedAt }
  const [fwBusy, setFwBusy] = useState('');     // board currently uploading
  const [fwVer, setFwVer] = useState({});       // board -> version input
  // Published mobile-app release shown on the website's download page.
  const [appRel, setAppRel] = useState(null);   // { version, apk, notes, updatedAt }
  const [appForm, setAppForm] = useState({ version: '', apk: '', notes: '' });
  const [appBusy, setAppBusy] = useState(false);
  const [appPct, setAppPct] = useState(0);   // APK upload progress (0-100)

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
  const [mqttState, setMqttState] = useState('off'); // off|connecting|on|error
  const mqttRef = useRef(null);

  // Whether a unit is "online" depends on how long ago we last heard from it, so
  // it has to be recomputed as time passes, not just when a message arrives.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Units waiting to be licensed — the bell, and the desktop notification.
  const [alerts, setAlerts] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifPerm, setNotifPerm] = useState('default');
  const seenReq = useRef(null);   // null until the first snapshot lands

  function flash(m) { setToast(m); setTimeout(() => setToast(''), 2600); }

  // Remember the operator's language across sessions.
  useEffect(() => {
    const saved = window.localStorage.getItem('adm_lang');
    if (saved === 'en' || saved === 'ar') setLang(saved);
  }, []);
  function switchLang(next) {
    setLang(next);
    window.localStorage.setItem('adm_lang', next);
  }

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
  const superAdmin = isBootstrap(user);

  // Esc closes the device sheet — a centred modal should behave like one.
  useEffect(() => {
    if (!sel) return;
    const onKey = (e) => { if (e.key === 'Escape') setSel(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel]);

  // ── Licence-request alerts ─────────────────────────────────────────────────
  // A unit that asks to be licensed is the one thing in this console that can't
  // wait for someone to notice a number change. device_registry is already a
  // live stream, so the moment a device raises `licenseRequested` we surface it:
  // an entry in the bell, and a desktop notification if the operator allowed one.
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setNotifPerm(Notification.permission);
  }, []);

  async function askNotifPerm() {
    if (!('Notification' in window)) { flash(t('notifUnsupported')); return; }
    const p = await Notification.requestPermission();
    setNotifPerm(p);
    if (p === 'granted') flash(t('notifOn'));
  }

  useEffect(() => {
    if (!allowed || !can('licenses')) return;
    const pending = registry.filter((r) => r.licenseRequested && !r.licensed && isSerial(r.serial));

    // The FIRST snapshot is the existing backlog, not news — don't fire a burst
    // of notifications for requests that have been sitting there for days.
    if (!seenReq.current) {
      seenReq.current = new Set(pending.map((r) => r.serial));
      setAlerts(pending.map((r) => ({ ...r, at: r.licensedAt || new Date() })));
      return;
    }

    const fresh = pending.filter((r) => !seenReq.current.has(r.serial));
    if (!fresh.length) {
      // Drop the ones that have since been handled, so the bell stays honest.
      const live = new Set(pending.map((r) => r.serial));
      seenReq.current = live;
      setAlerts((a) => a.filter((x) => live.has(x.serial)));
      return;
    }
    fresh.forEach((r) => seenReq.current.add(r.serial));
    setAlerts((a) => [...fresh.map((r) => ({ ...r, at: new Date() })), ...a].slice(0, 30));

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      fresh.forEach((r) => {
        const who = r.ownerEmail || usersMap[r.owner]?.name || '';
        const body = [r.unitName, r.board, who].filter(Boolean).join(' · ') || r.serial;
        try {
          const n = new Notification(t('reqTitle'), {
            body: `${r.serial}\n${body}`,
            tag: `lic-${r.serial}`,   // one notification per unit, not a pile
            icon: '/assets/icon.png',
          });
          n.onclick = () => { window.focus(); setTab('fleet'); setSel(r.serial); n.close(); };
        } catch (_) { /* the bell still has it */ }
      });
    }
  }, [registry, allowed, usersMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- per-admin permissions (admin_perms/{email}) ----
  useEffect(() => {
    if (!fb.current || !allowed) { setPermsMap({}); return; }
    return onSnapshot(
      collection(fb.current.db, 'admin_perms'),
      (snap) => {
        const m = {};
        snap.forEach((d) => {
          const p = d.data().perms;
          m[String(d.id).toLowerCase()] = Array.isArray(p) ? p : [];
        });
        setPermsMap(m);
      },
      () => setPermsMap({}),
    );
  }, [user, allowList]); // eslint-disable-line react-hooks/exhaustive-deps

  // A super admin can do everything; everyone else only what they were granted.
  const myPerms = superAdmin
    ? PERM_KEYS
    : (permsMap[(user?.email || '').toLowerCase()] || []);
  const can = (p) => superAdmin || myPerms.includes(p);

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

  // ---- device sharing stream (app's /device/share grants) ----
  // firestore.rules lets an admin read every device_shares doc (not just the
  // ones naming them) for the same reason device_registry is readable by any
  // signed-in user — the console needs fleet-wide visibility.
  useEffect(() => {
    if (!fb.current || !allowed) { setSharesBySerial({}); return; }
    return onSnapshot(
      collection(fb.current.db, 'device_shares'),
      (qs) => {
        const m = {};
        qs.forEach((d) => {
          const x = d.data();
          const serial = x.serial || '';
          if (!serial) return;
          (m[serial] ||= []).push({
            uid: x.sharedUid || '',
            email: x.sharedEmail || '',
            createdAt: toDate(x.createdAt),
          });
        });
        setSharesBySerial(m);
      },
      () => setSharesBySerial({}),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowList]);

  // ---- invoices / purchases stream ----
  useEffect(() => {
    // Rules now deny license_purchases to admins without invoices/licenses, so
    // don't even subscribe — it would only produce a permission error.
    if (!fb.current || !allowed) return;
    if (!can('invoices') && !can('licenses')) { setInvoices([]); return; }
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

  // ---- licence purchase requests + credit (from the bridge) ----
  //
  // `myPerms` is in the deps ON PURPOSE. This used to depend only on the user and
  // the allowlist — but `can('licenses')` reads permsMap, which arrives from its
  // OWN snapshot a moment later. So on first load the guard was still false, the
  // fetch never fired, and an admin saw no balance until something else happened
  // to call loadCredit() — like activating a licence. Re-running once the
  // permissions land is what makes the balance appear as soon as you open the page.
  useEffect(() => {
    if (!allowed) return;
    if (can('licenses')) { loadLicReqs(); loadCredit(); }
    if (superAdmin) loadAllCredit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowList, myPerms.join(','), superAdmin]);

  // Keep the balance honest while the page is open: the super admin may top you
  // up (or another session may spend) while you're sitting here. Refresh when the
  // tab regains focus, and quietly every minute.
  useEffect(() => {
    if (!allowed || !can('licenses')) return;
    const refresh = () => { loadCredit(); if (superAdmin) loadAllCredit(); };
    const onFocus = () => { if (!document.hidden) refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const id = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, myPerms.join(','), superAdmin]);

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
    if (allowed && can('firmware')) { loadFwIndex(); loadAppRelease(); }
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
        // Firmware may send the old full-word state/status keys or the new
        // short ones (see "the JSON key-shortening plan" — same aliasing
        // bridge/registry.js does in normalizeStateKeys()) — read whichever
        // is present so the fleet view doesn't go blank the moment a unit
        // gets reflashed ahead of the others.
        const serial = j.device || j.d || j.serial || j.sr || topic.split('/').slice(-2, -1)[0];
        if (!serial) return;
        if (topic.endsWith('/status')) {
          const status = j.status ?? j.s;
          setLiveStatus((m) => ({ ...m, [serial]: status === 'online' }));
        } else if (topic.endsWith('/state')) {
          const jType = j.type ?? j.t;
          // "irrf" (ATGENX HALO: IR + RF + status ring + buzzer) shares the
          // plain "ir" remote's page and channel shape (a buttons[] array) —
          // fold it into the same display category here. Its OWN firmware
          // image is still a separate FW_BOARDS/BOARDS key ('halo'), matched
          // by board name below, since the binary itself does differ.
          const type = jType === 'power' ? 'power'
            : jType === 'lock' ? 'lock'
            : (jType === 'ir' || jType === 'irrf') ? 'ir'
            : 'relay';
          const meters = j.meters || j.mt;
          const buttons = j.buttons || j.bn;
          const states = j.states || j.st;
          const channels = type === 'power'
            ? (Array.isArray(meters) ? meters.length : null)
            : type === 'ir'
            ? (Array.isArray(buttons) ? buttons.length : null)
            : (Array.isArray(states) ? states.length : null);
          const uptime = j.uptime ?? j.up;
          const heap = j.heap ?? j.hp;
          const licensed = j.licensed ?? j.lc;
          setLiveState((m) => ({
            ...m,
            [serial]: {
              name: j.project || j.pj || j.name || j.n || '', board: j.board || j.bd || '', type, channels,
              manufacturer: j.manufacturer || j.mf || '', model: j.model || j.md || '',
              fw: j.fw != null ? String(j.fw) : '', ip: j.ip || '', rssi: j.rssi ?? j.rs,
              // Cumulative runtime in seconds. The unit persists it across
              // reboots, so it answers "how long has this device been working",
              // not just "how long since it last restarted".
              uptime: typeof uptime === 'number' ? uptime : null,
              heap: typeof heap === 'number' ? heap : null,
              boardLicensed: licensed === true,
              owner: topic.split('/')[0] || '', // first topic segment is the owner uid
              // When we last actually heard from it — this, not the retained
              // last-will, is what decides "online" (see serialOnline).
              at: Date.now(),
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

  // ---- published mobile-app release ----
  // The download page reads this from the bridge, so publishing a new APK no
  // longer means editing the site and redeploying it.
  async function loadAppRelease() {
    try {
      const r = await fetch(`${FW_BASE}/app/release`, { cache: 'no-store' });
      const j = await r.json();
      setAppRel(j);
      setAppForm({ version: j.version || '', apk: j.apk || '', notes: j.notes || '' });
    } catch (_) { /* keep whatever we had */ }
  }

  // Upload the APK straight to our own server: it hosts the file and hands back
  // the link, so releasing a build needs nothing outside this console.
  //
  // XMLHttpRequest rather than fetch(), because fetch cannot report upload
  // progress and a ~90MB APK needs a real progress bar.
  function uploadApk(file) {
    if (!file) return;
    if (!/\.apk$/i.test(file.name)) { flash('لازم يكون ملف .apk'); return; }
    const version = (appForm.version || '').trim();
    if (!/^v?\d+\.\d+\.\d+(\+\d+)?$/.test(version)) {
      flash('اكتب رقم النسخة الأول — مثال: 1.0.12');
      return;
    }
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash('انتهت الجلسة — سجّل الدخول من جديد'); return; }

    setAppBusy(true);
    setAppPct(0);
    cu.getIdToken().then((token) => {
      const xhr = new XMLHttpRequest();
      const qs = new URLSearchParams({ version, notes: appForm.notes || '' });
      xhr.open('POST', `${FW_BASE}/app/upload?${qs}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', 'application/vnd.android.package-archive');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setAppPct(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setAppBusy(false); setAppPct(0);
        let j = {};
        try { j = JSON.parse(xhr.responseText); } catch (_) {}
        if (xhr.status === 200 && j.ok) {
          flash(`تم رفع ونشر ${j.version} ✓`);
          loadAppRelease();
        } else if (j.error === 'not_an_apk') flash('الملف ده مش APK');
        else if (j.error === 'bad_version') flash('رقم النسخة غير صحيح');
        else if (xhr.status === 403) flash('مالكش صلاحية رفع التحديثات');
        else if (xhr.status === 413) flash('الملف كبير على السيرفر');
        else flash('فشل الرفع: ' + (j.error || xhr.status));
      };
      xhr.onerror = () => { setAppBusy(false); setAppPct(0); flash('فشل الرفع — الشبكة'); };
      xhr.onabort = () => { setAppBusy(false); setAppPct(0); };
      xhr.send(file);
    }).catch(() => { setAppBusy(false); setAppPct(0); flash('فشل الرفع'); });
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
    } catch (err) {
      // Say what actually went wrong. "Wrong credentials or no such account"
      // covered two very different problems and told you how to fix neither.
      const c = err?.code || '';
      if (c === 'auth/user-not-found')          setAuthErr(t('errNoUser'));
      else if (c === 'auth/wrong-password' ||
               c === 'auth/invalid-credential') setAuthErr(t('errWrongPass'));
      else if (c === 'auth/invalid-email')      setAuthErr(t('errBadEmail'));
      else if (c === 'auth/too-many-requests')  setAuthErr(t('errTooMany'));
      else if (c === 'auth/network-request-failed') setAuthErr(t('errNetwork'));
      else setAuthErr(t('errGeneric'));
    }
    finally { setBusy(false); }
  }

  // Add an admin: create their LOGIN, then grant the permissions.
  //
  // These are two different things, and conflating them is what left a new admin
  // stuck at "no such account": writing their email into config/admins says they
  // are ALLOWED in, but it doesn't give them anything to sign in WITH. So the
  // account is created first — if they already have one (they signed up in the
  // app), that's fine, they keep their own password.
  async function addAdmin() {
    const em = newAdmin.trim().toLowerCase();
    if (!em || !em.includes('@')) { flash(t('badEmail')); return; }
    if (ADMIN_EMAILS.includes(em)) { flash(t('alreadySuper')); return; }
    const perms = PERM_KEYS.filter((k) => newPerms.includes(k));
    if (!perms.length) { flash(t('pickPerms')); return; }
    if (newPass.length < 6) { flash(t('weakPass')); return; }

    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash(t('sessionEnded')); return; }
    setPermBusy(em);
    try {
      // 1. the login
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/admin/user`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ email: em, password: newPass }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) {
        if (j.error === 'weak_password') flash(t('weakPass'));
        else if (j.error === 'bad_email') flash(t('badEmail'));
        else flash(t('addFailed') + ': ' + (j.error || r.status));
        setPermBusy('');
        return;
      }

      // 2. the permissions
      await setDoc(
        doc(fb.current.db, 'admin_perms', em),
        { perms, updatedAt: serverTimestamp() },
        { merge: true },
      );
      await setDoc(
        doc(fb.current.db, 'config', 'admins'),
        { emails: arrayUnion(em) },
        { merge: true },
      );
      await refreshBridgeAdmins();
      setNewAdmin(''); setNewPerms([]); setNewPass('');
      // Say which of the two things happened — a fresh login vs. an existing one
      // — so nobody hands over a password that was never actually set.
      flash(j.existed ? t('addedExisting', em) : t('addedNew', em));
    } catch (e) { flash(t('addFailed') + ': ' + (e.code || e.message)); }
    setPermBusy('');
  }

  // Email an admin a link to set their own password — for a new admin who should
  // pick their own, or one who's locked out.
  async function resetAdminPassword(em) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash(t('sessionEnded')); return; }
    setPermBusy(em);
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/admin/user/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ email: em }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) flash(t('resetSent', em));
      else if (j.error === 'no_account') flash(t('noAccount'));
      else flash(t('resetFailed'));
    } catch (_) { flash(t('resetFailed')); }
    setPermBusy('');
  }
  async function removeAdmin(em) {
    try {
      await setDoc(doc(fb.current.db, 'config', 'admins'), { emails: arrayRemove(em) }, { merge: true });
      // Drop their permissions too, so re-adding the same email later doesn't
      // silently restore what they used to be allowed to do.
      await setDoc(doc(fb.current.db, 'admin_perms', em), { perms: [] }, { merge: true });
      await refreshBridgeAdmins();
      flash(`تم حذف ${em}`);
    } catch (e) { flash('فشل: ' + e.code); }
  }

  // Grant / revoke one permission for one admin.
  async function togglePerm(em, key, on) {
    if (!PERM_KEYS.includes(key)) return;
    setPermBusy(em);
    try {
      await setDoc(
        doc(fb.current.db, 'admin_perms', em),
        { perms: on ? arrayUnion(key) : arrayRemove(key), updatedAt: serverTimestamp() },
        { merge: true },
      );
      await refreshBridgeAdmins();
      flash(on ? 'تمت الإضافة ✓' : 'تم السحب ✓');
    } catch (e) { flash('فشل: ' + (e.code || e.message)); }
    setPermBusy('');
  }

  // The bridge caches the admin list + permissions for a minute; tell it to drop
  // that cache so a change takes effect right away instead of after the timeout.
  async function refreshBridgeAdmins() {
    try {
      const cu = fb.current?.auth?.currentUser;
      if (!cu) return;
      const token = await cu.getIdToken();
      await fetch(`${FW_BASE}/admin/invalidate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) { /* the cache expires on its own within a minute anyway */ }
  }

  // Remove a registry doc. Used for the junk rows a buggy client wrote, and for
  // retiring a unit. Needs the 'fleet' permission (enforced in firestore.rules).
  async function removeDevice(serial, label) {
    if (!window.confirm(`حذف «${label || serial}» من السجل؟ الجهاز هيختفي من الأسطول.`)) return;
    try {
      await deleteDoc(doc(fb.current.db, 'device_registry', serial));
      if (sel === serial) setSel(null);
      flash('تم الحذف ✓');
    } catch (e) { flash('فشل الحذف: ' + (e.code || e.message)); }
  }

  // Licensing goes through the BRIDGE, not straight into Firestore.
  //
  // It has to: activating spends the admin's credit, and the browser cannot be
  // trusted to enforce a balance it could simply write around. The bridge takes
  // the money and grants the licence in one place, and the Firestore rules now
  // refuse the licence fields to every client — so this is the only way in.
  async function setLicense(serial, value) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash(t('sessionEnded')); return false; }
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/license/${value ? 'activate' : 'revoke'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ serial }),
      });
      const j = await r.json().catch(() => ({}));

      if (r.status === 402) {   // out of credit — say by how much
        flash(t('noCredit', `${j.balance} / ${j.price} ${j.currency || ''}`));
        loadCredit();
        return false;
      }
      if (r.status === 403 && j.error === 'super_only') { flash(t('revokeSuperOnly')); return false; }
      if (!j.ok) { flash(t('licFailed') + ': ' + (j.error || r.status)); return false; }

      if (!value) flash(t('licRevoked', serial));
      else if (j.already) flash(t('licAlready', serial));
      else if (j.charged > 0) flash(t('licCharged', `${j.charged} ${j.currency} · ${t('left')} ${j.balance}`));
      else flash(t('licFree', serial));
      loadCredit();
      return true;
    } catch (_) { flash(t('licFailed')); return false; }
  }

  // What this admin has left to spend (a super admin spends nothing).
  async function loadCredit() {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) return;
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/license/credit`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      const j = await r.json();
      if (j && !j.error) setMyCredit(j);
    } catch (_) { /* leave what we had */ }
  }

  // Super admin: top an admin up, and read everyone's balance.
  async function loadAllCredit() {
    const cu = fb.current?.auth?.currentUser;
    if (!cu || !superAdmin) return;
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/admin/credit`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      const j = await r.json();
      if (j && j.credit) setCreditMap(j.credit);
    } catch (_) {}
  }

  async function setAdminCredit(em, balance) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash(t('sessionEnded')); return; }
    const n = Number(balance);
    if (!Number.isFinite(n) || n < 0) { flash(t('badBalance')); return; }
    setPermBusy(em);
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/admin/credit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ email: em, balance: n }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) { flash(t('creditSet', `${em} · ${n}`)); await loadAllCredit(); }
      else flash(t('creditFailed') + ': ' + (j.error || r.status));
    } catch (_) { flash(t('creditFailed')); }
    setPermBusy('');
  }

  async function addLicense() {
    const s = newSerial.trim().toUpperCase();
    if (!s) return;
    if (!isSerial(s)) { flash(t('badSerial')); return; }
    // Only clear the field if it actually worked — otherwise you'd retype the
    // serial after every "out of credit".
    const ok = await setLicense(s, true);
    if (ok) { setNewSerial(''); setSel(s); }
  }

  // ---- merge registry + live ----
  const devices = useMemo(() => {
    const map = new Map();
    // An older app build turned a Home Assistant discovery payload's `device`
    // MAP into a string and registered it as a serial, so device_registry can
    // hold junk docs like "{identifiers: [kushir_…], name: …}". Keep them out of
    // the fleet — but still list them under "junk" below so they can be deleted.
    for (const r of registry) {
      if (!isSerial(r.serial)) continue;
      map.set(r.serial, { ...r, inRegistry: true });
    }
    for (const [serial, s] of Object.entries(liveState)) {
      if (!isSerial(serial)) continue;
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
        online: serialOnline(d.serial, liveStatus, d.lastSeen, liveState),
        sharedWith: sharesBySerial[d.serial] || [],
      };
    });

    // A FIXED order. It used to sort by online-then-licensed, so the moment a
    // unit reconnected it jumped to the top and shoved every card after it down —
    // you'd go to click one device and press another. Nothing you can act on
    // should move under your cursor.
    //
    // Order is by name, then serial: both are stable, so a card stays exactly
    // where it was for the whole session. Whether a unit is up is shown by its
    // stripe and its light, and the filters below let you narrow the list
    // WITHOUT rearranging it.
    arr.sort((a, b) => {
      const an = (a.name || '').trim(), bn = (b.name || '').trim();
      if (an && bn && an !== bn) return an.localeCompare(bn, 'ar');
      if (an && !bn) return -1;      // named units before unnamed ones
      if (!an && bn) return 1;
      return a.serial.localeCompare(b.serial);
    });
    return arr;
    // `tick` is in here on purpose: "online" depends on how long ago we last
    // heard from a unit, so it has to be re-evaluated as time passes — not only
    // when a message happens to arrive.
  }, [registry, liveState, liveStatus, usersMap, sharesBySerial, tick]);

  // Registry docs that aren't real units — see the note in `devices`.
  const junk = useMemo(
    () => registry.filter((r) => !isSerial(r.serial)),
    [registry],
  );

  // Devices grouped by country (for the "by country" view).
  const byCountry = useMemo(() => {
    const m = {};
    for (const d of devices) {
      const c = d.country || 'غير معروف';
      m[c] = (m[c] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [devices]);

  // Narrowing the list, rather than reordering it, is how you focus on the units
  // that matter — the order itself never changes.
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = devices;
    if (view === 'online')   out = out.filter((d) => d.online);
    if (view === 'pending')  out = out.filter((d) => d.licenseRequested && !d.licensed);
    if (view === 'unlicensed') out = out.filter((d) => !d.licensed);
    if (!t) return out;
    return out.filter((d) =>
      d.serial.toLowerCase().includes(t) ||
      (d.ownerEmail || '').toLowerCase().includes(t) ||
      (d.ownerName || '').toLowerCase().includes(t) ||
      (d.country || '').toLowerCase().includes(t) ||
      (d.name || '').toLowerCase().includes(t));
  }, [devices, q, view]);

  const stats = useMemo(() => ({
    total: devices.length,
    licensed: devices.filter((d) => d.licensed).length,
    pending: devices.filter((d) => !d.licensed && d.licenseRequested).length,
    online: devices.filter((d) => d.online).length,
  }), [devices]);

  const selected = sel ? devices.find((d) => d.serial === sel) : null;

  // Every section: what it's called, what it's for, and the live count worth
  // seeing before you open it. The subtitle is the page's promise — it says what
  // you can do here, not what the system stores.
  const SECTIONS = [
    { k: 'fleet', Ic: Cpu, label: t('s_fleet'), sub: t('s_fleet_sub'), n: stats.total },
    { k: 'firmware', Ic: Signal, label: t('s_firmware'), sub: t('s_firmware_sub'), n: null },
    { k: 'notify', Ic: Bell, label: t('s_notify'), sub: t('s_notify_sub'), n: null },
    { k: 'license', Ic: Lock, label: t('s_license'), sub: t('s_license_sub'),
      n: licReqs.filter((r) => r.status === 'new').length || null },
    { k: 'invoices', Ic: Bolt, label: t('s_invoices'), sub: t('s_invoices_sub'),
      n: invoices.length || null },
    { k: 'countries', Ic: Bulb, label: t('s_countries'), sub: t('s_countries_sub'),
      n: byCountry.length || null },
    { k: 'credit', Ic: Bolt, label: t('s_credit'), sub: t('s_credit_sub'), n: null },
    { k: 'admins', Ic: Lock, label: t('s_admins'), sub: t('s_admins_sub'), n: null },
  ].filter(({ k }) => {
    // Money and the admin list both stay with the supers. Whoever sets the price
    // or hands out balances decides what every licence is worth; whoever edits
    // the admin list could grant themselves every other permission.
    if (k === 'admins' || k === 'credit') return superAdmin;
    if (k === 'license') return can('licenses');
    return can(k);
  });
  // Land on a section they're allowed to see: the default is 'fleet', which a
  // licences-only admin must never open.
  const activeTab = SECTIONS.some((s) => s.k === tab) ? tab : (SECTIONS[0]?.k || '');
  const section = SECTIONS.find((s) => s.k === activeTab);

  // ---- render ----
  if (!authChecked) return <div className="ops" dir={isEn(lang) ? "ltr" : "rtl"}><div className="ops-center">جارٍ التحميل…</div></div>;

  if (!user) {
    return (
      <div className="ops" dir={isEn(lang) ? "ltr" : "rtl"}>
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

  if (allowList === null) return <div className="ops" dir={isEn(lang) ? "ltr" : "rtl"}><div className="ops-center">جارٍ التحقّق من الصلاحية…</div></div>;

  if (!allowed) {
    return (
      <div className="ops" dir={isEn(lang) ? "ltr" : "rtl"}>
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

  const conn = mqttState === 'on' ? t('liveOn')
    : mqttState === 'connecting' ? t('liveConnecting')
    : mqttState === 'error' ? t('liveErr')
    : t('liveOff');

  return (
    <div className="ops" dir={isEn(lang) ? "ltr" : "rtl"}>
      {/* Command bar — one slim line. It used to shout the wordmark; the console
          knows what it is, so it just states who you are and whether the feed is
          live, and gets out of the way. */}
      <header className="ops-bar">
        <div className="ops-id">
          <span className="ops-mark"><Lock /></span>
          <b>KUSH</b><span className="ops-sub">{t('console')}</span>
        </div>

        {/* The live feed is plumbing: it connects itself. A status light reports
            it — it isn't a button, and it opens nothing. */}
        <span className={`ops-link ${mqttState}`} title={conn}>
          <span className={`led ${mqttState}`} />
          <span className="ops-link-t">{conn}</span>
        </span>

        <div className="ops-id-r">
          {/* The bell: units waiting to be licensed. */}
          {can('licenses') && (
            <div className="bell-wrap">
              <button
                className={`bell ${alerts.length ? 'has' : ''}`}
                onClick={() => setBellOpen((v) => !v)}
                aria-label={t('bellT')}>
                <Bell />
                {alerts.length > 0 && <span className="bell-n">{alerts.length}</span>}
              </button>

              {bellOpen && (
                <>
                  <div className="bell-scrim" onClick={() => setBellOpen(false)} />
                  <div className="bell-pop">
                    <div className="bell-h">
                      <b>{t('bellT')}</b>
                      {notifPerm === 'granted'
                        ? <span className="seal ok">✓</span>
                        : notifPerm === 'denied'
                          ? <span className="bell-note">{t('bellBlocked')}</span>
                          : <button className="ops-ghost sm" onClick={askNotifPerm}>
                              {t('bellEnable')}
                            </button>}
                    </div>

                    {!alerts.length && <div className="bell-empty">{t('bellEmpty')}</div>}

                    {alerts.map((a) => (
                      <button key={a.serial} className="bell-item"
                        onClick={() => { setBellOpen(false); setTab('fleet'); setSel(a.serial); }}>
                        <span className="bell-item-t">
                          <b>{a.unitName || t('unit')}</b>
                          <small className="mono">{a.serial}</small>
                        </span>
                        <span className="bell-item-m">
                          {[a.ownerEmail, a.board].filter(Boolean).join(' · ') || '—'}
                        </span>
                        <span className="bell-item-a">{t('view')} ›</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="langsw">
            <button className={!isEn(lang) ? 'on' : ''} onClick={() => switchLang('ar')}>ع</button>
            <button className={isEn(lang) ? 'on' : ''} onClick={() => switchLang('en')}>EN</button>
          </div>
          {/* Who you are and what you're allowed to do — worth showing now that
              two admins can see very different consoles. */}
          {/* An admin who sells licences is spending their own balance, so it
              belongs in the bar — visible the moment they open the console,
              whichever page they land on, not buried in one tab. */}
          {can('licenses') && !superAdmin && myCredit && (
            <span className={`ops-credit ${myCredit.balance <= 0 ? 'empty' : ''}`}
              title={t('myBalance')}>
              <b>{myCredit.balance}</b>
              <small>{myCredit.currency}</small>
            </span>
          )}

          <div className="ops-me">
            <span className="ops-who">{user.email}</span>
            <span className={`ops-role ${superAdmin ? 'super' : ''}`}>
              {superAdmin ? t('superRole') : `${myPerms.length} ${t('nPerms')}`}
            </span>
          </div>
          <button className="ops-ghost sm" onClick={() => signOut(fb.current.auth)}>{t('signout')}</button>
        </div>
      </header>

      <div className="ops-shell">
        {/* Side rail. The active section lights up the same way a live unit does
            — nav, readouts and fleet all say "on" in one language. */}
        <nav className="ops-rail">
          {SECTIONS.map(({ k, Ic, label, n }) => (
            <button key={k}
              className={`rail-item ${activeTab === k ? 'active' : ''}`}
              onClick={() => setTab(k)}>
              <span className="rail-bar" />
              <span className="rail-ic"><Ic /></span>
              <span className="rail-label">{label}</span>
              {n != null && <span className="rail-n">{n}</span>}
            </button>
          ))}
        </nav>

        <main className="ops-main">
          {/* An admin with no permissions yet — an empty screen should say what
              to do next, not just sit there. */}
          {!SECTIONS.length ? (
            <section className="ops-panel">
              <div className="ops-empty" style={{ border: 0, background: 'none' }}>
                {t('noPerms')}
              </div>
            </section>
          ) : (
            <div className="page-h">
              <div className="page-h-t">
                <h1>{section?.label}</h1>
                <p>{section?.sub}</p>
              </div>
              {activeTab === 'firmware' && (
                <button className="ops-ghost sm" onClick={() => { loadFwIndex(); loadAppRelease(); }}>
                  {t('refresh')}
                </button>
              )}
            </div>
          )}

        {activeTab === 'fleet' && (<>
          {/* readouts */}
          <div className="ops-kpis">
            <Kpi Ic={Cpu} n={stats.total} label={t('kFleet')} />
            <Kpi Ic={Lock} n={stats.licensed} label={t('kLicensed')} tone="ok" />
            <Kpi Ic={Bell} n={stats.pending} label={t('kPending')} tone="warn" />
            <Kpi Ic={Signal} n={stats.online} label={t('kOnline')} tone="live" />
          </div>

          {/* Find a unit, or license one that hasn't reported in yet. */}
          <div className="ops-cmd">
            <div className="ops-search">
              <span className="prompt">›</span>
              <input
                placeholder={t('search')}
                value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && filtered.length) setSel(filtered[0].serial); }}
              />
              {q && <span className="hits">{filtered.length}</span>}
            </div>
            {can('licenses') && (
              <div className="ops-add">
                <input placeholder="SERIAL" value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addLicense()} />
                <button className="ops-btn" onClick={addLicense}>{t('grant')}</button>
              </div>
            )}
          </div>

          {/* Narrow the list — the ORDER never changes, so a card never moves out
              from under your cursor when a unit reconnects. */}
          <div className="fl-filters">
            {[
              ['all', t('fAll'), devices.length],
              ['online', t('fOnline'), devices.filter((d) => d.online).length],
              ['pending', t('fPending'), devices.filter((d) => d.licenseRequested && !d.licensed).length],
              ['unlicensed', t('fUnlicensed'), devices.filter((d) => !d.licensed).length],
            ].map(([k, label, n]) => (
              <button key={k}
                className={`fl-chip ${view === k ? 'on' : ''}`}
                onClick={() => setView(k)}>
                {label}<span>{n}</span>
              </button>
            ))}
          </div>

          {/* fleet — a card per unit, with a status stripe down its side */}
          <div className="dev-grid">
            {filtered.map((d) => {
              const ty = TYPE[d.type] || TYPE.relay;
              const owner = [d.ownerName, d.country].filter(Boolean).join(' · ')
                || d.ownerEmail || (d.inRegistry ? '—' : t('unregistered'));
              const tone = d.online ? 'on' : d.licensed ? 'off' : 'idle';
              return (
                <button
                  key={d.serial}
                  className={`dev-card ${tone} ${sel === d.serial ? 'sel' : ''}`}
                  onClick={() => setSel(d.serial)}>
                  <span className="dev-bar" />
                  <span className="dev-top">
                    <span className="dev-ic"><ty.Ic /></span>
                    <span className="dev-name">
                      <b>{d.name || '—'}</b>
                      <small className="mono">{d.serial}</small>
                    </span>
                    <span className={`dev-live ${d.online ? 'on' : ''}`}>
                      <span className={`led ${d.online ? 'on' : 'off'}`} />
                      {d.online ? t('online') : t('offline')}
                    </span>
                  </span>

                  <span className="dev-owner">{owner}</span>

                  {/* How long this unit has actually been running — the number an
                      operator asks for first, so it belongs on the card. */}
                  {d.live?.uptime != null && (
                    <span className="dev-run">
                      <span className="dev-run-l">{t('fRuntime')}</span>
                      <span className="dev-run-v">{fmtDur(d.live.uptime, lang)}</span>
                    </span>
                  )}

                  <span className="dev-foot">
                    <span className="chip">
                      {tl(ty.label)}{d.live?.channels != null ? ` · ${d.live.channels}` : ''}
                    </span>
                    {d.licensed
                      ? <span className="seal ok">{t('licensed')}<i>{rel(d.licensedAt, lang)}</i></span>
                      : d.licenseRequested
                        ? <span className="seal warn">{t('licRequested')}</span>
                        : <span className="seal">{t('unlicensed')}</span>}
                    {d.sharedWith.length > 0 && (
                      <span className="seal share">{t('sharedBadge')}<i>{d.sharedWith.length}</i></span>
                    )}
                  </span>
                </button>
              );
            })}
            {!filtered.length && <div className="ops-empty">{t('noMatch')}</div>}
          </div>

          {/* Registry docs that aren't units — written by an older app build that
              mistook a Home Assistant discovery payload for a device. */}
          {junk.length > 0 && can('fleet') && (
            <div className="junk-box">
              <div className="junk-h">
                <b>{t('junkT')} ({junk.length})</b>
                <p>{t('junkP')}</p>
              </div>
              {junk.map((r) => (
                <div className="junk-row" key={r.serial}>
                  <span className="mono">{r.serial}</span>
                  <button className="ops-ghost sm" onClick={() => removeDevice(r.serial, t('junkT'))}>
                    {t('del')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>)}

        {activeTab === 'firmware' && (
          <section className="ops-panel">

            {/* Mobile app release. Pick the .apk and we host it ourselves and
                generate the link — no GitHub, nothing to paste. */}
            <div className="app-rel">
              <div className="app-rel-h">
                <div>
                  <b>نسخة التطبيق (APK)</b>
                  <p>اكتب رقم النسخة، اختار ملف الـ APK، وهو هيترفع على السيرفر بتاعنا ويتنشر في صفحة التحميل تلقائيًا.</p>
                </div>
                <span className={`seal ${appRel && appRel.version ? 'ok' : ''}`}>
                  {appRel ? `المنشور الآن ${appRel.version}` : '…'}
                </span>
              </div>

              <div className="app-rel-grid">
                <label>
                  <span>رقم النسخة</span>
                  <input className="nt-input" dir="ltr" placeholder="1.0.12"
                    value={appForm.version}
                    disabled={appBusy}
                    onChange={(e) => setAppForm((f) => ({ ...f, version: e.target.value }))} />
                </label>
                <label>
                  <span>ملاحظات التحديث (اختياري)</span>
                  <input className="nt-input" placeholder="أهم ما تغيّر في هذه النسخة"
                    value={appForm.notes}
                    disabled={appBusy}
                    onChange={(e) => setAppForm((f) => ({ ...f, notes: e.target.value }))} />
                </label>
              </div>

              {/* The whole flow: choose file → upload → published. */}
              {appBusy ? (
                <div className="apk-prog">
                  <div className="apk-prog-bar"><i style={{ width: `${appPct}%` }} /></div>
                  <span>{appPct < 100 ? `جارٍ الرفع… ${appPct}%` : 'جارٍ النشر…'}</span>
                </div>
              ) : (
                <label className="apk-drop">
                  <input type="file" accept=".apk,application/vnd.android.package-archive"
                    onChange={(e) => { uploadApk(e.target.files?.[0]); e.target.value = ''; }} />
                  <b>اختار ملف الـ APK</b>
                  <small>هيترفع على السيرفر بتاعنا ويتولّد الرابط لوحده</small>
                </label>
              )}

              {appRel && appRel.apk && (
                <div className="app-rel-foot">
                  <a className="app-rel-link" href={appRel.apk} target="_blank" rel="noreferrer">
                    {appRel.apk}
                  </a>
                  <button
                    className="ops-ghost sm"
                    onClick={() => { navigator.clipboard?.writeText(appRel.apk); flash('تم نسخ الرابط ✓'); }}>
                    نسخ الرابط
                  </button>
                </div>
              )}
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

        {activeTab === 'notify' && (
          <section className="ops-panel">

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
                    <option value="ir">ريموت IR (تكييف/رسيفر/تلفزيون)</option>
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

        {activeTab === 'license' && (() => {
          const waiting = devices.filter((d) => d.licenseRequested && !d.licensed);
          const left = myCredit && !myCredit.unlimited && myCredit.price > 0
            ? Math.floor(myCredit.balance / myCredit.price)
            : null;
          const broke = left === 0;

          return (<>
            {/* What you can spend, and — the only number that really matters —
                how many units you can still switch on. */}
            {myCredit && (
              <div className="ops-kpis">
                <Kpi Ic={Bolt}
                  n={myCredit.unlimited ? '∞' : myCredit.balance}
                  label={`${t('myBalance')} ${myCredit.unlimited ? '' : myCredit.currency}`}
                  tone={broke ? 'warn' : 'ok'} />
                <Kpi Ic={Cpu}
                  n={myCredit.price > 0 ? myCredit.price : '—'}
                  label={`${t('perLicence')} ${myCredit.price > 0 ? myCredit.currency : ''}`} />
                <Kpi Ic={Lock}
                  n={left == null ? '∞' : left}
                  label={t('canActivate')}
                  tone={broke ? 'warn' : 'live'} />
                <Kpi Ic={Bell} n={waiting.length} label={t('waitingT')} tone="warn" />
              </div>
            )}

            {/* Out of credit — say it once, plainly, and say who fixes it. */}
            {broke && (
              <div className="cr-warn">
                <b>{t('outOfCredit')}</b>
                <span>{t('outOfCreditP')}</span>
              </div>
            )}

            {/* Switch a unit on. */}
            <section className="ops-panel">
              <div className="ops-panel-h">
                <div>
                  <h2>{t('activateT')}</h2>
                  <p>{superAdmin ? t('activateP_super') : t('activateP')}</p>
                </div>
              </div>
              <div className="ops-add">
                <input
                  style={{ flex: 1, width: 'auto', textAlign: 'start', direction: 'ltr' }}
                  className="mono" placeholder="SERIAL"
                  value={newSerial} disabled={broke}
                  onChange={(e) => setNewSerial(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addLicense()} />
                <button className="ops-btn" onClick={addLicense} disabled={broke}>
                  {t('grant')}
                </button>
              </div>
            </section>

            {/* The units that asked. This is the queue you actually work. */}
            <section className="ops-panel">
              <div className="ops-panel-h">
                <div>
                  <h2>{t('waitingT')} ({waiting.length})</h2>
                  <p>{t('waitingP')}</p>
                </div>
              </div>
              {!waiting.length ? (
                <div className="ops-empty" style={{ border: 0, background: 'none' }}>
                  {t('waitingNone')}
                </div>
              ) : (
                <div className="cr-grid">
                  {waiting.map((d) => {
                    const T = TYPE[d.type] || TYPE.relay;
                    return (
                      <div className="cr-card empty" key={d.serial}>
                        <span className="cr-bar-l" />
                        <div className="cr-card-h">
                          <span className="mono">{d.serial}</span>
                          <span className="chip"><T.Ic /> {T.label}</span>
                        </div>
                        <div className="wait-who">
                          <b>{d.name || '—'}</b>
                          <small>
                            {[d.ownerName, d.ownerEmail, d.country].filter(Boolean).join(' · ') || '—'}
                          </small>
                        </div>
                        <div className="cr-card-a">
                          <button className="ops-ghost sm" onClick={() => setSel(d.serial)}>
                            {t('view')}
                          </button>
                          <button className="ops-btn sm" disabled={broke}
                            onClick={() => setLicense(d.serial, true)}>
                            {t('grant')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Buyer leads from the website. */}
            <section className="ops-panel">
              <div className="ops-panel-h">
                <div>
                  <h2>طلبات الشراء ({licReqs.length})</h2>
                  <p>{superAdmin ? t('priceHere') : t('priceSuperOnly')}</p>
                </div>
                <button className="ops-ghost sm" onClick={loadLicReqs}>↻ تحديث</button>
              </div>
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
          </>);
        })()}

        {activeTab === 'invoices' && (
          <section className="ops-panel">
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

        {activeTab === 'countries' && (
          <section className="ops-panel">
            <div className="ops-list">
              {byCountry.map(([c, n]) => (
                <div className="ops-admin" key={c}><span>{c}</span><span className="seal ok">{n} جهاز</span></div>
              ))}
              {!byCountry.length && <div className="ops-empty" style={{ border: 0 }}>لا توجد بيانات.</div>}
            </div>
          </section>
        )}

        {/* ── Credit & price — the money page. Super admin only. ────────────── */}
        {activeTab === 'credit' && (() => {
          const licAdmins = (allowList || [])
            .filter((em) => !ADMIN_EMAILS.includes(em))
            .filter((em) => (permsMap[em] || []).includes('licenses'));
          const cur = myCredit?.currency || currency || '';
          const p = Number(price) || 0;
          const issued = licAdmins.reduce((s, em) => s + (creditMap[em]?.balance ?? 0), 0);
          const spent = licAdmins.reduce((s, em) => s + (creditMap[em]?.spent ?? 0), 0);

          return (<>
            <div className="ops-kpis">
              <Kpi Ic={Bolt} n={p || '—'} label={`${t('priceT')} ${p ? cur : ''}`} />
              <Kpi Ic={Cpu} n={issued} label={`${t('kTotalCredit')} ${cur}`} tone="ok" />
              <Kpi Ic={Signal} n={spent} label={`${t('kTotalSpent')} ${cur}`} tone="warn" />
              <Kpi Ic={Lock} n={licAdmins.length} label={t('kLicAdmins')} tone="live" />
            </div>

            {/* The price. It decides what every balance is worth — which is
                exactly why only a super admin ever reaches this page. */}
            <section className="ops-panel">
              <div className="ops-panel-h">
                <div>
                  <h2>{t('priceT')}</h2>
                  <p>{t('priceP')}</p>
                </div>
                {p > 0 && <span className="seal ok">{p} {cur}</span>}
              </div>
              <div className="lic-price">
                <div className="lic-price-row">
                  <div className="lic-fld">
                    <label>{t('priceT')}</label>
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
                </div>
              </div>
            </section>

            {/* One card per admin who can actually license. */}
            <section className="ops-panel">
              <div className="ops-panel-h">
                <div>
                  <h2>{t('balancesT')}</h2>
                  <p>{t('balancesP')}</p>
                </div>
                <button className="ops-ghost sm" onClick={loadAllCredit}>↻ تحديث</button>
              </div>

              {!licAdmins.length ? (
                <div className="ops-empty" style={{ border: 0, background: 'none' }}>
                  {t('noLicAdmins')}
                </div>
              ) : (
                <div className="cr-grid">
                  {licAdmins.map((em) => {
                    const bal = creditMap[em]?.balance ?? 0;
                    const sp = creditMap[em]?.spent ?? 0;
                    const canDo = p > 0 ? Math.floor(bal / p) : null;
                    const busyRow = permBusy === em;
                    const draft = creditDraft[em] ?? '';
                    return (
                      <div className={`cr-card ${bal > 0 ? 'ok' : 'empty'}`} key={em}>
                        <span className="cr-bar-l" />

                        <div className="cr-card-h">
                          <span className="mono">{em}</span>
                          {/* The number that answers the only question that
                              matters: can this person still do their job? */}
                          {canDo != null && (
                            <span className={`seal ${canDo > 0 ? 'ok' : 'warn'}`}>
                              {t('canActivate')} {canDo} {t('licences')}
                            </span>
                          )}
                        </div>

                        <div className="cr-card-n">
                          <div>
                            <small>{t('balanceL')}</small>
                            <b>{bal} <i>{cur}</i></b>
                          </div>
                          <div>
                            <small>{t('spentL')}</small>
                            <b>{sp} <i>{cur}</i></b>
                          </div>
                        </div>

                        {/* Set the balance outright, or ADD to it — topping up is
                            what you actually do when someone runs out. */}
                        <div className="cr-card-a">
                          <input
                            className="nt-input" type="number" min="0" step="1"
                            disabled={busyRow}
                            placeholder={String(bal)}
                            value={draft}
                            onChange={(e) => setCreditDraft((d) => ({ ...d, [em]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && setAdminCredit(em, draft)} />
                          <button className="ops-ghost sm" disabled={busyRow || draft === ''}
                            onClick={() => setAdminCredit(em, bal + Number(draft || 0))}>
                            + {t('addCredit')}
                          </button>
                          <button className="ops-btn sm" disabled={busyRow || draft === ''}
                            onClick={() => setAdminCredit(em, draft)}>
                            {t('setBalance')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>);
        })()}

        {activeTab === 'admins' && (
          <section className="ops-panel">

            {/* Add an admin AND pick what they can do, in one step. */}
            <div className="adm-card adm-new">
              <div className="adm-card-h">
                <b>إضافة مسؤول</b>
                <span className={`seal ${newPerms.length ? 'ok' : 'warn'}`}>
                  {newPerms.length ? `${newPerms.length} صلاحية مختارة` : 'اختار الصلاحيات'}
                </span>
              </div>
              {/* The login AND the permissions. Granting permissions alone gives
                  them nothing to sign in WITH — that's the wall a new admin hits. */}
              <div className="app-rel-grid">
                <label>
                  <span>الإيميل</span>
                  <input className="nt-input mono" dir="ltr" placeholder="admin@email.com"
                    value={newAdmin} disabled={!!permBusy}
                    onChange={(e) => setNewAdmin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAdmin()} />
                </label>
                <label>
                  <span>{t('newPassL')}</span>
                  <input className="nt-input" type="password" autoComplete="new-password"
                    placeholder="••••••" value={newPass} disabled={!!permBusy}
                    onChange={(e) => setNewPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAdmin()} />
                </label>
              </div>
              <div className="ops-note" style={{ marginTop: -4 }}>{t('newPassHint')}</div>
              <div className="ops-add">
                <button className="ops-btn" disabled={!!permBusy} onClick={addAdmin}>
                  {permBusy ? '…' : 'إضافة'}
                </button>
              </div>
              <div className="adm-perms">
                {PERMS.map(([key, label, hint]) => {
                  const on = newPerms.includes(key);
                  return (
                    <label key={key} className={`adm-perm ${on ? 'on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setNewPerms((p) => (
                          e.target.checked ? [...p, key] : p.filter((x) => x !== key)
                        ))} />
                      <span><b>{label}</b><small>{hint}</small></span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="ops-list">
              {ADMIN_EMAILS.map((em) => (
                <div className="ops-admin" key={em}>
                  <span className="mono">{em}</span>
                  <span className="seal ok">أساسي — كل الصلاحيات</span>
                </div>
              ))}
            </div>

            {/* Each extra admin gets only what you tick here. */}
            {(allowList || []).filter((em) => !ADMIN_EMAILS.includes(em)).map((em) => {
              const has = permsMap[em] || [];
              const busyRow = permBusy === em;
              return (
                <div className="adm-card" key={em}>
                  <div className="adm-card-h">
                    <span className="mono">{em}</span>
                    <div className="adm-card-a">
                      <span className={`seal ${has.length ? 'ok' : 'warn'}`}>
                        {has.length ? `${has.length} صلاحية` : 'من غير صلاحيات'}
                      </span>
                      <button className="ops-ghost sm" disabled={busyRow}
                        onClick={() => resetAdminPassword(em)}>
                        {t('resetPass')}
                      </button>
                      <button className="ops-ghost sm" onClick={() => removeAdmin(em)}>حذف</button>
                    </div>
                  </div>
                  <div className="adm-perms">
                    {PERMS.map(([key, label, hint]) => (
                      <label key={key} className={`adm-perm ${has.includes(key) ? 'on' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={busyRow}
                          checked={has.includes(key)}
                          onChange={(e) => togglePerm(em, key, e.target.checked)} />
                        <span>
                          <b>{label}</b>
                          <small>{hint}</small>
                        </span>
                      </label>
                    ))}
                  </div>

                </div>
              );
            })}
            {!(allowList || []).filter((em) => !ADMIN_EMAILS.includes(em)).length && (
              <div className="ops-empty" style={{ border: 0 }}>مفيش مسؤولين إضافيين بعد.</div>
            )}

            <div className="ops-note">
              الإيميلات «الأساسية» ثابتة في الكود ومعاها كل الصلاحيات. الباقي يُسجَّل في
              {' '}<span className="mono">config/admins</span>، وصلاحياته في{' '}
              <span className="mono">admin_perms/&lt;email&gt;</span>. الصلاحيات متطبّقة على
              السيرفر وفي قواعد Firestore — مش إخفاء في الواجهة بس. «إدارة المسؤولين» متاحة
              للأدمن الأساسي فقط، لأن اللي يقدر يعدّل القائمة يقدر يدّي نفسه أي صلاحية.
            </div>
          </section>
        )}

        {/* The live feed's credentials. Plumbing, so it lives here instead of a
            popup hanging off the top bar — you set it once and forget it. */}
        {activeTab === 'admins' && (
          <section className="ops-panel">
            <div className="ops-panel-h">
              <div>
                <h2>{t('brokerT')}</h2>
                <p>{t('brokerP')}</p>
              </div>
              <span className={`seal ${mqttState === 'on' ? 'ok' : mqttState === 'error' ? 'warn' : ''}`}>
                {conn}
              </span>
            </div>
            <div className="app-rel-grid">
              <label className="wide">
                <span>{t('brokerUrl')}</span>
                <input className="nt-input mono" value={mqttUrl}
                  onChange={(e) => setMqttUrl(e.target.value)} placeholder="wss://broker/mqtt" />
              </label>
              <label>
                <span>{t('brokerUser')}</span>
                <input className="nt-input mono" value={mqttUser} autoComplete="off"
                  onChange={(e) => setMqttUser(e.target.value)} placeholder="kushadmin" />
              </label>
              <label>
                <span>{t('brokerPass')}</span>
                <input className="nt-input" type="password" value={mqttPass} autoComplete="new-password"
                  onChange={(e) => setMqttPass(e.target.value)} placeholder="••••••••" />
              </label>
            </div>
            <div className="app-rel-foot">
              <span className="ops-note" style={{ flex: 1 }}>{t('brokerNote')}</span>
              <button className="ops-btn" onClick={saveMqtt}>{t('brokerSave')}</button>
            </div>
          </section>
        )}
        </main>
      </div>

      {/* Device sheet — a centred modal, so the unit you clicked is the focus of
          the screen rather than a strip pinned to the edge. */}
      {selected && (() => {
        const T = TYPE[selected.type] || TYPE.relay;
        const state = selected.licensed
          ? { cls: 'ok', text: t('licensed') }
          : selected.licenseRequested
            ? { cls: 'warn', text: t('licRequested') }
            : { cls: '', text: t('unlicensed') };
        const locale = isEn(lang) ? 'en-GB' : 'ar-EG';
        const up = selected.live?.uptime;
        const heap = selected.live?.heap;
        return (
          <div className="ops-modal-wrap" onClick={() => setSel(null)}>
            <div className="ops-modal" onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true">
              <div className="ops-mhead">
                <span className="ops-mic"><T.Ic /></span>
                <div className="ops-mtitle">
                  <b>{selected.name || t('unit')}</b>
                  <span className="mono">{selected.serial}</span>
                </div>
                <button className="ops-x" onClick={() => setSel(null)} aria-label="close">×</button>
              </div>

              <div className="ops-mtags">
                <span className={`chip ${selected.online ? 'live' : ''}`}>
                  <span className={`led ${selected.online ? 'on' : 'off'}`} />
                  {selected.online ? t('online') : t('offline')}
                </span>
                <span className={`seal ${state.cls}`}>{state.text}</span>
                <span className="chip">{tl(T.label)}</span>
              </div>

              {/* The three numbers an operator wants before anything else: how
                  long it has run, how strong its signal is, how much memory is
                  left. Everything else is reference, and sits below. */}
              <div className="ops-mstats">
                <div className="mstat">
                  <span className="mstat-l">{t('fRuntime')}</span>
                  <b className="mstat-v">{fmtDur(up, lang)}</b>
                </div>
                <div className="mstat">
                  <span className="mstat-l">{t('fSignal')}</span>
                  <b className="mstat-v mono">
                    {selected.live?.rssi != null ? `${selected.live.rssi} dBm` : '—'}
                  </b>
                </div>
                <div className="mstat">
                  <span className="mstat-l">{t('fMemory')}</span>
                  <b className="mstat-v mono">
                    {heap != null ? `${Math.round(heap / 1024)} KB` : '—'}
                  </b>
                </div>
              </div>

              <div className="ops-mbody">
                <div className="ops-mgroup">
                  <h4>{t('gOwner')}</h4>
                  <div className="ops-spec">
                    <Row k={t('fName')} v={selected.ownerName || '—'} />
                    <Row k={t('fEmail')} v={selected.ownerEmail || '—'} mono />
                    <Row k={t('fCountry')} v={selected.country || '—'} />
                  </div>
                </div>

                <div className="ops-mgroup">
                  <h4>{t('gDevice')}</h4>
                  <div className="ops-spec">
                    <Row k={t('fManufacturer')} v={selected.live?.manufacturer || '—'} />
                    <Row k={t('fModel')} v={selected.live?.model || '—'} mono />
                    <Row k={t('fBoard')} v={selected.board || '—'} mono />
                    <Row k={t('fChannels')} v={selected.live?.channels != null ? String(selected.live.channels) : '—'} mono />
                    <Row k={t('fFw')} v={selected.live?.fw || '—'} mono />
                    <Row k={t('fRegistered')} v={selected.inRegistry ? t('yes') : t('noBroadcastOnly')} />
                  </div>
                </div>

                <div className="ops-mgroup">
                  <h4>{t('gConn')}</h4>
                  <div className="ops-spec">
                    <Row k={t('fIp')} v={selected.live?.ip || '—'} mono />
                    <Row k={t('fLastSeen')} v={selected.lastSeen ? rel(selected.lastSeen, lang, ' مضت') : '—'} />
                  </div>
                </div>

                <div className="ops-mgroup">
                  <h4>{t('gLicence')}</h4>
                  <div className="ops-spec">
                    <Row k={t('fState')} v={state.text} />
                    <Row k={t('fLicSince')} v={selected.licensed ? rel(selected.licensedAt, lang) : '—'} />
                    <Row k={t('fLicDate')}
                      v={selected.licensedAt ? selected.licensedAt.toLocaleDateString(locale) : '—'} />
                  </div>
                </div>

                {/* Who the OWNER shared this unit with — read-only here; the
                    console doesn't grant/revoke shares, only the app does. */}
                <div className="ops-mgroup">
                  <h4>{t('gSharing')}</h4>
                  <div className="ops-spec">
                    {selected.sharedWith.length
                      ? selected.sharedWith.map((sw, i) => (
                          <Row key={sw.uid || i}
                            k={selected.sharedWith.length > 1 ? `${t('fSharedWith')} ${i + 1}` : t('fSharedWith')}
                            v={sw.email || '—'} mono />
                        ))
                      : <Row k={t('fSharedWith')} v={t('noShares')} />}
                  </div>
                </div>
              </div>

              {/* Each action only renders for an admin allowed to do it — and the
                  footer only appears if there is at least one. */}
              {((selected.licensed ? superAdmin : can('licenses')) || can('fleet')) && (
                <div className="ops-mfoot">
                  {/* Granting and revoking are not the same power. An admin sells
                      licences — they spend their own credit to switch a customer's
                      unit on. Taking a working unit away from a customer is a
                      different act, and it isn't theirs to make: super admin only.
                      (Enforced on the bridge too — this is just the half you see.) */}
                  {selected.licensed
                    ? (superAdmin && (
                        <button className="ops-ghost lg" onClick={() => setLicense(selected.serial, false)}>
                          {t('revoke')}
                        </button>
                      ))
                    : (can('licenses') && (
                        <button className="ops-btn lg" onClick={() => setLicense(selected.serial, true)}>
                          {t('grant')}
                        </button>
                      ))}
                  {can('fleet') && (
                    <button className="ops-ghost lg danger"
                      onClick={() => removeDevice(selected.serial, selected.name)}>
                      {t('removeDev')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}


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
// Is this unit actually reachable right now?
//
// The LWT ("status") used to be taken as gospel. But the broker replays a
// RETAINED last-will, so a unit that dropped once and reconnected can still have
// an "offline" will sitting on the topic while it is happily publishing state —
// and a brief blip publishes that will even though the unit never went away.
// That made cards flip online/offline every few seconds.
//
// Fresh telemetry wins: if we heard this unit's state seconds ago, it is online,
// whatever the will says. Only genuine silence marks it offline.
const FRESH_MS = 45000;   // a unit publishes at least every 15s

function serialOnline(serial, liveStatus, lastSeen, liveState) {
  const at = liveState?.[serial]?.at;
  if (at && Date.now() - at < FRESH_MS) return true;   // heard from it just now
  if (serial in liveStatus) return liveStatus[serial];
  return !!(lastSeen && Date.now() - lastSeen.getTime() < 90000);
}
