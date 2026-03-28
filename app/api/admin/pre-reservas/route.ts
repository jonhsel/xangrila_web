import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = (supabase.from('pre_reservas') as any)
      .select(`
        *,
        clientes_xngrl (
          id_cliente,
          nome_cliente,
          telefonewhatsapp_cliente
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ preReservas: data || [] });
  } catch (error) {
    console.error('Erro ao listar pré-reservas:', error);
    return NextResponse.json({ error: 'Erro ao listar pré-reservas' }, { status: 500 });
  }
}
