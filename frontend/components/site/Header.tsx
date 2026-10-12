'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { NAV, isCurrent } from './nav';
import type { PublicSettings } from '@/lib/types';

/** Fixed header: transparent until scrolled; full nav ≥ 1200px, otherwise a Menu button + full-screen menu. */
export function Header({ settings }: { settings: PublicSettings }) {
  const pathname = usePathname() || '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
      if (e.key === 'Tab' && menuRef.current) {
        const f = Array.from(menuRef.current.querySelectorAll<HTMLElement>('a[href]'));
        const all = [btnRef.current!, ...f];
        const i = all.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          all[all.length - 1].focus();
        } else if (!e.shiftKey && i === all.length - 1) {
          e.preventDefault();
          all[0].focus();
        }
      }
    };
    const onResize = () => window.innerWidth >= 1200 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = o;
    };
  }, [open]);

  return (
    <header className={`hdr${scrolled ? ' is-scrolled' : open ? ' is-solid' : ''}`}>
      <div className="wrap hdr__in">
        <Logo />
        <nav aria-label="Primary" className="nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav__link" aria-current={isCurrent(pathname, n.href) ? 'page' : undefined}>
              <i aria-hidden="true" />
              {n.label}
            </Link>
          ))}
          <Link href="/contact" className="btn nav__cta">
            Discuss a Solution <span aria-hidden="true">→</span>
          </Link>
        </nav>
        <button ref={btnRef} type="button" className="menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu">
          <span>{open ? 'Close' : 'Menu'}</span>
          <span aria-hidden="true" className="menu-btn__bars">
            <i />
            <i />
          </span>
        </button>
      </div>
      {open && (
        <nav ref={menuRef} id="mobile-menu" aria-label="Mobile" className="mmenu">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} className="mmenu__item" aria-current={isCurrent(pathname, n.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {n.label}
              <span>{String(i + 1).padStart(2, '0')}</span>
            </Link>
          ))}
          <Link href="/contact" className="btn btn--lg btn--block" style={{ marginTop: 28 }} onClick={() => setOpen(false)}>
            Discuss a Solution <span aria-hidden="true">→</span>
          </Link>
          <div className="col" style={{ marginTop: 24, gap: 8, fontSize: 15 }}>
            {settings.email && <a href={settings.mailHref || undefined}>{settings.email}</a>}
            {settings.phone && <a href={settings.telHref || undefined}>{settings.phone}</a>}
          </div>
        </nav>
      )}
    </header>
  );
}
