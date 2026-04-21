import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ telefoneVerificado: false });
    }

    const admin = createAdminClient();
    const { data: cliente } = await (admin.from('clientes_xngrl') as any)
      .select('telefonewhatsapp_cliente, telefone_verificado')
      .eq('email_cliente', email)
      .single();

    const telefoneVerificado =
      cliente &&
      cliente.telefonewhatsapp_cliente &&
      cliente.telefone_verificado === true;

    return NextResponse.json({ telefoneVerificado: !!telefoneVerificado });
  } catch (error) {
    console.error('Erro ao verificar telefone:', error);
    return NextResponse.json({ telefoneVerificado: false });
  }
}
