/**
 * Safe JSON serialization for JSON-LD script tags.
 *
 * JSON.stringify does NOT escape `</script>`, which allows XSS injection
 * if any string value contains `</script><script>...`. This utility escapes
 * characters that can break out of a <script> block.
 *
 * Use this instead of JSON.stringify whenever injecting via dangerouslySetInnerHTML.
 */
export function jsonLdStringify(obj: unknown): string {
  // U+2028 (LINE SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR) are valid JS line
  // terminators and can break inline script blocks; use RegExp constructor so we
  // never embed invisible characters as regex literals.
  const rLS = new RegExp(' ', 'g');
  const rPS = new RegExp(' ', 'g');
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(rLS, '\\u2028')
    .replace(rPS, '\\u2029');
}
