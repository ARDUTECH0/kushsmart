'use client';

import { useEffect, useState } from 'react';

const BRIDGE = 'https://smart.kushsmart.space';

export default function PricingClient() {
  const [pricing, setPricing] = useState(null); // null=loading
  const [form, setForm] = useState({ name: '', email: '', phone: '', qty: 1, serial: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [lang, setLang] = useState('ar');
  const t = (ar, en) => (lang === 'en' ? en : ar);

  useEffect(() => {
    setLang(document.documentElement.lang === 'en' ? 'en' : 'ar');
    const onLang = (e) => setLang(e.detail === 'en' ? 'en' : 'ar');
    window.addEventListener('langchange', onLang);
    return () => window.removeEventListener('langchange', onLang);
  }, []);

  useEffect(() => {
    fetch(`${BRIDGE}/pricing`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setPricing)
      .catch(() => setPricing({ enabled: true }));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) { setErr(t('من فضلك اكتب اسمك.', 'Please enter your name.')); return; }
    if (!form.email.trim() && !form.phone.trim()) {
      setErr(t('اكتب بريدًا أو رقم هاتف للتواصل.', 'Add an email or phone number so we can reach you.'));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${BRIDGE}/license/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) setSent(true);
      else if (j.error === 'too_fast') setErr(t('لقد أرسلت طلبًا للتوّ — انتظر قليلًا ثم حاول مجددًا.', 'You just sent a request — wait a moment and try again.'));
      else setErr(t('تعذّر الإرسال، حاول مرة أخرى.', 'Could not send, please try again.'));
    } catch (_) {
      setErr(t('تعذّر الاتصال، تحقّق من الإنترنت وحاول مجددًا.', 'Connection failed — check your internet and try again.'));
    }
    setBusy(false);
  }

  const hasPrice = pricing && pricing.enabled !== false && pricing.price != null;

  return (
    <div className="wrap pr-wrap">
      {/* Price card */}
      <div className="pr-card">
        <span className="pr-eyebrow">{t('الترخيص', 'Licence')}</span>
        {pricing === null ? (
          <p className="pr-price-loading">{t('جارٍ التحميل…', 'Loading…')}</p>
        ) : hasPrice ? (
          <>
            <div className="pr-price">
              <b>{pricing.price}</b>
              <span>{pricing.currency || 'EGP'}</span>
            </div>
            <p className="pr-per">{t('لكل جهاز · ترخيص دائم', 'Per device · lifetime licence')}</p>
            {pricing.note ? <p className="pr-note">{pricing.note}</p> : null}
          </>
        ) : (
          <>
            <div className="pr-price pr-price-ask"><b>{t('تواصل معنا', 'Contact us')}</b></div>
            <p className="pr-per">{t('اترك بياناتك وسنُعلمك بالسعر والتفاصيل', 'Leave your details and we will send you the price and details')}</p>
          </>
        )}
        <ul className="pr-feats">
          <li>✅ {t('تفعيل دائم للجهاز — دفعة واحدة', 'Lifetime activation — one payment')}</li>
          <li>✅ {t('تحكّم كامل من التطبيق ومن Home Assistant', 'Full control from the app and Home Assistant')}</li>
          <li>✅ {t('تحديثات لاسلكية مجّانية', 'Free over-the-air updates')}</li>
          <li>✅ {t('دعم فنّي', 'Technical support')}</li>
        </ul>
        <div className="pr-pay">
          <span className="pr-pay-ic">💳</span>
          <span>{t('يمكنك السداد عبر تطبيق بنكك من السودان', 'You can pay through your bank app from Sudan')}</span>
        </div>
      </div>

      {/* Request form */}
      <div className="pr-form-box">
        {sent ? (
          <div className="pr-done">
            <span className="pr-done-ic">🎉</span>
            <h3>{t('تم استلام طلبك!', 'Your request is in!')}</h3>
            <p>{t('سيتواصل معك فريق كوش سمارت قريبًا لإتمام الترخيص. شكرًا لك.', 'The KUSH SMART team will reach out soon to complete your licence. Thank you.')}</p>
          </div>
        ) : (
          <form className="pr-form" onSubmit={submit}>
            <h3>{t('اطلب الترخيص', 'Request a licence')}</h3>
            <p className="pr-form-sub">{t('اترك بياناتك وسنتواصل معك لإتمام الشراء والتفعيل.', 'Leave your details and we will get in touch to complete the purchase and activation.')}</p>
            <label>{t('الاسم *', 'Name *')}</label>
            <input value={form.name} onChange={set('name')} placeholder={t('اسمك الكامل', 'Your full name')} />
            <div className="pr-row">
              <div>
                <label>{t('البريد الإلكتروني', 'Email')}</label>
                <input type="email" dir="ltr" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
              <div>
                <label>{t('رقم الهاتف', 'Phone')}</label>
                <input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} placeholder="01xxxxxxxxx" />
              </div>
            </div>
            <div className="pr-row">
              <div>
                <label>{t('عدد الأجهزة', 'Number of devices')}</label>
                <input type="number" min="1" value={form.qty} onChange={set('qty')} />
              </div>
              <div>
                <label>{t('رقم الجهاز (اختياري)', 'Device serial (optional)')}</label>
                <input dir="ltr" value={form.serial} onChange={set('serial')} placeholder="Serial" />
              </div>
            </div>
            <label>{t('رسالة (اختياري)', 'Message (optional)')}</label>
            <textarea rows={3} value={form.message} onChange={set('message')} placeholder={t('أي تفاصيل تحبّ إضافتها…', 'Anything else you would like to add…')} />
            {err ? <div className="pr-err">{err}</div> : null}
            <button className="btn lg" type="submit" disabled={busy}>
              {busy ? t('جارٍ الإرسال…', 'Sending…') : t('إرسال الطلب', 'Send request')}
            </button>
            <p className="pr-priv">{t('بياناتك تُستخدم للتواصل معك بخصوص الترخيص فقط.', 'Your details are only used to contact you about the licence.')}</p>
          </form>
        )}
      </div>
    </div>
  );
}
