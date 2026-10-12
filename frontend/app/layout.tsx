import type { Metadata, Viewport } from 'next';
import './site.css';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Mercer Technology Solutions — Technology, Orchestrated.', template: '%s — Mercer Technology Solutions' },
  description: 'Mercer Technology Solutions connects systems, modernizes infrastructure and builds technology foundations for enterprise growth. Phoenix, Arizona.',
  openGraph: { title: 'Mercer Technology Solutions', description: 'Complex technology. Clear business outcomes.' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0D0A1C' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Enables scroll-reveal styles only when JS runs (content stays visible without JS) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Unbounded:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
