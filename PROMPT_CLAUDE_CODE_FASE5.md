# INSTRUÇÕES PARA CLAUDE CODE — IMPLEMENTAÇÃO DA FASE 5: SISTEMA DE RESERVAS COM AUTENTICAÇÃO OTP

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

As Fases 1 a 4 estão concluídas (setup, banco de dados, código base, landing page).
A Fase 5 (Sistema de Reservas com Autenticação OTP) precisa ser implementada DO ZERO.

---

## REGRAS CRÍTICAS — NUNCA VIOLAR

1. **NÃO** usar `@supabase/auth-helpers-nextjs` — deprecated. Usar **`@supabase/ssr`** (já configurado em `lib/supabase/`)
2. **NÃO** usar `toast` do Shadcn/ui — usar **`sonner`**: `import { toast } from 'sonner';`
3. **NÃO** usar Zod v3 (ex: `z.date({ required_error: '...' })`) — usar **Zod v4**: `z.date().refine(...)`
4. **NÃO** usar ícones `Instagram`/`Facebook` do lucide-react (não existem na v1.6.0)
5. **NÃO** alterar os arquivos protegidos (listados abaixo)
6. **NÃO** importar utilitários de subpastas — usar barrel export: `import { cn, formatarMoeda } from '@/lib/utils'`
7. **NÃO** usar `createClientComponentClient` ou `createServerComponentClient` — usar os clientes já criados em `lib/supabase/`
8. **NÃO** hardcodar preços nos componentes — buscar das tabelas `precos_acomodacoes` ou `precos_pacotes`
9. **NÃO** usar `localStorage` para persistência do Zustand no SSR sem verificar `typeof window`
10. **NÃO** chamar `supabase.auth.getSession()` no servidor — usar `supabase.auth.getUser()` (conforme middleware existente)

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
components/ui/*.tsx  (12 componentes shadcn)
app/globals.css
```

---

## ESTADO ATUAL DO PROJETO (Fases 1-4 concluídas)

### Estrutura existente

```
xangrila_web/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx, page.tsx, contato/page.tsx, day-use/page.tsx
│   │   ├── loading.tsx, error.tsx
│   ├── layout.tsx                    # Layout raiz
│   └── not-found.tsx
├── components/
│   ├── ui/                           # 12 componentes shadcn
│   ├── layout/
│   │   ├── header.tsx, footer.tsx
│   └── features/
│       ├── home-content.tsx, whatsapp-button.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createClient() — browser — @supabase/ssr
│   │   ├── server.ts                 # createClient() — server (async) — @supabase/ssr
│   │   └── admin.ts                  # createAdminClient() — service role
│   ├── constants/
│   │   ├── pousada.ts, acomodacoes.ts, index.ts
│   ├── validations/
│   │   └── reserva.ts                # Zod v4 — TIPOS_QUARTO, CAPACIDADE_MAXIMA
│   ├── utils.ts                      # cn() + re-exports
│   └── utils/
│       ├── date.ts                   # 14 funções de data
│       └── format.ts                 # 16 funções (formatarMoeda, formatarData, etc.)
├── types/
│   ├── database.ts                   # 25 tabelas tipadas
│   └── index.ts                      # Row aliases + constantes
└── middleware.ts                     # Refresh de sessão Supabase Auth — NÃO alterar
```

### Clientes Supabase já configurados

```typescript
// Client Component ('use client'):
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server Component / API Route (async):
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// API Route com permissão total (service role, bypassa RLS):
import { createAdminClient } from '@/lib/supabase/admin';
const supabase = createAdminClient();
```

---

## DECISÃO ARQUITETURAL: AUTENTICAÇÃO OTP ANTES DO WIZARD

O cliente se autentica via SMS/OTP **antes** de iniciar o wizard de reservas. Benefícios:
- RLS funciona nativamente (cada cliente vê apenas seus dados)
- Elimina Step de "dados pessoais" (nome/telefone vêm do auth)
- Cliente acessa "Minhas Reservas" após a reserva
- Adianta infraestrutura da Fase 7

### Fluxo completo

```
Visitante clica em "Reservar"
    ↓
[Se não autenticado → TELA OTP]
  → Digita telefone → recebe código SMS → verifica
  → Supabase Auth cria sessão
  → Sistema vincula/cria cliente em clientes_xngrl
    ↓
[Se já autenticado → direto para o wizard]
    ↓
[WIZARD — 3 Steps]
  Step 1: Seleção de datas (calendário)
  Step 2: Seleção de quarto + pessoas (cards com preços)
  Step 3: Resumo + observações + confirmar
    ↓
[CONFIRMAÇÃO]
  → API cria reserva (usando sessão autenticada)
  → Exibe código da reserva + próximo passo (pagamento)
```

---

## PRÉ-REQUISITO: CONFIGURAR SUPABASE AUTH COM TELEFONE

### No Supabase Dashboard:

1. Ir em: **Authentication → Providers → Phone**
2. Ativar Phone Auth
3. Configurar provedor SMS:
   - **Produção:** Twilio ou Twilio Verify (Account SID + Auth Token + Service SID)
   - **Desenvolvimento:** Ativar "Enable phone confirmation testing" em Auth Settings, configurar número de teste com OTP fixo (ex: 123456)

### Variáveis de ambiente (.env.local):

```bash
# Já configuradas (Fases 1-2):
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Twilio (OPCIONAL para dev — obrigatório para produção):
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## BANCO DE DADOS — INFORMAÇÕES ESSENCIAIS

### Tipos de Acomodação

```
Tabela acomodacoes:  tipo = 'Casa' | 'Chalé'   categoria = 'com_cozinha' | 'sem_cozinha' | null
Campo tipo_quarto:   'Casa' | 'Chalé - Com Cozinha' | 'Chalé - Sem Cozinha'
```

### Configuração Real da Pousada

| Tipo | Capacidade | Unidades | IDs |
|------|-----------|----------|-----|
| Casa | até 6 pessoas | 2 | Amarela, Vermelha |
| Chalé Com Cozinha | 2 pessoas | 3 | 01, 03, 09 |
| Chalé Com Cozinha | 3 pessoas | 1 | 06 |
| Chalé Sem Cozinha | 1-2 pessoas | 2 | 02, 07 |
| Chalé Sem Cozinha | 3 pessoas | 3 | 04, 05, 08 |

### Mapeamento de tipos (CRÍTICO)

```typescript
// precos_pacotes.tipo_acomodacao ↔ tipo_quarto nas reservas
const MAPA_TIPO_PACOTE_PARA_QUARTO: Record<string, string> = {
  'chale_com_cozinha': 'Chalé - Com Cozinha',
  'chale_sem_cozinha': 'Chalé - Sem Cozinha',
  'casa': 'Casa',
};
const MAPA_QUARTO_PARA_TIPO_PACOTE: Record<string, string> = {
  'Chalé - Com Cozinha': 'chale_com_cozinha',
  'Chalé - Sem Cozinha': 'chale_sem_cozinha',
  'Casa': 'casa',
};
```

### Functions SQL (executar via supabase.rpc())

1. **`verificar_e_criar_reserva(p_data_checkin, p_data_checkout, p_pessoas, p_tipo_quarto, p_cliente_id, p_reserva_id, p_valor_total)`** — verifica disponibilidade, insere em `reservas_confirmadas` com `status='pendente'`, cria bloqueios temporários (30 min)
2. **`validar_reserva_completa(p_data_checkin, p_data_checkout, p_tipo_acomodacao, p_pessoas)`** — verifica período aberto + detecta pacote especial, retorna `{ tipo: 'normal'|'pacote', ... }`
3. **`buscar_precos_pacote(p_pacote_id)`** — preços do pacote por tipo/pessoas
4. **`listar_pacotes_ativos()`** — pacotes vigentes

### Fluxo de reserva da function SQL

A function `verificar_e_criar_reserva()`:
1. Insere em **`reservas_confirmadas`** com `status = 'pendente'`, `valor_pago = 0`
2. Cria bloqueios em **`disponibilidade_quartos`** (expira 30 min)
3. **NÃO** insere em `pre_reservas`

Portanto, a API deve inserir TAMBÉM em **`pre_reservas`** após o sucesso da function (para tracking de pagamento PIX e ativar trigger de notificação).

---

## ESTRUTURA FINAL DE ARQUIVOS DA FASE 5

```
xangrila_web/
├── app/
│   ├── reservar/
│   │   ├── layout.tsx                        # Layout (header + footer)
│   │   └── page.tsx                          # Auth gate + wizard (client component)
│   └── api/
│       ├── auth/
│       │   └── vincular-cliente/
│       │       └── route.ts                  # POST — buscar/criar cliente após OTP
│       ├── disponibilidade/
│       │   └── route.ts                      # GET — verificar disponibilidade + preços
│       └── reservas/
│           ├── criar/
│           │   └── route.ts                  # POST — criar reserva (autenticado)
│           └── [id]/
│               └── status/
│                   └── route.ts              # GET — status da reserva (autenticado)
├── components/
│   └── features/
│       └── reserva/
│           ├── auth-gate.tsx                 # Tela de autenticação OTP
│           ├── date-selector.tsx             # Step 1 — calendário
│           ├── room-selector.tsx             # Step 2 — quartos + preços
│           ├── reservation-summary.tsx       # Step 3 — resumo + confirmar
│           └── step-indicator.tsx            # Barra de progresso (3 steps)
└── lib/
    └── hooks/
        └── use-reserva.ts                    # Zustand store
```

**Total: 12 arquivos novos**

---

## IMPLEMENTAÇÃO DETALHADA

### 1. `components/features/reserva/auth-gate.tsx`

Tela de autenticação OTP com dois estados: formulário de telefone e formulário de código.

**Fluxo:**
- Estado 1 (TELEFONE): Input com máscara (XX) XXXXX-XXXX → botão "Enviar código" → chama `supabase.auth.signInWithOtp({ phone: telefoneE164 })` diretamente do client
- Estado 2 (CÓDIGO): Input de 6 dígitos → botão "Verificar" → chama `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` → se sucesso: chama callback `onAuthenticated()`
- Timer regressivo de 60s para reenvio de código
- Botão "Voltar" para trocar o telefone
- Formatação do telefone para E.164: `'+55' + telefone.replace(/\D/g, '')`

**IMPORTANTE:** A autenticação é feita inteiramente pelo Supabase client-side (`createClient()` de `lib/supabase/client`). O `signInWithOtp` e `verifyOtp` são métodos nativos. O middleware já cuida do refresh da sessão.

**UI sugerida:**
- Card centralizado, max-w-md
- Ícone Smartphone do lucide-react
- Mensagem: "Para sua segurança, verifique seu telefone"
- Loading spinner durante envio/verificação
- Erros via toast (sonner)

---

### 2. `app/api/auth/vincular-cliente/route.ts` (POST)

Após autenticação OTP, vincula o telefone a `clientes_xngrl`.

```
Body: { telefone }
Requer: sessão autenticada (verificar via supabase.auth.getUser())

Fluxo:
1. Verificar autenticação com createClient() server → getUser()
2. Buscar cliente em clientes_xngrl pelo telefone (admin client)
3. Se existe: retornar { sucesso, clienteId, nome, novo: false }
4. Se não existe: criar com nome = telefone (temporário), retornar { ..., novo: true }
```

---

### 3. `lib/hooks/use-reserva.ts` — Zustand Store

Estado do wizard com 3 steps. Datas armazenadas como strings ISO (serialização segura). Usar `sessionStorage` com fallback SSR.

```typescript
// Estado:
{
  autenticado: boolean;
  clienteId: number | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  
  dataCheckin: string | null;     // ISO string
  dataCheckout: string | null;    // ISO string
  totalDiarias: number;
  
  tipoQuarto: 'Casa' | 'Chalé - Com Cozinha' | 'Chalé - Sem Cozinha' | null;
  pessoas: number;
  valorDiaria: number;
  valorTotal: number;
  ehPacote: boolean;
  pacoteInfo: { id, nome, dataInicio, dataFim, diarias } | null;
  
  observacoes: string;
  step: number;        // 1, 2, 3
  reservaId: string | null;
}
```

---

### 4. `app/api/disponibilidade/route.ts` (GET)

```
Query params: checkin (ISO), checkout (ISO)

Fluxo:
1. Validar parâmetros
2. Chamar validar_reserva_completa() para detectar pacote/período
3. Se pacote: buscar preços via buscar_precos_pacote()
4. Se normal: buscar preços de precos_acomodacoes (JOIN com acomodacoes)
5. Para cada tipo de quarto, contar reservas sobrepostas (disponibilidade real)
6. Retornar { tipos: [{ tipo, capacidadeMax, precos: [{pessoas, valorDiaria}], disponiveis }], ehPacote, pacoteInfo? }
```

**Usar admin client** — este é o ÚNICO endpoint público (consulta sem autenticação).

---

### 5. `app/api/reservas/criar/route.ts` (POST)

```
Body: { dataCheckin, dataCheckout, pessoas, tipoQuarto, valorTotal, observacoes? }
Requer: sessão autenticada

Fluxo:
1. Verificar autenticação: createClient() server → getUser()
2. Buscar clienteId em clientes_xngrl pelo telefone do user (admin client)
3. Gerar reserva_id: PXL-{ANO}-{6CHARS}
4. Calcular sinal: valorTotal * 0.5
5. Chamar supabase.rpc('verificar_e_criar_reserva', { ... }) — admin client
6. Se sucesso: inserir TAMBÉM em pre_reservas
7. Retornar { sucesso, reservaId, valorTotal, valorSinal, expiraEm }
```

---

### 6. `app/api/reservas/[id]/status/route.ts` (GET)

```
Params: id (reserva_id)
Requer: sessão autenticada

Fluxo:
1. Verificar autenticação
2. Buscar em reservas_confirmadas + pre_reservas pelo reserva_id
3. Validar que a reserva pertence ao usuário autenticado (mesmo cliente_id)
4. Retornar dados unificados
```

---

### 7. Componentes do Wizard

**`step-indicator.tsx`** — 3 steps com ícones: Calendar, Bed, CheckCircle

**`date-selector.tsx`** (Step 1):
- Calendário (componente Calendar do shadcn ou DayPicker v9)
- Seleção de intervalo (from → to)
- Bloquear datas passadas
- Exibir total de diárias
- Botão "Próximo"

**`room-selector.tsx`** (Step 2):
- Chamar GET /api/disponibilidade ao montar
- Cards por tipo de quarto com preços e seletor de pessoas
- Badge "Pacote Especial" se aplicável
- Card desabilitado se esgotado
- Botões "Voltar" + "Próximo"

**`reservation-summary.tsx`** (Step 3):
- Resumo: datas, tipo, pessoas, valores, nome do cliente
- Input para nome (se cliente novo — nome = telefone)
- Textarea de observações (opcional)
- Botão "Confirmar Reserva" → POST /api/reservas/criar
- Tela de sucesso com código e botão para pagamento

---

### 8. `app/reservar/page.tsx`

Client component. Verifica sessão ao montar. Se não autenticado: mostra AuthGate. Se autenticado: mostra StepIndicator + componente do step atual.

---

### 9. `app/reservar/layout.tsx`

Layout com Header + Footer (reusar componentes existentes).

---

## DEPENDÊNCIAS A VERIFICAR/INSTALAR

```bash
# Verificar se existem em components/ui/ ANTES de instalar:
npx shadcn@latest add calendar     # Se não existir
npx shadcn@latest add separator    # Se não existir
npx shadcn@latest add badge        # Se não existir
npx shadcn@latest add skeleton     # Se não existir
```

---

## TESTES ESPERADOS

### Autenticação
- Telefone válido → código enviado → verificação → autenticado
- Código inválido → erro
- Usuário já logado → vai direto pro wizard
- Reenvio de código após 60s

### Reserva normal
- Selecionar datas → ver quartos disponíveis → selecionar → resumo → confirmar
- Reserva criada com código PXL-2026-XXXXXX

### Pacote especial
- Datas dentro de pacote → preços do pacote → informações do pacote exibidas

### Erros tratados
- Sem disponibilidade → mensagem amigável
- Período fechado → mensagem explicativa
- Não autenticado em API protegida → 401

---

## IMPACTO NAS FASES SEGUINTES

- **Fase 6 (Pagamentos):** Página `/reservar/pagamento` recebe `reserva_id`. Infraestrutura de auth pronta.
- **Fase 7 (Área do Cliente):** Auth OTP já implementado. Reusar. Rota `/minhas-reservas` consulta por `cliente_id` do usuário autenticado.
- **Fase 8 (Painel Admin):** Auth separado via tabela `usuarios_admin`. Sem conflito.

---

## OBSERVAÇÕES FINAIS

1. O middleware existente JÁ cuida do refresh de sessão — NÃO alterar.
2. Usar `formatarMoeda()` e `formatarData()` de `@/lib/utils` para exibição.
3. A API de disponibilidade é pública (admin client). As demais APIs exigem autenticação.
4. Commits granulares com mensagens em português.
5. Para Step 3: se o `clienteNome` for apenas o telefone, exibir input para atualizar o nome antes de confirmar.
