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
import { formatarMoeda, formatarData } from '@/lib/utils';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function getExpiracaoInfo(expiraEm: string | null) {
  if (!expiraEm) return null;
  const agora = new Date();
  const expira = new Date(expiraEm);
  const diff = expira.getTime() - agora.getTime();

  if (diff < 0) return { expirado: true, texto: 'Expirado' };
  const minutos = Math.ceil(diff / 60000);
  if (minutos < 60) return { expirado: false, quaseExpirando: true, texto: `${minutos}min` };
  const horas = Math.ceil(diff / 3600000);
  return { expirado: false, quaseExpirando: false, texto: `${horas}h` };
}

function copiarCodigo(codigo: string) {
  navigator.clipboard.writeText(codigo);
  toast.success('Código copiado!');
}

function TabelaPreReservas({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4">Nenhuma pré-reserva encontrada.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead>Check-out</TableHead>
          <TableHead>Valor Sinal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expira em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((pr) => {
          const expInfo = getExpiracaoInfo(pr.expira_em);
          return (
            <TableRow key={pr.reserva_id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{pr.reserva_id}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copiarCodigo(pr.reserva_id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>{pr.clientes_xngrl?.nome_cliente || '—'}</TableCell>
              <TableCell>{formatarData(new Date(pr.data_checkin + 'T12:00:00'))}</TableCell>
              <TableCell>{formatarData(new Date(pr.data_checkout + 'T12:00:00'))}</TableCell>
              <TableCell>{formatarMoeda(pr.valor_sinal)}</TableCell>
              <TableCell>
                <Badge
                  variant={pr.status === 'paga' ? 'default' : pr.status === 'expirada' ? 'destructive' : 'secondary'}
                >
                  {pr.status}
                </Badge>
              </TableCell>
              <TableCell>
                {expInfo ? (
                  <Badge variant={expInfo.expirado ? 'destructive' : expInfo.quaseExpirando ? 'secondary' : 'outline'}>
                    {expInfo.texto}
                  </Badge>
                ) : '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function PreReservasPage() {
  const [preReservas, setPreReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pre-reservas');
      const data = await res.json();
      setPreReservas(data.preReservas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 30000);
    return () => clearInterval(interval);
  }, [carregar]);

  const aguardando = preReservas.filter(p => p.status === 'aguardando_pagamento');
  const pagas = preReservas.filter(p => p.status === 'paga');
  const expiradas = preReservas.filter(p => p.status === 'expirada');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pré-Reservas</h1>
        <Button variant="outline" size="sm" onClick={carregar} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <Tabs defaultValue="aguardando">
            <div className="px-4 pt-4">
              <TabsList>
                <TabsTrigger value="aguardando">
                  Aguardando ({aguardando.length})
                </TabsTrigger>
                <TabsTrigger value="pagas">
                  Pagas ({pagas.length})
                </TabsTrigger>
                <TabsTrigger value="expiradas">
                  Expiradas ({expiradas.length})
                </TabsTrigger>
                <TabsTrigger value="todas">
                  Todas ({preReservas.length})
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="aguardando">
              <TabelaPreReservas items={aguardando} />
            </TabsContent>
            <TabsContent value="pagas">
              <TabelaPreReservas items={pagas} />
            </TabsContent>
            <TabsContent value="expiradas">
              <TabelaPreReservas items={expiradas} />
            </TabsContent>
            <TabsContent value="todas">
              <TabelaPreReservas items={preReservas} />
            </TabsContent>
          </Tabs>
        )}
      </Card>

      <p className="text-xs text-muted-foreground text-right">
        Atualização automática a cada 30 segundos
      </p>
    </div>
  );
}
