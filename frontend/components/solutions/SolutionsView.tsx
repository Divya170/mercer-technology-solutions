'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Service } from '@/lib/types';
import { accentFor } from '@/lib/format';
import { ImageSlot } from '@/components/site/bits';

/** Service explorer (vertical tabs + considerations accordion) and the alternating "in context" rows. */
export function SolutionsView({ services, initialSlug }: { services: Service[]; initialSlug?: string }) {
  const [sel, setSel] = useState(services.find((s) => s.slug === initialSlug)?.slug || services[0]?.slug);
  const [acc, setAcc] = useState<string | null>(null);
  const explorerRef = useRef<HTMLElement>(null);

  // Arriving on /solutions/:slug scrolls to the explorer, as in the design.
  useEffect(() => {
    if (!initialSlug) return;
    if (services.some((s) => s.slug === initialSlug)) setSel(initialSlug);
    setTimeout(() => scrollToExplorer(), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug]);

  const scrollToExplorer = () => {
    const el = explorerRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: reduced ? 'auto' : 'smooth' });
  };

  const select = (slug: string, scroll = false) => {
    setSel(slug);
    setAcc(null);
    try {
      window.history.replaceState(window.history.state, '', `/solutions/${slug}`);
    } catch {
      /* ignore */
    }
    if (scroll) scrollToExplorer();
  };

  if (!services.length) {
    return (
      <section className="bg-night sec-md">
        <div className="wrap">
          <div className="empty">
            <p className="d" style={{ fontSize: 20 }}>
              Capabilities are being finalised.
            </p>
            <Link href="/contact" className="btn">
              Discuss a Solution →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const idx = Math.max(0, services.findIndex((s) => s.slug === sel));
  const act = services[idx];

  const onKey = (e: React.KeyboardEvent) => {
    let j: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (idx + 1) % services.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (idx - 1 + services.length) % services.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = services.length - 1;
    if (j === null) return;
    e.preventDefault();
    select(services[j].slug);
    setTimeout(() => document.getElementById(`tab-${services[j as number].slug}`)?.focus(), 0);
  };

  return (
    <>
      <section ref={explorerRef} id="explorer" aria-labelledby="explorer-title" data-screen-label="Solutions — Explorer" className="bg-night" style={{ padding: 'clamp(24px,3vw,48px) 0 clamp(56px,7vw,96px)', scrollMarginTop: 84 }}>
        <div className="wrap">
          <h2 id="explorer-title" className="mono" style={{ fontSize: 12, letterSpacing: '.14em', color: 'var(--muted)', fontWeight: 500, marginBottom: 18 }}>
            SERVICE EXPLORER
          </h2>
          <div className="explorer">
            <div role="tablist" aria-label="Services" aria-orientation="vertical" onKeyDown={onKey} className="explorer__tabs">
              {services.map((s) => {
                const on = s.slug === act.slug;
                return (
                  <button key={s.slug} type="button" role="tab" id={`tab-${s.slug}`} aria-selected={on} aria-controls="svc-panel" tabIndex={on ? 0 : -1} onClick={() => select(s.slug)} className="explorer__tab">
                    <span className="n">/{s.n}</span>
                    <span className="d" style={{ fontSize: 18, letterSpacing: '-.02em' }}>
                      {s.name}
                    </span>
                    {s.isSample && <span className="pending">SAMPLE CONTENT</span>}
                  </button>
                );
              })}
            </div>
            <div id="svc-panel" role="tabpanel" aria-labelledby={`tab-${act.slug}`} tabIndex={0} className="explorer__panel">
              <div className="col" style={{ gap: 14 }}>
                <p className="kicker" style={{ letterSpacing: '.1em' }}>
                  {act.n} / SOLUTION OVERVIEW
                </p>
                <h3 className="d" style={{ fontSize: 'clamp(28px,3vw,44px)', lineHeight: 1.05 }}>
                  {act.name}
                </h3>
                <p className="lead" style={{ fontSize: 17, maxWidth: 680 }}>
                  {act.overview}
                </p>
              </div>
              <div className="grid-auto" style={{ ['--min' as string]: '260px' }}>
                <div className="card">
                  <h4 className="mono-xs" style={{ marginBottom: 6 }}>
                    BUSINESS PROBLEMS ADDRESSED
                  </h4>
                  <ul className="diamond-list">
                    {act.problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h4 className="mono-xs" style={{ marginBottom: 14 }}>
                    RELEVANT TECHNICAL SCOPE
                  </h4>
                  <ul className="flex-wrap" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 6 }}>
                    {act.scope.map((sc) => (
                      <li key={sc} style={{ padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, background: 'rgba(185,166,255,.06)' }}>
                        {sc}
                      </li>
                    ))}
                  </ul>
                  <p className="pending" style={{ marginTop: 14 }}>
                    [Specific technologies and platforms — to be confirmed]
                  </p>
                </div>
              </div>
              {act.considerations.length > 0 && (
                <div>
                  <h4 className="mono-xs" style={{ marginBottom: 6 }}>
                    IMPLEMENTATION CONSIDERATIONS
                  </h4>
                  {act.considerations.map((c, i) => {
                    const key = `${act.slug}-${i}`;
                    const open = acc === key;
                    return (
                      <div key={key} className="acc">
                        <h5 style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                          <button type="button" id={`acc-b-${key}`} aria-expanded={open} aria-controls={`acc-p-${key}`} onClick={() => setAcc(open ? null : key)}>
                            {c.title}
                            <i aria-hidden="true">+</i>
                          </button>
                        </h5>
                        <div id={`acc-p-${key}`} role="region" aria-labelledby={`acc-b-${key}`} className={`acc__body${open ? ' is-open' : ''}`}>
                          <div>
                            <p style={{ padding: '0 0 20px', fontSize: 15.5, lineHeight: 1.65, color: 'var(--muted)', maxWidth: 660 }}>{c.body}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <p className="small">
                  Related industry use cases: <strong style={{ color: 'var(--text)', fontWeight: 600 }}>none published yet</strong>
                </p>
                <Link href={`/contact?interest=${act.slug}`} className="btn">
                  Discuss {act.name} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-screen-label="Solutions — In context" className="bg-night-2 line-top sec-md">
        <div className="wrap col" style={{ gap: 'clamp(48px,6vw,88px)' }}>
          {services.map((s, i) => {
            const a = accentFor(i);
            return (
              <article key={s.slug} className={`row-alt${i % 2 ? ' rev' : ''}`}>
                <ImageSlot src={s.image} alt={s.imageAlt} label={s.imageLabel || `IMAGE — ${s.name}`} alt2 className="min0" style={{ flex: '1 1 420px', aspectRatio: '16 / 10', borderRadius: 20, border: '1px solid var(--line)', padding: 18 }}>
                  <span aria-hidden="true" className="corner corner--tl" style={{ borderColor: a.accent }} />
                  <span aria-hidden="true" style={{ position: 'absolute', right: 14, top: 14, fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 64, lineHeight: 1, color: 'transparent', WebkitTextStroke: `1px ${a.stroke}` }}>
                    {s.n}
                  </span>
                </ImageSlot>
                <div className="col min0" style={{ flex: '1 1 380px', gap: 18 }}>
                  <p data-reveal="" className="mono" style={{ fontSize: 12, color: a.accent }}>
                    /{s.n} {s.isSample && <span className="sample-tag" style={{ marginLeft: 8 }}>SAMPLE CONTENT</span>}
                  </p>
                  <h2 data-reveal="" className="d" style={{ fontSize: 'clamp(28px,3.2vw,48px)', letterSpacing: '-.045em', lineHeight: 1.04 }}>
                    {s.name}
                  </h2>
                  <p data-reveal="" className="body">
                    {s.short}
                  </p>
                  <div data-reveal="" className="flex-wrap" style={{ gap: 10, marginTop: 6 }}>
                    <button type="button" className="btn btn--md btn-outline" onClick={() => select(s.slug, true)}>
                      View details
                    </button>
                    <Link href={`/contact?interest=${s.slug}`} className="btn btn--md btn-soft">
                      Enquire →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
