'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatarMoeda, formatarData } from '@/lib/utils';
import { Search, Eye, Plus } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmada: { label: 'Confirmada', variant: 'default' },
  pendente: { label: 'Pendente', variant: 'secondary' },
  concluida: { label: 'Concluída', variant: 'outline' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
};

export default function ReservasPage() {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');
  const [tipoQuarto, setTipoQuarto] = useState('todos');

  const buscarReservas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'todos') params.set('status', status);
      if (tipoQuarto !== 'todos') params.set('tipoQuarto', tipoQuarto);
      if (busca) params.set('busca', busca);

      const res = await fetch(`/api/admin/reservas?${params}`);
      const data = await res.json();
      setReservas(data.reservas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarReservas();
  }, [status, tipoQuarto]);

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    buscarReservas();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
        <Link href="/admin/reservas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reserva
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleBusca} className="flex gap-2 flex-1 min-w-48">
            <Input
              placeholder="Buscar por código ou nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoQuarto} onValueChange={setTipoQuarto}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Casa">Casa</SelectItem>
              <SelectItem value="Chalé">Chalé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pessoas</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma reserva encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                reservas.map((r) => {
                  const statusInfo = STATUS_LABELS[r.status] || { label: r.status, variant: 'outline' as const };
                  return (
                    <TableRow key={r.reserva_id}>
                      <TableCell className="font-mono text-xs">{r.reserva_id}</TableCell>
                      <TableCell>{r.clientes_xngrl?.nome_cliente || '—'}</TableCell>
                      <TableCell>{formatarData(new Date(r.data_checkin + 'T12:00:00'))}</TableCell>
                      <TableCell>{formatarData(new Date(r.data_checkout + 'T12:00:00'))}</TableCell>
                      <TableCell>{r.tipo_quarto}</TableCell>
                      <TableCell>{r.pessoas}</TableCell>
                      <TableCell>{formatarMoeda(r.valor_total)}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/reservas/${r.reserva_id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
