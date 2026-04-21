'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Modo = 'login' | 'cadastro';

interface LoginEmailFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function LoginEmailForm({ redirectTo = '/minhas-reservas', onSuccess }: LoginEmailFormProps) {
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [esqueceuSenha, setEsqueceuSenha] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const senhaValida = senha.length >= 8;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValido || !senhaValida) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
        } else {
          toast.error('Erro ao fazer login. Tente novamente.');
        }
        return;
      }

      // Verificar se cliente tem telefone verificado
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const response = await fetch('/api/auth/verificar-telefone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        const data = await response.json();

        if (!data.telefoneVerificado) {
          router.push(`/completar-cadastro?next=${encodeURIComponent(redirectTo)}`);
          return;
        }
      }

      toast.success('Login realizado com sucesso!');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      toast.error('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValido || !senhaValida || nome.trim().length < 3) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { full_name: nome.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/completar-cadastro`,
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Faça login.');
          setModo('login');
        } else {
          toast.error('Erro ao criar conta. Tente novamente.');
        }
        return;
      }

      toast.success('Conta criada! Verifique seu email para confirmar o cadastro.', {
        duration: 8000,
      });
    } catch (err) {
      toast.error('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEsqueceuSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValido) {
      toast.error('Informe um email válido.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        toast.error('Erro ao enviar email. Tente novamente.');
        return;
      }

      toast.success('Email enviado! Verifique sua caixa de entrada para redefinir a senha.', {
        duration: 8000,
      });
      setEsqueceuSenha(false);
    } catch (err) {
      toast.error('Erro inesperado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (esqueceuSenha) {
    return (
      <form onSubmit={handleEsqueceuSenha} className="space-y-4">
        <div className="text-center space-y-1 mb-2">
          <p className="text-sm font-medium">Recuperar senha</p>
          <p className="text-xs text-muted-foreground">
            Informe seu email e enviaremos um link para redefinir a senha.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email-recovery">Email</Label>
          <Input
            id="email-recovery"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading || !emailValido}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar link de recuperação
        </Button>

        <button
          type="button"
          onClick={() => setEsqueceuSenha(false)}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Voltar ao login
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs login / cadastro */}
      <div className="flex rounded-lg border p-1 gap-1">
        <button
          type="button"
          onClick={() => setModo('login')}
          className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-medium ${
            modo === 'login'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setModo('cadastro')}
          className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-medium ${
            modo === 'cadastro'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={modo === 'login' ? handleLogin : handleCadastro} className="space-y-3">
        {modo === 'cadastro' && (
          <div className="space-y-1">
            <Label htmlFor="nome-email">Nome completo</Label>
            <Input
              id="nome-email"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
              minLength={3}
              required
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="email-login">Email</Label>
          <Input
            id="email-login"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="senha-login">Senha</Label>
          <div className="relative">
            <Input
              id="senha-login"
              type={mostrarSenha ? 'text' : 'password'}
              placeholder={modo === 'cadastro' ? 'Mínimo 8 caracteres' : '••••••••'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {mostrarSenha ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {modo === 'cadastro' && senha && !senhaValida && (
            <p className="text-xs text-destructive">Senha deve ter no mínimo 8 caracteres</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            loading ||
            !emailValido ||
            !senhaValida ||
            (modo === 'cadastro' && nome.trim().length < 3)
          }
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Mail className="mr-2 h-4 w-4" />
          {modo === 'login' ? 'Entrar com email' : 'Criar conta'}
        </Button>

        {modo === 'login' && (
          <button
            type="button"
            onClick={() => setEsqueceuSenha(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Esqueceu a senha?
          </button>
        )}
      </form>
    </div>
  );
}
