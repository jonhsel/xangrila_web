import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReservaCard } from '@/components/features/reserva/reserva-card';
import { CalendarX, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const POUSADA_NOME = 'Pousada Xangrilá';

export default async function MinhasReservasPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar cliente pelo telefone — usa admin client para bypass RLS
  const admin = createAdminClient();

  const { data: cliente } = await (admin.from('clientes_xngrl') as any)
    .select('id_cliente, nome_cliente')
    .eq('telefonewhatsapp_cliente', user.phone)
    .single();

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

  const totalReservas = ativas.length + pendentes.length + concluidas.length;

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ativas">
              Ativas ({ativas.length})
            </TabsTrigger>
            <TabsTrigger value="pendentes">
              Pendentes ({pendentes.length})
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas ({concluidas.length})
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
