import React, { useState, useEffect } from 'react';
import { WishlistApi } from '../api/wishlist.api';
import { ProductsApi } from '../api/products.api';
import { Product, CartItem, AddressData, InternalLogisticsInfo } from '../types';
import { formatCurrency } from '../utils/currency';
import { Locale } from '../i18n';
import CheckoutView from '../components/checkout/CheckoutViewV2';
import { UserMode } from '../types';
import { calculatePrice } from '../utils/product';

interface SharedWishlistPageProps {
  locale: Locale;
  t: (key: string) => any;
  userMode: UserMode;
  currentUser: any;
  onNavigate: (view: string) => void;
  slug: string;
}

const SharedWishlistPage: React.FC<SharedWishlistPageProps> = ({
  locale,
  t,
  userMode,
  currentUser,
  onNavigate,
  slug
}) => {
  const [wishlistData, setWishlistData] = useState<{ user_id: string; product_ids: string[] } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [itemsToCheckout, setCheckoutItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const wishlistApi = new WishlistApi();
  const productsApi = new ProductsApi();

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!slug) {
        setError('Slug inválido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await wishlistApi.getSharedWishlist(slug);
        
        if (!data || !data.product_ids || !Array.isArray(data.product_ids)) {
          throw new Error('Dados da wishlist inválidos');
        }
        
        setWishlistData(data);

        // Fetch products (use getAllActive for public access, not getAll which requires admin)
        const allProducts = await productsApi.getAllActive();
        if (!Array.isArray(allProducts)) {
          console.warn('[SharedWishlistPage] getAllActive returned non-array:', allProducts);
          setProducts([]);
          setCartItems([]);
          return;
        }
        
        const wishlistProducts = allProducts.filter(p => p && p.id && data.product_ids.includes(p.id));
        setProducts(wishlistProducts);

        // Build cart items
        const items: CartItem[] = (Array.isArray(wishlistProducts) ? wishlistProducts : []).flatMap(product => {
          if (!product || !product.variants || !Array.isArray(product.variants)) {
            return [];
          }
          
          const variant = product.variants[0];
          if (!variant || variant.stock_quantity === 0) return [];

          return [{
            variant_id: variant.id,
            product_id: product.id,
            name: product.name || { en: '', pt: '' },
            image: (variant.variant_images && Array.isArray(variant.variant_images) && variant.variant_images.length > 0)
              ? variant.variant_images[0]
              : (product.base_images && Array.isArray(product.base_images) && product.base_images.length > 0 ? product.base_images[0] : ''),
            size: variant.size || 'N/A',
            color_name: variant.color_name || { en: '', pt: '' },
            color_hex: variant.color_hex || '#000',
            price: calculatePrice(variant, userMode),
            quantity: 1,
            sku: variant.sku || ''
          }];
        });

        setCartItems(items || []);
      } catch (err: any) {
        console.error('[SharedWishlistPage] Error loading wishlist:', err);
        setError(err?.message || 'Erro ao carregar wishlist');
        setWishlistData(null);
        setProducts([]);
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [slug, userMode]);

  const getLoc = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      return obj[locale] || obj['pt'] || obj['en'] || '';
    }
    return String(obj);
  };

  const handleBuyAll = () => {
    if (!currentUser) {
      alert('Você precisa estar logado para comprar');
      return;
    }
    setCheckoutItems(cartItems);
    setShowCheckout(true);
  };

  const handleBuyItem = (productId: string) => {
    if (!currentUser) {
      alert('Você precisa estar logado para comprar');
      return;
    }
    const item = cartItems.find(i => i.product_id === productId);
    if (item) {
      setCheckoutItems([item]);
      setShowCheckout(true);
    }
  };

  const handlePlaceOrder = async (
    addressData: AddressData,
    logisticsInfo: InternalLogisticsInfo,
    paymentMethod: any,
    finalAmount: number
  ) => {
    if (!slug || !currentUser) return;

    try {
      setIsProcessing(true);
      if (!Array.isArray(itemsToCheckout) || itemsToCheckout.length === 0) {
        throw new Error('Carrinho vazio');
      }
      
      const subtotal = itemsToCheckout.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
      
      // If buying all items, use the buyAll endpoint
      if (itemsToCheckout.length === cartItems.length) {
        await wishlistApi.buyAllFromSharedWishlist(slug, {
          addressData,
          logisticsInfo,
          paymentMethod,
          subtotal,
          finalAmount
        });
      } else {
        // For individual item, we might need a specific endpoint or just pass the ID
        // Assuming buyAll handles a subset if we pass it, but let's check API
        // For now, let's assume buyAll can take specific product IDs if we extend it
        await wishlistApi.buyAllFromSharedWishlist(slug, {
          addressData,
          logisticsInfo,
          paymentMethod,
          subtotal,
          finalAmount,
          productIds: itemsToCheckout.map(i => i.product_id)
        });
      }

      alert('Pedido realizado com sucesso! O presente será enviado para o dono da wishlist.');
      onNavigate('home');
    } catch (err: any) {
      alert(`Erro ao realizar pedido: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Carregando wishlist...</p>
      </div>
    );
  }

  if (error || !wishlistData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-3 text-neutral-900">
              Wishlist Não Encontrada
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-2">
              {error || 'A wishlist que você está procurando não existe ou foi removida.'}
            </p>
            <p className="text-xs text-neutral-400">
              Verifique se o link está correto ou entre em contato com quem compartilhou.
            </p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="px-8 py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-[0.98]"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <CheckoutView
        items={itemsToCheckout}
        onComplete={(address, logistics, method, amount) => handlePlaceOrder(address, logistics, method, amount)}
        onBack={() => setShowCheckout(false)}
        t={t}
        locale={locale}
        currentUser={currentUser}
        userMode={userMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 relative">
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-black" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Processando seu pedido...</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">
            Wishlist Compartilhada
          </h1>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
            Compre itens desta curadoria exclusiva como presente
          </p>
        </div>

        {!Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-100">
            <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Esta wishlist está vazia</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
              {products.map(product => {
                if (!product) return null;
                
                const variant = product.variants && Array.isArray(product.variants) ? product.variants[0] : undefined;
                const price = variant ? calculatePrice(variant, userMode) : 0;
                const image = variant?.variant_images?.[0] || (product.base_images && Array.isArray(product.base_images) ? product.base_images[0] : '') || '';

                return (
                  <div key={product.id || Math.random()} className="flex flex-col group">
                    <div className="aspect-[3/4] bg-neutral-50 rounded-[2.5rem] overflow-hidden mb-6 relative shadow-sm group-hover:shadow-2xl transition-all duration-700">
                      <img
                        src={image}
                        alt={getLoc(product.name)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-8">
                        <button 
                          onClick={() => handleBuyItem(product.id)}
                          className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                        >
                          Presentear Este Item
                        </button>
                      </div>
                    </div>
                    <div className="px-2">
                      <h3 className="text-sm font-black uppercase tracking-tight mb-1 truncate">
                        {getLoc(product.name)}
                      </h3>
                      <p className="text-lg font-light tracking-tighter text-neutral-900">{formatCurrency(price, locale)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center border-t border-neutral-100 pt-20">
              <button
                onClick={handleBuyAll}
                disabled={!currentUser || !Array.isArray(cartItems) || cartItems.length === 0}
                className="px-16 py-8 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex items-center gap-4"
              >
                {currentUser ? (
                  <>Comprar Toda a Curadoria <ArrowRight className="w-4 h-4" /></>
                ) : (
                  'Faça login para comprar'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default SharedWishlistPage;
