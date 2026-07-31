// "Works with Google Home" mark — self-contained inline SVG (no external asset;
// works under the site's strict CSP). An original smart-speaker silhouette in
// Google's own four-colour palette, not a trace of Google's protected logo —
// same approach as HaLogo. `size` controls the pixel box; `plain` drops the
// white tile background for use on coloured surfaces.
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
      {/* speaker body */}
      <circle cx="24" cy="24" r="14" fill="none" stroke="#5F6368" strokeWidth="2.2" />
      {/* four coloured dots around the ring, evenly spaced — the "works with
          Google" cue, without reproducing Google's own logotype */}
      <circle cx="24" cy="10.5" r="3.4" fill="#4285F4" />
      <circle cx="37.5" cy="24" r="3.4" fill="#EA4335" />
      <circle cx="24" cy="37.5" r="3.4" fill="#FBBC05" />
      <circle cx="10.5" cy="24" r="3.4" fill="#34A853" />
      {/* centre mic dot */}
      <circle cx="24" cy="24" r="4.2" fill="#5F6368" />
    </svg>
  );
}
