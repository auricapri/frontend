# Tipos TypeScript

Este diretório contém todas as definições de tipos TypeScript do projeto, organizadas por domínio de negócio.

## Estrutura

Os tipos estão organizados em subpastas por domínio:

```
types/
├── common/          # Tipos comuns compartilhados
├── products/        # Tipos relacionados a produtos
├── orders/          # Tipos relacionados a pedidos
├── users/           # Tipos relacionados a usuários
├── payments/        # Tipos relacionados a pagamentos
├── reviews/         # Tipos relacionados a avaliações
├── suppliers/       # Tipos relacionados a fornecedores
├── store/           # Tipos relacionados à loja
├── dream/           # Tipos do Dream Board
└── pricing.types.ts # Tipos específicos de precificação
```

## Uso

### Importação Geral

O arquivo `index.ts` principal re-exporta todos os tipos, mantendo compatibilidade com imports existentes:

```typescript
import { Product, Order, UserProfile } from '../types';
```

### Importação por Domínio (Recomendado)

Para melhor organização e performance, você pode importar diretamente de subpastas:

```typescript
import { Product, ProductVariant } from '../types/products';
import { Order, CartItem } from '../types/orders';
import { UserProfile } from '../types/users';
```

## Domínios

### Common (`common/`)

Tipos compartilhados entre múltiplos domínios:

- `LocalizedText` - Texto multilíngue
- `UserMode` - Modo do usuário (VAREJO/ATACADO)

### Products (`products/`)

Tipos relacionados ao catálogo de produtos:

- `Product` - Produto principal
- `ProductVariant` - Variante (tamanho, cor)
- `Category` - Categoria
- `Collection` - Coleção
- `Asset` - Asset (embalagem, etc.)
- `PricingScenario` - Cenário de precificação

### Orders (`orders/`)

Tipos relacionados a pedidos e carrinho:

- `Order` - Pedido completo
- `OrderItem` - Item do pedido
- `CartItem` - Item do carrinho
- `CartSession` - Sessão do carrinho
- `InternalLogisticsInfo` - Informações de logística
- `AddressData` - Dados de endereço (ViaCEP)

### Users (`users/`)

Tipos relacionados a usuários e fidelidade:

- `UserProfile` - Perfil do usuário
- `SavedAddress` - Endereço salvo
- `SavedCard` - Cartão salvo
- `LoyaltyLevel` - Nível de fidelidade
- `LoyaltySettings` - Configurações de fidelidade
- `UserLoyaltyData` - Dados de fidelidade do usuário

### Payments (`payments/`)

Tipos relacionados a pagamentos e precificação:

- Re-exporta tipos de `pricing.types.ts`
- `OrderEconomics` - Análise econômica de pedidos

### Reviews (`reviews/`)

Tipos relacionados a avaliações:

- `ProductReview` - Avaliação de produto
- `OrderReview` - Avaliação de pedido
- `ProductReviewMedia` - Mídia da avaliação
- `OrderItemForReview` - Item disponível para avaliação

### Suppliers (`suppliers/`)

Tipos relacionados a fornecedores:

- `Supplier` - Fornecedor
- `SupplierReview` - Avaliação de fornecedor

### Store (`store/`)

Tipos relacionados à configuração da loja:

- `StoreConfig` - Configuração da loja
- `GlobalFinancialSettings` - Configurações financeiras
- `PaymentGatewaySettings` - Configurações de gateway
- `CostStructureSettings` - Configurações de estrutura de custos
- `Banner` - Banner da loja
- `Coupon` - Cupom de desconto
- `SizeGuide` - Guia de tamanhos

### Dream (`dream/`)

Tipos do Dream Board (sistema de planejamento):

- `DreamBoard` - Board de sonhos
- `DreamCard` - Card do board
- `DreamComment` - Comentário no card
- `DiagramData` - Dados do diagrama
- `DiagramMetadata` - Metadados do diagrama

## Convenções

- **Interfaces**: PascalCase (`Product`, `UserProfile`)
- **Types**: PascalCase (`LocalizedText`, `UserMode`)
- **Enums**: PascalCase (`UserMode`)
- **Arquivos**: kebab-case (`product.ts`, `order-item.ts`)

## Adicionando Novos Tipos

1. Identifique o domínio apropriado
2. Crie ou edite o arquivo no domínio correspondente
3. Exporte no `index.ts` do domínio
4. O tipo será automaticamente re-exportado pelo `index.ts` principal

## Exemplo

```typescript
// types/products/new-type.ts
export interface NewProductType {
  id: string;
  name: string;
}

// types/products/index.ts
export * from './new-type';

// Agora disponível em:
import { NewProductType } from '../types';
// ou
import { NewProductType } from '../types/products';
```
