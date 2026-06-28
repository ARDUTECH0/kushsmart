import './globals.css';
import { Cairo } from 'next/font/google';
import { asset } from '@/lib/site';

const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
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
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>{children}</body>
    </html>
  );
}
