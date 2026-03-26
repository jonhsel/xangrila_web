/**
 * Cliente Admin Supabase com Service Role Key
 * 
 * ⚠️ IMPORTANTE: Use APENAS em:
 *   - API Routes (app/api/...)
 *   - Server Actions
 *   - Server Components
 *   - Cron Jobs
 * 
 * NUNCA exponha este cliente no browser! A Service Role Key
 * ignora todas as políticas RLS (Row Level Security).
 * 
 * @example
 * ```tsx
 * // Em API Route
 * import { createAdminClient } from '@/lib/supabase/admin';
 * 
 * export async function POST(request: NextRequest) {
 *   const supabase = createAdminClient();
 *   const { data } = await supabase
 *     .from('reservas_confirmadas')
 *     .update({ status: 'confirmada' })
 *     .eq('reserva_id', 'PXL-ABC-1234');
 * }
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL não está configurado. ' +
    'Adicione ao seu .env.local'
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY não está configurado. ' +
    'Adicione ao seu .env.local (nunca exponha esta chave no browser!)'
  );
}

/**
 * Cria um cliente Supabase com permissões de admin (Service Role).
 * Ignora RLS — use com cuidado, apenas em código server-side.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
