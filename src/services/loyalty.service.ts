import { StoreConfig, UserProfile, LoyaltySettings } from '../types';
import { CouponsRepository } from '../api/repositories/coupons.repository';

/**
 * Serviço responsável pelo programa de fidelidade.
 * 
 * Calcula ganhos de XP e cashback, verifica subidas de nível e gera cupons
 * de recompensa quando o usuário sobe de nível.
 * 
 * @example
 * ```ts
 * const service = new LoyaltyService();
 * const earnings = service.calculateEarnings(1000, loyaltySettings);
 * const newLevel = service.checkLevelUp(currentXP, currentLevel, loyaltySettings);
 * ```
 */
export class LoyaltyService {
  private couponsRepo: CouponsRepository;

  constructor() {
    this.couponsRepo = new CouponsRepository();
  }

  /**
   * Calcula XP e cashback ganhos baseado no valor da compra.
   * 
   * @param amount - Valor da compra
   * @param config - Configurações do programa de fidelidade
   * @returns Objeto com xp e cashback ganhos
   */
  calculateEarnings(amount: number, config: LoyaltySettings): { xp: number; cashback: number } {
    const xp = Math.floor(amount * config.xp_per_currency_unit);
    const cashback = amount * (config.cashback_percentage / 100);
    return { xp, cashback };
  }

  /**
   * Verifica se o usuário subiu de nível baseado no XP atual.
   * 
   * @param currentXP - XP atual do usuário
   * @param currentLevel - Nível atual do usuário
   * @param config - Configurações do programa de fidelidade
   * @returns Novo nível (ou nível atual se não subiu)
   */
  checkLevelUp(currentXP: number, currentLevel: number, config: LoyaltySettings): number {
    const sortedLevels = [...config.levels].sort((a, b) => b.level - a.level);
    const reachedLevel = sortedLevels.find(l => currentXP >= l.xp_required);
    return reachedLevel && reachedLevel.level > currentLevel ? reachedLevel.level : currentLevel;
  }

  /**
   * Gera um cupom de recompensa quando o usuário sobe de nível.
   * 
   * O cupom expira em 30 dias e tem valor definido na configuração do nível.
   * 
   * @param level - Nível alcançado
   * @param config - Configurações do programa de fidelidade
   * @returns Dados do cupom gerado ou null se o nível não tem recompensa
   */
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

  /**
   * Calcula os novos dados de fidelidade após uma compra.
   * 
   * Atualiza XP, cashback e verifica se houve subida de nível.
   * 
   * @param userLoyalty - Dados atuais de fidelidade do usuário
   * @param amount - Valor da compra
   * @param config - Configurações do programa de fidelidade
   * @returns Novos dados de fidelidade calculados
   */
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
    
    // Reward pending will be set by generateLevelUpCoupon if level up occurs
    return {
      newXP,
      newCashback,
      newLevel,
      rewardPending: null
    };
  }
}

