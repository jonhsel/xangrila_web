'use client';

import { useState } from 'react';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { useReserva } from '@/lib/hooks/use-reserva';
import { calcularDiarias, dataParaISO, formatarData, formatarDiarias } from '@/lib/utils';

// ============================================
// COMPONENTE
// ============================================

export function DateSelector() {
  const { dataCheckin, dataCheckout, setDatas, setStep } = useReserva();

  const valorInicial: DateRange | undefined =
    dataCheckin && dataCheckout
      ? { from: new Date(dataCheckin), to: new Date(dataCheckout) }
      : undefined;

  const [intervalo, setIntervalo] = useState<DateRange | undefined>(valorInicial);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diarias =
    intervalo?.from && intervalo?.to
      ? calcularDiarias(intervalo.from, intervalo.to)
      : 0;

  function avancar() {
    if (!intervalo?.from || !intervalo?.to || diarias < 1) return;

    setDatas(
      dataParaISO(intervalo.from),
      dataParaISO(intervalo.to),
      diarias
    );
    setStep(2);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Selecione as datas</h2>
        <p className="mt-1 text-muted-foreground">
          Clique na data de entrada e depois na data de saída.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Calendário
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center overflow-x-auto">
          <CalendarUI
            mode="range"
            selected={intervalo}
            onSelect={setIntervalo}
            locale={ptBR}
            disabled={{ before: hoje }}
            numberOfMonths={2}
            defaultMonth={intervalo?.from ?? hoje}
          />
        </CardContent>
      </Card>

      {/* Resumo das datas selecionadas */}
      {intervalo?.from && intervalo?.to && diarias >= 1 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Check-in</p>
                <p className="font-semibold">{formatarData(intervalo.from)}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">Check-out</p>
                <p className="font-semibold">{formatarData(intervalo.to)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">{formatarDiarias(diarias)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso para seleção incompleta */}
      {intervalo?.from && !intervalo?.to && (
        <p className="text-center text-sm text-muted-foreground">
          Agora selecione a data de check-out.
        </p>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={avancar}
          disabled={!intervalo?.from || !intervalo?.to || diarias < 1}
        >
          Próximo: Escolher quarto
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
