import React, { useCallback, useEffect } from 'react';
import { calculatePrice } from '../utils/product';
import { trackingService } from '../services/tracking.service';
import { useStoreData } from '../hooks/useStoreData';
import { useAuthContext } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { useCartContext, CartProvider } from '../context/CartContext';
import { type CartItem, type Product, type Category, type Collection, type Banner, type Coupon, type Asset, type SizeGuide, type StoreConfig } from '../types';
import { useAppState } from './hooks/useAppState';
import { useOrderProcessing } from './hooks/useOrderProcessing';
import { AppProviders } from './AppProviders';
import { AppRouter } from './AppRouter';
import { BackToTop } from '../components/ui/BackToTop';

interface StoreDataProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  coupons: Coupon[];
  assets: Asset[];
  sizeGuides: SizeGuide[];
  storeConfig: StoreConfig;
  isLoading: boolean;
  refetchStoreData: () => void;
}

// Reload broken images when the page comes back to the foreground.
// Mobile browsers cancel in-flight lazy-load requests when the screen locks.
// On resume, those <img> elements are left blank — resetting src triggers a retry.
function useImageReloadOnVisible() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      document.querySelectorAll<HTMLImageElement>('img').forEach(img => {
        if (!img.complete || img.naturalWidth === 0) {
          const src = img.src;
          img.src = '';
          img.src = src;
        }
      });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}

function AppRootContent({ storeData }: { storeData: StoreDataProps }) {
  useImageReloadOnVisible();
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
    refetchStoreData,
  } = storeData;

  const { currentUser, isLoading: isAuthLoading, userOrders, signOut } = useAuthContext();
  const { wishlistIds, toggleWishlist } = useWishlist(currentUser?.id);

  // Use CartContext - single source of truth for cart state
  const cart = useCartContext();
  const { cartItems, setCartItems, addToCart: cartAddToCart, updateQuantity: cartUpdateQuantity, validateStock } = cart;

  const appState = useAppState({
    products,
    collections,
    isStoreLoading: isLoading,
    currentUser,
    isAuthLoading,
    onRefetchStoreData: refetchStoreData,
  });

  const orderProcessing = useOrderProcessing({
    cartItems,
    setCartItems,
    products,
    assets,
    currentUser,
    userMode: appState.userMode,
    onRefetchStoreData: refetchStoreData,
    onNavigate: appState.handleNavigate as (view: string) => void,
    onShowToast: appState.showToast,
  });

  // Auto-navigate to checkout when a WhatsApp cart token is loaded
  useEffect(() => {
    const handleCartToken = () => {
      // Small delay to let cart state update
      setTimeout(() => {
        appState.handleNavigate('checkout');
      }, 500);
    };

    window.addEventListener('cart-token-loaded', handleCartToken);
    return () => window.removeEventListener('cart-token-loaded', handleCartToken);
  }, [appState]);

  const handleCheckoutIntent = useCallback(() => {
    const stockCheck = validateStock();
    if (!stockCheck.valid) {
      appState.showToast(stockCheck.error || 'Erro de validação de estoque.', 'error');
      return;
    }

    appState.setIsCartOpen(false);
    if (!currentUser) {
      appState.setPendingCheckout(true);
      appState.setIsAuthOpen(true);
      return;
    }

    trackingService.trackCheckoutStart(
      cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      cartItems.reduce((acc, item) => acc + item.quantity, 0)
    );
    appState.handleNavigate('checkout');
  }, [appState, cartItems, currentUser, validateStock]);

  const addToCart = useCallback(
    (cartItem: CartItem) => {
      const result = cartAddToCart(cartItem);
      if (!result.success) {
        appState.showToast(result.error || 'Erro ao adicionar ao carrinho.', 'error');
        return;
      }
      appState.setIsCartOpen(true);
      trackingService.trackCartAdd(cartItem.product_id, cartItem.variant_id, cartItem.quantity);
    },
    [appState, cartAddToCart]
  );

  const handleUpdateQuantity = useCallback(
    (id: string, delta: number) => {
      cartUpdateQuantity(id, delta);
    },
    [cartUpdateQuantity]
  );

  const handleToggleWishlist = useCallback(
    async (id: string) => {
      if (!currentUser) {
        appState.setIsAuthOpen(true);
        return;
      }
      await toggleWishlist(id);
    },
    [appState, currentUser, toggleWishlist]
  );

  const handleBuyAllWishlist = useCallback(() => {
    if (!currentUser) {
      appState.setIsAuthOpen(true);
      return;
    }

    const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
    wishlistedProducts.forEach((product) => {
      const variant = product.variants?.[0];
      if (!variant) return;
      addToCart({
        variant_id: variant.id,
        product_id: product.id,
        name: product.name,
        image: variant.variant_images[0] || product.base_images[0],
        size: variant.size || 'N/A',
        color_name: variant.color_name,
        color_hex: variant.color_hex || '#000',
        price: calculatePrice(variant, appState.userMode, product),
        quantity: 1,
        sku: variant.sku,
      } as CartItem);
    });

    appState.setIsWishlistOpen(false);
    appState.setIsCartOpen(true);
  }, [addToCart, appState, currentUser, products, wishlistIds]);

  const app = {
    ...appState,
    onNavigate: appState.handleNavigate,
    products,
    categories,
    collections,
    banners,
    coupons,
    assets,
    sizeGuides,
    storeConfig,
    isLoading,
    currentUser,
    userOrders,
    cartItems,
    setCartItems,
    wishlistIds,
    toggleWishlist,
    handleToggleWishlist,
    handleBuyAllWishlist,
    addToCart,
    handleUpdateQuantity,
    isProcessingOrder: orderProcessing.isProcessingOrder,
    orderResult: orderProcessing.orderResult,
    handleCloseOrderResult: orderProcessing.handleCloseOrderResult,
    handlePlaceOrder: orderProcessing.handlePlaceOrder,
    handleCheckoutIntent,
    signOut,
    onRefetchStoreData: refetchStoreData,
  };

  return (
    <>
      <AppRouter
        app={app}
        storeConfig={storeConfig}
        lastSuccessOrder={orderProcessing.lastSuccessOrder}
        onSignOut={signOut}
        onSetCurrentView={appState.setCurrentView}
      />
      <BackToTop />
    </>
  );
}

/**
 * Wrapper component that provides store data and sets up CartProvider.
 * This separation ensures CartProvider has access to products/assets
 * before any child component tries to use useCartContext.
 */
function AppRootWrapper() {
  const storeData = useStoreData();

  return (
    <CartProvider products={storeData.products} assets={storeData.assets}>
      <AppRootContent
        storeData={{
          products: storeData.products,
          categories: storeData.categories,
          collections: storeData.collections,
          banners: storeData.banners,
          coupons: storeData.coupons,
          assets: storeData.assets,
          sizeGuides: storeData.sizeGuides,
          storeConfig: storeData.storeConfig,
          isLoading: storeData.isLoading,
          refetchStoreData: storeData.refetch,
        }}
      />
    </CartProvider>
  );
}

export function AppRoot() {
  return (
    <AppProviders>
      <AppRootWrapper />
    </AppProviders>
  );
}
