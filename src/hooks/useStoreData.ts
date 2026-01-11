import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, Category, Collection, Banner, Coupon, Asset, SizeGuide, StoreConfig } from '../types';
import { CachedStoreApi } from '../api/cached.store.api';
import { CachedProductsApi } from '../api/cached.products.api';
import { CachedCollectionsApi } from '../api/cached.collections.api';
import { CachedCouponsApi } from '../api/cached.coupons.api';
import { CachedAssetsApi } from '../api/cached.assets.api';
import { logger } from '../utils/logger';

const defaultStoreConfig: StoreConfig = {
  id: 'main',
  brand_name: 'Auricapri',
  about_us: { en: '', pt: '' },
  about_us_image: '',
  terms_of_service: { en: 'Loading...', pt: 'Carregando...' },
  privacy_policy: { en: 'Loading...', pt: 'Carregando...' },
  contact_email: '',
  support_phone: '',
  tax_id: '',
  address: '',
  loyalty_program: {
    enabled: true,
    cashback_percentage: 1,
    xp_per_currency_unit: 10,
    levels: [
      { level: 1, xp_required: 0, reward_coupon_value: 0, reward_description: 'Iniciante' },
      { level: 2, xp_required: 1000, reward_coupon_value: 50, reward_description: 'Bronze Member' },
      { level: 3, xp_required: 5000, reward_coupon_value: 150, reward_description: 'Silver Member' },
      { level: 4, xp_required: 15000, reward_coupon_value: 500, reward_description: 'Gold VIP' },
    ]
  }
};

const productsApi = new CachedProductsApi();
const storeApi = new CachedStoreApi();
const collectionsApi = new CachedCollectionsApi();
const couponsApi = new CachedCouponsApi();
const assetsApi = new CachedAssetsApi();

export const useStoreData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(defaultStoreConfig);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchStoreData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsData, categoriesData, collectionsData, bannersData, configData, relationsData, couponsData, assetsData, guidesData] = await Promise.all([
        productsApi.getAllActive(),
        storeApi.getAllCategories(),
        collectionsApi.getAllActive(),
        storeApi.getAllBanners(),
        storeApi.getConfig(),
        collectionsApi.getCollectionProducts(),
        couponsApi.getAllActive(),
        assetsApi.getAll(),
        storeApi.getAllSizeGuides()
      ]);

      if (!isMounted.current) return;

      const processedProducts = productsData.map(p => {
        const linkedCollectionIds = relationsData
          .filter(r => r.product_id === p.id)
          .map(r => r.collection_id);
        
        return {
          ...p,
          collection_ids: linkedCollectionIds
        };
      });

      setProducts(processedProducts);
      setCategories(categoriesData);
      setCollections(collectionsData);
      setBanners(bannersData);
      setCoupons(couponsData);
      setAssets(assetsData);
      setSizeGuides(guidesData);

      if (configData) {
        const mergedConfig = {
          ...configData,
          loyalty_program: configData.loyalty_program || defaultStoreConfig.loyalty_program
        };
        setStoreConfig(mergedConfig);
        document.title = configData.brand_name;
      }

      setIsLoading(false);

    } catch (err) {
      logger.error('Error fetching store data', err);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchStoreData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchStoreData]);

  return {
    products,
    categories,
    collections,
    banners,
    coupons,
    assets,
    sizeGuides,
    storeConfig,
    isLoading,
    refetch: fetchStoreData
  };
};
