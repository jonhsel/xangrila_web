/**
 * Cliente Supabase para componentes do lado do cliente (browser)
 * 
 * Use este em todos os Client Components ('use client').
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * export function MeuComponente() {
 *   const supabase = createClient();
 *   // ...usar supabase
 * }
 * ```
 * 
 * IMPORTANTE: Usa @supabase/ssr (substituto oficial do auth-helpers-nextjs).
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}