import Link from 'next/link';
import { verificarAdmin } from '@/lib/auth/admin';
import { CriarReservaForm } from '@/components/features/admin/criar-reserva-form';
import { ChevronRight } from 'lucide-react';

export default async function NovaReservaPage() {
  await verificarAdmin();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/reservas" className="hover:text-foreground">Reservas</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Nova Reserva</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Reserva (Presencial)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crie uma reserva walk-in diretamente como confirmada, sem passar pelo fluxo online.
        </p>
      </div>

      <CriarReservaForm />
    </div>
  );
}
