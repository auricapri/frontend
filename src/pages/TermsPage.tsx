import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import { SEOHead } from '../components/seo/SEOHead';
import type { StoreConfig } from '../types';
import type { Locale } from '../i18n';

interface TermsPageProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

export function TermsPage({ config, locale, onBack }: TermsPageProps) {
  const rawContent = config.terms_of_service?.[locale] || config.terms_of_service?.en || '';
  const content = rawContent.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  return (
    <div className="min-h-screen bg-paper">
      <SEOHead
        title="Termos de Uso | Auricapri"
        description="Termos de uso da loja Auricapri."
        url="https://www.auricapri.com.br/terms"
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="sticky top-0 z-10 bg-paper border-b border-neutral-100">
        <div className="w-full px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-xl font-bold">
            {locale === 'pt' ? 'Termos de Uso' :
             locale === 'es' ? 'Términos de Uso' :
             locale === 'fr' ? "Conditions d'Utilisation" :
             'Terms of Use'}
          </h1>
        </div>
      </header>

      <main className="w-full px-4 py-8">
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      </main>
    </div>
  );
}
