import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const busca = searchParams.get('busca');
    const tipoQuarto = searchParams.get('tipoQuarto');

    let query = (supabase.from('reservas_confirmadas') as any)
      .select(`
        *,
        clientes_xngrl (
          id_cliente,
          nome_cliente,
          telefonewhatsapp_cliente,
          email_cliente
        )
      `)
      .order('data_checkin', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }
    if (dataInicio) {
      query = query.gte('data_checkin', dataInicio);
    }
    if (dataFim) {
      query = query.lte('data_checkout', dataFim);
    }
    if (tipoQuarto && tipoQuarto !== 'todos') {
      query = query.eq('tipo_quarto', tipoQuarto);
    }

    const { data: reservas, error } = await query;
    if (error) throw error;

    // Filtro por busca (nome ou código) — client-side
    let resultado = reservas || [];
    if (busca) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter((r: any) =>
        r.reserva_id.toLowerCase().includes(buscaLower) ||
        r.clientes_xngrl?.nome_cliente?.toLowerCase().includes(buscaLower) ||
        r.clientes_xngrl?.telefonewhatsapp_cliente?.includes(busca)
      );
    }

    return NextResponse.json({ reservas: resultado });
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    return NextResponse.json({ error: 'Erro ao listar reservas' }, { status: 500 });
  }
}
