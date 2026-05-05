# INSTRUÇÕES PARA CLAUDE CODE — FASE 11: MODO MANUTENÇÃO

## CONTEXTO

Você está trabalhando no projeto `xangrila_web`, sistema web da Pousada Xangrilá de Morros (Maranhão), em produção em https://pousadaxangrilademorros.com.br.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, Supabase, Vercel.

**Objetivo desta fase:** Implementar um modo de manutenção que pode ser ativado/desativado via variável de ambiente na Vercel (`MAINTENANCE_MODE=true/false`), sem alteração de código. Quando ativo, todos os visitantes são redirecionados para uma página de manutenção estilizada.

---

## REGRAS CRÍTICAS — NUNCA VIOLAR

- **NÃO** usar `@supabase/auth-helpers-nextjs` — usar `@supabase/ssr`
- **NÃO** usar `toast` do Shadcn — usar `sonner`
- **NÃO** usar Zod v3 — usar Zod v4
- **NÃO** sobrescrever a lógica de autenticação existente no `middleware.ts` — apenas ADICIONAR o bloco de manutenção no início da função

---

## TAREFAS A EXECUTAR

### TAREFA 1 — Modificar `middleware.ts` (raiz do projeto)

**ATENÇÃO:** O `middleware.ts` já existe e contém lógica de autenticação do Supabase. **NÃO substituir o arquivo inteiro.** Apenas adicionar o bloco de modo manutenção no **início** da função `middleware`, antes de qualquer outro código.

Encontre a função `middleware` no arquivo existente e insira o seguinte bloco **como primeira coisa dentro da função**, antes de qualquer outra lógica:

```typescript
// ================================================================
// MODO MANUTENÇÃO
// Ativar: definir MAINTENANCE_MODE=true nas env vars da Vercel
// Desativar: remover a variável ou definir MAINTENANCE_MODE=false
// ================================================================
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

const ROTAS_PERMITIDAS_MANUTENCAO = [
  '/manutencao',   // a própria página de manutenção
  '/_next',        // assets estáticos do Next.js
  '/favicon.ico',  // favicon
  '/images',       // imagens públicas
  '/fonts',        // fontes
];

if (MAINTENANCE_MODE) {
  const { pathname } = request.nextUrl;
  const isPermitida = ROTAS_PERMITIDAS_MANUTENCAO.some((rota) =>
    pathname.startsWith(rota)
  );
  if (!isPermitida) {
    const url = request.nextUrl.clone();
    url.pathname = '/manutencao';
    return NextResponse.rewrite(url);
  }
}
// ================================================================
// FIM MODO MANUTENÇÃO
// ================================================================
```

**Resultado esperado:** O middleware continua funcionando normalmente para autenticação Supabase quando `MAINTENANCE_MODE` for `false` ou não definido. Quando `true`, bloqueia tudo exceto as rotas permitidas.

---

### TAREFA 2 — Criar `app/manutencao/page.tsx`

Crie o arquivo com o caminho exato: `app/manutencao/page.tsx`

Este arquivo **não** usa o layout padrão da aplicação (não tem header/footer). É uma página standalone completa.

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Em Manutenção | Pousada Xangrilá',
  description: 'Estamos realizando melhorias. Voltamos em breve!',
  robots: { index: false, follow: false },
};

export default function ManutencaoPage() {
  return (
    <html lang="pt-BR">
      <head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Lato', sans-serif;
            background-color: #0d1f1a;
            color: #f5f0e8;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image:
              radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180, 140, 60, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(34, 85, 60, 0.25) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }

          .container {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 2rem;
            max-width: 560px;
            animation: fadeIn 1s ease both;
          }

          .icone-wrapper {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            background: rgba(180, 140, 60, 0.12);
            border: 1px solid rgba(180, 140, 60, 0.35);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulso 3s ease-in-out infinite;
          }

          .icone-wrapper svg {
            width: 36px;
            height: 36px;
            color: #c9a84c;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .linha-decorativa {
            width: 48px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #c9a84c, transparent);
            margin: 1.5rem auto;
          }

          .nome-pousada {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(1.1rem, 3vw, 1.3rem);
            font-weight: 400;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #c9a84c;
            margin-bottom: 1.5rem;
          }

          h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(2rem, 6vw, 2.8rem);
            font-weight: 700;
            line-height: 1.2;
            color: #f5f0e8;
            margin-bottom: 1rem;
          }

          .subtitulo {
            font-size: clamp(0.95rem, 2.5vw, 1.05rem);
            font-weight: 300;
            color: rgba(245, 240, 232, 0.65);
            line-height: 1.7;
            margin-bottom: 2.5rem;
          }

          .card-contato {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(201, 168, 76, 0.2);
            border-radius: 12px;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
          }

          .card-contato p {
            font-size: 0.85rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(245, 240, 232, 0.45);
            margin-bottom: 0.75rem;
          }

          .contato-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #c9a84c;
            text-decoration: none;
            font-size: 1rem;
            font-weight: 400;
            transition: opacity 0.2s;
          }

          .contato-link:hover { opacity: 0.75; }

          .contato-link svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .rodape {
            font-size: 0.78rem;
            color: rgba(245, 240, 232, 0.25);
            letter-spacing: 0.05em;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulso {
            0%, 100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.15); }
            50%       { box-shadow: 0 0 0 12px rgba(201, 168, 76, 0); }
          }
        `}</style>
      </head>
      <body>
        <div className="container">

          <div className="icone-wrapper">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>

          <p className="nome-pousada">Pousada Xangrilá</p>

          <h1>Voltamos<br />em breve</h1>

          <div className="linha-decorativa" />

          <p className="subtitulo">
            Estamos realizando melhorias para oferecer<br />
            uma experiência ainda melhor para você.<br />
            Agradecemos sua compreensão.
          </p>

          <div className="card-contato">
            <p>Para reservas ou informações</p>
            <a
              href="https://wa.me/5598981672949"
              className="contato-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              (98) 98167-2949
            </a>
          </div>

          <p className="rodape">Morros, Maranhão — Brasil</p>

        </div>
      </body>
    </html>
  );
}
```

---

### TAREFA 3 — Atualizar `CLAUDE.md`

No arquivo `CLAUDE.md`, faça as seguintes alterações:

**3.1 — Atualizar o cabeçalho (primeira linha do arquivo):**

Substituir:
```
Sistema web para gerenciamento da Pousada Xangrilá (Morros, São Luís - MA), desenvolvido com Next.js, TypeScript, Tailwind CSS, Shadcn/ui e Supabase. Fases 1 a 10.2 concluídas.
```

Por:
```
Sistema web para gerenciamento da Pousada Xangrilá (Morros, São Luís - MA), desenvolvido com Next.js, TypeScript, Tailwind CSS, Shadcn/ui e Supabase. Fases 1 a 11 concluídas.
```

**3.2 — Remover `middleware.ts` da lista de Arquivos Protegidos:**

Na seção `## Arquivos Protegidos — NÃO Alterar`, remover a linha:
```
middleware.ts
```

Substituir por:
```
middleware.ts  ← ATENÇÃO: pode ser modificado apenas para adicionar/remover o bloco MODO MANUTENÇÃO no início da função middleware
```

**3.3 — Adicionar Fase 11 na tabela de Status das Fases:**

Na tabela de status, após a linha da Fase 10.2, adicionar:
```
| 11 | Modo Manutenção (on/off via env var MAINTENANCE_MODE) | ✅ Concluída |
```

**3.4 — Adicionar nova entrada nas Correções já aplicadas:**

Na seção `## Correções já aplicadas — NÃO reverter`, adicionar o item 14:
```
14. **Modo Manutenção (Fase 11)** — `middleware.ts` contém bloco de manutenção no início da função `middleware`. Quando `MAINTENANCE_MODE=true` (env var Vercel), todas as rotas são reescritas para `/manutencao`. A página `app/manutencao/page.tsx` é standalone (sem layout raiz). Para ativar: definir `MAINTENANCE_MODE=true` no painel Vercel e fazer redeploy. Para desativar: remover a variável ou setar `false` e redeploy.
```

**3.5 — Adicionar `MAINTENANCE_MODE` na seção de variáveis de ambiente `.env.local`:**

Na seção que mostra o `.env.local` de exemplo, adicionar após `NODE_ENV=development`:
```
# Modo Manutenção (Fase 11)
MAINTENANCE_MODE=false
```

---

### TAREFA 4 — Atualizar `acompanhamento.txt`

Ao final do arquivo `acompanhamento.txt`, adicionar o seguinte bloco:

```
---

## ✅ CHECKLIST DA FASE 11 — Modo Manutenção

Início: 2026-05-04 | Conclusão: 2026-05-04 | Duração: 1 dia

### Objetivo
Permitir "desligar" o site publicamente sem excluir o projeto na Vercel.
Ativado via variável de ambiente `MAINTENANCE_MODE=true`, sem alteração de código.
Exibe página estilizada com nome da pousada, mensagem e contato WhatsApp.

### Arquivos modificados
[x] middleware.ts — bloco de manutenção adicionado no início da função middleware

### Arquivos criados
[x] app/manutencao/page.tsx — página standalone (sem layout raiz), estilo dark/dourado

### Como ATIVAR o modo manutenção
1. Acessar painel Vercel → Settings → Environment Variables
2. Adicionar: MAINTENANCE_MODE = true (apenas Production)
3. Ir em Deployments → "..." no último deploy → Redeploy
4. Site exibirá a página de manutenção para todos os visitantes

### Como DESATIVAR o modo manutenção
1. Acessar painel Vercel → Settings → Environment Variables
2. Remover ou alterar MAINTENANCE_MODE para false
3. Redeploy

### Build
[x] npm run build — verificar zero erros TypeScript após modificações

---

| **11** | **Modo Manutenção (MAINTENANCE_MODE env var)**         | 2026-05-04   | 2026-05-04   | 1    | ✅     | 9                       |
| 11.1   |   middleware.ts: bloco manutenção no início da função  | 2026-05-04   | 2026-05-04   | 1    | ✅     | —                       |
| 11.2   |   app/manutencao/page.tsx: página standalone           | 2026-05-04   | 2026-05-04   | 1    | ✅     | 11.1                    |
| 11.3   |   CLAUDE.md e acompanhamento.txt atualizados           | 2026-05-04   | 2026-05-04   | 1    | ✅     | —                       |
| 11.4   |   npm run build — zero erros                          | 2026-05-04   | 2026-05-04   | 1    | ✅     | 11.1, 11.2              |

Total de fases concluídas: 11
Período de desenvolvimento: 2026-03-25 a 2026-05-04 (40 dias corridos)
Legenda: ✅ Concluído | 🚧 Em andamento | ⬜ Pendente (ação manual)
```

---

## CHECKLIST DE VERIFICAÇÃO APÓS IMPLEMENTAÇÃO

Execute cada passo na ordem:

```
[ ] 1. middleware.ts modificado — bloco MODO MANUTENÇÃO adicionado no início da função
[ ] 2. app/manutencao/page.tsx criado
[ ] 3. CLAUDE.md atualizado (4 pontos: cabeçalho, protegidos, tabela, correções, env vars)
[ ] 4. acompanhamento.txt atualizado (checklist + tabela de tarefas)
[ ] 5. npm run build — zero erros TypeScript
[ ] 6. Teste local: adicionar MAINTENANCE_MODE=true no .env.local → npm run dev → acessar qualquer rota → deve exibir /manutencao
[ ] 7. Teste local: remover MAINTENANCE_MODE ou setar false → site funciona normalmente
[ ] 8. git add -A && git commit -m "feat(fase11): modo manutenção via env var MAINTENANCE_MODE"
[ ] 9. git push → aguardar deploy automático na Vercel
```

---

## NOTAS TÉCNICAS IMPORTANTES

- A página `/manutencao` exporta `<html>` e `<body>` diretamente porque é **standalone** — o Next.js App Router permite isso quando o componente retorna `<html>`. Isso evita que o layout raiz (`app/layout.tsx`) sobrescreva os estilos.
- O middleware usa `NextResponse.rewrite()` (não `redirect()`) para que a URL no navegador **não mude** — o visitante vê a URL que digitou, mas recebe o conteúdo de `/manutencao`. Isso é intencional.
- Rotas como `/_next/static`, `/_next/image` e `favicon.ico` são excluídas do bloqueio para que os assets da própria página de manutenção carreguem corretamente.
- A variável `MAINTENANCE_MODE` **não precisa** de prefixo `NEXT_PUBLIC_` — ela é lida apenas server-side no middleware.
