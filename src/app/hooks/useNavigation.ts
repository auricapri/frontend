import { useCallback, useEffect, useRef, useState } from 'react';
import { trackingService } from '../../services/tracking.service';
import { logger } from '../../utils/logger';
import { CachedProductsApi } from '../../api/cached.products.api';
import type { Locale } from '../../i18n';
import type { Collection, Product, UserProfile } from '../../types';

const productsApi = new CachedProductsApi();

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
  | 'shipping'
  | 'affiliates'
  | 'search-results'
  | 'marketplace-callback'
  | 'my-returns'
  | 'request-return'
  | 'gallery'
  | 'contact'
  | 'my-orders'
  | '404';

interface UseNavigationParams {
  locale: Locale;
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  showToast: (message: string, type?: 'info' | 'error') => void;
  products: Product[];
  isStoreLoading: boolean;
}

export function useNavigation(params: UseNavigationParams) {
  const { locale, currentUser: _currentUser, isAuthLoading: _isAuthLoading, showToast: _showToast, products, isStoreLoading } = params;

  const mainRef = useRef<HTMLElement>(null);
  const savedScrollTop = useRef<number>(0);
  const currentViewRef = useRef<AppView>('home');
  const previousViewRef = useRef<AppView>('home');
  const [isScrolled, setIsScrolled] = useState(false);

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
    if (pathname === '/delivery-login' || pathname === '/delivery/login') return 'delivery-login';
    if (pathname === '/delivery') return 'delivery';
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
    if (pathname === '/product') return 'home';
    if (pathname.startsWith('/product/')) return 'product';
    if (pathname === '/collection') return 'home';
    if (pathname.startsWith('/collection/')) return 'collection';
    if (pathname === '/privacy') return 'privacy';
    if (pathname === '/terms') return 'terms';
    if (pathname === '/contact') return 'contact';
    if (pathname === '/shipping') return 'shipping';
    if (pathname === '/my-returns') return 'my-returns';
    if (pathname === '/request-return') return 'request-return';
    if (pathname === '/meus-pedidos') return 'my-orders';
    if (pathname === '/faq') return 'home';
    if (pathname === '/affiliates') return 'affiliates';
    if (pathname === '/galeria') return 'gallery';
    if (pathname === '/products') return 'home';
    if (pathname === '/collections') return 'new-arrivals';
    if (pathname === '/admin/marketplace-callback') return 'marketplace-callback';
    if (pathname === '/') return 'home';
    return '404';
  }, []);

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const view = getViewFromPath(window.location.pathname);
    currentViewRef.current = view;
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

  // Helper function to find product by slug in loaded products
  const findProductBySlug = useCallback(
    (slug: string, productList: Product[]): Product | null => {
      return productList.find((product) => {
        if (!product.slug) return product.id === slug;
        if (typeof product.slug === 'string') return product.slug === slug;
        // Check all locale slugs
        return Object.values(product.slug).some((s) => s === slug);
      }) || null;
    },
    []
  );

  const loadProductFromSlug = useCallback(
    async (slug: string) => {
      // Search in already-loaded products first
      const product = findProductBySlug(slug, products);
      if (product) {
        setActiveProduct(product);
        return;
      }

      if (!isStoreLoading && products.length > 0) {
        // Products are loaded but slug not found locally.
        // Fallback: try fetching from API by slug (handles products beyond bootstrap limit).
        try {
          const apiProduct = await productsApi.getBySlug(slug);
          if (apiProduct) {
            setActiveProduct(apiProduct);
            return;
          }
        } catch (err) {
          logger.warn(`Failed to fetch product by slug from API: ${slug}`, err);
        }
        // Product truly not found - show 404
        logger.warn('Product not found for slug:', slug);
        setCurrentView('404');
      }
      // If still loading, do nothing - the effect below will handle it
    },
    [products, isStoreLoading, findProductBySlug]
  );

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromPath(window.location.pathname);
      const fromProduct = currentViewRef.current === 'product';
      currentViewRef.current = view;
      setCurrentView(view);

      if (fromProduct && savedScrollTop.current > 0 && mainRef.current) {
        const target = savedScrollTop.current;
        savedScrollTop.current = 0;
        // Let the DOM update before restoring
        requestAnimationFrame(() => {
          mainRef.current?.scrollTo({ top: target, behavior: 'instant' });
        });
      }

      if (view === 'product') {
        savedScrollTop.current = mainRef.current?.scrollTop ?? 0;
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

  // Load product from URL slug on mount or when products finish loading
  useEffect(() => {
    if (currentView === 'product') {
      const slug = extractProductSlug(window.location.pathname);
      if (slug && (!activeProduct || getProductSlug(activeProduct, locale) !== slug)) {
        loadProductFromSlug(slug);
      }
    }
  }, [activeProduct, currentView, extractProductSlug, getProductSlug, loadProductFromSlug, locale, products]);

  // Track product views
  useEffect(() => {
    if (currentView === 'product' && activeProduct?.id) {
      trackingService.trackProductView(activeProduct.id, { locale });
    }
  }, [activeProduct?.id, currentView, locale]);

  const handleNavigate = useCallback(
    (view: Exclude<AppView, 'admin-login' | 'delivery-login' | 'shared-wishlist' | 'order-review'>, targetSection?: string, product?: Product) => {
      const fromProduct = currentViewRef.current === 'product';

      // Save scroll before entering product; restore it when leaving
      if (view === 'product') {
        previousViewRef.current = currentViewRef.current;
        savedScrollTop.current = mainRef.current?.scrollTop ?? 0;
      }

      currentViewRef.current = view;
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
            checkout: '/checkout',
            receipt: '/receipt',
            about: '/about',
            'reset-password': '/reset-password',
            privacy: '/privacy',
            terms: '/terms',
            shipping: '/shipping',
            affiliates: '/affiliates',
            gallery: '/galeria',
            contact: '/contact',
            'my-returns': '/my-returns',
            'request-return': '/request-return',
            'my-orders': '/meus-pedidos',
            'search-results': '/search',
          };
          path = routes[view] || '/';
        }
        window.history.pushState({ view }, '', path);
      }

      if (mainRef.current) {
        if (fromProduct && savedScrollTop.current > 0) {
          // Restore position the user was at before opening the product
          const target = savedScrollTop.current;
          mainRef.current.scrollTo({ top: target, behavior: 'instant' });
          savedScrollTop.current = 0;
        } else {
          mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
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
        // Only scroll to section if we're NOT restoring a saved position from product
        if (view === 'home' && targetSection && !fromProduct) {
          const el = document.getElementById(targetSection);
          if (el && mainRef.current) {
            mainRef.current.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
          }
        }
      }, 100);
    },
    [getProductSlug, locale]
  );

  const handleBackFromProduct = useCallback(() => {
    const prev = previousViewRef.current;
    if (prev === 'collection') {
      handleNavigate('collection');
    } else if (prev === 'new-arrivals') {
      handleNavigate('new-arrivals');
    } else if (prev === 'search-results') {
      handleNavigate('search-results', searchSlug);
    } else {
      handleNavigate('home', 'collection');
    }
  }, [handleNavigate, searchSlug]);

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
    handleBackFromProduct,
    getProductSlug,
  };
}
