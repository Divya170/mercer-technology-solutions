import type { Metadata } from 'next';
import Link from 'next/link';
import { getContent } from '@/lib/api';
import { PageIntro } from '@/components/site/bits';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Careers' };

export default async function CareersPage() {
  const { job: jobs } = await getContent('job');
  return (
    <>
      <PageIntro label="Careers — Intro" kicker="[ CAREERS ]" split={false} bg="dot-bg" glow="radial-gradient(ellipse 50% 70% at 80% 50%,rgba(255,143,199,.16),transparent 70%),linear-gradient(90deg,#0D0A1C 20%,transparent)">
        <h1 data-reveal="" className="d" style={{ ['--d' as string]: '100ms', fontSize: 'clamp(40px,6.2vw,100px)', lineHeight: 1, letterSpacing: '-.05em', maxWidth: '12ch' }}>
          Build what <span className="it it-lg it-pink">holds it all together.</span>
        </h1>
      </PageIntro>
      <section data-screen-label="Careers — Openings" className="bg-night-2 line-top" style={{ padding: 'clamp(48px,6vw,88px) 0' }}>
        <div className="wrap-md col" style={{ gap: 20 }}>
          <h2 className="d d-h3">Open positions</h2>
          {jobs.length === 0 ? (
            <div className="panel panel-pad col" style={{ gap: 12 }}>
              <p className="kicker" style={{ letterSpacing: 0 }}>
                0 OPEN ROLES
              </p>
              <p className="d" style={{ fontSize: 'clamp(20px,2vw,26px)', letterSpacing: '-.03em' }}>
                There are no open positions right now.
              </p>
              <p className="body" style={{ fontSize: 16, maxWidth: 540 }}>
                New roles will be listed on this page as they open, with details on how to apply.
              </p>
            </div>
          ) : (
            <ul className="col" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10 }}>
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/careers/${j.slug}`} className="card-link" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 14, alignItems: 'center', padding: '22px 24px', borderRadius: 14 }}>
                    <span className="col" style={{ gap: 6 }}>
                      <span className="d" style={{ fontSize: 18 }}>
                        {j.title}
                      </span>
                      {j.isSample && <span className="pending">SAMPLE CONTENT</span>}
                    </span>
                    <span className="small">{j.department}</span>
                    <span className="small">{j.location}</span>
                    <span className="small">{j.type}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
