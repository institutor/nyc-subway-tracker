import { describe, expect, test, vi } from 'vitest';

import { createApp } from '../../src/server/app';
import type { DecisionSnapshot } from '../../src/server/api/decision-snapshot';
import { createProductionDependencies } from '../../src/server/bootstrap';
import { createJourneyGraphReference } from '../../src/server/services/journey-service';
import { createFixedClock } from '../../src/shared/domain/clock';
import { withApi } from '../helpers/api-harness';

const DECIDED_AT = new Date('2026-08-04T12:00:00.000Z');

const catalogFixture = {
  contentVersion: 'catalog-2026-08-04',
  complexes: [
    {
      id: 'R20',
      name: 'Canal St',
      routeIds: ['N', 'Q', 'R', 'W'],
      constituents: [{ id: 'R20', name: 'Canal St', directionalStopIds: ['R20N', 'R20S'] }],
    },
    {
      id: 'A12',
      name: '125 St',
      routeIds: ['A', 'C'],
      constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N', 'A12S'] }],
    },
  ],
} as const;

const nearbySnapshot = {
  identity: 'snapshot-nearby-1',
  sourceHealth: [{
    source: 'gtfs-rt', sourceId: 'subway-rt-ace', state: 'current',
    assessedAt: '2026-08-04T12:00:00.000Z', lastAcceptedAt: '2026-08-04T11:59:59.000Z',
  }],
  provenance: [{
    source: 'gtfs-rt', sourceId: 'subway-rt-ace', observedAt: '2026-08-04T11:59:58.000Z',
    retrievedAt: '2026-08-04T11:59:59.000Z', version: 'feed-7',
  }],
  nearby: {
    complexes: [{ id: 'A12', name: '125 St' }, { id: 'R20', name: 'Canal St' }],
    constituents: [
      { id: 'A12', complexId: 'A12', publicName: '125 St' },
      { id: 'R20', complexId: 'R20', publicName: 'Canal St' },
    ],
    entrances: [
      {
        id: 'entrance-a12', complexId: 'A12', constituentId: 'A12', publicDescription: 'St Nicholas Av at 125 St',
        entryPermission: 'entry', joinStatus: 'matched', directionalStopIds: ['A12N'], usability: 'open', accessibility: 'eligible',
      },
      {
        id: 'entrance-r20', complexId: 'R20', constituentId: 'R20', publicDescription: 'Broadway at Canal St',
        entryPermission: 'entry', joinStatus: 'matched', directionalStopIds: ['R20N'], usability: 'open', accessibility: 'eligible',
      },
    ],
    services: [
      {
        id: 'service-a12', complexId: 'A12', constituentId: 'A12', directionalStopId: 'A12N', routeId: 'A',
        direction: 'northbound', actualDestination: 'Inwood–207 St', state: 'current', arrivalState: 'available',
      },
      {
        id: 'service-r20', complexId: 'R20', constituentId: 'R20', directionalStopId: 'R20N', routeId: 'N',
        direction: 'northbound', actualDestination: 'Astoria–Ditmars Blvd', state: 'current', arrivalState: 'available',
      },
    ],
  },
} as const;

const nearbyUniverse = [
  { id: 'entrance-a12', coordinate: { latitude: 89, longitude: 179 } },
  { id: 'entrance-r20', coordinate: { latitude: 40.7195, longitude: -74.0018 } },
] as const;

const boardDecision = {
  responseIdentity: 'domain-board-a12-7',
  mode: 'live',
  station: { id: 'A12', name: '125 St', complexId: 'A12', routeIds: ['A', 'C'] },
  directions: [
    {
      direction: 'northbound',
      primary: [
        {
          id: 'train-a', kind: 'live', route: { id: 'A', label: 'A' }, direction: 'northbound',
          destination: 'Inwood–207 St', at: new Date('2026-08-04T12:03:00.000Z'),
          provenance: {
            source: 'gtfs-rt', sourceId: 'subway-rt-ace', observedAt: new Date('2026-08-04T11:59:58.000Z'),
            retrievedAt: new Date('2026-08-04T11:59:59.000Z'), version: 'feed-7',
          },
        },
        {
          id: 'train-c', kind: 'expected', route: { id: 'C', label: 'C' }, direction: 'northbound',
          destination: '168 St', estimateAt: new Date('2026-08-04T12:06:00.000Z'),
          range: { startsAt: new Date('2026-08-04T12:05:00.000Z'), endsAt: new Date('2026-08-04T12:07:00.000Z') },
          provenance: {
            source: 'gtfs-rt', sourceId: 'subway-rt-ace', observedAt: new Date('2026-08-04T11:59:58.000Z'),
            retrievedAt: new Date('2026-08-04T11:59:59.000Z'), version: 'feed-7',
          },
        },
      ],
      secondary: [
        {
          id: 'train-hold', kind: 'holding', route: { id: 'A', label: 'A' }, direction: 'northbound',
          destination: 'Inwood–207 St', lastSupportedAt: new Date('2026-08-04T11:58:30.000Z'),
          provenance: {
            source: 'gtfs-rt', sourceId: 'subway-rt-ace', observedAt: new Date('2026-08-04T11:59:58.000Z'),
            retrievedAt: new Date('2026-08-04T11:59:59.000Z'), version: 'feed-7',
          },
        },
        {
          id: 'train-uncertain', kind: 'uncertain', route: { id: 'C', label: 'C' }, direction: 'northbound',
          destination: '168 St', reason: 'Movement is not confirmed.',
          provenance: {
            source: 'gtfs-rt', sourceId: 'subway-rt-ace', observedAt: new Date('2026-08-04T11:59:58.000Z'),
            retrievedAt: new Date('2026-08-04T11:59:59.000Z'), version: 'feed-7',
          },
        },
      ],
      explanations: [{ code: 'DWELL', message: 'One train is holding.' }],
    },
    {
      direction: 'southbound',
      primary: [{
        id: 'train-a-s', kind: 'live', route: { id: 'A', label: 'A' }, direction: 'southbound',
        destination: 'Far Rockaway', at: new Date('2026-08-04T12:04:00.000Z'),
        provenance: {
          source: 'gtfs-rt', sourceId: 'subway-rt-ace', observedAt: new Date('2026-08-04T11:59:58.000Z'),
          retrievedAt: new Date('2026-08-04T11:59:59.000Z'), version: 'feed-7',
        },
      }],
      secondary: [], explanations: [],
    },
  ],
  feedHealth: [{
    source: 'gtfs-rt', state: 'current', assessedAt: new Date('2026-08-04T12:00:00.000Z'),
    lastAcceptedAt: new Date('2026-08-04T11:59:58.000Z'),
  }],
  alerts: [{
    id: 'alert-a-north', text: 'A trains are running with delays.', activeFrom: new Date('2026-08-04T11:45:00.000Z'),
    routeIds: ['A'], stationIds: ['A12'], directions: ['northbound'],
    provenance: {
      source: 'alerts', sourceId: 'subway-alerts', observedAt: new Date('2026-08-04T11:59:00.000Z'),
      retrievedAt: new Date('2026-08-04T11:59:30.000Z'), version: 'alerts-3',
    },
  }],
  decidedAt: new Date('2026-08-04T12:00:00.000Z'),
  explanations: [{ code: 'SERVICE_CONTEXT', message: 'Review current service information.' }],
  capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
} as const;

const operationalSnapshot = {
  ...nearbySnapshot,
  identity: 'snapshot-operational-7',
  boards: [{ decision: boardDecision, validThrough: '2026-08-04T12:01:30.000Z' }],
  mapOverlays: [{
    theme: 'day',
    serviceEpoch: 'overlay-7',
    sourceOwners: [{ source: 'gtfs-rt', sourceId: 'subway-rt-ace' }],
    segments: [{ id: 'segment-a-uptown', routeIds: ['A'], state: 'normal', alertIds: [] }],
  }],
} as const;

const mapReferences = {
  day: {
    contentVersion: 'map-day-2026-08-04',
    attribution: 'Unofficial app-owned subway reference geometry',
    features: [{
      id: 'line-a', kind: 'line', routeIds: ['A'],
      geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
    }],
  },
  night: {
    contentVersion: 'map-night-2026-08-04',
    attribution: 'Unofficial app-owned subway reference geometry',
    features: [{
      id: 'line-a-night', kind: 'line', routeIds: ['A'],
      geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
    }],
  },
} as const;

const journeyGraph = {
  nodes: [
    { id: 'node-origin', occurrenceId: 'occurrence-origin', stationId: 'A12', directionalStopId: 'A12N' },
    { id: 'node-destination', occurrenceId: 'occurrence-destination', stationId: 'A15', directionalStopId: 'A15N' },
  ],
  patterns: [{
    id: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'northbound', actualDestination: 'Inwood–207 St',
    orderedOccurrenceIds: ['occurrence-origin', 'occurrence-destination'], accessibility: 'eligible',
    current: { status: 'admitted', serviceDecision: 'pass', validity: 'valid', risk: 'clear', arrivalSeconds: 180 },
    future: [{
      serviceDate: '2026-08-08', owner: 'supplemented', occurrence: 'present', usableSupplementMask: true,
      serviceDecision: 'pass', validity: 'valid', risk: 'clear', arrivalSeconds: 300,
    }],
    offline: {
      schedule: 'current-supplemented', serviceDecision: 'pass', patternMatch: 'exact', validity: 'valid', risk: 'clear', arrivalSeconds: 600,
    },
  }],
  transfers: [],
} as const;

const journeySnapshot = { ...operationalSnapshot, identity: 'snapshot-journey-7', journeyGraph } as const;

describe('versioned subway API', () => {
  test('creates a side-effect-free production app whose live bootstrap and board remain publicly locked', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read',
      mode: 'live',
      sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });
    const app = createApp(dependencies);

    await withApi(app, async ({ request }) => {
      const bootstrapResponse = await request('/api/v1/bootstrap');
      expect(bootstrapResponse.status).toBe(200);
      expect(bootstrapResponse.headers.get('cache-control')).toBe('no-store');
      const bootstrap = await bootstrapResponse.json();
      expect(bootstrap).toMatchObject({
        apiVersion: 'v1',
        schemaVersion: '2026-08-04',
        decidedAt: DECIDED_AT.toISOString(),
        serverTime: DECIDED_AT.toISOString(),
        runtime: { mode: 'live', surface: 'public', availability: 'available' },
        data: {
          productName: 'NYC Subway Tracker',
          unofficial: true,
        },
      });
      expect(bootstrap.responseIdentity).toMatch(/^response:/);
      expect(bootstrap.gates['arrival-boards']).toMatchObject({ exposed: false, reasonCode: 'GATE_0_NOT_PASSED' });

      const boardResponse = await request('/api/v1/stations/A12/board');
      expect(boardResponse.status).toBe(200);
      expect(boardResponse.headers.get('cache-control')).toBe('no-store');
      const board = await boardResponse.json();
      expect(board).toMatchObject({
        apiVersion: 'v1',
        schemaVersion: '2026-08-04',
        runtime: { mode: 'live', surface: 'public', availability: 'locked' },
        gateDecision: { exposed: false, reasonCode: 'GATE_0_NOT_PASSED' },
        data: null,
      });
      expect(JSON.stringify(board)).not.toContain('Demonstration data');
      expect(board).not.toHaveProperty('primary');
      expect(board).not.toHaveProperty('secondary');
      expect(board).not.toHaveProperty('alerts');
      expect(board).not.toHaveProperty('trains');
    });
  });

  test('serves demonstration operations only from startup-selected validation mode while public gates stay locked', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read',
      mode: 'validation',
      sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/stations/A15/board');
      const body = await response.json();
      expect(body).toMatchObject({
        runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
        demonstrationLabel: 'Demonstration data — not live',
        gateDecision: { exposed: false, reasonCode: 'GATE_0_NOT_PASSED' },
        data: {
          mode: 'demonstration',
          station: { id: 'A15', name: '125 St' },
          directions: [
            { direction: 'northbound', primary: expect.any(Array) },
            { direction: 'southbound', primary: expect.any(Array) },
          ],
          alerts: [{ id: 'alert-a-north', demonstrationLabel: 'Demonstration data — not live' }],
          sourceHealth: expect.any(Array),
          provenance: expect.any(Array),
        },
      });
      expect(body.data.directions.flatMap((direction: any) => direction.primary)).toHaveLength(6);
      expect(body.data.directions.flatMap((direction: any) => direction.primary)
        .every((arrival: any) => arrival.demonstrationLabel === 'Demonstration data — not live')).toBe(true);
      expect(body.gates['arrival-boards'].exposed).toBe(false);
    });
  });

  test('cannot activate validation through request input or a failed operational dependency', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read',
      mode: 'live',
      sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/bootstrap', {
        headers: {
          'x-transit-runtime-mode': 'validation',
          cookie: 'mode=validation; validationFixtures=true',
        },
      });
      const body = await response.json();
      expect(body.runtime).toEqual({ mode: 'live', surface: 'public', availability: 'available' });
      expect(JSON.stringify(body)).not.toContain('Demonstration data');
    });
  });

  test('keeps shadow decisions non-public while all public locks remain closed', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read',
      mode: 'shadow',
      sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/stations/A12/board');
      const body = await response.json();
      expect(body).toMatchObject({
        runtime: { mode: 'shadow', surface: 'public', availability: 'locked' },
        gateDecision: { exposed: false },
        data: null,
      });
      expect(JSON.stringify(body)).not.toMatch(/shadowDecision|directions|trains|alerts/);
      expect(JSON.stringify(body)).not.toContain('Demonstration data');
    });
  });

  test('serves a canonical content-versioned station catalog with strong revalidation', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), catalog: catalogFixture });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/stations/catalog/catalog-2026-08-04');
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
      const etag = response.headers.get('etag');
      expect(etag).toMatch(/^"[a-f0-9]{64}"$/);
      expect(response.headers.get('vary')).toBeNull();
      expect(await response.json()).toEqual({
        apiVersion: 'v1',
        schemaVersion: '2026-08-04',
        contentVersion: 'catalog-2026-08-04',
        data: {
          complexes: [catalogFixture.complexes[1], catalogFixture.complexes[0]],
        },
      });

      const unchanged = await request('/api/v1/stations/catalog/catalog-2026-08-04', {
        headers: { 'if-none-match': `W/${etag}, "other"` },
      });
      expect(unchanged.status).toBe(304);
      expect(await unchanged.text()).toBe('');
      expect(unchanged.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    });
  });

  test('searches current station text deterministically without caching or exposing coordinates', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), catalog: catalogFixture });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/stations/search?q=canal&limit=1');
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      const body = await response.json();
      expect(body).toEqual({
        apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-2026-08-04',
        query: 'canal', results: [catalogFixture.complexes[0]],
      });
      expect(JSON.stringify(body)).not.toMatch(/latitude|longitude|coordinate/i);
    });
  });

  test('uses the complete practical-walk universe transiently and returns coordinate-free ranked Nearby data', async () => {
    const walk = vi.fn(async (
      _request: unknown,
      _options: { readonly signal: AbortSignal },
    ) => ({
      kind: 'available' as const,
      source: 'practical-walk' as const,
      sourceId: 'practical-walk',
      coverage: { kind: 'complete-universe' as const },
      results: [
        { destinationId: 'entrance-a12', range: { minimumSeconds: 500, maximumSeconds: 520 } },
        { destinationId: 'entrance-r20', range: { minimumSeconds: 100, maximumSeconds: 120 } },
      ],
    }));
    const capture = vi.fn(() => nearbySnapshot);
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT), catalog: catalogFixture, nearbyUniverse,
      walk, snapshotProvider: { capture },
    });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/nearby', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      const body = await response.json();
      expect(body).toMatchObject({
        runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
        demonstrationLabel: 'Demonstration data — not live',
        sourceHealth: [{ sourceId: 'mta-realtime-ace', state: 'current', reasonCode: 'SOURCE_CURRENT' }],
        provenance: [{ source: 'gtfs-rt', sourceId: 'mta-realtime-ace' }],
        data: { kind: 'ranked', cards: [{ complexId: 'R20' }, { complexId: 'A12' }] },
      });
      expect(walk).toHaveBeenCalledTimes(1);
      const [walkRequest, walkOptions] = walk.mock.calls[0];
      expect(walkRequest).toEqual({
        origin: { latitude: 40.7, longitude: -74 },
        destinations: nearbyUniverse,
      });
      expect(walkOptions.signal).toBeInstanceOf(AbortSignal);
      expect(capture).toHaveBeenCalledTimes(1);
      const serialized = JSON.stringify(body);
      expect(serialized).not.toMatch(/latitude|longitude|coordinate|40\.7|\-74|\b89\b|\b179\b/i);
    });
  });

  test('requires the station picker whenever complete comparable walk evidence is unavailable', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT), nearbyUniverse,
      walk: async () => ({ kind: 'unavailable', reason: 'incomplete' }),
      snapshotProvider: { capture: () => nearbySnapshot },
    });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/nearby', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
      });
      expect(await response.json()).toMatchObject({
        data: {
          kind: 'picker', reason: 'walk-unavailable', cards: [],
          picker: { required: true, bottomAnchored: true },
        },
      });
    });
  });

  test('preserves allowlisted certified third-card completeness evidence with a fixed walk handle', async () => {
    const certifiedUniverse = [
      ...nearbyUniverse,
      { id: 'entrance-third', coordinate: { latitude: 40.72, longitude: -74.01 } },
    ] as const;
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT), nearbyUniverse: certifiedUniverse,
      walk: async () => ({
        kind: 'available', source: 'practical-walk', sourceId: 'practical-walk',
        coverage: {
          kind: 'certified-third-card-cutoff' as const,
          consideredDestinationIds: ['entrance-third', 'entrance-a12', 'entrance-r20'], excludedDestinationIds: [],
          thirdCardMaximumSeconds: 200, excludedMinimumSeconds: 300,
        },
        results: [
          { destinationId: 'entrance-a12', range: { minimumSeconds: 150, maximumSeconds: 170 } },
          { destinationId: 'entrance-r20', range: { minimumSeconds: 100, maximumSeconds: 120 } },
          { destinationId: 'entrance-third', range: { minimumSeconds: 180, maximumSeconds: 190 } },
        ],
      }),
      snapshotProvider: { capture: () => nearbySnapshot },
    });
    await withApi(createApp(dependencies), async ({ request }) => {
      const body = await (await request('/api/v1/nearby', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
      })).json();
      expect(body.practicalWalkEvidence).toEqual({
        kind: 'available', source: 'practical-walk', sourceId: 'audited-practical-walk',
        coverage: {
          kind: 'certified-third-card-cutoff',
          consideredDestinationIds: ['entrance-a12', 'entrance-r20', 'entrance-third'], excludedDestinationIds: [],
          thirdCardMaximumSeconds: 200, excludedMinimumSeconds: 300,
        },
      });
      expect(body.data.kind).toBe('ranked');
    });
  });

  test('fails forged or incomplete practical-walk evidence closed before ranking and identity construction', async () => {
    const universe = [
      ...nearbyUniverse,
      { id: 'entrance-x', coordinate: { latitude: 40.72, longitude: -74.01 } },
      { id: 'entrance-y', coordinate: { latitude: 40.73, longitude: -74.02 } },
    ] as const;
    const certified = () => ({
      kind: 'available',
      source: 'practical-walk',
      sourceId: 'practical-walk',
      coverage: {
        kind: 'certified-third-card-cutoff',
        consideredDestinationIds: ['entrance-x', 'entrance-a12', 'entrance-r20'],
        excludedDestinationIds: ['entrance-y'],
        thirdCardMaximumSeconds: 200,
        excludedMinimumSeconds: 300,
      },
      results: [
        { destinationId: 'entrance-a12', range: { minimumSeconds: 100, maximumSeconds: 120 } },
        { destinationId: 'entrance-r20', range: { minimumSeconds: 130, maximumSeconds: 150 } },
        { destinationId: 'entrance-x', range: { minimumSeconds: 160, maximumSeconds: 180 } },
      ],
    });
    const invalidCases: readonly [string, (value: any) => void][] = [
      ['wrong source', (value) => { value.source = 'forged-walk'; }],
      ['unknown source id', (value) => { value.sourceId = 'walk-provider-v2'; }],
      ['secret source id', (value) => { value.sourceId = 'https://secret.example/token-source'; }],
      ['duplicate considered id', (value) => { value.coverage.consideredDestinationIds.push('entrance-a12'); }],
      ['duplicate excluded id', (value) => { value.coverage.excludedDestinationIds.push('entrance-y'); }],
      ['overlapping partition id', (value) => { value.coverage.excludedDestinationIds.push('entrance-a12'); }],
      ['missing partition id', (value) => { value.coverage.excludedDestinationIds = []; }],
      ['extra secret partition id', (value) => { value.coverage.excludedDestinationIds.push('https://secret.example/token-id'); }],
      ['missing considered result', (value) => { value.results.pop(); }],
      ['excluded id returned as result', (value) => {
        value.results.push({ destinationId: 'entrance-y', range: { minimumSeconds: 181, maximumSeconds: 190 } });
      }],
      ['duplicate result id', (value) => { value.results.push(structuredClone(value.results[0])); }],
      ['fractional cutoff', (value) => { value.coverage.thirdCardMaximumSeconds = 200.5; }],
      ['unsafe cutoff', (value) => { value.coverage.excludedMinimumSeconds = Number.MAX_SAFE_INTEGER + 1; }],
      ['negative cutoff', (value) => { value.coverage.thirdCardMaximumSeconds = -1; }],
      ['non-separating cutoffs', (value) => { value.coverage.excludedMinimumSeconds = 200; }],
      ['reversed cutoffs', (value) => { value.coverage.excludedMinimumSeconds = 199; }],
      ['fewer than three considered', (value) => {
        value.coverage.consideredDestinationIds = ['entrance-a12', 'entrance-r20'];
        value.coverage.excludedDestinationIds = ['entrance-x', 'entrance-y'];
        value.results = value.results.slice(0, 2);
      }],
      ['result above certified maximum', (value) => { value.results[2].range.maximumSeconds = 201; }],
      ['fractional result range', (value) => { value.results[0].range.minimumSeconds = 100.5; }],
      ['reversed result range', (value) => { value.results[0].range = { minimumSeconds: 121, maximumSeconds: 120 }; }],
      ['incomplete complete universe', (value) => { value.coverage = { kind: 'complete-universe' }; }],
      ['extra complete-universe result', (value) => {
        value.coverage = { kind: 'complete-universe' };
        value.results.push({
          destinationId: 'https://secret.example/token-result', range: { minimumSeconds: 181, maximumSeconds: 190 },
        });
      }],
    ];
    const responseIdentities = new Set<string>();
    for (const [name, mutate] of invalidCases) {
      const forged = certified() as any;
      mutate(forged);
      const log = vi.fn();
      const dependencies = createProductionDependencies({
        dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
      }, {
        clock: createFixedClock(DECIDED_AT), nearbyUniverse: universe, logger: { log },
        walk: async () => forged,
        snapshotProvider: { capture: () => nearbySnapshot },
      });
      await withApi(createApp(dependencies), async ({ request }) => {
        const response = await request('/api/v1/nearby', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
        });
        expect(response.status, name).toBe(200);
        const body = await response.json();
        expect(body.practicalWalkEvidence, name).toEqual({ kind: 'unavailable', reason: 'invalid' });
        expect(body.data, name).toMatchObject({
          kind: 'picker', reason: 'walk-unavailable', cards: [], picker: { required: true, bottomAnchored: true },
        });
        expect(JSON.stringify({ body, logs: log.mock.calls }), name).not.toMatch(/secret\.example|token-(?:source|id|result)/i);
        responseIdentities.add(body.responseIdentity);
      });
    }
    expect([...responseIdentities]).toHaveLength(1);
    expect([...responseIdentities][0]).toMatch(/^response:[a-f0-9]{64}$/);
  });

  test('cancels practical walking when the Nearby HTTP request disconnects', async () => {
    let adapterSignal: AbortSignal | undefined;
    const walk = (_request: unknown, options: { signal: AbortSignal }) => new Promise<never>((_resolve, reject) => {
      adapterSignal = options.signal;
      options.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
    });
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), nearbyUniverse, walk, snapshotProvider: { capture: () => nearbySnapshot } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const caller = new AbortController();
      const pending = request('/api/v1/nearby', {
        method: 'POST', signal: caller.signal, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
      });
      while (!adapterSignal) await new Promise((resolve) => setTimeout(resolve, 1));
      caller.abort();
      await expect(pending).rejects.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 1));
      expect(adapterSignal?.aborted).toBe(true);
    });
  });

  test('returns a complete labeled board with primary, secondary, explanation, health, and capability areas', async () => {
    const now = vi.fn(() => new Date(DECIDED_AT));
    const capture = vi.fn(() => operationalSnapshot);
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: { now }, snapshotProvider: { capture } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/stations/A12/board');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-subway-historical-cache')).toBe('public-v1');
      const body = await response.json();
      expect(body).toMatchObject({
        decidedAt: DECIDED_AT.toISOString(), serverTime: DECIDED_AT.toISOString(),
        demonstrationLabel: 'Demonstration data — not live',
        data: {
          station: { id: 'A12', name: '125 St', routeIds: ['A', 'C'] },
          mode: 'live',
          directions: [{
            direction: 'northbound',
            primary: [
              { id: 'train-a', kind: 'live', displayAuthority: 'countdown', validThrough: '2026-08-04T12:01:30.000Z', demonstrationLabel: 'Demonstration data — not live' },
              { id: 'train-c', kind: 'expected', displayAuthority: 'range', demonstrationLabel: 'Demonstration data — not live' },
            ],
            secondary: [
              { id: 'train-hold', kind: 'holding', displayAuthority: 'status-only', demonstrationLabel: 'Demonstration data — not live' },
              { id: 'train-uncertain', kind: 'uncertain', displayAuthority: 'status-only', demonstrationLabel: 'Demonstration data — not live' },
            ],
            explanations: [{ code: 'DWELL' }],
          }, { direction: 'southbound' }],
          alerts: [{ id: 'alert-a-north', demonstrationLabel: 'Demonstration data — not live' }],
          capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
        },
      });
      expect(body.data.directions).toHaveLength(2);
      expect(body.sourceHealth).toHaveLength(1);
      expect(body.provenance).toHaveLength(1);
      expect(now).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledTimes(1);
    });
  });

  test('preserves live, scheduled-fallback, and unavailable board truth beneath the demonstration surface', async () => {
    for (const mode of ['live', 'scheduled-fallback', 'unavailable'] as const) {
      const snapshot = structuredClone(operationalSnapshot) as any;
      snapshot.boards[0].decision.mode = mode;
      if (mode === 'scheduled-fallback') {
        snapshot.boards[0].decision.directions = [{
          direction: 'northbound',
          primary: [{
            id: 'scheduled-a', kind: 'scheduled', route: { id: 'A', label: 'A' }, direction: 'northbound',
            destination: 'Inwoodâ€“207 St', at: new Date('2026-08-04T12:08:00.000Z'), serviceDate: '2026-08-04',
            provenance: boardDecision.directions[0].primary[0].provenance,
          }],
          secondary: [], explanations: [],
        }];
      }
      if (mode === 'unavailable') snapshot.boards[0].decision.directions = [];
      const dependencies = createProductionDependencies({
        dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
      }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => snapshot } });

      await withApi(createApp(dependencies), async ({ request }) => {
        const body = await (await request('/api/v1/stations/A12/board')).json();
        expect(body.runtime).toEqual({ mode: 'validation', surface: 'demonstration', availability: 'available' });
        expect(body.demonstrationLabel).toBe('Demonstration data — not live');
        expect(body.gateDecision.exposed).toBe(false);
        expect(body.data.mode).toBe(mode);
        for (const direction of body.data.directions) {
          for (const row of [...direction.primary, ...direction.secondary]) {
            expect(row.demonstrationLabel).toBe('Demonstration data — not live');
          }
        }
        for (const alert of body.data.alerts) expect(alert.demonstrationLabel).toBe('Demonstration data — not live');
      });
    }

    const missing = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => nearbySnapshot } });
    await withApi(createApp(missing), async ({ request }) => {
      const body = await (await request('/api/v1/stations/A12/board')).json();
      expect(body.data).toMatchObject({ mode: 'unavailable', directions: [], alerts: [] });
    });
  });

  test('applies exact board row filters without hiding relevant disruption warnings', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => operationalSnapshot } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/stations/A12/board?routes=C&direction=northbound');
      const body = await response.json();
      expect(body.data.directions).toHaveLength(1);
      expect(body.data.directions[0].primary.map((row: { route: { id: string } }) => row.route.id)).toEqual(['C']);
      expect(body.data.directions[0].secondary.map((row: { route: { id: string } }) => row.route.id)).toEqual(['C']);
      expect(body.data.alerts).toMatchObject([{ id: 'alert-a-north', routeIds: ['A'] }]);
    });
  });

  test('scopes board and status alerts by the selected station service before row filters', async () => {
    const alert = (id: string, routeIds: string[], stationIds: string[], text = id) => ({
      id, text, activeFrom: new Date('2026-08-04T11:45:00.000Z'), routeIds, stationIds,
      directions: ['northbound'], provenance: boardDecision.alerts[0].provenance,
    });
    const scoped = structuredClone(operationalSnapshot) as any;
    scoped.boards[0].decision.alerts = [
      alert('route-7-only', ['7'], []),
      alert('route-a', ['A'], []),
      alert('station-wide', [], ['A12']),
      alert('route-c-station', ['C'], ['A12']),
      alert('systemwide', [], []),
      alert('conflict', ['A'], [], 'first'),
      alert('conflict', ['A'], [], 'different'),
    ];
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => scoped } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const board = await (await request('/api/v1/stations/A12/board?routes=A&direction=northbound')).json();
      expect(board.data.alerts.map(({ id }: { id: string }) => id)).toEqual([
        'route-a', 'route-c-station', 'station-wide', 'systemwide',
      ]);

      const routeStatusResponse = await request('/api/v1/status?routes=A&direction=northbound');
      expect(routeStatusResponse.headers.get('x-subway-historical-cache')).toBe('public-v1');
      const routeStatus = await routeStatusResponse.json();
      expect(routeStatus.data.alerts.map(({ id }: { id: string }) => id)).toEqual([
        'route-a', 'station-wide', 'systemwide',
      ]);

      const stationStatus = await (await request('/api/v1/status?stationId=A12&routes=A&direction=northbound')).json();
      expect(stationStatus.data.alerts.map(({ id }: { id: string }) => id)).toEqual([
        'route-a', 'route-c-station', 'station-wide', 'systemwide',
      ]);
    });
  });

  test('keeps station-associated alerts whose board context serves a route-only status filter', async () => {
    const alert = (
      id: string,
      routeIds: string[],
      stationIds: string[],
      directions: string[] = ['northbound'],
    ) => ({
      id, text: id, activeFrom: new Date('2026-08-04T11:45:00.000Z'), routeIds, stationIds,
      directions, provenance: boardDecision.alerts[0].provenance,
    });
    const board = (id: string, routeIds: string[], alerts: unknown[]) => {
      const decision = structuredClone(boardDecision) as any;
      decision.station = { id, name: id, complexId: id, routeIds };
      decision.directions = [];
      decision.explanations = [];
      decision.alerts = alerts;
      return { decision, validThrough: '2026-08-04T12:01:30.000Z' };
    };
    const scoped = {
      ...operationalSnapshot,
      boards: [
        board('A12', ['A', 'C'], [
          alert('a-at-a12', ['A'], ['A12']),
          alert('c-at-a12', ['C'], ['A12']),
          alert('station-wide-a12', [], ['A12']),
          alert('a-southbound', ['A'], ['A12'], ['southbound']),
        ]),
        board('A15', ['A', 'D'], [
          alert('a-at-a15', ['A'], ['A15']),
          alert('station-wide-a15', [], ['A15']),
        ]),
        board('S01', ['7'], [
          alert('route-7-at-s01', ['7'], ['S01']),
          alert('station-wide-s01', [], ['S01']),
          alert('systemwide', [], []),
        ]),
      ],
    };
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => scoped } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const body = await (await request('/api/v1/status?routes=A&direction=northbound')).json();
      expect(body.data.alerts.map(({ id }: { id: string }) => id)).toEqual([
        'a-at-a12', 'a-at-a15', 'station-wide-a12', 'station-wide-a15', 'systemwide',
      ]);
    });
  });

  test('keeps rerouted route alerts when the associated station does not statically serve that route', async () => {
    const alert = (id: string, routeIds: string[], stationIds: string[], directions = ['northbound']) => ({
      id, text: id, activeFrom: new Date('2026-08-04T11:45:00.000Z'), routeIds, stationIds,
      directions, provenance: boardDecision.alerts[0].provenance,
    });
    const rerouted = structuredClone(boardDecision) as any;
    rerouted.station = { id: 'E01', name: 'E-only station', complexId: 'E01', routeIds: ['E'] };
    rerouted.directions = [];
    rerouted.explanations = [];
    rerouted.alerts = [
      alert('reroute-f-at-e', ['F'], ['E01']),
      alert('reroute-f-other-target', ['F'], ['X99']),
      alert('route-c-at-e', ['C'], ['E01']),
      alert('f-southbound', ['F'], ['E01'], ['southbound']),
      alert('station-wide-e', [], ['E01']),
      alert('systemwide', [], []),
    ];
    const snapshot = {
      ...operationalSnapshot,
      boards: [{ decision: rerouted, validThrough: '2026-08-04T12:01:30.000Z' }],
    };
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => snapshot } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const body = await (await request('/api/v1/status?routes=F&direction=northbound')).json();
      expect(body.data.alerts.map(({ id }: { id: string }) => id)).toEqual([
        'reroute-f-at-e', 'reroute-f-other-target', 'systemwide',
      ]);
    });
  });

  test('returns scoped service status without train rows and preserves route-filtered warnings', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => operationalSnapshot } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/status?stationId=A12&routes=C&direction=northbound');
      expect(response.headers.get('cache-control')).toBe('no-store');
      const body = await response.json();
      expect(body).toMatchObject({
        runtime: { surface: 'demonstration', availability: 'available' },
        data: { alerts: [{ id: 'alert-a-north', routeIds: ['A'], demonstrationLabel: 'Demonstration data — not live' }] },
      });
      expect(JSON.stringify(body.data)).not.toMatch(/train-a|primary|secondary/);
    });
  });

  test('serves only validation map reference editions as immutable app-owned vector data', async () => {
    const validationDependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), mapReferences });
    await withApi(createApp(validationDependencies), async ({ request }) => {
      const response = await request('/api/v1/maps/day/reference/map-day-2026-08-04');
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
      const body = await response.json();
      expect(body).toMatchObject({
        apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'map-day-2026-08-04',
        demonstrationLabel: 'Demonstration data — not live',
        data: { theme: 'day', attribution: 'Unofficial app-owned subway reference geometry', features: [{ id: 'line-a' }] },
      });
      expect(JSON.stringify(body)).not.toMatch(/mta logo|crowding|occupancy/i);
    });

    const liveDependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), mapReferences });
    await withApi(createApp(liveDependencies), async ({ request }) => {
      const response = await request('/api/v1/maps/day/reference/map-day-2026-08-04');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toMatchObject({
        runtime: { mode: 'live', surface: 'public', availability: 'locked' },
        gateDecision: { exposed: false, reasonCode: 'MAP_RIGHTS_NOT_DOCUMENTED' }, data: null,
      });
    });
  });

  test('serves a separately governed current map overlay from one validation snapshot', async () => {
    const capture = vi.fn(() => operationalSnapshot);
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), mapReferences, snapshotProvider: { capture } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/maps/day/overlay');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-subway-historical-cache')).toBe('public-v1');
      const body = await response.json();
      expect(body).toMatchObject({
        demonstrationLabel: 'Demonstration data — not live',
        data: {
          theme: 'day', serviceEpoch: 'overlay-7',
          segments: [{ id: 'segment-a-uptown', routeIds: ['A'], state: 'normal', alertIds: [] }],
          sourceOwners: [{
            source: 'gtfs-rt', sourceId: 'mta-realtime-ace',
            observedAt: '2026-08-04T11:59:58.000Z', retrievedAt: '2026-08-04T11:59:59.000Z',
            lastAcceptedAt: '2026-08-04T11:59:59.000Z', assessedAt: '2026-08-04T12:00:00.000Z',
          }],
        },
      });
      expect(capture).toHaveBeenCalledTimes(1);
    });
  });

  test.each([
    ['missing owner', (snapshot: any) => { snapshot.mapOverlays[0].sourceOwners[0].sourceId = 'subway-alerts'; }],
    ['duplicate owner', (snapshot: any) => {
      snapshot.mapOverlays[0].sourceOwners.push(structuredClone(snapshot.mapOverlays[0].sourceOwners[0]));
    }],
    ['ambiguous provenance', (snapshot: any) => {
      snapshot.provenance.push(structuredClone(snapshot.provenance[0]));
    }],
    ['ambiguous health', (snapshot: any) => {
      snapshot.sourceHealth.push(structuredClone(snapshot.sourceHealth[0]));
    }],
    ['unavailable owner', (snapshot: any) => {
      snapshot.sourceHealth.find((row: any) => row.sourceId === 'subway-rt-ace').state = 'unavailable';
    }],
    ['stale owner', (snapshot: any) => {
      const provenance = snapshot.provenance.find((row: any) => row.sourceId === 'subway-rt-ace');
      const health = snapshot.sourceHealth.find((row: any) => row.sourceId === 'subway-rt-ace');
      provenance.observedAt = '2026-08-04T10:00:00.000Z';
      provenance.retrievedAt = '2026-08-04T10:00:01.000Z';
      health.assessedAt = '2026-08-04T12:00:00.000Z';
      health.lastAcceptedAt = '2026-08-04T10:00:01.000Z';
    }],
    ['stale observation hidden by a fresh retrieval', (snapshot: any) => {
      snapshot.provenance.find((row: any) => row.sourceId === 'subway-rt-ace').observedAt = '2026-08-04T10:00:00.000Z';
    }],
    ['current regular-GTFS owner', (snapshot: any) => {
      snapshot.mapOverlays[0].sourceOwners = [{ source: 'regular-gtfs', sourceId: 'regular-subway-gtfs' }];
      snapshot.provenance[0].source = 'regular-gtfs';
      snapshot.provenance[0].sourceId = 'regular-subway-gtfs';
      snapshot.sourceHealth[0].source = 'regular-gtfs';
      snapshot.sourceHealth[0].sourceId = 'regular-subway-gtfs';
    }],
    ['current practical-walk owner', (snapshot: any) => {
      snapshot.mapOverlays[0].sourceOwners = [{ source: 'practical-walk', sourceId: 'practical-walk' }];
      snapshot.provenance[0].source = 'practical-walk';
      snapshot.provenance[0].sourceId = 'practical-walk';
      snapshot.sourceHealth[0].source = 'practical-walk';
      snapshot.sourceHealth[0].sourceId = 'practical-walk';
    }],
    ['new epoch over stale owner', (snapshot: any) => {
      snapshot.mapOverlays[0].serviceEpoch = 'overlay-new-wrapper-epoch';
      const provenance = snapshot.provenance.find((row: any) => row.sourceId === 'subway-rt-ace');
      const health = snapshot.sourceHealth.find((row: any) => row.sourceId === 'subway-rt-ace');
      provenance.observedAt = '2026-08-04T10:00:00.000Z';
      provenance.retrievedAt = '2026-08-04T10:00:01.000Z';
      health.lastAcceptedAt = '2026-08-04T10:00:01.000Z';
    }],
    ['one stale owner in a composite', (snapshot: any) => {
      snapshot.mapOverlays[0].sourceOwners.push({ source: 'alerts', sourceId: 'subway-alerts' });
      snapshot.provenance.push({
        source: 'alerts', sourceId: 'subway-alerts', observedAt: '2026-08-04T10:00:00.000Z',
        retrievedAt: '2026-08-04T10:00:01.000Z', version: 'alerts-old',
      });
      snapshot.sourceHealth.push({
        source: 'alerts', sourceId: 'subway-alerts', state: 'current', assessedAt: '2026-08-04T12:00:00.000Z',
        lastAcceptedAt: '2026-08-04T10:00:01.000Z',
      });
    }],
    ['duplicate theme overlay', (snapshot: any) => {
      snapshot.mapOverlays.push(structuredClone(snapshot.mapOverlays[0]));
    }],
  ])('fails the Actual-now overlay closed for a %s', async (_label, mutate) => {
    const snapshot = structuredClone(operationalSnapshot) as any;
    mutate(snapshot);
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), mapReferences, snapshotProvider: { capture: () => snapshot } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const body = await (await request('/api/v1/maps/day/overlay')).json();
      expect(body.data).toEqual({ theme: 'day', serviceEpoch: null, segments: [], sourceOwners: [] });
    });
  });

  test('owns an immutable structural journey graph through the exact bootstrap content version', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT),
      snapshotProvider: { capture: () => journeySnapshot },
    });

    await withApi(createApp(dependencies), async ({ request }) => {
      const bootstrap = await (await request('/api/v1/bootstrap')).json();
      const contentVersion = bootstrap.data.contentVersions.journeyGraph;
      expect(contentVersion).toMatch(/^journey-graph-/);

      const response = await request(`/api/v1/journeys/reference/${contentVersion}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toMatch(/public/);
      expect(response.headers.get('cache-control')).toMatch(/immutable/);
      const body = await response.json();
      expect(body).toMatchObject({
        contentVersion,
        demonstrationLabel: 'Demonstration data — not live',
        data: {
          contentVersion,
          graph: {
            patterns: [{
              current: { status: 'missing', serviceDecision: 'unknown' },
              future: [],
              offline: { schedule: 'missing', serviceDecision: 'unknown' },
            }],
          },
        },
      });
      expect(JSON.stringify(body.data.graph)).not.toMatch(/arrivalSeconds|current-supplemented|admitted/);
      expect((await request('/api/v1/journeys/reference/not-this-version')).status).toBe(404);
    });
  });

  test.each(['live', 'shadow'] as const)(
    'locks the non-empty %s journey graph before snapshot access while the nearby-offline gate is closed',
    async (mode) => {
      const capture = vi.fn(() => journeySnapshot);
      const contentVersion = createJourneyGraphReference(journeyGraph).contentVersion;
      const dependencies = createProductionDependencies({
        dataDirectory: '.data-test-do-not-read', mode, sources: {},
      }, {
        clock: createFixedClock(DECIDED_AT),
        snapshotProvider: { capture },
      });

      await withApi(createApp(dependencies), async ({ request }) => {
        const response = await request(`/api/v1/journeys/reference/${contentVersion}`);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(body).toMatchObject({
          runtime: { mode, surface: 'public', availability: 'locked' },
          gateDecision: { exposed: false, reasonCode: 'NEARBY_GATE_0_NOT_PASSED' },
          data: null,
        });
        expect(body).not.toHaveProperty('contentVersion');
        expect(body).not.toHaveProperty('demonstrationLabel');
        expect(JSON.stringify(body)).not.toMatch(/nodes|patterns|transfers|occurrence-origin|pattern-a/);
        expect(capture).not.toHaveBeenCalled();
      });
    },
  );

  test.each([
    ['online-current', undefined, 'planned', undefined],
    ['online-future', '2026-08-08', 'planned', undefined],
    ['offline-reference', undefined, 'planned', 'Reference itinerary'],
  ] as const)('plans %s journeys from one coherent validation graph', async (mode, serviceDate, kind, label) => {
    const now = vi.fn(() => new Date(DECIDED_AT));
    const capture = vi.fn(() => journeySnapshot);
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: { now }, snapshotProvider: { capture } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/journeys', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode, originStationId: 'A12', destinationStationId: 'A15', requiredFirstDirection: 'northbound',
          requiredActualDestination: 'Inwood–207 St', accessibleRouteOnly: false,
          ...(serviceDate ? { serviceDate } : {}),
        }),
      });
      expect(response.headers.get('cache-control')).toBe('no-store');
      const body = await response.json();
      expect(body).toMatchObject({
        demonstrationLabel: 'Demonstration data — not live',
        gateDecision: { exposed: false, reasonCode: 'NEARBY_GATE_0_NOT_PASSED' },
        data: { kind, ...(label ? { label } : {}) },
      });
      expect(body.data.itineraries[0].legs[0]).toMatchObject({
        routeId: 'A', direction: 'northbound', actualDestination: 'Inwood–207 St',
      });
      expect(now).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(body)).not.toMatch(/latitude|longitude|coordinate|activeTrip|cursor/i);
    });
  });

  test('fails Accessible Route Only closed when the graph has no complete verified chain', async () => {
    const inaccessibleGraph = {
      ...journeyGraph,
      patterns: journeyGraph.patterns.map((pattern, index) => index === 0
        ? { ...pattern, accessibility: 'unknown' as const }
        : pattern),
    };
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT),
      snapshotProvider: { capture: () => ({ ...journeySnapshot, journeyGraph: inaccessibleGraph }) },
    });

    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/journeys', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15',
          requiredFirstDirection: 'northbound', requiredActualDestination: 'Inwood–207 St', accessibleRouteOnly: true,
        }),
      });
      expect(await response.json()).toMatchObject({ data: { kind: 'unavailable', reason: 'no-verified-accessible-path' } });
    });
  });

  test('enforces the 2,048-byte URL boundary before routing', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });
    await withApi(createApp(dependencies), async ({ request }) => {
      const prefix = '/api/v1/';
      const exact = prefix + 'x'.repeat(2_048 - Buffer.byteLength(prefix));
      const over = `${exact}x`;
      expect((await request(exact)).status).toBe(404);
      const response = await request(over);
      expect(response.status).toBe(414);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({ error: { code: 'uri_too_long', message: 'Request could not be processed.' } });
    });
  });

  test('enforces the 16 KiB JSON boundary and rejects malformed or repeated object fields generically', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });
    await withApi(createApp(dependencies), async ({ request }) => {
      const bodyAt = (bytes: number) => `{"padding":"${'x'.repeat(bytes - Buffer.byteLength('{"padding":""}'))}"}`;
      const exact = await request('/api/v1/journeys', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: bodyAt(16 * 1_024),
      });
      expect(exact.status).toBe(400);
      const over = await request('/api/v1/journeys', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: bodyAt(16 * 1_024 + 1),
      });
      expect(over.status).toBe(413);
      expect(over.headers.get('cache-control')).toBe('no-store');

      for (const raw of [
        '{"location":{"latitude":40.7,"longitude":-74,"accuracyMeters":12},"accessibleRouteOnly":false,"accessibleRouteOnly":true}',
        '{"location":{"latitude":NaN,"longitude":-74,"accuracyMeters":12},"accessibleRouteOnly":false}',
        '{"location":{"latitude":91,"longitude":-74,"accuracyMeters":12},"accessibleRouteOnly":false}',
        '{"location":{"latitude":40.7,"longitude":-74,"accuracyMeters":12},"accessibleRouteOnly":false,"__proto__":{"admin":true}}',
      ]) {
        const response = await request('/api/v1/nearby', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: raw,
        });
        expect(response.status).toBe(400);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.json()).toEqual({ error: { code: 'invalid_request', message: 'Request could not be processed.' } });
      }
    });
  });

  test('bounds search text and result limits with exact unknown and repeated query rejection', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), catalog: catalogFixture });
    await withApi(createApp(dependencies), async ({ request }) => {
      const invalidPaths = [
        '/api/v1/stations/search?q=',
        `/api/v1/stations/search?q=${encodeURIComponent('a'.repeat(101))}`,
        `/api/v1/stations/search?q=${encodeURIComponent('🙂'.repeat(65))}`,
        '/api/v1/stations/search?q=canal%0A',
        '/api/v1/stations/search?q=canal&limit=0',
        '/api/v1/stations/search?q=canal&limit=26',
        '/api/v1/stations/search?q=canal&limit=1.5',
        '/api/v1/stations/search?q=canal&limit=1&limit=2',
        '/api/v1/stations/search?q=canal&unknown=true',
      ];
      for (const path of invalidPaths) {
        const response = await request(path);
        expect(response.status, path).toBe(400);
        expect(response.headers.get('cache-control')).toBe('no-store');
      }
    });
  });

  test('bounds exact station, route, direction, and map identifiers and filter cardinality', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => operationalSnapshot } });
    await withApi(createApp(dependencies), async ({ request }) => {
      const invalidPaths = [
        `/api/v1/stations/${'A'.repeat(129)}/board`,
        '/api/v1/stations/A%20B/board',
        '/api/v1/stations/A12/board?routes=A,A',
        `/api/v1/stations/A12/board?routes=${Array.from({ length: 13 }, (_, index) => `R${index}`).join(',')}`,
        '/api/v1/stations/A12/board?routes=A%20',
        '/api/v1/stations/A12/board?routes=A&routes=C',
        '/api/v1/stations/A12/board?direction=up',
        '/api/v1/stations/A12/board?unknown=true',
        '/api/v1/maps/dusk/overlay',
      ];
      for (const path of invalidPaths) expect((await request(path)).status, path).toBe(400);
    });
  });

  test('rejects malformed, encoded structural, traversal, and double-encoded path tokens on loopback', async () => {
    const log = vi.fn();
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), logger: { log }, snapshotProvider: { capture: () => operationalSnapshot } });
    await withApi(createApp(dependencies), async ({ rawRequest }) => {
      const hostilePaths = [
        '/api/v1/stations/%E0%A4%A/board',
        '/api/v1/stations/A%2F12/board',
        '/api/v1/stations/A%5C12/board',
        '/api/v1/stations/A%2512/board',
        '/api/v1/stations/A%3F12/board',
        '/api/v1/stations/A%2312/board',
        '/api/v1/stations/%2E/board',
        '/api/v1/stations/%2E%2E/board',
        '/api/v1/stations/%252E%252E/board',
      ];
      for (const path of hostilePaths) {
        const response = await rawRequest(path);
        expect(response.status, path).toBe(400);
        expect(response.headers.get('cache-control'), path).toBe('no-store');
        expect(await response.json(), path).toEqual({
          error: { code: 'invalid_request', message: 'Request could not be processed.' },
        });
      }

      for (const path of ['/api/v1/stations/A12/board', '/api/v1/stations/R20N/board']) {
        expect((await rawRequest(path)).status, path).toBe(200);
      }
      expect(JSON.stringify(log.mock.calls)).not.toMatch(/%E0|%2F|%5C|%25|%3F|%23|\.\.|A12|R20N/i);
    });
  });

  test('requires UTF-8 JSON media types before POST parsing or locked handling', async () => {
    const log = vi.fn();
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), logger: { log } });
    const nearbyBody = JSON.stringify({
      location: { latitude: 40.700123, longitude: -74.000456, accuracyMeters: 12 }, accessibleRouteOnly: false,
    });
    const journeyBody = JSON.stringify({
      mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15',
      requiredFirstDirection: 'northbound', requiredActualDestination: 'credential-token-destination',
      accessibleRouteOnly: false,
    });
    await withApi(createApp(dependencies), async ({ rawRequest }) => {
      const cases = [
        ['/api/v1/nearby', nearbyBody, undefined],
        ['/api/v1/nearby', nearbyBody, 'text/plain'],
        ['/api/v1/nearby', nearbyBody, 'application/json; charset=iso-8859-1'],
        ['/api/v1/journeys', journeyBody, undefined],
        ['/api/v1/journeys', journeyBody, 'text/plain; charset=utf-8'],
      ] as const;
      for (const [path, body, contentType] of cases) {
        const response = await rawRequest(path, {
          method: 'POST', body, headers: contentType === undefined ? {} : { 'content-type': contentType },
        });
        expect(response.status, `${path} ${contentType ?? 'missing'}`).toBe(415);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.json()).toEqual({
          error: { code: 'unsupported_media_type', message: 'Request could not be processed.' },
        });
      }

      const valid = await rawRequest('/api/v1/nearby', {
        method: 'POST', body: nearbyBody, headers: { 'content-type': 'application/json; charset=UTF-8' },
      });
      expect(valid.status).toBe(200);
      expect((await valid.json()).runtime).toMatchObject({ mode: 'live', availability: 'locked' });
      expect(JSON.stringify(log.mock.calls)).not.toMatch(/40\.700123|-74\.000456|credential-token-destination|A12|A15/i);
    });
  });

  test('applies the same JSON media contract to Express trailing-slash operational routes only', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });
    const bodies = {
      '/api/v1/nearby/': JSON.stringify({
        location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false,
      }),
      '/api/v1/journeys/': JSON.stringify({
        mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false,
      }),
    } as const;
    await withApi(createApp(dependencies), async ({ rawRequest }) => {
      for (const [path, body] of Object.entries(bodies)) {
        for (const contentType of [undefined, 'text/plain'] as const) {
          const response = await rawRequest(path, {
            method: 'POST', body, headers: contentType === undefined ? {} : { 'content-type': contentType },
          });
          expect(response.status, `${path} ${contentType ?? 'missing'}`).toBe(415);
          expect(response.headers.get('cache-control')).toBe('no-store');
          expect(await response.json()).toEqual({
            error: { code: 'unsupported_media_type', message: 'Request could not be processed.' },
          });
        }

        const valid = await rawRequest(path, {
          method: 'POST', body, headers: { 'content-type': 'application/json' },
        });
        expect(valid.status, `${path} valid JSON`).toBe(200);
        expect((await valid.json()).runtime).toMatchObject({ mode: 'live', availability: 'locked' });

        const wrongMethod = await rawRequest(path);
        expect(wrongMethod.status, `${path} GET`).toBe(405);
        expect(wrongMethod.headers.get('allow')).toBe('POST');
      }

      for (const path of ['/api/v1/nearby//', '/api/v1/journeys//']) {
        const response = await rawRequest(path, {
          method: 'POST', body: '{}', headers: { 'content-type': 'application/json' },
        });
        expect(response.status, path).toBe(404);
      }
    });
  });

  test('returns JSON no-store 404/405 responses and exposes no server rider-state mutation endpoint', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });
    await withApi(createApp(dependencies), async ({ request }) => {
      const wrongMethod = await request('/api/v1/nearby');
      expect(wrongMethod.status).toBe(405);
      expect(wrongMethod.headers.get('allow')).toBe('POST');
      expect(wrongMethod.headers.get('cache-control')).toBe('no-store');

      for (const path of [
        '/api/v1/not-a-route', '/bootstrap', '/api/v1/active-trip', '/api/v1/saved',
        '/api/v1/cursor', '/api/v1/commute-windows',
      ]) {
        const response = await request(path, path.startsWith('/api/v1/') ? {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
        } : undefined);
        expect(response.status, path).toBe(404);
        expect(response.headers.get('cache-control'), path).toBe('no-store');
        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
      }
    });
  });

  test('rejects request attempts to select runtime mode while retaining startup ownership', async () => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }, { clock: createFixedClock(DECIDED_AT) });
    await withApi(createApp(dependencies), async ({ request }) => {
      const queryAttempt = await request('/api/v1/bootstrap?mode=validation');
      expect(queryAttempt.status).toBe(400);
      const headerAttempt = await request('/api/v1/bootstrap', {
        headers: { 'x-transit-runtime-mode': 'validation', cookie: 'mode=validation; validationFixtures=true' },
      });
      expect((await headerAttempt.json()).runtime.mode).toBe('live');

      const nearbyBodyAttempt = await request('/api/v1/nearby', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 },
          accessibleRouteOnly: false,
          runtimeMode: 'validation',
        }),
      });
      expect(nearbyBodyAttempt.status).toBe(400);

      const journeyBodyAttempt = await request('/api/v1/journeys', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15',
          requiredFirstDirection: 'northbound', requiredActualDestination: 'Inwoodâ€“207 St',
          accessibleRouteOnly: false, runtimeMode: 'validation',
        }),
      });
      expect(journeyBodyAttempt.status).toBe(400);
      expect((await request('/api/v1/maps/day/reference/not%20canonical')).status).toBe(400);
    });
  });

  test('recursively allowlists operational output and omits secrets, raw errors, rider coordinates, and all crowding proxies', async () => {
    const hostile = structuredClone(journeySnapshot) as any;
    hostile.sourceHealth[0].fetchUrl = 'https://secret.example/40.700123,-74.000456';
    hostile.sourceHealth[0].error = { stack: 'Error: upstream credential token-secret' };
    hostile.provenance[0].credential = 'token-secret';
    hostile.provenance[0].latitude = 40.700123;
    hostile.boards[0].decision.alerts[0].provenance.fetchUrl = 'https://secret.example/alerts';
    hostile.mapOverlays[0].segments[0].occupancy = 'standing room only';
    hostile.mapOverlays[0].segments[0].capacity = 100;
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT), nearbyUniverse, mapReferences,
      walk: async () => ({
        kind: 'available', source: 'practical-walk', sourceId: 'practical-walk',
        coverage: { kind: 'complete-universe' },
        results: [
          { destinationId: 'entrance-a12', range: { minimumSeconds: 500, maximumSeconds: 520 } },
          { destinationId: 'entrance-r20', range: { minimumSeconds: 100, maximumSeconds: 120 } },
        ],
      }),
      snapshotProvider: { capture: () => hostile },
    });

    await withApi(createApp(dependencies), async ({ request }) => {
      const responses = await Promise.all([
        request('/api/v1/stations/A12/board'),
        request('/api/v1/status?stationId=A12'),
        request('/api/v1/maps/day/overlay'),
        request('/api/v1/nearby', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ location: { latitude: 40.700123, longitude: -74.000456, accuracyMeters: 12 }, accessibleRouteOnly: false }),
        }),
        request('/api/v1/journeys', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15',
            requiredFirstDirection: 'northbound', requiredActualDestination: 'Inwood–207 St', accessibleRouteOnly: false,
          }),
        }),
      ]);
      const bodies = await Promise.all(responses.map((response) => response.json()));
      const serialized = JSON.stringify(bodies);
      expect(serialized).not.toMatch(/secret\.example|token-secret|Error: upstream|40\.700123|\-74\.000456/i);
      expect(serialized).not.toMatch(/crowding|occupancy|standing room|car.?load|loadFactor|seatsAvailable/i);
      for (const body of bodies) {
        expect(body.responseIdentity).toMatch(/^response:[a-f0-9]{64}$/);
        expect(body.demonstrationLabel).toBe('Demonstration data — not live');
        expect(Object.values(body.gates).every((gate: any) => gate.exposed === false)).toBe(true);
        walkObjects(body, (value) => {
          for (const key of Object.keys(value)) expect(key).not.toMatch(/^(?:crowding|capacity|occupancy|carLoad|car-load|loadFactor)$/i);
          if ('observedAt' in value && 'retrievedAt' in value) {
            const keys = Object.keys(value).sort();
            expect(keys).toEqual(expect.arrayContaining(['observedAt', 'retrievedAt', 'source', 'sourceId']));
            if ('lastAcceptedAt' in value || 'assessedAt' in value) {
              expect(keys).toEqual(['assessedAt', 'lastAcceptedAt', 'observedAt', 'retrievedAt', 'source', 'sourceId']);
            } else {
              expect(keys.every((key) => ['source', 'sourceId', 'observedAt', 'retrievedAt', 'version'].includes(key))).toBe(true);
            }
          }
        });
      }
    });
  });

  test('projects provenance values to fixed public handles without secret fingerprints', async () => {
    const run = async (marker: 'alpha' | 'beta') => {
      const secret = `https://user:token-${marker}@secret.example/40.700123/internal-version-${marker}`;
      const hostile = structuredClone(operationalSnapshot) as any;
      hostile.identity = secret;
      hostile.sourceHealth[0].sourceId = secret;
      hostile.sourceHealth[0].state = `state-${marker}`;
      hostile.sourceHealth[0].reasonCode = secret;
      hostile.provenance[0].sourceId = secret;
      hostile.provenance[0].version = secret;
      for (const direction of hostile.boards[0].decision.directions) {
        for (const row of [...direction.primary, ...direction.secondary]) {
          row.provenance.sourceId = secret;
          row.provenance.version = secret;
        }
      }
      hostile.boards[0].decision.directions[0].primary[0].provenance.sourceId = 'subway-rt-ace';
      hostile.boards[0].decision.directions[0].secondary[0].provenance.source = secret;
      hostile.boards[0].decision.alerts[0].provenance.sourceId = secret;
      hostile.boards[0].decision.alerts[0].provenance.version = secret;
      hostile.boards[0].decision.alerts[0].provenance.sourceId = 'subway-alerts';
      hostile.boards[0].decision.explanations[0].provenance = {
        source: secret, sourceId: secret,
        observedAt: new Date('2026-08-04T11:59:00.000Z'),
        retrievedAt: new Date('2026-08-04T11:59:30.000Z'), version: secret,
      };
      const log = vi.fn();
      const dependencies = createProductionDependencies({
        dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
      }, {
        clock: createFixedClock(DECIDED_AT), nearbyUniverse, logger: { log },
        walk: async () => ({
          kind: 'available', source: 'practical-walk', sourceId: secret,
          coverage: { kind: 'complete-universe' },
          results: [
            { destinationId: 'entrance-a12', range: { minimumSeconds: 500, maximumSeconds: 520 } },
            { destinationId: 'entrance-r20', range: { minimumSeconds: 100, maximumSeconds: 120 } },
          ],
        }),
        snapshotProvider: { capture: () => hostile },
      });
      return withApi(createApp(dependencies), async ({ request }) => {
        const board = await (await request('/api/v1/stations/A12/board')).json();
        const nearby = await (await request('/api/v1/nearby', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
        })).json();
        expect(JSON.stringify({ board, nearby, logs: log.mock.calls })).not.toMatch(
          /secret\.example|token-(?:alpha|beta)|40\.700123|internal-version|state-(?:alpha|beta)/i,
        );
        expect(board.sourceHealth[0]).toMatchObject({
          source: 'unavailable', sourceId: 'source-unavailable', state: 'unavailable', reasonCode: 'SOURCE_UNAVAILABLE',
        });
        expect(board.provenance[0]).toMatchObject({ source: 'unavailable', sourceId: 'source-unavailable' });
        expect(board.data.directions[0].primary[0].provenance.sourceId).toBe('mta-realtime-ace');
        expect(board.data.directions[0].secondary[0].provenance).toMatchObject({
          source: 'unavailable', sourceId: 'source-unavailable',
        });
        expect(board.data.alerts[0].provenance.sourceId).toBe('mta-service-alerts');
        expect(board.data.explanations[0].provenance).toMatchObject({
          source: 'unavailable', sourceId: 'source-unavailable',
        });
        expect(nearby.practicalWalkEvidence).toEqual({ kind: 'unavailable', reason: 'invalid' });
        expect(nearby.data).toMatchObject({ kind: 'picker', reason: 'walk-unavailable', cards: [] });
        for (const body of [board, nearby]) walkObjects(body, (value) => expect(value).not.toHaveProperty('version'));
        return { boardIdentity: board.responseIdentity, nearbyIdentity: nearby.responseIdentity };
      });
    };

    const alpha = await run('alpha');
    const beta = await run('beta');
    expect(alpha).toEqual(beta);

    const unsafeWalk = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT), nearbyUniverse,
      walk: async () => ({ kind: 'unavailable', reason: 'https://secret.example/token-gamma' } as any),
      snapshotProvider: { capture: () => nearbySnapshot },
    });
    await withApi(createApp(unsafeWalk), async ({ request }) => {
      const body = await (await request('/api/v1/nearby', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
      })).json();
      expect(body.practicalWalkEvidence).toEqual({ kind: 'unavailable', reason: 'invalid' });
      expect(JSON.stringify(body)).not.toMatch(/secret\.example|token-gamma/);
    });
  });

  test('keeps registered realtime feed groups diagnostically distinct and fails unknown IDs closed', async () => {
    const sourceHealth = ['subway-rt-bdfm', 'https://secret.example/token', 'subway-rt-ace'].map((sourceId) => ({
      source: 'gtfs-rt', sourceId, state: 'current' as const,
      assessedAt: '2026-08-04T11:59:58.000Z', lastAcceptedAt: '2026-08-04T11:59:58.000Z',
    }));
    const provenance = sourceHealth.map(({ source, sourceId }) => ({
      source, sourceId, observedAt: '2026-08-04T11:59:58.000Z', retrievedAt: '2026-08-04T11:59:59.000Z',
    }));
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT),
      snapshotProvider: { capture: () => ({ identity: 'registry-groups', sourceHealth, provenance }) },
    });
    await withApi(createApp(dependencies), async ({ request }) => {
      const body = await (await request('/api/v1/bootstrap')).json();
      expect(body.sourceHealth.map(({ sourceId }: { sourceId: string }) => sourceId)).toEqual([
        'mta-realtime-ace', 'mta-realtime-bdfm', 'source-unavailable',
      ]);
      expect(body.provenance.map(({ sourceId }: { sourceId: string }) => sourceId)).toEqual([
        'mta-realtime-ace', 'mta-realtime-bdfm', 'source-unavailable',
      ]);
      expect(JSON.stringify(body)).not.toMatch(/secret\.example|token/);
    });
  });

  test('projects alert, explanation, and uncertain-reason copy as inert normalized plain text', async () => {
    const hostile = structuredClone(operationalSnapshot) as any;
    hostile.boards[0].decision.alerts[0].text = '<script>credential-token</script>A <b>trains</b>\n delayed.';
    hostile.boards[0].decision.explanations[0].message = '<style>secret-style</style>Review <i>service</i>\u0000';
    hostile.boards[0].decision.directions[0].secondary[1].reason = '<script>secret-reason</script>Movement <b>unknown</b>';
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), snapshotProvider: { capture: () => hostile } });
    await withApi(createApp(dependencies), async ({ request }) => {
      const body = await (await request('/api/v1/stations/A12/board')).json();
      expect(body.data.alerts[0].text).toBe('A trains delayed.');
      expect(body.data.explanations[0].message).toBe('Review service');
      expect(body.data.directions[0].secondary[1].reason).toBe('Movement unknown');
      expect(JSON.stringify(body)).not.toMatch(/<|>|credential-token|secret-style|secret-reason|\\u0000/i);
    });
  });

  test.each(['live', 'shadow'] as const)('keeps every %s operational surface locked and non-public', async (mode) => {
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode, sources: {},
    }, {
      clock: createFixedClock(DECIDED_AT), nearbyUniverse, mapReferences,
      snapshotProvider: { capture: () => journeySnapshot },
    });
    await withApi(createApp(dependencies), async ({ request }) => {
      const responses = await Promise.all([
        request('/api/v1/stations/A12/board'),
        request('/api/v1/status?stationId=A12'),
        request('/api/v1/maps/day/overlay'),
        request('/api/v1/maps/day/reference/map-day-2026-08-04'),
        request(`/api/v1/journeys/reference/${createJourneyGraphReference(journeyGraph).contentVersion}`),
        request('/api/v1/nearby', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
        }),
        request('/api/v1/journeys', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15',
            requiredFirstDirection: 'northbound', requiredActualDestination: 'Inwood–207 St', accessibleRouteOnly: false,
          }),
        }),
      ]);
      for (const response of responses) {
        const body = await response.json();
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('x-subway-historical-cache')).toBeNull();
        expect(body.runtime).toMatchObject({ mode, surface: 'public', availability: 'locked' });
        expect(body.data).toBeNull();
        expect(body).not.toHaveProperty('demonstrationLabel');
        expect(Object.values(body.gates).every((gate: any) => gate.exposed === false)).toBe(true);
        expect(JSON.stringify(body)).not.toMatch(/train-a|alert-a-north|snapshot-operational|snapshot-journey/);
      }
    });
  });

  test('logs only an allowlisted coordinate-free rejection event', async () => {
    const log = vi.fn();
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: createFixedClock(DECIDED_AT), logger: { log } });
    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/nearby', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: '{"location":{"latitude":40.700123,"longitude":-74.000456,"accuracyMeters":12},"accessibleRouteOnly":false,}',
      });
      expect(response.status).toBe(400);
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith({ event: 'request_rejected', method: 'POST', status: 400, code: 'invalid_request' });
      expect(JSON.stringify(log.mock.calls)).not.toMatch(/40\.700123|\-74\.000456|location|body|query|stack|error/i);
    });
  });

  test('waits for walking, then uses one clock and one post-update snapshot without mixing source epochs', async () => {
    const oldSnapshot: DecisionSnapshot = {
      ...nearbySnapshot,
      identity: 'snapshot-before-walk',
      sourceHealth: [{ ...nearbySnapshot.sourceHealth[0], sourceId: 'subway-rt-ace' }],
      provenance: [{ ...nearbySnapshot.provenance[0], sourceId: 'subway-rt-ace' }],
    };
    const newSnapshot: DecisionSnapshot = {
      ...nearbySnapshot,
      identity: 'snapshot-after-walk',
      sourceHealth: [{ ...nearbySnapshot.sourceHealth[0], sourceId: 'subway-rt-bdfm' }],
      provenance: [{ ...nearbySnapshot.provenance[0], sourceId: 'subway-rt-bdfm' }],
      nearby: {
        ...nearbySnapshot.nearby,
        complexes: nearbySnapshot.nearby.complexes.map((value) => value.id === 'R20'
          ? { ...value, name: 'Canal St — new epoch' }
          : value),
      },
    };
    let current: DecisionSnapshot = oldSnapshot;
    let releaseWalk!: () => void;
    const walkBarrier = new Promise<void>((resolve) => { releaseWalk = resolve; });
    const events: string[] = [];
    const walk = vi.fn(async () => {
      events.push('walk');
      await walkBarrier;
      return {
        kind: 'available' as const, source: 'practical-walk' as const, sourceId: 'practical-walk',
        coverage: { kind: 'complete-universe' as const },
        results: [
          { destinationId: 'entrance-a12', range: { minimumSeconds: 500, maximumSeconds: 520 } },
          { destinationId: 'entrance-r20', range: { minimumSeconds: 100, maximumSeconds: 120 } },
        ],
      };
    });
    const now = vi.fn(() => { events.push('clock'); return new Date(DECIDED_AT); });
    const capture = vi.fn(() => { events.push('capture'); return current; });
    const dependencies = createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {},
    }, { clock: { now }, nearbyUniverse, walk, snapshotProvider: { capture } });

    await withApi(createApp(dependencies), async ({ request }) => {
      const pending = request('/api/v1/nearby', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false }),
      });
      while (walk.mock.calls.length === 0) await new Promise((resolve) => setTimeout(resolve, 1));
      expect(now).not.toHaveBeenCalled();
      expect(capture).not.toHaveBeenCalled();
      current = newSnapshot;
      releaseWalk();
      const body = await (await pending).json();
      expect(events).toEqual(['walk', 'clock', 'capture']);
      expect(now).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledTimes(1);
      expect(body).toMatchObject({
        sourceHealth: [{ sourceId: 'mta-realtime-bdfm' }],
        provenance: [{ sourceId: 'mta-realtime-bdfm' }],
        practicalWalkEvidence: {
          kind: 'available',
          source: 'practical-walk',
          sourceId: 'audited-practical-walk',
          coverage: { kind: 'complete-universe' },
        },
        data: { cards: expect.any(Array) },
      });
      expect(body.data.cards[0]).toMatchObject({ complexId: 'R20', complexName: 'Canal St — new epoch' });
      expect(JSON.stringify(body)).not.toContain('mta-realtime-ace');

      events.length = 0;
      const bootstrap = await (await request('/api/v1/bootstrap')).json();
      expect(events).toEqual(['clock', 'capture']);
      expect(bootstrap.sourceHealth).toMatchObject([{ sourceId: 'mta-realtime-bdfm' }]);
      expect(bootstrap.provenance).toMatchObject([{ sourceId: 'mta-realtime-bdfm' }]);
      expect(bootstrap.data.contentVersions).toEqual({
        stationCatalog: 'validation-catalog-2026-08-04-v2',
        maps: {
          day: 'validation-map-day-2026-08-04-v2',
          night: 'validation-map-night-2026-08-04-v2',
        },
        journeyGraph: expect.stringMatching(/^journey-graph-/),
      });
    });
  });
});

function walkObjects(value: unknown, visit: (value: Record<string, unknown>) => void): void {
  if (!value || typeof value !== 'object') return;
  if (!Array.isArray(value)) visit(value as Record<string, unknown>);
  for (const child of Object.values(value)) walkObjects(child, visit);
}
