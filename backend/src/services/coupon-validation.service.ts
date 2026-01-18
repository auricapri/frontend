import { CouponsRepository, Coupon } from '../repositories/coupons.repository.js';
import type { CartItem } from '../../shared/types/index.js';

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  coupon?: Coupon;
  discount?: number;
}

export class CouponValidationService {
  private couponsRepo: CouponsRepository;

  constructor() {
    this.couponsRepo = new CouponsRepository();
  }

  /**
   * Valida um cupom para uso no checkout
   */
  async validateCoupon(
    code: string,
    userId: string | null,
    cartItems: CartItem[],
    subtotal: number
  ): Promise<CouponValidationResult> {
    // 1. Buscar cupom pelo código
    const coupon = await this.couponsRepo.getByCode(code);

    if (!coupon) {
      return {
        valid: false,
        error: 'Cupom não encontrado ou inativo',
        errorCode: 'COUPON_NOT_FOUND'
      };
    }

    // 2. Verificar se está ativo
    if (!coupon.is_active) {
      return {
        valid: false,
        error: 'Este cupom está desativado',
        errorCode: 'COUPON_INACTIVE'
      };
    }

    // 3. Verificar data de expiração
    if (coupon.expires_at) {
      const expiresAt = new Date(coupon.expires_at);
      if (expiresAt < new Date()) {
        return {
          valid: false,
          error: 'Este cupom expirou',
          errorCode: 'COUPON_EXPIRED'
        };
      }
    }

    // 4. Verificar valor mínimo de compra
    if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
      return {
        valid: false,
        error: `Valor mínimo de compra é R$ ${coupon.min_purchase_amount.toFixed(2)}`,
        errorCode: 'MIN_PURCHASE_NOT_MET'
      };
    }

    // 5. Verificar produtos específicos
    if (coupon.product_ids && coupon.product_ids.length > 0) {
      const cartProductIds = cartItems.map(item => item.product_id);
      const hasValidProduct = cartProductIds.some(id => coupon.product_ids!.includes(id));

      if (!hasValidProduct) {
        return {
          valid: false,
          error: 'Este cupom não é válido para os produtos no carrinho',
          errorCode: 'INVALID_PRODUCTS'
        };
      }
    }

    // 6. Verificar limite total de uso
    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined) {
      if ((coupon.used_count || 0) >= coupon.usage_limit) {
        return {
          valid: false,
          error: 'Este cupom atingiu o limite de uso',
          errorCode: 'USAGE_LIMIT_REACHED'
        };
      }
    }

    // 7. Verificar primeira compra (requer userId)
    if (coupon.first_purchase_only) {
      if (!userId) {
        return {
          valid: false,
          error: 'Este cupom é válido apenas para primeira compra. Faça login para continuar.',
          errorCode: 'LOGIN_REQUIRED'
        };
      }

      const hasPurchased = await this.couponsRepo.hasUserPurchasedBefore(userId);
      if (hasPurchased) {
        return {
          valid: false,
          error: 'Este cupom é válido apenas para primeira compra',
          errorCode: 'NOT_FIRST_PURCHASE'
        };
      }
    }

    // 8. Verificar limite por usuário (requer userId)
    if (userId && coupon.per_user_limit > 0) {
      const userUsageCount = await this.couponsRepo.getUserUsageCount(coupon.id!, userId);
      if (userUsageCount >= coupon.per_user_limit) {
        return {
          valid: false,
          error: `Você já usou este cupom ${coupon.per_user_limit} vez(es)`,
          errorCode: 'USER_LIMIT_REACHED'
        };
      }
    }

    // 9. Calcular desconto
    const discount = this.calculateDiscount(coupon, subtotal, cartItems);

    return {
      valid: true,
      coupon,
      discount
    };
  }

  /**
   * Calcula o valor do desconto baseado no tipo do cupom
   */
  private calculateDiscount(
    coupon: Coupon,
    subtotal: number,
    cartItems: CartItem[]
  ): number {
    let baseForDiscount = subtotal;

    // Se cupom é para produtos específicos, calcular base apenas com esses produtos
    if (coupon.product_ids && coupon.product_ids.length > 0) {
      baseForDiscount = cartItems
        .filter(item => coupon.product_ids!.includes(item.product_id))
        .reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    if (coupon.discount_type === 'percentage') {
      // Desconto percentual (max 100%)
      const percentage = Math.min(coupon.discount_value, 100);
      return Math.round(baseForDiscount * (percentage / 100) * 100) / 100;
    } else {
      // Desconto fixo (não pode exceder o valor base)
      return Math.min(coupon.discount_value, baseForDiscount);
    }
  }

  /**
   * Registra o uso de um cupom após confirmação do pedido
   */
  async recordCouponUsage(
    couponCode: string,
    userId?: string,
    orderId?: string
  ): Promise<void> {
    const coupon = await this.couponsRepo.getByCode(couponCode);
    if (coupon && coupon.id) {
      await this.couponsRepo.recordUsage(coupon.id, userId, orderId);
    }
  }
}
