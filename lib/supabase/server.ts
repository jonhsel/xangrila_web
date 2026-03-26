/**
 * Cliente Supabase para componentes do lado do servidor (SSR)
 * 
 * Use este em Server Components, Server Actions e Route Handlers.
 * 
 * @example
 * ```tsx
 * // Em Server Component
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('reservas_confirmadas').select('*');
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Em Server Action
 * 'use server';
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export async function minhaAction() {
 *   const supabase = await createClient();
 *   // ...
 * }
 * ```
 * 
 * IMPORTANTE: Usa @supabase/ssr (substituto oficial do auth-helpers-nextjs).
 * A função é async porque cookies() é async no Next.js 15+.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll é chamado dentro de Server Components onde
            // não é possível setar cookies. Pode ser ignorado se
            // o middleware estiver refreshando a sessão do usuário.
          }
        },
      },
    }
  );
}
