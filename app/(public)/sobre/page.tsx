import { Metadata } from 'next';
import SobreContent from '@/components/features/sobre-content';

export const metadata: Metadata = {
  title: 'Sobre | Pousada Xangri-lá de Morros',
  description:
    'Conheça a Pousada Xangri-lá de Morros: acomodações, preços, comodidades, políticas de check-in/check-out, pagamento e muito mais. Um refúgio de natureza no Maranhão.',
  keywords: [
    'pousada xangrila morros',
    'pousada maranhão',
    'chalés de madeira',
    'hospedagem morros ma',
    'pousada rio maranhão',
  ],
  openGraph: {
    title: 'Sobre | Pousada Xangri-lá de Morros',
    description:
      'Um refúgio de tranquilidade e natureza às margens do rio em Morros, Maranhão. Conheça nossas acomodações e políticas.',
    url: 'https://pousadaxangrilademorros.com.br/sobre',
    siteName: 'Pousada Xangri-lá de Morros',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function SobrePage() {
  return <SobreContent />;
}
