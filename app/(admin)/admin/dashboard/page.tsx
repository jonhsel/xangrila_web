'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatarMoeda, formatarData } from '@/lib/utils';
import {
  CalendarCheck,
  CalendarX,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const OcupacaoChart = dynamic(() => import('./ocupacao-chart'), { ssr: false });

interface Metricas {
  hoje: {
    checkins: number;
    checkouts: number;
    hospedados: number;
    taxaOcupacao: number;
  };
  mes: {
    receitaTotal: number;
    receitaRecebida: number;
    receitaPendente: number;
  };
  pendentes: {
    preReservas: number;
  };
  proximosCheckins: any[];
}

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [ocupacao, setOcupacao] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/metricas').then(r => r.json()),
      fetch('/api/admin/ocupacao?dias=30').then(r => r.json()),
    ]).then(([metricasData, ocupacaoData]) => {
      setMetricas(metricasData);
      setOcupacao(ocupacaoData.ocupacao || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!metricas) return null;

  const cards = [
    {
      title: 'Check-ins Hoje',
      value: metricas.hoje.checkins,
      icon: CalendarCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Check-outs Hoje',
      value: metricas.hoje.checkouts,
      icon: CalendarX,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Hóspedes Ativos',
      value: metricas.hoje.hospedados,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Taxa de Ocupação',
      value: `${metricas.hoje.taxaOcupacao}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={cn(card.bg, 'p-3 rounded-full')}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Receita do mês */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Receita do Mês</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {formatarMoeda(metricas.mes.receitaTotal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Recebido</p>
          <p className="text-xl font-bold mt-1">
            {formatarMoeda(metricas.mes.receitaRecebida)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pendente</p>
          <p className="text-xl font-bold text-orange-600 mt-1">
            {formatarMoeda(metricas.mes.receitaPendente)}
          </p>
        </Card>
      </div>

      {/* Alerta de pré-reservas pendentes */}
      {metricas.pendentes.preReservas > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">
                  {metricas.pendentes.preReservas} pré-reserva(s) aguardando pagamento
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/pre-reservas">Ver</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Gráfico de ocupação */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Ocupação dos últimos 30 dias</h2>
        <div className="h-64">
          <OcupacaoChart data={ocupacao} />
        </div>
      </Card>

      {/* Próximos check-ins */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Próximos Check-ins</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/reservas">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {metricas.proximosCheckins.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum check-in nos próximos 7 dias.
          </p>
        ) : (
          <div className="space-y-3">
            {metricas.proximosCheckins.map((checkin: any) => (
              <div
                key={checkin.reserva_id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div>
                  <p className="font-medium">
                    {checkin.clientes_xngrl?.nome_cliente || 'Cliente'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatarData(new Date(checkin.data_checkin + 'T12:00:00'))} •{' '}
                    {checkin.pessoas} pessoa{checkin.pessoas > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{checkin.tipo_quarto}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {checkin.reserva_id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
