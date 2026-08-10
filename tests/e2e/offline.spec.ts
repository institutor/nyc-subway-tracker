import { expect, test, type Page } from '@playwright/test';

import { chooseScenario, expectNoCrowding, FIXTURE_ORIGIN, openValidationDeck } from './helpers';

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__test/reset`);
  expect(response.ok()).toBe(true);
});

test('saves a station, plans a map route, activates one trip, and supports forward/back completion', async ({ page }) => {
  await openProductionApp(page);
  await chooseStation(page, '125 St');
  await page.getByRole('button', { name: 'Save this station' }).click();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: '125 St' })).toBeVisible();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('combobox', { name: 'Destination station' }).fill('Canal');
  await page.getByRole('option', { name: /Canal St/ }).click();
  await page.getByRole('button', { name: 'Plan current trip' }).click();
  await page.getByRole('button', { name: 'Use this trip' }).first().click();
  await expect(page.getByRole('heading', { name: '125 St to Canal St' })).toBeVisible();

  const destination = page.getByRole('button', { name: "I'm at this stop: Canal St" });
  await destination.click();
  await expect(page.getByText('Trip complete — rider confirmed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: "I'm at this stop: 125 St" }).click();
  await expect(page.getByText('Trip complete — rider confirmed', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await page.getByRole('button', { name: 'Edit saved station 125 St' }).click();
  await page.getByRole('checkbox', { name: 'Accessible Route Only' }).check();
  await page.getByRole('button', { name: 'Save changes for 125 St' }).click();
  await expect(page.getByText('On', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause personalization for 125 St' }).click();
  await expect(page.getByText('Paused', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Reset station preferences for 125 St' }).click();
  await expect(page.getByText('All station routes', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete saved station 125 St' }).click();
  await expect(page.getByText('No saved stations yet. Open a station board to save exact rider intent.', { exact: true })).toBeVisible();
  await expectNoCrowding(page);
});

test('keeps the active trip and map references navigable after an offline reload without claiming current truth', async ({ context, page }) => {
  await openProductionApp(page);
  await chooseStation(page, '125 St');
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('combobox', { name: 'Destination station' }).fill('Canal');
  await page.getByRole('option', { name: /Canal St/ }).click();
  await page.getByRole('button', { name: 'Plan current trip' }).click();
  await page.getByRole('button', { name: 'Use this trip' }).first().click();
  await expect(page.getByRole('heading', { name: '125 St to Canal St' })).toBeVisible();
  await page.getByRole('button', { name: "I'm at this stop: Canal St" }).click();
  await expect(page.getByText('Trip complete — rider confirmed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Typical weekday', exact: true }).click();
  await expect(page.getByText('Unofficial app-owned subway reference geometry', { exact: true })).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Offline—live arrivals, alerts, and elevator status are unavailable.', { exact: true })).toBeVisible();
  const trip = page.getByRole('region', { name: 'Device-held active trip' });
  await expect(trip.getByRole('heading', { name: '125 St to Canal St' })).toBeVisible();
  await expect(trip.getByText(/^Captured /)).toBeVisible();
  await expect(trip.getByText('Current itinerary', { exact: true })).toBeVisible();
  await expect(trip.getByText('Actual now at capture', { exact: true })).toBeVisible();
  await expect(trip.getByText(/^Last checked /)).toBeVisible();
  await expect(trip.getByText('Historical — not current', { exact: true })).toBeVisible();
  await expect(trip.getByTestId('trip-point-point-1-2')).toContainText('Current');
  await trip.getByRole('button', { name: "I'm at this stop: 125 St" }).click();
  await expect(trip.getByTestId('trip-point-point-1-1')).toContainText('Current');
  await expect(trip.getByText('Trip complete — rider confirmed', { exact: true })).toHaveCount(0);
  await trip.getByRole('button', { name: "I'm at this stop: Canal St" }).click();
  await expect(trip.getByText('Trip complete — rider confirmed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('button', { name: 'Typical weekday', exact: true }).click();
  await expect(page.getByText('Reference pattern—not live.', { exact: true })).toBeVisible();
  await expect(page.getByText('Actual now', { exact: true }).first()).toBeDisabled();
});

test('presents the exact five owner stages and stage 1–4 invalidations before lower-priority content', async ({ page }) => {
  await openValidationDeck(page);
  await chooseScenario(page, 'Reconnect · stage 1 path invalidation');
  await expectStageOrder(page);
  await expectServerTransitionOrder(page, 'Reconnect · stage 1 path invalidation');
  await expect(page.getByRole('alert').first()).toContainText('required accessible path');
  await expect(page.getByText('Equipment Unknown', { exact: true })).toBeVisible();
  await expectWarningBeforeContext(page);

  for (const [scenario, fragment] of [
    ['Reconnect · stage 2 service invalidation', 'service pattern'],
    ['Reconnect · stage 3 train invalidation', 'stored train choice'],
    ['Reconnect · stage 4 required guidance invalidation', 'Required positioning or transfer guidance'],
  ] as const) {
    await chooseScenario(page, scenario);
    await expectStageOrder(page);
    await expectServerTransitionOrder(page, scenario);
    await expect(page.getByRole('alert').first()).toContainText(fragment);
    await expectWarningBeforeContext(page);
  }

  await chooseScenario(page, 'Reconnect · stage 2 service invalidation');
  await expect(page.getByText('Affected transfer transfer-7', { exact: true })).toBeVisible();
  await chooseScenario(page, 'Reconnect · stage 3 train invalidation');
  await expect(page.getByText('One fresh snapshot observed · arrivals remain withheld', { exact: true })).toBeVisible();

  await chooseScenario(page, 'Reconnect · optional guidance removed');
  await expectStageOrder(page);
  await expectServerTransitionOrder(page, 'Reconnect · optional guidance removed');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('Optional guidance removed; trip remains valid.', { exact: true })).toBeVisible();
  await expect(page.getByText('Cursor A12 · filters A', { exact: true })).toBeVisible();
  await expect(page.getByText('Map actual · night · viewport-7', { exact: true })).toBeVisible();
  await expect(page.getByText('Surface map · focus map-point-a12 · reading point-a12', { exact: true })).toBeVisible();
});

test('runs every adverse and optional owner branch inside the real App without losing rider context', async ({ page, request }) => {
  await openValidationDeck(page);
  for (const branch of [
    {
      scenario: 'Reconnect · app stage 1 path invalidation',
      warning: /required accessible path could not be reverified/u,
      receipt: 'Equipment Unknown',
      accessible: true,
    },
    {
      scenario: 'Reconnect · app stage 2 service and transfer invalidation',
      warning: /Service changes could not be resolved for the stored trip/u,
      receipt: 'Affected transfer transfer-1',
      accessible: false,
    },
    {
      scenario: 'Reconnect · app stage 3 one-snapshot withholding',
      warning: /stored train choice has only one coherent fresh snapshot/u,
      receipt: 'One coherent fresh snapshot · arrivals remain withheld',
      accessible: false,
    },
    {
      scenario: 'Reconnect · app stage 4 required guidance invalidation',
      warning: /Required positioning or transfer guidance could not be reverified/u,
      receipt: 'Required guidance removed',
      accessible: false,
    },
  ] as const) {
    await chooseScenario(page, branch.scenario);
    const scenario = await prepareAppRecovery(page, branch.scenario);
    await expectServerTransitionOrder(page, branch.scenario);
    const warning = scenario.getByText(branch.warning).first();
    await expect(warning).toBeVisible();
    await expect(scenario.getByText(branch.receipt, { exact: true })).toBeVisible();
    await expectPreservedAppContext(scenario, branch.accessible);
    await expectWarningBeforeTripAndMap(warning, scenario);
  }

  const optionalName = 'Reconnect · app optional guidance removed' as const;
  await chooseScenario(page, optionalName);
  const optional = await prepareAppRecovery(page, optionalName);
  await expectServerTransitionOrder(page, optionalName);
  await expect(optional.getByText('Optional guidance removed; trip remains valid.', { exact: true })).toBeVisible();
  await expect(optional.getByText(/Required positioning or transfer guidance could not be reverified/u)).toHaveCount(0);
  await expectPreservedAppContext(optional, false);

  const positiveName = 'Reconnect · app stage 3 two-snapshot recovery' as const;
  await chooseScenario(page, positiveName);
  const positive = await prepareAppRecovery(page, positiveName);
  await expectServerTransitionOrder(page, positiveName);
  await expect(positive.getByText('Two coherent fresh snapshots · stored train readmitted', { exact: true })).toBeVisible();
  await expect(positive.getByText(/stored train choice has only one coherent fresh snapshot/u)).toHaveCount(0);
  await expectPreservedAppContext(positive, false);

  const requests = await request.get(`${FIXTURE_ORIGIN}/__test/requests`);
  const log = await requests.json() as { requests: readonly string[] };
  expect(log.requests.filter((entry) => /GET \/api\/v1\/stations\/A12\/board/u.test(entry)).length).toBeGreaterThanOrEqual(2);
});

async function prepareAppRecovery(page: Page, name: string) {
  const scenario = page.getByRole('region', { name: `Scenario: ${name}` });
  await expect(scenario.getByRole('heading', { name: 'Map', exact: true, level: 2 })).toBeVisible();
  await scenario.getByRole('button', { name: 'Simulate offline' }).click();
  await expect(scenario.getByText('Offline—live arrivals, alerts, and elevator status are unavailable.', { exact: true })).toBeVisible();
  const trip = scenario.getByRole('region', { name: 'Device-held active trip' });
  await expect(trip.getByTestId('trip-point-point-1-1')).toContainText('Current');
  await scenario.getByRole('button', { name: 'Reconnect owners' }).focus();
  await scenario.getByRole('button', { name: 'Reconnect owners' }).click();
  return scenario;
}

async function expectPreservedAppContext(scenario: import('@playwright/test').Locator, accessible: boolean) {
  const trip = scenario.getByRole('region', { name: 'Device-held active trip' });
  await expect(trip.getByTestId('trip-point-point-1-1')).toContainText('Current');
  await expect(scenario.getByRole('heading', { name: 'Map', exact: true, level: 2 })).toBeVisible();
  const receipt = scenario.getByRole('region', { name: 'App-integrated owner receipt' });
  await expect(receipt.getByText(`Accessible Route Only · ${accessible ? 'On' : 'Off'}`, { exact: true })).toBeVisible();
  await expect(receipt.getByText('Cursor point-1-1 · filters A', { exact: true })).toBeVisible();
  await expect(receipt.getByText(/^Map actual · day · viewport-/u)).toBeVisible();
  await expect(receipt.getByText('Surface map · focus app-reconnect-owners · reading point-1-1', { exact: true })).toBeVisible();
}

async function expectWarningBeforeTripAndMap(warning: import('@playwright/test').Locator, scenario: import('@playwright/test').Locator) {
  const trip = scenario.getByRole('region', { name: 'Device-held active trip' });
  const map = scenario.getByRole('heading', { name: 'Map', exact: true, level: 2 });
  expect(await warning.evaluate((node, target) => (
    Boolean(node.compareDocumentPosition(target as Node) & Node.DOCUMENT_POSITION_FOLLOWING)
  ), await trip.elementHandle())).toBe(true);
  expect(await warning.evaluate((node, target) => (
    Boolean(node.compareDocumentPosition(target as Node) & Node.DOCUMENT_POSITION_FOLLOWING)
  ), await map.elementHandle())).toBe(true);
  expect(await warning.ariaSnapshot()).toContain('Trip update');
}

async function expectStageOrder(page: Page): Promise<void> {
  await expect(page.getByRole('list', { name: 'Presented reconnection stages' }).getByRole('listitem')).toHaveText([
    '1 · Path and equipment',
    '2 · Service and transfers',
    '3 · Train choice and arrivals',
    '4 · Required guidance',
    '5 · Maps and unrelated saved stations',
  ]);
}

async function expectServerTransitionOrder(page: Page, scenario: string): Promise<void> {
  await expect.poll(async () => {
    const response = await page.request.get(`${FIXTURE_ORIGIN}/__test/transitions`);
    const body = await response.json() as { transitions: ValidationTransition[] };
    return body.transitions.filter((transition) => transition.scenario === scenario).length;
  }).toBe(10);
  const response = await page.request.get(`${FIXTURE_ORIGIN}/__test/transitions`);
  const body = await response.json() as { transitions: ValidationTransition[] };
  const transitions = body.transitions.filter((transition) => transition.scenario === scenario);
  expect(transitions.map(({ phase, stage }) => `${phase}:${stage}`)).toEqual([
    'requested:1', 'presented:1',
    'requested:2', 'presented:2',
    'requested:3', 'presented:3',
    'requested:4', 'presented:4',
    'requested:5', 'presented:5',
  ]);
  expect(transitions.map(({ sequence }) => sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(new Set(transitions.map(({ requestIdentity }) => requestIdentity)).size).toBe(1);
  for (let index = 0; index < transitions.length; index += 2) {
    const requested = transitions[index]!;
    const presented = transitions[index + 1]!;
    expect(requested).toMatchObject({ phase: 'requested', stageStatus: 'requested', ownerDisposition: 'pending' });
    expect(presented).toMatchObject({ phase: 'presented', stageStatus: 'presented' });
    expect(['accepted-fresh', 'governed-fail-closed']).toContain(presented.ownerDisposition);
    expect(presented.evidenceIds.length).toBeGreaterThan(0);
    expect(presented.auditKinds).toEqual(expect.arrayContaining(['stage-owner-accepted', 'stage-committed', 'stage-presented']));
  }
}

async function expectWarningBeforeContext(page: Page): Promise<void> {
  const warning = page.getByRole('alert').first();
  const context = page.getByRole('region', { name: 'Preserved rider context' });
  await expect(warning).toBeVisible();
  await expect(context).toBeVisible();
  expect(await warning.evaluate((node, contextNode) => (
    Boolean(node.compareDocumentPosition(contextNode as Node) & Node.DOCUMENT_POSITION_FOLLOWING)
  ), await context.elementHandle())).toBe(true);
  expect(await warning.ariaSnapshot()).toContain('Trip update');
}

interface ValidationTransition {
  readonly scenario: string;
  readonly sequence: number;
  readonly requestIdentity: string;
  readonly phase: 'requested' | 'presented';
  readonly stage: number;
  readonly stageStatus: 'requested' | 'presented';
  readonly ownerDisposition: 'pending' | 'accepted-fresh' | 'governed-fail-closed';
  readonly evidenceIds: readonly string[];
  readonly auditKinds: readonly string[];
}

async function openProductionApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'NYC Subway Train Time Tracker' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

async function chooseStation(page: Page, name: string): Promise<void> {
  await page.getByRole('toolbar', { name: 'Nearby controls' }).getByRole('button', { name: 'Choose a station' }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true, level: 2 })).toBeVisible();
}
