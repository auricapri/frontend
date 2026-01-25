import { useCallback, useEffect, useState } from 'react';
import { UsersApi } from '../../api/users.api';
import type { UserLoyaltyData, UserProfile } from '../../types';

export interface LoyaltyBanner {
  visible: boolean;
  level: number;
  reward: number;
  code: string;
  expires: string;
}

export function useLoyalty(currentUser: UserProfile | null) {
  const [loyaltyBanner, setLoyaltyBanner] = useState<LoyaltyBanner>({
    visible: false,
    level: 0,
    reward: 0,
    code: '',
    expires: '',
  });

  useEffect(() => {
    if (currentUser?.loyalty?.pending_reward_coupon) {
      const reward = currentUser.loyalty.pending_reward_coupon;
      setLoyaltyBanner({
        visible: true,
        level: reward.level_reached,
        reward: reward.value,
        code: reward.code,
        expires: reward.expires_at,
      });
    }
  }, [currentUser]);

  const handleCloseLoyaltyBanner = useCallback(async () => {
    setLoyaltyBanner((prev) => ({ ...prev, visible: false }));
    if (currentUser) {
      try {
        const updatedLoyalty: UserLoyaltyData = {
          current_xp: currentUser.loyalty?.current_xp ?? 0,
          current_level: currentUser.loyalty?.current_level ?? 0,
          cashback_balance: currentUser.loyalty?.cashback_balance ?? 0,
          last_seen_level: currentUser.loyalty?.last_seen_level,
          pending_reward_coupon: null,
        };
        const usersApi = new UsersApi();
        await usersApi.updateLoyalty(updatedLoyalty);
      } catch {
        // Silently fail - banner is already hidden
      }
    }
  }, [currentUser]);

  return {
    loyaltyBanner,
    handleCloseLoyaltyBanner,
  };
}
