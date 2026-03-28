import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================
// ENDPOINT DE TESTE — APENAS EM DESENVOLVIMENTO
// Simula a confirmação de pagamento sem depender do webhook do Mercado Pago.
// REMOVER antes do deploy ou manter protegido por NODE_ENV.
// ============================================

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Não disponível em produção.' }, { status: 403 });
  }

  let reservaId: string;
  try {
    const body = await request.json();
    reservaId = body.reservaId;
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  if (!reservaId) {
    return NextResponse.json({ error: 'reservaId obrigatório.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Atualizar reservas_confirmadas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: erroReserva } = await (admin.from('reservas_confirmadas') as any)
    .update({
      status: 'confirmada',
      valor_pago: 0, // valor simbólico para teste
    })
    .eq('reserva_id', reservaId);

  if (erroReserva) {
    console.error('[TEST] Erro ao atualizar reservas_confirmadas:', erroReserva);
    return NextResponse.json({ error: 'Erro ao confirmar reserva.', detail: erroReserva }, { status: 500 });
  }

  // Atualizar pre_reservas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('pre_reservas') as any)
    .update({ status: 'pago' })
    .eq('reserva_id', reservaId);

  console.log(`[TEST] ✅ Reserva ${reservaId} confirmada manualmente (simulação de teste)`);

  return NextResponse.json({ success: true, reservaId });
}
