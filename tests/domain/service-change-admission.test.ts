import { describe, expect, test } from 'vitest';
import {
  admitArrivalCandidate,
  type ArrivalAdmissionCandidate,
  type ArrivalBoardScope,
} from '../../src/shared/domain/arrival-admission';
import { classifyAlertSnapshot, type ServiceAlertEvidence } from '../../src/shared/domain/alert-scope';
import {
  evaluateServiceChanges,
  serviceChangeClaimDisposition,
  type ServiceChangeDecision,
} from '../../src/shared/domain/service-impact';

const BASE = new Date('2026-08-04T12:00:00.000Z');
const at = (seconds: number) => new Date(BASE.getTime() + seconds * 1_000);

const scope: ArrivalBoardScope = {
  feedGroupId: 'bdfm',
  exactStopId: 'A24N',
  direction: 'northbound',
  destination: 'Jamaica-179 St',
  comparisonAt: BASE,
};

const candidate = (overrides: Partial<ArrivalAdmissionCandidate> = {}): ArrivalAdmissionCandidate => ({
  stableTrainIdentity: 'f-train-1',
  publishedTripId: 'trip-f-1',
  patternIdentity: 'D17N:1>A24N:2>A25N:3',
  feedGroupId: 'bdfm',
  route: { id: 'F', label: 'F' },
  routeOrderKind: 'lettered',
  direction: 'northbound',
  destination: 'Jamaica-179 St',
  remainingStopCalls: [{
    stopId: 'A24N', sourceStopSequence: 2, arrivalAt: at(180), departureAt: at(190), scheduleRelationship: 'SCHEDULED',
  }],
  serviceClaimId: 'claim-f-a24n',
  serviceDisposition: 'eligible',
  trackDisposition: 'eligible',
  freshness: 'current',
  identityDisposition: 'coherent',
  recoveryDisposition: 'live-continuity',
  movementDisposition: 'plausible',
  confidence: { kind: 'live', supportedRange: { startsAt: at(160), endsAt: at(200) } },
  provenance: { source: 'gtfs-rt', sourceId: 'bdfm-feed', observedAt: at(-5), retrievedAt: BASE },
  ...overrides,
});

const serviceAlert = (overrides: Partial<ServiceAlertEvidence> = {}): ServiceAlertEvidence => ({
  alertId: 'service-change',
  activePeriods: [],
  selectors: [{ selectorId: 'exact', routeId: 'F', direction: 'northbound', exactDirectionalStopId: 'A24N' }],
  structuredEffect: 'NO_SERVICE',
  declaredConsequence: 'station-closure',
  official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping at 14 St.' },
  ...overrides,
});

const decision = (alerts: readonly ServiceAlertEvidence[]): ServiceChangeDecision => evaluateServiceChanges({
  snapshot: classifyAlertSnapshot({ status: 'accepted', feedTimestamp: BASE, alerts }, BASE),
  claim: {
    claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
    direction: 'northbound', tripId: 'trip-f-1', trainId: 'f-train-1',
  },
});

type EpochBoundDecision = ServiceChangeDecision & {
  readonly assessedAt: Date;
  readonly alertContextIdentity: string;
};

const scopeFor = (
  gate: ServiceChangeDecision,
  overrides: Partial<ArrivalBoardScope> = {},
): ArrivalBoardScope => {
  const epoch = gate as EpochBoundDecision;
  const assessedAt = epoch.assessedAt instanceof Date ? epoch.assessedAt : BASE;
  return {
    ...scope,
    comparisonAt: new Date(assessedAt),
    serviceAssessmentAt: new Date(assessedAt),
    serviceAlertContextIdentity: epoch.alertContextIdentity ?? 'legacy-context-without-epoch',
    ...overrides,
  } as ArrivalBoardScope;
};

describe('service-change arrival admission seam', () => {
  test('runs service-change resolution before freshness, identity, movement, track, or confidence ordering', () => {
    const gate = decision([serviceAlert()]);
    const result = admitArrivalCandidate(candidate({
      serviceChangeGate: gate,
      trackDisposition: 'high-impact-unresolved',
      freshness: 'unavailable',
      identityDisposition: 'ambiguous',
      movementDisposition: 'implausible',
      confidence: { kind: 'live', supportedRange: { startsAt: at(1_000), endsAt: at(2_000) } },
    }), scopeFor(gate));
    expect(result).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'resolved-ineligible',
      boardTreatment: 'resolved-suppression',
    });
    expect(result).toHaveProperty('serviceChange');
  });

  test('a resolved veto defeats a fresh Live claim and explicitly blocks every dependent surface including Scheduled', () => {
    const gate = decision([serviceAlert()]);
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: gate }), scopeFor(gate))).toMatchObject({
      kind: 'rejected', failedGate: 'service', boardTreatment: 'resolved-suppression',
      serviceChange: {
        suppressedProducts: ['live', 'expected', 'holding', 'uncertain', 'scheduled-fallback', 'countdown', 'dependent-guidance'],
      },
    });
    expect(serviceChangeClaimDisposition(gate)).toBe('resolved-ineligible');
  });

  test('propagates exact unavailable and ordinary limitation copy without relabeling either', () => {
    const unavailable = decision([serviceAlert({
      declaredConsequence: 'reroute', structuredEffect: 'MODIFIED_SERVICE',
      selectors: [{ selectorId: 'unresolved', routeId: 'F', exactDirectionalStopId: null }],
      official: { headerRaw: 'F trains are rerouted', descriptionRaw: 'F trains run via another line.' },
    })]);
    const limitation = decision([serviceAlert({
      official: { headerRaw: 'F trains are delayed', descriptionRaw: 'All stops continue to be served.' },
    })]);
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: unavailable }), scopeFor(unavailable))).toMatchObject({
      kind: 'rejected', boardTreatment: 'arrival-claim-unavailable',
      riderCopy: 'Service change—arrival information is unavailable for this service.',
    });
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: limitation }), scopeFor(limitation))).toMatchObject({
      kind: 'rejected', boardTreatment: 'quarantine-or-limitation',
      riderCopy: 'Service change details are being verified.',
    });
    expect(serviceChangeClaimDisposition(unavailable)).toBe('high-impact-unresolved');
    expect(serviceChangeClaimDisposition(limitation)).toBe('quarantined');
  });

  test('applies cross-gate hard-risk precedence before unresolved and ordinary limitations', () => {
    const limitation = decision([serviceAlert({
      official: { headerRaw: 'F trains are delayed', descriptionRaw: 'All stops continue.' },
    })]);
    expect(admitArrivalCandidate(candidate({
      serviceChangeGate: limitation,
      trackDisposition: 'resolved-ineligible',
    }), scopeFor(limitation))).toMatchObject({
      kind: 'rejected', failedGate: 'track', disposition: 'resolved-ineligible', boardTreatment: 'resolved-suppression',
    });
    expect(admitArrivalCandidate(candidate({
      serviceChangeGate: limitation,
      trackDisposition: 'high-impact-unresolved',
    }), scopeFor(limitation))).toMatchObject({
      kind: 'rejected', failedGate: 'track', disposition: 'high-impact-unresolved', boardTreatment: 'arrival-claim-unavailable',
    });
  });

  test('keeps delay-only and generic Affected service context out of the arrival gate', () => {
    const delay = decision([serviceAlert({
      declaredConsequence: 'delay-only', structuredEffect: 'SIGNIFICANT_DELAYS',
      selectors: [{ selectorId: 'route', routeId: 'F' }],
      official: { headerRaw: 'F trains are delayed', descriptionRaw: 'Allow extra time.' },
    })]);
    const generic = decision([serviceAlert({
      declaredConsequence: 'generic-affected', structuredEffect: 'UNKNOWN_EFFECT',
      selectors: [{ selectorId: 'route', routeId: 'F' }],
      official: { headerRaw: 'F trains are affected', descriptionRaw: 'Check travel information.' },
    })]);
    for (const gate of [delay, generic]) {
      expect(admitArrivalCandidate(candidate({ serviceChangeGate: gate }), scopeFor(gate))).toMatchObject({
        kind: 'admitted', confidence: 'live', row: { arrival: { route: { id: 'F' } } },
      });
    }
  });

  test('does not let unrelated service or a service failure enter primary overlap and cutoff', () => {
    const unrelated = decision([serviceAlert({
      selectors: [{ selectorId: 'other', routeId: 'E', exactDirectionalStopId: 'A24N' }],
    })]);
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: unrelated }), scopeFor(unrelated)).kind).toBe('admitted');

    const blockedGate = decision([serviceAlert()]);
    const blocked = admitArrivalCandidate(candidate({ serviceChangeGate: blockedGate }), scopeFor(blockedGate));
    expect(blocked.kind).toBe('rejected');
    expect(blocked).not.toHaveProperty('row');
  });

  test('retains hard-veto recovery semantics and never lets one update restore an arrival', () => {
    const adverse = decision([serviceAlert()]);
    if (!adverse.carryover) throw new Error('adverse fixture must carry risk');
    const update = (id: string, seconds: number) => ({
      evidenceId: id, sourceTimestamp: at(seconds), currentFeed: true, coherentIdentity: true,
      exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
    });
    const clearSnapshot = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(10), alerts: [] }, at(10));
    const one = evaluateServiceChanges({ snapshot: clearSnapshot, claim: {
      claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
      direction: 'northbound', tripId: 'trip-f-1', trainId: 'f-train-1',
    }, priorRisk: adverse.carryover, recoveryUpdates: [update('one', 1)] });
    const two = evaluateServiceChanges({ snapshot: clearSnapshot, claim: {
      claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
      direction: 'northbound', tripId: 'trip-f-1', trainId: 'f-train-1',
    }, priorRisk: adverse.carryover, recoveryUpdates: [update('one', 1), update('two', 2)] });
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: one }), scopeFor(one))).toMatchObject({
      kind: 'rejected', failedGate: 'service', boardTreatment: 'resolved-suppression',
    });
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: two, recoveryDisposition: 'live-readmission-eligible' }), scopeFor(two)))
      .toMatchObject({ kind: 'admitted', confidence: 'live' });
  });

  test('fails closed on forged service-change discriminants atomically', () => {
    const valid = admitArrivalCandidate(candidate(), scope);
    expect(admitArrivalCandidate(candidate({
      serviceChangeGate: { ...decision([]), kind: 'magically-clear' } as never,
    }), scope)).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'unissued-service-decision',
      boardTreatment: 'quarantine-or-limitation',
    });
    expect(admitArrivalCandidate(candidate(), scope)).toEqual(valid);
  });

  test('accepts only resolver-issued decision instances and rejects every public-field reconstruction', () => {
    const issuedEligible = decision([]);
    const issuedClosure = decision([serviceAlert()]);
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: issuedEligible }), scopeFor(issuedEligible)).kind).toBe('admitted');
    expect(Object.isFrozen(issuedEligible)).toBe(true);
    expect(() => ((issuedEligible as { disposition: string }).disposition = 'resolved-ineligible')).toThrow();

    const rewrittenClosure = Object.freeze({
      ...issuedClosure,
      kind: 'eligible-context' as const,
      disposition: 'eligible' as const,
      riderCopy: null,
      suppressedProducts: Object.freeze([]),
      carryover: null,
      carriedForward: false,
      recoveryCount: 0 as const,
    });
    const descriptorCopy = Object.freeze(Object.create(
      Object.getPrototypeOf(issuedEligible),
      Object.getOwnPropertyDescriptors(issuedEligible),
    )) as ServiceChangeDecision;
    const symbol = Symbol('copied-brand');
    const symbolCopy = Object.freeze({ ...issuedEligible, [symbol]: true }) as ServiceChangeDecision;
    const forgeries = [
      { ...issuedEligible },
      structuredClone(issuedEligible),
      JSON.parse(JSON.stringify(issuedEligible)) as ServiceChangeDecision,
      Object.freeze({ ...issuedEligible }),
      descriptorCopy,
      symbolCopy,
      new Proxy(issuedEligible, {}),
      rewrittenClosure,
    ] as readonly ServiceChangeDecision[];

    for (const forged of forgeries) {
      expect(() => serviceChangeClaimDisposition(forged)).toThrow(/issued service-change decision/i);
      expect(admitArrivalCandidate(candidate({ serviceChangeGate: forged }), scope)).toMatchObject({
        kind: 'rejected', failedGate: 'service', disposition: 'unissued-service-decision',
        boardTreatment: 'quarantine-or-limitation',
      });
      expect(admitArrivalCandidate(candidate({
        serviceChangeGate: forged,
        serviceDisposition: 'resolved-ineligible',
      }), scope)).toMatchObject({
        kind: 'rejected', failedGate: 'service', disposition: 'resolved-ineligible',
        boardTreatment: 'resolved-suppression',
      });
    }
  });

  test('binds an issued decision to the board exact assessment instant and alert snapshot identity', () => {
    const evaluate = (snapshot: ReturnType<typeof classifyAlertSnapshot>) => evaluateServiceChanges({
      snapshot,
      claim: {
        claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
        direction: 'northbound', tripId: 'trip-f-1', trainId: 'f-train-1',
      },
    });
    const oldEligible = evaluate(classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: BASE, alerts: [],
    }, BASE));
    const currentSnapshot = classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(10), alerts: [],
    }, at(10));
    const currentEligible = evaluate(currentSnapshot);
    const sameEpochEligible = evaluate(currentSnapshot);
    const closure = evaluate(classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(10), alerts: [serviceAlert()],
    }, at(10)));
    const missing = evaluate(classifyAlertSnapshot({ status: 'missing' }, at(10)));
    const future = evaluate(classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(20), alerts: [],
    }, at(20)));
    const currentEpoch = currentEligible as EpochBoundDecision;
    expect(currentEpoch.assessedAt).toBeInstanceOf(Date);
    expect(currentEpoch.alertContextIdentity).toEqual(expect.any(String));
    expect(currentEpoch.alertContextIdentity.length).toBeGreaterThan(0);
    expect((sameEpochEligible as EpochBoundDecision).alertContextIdentity).toBe(currentEpoch.alertContextIdentity);
    expect((closure as EpochBoundDecision).alertContextIdentity).not.toBe(currentEpoch.alertContextIdentity);
    expect((missing as EpochBoundDecision).alertContextIdentity).not.toBe(currentEpoch.alertContextIdentity);
    const exposedAssessment = currentEpoch.assessedAt;
    exposedAssessment.setTime(BASE.getTime());
    expect(currentEpoch.assessedAt.toISOString()).toBe(at(10).toISOString());
    const currentBoard = scopeFor(currentEligible);
    const closureBoard = scopeFor(closure);

    expect(admitArrivalCandidate(candidate({ serviceChangeGate: sameEpochEligible }), currentBoard)).toMatchObject({
      kind: 'admitted', confidence: 'live',
    });
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: closure }), closureBoard)).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'resolved-ineligible',
    });

    for (const [gate, board] of [
      [oldEligible, closureBoard],
      [oldEligible, currentBoard],
      [future, currentBoard],
      [closure, currentBoard],
      [missing, currentBoard],
    ] as const) {
      expect(admitArrivalCandidate(candidate({ serviceChangeGate: gate, freshness: 'unavailable' }), board)).toMatchObject({
        kind: 'rejected', failedGate: 'service', disposition: 'service-assessment-mismatch',
        boardTreatment: 'quarantine-or-limitation',
      });
    }
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: currentEligible, freshness: 'unavailable' }), {
      ...scope,
      comparisonAt: at(10),
    })).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'service-assessment-mismatch',
      boardTreatment: 'quarantine-or-limitation',
    });
  });

  test('binds a service decision to the exact candidate claim before freshness or identity', () => {
    const eDecision = evaluateServiceChanges({
      snapshot: classifyAlertSnapshot({ status: 'accepted', feedTimestamp: BASE, alerts: [] }, BASE),
      claim: {
        claimId: 'claim-e-a24n', routeId: 'E', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
        direction: 'northbound', tripId: 'trip-e-1', trainId: 'e-train-1',
      },
    });
    expect(admitArrivalCandidate(candidate({
      serviceChangeGate: eDecision,
      freshness: 'unavailable', identityDisposition: 'ambiguous', serviceClaimId: 'claim-e-a24n',
    }), scopeFor(eDecision))).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'claim-scope-mismatch',
      boardTreatment: 'quarantine-or-limitation',
    });
    expect(admitArrivalCandidate(candidate({
      serviceChangeGate: eDecision, serviceClaimId: 'claim-e-a24n', serviceDisposition: 'resolved-ineligible',
    }), scopeFor(eDecision))).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'resolved-ineligible',
      boardTreatment: 'resolved-suppression',
    });

    const valid = decision([]);
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: valid }), scopeFor(valid)).kind).toBe('admitted');
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: valid, serviceClaimId: 'wrong-claim' }), scopeFor(valid))).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'claim-scope-mismatch',
    });
  });

  test('fails closed on forged evaluated claim metadata without trusting its disposition', () => {
    const legitimate = decision([]);
    const forged = {
      ...legitimate,
      evaluatedClaim: { ...legitimate.evaluatedClaim, routeId: 'E' },
    } as ServiceChangeDecision;
    expect(admitArrivalCandidate(candidate({ serviceChangeGate: forged, freshness: 'unavailable' }), scope)).toMatchObject({
      kind: 'rejected', failedGate: 'service', disposition: 'unissued-service-decision',
      boardTreatment: 'quarantine-or-limitation',
    });
  });

  test('checks stop, direction, trip, and train independently and rejects incomplete claim binding', () => {
    const claims = [
      { claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A25N', constituentStopId: 'A25',
        direction: 'northbound' as const, tripId: 'trip-f-1', trainId: 'f-train-1' },
      { claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
        direction: 'southbound' as const, tripId: 'trip-f-1', trainId: 'f-train-1' },
      { claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
        direction: 'northbound' as const, tripId: 'other-trip', trainId: 'f-train-1' },
      { claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
        direction: 'northbound' as const, tripId: 'trip-f-1', trainId: 'other-train' },
      { claimId: 'claim-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
        direction: 'northbound' as const },
    ];
    for (const evaluatedClaim of claims) {
      const gate = evaluateServiceChanges({
        snapshot: classifyAlertSnapshot({ status: 'accepted', feedTimestamp: BASE, alerts: [] }, BASE),
        claim: evaluatedClaim,
      });
      expect(admitArrivalCandidate(candidate({ serviceChangeGate: gate }), scopeFor(gate))).toMatchObject({
        kind: 'rejected', failedGate: 'service', disposition: 'claim-scope-mismatch',
      });
    }
  });
});
