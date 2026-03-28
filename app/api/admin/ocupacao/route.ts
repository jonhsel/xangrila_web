import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const dias = parseInt(searchParams.get('dias') || '30');

    // Total de quartos
    const { count: totalQuartos } = await (supabase
      .from('acomodacoes') as any)
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Reservas confirmadas no período
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - dias);

    const { data: reservas } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('data_checkin, data_checkout')
      .in('status', ['confirmada', 'concluida'])
      .gte('data_checkout', inicio.toISOString().split('T')[0])
      .lte('data_checkin', hoje.toISOString().split('T')[0]);

    // Calcular ocupação por dia
    const ocupacao = [];
    for (let i = 0; i < dias; i++) {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];

      const ocupados = (reservas || []).filter((r: any) =>
        r.data_checkin <= dataStr && r.data_checkout > dataStr
      ).length;

      const taxaOcupacao = totalQuartos
        ? Math.round((ocupados / totalQuartos) * 100)
        : 0;

      ocupacao.push({
        data: dataStr,
        ocupacao: taxaOcupacao,
        ocupados: ocupados,
      });
    }

    return NextResponse.json({ ocupacao, totalQuartos });
  } catch (error) {
    console.error('Erro ao buscar ocupação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ocupação' },
      { status: 500 }
    );
  }
}
