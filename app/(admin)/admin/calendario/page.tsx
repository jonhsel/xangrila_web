'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn, formatarData } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CalendarCheck, CalendarX } from 'lucide-react';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function corOcupacao(taxa: number): string {
  if (taxa >= 80) return 'bg-red-100 border-red-300';
  if (taxa >= 50) return 'bg-yellow-100 border-yellow-300';
  if (taxa > 0) return 'bg-green-100 border-green-300';
  return 'bg-white';
}

export default function CalendarioPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [dias, setDias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<any>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendario?mes=${mes}&ano=${ano}`);
      const data = await res.json();
      setDias(data.dias || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [mes, ano]);

  const navMes = (delta: number) => {
    const novaData = new Date(ano, mes - 1 + delta, 1);
    setMes(novaData.getMonth() + 1);
    setAno(novaData.getFullYear());
  };

  // Calcular offset do primeiro dia da semana
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendário de Ocupação</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navMes(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium w-40 text-center">
            {MESES[mes - 1]} {ano}
          </span>
          <Button variant="outline" size="icon" onClick={() => navMes(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>{'< 50% ocupação'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
          <span>50–80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span>{'> 80%'}</span>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <Card className="p-4">
          {/* Header dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Grid dos dias */}
          <div className="grid grid-cols-7 gap-1">
            {/* Células vazias para o offset */}
            {[...Array(primeiroDia)].map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {dias.map((dia) => {
              const isHoje =
                dia.dia === hoje.getDate() &&
                mes === hoje.getMonth() + 1 &&
                ano === hoje.getFullYear();

              return (
                <button
                  key={dia.data}
                  onClick={() => setDiaSelecionado(dia)}
                  className={cn(
                    'relative p-2 rounded border text-left cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all min-h-16',
                    corOcupacao(dia.taxaOcupacao),
                    isHoje && 'ring-2 ring-primary'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    isHoje ? 'text-primary' : 'text-gray-900'
                  )}>
                    {dia.dia}
                  </span>

                  {dia.ocupados > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {dia.taxaOcupacao}%
                    </div>
                  )}

                  <div className="flex gap-1 mt-1 flex-wrap">
                    {dia.checkins > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-700">
                        <CalendarCheck className="h-2.5 w-2.5" />
                        {dia.checkins}
                      </span>
                    )}
                    {dia.checkouts > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-blue-700">
                        <CalendarX className="h-2.5 w-2.5" />
                        {dia.checkouts}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Dialog de detalhes do dia */}
      <Dialog open={!!diaSelecionado} onOpenChange={() => setDiaSelecionado(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {diaSelecionado && formatarData(new Date(diaSelecionado.data + 'T12:00:00'))}
            </DialogTitle>
          </DialogHeader>

          {diaSelecionado && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ocupação</p>
                  <p className="font-semibold">{diaSelecionado.taxaOcupacao}% ({diaSelecionado.ocupados}/{diaSelecionado.totalQuartos})</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-ins</p>
                  <p className="font-semibold text-green-600">{diaSelecionado.checkins}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-outs</p>
                  <p className="font-semibold text-blue-600">{diaSelecionado.checkouts}</p>
                </div>
              </div>

              {diaSelecionado.reservas.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reservas ativas neste dia:</p>
                  {diaSelecionado.reservas.map((r: any) => (
                    <div key={r.reserva_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm">
                      <div>
                        <p className="font-medium">{r.clientes_xngrl?.nome_cliente || 'Cliente'}</p>
                        <p className="text-muted-foreground text-xs">{r.tipo_quarto} • {r.pessoas} pessoa(s)</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={r.checkin_realizado ? 'default' : 'outline'} className="text-xs">
                          {r.checkin_realizado ? 'Hospedado' : r.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma reserva ativa neste dia.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
