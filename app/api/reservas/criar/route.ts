import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { gerarCodigoReserva } from '@/lib/utils';
import type { VerificarReservaResponse, ClienteRow } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
    }

    // 2. Ler body
    const body = await request.json();
    const {
      dataCheckin,
      dataCheckout,
      pessoas,
      tipoQuarto,
      valorTotal,
      observacoes,
      nomeCliente,
    } = body;

    if (!dataCheckin || !dataCheckout || !pessoas || !tipoQuarto || !valorTotal) {
      return NextResponse.json({ erro: 'Dados incompletos.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 3. Buscar clienteId pelo telefone do usuário autenticado
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
      .select('id_cliente, nome_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1) as { data: Pick<ClienteRow, 'id_cliente' | 'nome_cliente'>[] | null };

    let clienteId: number;

    if (clientes && clientes.length > 0) {
      clienteId = clientes[0].id_cliente;

      // Atualizar nome se fornecido
      if (nomeCliente && nomeCliente.trim().length >= 3) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin.from('clientes_xngrl') as any)
          .update({ nome_cliente: nomeCliente.trim() })
          .eq('id_cliente', clienteId);
      }
    } else {
      // Criar cliente se não existir
      const { data: novoCliente, error: insertError } = await admin
        .from('clientes_xngrl')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ nome_cliente: nomeCliente?.trim() ?? telefone, telefonewhatsapp_cliente: telefone } as any)
        .select('id_cliente')
        .single() as { data: Pick<ClienteRow, 'id_cliente'> | null; error: unknown };

      if (insertError || !novoCliente) {
        console.error('Erro ao criar cliente:', insertError);
        return NextResponse.json({ erro: 'Erro ao cadastrar cliente.' }, { status: 500 });
      }
      clienteId = novoCliente.id_cliente;
    }

    // 4. Gerar ID da reserva
    const reservaId = gerarCodigoReserva();

    // 5. Calcular valores
    const valorSinal = Math.round(valorTotal * 0.5 * 100) / 100;
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    // 6. Chamar function SQL verificar_e_criar_reserva
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: resultadoRpc, error: rpcError } = await (admin.rpc as any)(
      'verificar_e_criar_reserva',
      {
        p_data_checkin: dataCheckin,
        p_data_checkout: dataCheckout,
        p_pessoas: pessoas,
        p_tipo_quarto: tipoQuarto,
        p_cliente_id: clienteId,
        p_reserva_id: reservaId,
        p_valor_total: valorTotal,
      }
    );

    if (rpcError) {
      console.error('Erro em verificar_e_criar_reserva:', rpcError);
      return NextResponse.json({ erro: 'Erro ao processar reserva.' }, { status: 500 });
    }

    const resultado = resultadoRpc as VerificarReservaResponse;

    if (!resultado?.sucesso) {
      return NextResponse.json(
        { erro: resultado?.erro ?? 'Não foi possível criar a reserva.' },
        { status: 422 }
      );
    }

    // 7. Calcular total de diárias
    const checkinDate = new Date(dataCheckin);
    const checkoutDate = new Date(dataCheckout);
    const totalDiarias = Math.max(
      1,
      Math.round((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // 8. Inserir em pre_reservas para tracking de pagamento e trigger de notificação
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: preReservaError } = await (admin.from('pre_reservas') as any).insert({
      reserva_id: reservaId,
      cliente_id: clienteId,
      data_checkin: dataCheckin,
      data_checkout: dataCheckout,
      pessoas,
      tipo_quarto: tipoQuarto,
      total_diarias: totalDiarias,
      valor_total: valorTotal,
      valor_sinal: valorSinal,
      status: 'aguardando_pagamento',
      expira_em: expiraEm,
      observacoes: observacoes ?? null,
    });

    if (preReservaError) {
      // Log mas não falha — reserva já foi criada na tabela principal
      console.warn('Aviso: falha ao inserir pre_reserva:', preReservaError);
    }

    return NextResponse.json({
      sucesso: true,
      reservaId,
      valorTotal,
      valorSinal,
      expiraEm,
    });
  } catch (err) {
    console.error('Erro em /api/reservas/criar:', err);
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
  }
}
