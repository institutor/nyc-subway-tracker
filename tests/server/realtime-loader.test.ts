import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  decodeRealtimeSnapshot,
  decodeRealtimeSnapshotJson,
  type RealtimeSnapshot,
} from '../../src/server/gtfs/realtime-loader';
import { createSourceCoordinator } from '../../src/server/services/source-coordinator';

const fixture = (name: string) => resolve('tests', 'fixtures', 'realtime', name);
const retrievedAt = new Date('2026-08-04T06:01:00.000Z');

afterEach(() => {
  vi.useRealTimers();
});

describe('subway GTFS-Realtime snapshot decoding', () => {
  test('decodes a complete full-dataset snapshot with exact feed-group provenance', async () => {
    const payload = await readFile(fixture('current.pb'));
    const snapshot = decodeRealtimeSnapshot(payload, {
      sourceId: 'subway-rt-ace',
      feedGroupId: 'ace',
      sourceUrl: 'https://api-endpoint.mta.info/ace',
      retrievedAt,
    });

    expect(snapshot).toMatchObject({
      sourceId: 'subway-rt-ace',
      feedGroupId: 'ace',
      sourceUrl: 'https://api-endpoint.mta.info/ace',
      gtfsRealtimeVersion: '2.0',
      incrementality: 'FULL_DATASET',
      feedTimestamp: new Date('2026-08-04T06:00:00.000Z'),
      retrievedAt,
      entityCount: 3,
      coveredRouteIds: ['A'],
    });
    expect(snapshot.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  test('normalizes only source-supplied future stop calls in source order with absolute times', async () => {
    const snapshot = decodeRealtimeSnapshot(await readFile(fixture('current.pb')), context());

    expect(snapshot.tripUpdates[0]).toMatchObject({
      entityId: 'trip-update-a',
      trip: {
        tripId: 'trip-a',
        routeId: 'A',
        directionId: 0,
        startDate: '20260804',
        startTime: '02:00:00',
      },
      futureStopCalls: [
        {
          stopId: 'A24N',
          stopSequence: 2,
          arrivalTime: new Date('2026-08-04T06:02:00.000Z'),
          departureTime: new Date('2026-08-04T06:02:30.000Z'),
        },
        {
          stopId: 'A25N',
          stopSequence: 3,
          arrivalTime: new Date('2026-08-04T06:05:00.000Z'),
          departureTime: null,
        },
      ],
    });
    expect(snapshot.tripUpdates[0].futureStopCalls.map((call) => call.stopId)).not.toContain('A23N');
  });

  test('joins vehicle progress and its movement timestamp only to the exact trip identity', async () => {
    const snapshot = decodeRealtimeSnapshot(await readFile(fixture('current.pb')), context());

    expect(snapshot.tripUpdates[0].vehicleProgress).toEqual({
      entityId: 'vehicle-a',
      vehicleId: 'train-a',
      currentStopSequence: 1,
      stopId: 'A23N',
      currentStatus: 'IN_TRANSIT_TO',
      movementTimestamp: new Date('2026-08-04T05:59:45.000Z'),
    });
  });

  test('retains absent source fields as explicit unknown values instead of inferring them', async () => {
    const snapshot = decodeRealtimeSnapshot(await readFile(fixture('holding.pb')), context({
      retrievedAt: new Date('2026-08-04T06:01:30.000Z'),
    }));

    expect(snapshot.tripUpdates[0]).toMatchObject({
      trip: { routeId: null, directionId: null, startDate: null, startTime: null },
      vehicleProgress: {
        vehicleId: null,
        currentStopSequence: null,
        stopId: null,
        currentStatus: 'UNKNOWN',
        movementTimestamp: null,
      },
    });
  });

  test('rejects unsupported headers, time regression, future headers, and partial incrementality', () => {
    const base = realtimeJson();
    expect(() => decodeRealtimeSnapshotJson({ ...base, header: { ...(base.header as Record<string, unknown>), gtfsRealtimeVersion: '1.0' } }, context()))
      .toThrow(/GTFS-Realtime version 2\.0/i);
    expect(() => decodeRealtimeSnapshotJson({ ...base, header: { ...(base.header as Record<string, unknown>), incrementality: 'DIFFERENTIAL' } }, context()))
      .toThrow(/full_dataset/i);
    expect(() => decodeRealtimeSnapshotJson(base, context(), { feedTimestamp: new Date('2026-08-04T06:00:01.000Z') }))
      .toThrow(/regressed/i);
    expect(() => decodeRealtimeSnapshotJson({ ...base, header: { ...(base.header as Record<string, unknown>), timestamp: 1785823321 } }, context()))
      .toThrow(/after retrieval/i);
  });

  test('rejects malformed bytes, duplicate entity identities, unordered calls, and contradictory trip descriptors', () => {
    expect(() => decodeRealtimeSnapshot(Uint8Array.of(0xff, 0xff), context())).toThrow(/decode/i);

    const duplicate = realtimeJson({
      entity: [tripEntity(), { ...tripEntity(), id: 'trip-update-a' }],
    });
    expect(() => decodeRealtimeSnapshotJson(duplicate, context())).toThrow(/duplicate entity/i);

    const unordered = realtimeJson({
      entity: [tripEntity({ stopTimeUpdate: [stopCall(3, 'A25N', 1785823500), stopCall(2, 'A24N', 1785823320)] })],
    });
    expect(() => decodeRealtimeSnapshotJson(unordered, context())).toThrow(/stop sequence.*increasing/i);

    const contradictory = realtimeJson({
      entity: [
        tripEntity(),
        {
          id: 'vehicle-a',
          vehicle: {
            trip: { tripId: 'trip-a', routeId: 'C', directionId: 0, startDate: '20260804', startTime: '02:00:00' },
            timestamp: 1785823185,
          },
        },
      ],
    });
    expect(() => decodeRealtimeSnapshotJson(contradictory, context())).toThrow(/contradictory vehicle trip/i);
  });
});

describe('independent real-time source coordination', () => {
  test('keeps each feed group and alerts independent when another group fails', async () => {
    const payload = await readFile(fixture('current.pb'));
    const alertJson = JSON.parse(await readFile(resolve('tests', 'fixtures', 'alerts', 'subway-alerts.json'), 'utf8'));
    const coordinator = createSourceCoordinator({
      realtimeGroups: [source('group-a'), source('group-b')],
      alertSource: alertSource(),
      retrieve: async (item) => {
        if (item.id === 'group-b') throw new Error('group-b unavailable');
        return item.id === 'subway-alerts' ? JSON.stringify(alertJson) : payload;
      },
      now: () => retrievedAt,
    });

    await coordinator.refreshAll();

    expect(coordinator.getLastError('group-a')).toBeNull();
    expect(coordinator.getRealtimeSnapshot('group-a')).toMatchObject({ sourceId: 'group-a' });
    expect(coordinator.getRealtimeSnapshot('group-b')).toBeNull();
    expect(coordinator.getAlertSnapshot()).toMatchObject({ sourceId: 'subway-alerts' });
    expect(coordinator.getLastError('group-b')).toMatchObject({ message: 'group-b unavailable' });
  });

  test('runs abortable non-overlapping deterministic loops without cross-group blocking', async () => {
    vi.useFakeTimers();
    const payload = await readFile(fixture('current.pb'));
    let resolveA!: (value: Uint8Array) => void;
    let callsA = 0;
    let callsB = 0;
    let abortedA = false;
    const coordinator = createSourceCoordinator({
      realtimeGroups: [source('group-a'), source('group-b')],
      retrieve: async (item, signal) => {
        if (item.id === 'group-b') {
          callsB += 1;
          return payload;
        }
        callsA += 1;
        signal.addEventListener('abort', () => { abortedA = true; }, { once: true });
        return new Promise<Uint8Array>((resolve) => { resolveA = resolve; });
      },
      now: () => retrievedAt,
      intervalMs: 30_000,
    });

    coordinator.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(callsA).toBe(1);
    expect(callsB).toBe(3);

    coordinator.stop();
    expect(abortedA).toBe(true);
    resolveA(payload);
  });

  test('retains the last coherent group snapshot after a later refresh fails', async () => {
    const payload = await readFile(fixture('current.pb'));
    let attempt = 0;
    const coordinator = createSourceCoordinator({
      realtimeGroups: [source('group-a')],
      retrieve: async () => {
        attempt += 1;
        if (attempt === 2) throw new Error('temporary failure');
        return payload;
      },
      now: () => retrievedAt,
    });

    await coordinator.refreshAll();
    const accepted = coordinator.getRealtimeSnapshot('group-a');
    await coordinator.refreshAll();
    expect(coordinator.getRealtimeSnapshot('group-a')).toBe(accepted);
  });
});

function context(overrides: Partial<{ sourceId: string; feedGroupId: string; sourceUrl: string; retrievedAt: Date }> = {}) {
  return {
    sourceId: 'subway-rt-ace',
    feedGroupId: 'ace',
    sourceUrl: 'https://api-endpoint.mta.info/ace',
    retrievedAt,
    ...overrides,
  };
}

function realtimeJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    header: { gtfsRealtimeVersion: '2.0', incrementality: 'FULL_DATASET', timestamp: 1785823200 },
    entity: [tripEntity()],
    ...overrides,
  };
}

function tripEntity(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'trip-update-a',
    tripUpdate: {
      trip: { tripId: 'trip-a', routeId: 'A', directionId: 0, startDate: '20260804', startTime: '02:00:00' },
      stopTimeUpdate: [stopCall(2, 'A24N', 1785823320), stopCall(3, 'A25N', 1785823500)],
      ...overrides,
    },
  };
}

function stopCall(stopSequence: number, stopId: string, arrival: number): Record<string, unknown> {
  return { stopSequence, stopId, arrival: { time: arrival } };
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
  return { ...source('subway-alerts'), role: 'subway-alerts' as const, supports: ['service-changes'] as const };
}
