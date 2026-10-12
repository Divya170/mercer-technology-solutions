'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="grid-bg" role="alert" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', padding: '130px 0 72px', backgroundColor: 'var(--night)', backgroundSize: '64px 64px' }}>
      <div className="wrap col" style={{ gap: 20 }}>
        <p className="kicker">[ ERROR ]</p>
        <h1 className="d d-h2">This page couldn&apos;t be loaded.</h1>
        <p className="body">Please try again in a moment. If it keeps happening, contact us directly.</p>
        <div className="flex-wrap" style={{ gap: 10 }}>
          <button type="button" className="btn" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn btn-outline">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
