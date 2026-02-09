/// useOrders Hook
/// Manages orders fetching and order selection state

import { useState, useCallback } from 'react';
import { Order } from '../../../../types';
import { OrdersState } from '../types';

interface UseOrdersParams {
  userId: string;
}

export const useOrders = ({ userId }: UseOrdersParams) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);
  const [orderReviews, setOrderReviews] = useState<Record<string, boolean>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { OrdersApi } = await import('../../../../api/orders.api');
      const { ProductReviewsApi } = await import('../../../../api/product-reviews.api');
      const ordersApi = new OrdersApi();
      const reviewsApi = new ProductReviewsApi();
      const fetchedOrders = await ordersApi.getByUserId(userId);
      setOrders(fetchedOrders);

      // Check reviews for delivered orders
      const deliveredOrders = fetchedOrders.filter(o => {
        const status = o.status?.toLowerCase();
        return status === 'delivered' || status === 'entregue';
      });

      const reviewsMap: Record<string, boolean> = {};
      for (const order of deliveredOrders) {
        try {
          const items = await reviewsApi.getOrderItemsForReview(order.id, userId);
          const hasAllReviews = items.length > 0 && items.every(item => item.has_review);
          reviewsMap[order.id] = hasAllReviews;
        } catch {
          reviewsMap[order.id] = false;
        }
      }
      setOrderReviews(reviewsMap);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const ordersState: OrdersState = {
    orders,
    loading,
    selectedOrder,
    viewingReceiptOrder,
    orderReviews,
  };

  return {
    ordersState,
    fetchOrders,
    setSelectedOrder,
    setViewingReceiptOrder,
  };
};
