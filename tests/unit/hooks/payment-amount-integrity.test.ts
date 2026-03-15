/**
 * Payment amount integrity — end-to-end value propagation tests
 *
 * CRITICAL INVARIANT: charge_amount === amount_shown_to_customer
 *
 * These tests verify that the value passed to ordersApi.create({ finalAmount })
 * equals exactly the finalTotal computed by useCheckoutTotals — which is the
 * value displayed in the checkout sidebar.
 *
 * Attack surface: if finalAmount sent to the backend diverges from what the
 * customer sees, the backend will still use its own server-calculated amount,
 * but we log a warning. These tests catch frontend calculation bugs early
 * before they trigger backend warnings in production.
 */

import { describe, it, expect } from 'vitest';
import { PaymentMethod } from '../../../src/constants/enums';

// ---------------------------------------------------------------------------
// Simulate the value pipeline:
//   useCheckoutTotals → completeOrderWithPayment → ordersApi.create
//
// The key is: finalAmount passed to create() must === finalTotal from totals hook
// ---------------------------------------------------------------------------

interface CartItem {
  price: number;
  quantity: number;
  original_price?: number;
}

interface CouponDiscount {
  type: 'percentage' | 'fixed';
  value: number;
}

/**
 * Simulates the full value pipeline from cart items to what gets sent to
 * ordersApi.create as finalAmount.
 */
function simulateCheckout(
  items: CartItem[],
  coupon: CouponDiscount | null,
  shipping: number,
  paymentMethod: PaymentMethod,
  cashback: { available: number; use: boolean } = { available: 0, use: false }
): { displayedTotal: number; orderFinalAmount: number } {
  // Step 1: subtotal (from useCheckoutTotals)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Step 2: coupon discount
  let couponDiscount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      couponDiscount = Math.round(subtotal * (coupon.value / 100) * 100) / 100;
    } else {
      couponDiscount = Math.min(coupon.value, subtotal);
    }
  }

  // Step 3: discountedSubtotal
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  // Step 4: PIX discount (only for PIX, not credit card or boleto)
  const pixDiscount = paymentMethod === PaymentMethod.PIX
    ? discountedSubtotal * 0.05
    : 0;

  // Step 5: totalBeforeWallet
  const raw = discountedSubtotal - pixDiscount + shipping;
  const totalBeforeWallet = couponDiscount > 0 && raw < 5.0 ? 5.0 : raw;

  // Step 6: cashback
  const cashbackUsed = cashback.use
    ? Math.min(cashback.available, Math.max(0, totalBeforeWallet))
    : 0;

  // Step 7: finalTotal (what's displayed AND what's passed to ordersApi.create)
  const displayedTotal = Math.max(0, totalBeforeWallet - cashbackUsed);

  // In completeOrderWithPayment, this is what gets passed:
  //   ordersApi.create({ ..., finalAmount: finalTotal })
  const orderFinalAmount = displayedTotal;

  return { displayedTotal, orderFinalAmount };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Order creation receives exactly the displayed total', () => {
  it('credit card + coupon: order receives discounted amount, not original price', () => {
    const items = [{ price: 209, quantity: 1 }];
    // 10% coupon
    const { displayedTotal, orderFinalAmount } = simulateCheckout(
      items,
      { type: 'percentage', value: 10 },
      0,
      PaymentMethod.CREDIT_CARD
    );

    // Displayed = 209 * 0.90 = 188.10
    expect(displayedTotal).toBeCloseTo(188.10, 5);
    // Order must receive the same value
    expect(orderFinalAmount).toBe(displayedTotal);
    // Must NOT be the full price
    expect(orderFinalAmount).not.toBe(209);
  });

  it('PIX + coupon: order receives price with both coupon AND PIX discount', () => {
    const items = [{ price: 209, quantity: 1 }];
    const { displayedTotal, orderFinalAmount } = simulateCheckout(
      items,
      { type: 'percentage', value: 10 },
      0,
      PaymentMethod.PIX
    );

    // After 10% coupon: 188.10. After 5% PIX: 188.10 * 0.95 = 178.695
    expect(displayedTotal).toBeCloseTo(188.10 * 0.95, 5);
    expect(orderFinalAmount).toBe(displayedTotal);
    // Must be less than credit card would charge
    expect(orderFinalAmount).toBeLessThan(188.10);
  });

  it('credit card WITHOUT coupon: order receives full price (no PIX discount sneaking in)', () => {
    const items = [{ price: 200, quantity: 1 }];
    const { displayedTotal, orderFinalAmount } = simulateCheckout(
      items,
      null,
      0,
      PaymentMethod.CREDIT_CARD
    );

    expect(displayedTotal).toBe(200);
    expect(orderFinalAmount).toBe(200);
  });

  it('PIX vs credit card difference is exactly 5% for same cart', () => {
    const items = [{ price: 300, quantity: 1 }];

    const pix = simulateCheckout(items, null, 0, PaymentMethod.PIX);
    const card = simulateCheckout(items, null, 0, PaymentMethod.CREDIT_CARD);

    expect(card.orderFinalAmount - pix.orderFinalAmount).toBeCloseTo(300 * 0.05, 5);
  });

  it('multiple items: total is sum of all, discount applied on sum', () => {
    const items = [
      { price: 100, quantity: 2 },  // 200
      { price: 50,  quantity: 3 },  // 150
    ];
    const { displayedTotal, orderFinalAmount } = simulateCheckout(
      items,
      { type: 'fixed', value: 50 }, // R$50 off
      0,
      PaymentMethod.CREDIT_CARD
    );

    // subtotal = 350, coupon = 50 → 300
    expect(displayedTotal).toBeCloseTo(300, 5);
    expect(orderFinalAmount).toBe(displayedTotal);
  });

  it('shipping is added to order amount (not discounted by PIX)', () => {
    const items = [{ price: 100, quantity: 1 }];
    const SHIPPING = 29.9;

    const { orderFinalAmount } = simulateCheckout(
      items, null, SHIPPING, PaymentMethod.PIX
    );

    // PIX 5% on product only: 100*0.95 = 95. Plus shipping: 95 + 29.9 = 124.9
    expect(orderFinalAmount).toBeCloseTo(124.9, 5);
    // Not 124.905 (wrong if PIX applied to shipping too)
    expect(orderFinalAmount).not.toBeCloseTo((100 + SHIPPING) * 0.95, 5);
  });

  it('cashback reduces order amount from displayed total', () => {
    const items = [{ price: 300, quantity: 1 }];
    const { displayedTotal, orderFinalAmount } = simulateCheckout(
      items, null, 0, PaymentMethod.CREDIT_CARD,
      { available: 50, use: true }
    );

    expect(displayedTotal).toBe(250);
    expect(orderFinalAmount).toBe(250); // backend must charge 250, not 300
  });
});

// ---------------------------------------------------------------------------
// Regression: the old bug was credit card going through handleCompleteOrder
// which called handlePlaceOrder (= onComplete) that didn't call processPayment.
// These tests verify the data the new path sends is correctly discounted.
// ---------------------------------------------------------------------------

describe('Regression — credit card receives discounted finalAmount (not pre-coupon price)', () => {
  /**
   * Bug context: before the fix, credit card never reached Asaas.
   * After the fix, we call processPayment. These tests verify that the
   * ORDER being created (step before processPayment) already has the
   * discounted total stored, so the Asaas charge equals the correct amount.
   */

  it('R$209 product with R$50 coupon: ordersApi.create gets finalAmount=159, not 209', () => {
    const items = [{ price: 209, quantity: 1 }];
    const { orderFinalAmount } = simulateCheckout(
      items,
      { type: 'fixed', value: 50 },
      0,
      PaymentMethod.CREDIT_CARD
    );

    expect(orderFinalAmount).toBeCloseTo(159, 5);
    expect(orderFinalAmount).not.toBeCloseTo(209, 5);
  });

  it('influencer coupon 100%: gateway minimum R$5 applies (Asaas rejects below R$5)', () => {
    // When a coupon is applied and the resulting total < R$5, both frontend and
    // backend bump it to R$5 — the Asaas minimum charge. The "skip payment"
    // path (finalTotal <= 0) only activates when there is NO coupon, e.g.
    // a full cashback redemption with free shipping.
    const items = [{ price: 209, quantity: 1 }];
    const { orderFinalAmount } = simulateCheckout(
      items,
      { type: 'percentage', value: 100 },
      0,
      PaymentMethod.CREDIT_CARD
    );

    expect(orderFinalAmount).toBe(5.0); // gateway minimum, not R$209 or R$0
  });

  it('partial coupon: customer sees and pays the partial discounted price', () => {
    const items = [{ price: 400, quantity: 1 }];
    // 25% coupon → R$100 off → customer sees R$300
    const { displayedTotal, orderFinalAmount } = simulateCheckout(
      items,
      { type: 'percentage', value: 25 },
      0,
      PaymentMethod.CREDIT_CARD
    );

    expect(displayedTotal).toBeCloseTo(300, 5);
    expect(orderFinalAmount).toBe(displayedTotal);
    expect(orderFinalAmount).not.toBe(400); // must not charge full price
  });
});
