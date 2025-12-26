import React from 'react';
import { CollectionDetail } from '../components/product';
import { Collection, Product, Category, UserMode } from '../types';
import { Locale } from '../i18n';

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
  locale
}) => {
  return (
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
  );
};

