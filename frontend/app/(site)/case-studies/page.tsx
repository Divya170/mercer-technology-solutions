import type { Metadata } from 'next';
import Link from 'next/link';
import { getCases } from '@/lib/api';
import { PageIntro } from '@/components/site/bits';
import { CaseBrowser } from '@/components/pages/CaseBrowser';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Case Studies' };

const dashed = { aspectRatio: '4 / 3', borderRadius: 14, border: '1px dashed var(--line-2)', background: 'repeating-linear-gradient(135deg,rgba(185,166,255,.05) 0 10px,transparent 10px 20px)' } as const;
const pinkDash = { aspectRatio: '4 / 3', borderRadius: 14, border: '1px dashed var(--pink)', opacity: 0.5 } as const;

export default async function CaseStudiesPage() {
  const data = await getCases();
  return (
    <>
      <PageIntro
        label="Case Studies — Intro"
        kicker="[ CASE STUDIES ]"
        bg="lines-bg"
        glow="radial-gradient(ellipse 45% 70% at 80% 40%,rgba(155,130,255,.2),transparent 70%)"
        lead="Every case study here is published with client approval and describes verified outcomes only."
      >
        <h1 data-reveal="" className="d d-page" style={{ ['--d' as string]: '100ms' }}>
          Work, <span className="block it it-lg it-pink">documented.</span>
        </h1>
      </PageIntro>
      <section data-screen-label="Case Studies — Portfolio" className="bg-night-2 line-top" style={{ padding: 'clamp(48px,6vw,88px) 0' }}>
        <div className="wrap">
          {data.total > 0 ? (
            <CaseBrowser initial={data} />
          ) : (
            <div className="panel grid-auto" style={{ padding: 'clamp(28px,5vw,64px)', ['--min' as string]: '360px', ['--gap' as string]: '40px', alignItems: 'center', borderRadius: 20 }}>
              <div className="col" style={{ gap: 18 }}>
                <p className="kicker" style={{ letterSpacing: '.1em' }}>
                  PORTFOLIO · 0 PUBLISHED
                </p>
                <h2 className="d" style={{ fontSize: 'clamp(24px,2.8vw,40px)', lineHeight: 1.1 }}>
                  Case studies will appear here once approved for publication.
                </h2>
                <p className="body" style={{ fontSize: 16.5 }}>
                  In the meantime, we&apos;re happy to talk through relevant experience directly.
                </p>
                <div className="flex-wrap" style={{ gap: 10 }}>
                  <Link href="/contact" className="btn">
                    Discuss a Solution <span aria-hidden="true">→</span>
                  </Link>
                  <Link href="/solutions" className="btn btn-outline">
                    View capabilities
                  </Link>
                </div>
              </div>
              <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <span style={dashed} />
                <span style={pinkDash} />
                <span style={pinkDash} />
                <span style={dashed} />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
