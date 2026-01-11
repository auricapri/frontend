# API Clients

Este diretório contém os clientes HTTP para comunicação com o backend.

## Estrutura

```
api/
├── client.ts              # Cliente HTTP base
├── cached-client.ts       # Cliente com cache
├── *.api.ts               # APIs por domínio
└── repositories/          # Repositories (frontend)
```

## Cliente Base

O `apiClient` é o cliente HTTP base que gerencia:

- Autenticação via JWT (Supabase)
- Headers HTTP
- Tratamento de erros
- Download de arquivos

```typescript
import { apiClient } from './client';

const data = await apiClient.get<Product[]>('/products');
const created = await apiClient.post<Product>('/products', productData);
```

## APIs Disponíveis

### ProductsApi

Gerencia produtos e variantes:

```typescript
import { ProductsApi } from './products.api';

const api = new ProductsApi();
const products = await api.getAllActive();
const product = await api.getBySlug('product-slug');
```

### OrdersApi

Gerencia pedidos e carrinho:

```typescript
import { OrdersApi } from './orders.api';

const api = new OrdersApi();
const order = await api.createOrder(orderData);
const orders = await api.getUserOrders(userId);
```

### UsersApi

Gerencia usuários e perfis:

```typescript
import { UsersApi } from './users.api';

const api = new UsersApi();
const profile = await api.getProfile(userId);
await api.updateProfile(userId, updates);
```

### AuthApi

Gerencia autenticação:

```typescript
import { AuthApi } from './auth.api';

const api = new AuthApi();
await api.signIn(email, password);
await api.signOut();
```

### StoreApi

Gerencia configurações da loja:

```typescript
import { StoreApi } from './store.api';

const api = new StoreApi();
const config = await api.getConfig();
```

### Outras APIs

- `CollectionsApi` - Coleções
- `CouponsApi` - Cupons
- `AssetsApi` - Assets
- `WishlistApi` - Lista de desejos
- `BannersApi` - Banners
- `GuidesApi` - Guias
- `ShipmentsApi` - Envios
- `PaymentsApi` - Pagamentos
- `ReturnsApi` - Devoluções
- `NotificationsApi` - Notificações
- `ProductReviewsApi` - Avaliações de produtos
- `OrderReviewsApi` - Avaliações de pedidos
- `SuppliersApi` - Fornecedores

## Cliente com Cache

O `cachedClient` estende o cliente base com cache:

```typescript
import { cachedClient } from './cached-client';

// Usa cache automático
const products = await cachedClient.get<Product[]>('/products');
```

## Repositories

Repositories no frontend são wrappers simples que usam as APIs:

```typescript
import { OrdersRepository } from './repositories/orders.repository';

const repo = new OrdersRepository();
const order = await repo.create(orderData);
```

## Tratamento de Erros

Todas as APIs lançam erros que devem ser tratados:

```typescript
try {
  const product = await productsApi.getById(id);
} catch (error) {
  console.error('Erro ao buscar produto:', error.message);
}
```

## Autenticação

A autenticação é automática via token do Supabase. O cliente busca o token da sessão atual.

## Convenções

- **Classes**: PascalCase com sufixo `Api` (`ProductsApi`, `OrdersApi`)
- **Métodos**: camelCase (`getAllActive`, `getById`)
- **Retornos**: Promises tipadas (`Promise<Product[]>`, `Promise<Order>`)
