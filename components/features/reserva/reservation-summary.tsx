'use client';

import { useState } from 'react';
import {
  Calendar,
  BedDouble,
  Users,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Star,
  MessageSquare,
  User,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReserva } from '@/lib/hooks/use-reserva';
import {
  formatarMoeda,
  formatarData,
  formatarDiarias,
  formatarPessoas,
  formatarTelefone,
} from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface ReservaResponse {
  sucesso: boolean;
  reservaId: string;
  valorTotal: number;
  valorSinal: number;
  expiraEm: string;
}

// ============================================
// TELA DE SUCESSO
// ============================================

function TelaConfirmacao({ reserva }: { reserva: ReservaResponse }) {
  const { valorTotal, valorSinal, reservaId } = reserva;

  function copiarCodigo() {
    navigator.clipboard.writeText(reservaId);
    toast.success('Código copiado!');
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-green-700">Reserva solicitada!</h2>
        <p className="mt-2 text-muted-foreground">
          Sua reserva foi criada com sucesso. Para confirmar, efetue o pagamento do sinal.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div>
            <p className="text-sm text-muted-foreground">Código da reserva</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xl font-bold tracking-widest">{reservaId}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copiarCodigo}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Valor total</p>
              <p className="font-semibold">{formatarMoeda(valorTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sinal (50%)</p>
              <p className="font-semibold text-primary">{formatarMoeda(valorSinal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Em breve entraremos em contato via WhatsApp com as instruções de pagamento PIX.
      </p>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ReservationSummary() {
  const {
    dataCheckin,
    dataCheckout,
    totalDiarias,
    tipoQuarto,
    pessoas,
    valorDiaria,
    valorTotal,
    ehPacote,
    pacoteInfo,
    observacoes,
    clienteNome,
    clienteTelefone,
    setObservacoes,
    setClienteNome,
    setStep,
  } = useReserva();

  const [confirmando, setConfirmando] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState<ReservaResponse | null>(null);
  const [nomeEditado, setNomeEditado] = useState(clienteNome ?? '');

  // Verifica se o nome é apenas o telefone (cliente novo)
  const nomeEhTelefone = clienteNome
    ? clienteNome.replace(/\D/g, '').length >= 10 && clienteNome === clienteTelefone
    : false;

  const nomeParaEnviar = nomeEhTelefone ? nomeEditado : (clienteNome ?? '');
  const nomeValido = !nomeEhTelefone || nomeEditado.trim().length >= 3;

  async function confirmarReserva() {
    if (!dataCheckin || !dataCheckout || !tipoQuarto) {
      toast.error('Dados incompletos. Volte e preencha todas as informações.');
      return;
    }
    if (!nomeValido) {
      toast.error('Informe seu nome para continuar.');
      return;
    }

    setConfirmando(true);
    try {
      const resp = await fetch('/api/reservas/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataCheckin,
          dataCheckout,
          pessoas,
          tipoQuarto,
          valorTotal,
          observacoes: observacoes || undefined,
          nomeCliente: nomeEhTelefone ? nomeEditado : undefined,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.erro || 'Erro ao criar reserva. Tente novamente.');
        return;
      }

      const dados: ReservaResponse = await resp.json();
      setReservaConfirmada(dados);
    } catch {
      toast.error('Erro ao criar reserva. Tente novamente.');
    } finally {
      setConfirmando(false);
    }
  }

  if (reservaConfirmada) {
    return <TelaConfirmacao reserva={reservaConfirmada} />;
  }

  const valorSinal = valorTotal * 0.5;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Resumo da reserva</h2>
        <p className="mt-1 text-muted-foreground">Revise os dados antes de confirmar.</p>
      </div>

      {/* Pacote especial */}
      {ehPacote && pacoteInfo && (
        <div className="flex justify-center">
          <Badge className="gap-1 px-3 py-1 text-sm">
            <Star className="h-3.5 w-3.5" />
            Pacote Especial: {pacoteInfo.nome}
          </Badge>
        </div>
      )}

      {/* Detalhes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-1 justify-between">
              <span className="text-muted-foreground">Período</span>
              <span className="font-medium">
                {dataCheckin && formatarData(dataCheckin)} →{' '}
                {dataCheckout && formatarData(dataCheckout)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-1 justify-between">
              <span className="text-muted-foreground">Diárias</span>
              <span className="font-medium">{formatarDiarias(totalDiarias)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-1 justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-medium">{tipoQuarto}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-1 justify-between">
              <span className="text-muted-foreground">Hóspedes</span>
              <span className="font-medium">{formatarPessoas(pessoas)}</span>
            </div>
          </div>
          {clienteTelefone && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-1 justify-between">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium">{formatarTelefone(clienteTelefone)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nome do cliente (se ainda é temporário) */}
      {nomeEhTelefone && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1">
              <Label htmlFor="nome-cliente">
                <User className="mr-1 inline h-4 w-4" />
                Como devemos chamar você?
              </Label>
              <Input
                id="nome-cliente"
                placeholder="Seu nome completo"
                value={nomeEditado}
                onChange={(e) => {
                  setNomeEditado(e.target.value);
                  setClienteNome(e.target.value);
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      <Card>
        <CardContent className="space-y-2 pt-4">
          <Label htmlFor="observacoes">
            <MessageSquare className="mr-1 inline h-4 w-4" />
            Observações (opcional)
          </Label>
          <Textarea
            id="observacoes"
            placeholder="Alguma observação ou pedido especial? (ex: chegada antecipada, aniversário, etc.)"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <p className="text-right text-xs text-muted-foreground">{observacoes.length}/500</p>
        </CardContent>
      </Card>

      {/* Valores */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-2 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {formatarMoeda(valorDiaria)} × {totalDiarias}{' '}
              {totalDiarias === 1 ? 'noite' : 'noites'}
            </span>
            <span>{formatarMoeda(valorTotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-medium">Sinal (50%)</span>
            <span className="font-bold text-primary">{formatarMoeda(valorSinal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Restante na chegada</span>
            <span>{formatarMoeda(valorSinal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)} disabled={confirmando}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button
          size="lg"
          onClick={confirmarReserva}
          disabled={confirmando || !nomeValido}
        >
          {confirmando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar Reserva
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
