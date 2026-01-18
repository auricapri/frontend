import { useCallback, useState } from 'react';
import { OrdersApi } from '../../api/orders.api';
import { UsersApi } from '../../api/users.api';
import { PaymentMethod } from '../../constants/enums';
import { trackingService } from '../../services/tracking.service';
import { logger } from '../../utils/logger';
import {
  type AddressData,
  type Asset,
  type CartItem,
  type InternalLogisticsInfo,
  type Order,
  type Product,
  UserMode,
  type UserProfile,
} from '../../types';

export function useOrderProcessing(params: {
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  products: Product[];
  assets: Asset[];
  currentUser: UserProfile | null;
  userMode: UserMode;
  onRefetchStoreData: () => void;
  onNavigate: (view: any, targetSection?: string, product?: Product) => void;
  onShowToast: (message: string, type?: 'info' | 'error') => void;
}) {
  const { assets, cartItems, currentUser, onNavigate, onRefetchStoreData, onShowToast, products, setCartItems, userMode } = params;

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<{ status: 'success' | 'error'; orderId?: string; message?: string; fullOrder?: Order } | null>(null);
  const [lastSuccessOrder, setLastSuccessOrder] = useState<Order | null>(null);

  const validateCartStock = useCallback((): { valid: boolean; error?: string } => {
    if (userMode === UserMode.ATACADO) {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < 10) {
        return {
          valid: false,
          error: `Mínimo de 10 peças necessário no modo Atacado. Você tem ${totalQuantity} peça(s) no carrinho.`,
        };
      }
    }

    const requiredAssets: Record<string, number> = {};

    for (const item of cartItems) {
      const product = products.find((p) => p.id === item.product_id);
      const variant = product?.variants?.find((v) => v.id === item.variant_id);
      if (!variant) continue;

      if (item.quantity > variant.stock_quantity) {
        return { valid: false, error: `Estoque insuficiente para o produto: ${typeof item.name === 'string' ? item.name : (item.name as any).pt}` };
      }

      if (variant.correlated_assets) {
        variant.correlated_assets.forEach((link) => {
          const totalNeeded = link.quantity_required * item.quantity;
          requiredAssets[link.asset_id] = (requiredAssets[link.asset_id] || 0) + totalNeeded;
        });
      }
    }

    for (const [assetId, qty] of Object.entries(requiredAssets)) {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        return { valid: false, error: `Erro interno: Insumo necessário não encontrado.` };
      }
      if (qty > asset.stock_quantity) {
        return {
          valid: false,
          error: `Não há estoque suficiente do insumo: ${asset.name}. Necessário: ${qty}, Disponível: ${asset.stock_quantity}.`,
        };
      }
    }

    return { valid: true };
  }, [assets, cartItems, products, userMode]);

  const handleCheckoutIntent = useCallback(() => {
    const stockCheck = validateCartStock();
    if (!stockCheck.valid) {
      onShowToast(stockCheck.error || 'Erro de validação de estoque.', 'error');
      return;
    }

    if (!currentUser) {
      onShowToast('Faça login para continuar.', 'info');
      return;
    }

    trackingService.trackCheckoutStart(
      cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      cartItems.reduce((acc, item) => acc + item.quantity, 0)
    );
    onNavigate('checkout');
  }, [cartItems, currentUser, onNavigate, onShowToast, validateCartStock]);

  const handlePlaceOrder = useCallback(
    async (
      addressData: AddressData,
      logisticsInfo: InternalLogisticsInfo,
      paymentMethod: PaymentMethod,
      finalAmount: number,
      saveCard: boolean,
      cardToken?: string,
      phone?: string
    ) => {
      if (cartItems.length === 0) return;
      setIsProcessingOrder(true);

      const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const ordersApi = new OrdersApi();
      const usersApi = new UsersApi();

      try {
        if (currentUser && phone && phone.trim() && (!currentUser.phone || !currentUser.phone.trim())) {
          try {
            const cleanedPhone = phone.replace(/\D/g, '');
            if (cleanedPhone.length >= 10) {
              await usersApi.updateProfile({ phone: cleanedPhone });
            }
          } catch {
            return;
          }
        }

        if (currentUser && paymentMethod === PaymentMethod.CREDIT_CARD && saveCard && !cardToken) {
          logger.info('Payment method saving not yet implemented via API');
        }

        const orderData = await ordersApi.create({
          items: cartItems,
          addressData,
          logisticsInfo,
          paymentMethod,
          subtotal,
          finalAmount,
        });

        const trackPurchaseWithRetry = async (attempts = 3) => {
          for (let i = 0; i < attempts; i++) {
            try {
              trackingService.trackPurchase(
                orderData.id,
                finalAmount,
                cartItems.map((item) => ({ product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity, price: item.price }))
              );
              return;
            } catch {
              if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              }
            }
          }
          logger.warn('Failed to track purchase after retries', { orderId: orderData.id });
        };
        trackPurchaseWithRetry();

        const fullOrder: Order = {
          ...orderData,
          items: cartItems,
          total: finalAmount,
          subtotal,
          discount_amount: subtotal - finalAmount,
          payment_method: paymentMethod,
        };

        setLastSuccessOrder(fullOrder);
        setCartItems([]);
        onRefetchStoreData();
        setOrderResult({ status: 'success', orderId: orderData.id, fullOrder });
      } catch (err: any) {
        setOrderResult({ status: 'error', message: err.message });
      } finally {
        setIsProcessingOrder(false);
      }
    },
    [cartItems, currentUser, onRefetchStoreData, setCartItems]
  );

  const handleCloseOrderResult = useCallback(() => {
    const wasSuccess = orderResult?.status === 'success';
    const order = orderResult?.fullOrder;
    setOrderResult(null);
    if (wasSuccess && order) {
      onNavigate('receipt');
    }
  }, [onNavigate, orderResult]);

  return {
    isProcessingOrder,
    orderResult,
    lastSuccessOrder,
    setLastSuccessOrder,
    validateCartStock,
    handleCheckoutIntent,
    handlePlaceOrder,
    handleCloseOrderResult,
  };
}

