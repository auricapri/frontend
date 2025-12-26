
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar, Footer } from './src/components/layout';
import { Hero, LoyaltyBanner, AboutUs } from './src/components/shared';
import { ProductGrid, ProductDetail, CollectionDetail } from './src/components/product';
import { CartDrawer, WishlistDrawer, CouponsDrawer } from './src/components/cart';
import { AuthDrawer } from './src/components/auth';
import { CheckoutView, AddressData } from './src/components/checkout';
import { AdminDashboard } from './src/components/admin';
import { OrderResultOverlay, OrderReceipt } from './src/components/orders';
import { Toast } from './src/components/ui';
import { NotFoundPage } from './src/pages/NotFoundPage';
import { ResetPasswordPage } from './src/pages/ResetPasswordPage';
import SharedWishlistPage from './src/pages/SharedWishlistPage';
import { Product, CartItem, UserMode, UserProfile, Category, Collection, Banner, StoreConfig, Coupon, Asset, InternalLogisticsInfo, Order, SavedAddress, SavedCard, SizeGuide } from './src/types';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { Locale, translations } from './src/i18n';
import { supabase } from './src/utils/supabase';
import { useStoreData } from './src/hooks/useStoreData';
import { useAuth } from './src/hooks/useAuth';
import { useWishlist } from './src/hooks/useWishlist';
import { OrdersApi } from './src/api/orders.api';
import { UsersApi } from './src/api/users.api';
import { ProductsApi } from './src/api/products.api';

export const App: React.FC = () => {
  console.log('App: Component rendering...');
  
  const [locale, setLocale] = useState<Locale>('pt');
  const [userMode, setUserMode] = useState<UserMode>(UserMode.RETAIL);
  
  // Use hooks for data fetching
  const { 
    products, 
    categories, 
    collections, 
    banners, 
    coupons, 
    assets, 
    sizeGuides, 
    storeConfig, 
    isLoading,
    refetch: refetchStoreData
  } = useStoreData();
  
  const { currentUser, isLoading: isAuthLoading, signIn, signUp, signOut } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist(currentUser?.id);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'info' | 'error' }>({ message: '', visible: false });

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
      setToast({ message, visible: true, type });
  };

  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));

  // Order Result State for Animation
  const [orderResult, setOrderResult] = useState<{ status: 'success' | 'error', orderId?: string, message?: string, fullOrder?: Order } | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);
  
  // Loyalty Banner State
  const [loyaltyBanner, setLoyaltyBanner] = useState<{ visible: boolean, level: number, reward: number, code: string, expires: string }>({ visible: false, level: 0, reward: 0, code: '', expires: '' });

  const [pendingCheckout, setPendingCheckout] = useState(false);

  // Helper to extract product slug from URL
  const extractProductSlug = (pathname: string): string | null => {
    const match = pathname.match(/^\/product\/(.+)$/);
    return match ? match[1] : null;
  };

  // Helper to get product slug in current locale
  const getProductSlug = (product: Product, locale: Locale): string => {
    if (!product.slug) return product.id;
    if (typeof product.slug === 'string') return product.slug;
    return product.slug[locale] || product.slug['pt'] || product.slug['en'] || product.id;
  };

  // Initialize view from URL
  const getViewFromPath = (pathname: string): 'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about' | 'reset-password' | 'shared-wishlist' | '404' => {
    if (pathname === '/admin') return 'admin';
    if (pathname === '/checkout') return 'checkout';
    if (pathname === '/receipt') return 'receipt';
    if (pathname === '/about') return 'about';
    if (pathname === '/reset-password') return 'reset-password';
    if (pathname.startsWith('/wishlist/')) return 'shared-wishlist';
    if (pathname.startsWith('/product')) return 'product';
    if (pathname.startsWith('/collection')) return 'collection';
    if (pathname === '/') return 'home';
    // If path doesn't match any route, return 404
    return '404';
  };

  const [currentView, setCurrentView] = useState<'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about' | 'reset-password' | 'shared-wishlist' | '404'>(() => {
    return getViewFromPath(window.location.pathname);
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [lastSuccessOrder, setLastSuccessOrder] = useState<Order | null>(null);

  const mainRef = useRef<HTMLElement>(null);

  // Load product from slug in URL
  const productsApi = new ProductsApi();
  const loadProductFromSlug = useCallback(async (slug: string) => {
    try {
      const product = await productsApi.getBySlug(slug);
      if (product) {
        setActiveProduct(product);
      } else {
        // Product not found, redirect to 404
        setCurrentView('404');
      }
    } catch (error) {
      console.error('Error loading product from slug:', error);
      setCurrentView('404');
    }
  }, []);

  // Listen to URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromPath(window.location.pathname);
      setCurrentView(view);
      
      // If product view, try to load product from URL
      if (view === 'product') {
        const slug = extractProductSlug(window.location.pathname);
        if (slug) {
          loadProductFromSlug(slug);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadProductFromSlug]);

  // Load product from URL on mount or when URL changes to product view
  useEffect(() => {
    if (currentView === 'product') {
      const slug = extractProductSlug(window.location.pathname);
      if (slug && (!activeProduct || getProductSlug(activeProduct, locale) !== slug)) {
        loadProductFromSlug(slug);
      }
    }
  }, [currentView, locale, activeProduct, loadProductFromSlug]);

  // Check admin access when navigating to admin view
  useEffect(() => {
    if (currentView === 'admin') {
      // Wait for auth to finish loading before checking
      if (isAuthLoading) {
        return; // Don't do anything while auth is loading
      }
      
      if (!currentUser) {
        // Not logged in, redirect to home and open auth drawer
        setCurrentView('home');
        window.history.pushState({ view: 'home' }, '', '/');
        setIsAuthOpen(true);
        if (typeof showToast === 'function') {
          showToast('Você precisa estar logado para acessar o admin.', 'error');
        }
      } else {
        // Check if user is admin (check both role and is_admin for compatibility)
        const isAdmin = currentUser.role === 'admin' || (currentUser as any).is_admin === true;
        
        if (!isAdmin) {
          // Logged in but not admin, redirect to home
          setCurrentView('home');
          window.history.pushState({ view: 'home' }, '', '/');
          if (typeof showToast === 'function') {
            showToast('Acesso negado. Apenas administradores podem acessar esta área.', 'error');
          }
        }
      }
    }
  }, [currentView, currentUser, isAuthLoading]);

  // Auth state is managed by useAuth hook
  // No need for manual session management here

  // Check for pending rewards on load/user change
  useEffect(() => {
      if (currentUser?.loyalty?.pending_reward_coupon) {
          const reward = currentUser.loyalty.pending_reward_coupon;
          setLoyaltyBanner({
              visible: true,
              level: reward.level_reached,
              reward: reward.value,
              code: reward.code,
              expires: reward.expires_at
          });
      }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && pendingCheckout) {
      setPendingCheckout(false);
      handleNavigate('checkout');
    }
  }, [currentUser, pendingCheckout]);

  // Store data is managed by useStoreData hook
  // No need for manual fetching here

  // Remove splash only when home is fully loaded and rendered
  useEffect(() => {
    if (currentView === 'home' && !isLoading && products.length > 0) {
      // Wait a bit to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        console.log('App: Home is ready, removing splash screen');
        document.body.classList.add('loaded');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentView, isLoading, products.length]);

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      if (!result || result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  const exitAdmin = () => {
    setCurrentView('home');
    window.history.pushState({ view: 'home' }, '', '/');
    refetchStoreData();
  };

  const handleNavigate = useCallback((view: 'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about' | 'reset-password' | '404', targetSection?: string, product?: Product) => {
    setCurrentView(view);
    
    // Update URL based on view (skip for 404 to keep the invalid URL visible)
    if (view !== '404') {
      let path = '';
      
      if (view === 'product' && product) {
        // Include product slug in URL
        const slug = getProductSlug(product, locale);
        path = `/product/${slug}`;
      } else {
        const routes: Record<Exclude<typeof view, '404'>, string> = {
          home: '/',
          product: '/product',
          collection: '/collection',
          admin: '/admin',
          checkout: '/checkout',
          receipt: '/receipt',
          about: '/about',
          'reset-password': '/reset-password'
        };
        path = routes[view as Exclude<typeof view, '404'>] || '/';
      }
      
      window.history.pushState({ view }, '', path);
    }
    
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (view === 'home') {
      setIsScrolled(false);
      if (!targetSection) {
        setActiveProduct(null);
        setActiveCollection(null);
      }
    }
    
    setTimeout(() => {
      if (view === 'home' && targetSection) {
        const el = document.getElementById(targetSection);
        if (el && mainRef.current) {
          mainRef.current.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
        }
      }
    }, 100);
  }, []);

  const validateCartStock = (): { valid: boolean; error?: string } => {
      const requiredAssets: Record<string, number> = {};

      for (const item of cartItems) {
          const product = products.find(p => p.id === item.product_id);
          const variant = product?.variants?.find(v => v.id === item.variant_id);
          
          if (!variant) continue;

          if (item.quantity > variant.stock_quantity) {
              return { valid: false, error: `Estoque insuficiente para o produto: ${typeof item.name === 'string' ? item.name : (item.name as any).pt}` };
          }

          if (variant.correlated_assets) {
              variant.correlated_assets.forEach(link => {
                  const totalNeeded = link.quantity_required * item.quantity;
                  requiredAssets[link.asset_id] = (requiredAssets[link.asset_id] || 0) + totalNeeded;
              });
          }
      }

      for (const [assetId, qty] of Object.entries(requiredAssets)) {
          const asset = assets.find(a => a.id === assetId);
          if (!asset) {
              return { valid: false, error: `Erro interno: Insumo necessário não encontrado.` };
          }
          if (qty > asset.stock_quantity) {
              return { valid: false, error: `Não há estoque suficiente do insumo: ${asset.name}. Necessário: ${qty}, Disponível: ${asset.stock_quantity}.` };
          }
      }

      return { valid: true };
  };

  const handleCheckoutIntent = () => {
    const stockCheck = validateCartStock();
    if (!stockCheck.valid) {
        showToast(stockCheck.error || "Erro de validação de estoque.", "error");
        return;
    }

    setIsCartOpen(false);
    if (!currentUser) {
      setPendingCheckout(true);
      setIsAuthOpen(true);
    } else {
      handleNavigate('checkout');
    }
  };

  // --- HANDLE PLACE ORDER (SUPABASE INSERT + LOYALTY LOGIC) ---
  const handlePlaceOrder = async (
      addressData: AddressData, 
      logisticsInfo: InternalLogisticsInfo, 
      paymentMethod: 'credit_card' | 'pix', 
      finalAmount: number,
      saveCard: boolean,
      cardToken?: string
  ) => {
    if (cartItems.length === 0) return;
    setIsProcessingOrder(true);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const ordersApi = new OrdersApi();
    const usersApi = new UsersApi();

    try {
      // Save payment method if needed (this should be moved to backend later)
      if (currentUser && paymentMethod === 'credit_card' && saveCard && !cardToken) {
          // TODO: Implement payment method saving via API
          console.log('Payment method saving not yet implemented via API');
      }

      // Create order via API (backend handles address, stock, and loyalty)
      const orderData = await ordersApi.create({
        items: cartItems,
        addressData,
        logisticsInfo,
        paymentMethod,
        subtotal,
        finalAmount
      });

      // Success Data
      const fullOrder: Order = { 
          ...orderData, 
          items: cartItems, 
          total: finalAmount, 
          subtotal: subtotal, 
          discount_amount: subtotal - finalAmount,
          payment_method: paymentMethod
      }; 
      setLastSuccessOrder(fullOrder);
      
      setCartItems([]);
      refetchStoreData();
      
      // Refresh user profile to get updated loyalty data
      if (currentUser) {
        // The useAuth hook will automatically refresh on next render
        // But we can trigger a manual refresh if needed
      }
      
      setOrderResult({ status: 'success', orderId: orderData.id, fullOrder: fullOrder });

    } catch (err: any) {
      console.error(err);
      setOrderResult({ status: 'error', message: err.message });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleCloseOrderResult = () => {
      const wasSuccess = orderResult?.status === 'success';
      const order = orderResult?.fullOrder;
      setOrderResult(null);
      
      if (wasSuccess && order) {
          handleNavigate('receipt'); 
      }
  };

  const addToCart = useCallback((cartItem: CartItem) => {
    const product = products.find(p => p.id === cartItem.product_id);
    const variant = product?.variants?.find(v => v.id === cartItem.variant_id);
    const maxStock = variant?.stock_quantity || 0;
    
    if (cartItem.quantity > maxStock) {
        showToast("Estoque insuficiente.", "error");
        return;
    }
    const existingItem = cartItems.find(item => item.variant_id === cartItem.variant_id);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    if (currentQtyInCart + cartItem.quantity > maxStock) {
        showToast(`Limite atingido!`, "error");
        return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.variant_id === cartItem.variant_id);
      if (existing) {
        return prev.map(item => item.variant_id === cartItem.variant_id 
          ? { ...item, quantity: item.quantity + cartItem.quantity } 
          : item
        );
      }
      return [...prev, cartItem];
    });
    setIsCartOpen(true);
  }, [products, cartItems]);

  const handleUpdateQuantity = (id: string, delta: number) => {
      setCartItems(prev => {
          return prev.map(item => {
              if (item.variant_id === id) {
                  const product = products.find(p => p.id === item.product_id);
                  const variant = product?.variants?.find(v => v.id === item.variant_id);
                  const maxStock = variant?.stock_quantity || 0;
                  if (delta > 0 && item.quantity + delta > maxStock) {
                      showToast(`Estoque máximo atingido.`, "error");
                      return item; 
                  }
                  return { ...item, quantity: Math.max(1, item.quantity + delta) };
              }
              return item;
          });
      });
  };

  const handleToggleWishlist = async (id: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    await toggleWishlist(id);
  };

  const handleBuyAllWishlist = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const wishlistedProducts = products.filter(p => wishlistIds.includes(p.id));
    wishlistedProducts.forEach(product => {
      const variant = product.variants?.[0];
      if (variant) {
        addToCart({
          variant_id: variant.id,
          product_id: product.id,
          name: product.name,
          image: variant.variant_images[0] || product.base_images[0],
          size: variant.size || 'N/A',
          color_name: variant.color_name,
          color_hex: variant.color_hex || '#000',
          price: userMode === UserMode.RETAIL ? variant.retail_price : variant.wholesale_price,
          quantity: 1,
          sku: variant.sku
        });
      }
    });
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 20);
  };

  const handleCloseLoyaltyBanner = async () => {
      setLoyaltyBanner(prev => ({ ...prev, visible: false }));
      // Dismiss pending reward flag via API
      if (currentUser) {
          try {
              const updatedLoyalty = {
                  ...(currentUser.loyalty || {}),
                  pending_reward_coupon: null
              };
              const usersApi = new UsersApi();
              await usersApi.updateLoyalty(updatedLoyalty);
          } catch(e) { console.error("Dismiss reward failed", e); }
      }
  };

  const handleLoyaltyBannerClick = () => {
      handleCloseLoyaltyBanner();
      setIsCouponsOpen(true);
  };

  if (currentView === '404') {
    return <NotFoundPage locale={locale} onNavigate={handleNavigate} t={t} />;
  }

  if (currentView === 'reset-password') {
    return <ResetPasswordPage locale={locale} onNavigate={handleNavigate} t={t} />;
  }

  if (currentView === 'admin') {
    return <AdminDashboard onLogout={exitAdmin} t={t} locale={locale} onProductChange={refetchStoreData} />;
  }

  if (currentView === 'receipt' && lastSuccessOrder) {
      return <OrderReceipt order={lastSuccessOrder} onBack={() => handleNavigate('home')} t={t} locale={locale} />;
  }

  if (currentView === 'about') {
    return <AboutUs config={storeConfig} locale={locale} onBack={() => handleNavigate('home')} />;
  }

  if (currentView === 'shared-wishlist') {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];
    return (
      <SharedWishlistPage
        locale={locale}
        t={t}
        userMode={userMode}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        slug={slug}
      />
    );
  }

  return (
    <div className="relative h-dvh w-full bg-white overflow-hidden text-neutral-900 font-sans">
      <Navbar 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCoupons={() => setIsCouponsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        userMode={userMode}
        onToggleMode={() => setUserMode(prev => prev === UserMode.RETAIL ? UserMode.WHOLESALE : UserMode.RETAIL)}
        onNavigate={handleNavigate}
        isScrolled={currentView === 'home' && isScrolled}
        isProductView={currentView === 'product' || currentView === 'checkout' || currentView === 'collection'}
        onBack={() => handleNavigate('home', 'collection')}
        isLoggedIn={!!currentUser}
        t={t}
        currentLocale={locale}
        onChangeLocale={setLocale}
        storeName={storeConfig.brand_name}
      />
      
      <main 
        id="main-scroll-container"
        ref={mainRef} 
        onScroll={handleScroll}
        className={`h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar antialiased relative`}
      >
        {currentView === 'home' && (
          <div className="min-h-full flex flex-col">
            <Hero onNavigate={handleNavigate as any} t={t} banners={banners} locale={locale} isLoading={isLoading} />
            <ProductGrid 
              products={products} 
              categories={categories}
              collections={collections}
              coupons={coupons} // Passing Active Coupons
              userMode={userMode} 
              onSelectProduct={(p) => { setActiveProduct(p); handleNavigate('product', undefined, p); }}
              onSelectCollection={(c) => { setActiveCollection(c); handleNavigate('collection'); }}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              t={t}
              locale={locale}
              isLoading={isLoading}
            />
            <Footer 
              t={t} 
              currentLocale={locale} 
              onChangeLocale={setLocale} 
              storeConfig={storeConfig} 
              onOpenLegal={setLegalView}
              onNavigate={handleNavigate}
            />
            
            <a 
              href="https://wa.me/AURICAPRI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="fixed bottom-10 right-6 p-5 bg-neutral-900 text-white rounded-full shadow-2xl z-40 border border-white/10 hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-in slide-in-from-bottom-10 duration-700"
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          </div>
        )}

        {currentView === 'product' && activeProduct && (
          <ProductDetail 
            product={activeProduct} 
            coupons={coupons} 
            userMode={userMode} 
            onAddToCart={addToCart}
            onBack={() => handleNavigate('home', 'collection')}
            isWishlisted={wishlistIds.includes(activeProduct.id)}
            onToggleWishlist={() => handleToggleWishlist(activeProduct.id)}
            t={t}
            locale={locale}
            currentUser={currentUser}
            onShowToast={showToast}
            sizeGuides={sizeGuides}
          />
        )}

        {currentView === 'collection' && activeCollection && (
          <CollectionDetail
            collection={activeCollection}
            products={products}
            categories={categories}
            userMode={userMode}
            onSelectProduct={(p) => { setActiveProduct(p); handleNavigate('product', undefined, p); }}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onBack={() => handleNavigate('home', 'collection')}
            locale={locale}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutView 
            items={cartItems} 
            currentUser={currentUser}
            onBack={() => handleNavigate('home')} 
            onComplete={handlePlaceOrder} 
            locale={locale} 
            t={t} 
          />
        )}
      </main>

      {/* Global Toast Notification */}
      <Toast 
        message={toast.message} 
        isVisible={toast.visible} 
        onClose={closeToast} 
        type={toast.type}
      />

      {/* Loyalty Banner */}
      <LoyaltyBanner 
        isVisible={loyaltyBanner.visible}
        level={loyaltyBanner.level}
        rewardValue={loyaltyBanner.reward}
        couponCode={loyaltyBanner.code}
        expiresAt={loyaltyBanner.expires}
        onClose={handleCloseLoyaltyBanner}
        onOpenCoupons={handleLoyaltyBannerClick}
        locale={locale}
      />

      {/* Global Loading Overlay for Order Processing */}
      {isProcessingOrder && (
          <div className="fixed inset-0 z-[2000] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-black mb-4" />
              <h3 className="text-xl font-black uppercase tracking-tighter">Processando Pedido</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-2">Não feche esta janela...</p>
          </div>
      )}

      {/* Order Result Animation Overlay */}
      {orderResult && (
          <OrderResultOverlay 
              status={orderResult.status} 
              orderId={orderResult.orderId}
              errorMessage={orderResult.message}
              onClose={handleCloseOrderResult}
              t={t}
              locale={locale}
          />
      )}

      {legalView && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-700 overflow-hidden">
           <header className="h-24 px-12 flex justify-between items-center border-b border-neutral-100">
              <h2 className="text-xl font-black uppercase italic tracking-widest">
                {legalView === 'terms' ? t('footer.terms') : t('footer.privacy')}
              </h2>
              <button onClick={() => setLegalView(null)} className="p-4 bg-neutral-50 rounded-full hover:rotate-90 transition-all">
                <X className="w-6 h-6" />
              </button>
           </header>
           <div className="flex-1 overflow-y-auto p-12 md:p-24 no-scrollbar bg-neutral-50/50">
              <div className="max-w-4xl mx-auto bg-white p-12 md:p-20 rounded-[3rem] shadow-sm border border-neutral-100">
                 <div className="prose prose-neutral max-w-none whitespace-pre-wrap font-medium text-neutral-600 leading-relaxed text-sm">
                   {legalView === 'terms' ? storeConfig.terms_of_service[locale] : storeConfig.privacy_policy[locale]}
                 </div>
              </div>
           </div>
        </div>
      )}

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems} 
        userMode={userMode} 
        onUpdateQuantity={handleUpdateQuantity} 
        onRemoveItem={(id) => setCartItems(prev => prev.filter(i => i.variant_id !== id))} 
        onCheckout={handleCheckoutIntent}
        t={t} 
        locale={locale} 
      />
      <AuthDrawer 
        isOpen={isAuthOpen} 
        onClose={() => { setIsAuthOpen(false); setPendingCheckout(false); }} 
        user={currentUser} 
        onLogin={async (user) => {
          // Auth is managed by useAuth hook, this is just for compatibility
          // The hook will automatically update currentUser
        }} 
        onLogout={async () => {
          await signOut();
        }} 
        t={t} 
        locale={locale} 
      />
      <WishlistDrawer
        currentUserId={currentUser?.id} 
        isOpen={isWishlistOpen} 
        onClose={() => setIsWishlistOpen(false)} 
        items={products.filter(p => wishlistIds.includes(p.id))} 
        userMode={userMode} 
        onRemoveItem={async (id) => {
          await toggleWishlist(id);
        }} 
        onSelectProduct={(p) => { setActiveProduct(p); handleNavigate('product', undefined, p); }} 
        onBuyAll={handleBuyAllWishlist}
        t={t} 
        locale={locale} 
      />
      <CouponsDrawer 
        isOpen={isCouponsOpen} 
        onClose={() => setIsCouponsOpen(false)} 
        t={t}
        // Inject user coupons if needed, here we rely on CouponDrawer fetching or passed props
      />
    </div>
  );
};
