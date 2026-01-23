import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface PixCountdownProps {
  expiresAt: Date;
  onExpired?: () => void;
}

export function PixCountdown({ expiresAt, onExpired }: PixCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpiring = timeLeft < 120; // Menos de 2 minutos

  if (timeLeft <= 0) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-2xl px-6 py-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <div>
          <span className="text-red-400 text-sm font-bold block">QR Code expirado</span>
          <span className="text-red-400/60 text-xs">Gere um novo QR Code para continuar</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${
      isExpiring
        ? 'bg-red-500/20 border border-red-500/50 animate-pulse'
        : 'bg-white/10 border border-white/10'
    }`}>
      <Clock className={`w-4 h-4 ${isExpiring ? 'text-red-400' : 'text-white/60'}`} />
      <span className={`font-mono font-bold text-lg ${isExpiring ? 'text-red-400' : 'text-white'}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <span className="text-xs text-white/40">para pagar</span>
    </div>
  );
}
