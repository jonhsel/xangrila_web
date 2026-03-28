import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClientHeader } from '@/components/layout/client-header';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader userPhone={user.phone || ''} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
