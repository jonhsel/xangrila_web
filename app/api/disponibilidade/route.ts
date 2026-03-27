import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ESTOQUE_POR_TIPO } from '@/types';
import type { TipoQuartoReserva } from '@/types';
import type { ValidarReservaResponse } from '@/types';

// Mapeamento de tipo_acomodacao (pacotes) → tipo_quarto (reservas)
const MAPA_PACOTE_PARA_QUARTO: Record<string, TipoQuartoReserva> = {
  chale_com_cozinha: 'Chalé - Com Cozinha',
  chale_sem_cozinha: 'Chalé - Sem Cozinha',
  casa: 'Casa',
};

const MAPA_QUARTO_PARA_PACOTE: Record<TipoQuartoReserva, string> = {
  'Chalé - Com Cozinha': 'chale_com_cozinha',
  'Chalé - Sem Cozinha': 'chale_sem_cozinha',
  Casa: 'casa',
};

const CAPACIDADE_MAX: Record<TipoQuartoReserva, number> = {
  Casa: 6,
  'Chalé - Com Cozinha': 3,
  'Chalé - Sem Cozinha': 3,
};

const TIPOS_QUARTO: TipoQuartoReserva[] = ['Casa', 'Chalé - Com Cozinha', 'Chalé - Sem Cozinha'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');

  if (!checkin || !checkout) {
    return NextResponse.json({ erro: 'Parâmetros checkin e checkout obrigatórios.' }, { status: 400 });
  }

  // Validar formato YYYY-MM-DD
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(checkin) || !isoRegex.test(checkout)) {
    return NextResponse.json({ erro: 'Formato de data inválido. Use YYYY-MM-DD.' }, { status: 400 });
  }

  if (checkin >= checkout) {
    return NextResponse.json({ erro: 'Data de checkout deve ser após o checkin.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // 1. Detectar pacote e validar período
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: validacao, error: validacaoError } = await (admin.rpc as any)(
      'validar_reserva_completa',
      {
        p_data_checkin: checkin,
        p_data_checkout: checkout,
        p_tipo_acomodacao: 'Casa', // tipo genérico — a function verifica o período
        p_pessoas: 1,
      }
    );

    if (validacaoError) {
      console.error('Erro em validar_reserva_completa:', validacaoError);
      return NextResponse.json({ erro: 'Período indisponível para reservas.' }, { status: 422 });
    }

    const v = validacao as ValidarReservaResponse | null;

    if (!v?.sucesso) {
      return NextResponse.json(
        { erro: v?.mensagem ?? 'Período não disponível para reservas.' },
        { status: 422 }
      );
    }

    const ehPacote = v.tipo === 'pacote';

    // 2. Contar ocupações sobrepostas por tipo
    const { data: ocupacoes } = await admin
      .from('reservas_confirmadas')
      .select('tipo_quarto')
      .lte('data_checkin', checkout)
      .gt('data_checkout', checkin)
      .not('status', 'in', '("cancelada")') as { data: { tipo_quarto: string }[] | null };

    const ocupadosPorTipo: Record<TipoQuartoReserva, number> = {
      Casa: 0,
      'Chalé - Com Cozinha': 0,
      'Chalé - Sem Cozinha': 0,
    };

    for (const ocp of ocupacoes ?? []) {
      const tipo = ocp.tipo_quarto as TipoQuartoReserva;
      if (tipo in ocupadosPorTipo) {
        ocupadosPorTipo[tipo] = (ocupadosPorTipo[tipo] ?? 0) + 1;
      }
    }

    // 3. Buscar preços
    let precosPorTipo: Record<TipoQuartoReserva, Array<{ pessoas: number; valorDiaria: number }>> = {
      Casa: [],
      'Chalé - Com Cozinha': [],
      'Chalé - Sem Cozinha': [],
    };

    if (ehPacote && v.pacote_info?.id) {
      // Preços do pacote
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: precosPacote } = await (admin.rpc as any)('buscar_precos_pacote', {
        p_pacote_id: v.pacote_info.id,
      });

      for (const pp of precosPacote ?? []) {
        const tipo = MAPA_PACOTE_PARA_QUARTO[pp.tipo_acomodacao];
        if (tipo) {
          precosPorTipo[tipo].push({ pessoas: pp.pessoas, valorDiaria: pp.valor });
        }
      }
    } else {
      // Preços normais via precos_acomodacoes (JOIN com acomodacoes)
      const { data: acomodacoes } = await admin
        .from('acomodacoes')
        .select('id, tipo, categoria, precos_acomodacoes(quantidade_pessoas, preco_diaria)')
        .eq('ativo', true) as {
          data: Array<{
            id: number;
            tipo: 'Casa' | 'Chalé';
            categoria: 'com_cozinha' | 'sem_cozinha' | null;
            precos_acomodacoes: Array<{ quantidade_pessoas: number; preco_diaria: number }>;
          }> | null;
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

        for (const preco of acom.precos_acomodacoes ?? []) {
          // Adiciona apenas se não existir preço para essa quantidade de pessoas
          const jaExiste = precosPorTipo[tipoQuarto].some(
            (p) => p.pessoas === preco.quantidade_pessoas
          );
          if (!jaExiste) {
            precosPorTipo[tipoQuarto].push({
              pessoas: preco.quantidade_pessoas,
              valorDiaria: preco.preco_diaria,
            });
          }
        }
      }
    }

    // Ordenar preços por pessoas
    for (const tipo of TIPOS_QUARTO) {
      precosPorTipo[tipo].sort((a, b) => a.pessoas - b.pessoas);
    }

    // 4. Montar resposta
    const tipos = TIPOS_QUARTO.map((tipo) => {
      const estoqueTotal = ESTOQUE_POR_TIPO[tipo];
      const ocupados = ocupadosPorTipo[tipo];
      const disponiveis = Math.max(0, estoqueTotal - ocupados);

      return {
        tipo,
        capacidadeMax: CAPACIDADE_MAX[tipo],
        precos: precosPorTipo[tipo],
        disponiveis,
      };
    }).filter((t) => t.precos.length > 0); // remove tipos sem preço configurado

    return NextResponse.json({
      tipos,
      ehPacote,
      pacoteInfo: ehPacote && v.pacote_info
        ? {
            id: v.pacote_info.id,
            nome: v.pacote_info.nome,
            dataInicio: v.pacote_info.data_inicio,
            dataFim: v.pacote_info.data_fim,
            diarias: v.pacote_info.diarias,
          }
        : undefined,
    });
  } catch (err) {
    console.error('Erro em /api/disponibilidade:', err);
    return NextResponse.json({ erro: 'Erro interno ao verificar disponibilidade.' }, { status: 500 });
  }
}
