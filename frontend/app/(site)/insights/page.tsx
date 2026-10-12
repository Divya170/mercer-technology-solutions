import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles } from '@/lib/api';
import { PageIntro } from '@/components/site/bits';
import { InsightsBrowser } from '@/components/pages/InsightsBrowser';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Insights' };

export default async function InsightsPage() {
  const data = await getArticles();
  return (
    <>
      <PageIntro
        label="Insights — Intro"
        kicker="[ INSIGHTS ]"
        glow="radial-gradient(ellipse 50% 70% at 15% 30%,rgba(155,130,255,.2),transparent 70%)"
        lead="Technical perspectives and practical resources for teams planning enterprise technology work."
      >
        <h1 data-reveal="" className="d d-page" style={{ ['--d' as string]: '100ms' }}>
          Notes on <span className="block it it-lg it-pink">systems.</span>
        </h1>
      </PageIntro>
      <section data-screen-label="Insights — Articles" className="bg-night-2 line-top" style={{ padding: 'clamp(40px,5vw,80px) 0' }}>
        <div className="wrap">
          {data.total > 0 ? (
            <InsightsBrowser initial={data} />
          ) : (
            <div className="panel col" style={{ padding: 'clamp(28px,5vw,64px)', gap: 14, maxWidth: 820, borderRadius: 20 }}>
              <p className="kicker" style={{ letterSpacing: '.1em' }}>
                0 ARTICLES PUBLISHED
              </p>
              <h2 className="d" style={{ fontSize: 'clamp(24px,2.8vw,40px)', lineHeight: 1.1 }}>
                The first articles are being prepared.
              </h2>
              <p className="body" style={{ fontSize: 16.5 }}>
                Have a question you&apos;d like us to cover? <Link href="/contact">Get in touch</Link>.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
