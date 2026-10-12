import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSite } from '@/lib/api';
import { paragraphs } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Privacy policy' };

/** Published only once the policy text has been added in Admin → Settings. */
export default async function PrivacyPage() {
  const { settings: s } = await getSite();
  if (!s.hasPrivacyPolicy) return notFound();
  return (
    <article className="bg-night" style={{ padding: 'clamp(120px,13vw,170px) 0 clamp(56px,7vw,96px)' }}>
      <div className="wrap-xs col" style={{ gap: 20 }}>
        <p className="kicker">[ PRIVACY ]</p>
        <h1 className="d d-h2">Privacy policy</h1>
        <div className="prose">
          {paragraphs(s.privacyPolicy).map((p, i) =>
            p.startsWith('## ') ? (
              <h2 key={i}>{p.slice(3)}</h2>
            ) : (
              <p key={i} style={{ whiteSpace: 'pre-line', fontSize: 16.5 }}>
                {p}
              </p>
            ),
          )}
        </div>
      </div>
    </article>
  );
}
