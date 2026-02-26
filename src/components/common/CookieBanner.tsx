import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { trackingService } from '../../services/tracking.service';

const CONSENT_KEY = 'cookie_consent_given';

interface CookieBannerProps {
  onNavigatePrivacy?: () => void;
}

/**
 * LGPD-compliant cookie consent banner.
 * Shows on first visit until user accepts or rejects cookies.
 * Integrates with existing trackingService consent system.
 */
export const CookieBanner: React.FC<CookieBannerProps> = ({ onNavigatePrivacy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't interacted with the banner before
    const consentGiven = localStorage.getItem(CONSENT_KEY);
    if (!consentGiven) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    trackingService.setConsent({ analytics: true, geolocation: false });
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    trackingService.setConsent({ analytics: false, geolocation: false });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] animate-in slide-in-from-bottom duration-500">
      <div className="bg-neutral-900 border-t border-neutral-700 px-4 py-4 md:px-8 md:py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1 text-sm text-neutral-300 leading-relaxed">
            <p>
              Utilizamos cookies para melhorar sua experiência de navegação e analisar o uso do site.
              Ao continuar, você concorda com nossa{' '}
              {onNavigatePrivacy ? (
                <button
                  onClick={onNavigatePrivacy}
                  className="underline underline-offset-2 text-white hover:text-neutral-200 transition-colors"
                >
                  Política de Privacidade
                </button>
              ) : (
                <span className="underline underline-offset-2 text-white">Política de Privacidade</span>
              )}.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleReject}
              aria-label="Rejeitar cookies"
              className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 border border-neutral-600 rounded-full hover:text-white hover:border-neutral-400 transition-colors min-h-[44px]"
            >
              Rejeitar
            </button>
            <button
              onClick={handleAccept}
              aria-label="Aceitar cookies"
              className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-black bg-white rounded-full hover:bg-neutral-200 transition-colors min-h-[44px]"
            >
              Aceitar
            </button>
            <button
              onClick={handleReject}
              aria-label="Fechar banner de cookies"
              className="p-2.5 text-neutral-500 hover:text-white transition-colors md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
