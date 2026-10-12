import Link from 'next/link';

export function Logo({ href = '/', sub = 'TECHNOLOGY SOLUTIONS' }: { href?: string; sub?: string }) {
  return (
    <Link href={href} aria-label="Mercer Technology Solutions — home" className="logo">
      <span aria-hidden="true" className="logo__mark">
        <i />
      </span>
      <span className="col">
        <span className="logo__name">MERCER</span>
        <span className="logo__sub">{sub}</span>
      </span>
    </Link>
  );
}
