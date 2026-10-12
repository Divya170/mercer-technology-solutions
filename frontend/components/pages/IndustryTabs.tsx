'use client';

import { useState } from 'react';
import type { Industry } from '@/lib/types';

export function IndustryTabs({ items }: { items: Industry[] }) {
  const [i, setI] = useState(0);
  const cur = items[Math.min(i, items.length - 1)];
  const detail = [
    { label: 'BUSINESS CHALLENGES', value: cur.challenges },
    { label: 'RELEVANT SOLUTIONS', value: cur.solutions },
    { label: cur.isSample ? 'EXAMPLE USE CASE' : 'VERIFIED USE CASE', value: cur.useCase },
    { label: 'RELATED CASE STUDY', value: cur.related || 'None yet' },
  ];
  const onKey = (e: React.KeyboardEvent) => {
    const n = items.length;
    let j: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
    if (j === null) return;
    e.preventDefault();
    setI(j);
    setTimeout(() => document.getElementById(`ind-tab-${j}`)?.focus(), 0);
  };
  return (
    <div className="col" style={{ gap: 22 }}>
      {items.some((x) => x.isSample) && <span className="sample-tag sample-tag--lg">SAMPLE CONTENT · FOR LAYOUT PREVIEW ONLY</span>}
      <div role="tablist" aria-label="Industries" onKeyDown={onKey} className="flex-wrap" style={{ gap: 8 }}>
        {items.map((ind, k) => (
          <button key={ind.id} id={`ind-tab-${k}`} type="button" role="tab" aria-selected={k === i} aria-controls="ind-panel" tabIndex={k === i ? 0 : -1} className="chip chip--pink" style={{ minHeight: 46, padding: '0 18px', fontSize: 14.5 }} onClick={() => setI(k)}>
            {ind.num} · {ind.name}
          </button>
        ))}
      </div>
      <div id="ind-panel" role="tabpanel" aria-labelledby={`ind-tab-${i}`} className="grid-auto" style={{ ['--min' as string]: '240px', ['--gap' as string]: '12px' }}>
        {detail.map((d) => (
          <div key={d.label} className="card col" style={{ gap: 10, minHeight: 130, padding: 24 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--lav)' }}>
              {d.label}
            </span>
            <span style={{ fontSize: 15.5, lineHeight: 1.55, color: 'var(--body)' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
