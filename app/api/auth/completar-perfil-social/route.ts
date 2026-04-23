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

    const { telefone, codigo } = await request.json();

    if (!telefone || !/^\+55\d{10,11}$/.test(telefone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    if (!codigo || codigo.length !== 6) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    // Verificar código via Twilio Verify — NÃO usa supabase.auth.verifyOtp()
    // para preservar a sessão Google/Email ativa
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifySid) {
      return NextResponse.json({ error: 'Serviço de SMS indisponível' }, { status: 500 });
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      body: new URLSearchParams({ To: telefone, Code: codigo }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok || twilioData.status !== 'approved') {
      console.error('[Completar Perfil] Código inválido:', twilioData);
      return NextResponse.json(
        { error: 'Código inválido ou expirado. Tente novamente.' },
        { status: 400 }
      );
    }

    console.log('[Completar Perfil] Telefone verificado:', telefone);

    // Salvar em clientes_xngrl usando os dados da sessão ativa (Google/Email)
    const admin = createAdminClient();

    const email = user.email;
    const nome =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email ||
      telefone;

    const provider = user.app_metadata?.provider || 'email';
    const authProvider = provider === 'google' ? 'google' : 'email';

    // Buscar cliente existente por email
    let clienteExistente: any = null;
    if (email) {
      const { data } = await (admin.from('clientes_xngrl') as any)
        .select('id_cliente')
        .eq('email_cliente', email)
        .single();
      clienteExistente = data;
    }

    // Se não encontrou por email, buscar por telefone (formato +55...)
    if (!clienteExistente) {
      const { data } = await (admin.from('clientes_xngrl') as any)
        .select('id_cliente')
        .eq('telefonewhatsapp_cliente', telefone)
        .single();
      clienteExistente = data;
    }

    // Tentar também sem o + (variações de formato no banco)
    if (!clienteExistente) {
      const telefoneSemMais = telefone.replace('+', '');
      const { data } = await (admin.from('clientes_xngrl') as any)
        .select('id_cliente')
        .eq('telefonewhatsapp_cliente', telefoneSemMais)
        .single();
      clienteExistente = data;
    }

    if (clienteExistente) {
      await (admin.from('clientes_xngrl') as any)
        .update({
          nome_cliente: nome,
          email_cliente: email,
          telefonewhatsapp_cliente: telefone,
          auth_provider: authProvider,
          telefone_verificado: true,
        })
        .eq('id_cliente', clienteExistente.id_cliente);

      console.log('[Completar Perfil] Cliente atualizado:', clienteExistente.id_cliente);
    } else {
      const { data: novoCliente, error: insertError } = await (admin.from('clientes_xngrl') as any)
        .insert({
          nome_cliente: nome,
          telefonewhatsapp_cliente: telefone,
          email_cliente: email,
          auth_provider: authProvider,
          telefone_verificado: true,
        })
        .select('id_cliente')
        .single();

      if (insertError) {
        console.error('[Completar Perfil] Erro ao inserir:', insertError);
        return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 });
      }

      console.log('[Completar Perfil] Novo cliente criado:', novoCliente?.id_cliente);
    }

    return NextResponse.json({ success: true, nome, email, telefone });
  } catch (error) {
    console.error('[Completar Perfil] Erro:', error);
    return NextResponse.json({ error: 'Erro ao completar perfil' }, { status: 500 });
  }
}
