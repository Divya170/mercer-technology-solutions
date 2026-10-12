import Link from 'next/link';
import { getContent, getSite } from '@/lib/api';
import { Topology } from '@/components/site/Topology';
import { Marquee } from '@/components/site/Marquee';
import { ClosingCta } from '@/components/site/ClosingCta';
import { ServiceCard } from '@/components/home/ServiceCard';
import { Approach } from '@/components/home/Approach';
import { StackView } from '@/components/home/StackView';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [{ settings: s, services }, c] = await Promise.all([getSite(), getContent('stage', 'layer', 'industry')]);
  const confirmed = services.filter((x) => !x.isSample);
  const industries = c.industry;

  return (
    <>
      <section data-screen-label="Home — Hero" className="hero">
        <div aria-hidden="true" className="hero__glow" />
        <div aria-hidden="true" id="hero-vis" className="hero__vis">
          <Topology seed={7} />
        </div>
        <div className="wrap hero__in">
          <p data-reveal="" className="hero__tag">
            <span aria-hidden="true" className="pulse" />
            MTS / TECHNOLOGY, ORCHESTRATED.
          </p>
          <h1 className="d d-hero" style={{ marginTop: 32, maxWidth: '15ch' }}>
            <span data-reveal="" className="block" style={{ ['--d' as string]: '80ms' }}>
              Complex
            </span>
            <span data-reveal="" className="block" style={{ ['--d' as string]: '180ms' }}>
              technology.
            </span>
            <span data-reveal="" className="block it it-lg it-pink it-glow" style={{ ['--d' as string]: '300ms', marginTop: '.08em', lineHeight: 1 }}>
              Clear business outcomes.
            </span>
          </h1>
          <p data-reveal="" className="lead" style={{ ['--d' as string]: '440ms', marginTop: 30, maxWidth: 480 }}>
            Connect your systems, modernize your infrastructure, and build technology foundations that support your next stage of growth.
          </p>
          <div data-reveal="" className="flex-wrap" style={{ ['--d' as string]: '540ms', marginTop: 34, gap: 12 }}>
            <Link href="/contact" className="btn btn--lg">
              Discuss a Solution <span aria-hidden="true">→</span>
            </Link>
            <a href="#capabilities" className="btn btn--lg btn-ghost">
              Explore Our Capabilities <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className="hero__strip">
          <div className="hero__strip-in">
            {confirmed.map((sv) => (
              <Link key={sv.slug} href={`/solutions/${sv.slug}`}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--pink)' }}>
                    {sv.n}
                  </span>
                  {sv.name}
                </span>
                <span aria-hidden="true" style={{ color: 'var(--lav)' }}>
                  ↗
                </span>
              </Link>
            ))}
            {s.locationTag && <p>{s.locationTag}</p>}
          </div>
        </div>
      </section>

      <Marquee words={[...confirmed.map((x) => x.name), 'Technology, Orchestrated']} />

      <section id="capabilities" data-screen-label="Home — Capabilities" className="bg-night sec" style={{ scrollMarginTop: 72 }}>
        <div className="wrap">
          <div className="grid-auto" style={{ ['--min' as string]: '420px', ['--gap' as string]: '28px', alignItems: 'end', marginBottom: 40 }}>
            <div className="col" style={{ gap: 20 }}>
              <p data-reveal="" className="kicker">
                [ 02 ] CAPABILITIES
              </p>
              <h2 data-reveal="" className="d d-sec" style={{ maxWidth: '14ch' }}>
                Distinct disciplines. <span className="it it-lav">One connected system.</span>
              </h2>
            </div>
            <p data-reveal="" className="body" style={{ maxWidth: 440 }}>
              Software, cloud and integration work best when they&apos;re planned together. Each capability can stand alone or form part of a wider programme.
            </p>
          </div>
          {services.length ? (
            <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
              {services.map((sv, i) => (
                <ServiceCard key={sv.slug} s={sv} i={i} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p className="d" style={{ fontSize: 20 }}>
                Capabilities are being finalised.
              </p>
            </div>
          )}
          <div data-reveal="" className="fit-band">
            <p className="d" style={{ fontSize: 'clamp(18px,1.6vw,22px)', letterSpacing: '-.02em' }}>
              Not sure where your project fits?
            </p>
            <Link href="/contact?interest=not-sure" className="link-pink">
              Describe it and we&apos;ll map it with you →
            </Link>
          </div>
        </div>
      </section>

      {c.stage.length > 0 && (
        <section data-screen-label="Home — Approach" className="bg-night-2 line-top sec" style={{ position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10%', top: '20%', width: '50%', height: '60%', background: 'radial-gradient(closest-side,rgba(155,130,255,.16),transparent)', pointerEvents: 'none' }} />
          <Approach stages={c.stage} />
        </section>
      )}

      {c.layer.length > 0 && services.length > 0 && (
        <section data-screen-label="Home — Stack" className="bg-night line-top sec">
          <div className="wrap">
            <StackView layers={c.layer} services={services} />
          </div>
        </section>
      )}

      {industries.length > 0 && (
        <section data-screen-label="Home — Industries" className="bg-night-2 sec-md" style={{ borderTop: `1px ${industries.some((x) => x.isSample) ? 'dashed var(--pink)' : 'solid var(--line)'}` }}>
          <div className="wrap col" style={{ gap: 28 }}>
            <div className="flex-wrap" style={{ justifyContent: 'space-between', gap: 16, alignItems: 'flex-end' }}>
              <h2 className="d" style={{ fontSize: 'clamp(28px,3.2vw,44px)' }}>
                Industries
              </h2>
              {industries.some((x) => x.isSample) && <span className="sample-tag sample-tag--lg">SAMPLE CONTENT · REPLACE WITH VERIFIED INDUSTRIES</span>}
            </div>
            <div className="grid-auto" style={{ ['--min' as string]: '280px' }}>
              {industries.map((ind, i) => (
                <Link key={ind.id} href="/industries" className="card-link" style={{ padding: 28, gap: 12, borderRadius: 16 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--pink)' }}>
                    {ind.isSample ? `SAMPLE 0${i + 1}` : ind.num}
                  </span>
                  <span className="d" style={{ fontSize: 20 }}>
                    {ind.name}
                  </span>
                  <span style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.5 }}>{ind.challenges}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ClosingCta email={s.email} mailHref={s.mailHref} />
    </>
  );
}
