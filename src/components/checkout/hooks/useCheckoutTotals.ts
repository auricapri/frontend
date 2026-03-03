/**
 * useCheckoutTotals - Pure calculation hook for all price-related derived state
 *
 * Ordem correta dos descontos:
 * 1. subtotal (soma dos itens a preços atuais)
 * 2. − desconto cupom (incondicional → NF-e vDesc → reduz ICMS)
 * 3. − desconto quantidade/caixa (incondicional → NF-e vDesc)
 * 4. = discountedSubtotal (base para PIX)
 * 5. − desconto PIX 5% (sobre discountedSubtotal, SEM frete)
 * 6. + frete
 * 7. = totalBeforeWallet
 * 8. − cashback (crédito de compra anterior, fora da NF-e)
 * 9. = finalTotal (valor que o cliente paga)
 */

import { useMemo } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { calculateQuantityDiscount } from '../../cart/BoxSavingsIndicator';
import type { UseCheckoutTotalsParams, UseCheckoutTotalsReturn } from './types';

export function useCheckoutTotals(params: UseCheckoutTotalsParams): UseCheckoutTotalsReturn {
  const {
    items,
    manualCouponDiscount,
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

  // Total item count for quantity discount
  const totalItemCount = useMemo(() => {
    return safeItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  }, [safeItems]);

  // Quantity discount based on box optimization (3 items per box, R$35 savings per shared item)
  const quantityDiscount = useMemo(() => {
    const { discountValue } = calculateQuantityDiscount(totalItemCount, subtotal);
    return discountValue;
  }, [totalItemCount, subtotal]);

  // Subtotal after coupon and quantity discounts (base for PIX discount, excludes shipping)
  const discountedSubtotal = useMemo(() => {
    return Math.max(0, subtotal - manualCouponDiscount - quantityDiscount);
  }, [subtotal, manualCouponDiscount, quantityDiscount]);

  // PIX discount (5% applied on discountedSubtotal only — excludes shipping per SEFAZ-SP RC 28518/2023)
  const pixDiscount = useMemo(() => {
    return paymentMethod === PaymentMethod.PIX ? discountedSubtotal * 0.05 : 0;
  }, [paymentMethod, discountedSubtotal]);

  // Total before wallet (after all unconditional discounts + shipping)
  const totalBeforeWallet = useMemo(() => {
    return discountedSubtotal - pixDiscount + shippingCost;
  }, [discountedSubtotal, pixDiscount, shippingCost]);

  // Cashback used (limited to available balance and positive total)
  const cashbackUsed = useMemo(() => {
    return useCashback ? Math.min(availableCashback, Math.max(0, totalBeforeWallet)) : 0;
  }, [useCashback, availableCashback, totalBeforeWallet]);

  // Final total (never negative)
  const finalTotal = useMemo(() => {
    return Math.max(0, totalBeforeWallet - cashbackUsed);
  }, [totalBeforeWallet, cashbackUsed]);

  return {
    subtotal,
    originalSubtotal,
    preAppliedDiscount,
    quantityDiscount,
    discountedSubtotal,
    pixDiscount,
    totalBeforeWallet,
    cashbackUsed,
    finalTotal,
  };
}
