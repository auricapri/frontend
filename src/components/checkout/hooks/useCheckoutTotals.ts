/**
 * useCheckoutTotals - Pure calculation hook for all price-related derived state
 *
 * This hook contains no side effects, only pure calculations based on input parameters.
 */

import { useMemo } from 'react';
import { PaymentMethod } from '../../../constants/enums';
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

  // Total before PIX discount and cashback
  const totalBeforeDiscounts = useMemo(() => {
    return subtotal - manualCouponDiscount + shippingCost;
  }, [subtotal, manualCouponDiscount, shippingCost]);

  // PIX discount (5% if payment method is PIX)
  const pixDiscount = useMemo(() => {
    return paymentMethod === PaymentMethod.PIX ? totalBeforeDiscounts * 0.05 : 0;
  }, [paymentMethod, totalBeforeDiscounts]);

  // Total after PIX discount
  const totalAfterPix = useMemo(() => {
    return totalBeforeDiscounts - pixDiscount;
  }, [totalBeforeDiscounts, pixDiscount]);

  // Cashback used (limited to available balance and positive total)
  const cashbackUsed = useMemo(() => {
    return useCashback ? Math.min(availableCashback, Math.max(0, totalAfterPix)) : 0;
  }, [useCashback, availableCashback, totalAfterPix]);

  // Final total (never negative)
  const finalTotal = useMemo(() => {
    return Math.max(0, totalAfterPix - cashbackUsed);
  }, [totalAfterPix, cashbackUsed]);

  return {
    subtotal,
    originalSubtotal,
    preAppliedDiscount,
    totalBeforeDiscounts,
    pixDiscount,
    totalAfterPix,
    cashbackUsed,
    finalTotal,
  };
}
