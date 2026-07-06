import Link from 'next/link';
import { asset } from '@/lib/site';
import L from './L';

/** Full marketing footer (home page). */
export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="foot-brand">
              <img src={asset('/assets/icon.png')} alt="" />
              <L ar="كوش سمارت — KUSH SMART" en="KUSH SMART" />
            </div>
            <p>
              <L
                ar="نظام منزل ذكي بسيط وقوي — تحكّم في منزلك من أي مكان، بأمان وخصوصية كاملة."
                en="A simple, powerful smart home — control your house from anywhere, with full security and privacy."
              />
            </p>
          </div>
          <div>
            <h4><L ar="روابط" en="Links" /></h4>
            <Link href="/#features"><L ar="المميزات" en="Features" /></Link>
            <Link href="/#how"><L ar="كيف يعمل" en="How it works" /></Link>
            <Link href="/docs"><L ar="الدليل" en="Guide" /></Link>
            <Link href="/downloads"><L ar="التحميل" en="Download" /></Link>
          </div>
          <div>
            <h4><L ar="الدعم" en="Support" /></h4>
            <Link href="/docs#faq"><L ar="حلّ المشكلات" en="Troubleshooting" /></Link>
            <Link href="/docs"><L ar="الدليل" en="Guide" /></Link>
            <Link href="/pricing"><L ar="الأسعار" en="Pricing" /></Link>
          </div>
        </div>
        <div className="foot-bottom">
          <L ar="© 2026 كوش سمارت — KUSH SMART · منزلك أذكى، وحياتك أسهل 🏠✨"
             en="© 2026 KUSH SMART · A smarter home, an easier life 🏠✨" />
        </div>
      </div>
    </footer>
  );
}

/** Minimal one-line footer (docs / setup / legal pages). */
export function SlimFooter({ children }) {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-bottom">
          {children ?? (
            <L ar="© 2026 كوش سمارت — KUSH SMART · منزلك أذكى، وحياتك أسهل 🏠✨"
               en="© 2026 KUSH SMART · A smarter home, an easier life 🏠✨" />
          )}
        </div>
      </div>
    </footer>
  );
}
