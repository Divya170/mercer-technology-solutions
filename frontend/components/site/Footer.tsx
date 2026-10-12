import Link from 'next/link';
import type { PublicSettings, Service } from '@/lib/types';
import { Address } from './bits';

export function Footer({ settings: s, services }: { settings: PublicSettings; services: Service[] }) {
  return (
    <footer className="footer">
      <div className="wrap col" style={{ gap: 'clamp(36px,5vw,64px)' }}>
        <div className="grid-auto" style={{ ['--min' as string]: '210px', ['--gap' as string]: '32px' }}>
          <div className="col" style={{ gap: 16 }}>
            <p className="d" style={{ fontSize: 22, letterSpacing: '-.035em', lineHeight: 1.15 }}>
              Technology, <span className="it it-lg it-pink">orchestrated.</span>
            </p>
            <Link href="/contact" className="btn btn--sm btn--self">
              Discuss a Solution →
            </Link>
          </div>
          <nav aria-label="Solutions" className="col" style={{ gap: 10 }}>
            <p className="footer__lab">SOLUTIONS</p>
            {services.map((sv) => (
              <Link key={sv.slug} href={`/solutions/${sv.slug}`}>
                {sv.name}
              </Link>
            ))}
          </nav>
          <nav aria-label="Company" className="col" style={{ gap: 10 }}>
            <p className="footer__lab">COMPANY</p>
            <Link href="/company">Company</Link>
            <Link href="/industries">Industries</Link>
            <Link href="/case-studies">Case Studies</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/insights">Insights</Link>
          </nav>
          <div className="col" style={{ gap: 10 }}>
            <p className="footer__lab">CONTACT</p>
            <address style={{ fontStyle: 'normal', fontSize: 14.5, lineHeight: 1.6, color: 'var(--soft)' }}>
              <Address s={s} />
            </address>
            {s.email && (
              <a href={s.mailHref || undefined} style={{ fontSize: 14.5, wordBreak: 'break-all' }}>
                {s.email}
              </a>
            )}
            {s.phone && (
              <a href={s.telHref || undefined} style={{ fontSize: 14.5 }}>
                {s.phone}
              </a>
            )}
          </div>
        </div>
        <div className="footer__bar">
          <p>
            © {new Date().getFullYear()} {s.companyName}
          </p>
          <p>{s.hasPrivacyPolicy ? <Link href="/privacy">Privacy policy</Link> : 'Privacy policy and terms — to be published'}</p>
        </div>
      </div>
    </footer>
  );
}
