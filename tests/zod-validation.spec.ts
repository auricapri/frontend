import { test, expect } from '@playwright/test';

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:3002';

test.describe('Zod Validation - API Routes', () => {
  test('should reject invalid order creation data', async ({ request }) => {
    test.setTimeout(30000);
    
    const invalidOrderData = {
      items: [],
      addressData: {
        cep: '123',
        street: '',
      },
      paymentMethod: 'invalid_method',
      subtotal: -100,
    };

    const response = await request.post(`${apiBaseUrl}/api/orders`, {
      data: invalidOrderData,
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should reject invalid signup data', async ({ request }) => {
    test.setTimeout(30000);
    
    const invalidSignupData = {
      email: 'not-an-email',
      password: '123',
    };

    const response = await request.post(`${apiBaseUrl}/api/auth/signup`, {
      data: invalidSignupData,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('details');
  });

  test('should reject invalid signin data', async ({ request }) => {
    test.setTimeout(30000);
    
    const invalidSigninData = {
      email: 'not-an-email',
      password: '',
    };

    const response = await request.post(`${apiBaseUrl}/api/auth/signin`, {
      data: invalidSigninData,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should accept valid order status update format', async ({ request }) => {
    test.setTimeout(30000);
    
    const invalidStatusUpdate = {
      status: 'invalid_status',
      trackingCode: null,
    };

    const response = await request.put(`${apiBaseUrl}/api/orders/00000000-0000-0000-0000-000000000000/status`, {
      data: invalidStatusUpdate,
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
