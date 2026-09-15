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
import {
  Cpu, Lock, Bell, Signal, Bolt, Bulb, Android, Sync, Download, Search, Upload, Trash,
  Megaphone, Mail, Phone, Users, Globe, Receipt, Wallet, Menu, Close, Copy, Key, Logout,
  Check, Plus, Alert,
} from '@/components/Icons';
// The console's own stylesheet. Every selector in it is kx- prefixed: global CSS
// imported by a route stays loaded after client-side navigation, so anything
// unprefixed here would leak onto the marketing pages.
import './AdminConsole.css';

const DEFAULT_MQTT = 'wss://smart.kushsmart.space/mqtt';
// Firmware store + OTA (uploads go to the bridge; units download from /fw/).
const FW_BASE = 'https://smart.kushsmart.space';
// `label` is Arabic on purpose — it goes into the update notification customers
// receive (announceUpdate). `en` is only for the console's English mode.
const FW_BOARDS = [
  { key: 'smarthome', label: 'المنزل الذكي (ESP32)', en: 'Smart home (ESP32)', match: (d) => d.board === 'ESP32' && d.type === 'relay' },
  { key: 'esp32',     label: 'مفاتيح/إضاءة ESP32',   en: 'Switches & lights — ESP32', match: (d) => d.board === 'ESP32' && d.type === 'relay' },
  { key: 'esp8266',   label: 'مفاتيح/إضاءة ESP8266', en: 'Switches & lights — ESP8266', match: (d) => d.board === 'ESP8266' },
  { key: 'lock',      label: 'القفل الذكي',          en: 'Smart lock', match: (d) => d.type === 'lock' },
  { key: 'power',     label: 'عدّاد الطاقة',         en: 'Power meter', match: (d) => d.type === 'power' },
  // HALO must be matched (and thus excluded from the plain 'ir' row below)
  // BEFORE the 'ir' check — its own board name doesn't contain "IR" at all,
  // but its live-state type is folded into 'ir' upstream (see the mqtt 'state'
  // handler), so 'ir' would otherwise also claim it.
  { key: 'halo',      label: 'ATGENX HALO (تكييف + RF + IR)', en: 'ATGENX HALO (AC + RF + IR)', match: (d) => (d.board || '').toUpperCase().includes('HALO') },
  { key: 'ir',        label: 'ريموت IR (تكييف/رسيفر/تلفزيون)', en: 'IR remote (AC / receiver / TV)', match: (d) => (d.type === 'ir' || (d.board || '').includes('IR')) && !(d.board || '').toUpperCase().includes('HALO') },
];
// Each firmware file goes into its OWN slot — the SLOT decides the offset, so any
// file works (no filename matching). Filled status comes from meta.slots[key].
const ESP32_SLOTS = [
  { key: 'boot', label: 'Bootloader', hint: '0x1000' },
  { key: 'part', label: 'Partitions', hint: '0x8000' },
  { key: 'oboot', label: 'Boot app0', hint: '0xe000' },
  { key: 'app', label: 'التطبيق', en: 'Application', hint: '0x10000' },
];
const ESP8266_SLOTS = [{ key: 'app', label: 'التطبيق', en: 'Application', hint: '0x0' }];
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
  ['fleet', ['الأسطول', 'Fleet'], ['يطّلع على الأجهزة وحالتها ويمكنه حذفها','See every unit and its state, and remove units']],
  ['firmware', ['التحديثات', 'Updates'], ['يرفع السوفت وير للبوردات وينشر نسخة التطبيق','Upload board firmware and publish the app']],
  ['notify', ['الإشعارات', 'Notifications'], ['يرسل إشعارات إلى المستخدمين','Send notifications to customers']],
  ['licenses', ['التراخيص', 'Licences'], ['يفعّل التراخيص ويتابع طلبات الشراء', 'Activate licences and handle purchase requests']],
  ['invoices', ['الفواتير', 'Invoices'], ['يطّلع على الفواتير','View invoices']],
  ['countries', ['الدول', 'Countries'], ['يطّلع على توزيع الأسطول حسب الدول','See where the fleet is']],
];
// Purchase-request status → its label key and tag tone.
const REQ_LABEL = { new: 'stNew', contacted: 'stContacted', done: 'stDone', rejected: 'stRejected' };
// (`caution`/`shared` rather than warn/info: the site's globals.css styles bare
// .warn and .info callouts, which would bleed into these.)
const REQ_TONE = { new: 'brand', contacted: 'caution', done: 'ok', rejected: 'fault' };
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
  superRole: ['المسؤول الرئيسي — كل الصلاحيات','Owner — full access'],
  nPerms: ['صلاحية', 'permissions'],
  liveOn: ['البث الحيّ متصل', 'Live feed connected'],
  liveConnecting: ['جارٍ الاتصال…', 'Connecting…'],
  liveErr: ['البث الحيّ غير متاح', 'Live feed unavailable'],
  liveOff: ['غير متصل', 'Not connected'],
  refresh: ['تحديث', 'Refresh'],
  nav: ['القائمة', 'Menu'],
  close: ['إغلاق', 'Close'],
  g_ops: ['التشغيل', 'Operations'],
  g_biz: ['المبيعات', 'Business'],
  g_access: ['الوصول', 'Access'],
  loading: ['جارٍ التحميل…', 'Loading…'],
  checking: ['جارٍ التحقّق من الصلاحية…', 'Checking your access…'],
  loginT: ['تسجيل الدخول', 'Sign in'],
  loginP: ['للمسؤولين المصرّح لهم فقط.', 'For authorised operators only.'],
  passL: ['كلمة المرور', 'Password'],
  signin: ['دخول', 'Sign in'],
  signingIn: ['جارٍ الدخول…', 'Signing in…'],
  deniedT: ['هذا الحساب ليس حساب مسؤول','This account isn’t an operator'],
  deniedP: ['{0} غير مُضاف إلى قائمة المسؤولين. اطلب من المسؤول الرئيسي إضافته.',
            '{0} isn’t on the operator list. Ask the owner to add it.'],
  copied: ['تم النسخ ✓','Copied ✓'],
  noPerms: ['لا تملك أي صلاحيات بعد. تواصل مع المسؤول الرئيسي ليحدّد صلاحياتك.',
            'You have no permissions yet. Ask the owner to grant you access.'],
  // sections
  s_fleet: ['الأسطول', 'Fleet'],
  s_fleet_sub: ['كل وحدة وحالتها ومالكها.','Every unit, its state, and who owns it.'],
  s_firmware: ['التحديثات', 'Updates'],
  s_firmware_sub: ['انشر نسخة التطبيق وسوفت وير البوردات.',
                   'Publish the app release and each board’s firmware.'],
  s_notify: ['الإشعارات', 'Notifications'],
  s_notify_sub: ['أرسل إشعارًا إلى المستخدمين — يصل حتى والتطبيق مغلق.',
                 'Send a notification — it arrives even when the app is closed.'],
  s_license: ['الترخيص', 'Licensing'],
  s_license_sub: ['فعّل التراخيص وتابع طلبات الشراء.',
                  'Activate licences and follow up purchase requests.'],
  s_invoices: ['الفواتير', 'Invoices'],
  s_invoices_sub: ['كل ترخيص بِيع أو فُعِّل.','Every licence sold or activated.'],
  s_countries: ['الدول', 'Countries'],
  s_countries_sub: ['توزيع الأسطول والسعر لكل دولة.',
                    'Where the fleet is, and the price per country.'],
  s_admins: ['المسؤولون', 'Admins'],
  s_admins_sub: ['من يدخل اللوحة، وما الذي يستطيع فعله تحديدًا.',
                 'Who gets in, and exactly what they can do.'],
  // fleet
  kFleet: ['الأسطول', 'Units'],
  kLicensed: ['مرخّصة', 'Licensed'],
  kPending: ['طلبات ترخيص', 'Requests'],
  kOnline: ['متصلة الآن', 'Online now'],
  search: ['ابحث عن جهاز… السيريال / البريد / الاسم','Search a unit… serial / email / name'],
  // the credit section
  s_credit: ['الرصيد والسعر', 'Credit & price'],
  s_credit_sub: ['حدّد سعر الترخيص، وخصّص رصيدًا لكل مسؤول يفعّل منه.',
                 'Set the licence price, and give each admin a balance to activate from.'],
  priceT: ['سعر الترخيص', 'Licence price'],
  priceP: ['سعر الترخيص الواحد. يعرض الموقع سعر مصر للزوّار من داخل مصر، والسعر الآخر لباقي الدول. ويُخصم من رصيد المسؤول سعر «خارج مصر».',
           'One licence. Visitors in Egypt see the Egypt price on the website; everyone else sees the other one. Admin balances are charged the outside-Egypt price.'],
  priceIntlT: ['خارج مصر — باقي الدول', 'Outside Egypt — every other country'],
  priceEgT: ['داخل مصر', 'Inside Egypt'],
  priceEgHint: ['اتركه فارغًا إن كان مماثلًا لسعر خارج مصر','Leave empty to use the outside-Egypt price'],
  fromApp: ['من التطبيق', 'From the app'],
  // website visits
  s_visits: ['زيارات الموقع', 'Website visits'],
  s_visits_sub: ['عدد الزيارات ومصادرها — فيسبوك، واتساب، جوجل…',
                 'How many visits, and where they came from — Facebook, WhatsApp, Google…'],
  vRange: ['المدة', 'Period'],
  vDaysN: ['آخر {0} يوم', 'Last {0} days'],
  vVisitors: ['زوّار', 'Visitors'],
  vSessions: ['زيارات', 'Visits'],
  vViews: ['مشاهدات الصفحات', 'Page views'],
  vToday: ['زيارات اليوم', 'Visits today'],
  vDaily: ['يومًا بيوم', 'Day by day'],
  vDailyP: ['الغامق: الزيارات · الفاتح: مشاهدات الصفحات.', 'Dark: visits · light: page views.'],
  vSources: ['مصادر الزيارات', 'Where visits came from'],
  vSourcesP: ['بحسب الرابط الذي فتح منه الزائر الموقع.', 'From the link the visitor opened the site by.'],
  vPages: ['أكثر الصفحات زيارة', 'Top pages'],
  vPagesP: ['كل مشاهدة لكل صفحة.', 'Every view of each page.'],
  vCountries: ['الزوّار حسب الدولة', 'Visitors by country'],
  vDevices: ['الزوّار حسب الجهاز', 'Visitors by device'],
  vHome: ['الرئيسية', 'Home'],
  vLoading: ['جارٍ التحميل…', 'Loading…'],
  vEmpty: ['لا توجد زيارات في هذه المدة بعد.', 'No visits in this period yet.'],
  vPrivacy: ['لا تُسجَّل أي بيانات شخصية — لا عنوان IP ولا هوية الزائر، أرقام فقط.',
             'No personal data is recorded — no IP, no visitor identity, just counts.'],
  balancesT: ['أرصدة المسؤولين', 'Admin balances'],
  balancesP: ['لا يستهلك الرصيدَ إلا المسؤول الذي يملك صلاحية التراخيص.',
              'Only an admin with the licences permission spends credit.'],
  noLicAdmins: ['لا يوجد مسؤول يملك صلاحية التراخيص. امنح الصلاحية أولًا من «المسؤولون».',
                'No admin has the licences permission yet. Grant it first, under “Admins”.'],
  kTotalCredit: ['رصيد موزّع', 'Credit issued'],
  kTotalSpent: ['المُنفَق', 'Spent'],
  kLicAdmins: ['مسؤولون يفعّلون', 'Admins licensing'],
  canActivate: ['يمكنه التفعيل', 'Can activate'],
  licences: ['ترخيص', 'licences'],
  addCredit: ['إضافة', 'Add'],
  // licence credit
  creditT: ['الرصيد', 'Credit'],
  creditP: ['خصّص رصيدًا للمسؤول. كل تفعيل ترخيص يخصم سعر الترخيص من رصيده.',
            'Give an admin a balance. Each activation spends the licence price from it.'],
  balanceL: ['الرصيد', 'Balance'],
  spentL: ['المُنفَق', 'Spent'],
  setBalance: ['حفظ', 'Save'],
  creditSet: ['تم ضبط الرصيد — {0} ✓', 'Balance set — {0} ✓'],
  creditFailed: ['تعذّر حفظ الرصيد', 'Could not save the balance'],
  badBalance: ['اكتب رقمًا صحيحًا', 'Enter a valid number'],
  unlimited: ['رصيد مفتوح', 'Unlimited'],
  left: ['متبقٍّ', 'left'],
  myBalance: ['رصيدك', 'Your credit'],
  perLicence: ['سعر الترخيص', 'Licence price'],
  noCredit: ['رصيدك غير كافٍ للترخيص ({0}). تواصل مع المسؤول الرئيسي لزيادته.',
             'Not enough credit for this licence ({0}). Ask the main admin to top you up.'],
  licCharged: ['تم التفعيل ✓ — خُصم {0}', 'Activated ✓ — charged {0}'],
  licFree: ['تم تفعيل {0} ✓', 'Activated {0} ✓'],
  licAlready: ['{0} مرخّص بالفعل', '{0} is already licensed'],
  licRevoked: ['تم سحب ترخيص {0}', 'Revoked the licence on {0}'],
  licFailed: ['فشل التفعيل', 'Activation failed'],
  priceSuperOnly: ['لا يغيّر السعرَ إلا المسؤول الرئيسي.', 'Only the main admin can change the price.'],
  priceHere: ['يُضبط السعر والأرصدة من صفحة «الرصيد والسعر».',
              'The price and balances are set on the “Credit & price” page.'],
  // the licensing workspace
  activateT: ['فعّل جهاز', 'Activate a unit'],
  activateP: ['اكتب سيريال الجهاز. سيُخصم سعر الترخيص من رصيدك.',
              'Enter the unit’s serial. The licence price comes out of your balance.'],
  activateP_super: ['اكتب سيريال الجهاز. أنت المسؤول الرئيسي — لا يُخصم من رصيدك شيء.',
                    'Enter the unit’s serial. You’re the main admin — nothing is charged.'],
  waitingT: ['أجهزة بانتظار الترخيص', 'Units awaiting a licence'],
  waitingP: ['هذه الأجهزة اتصلت وطلبت ترخيصًا.',
             'These units connected and asked to be licensed.'],
  waitingNone: ['لا توجد أجهزة بانتظار الترخيص.', 'Nothing is waiting.'],
  outOfCredit: ['نفد رصيدك.', 'You’re out of credit.'],
  outOfCreditP: ['لن تتمكّن من تفعيل ترخيص جديد حتى يزيد المسؤول الرئيسي رصيدك.',
                 'You can’t activate another licence until the main admin tops you up.'],
  revokeSuperOnly: ['سحب الترخيص متاح للمسؤول الرئيسي فقط.', 'Only the main admin can revoke a licence.'],
  badSerial: ['هذا السيريال غير صحيح.', 'That serial isn’t valid.'],
  // sign-in errors — each one says what to do about it
  errNoUser: ['لا يوجد حساب بهذا البريد الإلكتروني. تواصل مع المسؤول الرئيسي لإنشاء حساب لك.',
              'No account with that email. Ask the main admin to create one for you.'],
  errWrongPass: ['كلمة المرور غير صحيحة.', 'That password is wrong.'],
  errBadEmail: ['هذا البريد الإلكتروني غير صحيح.', 'That email isn’t valid.'],
  errTooMany: ['محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.',
               'Too many attempts. Wait a moment and try again.'],
  errNetwork: ['لا يوجد اتصال بالإنترنت.', 'No connection.'],
  errGeneric: ['تعذّر تسجيل الدخول. حاول مجددًا.', 'Could not sign in. Try again.'],
  // adding an admin (the login and the permissions are two different things)
  newPassL: ['كلمة مرور الدخول', 'Sign-in password'],
  newPassHint: ['٦ أحرف على الأقل. إن كان الحساب موجودًا بالفعل فسيحتفظ بكلمة مروره.',
                'At least 6 characters. If the account already exists, it keeps its own password.'],
  addedNew: ['تم إنشاء حساب لـ {0} ويمكنه الدخول الآن ✓',
             'Created an account for {0} — they can sign in now ✓'],
  addedExisting: ['لدى {0} حساب بالفعل — مُنح الصلاحيات، ويدخل بكلمة مروره ✓',
                  '{0} already had an account — permissions granted, they sign in with their own password ✓'],
  addFailed: ['فشلت الإضافة', 'Could not add them'],
  badEmail: ['اكتب بريدًا إلكترونيًا صحيحًا', 'Enter a valid email'],
  weakPass: ['يجب أن تتكوّن كلمة المرور من ٦ أحرف على الأقل', 'The password needs at least 6 characters'],
  pickPerms: ['اختر الصلاحيات أولًا', 'Pick their permissions first'],
  alreadySuper: ['هذا مسؤول رئيسي بالفعل', 'That is already a super admin'],
  sessionEnded: ['انتهت الجلسة — سجّل الدخول من جديد', 'Session ended — sign in again'],
  resetPass: ['أرسل رابط تعيين كلمة المرور', 'Send a password link'],
  resetSent: ['أُرسل إلى {0} رابط لتعيين كلمة مروره ✓', 'Sent {0} a link to set their password ✓'],
  resetFailed: ['تعذّر إرسال الرابط', 'Could not send the link'],
  noAccount: ['لا يوجد حساب بهذا البريد الإلكتروني', 'There is no account with that email'],
  fAll: ['الكل', 'All'],
  fOnline: ['متصل', 'Online'],
  fPending: ['يطلب ترخيصًا', 'Awaiting licence'],
  fUnlicensed: ['غير مرخّص', 'Not licensed'],
  grant: ['منح ترخيص', 'Grant licence'],
  noMatch: ['لا توجد أجهزة مطابقة.', 'No units match.'],
  online: ['متصل', 'Online'],
  offline: ['غير متصل', 'Offline'],
  unregistered: ['غير مسجّل', 'Not registered'],
  licensed: ['مرخّص', 'Licensed'],
  unlicensed: ['غير مرخّص', 'Not licensed'],
  licRequested: ['طلب ترخيص', 'Licence requested'],
  trialLeft: ['تجربة · متبقٍّ {0} ساعة', 'Trial · {0}h left'],
  trialAdd: ['+{0} ساعة تجربة', '+{0}h trial'],
  trialEnd: ['إنهاء التجربة', 'End trial'],
  trialEndQ: ['إنهاء تجربة {0} الآن؟ سيتوقف الجهاز عن العمل حتى يُرخَّص.',
              'End the trial on {0} now? The unit stops working until it is licensed.'],
  trialAdded: ['تمت إضافة {0} ساعة إلى التجربة ✓', 'Added {0}h to the trial ✓'],
  trialEnded: ['تم إنهاء التجربة ✓', 'Trial ended ✓'],
  trialLicensed: ['هذا الجهاز مرخّص بالفعل.', 'That unit is already licensed.'],
  trialForbidden: ['لا تملك صلاحية إدارة التراخيص.', 'You don’t have the licences permission.'],
  trialFailed: ['تعذّر تعديل التجربة.', 'Could not change the trial.'],
  trialT: ['الفترة التجريبية', 'Free trial'],
  trialOver: ['انتهت التجربة', 'Trial ended'],
  trialP: ['تعمل الوحدة مجانًا ٢٠٠ ساعة من أول تسجيل، ثم تحتاج إلى ترخيص.',
           'A unit runs free for 200 hours from its first registration, then needs a licence.'],
  // device sheet
  unit: ['وحدة كوش سمارت', 'KUSH SMART unit'],
  gOwner: ['المالك', 'Owner'],
  gDevice: ['الجهاز', 'Device'],
  gConn: ['الاتصال', 'Connection'],
  gLicence: ['الترخيص', 'Licence'],
  fName: ['الاسم', 'Name'],
  fEmail: ['البريد الإلكتروني', 'Email'],
  fCountry: ['الدولة', 'Country'],
  fManufacturer: ['الشركة المصنّعة', 'Manufacturer'],
  fModel: ['الموديل', 'Model'],
  fBoard: ['البوردة', 'Board'],
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
  noShares: ['غير مُشارَك مع أحد', 'Not shared with anyone'],
  sharedBadge: ['مُشارك', 'Shared'],
  yes: ['نعم', 'Yes'],
  noBroadcastOnly: ['لا (من البث فقط)', 'No (live feed only)'],
  revoke: ['سحب الترخيص', 'Revoke licence'],
  removeDev: ['حذف من السجل', 'Remove from registry'],
  // live feed (broker) settings
  brokerT: ['البث الحيّ', 'Live feed'],
  brokerP: ['حساب المسؤول الذي يقرأ بثّ جميع الأجهزة. يُحفظ في متصفّحك فقط.',
            'The admin account that reads every unit’s feed. Stored in your browser only.'],
  brokerUrl: ['عنوان البث', 'Broker address'],
  brokerUser: ['اسم المستخدم', 'Username'],
  brokerPass: ['كلمة المرور', 'Password'],
  brokerSave: ['اتصال', 'Connect'],
  brokerNote: ['إذا لم يكن البث متاحًا، تُحسب الحالة من آخر ظهور للجهاز.',
               'Without the feed, a unit’s state is inferred from when it was last seen.'],
  // licence-request alerts
  reqTitle: ['جهاز جديد يطلب ترخيصًا', 'A unit is asking to be licensed'],
  bellT: ['طلبات الترخيص', 'Licence requests'],
  bellEmpty: ['لا توجد طلبات جديدة.', 'No new requests.'],
  bellEnable: ['فعّل إشعارات سطح المكتب', 'Turn on desktop alerts'],
  bellBlocked: ['الإشعارات محظورة في المتصفّح.', 'Alerts are blocked in your browser.'],
  notifOn: ['سيصلك إشعار فور طلب أي جهاز ترخيصًا ✓', 'You’ll be alerted the moment a unit asks ✓'],
  notifUnsupported: ['هذا المتصفّح لا يدعم الإشعارات.', 'This browser doesn’t support alerts.'],
  view: ['افتح', 'Open'],
  // junk
  junkT: ['سجلات تالفة', 'Broken records'],
  junkP: ['هذه ليست أجهزة — سُجّلت خطأً من نسخة قديمة من التطبيق. احذفها.',
          'These aren’t units — an older app build registered them by mistake. Delete them.'],
  del: ['حذف', 'Delete'],
  // fleet (switchboard)
  busT: ['حالة الأسطول', 'Fleet status'],
  busOnline: ['متصلة', 'online'],
  fLicensed: ['مرخّصة', 'Licensed'],
  onlineOnly: ['المتصلة فقط', 'Online only'],
  // firmware updates, as the units report them
  updating: ['جارٍ التحديث {0}٪', 'Updating {0}%'],
  updRebooting: ['يعيد التشغيل بالنسخة الجديدة', 'Restarting on the new version'],
  updFailed: ['فشل التحديث', 'Update failed'],
  updAvail: ['تحديث متاح {0}', 'Update {0} available'],
  kUpdating: ['يتحدّث الآن', 'Updating now'],
  fwUnsigned: ['الملف غير موقَّع، ولن تقبله أي بوردة. وقّعه أولًا بالأمر: python tools/sign_firmware.py --board esp32 --bin <الملف> ثم ارفع الملف الناتج (.signed).',
               'This file isn’t signed, so no board will accept it. Sign it first: python tools/sign_firmware.py --board esp32 --bin <file>, then upload the .signed file.'],
  fwBadSig: ['توقيع الملف لا يطابق مفتاح الأجهزة، ولن تقبله أي بوردة.',
             'The file’s signature doesn’t match the fleet’s key — no board will accept it.'],
  colUnit: ['الوحدة', 'Unit'],
  colType: ['النوع', 'Type'],
  ch: ['قناة', 'ch'],
  unnamed: ['بدون اسم', 'Unnamed'],
  ago: [' مضت', ' ago'],
  noUnits: ['لا توجد وحدات بعد. سيظهر أي جهاز هنا فور اتصاله.',
            'No units yet. A unit appears here the moment it connects.'],
  clearFilters: ['مسح الفلاتر', 'Clear filters'],
  alertsOn: ['التنبيهات مفعّلة','Alerts on'],
  // updates
  apkT: ['نسخة التطبيق', 'App release'],
  apkP: ['اكتب رقم النسخة واختر ملف APK — يُرفع إلى خادمنا ويُنشر في صفحة التحميل.',
         'Enter the version, then choose the APK — it uploads to our server and goes live on the download page.'],
  apkLive: ['المنشورة {0}', 'Live {0}'],
  apkNone: ['لا توجد نسخة منشورة', 'Nothing published'],
  verL: ['رقم النسخة', 'Version'],
  notesL: ['ملاحظات النسخة', 'Release notes'],
  notesPh: ['أبرز التغييرات (اختياري)', 'What changed (optional)'],
  apkPick: ['اختر ملف APK', 'Choose the APK'],
  apkPickP: ['يُرفع إلى خادمنا ويُنشأ الرابط تلقائيًا.', 'It uploads to our server and the link is made for you.'],
  uploading: ['جارٍ الرفع… {0}%', 'Uploading… {0}%'],
  publishing: ['جارٍ النشر…', 'Publishing…'],
  copyLink: ['نسخ الرابط', 'Copy link'],
  boardsT: ['سوفت وير البوردات', 'Board firmware'],
  boardsP: ['ضع كل ملف في خانته، واكتب رقم النسخة، ثم انشر. يجب أن يكون ملف التطبيق موقَّعًا (.signed). بعد ذلك أبلغ أصحاب البوردة أو حدّث الأجهزة المتصلة الآن.',
            'Put each file in its slot, set the version, and publish. Then tell the owners, or update the units online now.'],
  uploaded: ['تم الرفع', 'Uploaded'],
  chooseFile: ['اختر ملفًا', 'Choose file'],
  verPh: ['النسخة — مثال 4.2', 'Version — e.g. 4.2'],
  publish: ['نشر', 'Publish'],
  published: ['منشورة {0}', 'Live {0}'],
  publishedOn: ['منشورة', 'Published'],
  announce: ['أبلغ أصحابها', 'Tell owners'],
  announceP: ['يرسل إشعارًا بالنسخة الجديدة إلى جميع أصحاب البوردة — ويحدّثون من التطبيق.',
              'Notifies every owner of this board — they update from the app.'],
  pushOta: ['حدّث {0} متصل', 'Update {0} online'],
  pushOtaP: ['يدفع التحديث فورًا إلى الأجهزة المتصلة (يتطلّب حساب البث الحيّ).',
             'Pushes the update to units online now (needs the live-feed account).'],
  delVer: ['مسح النسخة', 'Delete this version'],
  // notifications
  audT: ['إلى من؟', 'Send to'],
  audAll: ['كل المستخدمين', 'Everyone'],
  audAllP: ['كل من ثبّت التطبيق', 'Everyone with the app'],
  audBoard: ['أصحاب بوردة', 'Board owners'],
  audBoardP: ['من يملك جهازًا بهذه البوردة', 'Owners of one board type'],
  audUser: ['مستخدم واحد', 'One person'],
  audUserP: ['بالإيميل', 'By email'],
  boardL: ['البوردة', 'Board'],
  userEmailL: ['بريد المستخدم', 'Their email'],
  titleL: ['العنوان', 'Title'],
  titlePh: ['مثال: تحديث جديد متاح', 'e.g. A new update is ready'],
  bodyL: ['النص', 'Message'],
  bodyPh: ['اكتب نص الإشعار…', 'Write the message…'],
  previewL: ['هكذا سيظهر على الهاتف', 'How it looks on a phone'],
  previewTitle: ['عنوان الإشعار', 'Notification title'],
  previewBody: ['سيظهر النص هنا.', 'Your message appears here.'],
  now: ['الآن', 'now'],
  send: ['أرسل الإشعار', 'Send notification'],
  sending: ['جارٍ الإرسال…', 'Sending…'],
  sentResult: ['أُرسل {0} إشعار إلى {1} مستخدم', 'Sent {0} notifications to {1} people'],
  failedN: ['فشل {0}', '{0} failed'],
  notifyNote: ['يُرسَل من الخادم مباشرة (FCM)، فيصل حتى والتطبيق مغلق. وتُحذف الرموز القديمة تلقائيًا.',
               'Sent from our server (FCM), so it arrives even when the app is closed. Stale tokens are cleaned up automatically.'],
  // purchase requests
  reqsT: ['طلبات الشراء', 'Purchase requests'],
  reqsNone: ['لا توجد طلبات شراء بعد.', 'No purchase requests yet.'],
  stNew: ['جديد', 'New'],
  stContacted: ['تم التواصل', 'Contacted'],
  stDone: ['اكتمل', 'Done'],
  stRejected: ['مرفوض', 'Rejected'],
  qty: ['الكمية', 'Qty'],
  markAs: ['غيّر الحالة', 'Set status'],
  // invoices
  colSerial: ['السيريال', 'Serial'],
  colSource: ['المصدر', 'Source'],
  colAmount: ['المبلغ', 'Amount'],
  colBy: ['بواسطة', 'By'],
  colDate: ['التاريخ', 'Date'],
  colStatus: ['الحالة', 'Status'],
  invVerified: ['مفعّل', 'Activated'],
  invReview: ['مراجعة', 'Review'],
  invPending: ['معلّق', 'Pending'],
  srcAdmin: ['الأدمن', 'Admin'],
  srcTest: ['تجريبي', 'Test'],
  noInvoices: ['لا توجد فواتير بعد.', 'No invoices yet.'],
  copySerial: ['نسخ السيريال', 'Copy serial'],
  // countries
  unknownCountry: ['غير معروف', 'Unknown'],
  noData: ['لا توجد بيانات بعد.', 'No data yet.'],
  // credit
  currencyL: ['العملة', 'Currency'],
  noteL: ['ملاحظة', 'Note'],
  notePh: ['مثال: ترخيص دائم لكل جهاز', 'e.g. Lifetime licence per unit'],
  showOnSite: ['اعرض السعر وزر الشراء على الموقع', 'Show the price and buy button on the website'],
  savePrice: ['حفظ السعر', 'Save price'],
  saving: ['جارٍ الحفظ…', 'Saving…'],
  colAdmin: ['المسؤول', 'Admin'],
  amountPh: ['المبلغ', 'Amount'],
  // admins
  addAdminT: ['إضافة مسؤول', 'Add an admin'],
  addAdminP: ['أنشئ له حساب دخول، وحدّد ما يستطيع فعله تحديدًا.','Create their sign-in, and choose exactly what they can do.'],
  permsL: ['الصلاحيات', 'Permissions'],
  addBtn: ['إضافة المسؤول', 'Add admin'],
  adminsT: ['المسؤولون', 'Admins'],
  adminsP: ['يملك المسؤول الرئيسي كل الصلاحيات، أما أي مسؤول آخر فيرى ويفعل ما منحته إياه فقط.',
            'Owners can do everything. Everyone else sees and does only what you grant.'],
  ownerTag: ['رئيسي — كل الصلاحيات', 'Owner — full access'],
  nPermsOf: ['{0} من {1} صلاحيات', '{0} of {1} permissions'],
  noPermsTag: ['بدون صلاحيات', 'No access'],
  remove: ['حذف', 'Remove'],
  removeAdminQ: ['حذف {0} من المسؤولين؟ سيفقد إمكانية الدخول إلى اللوحة.', 'Remove {0}? They lose access to the console.'],
  noAdmins: ['لا يوجد مسؤولون إضافيون. أضف مسؤولًا من الأعلى.', 'No other admins yet. Add one above.'],
  adminsNote: ['المسؤول الرئيسي مُثبَّت في الكود، والباقون مسجَّلون في config/admins وصلاحياتهم في admin_perms. تُطبَّق الصلاحيات على الخادم وفي قواعد Firestore، وليست مجرد إخفاء في الواجهة — وإدارة المسؤولين للمسؤول الرئيسي فقط، لأن من يعدّل القائمة يستطيع منح نفسه أي صلاحية.',
               'Owners are fixed in code. Everyone else is listed in config/admins, with permissions in admin_perms. Permissions are enforced on the server and in the Firestore rules, not just hidden here — and only owners manage admins, because whoever edits the list could grant themselves anything.'],
  revokeQ: ['سحب ترخيص {0}؟ سيتوقف الجهاز عن العمل لدى العميل.','Revoke the licence on {0}? The unit stops working for its customer.'],
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
  // "و" gets a space after it: glued to a digit ("و0") the bidi algorithm puts
  // the number on the wrong side of it. A zero second part is simply dropped.
  if (d >= 1) return h ? `${d} يوم و ${h} ساعة` : `${d} يوم`;
  if (h >= 1) return m ? `${h} ساعة و ${m} دقيقة` : `${h} ساعة`;
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

// Free trial after a unit's first registration — the app's AppConfig.trialHours.
const TRIAL_HOURS = 200;

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
  // `{0}`, `{1}` in a string are replaced by the argument(s), so a message can
  // name the thing it happened to instead of being vague.
  const t = (k, a) => {
    const s = STR[k] ? STR[k][isEn(lang) ? 1 : 0] : k;
    return a == null ? s : [].concat(a).reduce((out, v, i) => out.replace(`{${i}}`, v), s);
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
  const [ota, setOta] = useState({});               // serial -> { pct, at } from the unit's OTA events
  const [trialBusy, setTrialBusy] = useState(false);
  const [q, setQ] = useState('');
  const [view, setView] = useState('all'); // all | licensed | pending | unlicensed
  const [onlineOnly, setOnlineOnly] = useState(false); // independent of the licence view
  const [navOpen, setNavOpen] = useState(false);       // the rail, as a drawer on narrow screens
  const searchRef = useRef(null);
  const closeRef = useRef(null);
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
  // Egypt has its own price; empty = the same as everywhere else.
  const [priceEG, setPriceEG] = useState('');
  const [currencyEG, setCurrencyEG] = useState('EGP');
  const [priceNoteEG, setPriceNoteEG] = useState('');
  // Website visits (super admin): one row per day from the bridge.
  const [visits, setVisits] = useState(null);
  const [visitDays, setVisitDays] = useState(30);
  const [visitsBusy, setVisitsBusy] = useState(false);
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
          createdAt: toDate(x.createdAt),   // free trial start (TRIAL_HOURS from here)
          trialEndsAt: toDate(x.trialEndsAt),  // server's trial end (an admin can extend it)
          trialActive: typeof x.trialActive === 'boolean' ? x.trialActive : null,
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
        setPriceEG(x.priceEG != null ? String(x.priceEG) : '');
        setCurrencyEG(x.currencyEG || 'EGP');
        setPriceNoteEG(x.noteEG || '');
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
        // event carries a unit's OTA progress ({"d":serial,"ot":pct}; -1 = failed).
        ['+/+/state', '+/state', '+/+/status', '+/status', '+/+/event', '+/event'].forEach((t) => c.subscribe(t));
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
        if (topic.endsWith('/event')) {
          // Only the OTA progress matters here; sensor alerts go to the owner's phone.
          const pct = j.ot ?? j.ota;
          if (typeof pct === 'number') setOta((m) => ({ ...m, [serial]: { pct, at: Date.now() } }));
          return;
        }
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
    // (This used to call setMqttEdit(), which no longer exists — the throw meant
    // "Connect" saved the credentials but never reconnected.)
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
      else if (j.error === 'forbidden') flash('غير مصرّح — البريد الإلكتروني ليس في قائمة مسؤولي الخادم');
      else if (j.error === 'unsigned') flash(t('fwUnsigned'));
      else if (j.error === 'bad_signature') flash(t('fwBadSig'));
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
    if (!/\.apk$/i.test(file.name)) { flash('يجب أن يكون الملف بامتداد .apk'); return; }
    const version = (appForm.version || '').trim();
    if (!/^v?\d+\.\d+\.\d+(\+\d+)?$/.test(version)) {
      flash('اكتب رقم النسخة أولًا — مثال: 1.0.12');
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
        } else if (j.error === 'not_an_apk') flash('هذا الملف ليس APK');
        else if (j.error === 'bad_version') flash('رقم النسخة غير صحيح');
        else if (xhr.status === 403) flash('لا تملك صلاحية رفع التحديثات');
        else if (xhr.status === 413) flash('الملف أكبر مما يقبله الخادم');
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
    // Empty Egypt price → null, and the bridge falls back to the one above.
    const pEG = String(priceEG).trim() === '' ? null : parseFloat(priceEG);
    if (pEG !== null && (isNaN(pEG) || pEG < 0)) { flash('اكتب سعر مصر صحيحًا أو اتركه فارغًا'); return; }
    setPriceBusy(true);
    try {
      await setDoc(doc(fb.current.db, 'config', 'pricing'), {
        price: p,
        currency: currency.trim() || 'EGP',
        note: priceNote.trim(),
        priceEG: pEG,
        currencyEG: currencyEG.trim() || 'EGP',
        noteEG: priceNoteEG.trim(),
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
    if (!window.confirm(`حذف «${label || serial}» من السجل؟ سيختفي الجهاز من الأسطول.`)) return;
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
  // Add hours to a unit's free trial, or end it (super admin). The bridge moves
  // trialEndsAt on the server; the registry stream brings the change back here.
  async function changeTrial(serial, hours, end = false) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu) { flash(t('sessionEnded')); return; }
    setTrialBusy(true);
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/license/trial`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(end ? { serial, end: true } : { serial, hours }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) flash(end ? t('trialEnded') : t('trialAdded', hours));
      else if (j.error === 'licensed') flash(t('trialLicensed'));
      else if (r.status === 403) flash(t('trialForbidden'));
      else flash(t('trialFailed'));
    } catch (_) { flash(t('trialFailed')); }
    setTrialBusy(false);
  }

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

  async function loadVisits(days) {
    const cu = fb.current?.auth?.currentUser;
    if (!cu || !superAdmin) return;
    setVisitsBusy(true);
    try {
      const token = await cu.getIdToken();
      const r = await fetch(`${FW_BASE}/admin/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      const j = await r.json().catch(() => ({}));
      if (Array.isArray(j.days)) setVisits(j.days);
    } catch (_) { /* keep what's on screen */ }
    setVisitsBusy(false);
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
    // The licence views partition the fleet (each unit is in exactly one), which
    // is what lets the bus bar draw them as segments that add up to the total.
    if (onlineOnly)            out = out.filter((d) => d.online);
    if (view === 'licensed')   out = out.filter((d) => d.licensed);
    if (view === 'pending')    out = out.filter((d) => d.licenseRequested && !d.licensed);
    if (view === 'unlicensed') out = out.filter((d) => !d.licensed && !d.licenseRequested);
    if (!t) return out;
    return out.filter((d) =>
      d.serial.toLowerCase().includes(t) ||
      (d.ownerEmail || '').toLowerCase().includes(t) ||
      (d.ownerName || '').toLowerCase().includes(t) ||
      (d.country || '').toLowerCase().includes(t) ||
      (d.name || '').toLowerCase().includes(t));
  }, [devices, q, view, onlineOnly]);

  const stats = useMemo(() => ({
    total: devices.length,
    licensed: devices.filter((d) => d.licensed).length,
    pending: devices.filter((d) => !d.licensed && d.licenseRequested).length,
    online: devices.filter((d) => d.online).length,
  }), [devices]);

  const selected = sel ? devices.find((d) => d.serial === sel) : null;

  // Every section: what it's called, what it's for, and the live count worth
  // seeing before you open it. Grouped by the kind of work — running the fleet,
  // the money, and who gets in — so the rail reads as a map of the job.
  const newReqs = licReqs.filter((r) => r.status === 'new').length;
  const SECTIONS = [
    { k: 'fleet', g: 'ops', Ic: Cpu, label: t('s_fleet'), sub: t('s_fleet_sub'), n: stats.total },
    { k: 'license', g: 'ops', Ic: Key, label: t('s_license'), sub: t('s_license_sub'),
      n: (stats.pending + newReqs) || null, alert: true },
    { k: 'firmware', g: 'ops', Ic: Upload, label: t('s_firmware'), sub: t('s_firmware_sub'), n: null },
    { k: 'notify', g: 'ops', Ic: Megaphone, label: t('s_notify'), sub: t('s_notify_sub'), n: null },
    { k: 'invoices', g: 'biz', Ic: Receipt, label: t('s_invoices'), sub: t('s_invoices_sub'),
      n: invoices.length || null },
    { k: 'visits', g: 'biz', Ic: Signal, label: t('s_visits'), sub: t('s_visits_sub'), n: null },
    { k: 'countries', g: 'biz', Ic: Globe, label: t('s_countries'), sub: t('s_countries_sub'),
      n: byCountry.length || null },
    { k: 'credit', g: 'biz', Ic: Wallet, label: t('s_credit'), sub: t('s_credit_sub'), n: null },
    { k: 'admins', g: 'access', Ic: Users, label: t('s_admins'), sub: t('s_admins_sub'), n: null },
  ].filter(({ k }) => {
    // Money and the admin list both stay with the supers. Whoever sets the price
    // or hands out balances decides what every licence is worth; whoever edits
    // the admin list could grant themselves every other permission.
    if (k === 'admins' || k === 'credit' || k === 'visits') return superAdmin;
    if (k === 'license') return can('licenses');
    return can(k);
  });
  const GROUPS = [['ops', t('g_ops')], ['biz', t('g_biz')], ['access', t('g_access')]];
  // Land on a section they're allowed to see: the default is 'fleet', which a
  // licences-only admin must never open.
  const activeTab = SECTIONS.some((s) => s.k === tab) ? tab : (SECTIONS[0]?.k || '');
  const section = SECTIONS.find((s) => s.k === activeTab);

  // The visits page loads when it's opened, and again when the period changes.
  useEffect(() => {
    if (activeTab === 'visits') loadVisits(visitDays);
  }, [activeTab, visitDays, superAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // "/" jumps to the fleet search, as in most operator tools; Esc closes the
  // popovers. Typing a "/" into a field is left alone.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setBellOpen(false); setNavOpen(false); return; }
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (!searchRef.current) return;
      e.preventDefault();
      searchRef.current.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Opening a unit moves focus into its sheet, so Esc and Tab work from there.
  useEffect(() => { if (sel) closeRef.current?.focus(); }, [sel]);

  const dir = isEn(lang) ? 'ltr' : 'rtl';
  // Latin digits in both languages: serials, versions and counts are read as
  // machine values, and a column of numbers has to line up.
  const locale = isEn(lang) ? 'en-GB' : 'ar-EG-u-nu-latn';
  const copy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    flash(t('copied'));
  };

  // ---- render ----
  if (!authChecked) {
    return <Gate dir={dir}><div className="kx-wait"><i className="kx-lamp connecting" />{t('loading')}</div></Gate>;
  }

  if (!user) {
    return (
      <Gate dir={dir}>
        <form className="kx-login" onSubmit={login}>
          <div className="kx-login-brand">
            <span className="kx-mark" aria-hidden="true"><Bolt /></span>
            <span><b>KUSH SMART</b><small>{t('console')}</small></span>
            <LangSwitch lang={lang} onChange={switchLang} />
          </div>
          <div>
            <h1>{t('loginT')}</h1>
            <p>{t('loginP')}</p>
          </div>
          <label className="kx-field">
            <span>{t('fEmail')}</span>
            <input className="kx-input" type="email" dir="ltr" required value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
          <label className="kx-field">
            <span>{t('passL')}</span>
            <input className="kx-input" type="password" dir="ltr" required value={pass}
              onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          </label>
          {authErr && <div className="kx-alert fault" role="alert"><Alert /><span>{authErr}</span></div>}
          <button className="kx-btn primary lg block" disabled={busy} type="submit">
            {busy ? t('signingIn') : t('signin')}
          </button>
        </form>
      </Gate>
    );
  }

  if (allowList === null) {
    return <Gate dir={dir}><div className="kx-wait"><i className="kx-lamp connecting" />{t('checking')}</div></Gate>;
  }

  if (!allowed) {
    return (
      <Gate dir={dir}>
        <div className="kx-login">
          <div className="kx-login-brand">
            <span className="kx-mark" aria-hidden="true"><Lock /></span>
            <span><b>KUSH SMART</b><small>{t('console')}</small></span>
            <LangSwitch lang={lang} onChange={switchLang} />
          </div>
          <div>
            <h1>{t('deniedT')}</h1>
            <p>{t('deniedP', user.email)}</p>
          </div>
          <button className="kx-btn ghost lg block" onClick={() => signOut(fb.current.auth)}>
            <Logout />{t('signout')}
          </button>
        </div>
      </Gate>
    );
  }

  const conn = mqttState === 'on' ? t('liveOn')
    : mqttState === 'connecting' ? t('liveConnecting')
    : mqttState === 'error' ? t('liveErr')
    : t('liveOff');

  // Hours of free trial a unregistered-licence unit has left (AppConfig.trialHours
  // in the app — keep TRIAL_HOURS in step). null when there's no start recorded.
  const trialLeftH = (d) => {
    if (d.licensed) return null;
    const end = d.trialEndsAt
      || (d.createdAt ? new Date(d.createdAt.getTime() + TRIAL_HOURS * 3600e3) : null);
    if (!end) return null;
    if (d.trialActive === false) return 0;         // the server closed it
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 3600e3));
  };
  const unitTag = (d) => {
    if (d.licensed) return <span className="kx-tag ok"><Check />{t('licensed')}</span>;
    const left = trialLeftH(d);
    const trial = left == null ? null : left > 0
      ? <span className="kx-tag info" title={t('trialP')}>{t('trialLeft', left)}</span>
      : <span className="kx-tag">{t('trialOver')}</span>;
    return (<>
      {trial}
      {d.licenseRequested
        ? <span className="kx-tag caution">{t('licRequested')}</span>
        : !trial && <span className="kx-tag">{t('unlicensed')}</span>}
    </>);
  };

  const ownerLine = (d) => [d.ownerName ? d.ownerEmail : '', d.country].filter(Boolean).join(' · ');

  // What a unit's firmware update is doing right now, from its own OTA events.
  // Progress arrives every 5%; a unit that goes quiet mid-download for 90s is
  // no longer shown as updating, and a failure stays visible for ten minutes.
  const otaOf = (serial) => {
    const o = ota[serial];
    if (!o) return null;
    const age = Date.now() - o.at;
    if (o.pct < 0) return age < 10 * 60e3 ? { kind: 'failed' } : null;
    if (o.pct >= 100) return age < 3 * 60e3 ? { kind: 'rebooting' } : null;
    return age < 90e3 ? { kind: 'updating', pct: o.pct } : null;
  };
  // The published version for this unit's board, when it's newer than what it runs.
  const vParts = (v) => String(v || '').split('.').map((x) => parseInt(x, 10) || 0);
  const isNewer = (a, b) => {
    const x = vParts(a), y = vParts(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    }
    return false;
  };
  const updateFor = (d) => {
    const fw = d.live?.fw;
    if (!fw) return null;
    const bd = FW_BOARDS.find((b) => b.match(d));
    const pub = bd && fwIndex[bd.key];
    return pub && pub.complete && pub.version && pub.version !== '—' && isNewer(pub.version, fw) ? pub.version : null;
  };

  // ── Fleet ────────────────────────────────────────────────────────────────────
  const renderFleet = () => {
    // The bus bar: the fleet split by licence state (a partition — every unit is
    // in exactly one segment), and within each segment the lit share is the part
    // that's online right now. Clicking a segment narrows the list to it.
    const segs = [
      { k: 'licensed', tone: 'ok', label: t('fLicensed'), list: devices.filter((d) => d.licensed) },
      { k: 'pending', tone: 'caution', label: t('fPending'), list: devices.filter((d) => !d.licensed && d.licenseRequested) },
      { k: 'unlicensed', tone: 'idle', label: t('fUnlicensed'), list: devices.filter((d) => !d.licensed && !d.licenseRequested) },
    ].map((s) => ({ ...s, n: s.list.length, on: s.list.filter((d) => d.online).length }));
    const pick = (k) => setView((v) => (v === k ? 'all' : k));
    const narrowed = view !== 'all' || onlineOnly || q.trim();
    const updatingNow = devices.filter((d) => { const u = otaOf(d.serial); return u && u.kind !== 'failed'; }).length;

    return (<>
      <section className="kx-bus" aria-label={t('busT')}>
        <div className="kx-bus-head">
          <div className="kx-bus-fig">
            <b>{stats.total}</b><span>{t('kFleet')}</span>
          </div>
          <div className="kx-bus-fig live">
            <i className={`kx-lamp ${stats.online ? 'on' : ''}`} />
            <b>{stats.online}</b><span>{t('kOnline')}</span>
          </div>
          {updatingNow > 0 && (
            <div className="kx-bus-fig upd">
              <i className="kx-lamp amber" />
              <b>{updatingNow}</b><span>{t('kUpdating')}</span>
            </div>
          )}
          <span className="kx-bus-feed"><i className={`kx-lamp ${mqttState}`} />{conn}</span>
        </div>

        <div className="kx-bus-bar">
          {stats.total
            ? segs.filter((s) => s.n).map((s) => (
                <button key={s.k} type="button" className={`kx-seg ${s.tone}`}
                  style={{ flexGrow: s.n }} aria-pressed={view === s.k} onClick={() => pick(s.k)}
                  title={`${s.label}: ${s.n} · ${s.on} ${t('busOnline')}`}>
                  <i style={{ inlineSize: `${(s.on / s.n) * 100}%` }} />
                  <span className="kx-sr">{s.label} {s.n}</span>
                </button>
              ))
            : <span className="kx-seg empty" />}
        </div>

        <div className="kx-bus-legend">
          {segs.map((s) => (
            <button key={s.k} type="button" className={`kx-leg ${s.tone}`}
              aria-pressed={view === s.k} onClick={() => pick(s.k)}>
              <i aria-hidden="true" />
              <span>{s.label}</span>
              <b>{s.n}</b>
              <small>{s.on} {t('busOnline')}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="kx-tools">
        <label className="kx-search">
          <Search />
          <span className="kx-sr">{t('search')}</span>
          <input ref={searchRef} type="search" placeholder={t('search')} value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && filtered.length) setSel(filtered[0].serial); }} />
          {q ? <span className="kx-hits">{filtered.length}</span> : <kbd aria-hidden="true">/</kbd>}
        </label>
        <button type="button" className="kx-toggle" aria-pressed={onlineOnly}
          onClick={() => setOnlineOnly((v) => !v)}>
          <i className={`kx-lamp ${onlineOnly ? 'on' : ''}`} />{t('onlineOnly')}
        </button>
        {can('licenses') && (
          <form className="kx-grant" onSubmit={(e) => { e.preventDefault(); addLicense(); }}>
            <input className="kx-input mono" placeholder="SERIAL" aria-label={t('activateT')}
              value={newSerial} onChange={(e) => setNewSerial(e.target.value)} />
            <button className="kx-btn primary" type="submit"><Key />{t('grant')}</button>
          </form>
        )}
      </div>

      {/* A FIXED order (see `devices`): narrowing never moves a row out from
          under the cursor when a unit reconnects. */}
      <div className="kx-table kx-fleet">
        <div className="kx-thead" aria-hidden="true">
          <span>{t('colUnit')}</span><span>{t('colType')}</span><span>{t('gOwner')}</span>
          <span>{t('fState')}</span><span>{t('fSignal')}</span><span>{t('fFw')}</span>
          <span>{t('gLicence')}</span>
        </div>
        {filtered.map((d) => {
          const ty = TYPE[d.type] || TYPE.relay;
          const who = d.ownerName || d.ownerEmail;
          const up = otaOf(d.serial);
          const avail = updateFor(d);
          const busy = up && up.kind !== 'failed';
          return (
            <button key={d.serial} type="button"
              className={`kx-unit ${d.online ? 'on' : ''} ${busy ? 'upd' : ''} ${sel === d.serial ? 'sel' : ''}`}
              onClick={() => setSel(d.serial)}>
              <span className="c-unit">
                <span className="kx-unit-ic"><ty.Ic /></span>
                <span className="kx-stack">
                  <b>{d.name || t('unnamed')}</b>
                  <small className="mono">{d.serial}</small>
                </span>
              </span>
              <span className="c-type kx-stack">
                <b className="kx-w">{tl(ty.label)}</b>
                <small>
                  {d.board || '—'}
                  {d.live?.channels != null ? ` · ${d.live.channels} ${t('ch')}` : ''}
                </small>
              </span>
              <span className="c-owner kx-stack">
                <b className="kx-w">{who || (d.inRegistry ? '—' : t('unregistered'))}</b>
                <small>{ownerLine(d) || ' '}</small>
              </span>
              <span className="c-run kx-stack">
                {up ? (
                  <b className={`kx-pill ${up.kind}`} role="status">
                    <i className={`kx-lamp ${up.kind === 'failed' ? 'error' : 'amber'}`} />
                    {up.kind === 'updating' ? t('updating', up.pct)
                      : up.kind === 'rebooting' ? t('updRebooting') : t('updFailed')}
                  </b>
                ) : (
                  <b className={`kx-pill ${d.online ? 'online' : 'offline'}`}>
                    <i className={`kx-lamp ${d.online ? 'on' : ''}`} />
                    {d.online ? t('online') : t('offline')}
                  </b>
                )}
                {/* Up: how long it has been working. Down: how long it's been gone. */}
                <small>
                  {d.online
                    ? fmtDur(d.live?.uptime, lang)
                    : (d.lastSeen ? rel(d.lastSeen, lang, isEn(lang) ? true : t('ago')) : '—')}
                </small>
              </span>
              <span className="c-sig"><SignalBars rssi={d.online ? d.live?.rssi : null} /></span>
              <span className="c-fw kx-stack">
                <b className="kx-w mono">{d.live?.fw || '—'}</b>
                {avail && !busy && <small className="kx-upd-tag">{t('updAvail', avail)}</small>}
              </span>
              <span className="c-lic">
                {unitTag(d)}
                {d.sharedWith.length > 0 && (
                  <span className="kx-tag shared" title={t('sharedBadge')}>
                    <Users /><em>{d.sharedWith.length}</em>
                  </span>
                )}
              </span>
              {up?.kind === 'updating' && (
                <span className="kx-unit-prog" aria-hidden="true" style={{ inlineSize: `${Math.max(3, up.pct)}%` }} />
              )}
            </button>
          );
        })}
        {!filtered.length && (
          <div className="kx-empty">
            <Cpu />
            <span>{devices.length ? t('noMatch') : t('noUnits')}</span>
            {narrowed && devices.length > 0 && (
              <button className="kx-btn ghost sm"
                onClick={() => { setQ(''); setView('all'); setOnlineOnly(false); }}>
                {t('clearFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Registry docs that aren't units — written by an older app build that
          mistook a Home Assistant discovery payload for a device. */}
      {junk.length > 0 && can('fleet') && (
        <section className="kx-panel caution">
          <div className="kx-panel-h">
            <div><h2>{t('junkT')} <span className="kx-count">{junk.length}</span></h2><p>{t('junkP')}</p></div>
          </div>
          <div className="kx-rows">
            {junk.map((r) => (
              <div className="kx-row kx-junk" key={r.serial}>
                <span className="mono kx-trunc">{r.serial}</span>
                <button className="kx-btn danger sm" onClick={() => removeDevice(r.serial, t('junkT'))}>
                  <Trash />{t('del')}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>);
  };

  // ── Updates ──────────────────────────────────────────────────────────────────
  const renderFirmware = () => (<>
    {/* Mobile app release. Pick the .apk and we host it ourselves and generate
        the link — no GitHub, nothing to paste. */}
    <section className="kx-panel">
      <div className="kx-panel-h">
        <div className="kx-h-ic">
          <span className="kx-panel-ic" aria-hidden="true"><Android /></span>
          <div><h2>{t('apkT')}</h2><p>{t('apkP')}</p></div>
        </div>
        <span className={`kx-tag ${appRel?.version ? 'ok' : ''}`}>
          {appRel ? (appRel.version ? t('apkLive', appRel.version) : t('apkNone')) : '…'}
        </span>
      </div>
      <div className="kx-panel-b kx-apk">
        <div className="kx-form">
          <label className="kx-field">
            <span>{t('verL')}</span>
            <input className="kx-input mono" dir="ltr" placeholder="1.0.12"
              value={appForm.version} disabled={appBusy}
              onChange={(e) => setAppForm((f) => ({ ...f, version: e.target.value }))} />
          </label>
          <label className="kx-field">
            <span>{t('notesL')}</span>
            <input className="kx-input" placeholder={t('notesPh')}
              value={appForm.notes} disabled={appBusy}
              onChange={(e) => setAppForm((f) => ({ ...f, notes: e.target.value }))} />
          </label>
        </div>
        {appBusy ? (
          <div className="kx-prog" role="status">
            <div className="kx-prog-bar"><i style={{ inlineSize: `${appPct}%` }} /></div>
            <span>{appPct < 100 ? t('uploading', appPct) : t('publishing')}</span>
          </div>
        ) : (
          <label className="kx-drop">
            <input className="kx-sr" type="file" accept=".apk,application/vnd.android.package-archive"
              onChange={(e) => { uploadApk(e.target.files?.[0]); e.target.value = ''; }} />
            <span className="kx-drop-ic" aria-hidden="true"><Upload /></span>
            <span><b>{t('apkPick')}</b><small>{t('apkPickP')}</small></span>
          </label>
        )}
      </div>
      {appRel?.apk && (
        <div className="kx-panel-f">
          <span className="kx-link">
            <Download />
            <a href={appRel.apk} target="_blank" rel="noreferrer">{appRel.apk}</a>
          </span>
          <button className="kx-btn ghost sm" onClick={() => copy(appRel.apk)}><Copy />{t('copyLink')}</button>
        </div>
      )}
    </section>

    <section>
      <div className="kx-block-h"><h2>{t('boardsT')}</h2><p>{t('boardsP')}</p></div>
      <div className="kx-fw-grid">
        {FW_BOARDS.map((b) => {
          const meta = fwIndex[b.key];
          const st = (meta && meta.slots) || {};
          const slots = b.key === 'esp8266' ? ESP8266_SLOTS : ESP32_SLOTS;
          const filled = slots.filter((s) => st[s.key]).length;
          const ready = filled === slots.length;
          const online = devices.filter((d) => b.match(d) && d.online && d.owner).length;
          const busy = fwBusy === b.key;
          const live = !!(meta && meta.complete);
          return (
            <article className={`kx-fw ${live ? 'live' : ''}`} key={b.key}>
              <header className="kx-fw-h">
                <span className="kx-stack">
                  <b>{tl([b.label, b.en])}</b>
                  <small className="mono">{b.key}</small>
                </span>
                <span className={`kx-tag ${live ? 'ok' : ready ? 'brand' : ''}`}>
                  {live ? t('published', meta.version) : <span className="num">{filled}/{slots.length}</span>}
                </span>
              </header>

              {/* The flash map, in address order — the order is real: each file
                  lands at its own offset. The slot decides the offset, so any
                  file name works. */}
              <ol className="kx-flash">
                {slots.map((s) => {
                  const done = !!st[s.key];
                  return (
                    <li key={s.key}>
                      <label className={`kx-slot ${done ? 'done' : ''} ${busy ? 'busy' : ''}`}>
                        <span className="kx-slot-a">{s.hint}</span>
                        <span className="kx-slot-n">{tl([s.label, s.en || s.label])}</span>
                        <span className="kx-slot-s">
                          {done ? <><Check />{t('uploaded')}</> : <><Upload />{t('chooseFile')}</>}
                        </span>
                        <input className="kx-sr" type="file" disabled={busy}
                          onChange={(e) => { uploadOneFile(b.key, s.key, e.target.files?.[0]); e.target.value = ''; }} />
                      </label>
                    </li>
                  );
                })}
              </ol>

              <form className="kx-fw-pub" onSubmit={(e) => { e.preventDefault(); if (ready && !busy) publishFw(b.key); }}>
                <input className="kx-input mono" dir="ltr" aria-label={t('verL')} placeholder={t('verPh')}
                  value={fwVer[b.key] || ''}
                  onChange={(e) => setFwVer((v) => ({ ...v, [b.key]: e.target.value }))} />
                <button className="kx-btn primary" type="submit" disabled={!ready || busy}>
                  {busy ? '…' : t('publish')}
                </button>
              </form>

              <div className="kx-fw-act">
                <button className="kx-btn ghost sm" disabled={!live || busy}
                  onClick={() => announceUpdate(b)} title={t('announceP')}>
                  <Megaphone />{t('announce')}
                </button>
                <button className="kx-btn ghost sm" disabled={!live || !online}
                  onClick={() => pushOta(b.key)} title={t('pushOtaP')}>
                  <Upload />{t('pushOta', online)}
                </button>
                <button className="kx-btn danger sm icon" disabled={!filled || busy}
                  onClick={() => deleteFw(b.key)} aria-label={t('delVer')} title={t('delVer')}>
                  <Trash />
                </button>
              </div>

              {live && (
                <footer className="kx-fw-f">
                  <i className="kx-lamp on" />
                  <span>{t('publishedOn')}</span>
                  {meta.updatedAt && <span>{new Date(meta.updatedAt).toLocaleDateString(locale)}</span>}
                  <a href={meta.manifestUrl} target="_blank" rel="noreferrer" className="mono">manifest</a>
                </footer>
              )}
            </article>
          );
        })}
      </div>
    </section>
  </>);

  // ── Notifications ────────────────────────────────────────────────────────────
  const renderNotify = () => {
    const clock = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="kx-compose">
        <section className="kx-panel">
          <div className="kx-panel-b kx-form">
            <div className="kx-field" role="group" aria-label={t('audT')}>
              <span>{t('audT')}</span>
              <div className="kx-aud">
                {[
                  ['all', Users, t('audAll'), t('audAllP')],
                  ['board', Cpu, t('audBoard'), t('audBoardP')],
                  ['user', Mail, t('audUser'), t('audUserP')],
                ].map(([k, Ic, l, d]) => (
                  <button key={k} type="button" aria-pressed={nAudience === k} onClick={() => setNAudience(k)}>
                    <Ic /><b>{l}</b><small>{d}</small>
                  </button>
                ))}
              </div>
            </div>

            {nAudience === 'board' && (
              <label className="kx-field">
                <span>{t('boardL')}</span>
                <select className="kx-input" value={nBoard} onChange={(e) => setNBoard(e.target.value)}>
                  {FW_BOARDS.map((b) => <option key={b.key} value={b.key}>{tl([b.label, b.en])}</option>)}
                </select>
              </label>
            )}
            {nAudience === 'user' && (
              <label className="kx-field">
                <span>{t('userEmailL')}</span>
                <input className="kx-input" type="email" dir="ltr" placeholder="user@example.com"
                  value={nEmail} onChange={(e) => setNEmail(e.target.value)} />
              </label>
            )}

            <label className="kx-field">
              <span>{t('titleL')}<em>{nTitle.length}/80</em></span>
              <input className="kx-input" maxLength={80} placeholder={t('titlePh')}
                value={nTitle} onChange={(e) => setNTitle(e.target.value)} />
            </label>
            <label className="kx-field">
              <span>{t('bodyL')}<em>{nBody.length}/400</em></span>
              <textarea className="kx-input" rows={5} maxLength={400} placeholder={t('bodyPh')}
                value={nBody} onChange={(e) => setNBody(e.target.value)} />
            </label>
            <p className="kx-note">{t('notifyNote')}</p>
          </div>
          <div className="kx-panel-f">
            {nResult ? (
              <span className="kx-tag ok">
                <Check />{t('sentResult', [nResult.sent, nResult.recipients])}
                {nResult.failed ? ` · ${t('failedN', nResult.failed)}` : ''}
              </span>
            ) : <span />}
            <button className="kx-btn primary" disabled={nBusy} onClick={sendBroadcast}>
              <Megaphone />{nBusy ? t('sending') : t('send')}
            </button>
          </div>
        </section>

        {/* Live preview: roughly what lands on the customer's lock screen. */}
        <aside className="kx-phone" aria-label={t('previewL')}>
          <div className="kx-phone-l">{t('previewL')}</div>
          <div className="kx-phone-time">{clock}</div>
          <div className="kx-notif">
            <span className="kx-notif-ic" aria-hidden="true"><Bolt /></span>
            <div className="kx-notif-t">
              <div className="kx-notif-m"><span>KUSH SMART</span><span>{t('now')}</span></div>
              <b dir="auto">{nTitle.trim() || t('previewTitle')}</b>
              <p dir="auto">{nBody.trim() || t('previewBody')}</p>
            </div>
          </div>
        </aside>
      </div>
    );
  };

  // ── Licensing ────────────────────────────────────────────────────────────────
  const renderLicense = () => {
    const waiting = devices.filter((d) => d.licenseRequested && !d.licensed);
    const left = myCredit && !myCredit.unlimited && myCredit.price > 0
      ? Math.floor(myCredit.balance / myCredit.price)
      : null;
    const broke = left === 0;

    return (<>
      {/* What you can spend, and — the number that really matters — how many
          units you can still switch on. */}
      {myCredit && (
        <div className="kx-readout">
          <Cell Ic={Wallet} label={t('myBalance')}
            v={myCredit.unlimited ? '∞' : myCredit.balance}
            unit={myCredit.unlimited ? '' : myCredit.currency} tone={broke ? 'fault' : ''} />
          <Cell Ic={Key} label={t('perLicence')}
            v={myCredit.price > 0 ? myCredit.price : '—'}
            unit={myCredit.price > 0 ? myCredit.currency : ''} />
          <Cell Ic={Check} label={t('canActivate')} v={left == null ? '∞' : left} tone={broke ? 'fault' : 'ok'} />
          <Cell Ic={Bell} label={t('waitingT')} v={waiting.length} tone={waiting.length ? 'caution' : ''} />
        </div>
      )}

      {/* Out of credit — say it once, plainly, and say who fixes it. */}
      {broke && (
        <div className="kx-alert fault" role="alert">
          <Alert /><span><b>{t('outOfCredit')}</b>{t('outOfCreditP')}</span>
        </div>
      )}

      <section className="kx-panel">
        <div className="kx-panel-h">
          <div><h2>{t('activateT')}</h2><p>{superAdmin ? t('activateP_super') : t('activateP')}</p></div>
        </div>
        <form className="kx-panel-b kx-activate" onSubmit={(e) => { e.preventDefault(); addLicense(); }}>
          <input className="kx-input mono" placeholder="SERIAL" aria-label={t('colSerial')}
            value={newSerial} disabled={broke} onChange={(e) => setNewSerial(e.target.value)} />
          <button className="kx-btn primary" type="submit" disabled={broke}><Key />{t('grant')}</button>
        </form>
      </section>

      {/* The units that asked. This is the queue you actually work. */}
      <section className="kx-panel">
        <div className="kx-panel-h">
          <div>
            <h2>{t('waitingT')} <span className="kx-count">{waiting.length}</span></h2>
            <p>{t('waitingP')}</p>
          </div>
        </div>
        {!waiting.length ? (
          <div className="kx-empty"><Check /><span>{t('waitingNone')}</span></div>
        ) : (
          <div className="kx-rows kx-queue">
            <div className="kx-row head" aria-hidden="true">
              <span>{t('colUnit')}</span><span>{t('colType')}</span><span>{t('gOwner')}</span><span />
            </div>
            {waiting.map((d) => {
              const T = TYPE[d.type] || TYPE.relay;
              return (
                <div className="kx-row" key={d.serial}>
                  <span className="c-unit">
                    <span className={`kx-unit-ic ${d.online ? 'on' : ''}`}><T.Ic /></span>
                    <span className="kx-stack">
                      <b>{d.name || t('unnamed')}</b>
                      <small className="mono">{d.serial}</small>
                    </span>
                  </span>
                  <span className="kx-stack" data-l={t('colType')}>
                    <b className="kx-w">{tl(T.label)}</b>
                    <small>{d.board || '—'}</small>
                  </span>
                  <span className="kx-stack" data-l={t('gOwner')}>
                    <b className="kx-w">{d.ownerName || d.ownerEmail || '—'}</b>
                    <small>{ownerLine(d) || ' '}</small>
                  </span>
                  <span className="kx-row-a full">
                    <button className="kx-btn ghost sm" onClick={() => setSel(d.serial)}>{t('view')}</button>
                    <button className="kx-btn primary sm" disabled={broke}
                      onClick={() => setLicense(d.serial, true)}>
                      <Key />{t('grant')}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Buyer leads from the website. */}
      <section className="kx-panel">
        <div className="kx-panel-h">
          <div>
            <h2>{t('reqsT')} <span className="kx-count">{licReqs.length}</span></h2>
            <p>{superAdmin ? t('priceHere') : t('priceSuperOnly')}</p>
          </div>
          <button className="kx-btn ghost sm" onClick={loadLicReqs}><Sync />{t('refresh')}</button>
        </div>
        {!licReqs.length ? (
          <div className="kx-empty"><Receipt /><span>{t('reqsNone')}</span></div>
        ) : (
          <div className="kx-reqs">
            {licReqs.map((r) => (
              <article className={`kx-req st-${r.status}`} key={r.id}>
                {/* Buyers write in either language; dir="auto" lays each out
                    by its own script instead of the console's direction. */}
                <div className="kx-req-h">
                  <b dir="auto">{r.name || '—'}</b>
                  <span className={`kx-tag ${REQ_TONE[r.status] || ''}`}>{t(REQ_LABEL[r.status] || 'stNew')}</span>
                </div>
                <div className="kx-req-c">
                  {r.email && <a href={`mailto:${r.email}`}><Mail /><span className="mono">{r.email}</span></a>}
                  {r.phone && <a href={`tel:${r.phone}`}><Phone /><span className="mono">{r.phone}</span></a>}
                  {r.qty > 1 && <span>{t('qty')}: <b className="num">{r.qty}</b></span>}
                  {r.serial && <span><Cpu /><span className="mono">{r.serial}</span></span>}
                  {r.country && <span><Globe /><span className="mono">{r.country}</span></span>}
                  {r.source === 'app' && <span className="kx-tag">{t('fromApp')}</span>}
                </div>
                {r.message && <p className="kx-req-m" dir="auto">{r.message}</p>}
                <div className="kx-seg-ctl" role="group" aria-label={t('markAs')}>
                  {['contacted', 'done', 'rejected'].map((s) => (
                    <button key={s} type="button" className={s === 'rejected' ? 'danger' : ''}
                      aria-pressed={r.status === s} onClick={() => setReqStatus(r.id, s)}>
                      {t(REQ_LABEL[s])}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>);
  };

  // ── Invoices ─────────────────────────────────────────────────────────────────
  const renderInvoices = () => (
    <section className="kx-panel">
      {!invoices.length ? (
        <div className="kx-empty"><Receipt /><span>{t('noInvoices')}</span></div>
      ) : (
        <div className="kx-rows kx-inv">
          <div className="kx-row head" aria-hidden="true">
            <span>{t('colSerial')}</span><span>{t('colSource')}</span><span>{t('colAmount')}</span>
            <span>{t('colBy')}</span><span>{t('colDate')}</span><span>{t('colStatus')}</span>
          </div>
          {invoices.map((v) => {
            const src = v.platform === 'admin' ? t('srcAdmin')
              : v.platform === 'apple' ? 'App Store'
              : (v.platform === 'test' || v.test) ? t('srcTest') : 'Google Play';
            return (
              <div className="kx-row" key={v.id}>
                <span>
                  {v.serial
                    ? <button className="kx-copy" onClick={() => copy(v.serial)} title={t('copySerial')}>
                        {v.serial}<Copy />
                      </button>
                    : '—'}
                </span>
                <span data-l={t('colSource')}><span className="kx-tag">{src}</span></span>
                <span data-l={t('colAmount')}>
                  <span className="num">{v.amount && v.amount !== 'admin' ? v.amount : '—'}</span>
                </span>
                <span data-l={t('colBy')}><span className="mono kx-trunc">{v.by || '—'}</span></span>
                <span data-l={t('colDate')}>
                  <span>{v.at ? v.at.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span>
                </span>
                <span className="kx-row-end">
                  <span className={`kx-tag ${v.verified ? 'ok' : v.needsReview ? 'caution' : ''}`}>
                    {v.verified ? t('invVerified') : v.needsReview ? t('invReview') : t('invPending')}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  // ── Countries ────────────────────────────────────────────────────────────────
  const renderCountries = () => {
    const max = byCountry[0]?.[1] || 1;
    const total = devices.length || 1;
    return (
      <section className="kx-panel">
        {!byCountry.length ? (
          <div className="kx-empty"><Globe /><span>{t('noData')}</span></div>
        ) : (
          <div className="kx-rows kx-geo">
            {byCountry.map(([c, n]) => (
              <div className="kx-row" key={c}>
                <b className="kx-trunc">{c === 'غير معروف' ? t('unknownCountry') : c}</b>
                <span className="kx-meter" aria-hidden="true"><i style={{ inlineSize: `${(n / max) * 100}%` }} /></span>
                <span className="num kx-geo-n">{n}</span>
                <span className="num kx-geo-p">{Math.round((n / total) * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  // ── Website visits — how many, and from where. Super admin only. ────────────
  const renderVisits = () => {
    const rows = visits || [];
    const sum = (k) => rows.reduce((s, d) => s + (d[k] || 0), 0);
    // One map over the whole period, biggest first.
    const merged = (m) => {
      const o = {};
      rows.forEach((d) => Object.entries(d[m] || {}).forEach(([k, v]) => { o[k] = (o[k] || 0) + v; }));
      return Object.entries(o).sort((a, b) => b[1] - a[1]);
    };
    const today = rows[rows.length - 1] || {};
    const peak = Math.max(1, ...rows.map((d) => d.views || 0));
    const src = (k) => (VISIT_LABELS[k] ? tl(VISIT_LABELS[k]) : k);
    const page = (k) => (k === '/' ? t('vHome') : src(k));
    const country = (k) => {
      if (VISIT_LABELS[k]) return tl(VISIT_LABELS[k]);
      try { return new Intl.DisplayNames([isEn(lang) ? 'en' : 'ar'], { type: 'region' }).of(k) || k; } catch (_) { return k; }
    };
    const bars = (list, label) => {
      const top = list.slice(0, 10);
      const max = top[0]?.[1] || 1;
      const total = list.reduce((s, [, n]) => s + n, 0) || 1;
      if (!top.length) return <div className="kx-empty"><Signal /><span>{t('vEmpty')}</span></div>;
      return (
        <div className="kx-rows kx-geo">
          {top.map(([k, n]) => (
            <div className="kx-row" key={k}>
              <b className="kx-trunc" dir="auto">{label(k)}</b>
              <span className="kx-meter" aria-hidden="true"><i style={{ inlineSize: `${(n / max) * 100}%` }} /></span>
              <span className="num kx-geo-n">{n}</span>
              <span className="num kx-geo-p">{Math.round((n / total) * 100)}%</span>
            </div>
          ))}
        </div>
      );
    };

    return (<>
      <div className="kx-visits-bar">
        <div className="kx-seg" role="group" aria-label={t('vRange')}>
          {[7, 30, 90].map((n) => (
            <button key={n} className={`kx-btn sm ${visitDays === n ? 'primary' : 'ghost'}`}
              aria-pressed={visitDays === n} onClick={() => setVisitDays(n)}>{t('vDaysN', n)}</button>
          ))}
        </div>
        <button className="kx-btn ghost sm" onClick={() => loadVisits(visitDays)} disabled={visitsBusy}>
          <Sync />{t('refresh')}
        </button>
      </div>

      <div className="kx-readout">
        <Cell Ic={Signal} label={t('vSessions')} v={sum('sessions')} />
        <Cell Ic={Users} label={t('vVisitors')} v={sum('visitors')} />
        <Cell Ic={Globe} label={t('vViews')} v={sum('views')} />
        <Cell Ic={Bolt} label={t('vToday')} v={today.sessions || 0} tone="ok" />
      </div>

      <section className="kx-panel">
        <div className="kx-panel-h"><div><h2>{t('vDaily')}</h2><p>{t('vDailyP')}</p></div></div>
        <div className="kx-panel-b">
          {visits === null ? (
            <div className="kx-empty"><Sync /><span>{t('vLoading')}</span></div>
          ) : (<>
            <div className="kx-chart" role="img" aria-label={`${t('vDaily')}: ${sum('sessions')} ${t('vSessions')}`}>
              {rows.map((d) => (
                <div className="kx-bar" key={d.date}
                  title={`${d.date} — ${d.sessions} ${t('vSessions')} · ${d.views} ${t('vViews')}`}>
                  <i style={{ blockSize: `${((d.views || 0) / peak) * 100}%` }} />
                  <b style={{ blockSize: `${((d.sessions || 0) / peak) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="kx-chart-x"><span className="num">{rows[0]?.date}</span><span className="num">{today.date}</span></div>
          </>)}
        </div>
      </section>

      <div className="kx-grid2">
        <section className="kx-panel">
          <div className="kx-panel-h"><div><h2>{t('vSources')}</h2><p>{t('vSourcesP')}</p></div></div>
          {bars(merged('sources'), src)}
        </section>
        <section className="kx-panel">
          <div className="kx-panel-h"><div><h2>{t('vPages')}</h2><p>{t('vPagesP')}</p></div></div>
          {bars(merged('pages'), page)}
        </section>
        <section className="kx-panel">
          <div className="kx-panel-h"><div><h2>{t('vCountries')}</h2></div></div>
          {bars(merged('countries'), country)}
        </section>
        <section className="kx-panel">
          <div className="kx-panel-h"><div><h2>{t('vDevices')}</h2></div></div>
          {bars(merged('devices'), src)}
        </section>
      </div>
      <p className="kx-note-foot">{t('vPrivacy')}</p>
    </>);
  };

  // ── Credit & price — the money page. Super admin only. ───────────────────────
  const renderCredit = () => {
    const licAdmins = (allowList || [])
      .filter((em) => !ADMIN_EMAILS.includes(em))
      .filter((em) => (permsMap[em] || []).includes('licenses'));
    const cur = myCredit?.currency || currency || '';
    const p = Number(price) || 0;
    const issued = licAdmins.reduce((s, em) => s + (creditMap[em]?.balance ?? 0), 0);
    const spent = licAdmins.reduce((s, em) => s + (creditMap[em]?.spent ?? 0), 0);

    return (<>
      <div className="kx-readout">
        <Cell Ic={Key} label={t('priceT')} v={p || '—'} unit={p ? cur : ''} />
        <Cell Ic={Wallet} label={t('kTotalCredit')} v={issued} unit={cur} tone="ok" />
        <Cell Ic={Receipt} label={t('kTotalSpent')} v={spent} unit={cur} />
        <Cell Ic={Users} label={t('kLicAdmins')} v={licAdmins.length} />
      </div>

      {/* The price decides what every balance is worth — which is exactly why
          only a super admin ever reaches this page. */}
      <section className="kx-panel">
        <div className="kx-panel-h">
          <div><h2>{t('priceT')}</h2><p>{t('priceP')}</p></div>
          {p > 0 && <span className="kx-tag ok"><span className="num">{p}</span> {cur}</span>}
        </div>
        <form className="kx-panel-b kx-form" onSubmit={(e) => { e.preventDefault(); savePricing(); }}>
          <h3 className="kx-price-h"><Globe />{t('priceIntlT')}</h3>
          <div className="kx-price">
            <label className="kx-field">
              <span>{t('priceT')}</span>
              <input className="kx-input mono" type="number" min="0" step="1" dir="ltr"
                value={price} placeholder="0" onChange={(e) => setPrice(e.target.value)} />
            </label>
            <label className="kx-field">
              <span>{t('currencyL')}</span>
              <input className="kx-input mono" dir="ltr" value={currency} placeholder="EGP"
                onChange={(e) => setCurrency(e.target.value)} />
            </label>
            <label className="kx-field wide">
              <span>{t('noteL')}</span>
              <input className="kx-input" value={priceNote} placeholder={t('notePh')}
                onChange={(e) => setPriceNote(e.target.value)} />
            </label>
          </div>
          <h3 className="kx-price-h"><Globe />{t('priceEgT')}<small>{t('priceEgHint')}</small></h3>
          <div className="kx-price">
            <label className="kx-field">
              <span>{t('priceT')}</span>
              <input className="kx-input mono" type="number" min="0" step="1" dir="ltr"
                value={priceEG} placeholder={price || '0'} onChange={(e) => setPriceEG(e.target.value)} />
            </label>
            <label className="kx-field">
              <span>{t('currencyL')}</span>
              <input className="kx-input mono" dir="ltr" value={currencyEG} placeholder="EGP"
                onChange={(e) => setCurrencyEG(e.target.value)} />
            </label>
            <label className="kx-field wide">
              <span>{t('noteL')}</span>
              <input className="kx-input" value={priceNoteEG} placeholder={t('notePh')}
                onChange={(e) => setPriceNoteEG(e.target.value)} />
            </label>
          </div>
          <div className="kx-form-f">
            <label className="kx-switch">
              <input type="checkbox" checked={priceEnabled} onChange={(e) => setPriceEnabled(e.target.checked)} />
              {t('showOnSite')}
            </label>
            <button className="kx-btn primary" type="submit" disabled={priceBusy}>
              {priceBusy ? t('saving') : t('savePrice')}
            </button>
          </div>
        </form>
      </section>

      <section className="kx-panel">
        <div className="kx-panel-h">
          <div><h2>{t('balancesT')}</h2><p>{t('balancesP')}</p></div>
          <button className="kx-btn ghost sm" onClick={loadAllCredit}><Sync />{t('refresh')}</button>
        </div>
        {!licAdmins.length ? (
          <div className="kx-empty"><Wallet /><span>{t('noLicAdmins')}</span></div>
        ) : (
          <div className="kx-rows kx-bal">
            <div className="kx-row head" aria-hidden="true">
              <span>{t('colAdmin')}</span><span>{t('balanceL')}</span><span>{t('spentL')}</span>
              <span>{t('canActivate')}</span><span />
            </div>
            {licAdmins.map((em) => {
              const bal = creditMap[em]?.balance ?? 0;
              const sp = creditMap[em]?.spent ?? 0;
              const canDo = p > 0 ? Math.floor(bal / p) : null;
              const busyRow = permBusy === em;
              const draft = creditDraft[em] ?? '';
              return (
                <div className="kx-row" key={em}>
                  <span className="kx-who">
                    <span className="kx-avatar" aria-hidden="true">{em[0].toUpperCase()}</span>
                    <span className="mono kx-trunc">{em}</span>
                  </span>
                  <span data-l={t('balanceL')}>
                    <span><b className={`num ${bal > 0 ? '' : 'kx-fault'}`}>{bal}</b> <small className="kx-cur">{cur}</small></span>
                  </span>
                  <span data-l={t('spentL')}>
                    <span><span className="num">{sp}</span> <small className="kx-cur">{cur}</small></span>
                  </span>
                  <span data-l={t('canActivate')}>
                    {canDo != null
                      ? <span className={`kx-tag ${canDo > 0 ? 'ok' : 'caution'}`}><span className="num">{canDo}</span> {t('licences')}</span>
                      : <span>—</span>}
                  </span>
                  {/* Set the balance outright, or ADD to it — topping up is what
                      you actually do when someone runs out. */}
                  <form className="kx-bal-a full"
                    onSubmit={(e) => { e.preventDefault(); if (draft !== '') setAdminCredit(em, draft); }}>
                    <input className="kx-input mono" type="number" min="0" step="1" dir="ltr"
                      aria-label={t('amountPh')} placeholder={String(bal)} disabled={busyRow} value={draft}
                      onChange={(e) => setCreditDraft((d) => ({ ...d, [em]: e.target.value }))} />
                    <button type="button" className="kx-btn ghost sm" disabled={busyRow || draft === ''}
                      onClick={() => setAdminCredit(em, bal + Number(draft || 0))}>
                      <Plus />{t('addCredit')}
                    </button>
                    <button type="submit" className="kx-btn primary sm" disabled={busyRow || draft === ''}>
                      {t('setBalance')}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>);
  };

  // ── Admins ───────────────────────────────────────────────────────────────────
  const renderAdmins = () => {
    const extra = (allowList || []).filter((em) => !ADMIN_EMAILS.includes(em));
    const permTiles = (has, onToggle, disabled) => (
      <div className="kx-perms">
        {PERMS.map(([key, label, hint]) => {
          const on = has.includes(key);
          return (
            <label key={key} className={`kx-perm ${on ? 'on' : ''} ${disabled ? 'dis' : ''}`}>
              <input type="checkbox" checked={on} disabled={disabled}
                onChange={(e) => onToggle(key, e.target.checked)} />
              <span><b>{tl(label)}</b><small>{tl(hint)}</small></span>
            </label>
          );
        })}
      </div>
    );

    return (<>
      {/* The login AND the permissions, in one step. Granting permissions alone
          gives them nothing to sign in WITH — that's the wall a new admin hits. */}
      <section className="kx-panel">
        <div className="kx-panel-h">
          <div><h2>{t('addAdminT')}</h2><p>{t('addAdminP')}</p></div>
          <span className={`kx-tag ${newPerms.length ? 'brand' : ''}`}>
            {newPerms.length ? t('nPermsOf', [newPerms.length, PERMS.length]) : t('pickPerms')}
          </span>
        </div>
        <form className="kx-panel-b kx-form" onSubmit={(e) => { e.preventDefault(); addAdmin(); }}>
          <div className="kx-grid2">
            <label className="kx-field">
              <span>{t('fEmail')}</span>
              <input className="kx-input mono" type="email" dir="ltr" placeholder="admin@email.com"
                autoComplete="off" value={newAdmin} disabled={!!permBusy}
                onChange={(e) => setNewAdmin(e.target.value)} />
            </label>
            <label className="kx-field">
              <span>{t('newPassL')}</span>
              <input className="kx-input" type="password" dir="ltr" autoComplete="new-password"
                placeholder="••••••" value={newPass} disabled={!!permBusy}
                onChange={(e) => setNewPass(e.target.value)} />
              <small>{t('newPassHint')}</small>
            </label>
          </div>
          <div className="kx-field" role="group" aria-label={t('permsL')}>
            <span>{t('permsL')}</span>
            {permTiles(newPerms, (key, on) => setNewPerms((p) => (on ? [...p, key] : p.filter((x) => x !== key))), !!permBusy)}
          </div>
          <div className="kx-form-f">
            <span />
            <button className="kx-btn primary" type="submit" disabled={!!permBusy}>
              <Plus />{permBusy ? '…' : t('addBtn')}
            </button>
          </div>
        </form>
      </section>

      <section className="kx-panel">
        <div className="kx-panel-h">
          <div>
            <h2>{t('adminsT')} <span className="kx-count">{ADMIN_EMAILS.length + extra.length}</span></h2>
            <p>{t('adminsP')}</p>
          </div>
        </div>
        {ADMIN_EMAILS.map((em) => (
          <div className="kx-admin" key={em}>
            <div className="kx-admin-h">
              <span className="kx-avatar" aria-hidden="true">{em[0].toUpperCase()}</span>
              <span className="mono kx-trunc kx-admin-e">{em}</span>
              <span className="kx-tag brand"><Key />{t('ownerTag')}</span>
            </div>
          </div>
        ))}
        {/* Each extra admin gets only what you tick here. */}
        {extra.map((em) => {
          const has = permsMap[em] || [];
          const busyRow = permBusy === em;
          return (
            <div className="kx-admin" key={em}>
              <div className="kx-admin-h">
                <span className="kx-avatar" aria-hidden="true">{em[0].toUpperCase()}</span>
                <span className="mono kx-trunc kx-admin-e">{em}</span>
                <span className={`kx-tag ${has.length ? 'ok' : 'caution'}`}>
                  {has.length ? t('nPermsOf', [has.length, PERMS.length]) : t('noPermsTag')}
                </span>
                <span className="kx-row-a">
                  <button className="kx-btn ghost sm" disabled={busyRow} onClick={() => resetAdminPassword(em)}>
                    <Mail />{t('resetPass')}
                  </button>
                  <button className="kx-btn danger sm" disabled={busyRow}
                    onClick={() => { if (window.confirm(t('removeAdminQ', em))) removeAdmin(em); }}>
                    <Trash />{t('remove')}
                  </button>
                </span>
              </div>
              {permTiles(has, (key, on) => togglePerm(em, key, on), busyRow)}
            </div>
          );
        })}
        {!extra.length && <div className="kx-empty"><Users /><span>{t('noAdmins')}</span></div>}
        <div className="kx-panel-f"><p className="kx-note">{t('adminsNote')}</p></div>
      </section>

      {/* The live feed's credentials. Plumbing, so it lives here — you set it
          once and forget it. */}
      <section className="kx-panel">
        <div className="kx-panel-h">
          <div><h2>{t('brokerT')}</h2><p>{t('brokerP')}</p></div>
          <span className={`kx-tag ${mqttState === 'on' ? 'ok' : mqttState === 'error' ? 'fault' : mqttState === 'connecting' ? 'caution' : ''}`}>
            <i className={`kx-lamp ${mqttState}`} />{conn}
          </span>
        </div>
        <form className="kx-panel-b kx-form" autoComplete="off" onSubmit={(e) => { e.preventDefault(); saveMqtt(); }}>
          <div className="kx-grid2">
            <label className="kx-field wide">
              <span>{t('brokerUrl')}</span>
              <input className="kx-input mono" dir="ltr" value={mqttUrl} placeholder="wss://broker/mqtt"
                onChange={(e) => setMqttUrl(e.target.value)} />
            </label>
            <label className="kx-field">
              <span>{t('brokerUser')}</span>
              <input className="kx-input mono" dir="ltr" value={mqttUser} autoComplete="off" placeholder="kushadmin"
                onChange={(e) => setMqttUser(e.target.value)} />
            </label>
            <label className="kx-field">
              <span>{t('brokerPass')}</span>
              <input className="kx-input" type="password" dir="ltr" value={mqttPass} autoComplete="new-password"
                placeholder="••••••••" onChange={(e) => setMqttPass(e.target.value)} />
            </label>
          </div>
          <div className="kx-form-f">
            <span className="kx-note">{t('brokerNote')}</span>
            <button className="kx-btn primary" type="submit"><Signal />{t('brokerSave')}</button>
          </div>
        </form>
      </section>
    </>);
  };

  const PAGES = {
    fleet: renderFleet, firmware: renderFirmware, notify: renderNotify, license: renderLicense,
    invoices: renderInvoices, countries: renderCountries, credit: renderCredit, admins: renderAdmins,
    visits: renderVisits,
  };
  const go = (k) => { setTab(k); setNavOpen(false); };

  return (
    <div className="kx" dir={dir}>
      {/* The rail — the panel enclosure. Sections are grouped by the kind of
          work; the active one is marked the way a live breaker is. */}
      <aside className={`kx-rail ${navOpen ? 'open' : ''}`} aria-label={t('nav')}>
        <div className="kx-brand">
          <span className="kx-mark" aria-hidden="true"><Bolt /></span>
          <span className="kx-brand-t"><b>KUSH SMART</b><small>{t('console')}</small></span>
          <button className="kx-icon-btn kx-rail-x" onClick={() => setNavOpen(false)} aria-label={t('close')}>
            <Close />
          </button>
        </div>

        <nav className="kx-nav">
          {GROUPS.map(([g, gl]) => {
            const items = SECTIONS.filter((s) => s.g === g);
            if (!items.length) return null;
            return (
              <div className="kx-nav-g" key={g}>
                <span className="kx-nav-gl">{gl}</span>
                {items.map(({ k, Ic, label, n, alert }) => (
                  <button key={k} className={`kx-nav-i ${activeTab === k ? 'on' : ''}`}
                    aria-current={activeTab === k ? 'page' : undefined} onClick={() => go(k)}>
                    <Ic /><span>{label}</span>
                    {n != null && <em className={alert ? 'alert' : ''}>{n}</em>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="kx-rail-foot">
          {/* The live feed is plumbing: it connects itself. This reports it. */}
          <div className="kx-feed" title={conn}><i className={`kx-lamp ${mqttState}`} /><span>{conn}</span></div>
          <div className="kx-me">
            <span className="kx-avatar" aria-hidden="true">{(user.email || '?')[0].toUpperCase()}</span>
            <span className="kx-me-t">
              <b className="mono">{user.email}</b>
              <small>{superAdmin ? t('superRole') : `${myPerms.length} ${t('nPerms')}`}</small>
            </span>
            <button className="kx-icon-btn" onClick={() => signOut(fb.current.auth)}
              aria-label={t('signout')} title={t('signout')}>
              <Logout />
            </button>
          </div>
        </div>
      </aside>
      {navOpen && <div className="kx-scrim" onClick={() => setNavOpen(false)} />}

      <div className="kx-main">
        <header className="kx-top">
          <button className="kx-icon-btn kx-menu" onClick={() => setNavOpen(true)} aria-label={t('nav')}>
            <Menu />
          </button>
          <div className="kx-top-t">
            <h1>{section?.label || t('console')}</h1>
            {section && <p>{section.sub}</p>}
          </div>
          <div className="kx-top-a">
            {activeTab === 'firmware' && (
              <button className="kx-btn ghost sm" onClick={() => { loadFwIndex(); loadAppRelease(); }}>
                <Sync /><span className="kx-hide-sm">{t('refresh')}</span>
              </button>
            )}

            {/* An admin who sells licences is spending their own balance, so it
                sits in the bar — visible on whichever page they land. */}
            {can('licenses') && !superAdmin && myCredit && (
              <span className={`kx-credit ${!myCredit.unlimited && myCredit.balance <= 0 ? 'empty' : ''}`}
                title={t('myBalance')}>
                <Wallet /><b>{myCredit.unlimited ? '∞' : myCredit.balance}</b><small>{myCredit.currency}</small>
              </span>
            )}

            {/* The bell: units waiting to be licensed. */}
            {can('licenses') && (
              <div className="kx-bell">
                <button className="kx-icon-btn" onClick={() => setBellOpen((v) => !v)}
                  aria-label={`${t('bellT')} (${alerts.length})`} aria-expanded={bellOpen}>
                  <Bell />
                </button>
                {alerts.length > 0 && <span className="kx-bell-n" aria-hidden="true">{alerts.length}</span>}
                {bellOpen && (<>
                  <div className="kx-pop-scrim" onClick={() => setBellOpen(false)} />
                  <div className="kx-pop" role="dialog" aria-label={t('bellT')}>
                    <div className="kx-pop-h">
                      <b>{t('bellT')}</b>
                      {notifPerm === 'granted'
                        ? <span className="kx-tag ok"><Check />{t('alertsOn')}</span>
                        : notifPerm === 'denied'
                          ? <span className="kx-pop-note">{t('bellBlocked')}</span>
                          : <button className="kx-btn ghost sm" onClick={askNotifPerm}>{t('bellEnable')}</button>}
                    </div>
                    <div className="kx-pop-list">
                      {!alerts.length && <div className="kx-pop-empty">{t('bellEmpty')}</div>}
                      {alerts.map((a) => (
                        <button key={a.serial} className="kx-pop-i"
                          onClick={() => { setBellOpen(false); go('fleet'); setSel(a.serial); }}>
                          <i className="kx-lamp amber" />
                          <span className="kx-pop-i-t">
                            <b>{a.unitName || t('unit')}</b>
                            <small className="mono">{a.serial}</small>
                            <small>{[a.ownerEmail, a.board].filter(Boolean).join(' · ') || '—'}</small>
                          </span>
                          <span className="kx-tag brand">{t('view')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>)}
              </div>
            )}

            <LangSwitch lang={lang} onChange={switchLang} />
          </div>
        </header>

        <main className="kx-page">
          {/* An admin with no permissions yet — an empty screen should say what
              to do next, not just sit there. */}
          {!SECTIONS.length
            ? <section className="kx-panel"><div className="kx-empty"><Lock /><span>{t('noPerms')}</span></div></section>
            : PAGES[activeTab]?.()}
        </main>
      </div>

      {/* Device sheet — a centred modal, so the unit you clicked is the focus of
          the screen rather than a strip pinned to the edge. */}
      {selected && (() => {
        const T = TYPE[selected.type] || TYPE.relay;
        const state = selected.licensed
          ? { cls: 'ok', text: t('licensed') }
          : selected.licenseRequested
            ? { cls: 'caution', text: t('licRequested') }
            : { cls: '', text: t('unlicensed') };
        const up = selected.live?.uptime;
        const heap = selected.live?.heap;
        return (
          <div className="kx-modal-wrap" onClick={() => setSel(null)}>
            <div className="kx-modal" onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-labelledby="kx-unit-title">
              <header className="kx-modal-h">
                <span className={`kx-modal-ic ${selected.online ? 'on' : ''}`} aria-hidden="true"><T.Ic /></span>
                <div className="kx-modal-t">
                  <h2 id="kx-unit-title">{selected.name || t('unit')}</h2>
                  <button className="kx-copy" onClick={() => copy(selected.serial)} title={t('copySerial')}>
                    {selected.serial}<Copy />
                  </button>
                </div>
                <button ref={closeRef} className="kx-icon-btn" onClick={() => setSel(null)} aria-label={t('close')}>
                  <Close />
                </button>
              </header>

              <div className="kx-modal-tags">
                <span className={`kx-tag ${selected.online ? 'ok' : ''}`}>
                  <i className={`kx-lamp ${selected.online ? 'on' : ''}`} />
                  {selected.online ? t('online') : t('offline')}
                </span>
                <span className={`kx-tag ${state.cls}`}>{state.text}</span>
                <span className="kx-tag">{tl(T.label)}</span>
                {selected.sharedWith.length > 0 && (
                  <span className="kx-tag shared"><Users />{t('sharedBadge')}<em>{selected.sharedWith.length}</em></span>
                )}
              </div>

              {/* The three numbers an operator wants before anything else: how
                  long it has run, how strong its signal is, how much memory is
                  left. Everything else is reference, and sits below. */}
              <div className="kx-readout three">
                <Cell label={t('fRuntime')} v={fmtDur(up, lang)} plain />
                <Cell label={t('fSignal')} v={selected.live?.rssi != null ? selected.live.rssi : '—'}
                  unit={selected.live?.rssi != null ? 'dBm' : ''} />
                <Cell label={t('fMemory')} v={heap != null ? Math.round(heap / 1024) : '—'}
                  unit={heap != null ? 'KB' : ''} />
              </div>

              <div className="kx-modal-b">
                <Spec title={t('gOwner')} rows={[
                  [t('fName'), selected.ownerName || '—'],
                  [t('fEmail'), selected.ownerEmail || '—', true],
                  [t('fCountry'), selected.country || '—'],
                ]} />
                <Spec title={t('gDevice')} rows={[
                  [t('fManufacturer'), selected.live?.manufacturer || '—'],
                  [t('fModel'), selected.live?.model || '—', true],
                  [t('fBoard'), selected.board || '—', true],
                  [t('fChannels'), selected.live?.channels != null ? String(selected.live.channels) : '—', true],
                  [t('fFw'), selected.live?.fw || '—', true],
                  [t('fRegistered'), selected.inRegistry ? t('yes') : t('noBroadcastOnly')],
                ]} />
                <Spec title={t('gConn')} rows={[
                  [t('fIp'), selected.live?.ip || '—', true],
                  [t('fLastSeen'), selected.lastSeen ? rel(selected.lastSeen, lang, isEn(lang) ? true : t('ago')) : '—'],
                ]} />
                <Spec title={t('gLicence')} rows={[
                  [t('fState'), state.text],
                  [t('fLicSince'), selected.licensed ? rel(selected.licensedAt, lang) : '—'],
                  [t('fLicDate'), selected.licensedAt ? selected.licensedAt.toLocaleDateString(locale) : '—'],
                ]} />
                {/* Who the OWNER shared this unit with — read-only here; the
                    console doesn't grant/revoke shares, only the app does. */}
                <Spec title={t('gSharing')} rows={
                  selected.sharedWith.length
                    ? selected.sharedWith.map((sw, i) => [
                        selected.sharedWith.length > 1 ? `${t('fSharedWith')} ${i + 1}` : t('fSharedWith'),
                        sw.email || '—', true,
                      ])
                    : [[t('fSharedWith'), t('noShares')]]
                } />
              </div>

              {/* Each action only renders for an admin allowed to do it — and the
                  footer only appears if there is at least one. */}
              {((selected.licensed ? superAdmin : can('licenses')) || can('fleet')) && (
                <footer className="kx-modal-f">
                  {/* Granting and revoking are not the same power. An admin sells
                      licences — they spend their own credit to switch a customer's
                      unit on. Taking a working unit away from a customer is a
                      different act, and it isn't theirs to make: super admin only.
                      (Enforced on the bridge too — this is just the half you see.) */}
                  {selected.licensed
                    ? (superAdmin && (
                        <button className="kx-btn ghost"
                          onClick={() => { if (window.confirm(t('revokeQ', selected.serial))) setLicense(selected.serial, false); }}>
                          {t('revoke')}
                        </button>
                      ))
                    : (can('licenses') && (
                        <button className="kx-btn primary" onClick={() => setLicense(selected.serial, true)}>
                          <Key />{t('grant')}
                        </button>
                      ))}
                  {!selected.licensed && can('licenses') && (
                    <span className="kx-trial-ctl" role="group" aria-label={t('trialT')}>
                      {[24, 72, 200].map((h) => (
                        <button key={h} className="kx-btn ghost" disabled={trialBusy}
                          onClick={() => changeTrial(selected.serial, h)}>
                          {t('trialAdd', h)}
                        </button>
                      ))}
                      {superAdmin && (trialLeftH(selected) || 0) > 0 && (
                        <button className="kx-btn ghost" disabled={trialBusy}
                          onClick={() => { if (window.confirm(t('trialEndQ', selected.serial))) changeTrial(selected.serial, 0, true); }}>
                          {t('trialEnd')}
                        </button>
                      )}
                    </span>
                  )}
                  {can('fleet') && (
                    <button className="kx-btn danger" onClick={() => removeDevice(selected.serial, selected.name)}>
                      <Trash />{t('removeDev')}
                    </button>
                  )}
                </footer>
              )}
            </div>
          </div>
        );
      })()}

      {/* Always mounted, so screen readers announce each message as it lands. */}
      <div className="kx-toast-host" role="status" aria-live="polite">
        {toast && <div className="kx-toast">{toast}</div>}
      </div>
    </div>
  );
}

function Gate({ dir, children }) {
  return <div className="kx gate" dir={dir}>{children}</div>;
}

function LangSwitch({ lang, onChange }) {
  return (
    <div className="kx-lang" role="group" aria-label="Language / اللغة">
      <button type="button" lang="ar" aria-pressed={!isEn(lang)} onClick={() => onChange('ar')}>ع</button>
      <button type="button" lang="en" aria-pressed={isEn(lang)} onClick={() => onChange('en')}>EN</button>
    </div>
  );
}

// Names for the visit sources, devices and fallbacks the bridge reports.
const VISIT_LABELS = {
  direct: ['مباشر — رابط محفوظ أو كتابة العنوان', 'Direct — a saved link or typed address'],
  app: ['التطبيق', 'The app'],
  facebook: ['فيسبوك', 'Facebook'],
  messenger: ['ماسنجر', 'Messenger'],
  instagram: ['إنستجرام', 'Instagram'],
  whatsapp: ['واتساب', 'WhatsApp'],
  youtube: ['يوتيوب', 'YouTube'],
  tiktok: ['تيك توك', 'TikTok'],
  telegram: ['تيليجرام', 'Telegram'],
  x: ['X (تويتر)', 'X (Twitter)'],
  snapchat: ['سناب شات', 'Snapchat'],
  linkedin: ['لينكدإن', 'LinkedIn'],
  google: ['جوجل', 'Google'],
  bing: ['بينج', 'Bing'],
  mobile: ['هاتف محمول', 'Phone'],
  tablet: ['جهاز لوحي', 'Tablet'],
  desktop: ['كمبيوتر', 'Computer'],
  unknown: ['غير معروف', 'Unknown'],
  other: ['أخرى', 'Other'],
};

// One reading in a strip of readings. `plain` is for values that are words
// ("3 يوم و4 ساعة"), which must not be forced left-to-right like a number.
function Cell({ label, v, unit, tone, Ic, plain }) {
  return (
    <div className={`kx-cell ${tone || ''}`}>
      <span>{Ic && <Ic />}{label}</span>
      <b className={plain ? 'plain' : ''}>
        {/* A bare number has no letters to take a direction from, so `auto`
            would fall back to RTL and print "−52" as "52−". */}
        <bdi dir={plain ? 'auto' : 'ltr'}>{v}</bdi>{unit ? <small>{unit}</small> : null}
      </b>
    </div>
  );
}

function Spec({ title, rows }) {
  return (
    <div className="kx-spec">
      <h3>{title}</h3>
      <dl>
        {rows.map(([k, v, mono], i) => (
          <div key={i}><dt>{k}</dt><dd className={mono ? 'mono' : ''}>{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}

// Wi-Fi strength as four bars — the dBm number is there too, for whoever wants it.
function SignalBars({ rssi }) {
  if (rssi == null) return <span className="kx-sig">—</span>;
  const n = rssi > -55 ? 4 : rssi > -67 ? 3 : rssi > -75 ? 2 : rssi > -85 ? 1 : 0;
  return (
    <span className="kx-sig" title={`${rssi} dBm`}>
      <span className={`kx-bars lv-${n}`} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <i key={i} className={i < n ? 'lit' : ''} />)}
      </span>
      <span className="num">{rssi}</span>
    </span>
  );
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
