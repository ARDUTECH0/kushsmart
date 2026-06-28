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
