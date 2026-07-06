'use client';

import { useState } from 'react';
import Link from 'next/link';
import { asset } from '@/lib/site';
import LangToggle from './LangToggle';

/**
 * Sticky site header with the brand, nav and a language toggle. `links` is an
 * array of { href, label, en?, active?, btn? } — when `en` is given the label
 * shows in both languages. The mobile menu toggles open/closed.
 */
export default function SiteHeader({ links }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <img src={asset('/assets/icon.png')} alt="KUSH SMART" />
          <span>
            <span data-ar="">كوش سمارت</span>
            <span data-en="">KUSH SMART</span>
            <small data-ar="">KUSH SMART</small>
          </span>
        </Link>
        <button
          className="menu-btn"
          aria-label="Menu"
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
              {l.en ? (
                <>
                  <span data-ar="">{l.label}</span>
                  <span data-en="">{l.en}</span>
                </>
              ) : (
                l.label
              )}
            </Link>
          ))}
          <LangToggle />
        </nav>
      </div>
    </header>
  );
}
