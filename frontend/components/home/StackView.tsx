'use client';

import { useState } from 'react';
import type { Layer, Service } from '@/lib/types';

/** "[04] Across the stack": pick a capability to highlight the layers it touches. */
export function StackView({ layers, services }: { layers: Layer[]; services: Service[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const hit = (l: Layer) => !!sel && l.services.includes(sel);
  const label = services.find((s) => s.slug === sel)?.name.toUpperCase() || 'ALL LAYERS';
  const n = layers.length;
  // plates are drawn bottom (last layer) to top, centred around the middle
  const offset = (i: number) => i - (n - 1) / 2;

  return (
    <div className="grid-auto" style={{ ['--min' as string]: '440px', ['--gap' as string]: 'clamp(32px,5vw,80px)', alignItems: 'center' }}>
      <div className="col" style={{ gap: 22 }}>
        <p data-reveal="" className="kicker">
          [ 04 ] ACROSS THE STACK
        </p>
        <h2 data-reveal="" className="d d-h2" style={{ maxWidth: '14ch' }}>
          Where each capability sits in <span className="it it-lav">your architecture.</span>
        </h2>
        <p data-reveal="" className="body" style={{ maxWidth: 440 }}>
          Select a capability to see the layers of an enterprise environment it typically touches.
        </p>
        <div role="group" aria-label="Highlight layers by capability" className="flex-wrap" style={{ gap: 8 }}>
          {services.map((s) => (
            <button key={s.slug} type="button" className="chip chip--pink" aria-pressed={sel === s.slug} onClick={() => setSel(sel === s.slug ? null : s.slug)}>
              {s.name}
            </button>
          ))}
        </div>
        <ul className="layers" aria-live="polite">
          {layers.map((l) => (
            <li key={l.id} className={hit(l) ? 'is-hit' : sel ? 'is-dim' : ''}>
              <span className="code">{l.code}</span>
              <span className="col" style={{ gap: 3 }}>
                <span className="d" style={{ fontSize: 16, letterSpacing: '-.02em' }}>
                  {l.name}
                </span>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{l.desc}</span>
              </span>
              <span aria-hidden="true" className="dot" />
              {hit(l) && <span className="sr-only">(touched by {label.toLowerCase()})</span>}
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" data-reveal="clip" className="plates">
        <span className="mono" style={{ position: 'absolute', left: 16, top: 14, fontSize: 11, letterSpacing: '.12em', color: 'var(--muted)' }}>
          STACK VIEW · {label}
        </span>
        {layers
          .map((l, i) => ({ l, i }))
          .reverse()
          .map(({ l, i }) => (
            <span key={`p${l.id}`} className={`plate${hit(l) ? ' is-hit' : ''}`} style={{ ['--i' as string]: offset(i) }} />
          ))}
        {layers.map((l, i) => (
          <span key={`l${l.id}`} className={`plate-label${hit(l) ? ' is-hit' : ''}`} style={{ ['--i' as string]: offset(i) }}>
            <i />
            {l.code}
          </span>
        ))}
      </div>
    </div>
  );
}
