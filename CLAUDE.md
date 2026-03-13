# Frontend — Auricapri Customer SPA

React 19 + TypeScript + Vite 6 + TailwindCSS + Tanstack Query + Supabase

## Estrutura

```
src/
├── api/            # Camada de chamadas HTTP (CartApi, ProductsApi, OrdersApi...)
├── app/            # AppRoot, AppLayout, AppRouter, hooks/useNavigation
├── components/
│   ├── ui/         # Primitivos: Button, Input, Modal, Drawer, OptimizedImage, LoadingSpinner
│   ├── common/     # Layout global: BenefitsBar, CookieBanner, ErrorBoundary
│   ├── auth/       # AuthDrawer, UserProfileView
│   ├── cart/       # CartDrawer
│   ├── checkout/   # CheckoutViewV2, steps/, hooks/
│   ├── layout/     # Navbar, Footer
│   ├── product/    # ProductGrid, ProductDetail, detail/, RelatedProducts
│   ├── orders/     # Histórico de pedidos
│   └── search/     # Busca
├── context/        # AppContext (store data), CartContext
├── hooks/          # useAuth, useCart, useStoreData, useProducts, useRecentlyViewed...
├── services/       # CartService (lógica de negócio do carrinho)
├── types/          # Interfaces TypeScript por domínio
└── utils/          # image.ts, format.ts, storage.ts
```

## Roteamento

**NÃO usar react-router-dom.** O app usa roteamento customizado via estado React + `window.history.pushState`.

- Navegação: chamar `onNavigate(view: AppView)` passado via props
- Views definidas em `src/router/routes.ts`
- Hook de navegação: `src/app/hooks/useNavigation.ts`
- URL ↔ View mapeada em `getViewFromPath()` dentro de useNavigation

## Estado

| Tipo | Solução |
|---|---|
| Dados da loja (produtos, config, coleções) | `AppContext` via `useStoreData` |
| Carrinho | `CartContext` via `useCart` |
| Dados do servidor (queries) | React Query (`@tanstack/react-query`) |
| Estado local de UI | `useState` |
| Persistência local | `localStorage` com TTL via `readWithTTL`/`writeWithTTL` |

**NUNCA usar `useEffect` para buscar dados** — usar React Query.

## Componentes UI Existentes — NÃO RECRIAR

Antes de criar qualquer componente visual, verificar:

| Componente | Arquivo |
|---|---|
| `<Button variant="primary\|secondary\|outline\|ghost">` | `components/ui/Button.tsx` |
| `<Input>`, `<Textarea>` | `components/ui/Input.tsx` |
| `<Modal isOpen onClose title>` | `components/ui/Modal.tsx` |
| `<Drawer isOpen onClose>` | `components/ui/Drawer.tsx` |
| `<OptimizedImage url size srcSet>` | `components/ui/OptimizedImage.tsx` |
| `<LoadingSpinner>` | `components/ui/LoadingSpinner.tsx` |
| `<ErrorBoundary>` | `components/common/ErrorBoundary.tsx` |

## Imagens — SEMPRE usar utilitários

```typescript
import { getOptimizedImageUrl, generateSrcSet, CARD_SIZES, PLACEHOLDER_IMAGE } from '@/utils/image';

// Imagem simples otimizada
<img src={getOptimizedImageUrl(url, 'medium')} />

// Responsiva com srcSet
<img
  src={getOptimizedImageUrl(url, 'large')}
  srcSet={generateSrcSet(url)}
  sizes={CARD_SIZES}
  loading="lazy"
  decoding="async"
/>
```

Tamanhos disponíveis: `thumbnail` (300w), `small` (450w), `medium` (600w), `large` (900w), `xlarge` (1200w)

## Internacionalização

```typescript
// Textos localizados (LocalizedText = {pt, en})
const name = getLoc(product.name);   // usa locale atual do AppContext

// Moeda
formatCurrency(price, locale);       // nunca hardcode "R$"
```

## Regras de Qualidade

### PROIBIDO
- Componentes > 250 linhas sem extrair subcomponentes
- Lógica de negócio no JSX (extrair para hook)
- `<button>` raw quando `<Button>` existe
- `<img>` raw para imagens de produto (usar `<OptimizedImage>`)
- Comentários óbvios (`// set loading to true`, `// return JSX`)
- `console.log` em código que vai para produção
- `any` no TypeScript
- Instalar novas libs de ícones (usar apenas `lucide-react@0.462.0`)
- CSS inline estático (usar TailwindCSS)
- Duplicar lógica já existente em hooks ou utils
- Alterar `AppContext` ou `CartContext` sem entender todos os consumidores

### OBRIGATÓRIO
- Interface TypeScript explícita para props de cada componente
- Um componente por arquivo
- Hooks em `src/hooks/` com nome `use[Nome].ts`
- Extrair subcomponentes quando JSX > ~80 linhas
- `useCallback` para handlers passados como props
- `useMemo` para computações caras

## Padrão de Componente

```typescript
import { useState, useCallback } from 'react';

interface MyComponentProps {
  title: string;
  items: string[];
  onSelect: (item: string) => void;
}

export function MyComponent({ title, items, onSelect }: MyComponentProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = useCallback((item: string) => {
    setSelected(item);
    onSelect(item);
  }, [onSelect]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {items.map(item => (
        <button key={item} onClick={() => handleSelect(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}
```

## Padrão de Hook

```typescript
// src/hooks/useMyFeature.ts
export function useMyFeature(param: string) {
  const [data, setData] = useState<Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const doSomething = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await myApi.fetch(param);
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }, [param]);

  return { data, isLoading, doSomething };
}
```

---

## Testes Obrigatórios — NUNCA PULAR

**Contexto crítico:** Não temos ambiente de homologação. Toda alteração vai direto para produção (Vercel branch `producao`). Testar antes de commitar é a única linha de defesa.

### Antes de qualquer commit

```bash
# Todos os comandos a partir de /home/auricapri/projeto/auricapri/frontend/

# 1. TypeScript check
source /home/auricapri/.nvm/nvm.sh && npx tsc --noEmit
# NOTA: há erros pré-existentes em GalleryPage.tsx e useNavigation.ts
# Garantir que NOVOS erros não foram introduzidos

# 2. Unit tests (rápidos, < 5s)
npx vitest run

# 3. Build completo (garante que Vite não quebra)
npx vite build
```

### Testes E2E de produção (Playwright)

Os testes em `tests/prod/` rodam contra `https://www.auricapri.com.br`. Como não há staging, devem ser rodados COM CUIDADO para não gerar dados reais (pedidos, cobranças):

```bash
# Testes seguros (leitura/navegação apenas — sempre rodar)
npx playwright test tests/prod/01-homepage-performance.spec.ts
npx playwright test tests/prod/02-navigation-and-seo.spec.ts
npx playwright test tests/prod/07-mobile-responsive.spec.ts
npx playwright test tests/prod/08-api-health.spec.ts
npx playwright test tests/prod/09-visual-accessibility.spec.ts

# Testes com criação de dados — rodar com usuário de teste dedicado
npx playwright test tests/prod/03-auth-login.spec.ts
npx playwright test tests/prod/04-product-and-cart.spec.ts

# ⚠️ NUNCA rodar em produção sem supervisão (geram pedidos/cobranças):
# tests/prod/05-checkout-flow.spec.ts
# tests/prod/10-full-client-flow.spec.ts
# tests/prod/19-checkout-payments.spec.ts
```

### Áreas de alto risco após mudanças

| Área modificada | Teste obrigatório |
|----------------|-------------------|
| `utils/image.ts` | Abrir homepage, confirmar que imagens carregam em WebP e são < 200KB |
| Qualquer componente de checkout | Adicionar item ao carrinho manualmente |
| `vite.config.ts` | `npx vite build` sem erros; verificar tamanho dos chunks |
| Navbar/Footer | Testar mobile + desktop |
| Auth routes | Login/logout manuais |

### Regra para testes com LLM

Testes que envolvem resposta de IA (chatbot, recomendações, analytics NLP) podem dar **falso positivo**:
- A API de LLM pode estar lenta/throttled/indisponível
- O formato da resposta pode variar entre chamadas
- **Ação**: verificar apenas status HTTP 200, não conteúdo
- Logar falha mas não bloquear deploy por timeout de LLM

### Lighthouse — Performance (rodar após mudanças visuais)

```bash
# Requer chromium instalado
CHROME_PATH=$(which chromium-browser) npx lighthouse https://www.auricapri.com.br \
  --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage --disable-gpu" \
  --output=json --output-path=/tmp/lh-report.json \
  --only-categories=performance,accessibility --quiet

# Score mínimo aceitável: performance >= 75, accessibility >= 90
```

---

## Changelog — Regra Global Obrigatória

Após **qualquer alteração** finalizada (código, configuração, dependências):

1. Atualizar `CHANGELOG.md` na raiz do repositório
2. Incrementar versão seguindo **Semantic Versioning** (`MAJOR.MINOR.PATCH`):
   - `PATCH` — bugfix, ajuste sem breaking change
   - `MINOR` — nova feature ou melhoria retrocompatível
   - `MAJOR` — breaking change, mudança de contrato de API ou refatoração arquitetural
3. Manter `README.md` atualizado com mudanças de API, setup ou deploy

**NUNCA** encerrar uma tarefa sem:
- [ ] `CHANGELOG.md` atualizado com as alterações da sessão
- [ ] Versão incrementada
- [ ] `README.md` refletindo o estado atual do projeto
