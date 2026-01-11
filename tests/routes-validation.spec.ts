import { test, expect } from '@playwright/test';

test.describe('Routes Validation - Type Safety', () => {
  test('should handle orders routes with proper types', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should handle auth routes with proper types', async ({ request }) => {
    test.setTimeout(30000);
    
    const invalidSignup = {
      email: 'not-an-email',
      password: '123',
    };

    const response = await request.post('http://localhost:3001/api/auth/signup', {
      data: invalidSignup,
    });

    expect(response.status()).toBe(400);
  });

  test('should handle products routes', async ({ request }) => {
    test.setTimeout(30000);
    
    const response = await request.get('http://localhost:3001/api/products');
    
    expect(response.status()).toBe(200);
    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);
  });
});
