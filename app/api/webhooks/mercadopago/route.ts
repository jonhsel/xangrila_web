import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paymentClient } from '@/lib/api/mercadopago/client';
import { resend, isEmailEnabled } from '@/lib/api/email/client';
import { gerarEmailConfirmacaoCliente } from '@/lib/api/email/templates/confirmacao-cliente';
import { gerarEmailNotificacaoPousada } from '@/lib/api/email/templates/notificacao-pousada';
import { POUSADA } from '@/lib/constants/pousada';
import type { WebhookMercadoPago } from '@/types/pagamentos';
import type { ReservaRow } from '@/types';

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

    // ============================================
    // ENVIO DE EMAILS (não falha o webhook se der erro)
    // ============================================
    if (isEmailEnabled()) {
      // Buscar dados completos da reserva e do cliente
      type ReservaCompleta = Pick<ReservaRow,
        'reserva_id' | 'cliente_id' | 'data_checkin' | 'data_checkout' |
        'pessoas' | 'tipo_quarto' | 'valor_total' | 'valor_pago' |
        'valor_restante' | 'observacoes'
      >;

      const { data: reserva } = (await admin
        .from('reservas_confirmadas')
        .select('reserva_id, cliente_id, data_checkin, data_checkout, pessoas, tipo_quarto, valor_total, valor_pago, valor_restante, observacoes')
        .eq('reserva_id', reservaId)
        .single()) as { data: ReservaCompleta | null; error: unknown };

      if (!reserva) {
        console.warn('[Webhook MP] Reserva não encontrada para envio de email');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cliente } = await (admin.from('clientes_xngrl') as any)
        .select('nome_cliente, telefonewhatsapp_cliente, email_cliente, total_reservas, valor_total_gasto')
        .eq('id_cliente', reserva.cliente_id)
        .single() as {
          data: {
            nome_cliente: string | null;
            telefonewhatsapp_cliente: string | null;
            email_cliente: string | null;
            total_reservas: number;
            valor_total_gasto: number;
          } | null;
        };

      // Calcular número de diárias
      const checkin = new Date(reserva.data_checkin);
      const checkout = new Date(reserva.data_checkout);
      const totalDiarias = Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));

      // Formatar datas
      const formatarData = (iso: string) => {
        const [ano, mes, dia] = iso.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
      };

      const dataCheckinFormatada = formatarData(reserva.data_checkin);
      const dataCheckoutFormatada = formatarData(reserva.data_checkout);
      const valorPago = Number(payment.transaction_amount);
      const valorRestante = Number(reserva.valor_restante);

      // Email para o cliente
      if (cliente?.email_cliente) {
        try {
          const emailCliente = gerarEmailConfirmacaoCliente({
            nomeCliente: cliente.nome_cliente || 'Cliente',
            reservaId: reserva.reserva_id,
            dataCheckin: dataCheckinFormatada,
            dataCheckout: dataCheckoutFormatada,
            tipoQuarto: reserva.tipo_quarto,
            pessoas: reserva.pessoas,
            totalDiarias,
            valorTotal: Number(reserva.valor_total),
            valorPago,
            valorRestante,
          });

          await resend!.emails.send({
            from: `${POUSADA.nome} <noreply@pousadaxangrila.com.br>`,
            to: cliente.email_cliente,
            subject: emailCliente.subject,
            html: emailCliente.html,
          });

          console.log(`[Webhook MP] Email de confirmação enviado para ${cliente.email_cliente}`);
        } catch (emailError) {
          console.error('[Webhook MP] Erro ao enviar email para cliente:', emailError);
        }
      } else {
        console.log('[Webhook MP] Cliente sem email cadastrado — email não enviado');
      }

      // Email para a pousada
      try {
        const emailPousada = gerarEmailNotificacaoPousada({
          reservaId: reserva.reserva_id,
          dataCheckin: dataCheckinFormatada,
          dataCheckout: dataCheckoutFormatada,
          tipoQuarto: reserva.tipo_quarto,
          pessoas: reserva.pessoas,
          totalDiarias,
          valorTotal: Number(reserva.valor_total),
          valorPago,
          valorRestante,
          observacoes: reserva.observacoes,
          nomeCliente: cliente?.nome_cliente || 'Cliente',
          telefoneCliente: cliente?.telefonewhatsapp_cliente || '',
          emailCliente: cliente?.email_cliente || null,
          totalReservasCliente: cliente?.total_reservas || 0,
          valorTotalGastoCliente: Number(cliente?.valor_total_gasto || 0),
          mercadoPagoPaymentId: paymentId,
          dataPagamento: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
          metodoPagamento: 'PIX',
        });

        await resend!.emails.send({
          from: `Sistema Xangrilá <noreply@pousadaxangrila.com.br>`,
          to: POUSADA.email,
          subject: emailPousada.subject,
          html: emailPousada.html,
        });

        console.log('[Webhook MP] Email de notificação enviado para a pousada');
      } catch (emailError) {
        console.error('[Webhook MP] Erro ao enviar email para pousada:', emailError);
      }
    }
  } catch (err) {
    console.error('[Webhook MP] Erro ao processar pagamento:', err);
  }
}
