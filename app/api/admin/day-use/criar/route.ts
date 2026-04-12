import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

const criarDayUseWalkInSchema = z.object({
  customer_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  phone_number: z.string().min(8, 'Telefone inválido'),
  reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  paying_people: z.number().int().min(1, 'Mínimo 1 pagante'),
  non_paying_details: z.object({
    idosos: z.number().int().min(0).default(0),
    pcd: z.number().int().min(0).default(0),
    criancas_ate_6: z.number().int().min(0).default(0),
  }),
  metodo_pagamento: z.enum(['dinheiro', 'cartao_fisico', 'transferencia', 'pix_manual']),
  valor_pago: z.number().min(0, 'Valor pago não pode ser negativo'),
  special_requests: z.string().optional(),
});

function gerarReservationCode(): string {
  const ano = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DU-${ano}-${suffix}`;
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

    const parsed = criarDayUseWalkInSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const {
      customer_name,
      phone_number,
      reservation_date,
      paying_people,
      non_paying_details,
      metodo_pagamento,
      valor_pago,
      special_requests,
    } = parsed.data;

    const supabase = createAdminClient();

    // 4. Buscar config ativa
    const { data: config, error: configError } = await (supabase
      .from('day_use_config') as any)
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: 'Day Use não disponível no momento.' }, { status: 400 });
    }

    const daily_free_limit = config.daily_free_limit ?? 15;

    // 5. Calcular isentos
    const total_non_paying =
      non_paying_details.idosos + non_paying_details.pcd + non_paying_details.criancas_ate_6;

    // 6. Verificar vagas e gratuidades no dia
    const { data: reservasDia } = await (supabase
      .from('day_use_reservations') as any)
      .select('total_people, non_paying_people')
      .eq('reservation_date', reservation_date)
      .neq('status', 'cancelled');

    let vagas_ocupadas = 0;
    let gratuidades_usadas = 0;
    for (const r of reservasDia || []) {
      vagas_ocupadas += Number(r.total_people || 0);
      gratuidades_usadas += Number(r.non_paying_people || 0);
    }

    if (total_non_paying + gratuidades_usadas > daily_free_limit) {
      return NextResponse.json(
        {
          error: `Limite de gratuidades atingido. Apenas ${Math.max(0, daily_free_limit - gratuidades_usadas)} cortesias restantes.`,
        },
        { status: 422 }
      );
    }

    // 7. Calcular total e verificar capacidade
    const total_people = paying_people + total_non_paying;

    if (vagas_ocupadas + total_people > config.max_capacity) {
      return NextResponse.json(
        {
          error: `Capacidade insuficiente. Apenas ${Math.max(0, config.max_capacity - vagas_ocupadas)} vagas restantes.`,
        },
        { status: 422 }
      );
    }

    // Determinar preço do dia
    const { data: feriado } = await (supabase
      .from('holidays') as any)
      .select('id')
      .eq('date', reservation_date)
      .maybeSingle();

    const [ano, mes, dia] = reservation_date.split('-').map(Number);
    const diaSemana = new Date(ano, mes - 1, dia).getDay();
    const ehFimSemana = diaSemana === 0 || diaSemana === 6;

    let price_per_person: number;
    if (feriado) {
      price_per_person = Number(config.price_holiday ?? config.price_weekend);
    } else if (ehFimSemana) {
      price_per_person = Number(config.price_weekend);
    } else {
      price_per_person = Number(config.price_weekday);
    }

    const total_amount = paying_people * price_per_person;

    // 8. Gerar código
    const reservation_code = gerarReservationCode();

    // 9. Inserir em day_use_reservations como confirmado
    const { error: insertError } = await (supabase
      .from('day_use_reservations') as any)
      .insert({
        reservation_code,
        customer_name,
        phone_number,
        reservation_date,
        number_of_people: paying_people,
        total_people,
        paying_people,
        non_paying_people: total_non_paying,
        price_per_person,
        total_amount,
        status: 'confirmed',
        payment_status: 'confirmed',
        payment_method: metodo_pagamento,
        confirmed_by: admin.nome,
        special_requests: special_requests ?? null,
        notes: JSON.stringify({
          ...non_paying_details,
          tipo: 'walk_in',
          valor_pago,
          registrado_por: admin.nome,
        }),
      });

    if (insertError) {
      console.error('[DayUse Walk-in] Erro ao inserir:', insertError);
      return NextResponse.json({ error: 'Erro ao criar reserva de day use.' }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      reservation_code,
      total_amount,
    });
  } catch (error) {
    console.error('[DayUse Walk-in] Erro:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
