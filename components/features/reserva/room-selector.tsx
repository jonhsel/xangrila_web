'use client';

import { useEffect, useState } from 'react';
import { BedDouble, Users, ArrowLeft, ArrowRight, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReserva } from '@/lib/hooks/use-reserva';
import { formatarMoeda, formatarPessoas } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TipoQuartoReserva } from '@/types';

// ============================================
// TIPOS
// ============================================

interface PrecoDisponivel {
  pessoas: number;
  valorDiaria: number;
}

interface TipoDisponivel {
  tipo: TipoQuartoReserva;
  capacidadeMax: number;
  precos: PrecoDisponivel[];
  disponiveis: number;
}

interface DisponibilidadeResponse {
  tipos: TipoDisponivel[];
  ehPacote: boolean;
  pacoteInfo?: {
    id: number;
    nome: string;
    dataInicio: string;
    dataFim: string;
    diarias: number;
  };
}

// ============================================
// COMPONENTE
// ============================================

export function RoomSelector() {
  const {
    dataCheckin,
    dataCheckout,
    totalDiarias,
    tipoQuarto: tipoSelecionado,
    pessoas: pessoasSelecionadas,
    setQuarto,
    setStep,
  } = useReserva();

  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tipoEscolhido, setTipoEscolhido] = useState<TipoQuartoReserva | null>(tipoSelecionado);
  const [pessoasEscolhidas, setPessoasEscolhidas] = useState(pessoasSelecionadas);

  useEffect(() => {
    if (!dataCheckin || !dataCheckout) return;
    buscarDisponibilidade();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataCheckin, dataCheckout]);

  async function buscarDisponibilidade() {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        checkin: dataCheckin!,
        checkout: dataCheckout!,
      });
      const resp = await fetch(`/api/disponibilidade?${params}`);
      if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.erro || 'Erro ao buscar disponibilidade.');
        return;
      }
      const dados: DisponibilidadeResponse = await resp.json();
      setDisponibilidade(dados);
    } catch {
      toast.error('Erro ao buscar disponibilidade. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  function precoParaPessoas(tipo: TipoDisponivel, pessoas: number): PrecoDisponivel | undefined {
    // Encontra o preço exato para o número de pessoas, ou o maior disponível
    const exato = tipo.precos.find((p) => p.pessoas === pessoas);
    if (exato) return exato;
    // Se não há preço exato, pega o maior preço disponível (para cima)
    const maiores = tipo.precos.filter((p) => p.pessoas >= pessoas);
    if (maiores.length > 0) return maiores[0];
    // Fallback: último preço
    return tipo.precos[tipo.precos.length - 1];
  }

  function calcularTotal(valorDiaria: number): number {
    return valorDiaria * totalDiarias;
  }

  function selecionarTipo(tipo: TipoQuartoReserva) {
    setTipoEscolhido(tipo);
    // Ajusta pessoas se necessário
    const tipoInfo = disponibilidade?.tipos.find((t) => t.tipo === tipo);
    if (!tipoInfo) return;
    if (pessoasEscolhidas > tipoInfo.capacidadeMax) {
      setPessoasEscolhidas(tipoInfo.capacidadeMax);
    }
  }

  function avancar() {
    if (!tipoEscolhido || !disponibilidade) return;
    const tipoInfo = disponibilidade.tipos.find((t) => t.tipo === tipoEscolhido);
    if (!tipoInfo || tipoInfo.disponiveis === 0) return;

    const preco = precoParaPessoas(tipoInfo, pessoasEscolhidas);
    if (!preco) return;

    setQuarto(
      tipoEscolhido,
      pessoasEscolhidas,
      preco.valorDiaria,
      calcularTotal(preco.valorDiaria),
      disponibilidade.ehPacote,
      disponibilidade.pacoteInfo ? {
        id: disponibilidade.pacoteInfo.id,
        nome: disponibilidade.pacoteInfo.nome,
        dataInicio: disponibilidade.pacoteInfo.dataInicio,
        dataFim: disponibilidade.pacoteInfo.dataFim,
        diarias: disponibilidade.pacoteInfo.diarias,
      } : null
    );
    setStep(3);
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!disponibilidade) {
    return (
      <div className="mx-auto max-w-2xl text-center space-y-4 py-12">
        <p className="text-muted-foreground">Não foi possível carregar a disponibilidade.</p>
        <Button onClick={buscarDisponibilidade}>Tentar novamente</Button>
      </div>
    );
  }

  const semDisponibilidade = disponibilidade.tipos.every((t) => t.disponiveis === 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Escolha seu quarto</h2>
        <p className="mt-1 text-muted-foreground">
          {totalDiarias} {totalDiarias === 1 ? 'diária' : 'diárias'} · Selecione o tipo e o número de pessoas.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          A disponibilidade exibida é referente ao período selecionado.
        </p>
      </div>

      {/* Badge de Pacote Especial */}
      {disponibilidade.ehPacote && disponibilidade.pacoteInfo && (
        <div className="flex justify-center">
          <Badge className="gap-1 px-3 py-1 text-sm">
            <Star className="h-3.5 w-3.5" />
            Pacote Especial: {disponibilidade.pacoteInfo.nome}
          </Badge>
        </div>
      )}

      {semDisponibilidade && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="font-medium text-destructive">Sem disponibilidade para as datas selecionadas.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente datas diferentes ou entre em contato conosco.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setStep(1)}>
              Alterar datas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cards por tipo de quarto */}
      {disponibilidade.tipos.map((tipo) => {
        const selecionado = tipoEscolhido === tipo.tipo;
        const esgotado = tipo.disponiveis === 0;
        const preco = precoParaPessoas(tipo, pessoasEscolhidas);
        const total = preco ? calcularTotal(preco.valorDiaria) : 0;

        return (
          <Card
            key={tipo.tipo}
            className={cn(
              'cursor-pointer transition-all',
              selecionado && !esgotado && 'border-primary ring-2 ring-primary/20',
              esgotado && 'cursor-not-allowed opacity-50'
            )}
            onClick={() => !esgotado && selecionarTipo(tipo.tipo)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BedDouble className="h-5 w-5 text-primary" />
                  {tipo.tipo}
                </CardTitle>
                <div className="flex gap-2">
                  {esgotado ? (
                    <Badge variant="destructive" className="text-xs">Esgotado</Badge>
                  ) : tipo.disponiveis <= 2 ? (
                    <Badge className="text-xs bg-orange-500 hover:bg-orange-500">
                      Últimas {tipo.disponiveis} {tipo.disponiveis === 1 ? 'unidade' : 'unidades'}!
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {tipo.disponiveis} {tipo.disponiveis === 1 ? 'disponível' : 'disponíveis'}
                    </Badge>
                  )}
                  {!esgotado && selecionado && (
                    <Badge className="text-xs">Selecionado</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Seletor de pessoas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Até {tipo.capacidadeMax} pessoas</span>
                </div>

                {selecionado && !esgotado && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Pessoas:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPessoasEscolhidas((p) => Math.max(1, p - 1));
                        }}
                        disabled={pessoasEscolhidas <= 1}
                      >
                        –
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {pessoasEscolhidas}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPessoasEscolhidas((p) => Math.min(tipo.capacidadeMax, p + 1));
                        }}
                        disabled={pessoasEscolhidas >= tipo.capacidadeMax}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabela de preços */}
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {tipo.precos.map((p) => (
                    <div key={p.pessoas} className="text-xs text-muted-foreground">
                      <span className="font-medium">{formatarPessoas(p.pessoas)}:</span>{' '}
                      {formatarMoeda(p.valorDiaria)}/noite
                    </div>
                  ))}
                </div>
              </div>

              {/* Valor total quando selecionado */}
              {selecionado && !esgotado && preco && (
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="text-sm text-muted-foreground">
                    {formatarMoeda(preco.valorDiaria)} × {totalDiarias}{' '}
                    {totalDiarias === 1 ? 'noite' : 'noites'}{' '}
                    ({formatarPessoas(pessoasEscolhidas)})
                  </div>
                  <div className="text-lg font-bold text-primary">{formatarMoeda(total)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button
          size="lg"
          onClick={avancar}
          disabled={!tipoEscolhido || semDisponibilidade}
        >
          {carregando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              Próximo: Resumo
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
