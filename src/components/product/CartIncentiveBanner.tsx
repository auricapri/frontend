import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Locale } from '../../i18n';

export interface CartIncentiveBannerProps {
  itemCount: number;
  subtotal: number;
  locale: Locale;
  onGoToCart: () => void;
}

export const CartIncentiveBanner: React.FC<CartIncentiveBannerProps> = ({
  itemCount,
  subtotal,
  locale,
  onGoToCart,
}) => {
  if (itemCount === 0) return null;

  const checkoutLabel = locale === 'pt' ? 'Finalizar' : locale === 'es' ? 'Finalizar' : 'Checkout';
  const cartLabel = locale === 'pt' ? 'Seu carrinho' : locale === 'es' ? 'Tu carrito' : 'Your cart';
  const subtotalFormatted = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

  return (
    <div onClick={onGoToCart} className="cursor-pointer mx-4 md:mx-12 mb-4 md:mb-6 group">
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-stone-100 to-rose-50 border border-stone-200/60 px-4 py-3 rounded-full shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-stone-600" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-400 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <span className="text-stone-700 font-semibold text-sm">{subtotalFormatted}</span>
          </div>
          <div className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-wider">
            {checkoutLabel}
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.01]">
        <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white px-8 py-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-paper/20 rounded-full animate-ping" />
                <div className="relative bg-paper/10 p-3 rounded-full">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {itemCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">{cartLabel}</p>
                <p className="text-2xl font-light tracking-tight">
                  <span className="font-bold">{itemCount}</span> {itemCount === 1 ? 'item' : 'itens'}
                  <span className="mx-2 text-white/30">•</span>
                  <span className="text-orange-400 font-bold">{subtotalFormatted}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-paper text-black px-6 py-3 rounded-full font-bold group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
              <span className="text-xs uppercase tracking-[0.15em]">{checkoutLabel}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
