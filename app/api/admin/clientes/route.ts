import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca');

    const query = (supabase.from('clientes_xngrl') as any)
      .select('*')
      .order('created_at', { ascending: false });

    const { data: clientes, error } = await query;
    if (error) throw error;

    let resultado = clientes || [];

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter((c: any) =>
        c.nome_cliente?.toLowerCase().includes(buscaLower) ||
        c.telefonewhatsapp_cliente?.includes(busca) ||
        c.email_cliente?.toLowerCase().includes(buscaLower)
      );
    }

    // Classificar clientes
    resultado = resultado.map((c: any) => ({
      ...c,
      categoria: classificarCliente(c),
    }));

    return NextResponse.json({ clientes: resultado });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({ error: 'Erro ao listar clientes' }, { status: 500 });
  }
}

function classificarCliente(cliente: any): string {
  const totalGasto = Number(cliente.valor_total_gasto || 0);
  const totalReservas = cliente.total_reservas || 0;

  if (totalGasto >= 5000) return 'VIP';
  if (totalReservas >= 3) return 'Frequente';
  if (totalReservas >= 1) return 'Retorno';
  return 'Novo';
}
