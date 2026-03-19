import React from 'react';
import { ShieldCheck, ShoppingBag } from 'lucide-react';
import { PaymentMethod } from '../../constants/enums';
import { UserMode } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { OptimizedImage } from '../ui';
import { ShippingStep } from './steps/ShippingStep';
import { type CheckoutState } from './hooks/useCheckoutState';

export function CheckoutSidebar({ checkout }: { checkout: CheckoutState }) {
  const {
    bundleDiscount,
    cashbackUsed,
    finalTotal,
    getLoc,
    items,
    locale,
    paymentMethod,
    pixDiscount,
    preAppliedDiscount,
    quantityDiscount,
    subtotal,
    userMode,
  } = checkout;

  return (
    <div className="lg:col-span-5">
      <div className="bg-paper rounded-[3rem] p-4 md:p-8 lg:p-12 lg:sticky lg:top-32 border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-4 mb-10 border-b border-neutral-100 pb-6">
          <ShoppingBag className="w-5 h-5 text-neutral-600" />
          <h4 className="text-xs font-normal uppercase tracking-[0.4em]">Sua Sacola</h4>
        </div>
        <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-4 no-scrollbar">
          {Array.isArray(items) && items.length > 0 ? (
            items.map((item, idx) => {
              const hasDiscount = item.original_price && item.original_price > item.price;

              return (
                <div
                  key={idx}
                  className="flex gap-4 items-start animate-in slide-in-from-right duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-16 h-20 bg-paper rounded-xl overflow-hidden flex-none border border-neutral-100 shadow-sm">
                    <OptimizedImage src={item?.image} alt={getLoc(item?.name)} size="thumbnail" objectFit="cover" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-normal uppercase tracking-tight leading-tight mb-1 truncate">{getLoc(item?.name)}</h5>
                    <p className="text-xs text-neutral-600 uppercase font-normal tracking-widest">
                      {getLoc(item?.color_name)} | {item?.size || 'N/A'}
                    </p>
                    <p className="text-xs font-normal mt-1">Qtd: {item?.quantity || 0}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {hasDiscount && (
                      <span className="text-xs text-neutral-600 line-through block">
                        {formatCurrency(item.original_price! * (item?.quantity || 0), locale)}
                      </span>
                    )}
                    <span className="text-[11px] font-normal tracking-tighter">
                      {formatCurrency((item?.price || 0) * (item?.quantity || 0), locale)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-neutral-600 text-sm">Nenhum item no carrinho</div>
          )}
        </div>

        <div className="space-y-4 pt-6 border-t border-neutral-200">
          {/* Subtotal sempre primeiro */}
          <div className="flex justify-between items-center gap-3 text-xs font-normal uppercase tracking-widest text-neutral-700">
            <span>Subtotal</span>
            <span className="flex-shrink-0">{formatCurrency(subtotal, locale)}</span>
          </div>

          {/* Todos os descontos abaixo do subtotal */}
          {preAppliedDiscount > 0 && (
            <div className="flex justify-between items-center gap-3 text-xs font-normal uppercase tracking-wide md:tracking-widest text-emerald-600">
              <span className="leading-tight">Desconto</span>
              <span className="flex-shrink-0">-{formatCurrency(preAppliedDiscount, locale)}</span>
            </div>
          )}
          {(bundleDiscount ?? 0) > 0 && (
            <div className="flex justify-between items-center gap-3 text-xs font-normal uppercase tracking-wide md:tracking-widest text-violet-600">
              <span className="leading-tight">Acessório c/ Roupa (15%)</span>
              <span className="flex-shrink-0">-{formatCurrency(bundleDiscount!, locale)}</span>
            </div>
          )}
          {quantityDiscount > 0 && (
            <div className="flex justify-between items-center gap-3 text-xs font-normal uppercase tracking-wide md:tracking-widest text-amber-600">
              <span className="leading-tight">Desconto Qtd</span>
              <span className="flex-shrink-0">-{formatCurrency(quantityDiscount, locale)}</span>
            </div>
          )}
          {paymentMethod === PaymentMethod.PIX && pixDiscount > 0 && (
            <div className="flex justify-between items-center gap-3 text-xs font-normal uppercase tracking-wide md:tracking-widest text-green-500">
              <span className="leading-tight">Desconto PIX (5%)</span>
              <span className="flex-shrink-0">-{formatCurrency(pixDiscount, locale)}</span>
            </div>
          )}

          <ShippingStep checkout={checkout} />

          {cashbackUsed > 0 && (
            <div className="flex justify-between items-center gap-3 text-xs font-normal uppercase tracking-wide md:tracking-widest text-emerald-600">
              <span className="leading-tight">Cashback</span>
              <span className="flex-shrink-0">-{formatCurrency(cashbackUsed, locale)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-8 mt-6 border-t border-neutral-200">
            <span className="text-xl font-normal uppercase tracking-tighter">Total</span>
            <span className="text-4xl font-light tracking-tighter">{formatCurrency(finalTotal, locale)}</span>
          </div>
        </div>
        <div className="mt-12 p-8 bg-paper rounded-3xl border border-neutral-100 flex items-center gap-5 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-neutral-300" />
          <span className="text-xs font-normal uppercase tracking-widest text-neutral-600 leading-loose">
            Pagamento seguro via Asaas. Seus dados são protegidos com criptografia SSL 256 bits.
          </span>
        </div>
      </div>
    </div>
  );
}

