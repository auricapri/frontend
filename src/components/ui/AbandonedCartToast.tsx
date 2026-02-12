import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import { CartItem } from '../../types';
import { Locale } from '../../i18n';

interface AbandonedCartToastProps {
  cartItems: CartItem[];
  onOpenCart: () => void;
  locale: Locale;
}

const TOAST_TEXT: Record<Locale, {
  waiting: string;
  viewCart: string;
  off: string;
}> = {
  pt: {
    waiting: 'Seu carrinho está te aguardando',
    viewCart: 'Ver carrinho',
    off: 'OFF',
  },
  en: {
    waiting: 'Your cart is waiting for you',
    viewCart: 'View cart',
    off: 'OFF',
  },
  es: {
    waiting: 'Tu carrito te está esperando',
    viewCart: 'Ver carrito',
    off: 'OFF',
  },
  fr: {
    waiting: 'Votre panier vous attend',
    viewCart: 'Voir le panier',
    off: 'OFF',
  },
};

const SESSION_KEY = 'abandoned_cart_toast_shown';

export const AbandonedCartToast: React.FC<AbandonedCartToastProps> = ({
  cartItems,
  onOpenCart,
  locale,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const text = TOAST_TEXT[locale] || TOAST_TEXT.pt;

  // Calculate max discount percentage from cart items
  const maxDiscount = useMemo(() => {
    let max = 0;
    for (const item of cartItems) {
      if (item.original_price && item.original_price > item.price) {
        const discount = Math.round(((item.original_price - item.price) / item.original_price) * 100);
        if (discount > max) max = discount;
      }
    }
    return max;
  }, [cartItems]);

  useEffect(() => {
    // Don't show if no items or already dismissed
    if (cartItems.length === 0 || isDismissed) {
      setIsVisible(false);
      return;
    }

    // Check if already shown in this session
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) {
      return;
    }

    // Show toast after a small delay (simulates coming from server/notification)
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }, 1500);

    return () => clearTimeout(showTimer);
  }, [cartItems.length, isDismissed]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleClick = () => {
    onOpenCart();
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-white pt-6 pb-2 px-4 md:px-6">
      <div
        onClick={handleClick}
        className="max-w-[1920px] mx-auto bg-neutral-900 text-white cursor-pointer animate-in slide-in-from-top duration-500 ease-out rounded-xl"
      >
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Icon + Message */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs md:text-sm font-medium truncate">
              {text.waiting}
            </span>
            {maxDiscount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wide rounded-full flex-shrink-0">
                {maxDiscount}% {text.off}
              </span>
            )}
          </div>
        </div>

        {/* Right: CTA + Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden md:flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-white/80 hover:text-white transition-colors">
            {text.viewCart}
            <ArrowRight className="w-3 h-3" />
          </span>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AbandonedCartToast;
