import React, { useMemo } from 'react';
import CollectionDetail from '../components/product/CollectionDetail';
import { Collection, Product, Category, UserMode } from '../types';
import { Locale } from '../i18n';
import { SEOHead, createCollectionSchema, createBreadcrumbSchema } from '../components/seo';
import { createGetLoc } from '../utils/localization';

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
  const getLoc = useMemo(() => createGetLoc(locale), [locale]);

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

  // Build breadcrumb schema: Home > Collection
  const breadcrumbSchema = useMemo(() => {
    return createBreadcrumbSchema([
      { name: 'Home', url: 'https://www.auricapri.com.br/' },
      { name: collectionName, url: `https://www.auricapri.com.br/collection/${collection.slug}` },
    ]);
  }, [collectionName, collection.slug]);

  // Combine schemas into array
  const schemas = useMemo(() => [collectionSchema, breadcrumbSchema], [collectionSchema, breadcrumbSchema]);

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
        locale={locale}
        schema={schemas}
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

