import { useState, useEffect, useCallback } from 'react';
import { ProductsApi } from '../api/products.api';
import { OrdersApi } from '../api/orders.api';
import { UsersApi } from '../api/users.api';
import { StoreApi } from '../api/store.api';
import { CouponsApi } from '../api/coupons.api';
import { CollectionsApi } from '../api/collections.api';
import { AssetsApi } from '../api/assets.api';
import { GuidesApi } from '../api/guides.api';
import { BannersApi } from '../api/banners.api';
import { SuppliersApi } from '../api/suppliers.api';
import type { 
  Product, Category, Collection, Banner, Coupon, Asset, 
  StoreConfig, UserProfile, Order, SizeGuide, Supplier
} from '../types';

export function useAdminData() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [config, setConfig] = useState<StoreConfig>({
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
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const productsApi = new ProductsApi();
      const ordersApi = new OrdersApi();
      const usersApi = new UsersApi();
      const storeApi = new StoreApi();
      const couponsApi = new CouponsApi();
      const collectionsApi = new CollectionsApi();
      const assetsApi = new AssetsApi();
      const guidesApi = new GuidesApi();
      const bannersApi = new BannersApi();
      const suppliersApi = new SuppliersApi();

      const [
        productsData,
        categoriesData,
        collectionsData,
        bannersData,
        couponsData,
        assetsData,
        ordersData,
        usersData,
        configData,
        guidesData,
        suppliersData
      ] = await Promise.all([
        productsApi.getAll(),
        storeApi.getAllCategories(),
        collectionsApi.getAll(),
        bannersApi.getAll(),
        couponsApi.getAll(),
        assetsApi.getAll(),
        ordersApi.getAllAdmin(),
        usersApi.getAll(),
        storeApi.getConfig(),
        guidesApi.getAll(),
        suppliersApi.getAll()
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setCollections(collectionsData);
      setBanners(bannersData);
      setCoupons(couponsData);
      setAssets(assetsData);
      setOrders(ordersData);
      setUsers(usersData);
      if (configData) setConfig(configData);
      setSizeGuides(guidesData);
      setSuppliers(suppliersData);
    } catch (error: unknown) {
      console.error('Admin Fetch Error', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    isLoading,
    products,
    categories,
    collections,
    banners,
    coupons,
    assets,
    orders,
    users,
    sizeGuides,
    suppliers,
    config,
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
    fetchData,
  };
}
