import { useState, useEffect } from 'react';

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isUrgent: boolean; // < 1h remaining
  label: string;    // formatted "HH:MM:SS"
}

/**
 * Live countdown to `expiresAt`. Updates every second.
 * Returns { isExpired: true } when time runs out.
 */
export function useOrderCountdown(expiresAt: string | null | undefined): CountdownResult {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!expiresAt) return 0;
    return Math.max(0, new Date(expiresAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(ms);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isExpired = remaining === 0 && !!expiresAt;
  const isUrgent = !isExpired && hours < 1;

  const pad = (n: number) => String(n).padStart(2, '0');
  const label = isExpired ? 'Expirado' : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, isExpired, isUrgent, label };
}
