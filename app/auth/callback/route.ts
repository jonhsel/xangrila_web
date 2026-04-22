import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Se não há code, redirecionar para login com erro
  if (!code) {
    console.error('[Auth Callback] Nenhum code recebido na URL');
    const errorUrl = new URL('/login', origin);
    errorUrl.searchParams.set('error', 'oauth_error');
    return NextResponse.redirect(errorUrl);
  }

  // IMPORTANTE: Acumular os cookies que o Supabase seta durante
  // exchangeCodeForSession para propagá-los no redirect response.
  // Sem isso, a sessão é criada no Supabase mas os cookies NÃO
  // são enviados ao browser, e a próxima página não encontra sessão.
  const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie);
          });
        },
      },
    }
  );

  // Trocar o authorization code por uma sessão
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[Auth Callback] Erro exchangeCodeForSession:', error.message);
    const errorUrl = new URL('/login', origin);
    errorUrl.searchParams.set('error', 'oauth_error');
    return NextResponse.redirect(errorUrl);
  }

  // Sessão criada com sucesso — verificar se cliente tem telefone verificado
  const { data: { user } } = await supabase.auth.getUser();

  let redirectPath = next === '/' ? '/minhas-reservas' : next;

  if (user) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      const email = user.email;

      if (email) {
        const { data: cliente } = await (admin.from('clientes_xngrl') as any)
          .select('id_cliente, telefonewhatsapp_cliente, telefone_verificado')
          .eq('email_cliente', email)
          .single();

        // Se não tem telefone verificado → completar cadastro
        if (!cliente?.telefonewhatsapp_cliente || !cliente?.telefone_verificado) {
          redirectPath = `/completar-cadastro?next=${encodeURIComponent(next)}`;
        }
      } else {
        // Sem email (improvável com Google) → completar cadastro
        redirectPath = `/completar-cadastro?next=${encodeURIComponent(next)}`;
      }
    } catch (err) {
      console.error('[Auth Callback] Erro ao verificar cliente:', err);
      redirectPath = `/completar-cadastro?next=${encodeURIComponent(next)}`;
    }
  }

  // Criar response de redirect
  const redirectUrl = new URL(redirectPath, origin);
  const response = NextResponse.redirect(redirectUrl);

  // ============================================================
  // CRÍTICO: Propagar TODOS os cookies do exchangeCodeForSession
  // no response. Sem isso, a sessão se perde no redirect.
  // ============================================================
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  console.log('[Auth Callback] Redirect para:', redirectUrl.toString(),
    '| Cookies propagados:', cookiesToSet.length);

  return response;
}