import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { decodeAlertSnapshotJson } from '../../src/server/gtfs/alert-loader';

const fixture = resolve('tests', 'fixtures', 'alerts', 'subway-alerts.json');

describe('separately owned subway system-alert normalization', () => {
  test('selects English, preserves exact untrimmed source text, and derives separate safe plain text', async () => {
    const bytes = await readFile(fixture);
    const snapshot = decodeAlertSnapshotJson(bytes, context(bytes));

    expect(snapshot.alerts[0]).toMatchObject({
      id: 'delay-trip-a',
      kind: 'train-delay',
      officialText: 'A trains are delayed & moving slowly.',
      rawOfficialText: '  <b>A trains</b> are delayed &amp; moving slowly.\n',
      language: 'en',
      description: 'Allow additional travel time.',
      cause: 'TECHNICAL_PROBLEM',
      effect: 'SIGNIFICANT_DELAYS',
    });
  });

  test('retains bounded and open-ended active intervals exactly', async () => {
    const bytes = await readFile(fixture);
    const snapshot = decodeAlertSnapshotJson(bytes, context(bytes));

    expect(snapshot.alerts[0].activePeriods).toEqual([{
      startsAt: new Date('2026-08-04T05:55:00.000Z'),
      endsAt: new Date('2026-08-04T07:00:00.000Z'),
    }]);
    expect(snapshot.alerts[1].activePeriods).toEqual([{
      startsAt: new Date('2026-08-05T06:00:00.000Z'),
      endsAt: null,
    }]);
  });

  test('preserves separate exact scopes and does not widen missing trip, stop, or direction fields', async () => {
    const bytes = await readFile(fixture);
    const snapshot = decodeAlertSnapshotJson(bytes, context(bytes));

    expect(snapshot.alerts[0].informedEntities).toEqual([{
      agencyId: null,
      routeId: 'A',
      routeType: null,
      stopId: 'A24N',
      directionId: null,
      trip: {
        tripId: 'trip-a',
        routeId: 'A',
        directionId: 0,
        startDate: '20260804',
        startTime: '02:00:00',
        nyct: { trainId: null, isAssigned: null, direction: null },
      },
    }]);
    expect(snapshot.alerts[1]).toMatchObject({
      kind: 'system',
      informedEntities: [
        { routeId: 'C', stopId: 'A32S', directionId: 1, trip: null },
        { routeId: 'E', stopId: null, directionId: null, trip: null },
      ],
    });
  });

  test('rejects duplicate canonical informed-entity scopes instead of double-counting impact', async () => {
    const bytes = await readFile(fixture);
    const feed = JSON.parse(new TextDecoder().decode(bytes));
    feed.entity[0].alert.informedEntity.push(structuredClone(feed.entity[0].alert.informedEntity[0]));
    const duplicateBytes = new TextEncoder().encode(JSON.stringify(feed));

    expect(() => decodeAlertSnapshotJson(duplicateBytes, context(duplicateBytes))).toThrow(/duplicate informed-entity scope/i);
  });

  test('retains exact retrieval provenance and exact JSON bytes rather than hashing re-encoded protobuf', async () => {
    const bytes = await readFile(fixture);
    const loaderContext = context(bytes);
    const snapshot = decodeAlertSnapshotJson(bytes, loaderContext);

    expect(snapshot.provenance).toEqual(loaderContext.provenance);
    expect(snapshot.rawEvidence).toEqual({
      evidenceId: `sha256:${sha256(bytes)}`,
      mediaType: 'application/json',
      receivedBytes: bytes.byteLength,
      payloadBase64: Buffer.from(bytes).toString('base64'),
    });
    expect(snapshot.alerts[0].evidenceId).toBe(snapshot.rawEvidence.evidenceId);
  });

  test('rejects malformed, duplicate-entity, reversed-period, and contradictory alert records', async () => {
    const bytes = await readFile(fixture);
    const feed = JSON.parse(new TextDecoder().decode(bytes));

    expect(() => decodeAlertSnapshotJson(Uint8Array.of(0xff), context(Uint8Array.of(0xff))))
      .toThrow(/parse.*JSON/i);

    const duplicate = structuredClone(feed);
    duplicate.entity.push(structuredClone(duplicate.entity[0]));
    const duplicateBytes = jsonBytes(duplicate);
    expect(() => decodeAlertSnapshotJson(duplicateBytes, context(duplicateBytes))).toThrow(/duplicate entity/i);

    const reversed = structuredClone(feed);
    reversed.entity[0].alert.activePeriod[0] = { start: 1785826800, end: 1785822900 };
    const reversedBytes = jsonBytes(reversed);
    expect(() => decodeAlertSnapshotJson(reversedBytes, context(reversedBytes))).toThrow(/active period/i);

    const contradictory = structuredClone(feed);
    contradictory.entity[0].alert.informedEntity[0].trip.routeId = 'C';
    const contradictoryBytes = jsonBytes(contradictory);
    expect(() => decodeAlertSnapshotJson(contradictoryBytes, context(contradictoryBytes))).toThrow(/contradictory.*route/i);
  });
});

function context(bytes: Uint8Array) {
  const sourceUrl = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys/subway-alerts';
  return {
    provenance: {
      sourceId: 'subway-alerts',
      sourceAuthority: 'MTA',
      sourceRole: 'subway-alerts',
      sourceUrl,
      retrievedAt: '2026-08-04T06:01:00.000Z',
      finalUrl: sourceUrl,
      redirectCount: 0,
      declaredContentType: 'application/json',
      observedContentType: 'application/json',
      declaredBytes: bytes.byteLength,
      receivedBytes: bytes.byteLength,
      sha256: sha256(bytes),
    },
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}
