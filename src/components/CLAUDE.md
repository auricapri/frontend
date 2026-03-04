# Componentes — Regras de Arquitetura

## Organização de Diretórios

```
components/
├── ui/          # Primitivos de UI sem lógica de negócio
├── common/      # Componentes de layout global
├── auth/        # Autenticação e perfil
├── cart/        # Carrinho de compras
├── checkout/    # Fluxo de checkout (steps/ + hooks/)
├── layout/      # Navbar, Footer
├── product/     # Catálogo (detail/ + hooks/)
├── orders/      # Pedidos do usuário
├── search/      # Busca
└── seo/         # Componentes SEO (SEOHead)
```

## Regras de Componentização

### Tamanho máximo
- Componente simples (apresentação): **máx 150 linhas**
- Componente de página/feature: **máx 250 linhas**
- Se ultrapassar: **extrair subcomponentes em subdiretório**

```
Exemplo correto:
components/product/
├── ProductDetail.tsx          # Orquestra
└── detail/
    ├── ProductInfo.tsx        # Informações + preço
    ├── ProductActions.tsx     # Botões de ação
    ├── ProductGallery.tsx     # Galeria de imagens
    └── hooks/
        └── useProductDetail.ts
```

### Responsabilidade única
- **UI components (`ui/`)**: apenas aparência, zero lógica de negócio
- **Feature components**: orquestram subcomponentes, delegam lógica a hooks
- **Hooks**: toda lógica de estado, efeitos, chamadas de API

### Props
```typescript
// CORRETO: Interface explícita
interface ProductCardProps {
  product: Product;
  locale: Locale;
  onAddToCart: (item: CartItem) => void;
}

// ERRADO: Inline type, any, prop drilling excessivo
function Card({ product }: { product: any }) { ... }
```

## Componentes UI — Referência Completa

### `<Button>` — `ui/Button.tsx`
```tsx
<Button variant="primary" size="md" isLoading={loading} onClick={handler}>
  Comprar
</Button>
// variants: primary | secondary | outline | ghost
// sizes: sm | md | lg
```

### `<Input>` — `ui/Input.tsx`
```tsx
<Input
  label="Nome"
  value={value}
  onChange={e => setValue(e.target.value)}
  error="Campo obrigatório"
/>
```

### `<Modal>` — `ui/Modal.tsx`
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Confirmar">
  <p>Conteúdo do modal</p>
</Modal>
// ✓ Backdrop automático
// ✓ Fecha com Escape
// ✓ Bloqueia scroll do body
```

### `<Drawer>` — `ui/Drawer.tsx`
```tsx
<Drawer isOpen={isOpen} onClose={onClose}>
  {/* Conteúdo lateral */}
</Drawer>
```

### `<OptimizedImage>` — `ui/OptimizedImage.tsx`
```tsx
<OptimizedImage
  url={product.base_images[0]}
  size="medium"
  alt={getLoc(product.name)}
  className="w-full h-full object-cover"
/>
// ✓ Lazy loading automático
// ✓ srcSet responsivo
// ✓ Fallback para placeholder
// ✓ Supabase image transforms
```

### `<LoadingSpinner>` — `ui/LoadingSpinner.tsx`
```tsx
<LoadingSpinner size="sm" />  // sm | md | lg
```

## PROIBIDO

- Criar `<button>` raw com estilo manual quando `<Button>` resolve
- Criar `<img>` para produtos sem `<OptimizedImage>` ou `getOptimizedImageUrl`
- Criar modal/overlay sem usar `<Modal>` ou `<Drawer>`
- Criar spinner/loading sem usar `<LoadingSpinner>`
- Colocar chamadas de API diretamente em componentes (usar hooks)
- Colocar `useEffect` com fetch em componentes (usar React Query)
- Componentes com múltiplas responsabilidades (split pelo SRP)
- Props não tipadas ou com `any`
- Comentários que explicam o óbvio
- Lógica complexa inline no JSX (extrair para variável ou função)
- `className` com mais de ~6 classes inline sem variável intermediária
- Duplicar animações, cores, espaçamentos que já existem em TailwindCSS

## Comunicação entre componentes

```
AppContext ──► Navbar, Footer (dados globais via useContext)
CartContext ──► CartDrawer, ProductActions (carrinho via useContext)
Props ──► Componentes filhos diretos
onNavigate ──► Navegação entre views (NUNCA window.location diretamente)
CustomEvent ──► Cross-component sem hierarquia (cart-merged, etc.)
```

## Checkout — Estrutura Obrigatória

O checkout tem estrutura própria com steps e hooks especializados:
```
checkout/
├── CheckoutViewV2.tsx       # Orquestrador principal
├── CheckoutSidebar.tsx      # Resumo lateral com totais
├── InstallmentSelector.tsx  # Seletor de parcelas
├── steps/
│   ├── AddressStep.tsx
│   ├── ShippingStep.tsx
│   └── PaymentStep.tsx      # ⚠ ARQUIVO GRANDE — dividir ao modificar (ver abaixo)
└── hooks/
    ├── useCheckoutState.ts  # Estado central do checkout
    ├── useCheckoutTotals.ts # Cálculos de preço (PIX, cashback, parcelas)
    ├── usePixBoletoState.ts
    └── types.ts             # Tipos do checkout
```

**NUNCA** refatorar o fluxo do checkout sem entender todos os hooks acima.

### PaymentStep.tsx — Refatoração Pendente

`PaymentStep.tsx` tem ~781 linhas e **precisa ser dividido**. Ao modificar, extrair:

```
steps/payment/
├── PaymentStep.tsx          # Orquestrador (~150 linhas)
├── CreditCardForm.tsx        # Formulário de cartão
├── PixPaymentSection.tsx     # Seção PIX + QR code
├── BoletoSection.tsx         # Seção boleto
└── CashbackToggle.tsx        # Toggle de cashback (funciona com PIX também)
```

Cashback deve ser visível para **todos** os métodos de pagamento, não apenas cartão.
