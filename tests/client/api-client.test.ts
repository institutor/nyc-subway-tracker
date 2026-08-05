import { describe, expect, test, vi } from 'vitest';

import { createTransitApiClient } from '../../src/client/api/client';

const gateDecision = {
  exposed: false, reasonCode: 'GATE_0_NOT_PASSED', decision: 'NO-GO — GATE 0 NOT PASSED',
} as const;

const gates = {
  'arrival-boards': gateDecision,
  'nearby-offline': { ...gateDecision, reasonCode: 'NEARBY_GATE_0_NOT_PASSED' },
  accessibility: { ...gateDecision, reasonCode: 'ACCESSIBILITY_EVIDENCE_NOT_DEMONSTRATED' },
  guidance: { ...gateDecision, reasonCode: 'GUIDANCE_EVIDENCE_NOT_DEMONSTRATED' },
  'maps-rights': { ...gateDecision, reasonCode: 'MAP_RIGHTS_NOT_DOCUMENTED' },
  'commute-evaluation': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
  'commute-silent': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
  'commute-limited-pilot': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
  'commute-delivery': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
} as const;

const nearbyEnvelope = {
  apiVersion: 'v1',
  schemaVersion: '2026-08-04',
  responseIdentity: 'response:nearby',
  decidedAt: '2026-08-04T12:00:00.000Z',
  serverTime: '2026-08-04T12:00:00.000Z',
  runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
  gates,
  gateDecision: gates['nearby-offline'],
  demonstrationLabel: 'Demonstration data — not live',
  practicalWalkEvidence: {
    kind: 'available', source: 'practical-walk', sourceId: 'audited-practical-walk',
    coverage: { kind: 'complete-universe' },
  },
  sourceHealth: [],
  provenance: [],
  data: {
    kind: 'ranked',
    cards: [{
      complexId: 'A12',
      complexName: '125 St',
      rankingRange: { minimumSeconds: 100, maximumSeconds: 130 },
      directions: [{
        constituentId: 'A12', constituentPublicName: '125 St', directionalStopId: 'A12N',
        direction: 'northbound', actualDestination: 'Inwood–207 St', routeIds: ['A', 'C'],
        arrivalState: 'available',
        selectedEntrance: {
          id: 'entrance-a12', publicDescription: 'St Nicholas Av at 125 St',
          walkRange: { minimumSeconds: 100, maximumSeconds: 130 },
        },
      }],
      stationDetailAvailable: true,
    }],
    picker: { required: false, bottomAnchored: true, options: [] },
  },
} as const;

const boardEnvelope = {
  apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'response:board',
  decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
  runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
  gates, gateDecision,
  demonstrationLabel: 'Demonstration data — not live', sourceHealth: [], provenance: [],
  data: {
    mode: 'live', station: { id: 'A12', name: '125 St', complexId: 'A12', routeIds: ['A', 'C'] },
    directions: [{
      direction: 'northbound',
      primary: [{
        id: 'train-a', kind: 'live', route: { id: 'A', label: 'A' }, direction: 'northbound',
        destination: 'Inwood–207 St', validThrough: '2026-08-04T12:01:30.000Z',
        demonstrationLabel: 'Demonstration data — not live', displayAuthority: 'countdown',
        at: '2026-08-04T12:03:00.000Z',
        provenance: {
          source: 'gtfs-rt', sourceId: 'mta-realtime-ace',
          observedAt: '2026-08-04T11:59:58.000Z', retrievedAt: '2026-08-04T11:59:59.000Z',
        },
      }],
      secondary: [], explanations: [],
    }],
    alerts: [], explanations: [], sourceHealth: [], provenance: [],
    capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
  },
} as const;

describe('transit API client boundary', () => {
  test('loads bootstrap and rejects duplicate station identities before catalog caching', async () => {
    const bootstrap = {
      apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'response:bootstrap',
      decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
      runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
      gates, sourceHealth: [], provenance: [], demonstrationLabel: 'Demonstration data — not live',
      data: {
        productName: 'NYC Subway Tracker', unofficial: true,
        contentVersions: { stationCatalog: 'catalog-7', maps: { day: 'day-7', night: 'night-7' } },
      },
    };
    const duplicateCatalog = {
      apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7',
      data: {
        complexes: [
          { id: 'A12', name: '125 St', routeIds: ['A'], constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N'] }] },
          { id: 'A12', name: 'Forged duplicate', routeIds: ['C'], constituents: [{ id: 'A13', name: 'Other', directionalStopIds: ['A13N'] }] },
        ],
      },
    };
    const fetcher = vi.fn(async (input: RequestInfo | URL) => jsonResponse(String(input).includes('/catalog/') ? duplicateCatalog : bootstrap));
    const client = createTransitApiClient(fetcher);

    const loaded = await client.bootstrap();
    expect(loaded.data.contentVersions.stationCatalog).toBe('catalog-7');
    await expect(client.catalog(loaded.data.contentVersions.stationCatalog)).rejects.toThrow('Transit information is unavailable.');
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual(['/api/v1/bootstrap', '/api/v1/stations/catalog/catalog-7']);
  });

  test('posts an exact location fix only in the Nearby body and propagates cancellation', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(nearbyEnvelope));
    const client = createTransitApiClient(fetcher);
    const controller = new AbortController();

    const result = await client.nearby({
      coordinate: { latitude: 40.7, longitude: -74 }, accuracyMeters: 750,
    }, false, controller.signal);

    expect(result.data?.kind).toBe('ranked');
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('/api/v1/nearby');
    expect(String(url)).not.toMatch(/40\.7|\-74|latitude|longitude|coordinate/i);
    expect(init).toMatchObject({ method: 'POST', signal: controller.signal });
    expect(JSON.parse(String(init?.body))).toEqual({
      location: { latitude: 40.7, longitude: -74, accuracyMeters: 750 },
      accessibleRouteOnly: false,
    });
  });

  test('validates board responses and encodes only exact station filters in the URL', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(boardEnvelope));
    const client = createTransitApiClient(fetcher);

    const result = await client.board('A12', { routeIds: ['A', 'C'], direction: 'northbound' });

    expect(result.data?.directions[0].primary[0]).toMatchObject({
      kind: 'live', displayAuthority: 'countdown', destination: 'Inwood–207 St',
    });
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/stations/A12/board?routes=A%2CC&direction=northbound');
  });

  test('rejects malformed or expanded operational data with a generic rider-safe error', async () => {
    const expanded = structuredClone(boardEnvelope) as Record<string, unknown>;
    (expanded.data as Record<string, unknown>).crowding = { secretProviderField: true };
    const client = createTransitApiClient(async () => jsonResponse(expanded));

    await expect(client.board('A12')).rejects.toThrow('Transit information is unavailable.');
    await expect(client.board('A12')).rejects.not.toThrow(/crowding|secretProviderField/);
  });

  test('accepts an unavailable decision that still names the exact requested station', async () => {
    const unavailable = structuredClone(boardEnvelope) as any;
    unavailable.responseIdentity = 'response:board-unavailable';
    unavailable.data.mode = 'unavailable';
    unavailable.data.directions = [];
    const client = createTransitApiClient(async () => jsonResponse(unavailable));

    const result = await client.board('A12');
    expect(result.data).toMatchObject({ mode: 'unavailable', station: { id: 'A12', name: '125 St' }, directions: [] });
  });

  test('rejects a board response owned by a different station than the request', async () => {
    const mismatched = structuredClone(boardEnvelope) as any;
    mismatched.responseIdentity = 'response:board:mismatched';
    mismatched.data.station.id = 'R20';
    const client = createTransitApiClient(async () => jsonResponse(mismatched));

    await expect(client.board('A12')).rejects.toThrow('Transit information is unavailable.');
  });

  test('rejects a board response outside the exact requested direction filter', async () => {
    const mismatched = structuredClone(boardEnvelope) as any;
    mismatched.responseIdentity = 'response:board:wrong-direction';
    mismatched.data.directions[0].direction = 'southbound';
    mismatched.data.directions[0].primary[0].direction = 'southbound';
    const client = createTransitApiClient(async () => jsonResponse(mismatched));

    await expect(client.board('A12', { direction: 'northbound' })).rejects.toThrow('Transit information is unavailable.');
  });

  test('rejects arrival rows outside the exact requested route filters', async () => {
    const mismatched = structuredClone(boardEnvelope) as any;
    mismatched.responseIdentity = 'response:board:wrong-route';
    mismatched.data.directions[0].primary[0].route = { id: 'B', label: 'B' };
    const client = createTransitApiClient(async () => jsonResponse(mismatched));

    await expect(client.board('A12', { routeIds: ['A'] })).rejects.toThrow('Transit information is unavailable.');
  });

  test('accepts expected and holding rows when every row agrees on direction and clock boundary', async () => {
    const coherent = boardWithEveryArrivalShape();
    const client = createTransitApiClient(async () => jsonResponse(coherent));

    const result = await client.board('A12');

    expect(result.data?.directions[0].primary[0].kind).toBe('expected');
    expect(result.data?.directions[0].secondary[0].kind).toBe('holding');
    expect(result.data?.directions[1].primary[0].direction).toBe('southbound');
  });

  test.each([
    ['primary', (value: any) => { value.data.directions[0].primary[0].direction = 'southbound'; }],
    ['secondary', (value: any) => { value.data.directions[0].secondary[0].direction = 'southbound'; }],
  ])('rejects a %s row that contradicts its owning direction', async (_kind, contradict) => {
    const mismatched = boardWithEveryArrivalShape();
    contradict(mismatched);
    const client = createTransitApiClient(async () => jsonResponse(mismatched));

    await expect(client.board('A12')).rejects.toThrow('Transit information is unavailable.');
  });

  test('rejects a row/container direction contradiction on an exact filtered request', async () => {
    const mismatched = boardWithEveryArrivalShape();
    mismatched.data.directions = [mismatched.data.directions[0]];
    mismatched.data.directions[0].secondary[0].direction = 'southbound';
    const client = createTransitApiClient(async () => jsonResponse(mismatched));

    await expect(client.board('A12', { routeIds: ['A'], direction: 'northbound' }))
      .rejects.toThrow('Transit information is unavailable.');
  });

  test('rejects competing valid-through boundaries across the displayed board', async () => {
    const mismatched = boardWithEveryArrivalShape();
    mismatched.data.directions[1].primary[0].validThrough = '2026-08-04T12:01:31.000Z';
    const client = createTransitApiClient(async () => jsonResponse(mismatched));

    await expect(client.board('A12')).rejects.toThrow('Transit information is unavailable.');
  });

  test('rejects a shared valid-through boundary that predates server time', async () => {
    const expired = boardWithEveryArrivalShape();
    for (const direction of expired.data.directions) {
      for (const row of [...direction.primary, ...direction.secondary]) {
        row.validThrough = '2026-08-04T11:59:59.000Z';
      }
    }
    const client = createTransitApiClient(async () => jsonResponse(expired));

    await expect(client.board('A12')).rejects.toThrow('Transit information is unavailable.');
  });

  test('captures monotonic receipt time before a board reaches the render queue', async () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(4_321);
    const client = createTransitApiClient(async () => jsonResponse(boardEnvelope));

    const result = await client.board('A12');

    expect((result as typeof result & { readonly receivedAtMonotonicMs?: number }).receivedAtMonotonicMs).toBe(4_321);
    clock.mockRestore();
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function boardWithEveryArrivalShape(): any {
  const value = structuredClone(boardEnvelope) as any;
  value.responseIdentity = 'response:board:all-arrival-shapes';
  const live = value.data.directions[0].primary[0];
  const common = {
    route: live.route,
    direction: 'northbound',
    destination: live.destination,
    validThrough: live.validThrough,
    demonstrationLabel: live.demonstrationLabel,
    provenance: live.provenance,
  };
  value.data.directions[0].primary = [{
    ...common,
    id: 'train-expected',
    kind: 'expected',
    displayAuthority: 'range',
    estimateAt: '2026-08-04T12:06:00.000Z',
    range: { startsAt: '2026-08-04T12:05:00.000Z', endsAt: '2026-08-04T12:07:00.000Z' },
  }];
  value.data.directions[0].secondary = [{
    ...common,
    id: 'train-holding',
    kind: 'holding',
    displayAuthority: 'status-only',
    lastSupportedAt: '2026-08-04T11:58:30.000Z',
  }];
  value.data.directions.push({
    direction: 'southbound',
    primary: [{ ...live, id: 'train-south', direction: 'southbound' }],
    secondary: [],
    explanations: [],
  });
  return value;
}
