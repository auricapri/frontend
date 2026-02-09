/**
 * Expedition Column - Confirmed orders awaiting shipping
 */
import React from 'react';
import { Package, FileText } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { OrderColumn } from '../OrderColumn';

interface ExpeditionColumnProps {
  orders: Order[];
  locale: Locale;
  generatedDocs: Record<string, boolean>;
  onSelectOrder: (order: Order) => void;
}

export const ExpeditionColumn: React.FC<ExpeditionColumnProps> = ({
  orders,
  locale,
  generatedDocs,
  onSelectOrder,
}) => {
  return (
    <OrderColumn
      title="Expedição"
      icon={<Package className="w-4 h-4" />}
      iconBgClass="bg-blue-100 text-blue-700"
      count={orders.length}
    >
      {orders.map((order) => {
        const hasDoc = order.logistics_metadata?.doc_url || generatedDocs[order.id];
        return (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order)}
            className={`p-5 rounded-[2rem] border transition-all cursor-pointer group hover:shadow-lg ${
              hasDoc
                ? 'bg-blue-50 border-blue-200'
                : 'bg-neutral-50 border-neutral-100 hover:border-black'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900 block">
                  #{order.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-[8px] font-bold text-neutral-400 uppercase">
                  {order.items.length} Itens
                </span>
              </div>
              {hasDoc && <FileText className="w-4 h-4 text-blue-500" />}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5">
              <span className="text-xs font-black">{formatCurrency(order.total, locale)}</span>
              <span className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full group-hover:scale-105 transition-transform">
                {hasDoc ? 'Enviar' : 'Gerar Doc'}
              </span>
            </div>
          </div>
        );
      })}
    </OrderColumn>
  );
};
