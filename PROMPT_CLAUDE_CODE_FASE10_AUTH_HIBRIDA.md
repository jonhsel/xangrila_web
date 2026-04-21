# PROMPT CLAUDE CODE — FASE 10: AUTENTICAÇÃO HÍBRIDA (Google OAuth + Email/Senha + OTP Único)

## CONTEXTO DO PROJETO

Você está trabalhando no projeto `xangrila_web`, sistema web da Pousada Xangrilá (Morros, São Luís - MA).

**Stack:**
- Next.js 16.1.6 (App Router)
- TypeScript ^5
- Tailwind CSS ^4
- Shadcn/ui 4.1.0
- Supabase (PostgreSQL + Auth)
- @supabase/ssr 0.9.0
- Zod ^4.3.6 (v4 — NÃO v3)
- Zustand ^5.0.12
- Sonner 2.0.7 (toasts)
- date-fns ^4.1.0
- lucide-react ^1.6.0
- React Hook Form ^7

**Fases 1 a 9 estão concluídas.** Esta é a Fase 10 — refatoração do sistema de autenticação do cliente público.

---

## OBJETIVO DESTA FASE

Substituir o fluxo de login exclusivamente por OTP/SMS (Twilio) por um sistema **híbrido** que reduz drasticamente o consumo do Twilio:

### Fluxo atual (a ser substituído):
```
Cliente acessa /reservar ou /login
  → Digita telefone
  → Recebe SMS com código OTP (via Twilio — SEMPRE, em todo login)
  → Verifica código
  → Autenticado
```

### Novo fluxo híbrido (a ser implementado):
```
Cliente acessa /reservar ou /login
  → Escolhe: [Google] [Microsoft] [Email + Senha] [Continuar com telefone]
  
  Rota A — Social (Google/Microsoft):
    → OAuth com o provider
    → Se PRIMEIRO acesso: tela "Informe seu telefone" → envia 1 OTP para validar
    → Telefone salvo em clientes_xngrl — NUNCA mais pede OTP
    → Próximos logins: clique em Google → autenticado direto

  Rota B — Email + Senha:
    → Formulário email + senha
    → Se PRIMEIRO acesso: após cadastro, tela "Informe seu telefone" → envia 1 OTP
    → Telefone salvo em clientes_xngrl
    → Próximos logins: email + senha → autenticado direto

  Rota C — Telefone (mantida para quem preferir):
    → Digita telefone → recebe OTP → autentica
    → (Comportamento atual — mantido como opção)
```

**Resultado:** OTP enviado apenas no **primeiro acesso** de cada cliente. Redução de ~300 SMS/mês para ~50 SMS/mês (apenas novos cadastros).

---

## REGRAS CRÍTICAS — NUNCA VIOLAR

1. **NÃO** usar `@supabase/auth-helpers-nextjs` — deprecated. Usar **`@supabase/ssr`**
2. **NÃO** usar `toast` do Shadcn — usar **`sonner`**: `import { toast } from 'sonner'`
3. **NÃO** usar Zod v3 (`required_error` dentro de `z.date()`) — usar **Zod v4**
4. **NÃO** usar ícones `Instagram` ou `Facebook` do lucide-react (não existem na v1.6.0)
5. **NÃO** alterar arquivos protegidos (listados abaixo)
6. **NÃO** importar utilitários de subpastas — usar barrel export: `import { cn, formatarMoeda } from '@/lib/utils'`
7. **NÃO** usar `createClientComponentClient` ou `createServerComponentClient`
8. **NÃO** usar `localStorage` sem verificar `typeof window !== 'undefined'`
9. **NÃO** instalar dependências sem necessidade — usar o que já existe
10. **SEMPRE** usar cast `as any` em queries com `createAdminClient()` (padrão do projeto para Supabase JS v2.100+)
11. **SEMPRE** usar `await createClient()` no servidor (nunca sem await)
12. **NÃO** reverter o login admin para OTP — admin usa email+senha (já implementado, não mexer)

---

## ARQUIVOS PROTEGIDOS — NÃO ALTERAR

```
middleware.ts
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/admin.ts
types/database.ts
types/index.ts
lib/validations/reserva.ts
lib/utils.ts
lib/utils/date.ts
lib/utils/format.ts
components/ui/*.tsx
app/globals.css
```

> ⚠️ EXCEÇÃO PERMITIDA: `types/database.ts` pode ser editado APENAS para adicionar o campo `auth_provider` em `clientes_xngrl`, se necessário. Nunca remover ou renomear campos existentes.

---

## PRÉ-REQUISITO — CONFIGURAÇÕES EXTERNAS

> **✅ TODAS AS CONFIGURAÇÕES EXTERNAS CONCLUÍDAS — não repetir nenhuma etapa abaixo.**

### ✅ Twilio Verify — CONCLUÍDO
- Service SID: `VA6ff50c7572049d24eabd036af8f1d26b`
- Fraud Guard: ativo | Canal: SMS | Nome: "Pousada Xangrila"

### ✅ Supabase Phone Provider — CONCLUÍDO
- Provider: Twilio Verify configurado com Account SID, Auth Token e Verify Service SID
- `Enable phone confirmations`: ativo
- Número de teste: `5598981519965=123456` (válido até 31/12/2026) — usar durante desenvolvimento, não consome crédito Twilio

### ✅ Supabase Allow manual linking — CONCLUÍDO
- Habilitado em Authentication → Sign In / Providers → User Signups

### ✅ Google OAuth — CONCLUÍDO
- Google Cloud Project: `pousada-xangrila` (ID: `743577904146`)
- OAuth Client: "Pousada Xangrilá Web"
- Client ID: `743577904146-o64bohrhbs6cshogp7tmsojdb6okqon2.apps.googleusercontent.com`
- Client Secret: configurado no Supabase (não expor no código)
- Origens JS autorizadas: `http://localhost:3000` e `https://pousadaxangrila.com.br`
- URI de redirecionamento: `https://wjpluzbggmwgvdtnhsfr.supabase.co/auth/v1/callback`
- ⚠️ App em **modo de testes** — adicionar emails de teste em: Google Cloud Console → Google Auth Platform → Público → Usuários de teste

### ✅ Supabase Google Provider — CONCLUÍDO
- Status: **Enabled**
- Client ID e Client Secret configurados

### ✅ Supabase URL Configuration — CONCLUÍDO
- Site URL: `https://pousadaxangrila.com.br`
- Redirect URLs (3 URLs configuradas):
  ```
  http://localhost:3000/**
  https://*.vercel.app/**
  https://pousadaxangrila.com.br/**
  ```

### ✅ Microsoft OAuth — NÃO IMPLEMENTAR AGORA
- Deixar para fase futura se o cliente solicitar. Remover botão "Microsoft" da UI por ora — implementar apenas Google + Email + Telefone.

### Variáveis de ambiente — estado final do `.env.local`

> ✅ Todas as variáveis abaixo **já estão configuradas**. Apenas adicionar a linha `NEXT_PUBLIC_AUTH_CALLBACK_URL`.

```bash
# Twilio — JÁ CONFIGURADO ✅
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=f874572e0a9f1fc70dd9f3157c821bc2
TWILIO_VERIFY_SERVICE_SID=VA6ff50c7572049d24eabd036af8f1d26b
# TWILIO_PHONE_NUMBER comentado — não necessário com Twilio Verify

# Adicionar ao .env.local — NÃO está lá ainda:
NEXT_PUBLIC_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

> ⚠️ **Número de teste ativo:** usar `+5598981519965` com código `123456` durante desenvolvimento. Não consome crédito Twilio. Válido até 31/12/2026.

---

## BANCO DE DADOS — MIGRATION SQL

Executar no SQL Editor do Supabase **antes** de implementar o código:

```sql
-- Adicionar coluna para rastrear o provider de autenticação do cliente
-- Permite saber se o cliente se cadastrou via Google, Microsoft, email ou telefone
ALTER TABLE public.clientes_xngrl
ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'phone'
CHECK (auth_provider IN ('phone', 'google', 'azure', 'email'));

-- Adicionar coluna para marcar se o telefone já foi verificado via OTP
-- TRUE = telefone verificado, FALSE = ainda não verificou (só cadastrou via social)
ALTER TABLE public.clientes_xngrl
ADD COLUMN IF NOT EXISTS telefone_verificado boolean DEFAULT false;

-- Índice para buscas por email (caso não exista)
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes_xngrl(email_cliente);

-- Índice para buscas por auth_provider
CREATE INDEX IF NOT EXISTS idx_clientes_auth_provider ON public.clientes_xngrl(auth_provider);
```

> Após executar, atualizar `types/database.ts` adicionando os campos em `clientes_xngrl`:
> ```typescript
> auth_provider: 'phone' | 'google' | 'azure' | 'email' | null;
> telefone_verificado: boolean;
> ```

---

## ESTRUTURA DE ARQUIVOS — O QUE CRIAR / MODIFICAR

### Arquivos NOVOS a criar:

```
app/
├── auth/
│   └── callback/
│       └── route.ts                  # NOVO — Handler OAuth callback (server route)
├── login/
│   └── page.tsx                      # MODIFICAR — Adicionar botões Google/Microsoft/Email
├── completar-cadastro/
│   └── page.tsx                      # NOVO — Tela de telefone pós-login social
components/
└── features/
    └── auth/
        ├── login-social-buttons.tsx   # NOVO — Botões Google + Microsoft
        ├── login-email-form.tsx       # NOVO — Form email + senha
        ├── login-phone-form.tsx       # NOVO — Form OTP (extraído do auth-gate atual)
        ├── telefone-verificacao.tsx   # NOVO — Tela de coleta + verificação de telefone
        └── auth-tabs.tsx              # NOVO — Tabs unificando os 3 métodos de login
app/
└── api/
    └── auth/
        ├── vincular-cliente/
        │   └── route.ts               # MODIFICAR — suportar múltiplos providers
        ├── completar-perfil-social/
        │   └── route.ts               # NOVO — salva telefone verificado de login social
        └── signup-email/
            └── route.ts               # NOVO — cadastro email+senha com validações
```

### Arquivos a MODIFICAR:

```
app/login/page.tsx                     # Substituir tela OTP única por tela com 3 opções
components/features/reserva/auth-gate.tsx   # Adaptar para novo sistema híbrido
app/api/auth/vincular-cliente/route.ts # Suportar email, google, azure como provider
```

---

## IMPLEMENTAÇÃO — ARQUIVO POR ARQUIVO

### 1. `app/auth/callback/route.ts` — Handler do OAuth Callback

Este arquivo é **obrigatório** para que o login social funcione. O Supabase redireciona para esta rota após o usuário autorizar no Google/Microsoft.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Verificar se o cliente já tem telefone cadastrado
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Importar admin client para checar clientes_xngrl
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient();

        // Buscar cliente pelo email (login social usa email como identificador)
        const email = user.email;
        let clienteExiste = false;
        let telefoneVerificado = false;

        if (email) {
          const { data: cliente } = await (admin.from('clientes_xngrl') as any)
            .select('id_cliente, telefonewhatsapp_cliente, telefone_verificado')
            .eq('email_cliente', email)
            .single();

          if (cliente && cliente.telefonewhatsapp_cliente && cliente.telefone_verificado) {
            clienteExiste = true;
            telefoneVerificado = true;
          }
        }

        // Se cliente sem telefone verificado → redirecionar para completar cadastro
        if (!telefoneVerificado) {
          const redirectUrl = new URL('/completar-cadastro', origin);
          redirectUrl.searchParams.set('next', next);
          return NextResponse.redirect(redirectUrl);
        }

        // Cliente completo → redirecionar para destino
        const redirectUrl = new URL(next === '/' ? '/minhas-reservas' : next, origin);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Erro no OAuth → redirecionar para login com mensagem de erro
  const errorUrl = new URL('/login', origin);
  errorUrl.searchParams.set('error', 'oauth_error');
  return NextResponse.redirect(errorUrl);
}
```

---

### 2. `components/features/auth/login-social-buttons.tsx` — Botão de Login Social

> ⚠️ **Microsoft OAuth NÃO implementado nesta fase.** Implementar apenas o botão Google.
> O botão Microsoft pode ser adicionado futuramente quando o cliente solicitar.

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Ícone SVG do Google (não existe no lucide-react v1.6.0)
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface LoginSocialButtonsProps {
  redirectTo?: string;
}

export function LoginSocialButtons({ redirectTo = '/minhas-reservas' }: LoginSocialButtonsProps) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        toast.error('Erro ao conectar com Google. Tente novamente.');
        console.error('Google OAuth error:', error);
      }
    } catch (err) {
      toast.error('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3 font-medium"
        onClick={handleGoogleLogin}
        disabled={loadingGoogle}
      >
        {loadingGoogle ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continuar com Google
      </Button>
    </div>
  );
}
```

---

### 3. `components/features/auth/login-email-form.tsx` — Formulário Email + Senha

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Modos do formulário
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

  // Validações básicas
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

      // Verificar se cliente tem telefone cadastrado
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const response = await fetch('/api/auth/verificar-telefone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        const data = await response.json();

        if (!data.telefoneVerificado) {
          // Redirecionar para completar cadastro
          router.push(`/completar-cadastro?next=${encodeURIComponent(redirectTo)}`);
          return;
        }
      }

      toast.success('Login realizado com sucesso!');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo);
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

      // Supabase envia email de confirmação — informar o usuário
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
    } finally {
      setLoading(false);
    }
  };

  // Tela de recuperação de senha
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
        {/* Nome — apenas no cadastro */}
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

        {/* Esqueceu a senha — apenas no modo login */}
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
```

---

### 4. `components/features/auth/telefone-verificacao.tsx` — Coleta e Verificação de Telefone Pós-Social

Este componente é exibido após o primeiro login social para coletar e verificar o telefone do cliente.

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Smartphone, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TelefoneVerificacaoProps {
  redirectTo?: string;
  userName?: string;
}

type Etapa = 'telefone' | 'codigo' | 'sucesso';

export function TelefoneVerificacao({ redirectTo = '/minhas-reservas', userName }: TelefoneVerificacaoProps) {
  const [etapa, setEtapa] = useState<Etapa>('telefone');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [loadingVerificacao, setLoadingVerificacao] = useState(false);
  const [timer, setTimer] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Formatar telefone para exibição
  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '');
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
  };

  // Converter para E.164 (formato internacional)
  const paraE164 = (tel: string) => {
    const nums = tel.replace(/\D/g, '');
    return `+55${nums}`;
  };

  // Iniciar timer de reenvio
  const iniciarTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEnviarOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const nums = telefone.replace(/\D/g, '');
    if (nums.length < 10 || nums.length > 11) {
      toast.error('Telefone inválido. Use o formato (DD) 99999-9999');
      return;
    }

    setLoadingEnvio(true);
    try {
      // Verificar se o telefone já está em uso por outro cliente
      const checkResp = await fetch('/api/auth/verificar-telefone-disponivel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: paraE164(telefone) }),
      });
      const checkData = await checkResp.json();

      if (!checkResp.ok || checkData.emUso) {
        toast.error('Este telefone já está cadastrado em outra conta.');
        return;
      }

      // Enviar OTP via Supabase (usa Twilio internamente)
      const { error } = await supabase.auth.signInWithOtp({
        phone: paraE164(telefone),
        options: { shouldCreateUser: false }, // NÃO criar novo usuário — apenas verificar o telefone
      });

      // Nota: signInWithOtp com shouldCreateUser: false pode retornar erro se o telefone
      // não existir no auth — isso é esperado. Usar abordagem alternativa:
      // Enviar OTP normalmente e capturar o código para verificação manual.
      // Se necessário, usar signInWithOtp SEM shouldCreateUser e depois vincular.

      if (error && !error.message.includes('User not found')) {
        toast.error('Erro ao enviar código. Tente novamente.');
        return;
      }

      setEtapa('codigo');
      iniciarTimer();
      toast.success(`Código enviado para ${formatarTelefone(telefone)}`);
    } catch (err) {
      toast.error('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setLoadingEnvio(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setLoadingVerificacao(true);
    try {
      // Verificar OTP via Supabase
      const { error } = await supabase.auth.verifyOtp({
        phone: paraE164(telefone),
        token: codigo,
        type: 'sms',
      });

      if (error) {
        toast.error('Código inválido ou expirado. Tente novamente.');
        return;
      }

      // Salvar telefone verificado no perfil do cliente
      const response = await fetch('/api/auth/completar-perfil-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: paraE164(telefone) }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Erro ao salvar telefone. Tente novamente.');
        return;
      }

      setEtapa('sucesso');
      toast.success('Telefone verificado com sucesso!');

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 2000);
    } catch (err) {
      toast.error('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setLoadingVerificacao(false);
    }
  };

  if (etapa === 'sucesso') {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <div>
          <p className="font-semibold text-lg">Tudo certo!</p>
          <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Smartphone className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-semibold">
          {userName ? `Olá, ${userName.split(' ')[0]}!` : 'Quase lá!'}
        </h2>
        <p className="text-muted-foreground text-sm">
          Para finalizar, precisamos verificar seu telefone.
          Ele será usado para confirmações de reserva por WhatsApp.
        </p>
      </div>

      {etapa === 'telefone' ? (
        <form onSubmit={handleEnviarOTP} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="telefone-social">WhatsApp</Label>
            <Input
              id="telefone-social"
              type="tel"
              placeholder="(98) 99999-9999"
              value={formatarTelefone(telefone)}
              onChange={(e) => {
                const nums = e.target.value.replace(/\D/g, '');
                if (nums.length <= 11) setTelefone(nums);
              }}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Enviaremos um código de verificação via SMS
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loadingEnvio || telefone.replace(/\D/g, '').length < 10}
          >
            {loadingEnvio && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar código
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerificarCodigo} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="codigo-social">Código recebido</Label>
            <Input
              id="codigo-social"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={codigo}
              onChange={(e) => {
                const nums = e.target.value.replace(/\D/g, '');
                if (nums.length <= 6) setCodigo(nums);
              }}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground text-center">
              Código enviado para {formatarTelefone(telefone)}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loadingVerificacao || codigo.length !== 6}
          >
            {loadingVerificacao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar código
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setEtapa('telefone'); setCodigo(''); }}
              className="text-muted-foreground hover:text-foreground"
            >
              Trocar telefone
            </button>
            {timer > 0 ? (
              <span className="text-muted-foreground">Reenviar em {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleEnviarOTP}
                className="text-primary hover:underline"
                disabled={loadingEnvio}
              >
                Reenviar código
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
```

---

### 5. `components/features/auth/auth-tabs.tsx` — Componente Unificador

> ⚠️ **Implementar apenas 3 opções: Social (Google), Email e Telefone. Microsoft removido desta fase.**

```typescript
'use client';

import { useState } from 'react';
import { LoginSocialButtons } from './login-social-buttons';
import { LoginEmailForm } from './login-email-form';

type TabAtiva = 'social' | 'email' | 'telefone';

interface AuthTabsProps {
  redirectTo?: string;
  onPhoneAuthSuccess?: () => void;
  renderPhoneAuth?: () => React.ReactNode;
}

export function AuthTabs({ redirectTo, onPhoneAuthSuccess, renderPhoneAuth }: AuthTabsProps) {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('social');

  return (
    <div className="space-y-6">
      {/* Seletor de tabs */}
      <div className="flex rounded-lg border p-1 gap-1">
        {(
          [
            { id: 'social', label: 'Google' },
            { id: 'email', label: 'Email' },
            { id: 'telefone', label: 'Telefone' },
          ] as { id: TabAtiva; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabAtiva(tab.id)}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-medium ${
              tabAtiva === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da tab ativa */}
      {tabAtiva === 'social' && (
        <div className="space-y-4">
          <LoginSocialButtons redirectTo={redirectTo} />
          <p className="text-xs text-muted-foreground text-center">
            No primeiro acesso, pediremos seu telefone para confirmações via WhatsApp
          </p>
        </div>
      )}

      {tabAtiva === 'email' && (
        <LoginEmailForm redirectTo={redirectTo} />
      )}

      {tabAtiva === 'telefone' && (
        <div className="space-y-4">
          {renderPhoneAuth ? (
            renderPhoneAuth()
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Digite seu número de WhatsApp para receber um código de acesso.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 6. `app/completar-cadastro/page.tsx` — Página de Verificação de Telefone Pós-Social

```typescript
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

  // Se não autenticado → redirecionar para login
  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const redirectTo = params.next || '/minhas-reservas';

  // Extrair nome do usuário dos metadados do OAuth
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
```

---

### 7. `app/api/auth/completar-perfil-social/route.ts` — Salvar Telefone Verificado

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { telefone } = await request.json();

    if (!telefone || !/^\+55\d{10,11}$/.test(telefone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    const admin = createAdminClient();
    const email = user.email;
    const nome = user.user_metadata?.full_name || user.user_metadata?.name || email || telefone;

    // Determinar o provider do usuário
    const provider = user.app_metadata?.provider || 'email';
    const authProvider = provider === 'google' ? 'google' : provider === 'azure' ? 'azure' : 'email';

    // Verificar se já existe cliente com este email
    let clienteExistente: any = null;
    if (email) {
      const { data } = await (admin.from('clientes_xngrl') as any)
        .select('id_cliente')
        .eq('email_cliente', email)
        .single();
      clienteExistente = data;
    }

    if (clienteExistente) {
      // Atualizar cliente existente com telefone verificado
      const { error: updateError } = await (admin.from('clientes_xngrl') as any)
        .update({
          telefonewhatsapp_cliente: telefone,
          telefone_verificado: true,
          auth_provider: authProvider,
        })
        .eq('id_cliente', clienteExistente.id_cliente);

      if (updateError) throw updateError;
    } else {
      // Criar novo cliente
      const { error: insertError } = await (admin.from('clientes_xngrl') as any)
        .insert({
          nome_cliente: typeof nome === 'string' ? nome : telefone,
          telefonewhatsapp_cliente: telefone,
          email_cliente: email || null,
          telefone_verificado: true,
          auth_provider: authProvider,
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao completar perfil social:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
```

---

### 8. `app/api/auth/verificar-telefone/route.ts` — Checar se Telefone Está Verificado

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ telefoneVerificado: false });
    }

    const admin = createAdminClient();
    const { data: cliente } = await (admin.from('clientes_xngrl') as any)
      .select('telefonewhatsapp_cliente, telefone_verificado')
      .eq('email_cliente', email)
      .single();

    const telefoneVerificado =
      cliente &&
      cliente.telefonewhatsapp_cliente &&
      cliente.telefone_verificado === true;

    return NextResponse.json({ telefoneVerificado: !!telefoneVerificado });
  } catch (error) {
    console.error('Erro ao verificar telefone:', error);
    return NextResponse.json({ telefoneVerificado: false });
  }
}
```

---

### 9. `app/api/auth/verificar-telefone-disponivel/route.ts` — Checar se Telefone Já Existe

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { telefone } = await request.json();

    if (!telefone) {
      return NextResponse.json({ emUso: false });
    }

    const admin = createAdminClient();
    const { data: cliente } = await (admin.from('clientes_xngrl') as any)
      .select('id_cliente')
      .eq('telefonewhatsapp_cliente', telefone)
      .eq('telefone_verificado', true)
      .single();

    return NextResponse.json({ emUso: !!cliente });
  } catch (error) {
    // Se não encontrar (PGRST116), telefone está disponível
    return NextResponse.json({ emUso: false });
  }
}
```

---

### 10. `app/login/page.tsx` — Página de Login Refatorada

Substituir a tela atual (apenas OTP) pela tela unificada com 3 opções.

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { AuthTabs } from '@/components/features/auth/auth-tabs';
import { toast } from 'sonner';
import { Palmtree } from 'lucide-react'; // ou outro ícone disponível
import Link from 'next/link';

// Componente OTP interno (extraído do auth-gate.tsx existente)
// Reutilizar o formulário OTP já existente no projeto
import { OtpLoginForm } from '@/components/features/auth/otp-login-form';

export default function LoginPage() {
  const [checandoAuth, setChecandoAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') || '/minhas-reservas';
  const oauthError = searchParams.get('error');
  const supabase = createClient();

  useEffect(() => {
    // Mostrar erro de OAuth se vier da URL
    if (oauthError === 'oauth_error') {
      toast.error('Erro ao autenticar com o provedor. Tente outro método de login.');
    }
  }, [oauthError]);

  useEffect(() => {
    // Se já autenticado, redirecionar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(redirectTo);
      } else {
        setChecandoAuth(false);
      }
    });
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
                onSuccess={() => router.push(redirectTo)}
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
```

---

### 11. `components/features/auth/otp-login-form.tsx` — Formulário OTP Extraído

Extrair o formulário OTP que existe atualmente em `auth-gate.tsx` e `login/page.tsx` para um componente reutilizável, sem remover a lógica original dos arquivos que a usam.

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Smartphone } from 'lucide-react';

interface OtpLoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

type Etapa = 'telefone' | 'codigo';

export function OtpLoginForm({ redirectTo, onSuccess }: OtpLoginFormProps) {
  const [etapa, setEtapa] = useState<Etapa>('telefone');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const supabase = createClient();

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '');
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
  };

  const paraE164 = (tel: string) => `+55${tel.replace(/\D/g, '')}`;

  const iniciarTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEnviarOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const nums = telefone.replace(/\D/g, '');
    if (nums.length < 10) { toast.error('Telefone inválido'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: paraE164(telefone) });
      if (error) { toast.error('Erro ao enviar código'); return; }
      setEtapa('codigo');
      iniciarTimer();
      toast.success('Código enviado!');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) { toast.error('Digite os 6 dígitos'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: paraE164(telefone),
        token: codigo,
        type: 'sms',
      });

      if (error) { toast.error('Código inválido ou expirado'); return; }

      // Vincular cliente (comportamento existente mantido)
      await fetch('/api/auth/vincular-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: paraE164(telefone) }),
      });

      toast.success('Login realizado!');
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Smartphone className="h-4 w-4" />
        <span>Receba um código no seu WhatsApp</span>
      </div>

      {etapa === 'telefone' ? (
        <form onSubmit={handleEnviarOTP} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="otp-telefone">Número de WhatsApp</Label>
            <Input
              id="otp-telefone"
              type="tel"
              placeholder="(98) 99999-9999"
              value={formatarTelefone(telefone)}
              onChange={(e) => {
                const nums = e.target.value.replace(/\D/g, '');
                if (nums.length <= 11) setTelefone(nums);
              }}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || telefone.replace(/\D/g, '').length < 10}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar código
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerificarCodigo} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="otp-codigo">Código recebido</Label>
            <Input
              id="otp-codigo"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={codigo}
              onChange={(e) => {
                const nums = e.target.value.replace(/\D/g, '');
                if (nums.length <= 6) setCodigo(nums);
              }}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Código enviado para {formatarTelefone(telefone)}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || codigo.length !== 6}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => { setEtapa('telefone'); setCodigo(''); }}
              className="text-muted-foreground hover:text-foreground">
              Trocar número
            </button>
            {timer > 0 ? (
              <span className="text-muted-foreground">Reenviar em {timer}s</span>
            ) : (
              <button type="button" onClick={() => handleEnviarOTP()}
                className="text-primary hover:underline">
                Reenviar
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
```

---

### 12. Modificar `components/features/reserva/auth-gate.tsx`

O `auth-gate.tsx` atual exibe apenas a tela OTP antes do wizard. Modificar para exibir o `AuthTabs` (com as 3 opções), mantendo o OTP como uma das abas.

**Lógica de modificação:**
1. Importar `AuthTabs` e `OtpLoginForm`
2. Substituir a renderização da tela de autenticação pelo `<AuthTabs>`
3. Passar `renderPhoneAuth` com o componente OTP atual
4. Manter toda a lógica de `onAuthenticated`, `vincularCliente`, e detecção de perfil incompleto intacta
5. O callback `onSuccess` do OTP deve chamar `vincularCliente` como antes

**NÃO remover:** a lógica de detecção de perfil incompleto (`precisaCompletarPerfil`), o `ClientProfileForm`, e toda a integração com o Zustand store.

---

## ORDEM DE IMPLEMENTAÇÃO

Execute nesta ordem exata para evitar erros de importação circular:

**PARTE 1 — Banco de dados (fazer antes de tudo):**
1. Executar o SQL de migration no Supabase Dashboard (ver seção acima)
2. Atualizar `types/database.ts` com os 2 novos campos em `clientes_xngrl`

**PARTE 2 — Configurações externas: ✅ 100% CONCLUÍDAS — NÃO repetir**
> - ✅ Twilio Verify configurado (Service SID: `VA6ff50c7572049d24eabd036af8f1d26b`)
> - ✅ Supabase Phone provider com Twilio Verify
> - ✅ Supabase Allow manual linking habilitado
> - ✅ Google OAuth configurado (Client ID: `743577904146-o64bohrhbs6cshogp7tmsojdb6okqon2.apps.googleusercontent.com`)
> - ✅ Supabase Google provider habilitado
> - ✅ Supabase Site URL: `https://pousadaxangrila.com.br`
> - ✅ Supabase Redirect URLs: 3 URLs configuradas
> - ✅ `.env.local` com credenciais Twilio corretas
> - ⚠️ **Única ação pendente:** adicionar `NEXT_PUBLIC_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback` no `.env.local`
> - ⚠️ **Microsoft OAuth:** NÃO implementar agora — remover botão Microsoft da UI, deixar apenas Google + Email + Telefone

**PARTE 3 — Componentes base (sem dependências entre si):**
6. Criar `components/features/auth/login-social-buttons.tsx`
7. Criar `components/features/auth/login-email-form.tsx`
8. Criar `components/features/auth/otp-login-form.tsx`
9. Criar `components/features/auth/telefone-verificacao.tsx`
10. Criar `components/features/auth/auth-tabs.tsx`

**PARTE 4 — API Routes:**
11. Criar `app/auth/callback/route.ts`
12. Criar `app/api/auth/verificar-telefone/route.ts`
13. Criar `app/api/auth/verificar-telefone-disponivel/route.ts`
14. Criar `app/api/auth/completar-perfil-social/route.ts`

**PARTE 5 — Páginas:**
15. Criar `app/completar-cadastro/page.tsx`
16. Modificar `app/login/page.tsx` para usar `AuthTabs`

**PARTE 6 — Integração:**
17. Modificar `components/features/reserva/auth-gate.tsx` para usar `AuthTabs`

**PARTE 7 — Build e testes:**
18. `npm run build` — deve compilar sem erros TypeScript
19. Executar testes manuais (ver checklist abaixo)

---

## CHECKLIST DE TESTES

### Google OAuth
- [ ] Clicar "Continuar com Google" → abre seletor de conta Google
- [ ] Autorizar → redireciona para `/auth/callback`
- [ ] Primeiro acesso → redireciona para `/completar-cadastro`
- [ ] Inserir telefone → recebe SMS → verificar código → salvo em `clientes_xngrl`
- [ ] Segundo acesso → Google → direto para `/minhas-reservas` (sem pedir telefone)
- [ ] ⚠️ Durante testes usar email cadastrado em: Google Cloud Console → Google Auth Platform → Público → Usuários de teste

### Email + Senha
- [ ] Criar conta nova → email de confirmação enviado
- [ ] Confirmar email → redireciona para `/completar-cadastro`
- [ ] Verificar telefone → salvo em `clientes_xngrl`
- [ ] Próximo login → email+senha → direto para `/minhas-reservas`
- [ ] Esqueceu senha → email de recuperação enviado

### OTP por Telefone (mantido funcionando)
- [ ] Selecionar aba "Telefone" → inserir número → receber SMS → verificar
- [ ] Comportamento idêntico ao anterior (não regressão)
- [ ] ⚠️ Durante dev usar número de teste `5598981519965` com código `123456`

### Auth Gate (wizard de reservas)
- [ ] Clicar "Reservar" sem estar logado → exibe AuthTabs (3 abas: Google, Email, Telefone)
- [ ] Login com Google funciona dentro do auth-gate
- [ ] Após login Google sem telefone → exibe TelefoneVerificacao
- [ ] Após verificar telefone → avança para o wizard normalmente

### Segurança
- [ ] Acessar `/completar-cadastro` sem estar logado → redireciona para `/login`
- [ ] Acessar `/minhas-reservas` sem estar logado → redireciona para `/login`
- [ ] OTP inválido → mensagem de erro adequada

### Build
- [ ] `npm run build` — zero erros TypeScript
- [ ] Zero warnings críticos no console

---

## NOTAS TÉCNICAS IMPORTANTES

### Cast `as any` obrigatório
```typescript
// ✅ Padrão obrigatório no projeto para Supabase JS v2.100+
const { data } = await (admin.from('clientes_xngrl') as any)
  .select('*')
  .eq('email_cliente', email)
  .single();
```

### Ícones do Google e Microsoft
Os ícones do Google e Microsoft **não existem no lucide-react v1.6.0**. Usar SVG inline conforme demonstrado nos componentes acima.

### OAuth Redirect URL
O callback do Supabase é sempre:
```
https://[seu-projeto].supabase.co/auth/v1/callback
```
Nunca usar a URL do seu app como redirect no Google Cloud Console — o Supabase gerencia o redirect final.

### Verificação de email no cadastro
O Supabase envia email de confirmação automaticamente no `signUp`. Configurar em:
Supabase Dashboard → Authentication → Email Templates → Confirm signup

### `shouldCreateUser: false` no OTP de verificação de telefone
Ao verificar o telefone pós-login social, usar `signInWithOtp` sem `shouldCreateUser: false` pode criar um usuário duplicado no Supabase Auth. A alternativa segura é:
1. Não passar `shouldCreateUser` (default é true)
2. Após a verificação, o Supabase cria uma sessão para o número de telefone
3. A API `/completar-perfil-social` usa o usuário da sessão social (email) para atualizar `clientes_xngrl`
4. Este fluxo funciona mesmo que o Supabase Auth tenha dois registros (email + phone) — o `clientes_xngrl` é atualizado pelo email

### Coluna `telefonewhatsapp_cliente`
PostgreSQL normaliza para lowercase. Sempre usar `telefonewhatsapp_cliente` nas queries (não `telefoneWhatsapp_cliente`).

---

## IMPACTO NAS PRÓXIMAS FASES

- **Fase 9 (Deploy — já em andamento):** Adicionar ao painel Vercel as variáveis:
  ```
  TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN=f874572e0a9f1fc70dd9f3157c821bc2
  TWILIO_VERIFY_SERVICE_SID=VA6ff50c7572049d24eabd036af8f1d26b
  NEXT_PUBLIC_AUTH_CALLBACK_URL=https://pousadaxangrila.com.br/auth/callback
  ```

- **Google OAuth em produção:** O app está em **modo de testes** no Google. Para qualquer usuário conseguir fazer login com Google (não apenas emails de teste), é necessário publicar o app em: Google Cloud Console → Google Auth Platform → Público → Status de publicação → **"Publicar app"**. O processo pode exigir verificação do Google se o app solicitar escopos sensíveis — para escopos básicos (email, perfil) geralmente é aprovado automaticamente.

- **Microsoft OAuth:** Não implementado nesta fase. Pode ser adicionado futuramente sem impacto no código atual — basta criar o Azure App Registration, ativar o provider no Supabase e adicionar o botão no `login-social-buttons.tsx`.

- **Twilio upgrade:** Conta ainda em trial (`Trial: $15.50`). Fazer upgrade para conta paga antes de ir para produção — no trial o Twilio Verify só envia SMS para números verificados manualmente.

---

## ESTIMATIVA DE REDUÇÃO DE CUSTOS

| Cenário | SMS/mês antes | SMS/mês depois | Economia |
|---|---|---|---|
| 200 reservas, clientes novos | ~300 SMS | ~50 SMS | ~83% |
| Clientes retornando via Google | 0 | 0 SMS | 100% |
| Custo Twilio estimado | ~R$ 95-140 | ~R$ 15-25 | ~R$ 80-115/mês |

> A redução acontece porque o OTP só é enviado **uma vez por cliente** (no primeiro acesso). Todos os logins subsequentes via Google ou Microsoft não consomem SMS.
