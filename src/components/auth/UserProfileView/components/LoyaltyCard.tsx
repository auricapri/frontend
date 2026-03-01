/// Loyalty Card Component
/// Displays user loyalty status and progress

import React from 'react';
import { Trophy } from 'lucide-react';
import { UserProfile } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { LoyaltyData } from '../types';

interface LoyaltyCardProps {
  user: UserProfile;
  locale: Locale;
}

const calculateLoyaltyData = (user: UserProfile): LoyaltyData => {
  const xp = user.loyalty?.current_xp || 0;
  const level = user.loyalty?.current_level || 1;
  const cashback = user.loyalty?.cashback_balance || 0;
  const nextLevelXp = level < 4 ? (level === 1 ? 1000 : level === 2 ? 5000 : 15000) : xp * 1.5;
  const xpProgress = Math.min(100, (xp / nextLevelXp) * 100);

  return { xp, level, cashback, nextLevelXp, xpProgress };
};

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ user, locale }) => {
  const { xp, level, cashback, nextLevelXp, xpProgress } = calculateLoyaltyData(user);

  return (
    <div className="bg-neutral-900 text-white p-8 rounded-[3rem] border border-neutral-800 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Trophy className="w-32 h-32 rotate-12" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-1">
              Status Fidelidade
            </span>
            <h3 className="text-2xl font-light tracking-tighter">Nível {level}</h3>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest">
              {formatCurrency(cashback, locale)} Cashback
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
            <span>{xp} XP</span>
            <span>{nextLevelXp} XP</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-1000"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-white/40 text-center pt-2">
            Continue comprando para subir de nível e ganhar cupons exclusivos.
          </p>
        </div>
      </div>
    </div>
  );
};
