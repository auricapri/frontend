# Components

Este diretório contém todos os componentes React da aplicação, organizados por funcionalidade.

## Estrutura

```
components/
├── admin/          # Painel administrativo (lazy loaded)
├── auth/           # Autenticacao e perfil do usuario
├── cart/           # Carrinho e desconto progressivo
├── chat/           # Chat IA e cards de produto
├── checkout/       # Checkout multistep
├── common/         # CookieBanner, TermsConsentModal
├── layout/         # Navbar, Footer
├── orders/         # Pedidos e avaliacoes
├── product/        # Catalogo de produtos
├── returns/        # Devolucoes self-service
├── seo/            # SEOHead e JSON-LD schemas
├── shared/         # Hero, LoyaltyBanner
└── ui/             # OptimizedImage, Input, Toast, Modal
```

## Organização por Funcionalidade

### Admin (`admin/`)

Componentes do painel administrativo:

- `AdminDashboard` - Dashboard principal
- `AdminProducts` - Gestão de produtos
- `AdminOrders` - Gestão de pedidos
- `AdminUsers` - Gestão de usuários
- `AdminInventory` - Gestão de estoque
- `AdminSuppliers` - Gestão de fornecedores
- `AdminDreamBoard` - Dream Board
- E outros...

### Auth (`auth/`)

Componentes de autenticação:

- `AuthDrawer` - Drawer de autenticação
- `OAuthWebView` - WebView para OAuth
- `UserProfileView` - Visualização de perfil

### Cart (`cart/`)

Componentes do carrinho:

- `CartDrawer` - Drawer do carrinho
- `CartItem` - Item do carrinho
- `CartSummary` - Resumo do carrinho

### Checkout (`checkout/`)

Componentes do checkout:

- `CheckoutView` - View principal do checkout
- `OrderSummary` - Resumo do pedido
- `PaymentForm` - Formulário de pagamento
- `AddressForm` - Formulário de endereço

### Layout (`layout/`)

Componentes de layout:

- `Navbar` - Barra de navegação
- `Footer` - Rodapé

### Orders (`orders/`)

Componentes de pedidos:

- `OrderList` - Lista de pedidos
- `OrderCard` - Card de pedido
- `OrderDetails` - Detalhes do pedido
- `OrderTracking` - Rastreamento

### Product (`product/`)

Componentes de produtos:

- `ProductCard` - Card de produto
- `ProductGrid` - Grid de produtos
- `ProductDetail` - Detalhes do produto
- `CollectionDetail` - Detalhes de coleção

### Shared (`shared/`)

Componentes compartilhados:

- `Hero` - Hero section
- Componentes reutilizáveis entre páginas

### UI (`ui/`)

Componentes UI primitivos:

- `Toast` - Notificações toast
- `Modal` - Modal genérico
- `Button` - Botão
- `Input` - Input
- Outros componentes base

### Chat (`chat/`)

Componentes do chat com IA:

- `ChatDrawer` - Drawer do assistente virtual (lazy loaded)
- `ChatProductCard` - Card de produto recomendado pelo chat

### Common (`common/`)

Componentes comuns a toda aplicacao:

- `CookieBanner` - Banner de consentimento de cookies (LGPD)
- `TermsConsentModal` - Modal de termos de uso

### Returns (`returns/`)

Componentes de devolucoes self-service:

- `ReturnRequestForm` - Formulario de solicitacao de devolucao
- `MyReturnsView` - Lista de devolucoes do usuario

### SEO (`seo/`)

Componentes de otimizacao para motores de busca:

- `SEOHead` - Meta tags dinamicas via React Helmet (title, description, OG, canonical, hreflang, JSON-LD)
- `schemas.ts` - Schemas JSON-LD (Organization, WebSite, Product, BreadcrumbList, CollectionPage, FAQPage)

## Padrões

### Estrutura de Componente

```typescript
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  // Component logic
  return (
    // JSX
  );
};
```

### Props

- Use interfaces TypeScript para props
- Props obrigatórias sem `?`
- Props opcionais com `?`
- Documente props complexas

### Hooks

Componentes podem usar hooks customizados:

```typescript
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
```

### Context

Componentes podem acessar contextos:

```typescript
import { useAppContext } from '../context/AppContext';
import { useCartContext } from '../context/CartContext';
```

## Convenções

- **Nomes**: PascalCase (`ProductCard`, `CheckoutView`)
- **Arquivos**: PascalCase (`ProductCard.tsx`)
- **Props**: Interfaces com sufixo `Props` (`ProductCardProps`)
- **Export**: Named exports (`export const ProductCard`)
- **Imports**: Organizados (React, tipos, hooks, utils)

## Exports

**IMPORTANTE**: Componentes lazy-loaded NAO devem ser exportados em barrel exports (`index.ts`).
Ver [LAZY_LOADING_RULES.md](../../LAZY_LOADING_RULES.md) para regras detalhadas.

Componentes pequenos e sempre usados podem usar barrel exports:

```typescript
// components/ui/index.ts — OK (componentes pequenos)
export { OptimizedImage } from './OptimizedImage';
export { Toast } from './Toast';
```

Componentes lazy-loaded devem usar import direto:

```typescript
// CORRETO — import direto
const CartDrawer = React.lazy(() => import('./cart/CartDrawer'));
const ChatDrawer = React.lazy(() => import('./chat/ChatDrawer'));
```

## Adicionando Novos Componentes

1. Crie o arquivo na pasta apropriada
2. Use TypeScript com props tipadas
3. Exporte no `index.ts` da pasta
4. Siga os padrões de nomenclatura
5. Documente props complexas
