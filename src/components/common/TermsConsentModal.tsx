import React from 'react';
import { X, Shield } from 'lucide-react';

interface TermsConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
  onNavigateTerms: () => void;
  onNavigatePrivacy: () => void;
}

export function TermsConsentModal({
  isOpen,
  onAccept,
  onClose,
  onNavigateTerms,
  onNavigatePrivacy
}: TermsConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg mx-4 mb-4 sm:mb-0 bg-paper rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-500">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-neutral-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-neutral-600" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-black font-serif uppercase tracking-tight mb-3">
            Termos e Privacidade
          </h2>

          {/* Description */}
          <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
            Ao continuar navegando, você concorda com nossos{' '}
            <button
              onClick={onNavigateTerms}
              className="text-black underline font-medium hover:no-underline"
            >
              Termos de Uso
            </button>
            {' '}e{' '}
            <button
              onClick={onNavigatePrivacy}
              className="text-black underline font-medium hover:no-underline"
            >
              Política de Privacidade
            </button>.
          </p>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-[0.98]"
          >
            Aceitar e Continuar
          </button>

          {/* Skip text */}
          <p className="mt-4 text-xs text-neutral-500">
            Ao realizar uma compra você também concorda com os termos.
          </p>
        </div>
      </div>
    </div>
  );
}
