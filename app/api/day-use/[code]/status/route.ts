import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const admin = createAdminClient();

    const { data: reserva, error } = await (admin
      .from('day_use_reservations') as any)
      .select('reservation_code, status, payment_status, total_amount')
      .eq('reservation_code', code)
      .single();

    if (error || !reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({
      reservation_code: reserva.reservation_code,
      status: reserva.status,
      payment_status: reserva.payment_status,
      total_amount: Number(reserva.total_amount),
    });
  } catch (err) {
    console.error('[DayUse Status] Erro:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
