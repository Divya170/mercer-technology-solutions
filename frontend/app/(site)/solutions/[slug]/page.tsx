import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSite } from '@/lib/api';
import { SolutionsPage } from '@/components/solutions/SolutionsPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { services } = await getSite();
  const s = services.find((x) => x.slug === params.slug);
  return s ? { title: s.name, description: s.short } : { title: 'Solutions' };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { services } = await getSite();
  if (!services.some((s) => s.slug === params.slug)) return notFound();
  return <SolutionsPage services={services} slug={params.slug} />;
}
