# INSTRUÇÕES PARA CLAUDE CODE — IMPLEMENTAÇÃO DA FASE 4

## CONTEXTO

Você está trabalhando no projeto `xangrila_web`, um sistema web para gerenciamento da Pousada Xangrilá (São Luís - MA), construído com Next.js 16, TypeScript, Tailwind CSS, Shadcn/ui e Supabase.

As Fases 1, 2 e 3 (setup, banco de dados, código base) já foram concluídas. A Fase 4 (Landing Page e UI pública) precisa ser implementada DO ZERO.

## ESTADO ATUAL DO PROJETO

Arquivos que JÁ EXISTEM e NÃO devem ser alterados (exceto app/layout.tsx):
- middleware.ts
- lib/supabase/client.ts, server.ts, admin.ts (usam @supabase/ssr)
- types/database.ts (25 tabelas completas)
- types/index.ts (Row aliases + constantes)
- lib/validations/reserva.ts
- lib/utils.ts (cn do shadcn)
- lib/utils/date.ts, format.ts
- components/ui/*.tsx (12 componentes shadcn)
- app/globals.css

Dependências confirmadas no package.json:
- next v16.1.6, react v19.2.3
- @supabase/ssr v0.9.0 (NÃO usa auth-helpers)
- zod v4.3.6 (Zod v4, NÃO v3)
- sonner v2.0.7 (toast — NÃO usa @shadcn/ui/toast)
- zustand, date-fns, react-day-picker, qrcode.react

## TAREFAS A EXECUTAR

### 1. Instalar componente textarea do shadcn
```bash
npx shadcn@latest add textarea
```

### 2. Criar lib/utils/index.ts (barrel export — NÃO existe)
```typescript
export { cn } from '../utils';
export * from './date';
export * from './format';
```

### 3. Criar lib/constants/pousada.ts
Dados centralizados da pousada + rotas. Conteúdo:
```typescript
export const POUSADA = {
  nome: 'Pousada Xangrilá',
  nomeCompleto: 'Pousada Xangrilá - Morros',
  slogan: 'Seu refúgio perfeito em São Luís',
  descricao: 'Conforto, natureza e tranquilidade em um só lugar.',
  telefone: '(98) 98167-2949',
  whatsapp: '5598981672949',
  whatsappLink: 'https://wa.me/5598981672949',
  email: 'contato@pousadaxangrila.com.br',
  endereco: { logradouro: 'Morros', cidade: 'São Luís', estado: 'MA', completo: 'Morros, São Luís - MA' },
  googleMapsUrl: 'https://maps.google.com/?q=Pousada+Xangrilá+Morros+São+Luís',
  googleMapsEmbed: '',
  social: {
    instagram: { url: 'https://instagram.com/pousadaxangrila', handle: '@pousadaxangrila' },
    facebook: { url: 'https://facebook.com/pousadaxangrila', handle: 'pousadaxangrila' },
  },
  horarios: {
    checkin: { inicio: '14:00', fim: '22:00', label: '14:00 - 22:00' },
    checkout: { limite: '12:00', label: 'Até 12:00' },
    recepcao: { inicio: '08:00', fim: '22:00', label: '08:00 - 22:00' },
  },
  seo: {
    titleDefault: 'Pousada Xangrilá - Morros, São Luís - MA',
    titleTemplate: '%s | Pousada Xangrilá',
    description: 'Seu refúgio perfeito em São Luís. Casas e chalés com conforto e tranquilidade nos Morros. Reserve agora!',
    keywords: ['pousada são luís', 'hospedagem morros', 'chalé são luís', 'pousada maranhão', 'pousada xangrilá'],
  },
} as const;

export const ROUTES = {
  home: '/', sobre: '/sobre', quartos: '/quartos', contato: '/contato',
  dayUse: '/day-use', reservar: '/reservar', minhasReservas: '/minhas-reservas',
  termos: '/termos', privacidade: '/privacidade',
  admin: { dashboard: '/dashboard', reservas: '/dashboard/reservas', relatorios: '/dashboard/relatorios' },
  api: { disponibilidade: '/api/disponibilidade', reservasCriar: '/api/reservas/criar', reservasStatus: '/api/reservas/status' },
} as const;
```

### 4. Criar lib/constants/acomodacoes.ts
Tipos de acomodação com mapeamento front-end ↔ banco de dados.

O schema SQL real tem formatos DIFERENTES por tabela:
- acomodacoes.tipo: 'Casa' | 'Chalé'
- acomodacoes.categoria: 'com_cozinha' | 'sem_cozinha' | null
- precos_pacotes.tipo_acomodacao: 'chale_com_cozinha' | 'chale_sem_cozinha' | 'casa'
- disponibilidade_quartos.tipo_quarto: VARCHAR livre
- verificar_e_criar_reserva (function SQL): normaliza com LIKE '%com%cozinha%'
- validar_reserva_completa (function SQL): match exato com precos_pacotes

Configuração real da pousada:
- Casa: 2 unidades (Amarela, Vermelha), até 6 pessoas
- Chalé com Cozinha: 4 unidades (01, 03, 06, 09), até 3 pessoas
- Chalé sem Cozinha: 5 unidades (02, 04, 05, 07, 08), até 3 pessoas

```typescript
export const TIPOS_ACOMODACAO = {
  casa: {
    label: 'Casa',
    dbTipoQuarto: 'Casa',
    dbTipo: 'Casa',
    dbCategoria: null as string | null,
    dbTipoAcomodacao: 'casa',
    slug: 'casa',
    capacidadeMinima: 1,
    capacidadeMaxima: 6,
    descricaoCurta: 'Espaçosas e completas. Ideais para famílias.',
    features: ['Até 6 pessoas', 'Cozinha completa', 'Área externa', 'Churrasqueira'],
    unidades: ['Amarela', 'Vermelha'],
    totalUnidades: 2,
    gradient: 'from-green-400 to-green-600',
  },
  chale_com_cozinha: {
    label: 'Chalé com Cozinha',
    dbTipoQuarto: 'Chalé - Com Cozinha',
    dbTipo: 'Chalé',
    dbCategoria: 'com_cozinha',
    dbTipoAcomodacao: 'chale_com_cozinha',
    slug: 'chale-com-cozinha',
    capacidadeMinima: 1,
    capacidadeMaxima: 3,
    descricaoCurta: 'Aconchegantes e equipados. Perfeitos para casais ou pequenos grupos.',
    features: ['Até 3 pessoas', 'Cozinha equipada', 'Varanda privativa', 'Ar condicionado'],
    unidades: ['01', '03', '06', '09'],
    totalUnidades: 4,
    gradient: 'from-blue-400 to-blue-600',
  },
  chale_sem_cozinha: {
    label: 'Chalé sem Cozinha',
    dbTipoQuarto: 'Chalé - Sem Cozinha',
    dbTipo: 'Chalé',
    dbCategoria: 'sem_cozinha',
    dbTipoAcomodacao: 'chale_sem_cozinha',
    slug: 'chale-sem-cozinha',
    capacidadeMinima: 1,
    capacidadeMaxima: 3,
    descricaoCurta: 'Confortáveis e econômicos. Ótimos para estadias rápidas.',
    features: ['Até 3 pessoas', 'Mini-geladeira', 'Ar condicionado', 'Banheiro privativo'],
    unidades: ['02', '04', '05', '07', '08'],
    totalUnidades: 5,
    gradient: 'from-purple-400 to-purple-600',
  },
} as const;

export type TipoAcomodacaoKey = keyof typeof TIPOS_ACOMODACAO;

export function getTipoAcomodacao(valor: string) {
  const norm = valor.toLowerCase().trim();
  for (const [key, config] of Object.entries(TIPOS_ACOMODACAO)) {
    if (norm === key || norm === config.dbTipoQuarto.toLowerCase() || norm === config.dbTipoAcomodacao || norm === config.slug || norm === config.label.toLowerCase()) {
      return { key: key as TipoAcomodacaoKey, ...config };
    }
  }
  if (norm.includes('com') && norm.includes('cozinha')) return { key: 'chale_com_cozinha' as const, ...TIPOS_ACOMODACAO.chale_com_cozinha };
  if (norm.includes('sem') && norm.includes('cozinha')) return { key: 'chale_sem_cozinha' as const, ...TIPOS_ACOMODACAO.chale_sem_cozinha };
  if (norm.includes('casa')) return { key: 'casa' as const, ...TIPOS_ACOMODACAO.casa };
  if (norm.includes('chal')) return { key: 'chale_sem_cozinha' as const, ...TIPOS_ACOMODACAO.chale_sem_cozinha };
  return null;
}

export function listarTiposAcomodacao() {
  return Object.entries(TIPOS_ACOMODACAO).map(([key, config]) => ({
    value: key as TipoAcomodacaoKey, label: config.label, dbTipoQuarto: config.dbTipoQuarto, dbTipoAcomodacao: config.dbTipoAcomodacao,
  }));
}

export const TIPOS_QUARTO_ENUM = ['Casa', 'Chalé - Com Cozinha', 'Chalé - Sem Cozinha'] as const;
export type TipoQuarto = (typeof TIPOS_QUARTO_ENUM)[number];
```

### 5. Criar lib/constants/index.ts
```typescript
export { POUSADA, ROUTES } from './pousada';
export { TIPOS_ACOMODACAO, TIPOS_QUARTO_ENUM, getTipoAcomodacao, listarTiposAcomodacao, type TipoAcomodacaoKey, type TipoQuarto } from './acomodacoes';
```

### 6. Criar components/layout/header.tsx
Header com navegação responsiva, menu mobile com aria attributes.
- Usar ROUTES para todos os links
- Usar POUSADA.nome para o logo
- Incluir aria-expanded, aria-controls, aria-label no botão mobile
- Links: Início, Acomodações, Day Use, Sobre, Contato
- Botões: Minhas Reservas (outline), Reservar (primary)
- 'use client' (usa useState para menu mobile)

### 7. Criar components/layout/footer.tsx
Footer com 4 colunas: Sobre, Links Rápidos, Contato, Horários.
- Usar POUSADA para todos os dados (telefone, email, endereço, horários, redes sociais)
- Usar ROUTES para links
- Incluir aria-label nos links de redes sociais
- role="contentinfo" no footer
- Server Component (sem 'use client')

### 8. Criar components/features/home-content.tsx
Client Component ('use client') com toda a UI da landing page:
- Hero: título POUSADA.nomeCompleto, slogan, CTAs para /reservar e /day-use
- Features: 3 cards (Localização, Acomodações Variadas, Atendimento Premium)
- Acomodações: gerar cards a partir de Object.values(TIPOS_ACOMODACAO) — não hardcodar
- Amenities: Piscina, Jardim, Wi-Fi, Estacionamento, Café da Manhã, Segurança
- Testimonials: 3 depoimentos com rating em estrelas (usar sr-only para acessibilidade)
- CTA final: "Pronto para sua próxima aventura?" com gradient-primary

### 9. Criar components/features/whatsapp-button.tsx
Botão flutuante ('use client'):
- Fixed bottom-6 right-6 z-50
- bg-green-500, hover:scale-110
- Abre WhatsApp com mensagem pré-formatada
- Tooltip "Fale conosco!" no hover
- aria-label para acessibilidade

### 10. SUBSTITUIR app/layout.tsx
O atual é o padrão do create-next-app. Substituir por:
- Metadata usando POUSADA.seo (title, description, keywords, OpenGraph)
- lang="pt-BR"
- Font Inter
- Toaster do SONNER (import { Toaster } from 'sonner' — NÃO de @/components/ui/toaster)

### 11. REMOVER app/page.tsx
O page.tsx atual é o padrão do Next.js. Deve ser REMOVIDO porque
app/(public)/page.tsx assumirá a rota /.

### 12. Criar app/(public)/layout.tsx
Layout para páginas públicas:
- Importar Header, Footer, WhatsAppButton
- Estrutura: div min-h-screen flex flex-col > Header > main flex-1 > Footer > WhatsAppButton

### 13. Criar app/(public)/page.tsx
Server Component que exporta metadata SEO e renderiza <HomeContent />.
NÃO usar 'use client' neste arquivo (metadata precisa de Server Component).

### 14. Criar app/(public)/contato/page.tsx
Página de contato ('use client'):
- Formulário que envia via WhatsApp (window.open com mensagem formatada)
- USAR toast do SONNER: import { toast } from 'sonner' (NÃO useToast)
- Cards de contato: telefone, email, endereço (todos de POUSADA)
- Banner verde "Resposta mais rápida pelo WhatsApp!"
- Seção com mapa placeholder + horários
- aria-required nos campos obrigatórios

### 15. Criar app/(public)/day-use/page.tsx
Server Component com metadata SEO. Placeholder simples:
- Hero com ícone Sun
- 3 cards: Horário (8h-18h), Capacidade (até 20), Inclui (piscina, churrasqueira)
- CTA WhatsApp para reservar

### 16. Criar app/not-found.tsx
Página 404 com botões para Home e Contato usando ROUTES.

### 17. Criar app/(public)/loading.tsx
Skeleton animado (animate-pulse) com placeholders de conteúdo.

### 18. Criar app/(public)/error.tsx
'use client', botão "Tentar Novamente" com reset(), ícone AlertTriangle.

## REGRAS IMPORTANTES

1. NUNCA usar import de '@/components/ui/toaster' ou 'useToast' — o projeto usa SONNER
2. NUNCA usar import de '@supabase/auth-helpers-nextjs' — usa @supabase/ssr
3. Todos os dados da pousada vêm de POUSADA (constantes), NUNCA hardcodar
4. Todos os links usam ROUTES, NUNCA strings soltas
5. Cards de acomodações gerados de TIPOS_ACOMODACAO, NUNCA hardcodar tipos
6. metadata só em Server Components (sem 'use client')
7. O projeto usa Next.js 16 e React 19
8. CSS usa variáveis do shadcn (hsl(var(--primary)), etc.)
9. Ícones vêm de lucide-react

## ORDEM DE EXECUÇÃO

1. Instalar textarea
2. Criar lib/utils/index.ts
3. Criar lib/constants/ (3 arquivos)
4. Criar components/layout/ (2 arquivos)
5. Criar components/features/ (2 arquivos)
6. Substituir app/layout.tsx
7. Remover app/page.tsx
8. Criar app/(public)/ (6 arquivos)
9. Criar app/not-found.tsx
10. Executar npm run build para verificar
11. Executar npm run dev para testar

## VERIFICAÇÃO FINAL

Após implementar, confirme:
- [ ] / → Landing page com Header, Footer, WhatsApp flutuante
- [ ] /contato → Formulário que abre WhatsApp
- [ ] /day-use → Placeholder com CTA
- [ ] /xyz → Página 404 customizada
- [ ] View Source → <title> com "Pousada Xangrilá"
- [ ] Menu mobile funciona
- [ ] npm run build sem erros
