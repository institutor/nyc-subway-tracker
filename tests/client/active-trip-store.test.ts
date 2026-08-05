import { describe, expect, test } from 'vitest';

import {
  ACTIVE_TRIP_STORE_KEY,
  createBrowserActiveTripStore,
  type ActiveTripRecord,
} from '../../src/client/storage/active-trip-store';
import type { BrowserStorage } from '../../src/client/storage/browser-store';

class MemoryStorage implements BrowserStorage {
  readonly values = new Map<string, string>();
  writes = 0;
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes += 1;
    if (this.failWrites) throw new Error('simulated storage failure');
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const trip = (overrides: Partial<ActiveTripRecord> = {}): ActiveTripRecord => ({
  id: 'trip-1',
  capturedAt: '2026-08-05T12:00:00.000Z',
  captureContext: {
    kind: 'response-owned', itineraryId: 'itinerary-1', requestMode: 'offline-reference', timing: 'untimed',
    disclosure: 'Demonstration data \u2014 not live',
  },
  origin: {
    name: 'Jay St–MetroTech',
    complexId: 'complex-jay',
    constituentId: 'station-jay-f',
    entranceId: 'entrance-jay-1',
  },
  destination: {
    name: 'West 4 St–Washington Sq',
    complexId: 'complex-w4',
    constituentId: 'station-w4-f',
  },
  accessibleRouteOnly: false,
  legs: [{
    id: 'leg-1',
    route: { id: 'F', label: 'F', spokenIdentity: 'F train', shape: 'circle' },
    boundDirection: 'northbound',
    actualDestination: 'Jamaica–179 St',
    points: [
      {
        id: 'point-jay', kind: 'stop', stationName: 'Jay St–MetroTech',
        complexId: 'complex-jay', constituentId: 'station-jay-f', instruction: 'Board the F train.',
      },
      {
        id: 'point-w4', kind: 'stop', stationName: 'West 4 St–Washington Sq',
        complexId: 'complex-w4', constituentId: 'station-w4-f', instruction: 'Leave the train.',
      },
    ],
  }],
  transfers: [],
  serviceClaims: [{
    id: 'service-1',
    scope: { kind: 'direction', routeId: 'F', direction: 'northbound' },
    state: 'changed',
    consequence: 'F trains are running with delays toward Jamaica–179 St.',
    lastCheckedAt: '2026-08-05T11:58:00.000Z',
  }],
  equipmentClaims: [{
    id: 'equipment-1', equipmentId: 'EL-101', connectionId: 'connection-jay-platform',
    pathId: 'path-jay-f-northbound', observation: 'unknown',
    lastCheckedAt: '2026-08-05T11:57:00.000Z',
  }],
  cursor: { pointId: 'point-jay' },
  validity: {
    result: 'untimed-structural-route',
    serviceDate: '2026-08-05',
    pattern: 'typical-weekday',
    schedule: { kind: 'none' },
    warnings: [],
    vetoes: [],
  },
  ...overrides,
});

describe('strict one-trip device store', () => {
  test('opens a v3 trip without mutation and returns immutable detached evidence', () => {
    const storage = new MemoryStorage();
    storage.values.set(ACTIVE_TRIP_STORE_KEY, JSON.stringify({ version: 3, trip: trip() }));
    const store = createBrowserActiveTripStore(storage);

    const first = store.read();
    expect(first).toMatchObject({ kind: 'ready', migrated: false, trip: { id: 'trip-1' } });
    expect(storage.writes).toBe(0);
    if (first.kind !== 'ready' || first.trip === null) return;
    expect(Object.isFrozen(first.trip)).toBe(true);
    expect(Object.isFrozen(first.trip.legs[0].points)).toBe(true);
    expect(() => { (first.trip!.serviceClaims[0] as { consequence: string }).consequence = 'Good service'; }).toThrow();
    expect(store.read()).toMatchObject({ trip: { serviceClaims: [{ consequence: 'F trains are running with delays toward Jamaica–179 St.' }] } });
  });

  test('migrates the exact v1 envelope name without writing until a rider mutation', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: 1, activeTrip: legacyTrip() });
    storage.values.set(ACTIVE_TRIP_STORE_KEY, raw);
    const store = createBrowserActiveTripStore(storage);

    expect(store.read()).toMatchObject({ kind: 'ready', migrated: true, trip: { id: 'trip-1' } });
    expect(storage.values.get(ACTIVE_TRIP_STORE_KEY)).toBe(raw);
    expect(storage.writes).toBe(0);

    expect(store.setCursor('point-w4')).toMatchObject({ kind: 'saved', trip: { cursor: { pointId: 'point-w4' } } });
    expect(JSON.parse(storage.values.get(ACTIVE_TRIP_STORE_KEY)!)).toMatchObject({
      version: 3,
      trip: { cursor: { pointId: 'point-w4' } },
    });
    expect(storage.writes).toBe(1);
  });

  test.each([
    JSON.stringify({ version: 4, trip: null }),
    JSON.stringify({ version: 3, trip: { ...trip(), location: { latitude: 40.7, longitude: -74 } } }),
    JSON.stringify({ version: 3, trip: { ...trip(), arrivals: [] } }),
    JSON.stringify({ version: 3, trip: { ...trip(), accountId: 'rider' } }),
    JSON.stringify({ version: 3, trip: { ...trip(), movementHistory: ['point-w4'] } }),
    JSON.stringify({ version: 3, trip: { ...trip(), serviceClaims: [{ ...trip().serviceClaims[0], current: true }] } }),
    JSON.stringify({ version: 2, trip: { ...legacyTrip(), validity: { kind: 'unowned' } } }),
    JSON.stringify({ version: 1, trip: legacyTrip() }),
    '{"version":3,"trip":',
  ])('quarantines future, ambiguous, malformed, and operationally widened bytes %#', (raw) => {
    const storage = new MemoryStorage();
    storage.values.set(ACTIVE_TRIP_STORE_KEY, raw);
    const store = createBrowserActiveTripStore(storage);

    expect(store.read()).toMatchObject({ kind: 'quarantined', raw });
    expect(store.capture(trip({ id: 'replacement' }))).toEqual({ kind: 'unavailable', reason: 'quarantined' });
    expect(store.clear()).toEqual({ kind: 'unavailable', reason: 'quarantined' });
    expect(storage.values.get(ACTIVE_TRIP_STORE_KEY)).toBe(raw);
    expect(storage.writes).toBe(0);
  });

  test('captures exactly one explicit trip, replaces it explicitly, and clears only that trip', () => {
    const storage = new MemoryStorage();
    const store = createBrowserActiveTripStore(storage);

    expect(store.read()).toEqual({ kind: 'ready', migrated: false, trip: null });
    expect(store.capture(trip())).toMatchObject({ kind: 'saved', trip: { id: 'trip-1' } });
    expect(store.capture(trip({ id: 'trip-2', capturedAt: '2026-08-05T12:05:00.000Z' }))).toMatchObject({
      kind: 'saved', trip: { id: 'trip-2' },
    });
    expect(JSON.parse(storage.values.get(ACTIVE_TRIP_STORE_KEY)!)).toMatchObject({ version: 3, trip: { id: 'trip-2' } });
    expect(store.clear()).toEqual({ kind: 'saved', trip: null });
    expect(JSON.parse(storage.values.get(ACTIVE_TRIP_STORE_KEY)!)).toEqual({ version: 3, trip: null });
  });

  test('manual cursor correction changes only rider input and cannot refresh evidence', () => {
    const storage = new MemoryStorage();
    const store = createBrowserActiveTripStore(storage);
    store.capture(trip());
    const before = JSON.parse(storage.values.get(ACTIVE_TRIP_STORE_KEY)!) as { trip: Record<string, unknown> };

    expect(store.setCursor('point-w4')).toMatchObject({ kind: 'saved', trip: { cursor: { pointId: 'point-w4' } } });
    const after = JSON.parse(storage.values.get(ACTIVE_TRIP_STORE_KEY)!) as { trip: Record<string, unknown> };
    expect(after.trip).toEqual({ ...before.trip, cursor: { pointId: 'point-w4' } });

    expect(store.setCursor('not-on-trip')).toEqual({ kind: 'unavailable', reason: 'invalid-cursor' });
    expect(JSON.parse(storage.values.get(ACTIVE_TRIP_STORE_KEY)!).trip).toEqual(after.trip);
  });

  test('rejects missing core content, unsupported clock times, and incomplete owner-only modules', () => {
    const storage = new MemoryStorage();
    const store = createBrowserActiveTripStore(storage);
    const missingCore = { ...trip() } as Record<string, unknown>;
    delete missingCore.equipmentClaims;

    expect(store.capture(missingCore as unknown as ActiveTripRecord)).toEqual({ kind: 'unavailable', reason: 'invalid-trip' });
    expect(store.capture(trip({ serviceClaims: [], equipmentClaims: [] }))).toMatchObject({
      kind: 'saved', trip: { serviceClaims: [], equipmentClaims: [] },
    });
    expect(store.capture(trip({
      validity: {
        ...trip().validity,
        schedule: {
          kind: 'current', editionId: 'edition-1', anchorKind: 'published',
          anchorAt: '2026-08-05T11:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
          effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 3_600,
          departures: [{ legId: 'leg-1', pointId: 'point-jay', clockTime: '08:15', evidence: 'scheduled', timeZone: 'America/New_York' }],
        },
      },
    }))).toEqual({ kind: 'unavailable', reason: 'invalid-trip' });
    expect(store.capture({ ...trip(), exitGuidance: { exitId: 'exit-1' } } as unknown as ActiveTripRecord)).toEqual({
      kind: 'unavailable', reason: 'invalid-trip',
    });
    expect(store.read()).toMatchObject({
      kind: 'ready', migrated: false, trip: { serviceClaims: [], equipmentClaims: [] },
    });
  });

  test('admits Scheduled clocks only for exact Current or Stale reference evidence', () => {
    const storage = new MemoryStorage();
    const store = createBrowserActiveTripStore(storage);
    const schedule: Extract<ActiveTripRecord['validity']['schedule'], { kind: 'current' }> = {
      kind: 'current', editionId: 'edition-1', anchorKind: 'published',
      anchorAt: '2026-08-05T11:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
      effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 3_600,
      departures: [{
        legId: 'leg-1', pointId: 'point-jay', clockTime: '08:15',
        evidence: 'scheduled', timeZone: 'America/New_York',
      }],
    };

    const result = store.capture(trip({
      captureContext: {
        kind: 'response-owned', itineraryId: 'itinerary-1', requestMode: 'offline-reference', timing: 'timed',
        disclosure: 'Demonstration data \u2014 not live',
      },
      validity: {
        result: 'reference-itinerary', serviceDate: '2026-08-05', pattern: 'typical-weekday',
        schedule, warnings: [], vetoes: [],
      },
    }));
    expect(result).toMatchObject({
      kind: 'saved',
      trip: { validity: { result: 'reference-itinerary', schedule: { kind: 'current', departures: [{ evidence: 'scheduled' }] } } },
    });
  });

  test('keeps an exact ordered transfer without aliasing the two leg cursors', () => {
    const storage = new MemoryStorage();
    const store = createBrowserActiveTripStore(storage);
    const firstLeg = trip().legs[0];
    const transferArrival = firstLeg.points[1];
    const outgoingPoint = {
      ...transferArrival,
      id: 'point-w4-outgoing',
      instruction: 'Board the A train toward Inwood–207 St.',
    };
    const destinationPoint = {
      id: 'point-125', kind: 'stop' as const, stationName: '125 St',
      complexId: 'complex-125', constituentId: 'station-125-a', instruction: 'Leave the train.',
    };
    const secondLeg: ActiveTripRecord['legs'][number] = {
      id: 'leg-2',
      route: { id: 'A', label: 'A', spokenIdentity: 'A train', shape: 'circle' },
      boundDirection: 'northbound',
      actualDestination: 'Inwood–207 St',
      points: [outgoingPoint, destinationPoint],
    };

    const result = store.capture(trip({
      destination: { name: '125 St', complexId: 'complex-125', constituentId: 'station-125-a' },
      legs: [firstLeg, secondLeg],
      transfers: [{
        id: 'transfer-w4', atPointId: 'point-w4', incomingLegId: 'leg-1', outgoingLegId: 'leg-2',
        incomingDirection: 'northbound', incomingDestination: 'Jamaica–179 St',
        outgoingDirection: 'northbound', outgoingDestination: 'Inwood–207 St',
        steps: ['Follow signs for uptown A trains.'], connectionState: 'Previously verified passage.',
      }],
    }));

    expect(result).toMatchObject({ kind: 'saved', trip: { transfers: [{ id: 'transfer-w4' }] } });
  });

  test('rejects service scope donated from another trip and claims observed after capture', () => {
    const storage = new MemoryStorage();
    const store = createBrowserActiveTripStore(storage);

    expect(store.capture(trip({
      serviceClaims: [{
        ...trip().serviceClaims[0],
        scope: { kind: 'leg', legId: 'not-this-leg', routeId: 'F', direction: 'northbound' },
      }],
    }))).toEqual({ kind: 'unavailable', reason: 'invalid-trip' });
    expect(store.capture(trip({
      equipmentClaims: [{ ...trip().equipmentClaims[0], lastCheckedAt: '2026-08-05T12:01:00.000Z' }],
    }))).toEqual({ kind: 'unavailable', reason: 'invalid-trip' });
  });

  test('rejects owner currency labels that contradict their retained exact boundaries', () => {
    const storage = new MemoryStorage();
    const store = createBrowserActiveTripStore(storage);
    const current: Extract<ActiveTripRecord['validity']['schedule'], { kind: 'current' }> = {
      kind: 'current', editionId: 'edition-1', anchorKind: 'published',
      anchorAt: '2026-08-05T09:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
      effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 10_800,
      departures: [{
        legId: 'leg-1', pointId: 'point-jay', clockTime: '08:15',
        evidence: 'scheduled', timeZone: 'America/New_York',
      }],
    };

    expect(store.capture(trip({
      captureContext: {
        kind: 'response-owned', itineraryId: 'itinerary-1', requestMode: 'offline-reference', timing: 'timed',
        disclosure: 'Demonstration data \u2014 not live',
      },
      validity: {
        result: 'reference-itinerary', serviceDate: '2026-08-05', pattern: 'typical-weekday',
        schedule: current, warnings: [], vetoes: [],
      },
    }))).toEqual({ kind: 'unavailable', reason: 'invalid-trip' });
  });

  test('write failure preserves both the prior bytes and in-memory trip', () => {
    const storage = new MemoryStorage();
    const prior = JSON.stringify({ version: 3, trip: trip() });
    storage.values.set(ACTIVE_TRIP_STORE_KEY, prior);
    const store = createBrowserActiveTripStore(storage);
    storage.failWrites = true;

    expect(store.setCursor('point-w4')).toEqual({ kind: 'unavailable', reason: 'storage-write-failed' });
    expect(storage.values.get(ACTIVE_TRIP_STORE_KEY)).toBe(prior);
    expect(store.read()).toMatchObject({ trip: { cursor: { pointId: 'point-jay' } } });
  });

  test('migrates v2 by stripping known synthesized placeholders and marking unowned context explicitly', () => {
    const storage = new MemoryStorage();
    const synthetic = legacyTrip({
      serviceClaims: [{
        id: 'service-capture', scope: { kind: 'trip', tripId: 'trip-1' }, state: 'normal',
        consequence: 'No service conflict was present in the accepted itinerary response at capture.',
        lastCheckedAt: '2026-08-05T12:00:00.000Z',
      }],
      equipmentClaims: [{
        id: 'equipment-context', equipmentId: 'not-supplied', connectionId: 'trip-structural-path',
        pathId: 'itinerary-1', observation: 'unknown', lastCheckedAt: '2026-08-05T12:00:00.000Z',
      }],
      validity: {
        ...trip().validity,
        warnings: [{
          id: 'capture-limitation', scope: { kind: 'trip', tripId: 'trip-1' },
          message: 'No current arrivals or equipment operation are stored with this structural trip.',
          ownerRecordId: 'response:journey', lastCheckedAt: '2026-08-05T12:00:00.000Z',
        }],
      },
    });
    storage.values.set(ACTIVE_TRIP_STORE_KEY, JSON.stringify({ version: 2, trip: synthetic }));

    const store = createBrowserActiveTripStore(storage);

    expect(store.read()).toMatchObject({
      kind: 'ready', migrated: true,
      trip: {
        captureContext: { kind: 'legacy-migrated' },
        serviceClaims: [], equipmentClaims: [],
        validity: { result: 'untimed-structural-route', pattern: 'unspecified', schedule: { kind: 'none' }, warnings: [] },
      },
    });
    expect(store.setCursor('point-w4')).toMatchObject({ kind: 'saved' });
    const written = storage.values.get(ACTIVE_TRIP_STORE_KEY)!;
    expect(JSON.parse(written)).toMatchObject({ version: 3 });
    expect(written).not.toMatch(/service-capture|not-supplied|capture-limitation/);
  });

  test('discovers the prior v2 storage key and writes the next rider mutation only to v3', () => {
    const storage = new MemoryStorage();
    const legacyKey = 'nyc-subway-tracker:active-trip:v2';
    storage.values.set(legacyKey, JSON.stringify({ version: 2, trip: legacyTrip() }));

    const store = createBrowserActiveTripStore(storage);

    expect(store.read()).toMatchObject({ kind: 'ready', migrated: true, trip: { id: 'trip-1' } });
    expect(store.setCursor('point-w4')).toMatchObject({ kind: 'saved' });
    expect(JSON.parse(storage.values.get(ACTIVE_TRIP_STORE_KEY)!)).toMatchObject({ version: 3 });
    expect(storage.values.get(legacyKey)).toBeDefined();
  });
});

function legacyTrip(overrides: Partial<ActiveTripRecord> = {}): Record<string, unknown> {
  const { captureContext: _captureContext, ...legacy } = trip(overrides);
  return legacy;
}
