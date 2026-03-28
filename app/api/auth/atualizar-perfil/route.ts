import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabaseAuth = await createClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { clienteId, nome, email } = await request.json();

    if (!clienteId || !nome || nome.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nome completo é obrigatório (mínimo 3 caracteres)' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      nome_cliente: nome.trim(),
    };

    if (email !== undefined) {
      updateData.email_cliente = email || null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('clientes_xngrl') as any)
      .update(updateData)
      .eq('id_cliente', clienteId);

    if (updateError) throw updateError;

    return NextResponse.json({ sucesso: true });
  } catch (error: unknown) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
