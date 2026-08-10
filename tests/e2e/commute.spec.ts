import { expect, test } from '@playwright/test';

import { chooseScenario, expectNoCrowding, FIXTURE_ORIGIN, openValidationDeck } from './helpers';

test.beforeEach(async ({ page }) => openValidationDeck(page));

test('keeps commute evaluation and delivery locked on the public-capability surface', async ({ page }) => {
  await chooseScenario(page, 'Commute · locked');
  await expect(page.getByRole('heading', { name: 'Commute' })).toBeVisible();
  await expect(page.getByText('Commute alerts remain locked until their safety stage is enabled.', { exact: true })).toBeVisible();
  await expect(page.getByText('Delivery remains locked; no notification was sent.', { exact: true })).toBeVisible();
  const receipt = page.getByRole('region', { name: 'Locked commute monitor receipt' });
  await expect(receipt).toContainText('kind · evaluated');
  await expect(receipt).toContainText('delivered · 0');
  await expect(receipt).toContainText('sender calls · 0');
});

test('renders deterministic materiality receipts without opening delivery', async ({ page }) => {
  for (const [scenario, outcome, reason] of [
    ['Commute · material bypass', 'Send · initial', 'Use the A/C from W 4 St.'],
    ['Commute · duplicate episode', 'Suppress', 'equivalent-delivered'],
    ['Commute · correction only', 'Suppress', 'correction-only'],
    ['Commute · material escalation', 'Send · escalation', 'Use the A/C from W 4 St.'],
  ] as const) {
    await chooseScenario(page, scenario);
    const receipt = page.getByRole('region', { name: 'Notification materiality receipt' });
    await expect(receipt).toContainText(outcome);
    await expect(receipt).toContainText(reason);
    await expect(page.getByText('Delivery remains locked; no notification was sent.', { exact: true })).toBeVisible();
  }
  await expectNoCrowding(page);
});

test('keeps production commute disabled with zero subscribe, evaluate, or deliver requests', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'NYC Subway Train Time Tracker' })).toBeVisible();
  const permissionBefore = await page.evaluate(() => Notification.permission);
  const cleared = await request.post(`${FIXTURE_ORIGIN}/__test/requests/clear`);
  expect(cleared.ok()).toBe(true);
  await page.getByRole('button', { name: 'Commute', exact: true }).click();
  await expect(page.getByText('No complete commute window is saved yet. Add a destination, ride direction, and time window in Saved.', { exact: true })).toBeVisible();
  await page.waitForTimeout(250);

  const requests = await request.get(`${FIXTURE_ORIGIN}/__test/requests`);
  const body = await requests.json() as { requests: readonly string[] };
  expect(body.requests.filter((entry) => /subscription|commute|notification|deliver|evaluate/i.test(entry))).toEqual([]);
  expect(await page.evaluate(() => Notification.permission)).toBe(permissionBefore);
  expect(await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return (await registration.pushManager.getSubscription()) === null;
  })).toBe(true);
  await expect(page.getByRole('region', { name: 'Notification materiality receipt' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Locked commute monitor receipt' })).toHaveCount(0);
});
