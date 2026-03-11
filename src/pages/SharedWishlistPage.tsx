import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { wishlistApi, productsApi } from '../api/instances';
import { SEOHead } from '../components/seo/SEOHead';
import { Product, CartItem, AddressData, InternalLogisticsInfo } from '../types';
import { Locale } from '../i18n';
import CheckoutView from '../components/checkout/CheckoutViewV2';
import { UserMode } from '../types';
import { calculatePrice } from '../utils/product';
import { ProductCard } from '../components/product/ProductCard';

interface SharedWishlistPageProps {
  locale: Locale;
  t: (key: string) => any;
  userMode: UserMode;
  currentUser: any;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  slug: string;
}

const SharedWishlistPage: React.FC<SharedWishlistPageProps> = ({
  locale,
  t,
  userMode,
  currentUser,
  onNavigate,
  onOpenAuth,
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
  const [deliveryInfo, setDeliveryInfo] = useState<{ hasAddress: boolean; city?: string; state?: string } | null>(null);
  const isMounted = useRef(true);

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

        if (!isMounted.current) return;

        if (!data || !data.product_ids || !Array.isArray(data.product_ids)) {
          throw new Error('Dados da wishlist inválidos');
        }

        setWishlistData(data);

        // Fetch delivery info (owner's address city/state)
        try {
          const info = await wishlistApi.getDeliveryInfo(slug);
          if (isMounted.current) setDeliveryInfo(info);
        } catch {
          if (isMounted.current) setDeliveryInfo({ hasAddress: false });
        }

        // Busca apenas os produtos da wishlist por IDs (muito mais eficiente!)
        const wishlistProducts = await productsApi.getByIds(data.product_ids);

        if (!isMounted.current) return;

        if (!Array.isArray(wishlistProducts)) {
          console.warn('[SharedWishlistPage] getByIds returned non-array:', wishlistProducts);
          setProducts([]);
          setCartItems([]);
          return;
        }

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

    isMounted.current = true;
    fetchWishlist();

    return () => {
      isMounted.current = false;
    };
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
      onOpenAuth();
      return;
    }
    if (deliveryInfo && !deliveryInfo.hasAddress) return;
    setCheckoutItems(cartItems);
    setShowCheckout(true);
  };

  const handleBuyItem = (productId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (deliveryInfo && !deliveryInfo.hasAddress) return;
    const item = cartItems.find(i => i.product_id === productId);
    if (item) {
      setCheckoutItems([item]);
      setShowCheckout(true);
    }
  };

  const handlePlaceOrder = async (
    _addressData: AddressData,
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
      const productIds = itemsToCheckout.length < cartItems.length
        ? itemsToCheckout.map(i => i.product_id)
        : undefined;

      // Backend fetches owner's address — addressData from buyer is intentionally ignored
      await wishlistApi.buyAllFromSharedWishlist(slug, {
        addressData: {},
        logisticsInfo,
        paymentMethod,
        subtotal,
        finalAmount,
        productIds,
      });

      onNavigate('home');
    } catch (err: any) {
      console.error('[SharedWishlistPage] handlePlaceOrder error:', err);
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
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-black uppercase tracking-tighter mb-3 text-neutral-900">
              Wishlist Não Encontrada
            </h2>            <p className="text-sm text-neutral-500 leading-relaxed mb-2">
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
    const deliveryLocation = deliveryInfo?.hasAddress && deliveryInfo.city
      ? `${deliveryInfo.city}${deliveryInfo.state ? `, ${deliveryInfo.state}` : ''}`
      : undefined;

    return (
      <CheckoutView
        items={itemsToCheckout}
        onComplete={(address, logistics, method, amount) => handlePlaceOrder(address, logistics, method, amount)}
        onBack={() => setShowCheckout(false)}
        t={t}
        locale={locale}
        currentUser={currentUser}
        userMode={userMode}
        initialStep={2}
        giftDeliveryLocation={deliveryLocation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper pt-24 pb-20 relative">
      <SEOHead
        title="Lista de Desejos | Auricapri"
        description="Confira esta lista de desejos compartilhada da Auricapri."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-paper/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-black" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Processando seu pedido...</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-black uppercase tracking-tighter mb-4 italic">
            Wishlist Compartilhada
          </h1>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
            Compre itens desta curadoria exclusiva como presente
          </p>
          {deliveryInfo?.hasAddress && deliveryInfo.city && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Entrega para:{' '}
              <span className="text-black">
                {deliveryInfo.city}{deliveryInfo.state ? `, ${deliveryInfo.state}` : ''}
              </span>
            </p>
          )}
          {deliveryInfo && !deliveryInfo.hasAddress && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-red-500">
              Atenção: o dono desta wishlist não possui endereço cadastrado. Compras não estão disponíveis no momento.
            </p>
          )}
        </div>

        {!currentUser && (
          <div className="mb-10 rounded-2xl bg-neutral-950 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <GiftIcon className="w-5 h-5 shrink-0 text-neutral-300 mt-0.5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">Entre para presentear</p>
                <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">Faça login ou crie sua conta para comprar qualquer item desta lista</p>
              </div>
            </div>
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto shrink-0 px-6 py-3 bg-paper text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-100 active:scale-95 transition-all"
            >
              Entrar / Criar conta
            </button>
          </div>
        )}

        {!Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-100">
            <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Esta wishlist está vazia</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-20">
              {products.map(product => {
                if (!product) return null;

                return (
                  <div key={product.id || Math.random()} className="relative group">
                    <ProductCard
                      product={product}
                      userMode={userMode}
                      locale={locale}
                      variant="grid"
                      showWishlist={false}
                      showQuickAdd={false}
                      showDiscountBadge={true}
                      showColorSwatches={true}
                    />
                    {/* Gift overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 z-10">
                      <button
                        onClick={() => handleBuyItem(product.id)}
                        className="w-full py-3 bg-paper text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                      >
                        Presentear Este Item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center border-t border-neutral-100 pt-20">
              <button
                onClick={handleBuyAll}
                disabled={!!currentUser && (!Array.isArray(cartItems) || cartItems.length === 0)}
                className="px-16 py-8 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex items-center gap-4"
              >
                {currentUser ? (
                  <>Comprar Toda a Curadoria <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Entre e compre toda a curadoria <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const GiftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

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
