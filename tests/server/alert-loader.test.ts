import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

import { decodeAlertSnapshotJson } from '../../src/server/gtfs/alert-loader';

const fixture = resolve('tests', 'fixtures', 'alerts', 'subway-alerts.json');
const context = {
  sourceId: 'subway-alerts',
  sourceUrl: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys/subway-alerts',
  retrievedAt: new Date('2026-08-04T06:01:00.000Z'),
};

describe('subway alert normalization', () => {
  test('extracts safe plain text while preserving the exact official source text', async () => {
    const feed = JSON.parse(await readFile(fixture, 'utf8'));
    const snapshot = decodeAlertSnapshotJson(feed, context);

    expect(snapshot.alerts[0]).toMatchObject({
      id: 'delay-trip-a',
      kind: 'train-delay',
      officialText: 'A trains are delayed & moving slowly.',
      rawOfficialText: '<b>A trains</b> are delayed &amp; moving slowly.',
      description: 'Allow additional travel time.',
      cause: 'TECHNICAL_PROBLEM',
      effect: 'SIGNIFICANT_DELAYS',
    });
  });

  test('retains bounded and open-ended active intervals exactly', async () => {
    const feed = JSON.parse(await readFile(fixture, 'utf8'));
    const snapshot = decodeAlertSnapshotJson(feed, context);

    expect(snapshot.alerts[0].activePeriods).toEqual([{
      startsAt: new Date('2026-08-04T05:55:00.000Z'),
      endsAt: new Date('2026-08-04T07:00:00.000Z'),
    }]);
    expect(snapshot.alerts[1].activePeriods).toEqual([{
      startsAt: new Date('2026-08-05T06:00:00.000Z'),
      endsAt: null,
    }]);
  });

  test('preserves each informed entity as an exact route, trip, stop, and raw direction scope', async () => {
    const feed = JSON.parse(await readFile(fixture, 'utf8'));
    const snapshot = decodeAlertSnapshotJson(feed, context);

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

  test('retains source/feed provenance and does not infer omitted alert fields', async () => {
    const feed = JSON.parse(await readFile(fixture, 'utf8'));
    const snapshot = decodeAlertSnapshotJson(feed, context);

    expect(snapshot).toMatchObject({
      sourceId: 'subway-alerts',
      sourceUrl: context.sourceUrl,
      feedTimestamp: new Date('2026-08-04T06:00:00.000Z'),
      retrievedAt: context.retrievedAt,
      entityCount: 2,
    });
    expect(snapshot.alerts[1].activePeriods[0]).toMatchObject({ endsAt: null });
    expect(snapshot.alerts[1].informedEntities[0]).toMatchObject({ routeId: 'C', trip: null });
  });

  test('rejects malformed or contradictory alert records as a whole snapshot', async () => {
    const feed = JSON.parse(await readFile(fixture, 'utf8'));
    const duplicate = { ...feed, entity: [feed.entity[0], { ...feed.entity[0] }] };
    expect(() => decodeAlertSnapshotJson(duplicate, context)).toThrow(/duplicate entity/i);

    const reversed = structuredClone(feed);
    reversed.entity[0].alert.activePeriod[0] = { start: 1785826800, end: 1785822900 };
    expect(() => decodeAlertSnapshotJson(reversed, context)).toThrow(/active period/i);

    const contradictory = structuredClone(feed);
    contradictory.entity[0].alert.informedEntity[0].trip.routeId = 'C';
    expect(() => decodeAlertSnapshotJson(contradictory, context)).toThrow(/contradictory.*route/i);
  });
});
