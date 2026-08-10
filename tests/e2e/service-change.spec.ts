import { expect, test } from '@playwright/test';

import { chooseScenario, expectNoCrowding, openValidationDeck } from './helpers';

test.beforeEach(async ({ page }) => openValidationDeck(page));

test('keeps the narrow Live-overlap promotion, Expected range, and Holding row visibly separate', async ({ page }) => {
  await chooseScenario(page, 'Board · live overlap and holding');
  const primary = page.getByTestId('primary-arrival');
  await expect(primary).toHaveCount(3);
  await expect(primary.nth(0).getByText('Expected', { exact: true })).toBeVisible();
  await expect(primary.nth(0)).toContainText('2 min');
  await expect(primary.nth(1).getByText('Live', { exact: true })).toBeVisible();
  await expect(primary.nth(2).getByText('Expected', { exact: true })).toBeVisible();
  await expect(primary.nth(2)).toContainText('2–4 min');
  await expect(page.getByRole('region', { name: 'Additional train context' })).toContainText('Position not advancing');
  await expect(page.getByText('Holding is status only.', { exact: false })).toBeVisible();
});

test('shows Scheduled clock times only in separated fallback mode', async ({ page }) => {
  await chooseScenario(page, 'Board · scheduled fallback');
  await expect(page.getByText('Schedule fallback', { exact: true })).toBeVisible();
  await expect(page.getByText('Scheduled', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Source unavailable', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Live', { exact: true })).toHaveCount(0);
});

test('removes exact precision on first healthy absence without creating a substitute', async ({ page }) => {
  await chooseScenario(page, 'Board · first healthy absence');
  const row = page.getByTestId('primary-arrival');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('F');
  await expect(row.getByText('Live', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apply first healthy absence' }).click();
  await expect(page.getByText('First healthy absence: exact precision removed; no replacement shown.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('primary-arrival')).toHaveCount(0);
  await expect(page.getByText(/Live|Expected|Scheduled/, { exact: true })).toHaveCount(0);
});

test('vetoes a bypassed train, preserves an unaffected sibling, and recovers only after two coherent updates', async ({ page }) => {
  await chooseScenario(page, 'Board · bypass veto');
  await expect(page.getByText('F trains are bypassing 14 St on the express track.', { exact: true })).toBeVisible();
  const rows = page.getByTestId('primary-arrival');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('E');
  await expect(rows.first()).not.toContainText('F');

  await chooseScenario(page, 'Board · unresolved service change');
  await expect(page.getByText('Service change—arrival unavailable until the stopping pattern is confirmed.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('primary-arrival')).toHaveCount(1);
  await expect(page.getByTestId('primary-arrival')).toContainText('E');

  await chooseScenario(page, 'Board · two-update recovery');
  await expect(page.getByText('Bypass veto active', { exact: true })).toBeVisible();
  await expect(page.getByTestId('primary-arrival')).toHaveCount(1);
  await expect(page.getByTestId('primary-arrival')).toContainText('E');
  await page.getByRole('button', { name: 'Accept next coherent update' }).click();
  await expect(page.getByText('One clean update · F still withheld', { exact: true })).toBeVisible();
  await expect(page.getByTestId('primary-arrival')).toHaveCount(1);
  await expect(page.getByTestId('primary-arrival')).not.toContainText('F');
  await page.getByRole('button', { name: 'Accept next coherent update' }).click();
  await expect(page.getByText('Two coherent recovery updates', { exact: true })).toBeVisible();
  await expect(page.getByTestId('primary-arrival')).toHaveCount(2);
  await expect(page.getByTestId('primary-arrival').filter({ hasText: 'F' }).getByText('Live', { exact: true })).toBeVisible();
  await expectNoCrowding(page);
});
