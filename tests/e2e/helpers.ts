import { expect, type Locator, type Page } from '@playwright/test';

export const FIXTURE_ORIGIN = 'http://127.0.0.1:4173';

const CROWDING_UI = /crowding|car(?:riage)?[\s_-]*(?:occupancy|capacity|load|diagram)|standing room|seats? (?:available|likely)|room to stand|very crowded|load factor|passenger (?:load|count)|consist length/i;
const CROWDING_SCHEMA = /crowdingState|occupancyStatus|carOccupancy|carCapacity|carLoad|loadFactor|passengerLoad|passengerCount|seatsAvailable|standingRoom|consistLength|carCount/i;
const CROWDING_SCHEMA_KEY = /(?:^|["'{,\s])(?:crowding(?:[_-]?state)?|occupancy(?:[_-]?(?:status|level))?|capacity|car(?:riage)?[_-]?(?:occupancy|capacity|load)|load[_-]?factor|passenger[_-]?(?:load|count)|seats?[_-]?available|standing[_-]?room|consist[_-]?length|car[_-]?count)\s*["']?\s*:/i;
const CROWDING_PLACEHOLDER = /(?:crowd(?:ing)?|occupancy|car[\s_-]*(?:capacity|load)).{0,60}(?:module|badge|legend|placeholder|unavailable|unknown|coming soon)|(?:module|badge|legend|placeholder|unavailable|unknown|coming soon).{0,60}(?:crowd(?:ing)?|occupancy|car[\s_-]*(?:capacity|load))/i;
const CROWDING_PROXY = /(?:headway gaps?|bunching|station density|platform density|rider reports?|engagement|schedules?|service conditions?).{0,60}(?:crowd(?:ing)?|occupancy|car[\s_-]*(?:capacity|load))|(?:crowd(?:ing)?|occupancy|car[\s_-]*(?:capacity|load)).{0,60}(?:headway gaps?|bunching|station density|platform density|rider reports?|engagement|schedules?|service conditions?)/i;
const CROWDING_SHELL = /(?:train|subway)[_ -]?cars?\b|\bcarriages?\b|unknown[_ -]?cars?\b|data-(?:train-car|car-index|carriage)/i;
const EMBEDDED_IMAGE_PAYLOAD = /data:image\/|blob:|https?:\/\/[^\s"')]+\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#][^\s"')]*)?|<svg\b/i;
const PROTECTED_BRAND_ASSET = /(?:\bmta\b|metropolitan transportation authority).{0,48}(?:logo|wordmark|roundel|brand mark)|(?:logo|wordmark|roundel|brand mark).{0,48}(?:\bmta\b|metropolitan transportation authority)/i;

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
      const outsideViewport = rect.left < -tolerance || rect.right > viewportWidth + tolerance;
      const governedScroller = element.dataset.horizontalOverflow === 'bounded'
        && (style.overflowX === 'auto' || style.overflowX === 'scroll');
      const internallyClipped = !governedScroller && element.scrollWidth > element.clientWidth + tolerance;
      if (outsideViewport || internallyClipped) {
        const identity = [element.tagName.toLowerCase(), element.id && `#${element.id}`, ...[...element.classList].map((name) => `.${name}`)]
          .filter(Boolean)
          .join('');
        const accessibleHint = element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? '';
        violations.push(`${identity} [${accessibleHint}]: rect=${rect.left.toFixed(1)}..${rect.right.toFixed(1)} client=${element.clientWidth} scroll=${element.scrollWidth} overflow=${style.overflowX}`);
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
  expectNoCrowdingInEvidence([serialized, await root.ariaSnapshot()]);
  await expect(root.locator([
    '[data-crowding]', '[data-occupancy]', '[data-car-load]', '[data-capacity]',
    '[data-train-car]', '[data-car-index]', '[data-carriage]', '.train-car', '.carriage',
    '[class*="crowd" i]', '[class*="occupancy" i]', '[id*="crowd" i]', '[id*="occupancy" i]',
    '[aria-label*="crowd" i]', '[aria-label*="occupancy" i]', '[aria-label*="train car" i]', '[aria-label*="carriage" i]',
  ].join(', '))).toHaveCount(0);
}

export function expectNoCrowdingInEvidence(evidence: readonly unknown[]): void {
  const serialized = JSON.stringify(evidence);
  expect(serialized).not.toMatch(CROWDING_UI);
  expect(serialized).not.toMatch(CROWDING_SCHEMA);
  expect(serialized).not.toMatch(CROWDING_SCHEMA_KEY);
  expect(serialized).not.toMatch(CROWDING_PLACEHOLDER);
  expect(serialized).not.toMatch(CROWDING_PROXY);
  expect(serialized).not.toMatch(CROWDING_SHELL);
}

export function expectNoEmbeddedProtectedAssetInEvidence(evidence: readonly unknown[]): void {
  const serialized = JSON.stringify(evidence);
  expect(serialized).not.toMatch(EMBEDDED_IMAGE_PAYLOAD);
  expect(serialized).not.toMatch(PROTECTED_BRAND_ASSET);
}

export interface BrowserRetainedEvidence {
  readonly local: Readonly<Record<string, string | null>>;
  readonly session: Readonly<Record<string, string | null>>;
  readonly cached: readonly {
    readonly cacheName: string;
    readonly request: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
  }[];
  readonly serviceWorkers: readonly { readonly scriptURL: string; readonly body: string }[];
  readonly indexedDatabases: readonly string[];
  readonly cookies: readonly { readonly name: string; readonly value: string; readonly domain: string; readonly path: string }[];
  readonly resourceUrls: readonly string[];
}

export async function expectNoCrowdingOrPersonalCoordinatesAnywhere(
  page: Page,
  apiPayloads: readonly unknown[],
  personalCoordinates: readonly string[],
  additionalEvidence: readonly unknown[] = [],
): Promise<BrowserRetainedEvidence> {
  await expectNoCrowding(page);
  const browserHeld = await page.evaluate(async () => {
    const local = Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]));
    const session = Object.fromEntries(Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)]));
    const cached: Array<{ cacheName: string; request: string; headers: Record<string, string>; body: string }> = [];
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        cached.push({
          cacheName,
          request: request.url,
          headers: response ? Object.fromEntries(response.headers.entries()) : {},
          body: response ? await response.clone().text() : '',
        });
      }
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    const serviceWorkers = await Promise.all(registrations.map(async ({ active, installing, waiting }) => {
      const scriptURL = active?.scriptURL ?? installing?.scriptURL ?? waiting?.scriptURL ?? '';
      return { scriptURL, body: scriptURL ? await fetch(scriptURL).then((response) => response.text()) : '' };
    }));
    const indexedDatabases = typeof indexedDB.databases === 'function'
      ? (await indexedDB.databases()).flatMap(({ name }) => name ? [name] : [])
      : [];
    const resourceUrls = performance.getEntriesByType('resource').map(({ name }) => name);
    return { local, session, cached, serviceWorkers, indexedDatabases, resourceUrls };
  });
  const cookies = (await page.context().cookies()).map(({ name, value, domain, path }) => ({ name, value, domain, path }));
  const deviceHeld: BrowserRetainedEvidence = { ...browserHeld, cookies };
  const retained = { apiPayloads, deviceHeld, additionalEvidence };
  expectNoCrowdingInEvidence([retained]);
  const serialized = JSON.stringify(retained);
  for (const coordinate of coordinateLeakTokens(personalCoordinates)) expect(serialized).not.toContain(coordinate);
  return deviceHeld;
}

function coordinateLeakTokens(values: readonly string[]): readonly string[] {
  const tokens = new Set<string>();
  for (const value of values) {
    const coordinate = Number(value);
    if (!Number.isFinite(coordinate)) continue;
    for (let digits = 4; digits <= 7; digits += 1) {
      tokens.add(coordinate.toFixed(digits));
      const scale = 10 ** digits;
      tokens.add((Math.trunc(coordinate * scale) / scale).toFixed(digits));
    }
  }
  return [...tokens];
}
