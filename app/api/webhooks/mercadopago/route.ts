import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paymentClient } from '@/lib/api/mercadopago/client';
import type { WebhookMercadoPago } from '@/types/pagamentos';
import type { ReservaRow, PreReservaRow } from '@/types';

// ============================================
// POST — Webhook do Mercado Pago
// Este endpoint DEVE ser público (sem autenticação).
// O Mercado Pago precisa chamá-lo diretamente.
// ============================================

export async function POST(request: NextRequest) {
  // Responder 200 IMEDIATAMENTE — o Mercado Pago espera resposta rápida
  // O processamento real acontece de forma assíncrona
  const response = NextResponse.json({ received: true }, { status: 200 });

  // Processar de forma assíncrona sem bloquear a resposta
  processarWebhook(request).catch((err) => {
    console.error('[Webhook MP] Erro não tratado no processamento:', err);
  });

  return response;
}

async function processarWebhook(request: NextRequest): Promise<void> {
  let body: WebhookMercadoPago;

  try {
    body = (await request.json()) as WebhookMercadoPago;
  } catch {
    console.error('[Webhook MP] Body inválido');
    return;
  }

  console.log('[Webhook MP] Notificação recebida:', JSON.stringify({
    type: body.type,
    action: body.action,
    paymentId: body.data?.id,
    liveMode: body.live_mode,
  }));

  // Processar apenas notificações de pagamento
  if (body.type !== 'payment') {
    console.log(`[Webhook MP] Tipo ignorado: ${body.type}`);
    return;
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    console.error('[Webhook MP] Sem payment_id no body');
    return;
  }

  try {
    // Buscar detalhes reais do pagamento na API do MP
    // NUNCA confiar apenas nos dados do body — sempre validar na fonte
    const payment = await paymentClient.get({ id: Number(paymentId) });

    console.log('[Webhook MP] Status do pagamento:', {
      id: payment.id,
      status: payment.status,
      externalReference: payment.external_reference,
      amount: payment.transaction_amount,
    });

    // Processar apenas pagamentos aprovados
    if (payment.status !== 'approved') {
      console.log(`[Webhook MP] Pagamento ${paymentId} não aprovado: ${payment.status}`);
      return;
    }

    const reservaId = payment.external_reference;
    if (!reservaId) {
      console.error('[Webhook MP] Sem external_reference no pagamento');
      return;
    }

    const admin = createAdminClient();

    // Verificar se a reserva já foi confirmada (proteção contra replay)
    type ReservaSelect = Pick<ReservaRow, 'reserva_id' | 'status'>;
    const { data: reservaAtual } = (await admin
      .from('reservas_confirmadas')
      .select('reserva_id, status')
      .eq('reserva_id', reservaId)
      .single()) as { data: ReservaSelect | null; error: unknown };

    if (reservaAtual?.status === 'confirmada') {
      console.log(`[Webhook MP] Reserva ${reservaId} já confirmada — ignorando`);
      return;
    }

    // Atualizar reservas_confirmadas
    // O trigger trigger_notificar_reserva_confirmada dispara automaticamente ao mudar status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: erroReserva } = await (admin.from('reservas_confirmadas') as any)
      .update({
        valor_pago: payment.transaction_amount,
        status: 'confirmada',
      })
      .eq('reserva_id', reservaId);

    if (erroReserva) {
      console.error('[Webhook MP] Erro ao atualizar reservas_confirmadas:', erroReserva);
      return;
    }

    // Atualizar pre_reservas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: erroPreReserva } = await (admin.from('pre_reservas') as any)
      .update({ status: 'pago' })
      .eq('reserva_id', reservaId);

    if (erroPreReserva) {
      console.error('[Webhook MP] Erro ao atualizar pre_reservas:', erroPreReserva);
      // Não retornar erro aqui — a reserva principal já foi confirmada
    }

    console.log(`[Webhook MP] ✅ Reserva ${reservaId} confirmada com sucesso — Pagamento MP: ${payment.id}`);
  } catch (err) {
    console.error('[Webhook MP] Erro ao processar pagamento:', err);
  }
}
