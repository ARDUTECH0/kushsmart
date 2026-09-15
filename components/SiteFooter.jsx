import Link from 'next/link';
import { asset, SUPPORT_EMAIL } from '@/lib/site';
import { Mail } from './Icons';
import L from './L';

// The footer's column links are blocks; a link inside running text stays inline.
const INLINE = { display: 'inline', padding: 0, color: '#9CC3E6', fontWeight: 700 };

/** The site footer: product, guide and support links, plus the legal pages. */
export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="foot-brand">
              <img src={asset('/assets/icon.png')} alt="" width="40" height="40" />
              <L ar="كوش سمارت" en="KUSH SMART" />
            </div>
            <p>
              <L
                ar={<>وحدات منزل ذكي تُركَّب خلف مفاتيحك الحالية، مع تطبيق تتحكّم منه في منزلك من أي مكان. من تصنيع <Link href="/company" style={INLINE}>ATGENX</Link>.</>}
                en={<>Smart home units that fit behind the switches you already have, with an app that runs your home from anywhere. Made by <Link href="/company" style={INLINE}>ATGENX</Link>.</>}
              />
            </p>
            <a className="foot-mail" href={`mailto:${SUPPORT_EMAIL}`}><Mail />{SUPPORT_EMAIL}</a>
          </div>
          <div>
            <h4><L ar="المنتج" en="Product" /></h4>
            <Link href="/#features"><L ar="المميزات" en="Features" /></Link>
            <Link href="/#how"><L ar="كيف يعمل" en="How it works" /></Link>
            <Link href="/pricing"><L ar="الأسعار والترخيص" en="Pricing & licence" /></Link>
            <Link href="/downloads"><L ar="التحميل" en="Download" /></Link>
          </div>
          <div>
            <h4><L ar="الدليل" en="Guide" /></h4>
            <Link href="/docs"><L ar="البداية" en="Getting started" /></Link>
            <Link href="/docs#automations"><L ar="الأتمتة" en="Automations" /></Link>
            <Link href="/docs/home-assistant">Home Assistant</Link>
            <Link href="/docs/google-home">Google Home</Link>
            <Link href="/docs/alexa">Alexa</Link>
          </div>
          <div>
            <h4><L ar="الدعم" en="Support" /></h4>
            <Link href="/docs#faq"><L ar="حلّ المشكلات" en="Troubleshooting" /></Link>
            <Link href="/docs#update"><L ar="تحديث الأجهزة" en="Updating devices" /></Link>
            <Link href="/privacy"><L ar="سياسة الخصوصية" en="Privacy policy" /></Link>
            <Link href="/account-deletion"><L ar="حذف الحساب" en="Delete your account" /></Link>
          </div>
        </div>
        <div className="foot-bottom">
          <L ar={<>© 2026 كوش سمارت — من تصنيع وتشغيل <Link href="/company">ATGENX</Link></>}
            en={<>© 2026 KUSH SMART — made and operated by <Link href="/company">ATGENX</Link></>} />
          <span className="foot-legal">
            <Link href="/privacy"><L ar="الخصوصية" en="Privacy" /></Link>
            <Link href="/account-deletion"><L ar="حذف الحساب" en="Account deletion" /></Link>
            <Link href="/flash"><L ar="رفع السوفت وير" en="Flash a board" /></Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

/**
 * Footer for the inner pages. It used to be a single copyright line; the docs,
 * downloads and pricing pages now carry the full footer too, so visitors can
 * reach support and the legal pages from anywhere. `children` still replaces
 * the whole thing when a page needs its own line.
 */
export function SlimFooter({ children }) {
  if (children == null) return <SiteFooter />;
  return (
    <footer>
      <div className="wrap">
        <div className="foot-bottom">{children}</div>
      </div>
    </footer>
  );
}
