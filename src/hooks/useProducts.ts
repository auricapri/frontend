import { useQuery } from '@tanstack/react-query';
import { ProductsApi } from '../api/products.api';

interface UseProductsOptions {
  limit?: number;
  offset?: number;
  enabled?: boolean;
  includeInactive?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { limit = 20, offset = 0, enabled = true, includeInactive = false } = options;
  
  return useQuery({
    queryKey: ['products', limit, offset, includeInactive],
    queryFn: async () => {
      const api = new ProductsApi();
      if (includeInactive) {
        return await api.getAll({ limit, offset });
      }
      return await api.getAllActive({ limit, offset });
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
