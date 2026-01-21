import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  schema?: object; // JSON-LD schema
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  schema
}) => {
  const { locale } = useLanguage();
  const canonical = url || window.location.href;
  const ogImage = image || `${window.location.origin}/logo.png`;

  return (
    <Helmet>
      {/* Dynamic lang attribute */}
      <html lang={locale} />

      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Alternate Languages (hreflang) */}
      <link rel="alternate" hrefLang="pt" href={canonical.replace(/\/(en|es|fr)/, '/pt')} />
      <link rel="alternate" hrefLang="en" href={canonical.replace(/\/(pt|es|fr)/, '/en')} />
      <link rel="alternate" hrefLang="es" href={canonical.replace(/\/(pt|en|fr)/, '/es')} />
      <link rel="alternate" hrefLang="fr" href={canonical.replace(/\/(pt|en|es)/, '/fr')} />

      {/* Schema Markup */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
