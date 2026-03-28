'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatarMoeda } from '@/lib/utils';
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';

const CATEGORIA_BADGE: Record<string, { label: string; className: string }> = {
  VIP: { label: 'VIP', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  Frequente: { label: 'Frequente', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  Retorno: { label: 'Retorno', className: 'bg-green-100 text-green-800 border-green-300' },
  Novo: { label: 'Novo', className: 'bg-gray-100 text-gray-700 border-gray-300' },
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const buscarClientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      const res = await fetch(`/api/admin/clientes?${params}`);
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { buscarClientes(); }, []);

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    buscarClientes();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>

      {/* Busca */}
      <Card className="p-4">
        <form onSubmit={handleBusca} className="flex gap-2 max-w-md">
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>
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
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead>Gasto Total</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((c) => {
                  const cat = CATEGORIA_BADGE[c.categoria] || CATEGORIA_BADGE.Novo;
                  return (
                    <TableRow key={c.id_cliente}>
                      <TableCell className="font-medium">{c.nome_cliente || '—'}</TableCell>
                      <TableCell>{c.telefonewhatsapp_cliente}</TableCell>
                      <TableCell>{c.email_cliente || '—'}</TableCell>
                      <TableCell>{c.total_reservas || 0}</TableCell>
                      <TableCell>{formatarMoeda(c.valor_total_gasto || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cat.className}>
                          {cat.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/clientes/${c.id_cliente}`}>
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
