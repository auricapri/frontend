# API Layer — Regras

## Propósito

Esta camada abstrai todas as chamadas HTTP ao backend. Componentes e hooks NUNCA fazem fetch diretamente.

## Arquivos Existentes

```
src/api/
├── cart.api.ts           # Carrinho (sync, merge)
├── orders.api.ts         # Pedidos (criar, buscar, cancelar)
├── products.api.ts       # Catálogo (list, getById, bootstrap)
├── users.api.ts          # Perfil, endereços, loyalty
├── coupons.api.ts        # Validação de cupons
├── reviews.api.ts        # Avaliações de produtos
├── store.api.ts          # Configuração da loja
└── repositories/         # Abstrações de repositório
```

## Padrão de Classe API

```typescript
// src/api/my-feature.api.ts
import { apiClient } from './client';

export class MyFeatureApi {
  async getById(id: string): Promise<MyType> {
    const response = await apiClient.get<MyType>(`/my-feature/${id}`);
    return response.data;
  }

  async create(data: CreateMyTypeData): Promise<MyType> {
    const response = await apiClient.post<MyType>('/my-feature', data);
    return response.data;
  }

  async update(id: string, data: Partial<MyType>): Promise<MyType> {
    const response = await apiClient.patch<MyType>(`/my-feature/${id}`, data);
    return response.data;
  }
}
```

## Regras

### OBRIGATÓRIO
- Cada API class em arquivo separado: `[feature].api.ts`
- Tipos de retorno explícitos em todos os métodos
- Erros propagados ao chamador (não engolir exceções)
- Usar o `apiClient` configurado (não criar instâncias de `fetch` próprias)

### PROIBIDO
- Chamar `fetch` ou `axios` diretamente em componentes ou hooks
- Lógica de negócio nas classes API (apenas HTTP)
- Transformações complexas de dados (apenas mapeamento simples)
- Hardcode de URLs (usar constantes de configuração)
- `console.log` de respostas

## Autenticação

O `apiClient` injeta automaticamente o token Supabase. Não precisa passar headers manuais.

## Tratamento de Erros

```typescript
// Erros do servidor chegam com: { error: { code, message, userMessage } }
// Propagar o erro — o hook/componente decide como tratar
async getOrder(id: string): Promise<Order> {
  try {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  } catch (error) {
    // Re-throw com contexto se necessário
    throw error;
  }
}
```
