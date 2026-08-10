import { expect, test, type Page } from '@playwright/test';

import { chooseScenario, expectNoCrowding, FIXTURE_ORIGIN, openValidationDeck } from './helpers';

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__test/reset`);
  expect(response.ok()).toBe(true);
});

test('saves a station, plans a map route, activates one trip, and supports forward/back completion', async ({ page }) => {
  await openProductionApp(page);
  await chooseStation(page, '125 St');
  await page.getByRole('button', { name: 'Save this station' }).click();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: '125 St' })).toBeVisible();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('combobox', { name: 'Destination station' }).fill('Canal');
  await page.getByRole('option', { name: /Canal St/ }).click();
  await page.getByRole('button', { name: 'Plan current trip' }).click();
  await page.getByRole('button', { name: 'Use this trip' }).first().click();
  await expect(page.getByRole('heading', { name: '125 St to Canal St' })).toBeVisible();

  const destination = page.getByRole('button', { name: "I'm at this stop: Canal St" });
  await destination.click();
  await expect(page.getByText('Trip complete — rider confirmed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: "I'm at this stop: 125 St" }).click();
  await expect(page.getByText('Trip complete — rider confirmed', { exact: true })).toHaveCount(0);
  await expectNoCrowding(page);
});

test('keeps the active trip and map references navigable after an offline reload without claiming current truth', async ({ context, page }) => {
  await openProductionApp(page);
  await chooseStation(page, '125 St');
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('button', { name: 'Typical weekday', exact: true }).click();
  await expect(page.getByText('Unofficial app-owned subway reference geometry', { exact: true })).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Offline—live arrivals, alerts, and elevator status are unavailable.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('button', { name: 'Typical weekday', exact: true }).click();
  await expect(page.getByText('Reference pattern—not live.', { exact: true })).toBeVisible();
  await expect(page.getByText('Actual now', { exact: true }).first()).toBeDisabled();
});

test('presents the exact five owner stages and stage 1–4 invalidations before lower-priority content', async ({ page }) => {
  await openValidationDeck(page);
  await chooseScenario(page, 'Reconnect · stage 1 path invalidation');
  await expectStageOrder(page);
  await expect(page.getByRole('alert').first()).toContainText('required accessible path');

  for (const [scenario, fragment] of [
    ['Reconnect · stage 2 service invalidation', 'service pattern'],
    ['Reconnect · stage 3 train invalidation', 'stored train choice'],
    ['Reconnect · stage 4 required guidance invalidation', 'required positioning or transfer guidance'],
  ] as const) {
    await chooseScenario(page, scenario);
    await expectStageOrder(page);
    await expect(page.getByRole('alert').first()).toContainText(fragment);
  }

  await chooseScenario(page, 'Reconnect · optional guidance removed');
  await expectStageOrder(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('Optional guidance removed; trip remains valid.', { exact: true })).toBeVisible();
});

async function expectStageOrder(page: Page): Promise<void> {
  await expect(page.getByRole('list', { name: 'Presented reconnection stages' }).getByRole('listitem')).toHaveText([
    '1 · Path and equipment',
    '2 · Service and transfers',
    '3 · Train choice and arrivals',
    '4 · Required guidance',
    '5 · Maps and unrelated saved stations',
  ]);
}

async function openProductionApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'NYC Subway Train Time Tracker' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

async function chooseStation(page: Page, name: string): Promise<void> {
  await page.getByRole('toolbar', { name: 'Nearby controls' }).getByRole('button', { name: 'Choose a station' }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true, level: 2 })).toBeVisible();
}
