import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ClienteRow, ReservaRow, PreReservaRow } from '@/types';

// ============================================
// HELPER — Busca cliente de forma híbrida
// Suporta: OTP (telefone), Google OAuth (email), Email/Senha (email)
// Mesma lógica usada em /api/pagamentos/pix/gerar/route.ts
// ============================================

type ClienteBasico = Pick<ClienteRow, 'id_cliente'>;

async function buscarClienteHibrido(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userPhone: string | undefined,
  userEmail: string | undefined
): Promise<ClienteBasico | null> {

  // ── TENTATIVA 1: Busca por telefone (login OTP) ──────────────────────────
  if (userPhone && userPhone.trim() !== '') {
    const telefoneLimpo = userPhone.replace(/\D/g, '');

    const variantesBusca = [
      userPhone,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      telefoneLimpo.startsWith('55')
        ? telefoneLimpo.slice(2)
        : telefoneLimpo,
    ].filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientes } = await (admin
      .from('clientes_xngrl') as any)
      .select('id_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1) as { data: ClienteBasico[] | null; error: unknown };

    if (clientes && clientes.length > 0) {
      return clientes[0];
    }
  }

  // ── TENTATIVA 2: Busca por email (login Google OAuth ou Email/Senha) ─────
  if (userEmail && userEmail.trim() !== '') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientes } = await (admin
      .from('clientes_xngrl') as any)
      .select('id_cliente')
      .eq('email_cliente', userEmail)
      .limit(1) as { data: ClienteBasico[] | null; error: unknown };

    if (clientes && clientes.length > 0) {
      return clientes[0];
    }
  }

  return null;
}

// ============================================
// GET /api/reservas/[id]/status
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
    }

    const { id: reservaId } = await params;

    if (!reservaId) {
      return NextResponse.json({ erro: 'ID da reserva não informado.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 2. Buscar clienteId — LÓGICA HÍBRIDA (telefone + email)
    //    user.phone  → preenchido no login por OTP
    //    user.email  → preenchido no login por Google OAuth ou Email/Senha
    const cliente = await buscarClienteHibrido(
      admin,
      user.phone ?? undefined,
      user.email ?? undefined
    );

    if (!cliente) {
      console.error('[Status] Cliente não encontrado:', {
        phone: user.phone,
        email: user.email,
      });
      return NextResponse.json({ erro: 'Cliente não encontrado.' }, { status: 404 });
    }

    const clienteId = cliente.id_cliente;

    type ReservaSelect = Pick<ReservaRow, 'reserva_id' | 'status' | 'data_checkin' | 'data_checkout' | 'pessoas' | 'tipo_quarto' | 'valor_total' | 'valor_pago' | 'valor_restante' | 'created_at'>;
    type PreReservaSelect = Pick<PreReservaRow, 'reserva_id' | 'status' | 'expira_em' | 'valor_total' | 'valor_sinal' | 'data_checkin' | 'data_checkout' | 'pessoas' | 'tipo_quarto' | 'created_at'>;

    // 3. Buscar em reservas_confirmadas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reserva } = await (admin
      .from('reservas_confirmadas') as any)
      .select(
        'reserva_id, status, data_checkin, data_checkout, pessoas, tipo_quarto, valor_total, valor_pago, valor_restante, created_at'
      )
      .eq('reserva_id', reservaId)
      .eq('cliente_id', clienteId)
      .single() as { data: ReservaSelect | null; error: unknown };

    // 4. Buscar em pre_reservas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: preReserva } = await (admin
      .from('pre_reservas') as any)
      .select(
        'reserva_id, status, expira_em, valor_total, valor_sinal, data_checkin, data_checkout, pessoas, tipo_quarto, created_at'
      )
      .eq('reserva_id', reservaId)
      .eq('cliente_id', clienteId)
      .single() as { data: PreReservaSelect | null; error: unknown };

    if (!reserva && !preReserva) {
      return NextResponse.json({ erro: 'Reserva não encontrada.' }, { status: 404 });
    }

    // 5. Montar resposta unificada
    //    IMPORTANTE para o polling do pix-payment.tsx:
    //    - Se reserva existe com status='confirmada' → pagamento confirmado
    //    - Se só pre_reserva existe com status='aguardando_pagamento' → ainda esperando
    const dados = reserva
      ? {
          reservaId: reserva.reserva_id,
          status: reserva.status,
          dataCheckin: reserva.data_checkin,
          dataCheckout: reserva.data_checkout,
          pessoas: reserva.pessoas,
          tipoQuarto: reserva.tipo_quarto,
          valorTotal: reserva.valor_total,
          valorPago: reserva.valor_pago,
          valorRestante: reserva.valor_restante,
          origem: 'confirmada' as const,
          criadaEm: reserva.created_at,
        }
      : {
          reservaId: preReserva!.reserva_id,
          status: preReserva!.status,
          dataCheckin: preReserva!.data_checkin,
          dataCheckout: preReserva!.data_checkout,
          pessoas: preReserva!.pessoas,
          tipoQuarto: preReserva!.tipo_quarto,
          valorTotal: preReserva!.valor_total,
          valorSinal: preReserva!.valor_sinal,
          expiraEm: preReserva!.expira_em,
          origem: 'pre_reserva' as const,
          criadaEm: preReserva!.created_at,
        };

    return NextResponse.json(dados);
  } catch (err) {
    console.error('Erro em /api/reservas/[id]/status:', err);
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
  }
}
