import React, { useMemo } from 'react';
import { CollectionDetail } from '../components/product';
import { Collection, Product, Category, UserMode } from '../types';
import { Locale } from '../i18n';
import { SEOHead, createCollectionSchema } from '../components/seo';

interface CollectionPageProps {
  collection: Collection;
  products: Product[];
  categories: Category[];
  userMode: UserMode;
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onBack: () => void;
  locale: Locale;
  t?: (key: string) => any; // Optional translation function
}

export const CollectionPage: React.FC<CollectionPageProps> = ({
  collection,
  products,
  categories,
  userMode,
  wishlistIds,
  onSelectProduct,
  onToggleWishlist,
  onBack,
  locale,
  t
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

  // Extract collection metadata
  const collectionName = getLoc(collection.name);
  const collectionDescription = getLoc(collection.description);
  const collectionImage = products[0]?.base_images?.[0] || products[0]?.default_image_url;

  // Create collection schema for rich snippets
  const collectionSchema = useMemo(() => {
    return createCollectionSchema(
      collectionName,
      collectionDescription,
      window.location.href,
      products.length
    );
  }, [collectionName, collectionDescription, products.length]);

  // Generate SEO metadata
  const seoTitle = t ? t('seo.collection.titleTemplate').replace('{collectionName}', collectionName) : `${collectionName} | Auricapri`;
  const seoDescription = t ? t('seo.collection.descriptionTemplate').replace('{collectionName}', collectionName) : collectionDescription;
  const seoKeywords = t ? t('seo.collection.keywords').replace('{collectionName}', collectionName) : `${collectionName}, moda feminina`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={collectionImage}
        type="website"
        schema={collectionSchema}
      />
      <CollectionDetail
        collection={collection}
        products={products}
        categories={categories}
        userMode={userMode}
        onSelectProduct={onSelectProduct}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        onBack={onBack}
        locale={locale}
      />
    </>
  );
};

