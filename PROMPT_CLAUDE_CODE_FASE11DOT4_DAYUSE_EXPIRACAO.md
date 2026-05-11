# PROMPT CLAUDE CODE — FASE 11.4: Expiração Automática de Day Uses

## CONTEXTO

O sistema de Day Use da Pousada Xangrilá tem um **bug crítico**: reservas de Day Use com `status = 'pending'` e `expires_at` já passado **nunca são expiradas**. Diferente das pré-reservas de quartos (que possuem `expirar_prereservas_pendentes()` via pg_cron), **não existe nenhum mecanismo de expiração para Day Uses**.

### Sintomas visíveis

1. Na tabela `day_use_reservations` no Supabase, há registros com `payment_status = 'pending'` e `expires_at` de semanas/meses atrás
2. Na página "Minhas Reservas" do cliente, Day Uses expirados continuam aparecendo como "Aguardando Pagamento"
3. Day Uses com data passada (ex: 14/05) e `expires_at` vencido (ex: 09/05) continuam visíveis

### Causa raiz

- **Banco**: Não existe function SQL para expirar Day Uses automaticamente
- **Cron**: O cron existente (`expirar_prereservas_pendentes`) só trata `pre_reservas`, não `day_use_reservations`
- **Frontend**: O filtro de `dayUsesAtivos` inclui `status === 'pending'` sem checar se `expires_at` já passou

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

## SCHEMA — `day_use_reservations` (relevante)

```sql
id                      UUID PRIMARY KEY
phone_number            TEXT NOT NULL
customer_name           VARCHAR NOT NULL
reservation_date        DATE NOT NULL
status                  VARCHAR DEFAULT 'pending'    -- 'pending' | 'confirmed' | 'cancelled' | 'completed'
payment_status          VARCHAR DEFAULT 'pending'    -- 'pending' | 'confirmed' | 'cancelled'
expires_at              TIMESTAMP WITH TIME ZONE
reservation_code        TEXT
created_at              TIMESTAMP WITH TIME ZONE
updated_at              TIMESTAMP WITH TIME ZONE
```

---

# ═══════════════════════════════════════════════
# FRENTE 1: FUNCTION SQL PARA EXPIRAR DAY USES
# ═══════════════════════════════════════════════

## 1.1 — Criar Function SQL: `expirar_dayuses_pendentes()`

**Executar no SQL Editor do Supabase:**

```sql
-- ============================================
-- FUNCTION: expirar_dayuses_pendentes()
-- Roda periodicamente via pg_cron
-- Expira Day Uses com status = 'pending' e payment_status = 'pending'
-- cujo expires_at já passou OU cuja reservation_date já passou
-- ============================================
CREATE OR REPLACE FUNCTION expirar_dayuses_pendentes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dayuse RECORD;
  v_total_expiradas INTEGER := 0;
  v_codes_afetados TEXT[] := '{}';
BEGIN
  RAISE NOTICE '[EXPIRAÇÃO DU] Iniciando limpeza de Day Uses expirados...';
  RAISE NOTICE '[EXPIRAÇÃO DU] Data/hora atual: %', NOW();

  -- Buscar Day Uses pendentes que devem ser expirados:
  -- Condição 1: expires_at já passou (PIX não pago a tempo)
  -- Condição 2: reservation_date já passou (dia do Day Use já foi)
  FOR v_dayuse IN
    SELECT id, reservation_code, expires_at, reservation_date
    FROM day_use_reservations
    WHERE status = 'pending'
      AND payment_status = 'pending'
      AND (
        (expires_at IS NOT NULL AND expires_at < NOW())
        OR
        (reservation_date < CURRENT_DATE)
      )
  LOOP
    RAISE NOTICE '[EXPIRAÇÃO DU] Expirando Day Use: % (expires_at: %, data: %)',
      v_dayuse.reservation_code, v_dayuse.expires_at, v_dayuse.reservation_date;

    -- Atualizar status para 'expired' e payment_status para 'cancelled'
    UPDATE day_use_reservations
    SET status = 'cancelled',
        payment_status = 'cancelled',
        cancelled_reason = CASE
          WHEN expires_at IS NOT NULL AND expires_at < NOW()
            THEN 'Expirado automaticamente — pagamento PIX não realizado no prazo'
          ELSE 'Expirado automaticamente — data do Day Use já passou sem pagamento'
        END,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = v_dayuse.id
      AND status = 'pending';

    IF FOUND THEN
      v_total_expiradas := v_total_expiradas + 1;
      v_codes_afetados := array_append(v_codes_afetados, v_dayuse.reservation_code);
    END IF;

  END LOOP;

  RAISE NOTICE '[EXPIRAÇÃO DU] ✅ Concluído: % Day Uses expirados',
    v_total_expiradas;

  RETURN jsonb_build_object(
    'sucesso', true,
    'processado_em', NOW(),
    'total_expiradas', v_total_expiradas,
    'codes_afetados', v_codes_afetados
  );
END;
$$;
```

## 1.2 — Agendar via pg_cron

**Executar no SQL Editor do Supabase:**

```sql
-- Agendar execução a cada 5 minutos (mesmo intervalo das pré-reservas)
SELECT cron.schedule(
  'expirar-dayuses',
  '*/5 * * * *',
  $$SELECT expirar_dayuses_pendentes()$$
);
```

## 1.3 — Executar AGORA para limpar dados existentes

**Executar no SQL Editor do Supabase:**

```sql
-- Executar imediatamente para expirar os Day Uses atuais já vencidos
SELECT expirar_dayuses_pendentes();
```

**Resultado esperado:** Todos os Day Uses com `status = 'pending'` cujo `expires_at` ou `reservation_date` já passaram serão marcados como `cancelled`.

---

# ═══════════════════════════════════════════════
# FRENTE 2: ATUALIZAR CRON VERCEL (FALLBACK)
# ═══════════════════════════════════════════════

## 2.1 — Modificar `app/api/cron/limpeza/prereservas/route.ts`

Este arquivo já chama `expirar_prereservas_pendentes()`. Adicionar chamada à nova function `expirar_dayuses_pendentes()` **no mesmo endpoint** para manter a simplicidade.

**Localizar** o trecho onde `expirar_prereservas_pendentes` é chamada (via `supabase.rpc`).

**Adicionar LOGO APÓS** a chamada de `expirar_prereservas_pendentes`:

```typescript
    // === EXPIRAR DAY USES PENDENTES ===
    const { data: dataDayUse, error: errorDayUse } = await supabase.rpc('expirar_dayuses_pendentes');

    if (errorDayUse) {
      console.error('[Cron Limpeza] Erro ao expirar day uses:', errorDayUse);
    } else {
      console.log('[Cron Limpeza] ✅ Day Uses expirados:', JSON.stringify(dataDayUse));
    }
```

**Atualizar o retorno JSON** para incluir o resultado de Day Uses. Onde já retorna o resultado de pré-reservas, incluir:

```typescript
    return NextResponse.json({
      sucesso: true,
      prereservas: data,
      dayuses: dataDayUse || null,
      executado_em: new Date().toISOString(),
    });
```

Se o arquivo usa `job_logs`, incluir os resultados de Day Use no campo `detalhes`.

---

# ═══════════════════════════════════════════════
# FRENTE 3: CORRIGIR FILTRO NO FRONTEND
# ═══════════════════════════════════════════════

## 3.1 — Modificar `app/(auth)/minhas-reservas/page.tsx`

### Problema atual

O filtro `dayUsesAtivos` aceita `status === 'pending'` sem verificar `expires_at`:

```typescript
// FILTRO ATUAL (com problema)
const dayUsesAtivos = dayUses.filter((du: any) =>
  (du.status === 'confirmed' || du.status === 'pending') &&
  new Date(du.reservation_date + 'T23:59:59') >= hoje
);
```

Isso faz Day Uses com PIX expirado (expires_at já passou) continuarem aparecendo como "Aguardando Pagamento".

### Correção

**Substituir** o bloco de filtro `dayUsesAtivos` por:

```typescript
// Filtrar day uses — pendentes só aparecem se expires_at ainda não passou
const agora = new Date();

const dayUsesAtivos = dayUses.filter((du: any) => {
  const dataFutura = new Date(du.reservation_date + 'T23:59:59') >= hoje;

  if (du.status === 'confirmed') {
    // Confirmados com data futura → sempre ativo
    return dataFutura;
  }

  if (du.status === 'pending') {
    // Pendentes só aparecem se:
    // 1. Data do Day Use ainda não passou
    // 2. expires_at ainda não passou (PIX ainda válido)
    const pixAindaValido = du.expires_at ? new Date(du.expires_at) > agora : true;
    return dataFutura && pixAindaValido;
  }

  return false;
});
```

**Substituir** o bloco de filtro `dayUsesConcluidos` por:

```typescript
const dayUsesConcluidos = dayUses.filter((du: any) => {
  // Concluídos explicitamente
  if (du.status === 'completed') return true;

  // Confirmados com data passada → tratados como concluídos
  if (du.status === 'confirmed' && new Date(du.reservation_date + 'T23:59:59') < hoje) {
    return true;
  }

  // Pendentes com PIX expirado que ainda não foram cancelados pelo cron
  // NÃO devem aparecer para o cliente (serão cancelados pelo cron em breve)
  // → retornar false

  return false;
});
```

### Resultado

- Day Uses `pending` com `expires_at` já passado **desaparecem** da aba do cliente
- Day Uses `confirmed` com data passada aparecem em "Anteriores" (concluídos)
- Day Uses `cancelled` já são filtrados pelo `.neq('status', 'cancelled')` na query

---

# ═══════════════════════════════════════════════
# FRENTE 4: TAMBÉM EXPIRAR DAY USES COM DATA PASSADA + CONFIRMADOS
# ═══════════════════════════════════════════════

## 4.1 — Function SQL adicional: marcar Day Uses confirmados com data passada como `completed`

Day Uses confirmados (pagos) cuja `reservation_date` já passou devem ter o status atualizado para `completed`. Isso mantém a consistência dos dados.

**Executar no SQL Editor do Supabase:**

```sql
-- ============================================
-- FUNCTION: completar_dayuses_passados()
-- Marca Day Uses confirmados com data passada como 'completed'
-- ============================================
CREATE OR REPLACE FUNCTION completar_dayuses_passados()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_completados INTEGER := 0;
BEGIN
  UPDATE day_use_reservations
  SET status = 'completed',
      updated_at = NOW()
  WHERE status = 'confirmed'
    AND reservation_date < CURRENT_DATE;

  GET DIAGNOSTICS v_total_completados = ROW_COUNT;

  RAISE NOTICE '[COMPLETAR DU] ✅ % Day Uses marcados como completed', v_total_completados;

  RETURN jsonb_build_object(
    'sucesso', true,
    'processado_em', NOW(),
    'total_completados', v_total_completados
  );
END;
$$;
```

## 4.2 — Agendar via pg_cron (execução diária)

```sql
-- Executar diariamente à meia-noite (não precisa ser frequente)
SELECT cron.schedule(
  'completar-dayuses-passados',
  '0 0 * * *',
  $$SELECT completar_dayuses_passados()$$
);
```

## 4.3 — Executar AGORA

```sql
SELECT completar_dayuses_passados();
```

---

# ═══════════════════════════════════════════════
# RESUMO DE AÇÕES
# ═══════════════════════════════════════════════

## SQL a executar no Supabase (MANUAL, na ordem)

```
1. CREATE FUNCTION expirar_dayuses_pendentes()        -- Frente 1.1
2. SELECT cron.schedule('expirar-dayuses', ...)        -- Frente 1.2
3. SELECT expirar_dayuses_pendentes()                  -- Frente 1.3 (limpar dados atuais)
4. CREATE FUNCTION completar_dayuses_passados()        -- Frente 4.1
5. SELECT cron.schedule('completar-dayuses-passados', ...) -- Frente 4.2
6. SELECT completar_dayuses_passados()                 -- Frente 4.3 (limpar dados atuais)
```

## Arquivos a modificar (Claude Code)

```
MODIFICAR: app/api/cron/limpeza/prereservas/route.ts
  → Adicionar chamada a expirar_dayuses_pendentes() após expirar_prereservas_pendentes()
  → Incluir resultado no retorno JSON e em job_logs

MODIFICAR: app/(auth)/minhas-reservas/page.tsx
  → Corrigir filtro dayUsesAtivos: pendentes só aparecem se expires_at > agora
  → Corrigir filtro dayUsesConcluidos: não incluir pendentes expirados
```

## NENHUM arquivo novo
## NENHUMA dependência npm nova

---

# ═══════════════════════════════════════════════
# CHECKLIST DE TESTES
# ═══════════════════════════════════════════════

### Banco de dados
- [ ] Executar `SELECT expirar_dayuses_pendentes()` → retorna contagem de expirados
- [ ] Verificar `day_use_reservations`: todos os registros com `status = 'pending'` e `expires_at < NOW()` agora têm `status = 'cancelled'`
- [ ] Verificar `day_use_reservations`: registros com `status = 'pending'` e `reservation_date < CURRENT_DATE` agora têm `status = 'cancelled'`
- [ ] Executar `SELECT completar_dayuses_passados()` → retorna contagem de completados
- [ ] Verificar: Day Uses confirmados com data passada agora têm `status = 'completed'`
- [ ] Verificar jobs pg_cron: `SELECT * FROM cron.job` → deve listar `expirar-dayuses` e `completar-dayuses-passados`

### Frontend — Minhas Reservas
- [ ] Acessar `/minhas-reservas` como cliente com Day Uses
- [ ] Day Uses `cancelled` NÃO aparecem em nenhuma aba
- [ ] Day Uses `pending` com `expires_at` passado NÃO aparecem
- [ ] Day Uses `confirmed` com data futura aparecem em "Próximos"
- [ ] Day Uses `completed` aparecem em "Anteriores"
- [ ] Day Uses `confirmed` com data passada aparecem em "Anteriores"
- [ ] Tab "Day Use" mostra contador correto (exclui expirados/cancelados)

### Cron Vercel
- [ ] Chamar `GET /api/cron/limpeza/prereservas` (com CRON_SECRET)
- [ ] Resposta inclui campo `dayuses` com resultado da expiração
- [ ] `job_logs` registra execução com sucesso

### Build
- [ ] `npm run build` — zero erros TypeScript
