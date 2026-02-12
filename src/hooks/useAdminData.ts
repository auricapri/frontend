import { useState, useCallback, useEffect, useRef } from 'react';
import {
  productsApi,
  ordersApi,
  usersApi,
  storeApi,
  couponsApi,
  collectionsApi,
  assetsApi,
  guidesApi,
  bannersApi,
  suppliersApi,
  marketingApi,
} from '../api/instances';
import { logger } from '../utils/logger';
import type {
  Product, Category, Collection, Banner, Coupon, Asset,
  StoreConfig, UserProfile, Order, SizeGuide, Supplier
} from '../types';
import type { Campaign } from '../api/marketing.api';
import type { AdminTab } from './useAdminRouter';

// Data required by each tab
const TAB_DATA_REQUIREMENTS: Record<AdminTab, string[]> = {
  health: ['orders', 'products', 'assets', 'config'],
  dream: ['categories', 'collections', 'assets'],
  orders: ['orders', 'products', 'assets'],
  delivery: ['orders', 'suppliers'],
  inventory: ['products', 'suppliers', 'categories', 'collections'],
  suppliers: ['suppliers'],
  taxonomy: ['categories', 'collections'],
  guides: ['guides'],
  marketing: ['banners', 'campaigns'],
  coupons: ['coupons', 'products'],
  assets: ['assets'],
  about: ['config'],
  users: ['users'],
  system: ['config'],
  financial: [], // Self-contained
  marketplaces: [], // Self-contained
  'garment-gallery': [], // Self-contained - manages its own data fetching
};

// Cache TTL in ms (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

interface AdminDataState {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  coupons: Coupon[];
  campaigns: Campaign[];
  assets: Asset[];
  orders: Order[];
  users: UserProfile[];
  guides: SizeGuide[];
  suppliers: Supplier[];
  config: StoreConfig;
}

const DEFAULT_CONFIG: StoreConfig = {
  brand_name: '',
  about_us: { pt: '', en: '' },
  about_us_image: '',
  terms_of_service: { pt: '', en: '' },
  privacy_policy: { pt: '', en: '' },
  financial_settings: {
    fixed_monthly: 0,
    infra_tech: 0,
    monthly_sales_vol: 0,
    das_mei: 0,
    marketing_fixed: 0,
    packaging_cost: 0,
    avg_freight_cost: 0
  }
};

type DataKey = keyof Omit<AdminDataState, 'config'> | 'config';

export function useAdminData(activeTab: AdminTab) {
  const [data, setData] = useState<AdminDataState>({
    products: [],
    categories: [],
    collections: [],
    banners: [],
    coupons: [],
    campaigns: [],
    assets: [],
    orders: [],
    users: [],
    guides: [],
    suppliers: [],
    config: DEFAULT_CONFIG
  });

  const [isLoading, setIsLoading] = useState(false);
  // Use refs instead of state to avoid infinite loops
  const loadedKeysRef = useRef<Set<DataKey>>(new Set());
  const cacheTimestamps = useRef<Map<DataKey, number>>(new Map());
  const fetchingRef = useRef<boolean>(false);

  // Data fetchers - memoized once
  const fetchersRef = useRef<Record<DataKey, () => Promise<unknown>>>({
    products: () => productsApi.getAllAdmin(),
    categories: () => storeApi.getAllCategoriesAdmin(),
    collections: () => collectionsApi.getAllAdmin(),
    banners: () => bannersApi.getAllAdmin(),
    coupons: () => couponsApi.getAllAdmin(),
    campaigns: () => marketingApi.getCampaigns(),
    assets: () => assetsApi.getAllAdmin(),
    orders: () => ordersApi.getAllAdmin(),
    users: () => usersApi.getAll(),
    guides: () => guidesApi.getAllAdmin(),
    suppliers: () => suppliersApi.getAll(),
    config: () => storeApi.getConfigAdmin(),
  });

  const isCacheValid = useCallback((key: DataKey): boolean => {
    const timestamp = cacheTimestamps.current.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  }, []);

  const fetchDataKeys = useCallback(async (keys: DataKey[], force = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;

    // Filter out already loaded and valid cached keys
    const keysToFetch = force
      ? keys
      : keys.filter(key => !loadedKeysRef.current.has(key) || !isCacheValid(key));

    if (keysToFetch.length === 0) return;

    fetchingRef.current = true;
    setIsLoading(true);

    try {
      const results = await Promise.all(
        keysToFetch.map(async (key) => {
          try {
            const result = await fetchersRef.current[key]();
            return { key, result, success: true };
          } catch (error) {
            logger.error(`Admin fetch error for ${key}:`, error);
            return { key, result: null, success: false };
          }
        })
      );

      const now = Date.now();

      setData(prevData => {
        const newData = { ...prevData };
        for (const { key, result, success } of results) {
          if (success && result !== null) {
            if (key === 'config') {
              newData.config = result as StoreConfig || DEFAULT_CONFIG;
            } else {
              (newData as Record<string, unknown>)[key] = result;
            }
            cacheTimestamps.current.set(key, now);
          }
        }
        return newData;
      });

      // Update loadedKeys ref (doesn't trigger re-render)
      for (const { key, success } of results) {
        if (success) loadedKeysRef.current.add(key);
      }
    } catch (error) {
      logger.error('Admin fetch error:', error);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [isCacheValid]);

  // Load data for active tab
  useEffect(() => {
    const requiredKeys = TAB_DATA_REQUIREMENTS[activeTab] as DataKey[] | undefined;
    if (requiredKeys && requiredKeys.length > 0) {
      fetchDataKeys(requiredKeys);
    }
  }, [activeTab, fetchDataKeys]);

  // Force refresh all data for current tab
  const refreshCurrentTab = useCallback(async () => {
    const requiredKeys = TAB_DATA_REQUIREMENTS[activeTab] as DataKey[] | undefined;
    if (requiredKeys && requiredKeys.length > 0) {
      await fetchDataKeys(requiredKeys, true);
    }
  }, [activeTab, fetchDataKeys]);

  // Refresh specific data keys
  const refreshKeys = useCallback(async (keys: DataKey[]) => {
    await fetchDataKeys(keys, true);
  }, [fetchDataKeys]);

  // Update local state (for optimistic updates)
  const updateData = useCallback(<K extends keyof AdminDataState>(
    key: K,
    updater: (prev: AdminDataState[K]) => AdminDataState[K]
  ) => {
    setData(prev => ({
      ...prev,
      [key]: updater(prev[key])
    }));
  }, []);

  // Clear cache and reload
  const invalidateCache = useCallback(() => {
    cacheTimestamps.current.clear();
    loadedKeysRef.current = new Set();
  }, []);

  // Legacy setters for backward compatibility
  const setProducts = useCallback((p: Product[] | ((prev: Product[]) => Product[])) => {
    setData(prev => ({ ...prev, products: typeof p === 'function' ? p(prev.products) : p }));
  }, []);

  const setCategories = useCallback((c: Category[] | ((prev: Category[]) => Category[])) => {
    setData(prev => ({ ...prev, categories: typeof c === 'function' ? c(prev.categories) : c }));
  }, []);

  const setCollections = useCallback((c: Collection[] | ((prev: Collection[]) => Collection[])) => {
    setData(prev => ({ ...prev, collections: typeof c === 'function' ? c(prev.collections) : c }));
  }, []);

  const setBanners = useCallback((b: Banner[] | ((prev: Banner[]) => Banner[])) => {
    setData(prev => ({ ...prev, banners: typeof b === 'function' ? b(prev.banners) : b }));
  }, []);

  const setCoupons = useCallback((c: Coupon[] | ((prev: Coupon[]) => Coupon[])) => {
    setData(prev => ({ ...prev, coupons: typeof c === 'function' ? c(prev.coupons) : c }));
  }, []);

  const setAssets = useCallback((a: Asset[] | ((prev: Asset[]) => Asset[])) => {
    setData(prev => ({ ...prev, assets: typeof a === 'function' ? a(prev.assets) : a }));
  }, []);

  const setOrders = useCallback((o: Order[] | ((prev: Order[]) => Order[])) => {
    setData(prev => ({ ...prev, orders: typeof o === 'function' ? o(prev.orders) : o }));
  }, []);

  const setUsers = useCallback((u: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => {
    setData(prev => ({ ...prev, users: typeof u === 'function' ? u(prev.users) : u }));
  }, []);

  const setSizeGuides = useCallback((g: SizeGuide[] | ((prev: SizeGuide[]) => SizeGuide[])) => {
    setData(prev => ({ ...prev, guides: typeof g === 'function' ? g(prev.guides) : g }));
  }, []);

  const setSuppliers = useCallback((s: Supplier[] | ((prev: Supplier[]) => Supplier[])) => {
    setData(prev => ({ ...prev, suppliers: typeof s === 'function' ? s(prev.suppliers) : s }));
  }, []);

  const setConfig = useCallback((c: StoreConfig | ((prev: StoreConfig) => StoreConfig)) => {
    setData(prev => ({ ...prev, config: typeof c === 'function' ? c(prev.config) : c }));
  }, []);

  const setCampaigns = useCallback((c: Campaign[] | ((prev: Campaign[]) => Campaign[])) => {
    setData(prev => ({ ...prev, campaigns: typeof c === 'function' ? c(prev.campaigns) : c }));
  }, []);

  return {
    ...data,
    sizeGuides: data.guides, // Alias for backward compatibility
    isLoading,
    refreshCurrentTab,
    refreshKeys,
    updateData,
    invalidateCache,
    isDataLoaded: (key: DataKey) => loadedKeysRef.current.has(key) && isCacheValid(key),
    // Legacy setters
    setProducts,
    setCategories,
    setCollections,
    setBanners,
    setCoupons,
    setAssets,
    setOrders,
    setUsers,
    setSizeGuides,
    setSuppliers,
    setConfig,
    setCampaigns,
    // Legacy fetchData method (refreshes current tab)
    fetchData: refreshCurrentTab,
  };
}
