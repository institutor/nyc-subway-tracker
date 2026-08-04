import { describe, expect, test } from 'vitest';

import {
  TrainRecoveryGovernor,
  type RecoveryConditions,
  type TrainEvidenceProvenance,
} from '../../src/shared/domain/recovery';

const BASE = new Date('2026-08-04T12:00:00.000Z');

function at(seconds: number): Date {
  return new Date(BASE.getTime() + seconds * 1_000);
}

function evidence(id: string, seconds: number): TrainEvidenceProvenance {
  return {
    feedGroupId: 'ace',
    evidenceId: id,
    observedAt: at(seconds),
    sourceTimestamp: at(seconds),
  };
}

function conditions(overrides: Partial<RecoveryConditions> = {}): RecoveryConditions {
  return {
    stableIdentity: true,
    plausibleStopOrder: true,
    movementAt: at(0),
    targetServed: true,
    noUnresolvedServiceOrTrackConflict: true,
    ...overrides,
  };
}

function governor(): TrainRecoveryGovernor {
  return new TrainRecoveryGovernor({
    feedGroupId: 'ace',
    trainIdentity: '20260804:shared-trip:0A-0200',
    targetStopId: 'A24N',
    initialEvidence: evidence('initial', 0),
    movementAt: at(0),
  });
}

function present(
  engine: TrainRecoveryGovernor,
  id: string,
  seconds: number,
  overrides: Partial<RecoveryConditions> = {},
  trainIdentity = '20260804:shared-trip:0A-0200',
) {
  return engine.observeHealthySnapshot({
    provenance: evidence(id, seconds),
    entity: { kind: 'present', trainIdentity, conditions: conditions({ movementAt: at(seconds), ...overrides }) },
  });
}

describe('healthy entity absence clocks and suppression', () => {
  test('the first healthy absence immediately removes public precision without suppression or replacement', () => {
    const engine = governor();
    const decision = engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(decision).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'first-healthy-absence',
      publicPrecision: 'none',
      primaryEligibility: 'blocked',
      internalDisposition: 'absence-grace',
      hardSuppressed: false,
      staticReplacementAllowed: false,
      scheduledFallbackTriggered: false,
      cancellationClaim: 'not-inferred',
      serviceClaim: 'not-inferred',
      clocks: { entityAbsenceCount: 1, entityAbsenceAgeSeconds: 0, stopOrderRegressionCount: 0, recoveryCount: 0 },
    });
  });

  test('59 seconds remains grace and exactly 60 seconds hard-suppresses from elapsed time', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(engine.assess(at(69))).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'first-healthy-absence',
      hardSuppressed: false,
      clocks: { entityAbsenceCount: 1, entityAbsenceAgeSeconds: 59 },
    });
    expect(engine.assess(at(70))).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'absence-elapsed-60-seconds',
      hardSuppressed: true,
      clocks: { entityAbsenceCount: 1, entityAbsenceAgeSeconds: 60 },
    });
  });

  test('the second countable healthy absence suppresses earlier than 60 seconds', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(engine.observeHealthySnapshot({ provenance: evidence('absent-2', 30), entity: { kind: 'absent' } })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'second-healthy-absence',
      clocks: { entityAbsenceCount: 2, entityAbsenceAgeSeconds: 20 },
      cancellationClaim: 'not-inferred',
    });
  });

  test('an anomalous intervening update neither counts nor resets absence age/count', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });
    expect(engine.observeNonCountable({ provenance: evidence('anomaly', 20), reasonCode: 'snapshot-anomaly' })).toMatchObject({
      clocks: { entityAbsenceCount: 1, entityAbsenceAgeSeconds: 10, recoveryCount: 0 },
    });
    expect(engine.observeHealthySnapshot({ provenance: evidence('absent-2', 30), entity: { kind: 'absent' } })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'second-healthy-absence',
      clocks: { entityAbsenceCount: 2 },
    });
  });

  test('an anomalous update at the exact elapsed boundary cannot defer suppression', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(engine.observeNonCountable({ provenance: evidence('anomaly-at-60', 70), reasonCode: 'snapshot-anomaly' })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'absence-elapsed-60-seconds',
      clocks: { entityAbsenceCount: 1, entityAbsenceAgeSeconds: 60, recoveryCount: 0 },
    });
  });

  test('a late second absence records count two but preserves the earlier elapsed trigger', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(engine.observeHealthySnapshot({ provenance: evidence('absent-2-late', 80), entity: { kind: 'absent' } })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'absence-elapsed-60-seconds',
      clocks: { entityAbsenceCount: 2, entityAbsenceAgeSeconds: 70 },
    });
  });

  test('a healthy presence ends the absence episode but begins recovery and restores nothing', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(present(engine, 'return-1', 20)).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'recovery-confirmation-required',
      clocks: { entityAbsenceCount: 0, entityAbsenceAgeSeconds: null, recoveryCount: 1 },
      publicPrecision: 'none',
    });
    expect(engine.observeHealthySnapshot({ provenance: evidence('new-absence', 30), entity: { kind: 'absent' } })).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'first-healthy-absence',
      clocks: { entityAbsenceCount: 1, recoveryCount: 0 },
    });
  });
});

describe('target and stop-order adverse evidence', () => {
  test('target removal hard-suppresses immediately and static pattern cannot repair it', () => {
    const engine = governor();
    expect(engine.observeTargetRemoved({ provenance: evidence('target-gone', 10) })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'target-removed',
      hardSuppressed: true,
      staticReplacementAllowed: false,
      cancellationClaim: 'not-inferred',
    });
  });

  test('one stop-order regression quarantines; replay does not count; second independent confirmation suppresses', () => {
    const engine = governor();
    expect(engine.observeStopOrderRegression({ provenance: evidence('regression-1', 10), regressionKey: 'A27>A24' })).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'single-stop-order-regression',
      internalDisposition: 'quarantine',
      clocks: { stopOrderRegressionCount: 1 },
    });
    expect(engine.observeStopOrderRegression({ provenance: evidence('regression-1', 10), regressionKey: 'A27>A24' })).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'stop-order-regression-replay',
      clocks: { stopOrderRegressionCount: 1 },
    });
    expect(engine.observeStopOrderRegression({ provenance: evidence('regression-2', 20), regressionKey: 'A27>A24' })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'confirmed-stop-order-regression',
      clocks: { stopOrderRegressionCount: 2 },
    });
  });

  test('a different regression does not confirm the first defect', () => {
    const engine = governor();
    engine.observeStopOrderRegression({ provenance: evidence('regression-1', 10), regressionKey: 'A27>A24' });

    expect(engine.observeStopOrderRegression({ provenance: evidence('regression-other', 20), regressionKey: 'A31>A28' })).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'single-stop-order-regression',
      clocks: { stopOrderRegressionCount: 1 },
    });
  });

  test('a completed recovery clears the prior stop-regression confirmation episode', () => {
    const engine = governor();
    engine.observeStopOrderRegression({ provenance: evidence('regression-old', 10), regressionKey: 'A27>A24' });
    present(engine, 'recover-old-1', 20);
    expect(present(engine, 'recover-old-2', 30)).toMatchObject({ kind: 'live-readmission-eligible' });

    expect(engine.observeStopOrderRegression({ provenance: evidence('regression-new', 40), regressionKey: 'A27>A24' })).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'single-stop-order-regression',
      clocks: { stopOrderRegressionCount: 1 },
    });
  });

  test('an elapsed absence remains the controlling suppression when a regression arrives at 60 seconds', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(engine.observeStopOrderRegression({
      provenance: evidence('regression-at-60', 70),
      regressionKey: 'A27>A24',
    })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'absence-elapsed-60-seconds',
      clocks: { entityAbsenceCount: 1, entityAbsenceAgeSeconds: 60, stopOrderRegressionCount: 1 },
    });
  });
});

describe('two-update exact-identity Live recovery', () => {
  test('update one restores nothing; update two permits only Live reevaluation', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });

    expect(present(engine, 'recover-1', 20)).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'recovery-confirmation-required',
      clocks: { recoveryCount: 1, movementAgeSeconds: 0 },
      primaryEligibility: 'blocked',
    });
    expect(present(engine, 'recover-2', 30)).toMatchObject({
      kind: 'live-readmission-eligible',
      reasonCode: 'two-coherent-recovery-updates',
      eligibleConfidence: 'live',
      expectedEligibility: 'blocked',
      primaryEligibility: 'reevaluate',
      clocks: { recoveryCount: 2, movementAgeSeconds: 0 },
    });
  });

  test.each([
    ['stable identity', { stableIdentity: false }],
    ['plausible stop order', { plausibleStopOrder: false }],
    ['current movement', { movementAt: at(-100) }],
    ['resolved service and track conflicts', { noUnresolvedServiceOrTrackConflict: false }],
  ] as const)('missing %s breaks the pair and restores nothing', (_label, broken) => {
    const engine = governor();
    engine.observeTargetRemoved({ provenance: evidence('adverse', 10) });
    present(engine, 'recover-1', 20);

    expect(present(engine, 'broken', 30, broken)).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'recovery-conditions-not-proven',
      clocks: { recoveryCount: 0 },
      primaryEligibility: 'blocked',
      expectedEligibility: 'blocked',
    });
    expect(present(engine, 'restart-1', 40)).toMatchObject({ clocks: { recoveryCount: 1 } });
    expect(present(engine, 'restart-2', 50)).toMatchObject({ kind: 'live-readmission-eligible' });
  });

  test('a recovery update that removes the target applies immediate target suppression', () => {
    const engine = governor();
    engine.observeTargetRemoved({ provenance: evidence('adverse', 10) });
    present(engine, 'recover-1', 20);

    expect(present(engine, 'target-still-gone', 30, { targetServed: false })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'target-removed',
      clocks: { recoveryCount: 0 },
    });
  });

  test('exact identity must remain stable across both updates', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });
    present(engine, 'recover-1', 20);

    expect(present(engine, 'wrong-instance', 30, {}, '20260804:shared-trip:OTHER')).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'recovery-identity-mismatch',
      clocks: { recoveryCount: 0 },
    });
  });

  test('an anomaly after recovery update one breaks confirmation without altering absence or regression clocks', () => {
    const engine = governor();
    engine.observeStopOrderRegression({ provenance: evidence('regression-1', 10), regressionKey: 'A27>A24' });
    present(engine, 'recover-1', 20);

    expect(engine.observeNonCountable({ provenance: evidence('anomaly', 25), reasonCode: 'incomplete-snapshot' })).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'noncountable-update',
      clocks: { recoveryCount: 0, stopOrderRegressionCount: 1 },
    });
    expect(present(engine, 'recover-new-1', 30)).toMatchObject({ clocks: { recoveryCount: 1 } });
    expect(present(engine, 'recover-new-2', 40)).toMatchObject({ kind: 'live-readmission-eligible' });
  });

  test('target removal during recovery resets the sequence and remains suppressed until a fresh pair', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });
    present(engine, 'recover-1', 20);
    expect(engine.observeTargetRemoved({ provenance: evidence('target-gone', 30) })).toMatchObject({
      kind: 'hard-suppressed',
      reasonCode: 'target-removed',
      clocks: { recoveryCount: 0 },
    });
    expect(present(engine, 'recover-new-1', 40)).toMatchObject({ clocks: { recoveryCount: 1 } });
    expect(present(engine, 'recover-new-2', 50)).toMatchObject({ kind: 'live-readmission-eligible' });
  });

  test('a duplicate recovery delivery never supplies the second confirmation', () => {
    const engine = governor();
    engine.observeHealthySnapshot({ provenance: evidence('absent-1', 10), entity: { kind: 'absent' } });
    present(engine, 'recover-1', 20);
    expect(present(engine, 'recover-1', 20)).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'recovery-replay',
      clocks: { recoveryCount: 0 },
    });
    expect(present(engine, 'recover-2', 30)).toMatchObject({
      kind: 'precision-withheld',
      reasonCode: 'recovery-confirmation-required',
      clocks: { recoveryCount: 1 },
    });
  });

  test('a thrown invalid movement update is atomic and corrected identical provenance can start recovery', () => {
    const engine = governor();
    engine.observeTargetRemoved({ provenance: evidence('adverse', 10) });
    const candidate = evidence('candidate', 20);

    expect(() => engine.observeHealthySnapshot({
      provenance: candidate,
      entity: {
        kind: 'present',
        trainIdentity: '20260804:shared-trip:0A-0200',
        conditions: conditions({ movementAt: at(21) }),
      },
    })).toThrow(/movement instant cannot be in the future/i);
    expect(engine.observeHealthySnapshot({
      provenance: candidate,
      entity: {
        kind: 'present',
        trainIdentity: '20260804:shared-trip:0A-0200',
        conditions: conditions({ movementAt: at(20) }),
      },
    })).toMatchObject({
      reasonCode: 'recovery-confirmation-required',
      clocks: { recoveryCount: 1 },
      latestEvidence: { evidenceId: 'candidate' },
    });
  });

  test.each([
    ['stableIdentity', 'false'],
    ['plausibleStopOrder', 1],
    ['targetServed', null],
    ['noUnresolvedServiceOrTrackConflict', 'true'],
  ] as const)('rejects non-boolean recovery condition %s atomically', (key, invalid) => {
    const engine = governor();
    engine.observeTargetRemoved({ provenance: evidence('adverse', 10) });
    const candidate = evidence(`invalid-${key}`, 20);
    const malformed = { ...conditions({ movementAt: at(20) }), [key]: invalid } as unknown as RecoveryConditions;

    expect(() => engine.observeHealthySnapshot({
      provenance: candidate,
      entity: { kind: 'present', trainIdentity: '20260804:shared-trip:0A-0200', conditions: malformed },
    })).toThrow(/recovery condition.*boolean/i);
    expect(engine.observeHealthySnapshot({
      provenance: candidate,
      entity: {
        kind: 'present',
        trainIdentity: '20260804:shared-trip:0A-0200',
        conditions: conditions({ movementAt: at(20) }),
      },
    })).toMatchObject({ clocks: { recoveryCount: 1 } });
  });

  test('rejects backward assessment chronology instead of preserving exact Live', () => {
    const engine = governor();
    expect(() => engine.assess(at(-1))).toThrow(/assessment.*before latest evidence/i);
  });
});
