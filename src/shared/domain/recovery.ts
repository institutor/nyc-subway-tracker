export interface TrainEvidenceProvenance {
  readonly feedGroupId: string;
  readonly evidenceId: string;
  readonly observedAt: Date;
  readonly sourceTimestamp: Date;
}

export interface FrozenTrainEvidenceProvenance {
  readonly feedGroupId: string;
  readonly evidenceId: string;
  readonly observedAt: string;
  readonly sourceTimestamp: string;
}

export interface RecoveryConditions {
  readonly stableIdentity: boolean;
  readonly plausibleStopOrder: boolean;
  readonly movementAt: Date;
  readonly targetServed: boolean;
  readonly noUnresolvedServiceOrTrackConflict: boolean;
}

export type TrainRecoveryReasonCode =
  | 'coherent-live-continuity'
  | 'first-healthy-absence'
  | 'second-healthy-absence'
  | 'absence-elapsed-60-seconds'
  | 'single-stop-order-regression'
  | 'stop-order-regression-replay'
  | 'confirmed-stop-order-regression'
  | 'target-removed'
  | 'recovery-confirmation-required'
  | 'recovery-conditions-not-proven'
  | 'recovery-identity-mismatch'
  | 'recovery-replay'
  | 'two-coherent-recovery-updates'
  | 'noncountable-update';

export interface TrainDecisionClocks {
  readonly entityAbsenceCount: 0 | 1 | 2;
  readonly entityAbsenceAgeSeconds: number | null;
  readonly stopOrderRegressionCount: 0 | 1 | 2;
  readonly recoveryCount: 0 | 1 | 2;
  readonly movementAgeSeconds: number | null;
}

interface TrainRecoveryDecisionBase {
  readonly feedGroupId: string;
  readonly trainIdentity: string;
  readonly targetStopId: string;
  readonly reasonCode: TrainRecoveryReasonCode;
  readonly publicPrecision: 'exact' | 'none';
  readonly primaryEligibility: 'eligible' | 'blocked' | 'reevaluate';
  readonly expectedEligibility: 'blocked';
  readonly internalDisposition: 'none' | 'absence-grace' | 'quarantine' | 'recovery' | 'suppressed';
  readonly hardSuppressed: boolean;
  readonly staticReplacementAllowed: false;
  readonly scheduledFallbackTriggered: false;
  readonly cancellationClaim: 'not-inferred';
  readonly serviceClaim: 'not-inferred';
  readonly clocks: TrainDecisionClocks;
  readonly adverseEvidence: FrozenTrainEvidenceProvenance | null;
  readonly latestEvidence: FrozenTrainEvidenceProvenance;
}

export interface LiveContinuityDecision extends TrainRecoveryDecisionBase {
  readonly kind: 'live-continuity';
  readonly publicPrecision: 'exact';
  readonly primaryEligibility: 'eligible';
  readonly internalDisposition: 'none';
  readonly hardSuppressed: false;
}

export interface PrecisionWithheldDecision extends TrainRecoveryDecisionBase {
  readonly kind: 'precision-withheld';
  readonly publicPrecision: 'none';
  readonly primaryEligibility: 'blocked';
  readonly hardSuppressed: false;
}

export interface HardSuppressedDecision extends TrainRecoveryDecisionBase {
  readonly kind: 'hard-suppressed';
  readonly publicPrecision: 'none';
  readonly primaryEligibility: 'blocked';
  readonly internalDisposition: 'suppressed';
  readonly hardSuppressed: true;
}

export interface LiveReadmissionEligibleDecision extends TrainRecoveryDecisionBase {
  readonly kind: 'live-readmission-eligible';
  readonly publicPrecision: 'none';
  readonly primaryEligibility: 'reevaluate';
  readonly internalDisposition: 'none';
  readonly hardSuppressed: false;
  readonly eligibleConfidence: 'live';
}

export type TrainRecoveryDecision =
  | LiveContinuityDecision
  | PrecisionWithheldDecision
  | HardSuppressedDecision
  | LiveReadmissionEligibleDecision;

export interface TrainRecoveryGovernorOptions {
  readonly feedGroupId: string;
  readonly trainIdentity: string;
  readonly targetStopId: string;
  readonly initialEvidence: TrainEvidenceProvenance;
  readonly movementAt: Date;
}

export type HealthyEntityObservation =
  | { readonly kind: 'absent' }
  | {
      readonly kind: 'present';
      readonly trainIdentity: string;
      readonly conditions: RecoveryConditions;
    };

export interface HealthySnapshotObservation {
  readonly provenance: TrainEvidenceProvenance;
  readonly entity: HealthyEntityObservation;
}

export interface NonCountableObservation {
  readonly provenance: TrainEvidenceProvenance;
  readonly reasonCode: 'snapshot-anomaly' | 'incomplete-snapshot' | 'malformed-snapshot' | 'regressed-snapshot';
}

export interface StopOrderRegressionObservation {
  readonly provenance: TrainEvidenceProvenance;
  readonly regressionKey: string;
}

interface StoredEvidence {
  readonly feedGroupId: string;
  readonly evidenceId: string;
  readonly observedAtMs: number;
  readonly sourceTimestampMs: number;
}

interface ValidatedRecoveryConditions {
  readonly movementAtMs: number;
  readonly movementAgeSeconds: number;
}

export class TrainRecoveryGovernor {
  readonly #feedGroupId: string;
  readonly #trainIdentity: string;
  readonly #targetStopId: string;
  #status: 'live' | 'withheld' | 'suppressed' | 'readmission-eligible' = 'live';
  #reasonCode: TrainRecoveryReasonCode = 'coherent-live-continuity';
  #latestEvidence: StoredEvidence;
  #adverseEvidence: StoredEvidence | null = null;
  #movementAtMs: number;
  #absenceStartedAtMs: number | null = null;
  #absenceCount: 0 | 1 | 2 = 0;
  readonly #regressions: StoredEvidence[] = [];
  #regressionKey: string | null = null;
  #recoveryCount: 0 | 1 | 2 = 0;
  #firstRecovery: StoredEvidence | null = null;

  constructor(options: TrainRecoveryGovernorOptions) {
    if (!options.feedGroupId || !options.trainIdentity || !options.targetStopId) {
      throw new Error('Exact train recovery scope is required');
    }
    this.#feedGroupId = options.feedGroupId;
    this.#trainIdentity = options.trainIdentity;
    this.#targetStopId = options.targetStopId;
    this.#latestEvidence = storeEvidence(options.initialEvidence, options.feedGroupId);
    this.#movementAtMs = validInstant(options.movementAt, 'initial movement instant');
  }

  observeHealthySnapshot(observation: HealthySnapshotObservation): TrainRecoveryDecision {
    const evidence = storeEvidence(observation.provenance, this.#feedGroupId);
    const validatedConditions = observation.entity.kind === 'present'
      ? validateConditions(observation.entity.conditions, evidence.sourceTimestampMs)
      : undefined;
    assertEvidenceNotBackward(evidence, this.#latestEvidence);
    const replay = sameEvidence(evidence, this.#latestEvidence);
    if (replay) {
      this.#validateDecisionClocks(evidence.observedAtMs);
      if (observation.entity.kind === 'present' && this.#recoveryCount === 1) {
        this.#recoveryCount = 0;
        this.#firstRecovery = null;
        this.#status = 'withheld';
        this.#reasonCode = 'recovery-replay';
      }
      return this.#decision(evidence.observedAtMs);
    }
    this.#validateElapsedSuppressionClock(evidence.sourceTimestampMs);
    if (observation.entity.kind === 'absent') {
      this.#validateDecisionClocks(
        evidence.observedAtMs,
        this.#absenceStartedAtMs ?? evidence.sourceTimestampMs,
      );
    } else {
      this.#validateDecisionClocks(evidence.observedAtMs, null, validatedConditions!.movementAtMs);
    }
    const elapsedTriggered = this.#applyElapsedSuppression(evidence.sourceTimestampMs);
    this.#latestEvidence = evidence;

    if (observation.entity.kind === 'absent') return this.#observeAbsence(evidence, elapsedTriggered);
    return this.#observePresence(evidence, observation.entity, validatedConditions!);
  }

  observeNonCountable(observation: NonCountableObservation): TrainRecoveryDecision {
    const evidence = storeEvidence(observation.provenance, this.#feedGroupId);
    assertEvidenceNotBackward(evidence, this.#latestEvidence);
    this.#validateElapsedSuppressionClock(evidence.sourceTimestampMs);
    this.#validateDecisionClocks(evidence.observedAtMs);
    if (!sameEvidence(evidence, this.#latestEvidence)) this.#latestEvidence = evidence;
    this.#applyElapsedSuppression(evidence.sourceTimestampMs);
    this.#recoveryCount = 0;
    this.#firstRecovery = null;
    if (this.#status !== 'suppressed') {
      this.#status = 'withheld';
      this.#reasonCode = 'noncountable-update';
    }
    return this.#decision(evidence.observedAtMs);
  }

  observeTargetRemoved(observation: { readonly provenance: TrainEvidenceProvenance }): TrainRecoveryDecision {
    const evidence = storeEvidence(observation.provenance, this.#feedGroupId);
    assertEvidenceNotBackward(evidence, this.#latestEvidence);
    this.#validateDecisionClocks(evidence.observedAtMs, null);
    this.#latestEvidence = evidence;
    this.#recordAdverse(evidence, 'target-removed', 'suppressed');
    this.#absenceCount = 0;
    this.#absenceStartedAtMs = null;
    return this.#decision(evidence.observedAtMs);
  }

  observeStopOrderRegression(observation: StopOrderRegressionObservation): TrainRecoveryDecision {
    if (!observation.regressionKey) throw new Error('Stop-order regression key is required');
    const evidence = storeEvidence(observation.provenance, this.#feedGroupId);
    assertEvidenceNotBackward(evidence, this.#latestEvidence);
    const prior = this.#regressions.at(-1);
    if (this.#status === 'suppressed' && prior
      && observation.regressionKey === this.#regressionKey
      && sameEvidence(evidence, this.#latestEvidence)
      && sameEvidence(evidence, prior)) {
      this.#validateDecisionClocks(evidence.observedAtMs);
      return this.#decision(evidence.observedAtMs);
    }
    this.#validateElapsedSuppressionClock(evidence.sourceTimestampMs);
    this.#validateDecisionClocks(evidence.observedAtMs);
    const elapsedTriggered = this.#applyElapsedSuppression(evidence.sourceTimestampMs);
    if (prior && observation.regressionKey === this.#regressionKey
      && (sameEvidence(evidence, prior) || evidence.sourceTimestampMs <= prior.sourceTimestampMs)) {
      this.#latestEvidence = evidence;
      if (elapsedTriggered) return this.#decision(evidence.observedAtMs);
      this.#status = 'withheld';
      this.#reasonCode = 'stop-order-regression-replay';
      return this.#decision(evidence.observedAtMs);
    }

    this.#latestEvidence = evidence;
    if (prior && observation.regressionKey !== this.#regressionKey) this.#regressions.length = 0;
    this.#regressionKey = observation.regressionKey;
    if (this.#regressions.length < 2) this.#regressions.push(evidence);
    this.#recoveryCount = 0;
    this.#firstRecovery = null;
    if (elapsedTriggered) return this.#decision(evidence.observedAtMs);
    this.#adverseEvidence = evidence;
    if (this.#regressions.length === 1) {
      this.#status = 'withheld';
      this.#reasonCode = 'single-stop-order-regression';
    } else {
      this.#status = 'suppressed';
      this.#reasonCode = 'confirmed-stop-order-regression';
    }
    return this.#decision(evidence.observedAtMs);
  }

  assess(assessedAt: Date): TrainRecoveryDecision {
    const assessedAtMs = validInstant(assessedAt, 'train recovery assessment instant');
    if (assessedAtMs < this.#latestEvidence.observedAtMs) {
      throw new Error('Train recovery assessment cannot be before latest evidence');
    }
    this.#validateDecisionClocks(assessedAtMs);
    this.#validateElapsedSuppressionClock(assessedAtMs);
    this.#applyElapsedSuppression(assessedAtMs);
    return this.#decision(assessedAtMs);
  }

  #observeAbsence(evidence: StoredEvidence, elapsedTriggered: boolean): TrainRecoveryDecision {
    this.#recoveryCount = 0;
    this.#firstRecovery = null;
    if (this.#absenceCount === 0) {
      this.#absenceCount = 1;
      this.#absenceStartedAtMs = evidence.sourceTimestampMs;
      this.#recordAdverse(evidence, 'first-healthy-absence', 'withheld');
    } else {
      this.#absenceCount = 2;
      if (!elapsedTriggered) this.#recordAdverse(evidence, 'second-healthy-absence', 'suppressed');
    }
    return this.#decision(evidence.observedAtMs);
  }

  #observePresence(
    evidence: StoredEvidence,
    entity: Extract<HealthyEntityObservation, { kind: 'present' }>,
    conditions: ValidatedRecoveryConditions,
  ): TrainRecoveryDecision {
    this.#absenceCount = 0;
    this.#absenceStartedAtMs = null;
    if (entity.trainIdentity !== this.#trainIdentity) {
      this.#status = 'withheld';
      this.#reasonCode = 'recovery-identity-mismatch';
      this.#recoveryCount = 0;
      this.#firstRecovery = null;
      return this.#decision(evidence.observedAtMs);
    }

    this.#movementAtMs = conditions.movementAtMs;
    if (!entity.conditions.targetServed) {
      this.#recordAdverse(evidence, 'target-removed', 'suppressed');
      return this.#decision(evidence.observedAtMs);
    }

    if (!this.#adverseEvidence && this.#status === 'live') {
      this.#reasonCode = 'coherent-live-continuity';
      return this.#decision(evidence.observedAtMs);
    }

    const qualifying = entity.conditions.stableIdentity
      && entity.conditions.plausibleStopOrder
      && conditions.movementAgeSeconds <= 90
      && entity.conditions.noUnresolvedServiceOrTrackConflict;
    const newerThanAdverse = this.#adverseEvidence !== null
      && evidence.sourceTimestampMs > this.#adverseEvidence.sourceTimestampMs;
    const newerThanFirst = this.#firstRecovery === null
      || evidence.sourceTimestampMs > this.#firstRecovery.sourceTimestampMs;
    const distinctFromFirst = this.#firstRecovery === null
      || evidence.evidenceId !== this.#firstRecovery.evidenceId;

    if (!qualifying || !newerThanAdverse || !newerThanFirst || !distinctFromFirst) {
      this.#status = 'withheld';
      this.#reasonCode = 'recovery-conditions-not-proven';
      this.#recoveryCount = 0;
      this.#firstRecovery = null;
      return this.#decision(evidence.observedAtMs);
    }

    if (this.#recoveryCount === 0) {
      this.#status = 'withheld';
      this.#reasonCode = 'recovery-confirmation-required';
      this.#recoveryCount = 1;
      this.#firstRecovery = evidence;
      return this.#decision(evidence.observedAtMs);
    }

    this.#status = 'readmission-eligible';
    this.#reasonCode = 'two-coherent-recovery-updates';
    this.#recoveryCount = 2;
    this.#regressions.length = 0;
    this.#regressionKey = null;
    return this.#decision(evidence.observedAtMs);
  }

  #recordAdverse(
    evidence: StoredEvidence,
    reasonCode: TrainRecoveryReasonCode,
    status: 'withheld' | 'suppressed',
  ): void {
    this.#adverseEvidence = evidence;
    this.#status = status;
    this.#reasonCode = reasonCode;
    this.#recoveryCount = 0;
    this.#firstRecovery = null;
  }

  #validateElapsedSuppressionClock(assessedAtMs: number): void {
    if (this.#absenceStartedAtMs !== null) {
      wholeElapsedSeconds(this.#absenceStartedAtMs, assessedAtMs, 'entity absence age');
    }
  }

  #validateDecisionClocks(
    assessedAtMs: number,
    absenceStartedAtMs: number | null = this.#absenceStartedAtMs,
    movementAtMs: number = this.#movementAtMs,
  ): void {
    if (absenceStartedAtMs !== null) {
      wholeElapsedSeconds(absenceStartedAtMs, assessedAtMs, 'entity absence age');
    }
    if (assessedAtMs >= movementAtMs) {
      wholeElapsedSeconds(movementAtMs, assessedAtMs, 'train movement age');
    }
  }

  #applyElapsedSuppression(assessedAtMs: number): boolean {
    if (this.#absenceStartedAtMs === null || this.#status === 'readmission-eligible'
      || assessedAtMs - this.#absenceStartedAtMs < 60_000) return false;
    this.#status = 'suppressed';
    this.#reasonCode = 'absence-elapsed-60-seconds';
    this.#recoveryCount = 0;
    this.#firstRecovery = null;
    return true;
  }

  #decision(assessedAtMs: number): TrainRecoveryDecision {
    const absenceAgeSeconds = this.#absenceStartedAtMs === null
      ? null
      : wholeElapsedSeconds(this.#absenceStartedAtMs, assessedAtMs, 'entity absence age');
    const movementAgeSeconds = assessedAtMs < this.#movementAtMs
      ? null
      : wholeElapsedSeconds(this.#movementAtMs, assessedAtMs, 'train movement age');
    const common = {
      feedGroupId: this.#feedGroupId,
      trainIdentity: this.#trainIdentity,
      targetStopId: this.#targetStopId,
      reasonCode: this.#reasonCode,
      expectedEligibility: 'blocked' as const,
      staticReplacementAllowed: false as const,
      scheduledFallbackTriggered: false as const,
      cancellationClaim: 'not-inferred' as const,
      serviceClaim: 'not-inferred' as const,
      clocks: Object.freeze({
        entityAbsenceCount: this.#absenceCount,
        entityAbsenceAgeSeconds: absenceAgeSeconds,
        stopOrderRegressionCount: Math.min(2, this.#regressions.length) as 0 | 1 | 2,
        recoveryCount: this.#recoveryCount,
        movementAgeSeconds,
      }),
      adverseEvidence: this.#adverseEvidence ? freezeEvidence(this.#adverseEvidence) : null,
      latestEvidence: freezeEvidence(this.#latestEvidence),
    };

    if (this.#status === 'live') {
      return Object.freeze({
        ...common,
        kind: 'live-continuity',
        publicPrecision: 'exact',
        primaryEligibility: 'eligible',
        internalDisposition: 'none',
        hardSuppressed: false,
      });
    }
    if (this.#status === 'suppressed') {
      return Object.freeze({
        ...common,
        kind: 'hard-suppressed',
        publicPrecision: 'none',
        primaryEligibility: 'blocked',
        internalDisposition: 'suppressed',
        hardSuppressed: true,
      });
    }
    if (this.#status === 'readmission-eligible') {
      return Object.freeze({
        ...common,
        kind: 'live-readmission-eligible',
        publicPrecision: 'none',
        primaryEligibility: 'reevaluate',
        internalDisposition: 'none',
        hardSuppressed: false,
        eligibleConfidence: 'live',
      });
    }
    return Object.freeze({
      ...common,
      kind: 'precision-withheld',
      publicPrecision: 'none',
      primaryEligibility: 'blocked',
      internalDisposition: this.#reasonCode === 'first-healthy-absence'
        ? 'absence-grace'
        : this.#reasonCode.includes('stop-order-regression')
          ? 'quarantine'
          : 'recovery',
      hardSuppressed: false,
    });
  }
}

function validateConditions(
  conditions: RecoveryConditions,
  sourceTimestampMs: number,
): ValidatedRecoveryConditions {
  if (!conditions || typeof conditions !== 'object') throw new Error('Recovery conditions are required');
  for (const [name, value] of [
    ['stableIdentity', conditions.stableIdentity],
    ['plausibleStopOrder', conditions.plausibleStopOrder],
    ['targetServed', conditions.targetServed],
    ['noUnresolvedServiceOrTrackConflict', conditions.noUnresolvedServiceOrTrackConflict],
  ] as const) {
    if (typeof value !== 'boolean') throw new Error(`Recovery condition ${name} must be boolean`);
  }
  const movementAtMs = validInstant(conditions.movementAt, 'recovery movement instant');
  if (movementAtMs > sourceTimestampMs) throw new Error('Recovery movement instant cannot be in the future');
  return {
    movementAtMs,
    movementAgeSeconds: wholeElapsedSeconds(movementAtMs, sourceTimestampMs, 'recovery movement age'),
  };
}

function storeEvidence(provenance: TrainEvidenceProvenance, expectedGroup: string): StoredEvidence {
  if (!provenance || typeof provenance !== 'object' || !provenance.evidenceId) {
    throw new Error('Train evidence provenance is required');
  }
  if (provenance.feedGroupId !== expectedGroup) throw new Error('Train evidence belongs to a different feed group');
  const observedAtMs = validInstant(provenance.observedAt, 'train evidence observation instant');
  const sourceTimestampMs = validInstant(provenance.sourceTimestamp, 'train evidence source timestamp');
  if (sourceTimestampMs > observedAtMs) throw new Error('Train evidence source timestamp cannot be after observation');
  return Object.freeze({
    feedGroupId: provenance.feedGroupId,
    evidenceId: provenance.evidenceId,
    observedAtMs,
    sourceTimestampMs,
  });
}

function sameEvidence(left: StoredEvidence, right: StoredEvidence): boolean {
  return left.feedGroupId === right.feedGroupId
    && left.evidenceId === right.evidenceId
    && left.sourceTimestampMs === right.sourceTimestampMs;
}

function assertEvidenceNotBackward(candidate: StoredEvidence, latest: StoredEvidence): void {
  if (candidate.observedAtMs < latest.observedAtMs || candidate.sourceTimestampMs < latest.sourceTimestampMs) {
    throw new Error('Train evidence cannot move backward from latest evidence');
  }
}

function freezeEvidence(evidence: StoredEvidence): FrozenTrainEvidenceProvenance {
  return Object.freeze({
    feedGroupId: evidence.feedGroupId,
    evidenceId: evidence.evidenceId,
    observedAt: new Date(evidence.observedAtMs).toISOString(),
    sourceTimestamp: new Date(evidence.sourceTimestampMs).toISOString(),
  });
}

function wholeElapsedSeconds(fromMs: number, toMs: number, label: string): number {
  const elapsed = toMs - fromMs;
  if (elapsed < 0) throw new Error(`Negative ${label} is invalid`);
  if (elapsed % 1_000 !== 0) throw new Error(`${label} requires whole-second source precision`);
  return elapsed / 1_000;
}

function validInstant(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
