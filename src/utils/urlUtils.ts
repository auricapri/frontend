/**
 * Converts a search query into a SEO-friendly URL slug
 * Example: "Camisa Azul!" -> "camisa-azul"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Remove accents/diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove invalid chars
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Converts a URL slug back to a readable search query
 * Example: "camisa-azul" -> "camisa azul"
 */
export function unslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .trim();
}
