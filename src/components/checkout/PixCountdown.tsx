import { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface PixCountdownProps {
  expiresAt: Date;
  onExpired?: () => void;
}

export function PixCountdown({ expiresAt, onExpired }: PixCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Garantir que expiresAt é uma Date válida
  const validExpiresAt = useMemo(() => {
    let date: Date;

    if (expiresAt instanceof Date) {
      date = expiresAt;
    } else if (typeof expiresAt === 'string') {
      date = new Date(expiresAt);
    } else if (typeof expiresAt === 'number') {
      date = expiresAt > 10000000000 ? new Date(expiresAt) : new Date(expiresAt * 1000);
    } else {
      // Fallback: 10 minutos
      date = new Date(Date.now() + 10 * 60 * 1000);
    }

    // Se a data é inválida ou está muito no futuro (mais de 1 hora), usar fallback
    if (isNaN(date.getTime()) || date.getTime() - Date.now() > 60 * 60 * 1000) {
      console.warn('[PixCountdown] Data inválida ou muito distante, usando fallback de 10 min');
      return new Date(Date.now() + 10 * 60 * 1000);
    }

    return date;
  }, [expiresAt]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = validExpiresAt.getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [validExpiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpiring = timeLeft < 120; // Menos de 2 minutos

  if (timeLeft <= 0) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-2xl px-6 py-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <div>
          <span className="text-red-400 text-sm font-normal block">QR Code expirado</span>
          <span className="text-red-400/60 text-xs">Gere um novo QR Code para continuar</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${
      isExpiring
        ? 'bg-red-500/20 border border-red-500/50 animate-pulse'
        : 'bg-paper/10 border border-white/10'
    }`}>
      <Clock className={`w-4 h-4 ${isExpiring ? 'text-red-400' : 'text-white/60'}`} />
      <span className={`font-mono font-normal text-lg ${isExpiring ? 'text-red-400' : 'text-white'}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <span className="text-xs text-white/40">para pagar</span>
    </div>
  );
}
