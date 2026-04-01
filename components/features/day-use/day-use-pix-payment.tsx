'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle, Loader2, RefreshCw, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatarMoeda } from '@/lib/utils';
import type { PixResponse } from '@/types/pagamentos';

// ============================================
// TIPOS
// ============================================

interface DayUsePixPaymentProps {
  reservationCode: string;
  valor: number;
  expiraEm: string;
  onConfirmado: () => void;
}

// ============================================
// TIMER REGRESSIVO
// ============================================

function useTimer(expiraEm: string) {
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);

  useEffect(() => {
    function calcularSegundos() {
      const diff = Math.floor((new Date(expiraEm).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    }

    setSegundosRestantes(calcularSegundos());

    const interval = setInterval(() => {
      const restantes = calcularSegundos();
      setSegundosRestantes(restantes);
      if (restantes <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiraEm]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const expirado = segundosRestantes <= 0;

  return {
    display: `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`,
    expirado,
  };
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DayUsePixPayment({ reservationCode, valor, expiraEm, onConfirmado }: DayUsePixPaymentProps) {
  const [pixData, setPixData] = useState<PixResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmedRef = useRef(false);

  const { display: timerDisplay, expirado } = useTimer(expiraEm);

  useEffect(() => {
    gerarPix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationCode]);

  useEffect(() => {
    if (!pixData || expirado) return;

    pollingRef.current = setInterval(() => {
      verificarStatus(false);
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixData, expirado]);

  async function gerarPix() {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch('/api/day-use/pix/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_code: reservationCode }),
      });

      const data: PixResponse = await resp.json();

      if (!resp.ok || !data.success) {
        setErro(data.error ?? 'Erro ao gerar PIX. Tente novamente.');
        return;
      }

      setPixData(data);
    } catch {
      setErro('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  const verificarStatus = useCallback(
    async (manual: boolean) => {
      if (confirmedRef.current) return;
      if (manual) setVerificando(true);

      try {
        const resp = await fetch(`/api/day-use/${reservationCode}/status`);
        if (!resp.ok) return;

        const data = await resp.json();

        if ((data.status === 'confirmed' || data.payment_status === 'confirmed') && !confirmedRef.current) {
          confirmedRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast.success('Pagamento confirmado! Day Use reservado!');
          onConfirmado();
        } else if (manual) {
          toast.info('Aguardando confirmação do pagamento...');
        }
      } catch {
        if (manual) toast.error('Erro ao verificar status. Tente novamente.');
      } finally {
        if (manual) setVerificando(false);
      }
    },
    [reservationCode, onConfirmado]
  );

  async function copiarCodigo() {
    if (!pixData?.qr_code) return;
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopiado(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      toast.error('Erro ao copiar. Copie manualmente.');
    }
  }

  if (carregando) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Gerando código PIX...</p>
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card className="mx-auto max-w-md border-destructive/50">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <p className="text-center text-destructive">{erro}</p>
          <Button variant="outline" onClick={gerarPix}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (expirado) {
    return (
      <Card className="mx-auto max-w-md border-orange-300">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <Clock className="h-10 w-10 text-orange-500" />
          <div className="text-center">
            <p className="font-semibold text-orange-700">Tempo expirado</p>
            <p className="text-sm text-muted-foreground">
              O prazo para pagamento expirou. Entre em contato conosco via WhatsApp.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Pagamento PIX — Day Use</CardTitle>
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Valor */}
        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3">
          <span className="text-sm text-muted-foreground">Valor total</span>
          <span className="text-lg font-bold text-primary">{formatarMoeda(valor)}</span>
        </div>

        {/* Código da reserva */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Código</span>
          <span className="font-mono font-semibold">{reservationCode}</span>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Expira em</span>
          <Badge variant={parseInt(timerDisplay) < 10 ? 'destructive' : 'secondary'} className="font-mono">
            {timerDisplay}
          </Badge>
        </div>

        {/* QR Code */}
        {pixData?.qr_code && (
          <div className="flex justify-center">
            <div className="rounded-xl border-2 border-primary/20 p-4">
              <QRCodeSVG value={pixData.qr_code} size={200} level="M" includeMargin />
            </div>
          </div>
        )}

        {/* Código copiável */}
        {pixData?.qr_code && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Código PIX Copia e Cola
            </p>
            <div className="flex gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border bg-muted/50 px-3 py-2">
                <p className="truncate font-mono text-xs">{pixData.qr_code}</p>
              </div>
              <Button
                variant={copiado ? 'default' : 'outline'}
                size="sm"
                onClick={copiarCodigo}
                className="shrink-0"
              >
                {copiado ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {pixData?.ticket_url && (
          <a
            href={pixData.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Ver no Mercado Pago
          </a>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => verificarStatus(true)}
          disabled={verificando}
        >
          {verificando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Já paguei — Verificar
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Abra o app do seu banco, escolha Pix e escaneie o QR Code ou cole o código.
          A confirmação é automática e pode levar alguns segundos.
        </p>
      </CardContent>
    </Card>
  );
}
