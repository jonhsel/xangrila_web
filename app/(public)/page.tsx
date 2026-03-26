import type { Metadata } from 'next';
import { HomeContent } from '@/components/features/home-content';
import { POUSADA } from '@/lib/constants';

export const metadata: Metadata = {
  title: POUSADA.seo.titleDefault,
  description: POUSADA.seo.description,
};

export default function HomePage() {
  return <HomeContent />;
}
