'use client';

import { useState } from 'react';
import Link from 'next/link';
import { asset } from '@/lib/site';

/**
 * Sticky site header with the brand and nav. `links` is an array of
 * { href, label, active?, btn? }. The mobile menu toggles open/closed.
 */
export default function SiteHeader({ links }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <img src={asset('/assets/icon.png')} alt="KUSH SMART" />
          <span>
            كوش سمارت<small>KUSH SMART</small>
          </span>
        </Link>
        <button
          className="menu-btn"
          aria-label="القائمة"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
        <nav className={`nav-links${open ? ' open' : ''}`}>
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className={[l.btn ? 'btn' : '', l.active ? 'active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
