import { test, expect } from '@playwright/test';

test.describe('Enum Validation - Application Startup', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    await expect(page).toHaveTitle(/Auricapri/i);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    expect(errors.length).toBe(0);
  });

  test('should render main navigation elements', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });
});
