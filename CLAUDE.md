# Pousada Xangrilá — Sistema Web (`xangrila_web`)

## Visão Geral
Sistema web para gerenciamento da Pousada Xangrilá (Morros, São Luís - MA), desenvolvido com Next.js, TypeScript, Tailwind CSS, Shadcn/ui e Supabase. O projeto é dividido em 9 fases — as fases 1 a 8.6 estão concluídas. A fase 9 está em andamento.

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
| 9 | Deploy e Go-Live (Vercel, domínio, crons) | 🚧 Em andamento |

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
│   ├── login/
│   │   └── page.tsx                  # Página de login OTP client-side
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
│   │   │   │   └── route.ts          # POST — busca/cria cliente após OTP (retorna email)
│   │   │   ├── atualizar-perfil/
│   │   │   │   └── route.ts          # PATCH — salva nome e email do cliente (Fase 7.5)
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
│   │       │   ├── page.tsx          # Lista com filtros: status, tipo, busca
│   │       │   └── [id]/page.tsx     # Detalhe + Dialogs: check-in, check-out, cancelamento
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
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET — detalhe da reserva
│   │   │   │       ├── checkin/route.ts   # POST — registra check-in
│   │   │   │       ├── checkout/route.ts  # POST — registra check-out
│   │   │   │       └── cancelar/route.ts  # POST — cancela reserva
│   │   │   ├── pre-reservas/route.ts # GET — lista (?status=)
│   │   │   ├── calendario/route.ts   # GET — ocupação mensal (?mes=&ano=)
│   │   │   └── clientes/
│   │   │       ├── route.ts          # GET — lista (?busca=)
│   │   │       └── [id]/route.ts     # GET — perfil + histórico
│   │   └── cron/
│   │       └── limpeza/
│   │           ├── prereservas/route.ts  # GET (CRON_SECRET) — expira pré-reservas vencidas
│   │           └── bloqueios/route.ts    # GET (CRON_SECRET) — limpa bloqueios temporários
├── components/layout/
│   ├── admin-sidebar.tsx             # Fase 8 — Sidebar fixa desktop + Sheet mobile
│   └── admin-header.tsx             # Fase 8 — Header com nome, data e dropdown logout
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
| `clientes_xngrl` | Clientes cadastrados (+ `email_cliente` adicionado na Fase 7.5) |
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
  nome: 'Pousada Xangrilá',
  nomeCompleto: 'Pousada Xangrilá - Morros',
  slogan: 'Seu refúgio perfeito em São Luís',
  telefone: '(98) 98167-2949',
  whatsapp: '5598981672949',
  whatsappLink: 'https://wa.me/5598981672949',
  email: 'contato@pousadaxangrila.com.br',
  endereco: { cidade: 'São Luís', estado: 'MA', completo: 'Morros, São Luís - MA' },
  horarios: {
    checkin: { label: '14:00 - 22:00' },
    checkout: { label: 'Até 12:00' },
    recepcao: { label: '08:00 - 22:00' },
  },
}
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

---

## Próximas Fases a Implementar

### Fase 9 — Deploy
- `vercel.json` com cron jobs e região `gru1` (São Paulo)
- Crons necessários:
  - `/api/cron/processar-notificacoes` → a cada minuto
  - `/api/cron/relatorios/diario` → 7h diário
  - `/api/cron/limpeza/bloqueios` → a cada hora
  - `/api/cron/limpeza/prereservas` → a cada 30 min
- Configurar variáveis de ambiente no painel Vercel
- Webhook do Mercado Pago apontando para URL de produção

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
