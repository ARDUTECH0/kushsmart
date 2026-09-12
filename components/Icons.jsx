/* Line icons — single consistent stroke, inherit color via currentColor.
   No emoji anywhere: this is the biggest step up in polish. */

const S = ({ children, ...p }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
);

export const Bulb = (p) => (
  <S {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.2 1 2V16h6v-.5c0-.8.3-1.4 1-2A6 6 0 0 0 12 3Z" />
  </S>
);

export const Fan = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="1.6" />
    <path d="M12 10.4c.6-3 .2-5.4-1.4-6.4-1.7-1-3 1-2.2 3 .6 1.6 2.1 2.8 3.6 3.4ZM13.6 12c3-.6 5.4-.2 6.4 1.4 1 1.7-1 3-3 2.2-1.6-.6-2.8-2.1-3.4-3.6ZM10.4 12c-3 .6-5.4.2-6.4-1.4-1-1.7 1-3 3-2.2 1.6.6 2.8 2.1 3.4 3.6ZM12 13.6c-.6 3-.2 5.4 1.4 6.4 1.7 1 3-1 2.2-3-.6-1.6-2.1-2.8-3.6-3.4Z" />
  </S>
);

export const Sensor = (p) => (
  <S {...p}>
    <path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z" />
    <path d="M12 14.5v-5" />
  </S>
);

export const Timer = (p) => (
  <S {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 13V9M9 2h6" />
  </S>
);

export const Automation = (p) => (
  <S {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    <path d="M11 10.5 13 13l-2 2.5" />
  </S>
);

export const Groups = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.6" />
  </S>
);

export const Remote = (p) => (
  <S {...p}>
    <path d="M5 9a9 9 0 0 1 14 0M8 12a5 5 0 0 1 8 0" />
    <circle cx="12" cy="16.5" r="1.4" />
  </S>
);

export const Bell = (p) => (
  <S {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7Z" />
    <path d="M10.5 20a2 2 0 0 0 3 0" />
  </S>
);

export const Lock = (p) => (
  <S {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    <path d="M12 14.5v2.5" />
  </S>
);

export const Bolt = (p) => (
  <S {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </S>
);

export const Signal = (p) => (
  <S {...p}>
    <path d="M5 9a9 9 0 0 1 14 0M8 12a5 5 0 0 1 8 0" />
    <circle cx="12" cy="16.5" r="1.3" />
  </S>
);

export const Cloud = (p) => (
  <S {...p}>
    <path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a3.75 3.75 0 0 1-.5 8.5H7Z" />
  </S>
);

export const Hand = (p) => (
  <S {...p}>
    <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M11 10.5V4.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L5 16c-.7-.9-.4-1.8.5-2.2.6-.3 1.3-.1 1.8.4L8 15V8.5a1.5 1.5 0 0 1 3 0" />
  </S>
);

export const Sync = (p) => (
  <S {...p}>
    <path d="M4 12a8 8 0 0 1 13.5-5.8L20 8" />
    <path d="M20 4v4h-4" />
    <path d="M20 12a8 8 0 0 1-13.5 5.8L4 16" />
    <path d="M4 20v-4h4" />
  </S>
);

export const Download = (p) => (
  <S {...p}>
    <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </S>
);

export const Cpu = (p) => (
  <S {...p}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M10.5 10.5h3v3h-3z" />
    <path d="M9 2v2M12 2v2M15 2v2M9 20v2M12 20v2M15 20v2M2 9h2M2 12h2M2 15h2M20 9h2M20 12h2M20 15h2" />
  </S>
);

export const Android = (p) => (
  <S {...p}>
    <path d="M5 16v-3a7 7 0 0 1 14 0v3Z" />
    <path d="M7 7 5.5 4.8M17 7l1.5-2.2" />
    <circle cx="9.5" cy="12" r=".6" fill="currentColor" />
    <circle cx="14.5" cy="12" r=".6" fill="currentColor" />
    <path d="M5 16v3M19 16v3" />
  </S>
);

export const Apple = (p) => (
  <S {...p}>
    <path d="M16 12.5c0-2 1.5-2.8 1.6-2.9-0.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.8-3.1 2-1.3 2.3-.3 5.7 1 7.5.6.9 1.3 1.9 2.3 1.9.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6 1.6-.9 2.2-1.8c.7-1 1-2 1-2.1-.1 0-1.9-.8-1.9-2.6Z" />
    <path d="M13.5 5.5c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.2 1.1-.5.5-.9 1.4-.8 2.3.9.1 1.7-.4 2.2-1Z" />
  </S>
);

export const Curtain = (p) => (
  <S {...p}>
    <path d="M3 4h18M4 4v16M20 4v16" />
    <path d="M8 4c0 6-1 10-3 12M16 4c0 6 1 10 3 12" />
  </S>
);

// ── console glyphs (admin) ───────────────────────────────────────────────────
export const Search = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </S>
);

export const Upload = (p) => (
  <S {...p}>
    <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </S>
);

export const Trash = (p) => (
  <S {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5h6V7" />
  </S>
);

export const Megaphone = (p) => (
  <S {...p}>
    <path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1Z" />
    <path d="M17.5 9a4 4 0 0 1 0 6M8 15l1.5 5" />
  </S>
);

export const Mail = (p) => (
  <S {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </S>
);

export const Phone = (p) => (
  <S {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
  </S>
);

export const Users = (p) => (
  <S {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.3a6.5 6.5 0 0 1 3.5 5.7" />
  </S>
);

export const Globe = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z" />
  </S>
);

export const Receipt = (p) => (
  <S {...p}>
    <path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21V3Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </S>
);

export const Wallet = (p) => (
  <S {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
    <rect x="4" y="8" width="16.5" height="11" rx="2" />
    <path d="M16 13.5h1.5" />
  </S>
);

export const Menu = (p) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);

export const Close = (p) => (
  <S {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </S>
);

export const Copy = (p) => (
  <S {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </S>
);

export const Key = (p) => (
  <S {...p}>
    <circle cx="8" cy="14" r="4" />
    <path d="m11 11 8.5-8.5M16.5 5.5l2.5 2.5M14 8l2 2" />
  </S>
);

export const Logout = (p) => (
  <S {...p}>
    <path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" />
    <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
  </S>
);

export const Check = (p) => (
  <S {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </S>
);

export const Plus = (p) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const Alert = (p) => (
  <S {...p}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4.5M12 17.2v.3" />
  </S>
);
