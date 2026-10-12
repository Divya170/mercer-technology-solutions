import type { Metadata } from 'next';
import { getContent, getSite } from '@/lib/api';
import { Address, ImageSlot, PageIntro } from '@/components/site/bits';
import { initials, paragraphs } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Company' };

const SOLID = ['', 'solid solid-lav', '', 'solid solid-pink'];

export default async function CompanyPage() {
  const [{ settings: s, images }, c] = await Promise.all([getSite(), getContent('principle', 'leader')]);
  const img = images.company;
  const overview = paragraphs(s.companyOverview);
  return (
    <>
      <PageIntro label="Company — Intro" kicker="[ COMPANY ]" split={false} glow="radial-gradient(ellipse 60% 70% at 100% 0%,rgba(155,130,255,.22),transparent 70%)">
        <h1 data-reveal="" className="d d-page-sm" style={{ ['--d' as string]: '100ms', fontSize: 'clamp(36px,5.6vw,92px)', maxWidth: '15ch' }}>
          An enterprise technology partner, <span className="it it-pink" style={{ fontSize: '1.18em' }}>based in Phoenix.</span>
        </h1>
      </PageIntro>

      <section data-screen-label="Company — Overview" className="bg-night" style={{ paddingBottom: 'clamp(56px,7vw,96px)' }}>
        <div className="wrap grid-auto" style={{ ['--min' as string]: '440px', ['--gap' as string]: 'clamp(24px,4vw,56px)', alignItems: 'stretch' }}>
          <ImageSlot data-reveal="clip" src={img?.url} alt={img?.alt} label="IMAGE — architectural office facade, editorial" corner alt2 style={{ minHeight: 340, borderRadius: 20, border: '1px solid var(--line)', padding: 18 }} />
          <div className="col" style={{ gap: 20, justifyContent: 'center' }}>
            {s.companyStatement && (
              <p data-reveal="" className="d" style={{ fontSize: 'clamp(20px,2vw,28px)', lineHeight: 1.35, letterSpacing: '-.025em', fontWeight: 400, textWrap: 'pretty' }}>
                {s.companyStatement}
              </p>
            )}
            {overview.length ? (
              overview.map((p, i) => (
                <p key={i} data-reveal="" className="body" style={{ fontSize: 16, lineHeight: 1.7 }}>
                  {p}
                </p>
              ))
            ) : (
              <p data-reveal="" className="body" style={{ fontSize: 16, lineHeight: 1.7 }}>
                [Company overview — extended history and background to be supplied and approved before publication.]
              </p>
            )}
            <dl data-reveal="" style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
              {(s.addressLine1 || s.addressLine2) && (
                <div style={{ background: 'var(--surface)', padding: 20 }}>
                  <dt className="mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--lav)' }}>
                    LOCATION
                  </dt>
                  <dd style={{ margin: '8px 0 0', fontSize: 15.5 }}>
                    <Address s={s} />
                  </dd>
                </div>
              )}
              {s.companyFocus && (
                <div style={{ background: 'var(--surface)', padding: 20 }}>
                  <dt className="mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--lav)' }}>
                    FOCUS
                  </dt>
                  <dd style={{ margin: '8px 0 0', fontSize: 15.5 }}>{s.companyFocus}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      <section data-screen-label="Company — Principles" className="bg-night-2 line-top sec-md">
        <div className="wrap col" style={{ gap: 32 }}>
          {c.principle.length > 0 && (
            <>
              <h2 data-reveal="" className="d" style={{ fontSize: 'clamp(30px,3.8vw,56px)', letterSpacing: '-.045em', lineHeight: 1 }}>
                How we <span className="it it-pink">work</span>
              </h2>
              <div className="grid-auto" style={{ ['--min' as string]: '250px', ['--gap' as string]: '12px' }}>
                {c.principle.map((p, i) => (
                  <div key={p.id} data-reveal="" className={`principle ${SOLID[i % 4]}`} style={{ ['--d' as string]: `${i * 90}ms` }}>
                    <span className="n">/{p.num}</span>
                    <span className="col" style={{ gap: 10 }}>
                      <span className="d" style={{ fontSize: 24, letterSpacing: '-.04em', color: 'inherit' }}>
                        {p.name}
                      </span>
                      <span className="sub" style={{ fontSize: 15, lineHeight: 1.6 }}>
                        {p.body}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {c.leader.length > 0 ? (
            <div className="col" style={{ gap: 20 }}>
              <h2 className="d d-h3">Leadership</h2>
              <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
                {c.leader.map((l) => (
                  <article key={l.id} className="panel col" style={{ padding: 24, gap: 16 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span aria-hidden={!l.photo} className="avatar">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {l.photo ? <img src={l.photo} alt={`Portrait of ${l.name}`} /> : initials(l.name)}
                      </span>
                      <span className="col" style={{ gap: 4 }}>
                        <span className="d" style={{ fontSize: 19 }}>
                          {l.name}
                        </span>
                        <span className="mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--pink)' }}>
                          {l.title.toUpperCase()}
                        </span>
                      </span>
                    </div>
                    <p className="small" style={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                      {l.bio}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel grid-auto" style={{ padding: 'clamp(22px,3vw,40px)', ['--min' as string]: '340px', ['--gap' as string]: '28px', alignItems: 'center' }}>
              <div className="col" style={{ gap: 12 }}>
                <h2 className="d d-h3">Leadership</h2>
                <p className="body" style={{ fontSize: 16, maxWidth: 440 }}>
                  Leadership profiles will be published once titles and biographies have been verified.
                </p>
              </div>
              {s.contactName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 20, borderRadius: 14, border: '1px solid var(--line-2)', background: 'var(--surface-2)' }}>
                  <span aria-hidden="true" className="avatar">
                    {initials(s.contactName)}
                  </span>
                  <span className="col min0" style={{ gap: 4 }}>
                    <span className="mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--pink)' }}>
                      PRIMARY CONTACT
                    </span>
                    <span className="d" style={{ fontSize: 19 }}>
                      {s.contactName}
                    </span>
                    {s.email && (
                      <a href={s.mailHref || undefined} style={{ fontSize: 14.5, wordBreak: 'break-all' }}>
                        {s.email}
                      </a>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
