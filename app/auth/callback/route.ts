import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const oauthError = searchParams.get('error');

  // Supabase envia ?error=... quando o provider rejeita
  if (oauthError) {
    console.error('[auth/callback] OAuth provider error:', oauthError, searchParams.get('error_description'));
    const errorUrl = new URL('/login', origin);
    errorUrl.searchParams.set('error', 'oauth_error');
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    console.error('[auth/callback] No code in URL');
    const errorUrl = new URL('/login', origin);
    errorUrl.searchParams.set('error', 'oauth_error');
    return NextResponse.redirect(errorUrl);
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message);
      const errorUrl = new URL('/login', origin);
      errorUrl.searchParams.set('error', 'oauth_error');
      return NextResponse.redirect(errorUrl);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[auth/callback] getUser error:', userError?.message);
      const errorUrl = new URL('/login', origin);
      errorUrl.searchParams.set('error', 'oauth_error');
      return NextResponse.redirect(errorUrl);
    }

    // Verificar se já tem telefone cadastrado (falha silenciosa = assume não verificado)
    let telefoneVerificado = false;
    const email = user.email;

    if (email) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient();
        const { data: cliente } = await (admin.from('clientes_xngrl') as any)
          .select('telefonewhatsapp_cliente, telefone_verificado')
          .eq('email_cliente', email)
          .single();

        if (cliente?.telefonewhatsapp_cliente && cliente?.telefone_verificado === true) {
          telefoneVerificado = true;
        }
      } catch (adminErr) {
        console.error('[auth/callback] Admin query error (fail safe — redirect to completar-cadastro):', adminErr);
      }
    }

    const destino = next === '/' ? '/minhas-reservas' : next;

    if (!telefoneVerificado) {
      const redirectUrl = new URL('/completar-cadastro', origin);
      redirectUrl.searchParams.set('next', destino);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(new URL(destino, origin));
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);
    const errorUrl = new URL('/login', origin);
    errorUrl.searchParams.set('error', 'oauth_error');
    return NextResponse.redirect(errorUrl);
  }
}
