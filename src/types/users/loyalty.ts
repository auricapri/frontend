export interface LoyaltyLevel {
  level: number;
  xp_required: number;
  reward_coupon_value: number;
  reward_description: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  cashback_percentage: number;
  xp_per_currency_unit: number;
  review_cashback_amount?: number;
  levels: LoyaltyLevel[];
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
