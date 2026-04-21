import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TelefoneVerificacao } from '@/components/features/auth/telefone-verificacao';
import { Card } from '@/components/ui/card';

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function CompletarCadastroPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const redirectTo = params.next || '/minhas-reservas';

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <TelefoneVerificacao
          redirectTo={redirectTo}
          userName={userName}
        />
      </Card>
    </div>
  );
}
