import { UserProfile, LoyaltySettings } from '../types';
import { CouponsApi } from '../api/coupons.api';

export class LoyaltyService {
  private couponsApi: CouponsApi;

  constructor() {
    this.couponsApi = new CouponsApi();
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

    await this.couponsApi.create({
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
    userLoyalty: UserProfile['loyalty'],
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

