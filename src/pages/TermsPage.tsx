import { ArrowLeft } from 'lucide-react';
import type { StoreConfig, Locale } from '../types';

interface TermsPageProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

export function TermsPage({ config, locale, onBack }: TermsPageProps) {
  const content = config.terms_of_service?.[locale] || config.terms_of_service?.en || '';

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">
            {locale === 'pt' ? 'Termos de Uso' :
             locale === 'es' ? 'Términos de Uso' :
             locale === 'fr' ? "Conditions d'Utilisation" :
             'Terms of Use'}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>
    </div>
  );
}
