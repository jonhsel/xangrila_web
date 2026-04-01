'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sun, CheckCircle, Copy, Home, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AuthGate } from '@/components/features/reserva/auth-gate';
import { DayUseCalculator, type DayUseDadosCompletos } from '@/components/features/day-use/day-use-calculator';
import { DayUsePixPayment } from '@/components/features/day-use/day-use-pix-payment';
import { formatarMoeda } from '@/lib/utils';
import { POUSADA } from '@/lib/constants';

// ============================================
// TIPOS
// ============================================

type Etapa = 'calculadora' | 'auth' | 'dados' | 'pagamento' | 'confirmado';

interface ClienteAuth {
  clienteId: number;
  nome: string;
  email: string | null;
  telefone: string;
}

interface PagamentoDados {
  reservation_code: string;
  total_amount: number;
  expires_at: string;
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function DayUsePage() {
  const [etapa, setEtapa] = useState<Etapa>('calculadora');
  const [dadosCalc, setDadosCalc] = useState<DayUseDadosCompletos | null>(null);
  const [cliente, setCliente] = useState<ClienteAuth | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [solicitacoes, setSolicitacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [dadosPagamento, setDadosPagamento] = useState<PagamentoDados | null>(null);
  const [termosAbertos, setTermosAbertos] = useState(false);

  const whatsappMsg = encodeURIComponent(`Olá! Gostaria de saber mais sobre o Day Use na ${POUSADA.nome}.`);
  const whatsappHref = `${POUSADA.whatsappLink}?text=${whatsappMsg}`;

  function handleDadosCalc(dados: DayUseDadosCompletos | null) {
    setDadosCalc(dados);
  }

  function handleAvancarParaAuth() {
    if (!dadosCalc) return;
    setEtapa('auth');
  }

  function handleAutenticado(clienteVinculado: { clienteId: number; nome: string; email: string | null; telefone: string }) {
    setCliente(clienteVinculado);
    setNome(clienteVinculado.nome || '');
    setTelefone(clienteVinculado.telefone || '');
    setEtapa('dados');
  }

  async function handleConfirmar() {
    if (!dadosCalc || !cliente) return;
    if (!nome.trim() || nome.trim().length < 3) {
      toast.error('Informe seu nome completo.');
      return;
    }

    setEnviando(true);
    try {
      const resp = await fetch('/api/day-use/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: nome.trim(),
          phone_number: telefone || cliente.telefone,
          reservation_date: dadosCalc.data,
          paying_people: dadosCalc.pagantes,
          non_paying_details: dadosCalc.isentos,
          special_requests: solicitacoes || undefined,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        toast.error(data.error || 'Erro ao criar reserva. Tente novamente.');
        return;
      }

      setDadosPagamento({
        reservation_code: data.reservation_code,
        total_amount: data.total_amount,
        expires_at: data.expires_at,
      });
      setEtapa('pagamento');
    } catch {
      toast.error('Erro ao criar reserva. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function handleConfirmadoPagamento() {
    setEtapa('confirmado');
  }

  function copiarCodigo() {
    if (!dadosPagamento?.reservation_code) return;
    navigator.clipboard.writeText(dadosPagamento.reservation_code);
    toast.success('Código copiado!');
  }

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-3xl space-y-10">

        {/* ── Seção 1: Hero ── */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Sun className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold">Day Use</h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Aproveite um dia incrível na {POUSADA.nome} sem precisar se hospedar.
            Piscina, natureza e tranquilidade esperando por você!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Horário: 08:00 – 18:00</span>
            <span>·</span>
            <span>Acesso à piscina, áreas de lazer, churrasqueira e Wi-Fi</span>
          </div>
        </div>

        {/* ── Seção 2: Calculadora ── */}
        {(etapa === 'calculadora' || etapa === 'auth' || etapa === 'dados') && (
          <section>
            <h2 className="text-xl font-bold mb-4">Escolha a data e quantidade de pessoas</h2>
            <DayUseCalculator onDadosCompletos={handleDadosCalc} />

            {dadosCalc && etapa === 'calculadora' && (
              <div className="mt-6 flex justify-center">
                <Button size="lg" onClick={handleAvancarParaAuth}>
                  Reservar Day Use
                </Button>
              </div>
            )}
          </section>
        )}

        {/* ── Seção 3: Autenticação ── */}
        {etapa === 'auth' && (
          <section>
            <h2 className="text-xl font-bold mb-4">Identificação</h2>
            <AuthGate onAuthenticated={handleAutenticado} />
          </section>
        )}

        {/* ── Seção 4: Dados pessoais + Confirmação ── */}
        {etapa === 'dados' && dadosCalc && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold">Confirme seus dados</h2>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="solicitacoes">Solicitações especiais (opcional)</Label>
                  <Textarea
                    id="solicitacoes"
                    value={solicitacoes}
                    onChange={(e) => setSolicitacoes(e.target.value)}
                    placeholder="Alguma necessidade especial ou pedido?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumo do pedido */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="space-y-2 py-5 text-sm">
                <p className="font-semibold text-base mb-3">Resumo do pedido</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {format(parseISO(dadosCalc.data), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Pagantes ({dadosCalc.pagantes} pessoa{dadosCalc.pagantes > 1 ? 's' : ''})
                  </span>
                  <span>{formatarMoeda(dadosCalc.valorTotal)}</span>
                </div>
                {(dadosCalc.isentos.idosos + dadosCalc.isentos.pcd + dadosCalc.isentos.criancas_ate_6) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Isentos
                      {dadosCalc.isentos.idosos > 0 && ` · ${dadosCalc.isentos.idosos} idoso${dadosCalc.isentos.idosos > 1 ? 's' : ''}`}
                      {dadosCalc.isentos.pcd > 0 && ` · ${dadosCalc.isentos.pcd} PCD`}
                      {dadosCalc.isentos.criancas_ate_6 > 0 && ` · ${dadosCalc.isentos.criancas_ate_6} criança${dadosCalc.isentos.criancas_ate_6 > 1 ? 's' : ''}`}
                    </span>
                    <span>Gratuito</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold text-primary">
                  <span>Total a pagar</span>
                  <span>{formatarMoeda(dadosCalc.valorTotal)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEtapa('calculadora')}>
                Voltar
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleConfirmar}
                disabled={enviando}
              >
                {enviando ? 'Processando...' : 'Confirmar e Pagar via PIX'}
              </Button>
            </div>
          </section>
        )}

        {/* ── Seção 5: Pagamento PIX ── */}
        {etapa === 'pagamento' && dadosPagamento && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-center">Pagamento</h2>
            <DayUsePixPayment
              reservationCode={dadosPagamento.reservation_code}
              valor={dadosPagamento.total_amount}
              expiraEm={dadosPagamento.expires_at}
              onConfirmado={handleConfirmadoPagamento}
            />
          </section>
        )}

        {/* ── Seção 6: Confirmação ── */}
        {etapa === 'confirmado' && dadosPagamento && dadosCalc && (
          <section className="text-center space-y-6 py-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-green-700">Day Use Confirmado!</h2>
              <p className="mt-2 text-muted-foreground">
                Seu pagamento foi processado com sucesso. Até logo!
              </p>
            </div>
            <Card>
              <CardContent className="space-y-4 py-6">
                <div>
                  <p className="text-sm text-muted-foreground">Código da reserva</p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-bold">{dadosPagamento.reservation_code}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copiarCodigo}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm text-left">
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-semibold">
                      {format(parseISO(dadosCalc.data), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Horário</p>
                    <p className="font-semibold">08:00 – 18:00</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total de pessoas</p>
                    <p className="font-semibold">{dadosCalc.totalPessoas}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor pago</p>
                    <p className="font-semibold text-primary">{formatarMoeda(dadosPagamento.total_amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button asChild size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
          </section>
        )}

        {/* ── Seção 7: Termos e Condições ── */}
        {etapa !== 'confirmado' && (
          <section>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/50"
              onClick={() => setTermosAbertos((v) => !v)}
            >
              <span>Termos e Condições</span>
              {termosAbertos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {termosAbertos && (
              <div className="mt-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground space-y-2">
                <p>O Day Use está sujeito à disponibilidade de vagas. Reservas com pagamento confirmado têm prioridade.</p>
                <p>Cancellamentos realizados com menos de 24 horas de antecedência não têm direito a reembolso.</p>
                <p>Isenções (idosos 60+, PCD, crianças até 6 anos) estão sujeitas ao limite diário de cortesias.</p>
                <p>O acesso é permitido somente para o número de pessoas indicado na reserva.</p>
              </div>
            )}
          </section>
        )}

        {/* CTA WhatsApp (apenas no início) */}
        {etapa === 'calculadora' && !dadosCalc && (
          <div className="text-center space-y-3 rounded-lg bg-muted/50 py-8 px-4">
            <p className="text-muted-foreground">Prefere reservar pelo WhatsApp?</p>
            <Button className="bg-green-500 hover:bg-green-600 text-white" asChild>
              <Link href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar pelo WhatsApp
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
