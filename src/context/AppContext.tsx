import React, { createContext, useContext, ReactNode } from 'react';
import { Product, Category, Collection, Banner, Coupon, Asset, SizeGuide, StoreConfig, UserMode } from '../types';
import { Locale } from '../i18n';
import { useStoreData } from '../hooks/useStoreData';

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

  return (
    <AppContext.Provider
      value={{
        ...storeData,
        locale,
        setLocale,
        userMode,
        setUserMode,
        refetchStoreData: storeData.refetch
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

