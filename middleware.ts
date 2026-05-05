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
  // ================================================================
  // MODO MANUTENÇÃO
  // Ativar: definir MAINTENANCE_MODE=true nas env vars da Vercel
  // Desativar: remover a variável ou definir MAINTENANCE_MODE=false
  // ================================================================
  const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

  const ROTAS_PERMITIDAS_MANUTENCAO = [
    '/manutencao',   // a própria página de manutenção
    '/_next',        // assets estáticos do Next.js
    '/favicon.ico',  // favicon
    '/images',       // imagens públicas
    '/fonts',        // fontes
  ];

  if (MAINTENANCE_MODE) {
    const { pathname } = request.nextUrl;
    const isPermitida = ROTAS_PERMITIDAS_MANUTENCAO.some((rota) =>
      pathname.startsWith(rota)
    );
    if (!isPermitida) {
      const url = request.nextUrl.clone();
      url.pathname = '/manutencao';
      return NextResponse.rewrite(url);
    }
  }
  // ================================================================
  // FIM MODO MANUTENÇÃO
  // ================================================================

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
