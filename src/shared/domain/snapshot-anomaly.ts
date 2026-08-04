/** The Task 5 normalized snapshot fields consumed by feed governance. */
export interface NormalizedSnapshotEvidence {
  readonly sourceId: string;
  readonly feedGroupId: string;
  readonly feedTimestamp: Date;
  readonly retrievedAt: Date;
  readonly contentHash: string;
  readonly entityCount: number;
  readonly coveredRouteIds: readonly string[];
}

export type SnapshotContextualConcern =
  | 'abnormal-route-population'
  | 'simultaneous-group-loss'
  | 'destructive-route-coverage'
  | 'other-coherence-failure';

export interface SnapshotAnomalyContext {
  readonly contextualConcerns?: readonly SnapshotContextualConcern[];
}

export type SnapshotAnomalyReasonCode =
  | 'coherent-snapshot'
  | 'snapshot-replay'
  | 'timestamp-regression'
  | 'nonadvancing-content-change'
  | 'bulk-population-loss'
  | 'contextual-population-loss'
  | 'destructive-snapshot'
  | 'suspicious-empty-snapshot';

interface SnapshotAssessmentBase {
  readonly feedGroupId: string;
  readonly evidenceId: string;
  readonly reasonCode: SnapshotAnomalyReasonCode;
  readonly lossCount: number;
  readonly lossRatio: number;
  readonly contextualConcerns: readonly SnapshotContextualConcern[];
}

export interface AcceptedSnapshotAssessment extends SnapshotAssessmentBase {
  readonly kind: 'accepted';
  readonly reasonCode: 'coherent-snapshot';
}

export interface ReplayedSnapshotAssessment extends SnapshotAssessmentBase {
  readonly kind: 'replay';
  readonly reasonCode: 'snapshot-replay';
}

export interface QuarantinedSnapshotAssessment extends SnapshotAssessmentBase {
  readonly kind: 'quarantined';
  readonly reasonCode: Exclude<SnapshotAnomalyReasonCode, 'coherent-snapshot' | 'snapshot-replay'>;
}

export type SnapshotAnomalyAssessment =
  | AcceptedSnapshotAssessment
  | ReplayedSnapshotAssessment
  | QuarantinedSnapshotAssessment;

export function assessSnapshotAnomaly(
  candidate: NormalizedSnapshotEvidence,
  previous?: NormalizedSnapshotEvidence,
  context: SnapshotAnomalyContext = {},
): SnapshotAnomalyAssessment {
  validateSnapshot(candidate, 'candidate');
  if (previous) {
    validateSnapshot(previous, 'previous');
    if (candidate.feedGroupId !== previous.feedGroupId) {
      throw new Error('Population comparison requires the same feed group');
    }
  }

  const concerns = Object.freeze([...(context.contextualConcerns ?? [])]);
  const lossCount = previous ? Math.max(0, previous.entityCount - candidate.entityCount) : 0;
  const lossRatio = previous && previous.entityCount > 0 ? lossCount / previous.entityCount : 0;
  const base = {
    feedGroupId: candidate.feedGroupId,
    evidenceId: candidate.contentHash,
    lossCount,
    lossRatio,
    contextualConcerns: concerns,
  };

  if (previous && candidate.feedTimestamp.getTime() < previous.feedTimestamp.getTime()) {
    return Object.freeze({ ...base, kind: 'quarantined', reasonCode: 'timestamp-regression' });
  }
  if (previous && candidate.feedTimestamp.getTime() === previous.feedTimestamp.getTime()) {
    return candidate.contentHash === previous.contentHash
      ? Object.freeze({ ...base, kind: 'replay', reasonCode: 'snapshot-replay' })
      : Object.freeze({ ...base, kind: 'quarantined', reasonCode: 'nonadvancing-content-change' });
  }
  if (candidate.entityCount === 0) {
    return Object.freeze({ ...base, kind: 'quarantined', reasonCode: 'suspicious-empty-snapshot' });
  }
  if (concerns.includes('destructive-route-coverage')) {
    return Object.freeze({ ...base, kind: 'quarantined', reasonCode: 'destructive-snapshot' });
  }
  if (previous && previous.entityCount > 0 && lossRatio >= 0.4) {
    return Object.freeze({ ...base, kind: 'quarantined', reasonCode: 'bulk-population-loss' });
  }
  if (lossCount > 0 && concerns.length > 0) {
    return Object.freeze({ ...base, kind: 'quarantined', reasonCode: 'contextual-population-loss' });
  }
  return Object.freeze({ ...base, kind: 'accepted', reasonCode: 'coherent-snapshot' });
}

function validateSnapshot(snapshot: NormalizedSnapshotEvidence, label: string): void {
  if (!snapshot || typeof snapshot !== 'object') throw new Error(`Invalid ${label} snapshot`);
  if (!snapshot.feedGroupId || !snapshot.sourceId || !snapshot.contentHash) {
    throw new Error(`Invalid ${label} snapshot identity`);
  }
  validInstant(snapshot.feedTimestamp, `${label} feed timestamp`);
  validInstant(snapshot.retrievedAt, `${label} retrieval timestamp`);
  if (!Number.isSafeInteger(snapshot.entityCount) || snapshot.entityCount < 0) {
    throw new Error(`Invalid ${label} entity count`);
  }
  if (!Array.isArray(snapshot.coveredRouteIds)) throw new Error(`Invalid ${label} route coverage`);
}

function validInstant(value: Date, label: string): void {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
}
