import { createHash } from 'node:crypto';

import { encodeCanonicalStringTuple } from '../../shared/domain/canonical';
import { CURRENT_ALERT_MAX_AGE_MS } from '../../shared/domain/alert-scope';
import { evaluateExposure } from '../release/exposure-gates';
import { MAX_SHADOW_RECORD_BYTES } from './shadow-record';

export const MAX_SHADOW_COMPARISON_INTERVAL_MS = 15 * 60 * 1_000;

export type ShadowDisposition = 'admitted' | 'suppressed';
export type ShadowSuppressionReason =
  | 'TRUSTED_HISTORY_UNAVAILABLE'
  | 'STALE_MOVEMENT_EVIDENCE'
  | 'MOVEMENT_EVIDENCE_UNAVAILABLE'
  | 'FEED_NOT_CURRENT'
  | 'SERVICE_CHANGE_NOT_ELIGIBLE'
  | 'TRACK_EVIDENCE_NOT_ELIGIBLE'
  | 'SERVICE_OWNERSHIP_UNAVAILABLE';

type AlertContext = {
  readonly state: 'accepted'; readonly sourceId: 'subway-alerts'; readonly observedAt: string;
  readonly retrievedAt: string; readonly sha256: string; readonly snapshotState: 'current' | 'stale';
  readonly alertContextIdentity: string;
} | {
  readonly state: 'failed'; readonly sourceId: 'subway-alerts';
  readonly reasonCode: 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED';
};

export interface ShadowServiceIdentity {
  readonly tripId: string; readonly startDate: string; readonly startTime: string; readonly trainIdentity: string;
}

export interface ShadowAdmissionEvidence {
  readonly earlierRecordId: string; readonly priorClaimKey: string; readonly priorObservedAt: string;
  readonly priorRemainingStopCallIdentities: readonly string[];
  readonly movementTimestamp: string; readonly movementStatus: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO';
  readonly movementEvidenceIdentity: string; readonly targetEventAt: string; readonly targetStopCallIdentity: string;
  readonly targetEvidenceIdentity: string; readonly scheduledTrack: string; readonly actualTrack: string;
  readonly trackEvidenceIdentity: string; readonly serviceClaimId: string;
  readonly serviceClaimBindingDigest: string; readonly serviceAssessmentAt: string;
  readonly serviceAlertContextIdentity: string; readonly issuedAlertContextDigest: string;
  readonly serviceDecisionDigest: string; readonly admittedStopCallIdentity: string;
}

export interface ShadowProgressClaim {
  readonly claimId: string; readonly claimKey: string; readonly sourceId: string; readonly observedAt: string;
  readonly operationalTrainId: string; readonly serviceDate: string | null; readonly serviceInstanceId: string | null;
  readonly serviceIdentity: ShadowServiceIdentity | null;
  readonly routeId: string; readonly direction: 'northbound' | 'southbound'; readonly terminalDestinationStopId: string;
  readonly nextStopId: string; readonly nextStopCallIdentity: string; readonly targetStopId: string;
  readonly targetStopCallIdentity: string; readonly remainingStopCallIdentities: readonly string[]; readonly decisionTime: string;
  readonly disposition: ShadowDisposition; readonly suppressionReasonCode?: ShadowSuppressionReason;
  readonly admissionEvidence?: ShadowAdmissionEvidence;
  readonly provenance: { readonly source: 'gtfs-rt'; readonly sourceId: string; readonly feedGroupId: string;
    readonly observedAt: string; readonly retrievedAt: string; readonly sha256: string };
  readonly decisions: {
    readonly feedHealth: { readonly kind: 'current' | 'degraded' | 'unavailable'; readonly reasonCode: 'accepted-current' | 'snapshot-age-degraded' | 'snapshot-age-unavailable' };
    readonly serviceChange: { readonly kind: 'eligible-context' | 'resolved-suppression' | 'arrival-claim-unavailable' | 'quarantine-or-limitation';
      readonly disposition: 'eligible' | 'resolved-ineligible' | 'high-impact-unresolved' | 'quarantined'; readonly alertContext: AlertContext };
    readonly admission: { readonly kind: 'admitted' | 'rejected'; readonly disposition: ShadowDisposition;
      readonly reasonCode: 'GOVERNED_ADMISSION' | ShadowSuppressionReason };
  };
}

export type ShadowComparisonReason = 'NEXT_STOP_ADVANCED' | 'NEXT_STOP_UNCHANGED' | 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT'
  | 'LATER_OBSERVATION_NOT_LATER' | 'TARGET_NOT_IN_LATER_PATH' | 'PATH_CHANGED_OR_REROUTED'
  | 'COMPARISON_INTERVAL_EXCEEDED' | 'SERVICE_OWNERSHIP_UNAVAILABLE' | 'SERVICE_INSTANCE_CHANGED'
  | 'CURRENT_CLAIMS_TRUNCATED';

export interface ShadowProgressComparison {
  readonly earlierClaimKey: string; readonly laterClaimKey: string | null;
  readonly sourceId: string; readonly operationalTrainId: string; readonly serviceDate: string | null;
  readonly serviceInstanceId: string | null; readonly targetStopId: string; readonly targetStopCallIdentity: string;
  readonly earlierObservedAt: string; readonly laterObservedAt: string | null;
  readonly earlierDisposition: ShadowDisposition; readonly laterDisposition: ShadowDisposition | null;
  readonly dispositionTransition: 'admitted-to-admitted' | 'admitted-to-suppressed' | 'admitted-to-missing'
    | 'suppressed-to-admitted' | 'suppressed-to-suppressed' | 'suppressed-to-missing';
  readonly result: 'progressed' | 'not-observed' | 'inconclusive'; readonly reasonCode: ShadowComparisonReason;
}

export interface ShadowComparisonContext {
  readonly earlierRecordId: string; readonly earlierRecordSha256: string; readonly earlierDecisionTime: string;
  readonly earlierRecordedAt: string; readonly laterRecordId: string; readonly laterDecisionTime: string;
  readonly laterRecordedAt: string; readonly intervalMilliseconds: number; readonly maximumIntervalMilliseconds: number;
}

interface TruncationDetail { readonly consideredCount: number; readonly includedCount: number; readonly omittedCount: number;
  readonly reasonCode: 'NOT_TRUNCATED' | 'BYTE_BUDGET_EXHAUSTED' }
export interface ShadowTruncation { readonly claims: TruncationDetail; readonly comparisons: TruncationDetail }

export interface ShadowProgressRecord {
  readonly schemaVersion: 'shadow-v2'; readonly recordId: string; readonly mode: 'shadow'; readonly recordedAt: string;
  readonly decisionTime: string; readonly riderExposure: false; readonly boardsExposed: false;
  readonly outcome: 'DRY_RUN_NO_NETWORK' | 'COMPLETED' | 'COMPLETED_WITH_SOURCE_FAILURES';
  readonly sources: readonly Record<string, unknown>[]; readonly gates: readonly Record<string, unknown>[];
  readonly comparisonContext: ShadowComparisonContext | null; readonly truncation: ShadowTruncation;
  readonly claims: readonly ShadowProgressClaim[]; readonly progressComparisons: readonly ShadowProgressComparison[];
}

const SOURCE_IDS = ['subway-rt-1234567s', 'subway-rt-ace', 'subway-rt-bdfm', 'subway-rt-g',
  'subway-rt-jz', 'subway-rt-l', 'subway-rt-nqrw', 'subway-alerts'] as const;
const CLAIM_PARTITION_BYTES = 620_000;
const COMPARISON_PARTITION_BYTES = 340_000;

export function canonicalShadowClaimIdentity(parts: readonly (string | null)[]): { claimId: string; claimKey: string } {
  const digest = createHash('sha256').update(encodeCanonicalStringTuple(parts)).digest('hex');
  return { claimId: `claim-id:${digest}`, claimKey: `claim:${digest}` };
}

export function canonicalShadowServiceInstance(identity: ShadowServiceIdentity): string {
  return `service:${digestTuple([identity.tripId, identity.startDate, identity.startTime, identity.trainIdentity])}`;
}

export function canonicalShadowAlertContextIdentity(input: {
  readonly sourceId: string; readonly observedAt: string; readonly retrievedAt: string; readonly sha256: string;
}): string {
  return `alert-context:${digestTuple([input.sourceId, input.observedAt, input.retrievedAt, input.sha256])}`;
}

export function canonicalMovementEvidenceIdentity(input: {
  readonly sourceId: string; readonly trainIdentity: string; readonly movementTimestamp: string;
  readonly movementStatus: string; readonly stopCallIdentity: string;
}): string {
  return `movement:${digestTuple([input.sourceId, input.trainIdentity, input.movementTimestamp, input.movementStatus, input.stopCallIdentity])}`;
}

export function canonicalTargetEvidenceIdentity(input: {
  readonly sourceId: string; readonly trainIdentity: string; readonly targetStopCallIdentity: string; readonly targetEventAt: string;
}): string {
  return `target:${digestTuple([input.sourceId, input.trainIdentity, input.targetStopCallIdentity, input.targetEventAt])}`;
}

export function canonicalTrackEvidenceIdentity(input: {
  readonly sourceId: string; readonly trainIdentity: string; readonly targetStopCallIdentity: string;
  readonly scheduledTrack: string; readonly actualTrack: string;
}): string {
  return `track:${digestTuple([input.sourceId, input.trainIdentity, input.targetStopCallIdentity,
    input.scheduledTrack, input.actualTrack])}`;
}

export function canonicalServiceClaimBindingDigest(claim: ShadowProgressClaim): string {
  return `service-claim:${digestTuple([claim.claimId, claim.routeId, claim.targetStopId, claim.direction,
    claim.serviceIdentity?.tripId ?? null, claim.operationalTrainId])}`;
}

export function canonicalServiceDecisionDigest(evidence: Pick<ShadowAdmissionEvidence,
  'serviceClaimId' | 'serviceClaimBindingDigest' | 'serviceAssessmentAt' | 'serviceAlertContextIdentity' | 'issuedAlertContextDigest'>): string {
  return `service-decision:${digestTuple(['eligible-context', 'eligible', evidence.serviceClaimId,
    evidence.serviceClaimBindingDigest, evidence.serviceAssessmentAt, evidence.serviceAlertContextIdentity, evidence.issuedAlertContextDigest])}`;
}

export function canonicalIssuedAlertContextDigest(input: Pick<ShadowAdmissionEvidence,
  'serviceAlertContextIdentity' | 'serviceAssessmentAt'>): string {
  return `issued-alert:${digestTuple([input.serviceAlertContextIdentity, input.serviceAssessmentAt])}`;
}

export function createShadowComparisonContext(input: {
  readonly earlier: ShadowProgressRecord; readonly earlierBytes: string; readonly later: ShadowProgressRecord;
}): ShadowComparisonContext {
  const intervalMilliseconds = Date.parse(input.later.decisionTime) - Date.parse(input.earlier.decisionTime);
  return {
    earlierRecordId: input.earlier.recordId,
    earlierRecordSha256: createHash('sha256').update(input.earlierBytes).digest('hex'),
    earlierDecisionTime: input.earlier.decisionTime,
    earlierRecordedAt: input.earlier.recordedAt,
    laterRecordId: input.later.recordId,
    laterDecisionTime: input.later.decisionTime,
    laterRecordedAt: input.later.recordedAt,
    intervalMilliseconds,
    maximumIntervalMilliseconds: MAX_SHADOW_COMPARISON_INTERVAL_MS,
  };
}

export function compareShadowProgress(earlier: ShadowProgressRecord, later: ShadowProgressRecord): readonly ShadowProgressComparison[] {
  if (earlier.recordId === later.recordId) throw new Error('Shadow record identities must be distinct');
  assertUniqueClaims(earlier.claims); assertUniqueClaims(later.claims);
  const laterByClaim = new Map(later.claims.map((candidate) => [candidate.claimKey, candidate]));
  const laterByPhysicalTarget = new Map<string, ShadowProgressClaim>();
  for (const claim of later.claims) {
    const key = physicalTargetKey(claim);
    if (laterByPhysicalTarget.has(key)) throw new Error('Duplicate current physical claim identity');
    laterByPhysicalTarget.set(key, claim);
  }
  const laterByTrain = groupByTrain(later.claims);
  const interval = Date.parse(later.decisionTime) - Date.parse(earlier.decisionTime);
  return [...earlier.claims].sort((a, b) => a.claimKey.localeCompare(b.claimKey)).map((candidate): ShadowProgressComparison => {
    const next = laterByClaim.get(candidate.claimKey) ?? laterByPhysicalTarget.get(physicalTargetKey(candidate));
    const trainCandidates = laterByTrain.get(trainKey(candidate)) ?? [];
    const base = comparisonBase(candidate, next ?? null);
    if (interval < 0 || interval > MAX_SHADOW_COMPARISON_INTERVAL_MS) return inconclusive(base, 'COMPARISON_INTERVAL_EXCEEDED');
    if (!candidate.serviceDate || !candidate.serviceInstanceId) {
      return inconclusive(base, 'SERVICE_OWNERSHIP_UNAVAILABLE');
    }
    if (!next) {
      if (later.truncation.claims.omittedCount > 0) return inconclusive(base, 'CURRENT_CLAIMS_TRUNCATED');
      const targetRemains = trainCandidates.some((row) => row.remainingStopCallIdentities.includes(candidate.targetStopCallIdentity));
      return inconclusive(base, trainCandidates.length === 0 ? 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT'
        : targetRemains ? 'PATH_CHANGED_OR_REROUTED' : 'TARGET_NOT_IN_LATER_PATH');
    }
    if (!next.serviceDate || !next.serviceInstanceId) return inconclusive(base, 'SERVICE_OWNERSHIP_UNAVAILABLE');
    if (candidate.serviceDate !== next.serviceDate || candidate.serviceInstanceId !== next.serviceInstanceId) return inconclusive(base, 'SERVICE_INSTANCE_CHANGED');
    if (Date.parse(next.observedAt) <= Date.parse(candidate.observedAt)) return inconclusive(base, 'LATER_OBSERVATION_NOT_LATER');
    if (next.nextStopCallIdentity === candidate.nextStopCallIdentity) return { ...base, result: 'not-observed', reasonCode: 'NEXT_STOP_UNCHANGED' };
    const laterIndex = candidate.remainingStopCallIdentities.indexOf(next.nextStopCallIdentity);
    if (laterIndex <= 0 || next.routeId !== candidate.routeId || next.direction !== candidate.direction) return inconclusive(base, 'PATH_CHANGED_OR_REROUTED');
    if (!next.remainingStopCallIdentities.includes(candidate.targetStopCallIdentity)) return inconclusive(base, 'TARGET_NOT_IN_LATER_PATH');
    if (!sameStrings(candidate.remainingStopCallIdentities.slice(laterIndex), next.remainingStopCallIdentities)) return inconclusive(base, 'PATH_CHANGED_OR_REROUTED');
    return { ...base, result: 'progressed', reasonCode: 'NEXT_STOP_ADVANCED' };
  });
}

export function buildBoundedShadowRecord(input: Omit<ShadowProgressRecord, 'truncation'> & { readonly truncation?: ShadowTruncation }): ShadowProgressRecord {
  const claims = deterministicPrefix(input.claims, (row) => row.claimKey, CLAIM_PARTITION_BYTES);
  const retainedClaimKeys = new Set(claims.map((claim) => claim.claimKey));
  const eligibleComparisons = input.progressComparisons.filter((row) => row.laterClaimKey === null || retainedClaimKeys.has(row.laterClaimKey));
  const comparisons = input.comparisonContext === null ? [] : deterministicPrefix(eligibleComparisons, (row) => row.earlierClaimKey, COMPARISON_PARTITION_BYTES);
  let record = composed(input, claims, comparisons);
  while (byteLength(record) > MAX_SHADOW_RECORD_BYTES && (comparisons.length > 0 || claims.length > 0)) {
    if (comparisons.length > 0) comparisons.pop(); else claims.pop();
    record = composed(input, claims, comparisons);
  }
  if (byteLength(record) > MAX_SHADOW_RECORD_BYTES) throw new Error('Shadow envelope exceeds byte ceiling');
  return parseShadowProgressRecord(record);
}

export function validateShadowComparisonBinding(value: unknown, earlierBytes: string): ShadowProgressRecord {
  const current = parseShadowProgressRecord(value);
  if (!current.comparisonContext) {
    if (current.progressComparisons.length !== 0) throw new Error('Invalid unbound shadow comparison');
    return current;
  }
  let earlierValue: unknown;
  try { earlierValue = JSON.parse(earlierBytes); } catch { throw new Error('Invalid bound prior bytes'); }
  const earlier = parseShadowProgressRecord(earlierValue);
  const expectedContext = createShadowComparisonContext({ earlier, earlierBytes, later: current });
  if (!sameJson(current.comparisonContext, expectedContext)) throw new Error('Invalid bound comparison context');
  const expected = compareShadowProgress(earlier, current);
  const rebuilt = rebuildComparisonPartition(current, expected);
  if (!sameJson(current.progressComparisons, rebuilt.progressComparisons)
    || !sameJson(current.truncation.comparisons, rebuilt.truncation.comparisons)) throw new Error('Invalid bound comparison rows');
  validateAdmittedClaims(current, earlier);
  return current;
}

function rebuildComparisonPartition(current: ShadowProgressRecord, expected: readonly ShadowProgressComparison[]): ShadowProgressRecord {
  const retained = new Set(current.claims.map((claim) => claim.claimKey));
  const eligible = expected.filter((row) => row.laterClaimKey === null || retained.has(row.laterClaimKey));
  const comparisons = deterministicPrefix(eligible, (row) => row.earlierClaimKey, COMPARISON_PARTITION_BYTES);
  const compose = (): ShadowProgressRecord => ({ ...current, progressComparisons: comparisons,
    truncation: { claims: current.truncation.claims, comparisons: truncationDetail(expected.length, comparisons.length) } });
  let rebuilt = compose();
  while (byteLength(rebuilt) > MAX_SHADOW_RECORD_BYTES && comparisons.length > 0) { comparisons.pop(); rebuilt = compose(); }
  if (byteLength(rebuilt) > MAX_SHADOW_RECORD_BYTES) throw new Error('Invalid bound comparison envelope');
  return rebuilt;
}

function validateAdmittedClaims(current: ShadowProgressRecord, earlier: ShadowProgressRecord): void {
  for (const claim of current.claims.filter((item) => item.disposition === 'admitted')) {
    const evidence = claim.admissionEvidence!;
    const prior = earlier.claims.find((item) => item.claimKey === evidence.priorClaimKey);
    const currentIndex = prior?.remainingStopCallIdentities.indexOf(claim.nextStopCallIdentity) ?? -1;
    if (!current.comparisonContext || evidence.earlierRecordId !== earlier.recordId || !prior
      || prior.observedAt !== evidence.priorObservedAt
      || !sameStrings(prior.remainingStopCallIdentities, evidence.priorRemainingStopCallIdentities)
      || prior.sourceId !== claim.sourceId || prior.operationalTrainId !== claim.operationalTrainId
      || prior.serviceDate !== claim.serviceDate || prior.serviceInstanceId !== claim.serviceInstanceId
      || prior.targetStopCallIdentity !== claim.targetStopCallIdentity || prior.routeId !== claim.routeId
      || prior.direction !== claim.direction || prior.terminalDestinationStopId !== claim.terminalDestinationStopId
      || currentIndex <= 0 || !sameStrings(prior.remainingStopCallIdentities.slice(currentIndex), claim.remainingStopCallIdentities)
      || Date.parse(evidence.movementTimestamp) <= Date.parse(prior.observedAt)
      || Date.parse(evidence.movementTimestamp) > Date.parse(claim.decisionTime)
      || Date.parse(claim.decisionTime) - Date.parse(evidence.movementTimestamp) > 90_000
      || Date.parse(evidence.targetEventAt) <= Date.parse(claim.decisionTime)
      || evidence.serviceAssessmentAt !== claim.decisionTime) throw new Error('Invalid admitted shadow comparison binding');
  }
}

export function parseShadowProgressRecord(value: unknown): ShadowProgressRecord {
  try {
    if (byteLength(value) > MAX_SHADOW_RECORD_BYTES) throw new Error();
    const row = exactRecord(value, ['schemaVersion', 'recordId', 'mode', 'recordedAt', 'decisionTime', 'riderExposure', 'boardsExposed',
      'outcome', 'sources', 'gates', 'comparisonContext', 'truncation', 'claims', 'progressComparisons']);
    if (row.schemaVersion !== 'shadow-v2' || row.mode !== 'shadow' || row.riderExposure !== false || row.boardsExposed !== false
      || !boundedString(row.recordId) || !String(row.recordId).startsWith('shadow-') || !iso(row.recordedAt) || !iso(row.decisionTime)
      || Date.parse(String(row.decisionTime)) > Date.parse(String(row.recordedAt))
      || !['DRY_RUN_NO_NETWORK', 'COMPLETED', 'COMPLETED_WITH_SOURCE_FAILURES'].includes(String(row.outcome))
      || !Array.isArray(row.sources) || row.sources.length !== SOURCE_IDS.length || !Array.isArray(row.gates) || row.gates.length !== 9
      || !Array.isArray(row.claims) || row.claims.length > 500 || !Array.isArray(row.progressComparisons) || row.progressComparisons.length > 500) throw new Error();
    const decisionTime = String(row.decisionTime); const recordedAt = String(row.recordedAt);
    const sources = row.sources.map((source, index) => validateSourceRecord(source, index, String(row.outcome), decisionTime, recordedAt));
    validateOutcome(sources, String(row.outcome)); row.gates.forEach(validateGateRecord);
    const claims = row.claims.map((claim) => validateClaim(claim, decisionTime, recordedAt, sources)); assertUniqueClaims(claims);
    if (!canonicallyOrdered(claims, (claim) => claim.claimKey)) throw new Error();
    const comparisonContext = row.comparisonContext === null ? null : validateComparisonContext(row.comparisonContext, row, recordedAt);
    const truncation = validateTruncation(row.truncation, claims.length, row.progressComparisons.length);
    const progressComparisons = row.progressComparisons.map((item) => validateComparisonRecord(item, comparisonContext, claims));
    assertUniqueComparisons(progressComparisons);
    if (!canonicallyOrdered(progressComparisons, (item) => item.earlierClaimKey)) throw new Error();
    if (claims.some((claim) => claim.disposition === 'admitted') && comparisonContext === null) throw new Error();
    if (comparisonContext === null && progressComparisons.length !== 0) throw new Error();
    if (String(row.outcome) === 'DRY_RUN_NO_NETWORK' && (comparisonContext !== null || claims.length !== 0 || progressComparisons.length !== 0
      || truncation.claims.consideredCount !== 0 || truncation.comparisons.consideredCount !== 0)) throw new Error();
    return { schemaVersion: 'shadow-v2', recordId: String(row.recordId), mode: 'shadow', recordedAt, decisionTime,
      riderExposure: false, boardsExposed: false, outcome: row.outcome as ShadowProgressRecord['outcome'], sources,
      gates: row.gates as Record<string, unknown>[], comparisonContext, truncation, claims, progressComparisons };
  } catch { throw new Error('Invalid prior shadow record'); }
}

function validateClaim(value: unknown, decisionTime: string, recordedAt: string, sources: readonly Record<string, unknown>[]): ShadowProgressClaim {
  const raw = value as Record<string, unknown>; const disposition = raw?.disposition;
  const row = exactRecord(value, ['claimId', 'claimKey', 'sourceId', 'observedAt', 'operationalTrainId', 'serviceDate', 'serviceInstanceId', 'serviceIdentity',
    'routeId', 'direction', 'terminalDestinationStopId', 'nextStopId', 'nextStopCallIdentity', 'targetStopId', 'targetStopCallIdentity',
    'remainingStopCallIdentities', 'decisionTime', 'disposition', ...(disposition === 'suppressed' ? ['suppressionReasonCode'] : ['admissionEvidence']), 'provenance', 'decisions']);
  const strings = ['claimId', 'claimKey', 'sourceId', 'observedAt', 'operationalTrainId', 'routeId', 'terminalDestinationStopId',
    'nextStopId', 'nextStopCallIdentity', 'targetStopId', 'targetStopCallIdentity'] as const;
  if (!strings.every((key) => boundedString(row[key])) || !iso(row.observedAt) || row.decisionTime !== decisionTime
    || !ordered(row.observedAt, decisionTime, recordedAt) || !['northbound', 'southbound'].includes(String(row.direction))
    || !validServiceOwnership(row.serviceDate, row.serviceInstanceId, row.serviceIdentity)
    || !['admitted', 'suppressed'].includes(String(disposition)) || !Array.isArray(row.remainingStopCallIdentities)
    || row.remainingStopCallIdentities.length === 0 || row.remainingStopCallIdentities.length > 64
    || !row.remainingStopCallIdentities.every(validStopCallIdentity) || new Set(row.remainingStopCallIdentities).size !== row.remainingStopCallIdentities.length
    || row.nextStopCallIdentity !== row.remainingStopCallIdentities[0] || row.targetStopCallIdentity !== row.remainingStopCallIdentities.at(-1)
    || stopId(row.nextStopCallIdentity) !== row.nextStopId || stopId(row.targetStopCallIdentity) !== row.targetStopId) throw new Error();
  const identity = canonicalShadowClaimIdentity([String(row.sourceId), String(row.operationalTrainId), row.serviceDate as string | null,
    row.serviceInstanceId as string | null, String(row.targetStopCallIdentity)]);
  if (row.claimKey !== identity.claimKey || row.claimId !== identity.claimId) throw new Error();
  const suppression = row.suppressionReasonCode;
  if (disposition === 'suppressed' && !isSuppressionReason(suppression)) throw new Error();
  const provenance = exactRecord(row.provenance, ['source', 'sourceId', 'feedGroupId', 'observedAt', 'retrievedAt', 'sha256']);
  const owner = sources.find((source) => source.sourceId === row.sourceId && source.outcome === 'accepted');
  if (provenance.source !== 'gtfs-rt' || provenance.sourceId !== row.sourceId || provenance.feedGroupId !== owner?.feedGroupId
    || provenance.observedAt !== row.observedAt || provenance.observedAt !== owner?.observedAt || provenance.retrievedAt !== owner?.retrievedAt
    || provenance.sha256 !== owner?.sha256 || !ordered(provenance.observedAt, provenance.retrievedAt, decisionTime, recordedAt) || !sha(provenance.sha256)) throw new Error();
  const decisions = exactRecord(row.decisions, ['feedHealth', 'serviceChange', 'admission']);
  const feed = exactRecord(decisions.feedHealth, ['kind', 'reasonCode']);
  if (!validFeedPair(feed.kind, feed.reasonCode)) throw new Error();
  const service = exactRecord(decisions.serviceChange, ['kind', 'disposition', 'alertContext']);
  if (!validServiceDecision(String(service.kind), String(service.disposition))) throw new Error();
  validateAlertContext(service.alertContext, sources, decisionTime, recordedAt);
  const alertContext = service.alertContext as Record<string, unknown>;
  if ((alertContext.state === 'failed' || alertContext.snapshotState !== 'current') && service.disposition === 'eligible') throw new Error();
  const admission = exactRecord(decisions.admission, ['kind', 'disposition', 'reasonCode']);
  if (disposition === 'admitted') {
    if (admission.kind !== 'admitted' || admission.disposition !== 'admitted' || admission.reasonCode !== 'GOVERNED_ADMISSION'
      || feed.kind !== 'current' || service.disposition !== 'eligible' || !row.serviceDate || !row.serviceInstanceId) throw new Error();
    validateAdmissionEvidence(row.admissionEvidence, row as unknown as ShadowProgressClaim, decisionTime);
  } else if (admission.kind !== 'rejected' || admission.disposition !== 'suppressed' || admission.reasonCode !== suppression
    || (suppression === 'FEED_NOT_CURRENT') !== (feed.kind !== 'current')
    || (suppression === 'SERVICE_CHANGE_NOT_ELIGIBLE') !== (feed.kind === 'current' && service.disposition !== 'eligible')
    || (!['FEED_NOT_CURRENT', 'SERVICE_CHANGE_NOT_ELIGIBLE'].includes(String(suppression)) && (feed.kind !== 'current' || service.disposition !== 'eligible'))) throw new Error();
  return row as unknown as ShadowProgressClaim;
}

function validateSourceRecord(value: unknown, index: number, recordOutcome: string, decisionTime: string, recordedAt: string): Record<string, unknown> {
  const raw = value as Record<string, unknown>; const accepted = raw?.outcome === 'accepted'; const realtime = index < SOURCE_IDS.length - 1;
  const row = exactRecord(value, accepted ? ['sourceId', 'role', 'outcome', 'reasonCode', ...(realtime ? ['feedGroupId'] : []), 'observedAt', 'retrievedAt', 'sha256']
    : ['sourceId', 'role', 'outcome', 'reasonCode']);
  if (row.sourceId !== SOURCE_IDS[index] || row.role !== (realtime ? 'subway-realtime' : 'subway-alerts')) throw new Error();
  if (recordOutcome === 'DRY_RUN_NO_NETWORK') { if (row.outcome !== 'not-run' || row.reasonCode !== 'DRY_RUN_NO_NETWORK') throw new Error(); }
  else if (accepted) {
    if (row.reasonCode !== 'SOURCE_ACCEPTED' || (realtime && row.feedGroupId !== row.sourceId) || !sha(row.sha256)
      || !ordered(row.observedAt, row.retrievedAt, decisionTime, recordedAt)) throw new Error();
  } else if (row.outcome !== 'failed' || row.reasonCode !== 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED') throw new Error();
  return row;
}

function validateComparisonContext(value: unknown, record: Record<string, unknown>, recordedAt: string): ShadowComparisonContext {
  const row = exactRecord(value, ['earlierRecordId', 'earlierRecordSha256', 'earlierDecisionTime', 'earlierRecordedAt', 'laterRecordId',
    'laterDecisionTime', 'laterRecordedAt', 'intervalMilliseconds', 'maximumIntervalMilliseconds']);
  if (!boundedString(row.earlierRecordId) || !sha(row.earlierRecordSha256) || row.laterRecordId !== record.recordId
    || row.laterDecisionTime !== record.decisionTime || row.laterRecordedAt !== record.recordedAt
    || !ordered(row.earlierDecisionTime, row.earlierRecordedAt, row.laterDecisionTime, row.laterRecordedAt, recordedAt)
    || row.intervalMilliseconds !== Date.parse(String(row.laterDecisionTime)) - Date.parse(String(row.earlierDecisionTime))
    || row.maximumIntervalMilliseconds !== MAX_SHADOW_COMPARISON_INTERVAL_MS) throw new Error();
  return row as unknown as ShadowComparisonContext;
}

function validateComparisonRecord(value: unknown, context: ShadowComparisonContext | null, claims: readonly ShadowProgressClaim[]): ShadowProgressComparison {
  const row = exactRecord(value, ['earlierClaimKey', 'laterClaimKey', 'sourceId', 'operationalTrainId', 'serviceDate', 'serviceInstanceId',
    'targetStopId', 'targetStopCallIdentity', 'earlierObservedAt', 'laterObservedAt', 'earlierDisposition', 'laterDisposition',
    'dispositionTransition', 'result', 'reasonCode']);
  if (!context || !/^claim:[a-f0-9]{64}$/u.test(String(row.earlierClaimKey))
    || !(row.laterClaimKey === null || /^claim:[a-f0-9]{64}$/u.test(String(row.laterClaimKey)))
    || !['sourceId', 'operationalTrainId', 'targetStopId', 'targetStopCallIdentity'].every((key) => boundedString(row[key]))
    || !SOURCE_IDS.slice(0, -1).includes(row.sourceId as never) || !validStopCallIdentity(row.targetStopCallIdentity)
    || !iso(row.earlierObservedAt) || !(row.laterObservedAt === null || iso(row.laterObservedAt))
    || Date.parse(String(row.earlierObservedAt)) > Date.parse(context.earlierDecisionTime)
    || (row.laterObservedAt !== null && Date.parse(String(row.laterObservedAt)) > Date.parse(context.laterDecisionTime))
    || !((row.serviceDate === null && row.serviceInstanceId === null) || (validServiceDate(row.serviceDate) && validServiceInstance(row.serviceInstanceId)))
    || !['admitted', 'suppressed'].includes(String(row.earlierDisposition)) || !['admitted', 'suppressed', null].includes(row.laterDisposition as never)
    || row.dispositionTransition !== `${row.earlierDisposition}-to-${row.laterDisposition ?? 'missing'}`
    || !validComparisonPair(row.result, row.reasonCode)) throw new Error();
  if (row.laterClaimKey !== null) {
    const later = claims.find((claim) => claim.claimKey === row.laterClaimKey);
    if (!later || row.laterObservedAt !== later.observedAt || row.laterDisposition !== later.disposition) throw new Error();
  } else if (row.laterObservedAt !== null || row.laterDisposition !== null) throw new Error();
  return row as unknown as ShadowProgressComparison;
}

function validateAlertContext(value: unknown, sources: readonly Record<string, unknown>[], decisionTime: string, recordedAt: string): void {
  const raw = value as Record<string, unknown>;
  if (raw?.state === 'accepted') {
    const row = exactRecord(value, ['state', 'sourceId', 'observedAt', 'retrievedAt', 'sha256', 'snapshotState', 'alertContextIdentity']);
    const owner = sources.at(-1)!;
    if (row.sourceId !== 'subway-alerts' || owner.outcome !== 'accepted' || row.observedAt !== owner.observedAt
      || row.retrievedAt !== owner.retrievedAt || row.sha256 !== owner.sha256
      || row.alertContextIdentity !== canonicalShadowAlertContextIdentity({ sourceId: String(row.sourceId), observedAt: String(row.observedAt), retrievedAt: String(row.retrievedAt), sha256: String(row.sha256) })
      || row.snapshotState !== (Date.parse(decisionTime) - Date.parse(String(row.observedAt)) <= CURRENT_ALERT_MAX_AGE_MS ? 'current' : 'stale')
      || !ordered(row.observedAt, row.retrievedAt, decisionTime, recordedAt)) throw new Error();
  } else {
    const row = exactRecord(value, ['state', 'sourceId', 'reasonCode']); const owner = sources.at(-1)!;
    if (row.state !== 'failed' || row.sourceId !== 'subway-alerts' || row.reasonCode !== 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED'
      || owner.outcome !== 'failed') throw new Error();
  }
}

function validateTruncation(value: unknown, claims: number, comparisons: number): ShadowTruncation {
  const row = exactRecord(value, ['claims', 'comparisons']);
  const claimDetail = detail(row.claims, claims); const comparisonDetail = detail(row.comparisons, comparisons);
  return { claims: claimDetail, comparisons: comparisonDetail };
}
function detail(value: unknown, included: number): TruncationDetail {
  const row = exactRecord(value, ['consideredCount', 'includedCount', 'omittedCount', 'reasonCode']);
  if (![row.consideredCount, row.includedCount, row.omittedCount].every((item) => Number.isSafeInteger(item) && Number(item) >= 0)
    || row.includedCount !== included || Number(row.consideredCount) !== Number(row.includedCount) + Number(row.omittedCount)
    || row.reasonCode !== (Number(row.omittedCount) === 0 ? 'NOT_TRUNCATED' : 'BYTE_BUDGET_EXHAUSTED')) throw new Error();
  return row as unknown as TruncationDetail;
}

function composed(input: Omit<ShadowProgressRecord, 'truncation'> & { readonly truncation?: ShadowTruncation }, claims: ShadowProgressClaim[], comparisons: ShadowProgressComparison[]): ShadowProgressRecord {
  const truncation = { claims: truncationDetail(input.claims.length, claims.length), comparisons: truncationDetail(input.progressComparisons.length, comparisons.length) };
  return { ...input, truncation, claims, progressComparisons: comparisons } as ShadowProgressRecord;
}
function truncationDetail(consideredCount: number, includedCount: number): TruncationDetail {
  const omittedCount = consideredCount - includedCount;
  return { consideredCount, includedCount, omittedCount, reasonCode: omittedCount === 0 ? 'NOT_TRUNCATED' : 'BYTE_BUDGET_EXHAUSTED' };
}
function deterministicPrefix<T>(rows: readonly T[], key: (row: T) => string, budget: number): T[] {
  const orderedRows = [...rows].sort((a, b) => key(a).localeCompare(key(b))); const result: T[] = []; let used = 2;
  for (const row of orderedRows.slice(0, 500)) { const bytes = Buffer.byteLength(JSON.stringify(row), 'utf8') + (result.length ? 1 : 0); if (used + bytes > budget) break; result.push(row); used += bytes; }
  return result;
}
function comparisonBase(candidate: ShadowProgressClaim, next: ShadowProgressClaim | null) {
  return { earlierClaimKey: candidate.claimKey, laterClaimKey: next?.claimKey ?? null, sourceId: candidate.sourceId,
    operationalTrainId: candidate.operationalTrainId, serviceDate: candidate.serviceDate, serviceInstanceId: candidate.serviceInstanceId,
    targetStopId: candidate.targetStopId, targetStopCallIdentity: candidate.targetStopCallIdentity, earlierObservedAt: candidate.observedAt,
    laterObservedAt: next?.observedAt ?? null, earlierDisposition: candidate.disposition, laterDisposition: next?.disposition ?? null,
    dispositionTransition: `${candidate.disposition}-to-${next?.disposition ?? 'missing'}` as ShadowProgressComparison['dispositionTransition'] };
}
function inconclusive(base: ReturnType<typeof comparisonBase>, reasonCode: ShadowComparisonReason): ShadowProgressComparison {
  return { ...base, result: 'inconclusive', reasonCode };
}
function validateOutcome(sources: readonly Record<string, unknown>[], outcome: string): void {
  const accepted = sources.filter((source) => source.outcome === 'accepted').length; const failed = sources.filter((source) => source.outcome === 'failed').length;
  if ((outcome === 'DRY_RUN_NO_NETWORK' && (accepted || failed)) || (outcome === 'COMPLETED' && accepted !== SOURCE_IDS.length)
    || (outcome === 'COMPLETED_WITH_SOURCE_FAILURES' && failed === 0)) throw new Error();
}
function validateGateRecord(value: unknown, index: number): void {
  const row = exactRecord(value, ['stage', 'exposed', 'reasonCode', 'decision']); const expected = Object.entries(evaluateExposure({ mode: 'shadow' }).public)[index];
  if (!expected || row.stage !== expected[0] || row.exposed !== expected[1].exposed || row.reasonCode !== expected[1].reasonCode || row.decision !== expected[1].decision) throw new Error();
}
function assertUniqueClaims(claims: readonly ShadowProgressClaim[]): void { const ids = new Set<string>(); const keys = new Set<string>(); for (const claim of claims) { if (ids.has(claim.claimId) || keys.has(claim.claimKey)) throw new Error('Duplicate shadow claim identity'); ids.add(claim.claimId); keys.add(claim.claimKey); } }
function assertUniqueComparisons(rows: readonly ShadowProgressComparison[]): void { const keys = new Set<string>(); for (const row of rows) { if (keys.has(row.earlierClaimKey)) throw new Error('Duplicate shadow comparison identity'); keys.add(row.earlierClaimKey); } }
function groupByTrain(claims: readonly ShadowProgressClaim[]): Map<string, ShadowProgressClaim[]> { const result = new Map<string, ShadowProgressClaim[]>(); for (const claim of claims) result.set(trainKey(claim), [...(result.get(trainKey(claim)) ?? []), claim]); return result; }
function trainKey(claim: ShadowProgressClaim): string { return JSON.stringify([claim.sourceId, claim.operationalTrainId]); }
function physicalTargetKey(claim: ShadowProgressClaim): string { return JSON.stringify([claim.sourceId, claim.operationalTrainId, claim.targetStopCallIdentity]); }
function stopId(identity: unknown): string | undefined { return typeof identity === 'string' && identity.includes('\0') ? identity.slice(0, identity.indexOf('\0')) : undefined; }
function validStopCallIdentity(value: unknown): value is string { if (!boundedString(value)) return false; const parts = value.split('\0'); if (parts.length !== 2 || !parts[0] || /[\p{C}]/u.test(parts[0])) return false; const sequence = /^sequence:([1-9]\d*)$/u.exec(parts[1]); return sequence ? Number.isSafeInteger(Number(sequence[1])) : /^occurrence:[^\p{C}]+$/u.test(parts[1]); }
function isSuppressionReason(value: unknown): value is ShadowSuppressionReason { return ['TRUSTED_HISTORY_UNAVAILABLE', 'STALE_MOVEMENT_EVIDENCE', 'MOVEMENT_EVIDENCE_UNAVAILABLE', 'FEED_NOT_CURRENT', 'SERVICE_CHANGE_NOT_ELIGIBLE', 'TRACK_EVIDENCE_NOT_ELIGIBLE', 'SERVICE_OWNERSHIP_UNAVAILABLE'].includes(String(value)); }
function validFeedPair(kind: unknown, reason: unknown): boolean { return (kind === 'current' && reason === 'accepted-current') || (kind === 'degraded' && reason === 'snapshot-age-degraded') || (kind === 'unavailable' && reason === 'snapshot-age-unavailable'); }
function validServiceDecision(kind: string, disposition: string): boolean { return (kind === 'eligible-context' && disposition === 'eligible') || (kind === 'resolved-suppression' && disposition === 'resolved-ineligible') || (kind === 'arrival-claim-unavailable' && disposition === 'high-impact-unresolved') || (kind === 'quarantine-or-limitation' && disposition === 'quarantined'); }
function validComparisonPair(result: unknown, reason: unknown): boolean { const reasons = ['NEXT_STOP_ADVANCED', 'NEXT_STOP_UNCHANGED', 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT', 'LATER_OBSERVATION_NOT_LATER', 'TARGET_NOT_IN_LATER_PATH', 'PATH_CHANGED_OR_REROUTED', 'COMPARISON_INTERVAL_EXCEEDED', 'SERVICE_OWNERSHIP_UNAVAILABLE', 'SERVICE_INSTANCE_CHANGED', 'CURRENT_CLAIMS_TRUNCATED']; return reasons.includes(String(reason)) && (result === 'progressed') === (reason === 'NEXT_STOP_ADVANCED') && (result === 'not-observed') === (reason === 'NEXT_STOP_UNCHANGED'); }
function validServiceOwnership(serviceDate: unknown, serviceInstanceId: unknown, value: unknown): boolean {
  if (serviceDate === null || serviceInstanceId === null || value === null) return serviceDate === null && serviceInstanceId === null && value === null;
  if (!validServiceDate(serviceDate) || !validServiceInstance(serviceInstanceId)) return false;
  try {
    const row = exactRecord(value, ['tripId', 'startDate', 'startTime', 'trainIdentity']);
    if (![row.tripId, row.startDate, row.startTime, row.trainIdentity].every(boundedString) || row.startDate !== serviceDate
      || !/^\d{2}:\d{2}:\d{2}$/u.test(String(row.startTime))) return false;
    return canonicalShadowServiceInstance(row as unknown as ShadowServiceIdentity) === serviceInstanceId;
  } catch { return false; }
}
function validateAdmissionEvidence(value: unknown, claim: ShadowProgressClaim, decisionTime: string): void {
  const row = exactRecord(value, ['earlierRecordId', 'priorClaimKey', 'priorObservedAt', 'priorRemainingStopCallIdentities',
    'movementTimestamp', 'movementStatus', 'movementEvidenceIdentity', 'targetEventAt', 'targetStopCallIdentity',
    'targetEvidenceIdentity', 'scheduledTrack', 'actualTrack', 'trackEvidenceIdentity', 'serviceClaimId', 'serviceClaimBindingDigest', 'serviceAssessmentAt',
    'serviceAlertContextIdentity', 'issuedAlertContextDigest', 'serviceDecisionDigest', 'admittedStopCallIdentity']);
  if (!boundedString(row.earlierRecordId) || !/^claim:[a-f0-9]{64}$/u.test(String(row.priorClaimKey)) || !iso(row.priorObservedAt)
    || !Array.isArray(row.priorRemainingStopCallIdentities) || row.priorRemainingStopCallIdentities.length === 0
    || row.priorRemainingStopCallIdentities.length > 64 || !row.priorRemainingStopCallIdentities.every(validStopCallIdentity)
    || !iso(row.movementTimestamp) || !['INCOMING_AT', 'STOPPED_AT', 'IN_TRANSIT_TO'].includes(String(row.movementStatus))
    || row.movementEvidenceIdentity !== canonicalMovementEvidenceIdentity({ sourceId: claim.sourceId,
      trainIdentity: claim.operationalTrainId, movementTimestamp: String(row.movementTimestamp), movementStatus: String(row.movementStatus),
      stopCallIdentity: claim.nextStopCallIdentity })
    || !iso(row.targetEventAt) || Date.parse(String(row.targetEventAt)) <= Date.parse(decisionTime)
    || row.targetStopCallIdentity !== claim.targetStopCallIdentity || row.admittedStopCallIdentity !== claim.targetStopCallIdentity
    || row.targetEvidenceIdentity !== canonicalTargetEvidenceIdentity({ sourceId: claim.sourceId,
      trainIdentity: claim.operationalTrainId, targetStopCallIdentity: claim.targetStopCallIdentity,
      targetEventAt: String(row.targetEventAt) })
    || !boundedString(row.scheduledTrack) || row.actualTrack !== row.scheduledTrack
    || row.trackEvidenceIdentity !== canonicalTrackEvidenceIdentity({ sourceId: claim.sourceId,
      trainIdentity: claim.operationalTrainId, targetStopCallIdentity: claim.targetStopCallIdentity,
      scheduledTrack: String(row.scheduledTrack), actualTrack: String(row.actualTrack) }) || row.serviceClaimId !== claim.claimId
    || row.serviceClaimBindingDigest !== canonicalServiceClaimBindingDigest(claim) || row.serviceAssessmentAt !== decisionTime
    || row.serviceAlertContextIdentity !== (claim.decisions.serviceChange.alertContext as Extract<AlertContext, { state: 'accepted' }>).alertContextIdentity
    || row.issuedAlertContextDigest !== canonicalIssuedAlertContextDigest(row as unknown as ShadowAdmissionEvidence)
    || row.serviceDecisionDigest !== canonicalServiceDecisionDigest(row as unknown as ShadowAdmissionEvidence)) throw new Error();
}
function validServiceDate(value: unknown): value is string { if (typeof value !== 'string' || !/^\d{8}$/u.test(value)) return false; const year = Number(value.slice(0, 4)); const month = Number(value.slice(4, 6)); const day = Number(value.slice(6, 8)); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; }
function validServiceInstance(value: unknown): value is string { return typeof value === 'string' && /^service:[a-f0-9]{64}$/u.test(value); }
function boundedString(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 256; }
function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); const row = value as Record<string, unknown>; if (keys.some((key) => !Object.hasOwn(row, key)) || Object.keys(row).some((key) => !keys.includes(key))) throw new Error(); return row; }
function iso(value: unknown): value is string { return typeof value === 'string' && new Date(value).toISOString() === value; }
function sha(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value); }
function ordered(...values: unknown[]): boolean { return values.every(iso) && values.every((value, index) => index === 0 || Date.parse(String(values[index - 1])) <= Date.parse(String(value))); }
function byteLength(value: unknown): number { return Buffer.byteLength(JSON.stringify(value), 'utf8'); }
function sameStrings(left: readonly string[], right: readonly string[]): boolean { return left.length === right.length && left.every((value, index) => value === right[index]); }
function sameJson(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function canonicallyOrdered<T>(rows: readonly T[], key: (row: T) => string): boolean { return rows.every((row, index) => index === 0 || key(rows[index - 1]).localeCompare(key(row)) < 0); }
function digestTuple(values: readonly (string | null)[]): string { return createHash('sha256').update(encodeCanonicalStringTuple(values)).digest('hex'); }
