import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { telefone } = await request.json();

    if (!telefone || !/^\+55\d{10,11}$/.test(telefone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    const admin = createAdminClient();
    const email = user.email;
    const nome = user.user_metadata?.full_name || user.user_metadata?.name || email || telefone;

    const provider = user.app_metadata?.provider || 'email';
    const authProvider = provider === 'google' ? 'google' : provider === 'azure' ? 'azure' : 'email';

    let clienteExistente: any = null;
    if (email) {
      const { data } = await (admin.from('clientes_xngrl') as any)
        .select('id_cliente')
        .eq('email_cliente', email)
        .single();
      clienteExistente = data;
    }

    if (clienteExistente) {
      const { error: updateError } = await (admin.from('clientes_xngrl') as any)
        .update({
          telefonewhatsapp_cliente: telefone,
          telefone_verificado: true,
          auth_provider: authProvider,
        })
        .eq('id_cliente', clienteExistente.id_cliente);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await (admin.from('clientes_xngrl') as any)
        .insert({
          nome_cliente: typeof nome === 'string' ? nome : telefone,
          telefonewhatsapp_cliente: telefone,
          email_cliente: email || null,
          telefone_verificado: true,
          auth_provider: authProvider,
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao completar perfil social:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
