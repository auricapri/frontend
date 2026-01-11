# Components

Este diretório contém todos os componentes React da aplicação, organizados por funcionalidade.

## Estrutura

```
components/
├── admin/          # Componentes administrativos
├── auth/           # Autenticação
├── cart/           # Carrinho de compras
├── checkout/       # Checkout
├── layout/         # Layout (Navbar, Footer)
├── orders/         # Pedidos
├── product/        # Produtos
├── shared/         # Componentes compartilhados
└── ui/             # Componentes UI primitivos
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

Cada subpasta tem um `index.ts` que exporta os componentes:

```typescript
// components/product/index.ts
export { ProductCard } from './ProductCard';
export { ProductGrid } from './ProductGrid';
```

Isso permite imports limpos:

```typescript
import { ProductCard, ProductGrid } from '../components/product';
```

## Adicionando Novos Componentes

1. Crie o arquivo na pasta apropriada
2. Use TypeScript com props tipadas
3. Exporte no `index.ts` da pasta
4. Siga os padrões de nomenclatura
5. Documente props complexas
