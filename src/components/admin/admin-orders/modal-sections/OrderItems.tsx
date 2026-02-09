/**
 * Order Items Section
 */
import React from 'react';
import { Package } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import { OptimizedImage } from '../../../ui';
import type { OrderItemsProps } from '../types';

export const OrderItems: React.FC<OrderItemsProps> = ({ items, getLoc, locale }) => {
  return (
    <div className="space-y-4 pt-6 border-t border-neutral-200/50">
      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
        <Package className="w-3 h-3" /> Itens do Pedido
      </h5>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex gap-6 p-4 bg-white rounded-3xl border border-neutral-100 shadow-sm"
        >
          <OptimizedImage
            src={item.image}
            alt={getLoc(item.name)}
            size="thumbnail"
            objectFit="cover"
            className="w-16 h-20 rounded-xl"
          />
          <div className="flex-1">
            <h6 className="text-[11px] font-black uppercase tracking-tight">
              {getLoc(item.name)}
            </h6>
            <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest mt-1">
              {getLoc(item.color_name)} | {item.size}
            </p>
            <div className="mt-2 flex gap-4 text-[10px]">
              <span className="font-bold">Qtd: {item.quantity}</span>
              <span className="text-neutral-400">
                Unit: {formatCurrency(item.price, locale)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
