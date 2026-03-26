import Link from 'next/link';
import { Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-8xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-3xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-sm">
          A página que você está procurando não existe ou foi movida.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href={ROUTES.home}>
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.contato}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Falar Conosco
          </Link>
        </Button>
      </div>
    </div>
  );
}
