'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Calendar, Home } from 'lucide-react';
import { toast } from 'sonner';
import { POUSADA } from '@/lib/constants/pousada';

interface ClientHeaderProps {
  userPhone: string;
}

export function ClientHeader({ userPhone }: ClientHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });

      if (!response.ok) {
        throw new Error('Erro ao fazer logout');
      }

      toast.success('Sessão encerrada');
      router.push('/');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const formatarTelefoneExibicao = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const local = cleaned.slice(2);
      return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            {POUSADA.nome}
          </a>
          <nav className="hidden md:flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                Início
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/minhas-reservas">
                <Calendar className="mr-2 h-4 w-4" />
                Minhas Reservas
              </a>
            </Button>
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                {formatarTelefoneExibicao(userPhone)}
              </span>
              <span className="sm:hidden">Conta</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
