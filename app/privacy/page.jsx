import Link from 'next/link';
import { asset, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = { title: 'Privacy Policy | KUSH SMART' };

export default function PrivacyPage() {
  return (
    <div dir="ltr" lang="en">
      <header className="nav">
        <div className="wrap nav-in">
          <Link className="brand" href="/">
            <img src={asset('/assets/icon.png')} alt="KUSH SMART" />
            <span>KUSH SMART<small>KUSH SMART</small></span>
          </Link>
          <nav className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/docs">Docs</Link>
          </nav>
        </div>
      </header>

      <div className="wrap docs">
        <main className="doc-main" style={{ gridColumn: '1/-1', maxWidth: '820px', margin: '0 auto' }}>
          <h1>Privacy Policy</h1>
          <p className="sub">KUSH SMART — last updated 27 June 2026.</p>

          <p>
            KUSH SMART (“we”, “the app”) lets you control your smart-home devices. This
            policy explains what we collect, why, and your choices. We keep data to the
            minimum needed to run the service.
          </p>

          <h2><span className="n">1</span> Information we collect</h2>
          <table>
            <tbody>
              <tr><th>Data</th><th>Why</th></tr>
              <tr><td>Account email</td><td>To create and secure your account (Firebase Authentication).</td></tr>
              <tr><td>Your devices &amp; their names/settings</td><td>To show and control your units, and sync across your phones.</td></tr>
              <tr><td>Notification (FCM) token</td><td>To send you push alerts (e.g. a sensor or lock event).</td></tr>
              <tr><td>Purchase records (if you buy a unit licence)</td><td>The transaction (product, store order id, device serial) to verify and activate the licence. Payment is handled by Google Play / the App Store — we never see your card details.</td></tr>
              <tr><td>Wi-Fi network name (during setup only)</td><td>To provision a new device onto your network. We never store your Wi-Fi password on our servers — it goes only to your device.</td></tr>
              <tr><td>Voice input (only when you use the mic)</td><td>To recognize a spoken command on your phone.</td></tr>
            </tbody>
          </table>
          <p>We do <b>not</b> sell your data, use it for advertising, or track you across other apps.</p>

          <h2><span className="n">2</span> Permissions</h2>
          <ul>
            <li><b>Location</b> — used <i>only during device setup</i> to read the current Wi-Fi name (Android requires location to access the SSID). No background location, no tracking.</li>
            <li><b>Microphone</b> — only while you actively use voice control.</li>
            <li><b>Notifications</b> — to deliver alerts you enable.</li>
            <li><b>Local network / nearby Wi-Fi</b> — to discover and talk to your devices on the same network.</li>
          </ul>

          <h2><span className="n">3</span> How data is stored</h2>
          <p>Account and device data are stored in Google Firebase (Authentication, Cloud Firestore, Cloud Messaging) under industry-standard security. Device state flows over an MQTT broker scoped so you only ever see your own devices.</p>

          <h2><span className="n">4</span> Data sharing</h2>
          <p>We share data only with the infrastructure providers needed to run the app (Google Firebase). If you link Google Home or Amazon Alexa, the linked service receives only your device list and states to fulfil voice commands.</p>

          <h2><span className="n">5</span> Terms &amp; licensing</h2>
          <p>Each unit runs on a licence tied to its serial number. You agree to use the app and devices lawfully and fairly. We may suspend or revoke a unit&apos;s licence at any time in case of fraud, abuse, tampering, resale violations, or any unfair or unauthorized use.</p>

          <h2><span className="n">6</span> Deleting your account &amp; data</h2>
          <p>
            You can delete your account and all associated data at any time from the
            app: <b>Profile → Delete account</b>. This permanently removes your account,
            device records and tokens. You can also request deletion by email (below).
            See the <Link href="/account-deletion">account &amp; data deletion page</Link>.
          </p>

          <h2><span className="n">7</span> Children</h2>
          <p>KUSH SMART is not directed to children under 13 and we do not knowingly collect their data.</p>

          <h2><span className="n">8</span> Contact</h2>
          <p>Questions or requests: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>

          <div className="cta-band" style={{ marginTop: '30px' }}>
            <div><b>Need to remove your data?</b> Delete it in-app, or email us — we respond within 7 days.</div>
            <Link className="btn" href="/account-deletion">Account deletion</Link>
          </div>
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
