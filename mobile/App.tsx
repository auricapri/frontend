/**
 * Auricapri Mobile App
 * Main entry point for React Native application
 * Complete implementation with all navigation, drawers, and order processing
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity, Text, Platform, Alert, Linking, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { AuthProvider, useAuthContext } from './src/context/AuthContext';
import { CartProvider, useCartContext } from './src/context/CartContext';
import { useNotifications } from './src/hooks/useNotifications';
import { useWishlist } from './src/hooks/useWishlist';
import { useSmoothScroll } from './src/hooks/useSmoothScroll';
import { hideSplash } from './src/utils/splash';
import { Locale, translations } from './src/i18n';
import { UserMode, Product, Collection, Order, AddressData, InternalLogisticsInfo } from './src/types';
import { DEFAULT_LOCALE } from './src/constants';
import { WHATSAPP_LINK } from './src/constants';

// Pages
import { HomePage, ErrorPage, NotFoundPage, ResetPasswordPage, ReceiptPage, AboutPage, CollectionPage, ProductPage, CheckoutPage, OrderProductReviewPage } from './src/pages';
import SharedWishlistPage from './src/pages/SharedWishlistPage';

// Components
import SplashScreen from './src/components/ui/SplashScreen';
import { Navbar } from './src/components/layout';
import { Footer } from './src/components/layout';
import { CartDrawer, WishlistDrawer, CouponsDrawer } from './src/components/cart';
import { AuthDrawer } from './src/components/auth';
import { LoyaltyBanner } from './src/components/shared';
import { OrderResultOverlay } from './src/components/orders';
import { Toast } from './src/components/ui';
import { Loader2, X, MessageCircle } from './src/components/ui/Icons';
import { ProcessingOverlay } from './src/components/ui/ProcessingOverlay';
import { OrdersApi } from './src/api/orders.api';
import { UsersApi } from './src/api/users.api';
import { ProductsApi } from './src/api/products.api';
import { calculatePrice } from './src/utils/product';
import { supabase } from './src/utils/supabase';

/**
 * Main App Content Component
 */
const AppContent: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, signOut } = useAuthContext();
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
    error, 
    refetchStoreData, 
    userMode,
    locale,
    setLocale: setLocaleContext,
    setUserMode: setUserModeContext
  } = useAppContext();
  
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart, validateStock, setCartItems } = useCartContext();
  const { wishlistIds, toggleWishlist } = useWishlist(currentUser?.id);
  
  // ScrollView ref for smooth scrolling
  const mainScrollViewRef = useRef<ScrollView>(null);
  const { smoothScrollTo, scrollToTop } = useSmoothScroll(mainScrollViewRef);
  
  // Section positions for smooth scrolling
  const sectionPositions = useRef<{ [key: string]: number }>({});
  
  // Navigation state
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'collection' | 'checkout' | 'receipt' | 'about' | 'reset-password' | 'shared-wishlist' | 'order-review' | '404'>('home');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  
  // Drawer states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);
  
  // Order processing state
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<{ status: 'success' | 'error', orderId?: string, message?: string, fullOrder?: Order } | null>(null);
  const [lastSuccessOrder, setLastSuccessOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'info' | 'error' }>({ message: '', visible: false });
  
  // Loyalty banner state
  const [loyaltyBanner, setLoyaltyBanner] = useState<{ visible: boolean, level: number, reward: number, code: string, expires: string }>({ visible: false, level: 0, reward: 0, code: '', expires: '' });
  
  // Checkout intent
  const [pendingCheckout, setPendingCheckout] = useState(false);
  
  // Initialize notifications
  useNotifications(currentUser?.id);

  // Handle deep link URLs
  const handleDeepLink = useCallback(async (url: string) => {
    try {
      console.log('Deep link received:', url);
      
      // Parse URL manually (React Native compatible)
      const hashIndex = url.indexOf('#');
      const hash = hashIndex >= 0 ? url.substring(hashIndex + 1) : '';
      
      // Parse hash parameters
      const params: Record<string, string> = {};
      if (hash) {
        hash.split('&').forEach((param) => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }
      
      // Handle OAuth callback (auricapri://auth or https://supabase.co/auth/v1/callback)
      if (url.includes('auth') || url.includes('supabase.co') || url.startsWith('auricapri://')) {
        console.log('Processing OAuth callback:', url);
        
        const accessToken = params['access_token'];
        const refreshToken = params['refresh_token'];
        const error = params['error'];
        const errorDescription = params['error_description'];
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          Alert.alert('Erro no Login', errorDescription || error);
          setIsAuthOpen(false);
          return;
        }
        
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens...');
          // Set session manually
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
          
          if (session?.user) {
            console.log('Session set successfully, user:', session.user.email);
            // Session is set, AuthContext will automatically update via useAuth hook
            // Just close the auth drawer
            setIsAuthOpen(false);
            // Show success message after a brief delay to ensure UI is updated
            setTimeout(() => {
              Alert.alert('Sucesso', 'Login realizado com sucesso!');
            }, 100);
          } else {
            console.warn('Session set but no user found');
          }
        } else {
          console.warn('No tokens found in callback URL');
        }
      }
      
      // Handle reset password callback
      if (url.includes('reset-password')) {
        const accessToken = params['access_token'];
        const type = params['type'];
        
        if (accessToken && type === 'recovery') {
          // Navigate to reset password page
          setCurrentView('reset-password');
          setIsAuthOpen(false);
        }
      }
    } catch (error: unknown) {
      console.error('Error handling deep link:', error instanceof Error ? error.message : String(error));
      Alert.alert('Erro', 'Erro ao processar link de autenticação');
    }
  }, []);

  // Deep linking handler for OAuth redirects
  useEffect(() => {
    // Handle initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    }).catch((err) => {
      console.error('Error getting initial URL:', err);
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // Helper to get product slug in current locale
  const getProductSlug = useCallback((product: Product, loc: Locale): string => {
    if (!product.slug) return product.id;
    if (typeof product.slug === 'string') return product.slug;
    return product.slug[loc] || product.slug['pt'] || product.slug['en'] || product.id;
  }, []);
  
  // Load product from slug
  const productsApi = useMemo(() => new ProductsApi(), []);
  const loadProductFromSlug = useCallback(async (slug: string) => {
    try {
      const product = await productsApi.getBySlug(slug);
      if (product) {
        setActiveProduct(product);
      } else {
        setCurrentView('404');
      }
    } catch (error) {
      console.error('Error loading product from slug:', error);
      setCurrentView('404');
    }
  }, []);
  
  // Manage splash screen: only show on home page
  useEffect(() => {
    if (currentView === 'home' && !isLoading && products.length > 0) {
      const timer = setTimeout(() => {
        hideSplash();
        setSplashVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    } else if (currentView !== 'home') {
      // Show splash again when navigating away from home
      setSplashVisible(true);
    }
  }, [currentView, isLoading, products.length, error]);
  
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
  
  // Handle pending checkout after login
  useEffect(() => {
    if (currentUser && pendingCheckout) {
      setPendingCheckout(false);
      handleNavigate('checkout');
    }
  }, [currentUser, pendingCheckout]);

  // Memoized OrdersApi instance
  const ordersApi = useMemo(() => new OrdersApi(), []);

  // Fetch user orders when logged in
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!currentUser?.id) {
        setUserOrders([]);
        return;
      }

      try {
        const orders = await ordersApi.getByUserId(currentUser.id);
        setUserOrders(orders || []);
      } catch (error) {
        console.error('Error fetching user orders:', error);
        setUserOrders([]);
      }
    };

    fetchUserOrders();
  }, [currentUser?.id]);

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      if (!result || result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, visible: true, type });
  };
  
  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));
  
  const handleNavigate = useCallback((view: 'home' | 'product' | 'collection' | 'checkout' | 'receipt' | 'about' | 'reset-password' | 'order-review' | '404', targetSection?: string, product?: Product) => {
    setCurrentView(view);
    
    // Scroll to top immediately when changing views
    scrollToTop(true);
    
          if (view === 'home') {
            setIsScrolled(false);
            if (!targetSection) {
              setActiveProduct(null);
              setActiveCollection(null);
            } else {
              // Scroll to target section after a brief delay to allow render
              setTimeout(() => {
                // If target is 'collection', scroll to 'products' instead (first product grid)
                const targetKey = targetSection === 'collection' ? 'products' : targetSection;
                const position = sectionPositions.current[targetKey];
                if (position !== undefined) {
                  smoothScrollTo(position, { offset: 80 });
                }
              }, 100);
            }
          }
  }, [scrollToTop, smoothScrollTo]);
  
  const handleSelectProduct = (product: Product) => {
    setActiveProduct(product);
    handleNavigate('product');
  };
  
  const handleSelectCollection = (collection: Collection) => {
    setActiveCollection(collection);
    handleNavigate('collection');
  };
  
  const handleAddToCart = (cartItem: any) => {
    const result = addToCart(cartItem);
    if (!result.success && result.error) {
      showToast(result.error, 'error');
      return;
    }
    setIsCartOpen(true);
  };
  
  const handleUpdateQuantity = (id: string, delta: number) => {
    updateQuantity(id, delta);
  };
  
  const handleRemoveFromCart = (id: string) => {
    removeFromCart(id);
  };
  
  const handleCheckoutIntent = () => {
    const stockCheck = validateStock();
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
  
  // Handle place order
  const handlePlaceOrder = async (
    addressData: AddressData,
    logisticsInfo: InternalLogisticsInfo,
    paymentMethod: 'credit_card' | 'pix',
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    cardData?: any
  ) => {
    if (cartItems.length === 0) return;
    setIsProcessingOrder(true);
    
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const ordersApi = new OrdersApi();
    
    try {
      // Create order via API
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
      
      clearCart();
      refetchStoreData();
      
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
        handleAddToCart({
          variant_id: variant.id,
          product_id: product.id,
          name: product.name,
          image: variant.variant_images?.[0] || product.base_images?.[0] || '',
          size: variant.size || 'N/A',
          color_name: variant.color_name,
          color_hex: variant.color_hex || '#000',
          price: calculatePrice(variant, userMode, product),
          quantity: 1,
          sku: variant.sku
        });
      }
    });
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };
  
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent?.contentOffset?.y || 0;
    setIsScrolled(offsetY > 20);
  };
  
  const handleCloseLoyaltyBanner = async () => {
    setLoyaltyBanner(prev => ({ ...prev, visible: false }));
    if (currentUser) {
      try {
        const updatedLoyalty = {
          ...(currentUser.loyalty || {}),
          pending_reward_coupon: null
        };
        const usersApi = new UsersApi();
        await usersApi.updateLoyalty(updatedLoyalty);
      } catch (e) {
        console.error("Dismiss reward failed", e);
      }
    }
  };
  
  const handleLoyaltyBannerClick = () => {
    handleCloseLoyaltyBanner();
    setIsCouponsOpen(true);
  };

  const handleRetry = () => {
    refetchStoreData();
  };

  const handleToggleMode = () => {
    const newMode = userMode === UserMode.VAREJO ? UserMode.ATACADO : UserMode.VAREJO;
    setUserModeContext(newMode);
  };
  
  // Container component for early returns - same logic as main view
  // iOS: Use SafeAreaView to respect safe areas
  // Android: Use View with full-screen background, content will handle safe area padding
  const ContainerComponent = Platform.OS === 'ios' ? SafeAreaView : View;
  const containerProps = Platform.OS === 'ios' 
    ? { style: [styles.container, styles.containerIOS], edges: ['top', 'bottom'] as const }
    : { style: styles.container }; // Android: no padding, background extends full screen

  // Render early returns for full-page views
  if (error && !isLoading) {
    return (
      <ContainerComponent {...containerProps}>
        <ErrorPage onRetry={handleRetry} t={t} />
      </ContainerComponent>
    );
  }
  
  if (currentView === '404') {
    return (
      <ContainerComponent {...containerProps}>
        <NotFoundPage locale={locale} onNavigate={handleNavigate} t={t} />
      </ContainerComponent>
    );
  }
  
  if (currentView === 'reset-password') {
    return (
      <ContainerComponent {...containerProps}>
        <ResetPasswordPage locale={locale} onNavigate={handleNavigate} t={t} />
      </ContainerComponent>
    );
  }
  
  if (currentView === 'receipt' && lastSuccessOrder) {
    return (
      <ContainerComponent {...containerProps}>
        <ReceiptPage
          order={lastSuccessOrder}
          onBack={() => handleNavigate('home')}
          t={t}
          locale={locale}
        />
      </ContainerComponent>
    );
  }
  
  if (currentView === 'about') {
    return (
      <ContainerComponent {...containerProps}>
        <AboutPage
          config={storeConfig}
          locale={locale}
          onBack={() => handleNavigate('home')}
        />
      </ContainerComponent>
    );
  }
  
  // Main app view
  return (
    <ContainerComponent {...containerProps}>
      {/* StatusBar: transparent on Android so background extends to top */}
      <StatusBar 
        translucent={Platform.OS === 'android'}
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <SplashScreen visible={splashVisible} />
      
      <Navbar
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCoupons={() => setIsCouponsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        userMode={userMode}
        onToggleMode={handleToggleMode}
        onNavigate={handleNavigate}
        isScrolled={currentView === 'home' && isScrolled}
        isProductView={currentView === 'product' || currentView === 'checkout' || currentView === 'collection'}
        onBack={() => handleNavigate('home', 'collection')}
        isLoggedIn={!!currentUser}
        t={t}
        currentLocale={locale}
        onChangeLocale={setLocaleContext}
        storeName={storeConfig?.brand_name || ''}
      />
      
      <ScrollView
        ref={mainScrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {currentView === 'home' && (
          <>
        <HomePage
              onSectionLayout={(section: string, y: number) => {
                sectionPositions.current[section] = y;
              }}
              mainScrollViewRef={mainScrollViewRef}
          products={products}
              categories={categories}
              collections={collections}
              banners={banners}
              coupons={coupons}
              userMode={userMode}
          wishlistIds={wishlistIds}
          onSelectProduct={handleSelectProduct}
          onSelectCollection={handleSelectCollection}
              onToggleWishlist={handleToggleWishlist}
          onNavigate={handleNavigate}
              onOpenLegal={setLegalView}
              t={t}
              locale={locale}
              onChangeLocale={setLocaleContext}
              storeConfig={storeConfig}
              isLoading={isLoading}
            />
          </>
        )}
        
        {currentView === 'product' && activeProduct && (
          <ProductPage
            product={activeProduct}
            coupons={coupons}
            userMode={userMode}
            isWishlisted={wishlistIds.includes(activeProduct.id)}
            currentUser={currentUser}
            userOrders={userOrders}
            sizeGuides={sizeGuides}
            onAddToCart={handleAddToCart}
            onBack={() => handleNavigate('home', 'collection')}
            onToggleWishlist={() => handleToggleWishlist(activeProduct.id)}
            onShowToast={showToast}
            t={t}
            locale={locale}
            products={products}
            categories={categories}
            onSelectProduct={(p) => { setActiveProduct(p); handleNavigate('product', undefined, p); }}
            wishlistIds={wishlistIds}
            onToggleWishlistProduct={handleToggleWishlist}
          />
        )}
        
        {currentView === 'collection' && activeCollection && (
          <CollectionPage
            collection={activeCollection}
            products={products}
            categories={categories}
            userMode={userMode}
            wishlistIds={wishlistIds}
            onSelectProduct={handleSelectProduct}
            onToggleWishlist={handleToggleWishlist}
            onBack={() => handleNavigate('home', 'collection')}
            locale={locale}
          />
        )}
        
        {currentView === 'checkout' && (
          <CheckoutPage
            items={cartItems}
            currentUser={currentUser}
            storeConfig={storeConfig}
            userMode={userMode}
            onBack={() => handleNavigate('home')}
            onComplete={handlePlaceOrder}
            t={t}
            locale={locale}
          />
        )}
      </ScrollView>
      
      {/* WhatsApp Button */}
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.open(WHATSAPP_LINK, '_blank');
          } else {
            Linking.openURL(WHATSAPP_LINK).catch(() => {});
          }
        }}
        style={styles.whatsappButton}
      >
        <MessageCircle size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Toast Notification */}
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
      <ProcessingOverlay visible={isProcessingOrder} />
      
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
      
      {/* Legal View Modal */}
      {legalView && (
        <Modal visible={!!legalView} animationType="slide">
          <View style={styles.legalModal}>
            <View style={styles.legalHeader}>
              <Text style={styles.legalTitle}>
                {legalView === 'terms' ? t('footer.terms') : t('footer.privacy')}
              </Text>
              <TouchableOpacity onPress={() => setLegalView(null)} style={styles.legalCloseButton}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.legalContent} contentContainerStyle={styles.legalContentContainer}>
              <View style={styles.legalTextContainer}>
                <Text style={styles.legalText}>
                  {legalView === 'terms' 
                    ? (storeConfig?.terms_of_service?.[locale] || '') 
                    : (storeConfig?.privacy_policy?.[locale] || '')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
      
      {/* Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        userMode={userMode}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckoutIntent}
        t={t}
        locale={locale}
      />
      
      <AuthDrawer
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setPendingCheckout(false); }}
        user={currentUser}
        onLogin={async () => {
          // Auth is managed by useAuth hook
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
        onSelectProduct={handleSelectProduct}
        onBuyAll={handleBuyAllWishlist}
        t={t}
        locale={locale}
      />
      
      <CouponsDrawer
        isOpen={isCouponsOpen}
        onClose={() => setIsCouponsOpen(false)}
        t={t}
      />
    </ContainerComponent>
  );
};

/**
 * Root App Component with Providers
 */
const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [userMode, setUserMode] = useState<UserMode>(UserMode.VAREJO);

  return (
    <SafeAreaProvider>
      <AppProvider locale={locale} setLocale={setLocale} userMode={userMode} setUserMode={setUserMode}>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    // Remove width/height constraints - flex: 1 should handle it
    // Android: background extends to full screen including status bar area
    // iOS: SafeAreaView handles safe areas
    ...Platform.select({
      android: {
        // Ensure full screen on Android
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0,
      },
    }),
  },
  containerIOS: {
    // iOS SafeAreaView already handles safe areas, just ensure background is white
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  whatsappButton: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  legalModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  legalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    height: 96,
  },
  legalTitle: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  legalCloseButton: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
  },
  legalContent: {
    flex: 1,
  },
  legalContentContainer: {
    padding: 48,
  },
  legalTextContainer: {
    maxWidth: 1024,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 48,
    borderRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  legalText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#525252',
    lineHeight: 24,
  },
});

export default App;
