# INSTRUÇÕES PARA CLAUDE CODE — IMPLEMENTAÇÃO DA FASE 6: PAGAMENTOS PIX VIA MERCADO PAGO

## CONTEXTO DO PROJETO

Você está trabalhando no projeto `xangrila_web`, um sistema web para gerenciamento da Pousada Xangrilá (Morros, São Luís - MA), construído com:
- **Next.js 16.1.6** (App Router)
- **TypeScript ^5**
- **Tailwind CSS ^4**
- **Shadcn/ui 4.1.0**
- **Supabase** (PostgreSQL com RLS)
- **Zod ^4.3.6** (v4, NÃO v3)
- **Zustand ^5.0.12**
- **Sonner 2.0.7** (toasts)
- **date-fns ^4.1.0**
- **react-day-picker ^9.14.0**
- **React Hook Form ^7**
- **lucide-react ^1.6.0**
- **@supabase/ssr 0.9.0**
- **qrcode.react ^4.2.0** (já no package.json — verificar antes de instalar)

As Fases 1 a 5 estão concluídas (setup, banco, código base, landing page, sistema de reservas com auth OTP).
A Fase 6 (Pagamentos PIX via Mercado Pago) precisa ser implementada DO ZERO.

---

## REGRAS CRÍTICAS — NUNCA VIOLAR

1. **NÃO** usar `@supabase/auth-helpers-nextjs` — deprecated. Usar **`@supabase/ssr`** (já configurado em `lib/supabase/`)
2. **NÃO** usar `toast` do Shadcn/ui — usar **`sonner`**: `import { toast } from 'sonner';`
3. **NÃO** usar Zod v3 (ex: `z.date({ required_error: '...' })`) — usar **Zod v4**: `z.date().refine(...)`
4. **NÃO** usar ícones `Instagram`/`Facebook` do lucide-react (não existem na v1.6.0)
5. **NÃO** alterar os arquivos protegidos (listados abaixo)
6. **NÃO** importar utilitários de subpastas — usar barrel export: `import { cn, formatarMoeda } from '@/lib/utils'`
7. **NÃO** usar `createClientComponentClient` ou `createServerComponentClient` — usar os clientes já criados em `lib/supabase/`
8. **NÃO** usar `useToast` do Shadcn — usar `toast` do `sonner`
9. **NÃO** usar `idempotencyKey` fixo/hardcoded no MercadoPagoConfig — gerar dinamicamente por requisição
10. **NÃO** usar `localStorage` ou `sessionStorage` diretamente — verificar `typeof window` primeiro (SSR)

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
components/ui/*.tsx  (14 componentes shadcn)
app/globals.css
```

---

## DEPENDÊNCIAS A INSTALAR

```bash
# Mercado Pago SDK (backend — Node.js)
npm install mercadopago

# QR Code (frontend — verificar se já existe antes)
npm list qrcode.react || npm install qrcode.react
```

**NÃO instalar:** `@mercadopago/sdk-js` nem `@mercadopago/sdk-react` (não são necessários para PIX server-side).

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Adicionar ao `.env.local` (se ainda não existirem):

```bash
# Mercado Pago (usar credenciais de TESTE primeiro)
MERCADOPAGO_ACCESS_TOKEN=TEST-seu-access-token-aqui
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-sua-public-key-aqui

# URL do app (já deve existir)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**IMPORTANTE:** Em produção, trocar `TEST-...` pelas credenciais de produção (`APP_USR-...`).

---

## TABELAS DO BANCO JÁ EXISTENTES (Fase 2)

A Fase 6 usa estas tabelas que JÁ EXISTEM no Supabase:

### `pre_reservas` (colunas relevantes para pagamento)
```sql
reserva_id          TEXT PRIMARY KEY     -- ex: PXL-2026-ABC123
cliente_id          INTEGER              -- FK para clientes_xngrl
data_checkin        DATE
data_checkout       DATE
pessoas             INTEGER
tipo_quarto         TEXT
total_diarias       INTEGER
valor_total         NUMERIC
valor_sinal         NUMERIC              -- 50% do valor_total
status              TEXT                 -- 'aguardando_pagamento' | 'pago' | 'expirado' | 'cancelado'
expira_em           TIMESTAMP
chave_pix           TEXT                 -- código PIX copiável (preenchido pela API)
pix_payload         TEXT                 -- QR Code base64 (preenchido pela API)
qr_code_url         TEXT                 -- URL do ticket do MP (preenchido pela API)
```

### `reservas_confirmadas` (colunas relevantes)
```sql
reserva_id          TEXT PRIMARY KEY
cliente_id          INTEGER
valor_total         NUMERIC
valor_pago          NUMERIC              -- atualizado quando pagamento confirmado
status              TEXT                 -- 'pendente' | 'confirmada' | 'cancelada'
data_pagamento      TIMESTAMP            -- preenchido quando pago
metodo_pagamento    TEXT                 -- 'pix'
```

### `notificacoes_pendentes` (para notificação automática)
```sql
tipo                TEXT                 -- 'email' | 'sms' | 'whatsapp'
destinatario        TEXT                 -- email ou telefone
assunto             TEXT
mensagem            TEXT
metadata            JSONB
```

---

## FUNCTIONS SQL JÁ EXISTENTES

- `criar_notificacao(tipo, destinatario, assunto, mensagem, metadata, agendar_para)` — insere na fila de notificações
- `trigger_notificar_reserva_confirmada` — dispara automaticamente ao atualizar `reservas_confirmadas` para status='confirmada'

**NÃO há function SQL para confirmar reserva via pagamento.** A lógica de confirmação deve ser feita na API Route do webhook.

---

## FLUXO COMPLETO DE PAGAMENTO PIX

```
1. Cliente conclui reserva (Fase 5)
   → API /api/reservas/criar cria:
     • reservas_confirmadas (status='pendente', valor_pago=0)
     • pre_reservas (status='aguardando_pagamento')
   → Retorna reserva_id + valor_sinal

2. Frontend redireciona para /reservar/pagamento?id=PXL-2026-XXXXXX

3. Componente PixPayment monta e chama POST /api/pagamentos/pix/gerar
   → Backend busca pre_reserva no banco
   → Valida status === 'aguardando_pagamento'
   → Chama Mercado Pago API para criar pagamento PIX
   → Salva dados PIX na pre_reserva (chave_pix, pix_payload, qr_code_url)
   → Retorna QR Code + código copiável para o frontend

4. Frontend exibe QR Code + timer de expiração
   → Polling a cada 5s em GET /api/reservas/[id]/status

5. Cliente paga PIX pelo app do banco

6. Mercado Pago envia webhook POST /api/webhooks/mercadopago
   → Backend valida notificação
   → Busca detalhes do pagamento na API do MP
   → Se status='approved':
     • Atualiza reservas_confirmadas (valor_pago, status='confirmada', data_pagamento)
     • Atualiza pre_reservas (status='pago')
     • Trigger notificar_reserva_confirmada dispara automaticamente

7. Polling do frontend detecta status='confirmada'
   → Redireciona para /reservar/confirmacao?id=...
```

---

## ESTRUTURA DE ARQUIVOS DA FASE 6

```
xangrila_web/
├── app/
│   ├── api/
│   │   ├── pagamentos/
│   │   │   └── pix/
│   │   │       └── gerar/
│   │   │           └── route.ts              # POST — gerar PIX via Mercado Pago
│   │   └── webhooks/
│   │       └── mercadopago/
│   │           └── route.ts                  # POST — webhook do Mercado Pago
│   └── reservar/
│       ├── pagamento/
│       │   └── page.tsx                      # Página de pagamento PIX
│       └── confirmacao/
│           └── page.tsx                      # Página de confirmação pós-pagamento
├── components/
│   └── features/
│       └── reserva/
│           └── pix-payment.tsx               # Componente QR Code + timer + polling
├── lib/
│   └── api/
│       └── mercadopago/
│           └── client.ts                     # Client do Mercado Pago (Payment)
└── types/
    └── pagamentos.ts                         # Types para PIX, webhook e status
```

**Total: 7 arquivos novos**

---

## IMPLEMENTAÇÃO DETALHADA

### 1. `types/pagamentos.ts`

Types para todo o sistema de pagamentos.

```typescript
// Dados para gerar PIX
export interface GerarPixRequest {
  reservaId: string;
  email?: string;     // opcional — gerar temp se não fornecido
}

// Resposta da API de geração de PIX
export interface PixResponse {
  success: boolean;
  payment_id?: number;
  qr_code?: string;          // string copiável do PIX
  qr_code_base64?: string;   // imagem QR em base64
  ticket_url?: string;       // link do Mercado Pago
  valor?: number;
  expira_em?: string;
  error?: string;
}

// Webhook do Mercado Pago
export interface WebhookMercadoPago {
  action: string;
  api_version: string;
  data: {
    id: string;               // ID do pagamento
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice' | 'point_integration_wh';
  user_id: string;
}

// Status do pagamento/reserva
export interface PaymentStatus {
  reserva_id: string;
  status: 'aguardando_pagamento' | 'confirmada' | 'expirada' | 'cancelada';
  tipo: 'pre_reserva' | 'reserva';
  payment_id?: number;
  valor_pago?: number;
  data_pagamento?: string;
}
```

---

### 2. `lib/api/mercadopago/client.ts`

Client do Mercado Pago usando a SDK oficial.

**ATENÇÃO:** A SDK v2+ do Mercado Pago tem a classe `Payment` para gerenciar pagamentos individuais. A classe `Order` é para fluxos de checkout mais complexos. Para PIX simples, usar `Payment`.

```typescript
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Validar token no startup
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn('[MercadoPago] ⚠️ MERCADOPAGO_ACCESS_TOKEN não configurado');
}

// Criar configuração SEM idempotencyKey fixo
// (será passado por requisição quando necessário)
const client = new MercadoPagoConfig({
  accessToken: accessToken || '',
  options: {
    timeout: 10000,   // 10 segundos timeout
  },
});

// Exportar cliente de pagamentos
export const paymentClient = new Payment(client);

// Helper para verificar se está configurado
export function isMercadoPagoConfigured(): boolean {
  return !!accessToken && accessToken.length > 10;
}
```

**CORREÇÃO vs conversa original:**
- Removido `idempotencyKey: 'pousada-xangrila'` do config — isso é ERRADO porque tornaria TODAS as requisições idempotentes com a mesma chave, fazendo o MP retornar o resultado da primeira requisição sempre
- Aumentado timeout de 5000 para 10000ms (PIX pode demorar)
- Adicionado `console.warn` ao invés de `throw new Error` — para não quebrar o build se a variável não estiver configurada em dev

---

### 3. `app/api/pagamentos/pix/gerar/route.ts` (POST)

Gera código PIX via Mercado Pago.

**Fluxo:**
1. Verificar autenticação (sessão Supabase via `createClient` server)
2. Validar body com Zod (reservaId obrigatório, email opcional)
3. Buscar pré-reserva pelo reserva_id (admin client)
4. Validar que a pré-reserva pertence ao usuário autenticado
5. Validar status === 'aguardando_pagamento'
6. Chamar `paymentClient.create()` com dados do PIX
7. Salvar dados PIX na pre_reserva (chave_pix, pix_payload, qr_code_url)
8. Retornar PixResponse

**Dados do `paymentClient.create()`:**
```typescript
{
  body: {
    transaction_amount: Number(preReserva.valor_sinal),
    description: `Sinal - Reserva Pousada Xangrilá ${reservaId}`,
    payment_method_id: 'pix',
    external_reference: reservaId,  // CRUCIAL — liga pagamento à reserva
    payer: {
      email: emailPagador,
      first_name: nomeCliente,
    },
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    metadata: {
      reserva_id: reservaId,
      tipo: 'sinal_reserva',
      cliente_id: preReserva.cliente_id,
    },
  },
}
```

**Resposta do Mercado Pago relevante:**
```typescript
payment.point_of_interaction?.transaction_data?.qr_code       // string copiável
payment.point_of_interaction?.transaction_data?.qr_code_base64 // imagem
payment.point_of_interaction?.transaction_data?.ticket_url     // link MP
```

**CORREÇÃO vs conversa original:**
- Adicionada verificação de autenticação (a conversa original não verificava sessão)
- Adicionada validação de que a reserva pertence ao usuário autenticado
- Email temporário gerado como `reserva-{reservaId}@pousadaxangrila.temp` (mais limpo que usar telefone)

---

### 4. `app/api/webhooks/mercadopago/route.ts` (POST)

Webhook que recebe notificações do Mercado Pago.

**IMPORTANTE:** Este endpoint DEVE ser público (sem autenticação). O Mercado Pago precisa chamá-lo diretamente.

**Fluxo:**
1. Receber body do webhook
2. Responder 200 IMEDIATAMENTE (antes de processar — o MP espera resposta rápida)
3. Validar type === 'payment'
4. Buscar detalhes do pagamento na API do MP: `paymentClient.get({ id: paymentId })`
5. Verificar status === 'approved'
6. Extrair `external_reference` (nosso reserva_id)
7. Atualizar `reservas_confirmadas`:
   - `valor_pago = transaction_amount`
   - `status = 'confirmada'`
   - `data_pagamento = NOW()`
   - `metodo_pagamento = 'pix'`
8. Atualizar `pre_reservas`:
   - `status = 'pago'`
9. O trigger `trigger_notificar_reserva_confirmada` dispara automaticamente ao atualizar reservas_confirmadas

**CORREÇÃO vs conversa original:**
- A conversa original chamava `supabase.rpc('confirmar_reserva_transacional')` — esta function NÃO EXISTE no banco. A confirmação deve ser feita com UPDATEs diretos.
- Adicionada proteção contra replay (verificar se já está confirmada antes de processar)
- Adicionado log estruturado para debugging

**Sobre segurança do webhook:**
- O Mercado Pago SDK v2 não oferece verificação de assinatura nativa para webhooks
- A mitigação é: ao receber a notificação, SEMPRE buscar o pagamento diretamente na API do MP (`paymentClient.get()`) para validar que é real
- Nunca confiar apenas nos dados do body do webhook

---

### 5. `components/features/reserva/pix-payment.tsx`

Componente client-side que exibe QR Code, timer de expiração e faz polling de status.

**Props:**
```typescript
interface PixPaymentProps {
  reservaId: string;
  valor: number;
  expiraEm: string;     // ISO string
  onConfirmado: () => void;
}
```

**Comportamento:**
1. Ao montar: chama POST `/api/pagamentos/pix/gerar`
2. Exibe QR Code usando `<QRCode>` do `qrcode.react`
3. Exibe código PIX copiável com botão "Copiar"
4. Timer regressivo até expiração (baseado em `expiraEm`)
5. Polling a cada 5 segundos em GET `/api/reservas/{id}/status`
6. Quando `status === 'confirmada'`: chama `onConfirmado()`
7. Botão manual "Já paguei - Verificar"

**CORREÇÃO vs conversa original:**
- `useToast()` do Shadcn trocado por `toast` do `sonner`
- Adicionado `useCallback` para evitar re-renders desnecessários
- Adicionado cleanup do interval no `useEffect` (já existia na conversa, manter)
- Adicionado tratamento para QR Code base64 vs string — usar `qr_code` (string) para o componente `<QRCode>` e oferecer `qr_code_base64` como alternativa (imagem)

---

### 6. `app/reservar/pagamento/page.tsx`

Página que recebe `?id=PXL-2026-XXXXXX` via query string.

**Fluxo:**
1. Verificar sessão (autenticação OTP — reutilizar padrão da Fase 5)
2. Obter `id` do searchParams
3. Se não tem id: redirecionar para `/reservar`
4. Buscar dados da reserva na store Zustand ou via API
5. Renderizar `<PixPayment>` com os dados
6. `onConfirmado` → redirecionar para `/reservar/confirmacao?id=...`

**CORREÇÃO vs conversa original:**
- Adicionada verificação de autenticação (a conversa original não tinha)
- Fallback: se não tem dados no Zustand, buscar via GET `/api/reservas/{id}/status`

---

### 7. `app/reservar/confirmacao/page.tsx`

Página de sucesso pós-pagamento.

**Conteúdo:**
- Ícone de check verde animado
- "Reserva Confirmada!" como título
- Código da reserva (copiável)
- Resumo: datas, tipo, pessoas, valor pago
- Mensagem: "Você receberá um email/SMS de confirmação"
- Botão "Voltar ao Início" → `/`
- Botão "Ver Minhas Reservas" → `/minhas-reservas` (Fase 7 — pode ser desabilitado por enquanto)

---

## INTEGRAÇÃO COM A FASE 5 (JÁ EXISTENTE)

### Store Zustand (`lib/hooks/use-reserva.ts`)

O store já existe. Verificar se possui os campos necessários para pagamento:
- `reservaId: string`
- `valorSinal: number`
- `expiraEm: string`

Se não tiver, adicionar SEM quebrar a interface existente:
```typescript
// Adicionar ao state existente:
reservaId: string;
valorSinal: number;
valorTotal: number;
expiraEm: string;
```

### API de Status (`app/api/reservas/[id]/status/route.ts`)

JÁ EXISTE da Fase 5. Verificar se retorna os campos:
- `status`: string
- `valor_pago`: number
- `data_pagamento`: string

Se não retorna, estender a response SEM quebrar o contrato existente.

### reservation-summary.tsx (Step 3)

JÁ EXISTE da Fase 5. Após confirmar a reserva, deve redirecionar para `/reservar/pagamento?id={reservaId}`. Se já faz isso, não alterar. Se não faz, adicionar o redirect após sucesso do POST `/api/reservas/criar`.

---

## NOTAS IMPORTANTES SOBRE O MERCADO PAGO

### SDK Node.js — Classe Payment vs Order

A SDK v2+ do Mercado Pago tem duas classes principais:
- **`Payment`** — para criar/gerenciar pagamentos individuais (PIX, cartão, etc.)
- **`Order`** — para fluxos de checkout mais complexos com múltiplas transações

Para PIX simples (nosso caso), usar `Payment`. A classe `Payment` suporta `.create()` e `.get()`.

### Teste com credenciais de teste

- Credenciais TEST geram PIX válidos mas que **não podem ser pagos de verdade**
- O QR Code e código copiável são gerados corretamente
- Para testar o webhook, simular manualmente via curl:
```bash
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"PAYMENT_ID_AQUI"}}'
```

### notification_url

O `notification_url` no `paymentClient.create()` deve apontar para a URL pública do app:
- Em desenvolvimento: usar ngrok (`ngrok http 3000`)
- Em produção: `https://seudominio.com/api/webhooks/mercadopago`

---

## CLIENTES SUPABASE — QUANDO USAR CADA UM

```typescript
// API Route que precisa de permissão total (webhook, admin operations)
import { createAdminClient } from '@/lib/supabase/admin';

// API Route que verifica autenticação do usuário
import { createClient } from '@/lib/supabase/server';

// Client Component ('use client')
import { createClient } from '@/lib/supabase/client';
```

**Regras:**
- Webhook do Mercado Pago → `createAdminClient()` (não tem sessão do usuário)
- API de gerar PIX → `createClient()` server para verificar auth + `createAdminClient()` para operações no banco
- Componente PixPayment → `createClient()` client para verificar sessão

---

## TESTES ESPERADOS

### Gerar PIX
1. Abrir `/reservar`, fazer reserva completa (Fase 5)
2. Após confirmar, ser redirecionado para `/reservar/pagamento?id=PXL-...`
3. QR Code aparece na tela
4. Código PIX é copiável
5. Timer regressivo funciona

### Webhook (simulação)
1. Enviar curl para `/api/webhooks/mercadopago` com body simulado
2. Logs mostram processamento
3. Banco de dados atualizado (reservas_confirmadas e pre_reservas)

### Polling de Status
1. Enquanto aguarda pagamento: status permanece 'aguardando_pagamento'
2. Após webhook confirmar: polling detecta 'confirmada'
3. Frontend redireciona para confirmação

### Cenários de erro
- PIX sem Mercado Pago configurado → erro 500 com mensagem clara
- Reserva não encontrada → erro 404
- Reserva já paga → erro 400 "Já foi processada"
- Webhook com pagamento rejeitado → ignorar (não atualizar banco)

---

## CHECKLIST DE VALIDAÇÃO

```
[ ] npm install mercadopago executado
[ ] npm list qrcode.react confirma instalação
[ ] types/pagamentos.ts criado com PixResponse, WebhookMercadoPago, PaymentStatus
[ ] lib/api/mercadopago/client.ts criado (SEM idempotencyKey fixo)
[ ] app/api/pagamentos/pix/gerar/route.ts funcional
[ ] app/api/webhooks/mercadopago/route.ts funcional (público, sem auth)
[ ] components/features/reserva/pix-payment.tsx com QR Code + timer + polling
[ ] app/reservar/pagamento/page.tsx renderiza PixPayment
[ ] app/reservar/confirmacao/page.tsx com resumo e sucesso
[ ] npm run build sem erros TypeScript
[ ] Teste manual: QR Code aparece e código é copiável
[ ] Teste manual: curl no webhook atualiza o banco
```

---

## NOTAS ADICIONAIS

1. O middleware existente JÁ cuida do refresh de sessão. NÃO alterar.
2. Usar `formatarMoeda()` de `@/lib/utils` para todos os valores monetários.
3. Usar `formatarData()` de `@/lib/utils` para datas exibidas ao usuário.
4. Commits granulares com mensagens em português.
5. A API de gerar PIX DEVE verificar autenticação — diferente do webhook que é público.
6. Não depender da `notification_url` como única forma de confirmação — o polling do frontend serve como backup.
7. O `external_reference` é o campo CRUCIAL que liga o pagamento à reserva — SEMPRE usar o `reserva_id`.
