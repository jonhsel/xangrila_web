import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD

    const admin = createAdminClient();

    // Buscar configuração ativa
    const { data: config, error } = await (admin
      .from('day_use_config') as any)
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !config) {
      return NextResponse.json({ error: 'Configuração de day use não encontrada.' }, { status: 404 });
    }

    let vagasRestantes = config.max_capacity;
    let gratuidades_restantes = config.daily_free_limit ?? 15;
    let vacasOcupadas = 0;
    let gratuidadesUsadas = 0;
    let tipo_dia: 'weekday' | 'weekend' | 'holiday' = 'weekday';
    let preco_dia = Number(config.price_weekday);

    if (date) {
      // Verificar se é feriado
      const { data: feriado } = await (admin
        .from('holidays') as any)
        .select('id')
        .eq('date', date)
        .single();

      // Verificar dia da semana (0=Dom, 6=Sab)
      const [ano, mes, dia] = date.split('-').map(Number);
      const diaSemana = new Date(ano, mes - 1, dia).getDay();
      const ehFimSemana = diaSemana === 0 || diaSemana === 6;

      if (feriado) {
        tipo_dia = 'holiday';
        preco_dia = Number(config.price_holiday ?? config.price_weekend);
      } else if (ehFimSemana) {
        tipo_dia = 'weekend';
        preco_dia = Number(config.price_weekend);
      }

      // Contar reservas do dia
      const { data: reservasDia } = await (admin
        .from('day_use_reservations') as any)
        .select('total_people, non_paying_people')
        .eq('reservation_date', date)
        .neq('status', 'cancelled');

      for (const r of (reservasDia || [])) {
        vacasOcupadas += Number(r.total_people || 0);
        gratuidadesUsadas += Number(r.non_paying_people || 0);
      }

      vagasRestantes = Math.max(0, config.max_capacity - vacasOcupadas);
      gratuidades_restantes = Math.max(0, (config.daily_free_limit ?? 15) - gratuidadesUsadas);
    }

    return NextResponse.json({
      config: {
        max_capacity: config.max_capacity,
        preco_dia,
        tipo_dia,
        opening_time: config.opening_time ?? '08:00:00',
        closing_time: config.closing_time ?? '18:00:00',
        max_people_per_reservation: config.max_people_per_reservation ?? 20,
        description: config.description ?? null,
        included_items: config.included_items ?? null,
        terms_and_conditions: config.terms_and_conditions ?? null,
        daily_free_limit: config.daily_free_limit ?? 15,
      },
      disponibilidade: {
        vagas_totais: config.max_capacity,
        vagas_ocupadas: vacasOcupadas,
        vagas_restantes: vagasRestantes,
        gratuidades_usadas: gratuidadesUsadas,
        gratuidades_restantes,
      },
    });
  } catch (err) {
    console.error('[DayUse Config] Erro:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
