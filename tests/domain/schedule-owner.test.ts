import { describe, expect, test } from 'vitest';

import type { StaticGtfsEditionCandidate } from '../../src/server/gtfs/static-normalizer';
import {
  ScheduleEditionRegistry,
  type ScheduleClaim,
  type ScheduleCoverageMask,
} from '../../src/shared/domain/schedule-owner';

const HOUR = 60 * 60 * 1000;
const BASE = Date.parse('2026-08-04T12:00:00.000Z');

describe('schedule edition observation and currency', () => {
  test.each([
    ['age zero', 0, 'current'],
    ['exactly two hours', 2 * HOUR, 'current'],
    ['first millisecond beyond two hours', 2 * HOUR + 1, 'stale'],
    ['exactly 24 hours', 24 * HOUR, 'stale'],
    ['first millisecond beyond 24 hours', 24 * HOUR + 1, 'topology'],
  ] as const)('classifies %s with inclusive governed boundaries', (_label, age, state) => {
    const registry = new ScheduleEditionRegistry();
    const observed = registry.observe(candidate('edition-a', {
      publishedAt: new Date(BASE - age),
      retrievedAt: new Date(BASE - Math.min(age, HOUR)),
      sourceOrder: 1,
    }));

    expect(observed.status).toBe('accepted-new');
    expect(registry.classify(observed.editionId!, claim(), new Date(BASE))).toMatchObject({ state, ageMs: age });
  });

  test('uses accepted publication or first retrieval as separate truthful age anchors', () => {
    const registry = new ScheduleEditionRegistry();
    const published = registry.observe(candidate('published', {
      publishedAt: new Date(BASE - 3 * HOUR),
      retrievedAt: new Date(BASE - 10 * 60_000),
      sourceOrder: 1,
    }));
    const firstRetrieved = registry.observe(candidate('retrieval-only', {
      source: 'regular-gtfs',
      retrievedAt: new Date(BASE - HOUR),
    }));

    expect(registry.classify(published.editionId!, claim(), new Date(BASE))).toMatchObject({
      state: 'stale',
      ageAnchorKind: 'published',
      ageMs: 3 * HOUR,
      lastRetrievalAgeMs: 10 * 60_000,
    });
    expect(registry.classify(firstRetrieved.editionId!, claim(), new Date(BASE))).toMatchObject({
      state: 'current',
      ageAnchorKind: 'first-retrieved',
      ageMs: HOUR,
      lastRetrievalAgeMs: HOUR,
    });
  });

  test('quarantines every future, regressed, contradictory, or retrieval-only changed edition', () => {
    const registry = new ScheduleEditionRegistry();
    expect(
      registry.observe(candidate('future', { publishedAt: new Date(BASE + 1), retrievedAt: new Date(BASE), sourceOrder: 1 })),
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/future publication/i) });

    const accepted = registry.observe(candidate('accepted', {
      publishedAt: new Date(BASE - HOUR),
      retrievedAt: new Date(BASE),
      sourceOrder: 2,
    }));
    expect(accepted.status).toBe('accepted-new');
    expect(
      registry.observe(candidate('regressed', {
        publishedAt: new Date(BASE - 2 * HOUR),
        retrievedAt: new Date(BASE + HOUR),
        sourceOrder: 3,
      })),
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/publication chronology/i) });
    expect(
      registry.observe(candidate('source-order-regressed', {
        publishedAt: new Date(BASE + HOUR),
        retrievedAt: new Date(BASE + HOUR),
        sourceOrder: 1,
      })),
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/source chronology/i) });
    expect(
      registry.observe(candidate('retrieval-is-not-chronology', { retrievedAt: new Date(BASE + 2 * HOUR) })),
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/source-supported chronology/i) });
    expect(
      registry.observe(candidate('equal-publication-is-not-later', {
        publishedAt: new Date(BASE - HOUR),
        retrievedAt: new Date(BASE + 2 * HOUR),
      })),
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/source-supported chronology/i) });
  });

  test('unchanged canonical content and wrapper-only changes remain one edition with the original anchor', () => {
    const registry = new ScheduleEditionRegistry();
    const first = registry.observe(candidate('same-content', {
      publishedAt: new Date(BASE - HOUR),
      retrievedAt: new Date(BASE - 30 * 60_000),
      sourceOrder: 1,
      wrapper: { filename: 'first.zip', label: 'v1' },
    }));
    const repeated = registry.observe(candidate('same-content', {
      publishedAt: new Date(BASE + 10 * HOUR),
      retrievedAt: new Date(BASE + 3 * HOUR),
      sourceOrder: 99,
      wrapper: { filename: 'second.zip', label: 'wrapper-only' },
    }));

    expect(repeated).toMatchObject({ status: 'accepted-observation', editionId: first.editionId });
    expect(registry.editions()).toHaveLength(1);
    expect(registry.classify(first.editionId!, claim(), new Date(BASE + 3 * HOUR))).toMatchObject({
      state: 'stale',
      ageAnchorKind: 'published',
      ageMs: 4 * HOUR,
      lastRetrievalAgeMs: 0,
    });
  });

  test('a failed or quarantined new edition never erases the last validated edition', () => {
    const registry = new ScheduleEditionRegistry();
    const retained = registry.observe(candidate('retained', {
      publishedAt: new Date(BASE - HOUR),
      retrievedAt: new Date(BASE),
      sourceOrder: 1,
    }));
    registry.recordFailedObservation({
      source: 'supplemented-gtfs',
      retrievedAt: new Date(BASE + HOUR),
      reason: 'truncated archive',
    });
    registry.observe(candidate('bad-new', {
      publishedAt: new Date(BASE - 2 * HOUR),
      retrievedAt: new Date(BASE + HOUR),
      sourceOrder: 2,
    }));

    expect(registry.editions()).toHaveLength(1);
    expect(registry.select(claim(), new Date(BASE + HOUR))).toMatchObject({
      source: 'supplemented-gtfs',
      editionId: retained.editionId,
    });
    expect(registry.failedObservations()).toHaveLength(1);
  });
});

describe('claim-scoped supersession and schedule ownership', () => {
  test('later validated content supersedes monotonically only inside overlap', () => {
    const registry = new ScheduleEditionRegistry();
    const earlier = registry.observe(candidate('earlier', {
      publishedAt: new Date(BASE - HOUR),
      retrievedAt: new Date(BASE),
      sourceOrder: 1,
      coverage: [mask('earlier-wide', ['A'], '2026-08-04T10:00:00.000Z', '2026-08-04T20:00:00.000Z')],
    }));
    const later = registry.observe(candidate('later', {
      publishedAt: new Date(BASE),
      retrievedAt: new Date(BASE),
      sourceOrder: 2,
      coverage: [mask('later-narrow', ['A'], '2026-08-04T12:00:00.000Z', '2026-08-04T14:00:00.000Z')],
    }));

    const inside = claim({ at: '2026-08-04T13:00:00.000Z' });
    const outside = claim({ at: '2026-08-04T18:00:00.000Z' });
    expect(registry.classify(earlier.editionId!, inside, new Date(BASE))).toMatchObject({
      state: 'topology',
      superseded: true,
    });
    expect(registry.select(inside, new Date(BASE))).toMatchObject({ editionId: later.editionId });
    expect(registry.select(outside, new Date(BASE))).toMatchObject({ editionId: earlier.editionId });

    expect(registry.select(inside, new Date(BASE + 25 * HOUR))).toMatchObject({
      source: 'none',
      reason: expect.stringMatching(/no usable schedule/i),
    });
    expect(registry.classify(earlier.editionId!, inside, new Date(BASE + 25 * HOUR))).toMatchObject({
      state: 'topology',
      superseded: true,
    });
  });

  test('non-overlapping editions retain their own coverage and never infer order from retrieval', () => {
    const registry = new ScheduleEditionRegistry();
    const morning = registry.observe(candidate('morning', {
      publishedAt: new Date(BASE - 2 * HOUR),
      retrievedAt: new Date(BASE - HOUR),
      sourceOrder: 1,
      coverage: [mask('morning', ['A'], '2026-08-04T08:00:00.000Z', '2026-08-04T10:00:00.000Z')],
    }));
    const evening = registry.observe(candidate('evening', {
      publishedAt: new Date(BASE - HOUR),
      retrievedAt: new Date(BASE),
      sourceOrder: 2,
      coverage: [mask('evening', ['A'], '2026-08-04T18:00:00.000Z', '2026-08-04T20:00:00.000Z')],
    }));

    expect(registry.select(claim({ at: '2026-08-04T09:00:00.000Z' }), new Date(BASE))).toMatchObject({
      editionId: morning.editionId,
    });
    expect(registry.select(claim({ at: '2026-08-04T19:00:00.000Z' }), new Date(BASE))).toMatchObject({
      editionId: evening.editionId,
    });
  });

  test('supplemented masks own claims independently of trip occurrence and exclude regular only while usable', () => {
    const registry = new ScheduleEditionRegistry();
    const regular = registry.observe(candidate('regular-has-omitted-trip', {
      source: 'regular-gtfs',
      retrievedAt: new Date(BASE),
      coverage: [mask('regular', ['A', 'B'])],
      tripIds: ['regular-omitted'],
    }));
    const supplement = registry.observe(candidate('supplement-omits-trip', {
      publishedAt: new Date(BASE),
      retrievedAt: new Date(BASE),
      sourceOrder: 1,
      coverage: [mask('supplement-a', ['A'])],
      tripIds: ['different-trip'],
    }));

    const covered = claim({ routeId: 'A', occurrenceId: 'regular-omitted' });
    expect(registry.select(covered, new Date(BASE))).toMatchObject({
      source: 'supplemented-gtfs',
      editionId: supplement.editionId,
      occurrencePresent: false,
    });
    expect(registry.select(claim({ routeId: 'B' }), new Date(BASE))).toMatchObject({
      source: 'regular-gtfs',
      editionId: regular.editionId,
    });
    const refreshedRegular = registry.observe(candidate('regular-refreshed', {
      source: 'regular-gtfs',
      retrievedAt: new Date(BASE + 24 * HOUR),
      coverage: [mask('regular', ['A', 'B'])],
      tripIds: ['regular-omitted'],
    }));
    expect(registry.select(covered, new Date(BASE + 24 * HOUR + 1))).toMatchObject({
      source: 'regular-gtfs',
      editionId: refreshedRegular.editionId,
      occurrencePresent: true,
    });
  });

  test('a topology-only regular edition cannot emit a scheduled occurrence', () => {
    const registry = new ScheduleEditionRegistry();
    registry.observe(candidate('expired-regular', {
      source: 'regular-gtfs',
      retrievedAt: new Date(BASE - 24 * HOUR - 1),
      coverage: [mask('regular', ['A'])],
    }));

    expect(registry.select(claim(), new Date(BASE))).toMatchObject({
      source: 'none',
      reason: expect.stringMatching(/no usable schedule/i),
    });
  });

  test('coverage boundaries are inclusive and direction/service-date mismatches are uncovered', () => {
    const registry = new ScheduleEditionRegistry();
    const supplement = registry.observe(candidate('boundary', {
      publishedAt: new Date(BASE),
      retrievedAt: new Date(BASE),
      sourceOrder: 1,
      coverage: [mask('bounded', ['A'], '2026-08-04T12:00:00.000Z', '2026-08-04T14:00:00.000Z')],
    }));

    expect(registry.select(claim({ at: '2026-08-04T12:00:00.000Z' }), new Date(BASE))).toMatchObject({
      editionId: supplement.editionId,
    });
    expect(registry.select(claim({ at: '2026-08-04T14:00:00.000Z' }), new Date(BASE))).toMatchObject({
      editionId: supplement.editionId,
    });
    expect(
      registry.select(claim({ at: '2026-08-04T14:00:00.001Z' }), new Date(BASE)),
    ).toMatchObject({ source: 'none' });
    expect(registry.select(claim({ direction: 'southbound' }), new Date(BASE))).toMatchObject({ source: 'none' });
    expect(registry.select(claim({ serviceDate: '20260805' }), new Date(BASE))).toMatchObject({ source: 'none' });
  });
});

function candidate(
  canonicalContentId: string,
  overrides: Omit<Partial<StaticGtfsEditionCandidate>, 'retrievedAt' | 'publishedAt'> & {
    retrievedAt?: Date;
    publishedAt?: Date;
    tripIds?: string[];
  } = {},
): StaticGtfsEditionCandidate {
  const coverage = overrides.coverage ?? [mask('default', ['A'])];
  const tripIds = overrides.tripIds ?? ['trip-a'];
  return {
    source: overrides.source ?? 'supplemented-gtfs',
    canonicalContentId: `sha256:${canonicalContentId.padEnd(64, '0').slice(0, 64)}`,
    sourceOrder: overrides.sourceOrder,
    coverage,
    wrapper: overrides.wrapper ?? {},
    semanticTables: new Map(),
    data: {
      agencies: [], routes: [], stops: [], trips: tripIds.map((tripId) => ({ tripId, routeId: 'A', serviceId: 'WEEK', headsign: 'Uptown', directionId: '0', shapeId: '' , rowIdentity: tripId })),
      stopTimes: [], calendars: [], calendarDates: [], transfers: [], shapes: [], servicePatterns: [], structuralTransfers: [], stationComplexes: [],
    },
    ...overrides,
    retrievedAt: (overrides.retrievedAt ?? new Date(BASE)).toISOString(),
    publishedAt: overrides.publishedAt?.toISOString(),
  } as StaticGtfsEditionCandidate;
}

function mask(
  id: string,
  routeIds: string[],
  effectiveFrom = '2026-08-04T00:00:00.000Z',
  effectiveUntil = '2026-08-05T00:00:00.000Z',
): ScheduleCoverageMask {
  return {
    id,
    routeIds,
    serviceDates: ['20260804'],
    effectiveFrom,
    effectiveUntil,
    directions: ['northbound'],
  };
}

function claim(overrides: Partial<ScheduleClaim> = {}): ScheduleClaim {
  return {
    routeId: 'A',
    serviceDate: '20260804',
    at: '2026-08-04T13:00:00.000Z',
    direction: 'northbound',
    occurrenceId: 'trip-a',
    ...overrides,
  };
}
