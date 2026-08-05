import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const FIXTURE_ORIGIN = 'http://127.0.0.1:4173';

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__test/reset`);
  expect(response.ok()).toBe(true);
});

test('omits every crowding field, proxy, placeholder, and control from the public rider flow', async ({ page }) => {
  await openAppWithControlledWorker(page);
  await chooseStation(page, '125 St');

  const publicSurface = `${await page.locator('body').innerText()} ${await page.locator('body').evaluate((element) => element.outerHTML)}`;
  expect(publicSurface).not.toMatch(/crowding|occupancy|standing room|car.?load|load factor|seats available/i);
  expect(await page.locator('[data-crowding], [aria-label*="crowd" i]').count()).toBe(0);

  const publicPayloads = await page.evaluate(async () => Promise.all([
    fetch('/api/v1/bootstrap').then((response) => response.text()),
    fetch('/api/v1/stations/A12/board').then((response) => response.text()),
  ]));
  expect(publicPayloads.join(' ')).not.toMatch(/crowding|occupancy|standing room|car.?load|loadFactor|seatsAvailable/i);
});

test('warms device-held subway references through the product and plans with them offline', async ({ context, page }) => {
  await openAppWithControlledWorker(page);

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

  const shellPaths = await page.evaluate(() => [
    '/index.html',
    ...[...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"]')]
      .map((element) => new URL(element instanceof HTMLScriptElement ? element.src : element.href).pathname),
  ]);
  await expect.poll(() => page.evaluate(async () => {
    const shell = await caches.open('subway-first-shell-v2');
    return Promise.all((await shell.keys()).map(async ({ url }) => new URL(url).pathname));
  })).toEqual(expect.arrayContaining(shellPaths));

  await chooseStation(page, '125 St');
  await expect(page.getByText('Live and expected arrivals', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('button', { name: 'Typical weekday', exact: true }).click();
  await expect(page.getByText('Unofficial app-owned subway reference geometry', { exact: true })).toBeVisible();

  const structuralPaths = await page.evaluate(async () => {
    const structural = await caches.open('subway-first-structural-v2');
    return Promise.all((await structural.keys()).map(async ({ url }) => new URL(url).pathname));
  });
  expect(structuralPaths).toEqual(expect.arrayContaining([
    expect.stringMatching(/^\/api\/v1\/stations\/catalog\/[^/]+$/),
    expect.stringMatching(/^\/api\/v1\/maps\/day\/reference\/[^/]+$/),
    expect.stringMatching(/^\/api\/v1\/maps\/night\/reference\/[^/]+$/),
    expect.stringMatching(/^\/api\/v1\/journeys\/reference\/[^/]+$/),
  ]));

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

test('shows a cached board as historical when only its request fails and the navigator remains online', async ({ page, request }) => {
  await openAppWithControlledWorker(page);
  await chooseStation(page, '125 St');
  await expect(page.getByText('Live and expected arrivals', { exact: true })).toBeVisible();

  await configureFixture(request, { boardTransport: 'drop' });
  await page.getByRole('button', { name: 'Refresh train times' }).click();

  await expect(page.getByText(/Historical board · last checked/)).toBeVisible();
  await expect(page.getByText('Historical arrival', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Live', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => navigator.onLine)).toBe(true);
});

test('keeps the Actual intent truthful, then restores only after ordered owner refreshes', async ({ context, page, request }) => {
  await configureFixture(request, { overlay: 'missing' });
  await openAppWithControlledWorker(page);
  await chooseStation(page, '125 St');
  await expect(page.getByText('Live and expected arrivals', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Map', exact: true }).click();
  const actual = page.getByRole('button', { name: 'Actual now' });
  await expect(actual).toHaveAttribute('aria-pressed', 'true');
  await expect(actual).toBeDisabled();
  await expect(page.getByText('Current service overlay could not be verified. Choose a reference pattern to continue.', { exact: true })).toBeVisible();
  await expect(page.getByText('Subway reference — current overlay unavailable', { exact: true })).toBeVisible();
  await expect(page.locator('[data-map-feature="segment-a-uptown"]')).toHaveAttribute('data-state', 'reference');

  const map = page.getByTestId('vector-network-map');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(map).toHaveAttribute('data-viewport', /,1\.25$/);
  await page.getByRole('button', { name: 'Reset to NYC overview' }).click();
  await expect(map).toHaveAttribute('data-viewport', '40.7128,-74.006,1');

  await configureFixture(request, { overlay: 'ready' });
  await clearFixtureRequests(request);
  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await context.setOffline(false);

  await expect(actual).toBeEnabled();
  await expect(page.getByText('Actual now', { exact: true }).last()).toBeVisible();
  await expect(page.locator('[data-map-feature="segment-a-uptown"]')).toHaveAttribute('data-state', 'affected');
  await expect(page.getByText('Connection restored. Rechecking subway information before showing anything as current.', { exact: true })).toHaveCount(0);

  await expect.poll(async () => recoveryOwnerRequests(request)).toEqual([
    'GET /api/v1/stations/A12/board',
    'GET /api/v1/stations/A12/board',
    'GET /api/v1/stations/A12/board',
    'GET /api/v1/maps/day/overlay',
  ]);
});

async function openAppWithControlledWorker(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'NYC Subway Train Time Tracker' })).toBeVisible();
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe(`${FIXTURE_ORIGIN}/`);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

async function chooseStation(page: Page, name: string): Promise<void> {
  await page.getByRole('toolbar', { name: 'Nearby controls' }).getByRole('button', { name: 'Choose a station' }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true, level: 2 })).toBeVisible();
}

async function configureFixture(
  request: APIRequestContext,
  state: { readonly boardTransport?: 'ok' | 'drop'; readonly overlay?: 'ready' | 'missing' },
): Promise<void> {
  const response = await request.post(`${FIXTURE_ORIGIN}/__test/state`, { data: state });
  expect(response.ok()).toBe(true);
}

async function clearFixtureRequests(request: APIRequestContext): Promise<void> {
  const response = await request.post(`${FIXTURE_ORIGIN}/__test/requests/clear`);
  expect(response.ok()).toBe(true);
}

async function recoveryOwnerRequests(request: APIRequestContext): Promise<readonly string[]> {
  const response = await request.get(`${FIXTURE_ORIGIN}/__test/requests`);
  expect(response.ok()).toBe(true);
  const body = await response.json() as { readonly requests: readonly string[] };
  return body.requests.filter((entry) => (
    entry === 'GET /api/v1/stations/A12/board' || entry === 'GET /api/v1/maps/day/overlay'
  ));
}
