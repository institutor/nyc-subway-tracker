import type { Express } from 'express';
import { describe, expect, test } from 'vitest';

import { createApp } from '../../src/server/app';
import { createProductionDependencies } from '../../src/server/bootstrap';
import { createSubscriptionStore } from '../../src/server/notifications/subscription-store';
import { createFixedClock } from '../../src/shared/domain/clock';
import type { CommuteWindowRegistration } from '../../src/shared/domain/commute-window';
import { withApi } from '../helpers/api-harness';

const DECIDED_AT = new Date('2026-08-10T14:00:00.000Z');
const CLEANUP_ENDPOINT = 'https://push.example/truthful-cleanup';
const REJECTED_ENDPOINT = 'https://push.example/create-must-stay-locked';

const expectedRegisteredOperations = [
  'DELETE /api/v1/notifications/subscriptions',
  'GET /api/v1/bootstrap',
  'GET /api/v1/journeys/reference/:contentVersion',
  'GET /api/v1/maps/:theme/overlay',
  'GET /api/v1/maps/:theme/reference/:contentVersion',
  'GET /api/v1/notifications/vapid-public-key',
  'GET /api/v1/stations/:stationId/board',
  'GET /api/v1/stations/catalog/:contentVersion',
  'GET /api/v1/stations/search',
  'GET /api/v1/status',
  'POST /api/v1/journeys',
  'POST /api/v1/nearby',
  'POST /api/v1/notifications/subscriptions',
  'POST /api/v1/notifications/subscriptions/status',
] as const;

const routePolicies = [
  {
    operation: 'GET /api/v1/bootstrap', path: '/api/v1/bootstrap', kind: 'bootstrap',
    expectedStatus: 200, expectedCacheControl: 'no-store',
  },
  {
    operation: 'GET /api/v1/stations/catalog/:contentVersion', path: '/api/v1/stations/catalog/catalog-empty-v1',
    kind: 'catalog', expectedStatus: 200, expectedCacheControl: 'public, max-age=31536000, immutable',
  },
  {
    operation: 'GET /api/v1/stations/search', path: '/api/v1/stations/search?q=empty&limit=25', kind: 'search',
    expectedStatus: 200, expectedCacheControl: 'no-store',
  },
  {
    operation: 'GET /api/v1/stations/:stationId/board', path: '/api/v1/stations/A12/board', kind: 'locked-envelope',
    expectedStatus: 200, expectedCacheControl: 'no-store',
  },
  {
    operation: 'POST /api/v1/nearby', path: '/api/v1/nearby', kind: 'locked-envelope',
    expectedStatus: 200, expectedCacheControl: 'no-store',
    init: jsonRequest('POST', {
      location: { latitude: 40.7, longitude: -74, accuracyMeters: 12 }, accessibleRouteOnly: false,
    }),
  },
  {
    operation: 'GET /api/v1/status', path: '/api/v1/status?stationId=A12', kind: 'locked-envelope',
    expectedStatus: 200, expectedCacheControl: 'no-store',
  },
  {
    operation: 'GET /api/v1/maps/:theme/reference/:contentVersion', path: '/api/v1/maps/day/reference/map-day-empty-v1',
    kind: 'locked-envelope', expectedStatus: 200, expectedCacheControl: 'no-store',
  },
  {
    operation: 'GET /api/v1/maps/:theme/overlay', path: '/api/v1/maps/day/overlay', kind: 'locked-envelope',
    expectedStatus: 200, expectedCacheControl: 'no-store',
  },
  {
    operation: 'GET /api/v1/journeys/reference/:contentVersion', path: '/api/v1/journeys/reference/journey-graph-empty-v1',
    kind: 'locked-envelope', expectedStatus: 200, expectedCacheControl: 'no-store',
  },
  {
    operation: 'POST /api/v1/journeys', path: '/api/v1/journeys', kind: 'locked-envelope',
    expectedStatus: 200, expectedCacheControl: 'no-store',
    init: jsonRequest('POST', {
      mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15',
      requiredFirstDirection: 'northbound', requiredActualDestination: 'Inwood-207 St', accessibleRouteOnly: false,
    }),
  },
  {
    operation: 'GET /api/v1/notifications/vapid-public-key', path: '/api/v1/notifications/vapid-public-key',
    kind: 'notification-locked', expectedStatus: 423, expectedCacheControl: 'no-store',
  },
  {
    operation: 'POST /api/v1/notifications/subscriptions', path: '/api/v1/notifications/subscriptions',
    kind: 'notification-locked', expectedStatus: 423, expectedCacheControl: 'no-store',
    init: jsonRequest('POST', {
      endpoint: REJECTED_ENDPOINT,
      keys: { p256dh: 'p256dh-secret-marker', auth: 'auth-secret-marker' },
      commuteWindows: [registration('rejected-window')],
    }),
  },
  {
    operation: 'POST /api/v1/notifications/subscriptions/status', path: '/api/v1/notifications/subscriptions/status',
    kind: 'notification-locked', expectedStatus: 423, expectedCacheControl: 'no-store',
    init: jsonRequest('POST', { endpoint: CLEANUP_ENDPOINT, commuteWindows: [registration('cleanup-window')] }),
  },
  {
    operation: 'DELETE /api/v1/notifications/subscriptions', path: '/api/v1/notifications/subscriptions',
    kind: 'cleanup', expectedStatus: 200, expectedCacheControl: 'no-store',
    init: jsonRequest('DELETE', { endpoint: CLEANUP_ENDPOINT }),
  },
] as const;

const methodPolicies = [
  { path: '/api/v1/bootstrap', allow: 'GET' },
  { path: '/api/v1/stations/catalog/catalog-empty-v1', allow: 'GET' },
  { path: '/api/v1/stations/search?q=empty', allow: 'GET' },
  { path: '/api/v1/stations/A12/board', allow: 'GET' },
  { path: '/api/v1/nearby', allow: 'POST' },
  { path: '/api/v1/status', allow: 'GET' },
  { path: '/api/v1/maps/day/reference/map-day-empty-v1', allow: 'GET' },
  { path: '/api/v1/maps/day/overlay', allow: 'GET' },
  { path: '/api/v1/journeys/reference/journey-graph-empty-v1', allow: 'GET' },
  { path: '/api/v1/journeys', allow: 'POST' },
  { path: '/api/v1/notifications/vapid-public-key', allow: 'GET' },
  { path: '/api/v1/notifications/subscriptions', allow: 'POST, DELETE' },
  { path: '/api/v1/notifications/subscriptions/status', allow: 'POST' },
] as const;

const expectedGateNames = [
  'accessibility',
  'arrival-boards',
  'commute-delivery',
  'commute-evaluation',
  'commute-limited-pilot',
  'commute-silent',
  'guidance',
  'maps-rights',
  'nearby-offline',
] as const;

describe('public gate endpoint policy matrix', () => {
  test('governs every registered API operation with an explicit route policy', () => {
    const app = createApp(createProductionDependencies({
      dataDirectory: '.data-test-do-not-read', mode: 'live', sources: {},
    }));

    expect(registeredOperations(app)).toEqual(expectedRegisteredOperations);
    expect(routePolicies.map(({ operation }) => operation).sort()).toEqual(expectedRegisteredOperations);
  });

  test.each(['live', 'shadow'] as const)(
    'keeps the exhaustive %s endpoint and method matrix closed by default',
    async (mode) => {
      const subscriptions = createSubscriptionStore();
      subscriptions.upsert({
        endpoint: CLEANUP_ENDPOINT,
        keys: { p256dh: 'cleanup-p256dh-secret-marker', auth: 'cleanup-auth-secret-marker' },
        commuteWindows: [registration('cleanup-window')],
      });
      const dependencies = createProductionDependencies({
        dataDirectory: '.data-test-do-not-read', mode, sources: {},
      }, {
        clock: createFixedClock(DECIDED_AT),
        snapshotProvider: {
          capture: () => ({
            identity: 'operational-secret-marker', sourceHealth: [], provenance: [],
            boards: [{ decision: { secret: 'board-secret-marker' }, validThrough: DECIDED_AT.toISOString() }] as never,
            mapOverlays: [{ secret: 'overlay-secret-marker' }] as never,
          }),
        },
        notifications: {
          stage: 'disabled', publicKey: 'forbidden-public-key-marker', subscriptions,
        },
      });

      await withApi(createApp(dependencies), async ({ request }) => {
        for (const policy of routePolicies) {
          const response = await request(policy.path, 'init' in policy ? policy.init : undefined);
          expect(response.status, policy.operation).toBe(policy.expectedStatus);
          expect(response.headers.get('cache-control'), policy.operation).toBe(policy.expectedCacheControl);
          const body = await response.json();

          if (policy.kind === 'bootstrap') assertBootstrap(body, mode);
          if (policy.kind === 'catalog') {
            expect(body).toEqual({
              apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-empty-v1',
              data: { complexes: [] },
            });
          }
          if (policy.kind === 'search') {
            expect(body).toEqual({
              apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-empty-v1',
              query: 'empty', results: [],
            });
          }
          if (policy.kind === 'locked-envelope') assertLockedEnvelope(body, mode);
          if (policy.kind === 'notification-locked') expect(body).toEqual({ availability: 'locked' });
          if (policy.kind === 'cleanup') expect(body).toEqual({ subscribed: false, removed: true });

          expect(JSON.stringify(body), policy.operation).not.toMatch(
            /Demonstration data|operational-secret-marker|board-secret-marker|overlay-secret-marker|forbidden-public-key-marker|p256dh-secret-marker|auth-secret-marker|create-must-stay-locked/,
          );
          if (policy.kind === 'notification-locked') expect(subscriptions.size).toBe(1);
          if (policy.operation === 'POST /api/v1/notifications/subscriptions') {
            expect(subscriptions.get(REJECTED_ENDPOINT)).toBeUndefined();
          }
          if (policy.operation === 'DELETE /api/v1/notifications/subscriptions') expect(subscriptions.size).toBe(0);
        }

        expect(subscriptions.get(REJECTED_ENDPOINT)).toBeUndefined();
        for (const policy of methodPolicies) {
          const response = await request(policy.path, { method: 'PUT' });
          expect(response.status, policy.path).toBe(405);
          expect(response.headers.get('allow'), policy.path).toBe(policy.allow);
          expect(response.headers.get('cache-control'), policy.path).toBe('no-store');
          expect(await response.json(), policy.path).toEqual({
            error: { code: 'method_not_allowed', message: 'Request method is not allowed.' },
          });
        }
      });
    },
  );
});

function assertBootstrap(body: any, mode: 'live' | 'shadow'): void {
  expect(Object.keys(body).sort()).toEqual([
    'apiVersion', 'data', 'decidedAt', 'gates', 'provenance', 'responseIdentity', 'runtime', 'schemaVersion',
    'serverTime', 'sourceHealth',
  ]);
  expect(body).toMatchObject({
    apiVersion: 'v1', schemaVersion: '2026-08-04',
    decidedAt: DECIDED_AT.toISOString(), serverTime: DECIDED_AT.toISOString(),
    runtime: { mode, surface: 'public', availability: 'available' },
    sourceHealth: [], provenance: [],
    data: {
      productName: 'NYC Subway Tracker', unofficial: true,
      contentVersions: {
        stationCatalog: 'catalog-empty-v1',
        maps: { day: 'map-day-empty-v1', night: 'map-night-empty-v1' },
        journeyGraph: expect.stringMatching(/^journey-graph-[a-f0-9]{64}$/),
      },
    },
  });
  expect(Object.keys(body.data).sort()).toEqual(['contentVersions', 'productName', 'unofficial']);
  assertClosedGates(body.gates);
}

function assertLockedEnvelope(body: any, mode: 'live' | 'shadow'): void {
  expect(Object.keys(body).sort()).toEqual([
    'apiVersion', 'data', 'decidedAt', 'gateDecision', 'gates', 'responseIdentity', 'runtime', 'schemaVersion', 'serverTime',
  ]);
  expect(body).toMatchObject({
    apiVersion: 'v1', schemaVersion: '2026-08-04',
    decidedAt: DECIDED_AT.toISOString(), serverTime: DECIDED_AT.toISOString(),
    runtime: { mode, surface: 'public', availability: 'locked' }, data: null,
    gateDecision: { exposed: false },
  });
  assertClosedGates(body.gates);
}

function assertClosedGates(gates: Record<string, { readonly exposed: boolean }>): void {
  expect(Object.keys(gates).sort()).toEqual(expectedGateNames);
  expect(Object.values(gates)).toHaveLength(9);
  expect(Object.values(gates).every(({ exposed }) => exposed === false)).toBe(true);
}

function jsonRequest(method: 'POST' | 'DELETE', body: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

function registration(id: string): CommuteWindowRegistration {
  return {
    id, lifecycle: 'active', notificationEnabled: true,
    weekdays: [1, 2, 3, 4, 5], startsAt: '08:00', endsAt: '09:00', preparationLeadMinutes: 15,
    scope: {
      routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway-Mott Av',
      originStationId: 'A12', destinationStationId: 'A24', segmentStationIds: ['A12', 'A15', 'A24'],
    },
  };
}

interface RouteLayer {
  readonly route?: {
    readonly path: string;
    readonly methods: Readonly<Record<string, boolean>>;
  };
}

function registeredOperations(app: Express): readonly string[] {
  const layers = (app as unknown as { readonly router: { readonly stack: readonly RouteLayer[] } }).router.stack;
  return layers.flatMap((layer) => {
    if (!layer.route || Object.keys(layer.route.methods).length > 10) return [];
    return Object.keys(layer.route.methods)
      .filter((method) => layer.route!.methods[method])
      .map((method) => `${method.toUpperCase()} ${layer.route!.path}`);
  }).sort();
}
