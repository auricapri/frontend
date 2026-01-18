# Componentização - Guia de Refatoração

## Critérios de Divisão
Foco em arquivos que superam os seguintes limites:
- **Tamanho**: >800 linhas (Crítico) ou >500 linhas com múltiplas responsabilidades.
- **Estado**: >10 estados independentes.
- **Complexidade**: Múltiplas seções visuais ou lógicas distintas.

## Prioridades de Refatoração

### 🔴 CRÍTICO (>1000 linhas)

1. **DiagramEditor.tsx** (1860 linhas)
   - *Foco*: Separar Canvas, Toolbar e Properties Panel.
   - *Estrutura*: `DiagramCanvas`, `NodeRenderer`, `EdgeRenderer`, `SelectionHandler`, `DiagramToolbar`, `PropertiesPanel`, `Minimap`, `ZoomControls`.
   - *Hooks*: `useDiagramState`, `useDiagramOperations`, `useDiagramKeyboard`.

2. **CheckoutView.tsx** (1698 linhas)
   - *Foco*: Modularizar por etapas do checkout.
   - *Estrutura*: `AddressStep` (Cep, Form, Map), `ShippingStep`, `PaymentStep` (Selector, Form, SavedCards, Pix, Split), `ReviewStep`.
   - *Hooks*: `useCheckoutState`, `useShippingCalculation`, `usePaymentProcessing`.

3. **ProductDetail.tsx** (Web/Mobile - ~1200 linhas)
   - *Foco*: Sincronizar lógica entre plataformas.
   - *Estrutura*: `ImageGallery`, `ProductInfo`, `ProductVariants` (Size, Color, Qty), `ProductActions`, `ProductReviews`, `RelatedProducts`.

4. **App.tsx** (1073 linhas)
   - *Foco*: Desacoplar roteamento e provedores.
   - *Estrutura*: `AppRouter`, `AppProviders`, `AppLayout` (Header, Footer).
   - *Hooks*: `useAppState`, `useNavigation`.

### 🟡 ALTA PRIORIDADE (800-1000 linhas)

- **UserProfileView.tsx**: Separar Tabs (`PersonalInfo`, `Addresses`, `PaymentMethods`, `Loyalty`).
- **AdminEditorModal.tsx**: Modularizar Tabs de edição e Toolbar.
- **AdminDashboard.tsx**: Dividir em Header e Tabs (`Overview`, `Products`, `Orders`, `Analytics`).

### 🟢 MÉDIA PRIORIDADE (500-800 linhas)

- **PaymentForm.tsx**: Isolar métodos de pagamento (Cartão, Pix, Salvos).
- **AdminOrders.tsx**: Separar Listagem, Filtros e Modais.
- **DreamCardModal.tsx**: Dividir em Form, Preview e Comments.
- **delivery.service.ts**: Fragmentar em Pickup, Reporting e Grouping services.
- **pricing.service.ts**: Isolar Cálculos de Preço, Impostos e Descontos.
- **types/index.ts**: Dividir por domínio (Products, Orders, Users, Payments).

## Estratégia e Padrões

### 1. Extração de Hooks
Mover lógica de estado e efeitos para hooks customizados (`useComponentLogic`).

### 2. Composição e Contexto
Usar o padrão de composição para evitar *prop drilling* excessivo.

### 3. Lazy Loading
Implementar `React.lazy()` para componentes pesados ou modais secundários.

## Validação e Métricas
- **Meta**: Arquivos <500 linhas, <5 estados principais, <3 responsabilidades.
- **Checklist**:
  - [ ] Extrair hooks e subcomponentes.
  - [ ] Atualizar imports e adicionar testes unitários.
  - [ ] Validar performance (React DevTools) e bundle size.
  - [ ] Code review focado em responsabilidade única.

## Exceções (Aceitáveis >500 linhas)
- Arquivos de tradução (`i18n.ts`).
- Tipos gerados automaticamente (`.d.ts`).
- Templates e configurações centralizadas.

---
*Última atualização: 2026-01-13 - Otimização de tokens e simplificação.*
