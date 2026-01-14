import { test, expect } from '@playwright/test';

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:3002';

test.describe('Repositories Validation - Type Safety', () => {
  test('should handle order repository operations with proper types', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get(`${apiBaseUrl}/api/orders`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should handle product repository operations', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get(`${apiBaseUrl}/api/products`);
    
    expect(response.status()).toBe(200);
    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);
  });

  test('should handle collection repository operations', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get(`${apiBaseUrl}/api/collections`);
    
    expect(response.status()).toBe(200);
    const collections = await response.json();
    expect(Array.isArray(collections)).toBe(true);
  });
});
