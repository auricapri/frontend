
import React, { useMemo } from 'react';
import { Collection, Product, UserMode, Category } from '../../types';
import { Locale } from '../../i18n';
import { ArrowLeft } from 'lucide-react';
import { filterProductsForMode } from '../../utils/product';
import { ProductCard } from './ProductCard';
import { CountdownBadge, useCollectionAvailability } from '../ui/CountdownBadge';

interface CollectionDetailProps {
  collection: Collection;
  products: Product[];
  categories: Category[];
  userMode: UserMode;
  onSelectProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onBack: () => void;
  locale: Locale;
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({
  collection,
  products,
  categories,
  userMode,
  onSelectProduct,
  wishlistIds,
  onToggleWishlist,
  onBack,
  locale,
}) => {
  // Check if collection is available (started and not expired)
  const { isAvailable, isExpired } = useCollectionAvailability(
    collection.starts_at,
    collection.ends_at
  );

  // If collection expired, redirect back
  React.useEffect(() => {
    if (isExpired) {
      onBack();
    }
  }, [isExpired, onBack]);

  // Helper robusto para extrair texto localizado
  const getLoc = (obj: any): string => {
    if (obj === null || obj === undefined) return "";

    // Se for string, verifica se é um JSON encodado (comum em migrações de banco)
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{') || obj.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(obj);
          // Chamada recursiva para extrair do objeto parseado
          return getLoc(parsed);
        } catch {
          return obj;
        }
      }
      return obj;
    }

    // Se for objeto, tenta as chaves de idioma
    if (typeof obj === 'object') {
      const val = obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'];
      if (typeof val === 'string') return val;

      // Fallback: pega o primeiro valor que seja string
      const firstString = Object.values(obj).find(v => typeof v === 'string');
      return (firstString as string) || "";
    }

    return String(obj);
  };

  const collectionProducts = useMemo(() => {
    if (!collection?.id) return [];
    // First filter by mode (atacado filters variants with stock < 10)
    const modeFiltered = filterProductsForMode(products, userMode);
    return modeFiltered.filter(p => {
      const ids = p.collection_ids || [];
      return ids.some(id => String(id) === String(collection.id));
    });
  }, [products, collection.id, userMode]);

  // Don't render if expired (safety check while redirect happens)
  if (isExpired) {
    return null;
  }

  return (
    <div className="w-full bg-white min-h-screen">

      {/* Collection Countdown Banner - positioned below header */}
      {collection.ends_at && (
        <div className="fixed top-20 left-0 right-0 z-40">
          <CountdownBadge
            endsAt={collection.ends_at}
            startsAt={collection.starts_at}
            variant="banner"
            locale={locale}
          />
        </div>
      )}

      {/* Banner Section - add top padding when countdown is visible */}
      <div className={`relative w-full h-[60vh] md:h-[70vh] bg-neutral-900 overflow-hidden ${collection.ends_at ? 'mt-12' : ''}`}>
        <div className="absolute inset-0 z-0">
          <img
            src={collection.image_url}
            alt={getLoc(collection.name)}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        {/* Back Button Overlay */}
        <div className="absolute top-24 left-6 md:left-12 z-20">
           <button onClick={onBack} className="flex items-center gap-3 text-white/80 hover:text-white transition-colors group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Voltar</span>
           </button>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-20 text-white animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <span className="text-[10px] font-black uppercase tracking-[0.6em] mb-4 text-white/60">Coleção Exclusiva</span>
          <h1 className="text-5xl md:text-8xl font-light tracking-tighter uppercase leading-[0.85] mb-8">
            {getLoc(collection.name)}
          </h1>
          {collection.description && (
            <p className="max-w-2xl text-sm md:text-base font-medium text-white/80 leading-relaxed">
              {getLoc(collection.description)}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-6 md:px-12 py-24 md:py-32">
        <div className="flex items-end justify-between mb-16 border-b border-neutral-100 pb-8">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
             {collectionProducts.length} Peças Curadas
           </span>
        </div>

        {collectionProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <p className="text-xs font-black uppercase tracking-widest text-neutral-300">Nenhum produto nesta coleção ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4">
            {collectionProducts.map(p => {
              const categoryName = getLoc(categories?.find(c => c.id === p.category_id)?.name);
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  userMode={userMode}
                  locale={locale}
                  variant="grid"
                  showWishlist={true}
                  showQuickAdd={false}
                  showDiscountBadge={true}
                  showColorSwatches={true}
                  showCategory={true}
                  categoryName={categoryName}
                  isWishlisted={wishlistIds.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onClick={() => onSelectProduct(p)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetail;
