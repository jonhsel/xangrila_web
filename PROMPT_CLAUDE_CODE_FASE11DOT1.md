# PROMPT CLAUDE CODE — FASE 11.1: Correção Webhook PIX + Busca Híbrida + Middleware

## CONTEXTO

Após o cliente pagar o PIX, a tela do QR Code **não muda automaticamente** para confirmação. Investigação identificou **3 problemas independentes**, todos corrigidos nesta fase:

### Problema 1 — `notification_url` ausente na criação do PIX de reserva
- Arquivo: `app/api/pagamentos/pix/gerar/route.ts`
- A chamada `paymentClient.create()` **não inclui** `notification_url`
- O Mercado Pago não sabe para onde enviar o webhook de pagamento aprovado
- O arquivo de Day Use (`app/api/day-use/pix/gerar/route.ts`) **já tem** `notification_url` — o problema é exclusivo das reservas de quarto
- **Evidência**: Logs do Vercel mostram zero chamadas POST para `/api/webhooks/mercadopago`

### Problema 2 — API de status retornava 404 para login via Google OAuth
- Arquivo: `app/api/reservas/[id]/status/route.ts`
- A busca de cliente era feita **exclusivamente por telefone** (`user.phone`)
- Login via Google OAuth → `user.phone` vazio → cliente não encontrado → 404
- O polling do `pix-payment.tsx` nunca detectava a mudança de status
- **Já corrigido** com busca híbrida (telefone + email) — apenas documentar

### Problema 3 — Middleware de manutenção bloqueava webhooks
- Arquivo: `middleware.ts`
- Quando `MAINTENANCE_MODE=true`, **todas** as rotas eram reescritas para `/manutencao`
- Incluindo `/api/webhooks/mercadopago`, que precisa ser público 24/7
- O Mercado Pago recebia 405 ao tentar chamar o webhook
- **Correção**: Excluir rotas de webhook do modo manutenção

### Problema complementar — `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_AUTH_CALLBACK_URL`
- Ambas variáveis **já foram corrigidas manualmente** no painel Vercel
- `NEXT_PUBLIC_APP_URL` = `https://www.pousadaxangrilademorros.com.br` (com www)
- `NEXT_PUBLIC_AUTH_CALLBACK_URL` = `https://www.pousadaxangrilademorros.com.br/auth/callback`
- O domínio sem `www` faz redirect 307, que o Mercado Pago não segue

---

## CONVENÇÕES DO PROJETO (OBRIGATÓRIAS)

- Usar `@supabase/ssr` — **NUNCA** `auth-helpers-nextjs`
- Usar `sonner` para toasts — **NUNCA** Shadcn toast
- Usar `as any` nos casts de Supabase Admin client queries
- Usar `telefonewhatsapp_cliente` em lowercase
- Commits em português

---

## CORREÇÃO 1 — Adicionar `notification_url` na criação do PIX

### Arquivo: `app/api/pagamentos/pix/gerar/route.ts`

Localizar o bloco `paymentClient.create()` (por volta da linha 170) e **adicionar** a propriedade `notification_url`:

**ANTES:**
```typescript
const pagamento = await paymentClient.create({
  body: {
    transaction_amount: valorSinal,
    description: `Reserva ${reservaId} - Pousada Xangrila`,
    payment_method_id: 'pix',
    date_of_expiration: new Date(
      agora.getTime() + minutosValidos * 60 * 1000
    ).toISOString(),
    external_reference: reservaId,
    payer: {
      email: emailMP,
      first_name: cliente.nome_cliente ?? 'Cliente',
    },
  },
});
```

**DEPOIS:**
```typescript
const pagamento = await paymentClient.create({
  body: {
    transaction_amount: valorSinal,
    description: `Reserva ${reservaId} - Pousada Xangrila`,
    payment_method_id: 'pix',
    date_of_expiration: new Date(
      agora.getTime() + minutosValidos * 60 * 1000
    ).toISOString(),
    external_reference: reservaId,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    payer: {
      email: emailMP,
      first_name: cliente.nome_cliente ?? 'Cliente',
    },
  },
});
```

> **ATENÇÃO**: Adicionar **apenas** a linha `notification_url`. Não alterar nenhuma outra parte do arquivo.

---

## CORREÇÃO 2 — Excluir webhooks do modo manutenção no middleware

### Arquivo: `middleware.ts`

Localizar o bloco de manutenção que reescreve todas as rotas para `/manutencao`. **Adicionar uma exceção** para rotas de webhook **antes** do rewrite.

O bloco de manutenção deve ficar assim (a linha de exceção é a novidade):

```typescript
// Modo Manutenção
if (process.env.MAINTENANCE_MODE === 'true') {
  const pathname = request.nextUrl.pathname;

  // NUNCA bloquear webhooks — o Mercado Pago precisa chamá-los 24/7
  if (pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next();
  }

  // Não redirecionar a própria página de manutenção (loop infinito)
  if (pathname === '/manutencao') {
    return NextResponse.next();
  }

  // Reescrever todas as demais rotas para /manutencao
  const url = request.nextUrl.clone();
  url.pathname = '/manutencao';
  return NextResponse.rewrite(url);
}
```

> **ATENÇÃO**: Verificar o bloco existente. Se já tem a checagem de `/manutencao`, adicionar **apenas** a checagem de `/api/webhooks/` antes dela. Se o bloco for diferente, adaptar mantendo a lógica acima.

---

## CORREÇÃO 3 — Busca híbrida na API de status (JÁ APLICADA — APENAS CONFIRMAR)

### Arquivo: `app/api/reservas/[id]/status/route.ts`

Este arquivo **já foi corrigido** na iteração anterior com a função `buscarClienteHibrido()` que busca por telefone + email. **Não alterar** — apenas confirmar que:

1. A função `buscarClienteHibrido` existe e busca por `telefonewhatsapp_cliente` E `email_cliente`
2. O polling retorna 200 (já confirmado nos logs do Vercel)

---

## ATUALIZAÇÃO DO CLAUDE.md

### 1. Na seção "Correções já aplicadas — NÃO reverter", adicionar item 15:

```
15. **Webhook PIX — notification_url + busca híbrida + middleware (Fase 11.1)** — Três correções para o fluxo de pagamento PIX de reservas:
    (a) `notification_url` adicionada em `app/api/pagamentos/pix/gerar/route.ts` no `paymentClient.create()` — sem ela, o Mercado Pago não sabia para onde enviar o webhook. O arquivo de Day Use (`app/api/day-use/pix/gerar/route.ts`) já tinha essa propriedade.
    (b) `app/api/reservas/[id]/status/route.ts` corrigido com busca híbrida (telefone + email) — login via Google OAuth não populava `user.phone`, causando 404 no polling.
    (c) `middleware.ts` atualizado para excluir `/api/webhooks/` do modo manutenção — o Mercado Pago recebia 405 quando `MAINTENANCE_MODE=true`.
    Variáveis de ambiente corrigidas: `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_AUTH_CALLBACK_URL` devem sempre usar `https://www.pousadaxangrilademorros.com.br` (com www), pois o domínio sem www faz redirect 307 que o MP não segue.
```

### 2. Na seção "Variáveis de Ambiente", atualizar os comentários:

```bash
# App — IMPORTANTE: usar www no domínio (sem www faz redirect 307)
NEXT_PUBLIC_APP_URL=https://www.pousadaxangrilademorros.com.br

# Auth OAuth (Fase 10) — IMPORTANTE: usar www no domínio
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://www.pousadaxangrilademorros.com.br/auth/callback
```

---

## ATUALIZAÇÃO DO acompanhamento.txt

### Adicionar ao final do arquivo, antes da linha "Total de fases concluídas":

```

## ✅ CHECKLIST DA FASE 11.1 — Correção Webhook PIX (notification_url + busca híbrida + middleware)

Início: 2026-05-05 | Conclusão: 2026-05-06 | Duração: 2 dias

### Objetivo
Corrigir o fluxo de pagamento PIX de reservas: após o cliente pagar, a tela deve
atualizar automaticamente para a confirmação. Três problemas independentes impediam isso.

### Problemas corrigidos
1. `notification_url` ausente em `paymentClient.create()` — MP não sabia para onde enviar webhook
2. API de status buscava cliente só por telefone — login Google OAuth causava 404 no polling
3. Middleware de manutenção bloqueava `/api/webhooks/mercadopago` (405)

### Ações manuais já realizadas (pré-código)
[x] NEXT_PUBLIC_APP_URL corrigido para https://www.pousadaxangrilademorros.com.br (com www)
[x] NEXT_PUBLIC_AUTH_CALLBACK_URL corrigido para https://www.pousadaxangrilademorros.com.br/auth/callback
[x] Redeploy realizado no Vercel

### Arquivos modificados
[x] app/api/pagamentos/pix/gerar/route.ts — adicionada notification_url no paymentClient.create()
[x] app/api/reservas/[id]/status/route.ts — busca híbrida telefone + email (já aplicado)
[x] middleware.ts — exceção para /api/webhooks/ no modo manutenção

### Build
[x] npm run build — zero erros TypeScript

---

| **11.1** | **Correção Webhook PIX (notification_url + híbrida + middleware)** | 2026-05-05 | 2026-05-06 | 2 | ✅ | 6, 10, 11 |
| 11.1.1   |   notification_url em pagamentos/pix/gerar/route.ts              | 2026-05-06 | 2026-05-06 | 1 | ✅ | 6.3       |
| 11.1.2   |   Busca híbrida em reservas/[id]/status/route.ts                 | 2026-05-05 | 2026-05-05 | 1 | ✅ | 10        |
| 11.1.3   |   Middleware: excluir /api/webhooks/ da manutenção               | 2026-05-06 | 2026-05-06 | 1 | ✅ | 11        |
| 11.1.4   |   Variáveis Vercel: NEXT_PUBLIC_APP_URL com www                  | 2026-05-05 | 2026-05-05 | 1 | ✅ | 9         |
| 11.1.5   |   Variáveis Vercel: NEXT_PUBLIC_AUTH_CALLBACK_URL com www         | 2026-05-05 | 2026-05-05 | 1 | ✅ | 10        |
| 11.1.6   |   CLAUDE.md e acompanhamento.txt atualizados                     | 2026-05-06 | 2026-05-06 | 1 | ✅ | —         |
| 11.1.7   |   npm run build — zero erros                                     | 2026-05-06 | 2026-05-06 | 1 | ✅ | 11.1.1, 11.1.3 |

Total de fases concluídas: 11.1
Período de desenvolvimento: 2026-03-25 a 2026-05-06 (42 dias corridos)
Legenda: ✅ Concluído | 🚧 Em andamento | ⬜ Pendente (ação manual)
```

---

## CHECKLIST DE VALIDAÇÃO

```
[ ] app/api/pagamentos/pix/gerar/route.ts — notification_url adicionada
[ ] middleware.ts — /api/webhooks/ excluído da manutenção
[ ] app/api/reservas/[id]/status/route.ts — busca híbrida confirmada (já aplicado)
[ ] CLAUDE.md — item 15 na seção "Correções já aplicadas"
[ ] CLAUDE.md — variáveis de ambiente atualizadas com comentários sobre www
[ ] acompanhamento.txt — checklist da Fase 11.1 adicionado ao final
[ ] npm run build — zero erros TypeScript
[ ] git commit -m "fix: adicionar notification_url no PIX + excluir webhooks da manutenção (Fase 11.1)"
```

---

## TESTE COMPLETO PÓS-DEPLOY

1. Fazer login via Google OAuth
2. Criar nova reserva de teste (valor mínimo)
3. Na tela do QR Code, verificar nos logs do Vercel que `GET /api/reservas/{id}/status` retorna **200**
4. Pagar o PIX
5. Verificar nos logs do Vercel que aparece `POST /api/webhooks/mercadopago` com mensagem `[Webhook MP] ✅ Reserva ... confirmada`
6. A tela do QR Code deve mudar **automaticamente** para a confirmação (em até 30s)
7. Verificar no banco:
   ```sql
   SELECT status, valor_pago, metodo_pagamento FROM reservas_confirmadas WHERE reserva_id = 'SEU_ID';
   -- Deve retornar: status='confirmada', valor_pago > 0, metodo_pagamento ainda pode ser null (depende do webhook)

   SELECT status FROM pre_reservas WHERE reserva_id = 'SEU_ID';
   -- Deve retornar: status='pago'
   ```

### Teste do middleware com manutenção ativa
1. Ativar `MAINTENANCE_MODE=true` no Vercel
2. Redeploy
3. Acessar o site normalmente — deve mostrar página de manutenção
4. Testar webhook com curl:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -X POST https://www.pousadaxangrilademorros.com.br/api/webhooks/mercadopago \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","action":"payment.updated","data":{"id":"123456"}}'
   ```
   Deve retornar **200** (não 405)
5. Desativar `MAINTENANCE_MODE` e redeploy
