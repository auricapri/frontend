import { Page, expect } from '@playwright/test';

/**
 * Helpers úteis para os testes E2E
 */

/**
 * Aguarda a página carregar completamente
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Aguarda um elemento aparecer na tela
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
) {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
}

/**
 * Verifica se um elemento está visível
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector).first();
  return await element.isVisible().catch(() => false);
}

/**
 * Clica em um elemento se ele estiver visível
 */
export async function clickIfVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await waitForElement(page, selector, timeout);
    await page.locator(selector).first().click();
    return true;
  } catch {
    return false;
  }
}

/**
 * Preenche um campo de input
 */
export async function fillInput(
  page: Page,
  selector: string,
  value: string,
  timeout: number = 5000
) {
  await waitForElement(page, selector, timeout);
  await page.locator(selector).first().fill(value);
}

/**
 * Aguarda um tempo específico (use com cuidado, prefira esperas baseadas em elementos)
 */
export async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica se a URL contém um padrão
 */
export function expectUrlToContain(page: Page, pattern: string | RegExp) {
  return expect(page).toHaveURL(pattern);
}

/**
 * Navega para uma rota específica
 */
export async function navigateTo(page: Page, route: string) {
  await page.goto(route);
  await waitForPageLoad(page);
}

/**
 * Verifica se um texto está presente na página
 */
export async function expectTextToBeVisible(page: Page, text: string) {
  const locator = page.getByText(text).first();
  await expect(locator).toBeVisible();
}

