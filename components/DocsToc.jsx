'use client';

import { useEffect, useState } from 'react';

/**
 * Docs sidebar table of contents. Highlights the section currently in view
 * (same behaviour as the old vanilla IntersectionObserver). `groups` is an
 * array of { title, items: [{ href, label }] } — href is a "#id" anchor.
 */
export default function DocsToc({ groups }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const sections = document.querySelectorAll('.doc-main section');
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActiveId(en.target.id);
        });
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <aside className="toc">
      <nav>
        {groups.map((g) => (
          <div key={g.title}>
            <h4>{g.title}</h4>
            {g.items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className={activeId === it.href.slice(1) ? 'active' : ''}
              >
                {it.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
