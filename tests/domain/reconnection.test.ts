import { describe, expect, test } from 'vitest';
import {
  acceptReconnectionStage as acceptOwnedReconnectionStage,
  commitReconnectionStage,
  createReconnectionState,
  presentReconnectionStage,
  requestReconnectionStage,
  resolveReconnectionWarning,
  type OwnerAcceptance,
  type PreservedReconnectionContext,
  type ReconnectionInvalidation,
  type ReconnectionStage,
  type ReconnectionStageResult,
  type ReconnectionState,
} from '../../src/shared/domain/reconnection';

const AT = '2026-08-05T12:00:00.000Z';
const OWNER_SCOPES = {
  equipment: [{ kind: 'path', id: 'path-a27-a32' }],
  'accessible-path': [{ kind: 'path', id: 'path-a27-a32' }],
  'service-change': [{ kind: 'route', id: 'A-southbound' }],
  'feed-health': [{ kind: 'station', id: 'A27' }],
  'train-admission': [{ kind: 'train', id: 'trip-a-1200' }],
  arrivals: [{ kind: 'station', id: 'A27' }],
  positioning: [{ kind: 'station', id: 'A27' }],
  'transfer-guidance': [{ kind: 'transfer', id: 'A32-transfer' }],
  maps: [{ kind: 'map', id: 'a27-to-a32' }],
  saved: [{ kind: 'saved-record', id: 'saved-a27' }],
} as const satisfies Record<OwnerAcceptance['domain'], readonly { readonly kind: any; readonly id: string }[]>;

const RECOVERY = {
  epochId: 'recovery-epoch-7',
  requestIdentity: 'recovery-request-7',
  generation: 7,
  startedAt: '2026-08-05T11:59:59.000Z',
  activeTripId: 'trip-a27-a32',
  contextKey: 'context:a27:trip-a27-a32:map',
  eligibleScopes: [
    { kind: 'station', id: 'A27' },
    { kind: 'route', id: 'A' },
    { kind: 'route', id: 'C' },
    { kind: 'route', id: 'A-southbound' },
    { kind: 'direction', id: 'southbound' },
    { kind: 'path', id: 'path-a27-a32' },
    { kind: 'train', id: 'trip-a-1200' },
    { kind: 'transfer', id: 'A32-transfer' },
    { kind: 'map', id: 'a27-to-a32' },
    { kind: 'saved-record', id: 'saved-a27' },
  ],
  ownerScopes: OWNER_SCOPES,
} as const;

const CONTEXT: PreservedReconnectionContext = {
  stationId: 'A27',
  direction: 'southbound',
  routeFilters: ['A', 'C'],
  accessibleRouteOnly: true,
  mapTuple: {
    referenceMode: 'actual',
    theme: 'night',
    contentVersion: 'network-2026-08-05',
    viewportKey: 'a27-to-a32',
  },
  activeTripId: 'trip-a27-a32',
  manualCursor: { legIndex: 0, stopId: 'A27' },
  hasStoredTrainChoice: true,
  guidanceRequirements: { positioning: 'optional', transfer: 'required' },
  activeSurface: 'map',
  scrollOffset: 384,
  focusTargetId: 'active-trip-next-stop',
  readingAnchorId: 'trip-leg-1-stop-a27',
  recovery: RECOVERY,
};

function gate(domain: OwnerAcceptance['domain']): Extract<OwnerAcceptance, { disposition: 'accepted-fresh' }>;
function gate(
  domain: OwnerAcceptance['domain'],
  disposition: 'accepted-fresh',
): Extract<OwnerAcceptance, { disposition: 'accepted-fresh' }>;
function gate(
  domain: OwnerAcceptance['domain'],
  disposition: 'governed-fail-closed',
): Extract<OwnerAcceptance, { disposition: 'governed-fail-closed' }>;
function gate(
  domain: OwnerAcceptance['domain'],
  disposition: OwnerAcceptance['disposition'] = 'accepted-fresh',
): OwnerAcceptance {
  const owner = {
    recoveryEpochId: RECOVERY.epochId,
    requestIdentity: RECOVERY.requestIdentity,
    generation: RECOVERY.generation,
    activeTripId: RECOVERY.activeTripId,
    contextKey: RECOVERY.contextKey,
    scopeMembership: OWNER_SCOPES[domain],
    evidenceAt: AT,
  } as const;
  return disposition === 'accepted-fresh'
    ? { ...owner, domain, ownerId: `${domain}-owner`, evidenceId: `${domain}-evidence`, acceptedAt: AT, disposition }
    : {
        ...owner,
        domain,
        ownerId: `${domain}-owner`,
        evidenceId: `${domain}-failure`,
        acceptedAt: AT,
        disposition,
        reason: `${domain} unavailable`,
      };
}

function acceptReconnectionStage(
  state: ReconnectionState,
  result: ReconnectionStageResult,
  acceptedThrough = AT,
): ReconnectionState {
  return acceptOwnedReconnectionStage(state, result, acceptedThrough);
}

function arrivalSnapshots(): readonly [OwnerAcceptance, OwnerAcceptance] {
  return [
    { ...gate('arrivals'), evidenceId: 'arrivals-snapshot-1' },
    { ...gate('arrivals'), evidenceId: 'arrivals-snapshot-2' },
  ];
}

function invalidation(
  stage: 1 | 2 | 3 | 4,
  ownerGate: OwnerAcceptance,
): ReconnectionInvalidation {
  const scopes = {
    1: [{ kind: 'path' as const, id: 'path-a27-a32', label: 'Elevator path from A27 to A32' }],
    2: [{ kind: 'route' as const, id: 'A-southbound', label: 'A southbound' }],
    3: [{ kind: 'train' as const, id: 'trip-a-1200', label: 'Stored A train choice' }],
    4: [{ kind: 'transfer' as const, id: 'A32-transfer', label: 'Required A32 transfer' }],
  }[stage];
  return {
    id: `trip-invalidation-stage-${stage}`,
    stage,
    ownerGate,
    changedFact: `Stage ${stage} owner evidence no longer verifies a required trip decision`,
    scopes,
    consequence: `The active trip cannot continue through the affected stage ${stage} decision`,
    lastVerifiedDecisionPoint: { id: 'A27-mezzanine', label: 'A27 mezzanine' },
    verifiedAlternative: null,
  };
}

function validResult(stage: 1): Extract<ReconnectionStageResult, { stage: 1 }>;
function validResult(stage: 2): Extract<ReconnectionStageResult, { stage: 2 }>;
function validResult(stage: 3): Extract<ReconnectionStageResult, { stage: 3 }>;
function validResult(stage: 4): Extract<ReconnectionStageResult, { stage: 4 }>;
function validResult(stage: 5): Extract<ReconnectionStageResult, { stage: 5 }>;
function validResult(stage: ReconnectionStageResult['stage']): ReconnectionStageResult;
function validResult(stage: ReconnectionStageResult['stage']): ReconnectionStageResult {
  switch (stage) {
    case 1:
      return {
        stage,
        equipment: { gate: gate('equipment'), disposition: 'verified-operational' },
        accessiblePath: {
          gate: gate('accessible-path'),
          requiredForActiveTrip: true,
          completeness: 'complete-exact-path',
          disposition: 'verified',
        },
        invalidation: null,
      };
    case 2:
      return {
        stage,
        serviceChanges: { gate: gate('service-change'), disposition: 'resolved', vetoesApplied: true },
        tripServicePattern: 'verified',
        invalidation: null,
      };
    case 3:
      return {
        stage,
        feedRecovery: { gate: gate('feed-health'), disposition: 'readmitted' },
        trainReadmission: { gate: gate('train-admission'), disposition: 'admitted' },
        arrivals: { gate: gate('arrivals'), disposition: 'current', freshSnapshotCount: 2, freshSnapshots: arrivalSnapshots() },
        storedTrainChoice: 'verified',
        invalidation: null,
      };
    case 4:
      return {
        stage,
        positioning: { gate: gate('positioning'), requirement: 'optional', disposition: 'verified' },
        transferGuidance: { gate: gate('transfer-guidance'), requirement: 'required', disposition: 'verified' },
        invalidation: null,
      };
    case 5:
      return {
        stage,
        maps: { gate: gate('maps'), disposition: 'refreshed' },
        unrelatedSaved: { gate: gate('saved'), disposition: 'refreshed' },
      };
  }
}

function finishStage(state: ReconnectionState, stage: ReconnectionStageResult['stage']): ReconnectionState {
  const requested = requestReconnectionStage(state, stage);
  const accepted = acceptReconnectionStage(requested, validResult(stage));
  const committed = commitReconnectionStage(accepted, stage);
  return presentReconnectionStage(committed, stage);
}

function invalidatingResult(stage: 1): Extract<ReconnectionStageResult, { stage: 1 }>;
function invalidatingResult(stage: 2): Extract<ReconnectionStageResult, { stage: 2 }>;
function invalidatingResult(stage: 3): Extract<ReconnectionStageResult, { stage: 3 }>;
function invalidatingResult(stage: 4): Extract<ReconnectionStageResult, { stage: 4 }>;
function invalidatingResult(stage: 1 | 2 | 3 | 4): Exclude<ReconnectionStageResult, { stage: 5 }>;
function invalidatingResult(stage: 1 | 2 | 3 | 4): Exclude<ReconnectionStageResult, { stage: 5 }> {
  switch (stage) {
    case 1: {
      const pathGate = gate('accessible-path');
      return {
        stage,
        equipment: { gate: gate('equipment'), disposition: 'verified-out-of-service' },
        accessiblePath: {
          gate: pathGate,
          requiredForActiveTrip: true,
          completeness: 'complete-exact-path',
          disposition: 'unusable',
        },
        invalidation: invalidation(stage, pathGate),
      };
    }
    case 2: {
      const serviceGate = gate('service-change');
      return {
        stage,
        serviceChanges: { gate: serviceGate, disposition: 'resolved', vetoesApplied: true },
        tripServicePattern: 'unusable',
        invalidation: invalidation(stage, serviceGate),
      };
    }
    case 3: {
      const trainGate = gate('train-admission');
      return {
        stage,
        feedRecovery: { gate: gate('feed-health'), disposition: 'blocked' },
        trainReadmission: { gate: trainGate, disposition: 'blocked' },
        arrivals: { gate: gate('arrivals'), disposition: 'withheld', freshSnapshotCount: 1, freshSnapshots: [arrivalSnapshots()[0]] },
        storedTrainChoice: 'unverified',
        invalidation: invalidation(stage, trainGate),
      };
    }
    case 4: {
      const transferGate = gate('transfer-guidance');
      return {
        stage,
        positioning: { gate: gate('positioning'), requirement: 'optional', disposition: 'verified' },
        transferGuidance: {
          gate: transferGate,
          requirement: 'required',
          disposition: 'removed',
        },
        invalidation: invalidation(stage, transferGate),
      };
    }
  }
}

describe('owner-gated reconnection ordering', () => {
  test('permits only request, owner acceptance, commit, and presentation in the exact five-stage order', () => {
    let state = createReconnectionState(CONTEXT, { historicalPositioningGuidance: true });

    expect(state.currentStage).toBe(1);
    expect(() => requestReconnectionStage(state, 2)).toThrow(/stage 1.*before stage 2/i);
    expect(() => acceptReconnectionStage(state, validResult(1))).toThrow(/stage 1.*requested/i);
    expect(() => commitReconnectionStage(state, 1)).toThrow(/stage 1.*accepted/i);
    expect(() => presentReconnectionStage(state, 1)).toThrow(/stage 1.*committed/i);

    state = requestReconnectionStage(state, 1);
    expect(() => requestReconnectionStage(state, 2)).toThrow(/stage 1.*before stage 2/i);
    expect(() => commitReconnectionStage(state, 1)).toThrow(/stage 1.*accepted/i);

    state = acceptReconnectionStage(state, validResult(1));
    expect(() => presentReconnectionStage(state, 1)).toThrow(/stage 1.*committed/i);
    state = commitReconnectionStage(state, 1);
    state = presentReconnectionStage(state, 1);

    for (const stage of [2, 3, 4, 5] as const) state = finishStage(state, stage);

    expect(state).toMatchObject({ status: 'complete', currentStage: null });
    expect(state.audit.map((event) => `${event.kind}:${event.stage}`)).toEqual([
      'stage-requested:1',
      'stage-owner-accepted:1',
      'stage-committed:1',
      'stage-presented:1',
      'stage-requested:2',
      'stage-owner-accepted:2',
      'stage-committed:2',
      'stage-presented:2',
      'stage-requested:3',
      'stage-owner-accepted:3',
      'stage-committed:3',
      'stage-presented:3',
      'stage-requested:4',
      'stage-owner-accepted:4',
      'stage-committed:4',
      'stage-presented:4',
      'stage-requested:5',
      'stage-owner-accepted:5',
      'stage-committed:5',
      'stage-presented:5',
    ]);
  });

  test('requires every exact owner gate and accepts only fresh or governed fail-closed outcomes', () => {
    let state = requestReconnectionStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    const missingPathGate = structuredClone(validResult(1)) as any;
    delete missingPathGate.accessiblePath.gate;
    expect(() => acceptReconnectionStage(state, missingPathGate)).toThrow(/accessible path owner gate/i);

    const wrongEquipmentOwner = structuredClone(validResult(1)) as any;
    wrongEquipmentOwner.equipment.gate.domain = 'maps';
    expect(() => acceptReconnectionStage(state, wrongEquipmentOwner)).toThrow(/equipment owner gate/i);

    const returnedOnly = structuredClone(validResult(1)) as any;
    returnedOnly.equipment.gate.disposition = 'request-returned';
    expect(() => acceptReconnectionStage(state, returnedOnly)).toThrow(/owner-accepted fresh or governed fail-closed/i);

    const stage1: ReconnectionStageResult = {
      stage: 1,
      equipment: { gate: gate('equipment', 'governed-fail-closed'), disposition: 'unknown' },
      accessiblePath: {
        gate: gate('accessible-path', 'governed-fail-closed'),
        requiredForActiveTrip: false,
        completeness: 'incomplete-or-unknown',
        disposition: 'unverified',
      },
      invalidation: null,
    };
    state = presentReconnectionStage(commitReconnectionStage(acceptReconnectionStage(state, stage1), 1), 1);

    const failClosedResults: readonly ReconnectionStageResult[] = [
      {
        stage: 2,
        // The owner accepted an unresolved fail-closed state, so the stored
        // service pattern is no longer verified and must block the trip.
        serviceChanges: {
          gate: gate('service-change', 'governed-fail-closed'),
          disposition: 'unresolved-fail-closed',
          vetoesApplied: true,
        },
        tripServicePattern: 'unverified',
        invalidation: invalidation(2, gate('service-change', 'governed-fail-closed')),
      },
      {
        stage: 3,
        feedRecovery: { gate: gate('feed-health', 'governed-fail-closed'), disposition: 'blocked' },
        trainReadmission: { gate: gate('train-admission', 'governed-fail-closed'), disposition: 'blocked' },
        arrivals: {
          gate: gate('arrivals', 'governed-fail-closed'),
          disposition: 'withheld',
          freshSnapshotCount: 0,
          freshSnapshots: [],
        },
        storedTrainChoice: 'none',
        invalidation: null,
      },
      {
        stage: 4,
        positioning: {
          gate: gate('positioning', 'governed-fail-closed'),
          requirement: 'optional',
          disposition: 'removed',
        },
        transferGuidance: {
          gate: gate('transfer-guidance', 'governed-fail-closed'),
          requirement: 'none',
          disposition: 'removed',
        },
        invalidation: null,
      },
      {
        stage: 5,
        maps: { gate: gate('maps', 'governed-fail-closed'), disposition: 'unchanged-fail-closed' },
        unrelatedSaved: { gate: gate('saved', 'governed-fail-closed'), disposition: 'unchanged-fail-closed' },
      },
    ];

    for (const result of failClosedResults) {
      state = requestReconnectionStage(state, result.stage);
      state = acceptReconnectionStage(state, result);
      state = commitReconnectionStage(state, result.stage);
      state = presentReconnectionStage(state, result.stage);
    }
    expect(state.status).toBe('complete');
  });

  test.each([
    ['recovery epoch', (result: any) => { result.equipment.gate.recoveryEpochId = 'recovery-epoch-6'; }, /epoch/i],
    ['request identity', (result: any) => { result.equipment.gate.requestIdentity = 'recovery-request-prior'; }, /request identity/i],
    ['generation', (result: any) => { result.equipment.gate.generation = 6; }, /generation/i],
    ['active trip', (result: any) => { result.equipment.gate.activeTripId = 'trip-someone-else'; }, /active trip/i],
    ['context', (result: any) => { result.equipment.gate.contextKey = 'context:another-rider'; }, /context/i],
    ['pre-epoch evidence', (result: any) => { result.equipment.gate.evidenceAt = '2026-08-05T11:59:58.000Z'; }, /predate.*epoch/i],
    ['outside scope', (result: any) => { result.equipment.gate.scopeMembership = [{ kind: 'station', id: 'R20' }]; }, /eligible scope/i],
  ])('rejects %s owner evidence before accepting a stage', (_name, corrupt, expected) => {
    const state = requestReconnectionStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    const result = structuredClone(validResult(1)) as any;
    corrupt(result);

    expect(() => acceptReconnectionStage(state, result)).toThrow(expected);
    expect(state.stages[0].status).toBe('requested');
  });

  test('rejects an owner gate widened to unrelated eligible scopes', () => {
    const state = requestReconnectionStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    const result = structuredClone(validResult(1)) as any;
    result.equipment.gate.scopeMembership.push({ kind: 'route', id: 'A' });

    expect(() => acceptReconnectionStage(state, result)).toThrow(/exact equipment owner scope/i);
  });

  test('rejects future server evidence and an acceptance beyond the local receipt bound', () => {
    const state = requestReconnectionStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    const futureEvidence = structuredClone(validResult(1)) as any;
    futureEvidence.equipment.gate.evidenceAt = '2026-08-05T12:00:02.000Z';
    expect(() => acceptReconnectionStage(state, futureEvidence, '2026-08-05T12:00:01.000Z'))
      .toThrow(/equipment.*evidence.*acceptance/i);

    const futureAcceptance = structuredClone(validResult(1)) as any;
    futureAcceptance.equipment.gate.acceptedAt = '2026-08-05T12:00:02.000Z';
    expect(() => acceptReconnectionStage(state, futureAcceptance, '2026-08-05T12:00:01.000Z'))
      .toThrow(/equipment.*local receipt/i);
  });

  test('never treats an incomplete accessible-path result as a verified complete exact path', () => {
    const state = requestReconnectionStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    const incompleteClaim = {
      ...validResult(1),
      accessiblePath: {
        ...validResult(1).accessiblePath,
        completeness: 'incomplete-or-unknown',
      },
    } as any;

    expect(() => acceptReconnectionStage(state, incompleteClaim)).toThrow(/complete exact accessible path/i);
  });

  test.each([1, 2, 3, 4] as const)(
    'requires and presents a stage %i invalidation warning before the next stage can request',
    (stage) => {
      let state = createReconnectionState(CONTEXT, { historicalPositioningGuidance: true });
      for (let prior = 1; prior < stage; prior += 1) {
        state = finishStage(state, prior as ReconnectionStage);
      }
      state = requestReconnectionStage(state, stage);
      const result = invalidatingResult(stage);

      expect(() => acceptReconnectionStage(state, { ...result, invalidation: null } as ReconnectionStageResult))
        .toThrow(/required active-trip invalidation/i);
      state = acceptReconnectionStage(state, result);
      expect(state.visible.activeWarnings).toEqual([]);
      state = commitReconnectionStage(state, stage);
      expect(state.visible.activeWarnings).toEqual([]);
      state = presentReconnectionStage(state, stage);

      expect(state.visible.activeWarnings).toEqual([result.invalidation]);
      expect(state.audit.slice(-2).map((event) => event.kind)).toEqual([
        'warning-presented',
        'stage-presented',
      ]);
      const next = (stage + 1) as ReconnectionStage;
      state = requestReconnectionStage(state, next);
      expect(state.audit.at(-1)).toEqual({ kind: 'stage-requested', stage: next });
    },
  );

  test('rejects an invalidation that widens its accepted fact beyond an exact supported trip scope', () => {
    const state = requestReconnectionStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    const result = invalidatingResult(1);
    const widened = {
      ...result,
      invalidation: {
        ...result.invalidation,
        scopes: [{ kind: 'system', id: 'all-subway', label: 'Entire subway system' }],
      },
    } as any;

    expect(() => acceptReconnectionStage(state, widened)).toThrow(/exact affected scope kind/i);
  });

  test.each([
    [1, (result: any) => {
      result.accessiblePath.disposition = 'optimistic';
      result.invalidation = invalidation(1, result.accessiblePath.gate);
    }, /accessible path disposition/i],
    [2, (result: any) => {
      result.tripServicePattern = 'maybe';
      result.invalidation = invalidation(2, result.serviceChanges.gate);
    }, /trip service pattern/i],
    [3, (result: any) => {
      result.feedRecovery.disposition = 'recovering';
      result.trainReadmission.disposition = 'blocked';
      result.arrivals.disposition = 'withheld';
    }, /feed recovery disposition/i],
    [4, (result: any) => {
      result.positioning.requirement = 'suggested';
    }, /positioning guidance requirement/i],
  ] as const)('rejects malformed stage %i owner dispositions atomically', (stage, corrupt, expected) => {
    let state = createReconnectionState(CONTEXT, { historicalPositioningGuidance: true });
    for (let prior = 1; prior < stage; prior += 1) state = finishStage(state, prior as ReconnectionStage);
    state = requestReconnectionStage(state, stage);
    const malformed = structuredClone(validResult(stage)) as any;
    corrupt(malformed);

    expect(() => acceptReconnectionStage(state, malformed)).toThrow(expected);
    expect(state.stages.find((record) => record.stage === stage)?.status).toBe('requested');
  });

  test('applies service-change vetoes before arrivals can request, commit, or present', () => {
    let state = finishStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    state = requestReconnectionStage(state, 2);
    const unresolvedVetoes = structuredClone(validResult(2));
    (unresolvedVetoes.serviceChanges as any).vetoesApplied = false;
    expect(() => acceptReconnectionStage(state, unresolvedVetoes)).toThrow(/every service-change veto.*before stage 2/i);

    state = acceptReconnectionStage(state, validResult(2));
    expect(() => requestReconnectionStage(state, 3)).toThrow(/stage 2.*before stage 3/i);
    state = commitReconnectionStage(state, 2);
    expect(() => requestReconnectionStage(state, 3)).toThrow(/stage 2.*before stage 3/i);
    state = presentReconnectionStage(state, 2);
    state = requestReconnectionStage(state, 3);

    const stage2Presented = state.audit.findIndex((event) => event.kind === 'stage-presented' && event.stage === 2);
    const stage3Requested = state.audit.findIndex((event) => event.kind === 'stage-requested' && event.stage === 3);
    expect(stage2Presented).toBeGreaterThanOrEqual(0);
    expect(stage3Requested).toBeGreaterThan(stage2Presented);
  });

  test.each([
    ['unresolved', invalidatingResult(2)],
    ['vetoed', {
      ...validResult(2),
      tripServicePattern: 'unusable' as const,
      invalidation: invalidation(2, validResult(2).serviceChanges.gate),
    }],
  ])('prevents current arrivals when the active trip service pattern is %s', (_name, stage2Result) => {
    let state = finishStage(createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
    }), 1);
    state = requestReconnectionStage(state, 2);
    state = acceptReconnectionStage(state, stage2Result);
    state = commitReconnectionStage(state, 2);
    state = presentReconnectionStage(state, 2);
    state = requestReconnectionStage(state, 3);

    expect(() => acceptReconnectionStage(state, validResult(3)))
      .toThrow(/active trip service pattern.*current arrivals/i);
  });

  test('one fresh arrival snapshot restores nothing until feed recovery and train readmission are both owner-complete', () => {
    let oneSnapshot = createReconnectionState(CONTEXT, { historicalPositioningGuidance: true });
    oneSnapshot = finishStage(oneSnapshot, 1);
    oneSnapshot = finishStage(oneSnapshot, 2);
    oneSnapshot = requestReconnectionStage(oneSnapshot, 3);
    const firstFresh: ReconnectionStageResult = {
      stage: 3,
      feedRecovery: { gate: gate('feed-health'), disposition: 'blocked' },
      trainReadmission: { gate: gate('train-admission'), disposition: 'blocked' },
      arrivals: { gate: gate('arrivals'), disposition: 'withheld', freshSnapshotCount: 1, freshSnapshots: [arrivalSnapshots()[0]] },
      storedTrainChoice: 'none',
      invalidation: null,
    };
    expect(() => acceptReconnectionStage(oneSnapshot, {
      ...firstFresh,
      arrivals: { ...firstFresh.arrivals, disposition: 'current' },
    })).toThrow(/one fresh arrival snapshot restores nothing/i);
    oneSnapshot = acceptReconnectionStage(oneSnapshot, firstFresh);
    oneSnapshot = commitReconnectionStage(oneSnapshot, 3);
    oneSnapshot = presentReconnectionStage(oneSnapshot, 3);
    expect(oneSnapshot.visible.currentArrivalsRestored).toBe(false);

    let fullyRecovered = createReconnectionState(CONTEXT, { historicalPositioningGuidance: true });
    fullyRecovered = finishStage(fullyRecovered, 1);
    fullyRecovered = finishStage(fullyRecovered, 2);
    fullyRecovered = finishStage(fullyRecovered, 3);
    expect(fullyRecovered.visible.currentArrivalsRestored).toBe(true);
  });

  test('does not accept train readmission ahead of owning feed recovery even when arrivals remain withheld', () => {
    let state = createReconnectionState(CONTEXT, { historicalPositioningGuidance: true });
    state = finishStage(state, 1);
    state = finishStage(state, 2);
    state = requestReconnectionStage(state, 3);
    const overtakingReadmission: Extract<ReconnectionStageResult, { stage: 3 }> = {
      ...validResult(3),
      feedRecovery: { gate: gate('feed-health'), disposition: 'blocked' },
      arrivals: { gate: gate('arrivals'), disposition: 'withheld', freshSnapshotCount: 2, freshSnapshots: arrivalSnapshots() },
    };

    expect(() => acceptReconnectionStage(state, overtakingReadmission))
      .toThrow(/train readmission.*owning feed recovery/i);
  });

  test('loss of optional positioning removes only that guidance and preserves the trip and required transfer', () => {
    let state = createReconnectionState(CONTEXT, {
      historicalPositioningGuidance: true,
      historicalTransferGuidance: true,
    });
    state = finishStage(state, 1);
    state = finishStage(state, 2);
    state = finishStage(state, 3);
    state = requestReconnectionStage(state, 4);
    const optionalLoss: ReconnectionStageResult = {
      stage: 4,
      positioning: {
        gate: gate('positioning', 'governed-fail-closed'),
        requirement: 'optional',
        disposition: 'removed',
      },
      transferGuidance: {
        gate: gate('transfer-guidance'),
        requirement: 'required',
        disposition: 'verified',
      },
      invalidation: null,
    };
    expect(() => acceptReconnectionStage(state, {
      ...optionalLoss,
      invalidation: invalidation(4, optionalLoss.positioning.gate),
    })).toThrow(/cannot invent an active-trip invalidation/i);

    state = acceptReconnectionStage(state, optionalLoss);
    state = commitReconnectionStage(state, 4);
    state = presentReconnectionStage(state, 4);

    expect(state.visible).toMatchObject({
      activeWarnings: [],
      positioningGuidance: 'removed',
      transferGuidance: 'verified-current',
    });
    expect(state.context).toEqual(CONTEXT);
  });

  test('persists a blocking warning and every preserved rider context field through stage 5 until exact governed resolution', () => {
    const mutableContext = structuredClone(CONTEXT) as any;
    let state = createReconnectionState(mutableContext, {
      historicalPositioningGuidance: true,
      historicalTransferGuidance: true,
    });
    mutableContext.stationId = 'CHANGED';
    mutableContext.routeFilters.push('Z');
    mutableContext.mapTuple.viewportKey = 'CHANGED';
    mutableContext.manualCursor.stopId = 'CHANGED';

    state = requestReconnectionStage(state, 1);
    state = acceptReconnectionStage(state, invalidatingResult(1));
    state = commitReconnectionStage(state, 1);
    state = presentReconnectionStage(state, 1);
    for (const stage of [2, 3, 4, 5] as const) state = finishStage(state, stage);

    expect(state.status).toBe('complete');
    expect(state.context).toEqual(CONTEXT);
    expect(state.visible.activeWarnings.map((warning) => warning.id)).toEqual(['trip-invalidation-stage-1']);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.context)).toBe(true);
    expect(Object.isFrozen(state.context.routeFilters)).toBe(true);
    expect(Object.isFrozen(state.context.mapTuple)).toBe(true);
    expect(Object.isFrozen(state.context.manualCursor)).toBe(true);
    expect(Object.isFrozen(state.visible.activeWarnings[0])).toBe(true);
    expect(() => ((state.context as any).stationId = 'A99')).toThrow(TypeError);

    expect(() => resolveReconnectionWarning(state, {
      warningId: 'trip-invalidation-stage-1',
      resolution: { kind: 'acknowledged', acknowledgedAt: AT },
    } as any)).toThrow(/acknowledgement.*does not resolve/i);
    expect(state.visible.activeWarnings).toHaveLength(1);

    state = resolveReconnectionWarning(state, {
      warningId: 'trip-invalidation-stage-1',
      resolution: {
        kind: 'owner-resolved',
        gate: {
          ...gate('accessible-path'),
          evidenceId: 'accessible-path-restored',
        },
      },
    });
    expect(state.visible.activeWarnings).toEqual([]);
    expect(state.context).toEqual(CONTEXT);
    expect(state.audit.at(-1)).toEqual({
      kind: 'warning-resolved',
      stage: 1,
      warningId: 'trip-invalidation-stage-1',
    });
  });

  test('never lets stage 5 overtake an unresolved stage 4 request', () => {
    let state = createReconnectionState(CONTEXT, { historicalPositioningGuidance: true });
    for (const stage of [1, 2, 3] as const) state = finishStage(state, stage);
    state = requestReconnectionStage(state, 4);

    expect(() => requestReconnectionStage(state, 5)).toThrow(/stage 4.*before stage 5/i);
    expect(() => acceptReconnectionStage(state, validResult(5))).toThrow(/stage 4.*before stage 5/i);
    expect(() => commitReconnectionStage(state, 5)).toThrow(/stage 4.*before stage 5/i);
    expect(() => presentReconnectionStage(state, 5)).toThrow(/stage 4.*before stage 5/i);
  });
});
