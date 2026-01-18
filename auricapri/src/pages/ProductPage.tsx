import React from 'react';
import { ProductDetail } from '../components/product';
import { Product, Coupon, UserMode, UserProfile, SizeGuide } from '../types';
import { Locale } from '../i18n';

interface ProductPageProps {
  product: Product;
  coupons: Coupon[];
  userMode: UserMode;
  isWishlisted: boolean;
  currentUser: UserProfile | null;
  sizeGuides: SizeGuide[];
  onAddToCart: (item: any) => void;
  onBack: () => void;
  onToggleWishlist: (productId: string) => void;
  onShowToast: (message: string, type?: 'info' | 'error') => void;
  t: (key: string) => any;
  locale: Locale;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  coupons,
  userMode,
  isWishlisted,
  currentUser,
  sizeGuides,
  onAddToCart,
  onBack,
  onToggleWishlist,
  onShowToast,
  t,
  locale
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
      onShowToast={onShowToast}
      sizeGuides={sizeGuides}
    />
  );
};

