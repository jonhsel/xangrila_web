import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { count } = await (supabase
      .from('disponibilidade_quartos') as any)
      .delete()
      .eq('reservado_temporario', true)
      .lt('reservado_temp_ate', new Date().toISOString())
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ sucesso: true, removidos: count || 0 });
  } catch (error) {
    console.error('Erro na limpeza de bloqueios:', error);
    return NextResponse.json({ error: 'Erro na limpeza' }, { status: 500 });
  }
}
