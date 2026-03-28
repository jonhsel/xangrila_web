import { Metadata } from 'next';
import { AcomodacoesContent } from '@/components/features/acomodacoes-content';

export const metadata: Metadata = {
  title: 'Acomodações | Pousada Xangrilá',
  description: 'Conheça nossas casas e chalés. Espaços confortáveis para famílias, casais e grupos.',
};

export default function AcomodacoesPage() {
  return <AcomodacoesContent />;
}
