import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin();

    const { searchParams } = new URL(request.url);
    const telefone = searchParams.get('telefone');

    if (!telefone) {
      return NextResponse.json({ error: 'Parâmetro telefone obrigatório.' }, { status: 400 });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');

    if (telefoneLimpo.length < 8) {
      return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 });
    }

    // Variantes de busca: com/sem DDI, com/sem 9
    const variantesBusca = Array.from(new Set([
      telefone,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      telefoneLimpo.startsWith('55') ? telefoneLimpo.slice(2) : telefoneLimpo,
      // Com 9 adicionado (para telefones de 8 dígitos sem o 9)
      telefoneLimpo.length === 10 ? `${telefoneLimpo.slice(0, 2)}9${telefoneLimpo.slice(2)}` : telefoneLimpo,
    ]));

    const supabase = createAdminClient();

    const { data: clientes } = await (supabase.from('clientes_xngrl') as any)
      .select('id_cliente, nome_cliente, telefonewhatsapp_cliente, email_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1);

    const cliente = clientes?.[0];

    if (cliente) {
      return NextResponse.json({
        encontrado: true,
        id_cliente: cliente.id_cliente,
        nome_cliente: cliente.nome_cliente,
        email_cliente: cliente.email_cliente || null,
        telefone: cliente.telefonewhatsapp_cliente,
      });
    }

    return NextResponse.json({ encontrado: false });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ error: 'Erro ao buscar cliente.' }, { status: 500 });
  }
}
