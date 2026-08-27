import { asset } from '@/lib/site';

// Amazon's own Alexa ring/spiral icon (public/assets/logos/alexa.svg —
// sourced from Wikimedia Commons, PD-shape/trademarked). `size` controls the
// pixel box; `plain` drops the white tile background for use on coloured
// surfaces.
export default function AlexaLogo({ size = 40, plain = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Amazon Alexa"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {!plain && <rect width="48" height="48" rx="11" fill="#fff" />}
      <image
        href={asset('/assets/logos/alexa.svg')}
        x="5" y="5" width="38" height="38"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
