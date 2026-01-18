/**
 * HomePage - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { Hero } from '../components/shared';
import { ProductGrid } from '../components/product';
import { Footer } from '../components/layout';
import { Product, Category, Collection, Banner, Coupon, UserMode, StoreConfig } from '../types';
import { Locale, TFunction } from '../i18n';

export interface HomePageProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  coupons: Coupon[];
  userMode: UserMode;
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onSelectCollection: (collection: Collection) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (view: string, section?: string) => void;
  onOpenLegal: (view: 'terms' | 'privacy' | null) => void;
  t: TFunction;
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeConfig: StoreConfig;
  isLoading: boolean;
  onSectionLayout?: (section: string, y: number) => void;
  mainScrollViewRef?: React.RefObject<ScrollView>;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  collections,
  banners,
  coupons,
  userMode,
  wishlistIds,
  onSelectProduct,
  onSelectCollection,
  onToggleWishlist,
  onNavigate,
  onOpenLegal,
  t,
  locale,
  onChangeLocale,
  storeConfig,
  isLoading,
  onSectionLayout,
  mainScrollViewRef,
}) => {

  return (
    <>
      <View
        onLayout={(e) => {
          const { y } = e.nativeEvent.layout;
          if (onSectionLayout) {
            // Use a small delay to ensure layout is stable
            setTimeout(() => {
              onSectionLayout('hero', y);
            }, 0);
          }
        }}
      >
        <Hero
          onNavigate={onNavigate}
          t={t}
          banners={banners}
          locale={locale}
          isLoading={isLoading}
        />
      </View>
      <View
        onLayout={(e) => {
          const { y } = e.nativeEvent.layout;
          if (onSectionLayout) {
            // Use a small delay to ensure layout is stable
            setTimeout(() => {
              onSectionLayout('collection', y);
            }, 0);
          }
        }}
      >
        <ProductGrid
          scrollViewRef={mainScrollViewRef}
          products={products}
          categories={categories}
          collections={collections}
          coupons={coupons}
          userMode={userMode}
          onSelectProduct={onSelectProduct}
          onSelectCollection={onSelectCollection}
          wishlistIds={wishlistIds}
          onToggleWishlist={onToggleWishlist}
          t={t}
          locale={locale}
          isLoading={isLoading}
          onScrollToProducts={(position) => {
            // Store the products grid position for navigation
            if (onSectionLayout) {
              onSectionLayout('products', position);
            }
          }}
        />
      </View>
      <Footer
        t={t}
        currentLocale={locale}
        onChangeLocale={onChangeLocale}
        storeConfig={storeConfig}
        onOpenLegal={onOpenLegal}
        onNavigate={onNavigate}
      />
    </>
  );
};

export default HomePage;

