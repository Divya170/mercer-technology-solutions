import Link from 'next/link';
import { Topology } from './Topology';

export function ClosingCta({ email, mailHref }: { email: string | null; mailHref: string | null }) {
  return (
    <section data-screen-label="Home — Closing CTA" style={{ background: 'var(--night)', padding: 'clamp(16px,2.5vw,32px)' }}>
      <div className="cta">
        <div aria-hidden="true" className="cta__topo">
          <Topology seed={19} />
        </div>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 20% 100%,rgba(255,143,199,.18),transparent 70%)' }} />
        <span aria-hidden="true" className="c1" />
        <span aria-hidden="true" className="c2" />
        <div className="col" style={{ position: 'relative', gap: 36 }}>
          <p data-reveal="" className="kicker">
            [ 05 ] START A CONVERSATION
          </p>
          <h2 data-reveal="" className="d" style={{ fontSize: 'clamp(36px,6vw,100px)', lineHeight: 1, letterSpacing: '-.05em', maxWidth: '13ch', textWrap: 'balance' }}>
            Let&apos;s solve your next <span className="it it-pink it-glow">technology challenge.</span>
          </h2>
          <div data-reveal="" className="flex-wrap" style={{ gap: 24, alignItems: 'center' }}>
            <Link href="/contact" className="btn btn--xl btn-pink">
              Discuss a Solution <span aria-hidden="true">→</span>
            </Link>
            {email && (
              <a href={mailHref || undefined} className="mono" style={{ fontSize: 14 }}>
                {email}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
