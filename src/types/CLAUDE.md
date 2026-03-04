# Types — Regras

## Organização

```
src/types/
├── index.ts          # Re-exports de tipos comuns (não incluir admin-only)
├── common/           # Tipos compartilhados (LocalizedText, Locale, etc.)
├── products/         # Product, ProductVariant, Category, Collection
│   ├── product.ts
│   └── variant.ts
├── orders/           # Order, CartItem, OrderItem, LogisticsMetadata
│   ├── order.ts
│   ├── cart-item.ts
│   └── logistics.ts
├── users/            # User, UserProfile, Address
├── payments/         # Payment, PaymentMethod
├── reviews/          # ProductReview
├── store/            # StoreConfig, Banner, Asset, SizeGuide
└── pricing.types.ts  # OrderEconomics
```

## Tipos Fundamentais — NUNCA redefinir

```typescript
// LocalizedText — TODOS os campos de texto da API
interface LocalizedText {
  pt: string;
  en: string;
}

// Locale
type Locale = 'pt' | 'en';

// UserMode
type UserMode = 'varejo' | 'atacado';
```

## Preços — SEMPRE em product_variants

```typescript
// CORRETO
interface ProductVariant {
  retail_price: number;     // preço varejo
  wholesale_price: number;  // preço atacado
  cost_price?: number;      // custo
}

// ERRADO — produto NÃO tem preço
interface Product {
  price: number;  // ❌ NUNCA adicionar isso
}
```

## Regras

### OBRIGATÓRIO
- Interfaces nomeadas (não type literals inline para tipos complexos)
- Separar por domínio em subdiretórios
- Exportar via `index.ts` apenas tipos usados em toda a aplicação
- Usar `?` para campos opcionais, nunca `| undefined` explícito em opcional
- Enums para valores discretos conhecidos (`OrderStatus`, `PaymentMethod`)

### PROIBIDO
- `any` — usar `unknown` e narrowing se necessário
- Duplicar interfaces que já existem
- Colocar tipos admin-only em `src/types/index.ts` (importar diretamente)
- Misturar tipos de domínios diferentes em um arquivo
- Reexportar tipos que não são usados amplamente

## Import Patterns

```typescript
// Tipos amplamente usados (via index.ts)
import type { Product, Order, CartItem, LocalizedText } from '@/types';

// Tipos de domínio específico
import type { DreamBoard } from '@/types/dream';
import type { Supplier } from '@/types/suppliers';
```
