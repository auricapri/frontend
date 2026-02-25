import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://www.auricapri.com.br';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  schema?: object | object[]; // JSON-LD schema (single or array)
  locale?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  schema,
  locale = 'pt'
}) => {
  const canonical = url || `${BASE_URL}${window.location.pathname}`;
  const ogImage = image || `${BASE_URL}/logo.png`;

  return (
    <Helmet>
      {/* Dynamic lang attribute */}
      <html lang={locale} />

      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:site_name" content="Auricapri" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale === 'pt' ? 'pt_BR' : locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Hreflang tags for international SEO */}
      <link rel="alternate" hrefLang="pt" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="es" href={canonical} />
      <link rel="alternate" hrefLang="fr" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Schema Markup - supports single schema or array of schemas */}
      {schema && !Array.isArray(schema) && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      {schema && Array.isArray(schema) && schema.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};
