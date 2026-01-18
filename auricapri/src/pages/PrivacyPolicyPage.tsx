import { ArrowLeft } from 'lucide-react';
import type { StoreConfig, Locale } from '../types';

interface PrivacyPolicyPageProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

export function PrivacyPolicyPage({ config, locale, onBack }: PrivacyPolicyPageProps) {
  const rawContent = config.privacy_policy?.[locale] || config.privacy_policy?.en || '';
  const content = rawContent.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

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
            {locale === 'pt' ? 'Política de Privacidade' :
             locale === 'es' ? 'Política de Privacidad' :
             locale === 'fr' ? 'Politique de Confidentialité' :
             'Privacy Policy'}
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
