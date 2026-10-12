import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { SolutionsPage } from '@/components/solutions/SolutionsPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Solutions' };

export default async function Page() {
  const { services } = await getSite();
  return <SolutionsPage services={services} />;
}
