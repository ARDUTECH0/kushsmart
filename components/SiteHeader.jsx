'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { asset } from '@/lib/site';
import LangToggle from './LangToggle';
import { Menu, Close } from './Icons';

/**
 * Sticky site header with the brand, nav and a language toggle. `links` is an
 * array of { href, label, en?, active?, btn? } — when `en` is given the label
 * shows in both languages. On narrow screens the nav folds into a menu.
 */
export default function SiteHeader({ links }) {
  const [open, setOpen] = useState(false);

  // Esc closes the open menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <img src={asset('/assets/icon.png')} alt="" width="40" height="40" />
          <span>
            <span data-ar="">كوش سمارت</span>
            <span data-en="">KUSH SMART</span>
            <small data-ar="">KUSH SMART</small>
            <small data-en="">BY ATGENX</small>
          </span>
        </Link>
        <button
          className="menu-btn"
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <Close /> : <Menu />}
        </button>
        <nav id="site-nav" className={`nav-links${open ? ' open' : ''}`}>
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className={[l.btn ? 'btn' : '', l.active ? 'active' : '']
                .filter(Boolean)
                .join(' ')}
              aria-current={l.active ? 'page' : undefined}
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
