'use client';

import { useState } from 'react';

// A shell command the reader can copy in one click. Bilingual labels use the
// same [data-ar]/[data-en] trick as <L>, so the active language shows via CSS.
//
// The button sits in its own header bar rather than floating over the code: the
// command scrolls horizontally, and a floating button would cover it.
export default function CopyBox({ code, title = 'Terminal' }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return; // clipboard blocked (insecure origin) — the text is selectable anyway
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }

  return (
    <div className="ha-cmd">
      <div className="ha-cmd-bar">
        <span className="ha-cmd-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="ha-cmd-title">{title}</span>
        <button
          type="button"
          className={`ha-cmd-btn ${done ? 'done' : ''}`}
          onClick={copy}
        >
          <span data-ar="">{done ? 'تم النسخ ✓' : 'نسخ الأمر'}</span>
          <span data-en="">{done ? 'Copied ✓' : 'Copy command'}</span>
        </button>
      </div>
      <pre dir="ltr"><code>{code}</code></pre>
    </div>
  );
}
