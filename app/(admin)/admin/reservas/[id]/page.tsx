'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { formatarMoeda, formatarData } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, CalendarCheck, CalendarX, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ReservaDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cancelarOpen, setCancelarOpen] = useState(false);

  const [obsCheckin, setObsCheckin] = useState('');
  const [obsCheckout, setObsCheckout] = useState('');
  const [temDanos, setTemDanos] = useState(false);
  const [valorDanos, setValorDanos] = useState('');
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [processando, setProcessando] = useState(false);

  const carregar = async () => {
    try {
      const res = await fetch(`/api/admin/reservas/${id}`);
      const data = await res.json();
      setDados(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [id]);

  const handleCheckin = async () => {
    setProcessando(true);
    try {
      const res = await fetch(`/api/admin/reservas/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacoes: obsCheckin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Check-in realizado com sucesso!');
      setCheckinOpen(false);
      carregar();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao realizar check-in');
    } finally {
      setProcessando(false);
    }
  };

  const handleCheckout = async () => {
    setProcessando(true);
    try {
      const res = await fetch(`/api/admin/reservas/${id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observacoes: obsCheckout,
          temDanos,
          valorDanos: temDanos ? Number(valorDanos) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Check-out realizado com sucesso!');
      setCheckoutOpen(false);
      carregar();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao realizar check-out');
    } finally {
      setProcessando(false);
    }
  };

  const handleCancelar = async () => {
    if (motivoCancelamento.trim().length < 3) {
      toast.error('Informe um motivo com ao menos 3 caracteres');
      return;
    }
    setProcessando(true);
    try {
      const res = await fetch(`/api/admin/reservas/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoCancelamento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Reserva cancelada.');
      setCancelarOpen(false);
      router.push('/admin/reservas');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao cancelar');
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!dados?.reserva) {
    return <p className="text-muted-foreground">Reserva não encontrada.</p>;
  }

  const { reserva, historico, preReserva } = dados;
  const cliente = reserva.clientes_xngrl;
  const podeCheckin = !reserva.checkin_realizado && reserva.status !== 'cancelada';
  const podeCheckout = reserva.checkin_realizado && !reserva.checkout_realizado;
  const podeCancelar = !['cancelada', 'concluida'].includes(reserva.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/reservas"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Reserva {reserva.reserva_id}</h1>
        <Badge variant={reserva.status === 'confirmada' ? 'default' : reserva.status === 'cancelada' ? 'destructive' : 'outline'}>
          {reserva.status}
        </Badge>
      </div>

      {/* Dados da reserva */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Detalhes da Reserva</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Check-in</p>
            <p className="font-medium">{formatarData(new Date(reserva.data_checkin + 'T12:00:00'))}</p>
            {reserva.checkin_realizado && (
              <p className="text-xs text-green-600">✓ Realizado</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Check-out</p>
            <p className="font-medium">{formatarData(new Date(reserva.data_checkout + 'T12:00:00'))}</p>
            {reserva.checkout_realizado && (
              <p className="text-xs text-green-600">✓ Realizado</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Acomodação</p>
            <p className="font-medium">{reserva.tipo_quarto}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pessoas</p>
            <p className="font-medium">{reserva.pessoas}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Valor Total</p>
            <p className="font-medium">{formatarMoeda(reserva.valor_total)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Valor Pago</p>
            <p className="font-medium">{formatarMoeda(reserva.valor_pago)}</p>
          </div>
          {reserva.noites && (
            <div>
              <p className="text-muted-foreground">Noites</p>
              <p className="font-medium">{reserva.noites}</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 mt-6 flex-wrap">
          <Button
            onClick={() => setCheckinOpen(true)}
            disabled={!podeCheckin}
            className="gap-2"
          >
            <CalendarCheck className="h-4 w-4" />
            Check-in
          </Button>
          <Button
            onClick={() => setCheckoutOpen(true)}
            disabled={!podeCheckout}
            variant="secondary"
            className="gap-2"
          >
            <CalendarX className="h-4 w-4" />
            Check-out
          </Button>
          <Button
            onClick={() => setCancelarOpen(true)}
            disabled={!podeCancelar}
            variant="destructive"
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </Card>

      {/* Dados do cliente */}
      {cliente && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Cliente</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{cliente.nome_cliente}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="font-medium">{cliente.telefonewhatsapp_cliente}</p>
            </div>
            {cliente.email_cliente && (
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{cliente.email_cliente}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Total de Reservas</p>
              <p className="font-medium">{cliente.total_reservas || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Gasto</p>
              <p className="font-medium">{formatarMoeda(cliente.valor_total_gasto || 0)}</p>
            </div>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/clientes/${cliente.id_cliente}`}>Ver perfil completo</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Pré-reserva */}
      {preReserva && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Pré-reserva Associada</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant="outline">{preReserva.status}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Valor Sinal</p>
              <p className="font-medium">{formatarMoeda(preReserva.valor_sinal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expira em</p>
              <p className="font-medium">
                {preReserva.expira_em ? new Date(preReserva.expira_em).toLocaleString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Histórico de Status</h2>
          <div className="space-y-3">
            {historico.map((h: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">{h.status_anterior} → {h.status_novo}</p>
                  <p className="text-muted-foreground">
                    {h.alterado_por} • {h.motivo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {h.data_alteracao ? new Date(h.data_alteracao).toLocaleString('pt-BR') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dialog Check-in */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Registrar check-in para {cliente?.nome_cliente}?
            </p>
            <div>
              <Label htmlFor="obs-checkin">Observações (opcional)</Label>
              <Textarea
                id="obs-checkin"
                value={obsCheckin}
                onChange={(e) => setObsCheckin(e.target.value)}
                placeholder="Ex: Chegou com acompanhante extra..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinOpen(false)}>Cancelar</Button>
            <Button onClick={handleCheckin} disabled={processando}>
              {processando ? 'Processando...' : 'Confirmar Check-in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Check-out */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Check-out</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="obs-checkout">Observações (opcional)</Label>
              <Textarea
                id="obs-checkout"
                value={obsCheckout}
                onChange={(e) => setObsCheckout(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="danos"
                checked={temDanos}
                onCheckedChange={setTemDanos}
              />
              <Label htmlFor="danos">Danos identificados?</Label>
            </div>
            {temDanos && (
              <div>
                <Label htmlFor="valor-danos">Valor dos danos (R$)</Label>
                <Input
                  id="valor-danos"
                  type="number"
                  value={valorDanos}
                  onChange={(e) => setValorDanos(e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
            <Button onClick={handleCheckout} disabled={processando}>
              {processando ? 'Processando...' : 'Confirmar Check-out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cancelamento */}
      <Dialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. Informe o motivo do cancelamento.
            </p>
            <div>
              <Label htmlFor="motivo">Motivo (obrigatório)</Label>
              <Textarea
                id="motivo"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Solicitação do hóspede..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelarOpen(false)}>Voltar</Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={processando || motivoCancelamento.trim().length < 3}
            >
              {processando ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
