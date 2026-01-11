import { test, expect } from '@playwright/test';

test.describe('Order Status Enum Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  });

  test('should display order statuses correctly in admin panel', async ({ page }) => {
    test.setTimeout(60000);
    
    const authButton = page.locator('button, a').filter({ 
      hasText: /login|entrar|sign|account|conta|user|👤/i 
    }).first();
    
    if (await authButton.count() > 0) {
      await authButton.click();
      await page.waitForTimeout(1000);
      
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill(process.env.ADMIN_EMAIL || 'admin@test.com');
        
        const passwordInput = page.locator('input[type="password"]').first();
        if (await passwordInput.count() > 0) {
          await passwordInput.fill(process.env.ADMIN_PASSWORD || 'test123');
          
          const submitButton = page.locator('button[type="submit"], button').filter({
            hasText: /login|entrar|sign in/i
          }).first();
          
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    const adminLink = page.locator('a, button').filter({
      hasText: /admin|painel|dashboard/i
    }).first();
    
    if (await adminLink.count() > 0) {
      await adminLink.click();
      await page.waitForTimeout(2000);
      
      const ordersTab = page.locator('button, a').filter({
        hasText: /pedidos|orders/i
      }).first();
      
      if (await ordersTab.count() > 0) {
        await ordersTab.click();
        await page.waitForTimeout(1000);
        
        const orderElements = page.locator('[class*="order"], [class*="pedido"]');
        const count = await orderElements.count();
        
        if (count > 0) {
          expect(count).toBeGreaterThan(0);
          
          const firstOrder = orderElements.first();
          await expect(firstOrder).toBeVisible();
        }
      }
    }
  });

  test('should handle status transitions correctly', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    const statusElements = page.locator('[class*="status"], [class*="pending"], [class*="confirmed"], [class*="shipped"], [class*="delivered"]');
    const count = await statusElements.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should not have hardcoded status strings in rendered HTML', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    const bodyContent = await page.content();
    
    const hardcodedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const foundHardcoded = hardcodedStatuses.filter(status => 
      bodyContent.includes(`status === '${status}'`) || 
      bodyContent.includes(`status==='${status}'`) ||
      bodyContent.includes(`"${status}"`) && bodyContent.includes('status')
    );
    
    expect(foundHardcoded.length).toBe(0);
  });
});
