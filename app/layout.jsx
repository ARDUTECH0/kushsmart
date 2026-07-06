import './globals.css';
import localFont from 'next/font/local';
import { asset } from '@/lib/site';

// Self-hosted Cairo (variable font) — no build-time network fetch, so CI/Pages
// builds are reliable and there's no runtime Google Fonts dependency.
// Subsetted WOFF2 (Arabic + Latin + digits) — ~114KB vs 586KB for the full TTF.
// Only downloaded in Arabic mode; English uses system fonts (see globals.css).
const cairo = localFont({
  src: './fonts/Cairo.woff2',
  weight: '400 800',
  variable: '--font-cairo',
  display: 'swap',
});

// Self-hosted Inter (variable, Latin subset ~48KB) — a clean, professional
// English typeface. Self-hosted like Cairo so there's no runtime font fetch.
const inter = localFont({
  src: './fonts/Inter.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://ardutech0.github.io'),
  title: 'كوش سمارت | KUSH SMART — منزلك الذكي في إيدك',
  description:
    'كوش سمارت — نظام منزل ذكي تتحكم فيه من موبايلك ومن أي مكان. إضاءة، مراوح، ستائر، حسّاسات، وأكتر — بتحكّم محلي وسحابي سريع وآمن.',
  icons: { icon: asset('/assets/icon.png') },
};

// Most pages are Arabic (RTL); the English legal pages override dir on their
// own wrapper. Logical CSS properties keep both directions correct.
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=localStorage.getItem('lang')||'ar';var d=document.documentElement;d.lang=l;d.dir=(l==='en')?'ltr':'rtl';}catch(e){}})();",
          }}
        />
        {children}
      </body>
    </html>
  );
}
