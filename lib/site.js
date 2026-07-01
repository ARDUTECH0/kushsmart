// Base path the site is served from on GitHub Pages (ardutech0.github.io/kushsmart).
// Must match `basePath` in next.config.mjs. `next/link` applies basePath on its
// own, but plain <img>/<a href> to static files do NOT — so prefix those with
// asset().
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** Prefix a public asset path with the GitHub Pages base path. */
export const asset = (p) => `${BASE}${p}`;

export const SUPPORT_EMAIL = 'seifemadat@gmail.com';
