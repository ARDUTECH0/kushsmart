import ControlPanel from '@/components/ControlPanel';

// Hidden control panel — not linked anywhere, and kept out of search engines.
// The manifest + apple-web-app tags are what let "Add to Home Screen" open
// this straight into the panel, full-screen, with no browser chrome.
export const metadata = {
  title: 'Panel',
  robots: { index: false, follow: false },
  manifest: '/panel-manifest.json',
  appleWebApp: {
    capable: true,
    title: 'أجهزتي',
    statusBarStyle: 'default',
  },
};

export const viewport = {
  themeColor: '#f3f5f9',
};

export default function PanelPage() {
  return <ControlPanel />;
}
