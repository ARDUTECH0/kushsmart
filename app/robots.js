import { SITE } from '@/lib/seo';

// Static export: generated once at build time into out/robots.txt.
export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The operator console and the customer panel are not pages anyone
        // should land on from a search.
        disallow: ['/admin/', '/panel/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
