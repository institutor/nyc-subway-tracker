import {
  assessSnapshotAnomaly,
  type NormalizedSnapshotEvidence,
  type SnapshotAnomalyContext,
  type SnapshotAnomalyReasonCode,
} from './snapshot-anomaly';

export type FeedFailureReasonCode =
  | 'invalid-decoding'
  | 'malformed-snapshot'
  | 'incomplete-snapshot'
  | 'hard-fetch-validation'
  | 'repeated-update-failures'
  | 'simultaneous-group-loss';

export type FeedHealthReasonCode =
  | 'accepted-current'
  | 'snapshot-age-degraded'
  | 'snapshot-age-unavailable'
  | 'no-accepted-snapshot'
  | 'recovery-confirmation-required'
  | 'feed-recovered'
  | 'anomaly-preservation-expired'
  | Exclude<SnapshotAnomalyReasonCode, 'coherent-snapshot' | 'snapshot-replay'>
  | FeedFailureReasonCode;

export interface FrozenSnapshotProvenance {
  readonly sourceId: string;
  readonly feedGroupId: string;
  readonly contentHash: string;
  readonly feedTimestamp: string;
  readonly retrievedAt: string;
  readonly entityCount: number;
  readonly coveredRouteIds: readonly string[];
}

export interface FrozenFeedAdverseEvidence {
  readonly evidenceId: string;
  readonly authoritativeAt: string;
}

interface FeedHealthDecisionBase {
  readonly feedGroupId: string;
  readonly reasonCode: FeedHealthReasonCode;
  readonly triggerReasonCode: FeedHealthReasonCode;
  readonly feedAgeSeconds: number | null;
  readonly presentation: 'live' | 'frozen-last-good' | 'none';
  readonly fallbackEligibility: 'blocked' | 'eligible';
  readonly liveEvidenceEligibility: 'proceed' | 'blocked' | 'reevaluate';
  readonly recoveryCount: 0 | 1;
  readonly lastGood: FrozenSnapshotProvenance | null;
  readonly adverseEvidence: FrozenFeedAdverseEvidence | null;
  readonly operationalClaim: 'not-inferred';
}

export interface CurrentFeedDecision extends FeedHealthDecisionBase {
  readonly kind: 'current';
  readonly presentation: 'live';
  readonly fallbackEligibility: 'blocked';
  readonly liveEvidenceEligibility: 'proceed' | 'reevaluate';
  readonly recoveryCount: 0;
  readonly lastGood: FrozenSnapshotProvenance;
}

export interface DegradedFeedDecision extends FeedHealthDecisionBase {
  readonly kind: 'degraded';
  readonly presentation: 'frozen-last-good';
  readonly fallbackEligibility: 'blocked';
  readonly liveEvidenceEligibility: 'blocked';
  readonly lastGood: FrozenSnapshotProvenance;
}

export interface UnavailableFeedDecision extends FeedHealthDecisionBase {
  readonly kind: 'unavailable';
  readonly presentation: 'frozen-last-good' | 'none';
  readonly fallbackEligibility: 'blocked' | 'eligible';
  readonly liveEvidenceEligibility: 'blocked';
}

export type FeedHealthDecision = CurrentFeedDecision | DegradedFeedDecision | UnavailableFeedDecision;

export interface RejectedFeedObservation {
  readonly feedGroupId: string;
  readonly evidenceId: string;
  readonly observedAt: Date;
  readonly reasonCode: FeedFailureReasonCode;
}

export interface SimultaneousLossObservation {
  readonly feedGroupId: string;
  readonly evidenceId: string;
}

interface RecoveryState {
  triggerReasonCode: FeedHealthReasonCode;
  adverseEvidenceId: string;
  adverseAtMs: number;
  count: 0 | 1;
  first?: NormalizedSnapshotEvidence;
}

interface GroupState {
  lastGood?: NormalizedSnapshotEvidence;
  recovery?: RecoveryState;
}

export type FeedAgeDecision =
  | { readonly kind: 'current'; readonly reasonCode: 'accepted-current'; readonly feedAgeSeconds: number }
  | { readonly kind: 'degraded'; readonly reasonCode: 'snapshot-age-degraded'; readonly feedAgeSeconds: number }
  | { readonly kind: 'unavailable'; readonly reasonCode: 'snapshot-age-unavailable'; readonly feedAgeSeconds: number };

export function classifyFeedAge(snapshotAt: Date, assessedAt: Date): FeedAgeDecision {
  const ageSeconds = wholeElapsedSeconds(snapshotAt, assessedAt, 'feed age');
  if (ageSeconds <= 90) return Object.freeze({ kind: 'current', reasonCode: 'accepted-current', feedAgeSeconds: ageSeconds });
  if (ageSeconds <= 180) return Object.freeze({ kind: 'degraded', reasonCode: 'snapshot-age-degraded', feedAgeSeconds: ageSeconds });
  return Object.freeze({ kind: 'unavailable', reasonCode: 'snapshot-age-unavailable', feedAgeSeconds: ageSeconds });
}

export class FeedHealthGovernor {
  readonly #groups = new Map<string, GroupState>();

  observe(
    suppliedSnapshot: NormalizedSnapshotEvidence,
    assessedAt: Date,
    context: SnapshotAnomalyContext = {},
  ): FeedHealthDecision {
    validInstant(assessedAt, 'feed assessment instant');
    const snapshot = copySnapshot(suppliedSnapshot);
    const candidateAge = classifyFeedAge(snapshot.feedTimestamp, assessedAt);
    const state = this.#state(snapshot.feedGroupId);

    if (isOlderThanControllingRecoveryEvidence(snapshot, state.recovery)) {
      return this.#decision(snapshot.feedGroupId, assessedAt);
    }

    if (state.lastGood && !state.recovery) {
      const priorAge = classifyFeedAge(state.lastGood.feedTimestamp, assessedAt);
      if (priorAge.kind !== 'current') {
        state.recovery = {
          triggerReasonCode: priorAge.reasonCode,
          adverseEvidenceId: state.lastGood.contentHash,
          adverseAtMs: state.lastGood.feedTimestamp.getTime(),
          count: 0,
        };
      }
    }

    const comparisonSnapshot = state.recovery?.first ?? state.lastGood;
    const anomaly = assessSnapshotAnomaly(snapshot, comparisonSnapshot, context);
    if (anomaly.kind === 'quarantined') {
      state.recovery = {
        triggerReasonCode: anomaly.reasonCode,
        adverseEvidenceId: anomaly.evidenceId,
        adverseAtMs: snapshot.feedTimestamp.getTime(),
        count: 0,
      };
      return this.#decision(snapshot.feedGroupId, assessedAt);
    }

    if (state.recovery) {
      if (anomaly.kind === 'replay' || !isStrictlyNewRecovery(snapshot, state.recovery)) {
        state.recovery.count = 0;
        delete state.recovery.first;
        return this.#decision(snapshot.feedGroupId, assessedAt);
      }
      if (candidateAge.kind !== 'current') {
        state.recovery.count = 0;
        delete state.recovery.first;
        return this.#decision(snapshot.feedGroupId, assessedAt);
      }
      if (state.recovery.count === 0) {
        state.recovery.count = 1;
        state.recovery.first = snapshot;
        return this.#decision(snapshot.feedGroupId, assessedAt);
      }

      const completedRecovery = state.recovery;
      state.lastGood = snapshot;
      delete state.recovery;
      return currentDecision(
        snapshot.feedGroupId,
        snapshot,
        assessedAt,
        'feed-recovered',
        'reevaluate',
        completedRecovery.triggerReasonCode,
        freezeAdverseEvidence(completedRecovery),
      );
    }

    if (anomaly.kind === 'replay') {
      return state.lastGood
        ? normalAgeDecision(snapshot.feedGroupId, state.lastGood, assessedAt)
        : unavailableWithoutContext(snapshot.feedGroupId, 'no-accepted-snapshot');
    }

    state.lastGood = snapshot;
    if (candidateAge.kind === 'degraded') {
      state.recovery = {
        triggerReasonCode: 'snapshot-age-degraded',
        adverseEvidenceId: snapshot.contentHash,
        adverseAtMs: snapshot.feedTimestamp.getTime(),
        count: 0,
      };
    } else if (candidateAge.kind === 'unavailable') {
      state.recovery = {
        triggerReasonCode: 'snapshot-age-unavailable',
        adverseEvidenceId: snapshot.contentHash,
        adverseAtMs: snapshot.feedTimestamp.getTime(),
        count: 0,
      };
    }
    return this.#decision(snapshot.feedGroupId, assessedAt);
  }

  reject(observation: RejectedFeedObservation): FeedHealthDecision {
    const observedAtMs = validInstant(observation.observedAt, 'rejected observation instant');
    validateRejectedIdentity(observation);
    const existing = this.#groups.get(observation.feedGroupId);
    if (validateRejectedChronology(existing, observation, observedAtMs) === 'replay') {
      return this.#decision(observation.feedGroupId, observation.observedAt);
    }
    const state = this.#state(observation.feedGroupId);
    state.recovery = {
      triggerReasonCode: observation.reasonCode,
      adverseEvidenceId: observation.evidenceId,
      adverseAtMs: observedAtMs,
      count: 0,
    };
    return this.#decision(observation.feedGroupId, observation.observedAt);
  }

  rejectSimultaneousLoss(
    observations: readonly SimultaneousLossObservation[],
    observedAt: Date,
  ): readonly FeedHealthDecision[] {
    validInstant(observedAt, 'simultaneous loss instant');
    const uniqueGroups = new Set(observations.map((item) => item.feedGroupId));
    if (uniqueGroups.size < 2 || uniqueGroups.size !== observations.length) {
      throw new Error('Simultaneous group loss requires at least two distinct groups');
    }
    const prepared = observations.map((item) => ({
      ...item,
      observedAt,
      reasonCode: 'simultaneous-group-loss' as const,
    }));
    const observedAtMs = observedAt.getTime();
    for (const item of prepared) {
      validateRejectedIdentity(item);
      validateRejectedChronology(this.#groups.get(item.feedGroupId), item, observedAtMs);
    }
    return Object.freeze(prepared.map((item) => this.reject(item)));
  }

  assess(feedGroupId: string, assessedAt: Date): FeedHealthDecision {
    validInstant(assessedAt, 'feed assessment instant');
    return this.#decision(feedGroupId, assessedAt);
  }

  #state(feedGroupId: string): GroupState {
    if (!feedGroupId) throw new Error('Feed group id is required');
    let state = this.#groups.get(feedGroupId);
    if (!state) {
      state = {};
      this.#groups.set(feedGroupId, state);
    }
    return state;
  }

  #decision(feedGroupId: string, assessedAt: Date): FeedHealthDecision {
    const state = this.#groups.get(feedGroupId);
    if (!state?.lastGood) {
      const triggerReasonCode = state?.recovery?.triggerReasonCode ?? 'no-accepted-snapshot';
      const recoveryCount = state?.recovery?.count ?? 0;
      return unavailableWithoutContext(
        feedGroupId,
        recoveryCount === 1 ? 'recovery-confirmation-required' : triggerReasonCode,
        triggerReasonCode,
        recoveryCount,
        state?.recovery ? freezeAdverseEvidence(state.recovery) : null,
      );
    }
    if (!state.recovery) return normalAgeDecision(feedGroupId, state.lastGood, assessedAt);

    const age = classifyFeedAge(state.lastGood.feedTimestamp, assessedAt);
    const provenance = snapshotProvenance(state.lastGood);
    if (age.feedAgeSeconds > 180) {
      return Object.freeze({
        kind: 'unavailable',
        feedGroupId,
        reasonCode: state.recovery.triggerReasonCode === 'snapshot-age-degraded'
          ? 'snapshot-age-unavailable'
          : 'anomaly-preservation-expired',
        triggerReasonCode: state.recovery.triggerReasonCode,
        feedAgeSeconds: age.feedAgeSeconds,
        presentation: 'none',
        fallbackEligibility: 'eligible',
        liveEvidenceEligibility: 'blocked',
        recoveryCount: state.recovery.count,
        lastGood: provenance,
        adverseEvidence: freezeAdverseEvidence(state.recovery),
        operationalClaim: 'not-inferred',
      });
    }

    const recoveringFreshness = state.recovery.triggerReasonCode === 'snapshot-age-degraded'
      || state.recovery.triggerReasonCode === 'snapshot-age-unavailable';
    const kind = recoveringFreshness && age.kind === 'degraded' ? 'degraded' : 'unavailable';
    const reasonCode = state.recovery.count === 1
      ? 'recovery-confirmation-required'
      : state.recovery.triggerReasonCode;
    return Object.freeze({
      kind,
      feedGroupId,
      reasonCode,
      triggerReasonCode: state.recovery.triggerReasonCode,
      feedAgeSeconds: age.feedAgeSeconds,
      presentation: 'frozen-last-good',
      fallbackEligibility: 'blocked',
      liveEvidenceEligibility: 'blocked',
      recoveryCount: state.recovery.count,
      lastGood: provenance,
      adverseEvidence: freezeAdverseEvidence(state.recovery),
      operationalClaim: 'not-inferred',
    }) as DegradedFeedDecision | UnavailableFeedDecision;
  }
}

function isStrictlyNewRecovery(snapshot: NormalizedSnapshotEvidence, recovery: RecoveryState): boolean {
  if (snapshot.feedTimestamp.getTime() <= recovery.adverseAtMs) return false;
  if (!recovery.first) return true;
  return snapshot.feedTimestamp.getTime() > recovery.first.feedTimestamp.getTime()
    && snapshot.contentHash !== recovery.first.contentHash;
}

function isOlderThanControllingRecoveryEvidence(
  snapshot: NormalizedSnapshotEvidence,
  recovery: RecoveryState | undefined,
): boolean {
  if (!recovery) return false;
  const candidateAtMs = snapshot.feedTimestamp.getTime();
  if (recovery.first) return candidateAtMs < recovery.first.feedTimestamp.getTime();
  return candidateAtMs <= recovery.adverseAtMs;
}

function normalAgeDecision(
  feedGroupId: string,
  snapshot: NormalizedSnapshotEvidence,
  assessedAt: Date,
): FeedHealthDecision {
  const age = classifyFeedAge(snapshot.feedTimestamp, assessedAt);
  if (age.kind === 'current') return currentDecision(feedGroupId, snapshot, assessedAt, 'accepted-current', 'proceed');
  const provenance = snapshotProvenance(snapshot);
  if (age.kind === 'degraded') {
    return Object.freeze({
      kind: 'degraded',
      feedGroupId,
      reasonCode: 'snapshot-age-degraded',
      triggerReasonCode: 'snapshot-age-degraded',
      feedAgeSeconds: age.feedAgeSeconds,
      presentation: 'frozen-last-good',
      fallbackEligibility: 'blocked',
      liveEvidenceEligibility: 'blocked',
      recoveryCount: 0,
      lastGood: provenance,
      adverseEvidence: null,
      operationalClaim: 'not-inferred',
    });
  }
  return Object.freeze({
    kind: 'unavailable',
    feedGroupId,
    reasonCode: 'snapshot-age-unavailable',
    triggerReasonCode: 'snapshot-age-unavailable',
    feedAgeSeconds: age.feedAgeSeconds,
    presentation: 'none',
    fallbackEligibility: 'eligible',
    liveEvidenceEligibility: 'blocked',
    recoveryCount: 0,
    lastGood: provenance,
    adverseEvidence: null,
    operationalClaim: 'not-inferred',
  });
}

function currentDecision(
  feedGroupId: string,
  snapshot: NormalizedSnapshotEvidence,
  assessedAt: Date,
  reasonCode: 'accepted-current' | 'feed-recovered',
  eligibility: 'proceed' | 'reevaluate',
  triggerReasonCode: FeedHealthReasonCode = reasonCode,
  adverseEvidence: FrozenFeedAdverseEvidence | null = null,
): CurrentFeedDecision {
  return Object.freeze({
    kind: 'current',
    feedGroupId,
    reasonCode,
    triggerReasonCode,
    feedAgeSeconds: classifyFeedAge(snapshot.feedTimestamp, assessedAt).feedAgeSeconds,
    presentation: 'live',
    fallbackEligibility: 'blocked',
    liveEvidenceEligibility: eligibility,
    recoveryCount: 0,
    lastGood: snapshotProvenance(snapshot),
    adverseEvidence,
    operationalClaim: 'not-inferred',
  });
}

function unavailableWithoutContext(
  feedGroupId: string,
  reasonCode: FeedHealthReasonCode,
  triggerReasonCode: FeedHealthReasonCode = reasonCode,
  recoveryCount: 0 | 1 = 0,
  adverseEvidence: FrozenFeedAdverseEvidence | null = null,
): UnavailableFeedDecision {
  return Object.freeze({
    kind: 'unavailable',
    feedGroupId,
    reasonCode,
    triggerReasonCode,
    feedAgeSeconds: null,
    presentation: 'none',
    fallbackEligibility: 'eligible',
    liveEvidenceEligibility: 'blocked',
    recoveryCount,
    lastGood: null,
    adverseEvidence,
    operationalClaim: 'not-inferred',
  });
}

function snapshotProvenance(snapshot: NormalizedSnapshotEvidence): FrozenSnapshotProvenance {
  return Object.freeze({
    sourceId: snapshot.sourceId,
    feedGroupId: snapshot.feedGroupId,
    contentHash: snapshot.contentHash,
    feedTimestamp: snapshot.feedTimestamp.toISOString(),
    retrievedAt: snapshot.retrievedAt.toISOString(),
    entityCount: snapshot.entityCount,
    coveredRouteIds: Object.freeze([...snapshot.coveredRouteIds]),
  });
}

function copySnapshot(snapshot: NormalizedSnapshotEvidence): NormalizedSnapshotEvidence {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Normalized snapshot is required');
  return Object.freeze({
    ...snapshot,
    feedTimestamp: new Date(snapshot.feedTimestamp.getTime()),
    retrievedAt: new Date(snapshot.retrievedAt.getTime()),
    coveredRouteIds: Object.freeze([...snapshot.coveredRouteIds]),
  });
}

function freezeAdverseEvidence(recovery: RecoveryState): FrozenFeedAdverseEvidence {
  return Object.freeze({
    evidenceId: recovery.adverseEvidenceId,
    authoritativeAt: new Date(recovery.adverseAtMs).toISOString(),
  });
}

function validateRejectedIdentity(observation: Pick<RejectedFeedObservation, 'feedGroupId' | 'evidenceId'>): void {
  if (!observation.feedGroupId || !observation.evidenceId) throw new Error('Rejected observation identity is required');
}

function validateRejectedChronology(
  state: GroupState | undefined,
  observation: RejectedFeedObservation,
  observedAtMs: number,
): 'new' | 'replay' {
  if (state?.recovery
    && observedAtMs === state.recovery.adverseAtMs
    && observation.evidenceId === state.recovery.adverseEvidenceId
    && observation.reasonCode === state.recovery.triggerReasonCode) {
    return 'replay';
  }
  if (state?.recovery?.first && observedAtMs <= state.recovery.first.feedTimestamp.getTime()) {
    throw new Error('Rejected observation must be newer than accepted recovery evidence');
  }
  const priorAtMs = Math.max(
    state?.lastGood?.feedTimestamp.getTime() ?? Number.NEGATIVE_INFINITY,
    state?.recovery?.adverseAtMs ?? Number.NEGATIVE_INFINITY,
  );
  if (observedAtMs < priorAtMs) throw new Error('Older rejected observation cannot overwrite newer feed state');
  if (observedAtMs === priorAtMs && state?.recovery
    && (observation.evidenceId !== state.recovery.adverseEvidenceId
      || observation.reasonCode !== state.recovery.triggerReasonCode)) {
    throw new Error('Non-new rejected observation cannot overwrite feed incident provenance');
  }
  return 'new';
}

function wholeElapsedSeconds(from: Date, to: Date, label: string): number {
  const fromMs = validInstant(from, `${label} source instant`);
  const toMs = validInstant(to, `${label} comparison instant`);
  const elapsed = toMs - fromMs;
  if (elapsed < 0) throw new Error(`Negative ${label} is invalid`);
  if (elapsed % 1_000 !== 0) throw new Error(`${label} requires whole-second source precision`);
  return elapsed / 1_000;
}

function validInstant(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
