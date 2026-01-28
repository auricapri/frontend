/**
 * useMarketplaceData - Data fetching hooks for marketplace admin
 */

import { useCallback, useEffect, useState } from 'react';
import { marketplaceApi, type MLProductBasic, type MLProductFull } from '../../../../api/marketplace.api';
import { ProductsApi } from '../../../../api/products.api';
import type { MarketplaceConfig } from '../../../../types/marketplace';
import type { Product } from '../../../../types';
import type { Provider } from '../types';
import { logger } from '../../../../utils/logger';

const productsApi = new ProductsApi();

// ============================================================================
// useMarketplaceConfigs - Load marketplace configurations
// ============================================================================

export interface UseMarketplaceConfigsReturn {
  configs: MarketplaceConfig[];
  providers: Provider[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  loadConfigs: () => Promise<void>;
}

export function useMarketplaceConfigs(): UseMarketplaceConfigsReturn {
  const [configs, setConfigs] = useState<MarketplaceConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [configsData, providersData] = await Promise.all([
        marketplaceApi.getConfigs(),
        marketplaceApi.getProviders(),
      ]);
      setConfigs(configsData);
      setProviders(providersData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar dados';
      setError(message);
      logger.error('Failed to load marketplace data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      const configsData = await marketplaceApi.getConfigs();
      setConfigs(configsData);
    } catch (err) {
      logger.error('Failed to load configs', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    configs,
    providers,
    isLoading,
    error,
    reload: loadData,
    loadConfigs,
  };
}

// ============================================================================
// useMarketplaceProducts - Load products from marketplace
// ============================================================================

export interface MarketplaceProductsPagination {
  total: number;
  offset: number;
  limit: number;
}

export interface UseMarketplaceProductsParams {
  configId?: string;
  autoLoad?: boolean;
}

export interface UseMarketplaceProductsReturn {
  products: MLProductBasic[];
  pagination: MarketplaceProductsPagination;
  isLoading: boolean;
  error: string | null;
  load: (offset?: number, status?: string) => Promise<void>;
  loadDetails: (productId: string) => Promise<MLProductFull | null>;
}

export function useMarketplaceProducts(params: UseMarketplaceProductsParams = {}): UseMarketplaceProductsReturn {
  const { configId, autoLoad = false } = params;
  const [products, setProducts] = useState<MLProductBasic[]>([]);
  const [pagination, setPagination] = useState<MarketplaceProductsPagination>({ total: 0, offset: 0, limit: 20 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (offset = 0, status = 'active') => {
    if (!configId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await marketplaceApi.getMarketplaceProducts(configId, {
        status,
        limit: 20,
        offset,
      });
      setProducts(response.products);
      setPagination({ total: response.total, offset: response.offset, limit: response.limit });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar produtos';
      setError(message);
      logger.error('Failed to load marketplace products', err);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  const loadDetails = useCallback(async (productId: string): Promise<MLProductFull | null> => {
    if (!configId) return null;
    try {
      return await marketplaceApi.getMarketplaceProductDetails(configId, productId);
    } catch (err) {
      logger.error('Failed to load product details', err);
      return null;
    }
  }, [configId]);

  useEffect(() => {
    if (autoLoad && configId) {
      load();
    }
  }, [autoLoad, configId, load]);

  return {
    products,
    pagination,
    isLoading,
    error,
    load,
    loadDetails,
  };
}

// ============================================================================
// useLocalProducts - Load local catalog products
// ============================================================================

export interface UseLocalProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useLocalProducts(): UseLocalProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar produtos locais';
      setError(message);
      logger.error('Failed to load local products', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    products,
    isLoading,
    error,
    reload,
  };
}

// ============================================================================
// useMarketplaceSync - Sync operations
// ============================================================================

export interface UseMarketplaceSyncReturn {
  isSyncing: boolean;
  syncProducts: (configId: string) => Promise<void>;
  syncOrders: (configId: string) => Promise<void>;
}

export function useMarketplaceSync(): UseMarketplaceSyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncProducts = useCallback(async (configId: string) => {
    setIsSyncing(true);
    try {
      await marketplaceApi.syncProducts(configId);
    } catch (err) {
      logger.error('Failed to sync products', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncOrders = useCallback(async (configId: string) => {
    setIsSyncing(true);
    try {
      await marketplaceApi.syncOrders(configId);
    } catch (err) {
      logger.error('Failed to sync orders', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    syncProducts,
    syncOrders,
  };
}
