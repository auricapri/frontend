/// Slug Utilities
/// Helper functions for generating slugs

/**
 * Generate a URL-friendly slug from a name
 */
export const generateSlug = (name: string | { pt?: string; en?: string } | undefined): string => {
  const text = typeof name === 'string'
    ? name
    : (name?.pt || name?.en || '');

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace special chars with hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
    || `produto-${Date.now()}`; // Fallback if empty
};

/**
 * Prepare payload with auto-generated slug and default description
 */
export const preparePayloadWithSlugAndDescription = (payload: Record<string, unknown>): void => {
  // Auto-generate slug if not present
  if (!payload.slug || (typeof payload.slug === 'string' && payload.slug.trim() === '')) {
    payload.slug = generateSlug(payload.name as string | { pt?: string; en?: string });
  }

  // Ensure description has default value
  if (!payload.description) {
    payload.description = typeof payload.name === 'object'
      ? { pt: '', en: '' }
      : '';
  }
};

/**
 * Get localized string from an object or string
 */
export const getLocalizedString = (obj: unknown, locale: string): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    const locObj = obj as Record<string, string>;
    return locObj[locale] || locObj['pt'] || locObj['en'] || '';
  }
  return String(obj);
};
