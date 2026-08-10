import { expect, test } from '@playwright/test';

import { chooseScenario, expectNoHorizontalOverflow, openValidationDeck } from './helpers';

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

test('supports keyboard-only navigation with visible focus', async ({ page }) => {
  await openValidationDeck(page);
  await chooseScenario(page, 'Location allowed · practical walk ranking');
  await page.locator('body').press('Tab');
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('BUTTON');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe('none');
});

test('respects reduced motion and remains readable at a desktop viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await openValidationDeck(page);
  await chooseScenario(page, 'Board · live overlap and holding');
  await expectNoHorizontalOverflow(page);
  await expect(page.getByText('Live and expected arrivals', { exact: true })).toBeVisible();
  const animation = await page.locator('.station-card').first().evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(animation)).toBeLessThanOrEqual(0.01);
});
