import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCase } from '@/lib/api';
import { ImageSlot } from '@/components/site/bits';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCase(params.slug).catch(() => null);
  return c ? { title: c.title, description: c.context } : { title: 'Case study' };
}

export default async function CaseStudyPage({ params }: { params: { slug: string } }) {
  const c = await getCase(params.slug);
  if (!c) return notFound();
  const sections = [
    ['CONTEXT', c.context],
    ['CHALLENGE', c.challenge],
    ['APPROACH', c.approach],
    ['TECHNOLOGY SCOPE', c.scope],
    ['IMPLEMENTATION', c.implementation],
    ['OUTCOMES', c.outcomes],
  ];
  return (
    <article data-screen-label="Case Study — Detail" className="bg-night">
      <header style={{ padding: 'clamp(120px,13vw,170px) 0 clamp(40px,5vw,72px)', borderBottom: '1px solid var(--line)', background: 'radial-gradient(ellipse 50% 80% at 85% 20%,rgba(155,130,255,.18),transparent 70%)' }}>
        <div className="wrap-md col" style={{ gap: 20 }}>
          <Link href="/case-studies" style={{ alignSelf: 'flex-start', fontSize: 14.5 }}>
            ← All case studies
          </Link>
          <span className={c.isSample ? 'sample-tag sample-tag--lg' : 'tag'} style={{ alignSelf: 'flex-start' }}>
            {c.serviceName || 'Case study'}
            {c.isSample ? ' · SAMPLE CASE STUDY' : ''}
          </span>
          <h1 className="d" style={{ fontSize: 'clamp(32px,4.4vw,60px)', lineHeight: 1.06, letterSpacing: '-.045em' }}>
            {c.title}
          </h1>
          <p className="body">{c.client}</p>
        </div>
      </header>
      {c.image && (
        <div className="wrap-md" style={{ paddingTop: 'clamp(40px,5vw,72px)' }}>
          <ImageSlot src={c.image} alt={c.imageAlt} label="" style={{ aspectRatio: '16 / 8', borderRadius: 18, border: '1px solid var(--line)' }} />
        </div>
      )}
      <div className="wrap-md grid-auto" style={{ padding: 'clamp(40px,5vw,72px) var(--gutter)', ['--min' as string]: '300px', ['--gap' as string]: '12px' }}>
        {sections.map(([label, body], i) => (
          <section key={label} className="card col" style={{ gap: 10, minHeight: 130, padding: 24 }}>
            <h2 className="mono" style={{ fontSize: 11.5, letterSpacing: '.1em', color: i % 2 ? 'var(--pink)' : 'var(--lav)', fontWeight: 500 }}>
              {label}
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--body)', whiteSpace: 'pre-line' }}>{body}</p>
          </section>
        ))}
      </div>
      <div className="wrap-md flex-wrap" style={{ paddingBottom: 'clamp(56px,7vw,96px)', gap: 14, justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="body" style={{ fontSize: 15.5 }}>
          Related solution: <Link href={`/solutions/${c.serviceSlug}`}>{c.serviceName || 'View solutions'}</Link>
        </p>
        <Link href={`/contact?interest=${c.serviceSlug}`} className="btn">
          Discuss a similar project →
        </Link>
      </div>
    </article>
  );
}
