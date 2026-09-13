import './globals.css';
import localFont from 'next/font/local';
import { asset } from '@/lib/site';
import { SITE, SITE_NAME, OG_IMAGE } from '@/lib/seo';

// Self-hosted Cairo (variable font) — no build-time network fetch, so CI/Pages
// builds are reliable and there's no runtime Google Fonts dependency.
// Subsetted WOFF2 (Arabic + Latin + digits) — ~114KB vs 586KB for the full TTF.
const cairo = localFont({
  src: './fonts/Cairo.woff2',
  weight: '400 800',
  variable: '--font-cairo',
  display: 'swap',
});

// Self-hosted Inter (variable, Latin subset ~48KB) for English.
const inter = localFont({
  src: './fonts/Inter.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
});

// Site-wide defaults. Each page sets its own title, description and canonical
// URL through pageMeta() in lib/seo.js; these fill in anything a page omits.
// metadataBase used to point at the old GitHub Pages address, so every
// canonical and share URL resolved to the wrong site.
export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'كوش سمارت KUSH SMART — منزلك الذكي بين يديك',
    template: '%s | كوش سمارت KUSH SMART',
  },
  description:
    'وحدات منزل ذكي تُركَّب خلف مفاتيحك الحالية — تحكّم في الإضاءة والمراوح والستائر والتكييف من هاتفك وبصوتك. Smart home units that fit behind the switches you already have.',
  applicationName: 'KUSH SMART',
  keywords: [
    'كوش سمارت', 'منزل ذكي', 'البيت الذكي', 'مفاتيح ذكية', 'تحكم في الإضاءة من الموبايل',
    'منزل ذكي مصر', 'منزل ذكي السودان', 'KUSH SMART', 'smart home', 'smart switch',
    'Google Home', 'Alexa', 'Home Assistant',
  ],
  authors: [{ name: 'ATGENX' }],
  creator: 'ATGENX',
  publisher: 'KUSH SMART',
  category: 'technology',
  icons: { icon: asset('/assets/icon.png'), apple: asset('/assets/icon.png') },
  openGraph: {
    siteName: SITE_NAME,
    locale: 'ar_EG',
    alternateLocale: ['en_US'],
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', images: [OG_IMAGE.url] },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#0E1620',
};

// Most pages are Arabic (RTL); a saved English choice flips lang/dir before
// paint. The English legal pages set dir on their own wrapper.
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
