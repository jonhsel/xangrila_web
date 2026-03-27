# Testando o Fluxo Completo — Fase 6 (PIX via Mercado Pago)

## Visão Geral

O fluxo completo envolve:

```
/reservar → auth OTP → wizard (datas → quarto → resumo)
  → /reservar/pagamento (QR Code PIX)
    → webhook MP → banco atualizado
      → /reservar/confirmacao
```

---

## Pré-requisitos

- Servidor de desenvolvimento rodando: `npm run dev`
- Tokens do Mercado Pago Sandbox configurados no `.env.local`
- ngrok instalado (instruções abaixo)

---

## Passo 1 — Instalar o ngrok

O ngrok cria uma URL pública para o localhost, necessária para o Mercado Pago conseguir chamar o webhook.

```bash
# Ubuntu/Linux via apt
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Alternativa via snap
sudo snap install ngrok
```

Crie uma conta gratuita em **https://ngrok.com** e autentique:

```bash
ngrok config add-authtoken SEU-TOKEN-DO-NGROK
```

---

## Passo 2 — Iniciar o ngrok

Em um terminal separado (mantenha rodando durante todo o teste):

```bash
ngrok http 3000
```

Vai aparecer algo como:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Copie a URL `https://abc123.ngrok-free.app` — você vai precisar dela nos próximos passos.

---

## Passo 3 — Atualizar o `.env.local`

Substitua o valor de `NEXT_PUBLIC_APP_URL` pela URL do ngrok:

```bash
# Antes
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Depois
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

Reinicie o servidor após a alteração:

```bash
# Ctrl+C para parar, depois:
npm run dev
```

> **Importante:** a cada vez que você reiniciar o ngrok, a URL muda. Lembre de atualizar o `.env.local` e o webhook no painel do MP.

---

## Passo 4 — Configurar o Webhook no Mercado Pago Sandbox

1. Acesse **mercadopago.com.br** com sua conta de desenvolvedor
2. Vá em **Seu negócio → Configurações → Webhooks** (ou Notificações)
3. Selecione o modo **Teste / Sandbox**
4. Clique em **"Adicionar webhook"**
5. Configure:
   - **URL:** `https://abc123.ngrok-free.app/api/webhooks/mercadopago`
   - **Eventos:** marque **Pagamentos**
6. Salve

Para verificar se o webhook está sendo recebido, monitore o terminal do servidor ou o painel do ngrok em `http://localhost:4040`.

---

## Passo 5 — Criar um Período de Reserva no Supabase

Sem registros na tabela `periodos_reserva`, o wizard retorna "período fechado" e não avança.

Acesse o **SQL Editor** do painel do Supabase e execute:

```sql
-- Verificar se já existem períodos
SELECT * FROM periodos_reserva;

-- Se a tabela estiver vazia, inserir um período de teste
INSERT INTO periodos_reserva (
  data_inicio,
  data_fim,
  ativo,
  descricao
) VALUES (
  '2026-04-01',
  '2026-12-31',
  true,
  'Temporada de teste'
);
```

---

## Passo 6 — Fazer o Fluxo Completo

1. Acesse `http://localhost:3000/reservar`
2. **Autenticação OTP:** informe seu número de telefone real (Twilio está configurado)
3. **Step 1 — Datas:** selecione check-in e check-out dentro do período criado
4. **Step 2 — Quarto:** escolha uma acomodação disponível
5. **Step 3 — Resumo:** confirme a reserva → você é redirecionado para `/reservar/pagamento`
6. **Pagamento:** o QR Code PIX é gerado — copie o código ou escaneie
7. **Simular pagamento aprovado** no painel do MP Sandbox (ver Passo 7)
8. O webhook dispara → banco é atualizado → polling detecta → redireciona para `/reservar/confirmacao`

---

## Passo 7 — Simular Pagamento no Sandbox do Mercado Pago

No painel do Mercado Pago Sandbox:

1. Vá em **Atividade** ou use a ferramenta de simulação de pagamentos
2. Localize o pagamento criado (identificado pelo `reservaId` no `external_reference`)
3. Altere o status para **Aprovado**
4. O webhook é disparado automaticamente para a URL configurada no Passo 4

Alternativamente, use o botão **"Já paguei — Verificar"** na página `/reservar/pagamento` para forçar a verificação de status via polling.

---

## Alternativa: Testar o Webhook Diretamente com curl

Se quiser validar apenas o processamento do webhook sem fazer o fluxo completo:

```bash
# Substitua SEU_PAYMENT_ID por um ID real de pagamento do sandbox
curl -X POST https://abc123.ngrok-free.app/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "api_version": "v1",
    "data": {"id": "SEU_PAYMENT_ID"},
    "date_created": "2026-03-27T00:00:00Z",
    "id": 1,
    "live_mode": false,
    "user_id": "test"
  }'

# Resposta esperada:
# {"received":true}
```

Verifique os logs do servidor para acompanhar o processamento assíncrono.

---

## Verificação Final — O que Confirmar

| Item | Como verificar |
|---|---|
| QR Code aparece na tela | `/reservar/pagamento` exibe QR Code e código copiável |
| Webhook recebido | Terminal do servidor mostra `[Webhook MP] Notificação recebida` |
| Pagamento validado na API do MP | Log mostra `[Webhook MP] Status do pagamento: { status: 'approved' }` |
| Banco atualizado | Supabase: `reservas_confirmadas.status = 'confirmada'` e `pre_reservas.status = 'pago'` |
| Redirecionamento para confirmação | Página `/reservar/confirmacao?id=...` carrega com dados da reserva |
| Trigger de notificação | Supabase: registro criado em `notificacoes_pendentes` |

---

## Monitoramento durante o Teste

**Logs do servidor (terminal do `npm run dev`):**
```
[Webhook MP] Notificação recebida: { type: 'payment', paymentId: '...', liveMode: false }
[Webhook MP] Status do pagamento: { id: ..., status: 'approved', externalReference: '...' }
[Webhook MP] ✅ Reserva ... confirmada com sucesso — Pagamento MP: ...
```

**Painel do ngrok** (inspecionar requisições HTTP):
```
http://localhost:4040
```

**SQL para verificar o banco após o pagamento:**
```sql
-- Verificar status da reserva
SELECT reserva_id, status, valor_pago, data_pagamento, metodo_pagamento
FROM reservas_confirmadas
ORDER BY created_at DESC
LIMIT 5;

-- Verificar pré-reserva
SELECT reserva_id, status, chave_pix
FROM pre_reservas
ORDER BY criada_em DESC
LIMIT 5;

-- Verificar fila de notificações
SELECT * FROM notificacoes_pendentes ORDER BY criada_em DESC LIMIT 5;
```

---

## Observações Importantes

- A URL do ngrok muda a cada reinicialização — atualize `.env.local` e o webhook no painel do MP
- O token `TEST-...` do Mercado Pago só funciona em modo sandbox — nunca use em produção sem trocar por `APP_USR-...`
- O polling de 5s na página de pagamento serve como backup caso o webhook falhe
- Em produção (Fase 9), o `NEXT_PUBLIC_APP_URL` será a URL do Vercel — sem necessidade de ngrok
