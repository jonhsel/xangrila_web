'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CriarDayuseForm } from '@/components/features/admin/criar-dayuse-form';
import { formatarMoeda } from '@/lib/utils';
import { Plus, RefreshCw, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmado', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  completed: { label: 'Concluído', variant: 'outline' },
};

type TabAtual = 'hoje' | 'proximos' | 'historico';

export default function DayUsePage() {
  const [dayUses, setDayUses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabAtual, setTabAtual] = useState<TabAtual>('hoje');
  const [dialogAberto, setDialogAberto] = useState(false);

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const buscarDayUses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (tabAtual === 'hoje') {
        params.set('data_inicio', hoje);
        params.set('data_fim', hoje);
      } else if (tabAtual === 'proximos') {
        const amanha = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
        params.set('data_inicio', amanha);
      } else {
        const trintaDiasAtras = format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd');
        params.set('data_fim', hoje);
        params.set('data_inicio', trintaDiasAtras);
      }

      const res = await fetch(`/api/admin/day-use?${params}`);
      const data = await res.json();
      setDayUses(data.reservas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tabAtual, hoje]);

  useEffect(() => {
    buscarDayUses();
  }, [buscarDayUses]);

  const handleSuccess = () => {
    setDialogAberto(false);
    buscarDayUses();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">Day Use</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={buscarDayUses} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Day Use
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tabAtual} onValueChange={(v) => setTabAtual(v as TabAtual)}>
        <TabsList>
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="historico">Histórico (30 dias)</TabsTrigger>
        </TabsList>

        {(['hoje', 'proximos', 'historico'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Pessoas</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registrado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayUses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhum day use encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dayUses.map((du) => {
                        const statusInfo =
                          STATUS_LABELS[du.status] || { label: du.status, variant: 'outline' as const };
                        const metodoLabel: Record<string, string> = {
                          dinheiro: 'Dinheiro',
                          cartao_fisico: 'Cartão',
                          transferencia: 'Transferência',
                          pix_manual: 'PIX manual',
                          pix: 'PIX',
                        };
                        return (
                          <TableRow key={du.id || du.reservation_code}>
                            <TableCell className="font-mono text-xs">
                              {du.reservation_code}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{du.customer_name}</p>
                                <p className="text-xs text-muted-foreground">{du.phone_number}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {du.reservation_date
                                ? format(new Date(du.reservation_date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {du.total_people ?? du.number_of_people}
                              {du.non_paying_people > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (+{du.non_paying_people} isento)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatarMoeda(du.total_amount)}</TableCell>
                            <TableCell className="text-sm">
                              {metodoLabel[du.payment_method] || du.payment_method || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {du.confirmed_by || '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog: Novo Day Use */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Day Use (Presencial)</DialogTitle>
          </DialogHeader>
          <CriarDayuseForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
