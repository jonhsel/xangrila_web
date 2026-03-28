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

    // 2. Obter telefone do body
    const body = await request.json();
    const telefone: string = body.telefone ?? user.phone ?? '';

    if (!telefone) {
      return NextResponse.json({ erro: 'Telefone não fornecido.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 3. Buscar cliente pelo telefone (normalizado)
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const variantesBusca = [
      telefone,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      // sem código do país
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

    // 4. Criar novo cliente
    const { data: novoCliente, error: insertError } = await admin
      .from('clientes_xngrl')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ nome_cliente: telefone, telefonewhatsapp_cliente: telefone } as any)
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
