import { expect, test } from '@playwright/test';

test('installs the production shell and keeps reference maps available offline', async ({ context, page }) => {
  await page.goto('/');

  await expect(page.getByRole('main', { name: 'NYC Subway Train Time Tracker' })).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return response.json() as Promise<{ display?: string; name?: string; icons?: unknown[] }>;
  });
  expect(manifest).toMatchObject({
    display: 'standalone',
    name: 'Subway First — NYC Subway Times',
  });
  expect(manifest.icons).not.toHaveLength(0);

  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe('http://127.0.0.1:4173/');

  // The next online load is controlled, so hashed shell assets and both map
  // references pass through the reviewed cache allowlist before connectivity drops.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(() => page.evaluate(async () => {
    const structural = await caches.open('subway-first-structural-v1');
    const [catalog, day, night] = await Promise.all([
      structural.match('/api/v1/stations/catalog/catalog-empty-v1'),
      structural.match('/api/v1/maps/day/reference/map-day-empty-v1'),
      structural.match('/api/v1/maps/night/reference/map-night-empty-v1'),
    ]);
    return Boolean(catalog && day && night);
  })).toBe(true);

  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.getByText(
    'Offline—live arrivals, alerts, and elevator status are unavailable.',
    { exact: true },
  )).toBeVisible();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('button', { name: 'Typical weekday', exact: true }).click();

  await expect(page.getByText('Reference pattern—not live.', { exact: true })).toBeVisible();
  await expect(page.getByText('Unofficial app-owned subway reference geometry', { exact: true })).toBeVisible();
});
