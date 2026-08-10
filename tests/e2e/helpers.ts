import { expect, type Locator, type Page } from '@playwright/test';

export const FIXTURE_ORIGIN = 'http://127.0.0.1:4173';

export async function openValidationDeck(page: Page): Promise<void> {
  await page.goto('/__validation/');
  await expect(page.getByRole('heading', { name: 'Subway rider validation deck' })).toBeVisible();
  await expect(page.getByText('Demonstration data — not live', { exact: true }).first()).toBeVisible();
}

export async function chooseScenario(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('region', { name: `Scenario: ${name}` })).toBeVisible();
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }))).toEqual({ document: 0, body: 0 });
}

export async function expectNoCrowding(page: Page, scope?: Locator): Promise<void> {
  const root = scope ?? page.locator('body');
  const serialized = await root.evaluate((element) => {
    const values: string[] = [];
    const visit = (node: Element): void => {
      values.push(node.tagName, node.textContent ?? '');
      for (const attribute of [...node.attributes]) values.push(attribute.name, attribute.value);
      if (node.shadowRoot) {
        for (const child of [...node.shadowRoot.children]) visit(child);
      }
      for (const child of [...node.children]) visit(child);
    };
    visit(element);
    return values.join(' ');
  });
  expect(serialized).not.toMatch(/crowding|occupancy|standing room|car.?load|load factor|seats available/i);
  await expect(root.locator('[data-crowding], [aria-label*="crowd" i]')).toHaveCount(0);
}
