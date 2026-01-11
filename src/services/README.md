# Services

Este diretório contém a lógica de negócio da aplicação, organizada em serviços especializados.

## Estrutura

```
services/
├── pricing.service.ts    # Cálculo de preços
├── cart.service.ts       # Validação e cálculos do carrinho
├── order.service.ts      # Gestão de pedidos
├── loyalty.service.ts    # Programa de fidelidade
├── tax.service.ts        # Cálculo de impostos
└── logistics.service.ts  # Cálculos de logística
```

## Serviços Disponíveis

### PricingService

Calcula preços sugeridos e análise econômica de pedidos.

**Responsabilidades**:
- Cálculo de preço sugerido baseado em custos, impostos e margem
- Breakdown de custos (produção, assets, fixos, etc.)
- Cálculo de taxas de gateway
- Análise econômica de pedidos (COGS, margem, lucro)
- Preços de atacado e varejo

**Exemplo**:
```typescript
import { pricingService } from './pricing.service';

const breakdown = await pricingService.calculateSuggestedPrice({
  variant: productVariant,
  assets: productAssets,
  scenario: pricingScenario,
  config: pricingConfig
});
```

### CartService

Valida estoque e calcula totais do carrinho.

**Responsabilidades**:
- Validação de estoque de produtos e assets
- Validação de quantidade mínima (modo atacado)
- Cálculo de subtotal e total
- Aplicação de descontos

**Exemplo**:
```typescript
import { CartService } from './cart.service';

const service = new CartService();
const validation = service.validateStock(cartItems, products, assets, UserMode.VAREJO);
const subtotal = service.calculateSubtotal(cartItems);
```

### OrderService

Gerencia criação e consulta de pedidos.

**Responsabilidades**:
- Criação de pedidos
- Salvamento automático de endereços
- Consulta de pedidos
- Atualização de status

**Exemplo**:
```typescript
import { OrderService } from './order.service';

const service = new OrderService();
const order = await service.createOrder(
  cartItems,
  addressData,
  logisticsInfo,
  'credit_card',
  subtotal,
  finalAmount,
  userId
);
```

### LoyaltyService

Gerencia programa de fidelidade.

**Responsabilidades**:
- Cálculo de XP e cashback
- Verificação de subida de nível
- Geração de cupons de recompensa
- Atualização de dados de fidelidade

**Exemplo**:
```typescript
import { LoyaltyService } from './loyalty.service';

const service = new LoyaltyService();
const earnings = service.calculateEarnings(1000, loyaltySettings);
const newLevel = service.checkLevelUp(currentXP, currentLevel, loyaltySettings);
```

### TaxCalculationService

Calcula impostos brasileiros.

**Responsabilidades**:
- Cálculo de impostos por regime (MEI, Simples, Presumido, Real)
- ICMS, DAS, PIS, COFINS, IRPJ, CSLL
- Cache de taxas de ICMS
- Verificação de limites MEI

**Exemplo**:
```typescript
import { taxService } from './tax.service';

const breakdown = await taxService.calculateTaxes({
  revenue: 1000,
  regime: 'mei',
  originState: 'SP',
  destinationState: 'RJ',
  monthlyRevenue: 5000
});
```

### LogisticsService

Gerencia cálculos e consultas de logística.

**Responsabilidades**:
- Consulta de endereços via ViaCEP
- Cálculo de frete
- Cotações de transporte
- Cálculo de peso volumétrico
- Cache de cotações

**Exemplo**:
```typescript
import { logisticsService } from './logistics.service';

const address = await logisticsService.fetchAddressByCep('01310100');
const shipping = await logisticsService.calculateShipping('01310100', address);
```

## Padrões

### Instanciação

Serviços podem ser instanciados ou usar instâncias singleton exportadas:

```typescript
// Nova instância
const service = new PricingService();

// Instância singleton (se disponível)
import { pricingService } from './pricing.service';
```

### Cache

Alguns serviços usam cache interno:

- `PricingService`: Cache de estrutura de custos e gateway (5 min)
- `TaxCalculationService`: Cache de taxas ICMS (1 hora)
- `LogisticsService`: Cache de cotações de frete (1 hora)

### Tratamento de Erros

Serviços podem lançar erros que devem ser tratados:

```typescript
try {
  const breakdown = await pricingService.calculateSuggestedPrice(input);
} catch (error) {
  console.error('Erro ao calcular preço:', error);
}
```

## Convenções

- **Classes**: PascalCase com sufixo `Service` (`PricingService`, `CartService`)
- **Métodos**: camelCase (`calculateSuggestedPrice`, `validateStock`)
- **Retornos**: Promises tipadas para métodos async
- **Documentação**: JSDoc completo em todas as classes e métodos públicos

## Adicionando Novos Serviços

1. Crie o arquivo `nome.service.ts`
2. Exporte a classe com JSDoc completo
3. Documente todos os métodos públicos
4. Adicione exemplos de uso no JSDoc
5. Atualize este README
