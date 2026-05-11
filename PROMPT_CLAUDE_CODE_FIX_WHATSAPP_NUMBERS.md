# CORREÇÃO: Números de WhatsApp Hardcodados em "Minhas Reservas"

## PROBLEMA

Na página `app/(auth)/minhas-reservas/page.tsx`, os botões "Falar com a Pousada" estão usando números de WhatsApp **hardcodados incorretos** em vez da constante `POUSADA.whatsapp`.

| Componente | Número errado (hardcodado) | Número correto (POUSADA.whatsapp) |
|---|---|---|
| DayUseCard | `5598981519965` | `5598991178982` |
| ReservaCard (reserva-card.tsx) | `5598981672949` | `5598991178982` |

---

## ARQUIVOS A CORRIGIR

### 1. `app/(auth)/minhas-reservas/page.tsx` — DayUseCard

**Localizar** o trecho dentro da função `DayUseCard` que contém:

```tsx
href={`https://wa.me/5598981519965?text=${encodeURIComponent(
  `Olá! Gostaria de informações sobre meu Day Use ${dayUse.reservation_code}`
)}`}
```

**Substituir por:**

```tsx
href={`https://wa.me/${POUSADA.whatsapp}?text=${encodeURIComponent(
  `Olá! Gostaria de informações sobre meu Day Use ${dayUse.reservation_code}`
)}`}
```

**Verificar se o import de POUSADA já existe** no topo do arquivo:

```tsx
import { POUSADA } from '@/lib/constants';
```

Se não existir, adicionar junto com os demais imports.

---

### 2. `components/features/reserva/reserva-card.tsx` — ReservaCard

**Localizar** o trecho que contém:

```tsx
href={`https://wa.me/5598981672949?text=${encodeURIComponent(
  `Olá! Tenho a reserva #${reserva.reserva_id} e gostaria de informações.`
)}`}
```

**Substituir por:**

```tsx
href={`https://wa.me/${POUSADA.whatsapp}?text=${encodeURIComponent(
  `Olá! Tenho a reserva #${reserva.reserva_id} e gostaria de informações.`
)}`}
```

**Verificar se o import de POUSADA já existe** no topo do arquivo:

```tsx
import { POUSADA } from '@/lib/constants';
```

Se não existir, adicionar junto com os demais imports.

---

## VERIFICAÇÃO ADICIONAL — BUSCAR OUTROS NÚMEROS HARDCODADOS

Após as correções acima, executar uma busca global no projeto para garantir que não existem outros números hardcodados:

```bash
grep -rn "wa.me/55" --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "POUSADA"
```

Se encontrar outros resultados, substituir pelo padrão `${POUSADA.whatsapp}`.

Também buscar pelo padrão de telefone direto:

```bash
grep -rn "5598981519965\|5598981672949\|98151-9965\|98167-2949" --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

Todos os resultados devem ser corrigidos para usar `POUSADA.whatsapp`.

---

## REGRA REFORÇADA

**NUNCA hardcodar números de telefone/WhatsApp.** Sempre usar:
- `POUSADA.whatsapp` → para links `wa.me/`
- `POUSADA.telefone` → para exibição formatada
- `POUSADA.whatsappLink` → para link completo `https://wa.me/5598991178982`

Todos definidos em `lib/constants/index.ts`.

---

## BUILD FINAL

```bash
npm run build
```

Deve compilar sem erros.
