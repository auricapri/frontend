/**
 * Approval Column - Pending orders awaiting confirmation
 */
import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { OrderStatus } from '../../../../constants/enums';
import { formatCurrency } from '../../../../utils/currency';
import { OrderColumn } from '../OrderColumn';
import { formatDate } from '../helpers';

interface ApprovalColumnProps {
  orders: Order[];
  locale: Locale;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const ApprovalColumn: React.FC<ApprovalColumnProps> = ({
  orders,
  locale,
  onSelectOrder,
  onUpdateStatus,
}) => {
  return (
    <OrderColumn
      title="Aprovação"
      icon={<AlertOctagon className="w-4 h-4" />}
      iconBgClass="bg-neutral-100 text-neutral-700"
      count={orders.length}
    >
      {orders.map((order) => (
        <div
          key={order.id}
          onClick={() => onSelectOrder(order)}
          className="bg-neutral-50 p-5 rounded-[2rem] border border-neutral-100 hover:border-black transition-all cursor-pointer group hover:shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-sm">
                {order.items?.[0]?.name?.['pt']?.[0] || '#'}
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900 block">
                  #{order.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-[8px] font-bold text-neutral-400 uppercase">
                  {formatCurrency(order.total, locale)}
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-neutral-300">
              {formatDate(order.created_at, locale)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(order.id, OrderStatus.CONFIRMED);
              }}
              className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Aprovar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Rejeitar e Reembolsar?')) {
                  onUpdateStatus(order.id, OrderStatus.CANCELLED);
                }
              }}
              className="flex-1 py-2 bg-red-100 text-red-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-200 transition-all"
            >
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </OrderColumn>
  );
};
