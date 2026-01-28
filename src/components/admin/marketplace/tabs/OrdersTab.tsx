/**
 * OrdersTab - Marketplace orders table
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { marketplaceApi } from '../../../../api/marketplace.api';
import { formatCurrency, type Locale } from '../../../../utils/currency';
import { logger } from '../../../../utils/logger';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface OrdersTabProps {
  brand: MarketplaceBrand;
  configId?: string;
  locale: string;
}

// ============================================================================
// Component
// ============================================================================

export const OrdersTab: React.FC<OrdersTabProps> = ({ brand, configId, locale }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [configId]);

  const loadOrders = async () => {
    if (!configId) return;
    try {
      const result = await marketplaceApi.getOrders(configId, { limit: 50 });
      setOrders(result.orders || []);
    } catch (err) {
      logger.error('Failed to load orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <h3 className="text-lg font-bold mb-2">Nenhum pedido ainda</h3>
        <p className="text-neutral-500">Os pedidos do {brand.name} aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Pedido
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Data
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Comprador
            </th>
            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Total
            </th>
            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 text-sm font-mono">#{order.id}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {new Date(order.date_created).toLocaleDateString(
                  locale === 'pt' ? 'pt-BR' : 'en-US'
                )}
              </td>
              <td className="px-4 py-3 text-sm">{order.buyer?.nickname || '-'}</td>
              <td className="px-4 py-3 text-sm text-right font-medium">
                {formatCurrency(order.total_amount, locale as Locale)}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
