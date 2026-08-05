import { expect, test } from '@playwright/test';

import { catalogEnvelope, journeyGraphReferenceEnvelope } from '../helpers/client-fixtures';

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

  const bootstrapVersions = await page.evaluate(async () => {
    const bootstrap = await (await fetch('/api/v1/bootstrap')).json() as {
      data: { contentVersions: { stationCatalog: string; maps: { day: string; night: string }; journeyGraph: string } };
    };
    return bootstrap.data.contentVersions;
  });
  const structuralPaths = [
    `/api/v1/stations/catalog/${bootstrapVersions.stationCatalog}`,
    `/api/v1/maps/day/reference/${bootstrapVersions.maps.day}`,
    `/api/v1/maps/night/reference/${bootstrapVersions.maps.night}`,
    `/api/v1/journeys/reference/${bootstrapVersions.journeyGraph}`,
  ];

  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe('http://127.0.0.1:4173/');

  // The first visit becomes controlled in place. Once that happens, the app
  // repeats only immutable reference reads so a rider can descend without an
  // artificial online reload.
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const shellPaths = await page.evaluate(() => [
    '/index.html',
    ...[...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"]')]
      .map((element) => new URL(element instanceof HTMLScriptElement ? element.src : element.href).pathname),
  ]);
  await expect.poll(() => page.evaluate(async () => {
    const shell = await caches.open('subway-first-shell-v2');
    return Promise.all((await shell.keys()).map(async ({ url }) => new URL(url).pathname));
  })).toEqual(expect.arrayContaining(shellPaths));
  await expect.poll(() => page.evaluate(async () => {
    const structural = await caches.open('subway-first-structural-v2');
    return Promise.all((await structural.keys()).map(async ({ url }) => new URL(url).pathname));
  })).toEqual(expect.arrayContaining(structuralPaths));

  const offlineVersions = {
    stationCatalog: catalogEnvelope.contentVersion,
    maps: bootstrapVersions.maps,
    journeyGraph: journeyGraphReferenceEnvelope.contentVersion,
  };
  await page.evaluate(async ({ catalog, journeyReference, versions }) => {
    localStorage.setItem('nyc-subway-tracker:structural:v2', JSON.stringify({
      version: 2,
      contentVersions: versions,
      catalog,
    }));
    localStorage.setItem('nyc-subway-tracker:last-station:v1', JSON.stringify({
      complexId: 'A12', constituentId: 'A12', name: '125 St',
    }));
    const structural = await caches.open('subway-first-structural-v2');
    const responseHeaders = { 'cache-control': 'public, max-age=31536000, immutable', 'content-type': 'application/json' };
    await Promise.all([
      structural.put(
        `/api/v1/stations/catalog/${versions.stationCatalog}`,
        new Response(JSON.stringify(catalog), { status: 200, headers: responseHeaders }),
      ),
      structural.put(
        `/api/v1/journeys/reference/${versions.journeyGraph}`,
        new Response(JSON.stringify(journeyReference), { status: 200, headers: responseHeaders }),
      ),
    ]);
  }, { catalog: catalogEnvelope, journeyReference: journeyGraphReferenceEnvelope, versions: offlineVersions });

  const journeyPosts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/journeys') {
      journeyPosts.push(request.url());
    }
  });

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

  await page.getByRole('combobox', { name: 'Destination station' }).fill('Canal');
  await page.getByRole('option', { name: /Canal St/ }).click();
  await page.getByRole('button', { name: 'Plan reference trip' }).click();

  await expect(page.getByRole('heading', { name: 'Untimed structural route' })).toBeVisible();
  await expect(page.getByText('No supported departure time', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use this trip' })).toHaveCount(0);
  expect(journeyPosts).toEqual([]);
});
