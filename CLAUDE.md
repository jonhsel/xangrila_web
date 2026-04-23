# Pousada Xangrilá — Sistema Web (`xangrila_web`)

## Visão Geral
Sistema web para gerenciamento da Pousada Xangrilá (Morros, São Luís - MA), desenvolvido com Next.js, TypeScript, Tailwind CSS, Shadcn/ui e Supabase. Fases 1 a 10.2 concluídas. Sistema em produção em https://pousadaxangrilademorros.com.br. A fase 10 (Autenticação Híbrida), fase 10.1 (Correções Auth) e fase 10.2 (Correção Duplicação Auth Google) estão concluídas: Google OAuth + Email/Senha + OTP, sem duplicação de registros e sem perda da sessão Google na verificação de telefone.

---

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 16.1.6 |
| Linguagem | TypeScript | ^5 |
| Estilo | Tailwind CSS | ^4 |
| Componentes UI | Shadcn/ui | 4.1.0 |
| Banco de Dados | Supabase (PostgreSQL) | — |
| Auth Supabase | @supabase/ssr | 0.9.0 |
| Validação | Zod | ^4.3.6 (v4, NÃO v3) |
| Estado Global | Zustand | ^5.0.12 |
| Toasts | Sonner | 2.0.7 |
| Formulários | React Hook Form | ^7 |
| Datas | date-fns | ^4.1.0 |
| Calendário | react-day-picker | ^9.14.0 |
| QR Code | qrcode.react | ^4.2.0 |
| Ícones | lucide-react | ^1.6.0 |
| Email | resend | ^4.x |
| Gráficos | recharts | ^2.x |

---

## Regras Críticas — NUNCA Violar

- **NÃO** usar `@supabase/auth-helpers-nextjs` — deprecated. Usar **`@supabase/ssr`**
- **NÃO** usar `toast` do Shadcn — usar **`sonner`**
- **NÃO** usar Zod v3 (`required_error` dentro de `z.date()`) — usar **Zod v4**
- Os ícones `Instagram` e `Facebook` **não existem** no lucide-react v1.6.0 — usar `Globe` e `Share2`
- **NÃO** alterar os arquivos protegidos listados abaixo

---

## Arquivos Protegidos — NÃO Alterar

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
components/ui/*.tsx  (12 componentes shadcn)
app/globals.css
```

---

## Status das Fases

| Fase | Nome | Status |
|---|---|---|
| 1 | Setup Inicial (Next.js, dependências, estrutura) | ✅ Concluída |
| 2 | Configuração do Supabase (migrations, RLS, triggers) | ✅ Concluída |
| 3 | Código Base (types, utils, supabase clients) | ✅ Concluída |
| 4 | Landing Page e UI Pública | ✅ Concluída |
| 5 | Sistema de Reservas (wizard multi-step + auth OTP) | ✅ Concluída |
| 6 | Pagamentos PIX via Mercado Pago | ✅ Concluída |
| 7 | Área do Cliente (auth SMS/OTP, minhas-reservas) | ✅ Concluída |
| 7.5 | Melhorias e customizações (perfil, emails, carrossel, galeria, acomodações) | ✅ Concluída |
| 8 | Painel Administrativo (dashboard, gestão) | ✅ Concluída |
| 8.6 | Melhorias Pré-Deploy (pagamento integral, Day Use completo, expedições) | ✅ Concluída |
| 8.7 | Reserva Presencial (Walk-in) com Pagamento em Dinheiro | ✅ Concluída |
| 9 | Deploy e Go-Live (Vercel, domínio, crons) | ✅ Código concluído (ações manuais pendentes) |
| 10 | Autenticação Híbrida (Google OAuth + Email/Senha + OTP único) | ✅ Concluída |
| 10.1 | Correções Auth Híbrida (callback, domínio, cookies) | ✅ Concluída |
| 10.2 | Correção Duplicação Auth Google (sessão + registros duplicados) | ✅ Concluída |

---

## O que já existe no projeto (Fases 1–8)

### Estrutura de pastas atual

```
xangrila_web/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing page
│   │   ├── acomodacoes/page.tsx      # Fase 7.5 — Página de acomodações com galeria e regras
│   │   ├── contato/page.tsx          # Formulário → WhatsApp
│   │   ├── day-use/page.tsx          # Placeholder + CTA
│   │   ├── loading.tsx               # Skeleton animate-pulse
│   │   └── error.tsx                 # Com reset()
│   ├── (auth)/                       # Fase 7 — Área do cliente (protegida)
│   │   ├── layout.tsx                # Verifica auth, redireciona para /login
│   │   └── minhas-reservas/
│   │       └── page.tsx              # Listagem de reservas por status (server component)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # Fase 10 — Handler OAuth callback (Google → verifica telefone)
│   ├── completar-cadastro/
│   │   └── page.tsx                  # Fase 10 — Tela de verificação de telefone pós-login social
│   ├── login/
│   │   └── page.tsx                  # Fase 10 — Login híbrido: Google + Email/Senha + OTP Telefone
│   ├── reservar/
│   │   ├── layout.tsx                # Header + Footer
│   │   ├── page.tsx                  # Auth gate + wizard (client component)
│   │   ├── pagamento/
│   │   │   └── page.tsx              # Fase 6 — PIX QR Code + timer
│   │   └── confirmacao/
│   │       └── page.tsx              # Fase 6 — Confirmação de pagamento
│   ├── api/
│   │   ├── auth/
│   │   │   ├── vincular-cliente/
│   │   │   │   └── route.ts          # POST — busca/cria cliente (suporta telefone E email — Fase 10)
│   │   │   ├── atualizar-perfil/
│   │   │   │   └── route.ts          # PATCH — salva nome e email do cliente (Fase 7.5)
│   │   │   ├── completar-perfil-social/
│   │   │   │   └── route.ts          # Fase 10 — POST — salva telefone verificado pós-OAuth
│   │   │   ├── verificar-telefone/
│   │   │   │   └── route.ts          # Fase 10 — POST — checa se email tem telefone verificado
│   │   │   ├── verificar-telefone-disponivel/
│   │   │   │   └── route.ts          # Fase 10 — POST — checa se telefone já está em uso
│   │   │   └── logout/
│   │   │       └── route.ts          # POST — encerra sessão (Fase 7)
│   │   ├── disponibilidade/
│   │   │   └── route.ts              # GET — disponibilidade + preços (público)
│   │   ├── pagamentos/pix/gerar/
│   │   │   └── route.ts              # POST — gera cobrança PIX (Fase 6)
│   │   ├── webhooks/mercadopago/
│   │   │   └── route.ts              # POST — webhook de confirmação (Fase 6)
│   │   └── reservas/
│   │       ├── criar/
│   │       │   └── route.ts          # POST — cria reserva (autenticado)
│   │       └── [id]/status/
│   │           └── route.ts          # GET — status da reserva (autenticado)
│   ├── layout.tsx                    # Layout raiz
│   └── not-found.tsx                 # 404 customizado
├── components/
│   ├── ui/                           # 14 componentes shadcn
│   ├── layout/
│   │   ├── header.tsx                # Responsivo + aria (link Minhas Reservas)
│   │   ├── footer.tsx                # 4 colunas
│   │   └── client-header.tsx         # Fase 7 — Header da área do cliente
│   └── features/
│       ├── home-content.tsx          # Landing page (hero carrossel + galeria de fotos)
│       ├── hero-carousel.tsx         # Fase 7.5 — Slideshow automático no hero
│       ├── photo-gallery.tsx         # Fase 7.5 — Grid de fotos com lightbox
│       ├── acomodacoes-content.tsx   # Fase 7.5 — Conteúdo da página /acomodacoes
│       ├── whatsapp-button.tsx       # Botão flutuante
│       ├── auth/                     # Fase 10 — Componentes de autenticação híbrida
│       │   ├── auth-tabs.tsx         # Fase 10 — Tabs: Google | Email | Telefone
│       │   ├── login-social-buttons.tsx # Fase 10 — Botão Google OAuth (SVG inline)
│       │   ├── login-email-form.tsx  # Fase 10 — Form email+senha (login + cadastro + recovery)
│       │   ├── otp-login-form.tsx    # Fase 10 — Form OTP por telefone (extraído do auth-gate)
│       │   └── telefone-verificacao.tsx # Fase 10 — Coleta e verifica telefone pós-OAuth
│       └── reserva/
│           ├── auth-gate.tsx         # Tela OTP (detecta perfil incompleto após auth)
│           ├── client-profile-form.tsx # Fase 7.5 — Formulário nome + email pós-OTP
│           ├── step-indicator.tsx    # Barra de progresso 3 steps
│           ├── date-selector.tsx     # Step 1 — calendário de intervalo
│           ├── room-selector.tsx     # Step 2 — cards de quartos + preços
│           ├── reservation-summary.tsx # Step 3 — resumo + confirmar
│           ├── pix-payment.tsx       # Fase 6 — QR Code + timer + polling
│           └── reserva-card.tsx      # Fase 7 — Card de reserva individual
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # @supabase/ssr — NÃO alterar
│   │   ├── server.ts                 # @supabase/ssr — NÃO alterar
│   │   └── admin.ts                  # service_role — NÃO alterar
│   ├── api/
│   │   ├── mercadopago/
│   │   │   └── client.ts             # Fase 6 — SDK Mercado Pago configurado
│   │   └── email/
│   │       ├── client.ts             # Fase 7.5 — Client Resend (graceful se sem chave)
│   │       └── templates/
│   │           ├── confirmacao-cliente.ts  # Fase 7.5 — Email HTML para o hóspede
│   │           └── notificacao-pousada.ts  # Fase 7.5 — Email HTML para a pousada (VIP/Frequente)
│   ├── hooks/
│   │   └── use-reserva.ts            # Zustand store (sessionStorage SSR-safe)
│   ├── constants/
│   │   ├── pousada.ts                # Dados centralizados da pousada
│   │   ├── acomodacoes.ts
│   │   └── index.ts
│   ├── validations/
│   │   └── reserva.ts                # Zod v4 — NÃO alterar
│   ├── utils.ts                      # cn() + re-exports (barrel)
│   └── utils/
│       ├── date.ts                   # 14 funções de data
│       └── format.ts                 # 16 funções de formatação
├── types/
│   ├── database.ts                   # 25 tabelas (+ email_cliente em clientes_xngrl) — NÃO alterar
│   ├── index.ts                      # Row aliases + constantes — NÃO alterar
│   └── pagamentos.ts                 # Fase 6 — PixResponse, WebhookMercadoPago, PaymentStatus
├── public/
│   └── images/
│       ├── hero/                     # Fase 7.5 — 4 imagens para o carrossel (hero-1 a hero-4)
│       ├── galeria/                  # Fase 7.5 — 8 imagens da galeria da landing page
│       └── acomodacoes/              # Fase 7.5 — 10 imagens das acomodações
├── app/
│   ├── (admin)/                      # Fase 8 — Grupo de rotas protegidas pelo layout admin
│   │   ├── layout.tsx                # Chama verificarAdmin(), renderiza Sidebar + Header
│   │   └── admin/
│   │       ├── dashboard/
│   │       │   ├── page.tsx          # KPIs, gráfico de ocupação, próximos check-ins
│   │       │   └── ocupacao-chart.tsx # AreaChart (recharts, dynamic import ssr:false)
│   │       ├── reservas/
│   │       │   ├── page.tsx          # Lista com filtros + botão "Nova Reserva" (Fase 8.7)
│   │       │   ├── nova/page.tsx     # Fase 8.7 — Criar reserva presencial (walk-in)
│   │       │   └── [id]/page.tsx     # Detalhe + Dialogs: check-in, check-out, cancelamento
│   │       ├── day-use/
│   │       │   └── page.tsx          # Fase 8.7 — Listagem (Hoje/Próximos/Histórico) + criar walk-in
│   │       ├── pre-reservas/
│   │       │   └── page.tsx          # Tabs por status + auto-refresh 30s
│   │       ├── calendario/
│   │       │   └── page.tsx          # Grade mensal de ocupação + Dialog por dia
│   │       ├── clientes/
│   │       │   ├── page.tsx          # Listagem com busca e badges de categoria
│   │       │   └── [id]/page.tsx     # Perfil + Tabs: reservas / pré-reservas
│   │       └── configuracoes/
│   │           └── page.tsx          # Placeholder cards "Em breve"
│   ├── (admin-public)/               # Fase 8 — Grupo público (sem auth) para login admin
│   │   └── admin/login/
│   │       └── page.tsx              # Login admin com email + senha (sem Twilio/OTP)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── metricas/route.ts     # GET — KPIs do dashboard
│   │   │   ├── ocupacao/route.ts     # GET — taxa diária de ocupação (?dias=30)
│   │   │   ├── reservas/
│   │   │   │   ├── route.ts          # GET — lista com filtros
│   │   │   │   ├── criar/route.ts    # Fase 8.7 — POST criar reserva walk-in (direto em confirmadas)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET — detalhe da reserva
│   │   │   │       ├── checkin/route.ts   # POST — registra check-in
│   │   │   │       ├── checkout/route.ts  # POST — registra check-out
│   │   │   │       └── cancelar/route.ts  # POST — cancela reserva
│   │   │   ├── day-use/
│   │   │   │   ├── route.ts          # Fase 8.7 — GET lista day uses admin (?data_inicio=&data_fim=)
│   │   │   │   └── criar/route.ts    # Fase 8.7 — POST criar day use walk-in (direto como confirmed)
│   │   │   ├── disponibilidade/route.ts  # Fase 8.7 — GET disponibilidade com detalhes por dia
│   │   │   ├── pre-reservas/route.ts # GET — lista (?status=)
│   │   │   ├── calendario/route.ts   # GET — ocupação mensal (?mes=&ano=)
│   │   │   └── clientes/
│   │   │       ├── route.ts          # GET — lista (?busca=)
│   │   │       ├── buscar/route.ts   # Fase 8.7 — GET busca cliente por telefone (autopreenchimento)
│   │   │       └── [id]/route.ts     # GET — perfil + histórico
│   │   └── cron/
│   │       └── limpeza/
│   │           ├── prereservas/route.ts  # GET (CRON_SECRET) — expira pré-reservas vencidas
│   │           └── bloqueios/route.ts    # GET (CRON_SECRET) — limpa bloqueios temporários
├── components/layout/
│   ├── admin-sidebar.tsx             # Fase 8 — Sidebar (+ link Day Use com ícone Sun na Fase 8.7)
│   └── admin-header.tsx             # Fase 8 — Header com nome, data e dropdown logout
├── components/features/admin/
│   ├── criar-reserva-form.tsx        # Fase 8.7 — Formulário walk-in quartos (6 blocos)
│   └── criar-dayuse-form.tsx         # Fase 8.7 — Formulário walk-in day use
├── lib/auth/
│   └── admin.ts                      # Fase 8 — verificarAdmin(): verifica por email ou telefone
└── middleware.ts                     # NÃO alterar
```

> **Nota imagens:** Os arquivos em `public/images/` são SVG placeholders para desenvolvimento. Substituir pelos arquivos reais (`.jpg` ou `.webp`) fornecidos pelo proprietário antes do deploy, atualizando as extensões nos componentes `hero-carousel.tsx`, `home-content.tsx` e `acomodacoes-content.tsx`.

### Pastas ainda NÃO criadas (Fase 9)

```
vercel.json                           # Fase 9
```

---

## Banco de Dados — Supabase (Fase 2 concluída)

### Totais configurados
- **22 tabelas** com RLS ativo (tabela `empresa` removida na Fase 8)
- **13+ functions** SQL
- **2 triggers** automáticos
- **65–70 policies** de segurança

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `acomodacoes` | Unidades disponíveis (Casa, Chalé) |
| `clientes_xngrl` | Clientes cadastrados (+ `email_cliente` Fase 7.5, + `auth_provider` e `telefone_verificado` Fase 10) |
| `pre_reservas` | Pré-reservas aguardando pagamento |
| `reservas_confirmadas` | Reservas com pagamento confirmado |
| `disponibilidade_quartos` | Bloqueios por data/unidade |
| `precos_acomodacoes` | Preços por período |
| `pacotes_especiais` | Pacotes especiais |
| `precos_pacotes` | Preços dos pacotes |
| `periodos_reserva` | Períodos abertos para reserva |
| `conversas` | Histórico de conversas |
| `historico_status_reserva` | Auditoria de status |
| `avaliacoes_quarto` | Avaliações pós-checkout |
| `day_use_config` | Configuração do day use |
| `day_use_reservations` | Reservas de day use |
| `holidays` | Feriados |
| `usuarios_admin` | Admins e recepcionistas (+ coluna `email` adicionada na Fase 8) |
| `metricas_diarias` | KPIs diários |
| `destinatarios_relatorios` | Destinatários de relatórios |
| `historico_relatorios` | Histórico de relatórios enviados |
| `logs_bloqueios_internos` | Logs de bloqueios |
| `notificacoes_pendentes` | Fila de notificações |
| `notificacoes_enviadas` | Histórico de notificações |

### Tipos de Acomodação (schema real)
```typescript
tipo: 'Casa' | 'Chalé'
categoria: 'com_cozinha' | 'sem_cozinha' | null
```

### Functions SQL disponíveis no Supabase
- `verificar_e_criar_reserva()` — cria pré-reserva com bloqueio
- `validar_reserva_completa()` — valida dados antes de confirmar
- `verificar_periodo_reserva_aberto()` — checa disponibilidade
- `verificar_periodo_pacote()` — valida período para pacotes
- `buscar_precos_pacote()` — retorna preços do pacote
- `listar_pacotes_ativos()` — lista pacotes vigentes
- `criar_notificacao()` — insere na fila de notificações
- `marcar_notificacao_enviada()` — marca como enviada

### Triggers
- `trigger_notificar_prereserva` — dispara ao criar pré-reserva
- `trigger_notificar_reserva_confirmada` — dispara ao confirmar

---

## Dados da Pousada (lib/constants/pousada.ts)

```typescript
export const POUSADA = {
  nome: 'Pousada Xangri-lá',
  nomeCompleto: 'Pousada Xangri-lá',
  slogan: 'O seu refúgio às margens do Rio Una, em Morros/MA',
  descricao: 'Conforto, natureza e tranquilidade em um só lugar.',
  telefone: '(98) 99117-8982',
  whatsapp: '5598991178982',
  whatsappLink: 'https://wa.me/5598991178982',
  email: 'contato@pousadaxangrila.com.br',
  endereco: { logradouro: 'BR-402, Km 42', cidade: 'Morros', estado: 'MA', completo: 'BR-402, Km 42 - Morros - MA' },
  googleMapsUrl: 'https://maps.google.com/?q=Pousada+Xangri-lá+Morros+São+Luís',
  googleMapsEmbed: '',
  social: {
    instagram: { url: 'https://instagram.com/pousadaxangrilademorros', handle: '@pousadaxangrilademorros' },
    facebook: { url: 'https://facebook.com/pousadaxangrilademorros', handle: 'pousadaxangrilademorros' },
  },
  horarios: {
    checkin: { inicio: '14:00', fim: '22:00', label: '14:00 - 22:00' },
    checkout: { limite: '12:00', label: 'Até 12:00' },
    recepcao: { inicio: '08:00', fim: '22:00', label: '08:00 - 22:00' },
  },
  seo: {
    titleDefault: 'Pousada Xangri-lá - Morros, São Luís - MA',
    titleTemplate: '%s | Pousada Xangri-lá',
    description: 'O seu refúgio às margens do Rio Una, em Morros/MA. Casas e chalés com conforto e tranquilidade. Reserve agora!',
    keywords: ['pousada são luís', 'hospedagem morros', 'chalé são luís', 'pousada maranhão', 'pousada xangrilá'],
  },
} as const;

export const ROUTES = {
  home: '/', sobre: '/sobre', quartos: '/quartos', acomodacoes: '/acomodacoes', contato: '/contato',
  dayUse: '/day-use', expedicoes: '/expedicoes', reservar: '/reservar', minhasReservas: '/minhas-reservas',
  termos: '/termos', privacidade: '/privacidade',
  admin: { dashboard: '/dashboard', reservas: '/dashboard/reservas', relatorios: '/dashboard/relatorios' },
  api: { disponibilidade: '/api/disponibilidade', reservasCriar: '/api/reservas/criar', reservasStatus: '/api/reservas/status' },
} as const;
```

---

## Variáveis de Ambiente (.env.local)

```bash
# Supabase (já configurado — Fase 2)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Mercado Pago (necessário na Fase 6)
MERCADOPAGO_ACCESS_TOKEN=TEST-...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...

# Notificações (necessário nas Fases 6/7)
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+5598...

# Cron (necessário na Fase 9)
CRON_SECRET=

# Auth OAuth (Fase 10)
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://pousadaxangrilademorros.com.br/auth/callback
```

---

## Padrões de Código

### Imports de utilitários
```typescript
// ✅ CORRETO — barrel export
import { cn, formatarMoeda, formatarData } from '@/lib/utils';

// ❌ ERRADO — não importar direto de subpastas
import { formatarMoeda } from '@/lib/utils/format';
```

### Cliente Supabase
```typescript
// Server Component / Server Action
import { createClient } from '@/lib/supabase/server';

// Client Component ('use client')
import { createClient } from '@/lib/supabase/client';

// API Route com permissão total (service role)
import { createAdminClient } from '@/lib/supabase/admin';
```

### Validação com Zod v4
```typescript
// ✅ Correto — Zod v4
dataCheckin: z.date().refine(date => date >= hoje, {
  message: 'Data inválida',
}),

// ❌ Errado — Zod v3, quebra o build
dataCheckin: z.date({ required_error: '...' }),
```

### Toasts
```typescript
// ✅ Correto
import { toast } from 'sonner';
toast.success('Reserva criada!');
toast.error('Erro ao processar.');

// ❌ NÃO usar
import { useToast } from '@/components/ui/use-toast';
```

### Ícones de redes sociais
```typescript
// ✅ Correto — lucide-react v1.6.0 não tem Instagram/Facebook
import { Globe, Share2 } from 'lucide-react';

// ❌ Não existem nessa versão
import { Instagram, Facebook } from 'lucide-react';
```

---

## Correções já aplicadas — NÃO reverter

Estas correções foram aplicadas pelo Claude Code durante as Fases 4 e 5:

1. **Zod v3 → v4** em `lib/validations/reserva.ts` — removido `required_error` de `z.date()`
2. **Ícones** — `Instagram` e `Facebook` substituídos por `Globe` e `Share2`
3. **lib/utils/index.ts** — criado como barrel export (re-exporta `cn`, `date` e `format`)
4. **@supabase/auth-helpers-nextjs removido** — substituído por `@supabase/ssr` nos 3 clientes
5. **Supabase JS v2.100+ / type inference** — nas API routes que usam `createAdminClient()`, queries `.from()` e `.rpc()` requerem cast explícito (`as any` + type assertion no resultado) para contornar inferência de `never`. Não reverter — é compatibilidade com `@supabase/supabase-js ^2.100.0`
6. **Login admin via email/senha** — o painel admin (`/admin/*`) usa login com email+senha em `app/(admin-public)/admin/login/page.tsx`, **não** OTP via SMS. `verificarAdmin()` em `lib/auth/admin.ts` verifica `user.email` contra `usuarios_admin.email` (ou `user.phone` contra `telefone_whatsapp` como fallback). Não reverter para OTP — Twilio trial não envia SMS para números não verificados.
7. **`app/(admin-public)` route group** — grupo de rotas sem proteção de auth, necessário para que `/admin/login` não entre em loop com o layout `(admin)`. Coexiste com `(admin)` porque as URLs finais não se sobrepõem.
8. **`reservas_confirmadas.valor_restante` é coluna gerada** — calculada automaticamente pelo banco como `valor_total - valor_pago`. Nunca incluir no INSERT/UPDATE. Qualquer tentativa causa erro `428C9`. (Descoberto na Fase 8.7)
9. **`reservas_confirmadas.metodo_pagamento` requer migration manual** — coluna não existia no schema original. Foi adicionada via `ALTER TABLE reservas_confirmadas ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT` na Fase 8.7. Executar em produção antes do deploy.
10. **Autenticação híbrida (Fase 10)** — o login do cliente público agora suporta 3 métodos: Google OAuth, Email+Senha e OTP por telefone. OTP só é enviado no **primeiro acesso** (cadastro). Segundos logins via Google/Email não consomem SMS. Novos campos em `clientes_xngrl`: `auth_provider` e `telefone_verificado` — migration executada em dev em 2026-04-21. `NEXT_PUBLIC_AUTH_CALLBACK_URL` deve ser configurado no painel Vercel com URL de produção. **Atenção:** no PostgreSQL, `ADD COLUMN ... CHECK(...)` na mesma instrução é inválido — usar `ADD CONSTRAINT ... CHECK(...)` como instrução separada.
11. **Google OAuth em modo de testes** — o app Google está em "modo de testes". Para qualquer email conseguir fazer login, publicar o app em: Google Cloud Console → Google Auth Platform → Público → **Publicar app**. Enquanto em modo de testes, apenas emails adicionados em "Usuários de teste" funcionam.
12. **Fase 10.1 — Callback OAuth com propagação de cookies + domínio correto** — `app/auth/callback/route.ts` usa `createServerClient` diretamente (não o wrapper `createClient()`) e acumula os cookies via `setAll`, propagando-os no `NextResponse.redirect()`. Sem isso, a sessão é criada no Supabase mas os cookies se perdem no redirect, causando loop de login. O domínio de produção correto é `pousadaxangrilademorros.com.br` (não `pousadaxangrila.com.br`). Configurações externas (Google Cloud Console origens JS + Supabase Site URL + Redirect URLs) devem apontar para `pousadaxangrilademorros.com.br`. A variável `NEXT_PUBLIC_AUTH_CALLBACK_URL` no Vercel deve ser `https://pousadaxangrilademorros.com.br/auth/callback`.
13. **Fase 10.2 — Verificação de telefone pós-OAuth sem substituir sessão** — O componente `telefone-verificacao.tsx` **NÃO DEVE** usar `supabase.auth.signInWithOtp()` / `supabase.auth.verifyOtp()` para verificar telefone pós-login social. Esses métodos criam uma nova sessão de telefone, destruindo a sessão Google ativa e causando: nome do cliente = número de telefone, perda do email, registros duplicados em `clientes_xngrl`. Solução: `app/api/auth/verificar-telefone/route.ts` envia SMS via Twilio Verify diretamente (quando `body.telefone` presente); `app/api/auth/completar-perfil-social/route.ts` verifica o código via Twilio e salva com email+nome da sessão ativa. A route `verificar-telefone` é dual-purpose: `{ email }` → check status (para auth-gate/login-email-form), `{ telefone }` → enviar OTP (para telefone-verificacao.tsx). SQL de limpeza manual necessário para registros duplicados criados antes da correção.

---

## Fase 9 — Deploy (Código Concluído)

### Arquivos criados/modificados na Fase 9
- `vercel.json` — região `gru1`, crons prereservas (30min) e bloqueios (1h)
- `app/api/health/route.ts` — health check /api/health (200/503)
- `app/robots.ts` — bloqueia /admin/, /api/, /login
- `app/sitemap.ts` — 6 páginas públicas com pousadaxangrilademorros.com.br
- `.env.production.example` — template de variáveis para o painel Vercel
- `next.config.ts` — headers de segurança (X-Frame-Options, CSP, etc.)
- `app/layout.tsx` — metadata SEO melhorada com URL de produção e OpenGraph
- `app/(admin)/admin/dashboard/loading.tsx` — skeleton admin
- `app/(admin)/admin/reservas/loading.tsx` — skeleton admin
- `app/(admin)/admin/clientes/loading.tsx` — skeleton admin
- `app/(admin)/admin/day-use/loading.tsx` — skeleton admin
- `app/reservar/loading.tsx` — skeleton wizard
- Email hardcoded removido dos routes PIX (usa `POUSADA_EMAIL` env var)
- Cron prereservas: auth strict (removido bypass de dev)

### Ações manuais pendentes antes do go-live
- DNS: registro A e CNAME no registrador apontando para Vercel
- Painel Vercel: configurar todas as variáveis de `.env.production.example`
- Mercado Pago: trocar TEST- por APP_USR- e configurar webhook
- Resend: verificar domínio pousadaxangrilademorros.com.br
- Supabase: SQL migrations manuais (Frente 1 do PROMPT_FASE9) + dados reais
- Imagens: substituir SVG placeholders por fotos reais

---

## ⚠️ Checklist de Verificação — Antes do Deploy (Fase 9)

### Banco de Dados (Supabase)
- [x] Migration executada em dev: `ALTER TABLE day_use_config ADD COLUMN IF NOT EXISTS daily_free_limit integer DEFAULT 15` — **executar também em produção antes do deploy**
- [x] Registro de configuração Day Use inserido em dev — **inserir em produção com dados reais**
- [ ] Inserir registros reais em `acomodacoes` e `precos_acomodacoes` (dados de produção)
- [ ] Inserir período de reserva ativo em `periodos_reserva` com datas de produção
- [ ] Inserir configuração real do Day Use em `day_use_config` (preços, capacidade, horários)

### Mercado Pago
- [ ] Trocar credenciais `TEST-...` por `APP_USR-...` (produção) no painel Vercel
- [ ] Substituir email hardcoded `jonhselmo.engcomp@gmail.com` em `app/api/pagamentos/pix/gerar/route.ts` pelo email real da pousada
- [ ] Configurar webhook no painel MP apontando para URL de produção: `https://[dominio]/api/webhooks/mercadopago`
- [ ] Configurar webhook também para o Day Use (mesmo endpoint — o código já roteia por prefixo `DU-` vs `PXL-`)

### Emails (Resend — Fase 7.5)
- [ ] Configurar `RESEND_API_KEY` no painel Vercel
- [ ] Verificar domínio `pousadaxangrila.com.br` no painel do Resend para envio com remetente `noreply@pousadaxangrila.com.br`
- [ ] Substituir fotos placeholder em `public/images/` por fotos reais (hero, galeria, acomodações)

### Variáveis de Ambiente
- [ ] `NEXT_PUBLIC_APP_URL` → URL de produção (sem barra final)
- [ ] `TWILIO_PHONE_NUMBER` corrigir formato — valor atual tem `=123456` no final (erro de digitação)
- [ ] Todas as variáveis configuradas no painel Vercel (não apenas no `.env.local`)
