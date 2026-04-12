import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';
import { ESTOQUE_POR_TIPO } from '@/types';
import type { TipoQuartoReserva } from '@/types';

const TIPOS_QUARTO: TipoQuartoReserva[] = ['Casa', 'Chalé - Com Cozinha', 'Chalé - Sem Cozinha'];

const CAPACIDADE_MAX: Record<TipoQuartoReserva, number> = {
  Casa: 6,
  'Chalé - Com Cozinha': 3,
  'Chalé - Sem Cozinha': 3,
};

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

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const { searchParams } = new URL(request.url);
    const data_checkin = searchParams.get('data_checkin');
    const data_checkout = searchParams.get('data_checkout');
    const tipo_quarto_filtro = searchParams.get('tipo_quarto');

    if (!data_checkin || !data_checkout) {
      return NextResponse.json({ error: 'data_checkin e data_checkout obrigatórios.' }, { status: 400 });
    }

    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(data_checkin) || !isoRegex.test(data_checkout)) {
      return NextResponse.json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' }, { status: 400 });
    }

    if (data_checkin >= data_checkout) {
      return NextResponse.json({ error: 'data_checkout deve ser após data_checkin.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const datas = gerarDatasIntervalo(data_checkin, data_checkout);

    const tiposConsultar = tipo_quarto_filtro
      ? TIPOS_QUARTO.filter((t) => t === tipo_quarto_filtro)
      : TIPOS_QUARTO;

    // Buscar reservas confirmadas sobrepostas ao período
    const { data: reservasOcupadas } = await (supabase
      .from('reservas_confirmadas') as any)
      .select('tipo_quarto, data_checkin, data_checkout')
      .lte('data_checkin', data_checkout)
      .gt('data_checkout', data_checkin)
      .not('status', 'in', '("cancelada")');

    // Buscar bloqueios definitivos (disponivel = false, reservado_temporario = false)
    const { data: bloqueios } = await (supabase
      .from('disponibilidade_quartos') as any)
      .select('tipo_quarto, data')
      .eq('disponivel', false)
      .eq('reservado_temporario', false)
      .in('data', datas);

    // Buscar preços por tipo
    const { data: acomodacoes } = await (supabase
      .from('acomodacoes') as any)
      .select('id, tipo, categoria, precos_acomodacoes(quantidade_pessoas, preco_diaria)')
      .eq('ativo', true);

    // Montar mapa de preço por tipo
    const precoPorTipo: Record<TipoQuartoReserva, number> = {
      Casa: 0,
      'Chalé - Com Cozinha': 0,
      'Chalé - Sem Cozinha': 0,
    };

    for (const acom of acomodacoes ?? []) {
      let tipoQuarto: TipoQuartoReserva;
      if (acom.tipo === 'Casa') {
        tipoQuarto = 'Casa';
      } else if (acom.categoria === 'com_cozinha') {
        tipoQuarto = 'Chalé - Com Cozinha';
      } else {
        tipoQuarto = 'Chalé - Sem Cozinha';
      }

      const precos = acom.precos_acomodacoes ?? [];
      if (precos.length > 0 && precoPorTipo[tipoQuarto] === 0) {
        // Pegar o preço base (menor qtd de pessoas ou primeiro)
        const ordenado = [...precos].sort(
          (a: { quantidade_pessoas: number }, b: { quantidade_pessoas: number }) =>
            a.quantidade_pessoas - b.quantidade_pessoas
        );
        precoPorTipo[tipoQuarto] = Number(ordenado[0].preco_diaria);
      }
    }

    const resultado = tiposConsultar.map((tipo) => {
      const estoqueTotal = ESTOQUE_POR_TIPO[tipo];

      // Calcular ocupados por data
      const detalhesPorDia = datas.map((data) => {
        // Contar reservas que cobrem esta data
        const reservasNaData = (reservasOcupadas ?? []).filter(
          (r: any) =>
            r.tipo_quarto === tipo &&
            r.data_checkin <= data &&
            r.data_checkout > data
        ).length;

        // Contar bloqueios definitivos nesta data
        const bloqueiosNaData = (bloqueios ?? []).filter(
          (b: any) => b.tipo_quarto === tipo && b.data === data
        ).length;

        const ocupados = Math.max(reservasNaData, bloqueiosNaData);
        const disponiveis = Math.max(0, estoqueTotal - ocupados);

        return { data, ocupados, disponiveis };
      });

      // Mínimo de disponíveis em qualquer dia do período
      const minDisponiveis = detalhesPorDia.reduce(
        (min, d) => Math.min(min, d.disponiveis),
        estoqueTotal
      );

      return {
        tipo,
        capacidade_max: CAPACIDADE_MAX[tipo],
        estoque_total: estoqueTotal,
        disponiveis: minDisponiveis,
        preco_diaria: precoPorTipo[tipo],
        detalhes_por_dia: detalhesPorDia,
      };
    });

    return NextResponse.json({ tipos: resultado });
  } catch (error) {
    console.error('Erro em /api/admin/disponibilidade:', error);
    return NextResponse.json({ error: 'Erro ao consultar disponibilidade.' }, { status: 500 });
  }
}
