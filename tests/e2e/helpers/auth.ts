import { expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function readBackendEnv() {
  const envPath = path.resolve(process.cwd(), '..', 'backend', '.env');
  const raw = await fs.readFile(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const kv: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    kv[k] = v;
  }
  return {
    supabaseUrl: kv.SUPABASE_URL,
    serviceRoleKey: kv.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export async function createConfirmedE2EUser() {
  const { supabaseUrl, serviceRoleKey } = await readBackendEnv();
  const email = `e2e_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;
  const password = 'Senha123456!';

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'E2E Usuário' },
  });

  // Also create profile record to satisfy FK constraints on orders table
  if (data.user?.id) {
    await admin.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: 'E2E Usuário',
      role: 'customer',
    });
  }

  return { id: data.user?.id, email, password };
}

export async function loginViaAuthDrawer(page: Page, creds: { email: string; password: string }) {
  // O botão mostra "Login" quando não logado, e "Account" após login
  const loginButton = page.getByRole('button', { name: 'Login', exact: true });
  await expect(loginButton).toBeVisible({ timeout: 30000 });
  await loginButton.click();

  const form = page.locator('form');
  await expect(form).toBeVisible({ timeout: 30000 });

  await form.locator('input[type="email"]').fill(creds.email);
  await form.locator('input[type="password"]').fill(creds.password);
  await form.locator('button[type="submit"]').click();

  // Aguardar drawer fechar
  const closeAll = page.getByRole('button', { name: 'Close drawer', exact: true });
  try {
    await expect(closeAll).toHaveCount(0, { timeout: 30000 });
  } catch {
    if (await closeAll.first().isVisible().catch(() => false)) {
      await closeAll.first().click({ force: true }).catch(() => null);
    }
    await expect(closeAll).toHaveCount(0, { timeout: 10000 });
  }
  // Após login, esperar pelo botão Account (indica login bem-sucedido)
  await expect(page.getByRole('button', { name: 'Account', exact: true })).toBeVisible({ timeout: 30000 });
}
