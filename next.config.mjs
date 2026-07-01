/** @type {import('next').NextConfig} */

// Base path is env-driven so the SAME build works in two places:
//   • own server at the domain root (kushsmart.space)  → NEXT_PUBLIC_BASE_PATH=""
//   • GitHub Pages project path (/kushsmart)           → NEXT_PUBLIC_BASE_PATH="/kushsmart"
// Keep this in sync with lib/site.js (which reads the same env var).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // Static HTML export — produces an `out/` folder we serve as static files.
  output: 'export',
  basePath: basePath || undefined,
  // No server-side image optimizer for a static export.
  images: { unoptimized: true },
  // Emit `/docs/index.html` etc. so paths resolve cleanly when served statically.
  trailingSlash: true,
};

export default nextConfig;
