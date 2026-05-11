import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReservaCard } from '@/components/features/reserva/reserva-card';
import { Calendar, CalendarX, PlusCircle, Sun, Users } from 'lucide-react';
import { formatarMoeda } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const POUSADA_NOME = 'Pousada Xangrilá';

export default async function MinhasReservasPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar cliente por telefone (OTP) ou email (OAuth/email+senha)
  const admin = createAdminClient();

  let cliente: { id_cliente: number; nome_cliente: string; telefonewhatsapp_cliente: string | null } | null = null;

  if (user.phone) {
    const { data } = await (admin.from('clientes_xngrl') as any)
      .select('id_cliente, nome_cliente, telefonewhatsapp_cliente')
      .eq('telefonewhatsapp_cliente', user.phone)
      .single();
    cliente = data ?? null;
  }

  if (!cliente && user.email) {
    const { data } = await (admin.from('clientes_xngrl') as any)
      .select('id_cliente, nome_cliente, telefonewhatsapp_cliente')
      .eq('email_cliente', user.email)
      .single();
    cliente = data ?? null;
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 space-y-4">
        <CalendarX className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">Nenhuma reserva encontrada</h2>
        <p className="text-muted-foreground">
          Não encontramos reservas vinculadas a este número.
        </p>
        <Button asChild>
          <a href="/reservar">Fazer uma Reserva</a>
        </Button>
      </div>
    );
  }

  // Buscar reservas confirmadas
  const { data: reservas } = await (admin.from('reservas_confirmadas') as any)
    .select('*')
    .eq('cliente_id', cliente.id_cliente)
    .order('data_checkin', { ascending: false });

  // Buscar pré-reservas (pendentes de pagamento)
  const { data: preReservas } = await (admin.from('pre_reservas') as any)
    .select('*')
    .eq('cliente_id', cliente.id_cliente)
    .order('created_at', { ascending: false });

  // Buscar reservas de Day Use do cliente (por telefone — day_use_reservations não usa cliente_id)
  const telefoneCliente = user.phone || cliente.telefonewhatsapp_cliente;
  let dayUses: any[] = [];

  if (telefoneCliente) {
    const { data: dayUseData } = await (admin.from('day_use_reservations') as any)
      .select('*')
      .eq('phone_number', telefoneCliente)
      .neq('status', 'cancelled')
      .order('reservation_date', { ascending: false });
    dayUses = dayUseData || [];
  }

  // Filtrar reservas por status
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ativas = (reservas || []).filter((r: any) =>
    r.status === 'confirmada' && new Date(r.data_checkout) >= hoje
  );

  const concluidas = (reservas || []).filter((r: any) =>
    r.status === 'concluida' || (r.status === 'confirmada' && new Date(r.data_checkout) < hoje)
  );

  const pendentes = (preReservas || []).filter((p: any) =>
    p.status === 'aguardando_pagamento' &&
    new Date(p.expira_em) > new Date()
  );

  // Filtrar day uses — pendentes só aparecem se expires_at ainda não passou
  const agora = new Date();

  const dayUsesAtivos = dayUses.filter((du: any) => {
    const dataFutura = new Date(du.reservation_date + 'T23:59:59') >= hoje;

    if (du.status === 'confirmed') {
      return dataFutura;
    }

    if (du.status === 'pending') {
      const pixAindaValido = du.expires_at ? new Date(du.expires_at) > agora : true;
      return dataFutura && pixAindaValido;
    }

    return false;
  });

  const dayUsesConcluidos = dayUses.filter((du: any) => {
    if (du.status === 'completed') return true;
    if (du.status === 'confirmed' && new Date(du.reservation_date + 'T23:59:59') < hoje) return true;
    return false;
  });

  const totalReservas = ativas.length + pendentes.length + concluidas.length + dayUsesAtivos.length + dayUsesConcluidos.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Olá, {cliente.nome_cliente}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas reservas na {POUSADA_NOME}
          </p>
        </div>
        <Button asChild>
          <a href="/reservar">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Reserva
          </a>
        </Button>
      </div>

      {totalReservas === 0 ? (
        <Card className="p-12 text-center">
          <CalendarX className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma reserva ainda</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Você ainda não fez nenhuma reserva na pousada.
          </p>
          <Button asChild>
            <a href="/reservar">Fazer minha primeira reserva</a>
          </Button>
        </Card>
      ) : (
        <Tabs defaultValue="ativas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ativas">
              Ativas ({ativas.length})
            </TabsTrigger>
            <TabsTrigger value="pendentes">
              Pendentes ({pendentes.length})
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas ({concluidas.length})
            </TabsTrigger>
            <TabsTrigger value="dayuse">
              Day Use ({dayUsesAtivos.length + dayUsesConcluidos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="space-y-4">
            {ativas.length === 0 ? (
              <EmptyState
                titulo="Nenhuma reserva ativa"
                descricao="Você não tem reservas ativas no momento"
              />
            ) : (
              ativas.map((reserva: any) => (
                <ReservaCard key={reserva.id} reserva={reserva} tipo="confirmada" />
              ))
            )}
          </TabsContent>

          <TabsContent value="pendentes" className="space-y-4">
            {pendentes.length === 0 ? (
              <EmptyState
                titulo="Nenhuma reserva pendente"
                descricao="Você não tem pagamentos pendentes"
              />
            ) : (
              pendentes.map((reserva: any) => (
                <ReservaCard key={reserva.id} reserva={reserva} tipo="pendente" />
              ))
            )}
          </TabsContent>

          <TabsContent value="concluidas" className="space-y-4">
            {concluidas.length === 0 ? (
              <EmptyState
                titulo="Nenhuma reserva concluída"
                descricao="Histórico vazio"
              />
            ) : (
              concluidas.map((reserva: any) => (
                <ReservaCard key={reserva.id} reserva={reserva} tipo="concluida" />
              ))
            )}
          </TabsContent>

          <TabsContent value="dayuse" className="space-y-4">
            {dayUsesAtivos.length === 0 && dayUsesConcluidos.length === 0 ? (
              <EmptyState
                titulo="Nenhum Day Use"
                descricao="Você ainda não fez nenhuma reserva de Day Use"
              />
            ) : (
              <>
                {dayUsesAtivos.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Próximos</h3>
                    {dayUsesAtivos.map((du: any) => (
                      <DayUseCard key={du.id} dayUse={du} />
                    ))}
                  </div>
                )}
                {dayUsesConcluidos.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Anteriores</h3>
                    {dayUsesConcluidos.map((du: any) => (
                      <DayUseCard key={du.id} dayUse={du} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Card className="p-12 text-center">
      <CalendarX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="font-semibold mb-2">{titulo}</h3>
      <p className="text-sm text-muted-foreground">{descricao}</p>
    </Card>
  );
}

function DayUseCard({ dayUse }: { dayUse: any }) {
  const statusConfig: Record<string, { label: string; cor: string }> = {
    confirmed: { label: 'Confirmado', cor: 'text-green-600' },
    pending: { label: 'Aguardando Pagamento', cor: 'text-yellow-600' },
    completed: { label: 'Concluído', cor: 'text-blue-600' },
  };

  const config = statusConfig[dayUse.status] || statusConfig.pending;

  let notesData: { idosos?: number; pcd?: number; criancas_ate_6?: number } = {};
  try {
    if (dayUse.notes) notesData = JSON.parse(dayUse.notes);
  } catch { /* ignore */ }

  const dataFormatada = (() => {
    const [ano, mes, dia] = dayUse.reservation_date.split('-');
    const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  })();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-4 w-4 text-yellow-500" />
              <h3 className="font-semibold">
                Day Use #{dayUse.reservation_code}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {dayUse.status === 'confirmed' ? 'Confirmado em ' : 'Criado em '}
              {new Date(dayUse.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Badge variant={dayUse.status === 'confirmed' ? 'default' : 'secondary'}>
            <span className={config.cor}>{config.label}</span>
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="text-sm font-medium capitalize">{dataFormatada}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pessoas</p>
              <p className="text-sm font-medium">
                {dayUse.total_people || dayUse.number_of_people} pessoa{(dayUse.total_people || dayUse.number_of_people) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {dayUse.non_paying_people > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            Isentos: {[
              notesData.idosos ? `${notesData.idosos} idoso(s)` : null,
              notesData.pcd ? `${notesData.pcd} PCD` : null,
              notesData.criancas_ate_6 ? `${notesData.criancas_ate_6} criança(s)` : null,
            ].filter(Boolean).join(', ')}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">Valor Total:</p>
          <p className="text-lg font-bold text-primary">
            {formatarMoeda(Number(dayUse.total_amount))}
          </p>
        </div>

        {dayUse.status === 'pending' && (
          <div className="mt-3">
            <Button variant="outline" className="w-full" asChild>
              <a
                href={`https://wa.me/5598981519965?text=${encodeURIComponent(
                  `Olá! Gostaria de informações sobre meu Day Use ${dayUse.reservation_code}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com a Pousada
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
