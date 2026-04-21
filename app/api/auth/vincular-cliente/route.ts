import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ClienteRow } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const admin = createAdminClient();

    // 2. Busca por email (login social ou email+senha)
    if (body.email) {
      const email: string = body.email;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clientes } = await (admin.from('clientes_xngrl') as any)
        .select('id_cliente, nome_cliente, telefonewhatsapp_cliente, email_cliente')
        .eq('email_cliente', email)
        .limit(1) as { data: (Pick<ClienteRow, 'id_cliente' | 'nome_cliente' | 'telefonewhatsapp_cliente'> & { email_cliente: string | null })[] | null };

      const clienteExistente = clientes?.[0];

      if (clienteExistente) {
        return NextResponse.json({
          sucesso: true,
          clienteId: clienteExistente.id_cliente,
          nome: clienteExistente.nome_cliente ?? email,
          email: clienteExistente.email_cliente || null,
          telefone: clienteExistente.telefonewhatsapp_cliente || '',
          novo: false,
        });
      }

      // Criar novo cliente com email
      const nome = user.user_metadata?.full_name || user.user_metadata?.name || email;
      const provider = user.app_metadata?.provider || 'email';
      const authProvider = provider === 'google' ? 'google' : provider === 'azure' ? 'azure' : 'email';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: novoCliente, error: insertError } = await (admin.from('clientes_xngrl') as any)
        .insert({
          nome_cliente: typeof nome === 'string' ? nome : email,
          email_cliente: email,
          auth_provider: authProvider,
          telefone_verificado: false,
        })
        .select('id_cliente, nome_cliente, email_cliente')
        .single() as { data: (Pick<ClienteRow, 'id_cliente' | 'nome_cliente'> & { email_cliente: string | null }) | null; error: unknown };

      if (insertError || !novoCliente) {
        console.error('Erro ao criar cliente por email:', insertError);
        return NextResponse.json({ erro: 'Erro ao cadastrar cliente.' }, { status: 500 });
      }

      return NextResponse.json({
        sucesso: true,
        clienteId: novoCliente.id_cliente,
        nome: novoCliente.nome_cliente ?? email,
        email: novoCliente.email_cliente || null,
        telefone: '',
        novo: true,
      });
    }

    // 3. Busca por telefone (login OTP)
    const telefone: string = body.telefone ?? user.phone ?? '';

    if (!telefone) {
      return NextResponse.json({ erro: 'Telefone ou email não fornecido.' }, { status: 400 });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const variantesBusca = [
      telefone,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      telefoneLimpo.startsWith('55') ? telefoneLimpo.slice(2) : telefoneLimpo,
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientes } = await (admin.from('clientes_xngrl') as any)
      .select('id_cliente, nome_cliente, telefonewhatsapp_cliente, email_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1) as { data: (Pick<ClienteRow, 'id_cliente' | 'nome_cliente' | 'telefonewhatsapp_cliente'> & { email_cliente: string | null })[] | null };

    const clienteExistente = clientes?.[0];

    if (clienteExistente) {
      return NextResponse.json({
        sucesso: true,
        clienteId: clienteExistente.id_cliente,
        nome: clienteExistente.nome_cliente ?? telefone,
        email: clienteExistente.email_cliente || null,
        novo: false,
      });
    }

    // 4. Criar novo cliente por telefone
    const { data: novoCliente, error: insertError } = await admin
      .from('clientes_xngrl')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        nome_cliente: telefone,
        telefonewhatsapp_cliente: telefone,
        auth_provider: 'phone',
        telefone_verificado: true,
      } as any)
      .select('id_cliente, nome_cliente, email_cliente')
      .single() as { data: (Pick<ClienteRow, 'id_cliente' | 'nome_cliente'> & { email_cliente: string | null }) | null; error: unknown };

    if (insertError || !novoCliente) {
      console.error('Erro ao criar cliente:', insertError);
      return NextResponse.json({ erro: 'Erro ao cadastrar cliente.' }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      clienteId: novoCliente.id_cliente,
      nome: novoCliente.nome_cliente ?? telefone,
      email: novoCliente.email_cliente || null,
      novo: true,
    });
  } catch (err) {
    console.error('Erro em vincular-cliente:', err);
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
  }
}
