import { useCallback, useEffect, useState } from 'react';
import { type Locale, translations } from '../../i18n';
import type { Collection, Product, UserProfile } from '../../types';
import { UserMode } from '../../types';

// Import smaller, focused hooks
import { useToast } from './useToast';
import { useDrawers } from './useDrawers';
import { useLoyalty } from './useLoyalty';
import { useNavigation } from './useNavigation';

// Re-export AppView for backward compatibility
export type { AppView } from './useNavigation';

interface UseAppStateParams {
  products: Product[];
  collections: Collection[];
  isStoreLoading: boolean;
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  onRefetchStoreData: () => void;
}

export function useAppState(params: UseAppStateParams) {
  const { products, collections: _collections, isStoreLoading, currentUser, isAuthLoading } = params;

  // Locale state
  const [locale, setLocale] = useState<Locale>('pt');
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // User mode (retail/wholesale)
  const [userMode, setUserMode] = useState<UserMode>(UserMode.VAREJO);

  // Toast notifications
  const { toast, showToast, closeToast } = useToast();

  // UI Drawers
  const drawers = useDrawers();

  // Loyalty banner
  const { loyaltyBanner, handleCloseLoyaltyBanner } = useLoyalty(currentUser);

  // Navigation
  const navigation = useNavigation({
    locale,
    currentUser,
    isAuthLoading,
    showToast,
    products,
    isStoreLoading,
  });

  // Translation helper
  const t = useCallback(
    (key: string) => {
      const keys = key.split('.');
      let result: Record<string, unknown> | string = translations[locale];
      for (const k of keys) {
        if (!result || typeof result === 'string' || (result as Record<string, unknown>)[k] === undefined) return key;
        result = (result as Record<string, unknown>)[k] as Record<string, unknown> | string;
      }
      return result as string;
    },
    [locale]
  );

  // Pending checkout state
  const [pendingCheckout, setPendingCheckout] = useState(false);

  // Splash screen state
  const [splashShown, setSplashShown] = useState(false);
  useEffect(() => {
    if (navigation.currentView === 'home' && !isStoreLoading && products.length > 0 && !splashShown) {
      const timer = setTimeout(() => {
        document.body.classList.add('loaded');
        setSplashShown(true);
      }, 300);
      return () => clearTimeout(timer);
    } else if (navigation.currentView !== 'home' && !splashShown) {
      setSplashShown(true);
    }
  }, [navigation.currentView, isStoreLoading, products.length, splashShown]);

  // Handle pending checkout after login
  useEffect(() => {
    if (currentUser && pendingCheckout) {
      setPendingCheckout(false);
      navigation.handleNavigate('checkout');
    }
  }, [currentUser, navigation, pendingCheckout]);

  // Loyalty banner click handler (opens coupons drawer)
  const handleLoyaltyBannerClick = useCallback(() => {
    handleCloseLoyaltyBanner();
    drawers.setIsCouponsOpen(true);
  }, [handleCloseLoyaltyBanner, drawers]);

  return {
    // Locale
    locale,
    setLocale,
    t,

    // User mode
    userMode,
    setUserMode,

    // Toast
    toast,
    showToast,
    closeToast,

    // Drawers
    isCartOpen: drawers.isCartOpen,
    setIsCartOpen: drawers.setIsCartOpen,
    isWishlistOpen: drawers.isWishlistOpen,
    setIsWishlistOpen: drawers.setIsWishlistOpen,
    isCouponsOpen: drawers.isCouponsOpen,
    setIsCouponsOpen: drawers.setIsCouponsOpen,
    isAuthOpen: drawers.isAuthOpen,
    setIsAuthOpen: drawers.setIsAuthOpen,

    // Loyalty
    loyaltyBanner,
    handleCloseLoyaltyBanner,
    handleLoyaltyBannerClick,

    // Navigation
    currentView: navigation.currentView,
    setCurrentView: navigation.setCurrentView,
    activeProduct: navigation.activeProduct,
    setActiveProduct: navigation.setActiveProduct,
    activeCollection: navigation.activeCollection,
    setActiveCollection: navigation.setActiveCollection,
    searchSlug: navigation.searchSlug,
    setSearchSlug: navigation.setSearchSlug,
    mainRef: navigation.mainRef,
    isScrolled: navigation.isScrolled,
    handleScroll: navigation.handleScroll,
    handleNavigate: navigation.handleNavigate,
    handleBackFromProduct: navigation.handleBackFromProduct,

    // Checkout
    pendingCheckout,
    setPendingCheckout,
  };
}
