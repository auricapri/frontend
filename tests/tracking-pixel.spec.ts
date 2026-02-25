import { test, expect } from '@playwright/test';

const pixelGifBody = Buffer.from(
  '47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b',
  'hex'
);

test('dispara pixel no page_view', async ({ page }) => {
  let pixelUrl: string | null = null;

  await page.route('**/tracking/pixel.gif**', async route => {
    pixelUrl = route.request().url();
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'image/gif' },
      body: pixelGifBody,
    });
  });

  await page.goto('/');

  await expect.poll(() => pixelUrl, { timeout: 5000 }).not.toBeNull();
  const url = new URL(pixelUrl as unknown as string);
  expect(url.searchParams.get('event')).toBe('page_view');
});

test.describe('geo+clima', () => {
  test.use({
    geolocation: { latitude: -23.5505, longitude: -46.6333 },
    permissions: ['geolocation'],
  });

  test('envia evento com geo+clima quando consentido', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tracking_consent', JSON.stringify({ analytics: true, geolocation: true }));
  });

  await page.route('**/api/weather/current**', async route => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ temperatureC: 22, weatherCode: 1, windSpeedKmh: 8, humidityPercent: 55 }),
    });
  });

  let beaconPayload: any = null;
  await page.route('**/api/tracking/event', async route => {
    beaconPayload = route.request().postDataJSON();
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/');

  await expect.poll(() => beaconPayload, { timeout: 5000 }).not.toBeNull();
  expect(beaconPayload.event).toBe('page_view');
  expect(beaconPayload.consent).toEqual({ analytics: true, geolocation: true });
  expect(beaconPayload.metadata.geo).toBeTruthy();
  expect(beaconPayload.metadata.weather).toBeTruthy();
});
});
