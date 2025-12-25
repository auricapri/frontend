
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import CollectionDetail from './components/CollectionDetail';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import CouponsDrawer from './components/CouponsDrawer';
import AuthDrawer from './components/AuthDrawer';
import CheckoutView, { AddressData } from './components/CheckoutView';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import OrderResultOverlay from './components/OrderResultOverlay';
import OrderReceipt from './components/OrderReceipt';
import AboutUs from './components/AboutUs';
import LoyaltyBanner from './components/LoyaltyBanner'; // IMPORT
import Toast from './components/Toast';
import { Product, CartItem, UserMode, UserProfile, Category, Collection, Banner, StoreConfig, Coupon, Asset, InternalLogisticsInfo, Order, SavedAddress, SavedCard, SizeGuide } from './types';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { Locale, translations } from './i18n';
import { supabase } from '../utils/supabase';

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('pt');
  const [userMode, setUserMode] = useState<UserMode>(UserMode.RETAIL);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]); 
  const [assets, setAssets] = useState<Asset[]>([]); 
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]); 
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    id: 'main',
    brand_name: 'Auricapri',
    about_us: { en: '', pt: '' },
    about_us_image: '',
    terms_of_service: { en: 'Loading...', pt: 'Carregando...' },
    privacy_policy: { en: 'Loading...', pt: 'Carregando...' },
    contact_email: '',
    support_phone: '', 
    tax_id: '',        
    address: '',
    // Default Loyalty Config
    loyalty_program: {
        enabled: true,
        cashback_percentage: 1, // 1%
        xp_per_currency_unit: 10, // 10 XP per $1
        levels: [
            { level: 1, xp_required: 0, reward_coupon_value: 0, reward_description: 'Iniciante' },
            { level: 2, xp_required: 1000, reward_coupon_value: 50, reward_description: 'Bronze Member' },
            { level: 3, xp_required: 5000, reward_coupon_value: 150, reward_description: 'Silver Member' },
            { level: 4, xp_required: 15000, reward_coupon_value: 500, reward_description: 'Gold VIP' },
        ]
    }
  });
  const [isLoading, setIsLoading] = useState(true);
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

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const [currentView, setCurrentView] = useState<'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about'>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [lastSuccessOrder, setLastSuccessOrder] = useState<Order | null>(null);

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setWishlistIds([]); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const fetchProfile = async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) {
        let user: UserProfile = profile as UserProfile;
        
        if ((profile as any).default_address_id) {
            const { data: addr } = await supabase.from('addresses').select('*').eq('id', (profile as any).default_address_id).single();
            if (addr) user.default_address = addr as SavedAddress;
        }

        const { data: cards } = await supabase.from('user_payment_methods').select('*').eq('user_id', userId);
        if (cards) user.saved_cards = cards as SavedCard[];

        setCurrentUser(user);
    }
  };

  const fetchStoreData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, collRes, banRes, setRes, relRes, coupRes, assRes, guideRes] = await Promise.all([
        supabase.from('products').select('*, variants:product_variants(*)').eq('is_active', true),
        supabase.from('categories').select('*').eq('is_active', true),
        supabase.from('collections').select('*').eq('is_active', true),
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('store_config').select('*').limit(1).maybeSingle(),
        supabase.from('collection_products').select('*'),
        supabase.from('coupons').select('*').eq('is_active', true),
        supabase.from('assets').select('*'),
        supabase.from('size_guides').select('*')
      ]);

      const rawProducts = (prodRes.data || []) as Product[];
      const relations = relRes.data || [];

      const processedProducts = rawProducts.map(p => {
        const linkedCollectionIds = relations
          .filter((r: any) => r.product_id === p.id)
          .map((r: any) => r.collection_id);
        
        return {
          ...p,
          collection_ids: linkedCollectionIds
        };
      });

      setProducts(processedProducts);
      if (catRes.data) setCategories(catRes.data as Category[]);
      if (collRes.data) setCollections(collRes.data as Collection[]);
      if (banRes.data) setBanners(banRes.data as Banner[]);
      if (coupRes.data) setCoupons(coupRes.data as Coupon[]);
      if (assRes.data) setAssets(assRes.data as Asset[]);
      if (guideRes.data) setSizeGuides(guideRes.data as SizeGuide[]);
      if (setRes.data) {
        // Merge fetched config with default loyalty structure if missing
        const fetchedConfig = setRes.data as StoreConfig;
        setStoreConfig(prev => ({
            ...fetchedConfig,
            loyalty_program: fetchedConfig.loyalty_program || prev.loyalty_program
        }));
        document.title = setRes.data.brand_name;
      }

      setTimeout(() => {
        document.body.classList.add('loaded');
        setIsLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Error fetching store data:', err);
      document.body.classList.add('loaded');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      if (!result || result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  const enterAdmin = () => {
    setCurrentView('admin');
    setIsAuthOpen(false);
  };

  const exitAdmin = () => {
    setCurrentView('home');
    fetchStoreData();
  };

  const handleNavigate = useCallback((view: 'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about', targetSection?: string) => {
    setCurrentView(view);
    
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
    const discountAmount = subtotal - finalAmount;

    try {
      if (currentUser) {
          const isFirstAddress = !currentUser.default_address;
          const newAddrPayload = {
              user_id: currentUser.id,
              line1: addressData.logradouro + (addressData.numero ? `, ${addressData.numero}` : ''),
              line2: addressData.bairro + (addressData.complemento ? ` - ${addressData.complemento}` : ''),
              city: addressData.localidade,
              state: addressData.uf,
              postal_code: addressData.cep || '',
              country: 'BR',
              is_default: isFirstAddress 
          };
          const { data: addrData } = await supabase.from('addresses').insert(newAddrPayload).select().single();
          if (addrData && isFirstAddress) {
              await supabase.from('profiles').update({ default_address_id: addrData.id }).eq('id', currentUser.id);
          }
      }

      if (currentUser && paymentMethod === 'credit_card' && saveCard && !cardToken) {
          const mockToken = `tok_${Math.random().toString(36).substr(2, 9)}`;
          const mockLast4 = Math.floor(1000 + Math.random() * 9000).toString();
          await supabase.from('user_payment_methods').insert({
              user_id: currentUser.id,
              gateway_token: mockToken, 
              last4: mockLast4,
              brand: 'Visa', 
              exp_month: 12,
              exp_year: 2030,
              is_default: false 
          });
      }

      // Insert Order
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        user_id: currentUser?.id,
        items: cartItems, 
        subtotal: subtotal, 
        total_amount: finalAmount, 
        discount_amount: discountAmount,
        shipping_cost: 0,
        tax_amount: 0,
        status: 'confirmed',
        payment_method: paymentMethod, 
        shipping_address_snapshot: addressData, 
        internal_logistics: logisticsInfo 
      }).select().single();

      if (orderError) throw orderError;

      // Update Stock
      for (const item of cartItems) {
         const product = products.find(p => p.id === item.product_id);
         const variant = product?.variants?.find(v => v.id === item.variant_id);
         if (variant) {
            await supabase.from('product_variants').update({ 
               stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) 
            }).eq('id', variant.id);
            if (variant.correlated_assets) {
                for (const link of variant.correlated_assets) {
                    const totalAssetNeeded = link.quantity_required * item.quantity;
                    const asset = assets.find(a => a.id === link.asset_id);
                    if (asset) await supabase.from('assets').update({ stock_quantity: Math.max(0, asset.stock_quantity - totalAssetNeeded) }).eq('id', asset.id);
                }
            }
         }
      }

      // --- LOYALTY LOGIC START (Protected) ---
      // Wrapped in try-catch to allow order completion even if loyalty schema is outdated
      if (currentUser && storeConfig.loyalty_program?.enabled) {
          try {
              const config = storeConfig.loyalty_program;
              const userLoyalty = currentUser.loyalty || { current_xp: 0, current_level: 1, cashback_balance: 0 };
              
              // 1. Calculate Earnings
              const xpEarned = Math.floor(finalAmount * config.xp_per_currency_unit);
              const cashbackEarned = finalAmount * (config.cashback_percentage / 100);
              
              let newXP = userLoyalty.current_xp + xpEarned;
              let newCashback = userLoyalty.cashback_balance + cashbackEarned;
              let newLevel = userLoyalty.current_level;
              let rewardPending = userLoyalty.pending_reward_coupon;

              // 2. Check Level Up
              const sortedLevels = [...config.levels].sort((a, b) => b.level - a.level);
              const reachedLevel = sortedLevels.find(l => newXP >= l.xp_required);
              
              if (reachedLevel && reachedLevel.level > newLevel) {
                  newLevel = reachedLevel.level;
                  
                  // 3. Generate Exclusive Coupon
                  if (reachedLevel.reward_coupon_value > 0) {
                      const code = `LEVELUP-${newLevel}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                      const expires = new Date();
                      expires.setDate(expires.getDate() + 30); // 30 days expiry

                      const { error: couponError } = await supabase.from('coupons').insert({
                          code: code,
                          discount_type: 'fixed',
                          discount_value: reachedLevel.reward_coupon_value,
                          is_active: true,
                          expires_at: expires.toISOString(),
                      });

                      if (!couponError) {
                          rewardPending = {
                              code: code,
                              value: reachedLevel.reward_coupon_value,
                              expires_at: expires.toISOString(),
                              level_reached: newLevel
                      };
                  }
              }
          }

          // 4. Update Profile
          const updatedLoyalty = {
              current_xp: newXP,
              current_level: newLevel,
              cashback_balance: newCashback,
              pending_reward_coupon: rewardPending
          };

          await supabase.from('profiles').update({ loyalty: updatedLoyalty }).eq('id', currentUser.id);
          
          } catch (loyaltyError) {
              console.warn("Loyalty program update failed. Schema might be missing 'loyalty' column.", loyaltyError);
              // Do not halt execution, order is already placed.
          }
      }
      // --- LOYALTY LOGIC END ---

      // Success Data
      const fullOrder: Order = { 
          ...orderData, 
          items: cartItems, 
          total: finalAmount, 
          subtotal: subtotal, 
          discount_amount: discountAmount,
          payment_method: paymentMethod
      }; 
      setLastSuccessOrder(fullOrder);
      
      setCartItems([]);
      fetchStoreData(); 
      if (currentUser) fetchProfile(currentUser.id);
      
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

  const handleToggleWishlist = (id: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setWishlistIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
      // Dismiss pending reward flag in DB
      if (currentUser) {
          try {
              const updatedLoyalty = {
                  ...(currentUser.loyalty || {}),
                  pending_reward_coupon: null // Clear pending status
              };
              // Optimistic update
              setCurrentUser({ ...currentUser, loyalty: updatedLoyalty as any });
              await supabase.from('profiles').update({ loyalty: updatedLoyalty }).eq('id', currentUser.id);
          } catch(e) { console.error("Dismiss reward failed", e); }
      }
  };

  const handleLoyaltyBannerClick = () => {
      handleCloseLoyaltyBanner();
      setIsCouponsOpen(true);
  };

  if (currentView === 'admin') {
    return <AdminDashboard onLogout={exitAdmin} t={t} locale={locale} onProductChange={fetchStoreData} />;
  }

  if (currentView === 'receipt' && lastSuccessOrder) {
      return <OrderReceipt order={lastSuccessOrder} onBack={() => handleNavigate('home')} t={t} locale={locale} />;
  }

  if (currentView === 'about') {
    return <AboutUs config={storeConfig} locale={locale} onBack={() => handleNavigate('home')} />;
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
              onSelectProduct={(p) => { setActiveProduct(p); handleNavigate('product'); }}
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
            onSelectProduct={(p) => { setActiveProduct(p); handleNavigate('product'); }}
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
        onLogin={setCurrentUser} 
        onLogout={() => setCurrentUser(null)} 
        onAdminAccess={enterAdmin} 
        t={t} 
        locale={locale} 
      />
      <WishlistDrawer 
        isOpen={isWishlistOpen} 
        onClose={() => setIsWishlistOpen(false)} 
        items={products.filter(p => wishlistIds.includes(p.id))} 
        userMode={userMode} 
        onRemoveItem={(id) => setWishlistIds(prev => prev.filter(i => i !== id))} 
        onSelectProduct={(p) => { setActiveProduct(p); handleNavigate('product'); }} 
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
