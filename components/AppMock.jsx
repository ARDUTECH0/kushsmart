import L from './L';
import {
  Bulb, Fan, Curtain, Sensor, Lock, Bolt, Timer, Automation, Bell, Groups, Users, Plus, Signal, ArrowEnd,
} from './Icons';

/**
 * A drawn phone showing a KUSH SMART app screen.
 *
 * These replace the raw app screenshots, which were landscape captures of the
 * tablet layout — blurry when scaled, dark against a light page, and English-
 * only. A drawing stays sharp at any size, follows the page's language and
 * direction, and shows exactly the thing each section talks about.
 *
 * screen: 'home' | 'device' | 'groups'
 */
export default function AppMock({ screen = 'home', ar, en }) {
  return (
    <div className="mk-phone" role="img" aria-label={`${ar} — ${en}`}>
      <span className="mk-notch" aria-hidden="true" />
      <div className="mk-screen" aria-hidden="true">
        <div className="mk-status"><span>9:41</span><Signal /></div>
        {screen === 'home' && <HomeScreen />}
        {screen === 'device' && <DeviceScreen />}
        {screen === 'groups' && <GroupsScreen />}
      </div>
    </div>
  );
}

function Tile({ Ic, ar, en, sAr, sEn, on }) {
  return (
    <div className={`mk-tile ${on ? 'on' : ''}`}>
      <div className="mk-tile-top">
        <span className="mk-ic"><Ic /></span>
        <span className="mk-sw" />
      </div>
      <b><L ar={ar} en={en} /></b>
      <small><L ar={sAr} en={sEn} /></small>
    </div>
  );
}

function Row({ Ic, ar, en, sAr, sEn, on, toggle }) {
  return (
    <div className="mk-row">
      <span className="mk-ic"><Ic /></span>
      <div>
        <b><L ar={ar} en={en} /></b>
        <small><L ar={sAr} en={sEn} /></small>
      </div>
      {toggle && <span className={`mk-sw ${on ? 'on' : ''}`} />}
    </div>
  );
}

function Tabs({ active }) {
  const tabs = [
    ['home', Bulb, 'الرئيسية', 'Home'],
    ['groups', Groups, 'المجموعات', 'Groups'],
    ['auto', Automation, 'الأتمتة', 'Automations'],
    ['me', Users, 'حسابي', 'Account'],
  ];
  return (
    <div className="mk-tabs">
      {tabs.map(([k, Ic, ar, en]) => (
        <span key={k} className={active === k ? 'on' : ''}><Ic /><L ar={ar} en={en} /></span>
      ))}
    </div>
  );
}

function HomeScreen() {
  return (
    <>
      <div className="mk-head">
        <div>
          <small><L ar="مساء الخير" en="Good evening" /></small>
          <b><L ar="منزلي" en="My home" /></b>
        </div>
        <span className="mk-avatar">K</span>
      </div>
      <div className="mk-chips">
        <span className="on"><L ar="الكل" en="All" /></span>
        <span><L ar="الصالة" en="Living" /></span>
        <span><L ar="المطبخ" en="Kitchen" /></span>
      </div>
      <div className="mk-summary">
        <span><i className="mk-dot" /><L ar="4 أجهزة تعمل" en="4 devices on" /></span>
        <span><Sensor />26°</span>
      </div>
      <div className="mk-grid">
        <Tile Ic={Bulb} ar="إضاءة الصالة" en="Living light" sAr="تعمل · 80%" sEn="On · 80%" on />
        <Tile Ic={Fan} ar="مروحة السقف" en="Ceiling fan" sAr="السرعة 2" sEn="Speed 2" on />
        <Tile Ic={Curtain} ar="الستارة" en="Curtain" sAr="مفتوحة" sEn="Open" on />
        <Tile Ic={Bolt} ar="السخّان" en="Heater" sAr="متوقّف" sEn="Off" />
        <Tile Ic={Lock} ar="باب المدخل" en="Front door" sAr="مقفول" sEn="Locked" on />
        <Tile Ic={Sensor} ar="غرفة النوم" en="Bedroom" sAr="24° · 45%" sEn="24° · 45%" />
      </div>
      <Tabs active="home" />
    </>
  );
}

function DeviceScreen() {
  return (
    <>
      <div className="mk-back"><ArrowEnd /><b><L ar="إضاءة الصالة" en="Living-room light" /></b></div>
      <div className="mk-hero">
        <span className="mk-hero-ic"><Bulb /></span>
        <b>80%</b>
        <small><L ar="السطوع" en="Brightness" /></small>
        <div className="mk-slider"><i style={{ inlineSize: '80%' }} /></div>
      </div>
      <div className="mk-list">
        <Row Ic={Timer} ar="مؤقّت" en="Timer" sAr="يُطفأ بعد 30 دقيقة" sEn="Off in 30 minutes" />
        <Row Ic={Automation} ar="الأتمتة" en="Automation" sAr="تعمل عند الغروب" sEn="On at sunset" toggle on />
        <Row Ic={Bell} ar="الإشعارات" en="Alerts" sAr="عند كل تشغيل" sEn="Every time it turns on" toggle />
      </div>
    </>
  );
}

function GroupsScreen() {
  return (
    <>
      <div className="mk-head">
        <div>
          <small><L ar="المجموعات" en="Groups" /></small>
          <b><L ar="بضغطة واحدة" en="One tap" /></b>
        </div>
        <span className="mk-avatar"><Plus /></span>
      </div>
      <div className="mk-list">
        <Row Ic={Bulb} ar="إضاءة الدور الأول" en="Ground-floor lights" sAr="5 أجهزة" sEn="5 devices" toggle on />
        <Row Ic={Fan} ar="تبريد الصالة" en="Cool the living room" sAr="3 أجهزة" sEn="3 devices" toggle on />
        <Row Ic={Lock} ar="وضع الخروج" en="Leaving home" sAr="7 أجهزة" sEn="7 devices" toggle />
        <Row Ic={Curtain} ar="ستائر الصباح" en="Morning curtains" sAr="جهازان" sEn="2 devices" toggle />
      </div>
      <Tabs active="groups" />
    </>
  );
}
