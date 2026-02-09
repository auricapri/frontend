/**
 * Transit Column - Shipped orders in transit
 */
import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { OrderStatus } from '../../../../constants/enums';
import { OrderColumn } from '../OrderColumn';
import { getSLAStatus, formatDate } from '../helpers';

interface TransitColumnProps {
  orders: Order[];
  locale: Locale;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const TransitColumn: React.FC<TransitColumnProps> = ({
  orders,
  locale,
  onSelectOrder,
  onUpdateStatus,
}) => {
  return (
    <OrderColumn
      title="Em Trânsito"
      icon={<Truck className="w-4 h-4" />}
      iconBgClass="bg-yellow-100 text-yellow-700"
      count={orders.length}
    >
      {orders.map((order) => {
        const sla = getSLAStatus(order);
        return (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order)}
            className={`p-5 rounded-[2rem] border transition-all cursor-pointer group hover:shadow-lg ${sla.color}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900 block mb-1">
                  #{order.id.slice(0, 6)}
                </span>
                {sla.priority > 1 && (
                  <span
                    className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                      sla.priority === 3
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {sla.label}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold text-neutral-400">
                {formatDate(order.created_at, locale)}
              </span>
            </div>
            <div className="text-[10px] font-mono bg-white/50 p-2 rounded mb-2 border border-black/5 text-center">
              {order.tracking_code}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(order.id, OrderStatus.DELIVERED);
              }}
              className="w-full mt-1 bg-white border border-green-200 text-green-600 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-green-50 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3 h-3" /> Marcar Entregue
            </button>
          </div>
        );
      })}
    </OrderColumn>
  );
};
