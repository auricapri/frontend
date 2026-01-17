/**
 * Localization utilities for handling localized text objects
 */
import { Locale } from '../i18n';

export type LocalizedText = { [key in Locale]?: string } | string | null | undefined;

/**
 * Get localized string from an object or string
 * Handles multiple formats:
 * - Plain strings
 * - JSON strings representing localized objects
 * - Objects with locale keys (pt, en, es, fr)
 *
 * @param obj - The object or string to localize
 * @param locale - The target locale
 * @returns The localized string or empty string if not found
 */
export const getLoc = (obj: LocalizedText | unknown, locale: Locale): string => {
  if (obj === null || obj === undefined) return '';

  if (typeof obj === 'string') {
    // Try to parse JSON strings that might contain localized objects
    if (obj.trim().startsWith('{')) {
      try {
        return getLoc(JSON.parse(obj), locale);
      } catch {
        return obj;
      }
    }
    return obj;
  }

  if (typeof obj === 'object') {
    const localizedObj = obj as Record<string, unknown>;
    // Try target locale first, then fallbacks
    const val = localizedObj[locale] || localizedObj['pt'] || localizedObj['en'] || localizedObj['es'] || localizedObj['fr'];
    if (typeof val === 'string') return val;
    // If no locale match, try to find any string value
    const first = Object.values(localizedObj).find(v => typeof v === 'string');
    return (first as string) || '';
  }

  return String(obj);
};

/**
 * Create a localized getter bound to a specific locale
 * Useful for components that need to repeatedly call getLoc with the same locale
 *
 * @param locale - The locale to bind
 * @returns A function that gets localized text for the bound locale
 */
export const createGetLoc = (locale: Locale) => (obj: LocalizedText | unknown): string => {
  return getLoc(obj, locale);
};
