import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function verificarAdmin() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Usar admin client para consulta de segurança (bypassa RLS)
  const supabaseAdmin = createAdminClient();

  // Suporta login por email (senha) ou por telefone (OTP)
  let query = (supabaseAdmin.from('usuarios_admin') as any)
    .select('*')
    .eq('ativo', true);

  if (user.email) {
    query = query.eq('email', user.email);
  } else if (user.phone) {
    query = query.eq('telefone_whatsapp', user.phone);
  } else {
    redirect('/admin/login');
  }

  const { data: admin, error } = await query.single();

  if (error || !admin) {
    redirect('/admin/login');
  }

  return {
    user,
    admin,
  };
}

export type AdminUser = Awaited<ReturnType<typeof verificarAdmin>>['admin'];
