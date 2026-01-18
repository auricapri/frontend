import { CouponsRepository } from '../repositories/coupons.repository.js';

export interface LoyaltySettings {
  enabled: boolean;
  cashback_percentage: number;
  xp_per_currency_unit: number;
  review_cashback_amount?: number;
  levels: Array<{
    level: number;
    xp_required: number;
    reward_coupon_value: number;
    reward_description: string;
  }>;
}

export interface UserLoyaltyData {
  current_xp: number;
  current_level: number;
  cashback_balance: number;
  last_seen_level?: number;
  pending_reward_coupon?: {
    code: string;
    value: number;
    expires_at: string;
    level_reached: number;
  } | null;
}

export class LoyaltyService {
  private couponsRepo: CouponsRepository;

  constructor() {
    this.couponsRepo = new CouponsRepository();
  }

  calculateEarnings(amount: number, config: LoyaltySettings): { xp: number; cashback: number } {
    const xp = Math.floor(amount * config.xp_per_currency_unit);
    const cashback = amount * (config.cashback_percentage / 100);
    return { xp, cashback };
  }

  checkLevelUp(currentXP: number, currentLevel: number, config: LoyaltySettings): number {
    const sortedLevels = [...config.levels].sort((a, b) => b.level - a.level);
    const reachedLevel = sortedLevels.find(l => currentXP >= l.xp_required);
    return reachedLevel && reachedLevel.level > currentLevel ? reachedLevel.level : currentLevel;
  }

  async generateLevelUpCoupon(level: number, config: LoyaltySettings): Promise<{ code: string; value: number; expires_at: string } | null> {
    const levelConfig = config.levels.find(l => l.level === level);
    if (!levelConfig || levelConfig.reward_coupon_value === 0) return null;

    const code = `LEVELUP-${level}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    await this.couponsRepo.create({
      code,
      discount_type: 'fixed',
      discount_value: levelConfig.reward_coupon_value,
      is_active: true,
      expires_at: expires.toISOString(),
    });

    return {
      code,
      value: levelConfig.reward_coupon_value,
      expires_at: expires.toISOString()
    };
  }

  calculateNewLoyaltyData(
    userLoyalty: UserLoyaltyData | undefined,
    amount: number,
    config: LoyaltySettings
  ): {
    newXP: number;
    newCashback: number;
    newLevel: number;
    rewardPending: any;
  } {
    const currentXP = userLoyalty?.current_xp || 0;
    const currentLevel = userLoyalty?.current_level || 1;
    const currentCashback = userLoyalty?.cashback_balance || 0;

    const { xp: xpEarned, cashback: cashbackEarned } = this.calculateEarnings(amount, config);
    
    let newXP = currentXP + xpEarned;
    let newCashback = currentCashback + cashbackEarned;
    let newLevel = this.checkLevelUp(newXP, currentLevel, config);
    
    return {
      newXP,
      newCashback,
      newLevel,
      rewardPending: null
    };
  }
}

