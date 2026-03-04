# Services — Regras

## Propósito

Services contêm lógica de negócio que é complexa demais para um hook, mas não é HTTP puro. Tipicamente são classes instanciadas com `useMemo` dentro de hooks.

## Exemplo Existente

`CartService` — lógica de validação de estoque, cálculo de descontos, merge de carrinhos.

## Padrão

```typescript
// src/services/my-feature.service.ts

export class MyFeatureService {
  // Lógica de negócio complexa
  calculateDiscount(items: CartItem[], coupon: Coupon): number {
    // regras de negócio
    return discount;
  }

  validateItems(items: CartItem[], products: Product[]): ValidationResult {
    // validações
    return { valid: true, errors: [] };
  }
}
```

## Uso em Hooks

```typescript
// Instanciar com useMemo para evitar recriação
const cartService = useMemo(() => new CartService(), []);
```

## Regras

- Services são **stateless** (sem estado interno mutável)
- Não fazem chamadas HTTP (isso é responsabilidade da camada `api/`)
- Não dependem de React (sem hooks, sem contextos)
- Uma classe por arquivo, uma responsabilidade por classe
- Métodos com nomes descritivos que revelam intenção
- Sem comentários óbvios — nome do método deve ser auto-explicativo
