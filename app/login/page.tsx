'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { AuthTabs } from '@/components/features/auth/auth-tabs';
import { OtpLoginForm } from '@/components/features/auth/otp-login-form';
import { toast } from 'sonner';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginContent() {
  const [checandoAuth, setChecandoAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') || '/minhas-reservas';
  const oauthError = searchParams.get('error');
  const supabase = createClient();

  useEffect(() => {
    if (oauthError === 'oauth_error') {
      toast.error('Erro ao autenticar com o provedor. Tente outro método de login.');
    }
  }, [oauthError]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(redirectTo);
      } else {
        setChecandoAuth(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Marca */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-primary">Pousada Xangri-lá</span>
            <span className="text-sm text-muted-foreground">Morros, Maranhão</span>
          </Link>
        </div>

        <Card className="p-6 shadow-lg">
          <div className="space-y-2 mb-6">
            <h1 className="text-xl font-semibold">Entrar</h1>
            <p className="text-sm text-muted-foreground">
              Acesse sua conta para gerenciar reservas
            </p>
          </div>

          <AuthTabs
            redirectTo={redirectTo}
            renderPhoneAuth={() => (
              <OtpLoginForm
                redirectTo={redirectTo}
                onSuccess={() => {
                  router.push(redirectTo);
                  router.refresh();
                }}
              />
            )}
          />
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com os{' '}
          <Link href="/termos" className="underline hover:text-foreground">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="underline hover:text-foreground">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
