import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { X, ChevronDown, HelpCircle, Loader2 } from 'lucide-react';
import { FAQItem } from '../../types';
import { faqApi } from '../../api/instances';
import { Locale } from '../../i18n';
import { createFAQSchema } from '../seo/schemas';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  t: (key: string) => string;
}

const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose, locale, t }) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get localized text
  const getLoc = (obj: any): string => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      faqApi.getAll()
        .then(setFaqs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Build FAQ schema for structured data when FAQs are loaded
  const faqSchema = useMemo(() => {
    if (!faqs.length) return null;
    return createFAQSchema(
      faqs.map(faq => ({
        question: getLoc(faq.question),
        answer: getLoc(faq.answer),
      }))
    );
  }, [faqs, locale]);

  if (!isOpen) return null;

  return (
    <>
      {/* FAQ Schema for Google rich results */}
      {faqSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        </Helmet>
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] bg-white rounded-[2rem] shadow-2xl z-[101] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-100 rounded-2xl">
              <HelpCircle className="w-6 h-6 text-neutral-600" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 block">
                {locale === 'pt' ? 'Ajuda' : locale === 'es' ? 'Ayuda' : 'Help'}
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                {locale === 'pt' ? 'Perguntas Frequentes' : locale === 'es' ? 'Preguntas Frecuentes' : 'FAQ'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors hover:rotate-90 duration-300"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <span className="text-sm font-bold">
                {locale === 'pt' ? 'Carregando...' : locale === 'es' ? 'Cargando...' : 'Loading...'}
              </span>
            </div>
          ) : faqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <HelpCircle className="w-12 h-12 mb-4 stroke-1" />
              <span className="text-sm font-bold">
                {locale === 'pt' ? 'Nenhuma pergunta cadastrada ainda.' :
                 locale === 'es' ? 'No hay preguntas registradas todavía.' :
                 'No FAQ items yet.'}
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-neutral-100 rounded-2xl overflow-hidden transition-all hover:border-neutral-200"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-sm md:text-base font-bold text-neutral-900 pr-4">
                      {getLoc(faq.question)}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform duration-300 ${
                        expandedId === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Animated Answer */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      expandedId === faq.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                        <div className="pt-4 border-t border-neutral-100">
                          <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                            {getLoc(faq.answer)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 border-t border-neutral-100 bg-neutral-50 text-center space-y-1">
          <p className="text-[10px] text-neutral-400 font-medium">
            {locale === 'pt'
              ? 'Não encontrou o que procurava?'
              : locale === 'es'
              ? '¿No encontró lo que buscaba?'
              : "Didn't find what you were looking for?"}
          </p>
          <a
            href="mailto:faq@auricapri.com"
            className="text-[10px] text-neutral-600 font-bold hover:text-black transition-colors"
          >
            faq@auricapri.com
          </a>
        </div>
      </div>
    </>
  );
};

export default FAQModal;
