import Link from 'next/link';

export default function NotFound() {
  return (
    <section data-screen-label="Not found" className="grid-bg" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '130px 0 72px', backgroundColor: 'var(--night)', backgroundSize: '64px 64px' }}>
      <div className="wrap col" style={{ gap: 20, width: '100%' }}>
        <p aria-hidden="true" className="d" style={{ fontSize: 'clamp(96px,17vw,240px)', fontWeight: 700, lineHeight: 0.85, letterSpacing: '-.07em', color: 'transparent', WebkitTextStroke: '1.5px #FF8FC7', textShadow: '0 0 60px rgba(255,143,199,.35)' }}>
          404
        </p>
        <h1 className="d" style={{ fontSize: 'clamp(26px,3.4vw,44px)' }}>
          This page isn&apos;t available.
        </h1>
        <p className="body">It may have moved, or it hasn&apos;t been published yet.</p>
        <div className="flex-wrap" style={{ gap: 10 }}>
          <Link href="/" className="btn">
            Back to home
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
