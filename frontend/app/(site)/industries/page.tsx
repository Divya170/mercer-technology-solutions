import type { Metadata } from 'next';
import Link from 'next/link';
import { getContent } from '@/lib/api';
import { PageIntro } from '@/components/site/bits';
import { IndustryTabs } from '@/components/pages/IndustryTabs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Industries' };

const DOTS = Array.from({ length: 24 }, (_, i) => (i * 7) % 5 === 0);

export default async function IndustriesPage() {
  const c = await getContent('industry', 'industry-field');
  return (
    <>
      <PageIntro
        label="Industries — Intro"
        kicker="[ INDUSTRIES ]"
        split={false}
        glow="radial-gradient(ellipse 60% 60% at 10% 0%,rgba(255,143,199,.16),transparent 70%),radial-gradient(ellipse 50% 60% at 90% 80%,rgba(155,130,255,.2),transparent 70%)"
        extra={
          <div aria-hidden="true" style={{ position: 'absolute', right: 'var(--gutter)', top: 120, display: 'grid', gridTemplateColumns: 'repeat(6,14px)', gap: 14, opacity: 0.6 }}>
            {DOTS.map((pink, i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: pink ? 3 : '50%', border: `1px solid ${pink ? 'var(--pink)' : 'var(--line-3)'}`, background: pink ? 'rgba(255,143,199,.3)' : 'transparent' }} />
            ))}
          </div>
        }
        lead="Each industry has its own constraints, regulations and ways of working. We publish industry profiles once each one is backed by verified work."
      >
        <h1 data-reveal="" className="d d-page-sm" style={{ ['--d' as string]: '100ms', maxWidth: '14ch' }}>
          Technology shaped by <span className="it it-pink" style={{ fontSize: '1.18em' }}>the sector it serves.</span>
        </h1>
      </PageIntro>
      <section data-screen-label="Industries — Profiles" className="bg-night-2 line-top sec-md">
        <div className="wrap">
          {c.industry.length > 0 ? (
            <IndustryTabs items={c.industry} />
          ) : (
            <div className="grid-auto" style={{ ['--min' as string]: '400px', ['--gap' as string]: 'clamp(28px,4vw,64px)' }}>
              <div className="col" style={{ gap: 20 }}>
                <h2 className="d" style={{ fontSize: 'clamp(26px,3vw,42px)', lineHeight: 1.08, maxWidth: '15ch' }}>
                  Industry profiles are in preparation.
                </h2>
                <p className="body" style={{ maxWidth: 460 }}>
                  If you&apos;re evaluating a partner for a specific sector, tell us about your environment and we&apos;ll discuss how our capabilities apply.
                </p>
                <Link href="/contact" className="btn btn--self">
                  Tell us about your sector <span aria-hidden="true">→</span>
                </Link>
              </div>
              {c['industry-field'].length > 0 && (
                <div className="panel" style={{ padding: '8px clamp(20px,2.5vw,32px)' }}>
                  <p className="mono-xs" style={{ padding: '18px 0 6px' }}>
                    EACH PROFILE WILL COVER
                  </p>
                  <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {c['industry-field'].map((f) => (
                      <li key={f.id} data-reveal="" style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, padding: '18px 0', borderTop: '1px solid var(--line)' }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--pink)', paddingTop: 4 }}>
                          {f.num}
                        </span>
                        <span className="col" style={{ gap: 4 }}>
                          <span className="d" style={{ fontSize: 17, letterSpacing: '-.02em' }}>
                            {f.name}
                          </span>
                          <span className="small">{f.desc}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
