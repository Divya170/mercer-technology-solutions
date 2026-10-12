'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client-api';
import { useDebounced } from '@/lib/hooks';
import type { ArticleCard, ArticleList } from '@/lib/types';
import { ImageSlot } from '@/components/site/bits';

function Tags({ a, featured }: { a: ArticleCard; featured?: boolean }) {
  return (
    <span className="flex-wrap" style={{ gap: 8 }}>
      <span className="tag">
        {featured ? 'FEATURED · ' : ''}
        {a.category.toUpperCase()}
      </span>
      {a.isSample ? <span className="tag tag--dash">SAMPLE</span> : <span className="tag tag--dash" style={{ borderColor: 'var(--line-2)', color: 'var(--muted)' }}>{a.readingMinutes} MIN READ</span>}
    </span>
  );
}

/** Category filter + search over published articles (server-side search). */
export function InsightsBrowser({ initial }: { initial: ArticleList }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim(), 300);
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
    const qs = new URLSearchParams();
    if (cat !== 'All') qs.set('category', cat);
    if (dq) qs.set('q', dq);
    setLoading(true);
    setError('');
    api<ArticleList>(`/articles?${qs}`)
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [cat, dq, nonce]);

  const reset = () => {
    setCat('All');
    setQ('');
  };
  const n = data.items.length;
  const allSample = n > 0 && data.items.every((a) => a.isSample);
  const [featured, ...rest] = data.items;

  return (
    <div className="col" style={{ gap: 22 }}>
      <div className="flex-wrap" style={{ gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div role="group" aria-label="Filter by category" className="flex-wrap" style={{ gap: 8 }}>
          {['All', ...initial.categories].map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search articles</span>
          <span aria-hidden="true" className="mono" style={{ fontSize: 13, color: 'var(--pink)' }}>
            &gt;_
          </span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles" maxLength={100} />
        </label>
      </div>
      <p aria-live="polite" className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
        {loading ? 'SEARCHING…' : `${n} ${allSample ? 'SAMPLE ' : ''}ARTICLE${n === 1 ? '' : 'S'}`}
      </p>
      {error ? (
        <div role="alert" className="alert-err">
          <p>Articles could not be loaded.</p>
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
            No articles match your search.
          </p>
          <button type="button" className="btn btn--md" onClick={reset}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="col" style={{ gap: 12, opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
          <Link href={`/insights/${featured.slug}`} className="card-link" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', borderRadius: 20, borderColor: 'var(--line-2)' }}>
            <ImageSlot src={featured.image} alt={featured.imageAlt} label="IMAGE — abstract digital infrastructure" style={{ minHeight: 280, padding: 18 }} />
            <span className="col" style={{ padding: 'clamp(24px,3.5vw,44px)', gap: 14, justifyContent: 'center' }}>
              <Tags a={featured} featured />
              <span className="d" style={{ fontSize: 'clamp(22px,2.4vw,34px)', lineHeight: 1.12 }}>
                {featured.title}
              </span>
              <span className="small" style={{ fontSize: 15.5 }}>
                {featured.excerpt}
              </span>
            </span>
          </Link>
          {rest.length > 0 && (
            <div className="grid-auto" style={{ ['--min' as string]: '300px', ['--gap' as string]: '12px' }}>
              {rest.map((a) => (
                <Link key={a.id} href={`/insights/${a.slug}`} className="card-link" style={{ padding: 24, gap: 14, minHeight: 220, borderRadius: 16 }}>
                  <Tags a={a} />
                  <span className="d" style={{ fontSize: 18, letterSpacing: '-.03em', lineHeight: 1.25, flex: 1 }}>
                    {a.title}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pink)' }}>Read article →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
