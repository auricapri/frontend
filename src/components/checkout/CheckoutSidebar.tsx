import React from 'react';
import { AlertCircle, Info, Loader2, ShieldCheck, ShoppingBag, Tag, Ticket, X } from 'lucide-react';
import { PaymentMethod } from '../../constants/enums';
import { formatCurrency } from '../../utils/currency';
import { OptimizedImage } from '../ui';
import { ShippingStep } from './steps/ShippingStep';
import { type CheckoutState } from './hooks/useCheckoutState';

export function CheckoutSidebar({ checkout }: { checkout: CheckoutState }) {
  const {
    appliedCoupon,
    cashbackUsed,
    checkoutItems,
    couponCode,
    couponError,
    couponLoading,
    finalTotal,
    getLoc,
    handleApplyCoupon,
    handleRemoveCoupon,
    itemsWithCoupon,
    itemsWithoutCoupon,
    locale,
    manualCouponDiscount,
    paymentMethod,
    pixDiscount,
    preAppliedDiscount,
    subtotal,
    setCouponCode,
    userMode,
  } = checkout;

  return (
    <div className="lg:col-span-5">
      <div className="bg-neutral-50 rounded-[3rem] p-10 md:p-12 sticky top-32 border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-4 mb-10 border-b border-neutral-100 pb-6">
          <ShoppingBag className="w-5 h-5 text-neutral-400" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Sua Sacola</h4>
        </div>
        <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-4 no-scrollbar">
          {Array.isArray(checkoutItems) && checkoutItems.length > 0 ? (
            checkoutItems.map((item, idx) => {
              const hasDiscount = item.original_price && item.original_price > item.price;
              const hasCoupon = !!item.applied_coupon_code;

              return (
                <div
                  key={idx}
                  className="flex gap-4 items-start animate-in slide-in-from-right duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-16 h-20 bg-white rounded-xl overflow-hidden flex-none border border-neutral-100 shadow-sm">
                    <OptimizedImage src={item?.image} alt={getLoc(item?.name)} size="thumbnail" objectFit="cover" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[10px] font-black uppercase tracking-tight leading-tight mb-1 truncate">{getLoc(item?.name)}</h5>
                    <p className="text-[8px] text-neutral-400 uppercase font-bold tracking-widest">
                      {getLoc(item?.color_name)} | {item?.size || 'N/A'}
                    </p>
                    <p className="text-[9px] font-black mt-1">Qtd: {item?.quantity || 0}</p>
                    {hasCoupon && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Tag className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600">{item.applied_coupon_code}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {hasDiscount && (
                      <span className="text-[9px] text-neutral-400 line-through block">
                        {formatCurrency(item.original_price! * (item?.quantity || 0), locale)}
                      </span>
                    )}
                    <span className={`text-[11px] font-black tracking-tighter ${hasCoupon ? 'text-emerald-600' : ''}`}>
                      {formatCurrency((item?.price || 0) * (item?.quantity || 0), locale)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-neutral-400 text-sm">Nenhum item no carrinho</div>
          )}
        </div>

        <div className="mb-8 pt-6 border-t border-neutral-200">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-4 h-4 text-neutral-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Cupom de Desconto</span>
          </div>

          {itemsWithCoupon.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
                    {itemsWithCoupon.length} {itemsWithCoupon.length === 1 ? 'item já possui' : 'itens já possuem'} cupom aplicado
                  </p>
                  <p className="text-[8px] text-emerald-600 mt-0.5">
                    Novos cupons serão aplicados apenas nos outros {itemsWithoutCoupon.length} {itemsWithoutCoupon.length === 1 ? 'item' : 'itens'}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {appliedCoupon ? (
            <div className="bg-black text-white rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block">{appliedCoupon.code}</span>
                  <span className="text-[8px] text-white/60 block mt-0.5">
                    {appliedCoupon.discount_type === 'percentage'
                      ? `${appliedCoupon.discount_value}% de desconto`
                      : `${formatCurrency(appliedCoupon.discount_value, locale)} de desconto`}
                  </span>
                </div>
              </div>
              <button onClick={handleRemoveCoupon} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="DIGITE O CUPOM"
                  className="flex-1 p-4 bg-white border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all placeholder:text-neutral-300"
                  disabled={itemsWithoutCoupon.length === 0}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim() || itemsWithoutCoupon.length === 0}
                  className="px-6 py-4 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aplicar'}
                </button>
              </div>
              {couponError && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-[9px] font-bold">{couponError}</span>
                </div>
              )}
              {itemsWithoutCoupon.length === 0 && (
                <p className="text-[8px] text-neutral-400 text-center">Todos os itens já possuem cupom aplicado</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-6 border-t border-neutral-200">
          {preAppliedDiscount > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
              <span>Desconto (cupons do produto)</span>
              <span>-{formatCurrency(preAppliedDiscount, locale)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, locale)}</span>
          </div>
          {manualCouponDiscount > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
              <span>Desconto ({appliedCoupon?.code})</span>
              <span>-{formatCurrency(manualCouponDiscount, locale)}</span>
            </div>
          )}

          {userMode === 'atacado' ? (
            <ShippingStep checkout={checkout} />
          ) : (
            <ShippingStep checkout={checkout} />
          )}

          {cashbackUsed > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
              <span>Cashback Aplicado</span>
              <span>-{formatCurrency(cashbackUsed, locale)}</span>
            </div>
          )}
          {paymentMethod === PaymentMethod.PIX && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-500">
              <span>Desconto PIX (5%)</span>
              <span>-{formatCurrency(pixDiscount, locale)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-8 mt-6 border-t border-neutral-100">
            <span className="text-xl font-black uppercase italic tracking-tighter">Total</span>
            <span className="text-4xl font-light tracking-tighter">{formatCurrency(finalTotal, locale)}</span>
          </div>
        </div>
        <div className="mt-12 p-8 bg-white rounded-3xl border border-neutral-100 flex items-center gap-5 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-neutral-300" />
          <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-loose">
            Transação protegida por criptografia militar de 256 bits via Auricapri Cloud Protocol.
          </span>
        </div>
      </div>
    </div>
  );
}

