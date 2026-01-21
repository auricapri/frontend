import React, { useMemo } from 'react';
import { ProductDetail } from '../components/product';
import { Product, Coupon, UserMode, UserProfile, SizeGuide } from '../types';
import { Locale } from '../i18n';
import { SEOHead, createProductSchema } from '../components/seo';

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
  // Helper to get localized text
  const getLoc = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      return obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'] || '';
    }
    return String(obj);
  };

  // Use first active variant for SEO (most common/default variant)
  const defaultVariant = useMemo(() => {
    const activeVariants = product.variants?.filter(v => v.is_active) || [];
    return activeVariants[0] || product.variants?.[0];
  }, [product.variants]);

  // Generate SEO metadata
  const productName = getLoc(product.name);
  const productDescription = getLoc(product.description);
  const productImage = defaultVariant?.variant_images?.[0] || product.base_images?.[0] || product.default_image_url;

  // Create product schema for rich snippets
  const productSchema = useMemo(() => {
    if (!defaultVariant) return undefined;
    return createProductSchema(product, defaultVariant, locale);
  }, [product, defaultVariant, locale]);

  // Generate SEO title and description
  const seoTitle = t('seo.product.titleTemplate').replace('{productName}', productName);
  const seoDescription = t('seo.product.descriptionTemplate')
    .replace('{productName}', productName)
    .replace('{category}', getLoc(product.name));
  const seoKeywords = t('seo.product.keywords').replace('{category}', getLoc(product.name));

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={productImage}
        type="product"
        schema={productSchema}
      />
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
    </>
  );
};

