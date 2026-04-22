'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TelefoneVerificacao } from '@/components/features/auth/telefone-verificacao';
import { Card } from '@/components/ui/card';
import { Suspense } from 'react';

function CompletarCadastroContent() {
  const [carregando, setCarregando] = useState(true);
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') || '/minhas-reservas';
  const supabase = createClient();

  useEffect(() => {
    const verificarSessao = async () => {
      // Tenta obter sessão — OAuth pode demorar alguns ms para propagar
      let tentativas = 0;
      while (tentativas < 5) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const nome =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            '';
          setUserName(nome);
          setCarregando(false);
          return;
        }
        tentativas++;
        await new Promise((r) => setTimeout(r, 300));
      }
      // Sem sessão após 5 tentativas → redirecionar para login
      router.replace('/login');
    };

    verificarSessao();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

export default function CompletarCadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CompletarCadastroContent />
    </Suspense>
  );
}
