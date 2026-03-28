import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Marcar pré-reservas expiradas
    const { data: expiradas } = await (supabase
      .from('pre_reservas') as any)
      .update({ status: 'expirada' })
      .eq('status', 'aguardando_pagamento')
      .lt('expira_em', new Date().toISOString())
      .select('reserva_id');

    // Liberar bloqueios das expiradas
    for (const pr of (expiradas || [])) {
      await (supabase.from('disponibilidade_quartos') as any)
        .delete()
        .eq('reserva_referencia', pr.reserva_id);

      // Atualizar reserva associada se existir
      await (supabase.from('reservas_confirmadas') as any)
        .update({ status: 'cancelada', observacoes: 'Pré-reserva expirada - pagamento não realizado' })
        .eq('reserva_id', pr.reserva_id)
        .eq('status', 'pendente');
    }

    return NextResponse.json({
      sucesso: true,
      expiradas: (expiradas || []).length,
    });
  } catch (error) {
    console.error('Erro na limpeza de pré-reservas:', error);
    return NextResponse.json({ error: 'Erro na limpeza' }, { status: 500 });
  }
}
