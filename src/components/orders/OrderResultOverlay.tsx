
import React, { useEffect, useState } from 'react';
import { RefreshCw, XCircle, X } from 'lucide-react';
import { Locale } from '../../i18n';

interface OrderResultOverlayProps {
  status: 'success' | 'error';
  orderId?: string;
  errorMessage?: string;
  onClose: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const OrderResultOverlay: React.FC<OrderResultOverlayProps> = ({
  status,
  orderId: _orderId,
  errorMessage,
  onClose,
  t: _t,
  locale
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Reveal text
    const timer = setTimeout(() => setShowContent(true), 100);

    // Auto-close after 5 seconds ONLY for success.
    // On error, the customer must read the message and explicitly click "Try Again"
    // or close the overlay — auto-closing would hide critical payment failure info.
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    if (status === 'success') {
      closeTimer = setTimeout(() => {
        onClose();
      }, 5000);
    }

    return () => {
      clearTimeout(timer);
      if (closeTimer !== undefined) clearTimeout(closeTimer);
    };
  }, [status, onClose]);

  return (
    <div className="fixed inset-0 z-[3000] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      {/* Close Button - Always visible */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full hover:bg-neutral-100 transition-colors z-10"
        aria-label="Fechar"
      >
        <X className="w-6 h-6 text-neutral-400" />
      </button>

      <div className={`flex flex-col items-center max-w-lg text-center transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* ICON & TITLE ANIMATION */}
        <div className="mb-12 relative flex flex-col items-center">
            {status === 'success' ? (
                <div className="mb-8">
                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-xl scale-150">
                    <div className="w-32 h-32 bg-red-200 rounded-full" />
                </div>
            )}

            <h1 className={`text-3xl md:text-5xl font-light uppercase tracking-[0.2em] md:tracking-[0.4em] leading-tight splash-logo text-black`}>
                {status === 'success' ? 'Confirmed' : 'Payment\nDeclined'}
            </h1>
        </div>

        {status === 'error' && (
            <div className="h-[1px] w-24 bg-neutral-100 relative overflow-hidden mb-12">
                <div className="absolute inset-0 bg-red-500 animate-[shimmer_2s_infinite_linear]"></div>
            </div>
        )}

        {/* DETAILS FADE IN */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-forwards opacity-0" style={{ animationDelay: '500ms' }}>
            {status === 'success' ? (
                <>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                        Gerando Comprovante...
                    </p>
                </>
            ) : (
                <>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" /> Transaction Failed
                    </p>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                        {errorMessage || (locale === 'pt' ? 'Houve um problema ao processar seu pagamento.' : 'There was an issue processing your payment.')}
                    </p>
                </>
            )}
        </div>

        {/* ACTION BUTTON (Only for Error) */}
        {status === 'error' && (
            <div className="mt-20 animate-in fade-in zoom-in-95 duration-1000 delay-1000 fill-mode-forwards opacity-0" style={{ animationDelay: '1000ms' }}>
                <button
                    onClick={onClose}
                    className="group flex items-center gap-4 px-12 py-5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl active:scale-95"
                >
                    <span>Try Again</span>
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default OrderResultOverlay;
