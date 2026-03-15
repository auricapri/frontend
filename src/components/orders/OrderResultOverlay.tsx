
import React, { useEffect, useState } from 'react';
import { XCircle, RefreshCw, User, Package, Eye, ArrowRight } from 'lucide-react';
import { Locale } from '../../i18n';

interface OrderResultOverlayProps {
  status: 'success' | 'error';
  orderId?: string;
  errorMessage?: string;
  onClose: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const tutorialSteps = [
  {
    icon: User,
    text: 'Toque no ícone de perfil no canto superior direito',
  },
  {
    icon: Package,
    text: 'Acesse a aba "Meus Pedidos"',
  },
  {
    icon: Eye,
    text: 'Clique no pedido para ver status e rastreamento',
  },
];

const OrderResultOverlay: React.FC<OrderResultOverlayProps> = ({
  status,
  errorMessage,
  onClose,
  locale,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 150);
    const t2 = setTimeout(() => setShowTutorial(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-[3000] bg-paper flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <XCircle className="w-6 h-6 text-neutral-400" />
        </button>
        <div className={`flex flex-col items-center max-w-lg text-center transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-3xl font-light font-serif uppercase tracking-[0.2em] text-black mb-6">
            Pagamento Recusado
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed mb-10">
            {errorMessage || (locale === 'pt' ? 'Houve um problema ao processar seu pagamento.' : 'There was an issue processing your payment.')}
          </p>
          <button
            onClick={onClose}
            className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-paper flex flex-col items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-500">
      <div className={`flex flex-col items-center w-full max-w-sm text-center transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Checkmark animation */}
        <div className="mb-8">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h1 className="text-3xl font-light font-serif uppercase tracking-[0.25em] text-black mb-2">
          Obrigado!
        </h1>
        <p className="text-sm text-neutral-500 mb-10">
          Compra realizada com sucesso.
        </p>

        {/* Tutorial */}
        <div className={`w-full text-left transition-all duration-700 ${showTutorial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-5 text-center">
            Como acompanhar seu pedido
          </p>
          <div className="space-y-3 mb-10">
            {tutorialSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-neutral-50 rounded-2xl p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <step.icon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-xs text-neutral-700 leading-snug">{step.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-95"
          >
            Continuar Comprando
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderResultOverlay;
