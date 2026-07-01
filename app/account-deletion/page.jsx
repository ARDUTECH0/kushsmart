import Link from 'next/link';
import { asset, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = { title: 'Delete your account | KUSH SMART' };

export default function AccountDeletionPage() {
  return (
    <div dir="ltr" lang="en">
      <header className="nav">
        <div className="wrap nav-in">
          <Link className="brand" href="/">
            <img src={asset('/assets/icon.png')} alt="KUSH SMART" />
            <span>KUSH SMART<small>KUSH SMART</small></span>
          </Link>
          <nav className="nav-links">
            <Link href="/privacy">Privacy</Link>
          </nav>
        </div>
      </header>

      <div className="wrap docs">
        <main className="doc-main" style={{ gridColumn: '1/-1', maxWidth: '760px', margin: '0 auto' }}>
          <h1>Delete your account &amp; data</h1>
          <p className="sub">KUSH SMART — how to permanently remove your account and data.</p>

          <h2><span className="n">1</span> From the app (instant)</h2>
          <div className="card">
            <ol className="steps">
              <li>Open the <b>KUSH SMART</b> app and sign in.</li>
              <li>Go to <b>Profile</b>.</li>
              <li>Tap <b>Delete account</b> and confirm (you may be asked for your password).</li>
            </ol>
          </div>
          <p>This immediately and permanently deletes your account, your device records, notification tokens and all settings tied to your account.</p>

          <h2><span className="n">2</span> By email</h2>
          <p>
            If you can&apos;t access the app, email{' '}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20KUSH%20SMART%20account`}>
              {SUPPORT_EMAIL}
            </a>{' '}
            from your account&apos;s email address with the subject “Delete my account”. We
            verify and delete within <b>7 days</b> and confirm by email.
          </p>

          <h2><span className="n">?</span> What is deleted</h2>
          <table>
            <tbody>
              <tr><th>Deleted permanently</th><th>Retention</th></tr>
              <tr><td>Account &amp; sign-in (email)</td><td>Removed immediately</td></tr>
              <tr><td>Device list, names &amp; settings</td><td>Removed immediately</td></tr>
              <tr><td>Notification (FCM) tokens</td><td>Removed immediately</td></tr>
              <tr><td>Basic logs needed for security/abuse</td><td>Up to 30 days, then purged</td></tr>
            </tbody>
          </table>
          <p style={{ color: 'var(--muted)' }}>
            Note: deleting your account does not erase settings saved <i>on the physical
            devices</i> themselves — to wipe a unit, re-flash its firmware.
          </p>
        </main>
      </div>

      <footer>
        <div className="wrap">
          <div className="foot-bottom">
            © 2026 KUSH SMART · <Link href="/privacy" style={{ color: '#9fc7e6' }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
