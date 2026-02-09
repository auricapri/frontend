/**
 * Transit Stage - Order shipped/delivered state
 */
import React from 'react';
import { Truck } from 'lucide-react';
import type { TransitStageProps } from '../types';

export const TransitStage: React.FC<TransitStageProps> = ({ order }) => {
  return (
    <div className="bg-green-50 border border-green-100 p-8 rounded-[2.5rem] flex items-center justify-center flex-col text-green-800">
      <Truck className="w-12 h-12 mb-4" />
      <h3 className="text-xl font-black uppercase tracking-tighter">Pedido em Rota</h3>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-2 bg-white px-4 py-2 rounded-lg shadow-sm mb-4">
        {order.tracking_code}
      </p>
      <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest opacity-60">
        <span>Prazo Cliente: {order.internal_logistics?.display_days_was}d</span>
        <span>Prazo Real: {order.internal_logistics?.estimated_days}d</span>
      </div>
    </div>
  );
};
