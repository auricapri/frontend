/// useOrders Hook
/// Manages orders fetching and order selection state

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order } from '../../../../types';
import { OrdersState } from '../types';

interface UseOrdersParams {
  userId: string;
  enabled?: boolean;
}

export const useOrders = ({ userId, enabled = false }: UseOrdersParams) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);

  const { data: ordersData, isLoading: loading, refetch: fetchOrders } = useQuery<{
    orders: Order[];
    orderReviews: Record<string, boolean>;
  }>({
    queryKey: ['user-orders', userId],
    queryFn: async () => {
      const { OrdersApi } = await import('../../../../api/orders.api');
      const { ProductReviewsApi } = await import('../../../../api/product-reviews.api');
      const ordersApi = new OrdersApi();
      const reviewsApi = new ProductReviewsApi();
      const fetchedOrders = await ordersApi.getByUserId(userId);

      const deliveredOrders = fetchedOrders.filter((o) => {
        const status = o.status?.toLowerCase();
        return status === 'delivered' || status === 'entregue';
      });

      const reviewsMap: Record<string, boolean> = {};
      for (const order of deliveredOrders) {
        try {
          const items = await reviewsApi.getOrderItemsForReview(order.id, userId);
          reviewsMap[order.id] = items.length > 0 && items.every((item) => item.has_review);
        } catch {
          reviewsMap[order.id] = false;
        }
      }

      return { orders: fetchedOrders, orderReviews: reviewsMap };
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const orders: Order[] = ordersData?.orders ?? [];
  const orderReviews: Record<string, boolean> = ordersData?.orderReviews ?? {};

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
