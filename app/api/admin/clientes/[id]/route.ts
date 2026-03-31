import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verificarAdmin();

    const { id } = await params;
    const supabase = createAdminClient();

    // Dados do cliente
    const { data: cliente, error } = await (supabase
      .from('clientes_xngrl') as any)
      .select('*')
      .eq('id_cliente', id)
      .single();

    if (error || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcular estatísticas em tempo real (não depender dos campos da tabela)
    const { data: statsReservas } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('valor_total, status, data_checkin')
      .eq('cliente_id', id)
      .in('status', ['confirmada', 'concluida']);

    const statsCalculadas = {
      total_reservas: (statsReservas || []).length,
      valor_total_gasto: (statsReservas || []).reduce(
        (acc: number, r: any) => acc + Number(r.valor_total || 0), 0
      ),
      ultima_reserva: (statsReservas || []).length > 0
        ? (statsReservas || []).sort(
            (a: any, b: any) => new Date(b.data_checkin).getTime() - new Date(a.data_checkin).getTime()
          )[0]?.data_checkin
        : null,
    };

    // Sobrescrever dados estáticos com dados calculados em tempo real
    cliente.total_reservas = statsCalculadas.total_reservas;
    cliente.valor_total_gasto = statsCalculadas.valor_total_gasto;
    cliente.ultima_reserva = statsCalculadas.ultima_reserva;
    cliente.score_cliente = statsCalculadas.total_reservas + Math.floor(statsCalculadas.valor_total_gasto / 500);

    // Histórico de reservas
    const { data: reservas } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('*')
      .eq('cliente_id', id)
      .order('data_checkin', { ascending: false });

    // Pré-reservas
    const { data: preReservas } = await (supabase
      .from('pre_reservas') as any)
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      cliente: {
        ...cliente,
        categoria: classificarCliente(cliente),
      },
      reservas: reservas || [],
      preReservas: preReservas || [],
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
  }
}

function classificarCliente(cliente: any): string {
  const totalGasto = Number(cliente.valor_total_gasto || 0);
  const totalReservas = cliente.total_reservas || 0;
  if (totalGasto >= 5000) return 'VIP';
  if (totalReservas >= 3) return 'Frequente';
  if (totalReservas >= 1) return 'Retorno';
  return 'Novo';
}
