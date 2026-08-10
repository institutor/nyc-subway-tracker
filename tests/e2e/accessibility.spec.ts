import { expect, test } from '@playwright/test';

import { chooseScenario, expectNoCrowding, FIXTURE_ORIGIN, openValidationDeck } from './helpers';

test.beforeEach(async ({ page }) => openValidationDeck(page));

test('keeps the production registry empty while presenting a genuine synthetic validation path only in the labeled deck', async ({ page }) => {
  await chooseScenario(page, 'Accessibility · synthetic verified path');
  await expect(page.getByText('Complete path verified', { exact: true })).toBeVisible();
  await expect(page.getByText('Demonstration data — not live', { exact: true }).first()).toBeVisible();

  await chooseScenario(page, 'Accessibility · empty live registry');
  await expect(page.getByText('Current path not verified', { exact: true })).toBeVisible();
  await expect(page.getByText('Complete path verified', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/No official outage reported/)).toHaveCount(0);
});

test('distinguishes the last accessible decision point from an immediate warning', async ({ page }) => {
  await chooseScenario(page, 'Accessibility · last decision point');
  const known = page.getByRole('alert');
  await expect(known).toBeVisible();
  await expect(known).toContainText('Act before transfer-west, the last verified accessible decision point.');

  await chooseScenario(page, 'Accessibility · immediate warning');
  const immediate = page.getByRole('alert');
  await expect(immediate).toContainText('Warn now—the last accessible decision point is not confirmed.');
  await expect(immediate).toContainText('Official status: EL-1 is out of service.');
});

test('never auto-selects a verified alternative and clears only through the explicit rider action', async ({ page }) => {
  await chooseScenario(page, 'Accessibility · verified alternative');
  await expect(page.getByText('Accessible Route Only · On', { exact: true })).toBeVisible();
  await expect(page.getByText('Displayed path · selected', { exact: true })).toBeVisible();
  await expect(page.getByText('Alternative selected', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Use the verified same-complex path.' }).click();
  await expect(page.getByText('Alternative selected', { exact: true })).toBeVisible();
  await expect(page.getByText('Displayed path · alt', { exact: true })).toBeVisible();
  await expect(page.getByText('Accessible Route Only · On', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expectNoCrowding(page);
});

test('keeps the public accessibility registry fail-closed with no positive path claim', async ({ context, page }) => {
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.goto('/');
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  await page.getByTestId('nearby-station-card').first().getByRole('button', { name: /Open Uptown \/ Northbound board/ }).click();
  await expect(page.getByText('Complete path verified', { exact: true })).toHaveCount(0);
  await expect(page.getByText('No official outage reported', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Step-free path' })).toHaveCount(0);

  const board = await page.request.get(`${FIXTURE_ORIGIN}/api/v1/stations/A12/board`);
  expect(board.ok()).toBe(true);
  const body = await board.json() as { data?: { capabilities?: { accessibility?: string } } };
  expect(body.data?.capabilities?.accessibility).toBe('locked');
  expect(JSON.stringify(body)).not.toMatch(/complete path verified|no official outage reported/i);
});
