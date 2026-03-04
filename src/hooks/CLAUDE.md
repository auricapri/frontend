# Hooks — Regras

## Localização e Nomenclatura

- Todos os hooks em `src/hooks/` com nome `use[Nome].ts`
- Hooks específicos de feature em `components/[feature]/hooks/use[Nome].ts`
- Nome sempre em camelCase: `useCart`, `useProducts`, `useRecentlyViewed`

## Hooks Existentes — NÃO RECRIAR

| Hook | Responsabilidade |
|---|---|
| `useAuth` | Autenticação, sessão, pedidos do usuário |
| `useCart` | Estado do carrinho, sync com servidor |
| `useStoreData` | Bootstrap: produtos, coleções, config, banners |
| `useProducts` | React Query wrapper para produtos |
| `useNavigation` | Roteamento customizado (AppView ↔ URL) |
| `usePersistedState` | localStorage com serialização |
| `useRecentlyViewed` | Histórico de produtos vistos (localStorage) |
| `useCheckoutState` | Estado central do checkout |
| `useCheckoutTotals` | Cálculos: subtotal, PIX, cashback, frete, parcelas |

## Padrão de Hook

```typescript
// src/hooks/useMyFeature.ts

import { useState, useCallback, useRef, useEffect } from 'react';

export function useMyFeature(param: string) {
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await myApi.get(param);
      if (!isMounted.current) return;
      setData(result);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [param]);

  return { data, isLoading, error, refetch: fetchData };
}
```

## Regras

### OBRIGATÓRIO
- Retornar **objeto** quando há mais de 2 valores (nunca array com >2 itens)
- Usar `useRef(true)` para isMounted em hooks com async
- `useCallback` para todas as funções retornadas pelo hook
- `useMemo` para computações derivadas de estado
- Dependências explícitas em todos os arrays de deps

### PROIBIDO
- Hooks que fazem mais de uma coisa (SRP — dividir em hooks menores)
- `fetch` ou `axios` diretamente em hooks sem React Query (usar React Query para server state)
- Estado de servidor em `useState` + `useEffect` (usar `useQuery`)
- Hooks que retornam JSX (isso é componente, não hook)
- `useEffect` sem array de dependências (executa infinitamente)
- Chamar outros hooks condicionalmente

## React Query — Padrão

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query (leitura)
export function useOrderHistory(userId: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => ordersApi.getByUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,   // 5 minutos
    gcTime: 10 * 60 * 1000,     // 10 minutos
  });
}

// Mutation (escrita)
export function useUpdateOrder() {
  return useMutation({
    mutationFn: (data: UpdateOrderData) => ordersApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

## Persistência Local

```typescript
// TTL storage (src/lib/storage ou src/hooks/usePersistedState)
import { readWithTTL, writeWithTTL } from '@/lib/storage';

// Chaves padronizadas existentes:
// 'auricapri_cart_items'        (7 dias)
// 'auricapri_cart_last_sync'    (7 dias)
// 'auricapri_checkout_prefill'  (7 dias)
// 'recently_viewed_products'    (30 dias)
```

---

## Changelog — Regra Global Obrigatória

Após **qualquer alteração** finalizada (código, configuração, dependências):

1. Atualizar `CHANGELOG.md` na raiz do repositório
2. Incrementar versão seguindo **Semantic Versioning** (`MAJOR.MINOR.PATCH`):
   - `PATCH` — bugfix, ajuste sem breaking change
   - `MINOR` — nova feature ou melhoria retrocompatível
   - `MAJOR` — breaking change, mudança de contrato de API ou refatoração arquitetural
3. Manter `README.md` atualizado com mudanças de API, setup ou deploy

**NUNCA** encerrar uma tarefa sem:
- [ ] `CHANGELOG.md` atualizado com as alterações da sessão
- [ ] Versão incrementada
- [ ] `README.md` refletindo o estado atual do projeto
