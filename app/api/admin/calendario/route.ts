import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));
    const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()));

    const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0];

    // Reservas do mês
    const { data: reservas } = await (supabase
      .from('reservas_confirmadas') as any)
      .select(`
        reserva_id,
        data_checkin,
        data_checkout,
        tipo_quarto,
        pessoas,
        status,
        checkin_realizado,
        clientes_xngrl (nome_cliente)
      `)
      .in('status', ['confirmada', 'pendente', 'concluida'])
      .lte('data_checkin', ultimoDia)
      .gte('data_checkout', primeiroDia);

    // Total de quartos
    const { count: totalQuartos } = await (supabase
      .from('acomodacoes') as any)
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Montar dados por dia
    const diasDoMes: any[] = [];
    const totalDias = new Date(ano, mes, 0).getDate();

    for (let dia = 1; dia <= totalDias; dia++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

      const reservasDoDia = (reservas || []).filter((r: any) =>
        r.data_checkin <= dataStr && r.data_checkout > dataStr
      );

      const checkins = (reservas || []).filter((r: any) => r.data_checkin === dataStr);
      const checkouts = (reservas || []).filter((r: any) => r.data_checkout === dataStr);

      diasDoMes.push({
        data: dataStr,
        dia,
        ocupados: reservasDoDia.length,
        totalQuartos: totalQuartos || 0,
        taxaOcupacao: totalQuartos ? Math.round((reservasDoDia.length / totalQuartos) * 100) : 0,
        checkins: checkins.length,
        checkouts: checkouts.length,
        reservas: reservasDoDia,
      });
    }

    return NextResponse.json({ dias: diasDoMes, mes, ano });
  } catch (error) {
    console.error('Erro ao buscar calendário:', error);
    return NextResponse.json({ error: 'Erro ao buscar calendário' }, { status: 500 });
  }
}
