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
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/contradictory chronology/i) });
    expect(
      registry.observe(candidate('source-order-regressed', {
        publishedAt: new Date(BASE + HOUR),
        retrievedAt: new Date(BASE + HOUR),
        sourceOrder: 1,
      })),
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/contradictory chronology/i) });
    expect(
      registry.observe(candidate('retrieval-is-not-chronology', { retrievedAt: new Date(BASE + 2 * HOUR) })),
    ).toMatchObject({ status: 'quarantined', reason: expect.stringMatching(/incomparable chronology/i) });
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

  test('changed regular content cannot gain selection order from regressed publication chronology', () => {
    const registry = new ScheduleEditionRegistry();
    const retained = registry.observe(candidate('regular-retained', {
      source: 'regular-gtfs',
      publishedAt: new Date(BASE - HOUR),
      retrievedAt: new Date(BASE),
    }));
    const regressed = registry.observe(candidate('regular-regressed', {
      source: 'regular-gtfs',
      publishedAt: new Date(BASE - 2 * HOUR),
      retrievedAt: new Date(BASE + HOUR),
    }));

    expect(regressed).toMatchObject({
      status: 'quarantined',
      reason: expect.stringMatching(/publication chronology/i),
    });
    expect(registry.editions()).toHaveLength(1);
    expect(registry.select(claim(), new Date(BASE + HOUR))).toMatchObject({
      source: 'regular-gtfs',
      editionId: retained.editionId,
    });
  });

  test('changed supplemented content is quarantined when chronology axes are incomparable in either direction', () => {
    const publicationFirst = new ScheduleEditionRegistry();
    const retainedPublication = publicationFirst.observe(candidate('publication-first', {
      publishedAt: new Date(BASE - HOUR),
      retrievedAt: new Date(BASE),
    }));
    expect(publicationFirst.observe(candidate('order-only-next', {
      sourceOrder: 2,
      retrievedAt: new Date(BASE + HOUR),
    }))).toMatchObject({
      status: 'quarantined',
      reason: expect.stringMatching(/incomparable chronology/i),
    });
    expect(publicationFirst.editions()).toHaveLength(1);
    expect(publicationFirst.select(claim(), new Date(BASE + HOUR))).toMatchObject({
      editionId: retainedPublication.editionId,
    });

    const orderFirst = new ScheduleEditionRegistry();
    const retainedOrder = orderFirst.observe(candidate('order-first', {
      sourceOrder: 1,
      retrievedAt: new Date(BASE),
    }));
    expect(orderFirst.observe(candidate('publication-only-next', {
      publishedAt: new Date(BASE),
      retrievedAt: new Date(BASE + HOUR),
    }))).toMatchObject({
      status: 'quarantined',
      reason: expect.stringMatching(/incomparable chronology/i),
    });
    expect(orderFirst.editions()).toHaveLength(1);
    expect(orderFirst.select(claim(), new Date(BASE + HOUR))).toMatchObject({
      editionId: retainedOrder.editionId,
    });
  });

  test('multiple chronology axes must all establish the same strict later ordering', () => {
    const equalRegistry = new ScheduleEditionRegistry();
    const equalRetained = equalRegistry.observe(candidate('both-retained-equal', {
      publishedAt: new Date(BASE - HOUR),
      sourceOrder: 1,
      retrievedAt: new Date(BASE),
    }));
    expect(equalRegistry.observe(candidate('equal-publication', {
      publishedAt: new Date(BASE - HOUR),
      sourceOrder: 2,
      retrievedAt: new Date(BASE + HOUR),
    }))).toMatchObject({
      status: 'quarantined',
      reason: expect.stringMatching(/contradictory chronology/i),
    });
    expect(equalRegistry.editions()).toHaveLength(1);
    expect(equalRegistry.select(claim(), new Date(BASE + HOUR))).toMatchObject({
      editionId: equalRetained.editionId,
    });

    const conflictRegistry = new ScheduleEditionRegistry();
    const conflictRetained = conflictRegistry.observe(candidate('both-retained-conflict', {
      publishedAt: new Date(BASE - HOUR),
      sourceOrder: 2,
      retrievedAt: new Date(BASE),
    }));
    expect(conflictRegistry.observe(candidate('axes-disagree', {
      publishedAt: new Date(BASE),
      sourceOrder: 1,
      retrievedAt: new Date(BASE + HOUR),
    }))).toMatchObject({
      status: 'quarantined',
      reason: expect.stringMatching(/contradictory chronology/i),
    });
    expect(conflictRegistry.editions()).toHaveLength(1);
    expect(conflictRegistry.select(claim(), new Date(BASE + HOUR))).toMatchObject({
      editionId: conflictRetained.editionId,
    });
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
      sourceOrder: 1,
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
      sourceOrder: 2,
      coverage: [mask('regular', ['A', 'B'])],
      tripIds: ['regular-omitted'],
    }));
    expect(registry.select(covered, new Date(BASE + 24 * HOUR + 1))).toMatchObject({
      source: 'regular-gtfs',
      editionId: refreshedRegular.editionId,
      occurrencePresent: true,
    });
  });

  test('a supplemented trip that omits the exact claimed stop still owns the occurrence without regular resurrection', () => {
    const registry = new ScheduleEditionRegistry();
    const regular = registry.observe(candidate('regular-full-pattern', {
      source: 'regular-gtfs',
      retrievedAt: new Date(BASE),
      coverage: [mask('regular-a', ['A'])],
      tripIds: ['shared-trip'],
      stopCalls: [
        { tripId: 'shared-trip', stopId: 'C1N', rowIdentity: 'regular-c1' },
        { tripId: 'shared-trip', stopId: 'C2N', rowIdentity: 'regular-c2' },
      ],
    }));
    const supplement = registry.observe(candidate('supplement-short-pattern', {
      publishedAt: new Date(BASE),
      retrievedAt: new Date(BASE),
      sourceOrder: 1,
      coverage: [mask('supplement-a', ['A'])],
      tripIds: ['shared-trip'],
      stopCalls: [{ tripId: 'shared-trip', stopId: 'C1N', rowIdentity: 'supplement-c1' }],
    }));

    expect(registry.select(claim({ occurrenceId: 'shared-trip', stopId: 'C2N' }), new Date(BASE))).toMatchObject({
      source: 'supplemented-gtfs',
      editionId: supplement.editionId,
      occurrencePresent: false,
    });
    expect(registry.select(claim({ occurrenceId: 'shared-trip', stopId: 'C1N' }), new Date(BASE))).toMatchObject({
      source: 'supplemented-gtfs',
      editionId: supplement.editionId,
      occurrencePresent: true,
    });
    expect(
      registry.select(
        claim({ occurrenceId: 'shared-trip', stopTimeOccurrenceId: 'supplement-c1' }),
        new Date(BASE),
      ),
    ).toMatchObject({
      source: 'supplemented-gtfs',
      editionId: supplement.editionId,
      occurrencePresent: true,
    });
    expect(regular.status).toBe('accepted-new');
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
    stopCalls?: Array<{ tripId: string; stopId: string; rowIdentity: string }>;
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
      stopTimes: (overrides.stopCalls ?? []).map((call, index) => ({
        ...call,
        arrivalTime: '10:00:00',
        departureTime: '10:00:00',
        arrivalSeconds: 36_000,
        departureSeconds: 36_000,
        stopSequence: index + 1,
      })), calendars: [], calendarDates: [], transfers: [], shapes: [], servicePatterns: [], structuralTransfers: [], stationComplexes: [],
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
