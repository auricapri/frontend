
import { Locale } from '../../i18n';

/**
 * Get the currency symbol for a given locale
 */
export const getCurrencySymbol = (locale: Locale): string => {
  switch (locale) {
    case 'pt':
      return 'R$';
    case 'es':
    case 'fr':
      return '€';
    case 'en':
    default:
      return '$';
  }
};

/**
 * Get currency code for a given locale
 */
export const getCurrencyCode = (locale: Locale): string => {
  switch (locale) {
    case 'pt':
      return 'BRL';
    case 'es':
    case 'fr':
      return 'EUR';
    case 'en':
    default:
      return 'USD';
  }
};

export const formatCurrency = (amount: number, locale: Locale): string => {
  let currencyCode = 'USD';
  let formatLocale = 'en-US';

  switch (locale) {
    case 'pt':
      currencyCode = 'BRL';
      formatLocale = 'pt-BR';
      break;
    case 'es':
      currencyCode = 'EUR';
      formatLocale = 'es-ES';
      break;
    case 'fr':
      currencyCode = 'EUR';
      formatLocale = 'fr-FR';
      break;
    case 'en':
    default:
      currencyCode = 'USD';
      formatLocale = 'en-US';
      break;
  }

  try {
    return new Intl.NumberFormat(formatLocale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};
