import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paymentClient, isMercadoPagoConfigured } from '@/lib/api/mercadopago/client';
import type { PreReservaRow, ClienteRow } from '@/types';
import type { PixResponse } from '@/types/pagamentos';

// ============================================
// VALIDAÇÃO
// ============================================

const bodySchema = z.object({
  reservaId: z.string().min(1, 'reservaId é obrigatório'),
  email: z.string().email().optional(),
});

// ============================================
// POST — Gerar PIX via Mercado Pago
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // 2. Validar body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const { reservaId, email } = parsed.data;

    // 3. Verificar se Mercado Pago está configurado
    if (!isMercadoPagoConfigured()) {
      console.error('[PIX] MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Sistema de pagamento não configurado.' },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    // 4. Buscar clienteId do usuário autenticado
    const telefone = user.phone ?? '';
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const variantesBusca = [
      telefone,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      telefoneLimpo.startsWith('55') ? telefoneLimpo.slice(2) : telefoneLimpo,
    ].filter(Boolean);

    const { data: clientes } = (await admin
      .from('clientes_xngrl')
      .select('id_cliente, nome_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1)) as { data: Pick<ClienteRow, 'id_cliente' | 'nome_cliente'>[] | null };

    if (!clientes || clientes.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const cliente = clientes[0] as Pick<ClienteRow, 'id_cliente' | 'nome_cliente'>;

    // 5. Buscar pré-reserva e validar pertencimento
    type PreReservaSelect = Pick<
      PreReservaRow,
      'reserva_id' | 'status' | 'valor_sinal' | 'valor_total' | 'expira_em' | 'cliente_id' | 'chave_pix'
    >;

    const { data: preReserva } = (await admin
      .from('pre_reservas')
      .select('reserva_id, status, valor_sinal, valor_total, expira_em, cliente_id, chave_pix')
      .eq('reserva_id', reservaId)
      .single()) as { data: PreReservaSelect | null; error: unknown };

    if (!preReserva) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    }

    // 6. Validar que a reserva pertence ao usuário autenticado
    if (preReserva.cliente_id !== cliente.id_cliente) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // 7. Validar status
    if (preReserva.status !== 'aguardando_pagamento') {
      if (preReserva.status === 'pago') {
        return NextResponse.json({ error: 'Esta reserva já foi paga.' }, { status: 400 });
      }
      if (preReserva.status === 'expirado' || preReserva.status === 'cancelado') {
        return NextResponse.json(
          { error: 'Esta reserva expirou ou foi cancelada.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Status de reserva inválido para pagamento.' }, { status: 400 });
    }

    // 8. Se já tem chave_pix gerada anteriormente, retornar sem criar novo pagamento
    // (evita duplicar pagamentos no Mercado Pago)
    if (preReserva.chave_pix) {
      const { data: preReservaCompleta } = (await admin
        .from('pre_reservas')
        .select('chave_pix, pix_payload, qr_code_url, valor_sinal, expira_em')
        .eq('reserva_id', reservaId)
        .single()) as {
        data: {
          chave_pix: string;
          pix_payload: string | null;
          qr_code_url: string | null;
          valor_sinal: number | null;
          expira_em: string | null;
        } | null;
        error: unknown;
      };

      if (preReservaCompleta?.chave_pix) {
        return NextResponse.json({
          success: true,
          qr_code: preReservaCompleta.chave_pix,
          qr_code_base64: preReservaCompleta.pix_payload ?? undefined,
          ticket_url: preReservaCompleta.qr_code_url ?? undefined,
          valor: Number(preReservaCompleta.valor_sinal ?? 0),
          expira_em: preReservaCompleta.expira_em ?? undefined,
        } satisfies PixResponse);
      }
    }

    // 9. Montar email do pagador
    // clientes_xngrl não armazena email — usar email fornecido ou gerar temporário
    const emailPagador = email ?? 'jonhselmo.engcomp@gmail.com';

    const nomeCliente = cliente.nome_cliente ?? 'Hóspede';

    // 10. Criar pagamento PIX no Mercado Pago
    // O external_reference liga o pagamento à reserva — CRUCIAL para o webhook
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const payment = await paymentClient.create({
      body: {
        transaction_amount: Number(preReserva.valor_sinal),
        description: `Sinal - Reserva Pousada Xangrilá ${reservaId}`,
        payment_method_id: 'pix',
        external_reference: reservaId,
        payer: {
          email: emailPagador,
          first_name: nomeCliente,
        },
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        metadata: {
          reserva_id: reservaId,
          tipo: 'sinal_reserva',
          cliente_id: preReserva.cliente_id,
        },
      },
    });

    // 11. Extrair dados do QR Code
    const qrCode = payment.point_of_interaction?.transaction_data?.qr_code ?? null;
    const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;
    const ticketUrl = payment.point_of_interaction?.transaction_data?.ticket_url ?? null;

    if (!qrCode) {
      console.error('[PIX] Mercado Pago não retornou qr_code:', JSON.stringify(payment));
      return NextResponse.json(
        { error: 'Erro ao gerar PIX. Tente novamente.' },
        { status: 500 }
      );
    }

    // 12. Salvar dados PIX na pre_reserva
    // cast necessário: Supabase JS v2.100+ infere never em .update() — ver CLAUDE.md
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('pre_reservas') as any)
      .update({ chave_pix: qrCode, pix_payload: qrCodeBase64, qr_code_url: ticketUrl })
      .eq('reserva_id', reservaId);

    console.log(`[PIX] Pagamento criado para reserva ${reservaId} — MP ID: ${payment.id}`);

    return NextResponse.json({
      success: true,
      payment_id: payment.id ?? undefined,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64 ?? undefined,
      ticket_url: ticketUrl ?? undefined,
      valor: Number(preReserva.valor_sinal),
      expira_em: preReserva.expira_em ?? undefined,
    } satisfies PixResponse);
  } catch (err) {
    console.error('[PIX] Erro em /api/pagamentos/pix/gerar:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao gerar PIX.' },
      { status: 500 }
    );
  }
}
