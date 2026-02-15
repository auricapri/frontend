import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import FAQModal from '../components/layout/FAQModal';
import Hero from '../components/shared/Hero';
import LoyaltyBanner from '../components/shared/LoyaltyBanner';
import CartDrawer from '../components/cart/CartDrawer';
import WishlistDrawer from '../components/cart/WishlistDrawer';
import CouponsDrawer from '../components/cart/CouponsDrawer';
import AuthDrawer from '../components/auth/AuthDrawer';
import Toast from '../components/ui/Toast';
import { LoadingFallback } from '../components/ui/LoadingFallback';
import { TestBanner } from '../components/common/TestBanner';
import { CookieBanner } from '../components/common/CookieBanner';
import { BenefitsBar } from '../components/common/BenefitsBar';
import { TermsConsentModal } from '../components/common/TermsConsentModal';
import { useTermsConsent } from '../hooks/useTermsConsent';
import { AbandonedCartToast } from '../components/ui/AbandonedCartToast';
import { filterProductsForMode } from '../utils/product';
import { trackingService } from '../services/tracking.service';
import { ChatProduct } from '../api/ai-chat.api';
import { Gender } from '../constants/enums';
import { UserMode, type Category, type Collection, type Coupon, type Order, type Product, type SizeGuide, type StoreConfig, type UserProfile } from '../types';
import { SEOHead, organizationSchema, websiteSchema, createProductSchema, createCollectionSchema } from '../components/seo';

// Lazy load páginas e componentes pesados para melhor performance
const ProductGrid = React.lazy(() => import('../components/product/ProductGrid'));
const CollectionDetail = React.lazy(() => import('../components/product/CollectionDetail'));
const ProductDetail = React.lazy(() => import('../components/product/ProductDetail'));
const CheckoutView = React.lazy(() => import('../components/checkout/CheckoutViewV2'));
const OrderResultOverlay = React.lazy(() => import('../components/orders/OrderResultOverlay'));
const OrderReviewPage = React.lazy(() => import('../pages/OrderReviewPage').then(m => ({ default: m.OrderReviewPage })));
const NewArrivalsPage = React.lazy(() => import('../pages/NewArrivalsPage'));
const SearchResultsPage = React.lazy(() => import('../pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const ChatDrawer = React.lazy(() => import('../components/chat/ChatDrawer').then(m => ({ default: m.ChatDrawer })));

export function AppLayout(props: {
  app: {
    locale: any;
    setLocale: (l: any) => void;
    t: (key: string) => any;
    userMode: UserMode;
    setUserMode: React.Dispatch<React.SetStateAction<UserMode>>;

    currentView: 'home' | 'product' | 'collection' | 'checkout' | 'order-review' | 'new-arrivals' | 'search-results';
    isScrolled: boolean;
    mainRef: React.RefObject<HTMLElement>;
    handleScroll: () => void;

    products: Product[];
    categories: Category[];
    collections: Collection[];
    banners: any[];
    coupons: Coupon[];
    storeConfig: StoreConfig;
    isLoading: boolean;

    currentUser: UserProfile | null;
    userOrders: Order[];
    sizeGuides: SizeGuide[];

    cartItems: any[];
    setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
    addToCart: (cartItem: any) => void;
    handleUpdateQuantity: (id: string, delta: number) => void;

    wishlistIds: string[];
    toggleWishlist: (id: string) => Promise<void>;
    handleToggleWishlist: (id: string) => Promise<void>;
    handleBuyAllWishlist: () => void;

    activeProduct: Product | null;
    setActiveProduct: (p: Product | null) => void;
    activeCollection: Collection | null;
    setActiveCollection: (c: Collection | null) => void;

    isCartOpen: boolean;
    setIsCartOpen: (v: boolean) => void;
    isWishlistOpen: boolean;
    setIsWishlistOpen: (v: boolean) => void;
    isCouponsOpen: boolean;
    setIsCouponsOpen: (v: boolean) => void;
    isAuthOpen: boolean;
    setIsAuthOpen: (v: boolean) => void;
    pendingCheckout: boolean;
    setPendingCheckout: (v: boolean) => void;

    toast: { message: string; visible: boolean; type?: 'info' | 'error' };
    closeToast: () => void;
    showToast: (message: string, type?: 'info' | 'error') => void;

    loyaltyBanner: { visible: boolean; level: number; reward: number; code: string; expires: string };
    handleCloseLoyaltyBanner: () => void;
    handleLoyaltyBannerClick: () => void;

    isProcessingOrder: boolean;
    orderResult: any;
    handleCloseOrderResult: () => void;
    handlePlaceOrder: (...args: any[]) => Promise<void>;
    handleCheckoutIntent: () => void;

    signOut: () => Promise<any>;

    onNavigate: (view: any, targetSection?: string, product?: Product) => void;
  };
}) {
  const { app } = props;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.FEMALE);
  const { showModal: showTermsModal, acceptTerms, closeModal: closeTermsModal } = useTermsConsent();

  // Auto-open FAQ modal when user navigates to /faq
  useEffect(() => {
    if (window.location.pathname === '/faq') {
      setIsFAQOpen(true);
    }
  }, []);

  // Helper to get localized text from product/collection name objects
  const getLoc = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      return obj[app.locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'] || '';
    }
    return String(obj);
  };

  // Product SEO schema (memoized to avoid recalculation on every render)
  const productSEO = useMemo(() => {
    if (app.currentView !== 'product' || !app.activeProduct) return null;
    const product = app.activeProduct;
    const activeVariants = product.variants?.filter((v: any) => v.is_active) || [];
    const defaultVariant = activeVariants[0] || product.variants?.[0];
    const productName = getLoc(product.name);
    const productImage = defaultVariant?.variant_images?.[0] || product.base_images?.[0] || product.default_image_url;
    const seoTitle = app.t('seo.product.titleTemplate').replace('{productName}', productName);
    const seoDescription = app.t('seo.product.descriptionTemplate')
      .replace('{productName}', productName)
      .replace('{category}', productName);
    const seoKeywords = app.t('seo.product.keywords').replace('{category}', productName);
    const schema = defaultVariant ? createProductSchema(product, defaultVariant, app.locale) : undefined;
    return { seoTitle, seoDescription, seoKeywords, productImage, schema };
  }, [app.currentView, app.activeProduct, app.locale]);

  // Collection SEO schema (memoized)
  const collectionSEO = useMemo(() => {
    if (app.currentView !== 'collection' || !app.activeCollection) return null;
    const collectionName = getLoc(app.activeCollection.name);
    const collectionDescription = getLoc(app.activeCollection.description);
    const collectionProducts = app.products.filter((p: Product) =>
      p.collection_ids?.includes(app.activeCollection!.id)
    );
    const collectionImage = collectionProducts[0]?.base_images?.[0] || collectionProducts[0]?.default_image_url;
    const seoTitle = app.t('seo.collection.titleTemplate').replace('{collectionName}', collectionName);
    const seoDescription = app.t('seo.collection.descriptionTemplate').replace('{collectionName}', collectionName);
    const seoKeywords = app.t('seo.collection.keywords').replace('{collectionName}', collectionName);
    const schema = createCollectionSchema(collectionName, collectionDescription, window.location.href, collectionProducts.length);
    return { seoTitle, seoDescription, seoKeywords, collectionImage, schema };
  }, [app.currentView, app.activeCollection, app.locale, app.products]);

  // Handle selecting a product from chat
  const handleChatSelectProduct = (chatProduct: ChatProduct) => {
    // Find the matching product in our products list
    const product = app.products.find(p => p.id === chatProduct.id);
    if (product) {
      app.setActiveProduct(product);
      app.onNavigate('product', undefined, product);
    }
  };

  return (
    <div className="relative h-dvh w-full bg-white overflow-hidden text-neutral-900 font-sans">
      {/* Skip to content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-medium"
      >
        Pular para conteudo
      </a>

      <TestBanner />
      <BenefitsBar />
      <Navbar
        cartCount={app.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0)}
        onOpenCart={() => app.setIsCartOpen(true)}
        wishlistCount={app.wishlistIds.length}
        onOpenWishlist={() => app.setIsWishlistOpen(true)}
        onOpenCoupons={() => app.setIsCouponsOpen(true)}
        onOpenAuth={() => app.setIsAuthOpen(true)}
        userMode={app.userMode}
        onToggleMode={() => app.setUserMode((prev) => (prev === UserMode.VAREJO ? UserMode.ATACADO : UserMode.VAREJO))}
        onNavigate={app.onNavigate}
        isScrolled={app.currentView === 'home' && app.isScrolled}
        isProductView={app.currentView === 'product' || app.currentView === 'collection' || app.currentView === 'new-arrivals' || app.currentView === 'search-results'}
        onBack={() => app.onNavigate('home', 'collection')}
        isLoggedIn={!!app.currentUser}
        t={app.t}
        currentLocale={app.locale}
        onChangeLocale={app.setLocale}
        storeName={app.storeConfig.brand_name}
        collections={app.collections}
        onSelectCollection={(c) => {
          app.setActiveCollection(c);
          app.onNavigate('collection');
        }}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
      />

      <main
        id="main-content"
        ref={app.mainRef}
        onScroll={app.handleScroll}
        className={`h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar antialiased relative ${(app.currentView === 'home' || app.currentView === 'search-results') ? 'pt-0' : 'pt-32 md:pt-24'}`}
      >
        {app.currentView === 'home' && (
          <div className="min-h-full flex flex-col">
            <SEOHead
              title={app.t('seo.home.title')}
              description={app.t('seo.home.description')}
              keywords={app.t('seo.home.keywords')}
              type="website"
              locale={app.locale}
              schema={[organizationSchema, websiteSchema]}
            />
            <Hero onNavigate={app.onNavigate as any} t={app.t} banners={app.banners} locale={app.locale} isLoading={app.isLoading} />

            {/* Abandoned Cart Toast - appears above collection section */}
            <AbandonedCartToast
              cartItems={app.cartItems}
              onOpenCart={() => app.setIsCartOpen(true)}
              locale={app.locale}
            />

            <Suspense fallback={<LoadingFallback />}>
              <ProductGrid
                products={app.products}
                categories={app.categories}
                collections={app.collections}
                coupons={app.coupons}
                userMode={app.userMode}
                onSelectProduct={(p) => {
                  app.setActiveProduct(p);
                  app.onNavigate('product', undefined, p);
                }}
                onSelectCollection={(c) => {
                  app.setActiveCollection(c);
                  app.onNavigate('collection');
                }}
                wishlistIds={app.wishlistIds}
                onToggleWishlist={app.handleToggleWishlist}
                onAddToCart={app.addToCart}
                onGoToCart={() => app.onNavigate('checkout')}
                t={app.t}
                locale={app.locale}
                isLoading={app.isLoading}
                selectedGender={selectedGender}
              />
            </Suspense>
            <Footer
              t={app.t}
              currentLocale={app.locale}
              onChangeLocale={app.setLocale}
              storeConfig={app.storeConfig}
              onNavigate={app.onNavigate}
              onOpenFAQ={() => setIsFAQOpen(true)}
            />

            {/* WhatsApp Button */}
            {app.storeConfig.support_phone && (
              <a
                href={`https://wa.me/${app.storeConfig.support_phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  app.locale === 'pt'
                    ? 'Contato via WhatsApp'
                    : app.locale === 'en'
                      ? 'Contact via WhatsApp'
                      : app.locale === 'es'
                        ? 'Contacto por WhatsApp'
                        : 'Contact via WhatsApp'
                }
                className="fixed bottom-10 right-6 p-5 bg-neutral-900 text-white rounded-full shadow-2xl z-40 border border-white/10 hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-in slide-in-from-bottom-10 duration-700 focus:outline-2 focus:outline-white focus:outline-offset-2"
              >
                <MessageCircle className="w-6 h-6" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {app.currentView === 'product' && app.activeProduct && (
          <>
            {productSEO && (
              <SEOHead
                title={productSEO.seoTitle}
                description={productSEO.seoDescription}
                keywords={productSEO.seoKeywords}
                image={productSEO.productImage}
                type="product"
                locale={app.locale}
                schema={productSEO.schema}
              />
            )}
            <Suspense fallback={<LoadingFallback />}>
              <ProductDetail
                product={app.activeProduct}
                coupons={app.coupons}
                userMode={app.userMode}
                onAddToCart={app.addToCart}
                onBack={() => app.onNavigate('home', 'collection')}
                isWishlisted={app.wishlistIds.includes(app.activeProduct.id)}
                onToggleWishlist={() => app.handleToggleWishlist(app.activeProduct!.id)}
                t={app.t}
                locale={app.locale}
                currentUser={app.currentUser}
                userOrders={app.userOrders}
                onShowToast={app.showToast}
                sizeGuides={app.sizeGuides}
                products={app.products}
                categories={app.categories}
                onSelectProduct={(p) => {
                  app.setActiveProduct(p);
                  app.onNavigate('product', undefined, p);
                }}
                wishlistIds={app.wishlistIds}
                onToggleWishlistProduct={app.handleToggleWishlist}
              />
            </Suspense>
            <Footer
              t={app.t}
              currentLocale={app.locale}
              onChangeLocale={app.setLocale}
              storeConfig={app.storeConfig}
              onNavigate={app.onNavigate}
              onOpenFAQ={() => setIsFAQOpen(true)}
            />
          </>
        )}

        {app.currentView === 'collection' && app.activeCollection && (
          <>
            {collectionSEO && (
              <SEOHead
                title={collectionSEO.seoTitle}
                description={collectionSEO.seoDescription}
                keywords={collectionSEO.seoKeywords}
                image={collectionSEO.collectionImage}
                type="website"
                locale={app.locale}
                schema={collectionSEO.schema}
              />
            )}
            <Suspense fallback={<LoadingFallback />}>
              <CollectionDetail
                collection={app.activeCollection}
                products={app.products}
                categories={app.categories}
                userMode={app.userMode}
                onSelectProduct={(p) => {
                  app.setActiveProduct(p);
                  app.onNavigate('product', undefined, p);
                }}
                wishlistIds={app.wishlistIds}
                onToggleWishlist={app.handleToggleWishlist}
                onBack={() => app.onNavigate('home', 'collection')}
                locale={app.locale}
              />
            </Suspense>
            <Footer
              t={app.t}
              currentLocale={app.locale}
              onChangeLocale={app.setLocale}
              storeConfig={app.storeConfig}
              onNavigate={app.onNavigate}
              onOpenFAQ={() => setIsFAQOpen(true)}
            />
          </>
        )}

        {app.currentView === 'checkout' && (
          <>
            <SEOHead
              title={app.t('seo.checkout.title')}
              description={app.t('seo.checkout.description')}
              keywords={app.t('seo.checkout.keywords')}
              type="website"
              locale={app.locale}
            />
            <Suspense fallback={<LoadingFallback />}>
              <CheckoutView
                items={app.cartItems}
                currentUser={app.currentUser}
                storeConfig={app.storeConfig}
                userMode={app.userMode}
                onBack={() => app.onNavigate('home')}
                onComplete={app.handlePlaceOrder}
                locale={app.locale}
                t={app.t}
              />
            </Suspense>
          </>
        )}

        {app.currentView === 'order-review' &&
          (() => {
            const orderIdMatch = window.location.pathname.match(/^\/order-review\/(.+)$/);
            const orderId = orderIdMatch ? orderIdMatch[1] : null;
            if (!orderId) return null;

            return (
              <Suspense fallback={<LoadingFallback />}>
                <OrderReviewPage orderId={orderId} onBack={() => app.onNavigate('home')} t={app.t} locale={app.locale} storeConfig={app.storeConfig} />
              </Suspense>
            );
          })()}

        {app.currentView === 'new-arrivals' && (
          <>
          <SEOHead
            title={`${app.t('nav.newArrivals')} | Auricapri`}
            description={app.t('seo.home.description')}
            keywords={app.t('seo.home.keywords')}
            type="website"
            locale={app.locale}
          />
          <Suspense fallback={<LoadingFallback />}>
            <NewArrivalsPage
              collections={app.collections}
              onSelectCollection={(c) => {
                app.setActiveCollection(c);
                app.onNavigate('collection');
              }}
              locale={app.locale}
              t={app.t}
              onBack={() => app.onNavigate('home')}
              onChangeLocale={app.setLocale}
              storeConfig={app.storeConfig}
              onOpenLegal={app.setLegalView}
              onNavigate={app.onNavigate}
            />
          </Suspense>
          </>
        )}

        {app.currentView === 'search-results' && app.searchSlug && (
          <>
            <SEOHead
              title={`${app.t('search.title')} | Auricapri`}
              description={app.t('seo.site.description')}
              keywords={app.t('seo.site.keywords')}
              type="website"
              locale={app.locale}
            />
            <Suspense fallback={<LoadingFallback />}>
              <SearchResultsPage
                products={app.products}
                searchSlug={app.searchSlug}
                locale={app.locale}
                t={app.t}
                userMode={app.userMode}
                onSelectProduct={(p) => {
                  app.setActiveProduct(p);
                  app.onNavigate('product', undefined, p);
                }}
                wishlistIds={app.wishlistIds}
                onToggleWishlist={app.handleToggleWishlist}
                onBack={() => app.onNavigate('home')}
              />
            </Suspense>
            <Footer
              t={app.t}
              currentLocale={app.locale}
              onChangeLocale={app.setLocale}
              storeConfig={app.storeConfig}
              onNavigate={app.onNavigate}
              onOpenFAQ={() => setIsFAQOpen(true)}
            />
          </>
        )}
      </main>

      <Toast message={app.toast.message} isVisible={app.toast.visible} onClose={app.closeToast} type={app.toast.type} />

      <LoyaltyBanner
        isVisible={app.loyaltyBanner.visible}
        level={app.loyaltyBanner.level}
        rewardValue={app.loyaltyBanner.reward}
        couponCode={app.loyaltyBanner.code}
        expiresAt={app.loyaltyBanner.expires}
        onClose={app.handleCloseLoyaltyBanner}
        onOpenCoupons={app.handleLoyaltyBannerClick}
        locale={app.locale}
      />

      {app.isProcessingOrder && (
        <div className="fixed inset-0 z-[2000] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
          <style>
            {`
              @keyframes logo-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(0.95); }
              }
            `}
          </style>
          <img
            src="/logo-auricapri.svg"
            alt="Carregando..."
            className="w-16 h-16 mb-6"
            style={{ animation: 'logo-pulse 1.5s ease-in-out infinite' }}
          />
          <h3 className="text-xl font-black uppercase tracking-tighter">Processando Pedido</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-2">Não feche esta janela...</p>
        </div>
      )}

      {app.orderResult && (
        <Suspense fallback={null}>
          <OrderResultOverlay
            status={app.orderResult.status}
            orderId={app.orderResult.orderId}
            errorMessage={app.orderResult.message}
            onClose={app.handleCloseOrderResult}
            t={app.t}
            locale={app.locale}
          />
        </Suspense>
      )}

      <CartDrawer
        isOpen={app.isCartOpen}
        onClose={() => app.setIsCartOpen(false)}
        items={app.cartItems}
        userMode={app.userMode}
        onUpdateQuantity={app.handleUpdateQuantity}
        onRemoveItem={(id) => {
          const removed = app.cartItems.find((i: any) => i.variant_id === id);
          app.setCartItems(app.cartItems.filter((i: any) => i.variant_id !== id));
          if (removed) {
            trackingService.trackCartRemove(removed.product_id, removed.variant_id);
          }
        }}
        onCheckout={app.handleCheckoutIntent}
        t={app.t}
        locale={app.locale}
      />

      <AuthDrawer
        isOpen={app.isAuthOpen}
        onClose={() => {
          app.setIsAuthOpen(false);
          app.setPendingCheckout(false);
        }}
        user={app.currentUser}
        onLogin={async () => {
          return;
        }}
        onLogout={async () => {
          await app.signOut();
        }}
        t={app.t}
        locale={app.locale}
        storeConfig={app.storeConfig}
      />

      <WishlistDrawer
        currentUserId={app.currentUser?.id}
        isOpen={app.isWishlistOpen}
        onClose={() => app.setIsWishlistOpen(false)}
        items={filterProductsForMode(app.products.filter((p) => app.wishlistIds.includes(p.id)), app.userMode)}
        userMode={app.userMode}
        onRemoveItem={async (id) => {
          await app.toggleWishlist(id);
        }}
        onSelectProduct={(p) => {
          app.setActiveProduct(p);
          app.onNavigate('product', undefined, p);
        }}
        onBuyAll={app.handleBuyAllWishlist}
        t={app.t}
        locale={app.locale}
      />

      <CouponsDrawer isOpen={app.isCouponsOpen} onClose={() => app.setIsCouponsOpen(false)} t={app.t} />

      <Suspense fallback={null}>
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onSelectProduct={handleChatSelectProduct}
          onAddToCart={app.addToCart}
          locale={app.locale}
          userId={app.currentUser?.id}
        />
      </Suspense>

      <TermsConsentModal
        isOpen={showTermsModal}
        onAccept={() => acceptTerms(false)}
        onClose={closeTermsModal}
        onNavigateTerms={() => { closeTermsModal(); app.onNavigate('terms'); }}
        onNavigatePrivacy={() => { closeTermsModal(); app.onNavigate('privacy'); }}
      />

      <FAQModal
        isOpen={isFAQOpen}
        onClose={() => setIsFAQOpen(false)}
        locale={app.locale}
        t={app.t}
      />

      <CookieBanner onNavigatePrivacy={() => app.onNavigate('privacy')} />
    </div>
  );
}
