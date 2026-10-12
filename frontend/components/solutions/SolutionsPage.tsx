import { PageIntro } from '@/components/site/bits';
import { SolutionsView } from './SolutionsView';
import type { Service } from '@/lib/types';

export function SolutionsPage({ services, slug }: { services: Service[]; slug?: string }) {
  return (
    <>
      <PageIntro
        label="Solutions — Intro"
        kicker="[ SOLUTIONS ]"
        bg="grid-bg"
        glow="radial-gradient(ellipse 50% 70% at 85% 30%,rgba(155,130,255,.22),transparent 70%)"
        extra={
          <span aria-hidden="true" style={{ position: 'absolute', right: '-1vw', bottom: '-5vw', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '28vw', lineHeight: 0.8, letterSpacing: '-.08em', color: 'transparent', WebkitTextStroke: '1px rgba(185,166,255,.3)', pointerEvents: 'none' }}>
            SOL
          </span>
        }
        lead="Explore each capability: the problems it addresses, what the work involves, and what to consider before you begin."
      >
        <h1 data-reveal="" className="d d-page" style={{ ['--d' as string]: '100ms' }}>
          Capabilities, <span className="block it it-lg it-pink it-glow">connected.</span>
        </h1>
      </PageIntro>
      <SolutionsView services={services} initialSlug={slug} />
    </>
  );
}
