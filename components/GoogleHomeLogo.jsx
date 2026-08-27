import { asset } from '@/lib/site';

// Google's own "Google Home" app logo (public/assets/logos/google-home.svg —
// official 2025 mark, sourced from Wikimedia Commons, PD-shape/trademarked).
// `size` controls the pixel box; `plain` drops the white tile background for
// use on coloured surfaces.
export default function GoogleHomeLogo({ size = 40, plain = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Google Home"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {!plain && <rect width="48" height="48" rx="11" fill="#fff" />}
      <image
        href={asset('/assets/logos/google-home.svg')}
        x="5" y="5" width="38" height="38"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
