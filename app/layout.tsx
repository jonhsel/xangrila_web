import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { POUSADA } from '@/lib/constants';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Pousada Xangrilá de Morros - São Luís MA',
    template: '%s | Pousada Xangrilá de Morros',
  },
  description:
    'Reserve sua estadia na Pousada Xangrilá de Morros, São Luís - MA. Chalés e casas com conforto, piscina, área de lazer e expedições. Reservas online com pagamento PIX.',
  keywords: [
    'pousada', 'morros', 'são luís', 'maranhão', 'hospedagem',
    'chalé', 'reserva online', 'day use', 'expedições', 'xangrilá',
  ],
  openGraph: {
    title: 'Pousada Xangrilá de Morros - São Luís MA',
    description:
      'Seu refúgio perfeito em Morros. Chalés e casas, piscina, expedições de quadriciclo, jeep e lancha.',
    url: 'https://www.pousadaxangrilademorros.com.br',
    siteName: 'Pousada Xangrilá de Morros',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
