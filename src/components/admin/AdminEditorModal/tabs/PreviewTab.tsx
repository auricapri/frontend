import React from 'react';
import { Monitor } from 'lucide-react';
import { Product, Category, Collection, UserMode, SizeGuide } from '../../../../types';
import { Locale } from '../../../../i18n';
import ProductDetail from '../../../product/ProductDetail';
import { Hero } from '../../../shared';
import CollectionDetail from '../../../product/CollectionDetail';

interface PreviewTabProps {
  type: string;
  data: any;
  products: Product[];
  categories: Category[];
  sizeGuides: SizeGuide[];
  t: (key: string) => string;
  locale: Locale;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({
  type,
  data,
  products,
  categories,
  sizeGuides,
  t,
  locale,
}) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar relative bg-white">
      <div className="absolute top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-2">
        <Monitor className="w-3 h-3" /> Live Preview Mode
      </div>

      {type === 'product' && (
        <div className="min-h-full">
          <ProductDetail
            product={data}
            userMode={UserMode.VAREJO}
            onAddToCart={() => alert("Preview Mode")}
            onBack={() => {}}
            isWishlisted={false}
            onToggleWishlist={() => {}}
            t={t}
            locale={locale}
            currentUser={null}
            sizeGuides={sizeGuides}
          />
        </div>
      )}

      {type === 'banner' && (
        <div className="h-full">
          <Hero
            banners={[data]}
            t={t}
            locale={locale}
            onNavigate={() => {}}
          />
        </div>
      )}

      {type === 'collection' && (
        <div className="min-h-full">
          <CollectionDetail
            collection={data}
            products={products}
            categories={categories}
            userMode={UserMode.VAREJO}
            onSelectProduct={() => {}}
            wishlistIds={[]}
            onToggleWishlist={() => {}}
            onBack={() => {}}
            locale={locale}
          />
        </div>
      )}

      {type === 'category' && (
        <div className="min-h-full">
          <CollectionDetail
            collection={{
              ...data,
              description: { pt: 'Categoria', en: 'Category', es: 'Categoría', fr: 'Catégorie' }
            } as any}
            products={products.map(p =>
              p.category_id === data.id
                ? { ...p, collection_ids: [...(p.collection_ids || []), data.id] }
                : p
            )}
            categories={categories}
            userMode={UserMode.VAREJO}
            onSelectProduct={() => {}}
            wishlistIds={[]}
            onToggleWishlist={() => {}}
            onBack={() => {}}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
};
