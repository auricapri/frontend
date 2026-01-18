import { useState, useEffect } from 'react';
import { UserProfile, StoreConfig } from '../types';
import { UsersApi } from '../api/users.api';

export const useLoyalty = (currentUser: UserProfile | null, _storeConfig: StoreConfig) => {
  const [loyaltyBanner, setLoyaltyBanner] = useState<{ 
    visible: boolean; 
    level: number; 
    reward: number; 
    code: string; 
    expires: string 
  }>({ visible: false, level: 0, reward: 0, code: '', expires: '' });
  
  const usersApi = new UsersApi();

  useEffect(() => {
    if (currentUser?.loyalty?.pending_reward_coupon) {
      const reward = currentUser.loyalty.pending_reward_coupon;
      setLoyaltyBanner({
        visible: true,
        level: reward.level_reached,
        reward: reward.value,
        code: reward.code,
        expires: reward.expires_at
      });
    }
  }, [currentUser]);

  const dismissBanner = async () => {
    if (!currentUser) return;
    
    setLoyaltyBanner(prev => ({ ...prev, visible: false }));
    
    // Clear pending reward via API
    try {
      const updatedLoyalty = {
        ...currentUser.loyalty,
        pending_reward_coupon: null
      };
      await usersApi.updateLoyalty(updatedLoyalty);
    } catch (err) {
      console.error('Error dismissing loyalty banner:', err);
    }
  };

  return {
    loyaltyBanner,
    dismissBanner
  };
};
