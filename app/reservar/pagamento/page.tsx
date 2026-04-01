'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PixPayment } from '@/components/features/reserva/pix-payment';
import { useReserva } from '@/lib/hooks/use-reserva';
import { formatarMoeda } from '@/lib/utils';

// ============================================
// CONTEÚDO (separado para Suspense)
// ============================================

function PagamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservaId = searchParams.get('id');

  const { valorSinal, valorTotal, expiraEm, dataCheckin, dataCheckout } = useReserva();

  const [dadosPagamento, setDadosPagamento] = useState<{
    valor: number;
    expiraEm: string;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!reservaId) {
      toast.error('Reserva não encontrada.');
      router.replace('/reservar');
      return;
    }

    // Tentar usar dados do store Zustand primeiro
    if (valorSinal > 0 && expiraEm) {
      setDadosPagamento({ valor: valorSinal, expiraEm });
      setCarregando(false);
      return;
    }

    // Fallback: buscar via API de status
    fetch(`/api/reservas/${reservaId}/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'confirmada') {
          // Reserva já confirmada — ir direto para confirmação
          router.replace(`/reservar/confirmacao?id=${reservaId}`);
          return;
        }

        if (data.valorSinal && data.expiraEm) {
          setDadosPagamento({
            valor: Number(data.valorSinal),
            expiraEm: data.expiraEm,
          });
        } else if (data.valorTotal) {
          // Pagamento integral — 100%
          setDadosPagamento({
            valor: Number(data.valorTotal),
            expiraEm: data.expiraEm ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          });
        } else {
          toast.error('Dados da reserva não encontrados.');
          router.replace('/reservar');
        }
      })
      .catch(() => {
        toast.error('Erro ao carregar dados do pagamento.');
        router.replace('/reservar');
      })
      .finally(() => setCarregando(false));
  }, [reservaId, valorSinal, expiraEm, router]);

  function handleConfirmado() {
    router.push(`/reservar/confirmacao?id=${reservaId}`);
  }

  if (!reservaId) return null;

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados do pagamento...</p>
      </div>
    );
  }

  if (!dadosPagamento) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Cabeçalho */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pagamento via PIX</h1>
        <p className="mt-1 text-muted-foreground">
          Reserva <span className="font-mono font-semibold">{reservaId}</span>
        </p>
      </div>

      {/* Resumo rápido (se tiver dados no store) */}
      {dataCheckin && dataCheckout && valorTotal > 0 && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor a pagar</span>
            <span className="font-bold text-primary">{formatarMoeda(dadosPagamento.valor)}</span>
          </div>
        </div>
      )}

      {/* Componente de pagamento PIX */}
      <PixPayment
        reservaId={reservaId}
        valor={dadosPagamento.valor}
        expiraEm={dadosPagamento.expiraEm}
        onConfirmado={handleConfirmado}
      />
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL — wrappada em Suspense
// ============================================

export default function PagamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <PagamentoContent />
    </Suspense>
  );
}
