'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORIA_BADGE: Record<string, string> = {
  VIP: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Frequente: 'bg-blue-100 text-blue-800 border-blue-300',
  Retorno: 'bg-green-100 text-green-800 border-green-300',
  Novo: 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function ClientePerfilPage() {
  const { id } = useParams<{ id: string }>();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/clientes/${id}`)
      .then(r => r.json())
      .then(setDados)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!dados?.cliente) {
    return <p className="text-muted-foreground">Cliente não encontrado.</p>;
  }

  const { cliente, reservas, preReservas } = dados;
  const catClass = CATEGORIA_BADGE[cliente.categoria] || CATEGORIA_BADGE.Novo;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/clientes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {cliente.nome_cliente || 'Cliente sem nome'}
        </h1>
        <Badge variant="outline" className={catClass}>
          {cliente.categoria}
        </Badge>
      </div>

      {/* Card principal */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
            <p className="text-2xl font-bold">{cliente.total_reservas || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hospedagem</p>
            <p className="text-2xl font-bold text-green-600">
              {formatarMoeda(cliente.valor_total_gasto || 0)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Day Uses</p>
            <p className="text-2xl font-bold">{cliente.total_day_uses || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gastos Day Use</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatarMoeda(cliente.valor_total_day_use || 0)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Gasto Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatarMoeda(cliente.valor_total_gasto_completo || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Hospedagem + Day Use</p>
          </div>
          {cliente.score_cliente && (
            <div>
              <p className="text-muted-foreground">Score</p>
              <p className="font-medium">{cliente.score_cliente}</p>
            </div>
          )}
          {cliente.ultima_reserva && (
            <div>
              <p className="text-muted-foreground">Última Reserva</p>
              <p className="font-medium">
                {formatarData(new Date(cliente.ultima_reserva + 'T12:00:00'))}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="reservas" className="p-4">
          <TabsList>
            <TabsTrigger value="reservas">
              Reservas Confirmadas ({reservas.length})
            </TabsTrigger>
            <TabsTrigger value="pre-reservas">
              Pré-Reservas ({preReservas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservas">
            {reservas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Sem reservas confirmadas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservas.map((r: any) => (
                    <TableRow key={r.reserva_id}>
                      <TableCell className="font-mono text-xs">{r.reserva_id}</TableCell>
                      <TableCell>{formatarData(new Date(r.data_checkin + 'T12:00:00'))}</TableCell>
                      <TableCell>{formatarData(new Date(r.data_checkout + 'T12:00:00'))}</TableCell>
                      <TableCell>{r.tipo_quarto}</TableCell>
                      <TableCell>{formatarMoeda(r.valor_total)}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'cancelada' ? 'destructive' : 'outline'}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/reservas/${r.reserva_id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="pre-reservas">
            {preReservas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Sem pré-reservas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Valor Sinal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preReservas.map((pr: any) => (
                    <TableRow key={pr.reserva_id}>
                      <TableCell className="font-mono text-xs">{pr.reserva_id}</TableCell>
                      <TableCell>{formatarData(new Date(pr.data_checkin + 'T12:00:00'))}</TableCell>
                      <TableCell>{formatarData(new Date(pr.data_checkout + 'T12:00:00'))}</TableCell>
                      <TableCell>{formatarMoeda(pr.valor_sinal)}</TableCell>
                      <TableCell>
                        <Badge variant={pr.status === 'expirada' ? 'destructive' : 'outline'}>
                          {pr.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
