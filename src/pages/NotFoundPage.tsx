import React from 'react';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';
import { Locale } from '../i18n';

interface NotFoundPageProps {
  locale: Locale;
  onNavigate: (view: 'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about', target?: string) => void;
  t: (key: string) => any;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ locale: _locale, onNavigate, t: _t }) => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 md:px-12 py-24">
        <div className="max-w-2xl w-full text-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* 404 Number */}
          <div className="space-y-4">
            <h1 className="text-9xl md:text-[12rem] font-light tracking-tighter text-neutral-900 leading-none">
              404
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-16 bg-neutral-200"></div>
              <AlertCircle className="w-5 h-5 text-neutral-400" />
              <div className="h-[1px] w-16 bg-neutral-200"></div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-4xl font-light uppercase tracking-[0.3em] text-neutral-900">
              Página Não Encontrada
            </h2>
            <p className="text-sm md:text-base text-neutral-500 font-medium max-w-md mx-auto leading-relaxed">
              A página que você está procurando não existe ou foi movida. 
              Verifique o endereço e tente novamente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button
              onClick={() => onNavigate('home')}
              className="group flex items-center gap-3 px-8 py-4 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-neutral-800 transition-all active:scale-95 shadow-xl"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Voltar ao Início</span>
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-3 px-8 py-4 bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:border-black transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Voltar</span>
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="pt-16 space-y-8">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300">
              <span>ERRO</span>
              <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
              <span>404</span>
              <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
              <span>NOT FOUND</span>
            </div>
            
            {/* Links Úteis */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              <button 
                onClick={() => onNavigate('home')}
                className="hover:text-black transition-colors"
              >
                Início
              </button>
              <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
              <button 
                onClick={() => onNavigate('about')}
                className="hover:text-black transition-colors"
              >
                Sobre
              </button>
              <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
              <button 
                onClick={() => onNavigate('home', 'collection')}
                className="hover:text-black transition-colors"
              >
                Coleções
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
