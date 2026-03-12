import React from 'react';
import DOMPurify from 'dompurify';
import { StoreConfig } from '../../types';
import { Locale } from '../../i18n';
import { ArrowLeft } from 'lucide-react';

interface AboutUsProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

const VALUES = [
  { label: 'Elegância', desc: 'Peças que revelam quem você é' },
  { label: 'Autenticidade', desc: 'Um estilo genuinamente seu' },
  { label: 'Qualidade', desc: 'Acabamento que você sente' },
];

const AboutUs: React.FC<AboutUsProps> = ({ config, locale, onBack }) => {
  const text = config.about_us
    ? (config.about_us[locale] || config.about_us['pt'] || config.about_us['en'] || '')
    : '';
  const image =
    config.about_us_image ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop';

  return (
    <div className="w-full min-h-screen overflow-y-auto bg-paper text-neutral-900">

      {/* Back button — mix-blend-difference so it reads over any bg */}
      <div className="fixed top-0 left-0 w-full z-50 p-6 md:p-12 mix-blend-difference text-white pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto flex items-center gap-3 group">
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Voltar</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* ── Left: sticky image with quote overlay ── */}
        <div className="lg:w-[45%] h-[65vh] lg:h-screen lg:sticky lg:top-0 relative overflow-hidden bg-neutral-200 flex-shrink-0">
          <img
            src={image}
            alt="Auricapri — Nossa História"
            className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[3s]"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14 text-white">
            <p className="font-serif text-xl md:text-2xl font-light italic leading-relaxed mb-5 opacity-90">
              "Moda não é superfície.<br />É expressão. É a primeira coisa<br />que você diz antes de falar."
            </p>
            <div className="w-10 h-px bg-white/40" />
          </div>
        </div>

        {/* ── Right: story content ── */}
        <div className="lg:w-[55%] flex flex-col py-28 px-10 lg:px-20 xl:px-28 bg-paper">
          <div className="animate-in slide-in-from-bottom-8 duration-700 delay-100">

            {/* Label + brand name */}
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-400 mb-5 block">
              Nossa História
            </span>
            <h1 className="font-serif text-5xl md:text-6xl xl:text-7xl font-light tracking-tighter uppercase leading-none mb-10">
              {config.brand_name}
            </h1>
            <div className="w-12 h-[2px] bg-black mb-12" />

            {/* Story text from DB */}
            <div className="prose prose-lg prose-neutral max-w-none text-neutral-600 leading-relaxed">
              {text ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }} />
              ) : (
                <p className="opacity-40 italic">A história ainda está sendo escrita…</p>
              )}
            </div>

            {/* Brand values */}
            <div className="mt-16 pt-10 border-t border-neutral-100 grid grid-cols-3 gap-6">
              {VALUES.map(v => (
                <div key={v.label}>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-neutral-900">
                    {v.label}
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* Founders signature */}
            <div className="mt-12 pt-10 border-t border-neutral-100">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400 mb-4 block">
                Fundadores
              </span>
              <p className="font-serif text-3xl font-light italic text-neutral-800 mb-1">
                Marcus &amp; Raquel
              </p>
              <p className="text-xs tracking-widest text-neutral-400 uppercase">
                Lírio da Cruz · Garcia Lírio
              </p>
            </div>

            {/* Stats bar */}
            <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row gap-10 sm:gap-16">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-neutral-400">Fundação</h4>
                <span className="text-xl font-light">2024</span>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-neutral-400">País</h4>
                <span className="text-xl font-light">Brasil 🌿</span>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-neutral-400">Contato</h4>
                <span className="text-xl font-light">{config.contact_email || 'suporte@auricapri.com'}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
