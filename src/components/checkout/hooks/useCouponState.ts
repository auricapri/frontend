/**
 * useCouponState - Manages coupon validation, application, and discount calculation
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CouponsApi } from '../../../api/coupons.api';
import { formatCurrency } from '../../../utils/currency';
import type { CartItem, Coupon, UseCouponStateParams, UseCouponStateReturn } from './types';

export function useCouponState(params: UseCouponStateParams): UseCouponStateReturn {
  const { items, locale } = params;

  const couponsApi = useMemo(() => new CouponsApi(), []);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(items);
  const autoAppliedRef = useRef(false);

  // Sync checkout items when items prop changes
  useEffect(() => {
    setCheckoutItems(items);
  }, [items]);

  // Auto-apply coupon saved from CartDrawer when items are ready
  useEffect(() => {
    if (autoAppliedRef.current || appliedCoupon || items.length === 0) return;
    const saved = sessionStorage.getItem('cart_coupon_code');
    if (!saved) return;
    autoAppliedRef.current = true;
    setCouponCode(saved);
    // Trigger apply on next tick so couponCode state is set
    setTimeout(async () => {
      try {
        const coupon = await couponsApi.getByCode(saved);
        if (coupon && !(coupon.expires_at && new Date(coupon.expires_at) < new Date())) {
          setAppliedCoupon(coupon);
        }
      } catch { /* silently ignore — user can apply manually */ }
      setCouponCode('');
    }, 0);
  }, [items.length, appliedCoupon, couponsApi]);

  // Items that already have a coupon applied
  const itemsWithCoupon = useMemo(
    () => (Array.isArray(checkoutItems) ? checkoutItems : []).filter((item) => item?.applied_coupon_code),
    [checkoutItems]
  );

  // Items that don't have a coupon applied (eligible for manual coupon)
  const itemsWithoutCoupon = useMemo(
    () => (Array.isArray(checkoutItems) ? checkoutItems : []).filter((item) => !item?.applied_coupon_code),
    [checkoutItems]
  );

  // Calculate manual coupon discount
  const manualCouponDiscount = useMemo(() => {
    if (!appliedCoupon || itemsWithoutCoupon.length === 0) return 0;

    const eligibleSubtotal = itemsWithoutCoupon.reduce(
      (sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)),
      0
    );

    if (appliedCoupon.discount_type === 'percentage') {
      return eligibleSubtotal * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, eligibleSubtotal);
  }, [appliedCoupon, itemsWithoutCoupon]);

  // Apply coupon
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const coupon = await couponsApi.getByCode(couponCode.trim().toUpperCase());

      if (!coupon) {
        setCouponError('Cupom inválido ou expirado');
        setCouponLoading(false);
        return;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('Este cupom expirou');
        setCouponLoading(false);
        return;
      }

      const eligibleSubtotal = itemsWithoutCoupon.reduce(
        (sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)),
        0
      );

      if (coupon.min_purchase_amount && eligibleSubtotal < coupon.min_purchase_amount) {
        setCouponError(
          `Compra mínima de ${formatCurrency(coupon.min_purchase_amount, locale)} para itens elegíveis`
        );
        setCouponLoading(false);
        return;
      }

      if (coupon.product_ids && coupon.product_ids.length > 0) {
        const hasEligibleProduct = itemsWithoutCoupon.some((item) =>
          coupon.product_ids?.includes(item.product_id)
        );
        if (!hasEligibleProduct) {
          setCouponError('Este cupom não é válido para os produtos elegíveis');
          setCouponLoading(false);
          return;
        }
      }

      if (itemsWithoutCoupon.length === 0) {
        setCouponError('Todos os itens já possuem cupom aplicado');
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponCode('');
    } catch {
      setCouponError('Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, couponsApi, itemsWithoutCoupon, locale]);

  // Remove coupon
  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  return {
    couponCode,
    setCouponCode,
    couponLoading,
    couponError,
    appliedCoupon,
    checkoutItems,
    itemsWithCoupon,
    itemsWithoutCoupon,
    manualCouponDiscount,
    handleApplyCoupon,
    handleRemoveCoupon,
  };
}
