# ⚡ Regras de Lazy Loading

## 🚫 NUNCA faça isso:

### ❌ Barrel Exports de Componentes Lazy
```typescript
// ❌ ERRADO - components/product/index.ts
export { default as ProductGrid } from './ProductGrid';
export { default as ProductDetail } from './ProductDetail';

// ❌ ERRADO - components/index.ts
export * from './product';
export * from './checkout';
export * from './admin';
```

**Problema:** Quando você importa `import { ProductGrid } from '../components/product'`, o arquivo `index.ts` carrega TODOS os componentes da pasta, quebrando completamente o lazy loading.

### ❌ Imports de Barrel Exports
```typescript
// ❌ ERRADO
import { ProductGrid, ProductDetail } from '../components/product';
import { CheckoutView } from '../components/checkout';
```

## ✅ SEMPRE faça isso:

### ✅ Imports Diretos de Arquivos
```typescript
// ✅ CORRETO - Imports diretos
import ProductGrid from '../components/product/ProductGrid';
import ProductDetail from '../components/product/ProductDetail';
import CheckoutView from '../components/checkout/CheckoutViewV2';
```

### ✅ Lazy Loading Correto
```typescript
// ✅ CORRETO - Lazy loading
const ProductGrid = React.lazy(() => import('../components/product/ProductGrid'));
const CheckoutView = React.lazy(() => import('../components/checkout/CheckoutViewV2'));
```

## 📋 Componentes que DEVEM ser Lazy Loaded

### 🔴 Alta Prioridade (>100KB cada)
- **Admin:** Todos os AdminXXX components (AdminDashboard, AdminHealth, etc)
- **Dream Board:** AdminDreamBoard + ReactFlow (~450KB)
- **Checkout:** CheckoutView, PaymentForm (Stripe ~200KB), AddressForm (Leaflet ~300KB)
- **Product:** ProductGrid, ProductDetail, CollectionDetail
- **Chat:** ChatDrawer

### 🟡 Média Prioridade (50-100KB cada)
- **Pages:** Páginas de login, privacy, terms, about
- **Orders:** OrderReceipt, OrderReviewPage

## 📦 Componentes OK para Barrel Export

### ✅ Componentes Pequenos e Sempre Usados (<20KB)
- **Layout:** Navbar, Footer
- **UI:** Button, Input, Modal, Toast
- **Cart:** CartDrawer, WishlistDrawer (usados frequentemente)
- **Auth:** AuthDrawer
- **Shared:** Hero, LoyaltyBanner

## 🔍 Como Verificar se Quebrou

### 1. DevTools → Network → JS
```bash
# Abrir homepage
# ✅ Esperado: Carregar apenas vendor-react, main, vendor-lucide
# ❌ Problema: Carregar checkout, admin, product chunks

# Navegar para /checkout
# ✅ Esperado: Carregar checkout-payment, vendor-stripe AGORA
# ❌ Problema: Já estava carregado desde o início
```

### 2. Bundle Analysis
```bash
npm run build
npx vite-bundle-visualizer
```

**Buscar por:**
- Bundle inicial > 800KB (problema!)
- Chunks "admin", "checkout", "product" carregados na homepage (problema!)

## 🛠️ Se Quebrou o Lazy Loading

### 1. Verificar Barrel Exports
```bash
# Encontrar todos os index.ts
find src/components -name "index.ts"

# Verificar o que está sendo exportado
cat src/components/product/index.ts
cat src/components/checkout/index.ts
cat src/components/admin/index.ts
```

### 2. Buscar Imports Problemáticos
```bash
# Buscar imports de barrel exports
grep -r "from.*'../components/\(product\|checkout\|admin\)'" src/
```

### 3. Corrigir
1. Remover exports dos componentes lazy do `index.ts`
2. Mudar imports para diretos nos arquivos que usam
3. Testar no DevTools

## 📊 Impacto Esperado

**Com Lazy Loading Correto:**
- Bundle inicial: ~800KB
- Checkout chunk: ~500KB (carregado sob demanda)
- Admin chunk: ~400KB (carregado sob demanda)
- Dream Board: ~450KB (carregado sob demanda)

**Com Barrel Exports (QUEBRADO):**
- Bundle inicial: ~2.5MB 🔴
- Tudo carregado de uma vez
- Performance ruim

## 🎯 Arquivos Críticos

**NÃO MODIFICAR sem cuidado:**
- `src/app/AppLayout.tsx` - Todos os imports devem ser diretos
- `src/app/AppRouter.tsx` - Todos os imports devem ser diretos
- `src/components/index.ts` - NÃO exportar product/checkout/admin
- `src/components/product/index.ts` - Vazio ou só ProductReviews
- `src/components/checkout/index.ts` - Vazio ou só OrderSummary
- `src/components/admin/index.ts` - Vazio (comentários apenas)

## 💡 Regra de Ouro

> **Se o componente é lazy loaded, NUNCA coloque no barrel export!**
>
> Lazy loading = Import direto do arquivo

---

## 🚨 Regras para Types Barrel Export

### ❌ NUNCA exporte no types/index.ts:
- Dream types (admin-only)
- Diagram types (admin-only)
- Supplier types (admin-only)
- Qualquer tipo usado apenas em admin

### ✅ OK para types/index.ts:
- Common types (usados em toda a aplicação)
- Product types
- Order types
- User types
- Payment types
- Review types
- Store types

### 📋 Como importar tipos admin:
```typescript
// ❌ ERRADO
import { DreamBoard } from '../../types';

// ✅ CORRETO
import { DreamBoard } from '../../types/dream';
```

### 🔍 Como verificar:
1. Abrir DevTools → Network
2. Filtrar por `.ts`
3. ❌ Se `types/dream/index.ts` carregar na homepage = PROBLEMA
4. ✅ Só deve carregar quando acessar admin Dream Board
