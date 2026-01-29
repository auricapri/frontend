import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { trackingService } from '../../services/tracking.service';
import { CachedProductsApi } from '../../api/cached.products.api';
import { logger } from '../../utils/logger';
import type { Locale } from '../../i18n';
import type { Collection, Product, UserProfile } from '../../types';

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
  | 'privacy'
  | 'terms'
  | 'search-results'
  | 'marketplace-callback'
  | '404';

interface UseNavigationParams {
  locale: Locale;
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  showToast: (message: string, type?: 'info' | 'error') => void;
  onRefetchStoreData: () => void;
}

export function useNavigation(params: UseNavigationParams) {
  const { locale, currentUser, isAuthLoading, showToast, onRefetchStoreData } = params;

  const mainRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const productsApi = useMemo(() => new CachedProductsApi(), []);

  const extractProductSlug = useCallback((pathname: string): string | null => {
    const match = pathname.match(/^\/product\/(.+)$/);
    return match ? match[1] : null;
  }, []);

  const extractSearchSlug = useCallback((pathname: string): string | null => {
    const match = pathname.match(/^\/search\/(.+)$/);
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
    if (pathname.startsWith('/search/')) return 'search-results';
    if (pathname.startsWith('/product')) return 'product';
    if (pathname.startsWith('/collection')) return 'collection';
    if (pathname === '/privacy') return 'privacy';
    if (pathname === '/terms') return 'terms';
    if (pathname === '/admin/marketplace-callback') return 'marketplace-callback';
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
  const [searchSlug, setSearchSlug] = useState<string>(() => {
    const slug = extractSearchSlug(window.location.pathname);
    return slug || '';
  });

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

  // Handle browser back/forward navigation
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

      if (view === 'search-results') {
        const slug = extractSearchSlug(window.location.pathname);
        if (slug) {
          setSearchSlug(slug);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [extractProductSlug, extractSearchSlug, getViewFromPath, loadProductFromSlug]);

  // Track initial page view
  useEffect(() => {
    const currentPath = window.location.pathname;
    trackingService.trackPageView(currentPath);
  }, []);

  // Load product from URL slug on mount or view change
  useEffect(() => {
    if (currentView === 'product') {
      const slug = extractProductSlug(window.location.pathname);
      if (slug && (!activeProduct || getProductSlug(activeProduct, locale) !== slug)) {
        loadProductFromSlug(slug);
      }
    }
  }, [activeProduct, currentView, extractProductSlug, getProductSlug, loadProductFromSlug, locale]);

  // Track product views
  useEffect(() => {
    if (currentView === 'product' && activeProduct?.id) {
      trackingService.trackProductView(activeProduct.id, { locale });
    }
  }, [activeProduct?.id, currentView, locale]);

  // Admin MFA check
  useEffect(() => {
    if (currentView !== 'admin') return;
    if (isAuthLoading) return;
    if (!currentUser) {
      setCurrentView('admin-login');
      window.history.pushState({ view: 'admin-login' }, '', '/admin/login');
      return;
    }

    const isAdmin = currentUser.role === 'admin' || (currentUser as Record<string, unknown>).is_admin === true;
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

        const hasVerifiedFactors = factorsData.totp.some((f) => f.status === 'verified') || factorsData.phone.some((f) => f.status === 'verified');

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

  // Delivery MFA check
  useEffect(() => {
    if (currentView !== 'delivery') return;
    if (isAuthLoading) return;
    if (!currentUser) {
      setCurrentView('delivery-login');
      window.history.pushState({ view: 'delivery-login' }, '', '/admin/login/delivery');
      return;
    }

    const role = (currentUser as Record<string, unknown>).role as string;
    const isDelivery = role === 'delivery' || (currentUser as Record<string, unknown>).is_delivery === true;
    const isAdmin = role === 'admin' || (currentUser as Record<string, unknown>).is_admin === true;
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

        const hasVerifiedFactors = factorsData.totp.some((f) => f.status === 'verified') || factorsData.phone.some((f) => f.status === 'verified');

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

  const handleNavigate = useCallback(
    (view: Exclude<AppView, 'admin-login' | 'delivery-login' | 'shared-wishlist' | 'order-review'>, targetSection?: string, product?: Product) => {
      setCurrentView(view);
      if (view !== '404') {
        let path = '';
        if (view === 'product' && product) {
          const slug = getProductSlug(product, locale);
          path = `/product/${slug}`;
        } else if (view === 'search-results' && targetSection) {
          setSearchSlug(targetSection);
          path = `/search/${targetSection}`;
        } else {
          const routes: Record<string, string> = {
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
            privacy: '/privacy',
            terms: '/terms',
            'search-results': '/search',
          };
          path = routes[view] || '/';
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
          setSearchSlug('');
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

  return {
    currentView,
    setCurrentView,
    activeProduct,
    setActiveProduct,
    activeCollection,
    setActiveCollection,
    searchSlug,
    setSearchSlug,
    mainRef,
    isScrolled,
    handleScroll,
    handleNavigate,
    exitAdmin,
    getProductSlug,
  };
}
