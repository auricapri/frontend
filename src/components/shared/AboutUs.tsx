
import React from 'react';
import { StoreConfig } from '../../types';
import { Locale } from '../../i18n';
import { ArrowLeft } from 'lucide-react';

interface AboutUsProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ config, locale, onBack }) => {
  const text = config.about_us ? (config.about_us[locale] || config.about_us['en'] || '') : '';
  const image = config.about_us_image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop';

  return (
    <div className="w-full min-h-screen bg-white text-neutral-900">
      
      {/* Header / Nav Area */}
      <div className="fixed top-0 left-0 w-full z-50 p-6 md:p-12 mix-blend-difference text-white pointer-events-none">
        <button 
          onClick={onBack} 
          className="pointer-events-auto flex items-center gap-3 group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Voltar</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Column: Visual */}
        <div className="lg:w-1/2 h-[60vh] lg:h-screen relative overflow-hidden bg-neutral-100">
           <img 
             src={image} 
             alt="About Us" 
             className="w-full h-full object-cover animate-in fade-in duration-1000 scale-105 hover:scale-100 transition-transform duration-[2s]" 
           />
           <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Right Column: Content */}
        <div className="lg:w-1/2 flex flex-col justify-center p-12 lg:p-24 xl:p-32 bg-white">
           <div className="animate-in slide-in-from-bottom-10 duration-1000 delay-100">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-400 mb-6 block">
                Nossa História
              </span>
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter uppercase leading-[0.85] mb-12">
                {config.brand_name}
              </h1>
              <div className="w-12 h-[2px] bg-black mb-12" />
              
              <div className="prose prose-lg prose-neutral max-w-none text-neutral-600 font-medium leading-relaxed whitespace-pre-wrap">
                {text ? text : (
                  <p className="opacity-50">
                    A história da marca ainda está sendo escrita. 
                    Em breve compartilharemos nossa jornada e valores com você.
                  </p>
                )}
              </div>

              <div className="mt-20 pt-10 border-t border-neutral-100 flex flex-col sm:flex-row gap-12 sm:gap-24">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Fundação</h4>
                    <span className="text-xl font-light">2024</span>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Sede</h4>
                    <span className="text-xl font-light">São Paulo, BR</span>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Contato</h4>
                    <span className="text-xl font-light block">{config.contact_email || 'hello@auricapri.com'}</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
