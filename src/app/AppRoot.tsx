import React, { useCallback, useEffect, useState } from 'react';
import { calculatePrice } from '../utils/product';
import { trackingService } from '../services/tracking.service';
import { useStoreData } from '../hooks/useStoreData';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';
import { OrdersApi } from '../api/orders.api';
import { type CartItem, type Order } from '../types';
import { useAppState } from './hooks/useAppState';
import { useOrderProcessing } from './hooks/useOrderProcessing';
import { AppProviders } from './AppProviders';
import { AppRouter } from './AppRouter';

export function AppRoot() {
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
    refetch: refetchStoreData,
  } = useStoreData();

  const { currentUser, isLoading: isAuthLoading, signOut } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist(currentUser?.id);

  const appState = useAppState({
    products,
    collections,
    isStoreLoading: isLoading,
    currentUser,
    isAuthLoading,
    onRefetchStoreData: refetchStoreData,
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!currentUser?.id) {
        setUserOrders([]);
        return;
      }
      try {
        const ordersApi = new OrdersApi();
        const orders = await ordersApi.getByUserId(currentUser.id);
        setUserOrders(orders || []);
      } catch {
        setUserOrders([]);
      }
    };
    fetchUserOrders();
  }, [currentUser?.id]);

  const orderProcessing = useOrderProcessing({
    cartItems,
    setCartItems,
    products,
    assets,
    currentUser,
    userMode: appState.userMode,
    onRefetchStoreData: refetchStoreData,
    onNavigate: appState.handleNavigate as any,
    onShowToast: appState.showToast,
  });

  const handleCheckoutIntent = useCallback(() => {
    const stockCheck = orderProcessing.validateCartStock();
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
  }, [appState, cartItems, currentUser, orderProcessing]);

  const addToCart = useCallback(
    (cartItem: CartItem) => {
      const product = products.find((p) => p.id === cartItem.product_id);
      const variant = product?.variants?.find((v) => v.id === cartItem.variant_id);
      const maxStock = variant?.stock_quantity || 0;

      if (cartItem.quantity > maxStock) {
        appState.showToast('Estoque insuficiente.', 'error');
        return;
      }
      const existingItem = cartItems.find((item) => item.variant_id === cartItem.variant_id);
      const currentQtyInCart = existingItem ? existingItem.quantity : 0;
      if (currentQtyInCart + cartItem.quantity > maxStock) {
        appState.showToast(`Limite atingido!`, 'error');
        return;
      }

      setCartItems((prev) => {
        const existing = prev.find((item) => item.variant_id === cartItem.variant_id);
        if (existing) {
          return prev.map((item) => (item.variant_id === cartItem.variant_id ? { ...item, quantity: item.quantity + cartItem.quantity } : item));
        }
        return [...prev, cartItem];
      });
      appState.setIsCartOpen(true);
      trackingService.trackCartAdd(cartItem.product_id, cartItem.variant_id, cartItem.quantity);
    },
    [appState, cartItems, products]
  );

  const handleUpdateQuantity = useCallback(
    (id: string, delta: number) => {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.variant_id !== id) return item;
          const product = products.find((p) => p.id === item.product_id);
          const variant = product?.variants?.find((v) => v.id === item.variant_id);
          const maxStock = variant?.stock_quantity || 0;
          if (delta > 0 && item.quantity + delta > maxStock) {
            appState.showToast(`Estoque máximo atingido.`, 'error');
            return item;
          }
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        })
      );
    },
    [appState, products]
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
      } as any);
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
    <AppProviders>
      <AppRouter
        app={app}
        storeConfig={storeConfig}
        lastSuccessOrder={orderProcessing.lastSuccessOrder}
        userOrders={userOrders}
        onExitAdmin={appState.exitAdmin}
        onSignOut={signOut}
        onSetCurrentView={appState.setCurrentView}
      />
    </AppProviders>
  );
}
