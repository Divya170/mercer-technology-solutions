import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJob, getSite } from '@/lib/api';
import { paragraphs } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const j = await getJob(params.slug).catch(() => null);
  return { title: j ? `${j.title} — Careers` : 'Careers' };
}

export default async function JobPage({ params }: { params: { slug: string } }) {
  const [job, { settings: s }] = await Promise.all([getJob(params.slug), getSite()]);
  if (!job) return notFound();
  const mail = s.email ? `mailto:${s.email}?subject=${encodeURIComponent(`Application — ${job.title}`)}` : null;
  return (
    <article data-screen-label="Careers — Job detail" className="bg-night" style={{ padding: 'clamp(120px,13vw,170px) 0 clamp(56px,7vw,96px)' }}>
      <div className="wrap-sm col" style={{ gap: 20 }}>
        <Link href="/careers" style={{ alignSelf: 'flex-start', fontSize: 14.5 }}>
          ← All positions
        </Link>
        {job.isSample && <span className="sample-tag sample-tag--lg">SAMPLE CONTENT</span>}
        <h1 className="d" style={{ fontSize: 'clamp(32px,4.4vw,60px)', letterSpacing: '-.045em', lineHeight: 1.05 }}>
          {job.title}
        </h1>
        <p className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>
          {job.department} · {job.location} · {job.type}
        </p>
        <div className="col" style={{ gap: 10, marginTop: 12 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 className="d" style={{ fontSize: 18, marginBottom: 8 }}>
              About the role
            </h2>
            {paragraphs(job.about).map((p, i) => (
              <p key={i} style={{ color: 'var(--body)', lineHeight: 1.65, marginTop: i ? 10 : 0 }}>
                {p}
              </p>
            ))}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h2 className="d" style={{ fontSize: 18, marginBottom: 8 }}>
              Requirements
            </h2>
            <ul className="col" style={{ margin: 0, paddingLeft: 18, gap: 8, color: 'var(--body)', lineHeight: 1.55 }}>
              {job.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ padding: 24, borderColor: 'var(--pink)', background: 'rgba(255,143,199,.06)' }}>
            <h2 className="d" style={{ fontSize: 18, marginBottom: 8 }}>
              How to apply
            </h2>
            <p style={{ color: 'var(--body)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{job.apply}</p>
            {mail && (
              <a href={mail} className="btn btn--md" style={{ marginTop: 14 }}>
                Apply by email →
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
