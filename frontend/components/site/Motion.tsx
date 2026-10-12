'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Site-wide motion controller (replaces the comp's reveal()/tick() loop):
 * - scroll reveal for [data-reveal] elements (IntersectionObserver)
 * - pauses CSS animations while the tab is hidden
 * - subtle parallax on the hero topology (#hero-vis) on wide screens
 * Everything is skipped under prefers-reduced-motion.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-shown)'));
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-shown'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-shown');
            io.unobserve(en.target);
          }
        }),
      { rootMargin: '0px 0px -5% 0px' },
    );
    els.forEach((el) => io.observe(el));
    // Safety net, as in the comp: never leave content hidden
    const t = setTimeout(() => document.querySelectorAll('[data-reveal]:not(.is-shown)').forEach((el) => el.getBoundingClientRect().top < window.innerHeight * 1.5 && el.classList.add('is-shown')), 1500);
    // Elements added later (client-side lists) are picked up too
    const mo = new MutationObserver(() => document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-shown):not([data-obs])').forEach((el) => (el.setAttribute('data-obs', '1'), io.observe(el))));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(t);
    };
  }, [pathname]);

  useEffect(() => {
    const onVis = () => document.documentElement.toggleAttribute('data-mts-paused', document.hidden);
    document.addEventListener('visibilitychange', onVis);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onMove = (e: MouseEvent) => {
      const el = document.getElementById('hero-vis');
      if (!el || reduced || window.innerWidth < 980) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.transform = `translate(${x * -16}px, ${y * -16}px)`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return null;
}
