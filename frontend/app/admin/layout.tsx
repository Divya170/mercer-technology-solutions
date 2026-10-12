import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Admin — Mercer Technology Solutions' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
