import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Locale } from '../../i18n';

// Localized text for countdown
const COUNTDOWN_TEXT: Record<Locale, {
  startsIn: string;
  endsIn: string;
  day: string;
  days: string;
  hour: string;
  hours: string;
  minute: string;
  minutes: string;
  second: string;
  seconds: string;
  remaining: string;
  limitedCollection: string;
}> = {
  pt: {
    startsIn: 'Começa em',
    endsIn: 'Termina em',
    day: 'dia',
    days: 'dias',
    hour: 'hora',
    hours: 'horas',
    minute: 'minuto',
    minutes: 'minutos',
    second: 'segundo',
    seconds: 'segundos',
    remaining: 'restantes',
    limitedCollection: 'Coleção Limitada',
  },
  en: {
    startsIn: 'Starts in',
    endsIn: 'Ends in',
    day: 'day',
    days: 'days',
    hour: 'hour',
    hours: 'hours',
    minute: 'minute',
    minutes: 'minutes',
    second: 'second',
    seconds: 'seconds',
    remaining: 'remaining',
    limitedCollection: 'Limited Collection',
  },
  es: {
    startsIn: 'Empieza en',
    endsIn: 'Termina en',
    day: 'día',
    days: 'días',
    hour: 'hora',
    hours: 'horas',
    minute: 'minuto',
    minutes: 'minutos',
    second: 'segundo',
    seconds: 'segundos',
    remaining: 'restantes',
    limitedCollection: 'Colección Limitada',
  },
  fr: {
    startsIn: 'Commence dans',
    endsIn: 'Se termine dans',
    day: 'jour',
    days: 'jours',
    hour: 'heure',
    hours: 'heures',
    minute: 'minute',
    minutes: 'minutes',
    second: 'seconde',
    seconds: 'secondes',
    remaining: 'restants',
    limitedCollection: 'Collection Limitée',
  },
};

interface CountdownBadgeProps {
  endsAt: string | null | undefined;
  startsAt?: string | null;
  variant?: 'badge' | 'banner' | 'inline';
  showIcon?: boolean;
  className?: string;
  onExpired?: () => void;
  locale?: Locale;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  expired: boolean;
  notStarted: boolean;
}

function calculateTimeLeft(endsAt: string | null | undefined, startsAt?: string | null): TimeLeft {
  const now = new Date().getTime();

  // Check if not started yet
  if (startsAt) {
    const startTime = new Date(startsAt).getTime();
    if (now < startTime) {
      const diff = startTime - now;
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff,
        expired: false,
        notStarted: true,
      };
    }
  }

  // Check if ended
  if (!endsAt) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: Infinity, expired: false, notStarted: false };
  }

  const endTime = new Date(endsAt).getTime();
  const diff = endTime - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, expired: true, notStarted: false };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
    expired: false,
    notStarted: false,
  };
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  endsAt,
  startsAt,
  variant = 'badge',
  showIcon = true,
  className = '',
  onExpired,
  locale = 'pt',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endsAt, startsAt));
  const t = COUNTDOWN_TEXT[locale] || COUNTDOWN_TEXT.pt;

  useEffect(() => {
    if (!endsAt && !startsAt) return;

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endsAt, startsAt);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired && onExpired) {
        onExpired();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt, startsAt, onExpired]);

  // Don't render if no end date and no start date
  if (!endsAt && !startsAt) return null;

  // If expired, don't render (parent should handle hiding)
  if (timeLeft.expired) return null;

  // Determine urgency level for styling
  const isUrgent = timeLeft.total < 1000 * 60 * 60 * 24; // Less than 24 hours
  const isVeryUrgent = timeLeft.total < 1000 * 60 * 60 * 6; // Less than 6 hours

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  if (variant === 'badge') {
    return (
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider
        ${timeLeft.notStarted
          ? 'bg-blue-500/90 text-white'
          : isVeryUrgent
            ? 'bg-red-500 text-white animate-pulse'
            : isUrgent
              ? 'bg-orange-500 text-white'
              : 'bg-black/80 text-white'
        }
        ${className}
      `}>
        {showIcon && (timeLeft.notStarted ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />)}
        {timeLeft.notStarted ? (
          <span>{t.startsIn} {timeLeft.days > 0 ? `${timeLeft.days}${locale === 'pt' ? 'd' : 'd'} ` : ''}{formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}</span>
        ) : timeLeft.days > 0 ? (
          <span>{timeLeft.days} {timeLeft.days === 1 ? t.day : t.days} {formatNumber(timeLeft.hours)}h {t.remaining}</span>
        ) : (
          <span>{formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}</span>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    const dayLabel = timeLeft.days === 1 ? t.day : t.days;
    return (
      <div className={`
        w-full py-3 px-4 flex items-center justify-center gap-4 text-center
        ${timeLeft.notStarted
          ? 'bg-gradient-to-r from-blue-600 to-blue-500'
          : isVeryUrgent
            ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
            : isUrgent
              ? 'bg-gradient-to-r from-orange-600 to-orange-500'
              : 'bg-gradient-to-r from-neutral-900 to-neutral-800'
        }
        text-white
        ${className}
      `}>
        {showIcon && (timeLeft.notStarted ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />)}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{t.limitedCollection}</span>
          <span className="text-[10px] opacity-50">|</span>
          {timeLeft.notStarted ? (
            <span className="text-xs font-bold uppercase tracking-widest">{t.startsIn}</span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest">{t.endsIn}</span>
          )}
          <div className="flex items-center gap-1 font-mono">
            {timeLeft.days > 0 && (
              <>
                <span className="bg-white/20 px-2 py-1 rounded text-sm font-black">{timeLeft.days}</span>
                <span className="text-[10px] opacity-70 mr-1">{dayLabel}</span>
              </>
            )}
            <span className="bg-white/20 px-2 py-1 rounded text-sm font-black">{formatNumber(timeLeft.hours)}</span>
            <span className="text-lg font-black opacity-50">:</span>
            <span className="bg-white/20 px-2 py-1 rounded text-sm font-black">{formatNumber(timeLeft.minutes)}</span>
            <span className="text-lg font-black opacity-50">:</span>
            <span className="bg-white/20 px-2 py-1 rounded text-sm font-black">{formatNumber(timeLeft.seconds)}</span>
          </div>
        </div>
      </div>
    );
  }

  // inline variant
  const dayLabelInline = timeLeft.days === 1 ? t.day : t.days;
  return (
    <span className={`
      inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider
      ${timeLeft.notStarted
        ? 'text-blue-500'
        : isVeryUrgent
          ? 'text-red-500'
          : isUrgent
            ? 'text-orange-500'
            : 'text-neutral-500'
      }
      ${className}
    `}>
      {showIcon && <Clock className="w-3 h-3" />}
      {timeLeft.notStarted ? (
        <span>{t.startsIn} {timeLeft.days > 0 ? `${timeLeft.days} ${dayLabelInline} ` : ''}{formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}</span>
      ) : timeLeft.days > 0 ? (
        <span>{timeLeft.days} {dayLabelInline} {formatNumber(timeLeft.hours)}h</span>
      ) : (
        <span>{formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}</span>
      )}
    </span>
  );
};

// Hook to check if a collection is available (started and not expired)
export function useCollectionAvailability(startsAt?: string | null, endsAt?: string | null) {
  const [isAvailable, setIsAvailable] = useState<boolean>(() => {
    const now = new Date().getTime();

    if (startsAt) {
      const startTime = new Date(startsAt).getTime();
      if (now < startTime) return false;
    }

    if (endsAt) {
      const endTime = new Date(endsAt).getTime();
      if (now > endTime) return false;
    }

    return true;
  });

  const [isExpired, setIsExpired] = useState<boolean>(() => {
    if (!endsAt) return false;
    return new Date().getTime() > new Date(endsAt).getTime();
  });

  useEffect(() => {
    const checkAvailability = () => {
      const now = new Date().getTime();

      let available = true;
      let expired = false;

      if (startsAt) {
        const startTime = new Date(startsAt).getTime();
        if (now < startTime) available = false;
      }

      if (endsAt) {
        const endTime = new Date(endsAt).getTime();
        if (now > endTime) {
          available = false;
          expired = true;
        }
      }

      setIsAvailable(available);
      setIsExpired(expired);
    };

    checkAvailability();
    const timer = setInterval(checkAvailability, 1000);

    return () => clearInterval(timer);
  }, [startsAt, endsAt]);

  return { isAvailable, isExpired };
}

export default CountdownBadge;
