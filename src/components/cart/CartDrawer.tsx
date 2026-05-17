
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { X, Minus, Plus, Trash2, ArrowRight, Ticket, ChevronDown, Sparkles, Check, Loader2 } from 'lucide-react';
import { CartItem, Product, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { createGetLoc } from '../../utils/localization';
import BoxSavingsIndicator, { calculateQuantityDiscount } from './BoxSavingsIndicator';
import { getOptimizedImageUrl, handleImageError } from '../../utils/image';
import { computeAccessoryBundleDiscount, isAccessoryItem, ACCESSORY_BUNDLE_DISCOUNT_PCT } from '../../utils/product';
import { CouponsApi } from '../../api/coupons.api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  products?: Product[];
  userMode: UserMode;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void | Promise<void>;
  t: (key: string) => any;
  locale: Locale;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  products = [],
  userMode,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  t,
  locale
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null);
  const [showBundleToast, setShowBundleToast] = useState(false);
  const prevHasBundleRef = useRef(false);
  const couponsApi = useMemo(() => new CouponsApi(), []);

  // Restore applied coupon from sessionStorage when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    const saved = sessionStorage.getItem('cart_coupon_code');
    const savedType = sessionStorage.getItem('cart_coupon_type');
    const savedValue = sessionStorage.getItem('cart_coupon_value');
    if (saved && savedType && savedValue) {
      setAppliedCoupon({ code: saved, discount_type: savedType, discount_value: parseFloat(savedValue) });
    }
  }, [isOpen]);

  const handleApplyCoupon = useCallback(async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const coupon = await couponsApi.getByCode(code);
      if (!coupon) {
        setCouponError('Cupom inválido ou expirado');
        return;
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('Este cupom expirou');
        return;
      }
      setAppliedCoupon({ code, discount_type: coupon.discount_type, discount_value: coupon.discount_value });
      sessionStorage.setItem('cart_coupon_code', code);
      sessionStorage.setItem('cart_coupon_type', coupon.discount_type);
      sessionStorage.setItem('cart_coupon_value', String(coupon.discount_value));
      setCouponCode('');
      setIsCouponOpen(false);
    } catch {
      setCouponError('Erro ao validar cupom. Tente novamente.');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, couponsApi]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
    sessionStorage.removeItem('cart_coupon_code');
    sessionStorage.removeItem('cart_coupon_type');
    sessionStorage.removeItem('cart_coupon_value');
  }, []);

  const getLoc = useMemo(() => createGetLoc(locale), [locale]);

  const bundleDiscount = useMemo(
    () => computeAccessoryBundleDiscount(items, products),
    [items, products]
  );

  const hasBundlePromo = useMemo(() => {
    if (products.length === 0) return false;
    const hasClothing = items.some(i => !isAccessoryItem(i, products));
    const hasAccessory = items.some(i => isAccessoryItem(i, products));
    return hasClothing && hasAccessory;
  }, [items, products]);

  // Show toast briefly when bundle promo first activates
  useEffect(() => {
    if (hasBundlePromo && !prevHasBundleRef.current) {
      setShowBundleToast(true);
      const timer = setTimeout(() => setShowBundleToast(false), 3500);
      prevHasBundleRef.current = true;
      return () => clearTimeout(timer);
    }
    if (!hasBundlePromo) {
      prevHasBundleRef.current = false;
    }
  }, [hasBundlePromo]);

  const getEffectivePrice = (item: CartItem) => {
    if (hasBundlePromo && isAccessoryItem(item, products)) {
      return item.price * (1 - ACCESSORY_BUNDLE_DISCOUNT_PCT / 100);
    }
    return item.price;
  };

  const subtotal = items.reduce((sum, item) => sum + (getEffectivePrice(item) * item.quantity), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const { discountValue: boxDiscount } = calculateQuantityDiscount(totalQuantity, subtotal);
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const base = subtotal - boxDiscount;
    if (appliedCoupon.discount_type === 'percentage') return Math.round(base * (appliedCoupon.discount_value / 100) * 100) / 100;
    return Math.min(appliedCoupon.discount_value, base);
  }, [appliedCoupon, subtotal, boxDiscount]);
  const rawTotal = subtotal - boxDiscount - couponDiscount;
  // Gateway minimum: coupon can't bring total below R$5.00 (Asaas rejects values below R$5)
  const finalTotal = appliedCoupon && rawTotal < 5.00 ? 5.00 : rawTotal;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div role="dialog" aria-modal="true" className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-paper z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-serif text-xl font-light tracking-widest uppercase">{t('cart.title')} ({items.length})</h2>
          <button onClick={onClose} aria-label="Close drawer" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bundle toast — brief, auto-dismisses */}
        {showBundleToast && (
          <div className="mx-4 mt-2 px-3 py-2 bg-violet-600 text-white rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {ACCESSORY_BUNDLE_DISCOUNT_PCT}% OFF nos acessórios aplicado!
            </span>
          </div>
        )}

        {/* Box Savings Indicator */}
        {items.length > 0 && (
          <div className="px-4 pt-2">
            <BoxSavingsIndicator
              itemCount={items.reduce((sum, item) => sum + item.quantity, 0)}
              subtotal={subtotal}
              locale={locale}
            />
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 space-y-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <span className="text-4xl font-light">{t('cart.empty')}</span>
              <button onClick={onClose} className="text-sm underline tracking-widest text-black">{t('cart.continue')}</button>
            </div>
          ) : (
            items.map((item) => {
              const effectivePrice = getEffectivePrice(item);
              const hasBundleOnItem = hasBundlePromo && isAccessoryItem(item, products);
              const itemHasDiscount = (item.original_price && item.original_price > item.price) || hasBundleOnItem;
              const displayOriginal = hasBundleOnItem ? item.price : (item.original_price ?? item.price);
              return (
                <div key={`${item.variant_id}-${item.size}-${item.color_hex}`} className="flex gap-3 animate-in fade-in slide-in-from-right duration-300">
                  <div className="w-24 h-32 bg-gray-100 flex-none overflow-hidden rounded-xl">
                    <img src={getOptimizedImageUrl(item.image, 'thumbnail')} alt={getLoc(item.name)} className="w-full h-full object-cover" onError={handleImageError} />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-serif text-xs font-black uppercase tracking-tight leading-tight">{getLoc(item.name)}</h3>
                          {hasBundleOnItem && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 flex items-center gap-0.5 mt-0.5">
                              <Sparkles className="w-2.5 h-2.5" />{ACCESSORY_BUNDLE_DISCOUNT_PCT}% off
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {itemHasDiscount && (
                            <p className="text-[10px] text-neutral-400 line-through">{formatCurrency(displayOriginal * item.quantity, locale)}</p>
                          )}
                          <p className={`text-sm font-semibold ${hasBundleOnItem ? 'text-violet-700' : ''}`}>{formatCurrency(effectivePrice * item.quantity, locale)}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{getLoc(item.color_name)} / {item.size}</p>
                    </div>

                    <div className="flex justify-between items-center mt-1.5">
                      <div className="flex items-center bg-neutral-50 rounded-lg border border-neutral-100">
                        <button onClick={() => onUpdateQuantity(item.variant_id, -1)} className="px-3 py-1.5 hover:bg-neutral-100 transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-black">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.variant_id, 1)} className="px-3 py-1.5 hover:bg-neutral-100 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => onRemoveItem(item.variant_id)} className="p-2 text-neutral-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="px-4 md:px-6 pt-3 pb-4 border-t border-gray-100 bg-paper" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            {/* Totals */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-400">{t('cart.subtotal')}</span>
                <span className="text-xl font-light">{formatCurrency(finalTotal, locale)}</span>
              </div>
              {bundleDiscount > 0 && (
                <p className="text-[10px] text-violet-600 text-right font-bold uppercase tracking-wider">
                  Acessório + Roupa: -{formatCurrency(bundleDiscount, locale)}
                </p>
              )}
              {boxDiscount > 0 && (
                <p className="text-[10px] text-green-600 text-right font-bold uppercase tracking-wider">
                  {locale === 'pt' ? `Caixa Box: -${formatCurrency(boxDiscount, locale)}` :
                   locale === 'es' ? `-${formatCurrency(boxDiscount, locale)}` :
                   `-${formatCurrency(boxDiscount, locale)}`}
                </p>
              )}
              {couponDiscount > 0 && appliedCoupon && (
                <p className="text-[10px] text-emerald-600 text-right font-bold uppercase tracking-wider">
                  Cupom {appliedCoupon.code}: -{formatCurrency(couponDiscount, locale)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3 text-green-700">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Frete grátis para todo o Brasil</span>
            </div>

            {/* Coupon Code Input — hidden for atacado customers */}
            {userMode !== UserMode.ATACADO && <div className="mb-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{appliedCoupon.code}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-neutral-400 hover:text-red-500 transition-colors ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { setIsCouponOpen(!isCouponOpen); setCouponError(null); }}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors"
                  >
                    <Ticket className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Tem cupom de desconto?</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isCouponOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCouponOpen && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="CÓDIGO DO CUPOM"
                          className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-xs uppercase tracking-wider font-bold focus:outline-none focus:border-black transition-colors"
                          autoFocus
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30 flex items-center gap-1.5"
                        >
                          {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'OK'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{couponError}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>}

            <button
              onClick={async () => {
                setIsCheckingOut(true);
                try {
                  await onCheckout();
                } finally {
                  setIsCheckingOut(false);
                }
              }}
              disabled={isCheckingOut}
              className="w-full bg-black text-white py-5 rounded-[2rem] flex items-center justify-between px-8 hover:bg-neutral-800 transition-all shadow-2xl active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="uppercase tracking-[0.4em] text-[11px] font-black">
                {isCheckingOut ? 'Aguarde...' : t('cart.checkout')}
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
