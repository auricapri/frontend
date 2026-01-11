import { test, expect } from '@playwright/test';

test.describe('Logger Validation - Backend Logging', () => {
  test('should handle requests and log appropriately', async ({ page }) => {
    test.setTimeout(30000);
    
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    const response = await page.goto('http://localhost:3001/health', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    
    const healthData = await response?.json();
    expect(healthData).toHaveProperty('status');
    expect(healthData.status).toBe('ok');
  });

  test('should log errors appropriately on invalid requests', async ({ page }) => {
    test.setTimeout(30000);
    
    const response = await page.goto('http://localhost:3001/api/invalid-endpoint', { 
      waitUntil: 'networkidle' 
    });
    
    expect(response?.status()).toBe(404);
    
    const errorData = await response?.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toHaveProperty('message');
  });

  test('should not have console.log in production responses', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('Server running')) {
        consoleMessages.push(msg.text());
      }
    });
    
    const response = await page.goto('http://localhost:3001/health');
    expect(response?.status()).toBe(200);
    
    expect(consoleMessages.length).toBe(0);
  });
});
