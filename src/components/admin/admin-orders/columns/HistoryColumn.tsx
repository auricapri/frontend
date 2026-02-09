/**
 * History Column - Delivered and cancelled orders
 */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { OrderStatus } from '../../../../constants/enums';
import { formatCurrency } from '../../../../utils/currency';
import { OrderColumn } from '../OrderColumn';
import { formatDate } from '../helpers';

interface HistoryColumnProps {
  orders: Order[];
  locale: Locale;
  onSelectOrder: (order: Order) => void;
}

export const HistoryColumn: React.FC<HistoryColumnProps> = ({
  orders,
  locale,
  onSelectOrder,
}) => {
  return (
    <OrderColumn
      title="Histórico"
      icon={<CheckCircle2 className="w-4 h-4" />}
      iconBgClass="bg-green-100 text-green-700"
      count={orders.length}
      opacity
    >
      {orders.map((order) => (
        <div
          key={order.id}
          onClick={() => onSelectOrder(order)}
          className="bg-neutral-50 p-5 rounded-[2rem] border border-neutral-100 hover:bg-white transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span
              className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                order.status === OrderStatus.DELIVERED
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {order.status === OrderStatus.DELIVERED ? 'Entregue' : 'Cancelado'}
            </span>
            <span className="text-[9px] font-bold text-neutral-300">
              {formatDate(order.created_at, locale)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-neutral-400">
              #{order.id.slice(0, 6)}
            </span>
            <span className="text-xs font-bold text-neutral-900">
              {formatCurrency(order.total, locale)}
            </span>
          </div>
        </div>
      ))}
    </OrderColumn>
  );
};
