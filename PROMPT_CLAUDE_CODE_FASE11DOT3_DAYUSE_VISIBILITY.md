# PROMPT CLAUDE CODE — FASE 11.3: Exibir Day Use em "Minhas Reservas"

## CONTEXTO

O sistema de Day Use da Pousada Xangrilá funciona corretamente:
- ✅ Cliente cria reserva de Day Use pelo site (calculadora → auth → PIX)
- ✅ Registro é inserido corretamente na tabela `day_use_reservations`
- ✅ Painel Admin exibe os Day Uses nas abas Hoje/Próximos/Histórico

**Porém há um bug:** a página **"Minhas Reservas"** (`app/(auth)/minhas-reservas/page.tsx`) **NÃO exibe reservas de Day Use**. Ela só consulta `reservas_confirmadas` e `pre_reservas`, ignorando completamente a tabela `day_use_reservations`.

O cliente faz um Day Use, paga o PIX, e quando vai em "Minhas Reservas" não vê nada sobre o Day Use.

---

## REGRAS CRÍTICAS — NUNCA VIOLAR

1. **NÃO** usar `@supabase/auth-helpers-nextjs` — usar **`@supabase/ssr`**
2. **NÃO** usar `toast` do Shadcn — usar **`sonner`**
3. **NÃO** alterar os arquivos protegidos (`middleware.ts`, `lib/supabase/*`, `types/*`, `lib/utils*`, `components/ui/*`, `app/globals.css`)
4. **NÃO** usar `createClientComponentClient` ou `createServerComponentClient` — usar os clientes em `lib/supabase/`
5. **NÃO** chamar `supabase.auth.getSession()` no servidor — usar `supabase.auth.getUser()`
6. **NÃO** esquecer cast `as any` nas queries com `createAdminClient()` — padrão Supabase JS v2.100+
7. **NÃO** usar `telefoneWhatsApp_cliente` (camelCase) — usar **`telefonewhatsapp_cliente`** (lowercase)

---

## SCHEMA — `day_use_reservations`

```sql
id                      UUID PRIMARY KEY
phone_number            TEXT NOT NULL          -- identificador do cliente (não usa cliente_id!)
customer_name           VARCHAR NOT NULL
reservation_date        DATE NOT NULL
number_of_people        INTEGER NOT NULL
price_per_person        NUMERIC NOT NULL
total_amount            NUMERIC NOT NULL
payment_status          VARCHAR DEFAULT 'pending'    -- 'pending' | 'confirmed'
status                  VARCHAR DEFAULT 'pending'    -- 'pending' | 'confirmed' | 'cancelled' | 'completed'
total_people            INTEGER
paying_people           INTEGER
non_paying_people       INTEGER DEFAULT 0
reservation_code        TEXT
notes                   TEXT                          -- JSON: { idosos, pcd, criancas_ate_6 }
special_requests        TEXT
expires_at              TIMESTAMP WITH TIME ZONE
created_at              TIMESTAMP WITH TIME ZONE
updated_at              TIMESTAMP WITH TIME ZONE
```

**IMPORTANTE:** `day_use_reservations` usa `phone_number` como identificador do cliente, não `cliente_id`. A busca deve ser feita pelo telefone do usuário autenticado.

---

# ═══════════════════════════════════════════════
# CORREÇÃO ÚNICA: PÁGINA "MINHAS RESERVAS"
# ═══════════════════════════════════════════════

## Arquivo a modificar: `app/(auth)/minhas-reservas/page.tsx`

Este é um **Server Component**. A correção deve manter essa natureza.

### O que existe hoje

A página:
1. Busca o `user` via `supabase.auth.getUser()`
2. Busca o `cliente` em `clientes_xngrl` por `telefonewhatsapp_cliente` (phone) ou `email_cliente` (email)
3. Busca `reservas_confirmadas` filtradas por `cliente_id`
4. Busca `pre_reservas` filtradas por `cliente_id`
5. Divide em 3 tabs: **Ativas**, **Pendentes**, **Concluídas**
6. **NÃO busca `day_use_reservations`** — esse é o bug

### Passos da correção

---

**PASSO 1 — Adicionar busca de Day Uses (após buscar pré-reservas)**

Encontrar o bloco:
```typescript
// Buscar pré-reservas (pendentes de pagamento)
const { data: preReservas } = await (admin.from('pre_reservas') as any)
  .select('*')
  .eq('cliente_id', cliente.id_cliente)
  .order('created_at', { ascending: false });
```

**Adicionar LOGO APÓS:**

```typescript
// Buscar reservas de Day Use do cliente (por telefone — day_use_reservations não usa cliente_id)
const telefoneCliente = user.phone || cliente.telefonewhatsapp_cliente;
let dayUses: any[] = [];

if (telefoneCliente) {
  const { data: dayUseData } = await (admin.from('day_use_reservations') as any)
    .select('*')
    .eq('phone_number', telefoneCliente)
    .neq('status', 'cancelled')
    .order('reservation_date', { ascending: false });
  dayUses = dayUseData || [];
}
```

---

**PASSO 2 — Filtrar Day Uses por categoria (após filtrar pendentes)**

Encontrar o bloco:
```typescript
const pendentes = (preReservas || []).filter((p: any) =>
  p.status === 'aguardando_pagamento' &&
  new Date(p.expira_em) > new Date()
);
```

**Adicionar LOGO APÓS:**

```typescript
// Filtrar day uses
const dayUsesAtivos = dayUses.filter((du: any) =>
  (du.status === 'confirmed' || du.status === 'pending') &&
  new Date(du.reservation_date + 'T23:59:59') >= hoje
);

const dayUsesConcluidos = dayUses.filter((du: any) =>
  du.status === 'completed' ||
  (du.status === 'confirmed' && new Date(du.reservation_date + 'T23:59:59') < hoje)
);
```

---

**PASSO 3 — Incluir Day Uses no cálculo de totalReservas**

Encontrar:
```typescript
const totalReservas = ativas.length + pendentes.length + concluidas.length;
```

**Substituir por:**
```typescript
const totalReservas = ativas.length + pendentes.length + concluidas.length + dayUsesAtivos.length + dayUsesConcluidos.length;
```

---

**PASSO 4 — Mudar de 3 para 4 tabs**

Encontrar:
```tsx
<TabsList className="grid w-full grid-cols-3">
```

**Substituir por:**
```tsx
<TabsList className="grid w-full grid-cols-4">
```

---

**PASSO 5 — Adicionar TabsTrigger de Day Use (após a de Concluídas)**

Encontrar:
```tsx
<TabsTrigger value="concluidas">
  Concluídas ({concluidas.length})
</TabsTrigger>
```

**Adicionar LOGO APÓS:**
```tsx
<TabsTrigger value="dayuse">
  Day Use ({dayUsesAtivos.length + dayUsesConcluidos.length})
</TabsTrigger>
```

---

**PASSO 6 — Adicionar TabsContent de Day Use (após o TabsContent de "concluidas")**

Encontrar o fechamento do último `</TabsContent>` (o de "concluidas").

**Adicionar LOGO APÓS:**
```tsx
<TabsContent value="dayuse" className="space-y-4">
  {dayUsesAtivos.length === 0 && dayUsesConcluidos.length === 0 ? (
    <EmptyState
      titulo="Nenhum Day Use"
      descricao="Você ainda não fez nenhuma reserva de Day Use"
    />
  ) : (
    <>
      {dayUsesAtivos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Próximos</h3>
          {dayUsesAtivos.map((du: any) => (
            <DayUseCard key={du.id} dayUse={du} />
          ))}
        </div>
      )}
      {dayUsesConcluidos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Anteriores</h3>
          {dayUsesConcluidos.map((du: any) => (
            <DayUseCard key={du.id} dayUse={du} />
          ))}
        </div>
      )}
    </>
  )}
</TabsContent>
```

---

**PASSO 7 — Criar o componente DayUseCard (no final do arquivo, após EmptyState)**

Adicionar ao final do arquivo, após a função `EmptyState` que já existe:

```tsx
function DayUseCard({ dayUse }: { dayUse: any }) {
  const statusConfig: Record<string, { label: string; cor: string }> = {
    confirmed: { label: 'Confirmado', cor: 'text-green-600' },
    pending: { label: 'Aguardando Pagamento', cor: 'text-yellow-600' },
    completed: { label: 'Concluído', cor: 'text-blue-600' },
  };

  const config = statusConfig[dayUse.status] || statusConfig.pending;

  // Parsear notas (detalhamento de isentos)
  let notesData: { idosos?: number; pcd?: number; criancas_ate_6?: number } = {};
  try {
    if (dayUse.notes) notesData = JSON.parse(dayUse.notes);
  } catch { /* ignore */ }

  const dataFormatada = (() => {
    const [ano, mes, dia] = dayUse.reservation_date.split('-');
    const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  })();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-4 w-4 text-yellow-500" />
              <h3 className="font-semibold">
                Day Use #{dayUse.reservation_code}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {dayUse.status === 'confirmed' ? 'Confirmado em ' : 'Criado em '}
              {new Date(dayUse.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Badge variant={dayUse.status === 'confirmed' ? 'default' : 'secondary'}>
            <span className={config.cor}>{config.label}</span>
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="text-sm font-medium capitalize">{dataFormatada}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pessoas</p>
              <p className="text-sm font-medium">
                {dayUse.total_people || dayUse.number_of_people} pessoa{(dayUse.total_people || dayUse.number_of_people) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Detalhamento de isentos */}
        {dayUse.non_paying_people > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            Isentos: {[
              notesData.idosos ? `${notesData.idosos} idoso(s)` : null,
              notesData.pcd ? `${notesData.pcd} PCD` : null,
              notesData.criancas_ate_6 ? `${notesData.criancas_ate_6} criança(s)` : null,
            ].filter(Boolean).join(', ')}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">Valor Total:</p>
          <p className="text-lg font-bold text-primary">
            {formatarMoeda(Number(dayUse.total_amount))}
          </p>
        </div>

        {/* Botão de contato se pendente */}
        {dayUse.status === 'pending' && (
          <div className="mt-3">
            <Button variant="outline" className="w-full" asChild>
              <a
                href={`https://wa.me/5598981519965?text=${encodeURIComponent(
                  `Olá! Gostaria de informações sobre meu Day Use ${dayUse.reservation_code}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com a Pousada
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

**PASSO 8 — Adicionar imports que faltam (no topo do arquivo)**

Verificar os imports existentes de `lucide-react`. Adicionar apenas os que **NÃO existem ainda**:

```typescript
// Provavelmente faltam: Sun, Users
// Provavelmente já existem: Calendar, PlusCircle, CalendarX, CheckCircle2
import { Calendar, CalendarX, PlusCircle, Sun, Users, CheckCircle2 } from 'lucide-react';
```

Verificar se `Badge` já está importado de `@/components/ui/badge`. Se não, adicionar:
```typescript
import { Badge } from '@/components/ui/badge';
```

Verificar se `formatarMoeda` já está importado de `@/lib/utils`. Se não, adicionar ao import existente.

---

# ═══════════════════════════════════════════════
# RESUMO
# ═══════════════════════════════════════════════

```
MODIFICAR: app/(auth)/minhas-reservas/page.tsx

Alterações:
  1. Adicionar busca em day_use_reservations (por phone_number do user)
  2. Filtrar day uses em ativos/concluídos
  3. Incluir day uses no totalReservas
  4. Mudar grid de 3 para 4 colunas nas tabs
  5. Adicionar TabsTrigger "Day Use"
  6. Adicionar TabsContent com sub-seções Próximos/Anteriores
  7. Criar função DayUseCard com código, data, pessoas, isentos, valor
  8. Adicionar imports faltantes (Sun, Users, Badge)

NENHUM arquivo novo.
NENHUMA migration SQL.
```

---

# ═══════════════════════════════════════════════
# CHECKLIST DE TESTES
# ═══════════════════════════════════════════════

- [ ] Acessar `/minhas-reservas` logado como cliente que tem Day Use na tabela
- [ ] Tab "Day Use" aparece com contador correto
- [ ] Day Uses com `status = 'confirmed'` mostram badge "Confirmado" (verde)
- [ ] Day Uses com `status = 'pending'` mostram badge "Aguardando Pagamento" + botão WhatsApp
- [ ] Day Uses com data futura aparecem na sub-seção "Próximos"
- [ ] Day Uses com data passada aparecem na sub-seção "Anteriores"
- [ ] Card mostra: ícone sol, código (DU-XXXX), data formatada, total de pessoas, detalhamento de isentos, valor total
- [ ] Day Uses com `status = 'cancelled'` NÃO aparecem (filtro `neq`)
- [ ] Se não há Day Uses, mostra estado vazio "Nenhum Day Use"
- [ ] `npm run build` — zero erros TypeScript
