import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient();

        const email = user.email;
        let telefoneVerificado = false;

        if (email) {
          const { data: cliente } = await (admin.from('clientes_xngrl') as any)
            .select('id_cliente, telefonewhatsapp_cliente, telefone_verificado')
            .eq('email_cliente', email)
            .single();

          if (cliente && cliente.telefonewhatsapp_cliente && cliente.telefone_verificado) {
            telefoneVerificado = true;
          }
        }

        if (!telefoneVerificado) {
          const redirectUrl = new URL('/completar-cadastro', origin);
          redirectUrl.searchParams.set('next', next === '/' ? '/minhas-reservas' : next);
          return NextResponse.redirect(redirectUrl);
        }

        const redirectUrl = new URL(next === '/' ? '/minhas-reservas' : next, origin);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  const errorUrl = new URL('/login', origin);
  errorUrl.searchParams.set('error', 'oauth_error');
  return NextResponse.redirect(errorUrl);
}
