import type { Metadata } from 'next';
import { getLeadOptions, getSite } from '@/lib/api';
import { Address } from '@/components/site/bits';
import { EnquiryForm } from '@/components/forms/EnquiryForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Discuss a Solution' };

type SP = { [k: string]: string | string[] | undefined };

export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const [{ settings: s }, options] = await Promise.all([getSite(), getLeadOptions()]);
  const interest = (Array.isArray(searchParams.interest) ? searchParams.interest[0] : searchParams.interest) || '';
  const rows: [string, React.ReactNode][] = [['COMPANY', s.companyName]];
  if (s.contactName) rows.push(['CONTACT', s.contactName]);
  if (s.email) rows.push(['EMAIL', <a key="e" href={s.mailHref || undefined}>{s.email}</a>]);
  if (s.phone) rows.push(['PHONE', <a key="p" href={s.telHref || undefined}>{s.phone}</a>]);
  if (s.addressLine1 || s.addressLine2)
    rows.push([
      'ADDRESS',
      <address key="a" style={{ fontStyle: 'normal', lineHeight: 1.5 }}>
        <Address s={s} />
      </address>,
    ]);

  return (
    <section data-screen-label="Contact" className="grid-bg" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(110px,12vw,150px) 0 clamp(56px,7vw,96px)', backgroundColor: 'var(--night)', backgroundSize: '64px 64px' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 45% 60% at 10% 20%,rgba(155,130,255,.2),transparent 70%),radial-gradient(ellipse 40% 50% at 90% 90%,rgba(255,143,199,.14),transparent 70%)' }} />
      <div className="wrap grid-auto" style={{ position: 'relative', ['--min' as string]: '440px', ['--gap' as string]: 'clamp(28px,4vw,64px)', alignItems: 'start' }}>
        <div className="col" style={{ gap: 24, paddingTop: 8 }}>
          <p data-reveal="" className="kicker">
            [ CONTACT ]
          </p>
          <h1 data-reveal="" className="d" style={{ ['--d' as string]: '100ms', fontSize: 'clamp(40px,5.6vw,92px)', lineHeight: 1, letterSpacing: '-.05em' }}>
            Discuss a <span className="block it it-lg it-pink it-glow">solution.</span>
          </h1>
          <p data-reveal="" className="lead" style={{ ['--d' as string]: '200ms', maxWidth: 460 }}>
            Tell us about the systems you&apos;re working with and what you need them to do. The more context you share, the more useful our first conversation will be.
          </p>
          <dl data-reveal="" className="dl-box" style={{ ['--d' as string]: '300ms' }}>
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="form-shell">
          <EnquiryForm options={options} initialInterest={interest} email={s.email} phone={s.phone} privacyHref={s.hasPrivacyPolicy ? '/privacy' : null} />
        </div>
      </div>
    </section>
  );
}
