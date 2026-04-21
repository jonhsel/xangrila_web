import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { telefone } = await request.json();

    if (!telefone) {
      return NextResponse.json({ emUso: false });
    }

    const admin = createAdminClient();
    const { data: cliente } = await (admin.from('clientes_xngrl') as any)
      .select('id_cliente')
      .eq('telefonewhatsapp_cliente', telefone)
      .eq('telefone_verificado', true)
      .single();

    return NextResponse.json({ emUso: !!cliente });
  } catch {
    // Se não encontrar (PGRST116), telefone está disponível
    return NextResponse.json({ emUso: false });
  }
}
