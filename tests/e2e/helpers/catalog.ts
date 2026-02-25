/**
 * Catalog test helpers for E2E tests
 */

/**
 * Ensures at least one product with enough stock exists for testing.
 * This is a stub — actual implementation should query the DB and seed if needed.
 */
export async function ensureAtLeastOneProductWithStock(options: { minStock: number }): Promise<void> {
  // No-op stub: in CI, products are expected to exist with sufficient stock.
  // If this needs active seeding, implement against the backend API.
  void options;
}
