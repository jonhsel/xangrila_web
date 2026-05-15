# PROMPT CLAUDE CODE — FIX: Wizard de Reservas Trava ao Tentar Período Bloqueado

## PROBLEMA

Quando o cliente tenta reservar em um período não disponível (`periodos_reserva.ativo = false`),
o sistema exibe corretamente o toast de erro "Período não disponível para reservas. Consulte
outros períodos."

**Porém**, o estado do Zustand (persistido no `sessionStorage`) fica corrompido:
- As datas inválidas permanecem no store (`dataCheckin`, `dataCheckout` preenchidos)
- O `step` fica em 2 (seleção de quartos)
- O `room-selector.tsx` chama `GET /api/disponibilidade?checkin=...&checkout=...` com as
  datas bloqueadas → a API retorna HTTP 422 com `{ erro: "Período não disponível..." }`
- O componente exibe "Não foi possível carregar a disponibilidade" com apenas "Tentar novamente"
- Ao recarregar a página (F5), o Zustand restaura o estado corrompido do sessionStorage
  e o ciclo se repete — o calendário nunca é exibido novamente

**Causa raiz:** a função `avancar()` em `date-selector.tsx` chama `setDatas()` + `setStep(2)`
ANTES de validar se o período é permitido. A validação acontece depois, quando o
`room-selector.tsx` chama a API de disponibilidade e recebe o erro 422. Mas nesse ponto
o store já foi persistido com as datas inválidas e `step: 2`.

---

## REGRAS CRÍTICAS — NUNCA VIOLAR

1. **NÃO** usar `@supabase/auth-helpers-nextjs` — usar **`@supabase/ssr`**
2. **NÃO** usar `toast` do Shadcn — usar **`sonner`** (import { toast } from 'sonner')
3. **NÃO** alterar os arquivos protegidos: `middleware.ts`, `lib/supabase/*`, `types/*`, `lib/utils*`, `components/ui/*`, `app/globals.css`
4. **NÃO** usar `createClientComponentClient` ou `createServerComponentClient`
5. **NÃO** chamar `supabase.auth.getSession()` no servidor — usar `supabase.auth.getUser()`
6. Manter o padrão de `cast as any` nas queries do `createAdminClient()`
7. Usar imports existentes — não adicionar dependências novas

---

## ENTENDIMENTO DO FLUXO ATUAL (LEIA ANTES DE MODIFICAR)

### `date-selector.tsx` — como funciona HOJE

```
1. Usuário seleciona datas no calendário (estado LOCAL: `intervalo`)
2. Clica "Próximo" → chama `avancar()`
3. `avancar()` faz:
   - setDatas(checkin, checkout, diarias)  ← PERSISTE no sessionStorage
   - setStep(2)                            ← PERSISTE no sessionStorage
4. O `reservar/page.tsx` renderiza `<RoomSelector />` (step === 2)
```

**O `date-selector.tsx` NÃO chama a API de disponibilidade — ele apenas grava datas e avança.**
Quem chama a API é o `room-selector.tsx` no `useEffect` da montagem.

### `room-selector.tsx` — como funciona HOJE

```
1. Monta → useEffect detecta dataCheckin + dataCheckout → chama buscarDisponibilidade()
2. buscarDisponibilidade() faz GET /api/disponibilidade?checkin=X&checkout=Y
3. Se resp.ok → preenche `disponibilidade` (state local)
4. Se !resp.ok → mostra toast de erro, `disponibilidade` fica null
5. Se disponibilidade === null após carregamento → renderiza:
   "Não foi possível carregar a disponibilidade." + botão "Tentar novamente"
```

### `app/api/disponibilidade/route.ts` — como responde para período bloqueado

A API chama `validar_reserva_completa()` (function SQL). Se o período está bloqueado:
```
HTTP 422 — { erro: "Período não disponível para reservas." }
```

O `room-selector.tsx` faz `const err = await resp.json()` e exibe
`toast.error(err.erro || 'Erro ao buscar disponibilidade.')`.

### `app/reservar/page.tsx` — como funciona HOJE

- Lê `step` do store Zustand
- Se step === 1 → renderiza `<DateSelector />`
- Se step === 2 → renderiza `<RoomSelector />`
- Se step === 3 → renderiza `<ReservationSummary />`
- Já usa `useState(true)` para `verificando` (aguarda sessão) — pode reaproveitar

---

## ARQUIVOS A MODIFICAR

### 1. `components/features/reserva/room-selector.tsx`

**Objetivo:** Quando a API retorna erro (especialmente 422 = período bloqueado), além
do toast de erro que já existe:
- Limpar as datas do store Zustand
- Voltar para step 1 automaticamente
- Manter botão "Voltar às datas" como saída de emergência no estado de erro

**Modificação A — Adicionar `setDatas` à desestruturação do `useReserva()`:**

Encontrar:
```typescript
const {
    dataCheckin,
    dataCheckout,
    totalDiarias,
    tipoQuarto: tipoSelecionado,
    pessoas: pessoasSelecionadas,
    setQuarto,
    setStep,
  } = useReserva();
```

Substituir por:
```typescript
const {
    dataCheckin,
    dataCheckout,
    totalDiarias,
    tipoQuarto: tipoSelecionado,
    pessoas: pessoasSelecionadas,
    setQuarto,
    setStep,
    setDatas,
  } = useReserva();
```

**Modificação B — Adicionar rollback automático no bloco de erro da API:**

Encontrar:
```typescript
if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.erro || 'Erro ao buscar disponibilidade.');
        return;
      }
```

Substituir por:
```typescript
if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.erro || 'Erro ao buscar disponibilidade.');

        // Se período bloqueado (422), limpar datas e voltar ao calendário
        if (resp.status === 422) {
          setDatas('', '', 0);
          setStep(1);
        }
        return;
      }
```

**Modificação C — Adicionar botão "Escolher novas datas" no bloco de erro visual:**

Encontrar:
```tsx
if (!disponibilidade) {
    return (
      <div className="mx-auto max-w-2xl text-center space-y-4 py-12">
        <p className="text-muted-foreground">Não foi possível carregar a disponibilidade.</p>
        <Button onClick={buscarDisponibilidade}>Tentar novamente</Button>
      </div>
    );
  }
```

Substituir por:
```tsx
if (!disponibilidade) {
    return (
      <div className="mx-auto max-w-2xl text-center space-y-4 py-12">
        <p className="text-muted-foreground">Não foi possível carregar a disponibilidade.</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => { setDatas('', '', 0); setStep(1); }}>
            ← Escolher novas datas
          </Button>
          <Button onClick={buscarDisponibilidade}>Tentar novamente</Button>
        </div>
      </div>
    );
  }
```

---

### 2. `app/reservar/page.tsx`

**Objetivo:** Adicionar um guard de hidratação. Se o store Zustand carregar com
`step >= 2` mas as datas estiverem vazias/nulas (estado corrompido de sessão anterior),
forçar `step: 1` automaticamente.

**Por que isso é necessário mesmo com a correção 1:** Se o usuário fechar a aba no momento
exato entre o `setStep(2)` e o redirecionamento do `room-selector` (ou se a aba crashar),
o sessionStorage fica corrompido. O guard é a rede de segurança.

**Modificação A — Estender a desestruturação do store:**

Encontrar:
```typescript
const { autenticado, step, setAutenticado } = useReserva();
```

Substituir por:
```typescript
const { autenticado, step, dataCheckin, dataCheckout, setAutenticado, setStep, setDatas } = useReserva();
```

**Modificação B — Adicionar useEffect de guard APÓS o useEffect de verificarSessao:**

Encontrar o useEffect existente:
```typescript
// Verifica sessão ao montar
  useEffect(() => {
    verificarSessao();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

Adicionar LOGO APÓS esse useEffect (não dentro dele):
```typescript
// Guard: se step >= 2 mas sem datas válidas, voltar para step 1
// Previne estado corrompido no sessionStorage de sessões anteriores
useEffect(() => {
  if (verificando) return;
  if (step >= 2 && (!dataCheckin || !dataCheckout)) {
    setDatas('', '', 0);
    setStep(1);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [verificando]);
```

**Por que `verificando` como dependência:** O `verificando` começa como `true` e muda
para `false` quando `verificarSessao()` termina. Nesse ponto o Zustand já hidratou do
sessionStorage (ele hidrata imediatamente na montagem do componente, antes de qualquer
useEffect). O guard roda no momento certo: após hidratação, antes de renderizar os steps.

**Por que `eslint-disable-next-line`:** As dependências `step`, `dataCheckin`, `dataCheckout`,
`setDatas`, `setStep` são intencionalmente omitidas — o guard deve rodar UMA VEZ quando
`verificando` muda de `true` para `false`, não em toda mudança de step/datas (o que
causaria loops no fluxo normal). Este é o mesmo padrão já usado no `useEffect` de
`verificarSessao()` logo acima.

---

## NÃO MODIFICAR — `date-selector.tsx`

O `date-selector.tsx` **NÃO deve ser modificado**, porque:

1. Ele não chama a API de disponibilidade — quem faz isso é o `room-selector.tsx`.
   Adicionar uma chamada à API no `date-selector` criaria uma requisição duplicada.

2. A lógica correta é: `date-selector` grava as datas → `room-selector` valida via
   API → se inválido, o próprio `room-selector` faz o rollback (correção 1 acima).

3. O `date-selector.tsx` não tem acesso ao campo `periodoDisponivel` porque ele não
   chama nenhuma API — ele apenas seleciona datas em um calendário local.

---

## RESUMO DA ORDEM DE EXECUÇÃO

1. **Modificar `components/features/reserva/room-selector.tsx`** — 3 substituições (A, B, C):
   adicionar `setDatas` ao destructuring, rollback automático no erro 422, botão de emergência
2. **Modificar `app/reservar/page.tsx`** — 2 substituições (A, B):
   estender destructuring do store, adicionar guard de hidratação

**Total: 2 arquivos, 5 substituições cirúrgicas.**
**NÃO é necessário SQL no Supabase.**
**NÃO é necessário npm install.**

---

## VERIFICAÇÃO PÓS-CORREÇÃO

Testar os seguintes cenários na ordem:

### Cenário 1 — Período bloqueado (fluxo principal do bug)
1. Acessar `/reservar` e autenticar
2. Selecionar datas em um período com `periodos_reserva.ativo = false`
3. Clicar "Próximo"
4. **Esperado:** toast de erro "Período não disponível..." aparece → calendário volta automaticamente (step 1) ✅
5. Selecionar datas em um período VÁLIDO
6. **Esperado:** avança para seleção de quartos normalmente ✅

### Cenário 2 — Sessão corrompida no sessionStorage
1. Abrir DevTools → Application → Session Storage
2. Editar manualmente `xangrila-reserva` para ter `step: 2` e `dataCheckin: null`
3. Recarregar a página (F5)
4. **Esperado:** o guard detecta inconsistência e volta para step 1 ✅

### Cenário 3 — Botão de emergência
1. Forçar o estado de erro do `room-selector` (ex: erros de rede)
2. **Esperado:** tela mostra "Não foi possível carregar..." com dois botões ✅
3. Clicar "← Escolher novas datas"
4. **Esperado:** volta para o calendário ✅

### Cenário 4 — Regressão do fluxo normal (CRÍTICO)
1. Selecionar datas em um período VÁLIDO → avançar → selecionar quarto → resumo → voltar
2. **Esperado:** todo o fluxo ida-e-volta funciona sem perder dados ✅
3. A autenticação (`clienteId`, `clienteNome`) é preservada durante todos os steps ✅
4. Os dados de datas e quarto são mantidos ao navegar entre steps ✅

---

## CONTEXTO ADICIONAL

- Store Zustand: `lib/hooks/use-reserva.ts` — usa `sessionStorage` com persist middleware
  (chave: `xangrila-reserva`)
- O `estadoInicial` do store tem `step: 1`, `dataCheckin: null`, `dataCheckout: null`
- O método `reset()` já existe no store e volta para `estadoInicial` (incluindo
  `autenticado: false`) — por isso usamos `setStep(1)` + `setDatas('', '', 0)` ao invés
  de `reset()`, para preservar a autenticação do cliente
- O `setDatas('', '', 0)` define strings vazias (não null) — o guard no `page.tsx` trata
  ambos os casos (`!dataCheckin` captura null, undefined e '' igualmente)
- A API pública `GET /api/disponibilidade` retorna HTTP 422 quando `validar_reserva_completa()`
  detecta período bloqueado — o body é `{ erro: "Período não disponível para reservas." }`
