/**
 * useCheckoutTotals - Pure calculation hook for all price-related derived state
 *
 * Ordem correta dos descontos:
 * 1. subtotal (soma dos itens a preços atuais)
 * 2. − desconto bundle acessório (quando há roupa + acessório no carrinho)
 * 3. − desconto cupom (incondicional → NF-e vDesc → reduz ICMS)
 * 4. − desconto quantidade/caixa (incondicional → NF-e vDesc)
 * 5. = discountedSubtotal (base para PIX)
 * 6. − desconto PIX 5% (sobre discountedSubtotal, SEM frete)
 * 7. + frete
 * 8. = totalBeforeWallet
 * 9. − cashback (crédito de compra anterior, fora da NF-e)
 * 10. = finalTotal (valor que o cliente paga)
 */

import { useMemo } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { calculateQuantityDiscount } from '../../cart/BoxSavingsIndicator';
import type { UseCheckoutTotalsParams, UseCheckoutTotalsReturn } from './types';

export function useCheckoutTotals(params: UseCheckoutTotalsParams): UseCheckoutTotalsReturn {
  const {
    items,
    manualCouponDiscount,
    bundleDiscount: bundleDiscountParam = 0,
    shippingCost,
    paymentMethod,
    availableCashback,
    useCashback,
  } = params;

  const safeItems = Array.isArray(items) ? items : [];

  // Calculate subtotal from current prices
  const subtotal = useMemo(() => {
    return safeItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
  }, [safeItems]);

  // Calculate original subtotal (before any discounts)
  const originalSubtotal = useMemo(() => {
    return safeItems.reduce((sum, item) => {
      const originalPrice = item?.original_price || item?.price || 0;
      return sum + (originalPrice * (item?.quantity || 0));
    }, 0);
  }, [safeItems]);

  // Pre-applied discount (difference between original and current subtotal)
  const preAppliedDiscount = useMemo(() => {
    return originalSubtotal - subtotal;
  }, [originalSubtotal, subtotal]);

  // Accessory bundle discount (15% off accessories when bought with clothing)
  const bundleDiscount = useMemo(() => bundleDiscountParam, [bundleDiscountParam]);

  // Total item count for quantity discount
  const totalItemCount = useMemo(() => {
    return safeItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  }, [safeItems]);

  // Quantity discount based on box optimization (3 items per box, R$35 savings per shared item)
  const quantityDiscount = useMemo(() => {
    const { discountValue } = calculateQuantityDiscount(totalItemCount, subtotal);
    return discountValue;
  }, [totalItemCount, subtotal]);

  // Subtotal after bundle, coupon and quantity discounts (base for PIX discount, excludes shipping)
  const discountedSubtotal = useMemo(() => {
    return Math.max(0, subtotal - bundleDiscount - manualCouponDiscount - quantityDiscount);
  }, [subtotal, bundleDiscount, manualCouponDiscount, quantityDiscount]);

  // PIX discount (5% applied on discountedSubtotal only — excludes shipping per SEFAZ-SP RC 28518/2023)
  const pixDiscount = useMemo(() => {
    return paymentMethod === PaymentMethod.PIX ? discountedSubtotal * 0.05 : 0;
  }, [paymentMethod, discountedSubtotal]);

  // Total before wallet (after all unconditional discounts + shipping)
  const totalBeforeWallet = useMemo(() => {
    const raw = discountedSubtotal - pixDiscount + shippingCost;
    // Gateway minimum: coupon-applied orders must be at least R$5.00 (Asaas rejects values below R$5)
    if (manualCouponDiscount > 0 && raw < 5.00) return 5.00;
    return raw;
  }, [discountedSubtotal, pixDiscount, shippingCost, manualCouponDiscount]);

  // Cashback used (limited to available balance and positive total)
  const cashbackUsed = useMemo(() => {
    return useCashback ? Math.min(availableCashback, Math.max(0, totalBeforeWallet)) : 0;
  }, [useCashback, availableCashback, totalBeforeWallet]);

  // Final total (never negative)
  const finalTotal = useMemo(() => {
    return Math.max(0, totalBeforeWallet - cashbackUsed);
  }, [totalBeforeWallet, cashbackUsed]);

  // Capped coupon for display only — prevents sidebar showing a coupon larger than what's left
  // e.g. 100% coupon on R$329 product with R$35 box discount → cap at R$293, not R$329
  const effectiveCouponDiscount = useMemo(() => {
    if (manualCouponDiscount <= 0) return 0;
    const maxDiscount = Math.max(0, subtotal - bundleDiscount - quantityDiscount - 5.00);
    return Math.min(manualCouponDiscount, maxDiscount);
  }, [manualCouponDiscount, subtotal, bundleDiscount, quantityDiscount]);

  return {
    subtotal,
    originalSubtotal,
    preAppliedDiscount,
    quantityDiscount,
    bundleDiscount,
    discountedSubtotal,
    pixDiscount,
    totalBeforeWallet,
    cashbackUsed,
    finalTotal,
    effectiveCouponDiscount,
  };
}
