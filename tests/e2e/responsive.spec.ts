import { expect, test } from '@playwright/test';

import {
  chooseScenario,
  expectNoCrowdingOrPersonalCoordinatesAnywhere,
  expectNoHorizontalOverflow,
  FIXTURE_ORIGIN,
  openValidationDeck,
} from './helpers';

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
  const motion = await page.locator('body *:visible').evaluateAll((elements) => elements.flatMap((element) => {
    const style = getComputedStyle(element);
    return [style.animationDuration, style.transitionDuration].flatMap((value) => value.split(',')).map((value) => ({
      selector: `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`,
      milliseconds: value.trim().endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1_000,
    }));
  }).filter(({ milliseconds }) => Number.isFinite(milliseconds) && milliseconds > 0.02));
  expect(motion).toEqual([]);
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

test('keeps fixture scenarios, crowding concepts, and personal coordinates out of production assets and device state', async ({ context, page, request }) => {
  const personalCoordinates = ['40.811234', '-73.952345'];
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: Number(personalCoordinates[0]), longitude: Number(personalCoordinates[1]), accuracy: 11 });
  await page.goto('/');
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);

  const bootstrap = await request.get(`${FIXTURE_ORIGIN}/api/v1/bootstrap`);
  const board = await request.get(`${FIXTURE_ORIGIN}/api/v1/stations/A12/board`);
  const apiPayloads = [await bootstrap.json(), await board.json()];
  const html = await (await request.get(`${FIXTURE_ORIGIN}/`)).text();
  const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/gu)].map((match) => match[1]!);
  const assets = await Promise.all(assetPaths.map(async (path) => (await request.get(`${FIXTURE_ORIGIN}${path}`)).text()));
  const productionAssets = assets.join('\n');
  expect(productionAssets).not.toMatch(/Subway rider validation deck|Board · live overlap and holding|scenario-receipts|__validation/);
  expect(productionAssets).not.toMatch(/crowding|occupancy|standing room|car.?load|load factor|seats available/i);
  for (const coordinate of personalCoordinates) expect(productionAssets).not.toContain(coordinate);
  await expectNoCrowdingOrPersonalCoordinatesAnywhere(page, apiPayloads, personalCoordinates);
});

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
