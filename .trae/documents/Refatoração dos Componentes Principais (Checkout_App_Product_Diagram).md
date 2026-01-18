## Contexto Rápido (o que encontrei)
- O frontend web usa **Playwright** como runner de testes (`npm test`). Não há Vitest/Jest configurado no `package.json`, embora existam arquivos em `src/__tests__` com APIs de Jest (`describe/test/expect`) que hoje **não estão garantidos** na pipeline.
- Já existe um esqueleto de roteamento interno em `src/router` ([Router.tsx](file:///Users/marcuslirio/Desktop/auricapri/auricapri/src/router/Router.tsx), [useRouter.ts](file:///Users/marcuslirio/Desktop/auricapri/auricapri/src/router/useRouter.ts)), mas o [App.tsx](file:///Users/marcuslirio/Desktop/auricapri/auricapri/App.tsx) ainda concentra orquestração extensa.
- O [CheckoutView.tsx](file:///Users/marcuslirio/Desktop/auricapri/auricapri/src/components/checkout/CheckoutView.tsx) tem lógica sensível (Mapbox, regras de atacado, cupons/cashback/PIX, cálculo de frete, validações e `onComplete`).

> Observação: o índice semântico global do repositório não estava pronto quando tentei uma busca ampla; o plano abaixo foi montado por leitura direta dos arquivos críticos.

---

## Objetivos e Critérios de Sucesso
- Reduzir **~80%** do tamanho de cada componente principal (manter “orquestradores” pequenos).
- Manter **100%** das funcionalidades atuais (incluindo regras de preço/cupom/frete/atacado, tracking, autenticação/admin).
- Adicionar testes **unitários** para lógica extraída (e onde possível para hooks) + manter Playwright E2E sem regressões.
- Não quebrar exports, rotas nem a pipeline.

---

## Estratégia Geral (para minimizar risco)
1. **Fase 0 – Safety net antes de mexer**
   - Mapear contratos públicos:
     - Props e `onComplete` do checkout (assinatura atual em [CheckoutPage.tsx](file:///Users/marcuslirio/Desktop/auricapri/auricapri/src/pages/CheckoutPage.tsx)).
     - Fluxos críticos do App: navegação, carrinho, validação de estoque, criação de pedido.
   - Fortalecer testes E2E já existentes:
     - Adicionar/ajustar testes Playwright para: visitar `/checkout`, preencher CEP/número, selecionar frete, escolher método (pix/cartão), avançar até revisão.
     - Garantir que o relatório de perf de endpoints continue rodando sem mudanças.
   - **Habilitar testes unitários de verdade** (para atender ao requisito de cobertura):
     - Adicionar Vitest + JSDOM e uma base mínima de Testing Library para testar funções puras e hooks (sem precisar de browser real).
     - Configurar um script `test:unit` separado do Playwright.

2. **Refatoração por extração incremental**
   - Primeiro extrair **funções puras** e **hooks** (baixo risco).
   - Depois mover UI em blocos para subcomponentes.
   - Manter os nomes/exports antigos via `index.ts` (barrels), para não quebrar imports.

---

## Fase 1 (prioridade máxima): CheckoutView.tsx → orquestrador ~150 linhas
### 1.1 Nova estrutura de arquivos
Criar pasta dedicada:
- `src/components/checkout/CheckoutView.tsx` (orquestrador)
- `src/components/checkout/steps/AddressStep.tsx`
- `src/components/checkout/steps/ShippingStep.tsx`
- `src/components/checkout/steps/PaymentStep.tsx`
- `src/components/checkout/steps/ReviewStep.tsx`
- `src/components/checkout/hooks/useCheckoutState.ts`
- `src/components/checkout/hooks/useShippingCalculation.ts`
- `src/components/checkout/hooks/usePaymentProcessing.ts`
- (opcional, se necessário pela leitura do arquivo atual) `src/components/checkout/utils/*` para funções puras (ex.: totals, validações, normalizações de endereço)

### 1.2 Distribuição de responsabilidades (definição clara)
- `useCheckoutState`:
  - Step atual, estado de endereço, flags de validação, seleção de frete, método de pagamento, cupom, cashback, estados de UI (loading/erro/modais).
  - Deve expor um “state + actions” estável para os steps.
- `useShippingCalculation`:
  - Isolar chamadas a `LogisticsService`, regras atacado/varejo, e seleção de opção.
  - Retornar {options, selected, loading, error, recalc()}.
- `usePaymentProcessing`:
  - Regras de método (pix/cartão), token de cartão salvo, flags de salvar cartão.
  - Preparar payload final para `onComplete` sem renderização.
- Steps:
  - `AddressStep`: inputs/CEP + integração Mapbox (ou encapsular Mapbox em um subcomponente interno do step para não contaminar o orquestrador).
  - `ShippingStep`: lista de opções e seleção.
  - `PaymentStep`: seleção pix/cartão, cartão salvo, e validações de pagamento.
  - `ReviewStep`: resumo de itens, totais, e botão finalizar.

### 1.3 Migração incremental (sem quebra)
- Primeiro mover “helpers” (cálculo de subtotal/total, aplicação de cupom/cashback/pix, validações) para `utils/` + unit tests.
- Depois mover “efeitos” (CEP→endereço, cálculo de frete, mapbox lifecycle) para hooks.
- Por último, quebrar a UI em steps.
- Garantir que `CheckoutView` mantém a mesma API externa (props + `onComplete`) e que as strings/labels de UX continuam iguais.

### 1.4 Testes
- Unitários:
  - Totais (cupom/cashback/pix) e regras de elegibilidade.
  - Regras de atacado (mínimo, múltiplas opções de frete).
- Integração (Playwright): fluxo `/checkout` até revisão com preenchimento de campos.

---

## Fase 2: App.tsx → modularização (base da aplicação)
### 2.1 Nova estrutura
- `App.tsx` vira composição simples.
- `src/app/AppRouter.tsx`:
  - Pode reaproveitar o [Router.tsx](file:///Users/marcuslirio/Desktop/auricapri/auricapri/src/router/Router.tsx) existente, ou encapsular a lógica de `currentView` nele.
- `src/app/AppProviders.tsx`:
  - Centralizar providers/contexts (onde existirem) e inicializações globais.
- `src/app/AppLayout.tsx`:
  - Layout base (header/footer, main scroll container, drawers globais).
- `src/app/hooks/useAppState.ts`:
  - `currentView`, navegação, estado de drawers, estado global mínimo.
- `src/app/hooks/useOrderProcessing.ts`:
  - `validateCartStock` + `handlePlaceOrder` (separando domínio de UI).

### 2.2 Estratégia de migração
- Extrair primeiro `validateCartStock` e `handlePlaceOrder` para hook e cobrir com testes de funções puras (ex.: normalização de payload).
- Migrar navegação para o router existente sem alterar URLs/`history` de forma abrupta (manter compatibilidade do fluxo atual).
- Manter tracking e guards (admin/MFA) funcionando via efeitos no hook.

### 2.3 Testes
- Playwright: “happy path” navegar Home → Produto → Carrinho → Checkout (sem pagamento real).
- Unitários: normalização do payload de pedido, validações de estoque (funções extraídas).

---

## Fase 3: ProductDetail.tsx → divisão em componentes
### 3.1 Estrutura
- `src/components/product/ProductDetail.tsx` (orquestrador)
- `src/components/product/ImageGallery.tsx`
- `src/components/product/ProductInfo.tsx`
- `src/components/product/ProductVariants.tsx`
- `src/components/product/ProductActions.tsx`
- (opcional) `src/components/product/hooks/useProductSelection.ts` para seleção cor/tamanho e sincronização de galeria

### 3.2 Pontos sensíveis (atenção no plano)
- Manter a lógica de “imagem ativa por variante” e o índice/scroll/zoom sem regressões.
- Manter os campos do item de carrinho (ex.: `original_price`, `applied_coupon_code`) exatamente como hoje.

### 3.3 Testes
- Unitários: seleção de variante e cálculo de preço/cupom (funções puras).
- Playwright: abrir produto, trocar cor/tamanho, adicionar ao carrinho.

---

## Fase 4 (última): DiagramEditor.tsx → componente mais complexo
### 4.1 Estrutura
- `src/components/admin/dream-board/DiagramEditor.tsx` (orquestrador)
- `DiagramCanvas.tsx` (ReactFlow + handlers)
- `DiagramToolbar.tsx`
- `PropertiesPanel.tsx`
- `NodeLibrary.tsx` (se a “ResourcePanel” precisar ser reestruturada)
- `hooks/` (estado/operações/cálculo de resultado)

### 4.2 Riscos e mitigação
- Preservar o contrato de `onSave` (serialização “clean” sem callbacks).
- Isolar avaliação de fórmulas (`new Function`) e cobrir com testes (inclusive entradas inválidas).

---

## Garantias de Compatibilidade
- Manter barrels (`index.ts`) e re-exports para não quebrar imports.
- Manter assinaturas públicas (`CheckoutView` props, `onComplete`, rotas e views).
- Refatorar em commits/PRs pequenos por fase, cada fase com build + Playwright verde.

---

## Entregáveis
- Refatoração implementada nas 4 fases (DiagramEditor por último) seguindo a priorização fornecida.
- Novos hooks/componentes criados conforme lista.
- Suite de testes:
  - Playwright E2E (existente + novos cenários críticos).
  - Unit tests (Vitest) cobrindo funções e partes críticas dos hooks.
- Medição objetiva: redução de linhas por arquivo e relatório de testes/CI sem falhas.
