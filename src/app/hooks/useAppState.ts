import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { trackingService } from '../../services/tracking.service';
import { type Locale, translations } from '../../i18n';
import { ProductsApi } from '../../api/products.api';
import { UsersApi } from '../../api/users.api';
import { logger } from '../../utils/logger';
import { type Collection, type Product, type UserLoyaltyData, UserMode, type UserProfile } from '../../types';

export type AppView =
  | 'home'
  | 'product'
  | 'collection'
  | 'new-arrivals'
  | 'admin'
  | 'admin-login'
  | 'delivery'
  | 'delivery-login'
  | 'checkout'
  | 'receipt'
  | 'about'
  | 'reset-password'
  | 'shared-wishlist'
  | 'order-review'
  | '404';

export function useAppState(params: {
  products: Product[];
  collections: Collection[];
  isStoreLoading: boolean;
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  onRefetchStoreData: () => void;
}) {
  const { products, collections: _collections, isStoreLoading, currentUser, isAuthLoading, onRefetchStoreData } = params;

  const [locale, setLocale] = useState<Locale>('pt');
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const [userMode, setUserMode] = useState<UserMode>(UserMode.VAREJO);

  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'info' | 'error' }>({
    message: '',
    visible: false,
  });

  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, visible: true, type });
  }, []);

  const closeToast = useCallback(() => setToast((prev) => ({ ...prev, visible: false })), []);

  const extractProductSlug = useCallback((pathname: string): string | null => {
    const match = pathname.match(/^\/product\/(.+)$/);
    return match ? match[1] : null;
  }, []);

  const getProductSlug = useCallback((product: Product, currentLocale: Locale): string => {
    if (!product.slug) return product.id;
    if (typeof product.slug === 'string') return product.slug;
    return product.slug[currentLocale] || product.slug['pt'] || product.slug['en'] || product.id;
  }, []);

  const getViewFromPath = useCallback((pathname: string): AppView => {
    if (pathname === '/admin/login/delivery') return 'delivery-login';
    if (pathname === '/admin/delivery/login') return 'delivery-login';
    if (pathname === '/admin/delivery') return 'delivery';
    if (pathname === '/admin/login') return 'admin-login';
    if (pathname === '/admin') return 'admin';
    if (pathname === '/checkout') return 'checkout';
    if (pathname === '/receipt') return 'receipt';
    if (pathname === '/about') return 'about';
    if (pathname === '/novidades') return 'new-arrivals';
    if (pathname === '/reset-password') return 'reset-password';
    if (pathname.startsWith('/order-review/')) return 'order-review';
    if (pathname.startsWith('/wishlist/')) return 'shared-wishlist';
    if (pathname.startsWith('/product')) return 'product';
    if (pathname.startsWith('/collection')) return 'collection';
    if (pathname === '/') return 'home';
    return '404';
  }, []);

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const view = getViewFromPath(window.location.pathname);
    if (view !== 'home') {
      document.body.classList.add('loaded');
    }
    return view;
  });

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const productsApi = useMemo(() => new ProductsApi(), []);

  const loadProductFromSlug = useCallback(
    async (slug: string) => {
      try {
        const product = await productsApi.getBySlug(slug);
        if (product) {
          setActiveProduct(product);
        } else {
          setCurrentView('404');
        }
      } catch (error) {
        logger.error('Error loading product from slug', error);
        setCurrentView('404');
      }
    },
    [productsApi]
  );

  useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromPath(window.location.pathname);
      setCurrentView(view);

      if (view === 'product') {
        const slug = extractProductSlug(window.location.pathname);
        if (slug) {
          loadProductFromSlug(slug);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [extractProductSlug, getViewFromPath, loadProductFromSlug]);

  // Single page view tracking on mount - removed duplicate popstate listener
  useEffect(() => {
    const currentPath = window.location.pathname;
    trackingService.trackPageView(currentPath);
  }, []);

  useEffect(() => {
    if (currentView === 'product') {
      const slug = extractProductSlug(window.location.pathname);
      if (slug && (!activeProduct || getProductSlug(activeProduct, locale) !== slug)) {
        loadProductFromSlug(slug);
      }
    }
  }, [activeProduct, currentView, extractProductSlug, getProductSlug, loadProductFromSlug, locale]);

  useEffect(() => {
    if (currentView === 'product' && activeProduct?.id) {
      trackingService.trackProductView(activeProduct.id, { locale });
    }
  }, [activeProduct?.id, currentView, locale]);

  useEffect(() => {
    if (currentView !== 'admin') return;
    if (isAuthLoading) return;
    if (!currentUser) {
      setCurrentView('admin-login');
      window.history.pushState({ view: 'admin-login' }, '', '/admin/login');
      return;
    }

    const isAdmin = currentUser.role === 'admin' || (currentUser as any).is_admin === true;
    if (!isAdmin) {
      setCurrentView('home');
      window.history.pushState({ view: 'home' }, '', '/');
      showToast('Acesso negado. Apenas administradores podem acessar esta área.', 'error');
      return;
    }

    const checkMfaStatus = async () => {
      try {
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) return;

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) return;

        const hasVerifiedFactors = factorsData.totp.some((f: any) => f.status === 'verified') || factorsData.phone.some((f: any) => f.status === 'verified');

        if (!hasVerifiedFactors) {
          setCurrentView('admin-login');
          window.history.pushState({ view: 'admin-login' }, '', '/admin/login');
          showToast('MFA obrigatório para administradores. Por favor, configure o MFA.', 'error');
          return;
        }

        if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
          setCurrentView('admin-login');
          window.history.pushState({ view: 'admin-login' }, '', '/admin/login');
          return;
        }

        if (aalData?.currentLevel !== 'aal2') {
          setCurrentView('admin-login');
          window.history.pushState({ view: 'admin-login' }, '', '/admin/login');
          return;
        }
      } catch {
        return;
      }
    };

    checkMfaStatus();
  }, [currentView, currentUser, isAuthLoading, showToast]);

  useEffect(() => {
    if (currentView !== 'delivery') return;
    if (isAuthLoading) return;
    if (!currentUser) {
      setCurrentView('delivery-login');
      window.history.pushState({ view: 'delivery-login' }, '', '/admin/login/delivery');
      return;
    }

    const role = (currentUser as any).role;
    const isDelivery = role === 'delivery' || (currentUser as any).is_delivery === true;
    const isAdmin = role === 'admin' || (currentUser as any).is_admin === true;
    if (!isDelivery && !isAdmin) {
      setCurrentView('home');
      window.history.pushState({ view: 'home' }, '', '/');
      showToast('Acesso negado. Apenas usuários de entrega ou administradores podem acessar esta área.', 'error');
      return;
    }

    const checkMfaStatus = async () => {
      try {
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) return;

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) return;

        const hasVerifiedFactors = factorsData.totp.some((f: any) => f.status === 'verified') || factorsData.phone.some((f: any) => f.status === 'verified');

        if (!hasVerifiedFactors) {
          setCurrentView('delivery-login');
          window.history.pushState({ view: 'delivery-login' }, '', '/admin/login/delivery');
          showToast('MFA obrigatório para entregadores. Por favor, configure o MFA.', 'error');
          return;
        }

        if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
          setCurrentView('delivery-login');
          window.history.pushState({ view: 'delivery-login' }, '', '/admin/login/delivery');
          return;
        }

        if (aalData?.currentLevel !== 'aal2') {
          setCurrentView('delivery-login');
          window.history.pushState({ view: 'delivery-login' }, '', '/admin/login/delivery');
          return;
        }
      } catch {
        return;
      }
    };

    checkMfaStatus();
  }, [currentView, currentUser, isAuthLoading, showToast]);

  const [pendingCheckout, setPendingCheckout] = useState(false);

  const t = useCallback(
    (key: string) => {
      const keys = key.split('.');
      let result: any = translations[locale];
      for (const k of keys) {
        if (!result || result[k] === undefined) return key;
        result = result[k];
      }
      return result;
    },
    [locale]
  );

  const handleNavigate = useCallback(
    (view: Exclude<AppView, 'admin-login' | 'delivery-login' | 'shared-wishlist' | 'order-review'>, targetSection?: string, product?: Product) => {
      setCurrentView(view);
      if (view !== '404') {
        let path = '';
        if (view === 'product' && product) {
          const slug = getProductSlug(product, locale);
          path = `/product/${slug}`;
        } else {
          const routes: Record<
            Exclude<typeof view, '404' | 'product' | 'collection' | 'receipt' | 'about' | 'reset-password' | 'new-arrivals'> | 'product' | 'collection' | 'receipt' | 'about' | 'reset-password' | 'new-arrivals',
            string
          > = {
            home: '/',
            product: '/product',
            collection: '/collection',
            'new-arrivals': '/novidades',
            admin: '/admin',
            checkout: '/checkout',
            receipt: '/receipt',
            about: '/about',
            'reset-password': '/reset-password',
            delivery: '/admin/delivery',
          };
          path = (routes as any)[view] || '/';
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
    },
    [getProductSlug, locale]
  );

  const exitAdmin = useCallback(() => {
    setCurrentView('home');
    window.history.pushState({ view: 'home' }, '', '/');
    onRefetchStoreData();
  }, [onRefetchStoreData]);

  const handleScroll = useCallback(() => {
    if (!mainRef.current) return;
    const top = mainRef.current.scrollTop;
    setIsScrolled(top > 20);
  }, []);

  const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [loyaltyBanner, setLoyaltyBanner] = useState<{ visible: boolean; level: number; reward: number; code: string; expires: string }>({
    visible: false,
    level: 0,
    reward: 0,
    code: '',
    expires: '',
  });

  useEffect(() => {
    if (currentUser?.loyalty?.pending_reward_coupon) {
      const reward = currentUser.loyalty.pending_reward_coupon;
      setLoyaltyBanner({
        visible: true,
        level: reward.level_reached,
        reward: reward.value,
        code: reward.code,
        expires: reward.expires_at,
      });
    }
  }, [currentUser]);

  const handleCloseLoyaltyBanner = useCallback(async () => {
    setLoyaltyBanner((prev) => ({ ...prev, visible: false }));
    if (currentUser) {
      try {
        const updatedLoyalty: UserLoyaltyData = {
          current_xp: currentUser.loyalty?.current_xp ?? 0,
          current_level: currentUser.loyalty?.current_level ?? 0,
          cashback_balance: currentUser.loyalty?.cashback_balance ?? 0,
          last_seen_level: currentUser.loyalty?.last_seen_level,
          pending_reward_coupon: null,
        };
        const usersApi = new UsersApi();
        await usersApi.updateLoyalty(updatedLoyalty);
      } catch {
        return;
      }
    }
  }, []);

  const handleLoyaltyBannerClick = useCallback(() => {
    handleCloseLoyaltyBanner();
    setIsCouponsOpen(true);
  }, [handleCloseLoyaltyBanner]);

  const [splashShown, setSplashShown] = useState(false);
  useEffect(() => {
    if (currentView === 'home' && !isStoreLoading && products.length > 0 && !splashShown) {
      const timer = setTimeout(() => {
        document.body.classList.add('loaded');
        setSplashShown(true);
      }, 300);
      return () => clearTimeout(timer);
    } else if (currentView !== 'home' && !splashShown) {
      setSplashShown(true);
    }
  }, [currentView, isStoreLoading, products.length, splashShown]);

  useEffect(() => {
    if (currentUser && pendingCheckout) {
      setPendingCheckout(false);
      handleNavigate('checkout');
    }
  }, [currentUser, handleNavigate, pendingCheckout]);

  return {
    locale,
    setLocale,
    userMode,
    setUserMode,
    currentView,
    setCurrentView,
    activeProduct,
    setActiveProduct,
    activeCollection,
    setActiveCollection,
    mainRef,
    isScrolled,
    handleScroll,
    handleNavigate,
    t,
    toast,
    showToast,
    closeToast,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isCouponsOpen,
    setIsCouponsOpen,
    isAuthOpen,
    setIsAuthOpen,
    legalView,
    setLegalView,
    loyaltyBanner,
    handleCloseLoyaltyBanner,
    handleLoyaltyBannerClick,
    exitAdmin,
    pendingCheckout,
    setPendingCheckout,
  };
}
