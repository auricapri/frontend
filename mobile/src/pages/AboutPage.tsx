/**
 * AboutPage Component - React Native
 * Simple wrapper around AboutUs
 */

import React from 'react';
import { AboutUs } from '../components/shared';
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
    <AboutUs 
      config={config} 
      locale={locale} 
      onBack={onBack} 
    />
  );
};

export default AboutPage;

