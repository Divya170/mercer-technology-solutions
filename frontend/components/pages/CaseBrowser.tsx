'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client-api';
import type { CaseList } from '@/lib/types';
import { ImageSlot } from '@/components/site/bits';

/** Case-study portfolio with a "filter by solution" chip row (server-side filter). */
export function CaseBrowser({ initial }: { initial: CaseList }) {
  const [svc, setSvc] = useState('all');
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let live = true;
    setLoading(true);
    setError('');
    api<CaseList>(`/case-studies${svc !== 'all' ? `?service=${encodeURIComponent(svc)}` : ''}`)
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [svc, nonce]);

  const n = data.items.length;
  const sampleOnly = data.items.length > 0 && data.items.every((x) => x.isSample);
  const noun = sampleOnly ? 'SAMPLE CASE STUD' : 'CASE STUD';
  return (
    <div className="col" style={{ gap: 22 }}>
      <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div role="group" aria-label="Filter by solution" className="flex-wrap" style={{ gap: 8 }}>
          {[{ value: 'all', label: 'All' }, ...initial.filters].map((f) => (
            <button key={f.value} type="button" className="chip" aria-pressed={svc === f.value} onClick={() => setSvc(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        {initial.hasSamples && <span className="sample-tag sample-tag--lg">SAMPLE CONTENT · NOT REAL CLIENTS</span>}
      </div>
      <p aria-live="polite" className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
        {loading ? 'LOADING…' : `${n} ${noun}${n === 1 ? 'Y' : 'IES'}`}
      </p>
      {error ? (
        <div role="alert" className="alert-err">
          <p>Case studies could not be loaded.</p>
          <p>
            {error}{' '}
            <button type="button" className="textbtn" onClick={() => setNonce((x) => x + 1)}>
              Try again
            </button>
          </p>
        </div>
      ) : n === 0 ? (
        <div className="empty">
          <p className="d" style={{ fontSize: 20 }}>
            No case studies in this category yet.
          </p>
          <button type="button" className="btn btn--md" onClick={() => setSvc('all')}>
            Show all case studies
          </button>
        </div>
      ) : (
        <div className="grid-auto" style={{ ['--min' as string]: '420px', opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
          {data.items.map((cs) => (
            <Link key={cs.id} href={`/case-studies/${cs.slug}`} className="card-link">
              <ImageSlot src={cs.image} alt={cs.imageAlt} label="IMAGE — approved project imagery" style={{ aspectRatio: '16 / 8' }} />
              <span className="col" style={{ padding: 24, gap: 10 }}>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--pink)' }}>
                  {cs.serviceName || 'Case study'}
                  {cs.isSample ? ' · SAMPLE' : ''}
                </span>
                <span className="d" style={{ fontSize: 20, letterSpacing: '-.025em' }}>
                  {cs.title}
                </span>
                <span className="small">{cs.client}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
