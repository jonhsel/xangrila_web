'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatarMoeda } from '@/lib/utils';
import {
  User,
  CalendarDays,
  BedDouble,
  Banknote,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

type TipoQuarto = 'Casa' | 'Chalé - Com Cozinha' | 'Chalé - Sem Cozinha';
type MetodoPagamento = 'dinheiro' | 'cartao_fisico' | 'transferencia' | 'pix_manual';

const CAPACIDADE_MAX: Record<TipoQuarto, number> = {
  Casa: 6,
  'Chalé - Com Cozinha': 3,
  'Chalé - Sem Cozinha': 3,
};

const METODOS_PAGAMENTO: { value: MetodoPagamento; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_fisico', label: 'Cartão (máquina física)' },
  { value: 'transferencia', label: 'Transferência bancária' },
  { value: 'pix_manual', label: 'PIX manual (sem Mercado Pago)' },
];

interface DisponibilidadeTipo {
  tipo: string;
  estoque_total: number;
  disponiveis: number;
  preco_diaria: number;
}

export function CriarReservaForm() {
  const router = useRouter();

  // Bloco 1: Cliente
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);

  // Bloco 2: Datas
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Bloco 3: Acomodação
  const [tipoQuarto, setTipoQuarto] = useState<TipoQuarto | ''>('');
  const [pessoas, setPessoas] = useState(1);
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeTipo | null>(null);
  const [buscandoDisponibilidade, setBuscandoDisponibilidade] = useState(false);

  // Bloco 4: Valores
  const [precoDiaria, setPrecoDiaria] = useState(0);
  const [valorCobrado, setValorCobrado] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | ''>('');
  const [valorPago, setValorPago] = useState('');

  // Bloco 5: Observações
  const [observacoes, setObservacoes] = useState('');

  // Estado geral
  const [submitting, setSubmitting] = useState(false);

  const checkin = dateRange?.from;
  const checkout = dateRange?.to;
  const diarias = checkin && checkout ? differenceInDays(checkout, checkin) : 0;
  const valorTotal = Number(valorCobrado) || precoDiaria * diarias;
  const valorPagoNum = Number(valorPago) || 0;
  const saldoRestante = Math.max(0, valorTotal - valorPagoNum);

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  const buscarCliente = useCallback(async () => {
    const tel = telefoneCliente.replace(/\D/g, '');
    if (tel.length < 10) return;

    setBuscandoCliente(true);
    try {
      const res = await fetch(`/api/admin/clientes/buscar?telefone=${tel}`);
      const data = await res.json();

      if (data.encontrado) {
        setNomeCliente(data.nome_cliente || '');
        setEmailCliente(data.email_cliente || '');
        setClienteEncontrado(true);
        toast.success('Cliente encontrado e dados preenchidos automaticamente.');
      } else {
        setClienteEncontrado(false);
      }
    } catch {
      // Silencioso — cliente pode não existir ainda
    } finally {
      setBuscandoCliente(false);
    }
  }, [telefoneCliente]);

  const buscarDisponibilidade = useCallback(async () => {
    if (!checkin || !checkout || !tipoQuarto) return;

    const ci = format(checkin, 'yyyy-MM-dd');
    const co = format(checkout, 'yyyy-MM-dd');

    setBuscandoDisponibilidade(true);
    try {
      const res = await fetch(
        `/api/admin/disponibilidade?data_checkin=${ci}&data_checkout=${co}&tipo_quarto=${encodeURIComponent(tipoQuarto)}`
      );
      const data = await res.json();

      if (data.tipos && data.tipos.length > 0) {
        const t = data.tipos[0] as DisponibilidadeTipo;
        setDisponibilidade(t);
        setPrecoDiaria(t.preco_diaria);
        setValorCobrado(String(t.preco_diaria * diarias));
      }
    } catch {
      toast.error('Erro ao verificar disponibilidade.');
    } finally {
      setBuscandoDisponibilidade(false);
    }
  }, [checkin, checkout, tipoQuarto, diarias]);

  const handleTipoQuartoChange = (val: string) => {
    setTipoQuarto(val as TipoQuarto);
    setPessoas(1);
    setDisponibilidade(null);
    // Buscar disponibilidade ao trocar tipo se datas já estão selecionadas
    if (checkin && checkout) {
      setTimeout(() => buscarDisponibilidade(), 100);
    }
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setDisponibilidade(null);
    if (range?.from && range?.to && tipoQuarto) {
      setTimeout(() => buscarDisponibilidade(), 100);
    }
  };

  const getBadgeDisponibilidade = () => {
    if (!disponibilidade) return null;
    const d = disponibilidade.disponiveis;
    if (d === 0) return <Badge variant="destructive">Sem vagas</Badge>;
    if (d === 1) return <Badge className="bg-yellow-500 text-white">Última vaga</Badge>;
    return <Badge className="bg-green-600 text-white">{d} vaga(s) disponível(is)</Badge>;
  };

  const handleSubmit = async () => {
    if (!nomeCliente || !telefoneCliente) {
      toast.error('Preencha nome e telefone do cliente.');
      return;
    }
    if (!checkin || !checkout) {
      toast.error('Selecione as datas de check-in e check-out.');
      return;
    }
    if (!tipoQuarto) {
      toast.error('Selecione o tipo de acomodação.');
      return;
    }
    if (!metodoPagamento) {
      toast.error('Selecione o método de pagamento.');
      return;
    }
    if (valorTotal <= 0) {
      toast.error('Informe o valor total da reserva.');
      return;
    }

    if (disponibilidade && disponibilidade.disponiveis === 0) {
      toast.warning('Não há vagas disponíveis para este tipo e período.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/reservas/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_cliente: nomeCliente,
          telefone_cliente: telefoneCliente,
          email_cliente: emailCliente || undefined,
          data_checkin: format(checkin, 'yyyy-MM-dd'),
          data_checkout: format(checkout, 'yyyy-MM-dd'),
          pessoas,
          tipo_quarto: tipoQuarto,
          metodo_pagamento: metodoPagamento,
          valor_total: valorTotal,
          valor_pago: valorPagoNum,
          observacoes: observacoes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.warning('Não há quartos disponíveis para este período.');
        } else if (res.status === 403) {
          toast.error('Sem permissão para cadastrar reservas.');
        } else {
          toast.error(data.error || 'Erro ao criar reserva.');
        }
        return;
      }

      toast.success(`Reserva ${data.reservaId} criada com sucesso!`);
      router.push(`/admin/reservas/${data.reservaId}`);
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Bloco 1: Dados do Cliente */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Dados do Cliente</h2>
          {clienteEncontrado && (
            <Badge className="bg-green-100 text-green-800 ml-2">Cliente existente</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <div className="flex gap-2">
              <Input
                id="telefone"
                placeholder="(98) 99999-9999"
                value={telefoneCliente}
                onChange={(e) => {
                  setTelefoneCliente(formatarTelefone(e.target.value));
                  setClienteEncontrado(false);
                }}
                onBlur={buscarCliente}
              />
              {buscandoCliente && <Loader2 className="h-4 w-4 animate-spin mt-3 text-muted-foreground" />}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input
              id="nome"
              placeholder="Nome do hóspede"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={emailCliente}
              onChange={(e) => setEmailCliente(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Bloco 2: Período */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Período da Hospedagem</h2>
          {diarias > 0 && (
            <Badge variant="outline" className="ml-2">{diarias} diária(s)</Badge>
          )}
        </div>

        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleDateChange}
          disabled={{ before: new Date() }}
          numberOfMonths={2}
          locale={ptBR}
          className="rounded-md border w-fit"
        />

        {checkin && checkout && (
          <p className="mt-3 text-sm text-muted-foreground">
            Check-in: <strong>{format(checkin, "dd/MM/yyyy", { locale: ptBR })}</strong> →
            Check-out: <strong>{format(checkout, "dd/MM/yyyy", { locale: ptBR })}</strong>
          </p>
        )}
      </Card>

      {/* Bloco 3: Acomodação */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BedDouble className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Acomodação</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Tipo de quarto *</Label>
            <Select value={tipoQuarto} onValueChange={handleTipoQuartoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Chalé - Com Cozinha">Chalé - Com Cozinha</SelectItem>
                <SelectItem value="Chalé - Sem Cozinha">Chalé - Sem Cozinha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pessoas">Pessoas *</Label>
            <Input
              id="pessoas"
              type="number"
              min={1}
              max={tipoQuarto ? CAPACIDADE_MAX[tipoQuarto as TipoQuarto] : 6}
              value={pessoas}
              onChange={(e) => setPessoas(Number(e.target.value))}
            />
            {tipoQuarto && (
              <p className="text-xs text-muted-foreground">
                Máx: {CAPACIDADE_MAX[tipoQuarto as TipoQuarto]} pessoas
              </p>
            )}
          </div>
        </div>

        {/* Indicador de disponibilidade */}
        <div className="mt-4 flex items-center gap-3">
          {buscandoDisponibilidade && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando disponibilidade...
            </div>
          )}
          {!buscandoDisponibilidade && disponibilidade && getBadgeDisponibilidade()}
          {checkin && checkout && tipoQuarto && !disponibilidade && !buscandoDisponibilidade && (
            <Button variant="outline" size="sm" onClick={buscarDisponibilidade}>
              Verificar disponibilidade
            </Button>
          )}
        </div>
      </Card>

      {/* Bloco 4: Valores */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Valores e Pagamento</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {precoDiaria > 0 && (
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">
                Preço por diária: <strong>{formatarMoeda(precoDiaria)}</strong>
                {diarias > 0 && <> × {diarias} diária(s) = <strong>{formatarMoeda(precoDiaria * diarias)}</strong></>}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="valorCobrado">Valor cobrado (R$) *</Label>
            <Input
              id="valorCobrado"
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              value={valorCobrado}
              onChange={(e) => setValorCobrado(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Método de pagamento *</Label>
            <Select value={metodoPagamento} onValueChange={(v) => setMetodoPagamento(v as MetodoPagamento)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGAMENTO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorPago">Valor pago agora (R$)</Label>
            <Input
              id="valorPago"
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
            />
          </div>

          {saldoRestante > 0 && valorPago !== '' && (
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Saldo restante: <strong>{formatarMoeda(saldoRestante)}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Bloco 5: Observações */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Observações</h2>
        <Textarea
          placeholder="Notas adicionais sobre a reserva..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
        />
      </Card>

      {/* Bloco 6: Resumo e Confirmação */}
      {nomeCliente && checkin && checkout && tipoQuarto && metodoPagamento && valorTotal > 0 && (
        <Card className="p-6 border-primary/30 bg-primary/5">
          <h2 className="text-lg font-semibold mb-4">Resumo da Reserva</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{nomeCliente}</p>
              <p className="text-muted-foreground">{telefoneCliente}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Período</p>
              <p className="font-medium">
                {format(checkin, "dd/MM/yyyy")} → {format(checkout, "dd/MM/yyyy")}
              </p>
              <p className="text-muted-foreground">{diarias} diária(s)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Acomodação</p>
              <p className="font-medium">{tipoQuarto}</p>
              <p className="text-muted-foreground">{pessoas} pessoa(s)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valores</p>
              <p className="font-medium">Total: {formatarMoeda(valorTotal)}</p>
              <p className="text-muted-foreground">
                Pago: {formatarMoeda(valorPagoNum)} |
                Restante: {formatarMoeda(saldoRestante)}
              </p>
              <p className="text-muted-foreground capitalize">
                Método: {METODOS_PAGAMENTO.find(m => m.value === metodoPagamento)?.label}
              </p>
            </div>
          </div>

          <Button
            className="w-full md:w-auto"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando reserva...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirmar Reserva
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Botão se resumo não aparecer ainda */}
      {!(nomeCliente && checkin && checkout && tipoQuarto && metodoPagamento && valorTotal > 0) && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            variant="outline"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
            ) : (
              <><CheckCircle className="mr-2 h-4 w-4" /> Confirmar Reserva</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
