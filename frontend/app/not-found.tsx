import Link from 'next/link';
import { Logo } from '@/components/site/Logo';

/** Fallback for unknown URLs outside the site layout. */
export default function RootNotFound() {
  return (
    <main className="grid-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: 'var(--night)', backgroundSize: '64px 64px' }}>
      <div className="wrap col" style={{ gap: 20 }}>
        <Logo />
        <h1 className="d d-h2">This page isn&apos;t available.</h1>
        <Link href="/" className="btn btn--self">
          Back to home
        </Link>
      </div>
    </main>
  );
}
