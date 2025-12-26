
import React, { useMemo } from 'react';
import { Collection, Product, UserMode, Category } from '../../types';
import { Locale } from '../../i18n';
import { Heart, ArrowLeft } from 'lucide-react';

interface CollectionDetailProps {
  collection: Collection;
  products: Product[];
  categories: Category[]; // Added to resolve missing type in Product Card
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
        } catch (e) {
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
    return products.filter(p => {
      const ids = p.collection_ids || [];
      return ids.some(id => String(id) === String(collection.id));
    });
  }, [products, collection.id]);

  return (
    <div className="w-full bg-white min-h-screen">
      
      {/* Banner Section */}
      <div className="relative w-full h-[60vh] md:h-[70vh] bg-neutral-900 overflow-hidden">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-24">
            {collectionProducts.map(p => {
              const mainVariant = p.variants?.[0];
              const price = userMode === UserMode.RETAIL ? mainVariant?.retail_price : mainVariant?.wholesale_price;
              const displayImg = p.default_image_url || p.base_images[0];
              const isWishlisted = wishlistIds.includes(p.id);
              
              return (
                <div key={p.id} onClick={() => onSelectProduct(p)} className="cursor-pointer group flex flex-col relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-neutral-100">
                    <img src={displayImg} alt={getLoc(p.name)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleWishlist(p.id); }} 
                      className={`absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all transform hover:scale-110 active:scale-90 ${isWishlisted ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'}`}
                    >
                      <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-900 mb-1 leading-tight">{getLoc(p.name)}</h3>
                      {categories && (
                         <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                            {getLoc(categories.find(c => c.id === p.category_id)?.name)}
                         </p>
                      )}
                    </div>
                    <span className="text-[11px] font-black text-neutral-900 tracking-tighter">${price || '---'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetail;
