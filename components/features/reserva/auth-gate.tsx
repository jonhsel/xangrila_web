'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthTabs } from '@/components/features/auth/auth-tabs';
import { OtpLoginForm } from '@/components/features/auth/otp-login-form';
import { TelefoneVerificacao } from '@/components/features/auth/telefone-verificacao';

// ============================================
// TIPOS
// ============================================

interface ClienteVinculado {
  clienteId: number;
  nome: string;
  email: string | null;
  telefone: string;
  precisaCompletarPerfil: boolean;
}

interface AuthGateProps {
  onAuthenticated: (cliente: ClienteVinculado) => void;
}

// ============================================
// COMPONENTE
// ============================================

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [precisaVerificarTelefone, setPrecisaVerificarTelefone] = useState(false);
  const [userSocial, setUserSocial] = useState<{ email: string | null; nome: string } | null>(null);

  const supabase = createClient();

  // Verificar se já está autenticado ao montar
  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Usuário autenticado — verificar se tem telefone cadastrado
        const provider = user.app_metadata?.provider;
        const email = user.email;

        if (provider && provider !== 'phone' && email) {
          // Login social ou email — verificar telefone
          const resp = await fetch('/api/auth/verificar-telefone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await resp.json();

          if (!data.telefoneVerificado) {
            // Precisa verificar telefone primeiro
            setPrecisaVerificarTelefone(true);
            setUserSocial({
              email,
              nome: user.user_metadata?.full_name || user.user_metadata?.name || '',
            });
            setVerificandoAuth(false);
            return;
          }

          // Tem telefone — buscar dados do cliente e prosseguir
          await vincularClientePorEmail(email, user);
          return;
        }

        if (user.phone) {
          // Login por telefone — vincular e prosseguir
          await vincularCliente(`+${user.phone}`.replace('++', '+'), user);
          return;
        }
      }

      setVerificandoAuth(false);
    };

    verificar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function vincularCliente(telefone: string, user?: any) {
    try {
      const resp = await fetch('/api/auth/vincular-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone }),
      });

      if (resp.ok) {
        const dados = await resp.json();
        const precisaCompletarPerfil =
          dados.novo === true ||
          !dados.nome ||
          dados.nome === telefone ||
          dados.nome === telefone.replace(/\D/g, '');

        onAuthenticated({
          clienteId: dados.clienteId,
          nome: dados.nome,
          email: dados.email,
          telefone,
          precisaCompletarPerfil,
        });
        return;
      }
    } catch {
      // falha silenciosa — fallback abaixo
    }

    onAuthenticated({
      clienteId: 0,
      nome: '',
      email: null,
      telefone,
      precisaCompletarPerfil: false,
    });
  }

  async function vincularClientePorEmail(email: string, user: any) {
    try {
      const resp = await fetch('/api/auth/vincular-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (resp.ok) {
        const dados = await resp.json();
        const precisaCompletarPerfil =
          dados.novo === true ||
          !dados.nome ||
          dados.nome === email;

        onAuthenticated({
          clienteId: dados.clienteId,
          nome: dados.nome || user.user_metadata?.full_name || email,
          email: dados.email || email,
          telefone: dados.telefone || '',
          precisaCompletarPerfil,
        });
        return;
      }
    } catch {
      // falha silenciosa
    }

    onAuthenticated({
      clienteId: 0,
      nome: user.user_metadata?.full_name || '',
      email,
      telefone: '',
      precisaCompletarPerfil: false,
    });
  }

  // Carregando verificação inicial
  if (verificandoAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Usuário autenticado via social/email mas sem telefone verificado
  if (precisaVerificarTelefone && userSocial) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <TelefoneVerificacao
              userName={userSocial.nome}
              redirectTo=""
              // Após verificar, re-buscar auth ao invés de redirecionar
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de login com as 3 opções
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Acesse sua conta</CardTitle>
          <CardDescription>
            Escolha como deseja entrar para continuar com sua reserva
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AuthTabs
            redirectTo=""
            renderPhoneAuth={() => (
              <OtpLoginForm
                onSuccess={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user?.phone) {
                    const telefone = `+${user.phone}`.replace('++', '+');
                    await vincularCliente(telefone, user);
                  }
                }}
              />
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
