import { expect, test } from '@playwright/test';

import { chooseScenario, expectNoCrowding, FIXTURE_ORIGIN, openValidationDeck } from './helpers';

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__test/reset`);
  expect(response.ok()).toBe(true);
});

test('uses real browser permission allow, then a cleared-permission denial with last-used precedence', async ({ context, page }) => {
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'NYC Subway Train Time Tracker' })).toBeVisible();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  const first = page.getByTestId('nearby-station-card').first();
  await expect(first.getByRole('region', { name: 'Uptown / Northbound nearby service' })).toBeVisible();
  await expect(first.getByRole('region', { name: 'Downtown / Southbound nearby service' })).toBeVisible();
  await expect(first.getByText(/walk to this service/).first()).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);

  await first.getByRole('button', { name: /Open Uptown \/ Northbound board/ }).click();
  await expect(page.getByRole('heading', { name: /St/, level: 2 })).toBeVisible();
  await context.clearPermissions();
  await page.reload();
  await expect(page.getByText('Location unavailable. Showing your last station.', { exact: true })).toBeVisible();
  await expectNoCrowding(page);
});

test('moves from the real denied last-used station to an explicit saved choice without opening the keyboard', async ({ context, page }) => {
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.goto('/');
  const first = page.getByTestId('nearby-station-card').first();
  await first.getByRole('button', { name: /Open Uptown \/ Northbound board/ }).click();
  await page.getByRole('button', { name: 'Save this station' }).click();

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Nearby', exact: true }).click();
  await page.getByRole('toolbar', { name: 'Nearby controls' }).getByRole('button', { name: 'Choose a station' }).click();
  await page.getByRole('button', { name: 'Canal St', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Canal St', exact: true, level: 2 })).toBeVisible();

  await context.clearPermissions();
  await page.reload();
  await expect(page.getByText('Location unavailable. Showing your last station.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Canal St', exact: true, level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Show saved stations' }).click();
  await expect(page.getByRole('heading', { name: 'Saved stations', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '125 St saved station' })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
});

test('shows three practical-walk station cards and both directions without search in the bounded validation composition', async ({ page }) => {
  await openValidationDeck(page);
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
  await openValidationDeck(page);
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
  await openValidationDeck(page);
  await chooseScenario(page, 'Location allowed · walk evidence unavailable');
  await expect(page.getByText('Comparable walking information is unavailable, so no station was ranked automatically.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Choose a station' })).toBeVisible();
});

test('uses the real App denial path to expose a closed-keyboard picker when nothing is stored', async ({ context, page }) => {
  await context.clearPermissions();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Choose a station' })).toBeVisible();
  await expect(page.getByText('Location is optional. Pick a station without typing.', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '125 St', exact: true })).toBeVisible();
});

test('uses real walk-unavailable API evidence and never invents a root-app ranking', async ({ context, page, request }) => {
  const configured = await request.post(`${FIXTURE_ORIGIN}/__test/state`, { data: { walkTransport: 'unavailable' } });
  expect(configured.ok()).toBe(true);
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.goto('/');
  await expect(page.getByText('Comparable walking information is unavailable, so no station was ranked automatically.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Choose a station' })).toBeVisible();
});

test('does not let delayed location ownership replace an explicit station choice', async ({ context, page, request }) => {
  const configured = await request.post(`${FIXTURE_ORIGIN}/__test/state`, { data: { walkDelayMs: 1_200 } });
  expect(configured.ok()).toBe(true);
  await context.grantPermissions(['geolocation'], { origin: FIXTURE_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.goto('/');
  const controls = page.getByRole('toolbar', { name: 'Nearby controls' });
  await controls.getByRole('button', { name: 'Choose a station' }).click();
  await page.getByRole('button', { name: 'Canal St', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Canal St', exact: true, level: 2 })).toBeVisible();
  await page.waitForTimeout(1_400);
  await expect(page.getByRole('heading', { name: 'Canal St', exact: true, level: 2 })).toBeVisible();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(0);
});
