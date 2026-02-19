import React from 'react';
import { AboutUs } from '../components/shared';
import { SEOHead } from '../components/seo/SEOHead';
import { StoreConfig } from '../types';
import { Locale } from '../i18n';

interface AboutPageProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  config,
  locale,
  onBack
}) => {
  return (
    <>
      <SEOHead
        title="Sobre Nos | Auricapri"
        description="Conheca a Auricapri: moda feminina contemporanea com design autoral, qualidade premium e estilo unico. Nossa historia, valores e compromisso com a elegancia."
        keywords="auricapri, sobre nos, moda feminina, marca brasileira, roupas femininas"
        url="https://www.auricapri.com.br/about"
      />
      <AboutUs
        config={config}
        locale={locale}
        onBack={onBack}
      />
    </>
  );
};

