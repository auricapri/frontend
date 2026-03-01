/**
 * 08 — Saúde das APIs e endpoints críticos
 */
import { test, expect } from '@playwright/test';

const API_BASE = 'https://server-api.auricapri.com.br';
const ADMIN_API = 'https://server-api.auricapri.com.br'; // Same API, different routes

test.describe('API Health — Endpoints Públicos', () => {
  test('Health check do backend', async ({ request }) => {
    const start = Date.now();
    const resp = await request.get(`${API_BASE}/health`);
    const time = Date.now() - start;

    console.log(`  🏥 /health: ${resp.status()} (${time}ms)`);
    expect(resp.status(), 'Health check deve retornar 200').toBe(200);
    expect(time, 'Health check deve responder em < 5s').toBeLessThan(5000);
  });

  test('API de produtos funciona', async ({ request }) => {
    const start = Date.now();
    const resp = await request.get(`${API_BASE}/api/products`);
    const time = Date.now() - start;

    console.log(`  📦 /api/products: ${resp.status()} (${time}ms)`);
    expect(resp.ok(), 'API de produtos deve retornar 2xx').toBeTruthy();

    const data = await resp.json().catch(() => null);
    if (data) {
      const count = Array.isArray(data) ? data.length : (data.products?.length || data.data?.length || 'unknown');
      console.log(`  📦 Produtos retornados: ${count}`);
    }
  });

  test('API de categorias funciona', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/api/categories`);
    console.log(`  📂 /api/categories: ${resp.status()}`);
    // May not exist — just log
    if (resp.ok()) {
      const data = await resp.json().catch(() => null);
      if (data) {
        const count = Array.isArray(data) ? data.length : 'object';
        console.log(`  📂 Categorias: ${count}`);
      }
    }
  });

  test('Response headers de segurança', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/health`);
    const headers = resp.headers();

    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'x-xss-protection',
    ];

    console.log('\n  🔒 Security Headers:');
    securityHeaders.forEach((header) => {
      const value = headers[header];
      const icon = value ? '✅' : '⚠';
      console.log(`    ${icon} ${header}: ${value || 'MISSING'}`);
    });

    // CORS headers
    console.log(`    ℹ access-control-allow-origin: ${headers['access-control-allow-origin'] || 'not set'}`);
  });

  test('API response times benchmark', async ({ request }) => {
    const endpoints = [
      '/health',
      '/api/products',
    ];

    console.log('\n  📊 API Benchmark:');
    for (const endpoint of endpoints) {
      const times: number[] = [];
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await request.get(`${API_BASE}${endpoint}`);
        times.push(Date.now() - start);
      }

      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const min = Math.min(...times);
      const max = Math.max(...times);
      const icon = avg > 3000 ? '🔴' : avg > 1000 ? '🟡' : '🟢';
      console.log(`    ${icon} ${endpoint}: avg=${avg}ms min=${min}ms max=${max}ms`);
    }
  });

  test('SSL/HTTPS funciona corretamente', async ({ request }) => {
    // Testar que HTTPS funciona
    const resp = await request.get('https://www.auricapri.com.br');
    expect(resp.ok(), 'HTTPS deve funcionar').toBeTruthy();
    console.log('  🔒 HTTPS loja: OK');

    const adminResp = await request.get('https://admin.auricapri.com.br');
    expect(adminResp.ok(), 'HTTPS admin deve funcionar').toBeTruthy();
    console.log('  🔒 HTTPS admin: OK');

    const apiResp = await request.get(`${API_BASE}/health`);
    expect(apiResp.ok(), 'HTTPS API deve funcionar').toBeTruthy();
    console.log('  🔒 HTTPS API: OK');
  });
});
