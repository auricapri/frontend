import React, { useState, useEffect } from 'react';
import { WishlistApi } from '../api/wishlist.api';
import { ProductsApi } from '../api/products.api';
import { Product, CartItem, AddressData, InternalLogisticsInfo } from '../types';
import { formatCurrency } from '../utils/currency';
import { Locale } from '../i18n';
import CheckoutView from '../components/checkout/CheckoutView';
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
            name: product.name || {},
            image: (variant.variant_images && Array.isArray(variant.variant_images) && variant.variant_images.length > 0)
              ? variant.variant_images[0]
              : (product.base_images && Array.isArray(product.base_images) && product.base_images.length > 0 ? product.base_images[0] : ''),
            size: variant.size || 'N/A',
            color_name: variant.color_name || {},
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
    setShowCheckout(true);
  };

  const handlePlaceOrder = async (
    addressData: AddressData,
    logisticsInfo: InternalLogisticsInfo,
    paymentMethod: 'credit_card' | 'pix',
    finalAmount: number
  ) => {
    if (!slug || !currentUser) return;

    try {
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error('Carrinho vazio');
      }
      
      const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
      
      await wishlistApi.buyAllFromSharedWishlist(slug, {
        addressData,
        logisticsInfo,
        paymentMethod,
        subtotal,
        finalAmount
      });

      alert('Pedido realizado com sucesso! O presente será enviado para o dono da wishlist.');
      onNavigate('home');
    } catch (err: any) {
      alert(`Erro ao realizar pedido: ${err.message}`);
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
        cartItems={Array.isArray(cartItems) ? cartItems : []}
        onPlaceOrder={handlePlaceOrder}
        onBack={() => setShowCheckout(false)}
        t={t}
        locale={locale}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
            Wishlist Compartilhada
          </h1>
          <p className="text-neutral-500">
            Compre todos os itens desta wishlist como presente
          </p>
        </div>

        {!Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400">Esta wishlist está vazia</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {products.map(product => {
                if (!product) return null;
                
                const variant = product.variants && Array.isArray(product.variants) ? product.variants[0] : undefined;
                const price = variant ? calculatePrice(variant, userMode) : 0;
                const image = variant?.variant_images?.[0] || (product.base_images && Array.isArray(product.base_images) ? product.base_images[0] : '') || '';

                return (
                  <div key={product.id || Math.random()} className="flex flex-col">
                    <div className="aspect-[3/4] bg-neutral-50 rounded-2xl overflow-hidden mb-4">
                      <img
                        src={image}
                        alt={getLoc(product.name)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-2">
                      {getLoc(product.name)}
                    </h3>
                    <p className="text-lg font-light">{formatCurrency(price, locale)}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleBuyAll}
                disabled={!currentUser || !Array.isArray(cartItems) || cartItems.length === 0}
                className="px-12 py-4 bg-black text-white rounded-2xl text-sm font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentUser ? 'Comprar Todos os Itens' : 'Faça login para comprar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedWishlistPage;

