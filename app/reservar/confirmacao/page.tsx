'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Copy, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReserva } from '@/lib/hooks/use-reserva';
import { formatarMoeda, formatarData, formatarPessoas } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface DadosConfirmacao {
  reservaId: string;
  dataCheckin: string | null;
  dataCheckout: string | null;
  pessoas: number;
  tipoQuarto: string | null;
  valorTotal: number;
  valorPago: number;
}

// ============================================
// CONTEÚDO (separado para Suspense)
// ============================================

function ConfirmacaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservaId = searchParams.get('id');

  const { dataCheckin, dataCheckout, pessoas, tipoQuarto, valorTotal, valorSinal, reset } =
    useReserva();

  const [dados, setDados] = useState<DadosConfirmacao | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!reservaId) {
      router.replace('/');
      return;
    }

    // Usar dados do store Zustand se disponíveis
    if (dataCheckin && dataCheckout && valorTotal > 0) {
      setDados({
        reservaId,
        dataCheckin,
        dataCheckout,
        pessoas,
        tipoQuarto,
        valorTotal,
        valorPago: valorSinal,
      });
      setCarregando(false);
      // Limpar store após capturar dados
      reset();
      return;
    }

    // Fallback: buscar via API
    fetch(`/api/reservas/${reservaId}/status`)
      .then((r) => r.json())
      .then((data) => {
        setDados({
          reservaId,
          dataCheckin: data.dataCheckin ?? null,
          dataCheckout: data.dataCheckout ?? null,
          pessoas: data.pessoas ?? 1,
          tipoQuarto: data.tipoQuarto ?? null,
          valorTotal: Number(data.valorTotal ?? 0),
          valorPago: Number(data.valorPago ?? 0),
        });
        reset();
      })
      .catch(() => {
        // Exibir confirmação mesmo sem dados detalhados
        setDados({
          reservaId,
          dataCheckin: null,
          dataCheckout: null,
          pessoas: 1,
          tipoQuarto: null,
          valorTotal: 0,
          valorPago: 0,
        });
      })
      .finally(() => setCarregando(false));
  }, [reservaId, dataCheckin, dataCheckout, valorTotal, valorSinal, pessoas, tipoQuarto, router, reset]);

  function copiarCodigo() {
    if (!reservaId) return;
    navigator.clipboard.writeText(reservaId);
    toast.success('Código copiado!');
  }

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando confirmação...</p>
      </div>
    );
  }

  if (!dados) return null;

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-12 text-center">
      {/* Ícone de sucesso animado */}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-in zoom-in duration-500">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-green-700">Reserva Confirmada!</h1>
        <p className="mt-2 text-muted-foreground">
          Seu pagamento foi processado com sucesso. Obrigado pela confiança!
        </p>
      </div>

      {/* Código da reserva */}
      <Card>
        <CardContent className="space-y-5 py-6">
          <div>
            <p className="text-sm text-muted-foreground">Código da reserva</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="font-mono text-2xl font-bold tracking-widest">
                {dados.reservaId}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copiarCodigo}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Detalhes da reserva */}
          {(dados.dataCheckin || dados.dataCheckout || dados.valorPago > 0) && (
            <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm text-left">
              {dados.dataCheckin && (
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-semibold">{formatarData(dados.dataCheckin)}</p>
                </div>
              )}
              {dados.dataCheckout && (
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-semibold">{formatarData(dados.dataCheckout)}</p>
                </div>
              )}
              {dados.tipoQuarto && (
                <div>
                  <p className="text-muted-foreground">Acomodação</p>
                  <p className="font-semibold">{dados.tipoQuarto}</p>
                </div>
              )}
              {dados.pessoas > 0 && (
                <div>
                  <p className="text-muted-foreground">Hóspedes</p>
                  <p className="font-semibold">{formatarPessoas(dados.pessoas)}</p>
                </div>
              )}
              {dados.valorPago > 0 && (
                <div className="col-span-2 border-t pt-3">
                  <p className="text-muted-foreground">Valor pago (sinal)</p>
                  <p className="text-lg font-bold text-primary">
                    {formatarMoeda(dados.valorPago)}
                  </p>
                </div>
              )}
              {dados.valorTotal > 0 && dados.valorPago > 0 && dados.valorTotal > dados.valorPago && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Restante na chegada</p>
                  <p className="font-semibold">
                    {formatarMoeda(dados.valorTotal - dados.valorPago)}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagem de confirmação */}
      <p className="text-sm text-muted-foreground">
        Você receberá uma confirmação via SMS e/ou WhatsApp em breve.
        Em caso de dúvidas, entre em contato pelo WhatsApp com o código da reserva.
      </p>

      {/* Ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" disabled>
          <Link href="/minhas-reservas">
            Ver Minhas Reservas
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        (Área do cliente disponível em breve)
      </p>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL — wrappada em Suspense
// ============================================

export default function ConfirmacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <ConfirmacaoContent />
    </Suspense>
  );
}
