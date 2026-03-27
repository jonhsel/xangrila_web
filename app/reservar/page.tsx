'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useReserva } from '@/lib/hooks/use-reserva';
import { AuthGate } from '@/components/features/reserva/auth-gate';
import { StepIndicator } from '@/components/features/reserva/step-indicator';
import { DateSelector } from '@/components/features/reserva/date-selector';
import { RoomSelector } from '@/components/features/reserva/room-selector';
import { ReservationSummary } from '@/components/features/reserva/reservation-summary';

// ============================================
// COMPONENTE
// ============================================

export default function ReservarPage() {
  const { autenticado, step, setAutenticado } = useReserva();
  const [verificando, setVerificando] = useState(true);

  const supabase = createClient();

  // Verifica sessão ao montar
  useEffect(() => {
    verificarSessao();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verificarSessao() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.phone) {
        await vincularCliente(user.phone);
      }
    } catch {
      // sem sessão — mostra AuthGate
    } finally {
      setVerificando(false);
    }
  }

  async function vincularCliente(telefone: string) {
    try {
      const resp = await fetch('/api/auth/vincular-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone }),
      });

      if (!resp.ok) return;

      const dados = await resp.json();
      setAutenticado(true, dados.clienteId, dados.nome, telefone);
    } catch {
      // falha silenciosa — usuário ainda está autenticado via Supabase
      setAutenticado(true);
    }
  }

  async function onAuthenticated() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.phone) {
      toast.error('Não foi possível obter o telefone. Tente novamente.');
      return;
    }
    await vincularCliente(user.phone);
  }

  if (verificando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!autenticado) {
    return <AuthGate onAuthenticated={onAuthenticated} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <StepIndicator stepAtual={step} />

      <div className="mt-2">
        {step === 1 && <DateSelector />}
        {step === 2 && <RoomSelector />}
        {step === 3 && <ReservationSummary />}
      </div>
    </div>
  );
}
