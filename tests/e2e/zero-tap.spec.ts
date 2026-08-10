import { expect, test } from '@playwright/test';

import { chooseScenario, expectNoCrowding, openValidationDeck } from './helpers';

test.beforeEach(async ({ page }) => openValidationDeck(page));

test('shows three practical-walk station cards and both directions without search after location allow', async ({ page }) => {
  await chooseScenario(page, 'Location allowed · practical walk ranking');

  await expect(page.getByText('Use your location to show nearby subway entrances and live arrivals.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  const first = page.getByTestId('nearby-station-card').first();
  await expect(first.getByRole('region', { name: 'Uptown / Northbound nearby service' })).toBeVisible();
  await expect(first.getByRole('region', { name: 'Downtown / Southbound nearby service' })).toBeVisible();
  await expect(first.getByText(/walk to this service/).first()).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expectNoCrowding(page);
});

test('uses denial precedence: last-used station, then explicit saved choices, then closed-keyboard picker', async ({ page }) => {
  await chooseScenario(page, 'Location denied · last used station');
  await expect(page.getByText('Location unavailable. Showing your last station.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '125 St', level: 2 })).toBeVisible();

  await chooseScenario(page, 'Location denied · saved choices');
  await expect(page.getByRole('heading', { name: 'Saved stations' })).toBeVisible();
  await expect(page.getByRole('button', { name: '125 St saved station' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '125 St', level: 2 })).toHaveCount(0);

  await chooseScenario(page, 'Location denied · station picker');
  await expect(page.getByRole('heading', { name: 'Choose a station' })).toBeVisible();
  await expect(page.getByText('Location is optional. Pick a station without typing.', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
});

test('opens the practical-walk picker instead of inventing a nearby ranking', async ({ page }) => {
  await chooseScenario(page, 'Location allowed · walk evidence unavailable');
  await expect(page.getByText('Comparable walking information is unavailable, so no station was ranked automatically.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Choose a station' })).toBeVisible();
});
