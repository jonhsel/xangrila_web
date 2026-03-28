import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { admin } = await verificarAdmin();

    const { id } = await params;
    const body = await request.json();
    const { observacoes, avaliacao, temDanos, valorDanos } = body;

    const supabase = createAdminClient();
    const agora = new Date();

    const { data: reserva } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('*')
      .eq('reserva_id', id)
      .single();

    if (!reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    if (reserva.checkout_realizado) {
      return NextResponse.json({ error: 'Check-out já realizado' }, { status: 409 });
    }

    if (!reserva.checkin_realizado) {
      return NextResponse.json({ error: 'Check-in não foi realizado' }, { status: 409 });
    }

    // Calcular atraso
    const checkoutPrevisto = new Date(reserva.data_checkout + 'T12:00:00');
    const atrasado = agora > checkoutPrevisto;
    const minutosAtraso = atrasado
      ? Math.round((agora.getTime() - checkoutPrevisto.getTime()) / 60000)
      : 0;

    // Atualizar reserva
    const { error: updateError } = await (supabase
      .from('reservas_confirmadas') as any)
      .update({
        checkout_realizado: true,
        status: 'concluida',
        data_checkout_real: agora.toISOString(),
        hora_checkout_real: agora.toTimeString().split(' ')[0],
        checkout_realizado_por: admin.nome,
        checkout_observacoes: observacoes || null,
        checkout_atrasado: atrasado,
        minutos_atraso_checkout: minutosAtraso,
        avaliacao_quarto: avaliacao ? JSON.stringify(avaliacao) : null,
        danos_identificados: temDanos || false,
        valor_danos: valorDanos || 0,
        updated_at: agora.toISOString(),
      })
      .eq('reserva_id', id);

    if (updateError) throw updateError;

    // Registrar no histórico
    await (supabase.from('historico_status_reserva') as any)
      .insert({
        reserva_id: id,
        status_anterior: reserva.status || 'confirmada',
        status_novo: 'concluida',
        alterado_por: admin.nome,
        motivo: 'Check-out realizado',
        detalhes: { observacoes, temDanos, valorDanos, atrasado, minutosAtraso },
      });

    // Liberar bloqueios temporários
    await (supabase.from('disponibilidade_quartos') as any)
      .delete()
      .eq('reserva_referencia', id);

    // Atualizar estatísticas do cliente
    const { data: cliente } = await (supabase
      .from('clientes_xngrl') as any)
      .select('total_reservas, valor_total_gasto')
      .eq('id_cliente', reserva.cliente_id)
      .single();

    if (cliente) {
      await (supabase.from('clientes_xngrl') as any)
        .update({
          total_reservas: (cliente.total_reservas || 0) + 1,
          valor_total_gasto: (Number(cliente.valor_total_gasto) || 0) + Number(reserva.valor_total),
          ultima_reserva: agora.toISOString().split('T')[0],
        })
        .eq('id_cliente', reserva.cliente_id);
    }

    return NextResponse.json({ sucesso: true, atrasado, minutosAtraso });
  } catch (error) {
    console.error('Erro no check-out:', error);
    return NextResponse.json({ error: 'Erro ao processar check-out' }, { status: 500 });
  }
}
