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
