'use client';

import { useEffect, useRef, useState } from 'react';
import type { Stage } from '@/lib/types';

/** "[03] Approach": the timeline fills and stages light up as they pass 60% of the viewport. */
export function Approach({ stages }: { stages: Stage[] }) {
  const olRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const ol = olRef.current;
      const fill = fillRef.current;
      if (!ol || !fill) return;
      const vh = window.innerHeight || 800;
      const r = ol.getBoundingClientRect();
      const mark = vh * 0.6;
      const p = reduced ? 1 : Math.max(0, Math.min(1, (mark - r.top) / Math.max(1, r.height - 60)));
      fill.style.transform = `scaleY(${p})`;
      let n = 0;
      ol.querySelectorAll('li').forEach((li) => {
        if (reduced || li.getBoundingClientRect().top < mark) n++;
      });
      setOn(n);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const total = String(stages.length).padStart(2, '0');
  return (
    <div className="wrap grid-auto" style={{ position: 'relative', ['--min' as string]: '420px', ['--gap' as string]: 'clamp(40px,6vw,96px)', alignItems: 'start' }}>
      <div className="col sticky-intro" style={{ gap: 22 }}>
        <p data-reveal="" className="kicker">
          [ 03 ] APPROACH
        </p>
        <h2 data-reveal="" className="d d-sec" style={{ maxWidth: '12ch' }}>
          Start with the business. <span className="it it-lav">Then the system.</span>
        </h2>
        <p data-reveal="" className="body" style={{ maxWidth: 440 }}>
          A technology initiative holds up when each decision traces back to a business need. These are the questions we work through with you, in order.
        </p>
        <p aria-hidden="true" className="mono" style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="d" style={{ color: 'var(--pink)', fontSize: 28, fontWeight: 600 }}>
            {String(Math.max(1, on)).padStart(2, '0')}
          </span>
          / {total} STAGES
        </p>
      </div>
      <div className="approach">
        <span aria-hidden="true" className="approach__track" />
        <span aria-hidden="true" ref={fillRef} className="approach__fill" />
        <ol ref={olRef} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stages.map((st, i) => (
          <li key={st.id} className={i < on ? 'is-on' : ''}>
            <span className="stage-dot">{st.num}</span>
            <span className="stage-card">
              <h3 className="d" style={{ fontSize: 21, letterSpacing: '-.025em' }}>
                {st.name}
              </h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--muted)', textWrap: 'pretty' }}>{st.body}</p>
            </span>
          </li>
        ))}
        </ol>
      </div>
    </div>
  );
}
