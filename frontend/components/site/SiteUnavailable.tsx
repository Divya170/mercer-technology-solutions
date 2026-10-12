import { Logo } from './Logo';

/** Whole-site error state when the API can't be reached. */
export function SiteUnavailable() {
  return (
    <main className="page-intro grid-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="wrap col" role="alert" style={{ gap: 20 }}>
        <Logo />
        <h1 className="d d-h2">We&apos;ll be right back.</h1>
        <p className="body">The website is temporarily unavailable. Please try again in a moment.</p>
        <a href="" className="btn btn--self">
          Try again
        </a>
      </div>
    </main>
  );
}
