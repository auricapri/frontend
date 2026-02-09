/// Affiliate Tab Component
/// Displays affiliate program info and referral code

import React, { useState } from 'react';
import { Ticket, Copy, Check } from 'lucide-react';
import { UserProfile } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';

interface AffiliateTabProps {
  user: UserProfile;
  locale: Locale;
}

export const AffiliateTab: React.FC<AffiliateTabProps> = ({ user, locale }) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const affiliateCode =
    user.affiliate_code || `AUR-${user.full_name.split(' ')[0].toUpperCase()}-${user.id.slice(0, 4)}`;

  const handleCopyCode = async () => {
    const { generateReferralLink } = await import('../../../../utils/affiliate');
    const referralLink = generateReferralLink(affiliateCode);
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Card */}
      <div className="bg-neutral-900 text-white rounded-2xl p-4 md:p-6 text-center space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-2 right-2 opacity-10">
          <Ticket className="w-12 h-12 md:w-16 md:h-16 rotate-12" />
        </div>

        <div className="relative z-10 space-y-2">
          <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter leading-none">
            Auricapri Muse
          </h3>
          <p className="text-[10px] text-white/50 max-w-xs mx-auto leading-relaxed uppercase tracking-widest font-bold">
            Compartilhe e ganhe 10% de comissão em cada venda.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">
            Seu Código
          </span>
          <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl flex items-center justify-between gap-3 group hover:border-white/40 transition-all">
            <code className="text-sm md:text-base font-mono font-bold uppercase tracking-wider truncate">
              {affiliateCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="p-2 md:p-3 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex-shrink-0"
              title="Copiar link de indicação"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[9px] text-white/30 font-medium">
            {copiedCode ? 'Link copiado!' : 'Clique para copiar o link de indicação'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">
            Total Ganhos
          </span>
          <span className="text-lg font-light tracking-tighter">
            {formatCurrency(0, locale)}
          </span>
        </div>
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">
            Vendas
          </span>
          <span className="text-lg font-light tracking-tighter">0</span>
        </div>
      </div>
    </div>
  );
};
