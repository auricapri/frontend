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
    const pageErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(String(err));
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    const ignored = [
      /ResizeObserver loop limit exceeded/i,
      /ResizeObserver loop completed with undelivered notifications/i,
      /Failed to load resource/i,
    ];
    const relevantConsole = errors.filter(e => !ignored.some(rx => rx.test(e)));
    const relevantPage = pageErrors.filter(e => !ignored.some(rx => rx.test(e)));

    const all = [...relevantConsole.map(e => ({ type: 'console.error', message: e })), ...relevantPage.map(e => ({ type: 'pageerror', message: e }))];
    if (all.length > 0) {
      console.log('enum-validation:console-errors', all);
      await test.info().attach('console-errors', {
        body: Buffer.from(JSON.stringify({ errors, pageErrors, filtered: all }, null, 2), 'utf8'),
        contentType: 'application/json',
      });
    }

    expect(all.length).toBe(0);
  });

  test('should render main navigation elements', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });
});
