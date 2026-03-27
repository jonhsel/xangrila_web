import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ClienteRow, ReservaRow, PreReservaRow } from '@/types';

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

    // 2. Buscar clienteId do usuário autenticado
    const telefone = user.phone ?? '';
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const variantesBusca = [
      telefone,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      telefoneLimpo.startsWith('55') ? telefoneLimpo.slice(2) : telefoneLimpo,
    ].filter(Boolean);

    const { data: clientes } = await admin
      .from('clientes_xngrl')
      .select('id_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1) as { data: Pick<ClienteRow, 'id_cliente'>[] | null };

    if (!clientes || clientes.length === 0) {
      return NextResponse.json({ erro: 'Cliente não encontrado.' }, { status: 404 });
    }

    const clienteId = clientes[0].id_cliente;

    type ReservaSelect = Pick<ReservaRow, 'reserva_id' | 'status' | 'data_checkin' | 'data_checkout' | 'pessoas' | 'tipo_quarto' | 'valor_total' | 'valor_pago' | 'valor_restante' | 'created_at'>;
    type PreReservaSelect = Pick<PreReservaRow, 'reserva_id' | 'status' | 'expira_em' | 'valor_total' | 'valor_sinal' | 'data_checkin' | 'data_checkout' | 'pessoas' | 'tipo_quarto' | 'created_at'>;

    // 3. Buscar em reservas_confirmadas
    const { data: reserva } = await admin
      .from('reservas_confirmadas')
      .select(
        'reserva_id, status, data_checkin, data_checkout, pessoas, tipo_quarto, valor_total, valor_pago, valor_restante, created_at'
      )
      .eq('reserva_id', reservaId)
      .eq('cliente_id', clienteId)
      .single() as { data: ReservaSelect | null; error: unknown };

    // 4. Buscar em pre_reservas
    const { data: preReserva } = await admin
      .from('pre_reservas')
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
