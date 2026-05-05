# PROMPT CLAUDE CODE — CORREÇÃO: PAGAMENTO PIX NÃO ATUALIZA TELA AUTOMATICAMENTE

## CONTEXTO DO PROBLEMA

Após o cliente efetuar o pagamento PIX, a tela do QR Code **não muda automaticamente** para a tela de confirmação. O cliente precisa clicar manualmente no link "Ver no Mercado Pago" para confirmar que pagou.

### Diagnóstico (já investigado)

Dois problemas distintos foram identificados:

**PROBLEMA 1 — API de status retorna 404 para login via Google OAuth**
- Arquivo: `app/api/reservas/[id]/status/route.ts`
- A busca de cliente é feita **exclusivamente por telefone** (`user.phone`)
- Quando o login é via Google OAuth, `user.phone` é vazio/nulo
- A busca não encontra o cliente → retorna 404
- O polling do `pix-payment.tsx` nunca detecta a mudança de status
- **Evidência**: Log do Vercel mostra `GET /api/reservas/PXL-MORXRH8S-D9YY/status → 404`

**PROBLEMA 2 — `NEXT_PUBLIC_APP_URL` com valor incorreto no Vercel**
- A `notification_url` enviada ao Mercado Pago na criação do PIX usa `process.env.NEXT_PUBLIC_APP_URL`
- Essa variável estava com valor incorreto no Vercel (não apontava para `https://pousadaxangrilademorros.com.br`)
- O Mercado Pago nunca conseguiu entregar o webhook
- O banco nunca foi atualizado: `pre_reservas.status` permaneceu `'aguardando_pagamento'` e `reservas_confirmadas.status` permaneceu `'pendente'`
- **Evidência**: Nenhum log de chamada ao `/api/webhooks/mercadopago` nos logs do Vercel

> **NOTA**: O PROBLEMA 2 será corrigido manualmente pelo desenvolvedor no painel do Vercel (já orientado). Este prompt corrige apenas o PROBLEMA 1 (código).

---

## CONVENÇÕES DO PROJETO (OBRIGATÓRIAS)

- Usar `@supabase/ssr` — **NUNCA** `auth-helpers-nextjs`
- Usar `sonner` para toasts — **NUNCA** Shadcn toast
- Usar `as any` nos casts de Supabase Admin client queries
- Usar `telefonewhatsapp_cliente` em lowercase
- Commits em português

---

## CORREÇÃO — ARQUIVO ÚNICO

### Arquivo: `app/api/reservas/[id]/status/route.ts`

**O que mudar:** Substituir a busca de cliente exclusiva por telefone por uma busca híbrida (telefone + email), idêntica à que já existe em `app/api/pagamentos/pix/gerar/route.ts`.

**Substituir o arquivo INTEIRO** pelo código abaixo:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ClienteRow, ReservaRow, PreReservaRow } from '@/types';

// ============================================
// HELPER — Busca cliente de forma híbrida
// Suporta: OTP (telefone), Google OAuth (email), Email/Senha (email)
// Mesma lógica usada em /api/pagamentos/pix/gerar/route.ts
// ============================================

type ClienteBasico = Pick<ClienteRow, 'id_cliente'>;

async function buscarClienteHibrido(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userPhone: string | undefined,
  userEmail: string | undefined
): Promise<ClienteBasico | null> {

  // ── TENTATIVA 1: Busca por telefone (login OTP) ──────────────────────────
  if (userPhone && userPhone.trim() !== '') {
    const telefoneLimpo = userPhone.replace(/\D/g, '');

    const variantesBusca = [
      userPhone,
      telefoneLimpo,
      `+55${telefoneLimpo}`,
      telefoneLimpo.startsWith('55')
        ? telefoneLimpo.slice(2)
        : telefoneLimpo,
    ].filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientes } = await (admin
      .from('clientes_xngrl') as any)
      .select('id_cliente')
      .in('telefonewhatsapp_cliente', variantesBusca)
      .limit(1) as { data: ClienteBasico[] | null; error: unknown };

    if (clientes && clientes.length > 0) {
      return clientes[0];
    }
  }

  // ── TENTATIVA 2: Busca por email (login Google OAuth ou Email/Senha) ─────
  if (userEmail && userEmail.trim() !== '') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientes } = await (admin
      .from('clientes_xngrl') as any)
      .select('id_cliente')
      .eq('email_cliente', userEmail)
      .limit(1) as { data: ClienteBasico[] | null; error: unknown };

    if (clientes && clientes.length > 0) {
      return clientes[0];
    }
  }

  return null;
}

// ============================================
// GET /api/reservas/[id]/status
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
    }

    const { id: reservaId } = await params;

    if (!reservaId) {
      return NextResponse.json({ erro: 'ID da reserva não informado.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 2. Buscar clienteId — LÓGICA HÍBRIDA (telefone + email)
    //    user.phone  → preenchido no login por OTP
    //    user.email  → preenchido no login por Google OAuth ou Email/Senha
    const cliente = await buscarClienteHibrido(
      admin,
      user.phone ?? undefined,
      user.email ?? undefined
    );

    if (!cliente) {
      console.error('[Status] Cliente não encontrado:', {
        phone: user.phone,
        email: user.email,
      });
      return NextResponse.json({ erro: 'Cliente não encontrado.' }, { status: 404 });
    }

    const clienteId = cliente.id_cliente;

    type ReservaSelect = Pick<ReservaRow, 'reserva_id' | 'status' | 'data_checkin' | 'data_checkout' | 'pessoas' | 'tipo_quarto' | 'valor_total' | 'valor_pago' | 'valor_restante' | 'created_at'>;
    type PreReservaSelect = Pick<PreReservaRow, 'reserva_id' | 'status' | 'expira_em' | 'valor_total' | 'valor_sinal' | 'data_checkin' | 'data_checkout' | 'pessoas' | 'tipo_quarto' | 'created_at'>;

    // 3. Buscar em reservas_confirmadas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reserva } = await (admin
      .from('reservas_confirmadas') as any)
      .select(
        'reserva_id, status, data_checkin, data_checkout, pessoas, tipo_quarto, valor_total, valor_pago, valor_restante, created_at'
      )
      .eq('reserva_id', reservaId)
      .eq('cliente_id', clienteId)
      .single() as { data: ReservaSelect | null; error: unknown };

    // 4. Buscar em pre_reservas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: preReserva } = await (admin
      .from('pre_reservas') as any)
      .select(
        'reserva_id, status, expira_em, valor_total, valor_sinal, data_checkin, data_checkout, pessoas, tipo_quarto, created_at'
      )
      .eq('reserva_id', reservaId)
      .eq('cliente_id', clienteId)
      .single() as { data: PreReservaSelect | null; error: unknown };

    if (!reserva && !preReserva) {
      return NextResponse.json({ erro: 'Reserva não encontrada.' }, { status: 404 });
    }

    // 5. Montar resposta unificada
    //    IMPORTANTE para o polling do pix-payment.tsx:
    //    - Se reserva existe com status='confirmada' → pagamento confirmado
    //    - Se só pre_reserva existe com status='aguardando_pagamento' → ainda esperando
    const dados = reserva
      ? {
          reservaId: reserva.reserva_id,
          status: reserva.status,
          dataCheckin: reserva.data_checkin,
          dataCheckout: reserva.data_checkout,
          pessoas: reserva.pessoas,
          tipoQuarto: reserva.tipo_quarto,
          valorTotal: reserva.valor_total,
          valorPago: reserva.valor_pago,
          valorRestante: reserva.valor_restante,
          origem: 'confirmada' as const,
          criadaEm: reserva.created_at,
        }
      : {
          reservaId: preReserva!.reserva_id,
          status: preReserva!.status,
          dataCheckin: preReserva!.data_checkin,
          dataCheckout: preReserva!.data_checkout,
          pessoas: preReserva!.pessoas,
          tipoQuarto: preReserva!.tipo_quarto,
          valorTotal: preReserva!.valor_total,
          valorSinal: preReserva!.valor_sinal,
          expiraEm: preReserva!.expira_em,
          origem: 'pre_reserva' as const,
          criadaEm: preReserva!.created_at,
        };

    return NextResponse.json(dados);
  } catch (err) {
    console.error('Erro em /api/reservas/[id]/status:', err);
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
  }
}
```

---

## AÇÃO MANUAL NO VERCEL (JÁ ORIENTADA — CONFIRMAR QUE FOI FEITA)

1. **Vercel → Settings → Environment Variables → `NEXT_PUBLIC_APP_URL`**
   - Valor correto: `https://pousadaxangrilademorros.com.br`
   - Environments: Production and Preview

2. **Redeploy** após salvar a variável e o commit do código

---

## CHECKLIST DE VALIDAÇÃO

```
[ ] app/api/reservas/[id]/status/route.ts atualizado com busca híbrida (telefone + email)
[ ] Busca por email usa campo email_cliente da tabela clientes_xngrl
[ ] as any aplicado em todas as queries do admin client
[ ] npm run build sem erros TypeScript
[ ] Teste: login via Google OAuth → fazer reserva → gerar PIX → polling retorna 200 (não 404)
[ ] Teste: login via OTP telefone → fazer reserva → gerar PIX → polling retorna 200
[ ] Verificar NEXT_PUBLIC_APP_URL = https://pousadaxangrilademorros.com.br no Vercel
[ ] Redeploy realizado após todas as alterações
[ ] Teste completo: pagar PIX → tela muda automaticamente para confirmação
```

---

## TESTE COMPLETO PÓS-CORREÇÃO

1. Fazer login via Google OAuth
2. Criar uma nova reserva de teste (valor mínimo)
3. Na tela do QR Code, verificar nos logs do Vercel que `GET /api/reservas/{id}/status` retorna **200** (não 404)
4. Pagar o PIX
5. Aguardar até 30 segundos — a tela deve mudar automaticamente para a página de confirmação
6. Se não mudar, clicar em "Já paguei — Verificar"
7. Verificar no banco:
   ```sql
   SELECT status FROM reservas_confirmadas WHERE reserva_id = 'SEU_ID';
   -- Deve retornar 'confirmada'
   
   SELECT status FROM pre_reservas WHERE reserva_id = 'SEU_ID';
   -- Deve retornar 'pago'
   ```

---

## NOTAS

- Esta correção alinha a API de status com a mesma lógica híbrida que já existe em `app/api/pagamentos/pix/gerar/route.ts`
- A função `buscarClienteHibrido` é local a este arquivo (não extraída para um módulo compartilhado) para minimizar o impacto da mudança. Em uma refatoração futura, pode ser extraída para `lib/auth/buscar-cliente.ts`.
- O webhook do Mercado Pago (`app/api/webhooks/mercadopago/route.ts`) usa `createAdminClient()` e busca pelo `external_reference` — não depende da sessão do usuário, então não é afetado por este problema.
