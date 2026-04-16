import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paymentClient, isMercadoPagoConfigured } from '@/lib/api/mercadopago/client';
import type { PixResponse } from '@/types/pagamentos';

const bodySchema = z.object({
  reservation_code: z.string().min(1, 'Código da reserva obrigatório'),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // 2. Validar body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const { reservation_code, email } = parsed.data;

    if (!isMercadoPagoConfigured()) {
      return NextResponse.json({ error: 'Sistema de pagamento não configurado.' }, { status: 500 });
    }

    const admin = createAdminClient();

    // 3. Buscar reserva
    const { data: reserva, error: reservaError } = await (admin
      .from('day_use_reservations') as any)
      .select('*')
      .eq('reservation_code', reservation_code)
      .single();

    if (reservaError || !reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    }

    if (reserva.status !== 'pending' || reserva.payment_status !== 'pending') {
      if (reserva.payment_status === 'confirmed') {
        return NextResponse.json({ error: 'Esta reserva já foi paga.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Status inválido para pagamento.' }, { status: 400 });
    }

    // 4. Reusar PIX se já existe
    if (reserva.pix_code) {
      return NextResponse.json({
        success: true,
        qr_code: reserva.pix_code,
        valor: Number(reserva.total_amount),
        expira_em: reserva.expires_at ?? undefined,
      } satisfies PixResponse);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const EMAIL_POUSADA = process.env.POUSADA_EMAIL || 'contato@pousadaxangrilademorros.com.br';
    const emailPagador = email ?? EMAIL_POUSADA;

    // 5. Criar pagamento no MP
    const payment = await paymentClient.create({
      body: {
        transaction_amount: Number(reserva.total_amount),
        description: `Day Use Pousada Xangrilá - ${reservation_code}`,
        payment_method_id: 'pix',
        external_reference: reservation_code,
        payer: {
          email: emailPagador,
          first_name: reserva.customer_name,
        },
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        metadata: {
          tipo: 'day_use',
          reservation_code,
        },
      },
    });

    const qrCode = payment.point_of_interaction?.transaction_data?.qr_code ?? null;
    const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;
    const ticketUrl = payment.point_of_interaction?.transaction_data?.ticket_url ?? null;

    if (!qrCode) {
      return NextResponse.json({ error: 'Erro ao gerar PIX. Tente novamente.' }, { status: 500 });
    }

    // 6. Salvar dados PIX
    await (admin.from('day_use_reservations') as any)
      .update({ pix_code: qrCode })
      .eq('reservation_code', reservation_code);

    return NextResponse.json({
      success: true,
      payment_id: payment.id ?? undefined,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64 ?? undefined,
      ticket_url: ticketUrl ?? undefined,
      valor: Number(reserva.total_amount),
      expira_em: reserva.expires_at ?? undefined,
    } satisfies PixResponse);
  } catch (err) {
    console.error('[DayUse PIX] Erro:', err);
    return NextResponse.json({ success: false, error: 'Erro interno ao gerar PIX.' }, { status: 500 });
  }
}
