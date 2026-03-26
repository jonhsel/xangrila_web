/**
 * Middleware Supabase para refresh automático de sessão
 * 
 * Este arquivo é OBRIGATÓRIO quando se usa @supabase/ssr.
 * Ele garante que a sessão do usuário seja renovada automaticamente
 * em cada request, evitando que o token expire silenciosamente.
 * 
 * Coloque este arquivo na RAIZ do projeto: middleware.ts
 * (ao lado de package.json, NÃO dentro de app/)
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: NÃO use supabase.auth.getSession() dentro do middleware.
  // getUser() faz uma chamada ao servidor do Supabase para revalidar o token.
  // getSession() apenas lê o JWT local, que pode estar expirado.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Arquivos estáticos com extensões de imagem/font
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
