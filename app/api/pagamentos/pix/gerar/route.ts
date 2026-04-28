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
// HELPER — Busca cliente de forma híbrida
// Suporta: OTP (telefone), Google OAuth, Email/Senha
// ============================================

type ClienteBasico = Pick<ClienteRow, 'id_cliente' | 'nome_cliente'>;

async function buscarCliente(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userPhone: string | undefined,
  userEmail: string | undefined
): Promise<ClienteBasico | null> {

  // ── TENTATIVA 1: Busca por telefone (login OTP) ──────────────────────────
  if (userPhone && userPhone.trim() !== '') {
    const telefoneLimpo = userPhone.replace(/\D/g, '');

    // Gerar variantes do número para cobrir diferentes formatos no banco
    const variantesBusca = [
      userPhone,                                              // ex: +5598981519965
      telefoneLimpo,                                          // ex: 5598981519965
      `+55${telefoneLimpo}`,                                  // ex: +555598981519965 (edge case)
      telefoneLimpo.startsWith('55')
        ? telefoneLimpo.slice(2)
        : telefoneLimpo,                                      // ex: 98981519965 (sem DDI)
    ].filter(Boolean);

    // Remover duplicatas
    const variantesUnicas = [...new Set(variantesBusca)];

    console.log('[PIX] Buscando cliente por telefone:', variantesUnicas);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientesPorTelefone } = await (admin.from('clientes_xngrl') as any)
      .select('id_cliente, nome_cliente')
      .in('telefonewhatsapp_cliente', variantesUnicas)
      .limit(1) as { data: ClienteBasico[] | null };

    if (clientesPorTelefone && clientesPorTelefone.length > 0) {
      console.log('[PIX] ✅ Cliente encontrado por telefone:', clientesPorTelefone[0].id_cliente);
      return clientesPorTelefone[0];
    }

    console.log('[PIX] ⚠️ Cliente não encontrado por telefone, tentando por email...');
  }

  // ── TENTATIVA 2: Busca por email (login Google ou Email/Senha) ────────────
  if (userEmail && userEmail.trim() !== '') {
    console.log('[PIX] Buscando cliente por email:', userEmail);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientesPorEmail } = await (admin.from('clientes_xngrl') as any)
      .select('id_cliente, nome_cliente')
      .eq('email_cliente', userEmail)
      .limit(1) as { data: ClienteBasico[] | null };

    if (clientesPorEmail && clientesPorEmail.length > 0) {
      console.log('[PIX] ✅ Cliente encontrado por email:', clientesPorEmail[0].id_cliente);
      return clientesPorEmail[0];
    }

    console.log('[PIX] ⚠️ Cliente não encontrado por email.');
  }

  // ── Não encontrou por nenhum método ──────────────────────────────────────
  console.error('[PIX] ❌ Cliente não encontrado. phone:', userPhone, '| email:', userEmail);
  return null;
}

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

    const { reservaId, email: emailOverride } = parsed.data;

    // 3. Verificar se Mercado Pago está configurado
    if (!isMercadoPagoConfigured()) {
      console.error('[PIX] MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Sistema de pagamento não configurado.' },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    // 4. Buscar clienteId — LÓGICA HÍBRIDA (telefone + email)
    //    user.phone  → preenchido no login por OTP
    //    user.email  → preenchido no login por Google OAuth ou Email/Senha
    const emailParaBusca = emailOverride ?? user.email ?? undefined;

    const cliente = await buscarCliente(admin, user.phone ?? undefined, emailParaBusca);

    if (!cliente) {
      return NextResponse.json(
        {
          error: 'Cliente não encontrado. Verifique se seu cadastro está completo.',
          debug: process.env.NODE_ENV === 'development'
            ? { phone: user.phone, email: emailParaBusca }
            : undefined,
        },
        { status: 404 }
      );
    }

    // 5. Buscar pré-reserva e validar pertencimento
    type PreReservaSelect = Pick<
      PreReservaRow,
      'reserva_id' | 'status' | 'valor_sinal' | 'valor_total' | 'expira_em' | 'cliente_id' | 'chave_pix'
    >;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: preReserva } = await (admin.from('pre_reservas') as any)
      .select('reserva_id, status, valor_sinal, valor_total, expira_em, cliente_id, chave_pix')
      .eq('reserva_id', reservaId)
      .single() as { data: PreReservaSelect | null; error: unknown };

    if (!preReserva) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    }

    // 6. Validar que a reserva pertence ao usuário autenticado
    if (preReserva.cliente_id !== cliente.id_cliente) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // 7. Validar status da pré-reserva
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

    // 8. Se já tem chave_pix gerada, retornar sem criar novo pagamento
    if (preReserva.chave_pix) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: preReservaCompleta } = await (admin.from('pre_reservas') as any)
        .select('chave_pix, pix_payload, qr_code_url, valor_sinal, expira_em')
        .eq('reserva_id', reservaId)
        .single() as {
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
        const pixResp: PixResponse = {
          success: true,
          qr_code: preReservaCompleta.chave_pix,
          qr_code_base64: preReservaCompleta.pix_payload ?? undefined,
          ticket_url: preReservaCompleta.qr_code_url ?? undefined,
          valor: Number(preReservaCompleta.valor_sinal ?? 0),
          expira_em: preReservaCompleta.expira_em ?? undefined,
        };
        return NextResponse.json(pixResp);
      }
    }

    // 9. Determinar email para o Mercado Pago
    //    MP exige um email válido — usar o do usuário ou um temporário
    const emailMP =
      emailParaBusca ??
      `cliente-${cliente.id_cliente}@pousadaxangrila.temp.br`;

    // 10. Criar pagamento PIX no Mercado Pago
    const valorSinal = Number(preReserva.valor_sinal ?? 0);
    if (valorSinal <= 0) {
      return NextResponse.json({ error: 'Valor de pagamento inválido.' }, { status: 400 });
    }

    const expiraEm = preReserva.expira_em ? new Date(preReserva.expira_em) : null;
    const agora = new Date();
    const minutosRestantes = expiraEm
      ? Math.floor((expiraEm.getTime() - agora.getTime()) / 60000)
      : 30;
    const minutosValidos = Math.max(5, Math.min(minutosRestantes, 30));

    console.log('[PIX] Criando pagamento MP para reserva:', reservaId, '| Valor:', valorSinal);

    const pagamento = await paymentClient.create({
      body: {
        transaction_amount: valorSinal,
        description: `Reserva ${reservaId} - Pousada Xangrila`,
        payment_method_id: 'pix',
        date_of_expiration: new Date(
          agora.getTime() + minutosValidos * 60 * 1000
        ).toISOString(),
        external_reference: reservaId,
        payer: {
          email: emailMP,
          first_name: cliente.nome_cliente ?? 'Cliente',
        },
      },
    });

    console.log('[PIX] Resposta MP:', {
      id: pagamento.id,
      status: pagamento.status,
    });

    const pixData = pagamento.point_of_interaction?.transaction_data;

    if (!pixData?.qr_code) {
      console.error('[PIX] MP não retornou QR Code:', pagamento);
      return NextResponse.json(
        { error: 'Erro ao gerar PIX. Tente novamente.' },
        { status: 500 }
      );
    }

    // 11. Salvar dados do PIX na pré-reserva
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('pre_reservas') as any)
      .update({
        chave_pix: pixData.qr_code,
        pix_payload: pixData.qr_code_base64 ?? null,
        qr_code_url: pixData.ticket_url ?? null,
      })
      .eq('reserva_id', reservaId);

    console.log('[PIX] ✅ PIX gerado e salvo para reserva:', reservaId);

    // 12. Retornar dados para o frontend
    const resposta: PixResponse = {
      success: true,
      payment_id: pagamento.id ?? undefined,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64 ?? undefined,
      ticket_url: pixData.ticket_url ?? undefined,
      valor: valorSinal,
      expira_em: preReserva.expira_em ?? undefined,
    };

    return NextResponse.json(resposta);

  } catch (error) {
    console.error('[PIX] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}