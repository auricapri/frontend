import { useState, useEffect } from 'react';
import { Order } from '../types';
import { OrdersApi } from '../api/orders.api';

export const useOrders = (userId?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ordersApi = new OrdersApi();

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await ordersApi.getByUserId(userId);
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  return {
    orders,
    isLoading,
    refetch: async () => {
      if (userId) {
        const data = await ordersApi.getByUserId(userId);
        setOrders(data);
      }
    }
  };
};

