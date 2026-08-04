import { describe, expect, test } from 'vitest';

import {
  admitArrivalCandidate,
  type ArrivalAdmissionCandidate,
  type ArrivalBoardScope,
} from '../../src/shared/domain/arrival-admission';
import {
  orderPrimaryArrivals,
  type PrimaryOrderRow,
} from '../../src/shared/domain/arrival-order';
import {
  canonicalStopCallIdentity,
  resolveTrainContinuity,
} from '../../src/shared/domain/train-identity';

const BASE = new Date('2026-08-04T12:00:00.000Z');
const at = (seconds: number) => new Date(BASE.getTime() + seconds * 1_000);

const scope: ArrivalBoardScope = {
  feedGroupId: 'ace',
  exactStopId: 'A24N',
  direction: 'northbound',
  destination: 'Inwood-207 St',
  comparisonAt: BASE,
};

function candidate(overrides: Partial<ArrivalAdmissionCandidate> = {}): ArrivalAdmissionCandidate {
  return {
    stableTrainIdentity: 'train-a',
    publishedTripId: 'trip-a',
    patternIdentity: 'A23N:12>A24N:13>A25N:14',
    feedGroupId: 'ace',
    route: { id: 'A', label: 'A' },
    routeOrderKind: 'lettered',
    direction: 'northbound',
    destination: 'Inwood-207 St',
    remainingStopCalls: [
      { stopId: 'A23N', sourceStopSequence: 12, arrivalAt: at(120), departureAt: at(130) },
      { stopId: 'A24N', sourceStopSequence: 13, arrivalAt: at(300), departureAt: at(310) },
    ],
    serviceDisposition: 'eligible',
    trackDisposition: 'eligible',
    freshness: 'current',
    identityDisposition: 'coherent',
    recoveryDisposition: 'live-continuity',
    movementDisposition: 'plausible',
    confidence: { kind: 'live', supportedRange: { startsAt: at(285), endsAt: at(315) } },
    provenance: {
      source: 'gtfs-rt',
      sourceId: 'ace-feed',
      observedAt: BASE,
      retrievedAt: BASE,
    },
    ...overrides,
  };
}

describe('canonical exact-stop and train identity admission', () => {
  test('admits only an explicit future call at the exact directional stop', () => {
    expect(admitArrivalCandidate(candidate(), scope)).toMatchObject({
      kind: 'admitted',
      confidence: 'live',
      row: { stableTrainIdentity: 'train-a', arrival: { kind: 'live', at: at(300) } },
    });

    for (const [changed, gate] of [
      [candidate({ direction: 'southbound' }), 'destination-direction'],
      [candidate({ destination: 'Euclid Av' }), 'destination-direction'],
      [candidate({ remainingStopCalls: [{ stopId: 'A24S', sourceStopSequence: 13, arrivalAt: at(300), departureAt: at(310) }] }), 'exact-stop'],
      [candidate({ remainingStopCalls: [{ stopId: 'A24N', sourceStopSequence: 13, arrivalAt: at(300), departureAt: at(310), scheduleRelationship: 'SKIPPED' }] }), 'exact-stop'],
      [candidate({ remainingStopCalls: [{ stopId: 'A24N', sourceStopSequence: 13, arrivalAt: at(-1), departureAt: at(-1) }] }), 'exact-stop'],
      [candidate({ feedGroupId: 'nqrw' }), 'candidate'],
      [candidate({ identityDisposition: 'ambiguous' }), 'identity-recovery'],
    ] as const) {
      expect(admitArrivalCandidate(changed, scope)).toMatchObject({ kind: 'rejected', failedGate: gate });
    }
  });

  test('uses a future departure when arrival is past and never repairs from mutable remainingOrder', () => {
    const result = admitArrivalCandidate(candidate({
      remainingStopCalls: [{ stopId: 'A24N', sourceStopSequence: 13, arrivalAt: at(-2), departureAt: at(2) }],
      confidence: { kind: 'live', supportedRange: { startsAt: at(1), endsAt: at(3) } },
    }), scope);
    expect(result).toMatchObject({ kind: 'admitted', row: { arrival: { at: at(2) } } });

    expect(canonicalStopCallIdentity({ stopId: 'A24N', sourceStopSequence: 13, remainingOrder: 9 }))
      .toBe('A24N\u0000sequence:13');
    expect(canonicalStopCallIdentity({ stopId: 'A24N', occurrenceId: '20260804:trip-a:13', remainingOrder: 1 }))
      .toBe('A24N\u0000occurrence:20260804:trip-a:13');
    expect(() => canonicalStopCallIdentity({ stopId: 'A24N', remainingOrder: 0 })).toThrow(/stable stop-call occurrence/i);
    expect(() => admitArrivalCandidate(candidate({
      remainingStopCalls: [
        { stopId: 'A24N', arrivalAt: at(100), departureAt: at(110) },
        { stopId: 'A24N', arrivalAt: at(200), departureAt: at(210) },
      ],
    }), scope)).toThrow(/stable stop-call occurrence/i);
  });

  test('admits Live only when the selected future event is inside the closed supported range', () => {
    for (const supportedRange of [
      { startsAt: at(300), endsAt: at(400) },
      { startsAt: at(200), endsAt: at(300) },
    ]) {
      const decision = admitArrivalCandidate(candidate({ confidence: { kind: 'live', supportedRange } }), scope);
      expect(decision).toMatchObject({ kind: 'admitted', confidence: 'live', row: { arrival: { at: at(300) } } });
      if (decision.kind !== 'admitted') throw new Error('closed endpoint fixture must admit');
      expect(() => orderPrimaryArrivals([decision.row])).not.toThrow();
    }

    for (const supportedRange of [
      { startsAt: at(301), endsAt: at(400) },
      { startsAt: at(200), endsAt: at(299) },
      { startsAt: at(400), endsAt: at(500) },
    ]) {
      expect(admitArrivalCandidate(candidate({ confidence: { kind: 'live', supportedRange } }), scope)).toMatchObject({
        kind: 'rejected',
        failedGate: 'movement-time',
        disposition: 'live-event-outside-supported-range',
        boardTreatment: 'quarantine-or-limitation',
      });
    }
  });

  test('keeps distinct same-time trains and is source-order independent', () => {
    const rows = ['train-b', 'train-a'].map((stableTrainIdentity) => {
      const decision = admitArrivalCandidate(candidate({ stableTrainIdentity, publishedTripId: stableTrainIdentity }), scope);
      if (decision.kind !== 'admitted') throw new Error('fixture must admit');
      return decision.row;
    });
    expect(orderPrimaryArrivals(rows, 3).map((row) => row.stableTrainIdentity)).toEqual(['train-a', 'train-b']);
    expect(JSON.stringify(orderPrimaryArrivals(rows, 3))).toBe(JSON.stringify(orderPrimaryArrivals([...rows].reverse(), 3)));
  });

  test('admits Expected only through the exact coherent two-update origin pair and never through recovery', () => {
    const expectedUpdate = (seconds: number) => ({
      evidenceId: `expected-${seconds}`, sourceTimestamp: at(seconds), stableTrainIdentity: 'train-a',
      patternIdentity: 'A23N:12>A24N:13>A25N:14', direction: 'northbound' as const, destination: 'Inwood-207 St',
      exactTargetStopCallIdentity: 'A24N\u0000sequence:13', assignedPhysicalTrain: true, atOrigin: true,
      movementObserved: false, overdueVerdict: 'not-overdue' as const,
      supportedRange: { startsAt: at(360), endsAt: at(480) }, accepted: true,
      feedGroupId: 'ace', sourceId: 'ace-feed', observedAt: at(seconds),
    });
    const expected = candidate({ confidence: { kind: 'expected', updates: [expectedUpdate(-10), expectedUpdate(0)] } });
    const admitted = admitArrivalCandidate(expected, scope);
    expect(admitted).toMatchObject({
      kind: 'admitted', confidence: 'expected', row: { arrival: {
        kind: 'expected', estimateAt: at(420), provenance: { sourceId: 'ace-feed', observedAt: BASE, retrievedAt: BASE },
      } },
    });
    expect(admitted.kind === 'admitted' && [admitted, admitted.row, admitted.row.arrival,
      admitted.row.arrival.route, admitted.row.arrival.provenance, admitted.row.supportedRange]
      .every(Object.isFrozen)).toBe(true);
    if (admitted.kind !== 'admitted') throw new Error('Expected fixture must admit');
    expect(() => orderPrimaryArrivals([admitted.row])).not.toThrow();
    expect(admitArrivalCandidate({ ...expected, recoveryDisposition: 'live-readmission-eligible' }, scope))
      .toMatchObject({ kind: 'rejected', failedGate: 'identity-recovery' });
    expect(admitArrivalCandidate(candidate({ recoveryDisposition: 'live-readmission-eligible' }), scope))
      .toMatchObject({ kind: 'admitted', confidence: 'live' });
  });

  test('rejects an internally stable Expected pair that contradicts candidate, board, source, or chronology', () => {
    const baseUpdate = (seconds: number) => ({
      evidenceId: `scope-${seconds}`, sourceTimestamp: at(seconds), observedAt: at(seconds),
      stableTrainIdentity: 'train-a', patternIdentity: 'A23N:12>A24N:13>A25N:14',
      direction: 'northbound' as const, destination: 'Inwood-207 St', exactTargetStopCallIdentity: 'A24N\u0000sequence:13',
      feedGroupId: 'ace', sourceId: 'ace-feed', assignedPhysicalTrain: true, atOrigin: true,
      movementObserved: false, overdueVerdict: 'not-overdue' as const,
      supportedRange: { startsAt: at(360), endsAt: at(480) }, accepted: true,
    });
    const cases = [
      [{ ...baseUpdate(-10), direction: 'southbound' as const }, { ...baseUpdate(0), direction: 'southbound' as const }],
      [{ ...baseUpdate(-10), destination: 'Euclid Av' }, { ...baseUpdate(0), destination: 'Euclid Av' }],
      [{ ...baseUpdate(-10), patternIdentity: 'wrong-pattern' }, { ...baseUpdate(0), patternIdentity: 'wrong-pattern' }],
      [{ ...baseUpdate(-10), exactTargetStopCallIdentity: 'A25N\u0000sequence:14' }, { ...baseUpdate(0), exactTargetStopCallIdentity: 'A25N\u0000sequence:14' }],
      [{ ...baseUpdate(-10), feedGroupId: 'nqrw' }, { ...baseUpdate(0), feedGroupId: 'nqrw' }],
      [{ ...baseUpdate(-10), sourceId: 'other-feed' }, { ...baseUpdate(0), sourceId: 'other-feed' }],
      [baseUpdate(-10), { ...baseUpdate(1), sourceTimestamp: at(1), observedAt: at(1) }],
    ];
    for (const updates of cases) {
      expect(admitArrivalCandidate(candidate({ confidence: { kind: 'expected', updates } } as never), scope))
        .toMatchObject({ kind: 'rejected' });
    }
  });

  test('requires deterministic exclusive one-to-one continuity across changed published IDs', () => {
    const before = [{
      publishedTripId: 'old', stableTrainIdentity: 'old-instance', internalTrainMarker: '0421', routeId: 'A',
      direction: 'northbound' as const, serviceDate: '20260804', orderedStopCallIdentities: ['A23N:12', 'A24N:13'],
      track: '1', destination: 'Inwood-207 St', predictedAt: at(300), disappearedAt: at(0),
    }];
    const replacement = [{
      ...before[0], publishedTripId: 'new', stableTrainIdentity: 'new-descriptor-id', predictedAt: at(305), appearedAt: at(1),
    }];
    const governed = { similarTime: () => true, immediateReplacement: () => true };
    expect(resolveTrainContinuity(before, replacement, governed)).toMatchObject({
      joins: [{ priorIdentity: 'old-instance', currentIdentity: 'new-descriptor-id' }], quarantined: [],
    });
    expect(resolveTrainContinuity([...before, { ...before[0], stableTrainIdentity: 'old-2' }], replacement, governed))
      .toMatchObject({ joins: [], quarantined: ['new-descriptor-id', 'old-2', 'old-instance'] });
    expect(resolveTrainContinuity(before, [{ ...replacement[0], appearedAt: at(-1) }], governed)).toMatchObject({ joins: [] });
    expect(() => resolveTrainContinuity(before, [{ ...replacement[0], appearedAt: new Date(Number.NaN) }], governed))
      .toThrow(/invalid current appearance/i);
  });

  test('requires coherent track on both sides and returns role-qualified unmatched/quarantined continuity evidence', () => {
    const prior = [{
      publishedTripId: 'old', stableTrainIdentity: 'old-instance', internalTrainMarker: '0421', routeId: 'A',
      direction: 'northbound' as const, serviceDate: '20260804', orderedStopCallIdentities: ['A23N:12', 'A24N:13'],
      track: '1', destination: 'Cafe\u0301', predictedAt: at(300), disappearedAt: at(0),
    }];
    const current = [{
      publishedTripId: 'new', stableTrainIdentity: 'new-instance', internalTrainMarker: '0421', routeId: 'A',
      direction: 'northbound' as const, serviceDate: '20260804', orderedStopCallIdentities: ['A23N:12', 'A24N:13'],
      track: null, destination: 'Café', predictedAt: at(305), appearedAt: at(1),
    }];
    const governed = { similarTime: () => true, immediateReplacement: () => true };
    expect(resolveTrainContinuity(prior, current, governed)).toMatchObject({
      joins: [],
      unmatched: { prior: ['old-instance'], current: ['new-instance'] },
      quarantinedEvidence: [
        { role: 'current', identity: 'new-instance', reason: 'track-path-unresolved' },
        { role: 'prior', identity: 'old-instance', reason: 'track-path-unresolved' },
      ],
    });
    const coherent = resolveTrainContinuity(prior, [{ ...current[0], track: '1' }], governed);
    expect(coherent).toMatchObject({ joins: [{ priorIdentity: 'old-instance', currentIdentity: 'new-instance' }] });
    expect(() => resolveTrainContinuity(prior, [{ ...current[0], track: '1' }], {
      similarTime: () => 'yes' as never, immediateReplacement: () => true,
    })).toThrow(/invalid governed similar-time result/i);
  });

  test('returns deterministic role-qualified unmatched outcomes instead of silently dropping no-edge evidence', () => {
    const prior = [{
      publishedTripId: 'old', stableTrainIdentity: 'prior-z', routeId: 'A', direction: 'northbound' as const,
      serviceDate: '20260804', orderedStopCallIdentities: ['A23N:12'], track: '1', destination: 'Inwood',
      predictedAt: at(100), disappearedAt: at(0),
    }];
    const current = [{
      publishedTripId: 'new', stableTrainIdentity: 'current-a', routeId: 'C', direction: 'northbound' as const,
      serviceDate: '20260804', orderedStopCallIdentities: ['A23N:12'], track: '1', destination: 'Inwood',
      predictedAt: at(100), appearedAt: at(1),
    }];
    const governed = { similarTime: () => true, immediateReplacement: () => true };
    expect(resolveTrainContinuity(prior, current, governed)).toMatchObject({
      unmatched: { prior: ['prior-z'], current: ['current-a'] },
      quarantinedEvidence: [
        { role: 'current', identity: 'current-a', reason: 'no-exclusive-continuity' },
        { role: 'prior', identity: 'prior-z', reason: 'no-exclusive-continuity' },
      ],
    });
  });

  test('canonicalizes stable identities before duplicate detection', () => {
    expect(() => orderPrimaryArrivals([
      row('é', 'live', 100, 90, 110),
      row('e\u0301', 'live', 100, 90, 110),
    ], 3)).toThrow(/duplicate primary train identity/i);
  });

  test('canonical duplicate exact-stop occurrences quarantine the claim instead of throwing', () => {
    const result = admitArrivalCandidate(candidate({ remainingStopCalls: [
      { stopId: 'A24N', occurrenceId: 'Café', arrivalAt: at(100), departureAt: at(110) },
      { stopId: 'A24N', occurrenceId: 'Cafe\u0301', arrivalAt: at(100), departureAt: at(110) },
    ] }), scope);
    expect(result).toMatchObject({ kind: 'rejected', failedGate: 'exact-stop', boardTreatment: 'quarantine-or-limitation' });
  });

  test('rejects forged runtime discriminants atomically and never treats Scheduled as Live primary', () => {
    const valid = admitArrivalCandidate(candidate(), scope);
    for (const forged of [
      candidate({ confidence: { kind: 'scheduled' } as never }),
      candidate({ direction: 'sideways' as never }),
      candidate({ recoveryDisposition: 'restored' as never }),
      candidate({ identityDisposition: 'maybe' as never }),
      candidate({ movementDisposition: 'moving-ish' as never }),
      candidate({ routeOrderKind: 'popular' as never }),
      candidate({ provenance: { ...candidate().provenance, source: 'regular-gtfs' } }),
      candidate({ provenance: { ...candidate().provenance, retrievedAt: at(1) } }),
    ]) expect(() => admitArrivalCandidate(forged, scope)).toThrow(/invalid|resolved direction|confidence/i);
    expect(() => admitArrivalCandidate(candidate(), { ...scope, direction: 'sideways' as never })).toThrow(/scope|direction/i);
    expect(admitArrivalCandidate(candidate(), scope)).toEqual(valid);
  });

  test('maps every non-primary seam to a typed secondary, suppression, unavailable, or limitation treatment', () => {
    expect(admitArrivalCandidate(candidate({ movementDisposition: 'holding' }), scope))
      .toMatchObject({ kind: 'secondary', confidence: 'holding' });
    expect(admitArrivalCandidate(candidate({ movementDisposition: 'uncertain' }), scope))
      .toMatchObject({ kind: 'secondary', confidence: 'uncertain' });
    expect(admitArrivalCandidate(candidate({ serviceDisposition: 'resolved-ineligible' }), scope))
      .toMatchObject({ kind: 'rejected', boardTreatment: 'resolved-suppression' });
    expect(admitArrivalCandidate(candidate({ serviceDisposition: 'high-impact-unresolved' }), scope))
      .toMatchObject({ kind: 'rejected', boardTreatment: 'arrival-claim-unavailable' });
    expect(admitArrivalCandidate(candidate({ serviceDisposition: 'quarantined' }), scope))
      .toMatchObject({ kind: 'rejected', boardTreatment: 'quarantine-or-limitation' });
    expect(admitArrivalCandidate(candidate({ freshness: 'degraded' }), scope))
      .toMatchObject({ kind: 'rejected', boardTreatment: 'feed-updating' });
    expect(admitArrivalCandidate(candidate({ recoveryDisposition: 'precision-withheld' }), scope))
      .toMatchObject({ kind: 'rejected', boardTreatment: 'precision-withheld' });
  });

  test('fails closed in the fixed gate order and validates atomically', () => {
    const broken = candidate({
      remainingStopCalls: [],
      serviceDisposition: 'resolved-ineligible',
      freshness: 'unavailable',
      identityDisposition: 'ambiguous',
    });
    expect(admitArrivalCandidate(broken, scope)).toMatchObject({ kind: 'rejected', failedGate: 'exact-stop' });
    const valid = admitArrivalCandidate(candidate(), scope);
    expect(() => admitArrivalCandidate({ ...candidate(), direction: 'unknown' } as ArrivalAdmissionCandidate, scope))
      .toThrow(/resolved direction/i);
    expect(admitArrivalCandidate(candidate(), scope)).toEqual(valid);
  });
});

function row(
  id: string,
  kind: 'live' | 'expected',
  estimateSeconds: number,
  lowerSeconds: number,
  upperSeconds: number,
  overrides: Partial<PrimaryOrderRow> = {},
): PrimaryOrderRow {
  const common = {
    id,
    route: { id: 'A', label: 'A' },
    direction: 'northbound' as const,
    destination: 'Inwood-207 St',
    provenance: candidate().provenance,
  };
  return {
    stableTrainIdentity: id,
    routeOrderKind: 'lettered',
    supportedRange: { startsAt: at(lowerSeconds), endsAt: at(upperSeconds) },
    arrival: kind === 'live'
      ? { ...common, kind: 'live', at: at(estimateSeconds) }
      : { ...common, kind: 'expected', estimateAt: at(estimateSeconds), range: { startsAt: at(lowerSeconds), endsAt: at(upperSeconds) } },
    ...overrides,
  };
}

describe('deterministic primary ordering', () => {
  test('uses Expected center, then lower and upper bounds before every stable textual tie-break', () => {
    const expected = row('center', 'expected', 999, 199, 201);
    const live = row('live', 'live', 202, 202, 202);
    expect(orderPrimaryArrivals([live, expected], 3).map((item) => item.stableTrainIdentity)).toEqual(['center', 'live']);

    const ties = [
      row('z', 'live', 300, 290, 320, { arrival: { ...row('z', 'live', 300, 290, 320).arrival, route: { id: 'Q', label: 'Q' }, destination: 'Zulu' } }),
      row('n10', 'live', 300, 290, 310, { routeOrderKind: 'numbered', arrival: { ...row('n10', 'live', 300, 290, 310).arrival, route: { id: '10', label: '10' } } }),
      row('n2', 'live', 300, 290, 310, { routeOrderKind: 'numbered', arrival: { ...row('n2', 'live', 300, 290, 310).arrival, route: { id: '2', label: '2' } } }),
      row('a-z', 'live', 300, 290, 310, { arrival: { ...row('a-z', 'live', 300, 290, 310).arrival, route: { id: 'A', label: 'A' }, destination: 'Zulu' } }),
      row('a-alpha-b', 'live', 300, 290, 310, { arrival: { ...row('a-alpha-b', 'live', 300, 290, 310).arrival, route: { id: 'A', label: 'A' }, destination: 'Alpha' } }),
      row('a-alpha-a', 'live', 300, 290, 310, { arrival: { ...row('a-alpha-a', 'live', 300, 290, 310).arrival, route: { id: 'A', label: 'A' }, destination: 'Alpha' } }),
      row('shuttle', 'live', 300, 290, 310, { routeOrderKind: 'shuttle', arrival: { ...row('shuttle', 'live', 300, 290, 310).arrival, route: { id: 'S', label: 'Franklin Avenue Shuttle' } } }),
      row('other', 'live', 300, 290, 310, { routeOrderKind: 'other', arrival: { ...row('other', 'live', 300, 290, 310).arrival, route: { id: 'X', label: 'Airport Express' } } }),
    ];
    expect(orderPrimaryArrivals(ties, 20).map((item) => item.stableTrainIdentity)).toEqual([
      'n2', 'n10', 'a-alpha-a', 'a-alpha-b', 'a-z', 'shuttle', 'other', 'z',
    ]);
  });

  test('promotes Live only across the maximal contiguous directly overlapping Expected block using closed endpoints', () => {
    const earlier = row('expected-earlier', 'expected', 100, 90, 110);
    const overlapA = row('expected-a', 'expected', 200, 180, 220);
    const overlapB = row('expected-b', 'expected', 205, 200, 230);
    const live = row('live', 'live', 220, 220, 240);
    expect(orderPrimaryArrivals([live, overlapB, earlier, overlapA], 10).map((item) => item.stableTrainIdentity))
      .toEqual(['expected-earlier', 'live', 'expected-a', 'expected-b']);
  });

  test('does not promote through non-overlap, chain-only overlap, or an earlier Live barrier', () => {
    const expectedDirect = row('direct', 'expected', 100, 90, 120);
    const expectedChain = row('chain', 'expected', 105, 110, 140);
    const live = row('late-live', 'live', 130, 130, 150);
    expect(orderPrimaryArrivals([expectedDirect, expectedChain, live], 10).map((item) => item.stableTrainIdentity))
      .toEqual(['direct', 'late-live', 'chain']);

    const firstLive = row('first-live', 'live', 100, 90, 140);
    const expected = row('expected', 'expected', 110, 100, 150);
    const secondLive = row('second-live', 'live', 120, 110, 160);
    expect(orderPrimaryArrivals([firstLive, expected, secondLive], 10).map((item) => item.stableTrainIdentity))
      .toEqual(['first-live', 'second-live', 'expected']);
  });

  test('visits multiple Live rows once in initial sequence and caps only after promotion', () => {
    const rows = [
      row('e1', 'expected', 100, 90, 110), row('l1', 'live', 110, 100, 120),
      row('e2', 'expected', 120, 115, 125), row('l2', 'live', 130, 120, 140), row('e3', 'expected', 145, 130, 160),
    ];
    expect(orderPrimaryArrivals(rows, 3).map((item) => item.stableTrainIdentity)).toEqual(['l1', 'e1', 'l2']);
  });
});
