import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { POUSADA } from '@/lib/constants';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: POUSADA.seo.titleDefault,
    template: POUSADA.seo.titleTemplate,
  },
  description: POUSADA.seo.description,
  keywords: [...POUSADA.seo.keywords],
  openGraph: {
    title: POUSADA.seo.titleDefault,
    description: POUSADA.seo.description,
    locale: 'pt_BR',
    type: 'website',
  },
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
