import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { UserMode } from '../../../types';
import { type CheckoutState } from '../hooks/useCheckoutState';

export function ShippingStep({ checkout }: { checkout: CheckoutState }) {
  const { locale, userMode, shipping } = checkout;

  // ATACADO: show all shipping options
  if (userMode === UserMode.ATACADO && shipping.shippingOptions.length > 0) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-normal uppercase tracking-widest text-neutral-600 mb-2">Opções de Frete</div>
        {shipping.shippingOptions.map((option, idx) => {
          const isSelected = shipping.selectedShippingOption?.method === option.method;
          const isCheapest = option.real_cost === Math.min(...shipping.shippingOptions.map((o) => o.real_cost));
          const isFastest = option.estimated_days === Math.min(...shipping.shippingOptions.map((o) => o.estimated_days));

          return (
            <button
              key={idx}
              onClick={() => shipping.setSelectedShippingOption(option)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                isSelected ? 'border-neutral-900 bg-paper' : 'border-neutral-100 hover:border-neutral-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-[11px] font-normal uppercase tracking-tight">
                    {/^\d+$/.test(option.method) ? option.provider : `${option.provider} — ${option.method}`}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {isCheapest && (
                      <span className="text-xs font-normal uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Mais Barato
                      </span>
                    )}
                    {isFastest && (
                      <span className="text-xs font-normal uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Mais Rápido
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-normal tracking-tighter">{formatCurrency(option.display_price_was, locale)}</div>
                  <div className="text-xs text-neutral-600 uppercase tracking-widest mt-0.5">{option.estimated_days} dias</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // VAREJO with options: show free + express + carrier choices
  const varejoCarrierOptions = shipping.shippingOptions.filter(o => o.real_cost > 0);
  if (
    userMode !== UserMode.ATACADO &&
    !shipping.calculatingShipping &&
    shipping.shippingDisplay &&
    (shipping.expressOption || varejoCarrierOptions.length > 0)
  ) {
    const isFreeSelected = shipping.selectedVarejoShipping === 'free' && !shipping.selectedVarejoCarrierOption;
    return (
      <div className="space-y-2">
        <div className="text-xs font-normal uppercase tracking-widest text-neutral-600 mb-2">Opção de Entrega</div>

        {/* Free shipping button */}
        <button
          onClick={() => shipping.setSelectedVarejoShipping('free')}
          className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
            isFreeSelected ? 'border-neutral-900 bg-paper' : 'border-neutral-100 hover:border-neutral-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[11px] font-normal uppercase tracking-tight">Frete Grátis</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">{shipping.shippingDisplay.days} dias úteis</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-neutral-400 line-through decoration-red-500 decoration-2">
                {formatCurrency(shipping.shippingDisplay.price, locale)}
              </div>
              <div className="text-[12px] font-normal text-green-600">GRÁTIS</div>
            </div>
          </div>
        </button>

        {/* Express shipping button */}
        {shipping.expressOption && (
          <button
            onClick={() => shipping.setSelectedVarejoShipping('express')}
            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
              shipping.selectedVarejoShipping === 'express'
                ? 'border-neutral-900 bg-paper'
                : 'border-neutral-100 hover:border-neutral-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[11px] font-normal uppercase tracking-tight flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-blue-600" />
                  Entrega Expressa
                  <span className="text-[10px] font-normal uppercase tracking-widest text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    Mais Rápido
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">{shipping.expressOption.estimated_days} dias úteis</div>
              </div>
              <div className="text-[12px] font-normal tracking-tighter">
                {formatCurrency(shipping.expressOption.real_cost, locale)}
              </div>
            </div>
          </button>
        )}

        {/* Carrier options */}
        {varejoCarrierOptions.map((opt, idx) => {
          const isSelected =
            shipping.selectedVarejoCarrierOption?.method === opt.method &&
            shipping.selectedVarejoCarrierOption?.provider === opt.provider;
          return (
            <button
              key={idx}
              onClick={() => shipping.setVarejoCarrierOption(opt)}
              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                isSelected ? 'border-neutral-900 bg-paper' : 'border-neutral-100 hover:border-neutral-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[11px] font-normal uppercase tracking-tight">
                    {/^\d+$/.test(opt.method) ? opt.provider : `${opt.provider} — ${opt.method}`}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{opt.estimated_days} dias úteis</div>
                </div>
                <div className="text-[12px] font-normal tracking-tighter">
                  {formatCurrency(opt.real_cost, locale)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // VAREJO default: show GRÁTIS or loading
  return (
    <>
      <div className="flex justify-between items-center gap-3 text-xs font-normal uppercase tracking-wide md:tracking-widest text-neutral-600">
        <span className="flex-shrink-0">Frete</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {shipping.calculatingShipping ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Calc...
            </span>
          ) : shipping.shippingDisplay ? (
            <>
              <span className="line-through text-neutral-500 decoration-red-500 decoration-2 font-medium text-[10px]">
                {formatCurrency(shipping.shippingDisplay.price, locale)}
              </span>
              <span className="text-green-500 font-normal">GRÁTIS</span>
            </>
          ) : (
            <span className="text-neutral-300">Aguardando CEP</span>
          )}
        </div>
      </div>
      {shipping.shippingDisplay && !shipping.calculatingShipping && (
        <div className="text-right text-[10px] font-normal text-neutral-500 uppercase tracking-wide md:tracking-widest">
          {shipping.shippingDisplay.days} dias úteis
        </div>
      )}
    </>
  );
}
