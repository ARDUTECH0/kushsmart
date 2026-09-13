// Search and share metadata, in one place.
//
// The site is served from kushsmart.space. Every page's canonical URL, social
// card and sitemap entry is built from SITE, so they can't disagree. Paths end
// in "/" because the site is exported with trailingSlash.
export const SITE = 'https://kushsmart.space';
export const SITE_NAME = 'KUSH SMART — كوش سمارت';

// The share card (1200×630). A plain .png in public/, so every server sends it
// as image/png — a Next-generated card was exported with no file extension,
// which some share previews refuse.
export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'KUSH SMART — smart home units that fit behind the switches you already have',
};

/**
 * Page metadata: title, description, canonical URL and social cards.
 * Titles carry both languages, because one URL serves both.
 * `absolute` skips the site-name suffix (the home page already is the name).
 */
export function pageMeta({ title, description, path = '/', noindex = false, absolute = false }) {
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'ar_EG',
      alternateLocale: ['en_US'],
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
