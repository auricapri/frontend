# Arquitetura do Projeto Auricapri

## Visão Geral

A Auricapri é uma plataforma de e-commerce de luxo com arquitetura distribuída em 3 aplicações principais:

- **`auricapri/`** - Frontend Web (React + Vite + TypeScript)
- **`mobile/`** - Aplicativo Mobile (React Native + TypeScript)
- **`backend/`** - API Backend (Express + TypeScript + Supabase)

## Domínios de Negócio

A plataforma é organizada em domínios de negócio claros, cada um com responsabilidades específicas:

### 1. Products (Produtos)
**Responsabilidade**: Catálogo de produtos, variantes, categorias, coleções, assets e precificação.

**Localização Frontend**:
- Types: `src/types/products/`
- Services: `src/services/pricing.service.ts`, `src/services/stock.service.ts`
- API: `src/api/products.api.ts`
- Components: `src/components/product/`

**Localização Backend**:
- Repository: `src/repositories/products.repository.ts`
- Routes: `src/api/routes/products.routes.ts`

**Entidades Principais**:
- `Product` - Produto principal
- `ProductVariant` - Variantes (tamanho, cor, etc.)
- `Category` - Categorias
- `Collection` - Coleções
- `Asset` - Assets (embalagens, etc.)

### 2. Orders (Pedidos)
**Responsabilidade**: Checkout, criação de pedidos, carrinho de compras, pagamentos e rastreamento.

**Localização Frontend**:
- Types: `src/types/orders/`
- Services: `src/services/order.service.ts`, `src/services/cart.service.ts`
- API: `src/api/orders.api.ts`
- Components: `src/components/checkout/`, `src/components/orders/`

**Localização Backend**:
- Repository: `src/repositories/orders.repository.ts`
- Service: `src/services/order.service.ts`
- Routes: `src/api/routes/orders.routes.ts`

**Entidades Principais**:
- `Order` - Pedido completo
- `OrderItem` - Item do pedido
- `CartItem` - Item do carrinho
- `CartSession` - Sessão do carrinho

### 3. Users (Usuários)
**Responsabilidade**: Autenticação, perfis de usuário, endereços, cartões salvos e programa de fidelidade.

**Localização Frontend**:
- Types: `src/types/users/`
- Services: `src/services/loyalty.service.ts`
- API: `src/api/users.api.ts`, `src/api/auth.api.ts`
- Components: `src/components/auth/`
- Context: `src/context/AuthContext.tsx`

**Localização Backend**:
- Repository: `src/repositories/users.repository.ts`, `src/repositories/auth.repository.ts`
- Service: `src/services/loyalty.service.ts`
- Routes: `src/api/routes/users.routes.ts`, `src/api/routes/auth.routes.ts`

**Entidades Principais**:
- `UserProfile` - Perfil do usuário
- `SavedAddress` - Endereços salvos
- `SavedCard` - Cartões salvos
- `UserLoyaltyData` - Dados de fidelidade
- `LoyaltySettings` - Configurações do programa

### 4. Logistics (Logística)
**Responsabilidade**: Cálculo de frete, cotações, rastreamento de entregas e gestão de fornecedores.

**Localização Frontend**:
- Types: `src/types/orders/logistics.ts`
- Services: `src/services/logistics.service.ts`
- API: `src/api/shipments.api.ts`

**Localização Backend**:
- Repository: `src/repositories/shipments.repository.ts`, `src/repositories/delivery.repository.ts`
- Service: `src/services/logistics.service.ts`, `src/services/delivery.service.ts`
- Routes: `src/api/routes/shipments.routes.ts`

**Entidades Principais**:
- `InternalLogisticsInfo` - Informações internas de logística
- `LogisticsMetadata` - Metadados de logística
- `AddressData` - Dados de endereço (ViaCEP)

### 5. Payments (Pagamentos)
**Responsabilidade**: Cálculo de preços, impostos, taxas de gateway e economia de pedidos.

**Localização Frontend**:
- Types: `src/types/payments/`, `src/types/pricing.types.ts`
- Services: `src/services/pricing.service.ts`, `src/services/tax.service.ts`
- API: `src/api/payments.api.ts`

**Localização Backend**:
- Service: `src/services/pricing.service.ts`, `src/services/tax.service.ts`
- Routes: `src/api/routes/payments.routes.ts`

**Entidades Principais**:
- `PriceBreakdown` - Breakdown de preço
- `CostBreakdown` - Breakdown de custos
- `TaxBreakdown` - Breakdown de impostos
- `OrderEconomics` - Economia do pedido

### 6. Reviews (Avaliações)
**Responsabilidade**: Avaliações de produtos e pedidos, com sistema de cashback.

**Localização Frontend**:
- Types: `src/types/reviews/`
- API: `src/api/product-reviews.api.ts`, `src/api/order-reviews.api.ts`
- Components: `src/components/product/` (componentes de review)

**Localização Backend**:
- Repository: `src/repositories/product-reviews.repository.ts`, `src/repositories/order-reviews.repository.ts`
- Service: `src/services/product-reviews.service.ts`, `src/services/order-reviews.service.ts`
- Routes: `src/api/routes/product-reviews.routes.ts`, `src/api/routes/order-reviews.routes.ts`

**Entidades Principais**:
- `ProductReview` - Avaliação de produto
- `OrderReview` - Avaliação de pedido
- `ProductReviewMedia` - Mídia da avaliação

### 7. Suppliers (Fornecedores)
**Responsabilidade**: Gestão de fornecedores e avaliações de fornecedores.

**Localização Frontend**:
- Types: `src/types/suppliers/`
- API: `src/api/suppliers.api.ts`
- Components: `src/components/admin/AdminSuppliers.tsx`

**Localização Backend**:
- Repository: `src/repositories/suppliers.repository.ts`
- Service: `src/services/suppliers.service.ts`
- Routes: `src/api/routes/suppliers.routes.ts`

**Entidades Principais**:
- `Supplier` - Fornecedor
- `SupplierReview` - Avaliação de fornecedor

### 8. Store (Loja)
**Responsabilidade**: Configurações da loja, banners, cupons e configurações financeiras globais.

**Localização Frontend**:
- Types: `src/types/store/`
- API: `src/api/store.api.ts`, `src/api/banners.api.ts`, `src/api/coupons.api.ts`
- Components: `src/components/admin/AdminDashboard.tsx`

**Localização Backend**:
- Repository: `src/repositories/store.repository.ts`
- Routes: `src/api/routes/store.routes.ts`, `src/api/routes/banners.routes.ts`, `src/api/routes/coupons.routes.ts`

**Entidades Principais**:
- `StoreConfig` - Configuração da loja
- `GlobalFinancialSettings` - Configurações financeiras
- `Banner` - Banners da loja
- `Coupon` - Cupons de desconto

## Fluxo de Dados

### Frontend → Backend → Database

```
Component → Hook → Service → API Client → HTTP → Backend Route → Service → Repository → Supabase
```

**Exemplo: Adicionar produto ao carrinho**

1. **Component**: `ProductCard` chama `onAddToCart`
2. **Hook**: `useCart` recebe a ação
3. **Service**: `CartService` valida estoque
4. **API**: `OrdersApi.createCartItem()` faz requisição HTTP
5. **Backend Route**: `/api/orders/cart` recebe requisição
6. **Backend Service**: `OrderService` processa
7. **Repository**: `OrdersRepository` salva no Supabase
8. **Response**: Dados retornam pela mesma cadeia

### Estado Global (Frontend)

```
AppContext → useStoreData → ProductsApi/StoreApi → Backend
AuthContext → useAuth → AuthApi → Backend
CartContext → useCart → OrdersApi → Backend
```

## Estrutura de Pastas

### Frontend (`auricapri/src/`)

```
src/
├── api/              # Clientes HTTP para backend
│   ├── client.ts     # Cliente base
│   ├── *.api.ts      # APIs por domínio
│   └── repositories/ # Repositories (frontend)
├── components/       # Componentes React
│   ├── admin/        # Componentes administrativos
│   ├── auth/         # Autenticação
│   ├── cart/         # Carrinho
│   ├── checkout/     # Checkout
│   ├── layout/       # Layout (Navbar, Footer)
│   ├── orders/       # Pedidos
│   ├── product/      # Produtos
│   ├── shared/       # Compartilhados
│   └── ui/           # UI primitivos
├── constants/        # Constantes e enums
├── context/          # React Contexts
├── hooks/            # Custom hooks
├── pages/            # Páginas principais
├── router/           # Roteamento
├── services/         # Lógica de negócio
├── types/            # Tipos TypeScript (organizados por domínio)
│   ├── common/       # Tipos comuns
│   ├── products/     # Tipos de produtos
│   ├── orders/       # Tipos de pedidos
│   ├── users/        # Tipos de usuários
│   ├── payments/     # Tipos de pagamentos
│   ├── reviews/      # Tipos de avaliações
│   ├── suppliers/    # Tipos de fornecedores
│   ├── store/        # Tipos de loja
│   └── dream/        # Tipos do Dream Board
└── utils/            # Utilitários
```

### Backend (`backend/src/`)

```
src/
├── api/
│   ├── middleware/   # Middlewares (auth, etc.)
│   └── routes/       # Rotas por domínio
├── config/           # Configurações
├── repositories/      # Acesso a dados (Supabase)
├── services/         # Lógica de negócio
├── templates/        # Templates (HTML, PDF)
└── types/            # Tipos específicos do backend
```

## Convenções de Código

### Nomenclatura

- **Types/Interfaces**: PascalCase (`Product`, `UserProfile`)
- **Services**: PascalCase com sufixo `Service` (`PricingService`, `OrderService`)
- **APIs**: PascalCase com sufixo `Api` (`ProductsApi`, `OrdersApi`)
- **Repositories**: PascalCase com sufixo `Repository` (`ProductsRepository`)
- **Components**: PascalCase (`ProductCard`, `CheckoutView`)
- **Hooks**: camelCase com prefixo `use` (`useCart`, `useAuth`)
- **Utils**: camelCase (`formatCurrency`, `calculatePrice`)

### Organização de Tipos

Tipos são organizados por domínio de negócio em subpastas:

- `types/products/` - Tudo relacionado a produtos
- `types/orders/` - Tudo relacionado a pedidos
- `types/users/` - Tudo relacionado a usuários
- etc.

O `types/index.ts` principal re-exporta tudo para manter compatibilidade.

### Padrões de Serviço

Serviços são classes com métodos async que encapsulam lógica de negócio:

```typescript
export class PricingService {
  async calculateSuggestedPrice(input: VariantPricingInput): Promise<PriceBreakdown> {
    // Lógica de negócio
  }
}
```

### Padrões de API

APIs são classes que fazem requisições HTTP para o backend:

```typescript
export class ProductsApi {
  async getAllActive(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products');
  }
}
```

### Padrões de Repository (Backend)

Repositories acessam diretamente o Supabase:

```typescript
export class ProductsRepository {
  async getAllActive(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  }
}
```

## Dependências Principais

### Frontend
- React 19.0.0
- TypeScript 5.8.2
- Vite 6.2.0
- Supabase Client 2.39.0

### Backend
- Express 4.18.2
- TypeScript 5.3.3
- Supabase Client 2.39.0
- Winston (logging)

### Mobile
- React Native 0.75.4
- React Navigation 6.x
- Firebase (notificações)

## Autenticação

- **Frontend/Mobile**: Supabase Auth (client-side)
- **Backend**: JWT tokens via Supabase
- **Middleware**: `authenticate`, `requireAdmin`, `optionalAuth`

## Banco de Dados

- **Provider**: Supabase (PostgreSQL)
- **ORM**: Não utilizado - acesso direto via Supabase Client
- **Migrations**: SQL files em `backend/migrations/`

## Performance, Cache e Observabilidade

### Observabilidade (Backend)

- **Request ID**: todas as respostas incluem `x-request-id` e os logs incluem `requestId`.
- **Slow requests**: requisições acima de `SLOW_REQUEST_MS` (default 300ms) são registradas como `Slow request`.
- **Métricas**: endpoint `GET /metrics` expõe métricas no formato Prometheus (inclui latência e volume por rota/status e métricas de processo).

### Cache (Backend)

- **Produtos (listagem)**: `GET /api/products` e `GET /api/products/all` usam cache Redis com TTL curto e invalidação em operações administrativas.
- **Integrações externas**:
  - Geocoding/Directions (Mapbox): cache Redis por endereço/rota.
  - ViaCEP: cache Redis por CEP (TTL 24h).

### Variáveis de ambiente (Backend)

- `MAPBOX_TOKEN`: obrigatório para geocoding/directions.
- `SLOW_REQUEST_MS`: limiar para logar requisições lentas (default 300).
- `LOG_TO_FILES`: se `true`, habilita logs em arquivo fora do ambiente local.

### Escalabilidade Horizontal (Backend)

- **Stateless**: rotas não dependem de filesystem local para operação.
- **Scheduler**: tarefas periódicas usam lock distribuído no Redis para evitar execução duplicada em múltiplas instâncias.
- **Logs**: em produção, logs em arquivo são desabilitados por padrão (ativáveis via `LOG_TO_FILES`).

### Otimizações de Banco

- Índices e cache de frete foram consolidados em migration: `backend/migrations/optimize_performance_indexes.sql`.

### Métricas Antes/Depois (baseline local)

- **Endpoint**: `GET /api/products` com `autocannon -c 20 -d 10`
  - Antes: Avg 240.74ms, Req/Sec ~39.1, Bytes/Sec ~4.48MB
  - Depois (cache aquecido): Avg 230.08ms, Req/Sec ~85.9, Bytes/Sec ~9.83MB

## Internacionalização

- **Sistema**: i18n customizado
- **Idiomas**: PT (padrão), EN, ES, FR
- **Tipos**: `LocalizedText` para campos multilíngue
- **Arquivo**: `src/i18n.ts`

## Estado da Aplicação

### Frontend

- **Global State**: React Context API
  - `AppContext` - Dados da loja (produtos, categorias, etc.)
  - `AuthContext` - Autenticação
  - `CartContext` - Carrinho
- **Local State**: React Hooks (`useState`, `useEffect`)
- **Server State**: Hooks customizados (`useStoreData`, `useCart`, `useAuth`)

## Testes

- **Frontend**: Playwright (E2E)
- **Backend**: scripts de validação (`scripts/validate-backend.sh`)
- **Mobile**: lint via `scripts/validate-mobile.sh` (typecheck opcional via `MOBILE_TYPECHECK=1`)

## Deploy

- **Frontend**: Vercel (via `vercel.json`)
- **Backend**: (A definir)
- **Mobile**: App Stores (iOS/Android)
