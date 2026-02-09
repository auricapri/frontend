/**
 * Financial Summary Section
 */
import React from 'react';
import { Receipt, CreditCard, Landmark, Truck, Package } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import type { FinancialSummaryProps } from '../types';

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  economics,
  locale,
}) => {
  return (
    <div className="w-full md:w-[40%] bg-white border-l border-neutral-100 flex flex-col">
      <div className="p-10 border-b border-neutral-100">
        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
          <Receipt className="w-4 h-4" /> Extrato Financeiro
        </h5>

        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
            <span className="text-[11px] font-black uppercase tracking-widest">
              Valor Pago
            </span>
            <span className="text-xl font-medium tracking-tighter text-neutral-900">
              {formatCurrency(economics.revenue, locale)}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-red-500">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Gateway
                </span>
              </div>
              <span className="text-xs font-mono font-medium">
                -{formatCurrency(economics.gatewayFee, locale)}
              </span>
            </div>
            <div className="flex justify-between items-center text-red-500">
              <div className="flex items-center gap-2">
                <Landmark className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  DAS MEI
                </span>
              </div>
              <span className="text-xs font-mono font-medium">
                -{formatCurrency(economics.dasProportional, locale)}
              </span>
            </div>
            <div className="flex justify-between items-center text-red-500">
              <div className="flex items-center gap-2">
                <Truck className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Frete Real
                </span>
              </div>
              <span className="text-xs font-mono font-medium">
                -{formatCurrency(economics.freightReal, locale)}
              </span>
            </div>
            <div className="flex justify-between items-center text-red-400 opacity-80">
              <div className="flex items-center gap-2">
                <Package className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  CMV
                </span>
              </div>
              <span className="text-xs font-mono font-medium">
                -{formatCurrency(economics.cogs, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-10 bg-neutral-50 flex flex-col justify-center">
        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-lg text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 block mb-2">
            Lucro Líquido Real
          </span>
          <span
            className={`text-4xl font-bold tracking-tighter block mb-2 ${
              economics.netProfit > 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {formatCurrency(economics.netProfit, locale)}
          </span>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
              economics.netProfit > 0
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {economics.marginPercent.toFixed(1)}% Margem
          </div>
        </div>
      </div>
    </div>
  );
};
