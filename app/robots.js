import { SITE } from '@/lib/seo';

// Static export: generated once at build time into out/robots.txt.
export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The operator console, the customer panel and the technician tools are
        // not pages anyone should land on from a search.
        disallow: ['/admin/', '/panel/', '/install/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
