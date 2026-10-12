import type { PublicSettings } from '@/lib/types';

export function Address({ s }: { s: Pick<PublicSettings, 'addressLine1' | 'addressLine2'> }) {
  if (!s.addressLine1 && !s.addressLine2) return null;
  return (
    <>
      {s.addressLine1}
      {s.addressLine1 && s.addressLine2 && <br />}
      {s.addressLine2}
    </>
  );
}

/**
 * Image slot. Shows the uploaded image, or the design's striped placeholder
 * with its "IMAGE — …" caption until a photo is added in the admin.
 */
export function ImageSlot({
  src,
  alt,
  label,
  className = '',
  style,
  corner,
  alt2,
  children,
  ...rest
}: {
  src?: string | null;
  alt?: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  corner?: boolean;
  alt2?: boolean;
  children?: React.ReactNode;
  'data-reveal'?: string;
}) {
  return (
    <div className={`ph${alt2 ? ' ph--alt' : ''} ${className}`} style={style} {...rest}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || ''} loading="lazy" />
      ) : (
        <span className="ph__label">{label}</span>
      )}
      {corner && <span aria-hidden="true" className="corner corner--tl" />}
      {children}
    </div>
  );
}

export function SampleTag({ children = 'SAMPLE CONTENT', lg }: { children?: React.ReactNode; lg?: boolean }) {
  return <span className={`sample-tag${lg ? ' sample-tag--lg' : ''}`}>{children}</span>;
}

/** Standard page intro: kicker, headline, optional lead (design's "[ PAGE ]" sections). */
export function PageIntro({
  kicker,
  children,
  lead,
  glow,
  bg = '',
  split = true,
  label,
  extra,
}: {
  kicker: string;
  children: React.ReactNode;
  lead?: React.ReactNode;
  glow: string;
  bg?: string;
  split?: boolean;
  label: string;
  extra?: React.ReactNode;
}) {
  return (
    <section data-screen-label={label} className={`page-intro ${bg}`}>
      <div aria-hidden="true" className="glow" style={{ background: glow }} />
      {extra}
      <div className="wrap" style={split ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))', gap: 32, alignItems: 'end' } : { display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="col" style={{ gap: 24 }}>
          <p data-reveal="" className="kicker">
            {kicker}
          </p>
          {children}
        </div>
        {lead && (
          <p data-reveal="" style={{ ['--d' as string]: '200ms', maxWidth: split ? 500 : 540 }} className="lead">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
