import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';
import { ESTOQUE_POR_TIPO } from '@/types';
import type { TipoQuartoReserva } from '@/types';

const criarReservaWalkInSchema = z.object({
  nome_cliente: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone_cliente: z.string().min(10, 'Telefone inválido'),
  email_cliente: z.string().email('Email inválido').optional().or(z.literal('')),
  data_checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  data_checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  pessoas: z.number().int().min(1).max(6),
  tipo_quarto: z.enum(['Casa', 'Chalé - Com Cozinha', 'Chalé - Sem Cozinha']),
  metodo_pagamento: z.enum(['dinheiro', 'cartao_fisico', 'transferencia', 'pix_manual']),
  valor_total: z.number().positive('Valor deve ser positivo'),
  valor_pago: z.number().min(0, 'Valor pago não pode ser negativo'),
  observacoes: z.string().optional(),
});

function gerarReservaId(): string {
  const ano = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PXL-${ano}-${suffix}`;
}

// Gera array de datas entre checkin (inclusivo) e checkout (exclusivo)
function gerarDatasIntervalo(checkin: string, checkout: string): string[] {
  const datas: string[] = [];
  const inicio = new Date(checkin + 'T12:00:00');
  const fim = new Date(checkout + 'T12:00:00');
  const atual = new Date(inicio);

  while (atual < fim) {
    datas.push(atual.toISOString().split('T')[0]);
    atual.setDate(atual.getDate() + 1);
  }
  return datas;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação admin
    const { admin } = await verificarAdmin();

    // 2. Verificar permissão
    if (!admin.pode_cadastrar_reservas && admin.nivel_acesso !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão para cadastrar reservas.' },
        { status: 403 }
      );
    }

    // 3. Validar body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }

    const parsed = criarReservaWalkInSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const {
      nome_cliente,
      telefone_cliente,
      email_cliente,
      data_checkin,
      data_checkout,
      pessoas,
      tipo_quarto,
      metodo_pagamento,
      valor_total,
      valor_pago,
      observacoes,
    } = parsed.data;

    if (data_checkin >= data_checkout) {
      return NextResponse.json(
        { error: 'Data de checkout deve ser após o checkin.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 4. Buscar ou criar cliente por telefone
    const telefoneLimpo = telefone_cliente.replace(/\D/g, '');
    const variantesBusca = Array.from(new Set([
      telefone_cliente,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      telefoneLimpo.startsWith('55') ? telefoneLimpo.slice(2) : telefoneLimpo,
    ]));

    const { data: clientes } = await (supabase.from('clientes_xngrl') as any)
      .select('id_cliente, nome_cliente, email_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1);

    let clienteId: number;

    if (clientes && clientes.length > 0) {
      clienteId = clientes[0].id_cliente;

      // Atualizar nome e email se fornecidos
      const updateData: Record<string, string> = {};
      if (nome_cliente) updateData.nome_cliente = nome_cliente;
      if (email_cliente) updateData.email_cliente = email_cliente;

      if (Object.keys(updateData).length > 0) {
        await (supabase.from('clientes_xngrl') as any)
          .update(updateData)
          .eq('id_cliente', clienteId);
      }
    } else {
      // Criar novo cliente
      const { data: novoCliente, error: insertClienteError } = await (supabase
        .from('clientes_xngrl') as any)
        .insert({
          nome_cliente,
          telefonewhatsapp_cliente: telefone_cliente,
          email_cliente: email_cliente || null,
        })
        .select('id_cliente')
        .single();

      if (insertClienteError || !novoCliente) {
        console.error('Erro ao criar cliente:', insertClienteError);
        return NextResponse.json({ error: 'Erro ao cadastrar cliente.' }, { status: 500 });
      }

      clienteId = novoCliente.id_cliente;
    }

    // 5. Verificar disponibilidade
    const tipo = tipo_quarto as TipoQuartoReserva;
    const estoqueTotal = ESTOQUE_POR_TIPO[tipo];
    const datas = gerarDatasIntervalo(data_checkin, data_checkout);

    // Contar reservas sobrepostas
    const { data: reservasOcupadas } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('tipo_quarto')
      .eq('tipo_quarto', tipo_quarto)
      .lte('data_checkin', data_checkout)
      .gt('data_checkout', data_checkin)
      .not('status', 'in', '("cancelada")');

    const reservasCount = reservasOcupadas?.length ?? 0;

    // Contar bloqueios definitivos no período
    const { data: bloqueiosDef } = await (supabase
      .from('disponibilidade_quartos') as any)
      .select('data')
      .eq('tipo_quarto', tipo_quarto)
      .eq('disponivel', false)
      .eq('reservado_temporario', false)
      .in('data', datas);

    // Contar bloqueios únicos por dia com reserva diferente
    const bloqueiosCount = bloqueiosDef?.length ?? 0;

    const ocupados = Math.max(reservasCount, bloqueiosCount > 0 ? 1 : 0);

    if (ocupados >= estoqueTotal) {
      return NextResponse.json(
        {
          error: `Não há ${tipo_quarto} disponível para o período selecionado.`,
          disponiveis: 0,
          estoque_total: estoqueTotal,
        },
        { status: 409 }
      );
    }

    // 6. Gerar reserva_id
    const reservaId = gerarReservaId();

    // 7. Inserir diretamente em reservas_confirmadas
    const obsCompleta = `[Reserva presencial por ${admin.nome}]${observacoes ? ' ' + observacoes : ''}`;
    const valorRestante = Math.max(0, valor_total - valor_pago);

    const { error: insertReservaError } = await (supabase
      .from('reservas_confirmadas') as any)
      .insert({
        reserva_id: reservaId,
        cliente_id: clienteId,
        data_checkin,
        data_checkout,
        pessoas,
        tipo_quarto,
        valor_total,
        valor_pago,
        // valor_restante é coluna gerada (GENERATED ALWAYS AS valor_total - valor_pago)
        status: 'confirmada',
        metodo_pagamento,
        observacoes: obsCompleta,
        created_at: new Date().toISOString(),
      });

    if (insertReservaError) {
      console.error('Erro ao criar reserva:', insertReservaError);
      return NextResponse.json({ error: 'Erro ao criar reserva.' }, { status: 500 });
    }

    // 8. Criar bloqueios definitivos na disponibilidade_quartos
    const bloqueiosParaInserir = datas.map((data) => ({
      data,
      tipo_quarto,
      disponivel: false,
      reservado_temporario: false,
      reservado_temp_ate: null,
      reserva_referencia: reservaId,
      observacoes: `Walk-in por ${admin.nome}`,
    }));

    const { error: bloqueioError } = await (supabase
      .from('disponibilidade_quartos') as any)
      .upsert(bloqueiosParaInserir, {
        onConflict: 'data,tipo_quarto,reserva_referencia',
        ignoreDuplicates: false,
      });

    if (bloqueioError) {
      console.warn('Aviso: erro ao criar bloqueios de disponibilidade:', bloqueioError);
      // Não retornar erro — reserva já foi criada
    }

    // 9. Registrar no historico_status_reserva
    await (supabase.from('historico_status_reserva') as any)
      .insert({
        reserva_id: reservaId,
        status_anterior: null,
        status_novo: 'confirmada',
        alterado_por: admin.nome,
        motivo: 'Reserva presencial (walk-in)',
        detalhes: { metodo_pagamento, valor_pago, tipo: 'walk_in' },
      });

    // 10. Criar notificação se email disponível
    if (email_cliente) {
      try {
        await (supabase.from('notificacoes_pendentes') as any)
          .insert({
            tipo: 'email',
            destinatario: email_cliente,
            assunto: `Confirmação de reserva ${reservaId}`,
            conteudo: JSON.stringify({
              reserva_id: reservaId,
              nome_cliente,
              data_checkin,
              data_checkout,
              tipo_quarto,
              pessoas,
              valor_total,
              metodo_pagamento,
            }),
            status: 'pendente',
          });
      } catch (notifError) {
        console.warn('Aviso: não foi possível criar notificação:', notifError);
      }
    }

    return NextResponse.json({
      sucesso: true,
      reservaId,
      valorTotal: valor_total,
      valorPago: valor_pago,
      valorRestante,
    });
  } catch (error) {
    console.error('Erro ao criar reserva walk-in:', error);
    return NextResponse.json({ error: 'Erro interno ao criar reserva.' }, { status: 500 });
  }
}
