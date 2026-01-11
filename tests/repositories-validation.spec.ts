import { test, expect } from '@playwright/test';

test.describe('Repositories Validation - Type Safety', () => {
  test('should handle order repository operations with proper types', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should handle product repository operations', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get('http://localhost:3001/api/products');
    
    expect(response.status()).toBe(200);
    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);
  });

  test('should handle collection repository operations', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get('http://localhost:3001/api/collections');
    
    expect(response.status()).toBe(200);
    const collections = await response.json();
    expect(Array.isArray(collections)).toBe(true);
  });
});
