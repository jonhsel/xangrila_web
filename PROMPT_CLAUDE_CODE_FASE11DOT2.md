# PROMPT CLAUDE CODE — FASE 11.2: Efetivar Bloqueios na disponibilidade_quartos

## CONTEXTO

Após o pagamento PIX ser confirmado pelo webhook do Mercado Pago, a reserva muda para `status = 'confirmada'` corretamente. Porém, a tabela `disponibilidade_quartos` fica **vazia** — os bloqueios temporários (30 min) criados pela function `verificar_e_criar_reserva()` expiram e são deletados antes ou depois do pagamento, e **ninguém os recria como definitivos**.

### Causa raiz

O fluxo de reserva online funciona assim:

1. `verificar_e_criar_reserva()` → INSERT bloqueios temporários (`reservado_temporario = true`, expira em 30 min)
2. Cliente paga PIX
3. Webhook MP → UPDATE `reservas_confirmadas.status = 'confirmada'`
4. (30 min se passam ou pg_cron executa)
5. Limpeza automática → DELETE bloqueios WHERE `reservado_temporario = true AND reservado_temp_ate < NOW()`
6. `disponibilidade_quartos` **fica vazia** ❌

**O que falta:** Após o passo 3, o webhook precisa chamar uma function que converta os bloqueios temporários em definitivos (ou os recrie caso já tenham expirado).

### Observação sobre Walk-in

A API de reserva walk-in (`app/api/admin/reservas/criar/route.ts`) **já cria bloqueios definitivos** (`reservado_temporario = false`). Esta correção é exclusiva do fluxo online (PIX via Mercado Pago).

---

## CONVENÇÕES DO PROJETO (OBRIGATÓRIAS)

- Usar `@supabase/ssr` — **NUNCA** `auth-helpers-nextjs`
- Usar `sonner` para toasts — **NUNCA** Shadcn toast
- Usar `as any` nos casts de Supabase Admin client queries
- Usar `telefonewhatsapp_cliente` em lowercase
- Commits em português

---

## PRÉ-REQUISITO: FUNCTION SQL (executar manualmente no Supabase ANTES de rodar este prompt)

⚠️ **ATENÇÃO:** A function SQL abaixo deve ser criada **manualmente** no SQL Editor do Supabase **antes** de executar as modificações de código. O Claude Code não tem acesso ao banco de dados.

### Executar no SQL Editor do Supabase — Passo 1: Criar a function

```sql
-- ============================================
-- FUNCTION: efetivar_bloqueios_reserva(p_reserva_id TEXT)
--
-- Converte bloqueios temporários em definitivos quando o pagamento
-- é confirmado. Se os bloqueios já expiraram, recria como definitivos
-- a partir dos dados da reserva em reservas_confirmadas.
-- ============================================

CREATE OR REPLACE FUNCTION efetivar_bloqueios_reserva(p_reserva_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reserva RECORD;
  v_bloqueios_atualizados INTEGER := 0;
  v_bloqueios_criados INTEGER := 0;
  v_diarias INTEGER;
  v_preco_diaria NUMERIC;
  v_data_atual DATE;
BEGIN
  RAISE NOTICE '[EFETIVAR] === Efetivando bloqueios para reserva % ===', p_reserva_id;

  -- 1. Buscar dados da reserva
  SELECT reserva_id, data_checkin, data_checkout, tipo_quarto, pessoas, valor_total, status
  INTO v_reserva
  FROM reservas_confirmadas
  WHERE reserva_id = p_reserva_id;

  IF NOT FOUND THEN
    RAISE NOTICE '[EFETIVAR] ❌ Reserva % não encontrada', p_reserva_id;
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'reserva_nao_encontrada',
      'mensagem', format('Reserva %s não encontrada em reservas_confirmadas', p_reserva_id)
    );
  END IF;

  -- 2. Verificar se a reserva está confirmada
  IF v_reserva.status NOT IN ('confirmada', 'concluida') THEN
    RAISE NOTICE '[EFETIVAR] ⚠️ Reserva % com status "%", não é confirmada', p_reserva_id, v_reserva.status;
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'status_invalido',
      'mensagem', format('Reserva %s tem status "%s" — esperado "confirmada"', p_reserva_id, v_reserva.status)
    );
  END IF;

  -- 3. Calcular dados auxiliares
  v_diarias := v_reserva.data_checkout - v_reserva.data_checkin;
  v_preco_diaria := v_reserva.valor_total / NULLIF(v_diarias, 0);

  RAISE NOTICE '[EFETIVAR] Diárias: %, Preço/diária: R$ %', v_diarias, v_preco_diaria;

  -- 4. Tentar atualizar bloqueios temporários existentes → definitivos
  UPDATE disponibilidade_quartos
  SET
    disponivel = false,
    reservado_temporario = false,
    reservado_temp_ate = NULL,
    observacoes = format('Bloqueio definitivo - Reserva %s (confirmada)', p_reserva_id),
    updated_at = NOW()
  WHERE reserva_referencia = p_reserva_id
    AND reservado_temporario = true;

  GET DIAGNOSTICS v_bloqueios_atualizados = ROW_COUNT;
  RAISE NOTICE '[EFETIVAR] Bloqueios temporários convertidos: %', v_bloqueios_atualizados;

  -- 5. Se não havia bloqueios temporários (já expiraram), RECRIAR como definitivos
  IF v_bloqueios_atualizados = 0 THEN
    RAISE NOTICE '[EFETIVAR] Nenhum bloqueio temporário encontrado — recriando como definitivos';

    FOR i IN 0..(v_diarias - 1) LOOP
      v_data_atual := v_reserva.data_checkin + i;

      -- Verificar se já existe bloqueio definitivo para esta data/reserva
      IF NOT EXISTS (
        SELECT 1 FROM disponibilidade_quartos
        WHERE data = v_data_atual
          AND reserva_referencia = p_reserva_id
          AND reservado_temporario = false
      ) THEN
        INSERT INTO disponibilidade_quartos (
          data,
          tipo_quarto,
          capacidade,
          preco,
          disponivel,
          reservado_temporario,
          reservado_temp_ate,
          reserva_referencia,
          observacoes,
          created_at,
          updated_at
        ) VALUES (
          v_data_atual,
          v_reserva.tipo_quarto,
          v_reserva.pessoas,
          v_preco_diaria,
          false,
          false,          -- DEFINITIVO
          NULL,           -- sem expiração
          p_reserva_id,
          format('Bloqueio definitivo - Reserva %s (recriado após confirmação)', p_reserva_id),
          NOW(),
          NOW()
        )
        ON CONFLICT (data, tipo_quarto, capacidade, reserva_referencia)
        DO UPDATE SET
          disponivel = false,
          reservado_temporario = false,
          reservado_temp_ate = NULL,
          observacoes = format('Bloqueio definitivo - Reserva %s (recriado após confirmação)', p_reserva_id),
          updated_at = NOW();

        v_bloqueios_criados := v_bloqueios_criados + 1;
      END IF;
    END LOOP;

    RAISE NOTICE '[EFETIVAR] ✅ Bloqueios definitivos criados: %', v_bloqueios_criados;
  END IF;

  RAISE NOTICE '[EFETIVAR] === CONCLUÍDO ===';

  RETURN json_build_object(
    'sucesso', true,
    'reserva_id', p_reserva_id,
    'bloqueios_atualizados', v_bloqueios_atualizados,
    'bloqueios_criados', v_bloqueios_criados,
    'diarias', v_diarias,
    'tipo_quarto', v_reserva.tipo_quarto
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[EFETIVAR] ❌ ERRO: %', SQLERRM;
  RETURN json_build_object(
    'sucesso', false,
    'erro', 'erro_sistema',
    'mensagem', format('Erro ao efetivar bloqueios: %s', SQLERRM)
  );
END;
$$;

-- Conceder permissão para o service_role executar
GRANT EXECUTE ON FUNCTION efetivar_bloqueios_reserva(TEXT) TO service_role;
```

### Executar no SQL Editor do Supabase — Passo 2: Corrigir reservas existentes

Após criar a function acima, executar este bloco para recriar bloqueios de todas as reservas confirmadas que ficaram sem registros na `disponibilidade_quartos`:

```sql
-- Corrigir retroativamente TODAS as reservas confirmadas sem bloqueios
DO $$
DECLARE
  r RECORD;
  v_resultado JSON;
  v_total_corrigidas INTEGER := 0;
BEGIN
  FOR r IN
    SELECT rc.reserva_id
    FROM reservas_confirmadas rc
    LEFT JOIN (
      SELECT reserva_referencia, COUNT(*) AS total_bloqueios
      FROM disponibilidade_quartos
      GROUP BY reserva_referencia
    ) dq ON dq.reserva_referencia = rc.reserva_id
    WHERE rc.status IN ('confirmada', 'concluida')
      AND COALESCE(dq.total_bloqueios, 0) = 0
  LOOP
    v_resultado := efetivar_bloqueios_reserva(r.reserva_id);
    RAISE NOTICE 'Reserva %: %', r.reserva_id, v_resultado;
    v_total_corrigidas := v_total_corrigidas + 1;
  END LOOP;

  RAISE NOTICE '=== TOTAL DE RESERVAS CORRIGIDAS: % ===', v_total_corrigidas;
END;
$$;
```

### Verificação pós-SQL

Executar para confirmar que os bloqueios foram criados:

```sql
SELECT
  rc.reserva_id,
  rc.tipo_quarto,
  rc.data_checkin,
  rc.data_checkout,
  rc.status,
  COALESCE(dq.total_bloqueios, 0) AS bloqueios_existentes
FROM reservas_confirmadas rc
LEFT JOIN (
  SELECT reserva_referencia, COUNT(*) AS total_bloqueios
  FROM disponibilidade_quartos
  GROUP BY reserva_referencia
) dq ON dq.reserva_referencia = rc.reserva_id
WHERE rc.status IN ('confirmada', 'concluida')
ORDER BY rc.data_checkin;
```

**Resultado esperado:** Todas as reservas confirmadas devem ter `bloqueios_existentes > 0`.

---

## MODIFICAÇÃO 1 — Webhook do Mercado Pago

### Arquivo: `app/api/webhooks/mercadopago/route.ts`

Dentro da function `processarWebhook`, localizar o trecho que atualiza `reservas_confirmadas` para `status = 'confirmada'` e o log de sucesso. **Adicionar** a chamada à function `efetivar_bloqueios_reserva` **entre** a confirmação da reserva e a atualização da `pre_reservas`.

**LOCALIZAR este bloco exato (já existente):**

```typescript
    // Atualizar reservas_confirmadas
    // O trigger trigger_notificar_reserva_confirmada dispara automaticamente ao mudar status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: erroReserva } = await (admin.from('reservas_confirmadas') as any)
      .update({
        valor_pago: payment.transaction_amount,
        status: 'confirmada',
      })
      .eq('reserva_id', reservaId);

    if (erroReserva) {
      console.error('[Webhook MP] Erro ao atualizar reservas_confirmadas:', erroReserva);
      return;
    }

    // Atualizar pre_reservas
```

**INSERIR o bloco abaixo ENTRE o `if (erroReserva)` e o comentário `// Atualizar pre_reservas`:**

```typescript
    // ============================================
    // EFETIVAR BLOQUEIOS NA DISPONIBILIDADE_QUARTOS
    // Converte bloqueios temporários em definitivos,
    // ou recria se já expiraram (>30min entre criação e pagamento)
    // ============================================
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: resultadoBloqueios, error: erroBloqueios } = await (admin.rpc as any)(
        'efetivar_bloqueios_reserva',
        { p_reserva_id: reservaId }
      );

      if (erroBloqueios) {
        console.error('[Webhook MP] Erro ao efetivar bloqueios:', erroBloqueios);
        // Não retornar erro — a reserva já foi confirmada
        // Os bloqueios podem ser recriados manualmente via SQL se necessário
      } else {
        console.log(`[Webhook MP] ✅ Bloqueios efetivados para ${reservaId}:`, JSON.stringify(resultadoBloqueios));
      }
    } catch (bloqueioError) {
      console.error('[Webhook MP] Exceção ao efetivar bloqueios:', bloqueioError);
      // Não falhar o webhook por causa de erro de bloqueio
    }

    // Atualizar pre_reservas
```

> **IMPORTANTE:** Não mover ou alterar nenhuma outra parte do arquivo. O bloco deve ser inserido **exatamente** entre o fechamento do `if (erroReserva)` e o comentário `// Atualizar pre_reservas`.

> **IMPORTANTE 2:** A chamada à function SQL usa `admin.rpc` (admin client, não o client do usuário), garantindo que tem permissão `service_role` para executar a function `SECURITY DEFINER`.

---

## MODIFICAÇÃO 2 — Atualizar CLAUDE.md

### Na seção "Functions SQL disponíveis no Supabase", adicionar:

```
- `efetivar_bloqueios_reserva()` — converte bloqueios temporários em definitivos após confirmação de pagamento
```

### Na seção "Correções já aplicadas — NÃO reverter", adicionar item 16:

```
16. **Efetivar bloqueios na disponibilidade_quartos (Fase 11.2)** — Após confirmação de pagamento via webhook do Mercado Pago, a function `efetivar_bloqueios_reserva()` é chamada para converter bloqueios temporários em definitivos (ou recriá-los se já expiraram). Sem isso, a tabela `disponibilidade_quartos` ficava vazia após a confirmação, pois os bloqueios temporários (30 min) eram deletados pelo pg_cron. A API de walk-in (`app/api/admin/reservas/criar/route.ts`) NÃO é afetada — ela já cria bloqueios definitivos diretamente.
```

---

## MODIFICAÇÃO 3 — Atualizar acompanhamento.txt

### Adicionar ao final do arquivo:

```

## ✅ CHECKLIST DA FASE 11.2 — Efetivar Bloqueios disponibilidade_quartos

Início: 2026-05-08 | Conclusão: 2026-05-08

### Objetivo
Garantir que a tabela `disponibilidade_quartos` mantenha bloqueios definitivos
para reservas confirmadas via PIX. Antes, os bloqueios temporários (30 min)
eram deletados pelo pg_cron e nunca recriados como definitivos.

### Pré-requisitos SQL (executar manualmente no Supabase)
[x] Function `efetivar_bloqueios_reserva()` criada no SQL Editor
[x] Correção retroativa executada para reservas sem bloqueios
[x] Verificação: todas as reservas confirmadas têm bloqueios_existentes > 0

### Arquivos modificados
[x] app/api/webhooks/mercadopago/route.ts — chamada a efetivar_bloqueios_reserva() após confirmação
[x] CLAUDE.md — function documentada + correção registrada
[x] acompanhamento.txt — checklist da Fase 11.2

### Build
[x] npm run build — zero erros TypeScript
```

---

## CHECKLIST DE VALIDAÇÃO

```
[ ] Function efetivar_bloqueios_reserva() criada no Supabase (PRÉ-REQUISITO MANUAL)
[ ] Correção retroativa executada para reservas existentes (PRÉ-REQUISITO MANUAL)
[ ] app/api/webhooks/mercadopago/route.ts — bloco de efetivar bloqueios inserido
[ ] CLAUDE.md — function + correção documentadas
[ ] acompanhamento.txt — checklist da Fase 11.2 adicionado
[ ] npm run build — zero erros TypeScript
[ ] git commit -m "fix: efetivar bloqueios na disponibilidade_quartos após confirmação PIX (Fase 11.2)"
```

---

## TESTE PÓS-DEPLOY

### Teste 1 — Verificar correção retroativa
1. No Supabase → Table Editor → `disponibilidade_quartos`
2. Filtrar por `reserva_referencia = 'PXL-MOTFTSMF-RQ8R'`
3. Deve existir 1 registro com:
   - `data` = 2026-06-16
   - `tipo_quarto` = "Chalé - Sem Cozinha"
   - `disponivel` = false
   - `reservado_temporario` = false
   - `reservado_temp_ate` = NULL

### Teste 2 — Nova reserva online (fluxo completo)
1. Fazer login no site
2. Criar nova reserva (valor mínimo)
3. Pagar o PIX
4. Verificar nos logs do Vercel:
   ```
   [Webhook MP] ✅ Reserva PXL-XXXX confirmada com sucesso
   [Webhook MP] ✅ Bloqueios efetivados para PXL-XXXX: {"sucesso":true,...}
   ```
5. No Supabase → `disponibilidade_quartos`:
   - Novos registros com `reservado_temporario = false` para a reserva

### Teste 3 — Walk-in (não deve ser afetado)
1. No painel admin → Nova Reserva (walk-in)
2. Criar reserva presencial com pagamento em dinheiro
3. No Supabase → `disponibilidade_quartos`:
   - Bloqueios criados com `reservado_temporario = false` (comportamento já existente)
   - O webhook NÃO é envolvido — fluxo independente
