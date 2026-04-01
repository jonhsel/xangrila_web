import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca');

    const query = (supabase.from('clientes_xngrl') as any)
      .select('*')
      .order('created_at', { ascending: false });

    const { data: clientes, error } = await query;
    if (error) throw error;

    let resultado = clientes || [];

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter((c: any) =>
        c.nome_cliente?.toLowerCase().includes(buscaLower) ||
        c.telefonewhatsapp_cliente?.includes(busca) ||
        c.email_cliente?.toLowerCase().includes(buscaLower)
      );
    }

    // Enriquecer com estatísticas em tempo real
    const { data: todasReservas } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('cliente_id, valor_total, status, data_checkin')
      .in('status', ['confirmada', 'concluida']);

    // Agrupar por cliente
    const statsPorCliente = new Map<number, { total: number; valor: number; ultima: string | null }>();
    for (const r of (todasReservas || [])) {
      const existing = statsPorCliente.get(r.cliente_id) || { total: 0, valor: 0, ultima: null };
      existing.total += 1;
      existing.valor += Number(r.valor_total || 0);
      if (!existing.ultima || r.data_checkin > existing.ultima) {
        existing.ultima = r.data_checkin;
      }
      statsPorCliente.set(r.cliente_id, existing);
    }

    // Buscar todas as reservas de day use confirmadas
    const { data: todosDayUses } = await (supabase
      .from('day_use_reservations') as any)
      .select('phone_number, total_amount, status')
      .in('status', ['confirmed', 'completed']);

    // Agrupar day use por telefone
    const dayUsePorTelefone = new Map<string, { total: number; valor: number }>();
    for (const du of (todosDayUses || [])) {
      const existing = dayUsePorTelefone.get(du.phone_number) || { total: 0, valor: 0 };
      existing.total += 1;
      existing.valor += Number(du.total_amount || 0);
      dayUsePorTelefone.set(du.phone_number, existing);
    }

    // Sobrescrever estatísticas nos dados dos clientes e classificar
    resultado = resultado.map((c: any) => {
      const stats = statsPorCliente.get(c.id_cliente);
      const duStats = dayUsePorTelefone.get(c.telefonewhatsapp_cliente);
      const enriched = {
        ...c,
        total_reservas: stats?.total || 0,
        valor_total_gasto: stats?.valor || 0,
        ultima_reserva: stats?.ultima || null,
        total_day_uses: duStats?.total || 0,
        valor_total_day_use: duStats?.valor || 0,
        valor_total_gasto_completo: (stats?.valor || 0) + (duStats?.valor || 0),
        score_cliente: (stats?.total || 0) + Math.floor((stats?.valor || 0) / 500),
      };
      return {
        ...enriched,
        categoria: classificarCliente(enriched),
      };
    });

    return NextResponse.json({ clientes: resultado });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({ error: 'Erro ao listar clientes' }, { status: 500 });
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
