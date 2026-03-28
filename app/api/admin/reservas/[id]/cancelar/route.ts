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
    const { motivo } = await request.json();

    if (!motivo || motivo.trim().length < 3) {
      return NextResponse.json({ error: 'Motivo obrigatório' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Atualizar status
    const { data: reserva } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('status')
      .eq('reserva_id', id)
      .single();

    if (!reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    await (supabase.from('reservas_confirmadas') as any)
      .update({
        status: 'cancelada',
        observacoes: `Cancelada por ${admin.nome}: ${motivo}`,
        updated_at: new Date().toISOString(),
      })
      .eq('reserva_id', id);

    // Registrar histórico
    await (supabase.from('historico_status_reserva') as any)
      .insert({
        reserva_id: id,
        status_anterior: reserva.status,
        status_novo: 'cancelada',
        alterado_por: admin.nome,
        motivo,
      });

    // Liberar bloqueios
    await (supabase.from('disponibilidade_quartos') as any)
      .delete()
      .eq('reserva_referencia', id);

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao cancelar:', error);
    return NextResponse.json({ error: 'Erro ao cancelar reserva' }, { status: 500 });
  }
}
