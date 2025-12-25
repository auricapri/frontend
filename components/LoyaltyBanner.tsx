
import React, { useEffect, useState } from 'react';
import { Trophy, X, Sparkles, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { Locale } from '../i18n';

interface LoyaltyBannerProps {
  isVisible: boolean;
  level: number;
  rewardValue: number;
  couponCode: string;
  expiresAt: string;
  onClose: () => void;
  onOpenCoupons: () => void;
  locale: Locale;
}

const LoyaltyBanner: React.FC<LoyaltyBannerProps> = ({ 
  isVisible, 
  level, 
  rewardValue, 
  couponCode, 
  onClose, 
  locale
}) => {
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState<{id: number, style: React.CSSProperties}[]>([]);

  // Confetti Generation Logic
  useEffect(() => {
    if (isVisible) {
      const colors = ['#FFD700', '#FFFFFF', '#FCD34D', '#FFFBEB']; // Gold & White variants
      const newConfetti = Array.from({ length: 40 }).map((_, i) => {
        const size = Math.random() * 6 + 4;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 2 + 2;
        const delay = Math.random() * 0.5;
        
        return {
          id: i,
          style: {
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animationDuration: `${animationDuration}s`,
            animationDelay: `${delay}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }
        };
      });
      setConfetti(newConfetti);
    } else {
      setConfetti([]);
    }
  }, [isVisible]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>
        {`
          @keyframes confetti-fall {
            0% { transform: translateY(-100px) rotate(0deg) scale(1); opacity: 1; }
            100% { transform: translateY(300px) rotate(720deg) scale(0.5); opacity: 0; }
          }
          .confetti-piece {
            position: absolute;
            top: -20px;
            border-radius: 2px;
            animation: confetti-fall linear forwards;
            pointer-events: none;
            z-index: -1;
          }
        `}
      </style>

      {/* Main Container - Top Center Fixed */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-md px-4 flex justify-center pointer-events-none">
        
        {/* The Banner "Pill" */}
        <div 
          className="pointer-events-auto relative w-full bg-neutral-900/95 backdrop-blur-xl text-white rounded-full p-2 pr-6 shadow-2xl border border-yellow-500/20 flex items-center gap-4 animate-in slide-in-from-top-10 zoom-in-95 duration-500 overflow-visible group"
          style={{ boxShadow: '0 10px 40px -10px rgba(234, 179, 8, 0.3)' }}
        >
          {/* Confetti Container (Behind Banner) */}
          <div className="absolute inset-0 overflow-visible pointer-events-none">
             {confetti.map(c => (
               <div key={c.id} className="confetti-piece" style={c.style} />
             ))}
          </div>

          {/* Icon Circle */}
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center flex-none shadow-lg relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20 animate-pulse" />
             <Trophy className="w-6 h-6 text-black relative z-10" strokeWidth={1.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-1">
             <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Level {level} Unlocked</span>
                <Sparkles className="w-3 h-3 text-yellow-200 animate-pulse" />
             </div>
             <p className="text-xs font-medium text-neutral-200 truncate">
                Ganhou <span className="text-white font-bold">{formatCurrency(rewardValue, locale)}</span> OFF: <span className="font-mono text-yellow-300 font-bold tracking-wider">{couponCode}</span>
             </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
             <button 
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
                title="Copiar Código"
             >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-400 hover:text-white" />}
             </button>
             <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
             >
                <X className="w-4 h-4 text-neutral-500 hover:text-white" />
             </button>
          </div>

          {/* Shimmer Effect Overlay */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] w-[200%]" />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoyaltyBanner;
