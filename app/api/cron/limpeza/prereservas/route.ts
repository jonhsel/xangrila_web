import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Chamar a function SQL que faz toda a lógica no banco
    const { data, error } = await supabase.rpc('expirar_prereservas_pendentes');

    if (error) {
      console.error('[Cron Limpeza] Erro ao executar function SQL:', error);

      // Fallback: fazer a limpeza via API caso a function não exista
      return await fallbackLimpeza(supabase);
    }

    console.log('[Cron Limpeza] ✅ Resultado:', JSON.stringify(data));

    // Registrar execução no log
    await (supabase.from('job_logs') as any).insert({
      job_name: 'expirar_prereservas',
      status: 'success',
      detalhes: data,
      duracao_ms: 0,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Cron Limpeza] Erro geral:', error);

    return NextResponse.json(
      { error: 'Erro na limpeza de pré-reservas' },
      { status: 500 }
    );
  }
}

// Fallback caso a function SQL não exista ainda
async function fallbackLimpeza(supabase: ReturnType<typeof createAdminClient>) {
  try {
    // Marcar pré-reservas expiradas
    const { data: expiradas } = await (supabase
      .from('pre_reservas') as any)
      .update({ status: 'expirada', updated_at: new Date().toISOString() })
      .eq('status', 'aguardando_pagamento')
      .lt('expira_em', new Date().toISOString())
      .select('reserva_id');

    let totalCanceladas = 0;
    let totalBloqueiosRemovidos = 0;

    // Liberar bloqueios e cancelar reservas das expiradas
    for (const pr of (expiradas || [])) {
      // Remover bloqueios
      const { count } = await (supabase.from('disponibilidade_quartos') as any)
        .delete()
        .eq('reserva_referencia', pr.reserva_id);

      if (count) totalBloqueiosRemovidos++;

      // Cancelar reserva associada
      const { data: cancelada } = await (supabase.from('reservas_confirmadas') as any)
        .update({
          status: 'cancelada',
          observacoes: 'Cancelada automaticamente — pré-reserva expirada (pagamento não realizado)',
          updated_at: new Date().toISOString(),
        })
        .eq('reserva_id', pr.reserva_id)
        .eq('status', 'pendente')
        .select('reserva_id');

      if (cancelada?.length) {
        totalCanceladas++;

        // Registrar no histórico
        await (supabase.from('historico_status_reserva') as any).insert({
          reserva_id: pr.reserva_id,
          status_anterior: 'pendente',
          status_novo: 'cancelada',
          alterado_por: 'sistema_automatico',
          motivo: 'Pré-reserva expirada - pagamento não realizado (fallback API)',
        });
      }
    }

    const resultado = {
      sucesso: true,
      metodo: 'fallback_api',
      total_expiradas: (expiradas || []).length,
      total_canceladas: totalCanceladas,
      total_bloqueios_removidos: totalBloqueiosRemovidos,
    };

    console.log('[Cron Limpeza Fallback] ✅ Resultado:', JSON.stringify(resultado));
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('[Cron Limpeza Fallback] Erro:', error);
    return NextResponse.json({ error: 'Erro no fallback de limpeza' }, { status: 500 });
  }
}
