import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Caso 1: verificar se email tem telefone verificado (auth-gate, login-email-form)
    if (body.email) {
      const admin = createAdminClient();
      const { data: cliente } = await (admin.from('clientes_xngrl') as any)
        .select('telefonewhatsapp_cliente, telefone_verificado')
        .eq('email_cliente', body.email)
        .single();

      const telefoneVerificado =
        cliente &&
        cliente.telefonewhatsapp_cliente &&
        cliente.telefone_verificado === true;

      return NextResponse.json({ telefoneVerificado: !!telefoneVerificado });
    }

    // Caso 2: enviar OTP via Twilio Verify sem usar supabase.auth (pós-login social)
    if (body.telefone) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }

      const { telefone } = body;

      if (!/^\+55\d{10,11}$/.test(telefone)) {
        return NextResponse.json({ error: 'Telefone inválido. Use formato: +55XXXXXXXXXXX' }, { status: 400 });
      }

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

      if (!accountSid || !authToken || !verifySid) {
        console.error('[Verificar Telefone] Credenciais Twilio não configuradas');
        return NextResponse.json({ error: 'Serviço de SMS indisponível' }, { status: 500 });
      }

      const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        },
        body: new URLSearchParams({ To: telefone, Channel: 'sms' }),
      });

      const twilioData = await twilioResponse.json();

      if (!twilioResponse.ok) {
        console.error('[Verificar Telefone] Erro Twilio:', twilioData);
        return NextResponse.json(
          { error: 'Não foi possível enviar o código. Tente novamente.' },
          { status: 400 }
        );
      }

      console.log('[Verificar Telefone] SMS enviado para:', telefone, '| Status:', twilioData.status);
      return NextResponse.json({ success: true, message: 'Código enviado via SMS' });
    }

    return NextResponse.json({ telefoneVerificado: false });
  } catch (error) {
    console.error('Erro ao verificar telefone:', error);
    return NextResponse.json({ telefoneVerificado: false });
  }
}
