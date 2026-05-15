# PROMPT CLAUDE CODE — FASE 12: Página "Sobre"

## CONTEXTO

Você está trabalhando no projeto `xangrila_web`, sistema web da Pousada Xangrilá de Morros (Maranhão), em produção em https://pousadaxangrilademorros.com.br.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Shadcn/ui, Supabase, Vercel.

**Objetivo desta fase:** Criar a página estática `/sobre` com conteúdo baseado no regulamento oficial da pousada. A página é pública, sem autenticação, sem chamadas a APIs ou banco de dados.

---

## REGRAS CRÍTICAS — NUNCA VIOLAR

1. **NÃO** usar `@supabase/auth-helpers-nextjs` — usar **`@supabase/ssr`**
2. **NÃO** usar `toast` do Shadcn — usar **`sonner`**
3. **NÃO** usar Zod v3 — usar **Zod v4**
4. **NÃO** alterar os arquivos protegidos:
   - `middleware.ts`, `lib/supabase/*`, `types/*`, `lib/utils.ts`, `lib/utils/*`
   - `components/ui/*.tsx`, `app/globals.css`
5. **NÃO** usar ícones `Instagram` ou `Facebook` do lucide-react (não existem na v1.6.0) — usar `Globe` e `Share2` ou SVG inline.
6. **NÃO** instalar dependências novas — usar apenas o que já existe no projeto.
7. **NÃO** usar `'use client'` no arquivo `page.tsx` — ele é Server Component para exportar `metadata`.
8. **NÃO** usar `createClientComponentClient` ou `createServerComponentClient`.

---

## TAREFAS A EXECUTAR

### TAREFA 1 — Criar `app/(public)/sobre/page.tsx`

Server Component. Exporta `metadata` SEO e renderiza `<SobreContent />`.

**Arquivo: `app/(public)/sobre/page.tsx`**

```tsx
import { Metadata } from 'next';
import SobreContent from '@/components/features/sobre-content';

export const metadata: Metadata = {
  title: 'Sobre | Pousada Xangri-lá de Morros',
  description:
    'Conheça a Pousada Xangri-lá de Morros: acomodações, preços, comodidades, políticas de check-in/check-out, pagamento e muito mais. Um refúgio de natureza no Maranhão.',
  keywords: [
    'pousada xangrila morros',
    'pousada maranhão',
    'chalés de madeira',
    'hospedagem morros ma',
    'pousada rio maranhão',
  ],
  openGraph: {
    title: 'Sobre | Pousada Xangri-lá de Morros',
    description:
      'Um refúgio de tranquilidade e natureza às margens do rio em Morros, Maranhão. Conheça nossas acomodações e políticas.',
    url: 'https://pousadaxangrilademorros.com.br/sobre',
    siteName: 'Pousada Xangri-lá de Morros',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function SobrePage() {
  return <SobreContent />;
}
```

---

### TAREFA 2 — Criar `components/features/sobre-content.tsx`

Client Component (`'use client'`). Contém toda a UI da página, organizada em 6 seções.

**Ícones a importar de `lucide-react`** (todos existem na v1.6.0):
`Home`, `Waves`, `Utensils`, `Wifi`, `TreePine`, `Star`, `Clock`, `CreditCard`, `Users`, `Shield`, `ChevronRight`, `MapPin`, `Phone`, `Baby`, `AlertCircle`, `CheckCircle2`

> ⚠️ `Instagram` NÃO existe no lucide-react v1.6.0. Para o link do Instagram, usar um SVG inline simples ou o ícone `Globe`.

**Arquivo: `components/features/sobre-content.tsx`**

Implemente as 6 seções abaixo em sequência dentro de um `<main>`:

---

#### SEÇÃO 1 — `<HeroSobre />`

Banner com fundo escuro (`bg-[#1a3a2a]`), py-24 md:py-36.

Elementos:
- Fundo decorativo: 2 blobs (`div` com `rounded-full blur-3xl`) e uma linha diagonal `via-[#74c69d]/30`
- Badge: `inline-flex` com `<MapPin />` → texto `"Morros, Maranhão — Brasil"`; borda `border-[#74c69d]/40`, bg `bg-[#74c69d]/10`, texto `text-[#74c69d]`
- `<h1>`: font-serif text-4xl md:text-6xl text-white, com `"Pousada Xangri‑lá"` em `text-[#74c69d]`
- Parágrafo subtítulo: text-white/70
- Linha divisória decorativa: linha esquerda degradê + `<Waves />` + linha direita degradê

---

#### SEÇÃO 2 — `<QuemSomos />`

`bg-white py-20`. Container max-w-5xl.

Sub-componente interno `StatCard`:
```
Props: icon, value (string), label (string)
Layout: flex-col items-center, ícone em rounded-xl bg-green-50 text-green-700
        hover: ícone muda para bg-green-700 text-white
        value: text-2xl font-bold text-gray-900
        label: text-sm text-gray-500
```

Grid de 4 StatCards (grid-cols-2 md:grid-cols-4):
- `Home` | "2" | "Casas de Alvenaria"
- `TreePine` | "9" | "Chalés de Madeira"
- `Users` | "~40" | "Hóspedes (capacidade)"
- ícone de barco/caiaque (usar `Sailboat` se disponível, senão `Waves`) | "7" | "Caiaques Gratuitos"

> ⚠️ Verificar se `Sailboat` existe no lucide-react v1.6.0. Se não existir, substituir por `Waves`.

Dois parágrafos em grid md:grid-cols-2 com o seguinte conteúdo (em texto corrido, com `<strong>` nos termos importantes):

**Col 1:**
- A Pousada Xangri-lá oferece duas casas de alvenaria que comportam até **6 pessoas** cada, além de **9 chalés de madeira** que acomodam de duas a três pessoas.
- Para descansar, há **redes por toda a área da varanda** dos chalés e um **quiosque às margens do rio** com churrasqueira e cozinha gourmet.

**Col 2:**
- A estrutura conta com **churrasqueira e forno à lenha** próximos às casas de alvenaria.
- Oferecemos **Wi-Fi gratuito** em toda a propriedade e **7 caiaques disponíveis sem custo adicional**.

---

#### SEÇÃO 3 — `<AcomodacoesPrecos />`

`bg-gray-50 py-20`.

Sub-componente interno `AcomodacaoCard`:
```
Props: nome, preco, capacidade, temCozinha (boolean | null), destaque? (boolean)
Layout: rounded-2xl border p-5 hover:-translate-y-1 hover:shadow-lg
        Se destaque: border-green-300 bg-green-50 shadow-md + badge "-top-3 left-4 bg-green-700"
        Preço: badge bg-green-700 text-white px-3 py-1 text-sm font-bold
        Capacidade + cozinha: chips rounded-full bg-gray-100 text-xs
```

**Bloco "Casas de Alvenaria"** (título com `<Home />`):
```
Casa Amarela   | R$ 1.000/diária | até 6 pessoas | temCozinha: null | destaque: true
Casa Vermelha  | R$ 1.000/diária | até 6 pessoas | temCozinha: null | destaque: true
```
Grid: sm:grid-cols-2

**Bloco "Chalés de Madeira"** (título com `<TreePine />`):
```
Chalé 01 | R$ 500/diária  | 2 pessoas | temCozinha: true
Chalé 02 | R$ 350/diária  | 2 pessoas | temCozinha: false
Chalé 03 | R$ 500/diária  | 2 pessoas | temCozinha: true
Chalé 04 | R$ 500/diária  | 3 pessoas | temCozinha: false
Chalé 05 | R$ 500/diária  | 3 pessoas | temCozinha: false
Chalé 06 | R$ 600/diária  | 3 pessoas | temCozinha: true
Chalé 07 | R$ 350/diária  | 2 pessoas | temCozinha: false
Chalé 08 | R$ 500/diária  | 3 pessoas | temCozinha: false
Chalé 09 | R$ 500/diária  | 2 pessoas | temCozinha: true
```
Grid: sm:grid-cols-2 md:grid-cols-3

Nota rodapé (text-xs text-gray-400):
> "* Todos os chalés e casas possuem ar-condicionado, banheiro com chuveiro elétrico, amenidades de banho gratuitas e TV de tela plana com canais a cabo."

---

#### SEÇÃO 4 — `<ComodidadesServicos />`

`bg-white py-20`. Grid sm:grid-cols-2 md:grid-cols-3.

Sub-componente `ComodidadeItem`:
```
Props: icon, titulo, descricao
Layout: flex gap-4; ícone em h-10 w-10 rounded-xl bg-green-100 text-green-700
```

6 itens:
```
Wifi        | "Wi-Fi Gratuito"         | "Disponível em todos os quartos e nas principais áreas comuns da pousada."
Utensils    | "Café da Manhã Incluso"  | "Servido das 8h30 às 10h. Restaurante disponível para almoço e jantar."
[caiaque]   | "7 Caiaques Gratuitos"   | "Explore o rio à vontade com os caiaques disponibilizados sem custo adicional."
Star        | "Passeio de Quadriciclo" | "Tour guiado das 9h às 17h. Reserva antecipada necessária. Valor: R$ 400,00."
Waves       | "Quiosque às Margens..."  | "Churrasqueira, cozinha gourmet e redes para relaxar com vista para o rio."
Shield      | "Segurança & Limpeza"    | "Extintor de incêndio, kit de primeiros socorros. Limpeza reforçada com desinfetantes certificados."
```

---

#### SEÇÃO 5 — `<Politicas />`

`bg-gray-50 py-20`. Grid md:grid-cols-2.

Sub-componente `PoliticaItem`:
```
Props: icon, titulo, itens (string[]), corIcone?, bgIcone?
Layout: rounded-2xl border border-gray-200 bg-white p-6 shadow-sm
        Cabeçalho: ícone em h-10 w-10 rounded-xl + título font-semibold
        Lista: ul com <ChevronRight /> em text-green-600 antes de cada item
```

6 cards:
```
Clock        | "Check-in & Check-out"    | text-green-700 bg-green-50
  - Check-in a partir das 14h00 (funcionário recepciona na chegada).
  - Idade mínima para check-in: 18 anos.
  - Check-out até as 12h00.
  - Check-in tardio sujeito à disponibilidade.
  - Camas e redes extras mediante solicitação.

CreditCard   | "Formas de Pagamento"     | text-green-700 bg-green-50
  - Pagamento 100% via PIX ou transferência bancária.
  - Dados bancários informados no ato da reserva.
  - Documento de identidade com foto pode ser solicitado no check-in.
  - Objetos quebrados ou extraviados serão cobrados pelo valor de mercado.

AlertCircle  | "Cancelamentos"           | text-amber-600 bg-amber-50
  - Alteração de data com mínimo 7 dias de antecedência: valor fica como crédito por 180 dias.
  - Cancelamento com menos de 3 dias antes da hospedagem: perda do valor total pago.
  - Reagendamento: valor da diária conforme o período remarcado.

CheckCircle2 | "Regras Gerais"           | text-green-700 bg-green-50
  - Café da manhã incluso: 8h30 às 10h.
  - Proibido trazer bebidas externas para as áreas de convivência.
  - Pets não permitidos na hospedagem e no restaurante (permitidos no Day Use e áreas comuns).
  - Finais de semana e feriados: reserva mínima de 2 diárias.

Baby         | "Viagens com Crianças"    | text-blue-600 bg-blue-50
  - Crianças de até 18 anos: apresentar certidão de nascimento e documento com foto no check-in.
  - Viagem com apenas um dos pais: carta de autorização com firma reconhecida em cartório, além dos documentos da criança.
  - Caso os responsáveis não possam assinar, será necessária autorização judicial.

Shield       | "Limpeza & Higiene"       | text-green-700 bg-green-50
  - Limpeza reforçada com desinfetantes certificados.
  - Roupas de cama e toalhas lavadas a no mínimo 60°C.
  - Superfícies de alto contato higienizadas diariamente.
  - Arrumação do chalé/casa somente a pedido do hóspede.
  - Troca de toalhas a partir da terceira diária.
```

---

#### SEÇÃO 6 — `<CTAFinal />`

`bg-[#1a3a2a] py-20`. Container max-w-3xl text-center.

Elementos:
- `<Waves />` decorativo em `text-[#74c69d]/60`
- `<h2>` font-serif text-3xl md:text-4xl text-white: "Pronto para conhecer o Xangri‑lá?"
- Parágrafo text-white/70
- Dois botões em flex (flex-col sm:flex-row sm:justify-center gap-4):
  - **Primário**: href="/reservar", bg-[#74c69d] text-[#1a3a2a], hover:bg-[#52b788]
  - **Secundário**: href="/contato", border border-white/30 text-white, hover:bg-white/10
- Linha com ícone SVG do Instagram + link para `https://instagram.com/pousadaxangrilademorros` → `@pousadaxangrilademorros`

SVG Instagram (inline, usar quando `Instagram` não existir no lucide-react):
```tsx
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="h-4 w-4"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
</svg>
```

---

### TAREFA 3 — Verificar link "Sobre" no Header

Abrir `components/layout/header.tsx` e confirmar que o link "Sobre" aponta para `/sobre`.

Se estiver usando a constante `ROUTES` de `lib/constants/index.ts`, verificar se existe:

```typescript
sobre: '/sobre',
```

Se não existir, adicionar a entrada. **Não modificar nenhum outro trecho** do arquivo de constantes.

---

## ORDEM DE EXECUÇÃO

1. Criar pasta `app/(public)/sobre/` (se não existir)
2. Criar `app/(public)/sobre/page.tsx` (TAREFA 1)
3. Criar `components/features/sobre-content.tsx` (TAREFA 2)
4. Verificar `ROUTES` no header (TAREFA 3)
5. Executar `npm run build` e confirmar zero erros

---

## CHECKLIST DE VALIDAÇÃO

```
[ ] app/(public)/sobre/page.tsx criado (Server Component, exporta metadata)
[ ] components/features/sobre-content.tsx criado ('use client')
[ ] Nenhum ícone inexistente no lucide-react v1.6.0 (sem Instagram, sem Facebook)
[ ] SVG inline do Instagram usado no CTAFinal
[ ] Sailboat verificado — se não existir, substituído por Waves
[ ] Link /sobre no header funcionando
[ ] npm run build — zero erros TypeScript
[ ] Página acessível em /sobre sem autenticação
[ ] Nenhum arquivo protegido foi modificado
```

---

## NOTAS FINAIS

- A página é **100% estática** — sem `useEffect`, sem fetch, sem Supabase.
- Todo conteúdo (preços, capacidades, regras, horários) foi extraído do **Regulamento da Pousada Xangrilá — novembro 2025**. Não alterar os valores.
- O padrão de cores da pousada é: verde escuro `#1a3a2a`, verde médio `#2d6a4f`, verde claro `#74c69d`, verde Tailwind `green-700`.
- Manter consistência visual com as demais páginas públicas do projeto (`/acomodacoes`, `/contato`).
