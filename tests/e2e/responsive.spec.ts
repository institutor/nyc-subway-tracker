import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import {
  chooseScenario,
  expectNoCrowdingInEvidence,
  expectNoCrowdingOrPersonalCoordinatesAnywhere,
  expectNoEmbeddedProtectedAssetInEvidence,
  expectNoHorizontalOverflow,
  FIXTURE_ORIGIN,
  openValidationDeck,
} from './helpers';

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__test/reset`);
  expect(response.ok()).toBe(true);
});

test('reflows at 320 pixels and 200% text without hiding thumb controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await openValidationDeck(page);
  await chooseScenario(page, 'Location allowed · practical walk ranking');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await expectNoHorizontalOverflow(page);
  const dock = page.getByRole('navigation', { name: 'Primary' });
  await expect(dock).toBeVisible();
  for (const name of ['Nearby', 'Saved', 'Map', 'Commute']) {
    await expect(dock.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

test('keeps the production Nearby surface inside the viewport at 200% text', async ({ context, page }) => {
  await context.grantPermissions(['geolocation'], { origin: 'http://127.0.0.1:4173' });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
});

test('keeps populated production Saved, Map, and active-trip surfaces reflowed at 200% text', async ({ context, page }) => {
  await context.clearPermissions();
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: '125 St', exact: true }).click();
  await page.getByRole('button', { name: 'Save this station' }).click();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('combobox', { name: 'Destination station' }).fill('Canal');
  await page.getByRole('option', { name: /Canal St/ }).click();
  await page.getByRole('button', { name: 'Plan current trip' }).click();
  await page.getByRole('button', { name: 'Use this trip' }).first().click();
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  await expect(page.getByRole('heading', { name: '125 St to Canal St' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Map', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('supports a keyboard-only board action and bottom-navigation transition with visible focus', async ({ context, page, request }) => {
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.goto('/');
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  await tabTo(page, /^Open Uptown \/ Northbound board/);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '125 St', exact: true, level: 2 })).toBeVisible();

  await tabTo(page, /^Show only A trains$/);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Show only A trains' })).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, /^Show northbound only$/);
  await expect(page.getByRole('button', { name: 'Show northbound only' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Show northbound only' })).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Show northbound only' })).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, /^Reverse direction$/);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Show southbound only' })).toHaveAttribute('aria-pressed', 'true');

  await request.post(`${FIXTURE_ORIGIN}/__test/requests/clear`);
  await tabTo(page, /^Refresh train times$/);
  await page.keyboard.press('Enter');
  await expect.poll(async () => {
    const response = await request.get(`${FIXTURE_ORIGIN}/__test/requests`);
    const body = await response.json() as { requests: readonly string[] };
    return body.requests.filter((entry) => /\/api\/v1\/stations\/A12\/board/.test(entry)).length;
  }).toBeGreaterThan(0);

  await tabTo(page, /^Map$/);
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Map', exact: true })).toBeVisible();
});

test('respects reduced motion and remains readable at a desktop viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await openValidationDeck(page);
  await chooseScenario(page, 'Board · loading motion');
  await expectNoHorizontalOverflow(page);
  await expect(page.getByLabel('Station arrivals loading')).toBeVisible();
  await expectNoVisibleMotion(page);
});

test('removes animation and transition time from a real production loading state', async ({ context, page, request }) => {
  await request.post(`${FIXTURE_ORIGIN}/__test/state`, { data: { walkDelayMs: 1_200 } });
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByLabel('Nearby subway stations loading')).toBeVisible();
  await expectNoVisibleMotion(page);
});

test('keeps the thumb and board control docks in reach and unobscured on a phone', async ({ context, page }) => {
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByTestId('nearby-station-card').first().getByRole('button', { name: /Open Uptown \/ Northbound board/ }).click();
  const boardDock = page.getByRole('toolbar', { name: 'Board controls' });
  await boardDock.scrollIntoViewIfNeeded();
  await assertBottomThirdAndUnobscured(page, boardDock);
  await boardDock.getByRole('button', { name: 'Show only C trains' }).click();
  await expect(boardDock.getByRole('button', { name: 'Show only C trains' })).toHaveAttribute('aria-pressed', 'true');
  await boardDock.getByRole('button', { name: 'Reverse direction' }).click();
  await expect(boardDock.getByRole('button', { name: 'Show southbound only' })).toHaveAttribute('aria-pressed', 'true');
  await boardDock.getByRole('button', { name: 'Refresh train times' }).click();

  const primaryDock = page.getByRole('navigation', { name: 'Primary' });
  await assertBottomThirdAndUnobscured(page, primaryDock);
});

test('rejects evasive crowding schema keys and neutral train-car shells', () => {
  const forbiddenEvidence: readonly unknown[] = [
    { occupancy: 'Unknown' },
    { capacity: null },
    { occupancy_status: 'unavailable' },
    { 'car-capacity': 'unknown' },
    '<div class="train-car">Unknown cars</div>',
    '<section data-train-car="placeholder"></section>',
  ];
  for (const evidence of forbiddenEvidence) {
    expect(() => expectNoCrowdingInEvidence([evidence])).toThrow();
  }
});

test('rejects protected or embedded image payloads inside otherwise allowed bundle files', () => {
  const forbiddenEvidence = [
    'background: url(data:image/svg+xml;base64,PHN2Zz4=)',
    'mask-image: url(blob:http://127.0.0.1:4173/mark)',
    'background-image: url(https://assets.example.test/subway-logo.png)',
    '<svg aria-label="transit logo"><path /></svg>',
    'MTA roundel',
    'Metropolitan Transportation Authority brand mark',
  ];
  for (const evidence of forbiddenEvidence) {
    expect(() => expectNoEmbeddedProtectedAssetInEvidence([evidence])).toThrow();
  }
});

test('keeps crowding and personal coordinates out of populated rider state, APIs, caches, and accessibility surfaces', async ({ context, page, request }) => {
  const personalCoordinates = ['40.7086417', '-73.9275314'];
  const outgoing: Array<{ url: string; method: string; postData: string | null }> = [];
  page.on('request', (entry) => outgoing.push({ url: entry.url(), method: entry.method(), postData: entry.postData() }));
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: Number(personalCoordinates[0]), longitude: Number(personalCoordinates[1]), accuracy: 11 });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  const notificationPermissionBefore = await page.evaluate(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const surfaceEvidence: string[] = [await page.locator('body').evaluate((body) => body.outerHTML), await page.locator('body').ariaSnapshot()];

  await page.getByTestId('nearby-station-card').first().getByRole('button', { name: /Open Uptown \/ Northbound board/ }).click();
  await page.getByRole('button', { name: 'Save this station' }).click();
  surfaceEvidence.push(await page.locator('body').evaluate((body) => body.outerHTML), await page.locator('body').ariaSnapshot());
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await page.getByRole('button', { name: 'Edit saved station 125 St' }).click();
  const editor = page.locator('form.saved-editor');
  await editor.getByRole('checkbox', { name: 'Include A' }).check();
  await editor.getByRole('checkbox', { name: 'Accessible Route Only' }).check();
  await editor.getByRole('checkbox', { name: 'Use preferred ride' }).check();
  await editor.getByLabel('Preferred direction').selectOption('southbound');
  await editor.getByLabel('Preferred actual destination').fill('Far Rockaway');
  await editor.getByRole('checkbox', { name: 'Use common destination' }).check();
  await editor.getByLabel('Common destination station').selectOption({ label: 'Canal St' });
  await editor.getByRole('checkbox', { name: 'Use commute window' }).check();
  await editor.getByRole('button', { name: 'Save changes for 125 St' }).click();
  surfaceEvidence.push(await page.locator('body').evaluate((body) => body.outerHTML), await page.locator('body').ariaSnapshot());

  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('combobox', { name: 'Destination station' }).fill('Canal');
  await page.getByRole('option', { name: /Canal St/ }).click();
  await page.getByRole('button', { name: 'Plan current trip' }).click();
  await page.getByRole('button', { name: 'Use this trip' }).first().click();
  await page.getByRole('button', { name: "I'm at this stop: Canal St" }).click();
  await page.getByRole('button', { name: 'Late night', exact: true }).click();
  await expect(page.getByText('Unofficial app-owned subway reference geometry', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Typical weekday', exact: true }).click();
  surfaceEvidence.push(await page.locator('body').evaluate((body) => body.outerHTML), await page.locator('body').ariaSnapshot());

  await request.post(`${FIXTURE_ORIGIN}/__test/requests/clear`);
  await page.getByRole('button', { name: 'Commute', exact: true }).click();
  await expect(page.getByText('Commute alerts remain locked until an exact route segment is saved for this window.', { exact: true })).toBeVisible();
  const commuteRequests = await (await request.get(`${FIXTURE_ORIGIN}/__test/requests`)).json() as { requests: readonly string[] };
  expect(commuteRequests.requests.filter((entry) => /notification|commute|subscribe|evaluate|deliver/iu.test(entry))).toEqual([]);
  surfaceEvidence.push(await page.locator('body').evaluate((body) => body.outerHTML), await page.locator('body').ariaSnapshot());
  await page.getByRole('button', { name: 'Settings' }).click();
  surfaceEvidence.push(await page.locator('body').evaluate((body) => body.outerHTML), await page.locator('body').ariaSnapshot());
  await page.getByRole('button', { name: 'Data status' }).click();
  await expect(page.getByRole('heading', { name: 'Data status', exact: true })).toBeVisible();
  surfaceEvidence.push(await page.locator('body').evaluate((body) => body.outerHTML), await page.locator('body').ariaSnapshot());

  const apiPayloads = await page.evaluate(async ({ latitude, longitude }) => {
    const captured: Array<{ url: string; status: number; body: unknown }> = [];
    const requestJson = async (url: string, init?: RequestInit) => {
      const response = await fetch(url, init);
      const text = await response.text();
      let body: unknown = text;
      try { body = JSON.parse(text); } catch { /* Evidence remains exact text. */ }
      captured.push({ url, status: response.status, body });
      return body as Record<string, any>;
    };
    const bootstrap = await requestJson('/api/v1/bootstrap');
    const versions = bootstrap.data.contentVersions;
    await requestJson(`/api/v1/stations/catalog/${versions.stationCatalog}`);
    await requestJson('/api/v1/nearby', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: { latitude, longitude, accuracyMeters: 11 }, accessibleRouteOnly: false }),
    });
    await requestJson('/api/v1/stations/A12/board');
    await requestJson(`/api/v1/maps/day/reference/${versions.maps.day}`);
    await requestJson(`/api/v1/maps/night/reference/${versions.maps.night}`);
    await requestJson('/api/v1/maps/day/overlay');
    await requestJson('/api/v1/maps/night/overlay');
    await requestJson(`/api/v1/journeys/reference/${versions.journeyGraph}`);
    await requestJson('/api/v1/journeys', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'online-current', originStationId: 'A12', destinationStationId: 'R20', accessibleRouteOnly: false }),
    });
    await requestJson('/api/v1/status');
    await requestJson('/api/v1/notifications/vapid-public-key');
    await requestJson('/api/v1/notifications/subscriptions/status', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    });
    await requestJson('/__test/commute-lock');
    return captured;
  }, { latitude: Number(personalCoordinates[0]), longitude: Number(personalCoordinates[1]) });

  const retained = await expectNoCrowdingOrPersonalCoordinatesAnywhere(
    page, apiPayloads, personalCoordinates, surfaceEvidence,
  );
  expect(Object.keys(retained.local).sort()).toEqual([
    'nyc-subway-tracker:active-trip:v3',
    'nyc-subway-tracker:last-station:v1',
    'nyc-subway-tracker:saved:v2',
    'nyc-subway-tracker:structural:v2',
  ]);
  const saved = JSON.parse(retained.local['nyc-subway-tracker:saved:v2'] ?? '{}') as { records?: readonly any[] };
  expect(saved.records).toHaveLength(1);
  expect(saved.records?.[0]).toMatchObject({
    routeFilters: expect.arrayContaining(['A']), accessibleRouteOnly: true,
    commonDestination: { constituentId: 'R20' },
    timeWindow: { weekdays: [1, 2, 3, 4, 5], startsAt: '08:00', endsAt: '09:00' },
  });
  const active = JSON.parse(retained.local['nyc-subway-tracker:active-trip:v3'] ?? '{}') as { trip?: { cursor?: { pointId?: string } } };
  expect(active.trip?.cursor?.pointId).toBeTruthy();
  const structural = JSON.parse(retained.local['nyc-subway-tracker:structural:v2'] ?? '{}') as { catalog?: { data?: { complexes?: unknown[] } } };
  expect(structural.catalog?.data?.complexes?.length).toBeGreaterThan(0);
  expect(retained.session).toEqual({});
  expect(retained.cookies).toEqual([]);
  expect(retained.indexedDatabases).toEqual([]);
  expect([...new Set(retained.cached.map(({ cacheName }) => cacheName))].sort()).toEqual([
    'subway-first-history-v2', 'subway-first-shell-v2', 'subway-first-structural-v2',
  ]);
  await expect.poll(() => page.evaluate(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission))
    .toBe(notificationPermissionBefore);
  const structuralPaths = retained.cached.filter(({ cacheName }) => cacheName === 'subway-first-structural-v2').map(({ request: url }) => new URL(url).pathname);
  expect(structuralPaths).toEqual(expect.arrayContaining([
    expect.stringMatching(/^\/api\/v1\/stations\/catalog\//u),
    expect.stringMatching(/^\/api\/v1\/maps\/day\/reference\//u),
    expect.stringMatching(/^\/api\/v1\/maps\/night\/reference\//u),
    expect.stringMatching(/^\/api\/v1\/journeys\/reference\//u),
  ]));
  const historicalPaths = retained.cached.filter(({ cacheName }) => cacheName === 'subway-first-history-v2').map(({ request: url }) => new URL(url).pathname);
  expect(historicalPaths).toEqual(expect.arrayContaining([
    '/api/v1/stations/A12/board', '/api/v1/maps/day/overlay', '/api/v1/maps/night/overlay', '/api/v1/status',
  ]));
  expect(retained.cached.some(({ request: url }) => /\/api\/v1\/(?:nearby|journeys)$/u.test(new URL(url).pathname))).toBe(false);
  const coordinateRequests = outgoing.filter(({ postData }) => personalCoordinates.some((coordinate) => postData?.includes(coordinate)));
  expect(coordinateRequests.length).toBeGreaterThan(0);
  expect(coordinateRequests.every(({ method, url }) => method === 'POST' && new URL(url).pathname === '/api/v1/nearby')).toBe(true);
  expect(outgoing.some(({ url }) => personalCoordinates.some((coordinate) => url.includes(coordinate)))).toBe(false);
});

test('ships only the closed app-owned asset inventory and no validation or protected-map payload', async ({ context, page }) => {
  const clientRoot = resolve(process.cwd(), 'dist/client');
  const files = (await listFiles(clientRoot)).sort();
  const scripts = files.filter((path) => /^assets\/index-[A-Za-z0-9_-]+\.js$/u.test(path));
  const styles = files.filter((path) => /^assets\/index-[A-Za-z0-9_-]+\.css$/u.test(path));
  expect(scripts).toHaveLength(1);
  expect(styles).toHaveLength(1);
  const allowlist = ['index.html', 'manifest.webmanifest', 'sw.js', 'icons/app-icon.svg', scripts[0]!, styles[0]!].sort();
  expect(files).toEqual(allowlist);
  expect(files.some((path) => /\.(?:png|jpe?g|gif|webp|avif|woff2?|pdf|geojson|mvt|pbf)$/iu.test(path))).toBe(false);

  const contents = Object.fromEntries(await Promise.all(files.map(async (path) => [
    path, await readFile(resolve(clientRoot, ...path.split('/')), 'utf8'),
  ])));
  expectNoCrowdingInEvidence([contents]);
  const productionAssets = Object.values(contents).join('\n');
  const bundledCode = [contents[scripts[0]!], contents[styles[0]!]];
  expect(contents[styles[0]!]).not.toMatch(/\burl\s*\(/iu);
  expectNoEmbeddedProtectedAssetInEvidence(bundledCode);
  expect(productionAssets).not.toMatch(/Subway rider validation deck|Fixture-only rider evidence|Location allowed · practical walk ranking|Board · live overlap and holding|Reconnect · stage 1 path invalidation|Commute · material bypass|scenario-receipts|fixture-client|fixture-server|__validation|\/__test\//u);
  const htmlRefs = [...contents['index.html']!.matchAll(/(?:src|href)="([^"]+)"/gu)].map((match) => match[1]).sort();
  expect(htmlRefs).toEqual(['/assets/' + scripts[0]!.split('/').at(-1), '/assets/' + styles[0]!.split('/').at(-1), '/icons/app-icon.svg', '/manifest.webmanifest'].sort());
  const manifest = JSON.parse(contents['manifest.webmanifest']!) as { icons: readonly { src: string }[] };
  expect(manifest.icons.map(({ src }) => src)).toEqual(['/icons/app-icon.svg']);
  const injected = JSON.parse(contents['sw.js']!.match(/const INJECTED_BUILD_ASSETS = (\[[^;]+\]);/u)?.[1] ?? 'null') as readonly string[];
  expect([...injected].sort()).toEqual([`/${scripts[0]}`, `/${styles[0]}`].sort());
  const shellBlock = contents['sw.js']!.match(/const SHELL_URLS = Object\.freeze\(\[([\s\S]*?)\]\);/u)?.[1] ?? '';
  const coreShell = [...shellBlock.matchAll(/'([^']+)'/gu)].map((match) => match[1]);
  expect(coreShell).toEqual(['/', '/index.html', '/manifest.webmanifest', '/icons/app-icon.svg']);
  expect([...coreShell, ...injected].sort()).toEqual([
    '/', '/index.html', '/manifest.webmanifest', '/icons/app-icon.svg', `/${scripts[0]}`, `/${styles[0]}`,
  ].sort());
  expect(contents['icons/app-icon.svg']).toBe(await readFile(resolve(process.cwd(), 'public/icons/app-icon.svg'), 'utf8'));
  expect(contents['icons/app-icon.svg']).toContain('<title id="title">Subway First</title>');
  expect(contents['icons/app-icon.svg']).toContain('<desc id="description">Two illuminated platform rails joined by an orange crossing marker.</desc>');

  await context.clearPermissions();
  await page.goto('/');
  await page.getByRole('button', { name: '125 St', exact: true }).click();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  const map = page.getByTestId('vector-network-map');
  await expect(map.getByText('Unofficial app-owned subway reference geometry', { exact: true })).toBeVisible();
  await expect(page.locator('body img, body image, body use, body symbol, body foreignObject')).toHaveCount(0);
  const renderedVectors = page.locator('body svg');
  await expect(renderedVectors).toHaveCount(1);
  await expect(renderedVectors.locator('title')).toHaveText('Original app-owned subway network reference');
  const computedImages = await page.locator('body *:visible').evaluateAll((elements) => elements.flatMap((element) => {
    const style = getComputedStyle(element);
    return [
      ['background-image', style.backgroundImage],
      ['mask-image', style.maskImage],
      ['list-style-image', style.listStyleImage],
      ['border-image-source', style.borderImageSource],
    ].flatMap(([property, value]) => value === 'none' ? [] : [{ property, value, tagName: element.tagName }]);
  }));
  expect(computedImages).toEqual([]);
  const allowedRuntimePaths = new Set(['/', '/index.html', '/manifest.webmanifest', '/icons/app-icon.svg', `/${scripts[0]}`, `/${styles[0]}`, '/sw.js']);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(({ name }) => name));
  for (const resource of resources) {
    const url = new URL(resource);
    expect(url.origin).toBe(FIXTURE_ORIGIN);
    if (!url.pathname.startsWith('/api/v1/')) expect(allowedRuntimePaths.has(url.pathname)).toBe(true);
  }
});

async function listFiles(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(resolve(directory, entry.name), relative) : [relative];
  }));
  return paths.flat();
}

async function tabTo(page: import('@playwright/test').Page, accessibleName: RegExp): Promise<void> {
  const candidates = page.getByRole('button', { name: accessibleName });
  for (let index = 0; index < 120; index += 1) {
    await page.keyboard.press('Tab');
    const targetFocused = await candidates.evaluateAll((elements) => elements.some((element) => element === document.activeElement));
    if (targetFocused) return;
  }
  throw new Error(`Keyboard focus never reached ${accessibleName}`);
}

async function assertBottomThirdAndUnobscured(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Dock did not have a visible box');
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Viewport size unavailable');
  expect(box.y + box.height / 2).toBeGreaterThanOrEqual(viewport.height * 2 / 3);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  const unobscured = await locator.evaluate((element) => [...element.querySelectorAll('button')].every((button) => {
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === button || Boolean(hit && button.contains(hit));
  }));
  expect(unobscured).toBe(true);
}

async function expectNoVisibleMotion(page: import('@playwright/test').Page): Promise<void> {
  const motion = await page.locator('body *:visible').evaluateAll((elements) => elements.flatMap((element) => {
    const style = getComputedStyle(element);
    return [style.animationDuration, style.transitionDuration].flatMap((value) => value.split(',')).map((value) => ({
      selector: `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`,
      milliseconds: value.trim().endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1_000,
    }));
  }).filter(({ milliseconds }) => Number.isFinite(milliseconds) && milliseconds > 0.02));
  expect(motion).toEqual([]);
}
