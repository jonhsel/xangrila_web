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
    const { observacoes } = body;

    const supabase = createAdminClient();
    const agora = new Date();

    // Verificar se reserva existe e está confirmada
    const { data: reserva } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('*')
      .eq('reserva_id', id)
      .single();

    if (!reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    if (reserva.checkin_realizado) {
      return NextResponse.json({ error: 'Check-in já realizado' }, { status: 409 });
    }

    // Calcular atraso
    const checkinPrevisto = new Date(reserva.data_checkin + 'T14:00:00');
    const atrasado = agora > checkinPrevisto;
    const minutosAtraso = atrasado
      ? Math.round((agora.getTime() - checkinPrevisto.getTime()) / 60000)
      : 0;

    // Atualizar reserva
    const { error: updateError } = await (supabase
      .from('reservas_confirmadas') as any)
      .update({
        checkin_realizado: true,
        status_checkin: 'concluido',
        data_checkin_real: agora.toISOString(),
        hora_checkin_real: agora.toTimeString().split(' ')[0],
        checkin_realizado_por: admin.nome,
        responsavel_checkin: admin.nome,
        observacoes_checkin: observacoes || null,
        checkin_atrasado: atrasado,
        minutos_atraso_checkin: minutosAtraso,
        updated_at: agora.toISOString(),
      })
      .eq('reserva_id', id);

    if (updateError) throw updateError;

    // Registrar no histórico
    await (supabase.from('historico_status_reserva') as any)
      .insert({
        reserva_id: id,
        status_anterior: reserva.status_checkin || 'pendente',
        status_novo: 'concluido',
        alterado_por: admin.nome,
        motivo: 'Check-in realizado',
        detalhes: { observacoes, atrasado, minutosAtraso },
      });

    return NextResponse.json({ sucesso: true, atrasado, minutosAtraso });
  } catch (error) {
    console.error('Erro no check-in:', error);
    return NextResponse.json({ error: 'Erro ao processar check-in' }, { status: 500 });
  }
}
