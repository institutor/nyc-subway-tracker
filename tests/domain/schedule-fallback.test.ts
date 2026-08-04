import { describe, expect, test } from 'vitest';

import { ScheduleEditionRegistry, type ScheduleCoverageMask } from '../../src/shared/domain/schedule-owner';
import { FeedHealthGovernor } from '../../src/shared/domain/feed-health';
import {
  buildScheduleFallback,
  type ScheduleFallbackInput,
} from '../../src/shared/domain/schedule-fallback';
import type {
  NormalizedStaticGtfs,
  StaticGtfsEditionCandidate,
  StopTimeRecord,
} from '../../src/server/gtfs/static-normalizer';

const BASE = new Date('2026-08-05T03:55:00.000Z'); // 11:55 PM New York, service date 20260804
const iso = (seconds: number) => new Date(BASE.getTime() + seconds * 1_000).toISOString();
const mask: ScheduleCoverageMask = {
  id: 'weekend', routeIds: ['A', '2'], serviceDates: ['20260804'], effectiveFrom: iso(-3600), effectiveUntil: iso(7200),
  directions: ['northbound'],
};

function stopTime(tripId: string, time: string, sequence = 13, stopId = 'A24N', rowIdentity?: string): StopTimeRecord {
  const [hour, minute, second] = time.split(':').map(Number);
  const seconds = hour * 3600 + minute * 60 + second;
  return { tripId, arrivalTime: time, departureTime: time, arrivalSeconds: seconds, departureSeconds: seconds,
    stopId, stopSequence: sequence, rowIdentity: rowIdentity ?? `${tripId}:${sequence}:${time}` };
}

function data(times: readonly [string, string][], overrides: Partial<NormalizedStaticGtfs> = {}): NormalizedStaticGtfs {
  const trips = times.map(([tripId], index) => ({
    tripId, routeId: tripId.startsWith('2') ? '2' : 'A', serviceId: 'WKND', headsign: 'Inwood-207 St',
    directionId: '0', shapeId: '', rowIdentity: `trip:${tripId}`,
  }));
  const stopTimes = times.map(([tripId, time]) => stopTime(tripId, time));
  return {
    agencies: [], routes: [{ routeId: 'A', agencyId: '', shortName: 'A', longName: '', rowIdentity: 'route:A' },
      { routeId: '2', agencyId: '', shortName: '2', longName: '', rowIdentity: 'route:2' }],
    stops: [{ stopId: 'A24N', name: '14 St', latitude: null, longitude: null, locationType: '', parentStation: 'A24', direction: 'northbound', rowIdentity: 'stop:A24N' }],
    trips, stopTimes,
    calendars: [{ serviceId: 'WKND', weekdays: [true, true, true, true, true, true, true], startDate: '20260801', endDate: '20260831', rowIdentity: 'cal' }],
    calendarDates: [], transfers: [], shapes: [], structuralTransfers: [], stationComplexes: [],
    servicePatterns: trips.map((trip) => ({ tripId: trip.tripId, routeId: trip.routeId, direction: 'northbound', headsign: trip.headsign, stopIds: ['A24N'] })),
    ...overrides,
  };
}

function edition(source: 'supplemented-gtfs' | 'regular-gtfs', id: string, schedule: NormalizedStaticGtfs, coverage = [mask]): StaticGtfsEditionCandidate {
  return {
    source, canonicalContentId: id, retrievedAt: iso(-60), publishedAt: iso(-120), sourceOrder: source === 'supplemented-gtfs' ? 1 : undefined,
    coverage, wrapper: {}, semanticTables: new Map(), data: schedule,
  };
}

function input(registry: ScheduleEditionRegistry, overrides: Partial<ScheduleFallbackInput> = {}): ScheduleFallbackInput {
  return {
    feedDecision: { feedGroupId: 'ace', kind: 'unavailable', fallbackEligibility: 'eligible', presentation: 'none' },
    scope: { feedGroupId: 'ace', exactStopId: 'A24N', direction: 'northbound', operationalAxis: 'uptown',
      comparisonAt: BASE, serviceDates: ['20260804'], routeIds: ['A', '2'] },
    registry,
    ...overrides,
  };
}

describe('fallback entry and static ownership', () => {
  test('enters only for the exact unavailable eligible group and keeps 180 preservation separate from 181 fallback', () => {
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'supp', data([['trip', '24:05:00']])));
    expect(buildScheduleFallback(input(registry)).mode).toBe('scheduled-fallback');
    for (const feedDecision of [
      { feedGroupId: 'ace', kind: 'degraded' as const, fallbackEligibility: 'blocked' as const, presentation: 'frozen-last-good' as const },
      { feedGroupId: 'ace', kind: 'unavailable' as const, fallbackEligibility: 'blocked' as const, presentation: 'frozen-last-good' as const },
      { feedGroupId: 'other', kind: 'unavailable' as const, fallbackEligibility: 'eligible' as const, presentation: 'none' as const },
    ]) expect(buildScheduleFallback(input(registry, { feedDecision }))).toMatchObject({ rows: [], mode: 'not-eligible' });
  });

  test('no-prior proven unavailable may fallback immediately', () => {
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('regular-gtfs', 'regular', data([['trip', '24:05:00']])));
    expect(buildScheduleFallback(input(registry))).toMatchObject({ mode: 'scheduled-fallback', rows: [{ arrival: { kind: 'scheduled' } }] });
  });

  test('preserves through exactly 180 feed-age seconds and admits fallback at 181', () => {
    const governor = new FeedHealthGovernor();
    governor.observe({ sourceId: 'ace', feedGroupId: 'ace', feedTimestamp: BASE, retrievedAt: BASE,
      contentHash: 'accepted', entityCount: 10, coveredRouteIds: ['A'] }, BASE);
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'boundary', data([['trip', '24:05:00']])));
    expect(buildScheduleFallback(input(registry, { feedDecision: governor.assess('ace', new Date(BASE.getTime() + 180_000)) })))
      .toMatchObject({ mode: 'not-eligible', rows: [] });
    expect(buildScheduleFallback(input(registry, { feedDecision: governor.assess('ace', new Date(BASE.getTime() + 181_000)) })))
      .toMatchObject({ mode: 'scheduled-fallback', rows: [{}] });
  });

  test('a usable supplement owns the whole mask even when a trip or exact stop is omitted', () => {
    const regular = data([['regular-trip', '24:05:00']]);
    for (const supplement of [data([]), data([['supp-trip', '24:05:00']], { stopTimes: [] })]) {
      const registry = new ScheduleEditionRegistry();
      registry.observe(edition('regular-gtfs', `regular-${supplement.stopTimes.length}`, regular));
      registry.observe(edition('supplemented-gtfs', `supp-${supplement.stopTimes.length}`, supplement));
      expect(buildScheduleFallback(input(registry))).toMatchObject({ rows: [], explanation: 'No scheduled departures available.' });
    }
  });

  test('regular GTFS owns only scope outside every usable supplemented mask', () => {
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('regular-gtfs', 'regular', data([['regular-trip', '24:05:00']])));
    registry.observe(edition('supplemented-gtfs', 'other-direction', data([['supp-trip', '24:04:00']]), [{ ...mask, directions: ['southbound'] }]));
    expect(buildScheduleFallback(input(registry))).toMatchObject({ source: 'regular-gtfs', rows: [{ occurrenceId: '20260804:regular-trip:13' }] });
  });

  test('selects the owner at each departure instant instead of at board comparison time', () => {
    const regularMask = { ...mask, routeIds: ['A'], effectiveFrom: '2026-08-05T02:55:00.000Z', effectiveUntil: '2026-08-05T05:55:00.000Z' };
    const supplementMask = { ...mask, routeIds: ['A'], effectiveFrom: '2026-08-05T04:00:00.000Z', effectiveUntil: '2026-08-05T04:15:00.000Z' };
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('regular-gtfs', 'regular-claim-owner', data([['regular-trip', '24:05:00']]), [regularMask]));
    registry.observe(edition('supplemented-gtfs', 'supplement-claim-owner', data([['supp-trip', '24:05:00']]), [supplementMask]));

    expect(buildScheduleFallback(input(registry, { scope: { ...input(registry).scope, routeIds: ['A'] } }))).toMatchObject({
      source: 'supplemented-gtfs',
      rows: [{ occurrenceId: '20260804:supp-trip:13' }],
    });
  });

  test('does not let a supplement that ended before departure mask the regular occurrence', () => {
    const regularMask = { ...mask, routeIds: ['A'], effectiveFrom: '2026-08-05T02:55:00.000Z', effectiveUntil: '2026-08-05T05:55:00.000Z' };
    const endedSupplementMask = { ...mask, routeIds: ['A'], effectiveFrom: '2026-08-05T03:30:00.000Z', effectiveUntil: '2026-08-05T04:00:00.000Z' };
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('regular-gtfs', 'regular-after-mask', data([['regular-trip', '24:05:00']]), [regularMask]));
    registry.observe(edition('supplemented-gtfs', 'ended-supplement', data([]), [endedSupplementMask]));

    expect(buildScheduleFallback(input(registry, { scope: { ...input(registry).scope, routeIds: ['A'] } }))).toMatchObject({
      source: 'regular-gtfs',
      rows: [{ occurrenceId: '20260804:regular-trip:13' }],
    });
  });

  test('combines independently selected route owners without per-occurrence source competition', () => {
    const aSchedule = data([['a-trip', '24:05:00']]);
    const cBase = data([['c-trip', '24:06:00']]);
    const cSchedule: NormalizedStaticGtfs = {
      ...cBase,
      routes: [{ routeId: 'C', agencyId: '', shortName: 'C', longName: '', rowIdentity: 'route:C' }],
      trips: cBase.trips.map((trip) => ({ ...trip, routeId: 'C' })),
      servicePatterns: cBase.servicePatterns.map((pattern) => ({ ...pattern, routeId: 'C' })),
    };
    const cMask = { ...mask, id: 'c-mask', routeIds: ['C'] };
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'a-owner', aSchedule, [{ ...mask, routeIds: ['A'] }]));
    registry.observe(edition('regular-gtfs', 'c-owner', cSchedule, [cMask]));
    const result = buildScheduleFallback(input(registry, { scope: { ...input(registry).scope, routeIds: ['A', 'C'] } }));
    expect(result).toMatchObject({ source: 'mixed', rows: [
      { occurrenceId: '20260804:a-trip:13', source: 'supplemented-gtfs' },
      { occurrenceId: '20260804:c-trip:13', source: 'regular-gtfs' },
    ] });
  });

  test('preserves requested route/service-date tuples instead of inventing their Cartesian product', () => {
    const base = data([['a-trip', '24:05:00'], ['c-trip', '24:06:00']]);
    const schedule: NormalizedStaticGtfs = {
      ...base,
      routes: [...base.routes, { routeId: 'C', agencyId: '', shortName: 'C', longName: '', rowIdentity: 'route:C' }],
      trips: base.trips.map((trip) => trip.tripId === 'c-trip' ? { ...trip, routeId: 'C' } : trip),
      servicePatterns: base.servicePatterns.map((pattern) => pattern.tripId === 'c-trip' ? { ...pattern, routeId: 'C' } : pattern),
      calendars: [{ ...base.calendars[0], startDate: '20260804', endDate: '20260805' }],
    };
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('regular-gtfs', 'paired-scope', schedule, [{
      ...mask,
      routeIds: ['A', 'C'],
      serviceDates: ['20260804', '20260805'],
      effectiveUntil: '2026-08-06T05:55:00.000Z',
    }]));

    const scoped = input(registry).scope;
    expect(() => buildScheduleFallback(input(registry, { scope: {
      ...scoped,
      routeIds: ['A', 'C'],
      serviceDates: ['20260804', '20260805'],
    } }))).toThrow(/explicit route\/service-date tuples/i);
    const result = buildScheduleFallback(input(registry, { scope: {
      ...scoped,
      routeIds: ['A', 'C'],
      serviceDates: ['20260804', '20260805'],
      routeServiceDates: [
        { routeId: 'A', serviceDate: '20260804' },
        { routeId: 'C', serviceDate: '20260805' },
      ],
    } }));
    expect(result.rows.map((row) => row.occurrenceId)).toEqual([
      '20260804:a-trip:13',
      '20260805:c-trip:13',
    ]);
  });

  test('uses current and stale owners for departures but never a topology-only supplement', () => {
    for (const [ageSeconds, source, currency] of [
      [120, 'supplemented-gtfs', 'current'],
      [3 * 3600, 'supplemented-gtfs', 'stale'],
      [25 * 3600, 'none', undefined],
    ] as const) {
      const registry = new ScheduleEditionRegistry();
      registry.observe({ ...edition('supplemented-gtfs', `age-${ageSeconds}`, data([['trip', '24:05:00']])),
        retrievedAt: iso(-ageSeconds), publishedAt: iso(-ageSeconds) });
      expect(buildScheduleFallback(input(registry))).toMatchObject({ source, ...(currency ? { currency } : {}), rows: currency ? [{}] : [] });
    }
  });

  test('preserves scope ownership metadata for an empty but covered board', () => {
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'empty-covered-owner', data([]), [{ ...mask, routeIds: ['A'] }]));
    expect(buildScheduleFallback(input(registry, { scope: { ...input(registry).scope, routeIds: ['A'] } }))).toMatchObject({
      source: 'supplemented-gtfs',
      currency: 'current',
      rows: [],
      explanation: 'No scheduled departures available.',
    });
  });

  test('enumerates only trips active on the exact operating service date, including calendar exceptions', () => {
    const removed = data([['removed', '24:05:00']], {
      calendarDates: [{ serviceId: 'WKND', date: '20260804', exceptionType: 2, rowIdentity: 'removed-date' }],
    });
    const added = data([['added', '24:05:00']], {
      calendars: [{ serviceId: 'WKND', weekdays: [false, false, false, false, false, false, false], startDate: '20260801', endDate: '20260831', rowIdentity: 'cal' }],
      calendarDates: [{ serviceId: 'WKND', date: '20260804', exceptionType: 1, rowIdentity: 'added-date' }],
    });
    for (const [schedule, count] of [[removed, 0], [added, 1]] as const) {
      const registry = new ScheduleEditionRegistry();
      registry.observe(edition('supplemented-gtfs', `exception-${count}`, schedule));
      expect(buildScheduleFallback(input(registry)).rows).toHaveLength(count);
    }
  });
});

describe('explicit future departures and deterministic fallback boards', () => {
  test('excludes past/equal departures, admits beyond-24:00 New York service time, and uses departure over a past arrival', () => {
    const schedule = data([['past', '23:54:59'], ['equal', '23:55:00'], ['future', '24:05:00']]);
    const future = schedule.stopTimes.find((item) => item.tripId === 'future')!;
    const changed = { ...future, arrivalTime: '23:54:00', arrivalSeconds: 86_040 };
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'times', { ...schedule, stopTimes: schedule.stopTimes.map((item) => item.tripId === 'future' ? changed : item) }));
    expect(buildScheduleFallback(input(registry))).toMatchObject({
      rows: [{ occurrenceId: '20260804:future:13', arrival: { kind: 'scheduled', at: new Date('2026-08-05T04:05:00.000Z') } }],
      explanation: 'No additional scheduled departures available.',
    });
    expect(buildScheduleFallback(input(registry)).rows[0].arrival.provenance).toMatchObject({
      sourceId: 'supplemented-gtfs:times', observedAt: new Date(iso(-120)), retrievedAt: new Date(iso(-60)),
    });
  });

  test.each([
    {
      label: 'fall-back ambiguity', serviceDate: '20261101', comparisonAt: new Date('2026-11-01T04:00:00.000Z'),
      invalidTime: '01:30:00', validTime: '03:00:00', validAt: new Date('2026-11-01T08:00:00.000Z'),
      disposition: 'ambiguous-service-time',
    },
    {
      label: 'spring-forward gap', serviceDate: '20260308', comparisonAt: new Date('2026-03-08T05:00:00.000Z'),
      invalidTime: '02:30:00', validTime: '03:30:00', validAt: new Date('2026-03-08T07:30:00.000Z'),
      disposition: 'nonexistent-service-time',
    },
  ])('isolates a $label to its occurrence and retains valid departures', ({
    serviceDate, comparisonAt, invalidTime, validTime, validAt, disposition,
  }) => {
    const schedule = data([['invalid-dst', invalidTime], ['valid-dst', validTime]], {
      calendars: [{ serviceId: 'WKND', weekdays: [true, true, true, true, true, true, true], startDate: serviceDate, endDate: serviceDate, rowIdentity: 'dst-cal' }],
    });
    const coverage = [{
      ...mask,
      routeIds: ['A'],
      serviceDates: [serviceDate],
      effectiveFrom: comparisonAt.toISOString(),
      effectiveUntil: new Date(comparisonAt.getTime() + 12 * 3600_000).toISOString(),
    }];
    const candidate = edition('regular-gtfs', `dst-${serviceDate}`, schedule, coverage);
    const registry = new ScheduleEditionRegistry();
    registry.observe({
      ...candidate,
      retrievedAt: new Date(comparisonAt.getTime() - 60_000).toISOString(),
      publishedAt: new Date(comparisonAt.getTime() - 120_000).toISOString(),
    });

    const result = buildScheduleFallback(input(registry, { scope: {
      ...input(registry).scope,
      comparisonAt,
      routeIds: ['A'],
      serviceDates: [serviceDate],
    } }));
    expect(result.rows).toMatchObject([{ occurrenceId: `${serviceDate}:valid-dst:13`, arrival: { at: validAt } }]);
    expect(result.exclusions).toContainEqual({
      occurrenceId: `${serviceDate}:invalid-dst:13`,
      disposition,
    });
  });

  test('preserves distinct same-time trains, collapses exact duplicates, and withholds unresolved occurrence conflicts', () => {
    const base = data([['one', '24:05:00'], ['two', '24:05:00']]);
    const exactDuplicate = { ...base.stopTimes[0] };
    const conflict = { ...base.stopTimes[0], departureTime: '24:06:00', departureSeconds: 86_760, rowIdentity: 'conflict' };
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'duplicates', { ...base, stopTimes: [...base.stopTimes, exactDuplicate, conflict] }));
    expect(buildScheduleFallback(input(registry)).rows.map((item) => item.occurrenceId)).toEqual(['20260804:two:13']);
  });

  test('orders all tie-break layers, visits shuffled input identically, and caps after exclusions', () => {
    const times: [string, string][] = [['z', '24:07:00'], ['a2', '24:05:00'], ['a1', '24:05:00'], ['later', '24:08:00'], ['2train', '24:05:00']];
    const make = (ordered: typeof times) => {
      const schedule = data(ordered);
      const registry = new ScheduleEditionRegistry();
      registry.observe(edition('supplemented-gtfs', 'stable-content', schedule));
      return buildScheduleFallback(input(registry));
    };
    const first = make(times);
    const second = make([...times].reverse());
    expect(first.rows.map((item) => item.occurrenceId)).toEqual(['20260804:2train:13', '20260804:a1:13', '20260804:a2:13']);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test('isolates direction/group/axis and returns honest partial and empty explanations', () => {
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'partial', data([['one', '24:05:00'], ['two', '24:06:00']])));
    expect(buildScheduleFallback(input(registry))).toMatchObject({ rows: [{}, {}], explanation: 'No additional scheduled departures available.' });
    expect(buildScheduleFallback(input(registry, { scope: { ...input(registry).scope, exactStopId: 'A24S', direction: 'southbound' } })))
      .toMatchObject({ rows: [], explanation: 'No scheduled departures available.' });
    expect(buildScheduleFallback(input(registry)).rows).toHaveLength(2);
  });
});

describe('vetoes and hard-suppression carryover', () => {
  test('current resolved veto and high-impact unresolved scope defeat optimistic static times', () => {
    for (const disposition of ['resolved-ineligible', 'high-impact-unresolved'] as const) {
      const registry = new ScheduleEditionRegistry();
      registry.observe(edition('supplemented-gtfs', disposition, data([['blocked', '24:05:00'], ['unrelated', '24:06:00']])));
      const result = buildScheduleFallback(input(registry, {
        claimDisposition: (claim) => claim.tripId === 'blocked' ? disposition : 'eligible',
      }));
      expect(result.rows.map((item) => item.occurrenceId)).toEqual(['20260804:unrelated:13']);
      expect(result.exclusions).toContainEqual(expect.objectContaining({ occurrenceId: '20260804:blocked:13', disposition }));
    }
  });

  test('static sources and an unavailable feed cannot clear prior hard suppression, including from a stale readmission token', () => {
    for (const status of ['hard-suppressed', 'precision-withheld', 'live-readmission-eligible'] as const) {
      const registry = new ScheduleEditionRegistry();
      registry.observe(edition('supplemented-gtfs', status, data([['blocked', '24:05:00'], ['unrelated', '24:06:00']])));
      expect(buildScheduleFallback(input(registry, { recoveryDisposition: (claim) => claim.tripId === 'blocked' ? status : 'none' })).rows.map((item) => item.occurrenceId))
        .toEqual(['20260804:unrelated:13']);
    }
  });

  test('a thrown malformed input is atomic and repeated valid evaluation is idempotent', () => {
    const registry = new ScheduleEditionRegistry();
    registry.observe(edition('supplemented-gtfs', 'atomic', data([['one', '24:05:00']])));
    const before = buildScheduleFallback(input(registry));
    expect([before, before.rows, before.exclusions, before.rows[0], before.rows[0].arrival,
      before.rows[0].arrival.route, before.rows[0].arrival.provenance].every(Object.isFrozen)).toBe(true);
    expect(() => buildScheduleFallback(input(registry, { scope: { ...input(registry).scope, comparisonAt: new Date(Number.NaN) } })))
      .toThrow(/invalid/i);
    expect(buildScheduleFallback(input(registry))).toEqual(before);
    expect(() => buildScheduleFallback(input(registry, {
      claimDisposition: () => 'eligible',
      recoveryDisposition: () => 'forged-live' as never,
    }))).toThrow(/invalid fallback recovery disposition/i);
    expect(() => buildScheduleFallback(input(registry, {
      claimDisposition: () => 'maybe' as never,
    }))).toThrow(/invalid scheduled claim disposition/i);
    for (const forged of [
      input(registry, { feedDecision: { ...input(registry).feedDecision, kind: 'offline' as never } }),
      input(registry, { feedDecision: { ...input(registry).feedDecision, fallbackEligibility: 'maybe' as never } }),
      input(registry, { feedDecision: { ...input(registry).feedDecision, presentation: 'ghost' as never } }),
      input(registry, { scope: { ...input(registry).scope, direction: 'sideways' as never } }),
      input(registry, { claimDisposition: 'callback' as never }),
    ]) expect(() => buildScheduleFallback(forged)).toThrow(/invalid|exact schedule fallback scope/i);
    expect(buildScheduleFallback(input(registry))).toEqual(before);
  });
});
