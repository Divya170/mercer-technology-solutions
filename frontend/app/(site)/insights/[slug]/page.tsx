import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticle } from '@/lib/api';
import { ImageSlot } from '@/components/site/bits';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getArticle(params.slug).catch(() => null);
  return a ? { title: a.title, description: a.excerpt } : { title: 'Insights' };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = await getArticle(params.slug);
  if (!a) return notFound();
  const meta = a.isSample
    ? `SAMPLE AUTHOR · ${a.readingMinutes} MIN READ · NOT YET PUBLISHED`
    : [a.author && a.author.toUpperCase(), `${a.readingMinutes} MIN READ`, formatDate(a.publishedAt).toUpperCase()].filter(Boolean).join(' · ');
  return (
    <article data-screen-label="Insights — Article" className="bg-night" style={{ padding: 'clamp(120px,13vw,170px) 0 clamp(56px,7vw,96px)' }}>
      <div className="wrap-xs col" style={{ gap: 20 }}>
        <Link href="/insights" style={{ alignSelf: 'flex-start', fontSize: 14.5 }}>
          ← All insights
        </Link>
        <span className="flex-wrap" style={{ gap: 8 }}>
          <span className="tag">{a.category.toUpperCase()}</span>
          {a.isSample && <span className="tag tag--dash">SAMPLE ARTICLE</span>}
        </span>
        <h1 className="d" style={{ fontSize: 'clamp(30px,4vw,52px)', letterSpacing: '-.045em', lineHeight: 1.08 }}>
          {a.title}
        </h1>
        <p className="mono" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
          {meta}
        </p>
        <ImageSlot src={a.image} alt={a.imageAlt} label="IMAGE — article lead image" style={{ aspectRatio: '16 / 9', borderRadius: 18, border: '1px solid var(--line)', margin: '8px 0' }} />
        <div className="prose">
          {a.body.map((p, i) =>
            p.startsWith('## ') ? (
              <h2 key={i}>{p.slice(3)}</h2>
            ) : (
              <p key={i} style={{ whiteSpace: 'pre-line' }}>
                {p}
              </p>
            ),
          )}
        </div>
        <div className="flex-wrap" style={{ marginTop: 20, padding: 24, borderRadius: 16, border: '1px solid var(--line-2)', background: 'var(--surface)', gap: 14, justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="d" style={{ fontSize: 18 }}>
            Working on something similar?
          </p>
          <Link href="/contact" className="btn btn--md">
            Discuss a Solution →
          </Link>
        </div>
      </div>
    </article>
  );
}
