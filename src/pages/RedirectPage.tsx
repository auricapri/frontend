
import React, { useEffect, useState } from 'react';
import { ExternalLink, AlertTriangle, ArrowRight, Loader2, Home } from 'lucide-react';
import { Locale } from '../i18n';

interface RedirectPageProps {
  url: string | null;
  onNavigate: (view: string) => void;
  locale: Locale;
  t: (key: string) => any;
}

const RedirectPage: React.FC<RedirectPageProps> = ({ url, onNavigate, locale: _locale, t: _t }) => {
  const [status, setStatus] = useState<'loading' | 'confirming' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!url) {
      setStatus('error');
      setError('URL de destino não fornecida.');
      return;
    }

    // Basic validation
    try {
      new URL(url);
    } catch (_e) {
      setStatus('error');
      setError('URL inválida.');
      return;
    }

    // Simulate progressive loading/validation
    const timer = setTimeout(() => {
      setStatus('confirming');
    }, 1500);

    return () => clearTimeout(timer);
  }, [url]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'confirming' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (status === 'confirming' && countdown === 0) {
      handleRedirect();
    }
    return () => clearInterval(interval);
  }, [status, countdown]);

  const handleRedirect = () => {
    if (!url) return;
    
    // Log the redirect attempt
    console.log(`[Redirect] Navigating to: ${url} at ${new Date().toISOString()}`);
    
    // In a real app, we would send this to our backend logging service
    // fetch('/api/logs/redirect', { method: 'POST', body: JSON.stringify({ url, timestamp: new Date() }) });

    setStatus('success');
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {status === 'loading' && (
          <div className="text-center space-y-8 animate-in fade-in duration-700">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-neutral-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ExternalLink className="w-10 h-10 text-neutral-300" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Verificando Link...</h2>
              <p className="text-neutral-400 text-sm">Garantindo que você seja redirecionado com segurança.</p>
            </div>
          </div>
        )}

        {status === 'confirming' && (
          <div className="bg-neutral-50 rounded-[3rem] p-12 text-center space-y-10 border border-neutral-100 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
              <span className="text-2xl font-black italic">{countdown}</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Você está saindo da Auricapri</h2>
              <div className="p-4 bg-white rounded-2xl border border-neutral-200 break-all text-[10px] font-medium text-neutral-500 font-mono">
                {url}
              </div>
              <p className="text-neutral-400 text-xs px-8 leading-relaxed">
                Você será redirecionado para este link externo em alguns segundos. Certifique-se de que confia no destino.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleRedirect}
                className="w-full py-6 bg-black text-white rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                Ir Agora <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onNavigate('home')}
                className="w-full py-6 bg-white border border-neutral-200 text-black rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                Cancelar e Voltar
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-10 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-red-500">Link Inválido</h2>
              <p className="text-neutral-400 text-sm max-w-xs mx-auto">
                {error || 'Não conseguimos processar este link. Ele pode estar corrompido ou expirado.'}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('home')}
              className="px-12 py-6 bg-black text-white rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-4 mx-auto shadow-xl"
            >
              <Home className="w-4 h-4" /> Voltar para Home
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-8 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Redirecionando...</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedirectPage;
