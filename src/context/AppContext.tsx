import React, { createContext, useContext, ReactNode } from 'react';
import { Product, Category, Collection, Banner, Coupon, Asset, SizeGuide, StoreConfig, UserMode } from '../types';
import { Locale } from '../i18n';
import { useStoreData } from '../hooks/useStoreData';
import { useFamiliaCoupon } from '../hooks/useFamiliaCoupon';

interface AppContextType {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  coupons: Coupon[];
  assets: Asset[];
  sizeGuides: SizeGuide[];
  storeConfig: StoreConfig;
  isLoading: boolean;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  refetchStoreData: () => void;
  // Familia coupon
  isFamiliaActive: boolean;
  familiaLoading: boolean;
  familiaError: string | null;
  activeFamiliaCoupon: string | null;
  activateFamiliaCoupon: (code: string) => Promise<void>;
  deactivateFamiliaCoupon: () => void;
  displayProducts: Product[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
}

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  locale,
  setLocale,
  userMode,
  setUserMode
}) => {
  const storeData = useStoreData();
  const familia = useFamiliaCoupon();

  // Quando familia ativo, usar preços de custo nos produtos
  const displayProducts = familia.isFamiliaActive && familia.familiaProducts
    ? familia.familiaProducts
    : storeData.products;

  return (
    <AppContext.Provider
      value={{
        ...storeData,
        locale,
        setLocale,
        userMode,
        setUserMode,
        refetchStoreData: storeData.refetch,
        isFamiliaActive: familia.isFamiliaActive,
        familiaLoading: familia.familiaLoading,
        familiaError: familia.familiaError,
        activeFamiliaCoupon: familia.activeFamiliaCoupon,
        activateFamiliaCoupon: familia.activateFamilia,
        deactivateFamiliaCoupon: familia.deactivateFamilia,
        displayProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
