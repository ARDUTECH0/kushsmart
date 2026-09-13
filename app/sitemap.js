import { SITE } from '@/lib/seo';

// Static export: generated once at build time into out/sitemap.xml.
export const dynamic = 'force-static';

// Public pages only. The board-setup page stays out: it's opened from inside the
// app for installers, and carries a noindex of its own.
// [path, priority, change frequency]
const PAGES = [
  ['/', 1.0, 'weekly'],
  ['/downloads/', 0.9, 'weekly'],
  ['/pricing/', 0.9, 'monthly'],
  ['/docs/', 0.8, 'monthly'],
  ['/docs/home-assistant/', 0.6, 'monthly'],
  ['/docs/google-home/', 0.6, 'monthly'],
  ['/docs/alexa/', 0.6, 'monthly'],
  ['/privacy/', 0.3, 'yearly'],
  ['/account-deletion/', 0.2, 'yearly'],
];

export default function sitemap() {
  const lastModified = new Date();
  return PAGES.map(([path, priority, changeFrequency]) => ({
    url: `${SITE}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
