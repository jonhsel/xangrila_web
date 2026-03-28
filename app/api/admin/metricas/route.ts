import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET() {
  try {
    await verificarAdmin();

    const supabase = createAdminClient();
    const hoje = new Date().toISOString().split('T')[0];

    // Check-ins hoje
    const { count: checkinsHoje } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('*', { count: 'exact', head: true })
      .eq('data_checkin', hoje)
      .in('status', ['confirmada', 'pendente']);

    // Check-outs hoje
    const { count: checkoutsHoje } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('*', { count: 'exact', head: true })
      .eq('data_checkout', hoje)
      .in('status', ['confirmada']);

    // Hóspedes ativos (check-in feito, checkout não feito)
    const { count: hospedados } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('*', { count: 'exact', head: true })
      .eq('checkin_realizado', true)
      .eq('checkout_realizado', false)
      .in('status', ['confirmada']);

    // Total de quartos (consultar tabela acomodacoes)
    const { count: totalQuartos } = await (supabase
      .from('acomodacoes') as any)
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    const taxaOcupacao = totalQuartos && hospedados
      ? Math.round((hospedados / totalQuartos) * 100)
      : 0;

    // Receita do mês
    const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    const { data: reservasMes } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('valor_total, valor_pago')
      .gte('created_at', primeiroDiaMes)
      .in('status', ['confirmada', 'concluida']);

    const totalReceita = (reservasMes || []).reduce(
      (acc: number, r: any) => acc + Number(r.valor_total || 0), 0
    );
    const totalRecebido = (reservasMes || []).reduce(
      (acc: number, r: any) => acc + Number(r.valor_pago || 0), 0
    );

    // Pré-reservas pendentes
    const { count: preReservasPendentes } = await (supabase
      .from('pre_reservas') as any)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aguardando_pagamento');

    // Próximos check-ins (7 dias)
    const daquiA7Dias = new Date();
    daquiA7Dias.setDate(daquiA7Dias.getDate() + 7);

    const { data: proximosCheckins } = await (supabase
      .from('reservas_confirmadas') as any)
      .select(`
        reserva_id,
        data_checkin,
        pessoas,
        tipo_quarto,
        cliente_id,
        clientes_xngrl (
          nome_cliente,
          telefonewhatsapp_cliente
        )
      `)
      .gte('data_checkin', hoje)
      .lte('data_checkin', daquiA7Dias.toISOString().split('T')[0])
      .eq('status', 'confirmada')
      .eq('checkin_realizado', false)
      .order('data_checkin', { ascending: true })
      .limit(5);

    return NextResponse.json({
      hoje: {
        checkins: checkinsHoje || 0,
        checkouts: checkoutsHoje || 0,
        hospedados: hospedados || 0,
        taxaOcupacao,
      },
      mes: {
        receitaTotal: totalReceita,
        receitaRecebida: totalRecebido,
        receitaPendente: totalReceita - totalRecebido,
      },
      pendentes: {
        preReservas: preReservasPendentes || 0,
      },
      proximosCheckins: proximosCheckins || [],
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métricas' },
      { status: 500 }
    );
  }
}
