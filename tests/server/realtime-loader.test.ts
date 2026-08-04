import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { decodeRealtimeSnapshot } from '../../src/server/gtfs/realtime-loader';
import { createSourceCoordinator } from '../../src/server/services/source-coordinator';
import type { RemoteSource } from '../../src/server/data/source-registry';
import {
  encodeNyctFeed,
  malformedNyctExtension,
  nyctTripUnknown,
} from '../fixtures/nyct-realtime-fixture';

const fixture = (name: string) => resolve('tests', 'fixtures', 'realtime', name);
const retrievedAt = '2026-08-04T06:01:00.000Z';
const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;
const FeedEntity = GtfsRealtimeBindings.transit_realtime.FeedEntity;

afterEach(() => {
  vi.useRealTimers();
});

describe('official NYCT GTFS-Realtime decoding', () => {
  test('accepts the official 1.0 full-dataset header and decodes NYCT extension version 1.0', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const snapshot = decodeRealtimeSnapshot(bytes, context(bytes));

    expect(snapshot).toMatchObject({
      sourceId: 'subway-rt-ace',
      feedGroupId: 'subway-rt-ace',
      gtfsRealtimeVersion: '1.0',
      nyctSubwayVersion: '1.0',
      incrementality: 'FULL_DATASET',
      feedTimestamp: new Date('2026-08-04T06:00:00.000Z'),
      entityCount: 5,
      coveredRouteIds: ['A'],
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  test('uses repeated stop-time-update order and decodes NYCT direction, assignment, train, and track facts', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const snapshot = decodeRealtimeSnapshot(bytes, context(bytes));

    expect(snapshot.tripUpdates[0]).toMatchObject({
      entityId: 'trip-update-north',
      trip: {
        tripId: 'shared-trip',
        routeId: 'A',
        startDate: '20260803',
        startTime: null,
        directionId: null,
        nyct: { trainId: '0A 0200 FAR/207', isAssigned: true, direction: 'NORTH' },
      },
      remainingStopCalls: [
        {
          remainingOrder: 0,
          stopId: 'A23N',
          scheduledTrack: '4',
          actualTrack: '3',
          arrivalTime: new Date('2026-08-04T06:02:00.000Z'),
          departureTime: new Date('2026-08-04T06:02:30.000Z'),
        },
        {
          remainingOrder: 1,
          stopId: 'A24N',
          scheduledTrack: '4',
          actualTrack: null,
          arrivalTime: new Date('2026-08-04T06:05:00.000Z'),
          departureTime: null,
        },
      ],
    });
    expect(snapshot.tripUpdates[1].trip.nyct.direction).toBe('SOUTH');
  });

  test('preserves assigned, unassigned, and missing optional NYCT facts without inference', async () => {
    const current = await readFile(fixture('current.pb'));
    const holding = await readFile(fixture('holding.pb'));
    const assigned = decodeRealtimeSnapshot(current, context(current));
    const unknown = decodeRealtimeSnapshot(holding, context(holding, { retrievedAt: '2026-08-04T06:01:30.000Z' }));

    expect(assigned.tripUpdates[0].trip.nyct).toEqual({
      trainId: '0A 0200 FAR/207', isAssigned: true, direction: 'NORTH',
    });
    expect(unknown.tripUpdates[0].trip.nyct).toEqual({
      trainId: null, isAssigned: null, direction: null,
    });
    expect(unknown.vehiclePositions[0].trip.nyct).toEqual({
      trainId: null, isAssigned: false, direction: 'SOUTH',
    });
    expect(unknown.vehiclePositions[0]).toMatchObject({ vehicleId: null, currentStopSequence: null });
  });

  test('rejects malformed, duplicate, and unsupported NYCT extension values', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const malformed = decodeFeed(bytes);
    malformed.entity[0].tripUpdate!.trip!.$unknowns = malformedNyctExtension(Uint8Array.of(0x0a, 0x05, 0x41));
    expect(() => decodeRealtimeSnapshot(encodeNyctFeed(malformed), context(encodeNyctFeed(malformed))))
      .toThrow(/malformed NYCT trip descriptor extension/i);

    const duplicate = decodeFeed(bytes);
    duplicate.entity[0].tripUpdate!.trip!.$unknowns = [
      ...nyctTripUnknown({ direction: 1 }),
      ...nyctTripUnknown({ direction: 3 }),
    ];
    const duplicateBytes = encodeNyctFeed(duplicate);
    expect(() => decodeRealtimeSnapshot(duplicateBytes, context(duplicateBytes))).toThrow(/duplicate NYCT trip descriptor extension/i);

    const unsupported = decodeFeed(bytes);
    unsupported.entity[0].tripUpdate!.trip!.$unknowns = nyctTripUnknown({ direction: 9 });
    const unsupportedBytes = encodeNyctFeed(unsupported);
    expect(() => decodeRealtimeSnapshot(unsupportedBytes, context(unsupportedBytes))).toThrow(/NYCT direction/i);
  });

  test('accepts embedded official delayed-train alerts without invented effect or active period', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const snapshot = decodeRealtimeSnapshot(bytes, context(bytes));

    expect(snapshot.embeddedTrainAlerts).toEqual([expect.objectContaining({
      id: 'delayed-north',
      kind: 'train-delay',
      officialText: 'Train delayed',
      rawOfficialText: 'Train delayed',
      effect: null,
      activePeriods: [],
      informedTrips: [expect.objectContaining({
        tripId: 'shared-trip',
        startDate: '20260803',
        nyct: { trainId: '0A 0200 FAR/207', isAssigned: true, direction: 'NORTH' },
      })],
    })]);
  });
});

describe('canonical NYCT train identity and movement joins', () => {
  test('joins recurring trip ids by complete coherent service-date and NYCT direction evidence', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const snapshot = decodeRealtimeSnapshot(bytes, context(bytes));

    expect(snapshot.tripUpdates[0].trainInstanceId).not.toBe(snapshot.tripUpdates[1].trainInstanceId);
    expect(snapshot.tripUpdates[0].vehicleProgress?.movementTimestamp).toEqual(new Date('2026-08-04T05:59:45.000Z'));
    expect(snapshot.tripUpdates[1].vehicleProgress?.movementTimestamp).toEqual(new Date('2026-08-04T05:59:40.000Z'));
  });

  test('canonical train identity is independent of feed entity id', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const baseline = decodeRealtimeSnapshot(bytes, context(bytes));
    const renamed = decodeFeed(bytes);
    renamed.entity[0].id = 'renamed-by-producer';
    const renamedBytes = encodeNyctFeed(renamed);

    expect(decodeRealtimeSnapshot(renamedBytes, context(renamedBytes)).tripUpdates[0].trainInstanceId)
      .toBe(baseline.tripUpdates[0].trainInstanceId);
  });

  test('rejects duplicate canonical instances across distinct feed entities', async () => {
    const feed = decodeFeed(await readFile(fixture('current.pb')));
    feed.entity.push(FeedEntity.create({ id: 'duplicate-instance', tripUpdate: feed.entity[0].tripUpdate }));
    const bytes = encodeNyctFeed(feed);

    expect(() => decodeRealtimeSnapshot(bytes, context(bytes))).toThrow(/duplicate normalized train instance/i);

    const duplicateVehicle = decodeFeed(await readFile(fixture('current.pb')));
    duplicateVehicle.entity.push(FeedEntity.create({
      id: 'duplicate-vehicle-progress',
      vehicle: duplicateVehicle.entity[1].vehicle,
    }));
    const duplicateVehicleBytes = encodeNyctFeed(duplicateVehicle);
    expect(() => decodeRealtimeSnapshot(duplicateVehicleBytes, context(duplicateVehicleBytes)))
      .toThrow(/duplicate vehicle progress/i);
  });

  test('fails closed on ambiguous or contradictory vehicle descriptors', async () => {
    const sourceBytes = await readFile(fixture('current.pb'));
    const ambiguous = decodeFeed(sourceBytes);
    const ambiguousTrip = ambiguous.entity[1].vehicle!.trip!;
    delete ambiguousTrip.startDate;
    ambiguousTrip.$unknowns = undefined;
    const ambiguousBytes = encodeNyctFeed(ambiguous);
    expect(() => decodeRealtimeSnapshot(ambiguousBytes, context(ambiguousBytes))).toThrow(/ambiguous vehicle trip/i);

    const contradictory = decodeFeed(sourceBytes);
    contradictory.entity[1].vehicle!.trip!.$unknowns = nyctTripUnknown({
      trainId: '0A 0200 FAR/207', isAssigned: true, direction: 3,
    });
    const contradictoryBytes = encodeNyctFeed(contradictory);
    expect(() => decodeRealtimeSnapshot(contradictoryBytes, context(contradictoryBytes))).toThrow(/contradictory vehicle trip/i);
  });
});

describe('identity and source chronology validation', () => {
  test('rejects invalid Gregorian service dates and invalid GTFS times in trips and alerts', async () => {
    const sourceBytes = await readFile(fixture('current.pb'));
    const invalidDate = decodeFeed(sourceBytes);
    invalidDate.entity[0].tripUpdate!.trip!.startDate = '20260230';
    const invalidDateBytes = encodeNyctFeed(invalidDate);
    expect(() => decodeRealtimeSnapshot(invalidDateBytes, context(invalidDateBytes))).toThrow(/Gregorian service date/i);

    const invalidTime = decodeFeed(sourceBytes);
    invalidTime.entity[0].tripUpdate!.trip!.startTime = '25:99:99';
    const invalidTimeBytes = encodeNyctFeed(invalidTime);
    expect(() => decodeRealtimeSnapshot(invalidTimeBytes, context(invalidTimeBytes))).toThrow(/GTFS start time/i);

    const invalidAlert = decodeFeed(sourceBytes);
    invalidAlert.entity[4].alert!.informedEntity![0].trip!.startDate = '20261301';
    const invalidAlertBytes = encodeNyctFeed(invalidAlert);
    expect(() => decodeRealtimeSnapshot(invalidAlertBytes, context(invalidAlertBytes))).toThrow(/alert.*Gregorian service date/i);
  });

  test('accepts a syntactically valid beyond-24-hour GTFS start time when supplied', async () => {
    const feed = decodeFeed(await readFile(fixture('current.pb')));
    feed.entity[0].tripUpdate!.trip!.startTime = '25:10:59';
    feed.entity[1].vehicle!.trip!.startTime = '25:10:59';
    feed.entity[4].alert!.informedEntity![0].trip!.startTime = '25:10:59';
    const bytes = encodeNyctFeed(feed);

    expect(decodeRealtimeSnapshot(bytes, context(bytes)).tripUpdates[0].trip.startTime).toBe('25:10:59');
  });

  test('rejects future trip-update and vehicle movement timestamps without rejecting predicted event times', async () => {
    const sourceBytes = await readFile(fixture('current.pb'));
    const futureUpdate = decodeFeed(sourceBytes);
    futureUpdate.entity[0].tripUpdate!.timestamp = 1_785_823_201;
    const futureUpdateBytes = encodeNyctFeed(futureUpdate);
    expect(() => decodeRealtimeSnapshot(futureUpdateBytes, context(futureUpdateBytes))).toThrow(/trip update timestamp.*after feed header/i);

    const futureVehicle = decodeFeed(sourceBytes);
    futureVehicle.entity[1].vehicle!.timestamp = 1_785_823_201;
    const futureVehicleBytes = encodeNyctFeed(futureVehicle);
    expect(() => decodeRealtimeSnapshot(futureVehicleBytes, context(futureVehicleBytes))).toThrow(/movement timestamp.*after feed header/i);

    const accepted = decodeRealtimeSnapshot(sourceBytes, context(sourceBytes));
    expect(accepted.tripUpdates[0].remainingStopCalls[0].arrivalTime).toEqual(new Date('2026-08-04T06:02:00.000Z'));
  });
});

describe('exact retrieval provenance and immutable raw evidence', () => {
  test('retains Task 3 provenance and exact received bytes without protobuf re-encoding', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const loaderContext = context(bytes, { finalUrl: 'https://mirror.mta.info/ace', redirectCount: 1 });
    const snapshot = decodeRealtimeSnapshot(bytes, loaderContext);

    expect(snapshot.provenance).toEqual(loaderContext.provenance);
    expect(snapshot.rawEvidence).toEqual({
      evidenceId: `sha256:${sha256(bytes)}`,
      mediaType: 'application/x-protobuf',
      receivedBytes: bytes.byteLength,
      payloadBase64: Buffer.from(bytes).toString('base64'),
    });
    expect(Buffer.from(snapshot.rawEvidence.payloadBase64, 'base64')).toEqual(bytes);
    expect(snapshot.tripUpdates[0].evidenceId).toBe(snapshot.rawEvidence.evidenceId);
  });

  test('rejects provenance whose raw received digest or byte count does not match the payload', async () => {
    const bytes = await readFile(fixture('current.pb'));
    const digestMismatch = context(bytes);
    digestMismatch.provenance.sha256 = '0'.repeat(64);
    expect(() => decodeRealtimeSnapshot(bytes, digestMismatch)).toThrow(/received digest/i);

    const byteMismatch = context(bytes);
    byteMismatch.provenance.receivedBytes += 1;
    expect(() => decodeRealtimeSnapshot(bytes, byteMismatch)).toThrow(/received byte count/i);
  });
});

describe('independent generation-safe source coordination', () => {
  test('keeps each group and the separately owned system-alert snapshot isolated', async () => {
    const realtimeBytes = await readFile(fixture('current.pb'));
    const alertBytes = await readFile(resolve('tests', 'fixtures', 'alerts', 'subway-alerts.json'));
    const coordinator = createSourceCoordinator({
      realtimeGroups: [source('group-a'), source('group-b')],
      alertSource: alertSource(),
      retrieve: async (item) => {
        if (item.id === 'group-b') throw new Error('group-b unavailable');
        return retrieved(item, item.id === 'subway-alerts' ? alertBytes : realtimeBytes);
      },
    });

    await coordinator.refreshAll();

    expect(coordinator.getRealtimeSnapshot('group-a')).toMatchObject({ sourceId: 'group-a' });
    expect(coordinator.getRealtimeSnapshot('group-b')).toBeNull();
    expect(coordinator.getAlertSnapshot()).toMatchObject({ sourceId: 'subway-alerts' });
    expect(coordinator.getLastError('group-b')).toMatchObject({ message: 'group-b unavailable' });
  });

  test('runs independent abortable non-overlapping 30-second loops', async () => {
    vi.useFakeTimers();
    const bytes = await readFile(fixture('current.pb'));
    let resolveA!: (value: ReturnType<typeof retrieved>) => void;
    let callsA = 0;
    let callsB = 0;
    let abortedA = false;
    const coordinator = createSourceCoordinator({
      realtimeGroups: [source('group-a'), source('group-b')],
      retrieve: async (item, signal) => {
        if (item.id === 'group-b') {
          callsB += 1;
          return retrieved(item, bytes);
        }
        callsA += 1;
        signal.addEventListener('abort', () => { abortedA = true; }, { once: true });
        return new Promise((resolve) => { resolveA = resolve; });
      },
      intervalMs: 30_000,
    });

    coordinator.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(callsA).toBe(1);
    expect(callsB).toBe(3);
    coordinator.stop();
    expect(abortedA).toBe(true);
    resolveA(retrieved(source('group-a'), bytes));
  });

  test('awaits and discards a late success and late error after stop', async () => {
    const bytes = await readFile(fixture('current.pb'));
    let resolveLate!: (value: ReturnType<typeof retrieved>) => void;
    const coordinator = createSourceCoordinator({
      realtimeGroups: [source('group-a')],
      retrieve: () => new Promise((resolve) => { resolveLate = resolve; }),
    });

    const lateRefresh = coordinator.refreshAll();
    coordinator.stop();
    resolveLate(retrieved(source('group-a'), bytes));
    await lateRefresh;
    expect(coordinator.getRealtimeSnapshot('group-a')).toBeNull();
    expect(coordinator.getLastError('group-a')).toBeNull();
  });

  test('a stop/restart race cannot let the old generation overwrite the new snapshot', async () => {
    const current = await readFile(fixture('current.pb'));
    const holding = await readFile(fixture('holding.pb'));
    let resolveOld!: (value: ReturnType<typeof retrieved>) => void;
    let calls = 0;
    const group = source('group-a');
    const coordinator = createSourceCoordinator({
      realtimeGroups: [group],
      retrieve: () => {
        calls += 1;
        if (calls === 1) return new Promise((resolve) => { resolveOld = resolve; });
        return Promise.resolve(retrieved(group, holding, { retrievedAt: '2026-08-04T06:01:30.000Z' }));
      },
    });

    const oldRefresh = coordinator.refreshAll();
    coordinator.stop();
    coordinator.start();
    await coordinator.refreshAll();
    const newSnapshot = coordinator.getRealtimeSnapshot('group-a');
    resolveOld(retrieved(group, current));
    await oldRefresh;

    expect(coordinator.getRealtimeSnapshot('group-a')).toBe(newSnapshot);
    expect(coordinator.getRealtimeSnapshot('group-a')?.feedTimestamp).toEqual(new Date('2026-08-04T06:00:30.000Z'));
    coordinator.stop();
  });
});

function decodeFeed(bytes: Uint8Array) {
  return FeedMessage.decode(bytes);
}

function context(
  bytes: Uint8Array,
  overrides: Partial<{ retrievedAt: string; finalUrl: string; redirectCount: number }> = {},
) {
  const sourceUrl = 'https://api-endpoint.mta.info/ace';
  return {
    feedGroupId: 'subway-rt-ace',
    provenance: {
      sourceId: 'subway-rt-ace',
      sourceAuthority: 'MTA',
      sourceRole: 'subway-realtime',
      sourceUrl,
      retrievedAt: overrides.retrievedAt ?? retrievedAt,
      finalUrl: overrides.finalUrl ?? sourceUrl,
      redirectCount: overrides.redirectCount ?? 0,
      declaredContentType: 'application/x-protobuf',
      observedContentType: 'application/x-protobuf',
      declaredBytes: bytes.byteLength,
      receivedBytes: bytes.byteLength,
      sha256: sha256(bytes),
    },
  };
}

function retrieved(
  item: RemoteSource,
  bytes: Uint8Array,
  overrides: Partial<{ retrievedAt: string }> = {},
) {
  const mediaType = item.role === 'subway-alerts' ? 'application/json' : 'application/x-protobuf';
  return {
    bytes: new Uint8Array(bytes),
    provenance: {
      sourceId: item.id,
      sourceAuthority: item.authority,
      sourceRole: item.role,
      sourceUrl: item.url,
      retrievedAt: overrides.retrievedAt ?? retrievedAt,
      finalUrl: item.url,
      redirectCount: 0,
      declaredContentType: mediaType,
      observedContentType: mediaType,
      declaredBytes: bytes.byteLength,
      receivedBytes: bytes.byteLength,
      sha256: sha256(bytes),
    },
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function source(id: string) {
  return {
    id,
    authority: 'MTA',
    kind: 'remote' as const,
    role: 'subway-realtime' as const,
    required: true,
    supports: ['arrival-evidence'] as const,
    url: `https://api-endpoint.mta.info/${id}`,
    allowedOrigins: ['https://api-endpoint.mta.info'],
    expectedFormat: 'protobuf' as const,
    acceptedContentTypes: ['application/x-protobuf'],
    retrieval: { timeoutMs: 8_000, maxRedirects: 2, maxBytes: 1024 * 1024, maxUrlLength: 2048 },
  };
}

function alertSource() {
  return {
    ...source('subway-alerts'),
    role: 'subway-alerts' as const,
    supports: ['service-changes'] as const,
    expectedFormat: 'json' as const,
    acceptedContentTypes: ['application/json'],
  };
}
