import { getSite } from '@/lib/api';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Motion } from '@/components/site/Motion';
import { SiteUnavailable } from '@/components/site/SiteUnavailable';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let site;
  try {
    site = await getSite();
  } catch {
    return <SiteUnavailable />;
  }
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Header settings={site.settings} />
      <main id="main" tabIndex={-1} style={{ outline: 'none', display: 'block' }}>
        {children}
      </main>
      <Footer settings={site.settings} services={site.services} />
      <Motion />
    </>
  );
}
