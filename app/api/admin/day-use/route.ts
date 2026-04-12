import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const { searchParams } = new URL(request.url);
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const status = searchParams.get('status');

    const supabase = createAdminClient();

    let query = (supabase.from('day_use_reservations') as any)
      .select('*')
      .order('reservation_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (data_inicio) {
      query = query.gte('reservation_date', data_inicio);
    }
    if (data_fim) {
      query = query.lte('reservation_date', data_fim);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservas, error } = await query;

    if (error) throw error;

    return NextResponse.json({ reservas: reservas || [] });
  } catch (error) {
    console.error('Erro ao listar day uses:', error);
    return NextResponse.json({ error: 'Erro ao listar day uses.' }, { status: 500 });
  }
}
