import { expect, test, type Page } from '@playwright/test';

const PRODUCTION_VALIDATION_ORIGIN = 'http://127.0.0.1:4174';

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['geolocation'], { origin: PRODUCTION_VALIDATION_ORIGIN });
  await context.setGeolocation({ latitude: 40.811, longitude: -73.952, accuracy: 18 });
  await page.goto(PRODUCTION_VALIDATION_ORIGIN);
  await expect(page.getByRole('main', { name: 'NYC Subway Train Time Tracker' })).toBeVisible();
});

test('the documented validation startup makes the ordinary app useful without fixture routes', async ({ page }) => {
  await expect(page.getByText('Demonstration data — not live').first()).toBeVisible();
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  await expect(page.getByTestId('nearby-station-card').first()).toContainText('125 St');
  await expect(page.getByTestId('nearby-station-card').first().getByText('Demonstration data — not live').first()).toBeVisible();

  await chooseStation(page, '125 St');
  await expect(page.getByRole('heading', { name: '125 St', exact: true, level: 2 })).toBeVisible();
  await expect(page.getByText('Inwood–207 St').first()).toBeVisible();
  await expect(page.getByText('A trains are running with delays.')).toBeVisible();

  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.getByTestId('vector-network-map').locator('[data-map-feature]')).toHaveCount(4);
  await chooseDestination(page, 'Canal');
  await page.getByRole('button', { name: 'Plan current trip' }).click();
  await expect(page.getByRole('article', { name: 'Primary direct itinerary' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Alternative transfer itinerary' })).toBeVisible();
  await expect(page.getByText('Demonstration data — not live').last()).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/__test|validation deck|fixture route/i);
});

test('the ordinary app carries Accessible Route Only through planning, active trip, and offline use', async ({ context, page }) => {
  const constrainedNearby = page.waitForRequest((request) => request.url().endsWith('/api/v1/nearby')
    && request.postDataJSON().accessibleRouteOnly === true);
  await page.getByRole('checkbox', { name: 'Accessible Route Only' }).check();
  await constrainedNearby;
  await expect(page.getByTestId('nearby-station-card')).toHaveCount(3);
  await chooseStation(page, '125 St');
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Accessible Route Only' })).toBeChecked();
  await chooseDestination(page, 'Canal');
  await page.getByRole('button', { name: 'Plan current trip' }).click();

  const itinerary = page.getByRole('article', { name: 'Primary direct itinerary' });
  const transfer = page.getByRole('article', { name: 'Alternative transfer itinerary' });
  await expect(itinerary).toContainText('125 St to Canal St · Southbound');
  await expect(itinerary.getByText('Complete path verified', { exact: true })).toBeVisible();
  await expect(itinerary.getByText(/No official outage reported/)).toBeVisible();
  await expect(itinerary.getByRole('region', { name: 'Platform guidance' })).toContainText('Canal St');
  await expect(itinerary.getByRole('region', { name: 'Platform guidance' })).toContainText('middle');
  await expect(transfer.getByText('Complete path verified', { exact: true })).toHaveCount(0);
  await expect(transfer.getByText(/No official outage reported/)).toHaveCount(0);
  await expect(transfer.getByRole('region', { name: 'Platform guidance' })).toHaveCount(0);
  await expect(transfer.getByRole('button', { name: 'Use this trip' })).toHaveCount(0);
  await itinerary.getByRole('button', { name: 'Use this trip' }).click();

  const active = page.getByRole('region', { name: 'Device-held active trip' });
  await expect(active.getByRole('heading', { name: '125 St to Canal St' })).toBeVisible();
  await expect(active.getByText('Accessible Route Only · On', { exact: true })).toBeVisible();
  await expect(active.getByRole('region', { name: 'Platform guidance' })).toContainText('Canal St');
  await expect(active.getByRole('heading', { name: 'Exit guidance' })).toBeVisible();
  await expect(active.getByRole('heading', { name: 'Exit guidance' }).locator('..')).toContainText('A34S');
  await expect(active.getByRole('heading', { name: 'Exit guidance' }).locator('..')).toContainText('EL-A34-01');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Open active trip to Canal St' }).click();
  await expect(page.getByRole('region', { name: 'Device-held active trip' })
    .getByText('Accessible Route Only · On', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  const offlineTrip = page.getByRole('region', { name: 'Device-held active trip' });
  await expect(offlineTrip.getByText('Accessible Route Only · On', { exact: true })).toBeVisible();
  await expect(offlineTrip.getByRole('alert')).toContainText('Current elevator status cannot be verified offline');
  await expect(offlineTrip.locator('article').filter({ hasText: 'EL-A34-01' })).toContainText('Unknown offline');
  await expect(offlineTrip.getByRole('heading', { name: 'Exit guidance' })).toBeVisible();
  await expect(offlineTrip.getByText(/No official outage reported/)).toHaveCount(0);
});

async function chooseStation(page: Page, name: string): Promise<void> {
  await page.getByRole('toolbar', { name: 'Nearby controls' }).getByRole('button', { name: 'Choose a station' }).click();
  await page.getByRole('button', { name, exact: true }).click();
}

async function chooseDestination(page: Page, query: string): Promise<void> {
  await page.getByRole('combobox', { name: 'Destination station' }).fill(query);
  await page.getByRole('option', { name: /Canal St/ }).click();
}
