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
  await expect.poll(() => page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const tolerance = 1;
    const violations: string[] = [];
    for (const element of [...document.querySelectorAll<HTMLElement>('body *')]) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const visible = style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') > 0
        && rect.width > 0
        && rect.height > 0;
      if (!visible) continue;
      const intentionalScroller = style.overflowX === 'auto' || style.overflowX === 'scroll';
      const outsideViewport = rect.left < -tolerance || rect.right > viewportWidth + tolerance;
      const internallyClipped = !intentionalScroller && element.scrollWidth > element.clientWidth + tolerance;
      if (outsideViewport || internallyClipped) {
        const identity = [element.tagName.toLowerCase(), element.id && `#${element.id}`, ...[...element.classList].map((name) => `.${name}`)]
          .filter(Boolean)
          .join('');
        violations.push(`${identity}: rect=${rect.left.toFixed(1)}..${rect.right.toFixed(1)} client=${element.clientWidth} scroll=${element.scrollWidth} overflow=${style.overflowX}`);
      }
    }
    if (document.documentElement.scrollWidth > viewportWidth + tolerance) {
      violations.unshift(`html: client=${viewportWidth} scroll=${document.documentElement.scrollWidth}`);
    }
    if (document.body.scrollWidth > viewportWidth + tolerance) {
      violations.unshift(`body: client=${viewportWidth} scroll=${document.body.scrollWidth}`);
    }
    return violations.slice(0, 20);
  })).toEqual([]);
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
