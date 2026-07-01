import Link from 'next/link';
import { asset } from '@/lib/site';

/** Full marketing footer (home page). */
export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="foot-brand">
              <img src={asset('/assets/icon.png')} alt="" />
              كوش سمارت — KUSH SMART
            </div>
            <p>
              نظام منزل ذكي بسيط وقوي — تحكّم في منزلك من أي مكان، بأمان وخصوصية
              كاملة.
            </p>
          </div>
          <div>
            <h4>روابط</h4>
            <Link href="/#features">المميزات</Link>
            <Link href="/#how">كيف يعمل</Link>
            <Link href="/docs">الدليل</Link>
            <Link href="/downloads">التحميل</Link>
          </div>
          <div>
            <h4>الدعم</h4>
            <Link href="/docs#faq">حلّ المشكلات</Link>
            <Link href="/docs">الدليل</Link>
            <Link href="/downloads">التحميل</Link>
          </div>
        </div>
        <div className="foot-bottom">
          © 2026 كوش سمارت — KUSH SMART · منزلك أذكى، وحياتك أسهل 🏠✨
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
            <>© 2026 كوش سمارت — KUSH SMART · منزلك أذكى، وحياتك أسهل 🏠✨</>
          )}
        </div>
      </div>
    </footer>
  );
}
