/**
 * ProductPage Component - React Native
 * Simple wrapper around ProductDetail (to be created)
 */

import React from 'react';
import { ProductDetail } from '../components/product';
import { Product, Coupon, UserMode, UserProfile, SizeGuide, Order, Category } from '../types';
import { Locale } from '../i18n';

interface ProductPageProps {
  product: Product;
  coupons: Coupon[];
  userMode: UserMode;
  isWishlisted: boolean;
  currentUser: UserProfile | null;
  userOrders?: Order[];
  sizeGuides: SizeGuide[];
  onAddToCart: (item: any) => void;
  onBack: () => void;
  onToggleWishlist: (productId: string) => void;
  onShowToast: (message: string, type?: 'info' | 'error') => void;
  t: (key: string) => any;
  locale: Locale;
  products?: Product[];
  categories?: Category[];
  onSelectProduct?: (product: Product) => void;
  wishlistIds?: string[];
  onToggleWishlistProduct?: (productId: string) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  coupons,
  userMode,
  isWishlisted,
  currentUser,
  userOrders = [],
  sizeGuides,
  onAddToCart,
  onBack,
  onToggleWishlist,
  onShowToast,
  t,
  locale,
  products = [],
  categories = [],
  onSelectProduct,
  wishlistIds = [],
  onToggleWishlistProduct
}) => {
  return (
    <ProductDetail 
      product={product} 
      coupons={coupons} 
      userMode={userMode} 
      onAddToCart={onAddToCart}
      onBack={onBack}
      isWishlisted={isWishlisted}
      onToggleWishlist={onToggleWishlist}
      t={t}
      locale={locale}
      currentUser={currentUser}
      userOrders={userOrders}
      onShowToast={onShowToast}
      sizeGuides={sizeGuides}
      products={products}
      categories={categories}
      onSelectProduct={onSelectProduct}
      wishlistIds={wishlistIds}
      onToggleWishlistProduct={onToggleWishlistProduct}
    />
  );
};

export default ProductPage;

