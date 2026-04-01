'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatarMoeda } from '@/lib/utils';
import { Users, AlertTriangle, Info } from 'lucide-react';

// ============================================
// TIPOS
// ============================================

export interface DayUseDadosCompletos {
  data: string;
  pagantes: number;
  isentos: {
    idosos: number;
    pcd: number;
    criancas_ate_6: number;
  };
  totalPessoas: number;
  precoPorPessoa: number;
  valorTotal: number;
}

interface DayUseCalculatorProps {
  onDadosCompletos: (dados: DayUseDadosCompletos | null) => void;
}

interface ConfigDia {
  preco_dia: number;
  tipo_dia: 'weekday' | 'weekend' | 'holiday';
  daily_free_limit: number;
  opening_time: string;
  closing_time: string;
  max_people_per_reservation: number;
}

interface Disponibilidade {
  vagas_restantes: number;
  gratuidades_restantes: number;
}

const TIPO_DIA_LABEL: Record<string, string> = {
  weekday: 'Dia útil',
  weekend: 'Fim de semana',
  holiday: 'Feriado',
};

// ============================================
// COMPONENTE
// ============================================

export function DayUseCalculator({ onDadosCompletos }: DayUseCalculatorProps) {
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [pagantes, setPagantes] = useState(1);
  const [idosos, setIdosos] = useState(0);
  const [pcd, setPcd] = useState(0);
  const [criancas, setCriancas] = useState(0);

  const [configDia, setConfigDia] = useState<ConfigDia | null>(null);
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Buscar config ao selecionar data
  useEffect(() => {
    if (!dataSelecionada) {
      setConfigDia(null);
      setDisponibilidade(null);
      onDadosCompletos(null);
      return;
    }

    const dateStr = format(dataSelecionada, 'yyyy-MM-dd');

    setCarregando(true);
    fetch(`/api/day-use/config?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setConfigDia(data.config);
          setDisponibilidade(data.disponibilidade);
        }
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada]);

  // Calcular valores e notificar parent
  useEffect(() => {
    if (!dataSelecionada || !configDia) {
      onDadosCompletos(null);
      return;
    }

    const totalIsentos = idosos + pcd + criancas;
    const totalPessoas = pagantes + totalIsentos;
    const valorTotal = pagantes * configDia.preco_dia;

    if (pagantes < 1) {
      onDadosCompletos(null);
      return;
    }

    onDadosCompletos({
      data: format(dataSelecionada, 'yyyy-MM-dd'),
      pagantes,
      isentos: { idosos, pcd, criancas_ate_6: criancas },
      totalPessoas,
      precoPorPessoa: configDia.preco_dia,
      valorTotal,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada, configDia, pagantes, idosos, pcd, criancas]);

  const totalIsentos = idosos + pcd + criancas;
  const gratuidadesDisponiveis = disponibilidade?.gratuidades_restantes ?? 0;
  const isentosExcedentes = Math.max(0, totalIsentos - gratuidadesDisponiveis);
  const valorTotal = configDia ? pagantes * configDia.preco_dia : 0;

  function NumberInput({
    label, value, onChange, min = 0, max = 20,
  }: {
    label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
  }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium hover:bg-muted disabled:opacity-50"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
          >
            –
          </button>
          <span className="w-6 text-center text-sm font-semibold">{value}</span>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium hover:bg-muted disabled:opacity-50"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Escolha a data</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={dataSelecionada}
            onSelect={setDataSelecionada}
            locale={ptBR}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </CardContent>
      </Card>

      {/* Info do dia */}
      {dataSelecionada && (
        <>
          {carregando ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Verificando disponibilidade...
              </CardContent>
            </Card>
          ) : configDia ? (
            <>
              {/* Card de informações do dia */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {TIPO_DIA_LABEL[configDia.tipo_dia]}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatarMoeda(configDia.preco_dia)}
                      </p>
                      <p className="text-xs text-muted-foreground">por pessoa pagante</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {disponibilidade?.vagas_restantes ?? 0} vagas restantes
                    </span>
                    <span className="flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      {disponibilidade?.gratuidades_restantes ?? 0} cortesias disponíveis
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Quantidades */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quantidade de pessoas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Pagantes</Label>
                    <NumberInput
                      label="Adultos pagantes"
                      value={pagantes}
                      onChange={setPagantes}
                      min={1}
                      max={Math.min(configDia.max_people_per_reservation, disponibilidade?.vagas_restantes ?? 20)}
                    />
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Isentos (gratuidades — {configDia.daily_free_limit} cortesias/dia)
                    </Label>
                    <NumberInput label="Idosos (60+)" value={idosos} onChange={setIdosos} />
                    <NumberInput label="PCD" value={pcd} onChange={setPcd} />
                    <NumberInput label="Crianças até 6 anos" value={criancas} onChange={setCriancas} />
                  </div>

                  {isentosExcedentes > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Limite de {configDia.daily_free_limit} cortesias/dia atingido.
                        {' '}{isentosExcedentes} {isentosExcedentes === 1 ? 'pessoa excedente será cobrada' : 'pessoas excedentes serão cobradas'} como pagante.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo visual */}
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-green-700 font-medium mb-1">Pagantes</p>
                    <p className="text-xl font-bold text-green-700">{pagantes + isentosExcedentes}</p>
                    <p className="text-xs text-green-600 mt-1">
                      × {formatarMoeda(configDia.preco_dia)} = {formatarMoeda((pagantes + isentosExcedentes) * configDia.preco_dia)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-blue-700 font-medium mb-1">Isentos</p>
                    <p className="text-xl font-bold text-blue-700">{Math.max(0, totalIsentos - isentosExcedentes)}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {idosos > 0 && `${idosos} idoso${idosos > 1 ? 's' : ''} `}
                      {pcd > 0 && `${pcd} PCD `}
                      {criancas > 0 && `${criancas} criança${criancas > 1 ? 's' : ''}`}
                      {totalIsentos === 0 && 'Nenhum'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-primary font-medium mb-1">Total a pagar</p>
                    <p className="text-xl font-bold text-primary">{formatarMoeda(valorTotal)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pagantes + totalIsentos} {pagantes + totalIsentos === 1 ? 'pessoa' : 'pessoas'} no total
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
