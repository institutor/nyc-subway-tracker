import { expect, test } from '@playwright/test';

import { chooseScenario, expectNoCrowding, openValidationDeck } from './helpers';

test.beforeEach(async ({ page }) => openValidationDeck(page));

test('keeps commute evaluation and delivery locked on the public-capability surface', async ({ page }) => {
  await chooseScenario(page, 'Commute · locked');
  await expect(page.getByRole('heading', { name: 'Commute' })).toBeVisible();
  await expect(page.getByText('Commute alerts remain locked until their safety stage is enabled.', { exact: true })).toBeVisible();
  await expect(page.getByText('Delivery remains locked; no notification was sent.', { exact: true })).toBeVisible();
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
