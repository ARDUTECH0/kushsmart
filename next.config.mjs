/** @type {import('next').NextConfig} */

// Deployed to GitHub Pages at https://ardutech0.github.io/kushsmart/, so the
// site lives under the /kushsmart path. Keep this in sync with lib/site.js.
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/kushsmart' : '';

const nextConfig = {
  // Static HTML export — produces an `out/` folder we publish to GitHub Pages.
  output: 'export',
  basePath,
  // Plain GitHub Pages can't run the Next image optimizer.
  images: { unoptimized: true },
  // Emit `/docs/index.html` etc. so paths resolve cleanly on Pages.
  trailingSlash: true,
};

export default nextConfig;
