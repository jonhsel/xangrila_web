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

    // Reserva com dados do cliente
    const { data: reserva, error } = await (supabase
      .from('reservas_confirmadas') as any)
      .select(`
        *,
        clientes_xngrl (
          id_cliente,
          nome_cliente,
          telefonewhatsapp_cliente,
          email_cliente,
          total_reservas,
          valor_total_gasto,
          score_cliente
        )
      `)
      .eq('reserva_id', id)
      .single();

    if (error || !reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Histórico de status
    const { data: historico } = await (supabase
      .from('historico_status_reserva') as any)
      .select('*')
      .eq('reserva_id', id)
      .order('data_alteracao', { ascending: false });

    // Pré-reserva associada
    const { data: preReserva } = await (supabase
      .from('pre_reservas') as any)
      .select('*')
      .eq('reserva_id', id)
      .single();

    return NextResponse.json({
      reserva,
      historico: historico || [],
      preReserva,
    });
  } catch (error) {
    console.error('Erro ao buscar reserva:', error);
    return NextResponse.json({ error: 'Erro ao buscar reserva' }, { status: 500 });
  }
}
