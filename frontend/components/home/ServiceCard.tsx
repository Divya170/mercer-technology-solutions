import Link from 'next/link';
import type { Service } from '@/lib/types';
import { accentFor } from '@/lib/format';

/** Capability card with the comp's dot-line motif; the hub dot moves per card. */
export function ServiceCard({ s, i }: { s: Service; i: number }) {
  const a = accentFor(i);
  const hub = (i % 3) + 1;
  return (
    <Link
      href={`/solutions/${s.slug}`}
      data-reveal=""
      className="svc-card"
      style={{ ['--d' as string]: `${i * 100}ms`, ['--accent' as string]: a.accent, ['--glow' as string]: a.glow, ['--stroke' as string]: a.stroke }}
    >
      <span aria-hidden="true" className="svc-card__num">
        {s.n}
      </span>
      <span style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span className="flex-wrap" style={{ alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 12, color: a.accent }}>
            /{s.n}
          </span>
          {s.isSample && <span className="sample-tag">SAMPLE CONTENT</span>}
        </span>
        <span aria-hidden="true" className="svc-card__icon">
          ↗
        </span>
      </span>
      <span aria-hidden="true" className="dots">
        {[0, 1, 2, 3, 4].map((k) => (
          <span key={k}>
            <b className={k === hub ? 'hub' : ''} />
            {k < 4 && <i />}
          </span>
        ))}
      </span>
      <span className="col" style={{ position: 'relative', gap: 16 }}>
        <span className="d" style={{ fontSize: 'clamp(24px,2.2vw,32px)', letterSpacing: '-.035em', lineHeight: 1.08 }}>
          {s.name}
        </span>
        <span style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--muted)', textWrap: 'pretty' }}>{s.short}</span>
        <span className="flex-wrap" style={{ gap: 6 }}>
          {s.scope.slice(0, 4).map((sc) => (
            <span key={sc} className="scope-chip">
              {sc}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}
