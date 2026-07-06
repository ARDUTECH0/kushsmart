// Home Assistant mark — self-contained inline SVG (no external asset; works under
// the site's strict CSP). Blue rounded square + white house with a connected-home
// hub motif. `size` controls the pixel box; `plain` drops the blue tile (white
// house only) for use on coloured backgrounds.
export default function HaLogo({ size = 40, plain = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Home Assistant"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {!plain && <rect width="48" height="48" rx="11" fill="#18BCF2" />}
      <g
        fill="none"
        stroke={plain ? '#18BCF2' : '#ffffff'}
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* house outline */}
        <path d="M24 9 L39 22 V38.5 H9 V22 Z" />
      </g>
      {/* connected-home hub: centre node + three spokes */}
      <g stroke={plain ? '#18BCF2' : '#ffffff'} strokeWidth="1.7" strokeLinecap="round">
        <line x1="24" y1="27" x2="24" y2="18.8" />
        <line x1="24" y1="27" x2="17.6" y2="33.2" />
        <line x1="24" y1="27" x2="30.4" y2="33.2" />
      </g>
      <g fill={plain ? '#18BCF2' : '#ffffff'}>
        <circle cx="24" cy="27" r="2.7" />
        <circle cx="24" cy="18.4" r="1.9" />
        <circle cx="17.4" cy="33.4" r="1.9" />
        <circle cx="30.6" cy="33.4" r="1.9" />
      </g>
    </svg>
  );
}
