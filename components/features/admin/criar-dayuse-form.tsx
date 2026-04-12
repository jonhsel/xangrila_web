'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Users,
  Banknote,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type MetodoPagamento = 'dinheiro' | 'cartao_fisico' | 'transferencia' | 'pix_manual';

const METODOS_PAGAMENTO: { value: MetodoPagamento; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_fisico', label: 'Cartão (máquina física)' },
  { value: 'transferencia', label: 'Transferência bancária' },
  { value: 'pix_manual', label: 'PIX manual (sem Mercado Pago)' },
];

interface DayUseConfig {
  max_capacity: number;
  preco_dia: number;
  tipo_dia: 'weekday' | 'weekend' | 'holiday';
  daily_free_limit: number;
}

interface DayUseDisponibilidade {
  vagas_restantes: number;
  gratuidades_restantes: number;
}

interface CriarDayuseFormProps {
  onSuccess?: () => void;
}

export function CriarDayuseForm({ onSuccess }: CriarDayuseFormProps) {
  // Bloco 1: Cliente
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');

  // Bloco 2: Data
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>();
  const [config, setConfig] = useState<DayUseConfig | null>(null);
  const [disponibilidade, setDisponibilidade] = useState<DayUseDisponibilidade | null>(null);
  const [carregandoConfig, setCarregandoConfig] = useState(false);

  // Bloco 3: Pessoas
  const [pagantes, setPagantes] = useState(1);
  const [idosos, setIdosos] = useState(0);
  const [pcd, setPcd] = useState(0);
  const [criancas, setCriancas] = useState(0);

  // Bloco 4: Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | ''>('');
  const [valorEditavel, setValorEditavel] = useState('');
  const [valorPago, setValorPago] = useState('');

  // Estado geral
  const [submitting, setSubmitting] = useState(false);

  const totalNaoPagantes = idosos + pcd + criancas;
  const totalPessoas = pagantes + totalNaoPagantes;
  const precoDia = config?.preco_dia ?? 0;
  const valorTotal = Number(valorEditavel) || pagantes * precoDia;
  const valorPagoNum = Number(valorPago) || 0;
  const saldoRestante = Math.max(0, valorTotal - valorPagoNum);

  const TIPO_DIA_LABEL: Record<string, string> = {
    weekday: 'Dia útil',
    weekend: 'Fim de semana',
    holiday: 'Feriado',
  };

  const carregarConfig = useCallback(async (data: Date) => {
    setCarregandoConfig(true);
    try {
      const dateStr = format(data, 'yyyy-MM-dd');
      const res = await fetch(`/api/day-use/config?date=${dateStr}`);
      const json = await res.json();

      if (res.ok) {
        setConfig(json.config);
        setDisponibilidade(json.disponibilidade);
        setValorEditavel(String(json.config.preco_dia * pagantes));
      } else {
        toast.error('Day Use não disponível para esta data.');
        setConfig(null);
        setDisponibilidade(null);
      }
    } catch {
      toast.error('Erro ao carregar configuração do day use.');
    } finally {
      setCarregandoConfig(false);
    }
  }, [pagantes]);

  useEffect(() => {
    if (dataSelecionada) {
      carregarConfig(dataSelecionada);
    }
  }, [dataSelecionada, carregarConfig]);

  // Recalcular valor ao trocar pagantes
  useEffect(() => {
    if (precoDia > 0) {
      setValorEditavel(String(pagantes * precoDia));
    }
  }, [pagantes, precoDia]);

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  const handleSubmit = async () => {
    if (!nomeCliente || !telefone) {
      toast.error('Preencha nome e telefone.');
      return;
    }
    if (!dataSelecionada) {
      toast.error('Selecione a data.');
      return;
    }
    if (!metodoPagamento) {
      toast.error('Selecione o método de pagamento.');
      return;
    }
    if (pagantes < 1) {
      toast.error('Mínimo 1 pagante.');
      return;
    }

    if (disponibilidade && totalPessoas > disponibilidade.vagas_restantes) {
      toast.error(`Apenas ${disponibilidade.vagas_restantes} vagas disponíveis.`);
      return;
    }
    if (disponibilidade && totalNaoPagantes > disponibilidade.gratuidades_restantes) {
      toast.error(`Apenas ${disponibilidade.gratuidades_restantes} gratuidades disponíveis.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/day-use/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: nomeCliente,
          phone_number: telefone,
          reservation_date: format(dataSelecionada, 'yyyy-MM-dd'),
          paying_people: pagantes,
          non_paying_details: { idosos, pcd, criancas_ate_6: criancas },
          metodo_pagamento: metodoPagamento,
          valor_pago: valorPagoNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          toast.error('Sem permissão para cadastrar day use.');
        } else {
          toast.error(data.error || 'Erro ao criar day use.');
        }
        return;
      }

      toast.success(`Day Use ${data.reservation_code} criado! Total: ${formatarMoeda(data.total_amount)}`);
      onSuccess?.();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Bloco 1: Cliente */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Dados do Cliente</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="du-nome">Nome *</Label>
            <Input
              id="du-nome"
              placeholder="Nome completo"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="du-tel">Telefone *</Label>
            <Input
              id="du-tel"
              placeholder="(98) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            />
          </div>
        </div>
      </Card>

      {/* Bloco 2: Data */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Data do Day Use</h3>
          {carregandoConfig && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <Calendar
          mode="single"
          selected={dataSelecionada}
          onSelect={setDataSelecionada}
          disabled={{ before: new Date() }}
          locale={ptBR}
          className="rounded-md border w-fit"
        />

        {config && dataSelecionada && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{TIPO_DIA_LABEL[config.tipo_dia]}</Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {formatarMoeda(config.preco_dia)} / pessoa
            </Badge>
            {disponibilidade && (
              <>
                <Badge className={disponibilidade.vagas_restantes > 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {disponibilidade.vagas_restantes} vagas
                </Badge>
                <Badge className="bg-purple-100 text-purple-800">
                  {disponibilidade.gratuidades_restantes} gratuidades
                </Badge>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Bloco 3: Pessoas */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Pessoas</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="du-pagantes">Pagantes *</Label>
            <Input
              id="du-pagantes"
              type="number"
              min={1}
              value={pagantes}
              onChange={(e) => setPagantes(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="du-idosos">Idosos (isento)</Label>
            <Input
              id="du-idosos"
              type="number"
              min={0}
              value={idosos}
              onChange={(e) => setIdosos(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="du-pcd">PCD (isento)</Label>
            <Input
              id="du-pcd"
              type="number"
              min={0}
              value={pcd}
              onChange={(e) => setPcd(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="du-criancas">Crianças até 6 (isento)</Label>
            <Input
              id="du-criancas"
              type="number"
              min={0}
              value={criancas}
              onChange={(e) => setCriancas(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>

        {totalPessoas > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Total: <strong>{totalPessoas} pessoa(s)</strong>
            {totalNaoPagantes > 0 && ` (${pagantes} pagante(s) + ${totalNaoPagantes} isento(s))`}
          </p>
        )}
      </Card>

      {/* Bloco 4: Pagamento */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Banknote className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Pagamento</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Método *</Label>
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

          <div className="space-y-1">
            <Label htmlFor="du-valor">Valor a cobrar (R$)</Label>
            <Input
              id="du-valor"
              type="number"
              min={0}
              step={0.01}
              value={valorEditavel}
              onChange={(e) => setValorEditavel(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="du-pago">Valor pago agora (R$)</Label>
            <Input
              id="du-pago"
              type="number"
              min={0}
              step={0.01}
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
            />
          </div>
        </div>

        {saldoRestante > 0 && valorPago !== '' && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Saldo restante: <strong>{formatarMoeda(saldoRestante)}</strong>
            </p>
          </div>
        )}
      </Card>

      {/* Resumo e Confirmação */}
      {nomeCliente && dataSelecionada && metodoPagamento && pagantes > 0 && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-3">Resumo</h3>
          <div className="text-sm space-y-1 mb-4 text-muted-foreground">
            <p><strong className="text-foreground">{nomeCliente}</strong> — {telefone}</p>
            <p>
              Data: <strong className="text-foreground">{format(dataSelecionada, "dd/MM/yyyy", { locale: ptBR })}</strong>
            </p>
            <p>
              Pessoas: <strong className="text-foreground">{totalPessoas}</strong>
              {totalNaoPagantes > 0 && ` (${pagantes} pag. + ${totalNaoPagantes} isento(s))`}
            </p>
            <p>
              Total: <strong className="text-foreground">{formatarMoeda(valorTotal)}</strong> |
              Método: {METODOS_PAGAMENTO.find(m => m.value === metodoPagamento)?.label}
            </p>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
            ) : (
              <><CheckCircle className="mr-2 h-4 w-4" /> Confirmar Day Use</>
            )}
          </Button>
        </Card>
      )}

      {!(nomeCliente && dataSelecionada && metodoPagamento && pagantes > 0) && (
        <Button className="w-full" onClick={handleSubmit} disabled={submitting} variant="outline">
          {submitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
          ) : (
            <><CheckCircle className="mr-2 h-4 w-4" /> Confirmar Day Use</>
          )}
        </Button>
      )}
    </div>
  );
}
