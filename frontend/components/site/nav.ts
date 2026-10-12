/** Primary navigation (from the design). */
export const NAV = [
  { label: 'Solutions', href: '/solutions' },
  { label: 'Industries', href: '/industries' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Company', href: '/company' },
  { label: 'Careers', href: '/careers' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];

export const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
