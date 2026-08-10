import { encodeCanonicalStringTuple } from '../../shared/domain/canonical';
import { evaluateExposure } from '../release/exposure-gates';
import { MAX_SHADOW_RECORD_BYTES } from './shadow-record';

export type ShadowDisposition = 'admitted' | 'suppressed';
export type ShadowSuppressionReason =
  | 'TRUSTED_HISTORY_UNAVAILABLE'
  | 'STALE_MOVEMENT_EVIDENCE'
  | 'MOVEMENT_EVIDENCE_UNAVAILABLE'
  | 'FEED_NOT_CURRENT'
  | 'SERVICE_CHANGE_NOT_ELIGIBLE'
  | 'TRACK_EVIDENCE_NOT_ELIGIBLE';

export interface ShadowProgressClaim {
  readonly claimId: string;
  readonly claimKey: string;
  readonly sourceId: string;
  readonly observedAt: string;
  readonly operationalTrainId: string;
  readonly routeId: string;
  readonly direction: 'northbound' | 'southbound';
  readonly terminalDestinationStopId: string;
  readonly nextStopId: string;
  readonly nextStopCallIdentity: string;
  readonly targetStopId: string;
  readonly targetStopCallIdentity: string;
  readonly remainingStopCallIdentities: readonly string[];
  readonly decisionTime: string;
  readonly disposition: ShadowDisposition;
  readonly suppressionReasonCode?: ShadowSuppressionReason;
  readonly provenance: {
    readonly source: 'gtfs-rt';
    readonly sourceId: string;
    readonly feedGroupId: string;
    readonly observedAt: string;
    readonly retrievedAt: string;
    readonly sha256: string;
  };
  readonly decisions: {
    readonly feedHealth: { readonly kind: 'current' | 'degraded' | 'unavailable'; readonly reasonCode: string };
    readonly serviceChange: {
      readonly kind: 'eligible-context' | 'resolved-suppression' | 'arrival-claim-unavailable' | 'quarantine-or-limitation';
      readonly disposition: 'eligible' | 'resolved-ineligible' | 'high-impact-unresolved' | 'quarantined';
    };
    readonly admission: {
      readonly kind: 'admitted' | 'rejected';
      readonly disposition: ShadowDisposition;
      readonly reasonCode: 'GOVERNED_ADMISSION' | ShadowSuppressionReason;
    };
  };
}

export interface ShadowProgressComparison {
  readonly sourceId: string;
  readonly operationalTrainId: string;
  readonly targetStopId: string;
  readonly targetStopCallIdentity: string;
  readonly earlierDisposition: ShadowDisposition;
  readonly laterDisposition: ShadowDisposition | null;
  readonly dispositionTransition: 'admitted-to-admitted' | 'admitted-to-suppressed' | 'admitted-to-missing'
    | 'suppressed-to-admitted' | 'suppressed-to-suppressed' | 'suppressed-to-missing';
  readonly result: 'progressed' | 'not-observed' | 'inconclusive';
  readonly reasonCode: 'NEXT_STOP_ADVANCED' | 'NEXT_STOP_UNCHANGED' | 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT'
    | 'LATER_OBSERVATION_NOT_LATER' | 'TARGET_NOT_IN_LATER_PATH' | 'PATH_CHANGED_OR_REROUTED';
}

export interface ShadowProgressRecord {
  readonly schemaVersion: 'shadow-v2';
  readonly recordId: string;
  readonly mode: 'shadow';
  readonly recordedAt: string;
  readonly decisionTime: string;
  readonly riderExposure: false;
  readonly boardsExposed: false;
  readonly outcome: 'DRY_RUN_NO_NETWORK' | 'COMPLETED' | 'COMPLETED_WITH_SOURCE_FAILURES';
  readonly sources: readonly Record<string, unknown>[];
  readonly gates: readonly Record<string, unknown>[];
  readonly claims: readonly ShadowProgressClaim[];
  readonly progressComparisons: readonly ShadowProgressComparison[];
}

const SOURCE_IDS = [
  'subway-rt-1234567s', 'subway-rt-ace', 'subway-rt-bdfm', 'subway-rt-g',
  'subway-rt-jz', 'subway-rt-l', 'subway-rt-nqrw', 'subway-alerts',
] as const;

export function compareShadowProgress(
  earlier: ShadowProgressRecord,
  later: ShadowProgressRecord,
): readonly ShadowProgressComparison[] {
  if (earlier.recordId === later.recordId) throw new Error('Shadow record identities must be distinct');
  assertUniqueClaims(earlier.claims);
  assertUniqueClaims(later.claims);
  const laterByClaim = new Map(later.claims.map((candidate) => [candidate.claimKey, candidate]));
  const laterByTrain = groupByTrain(later.claims);
  return earlier.claims.map((candidate): ShadowProgressComparison => {
    const next = laterByClaim.get(candidate.claimKey);
    const trainCandidates = laterByTrain.get(trainKey(candidate)) ?? [];
    const laterDisposition = next?.disposition ?? null;
    const base = {
      sourceId: candidate.sourceId,
      operationalTrainId: candidate.operationalTrainId,
      targetStopId: candidate.targetStopId,
      targetStopCallIdentity: candidate.targetStopCallIdentity,
      earlierDisposition: candidate.disposition,
      laterDisposition,
      dispositionTransition: `${candidate.disposition}-to-${laterDisposition ?? 'missing'}` as ShadowProgressComparison['dispositionTransition'],
    };
    if (!next) {
      const targetRemains = trainCandidates.some((row) => row.remainingStopCallIdentities.includes(candidate.targetStopCallIdentity));
      return trainCandidates.length === 0
        ? { ...base, result: 'inconclusive', reasonCode: 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT' }
        : { ...base, result: 'inconclusive', reasonCode: targetRemains ? 'PATH_CHANGED_OR_REROUTED' : 'TARGET_NOT_IN_LATER_PATH' };
    }
    if (Date.parse(next.observedAt) <= Date.parse(candidate.observedAt)) {
      return { ...base, result: 'inconclusive', reasonCode: 'LATER_OBSERVATION_NOT_LATER' };
    }
    if (next.nextStopCallIdentity === candidate.nextStopCallIdentity) {
      return { ...base, result: 'not-observed', reasonCode: 'NEXT_STOP_UNCHANGED' };
    }
    const laterIndex = candidate.remainingStopCallIdentities.indexOf(next.nextStopCallIdentity);
    if (laterIndex <= 0 || next.routeId !== candidate.routeId || next.direction !== candidate.direction) {
      return { ...base, result: 'inconclusive', reasonCode: 'PATH_CHANGED_OR_REROUTED' };
    }
    if (!next.remainingStopCallIdentities.includes(candidate.targetStopCallIdentity)) {
      return { ...base, result: 'inconclusive', reasonCode: 'TARGET_NOT_IN_LATER_PATH' };
    }
    const expectedPath = candidate.remainingStopCallIdentities.slice(laterIndex);
    if (!sameStrings(expectedPath, next.remainingStopCallIdentities)) {
      return { ...base, result: 'inconclusive', reasonCode: 'PATH_CHANGED_OR_REROUTED' };
    }
    return { ...base, result: 'progressed', reasonCode: 'NEXT_STOP_ADVANCED' };
  });
}

export function parseShadowProgressRecord(value: unknown): ShadowProgressRecord {
  try {
    const encoded = JSON.stringify(value);
    if (Buffer.byteLength(encoded, 'utf8') > MAX_SHADOW_RECORD_BYTES) throw new Error();
    const row = exactRecord(value, [
      'schemaVersion', 'recordId', 'mode', 'recordedAt', 'decisionTime', 'riderExposure', 'boardsExposed',
      'outcome', 'sources', 'gates', 'claims', 'progressComparisons',
    ]);
    if (row.schemaVersion !== 'shadow-v2' || row.mode !== 'shadow' || row.riderExposure !== false || row.boardsExposed !== false
      || !boundedString(row.recordId) || !String(row.recordId).startsWith('shadow-') || !iso(row.recordedAt) || !iso(row.decisionTime)
      || Date.parse(String(row.decisionTime)) > Date.parse(String(row.recordedAt))
      || !['DRY_RUN_NO_NETWORK', 'COMPLETED', 'COMPLETED_WITH_SOURCE_FAILURES'].includes(String(row.outcome))
      || !Array.isArray(row.sources) || row.sources.length !== SOURCE_IDS.length
      || !Array.isArray(row.gates) || row.gates.length !== 9
      || !Array.isArray(row.claims) || row.claims.length > 500
      || !Array.isArray(row.progressComparisons) || row.progressComparisons.length > 500) throw new Error();
    const sources = row.sources.map((source, index) => validateSourceRecord(source, index, String(row.outcome)));
    validateOutcome(sources, String(row.outcome));
    row.gates.forEach(validateGateRecord);
    const claims = row.claims.map((claim) => validateClaim(claim, String(row.decisionTime), sources));
    assertUniqueClaims(claims);
    const progressComparisons = row.progressComparisons.map(validateComparisonRecord);
    assertUniqueComparisons(progressComparisons);
    return {
      schemaVersion: 'shadow-v2', recordId: String(row.recordId), mode: 'shadow', recordedAt: String(row.recordedAt),
      decisionTime: String(row.decisionTime), riderExposure: false, boardsExposed: false,
      outcome: row.outcome as ShadowProgressRecord['outcome'], sources, gates: row.gates as Record<string, unknown>[],
      claims, progressComparisons,
    };
  } catch {
    throw new Error('Invalid prior shadow record');
  }
}

function validateClaim(value: unknown, decisionTime: string, sources: readonly Record<string, unknown>[]): ShadowProgressClaim {
  const raw = value as Record<string, unknown>;
  const disposition = raw?.disposition;
  const row = exactRecord(value, [
    'claimId', 'claimKey', 'sourceId', 'observedAt', 'operationalTrainId', 'routeId', 'direction',
    'terminalDestinationStopId', 'nextStopId', 'nextStopCallIdentity', 'targetStopId', 'targetStopCallIdentity',
    'remainingStopCallIdentities', 'decisionTime', 'disposition', ...(disposition === 'suppressed' ? ['suppressionReasonCode'] : []),
    'provenance', 'decisions',
  ]);
  const strings = ['claimId', 'claimKey', 'sourceId', 'observedAt', 'operationalTrainId', 'routeId', 'terminalDestinationStopId',
    'nextStopId', 'nextStopCallIdentity', 'targetStopId', 'targetStopCallIdentity'] as const;
  if (!strings.every((key) => boundedString(row[key])) || !iso(row.observedAt) || row.decisionTime !== decisionTime
    || Date.parse(String(row.observedAt)) > Date.parse(decisionTime) || !['northbound', 'southbound'].includes(String(row.direction))
    || (disposition !== 'admitted' && disposition !== 'suppressed')
    || !Array.isArray(row.remainingStopCallIdentities) || row.remainingStopCallIdentities.length === 0
    || row.remainingStopCallIdentities.length > 64 || !row.remainingStopCallIdentities.every(validStopCallIdentity)
    || new Set(row.remainingStopCallIdentities).size !== row.remainingStopCallIdentities.length
    || row.nextStopCallIdentity !== row.remainingStopCallIdentities[0]
    || row.targetStopCallIdentity !== row.remainingStopCallIdentities.at(-1)
    || !validStopCallIdentity(row.nextStopCallIdentity) || !validStopCallIdentity(row.targetStopCallIdentity)
    || stopId(row.nextStopCallIdentity) !== row.nextStopId || stopId(row.targetStopCallIdentity) !== row.targetStopId) throw new Error();
  const canonicalKey = encodeCanonicalStringTuple([String(row.sourceId), String(row.operationalTrainId), String(row.targetStopCallIdentity)]);
  if (row.claimKey !== canonicalKey) throw new Error();
  const suppression = row.suppressionReasonCode;
  if (disposition === 'suppressed' && !isSuppressionReason(suppression)) throw new Error();

  const provenance = exactRecord(row.provenance, ['source', 'sourceId', 'feedGroupId', 'observedAt', 'retrievedAt', 'sha256']);
  const owner = sources.find((source) => source.sourceId === row.sourceId && source.outcome === 'accepted');
  if (provenance.source !== 'gtfs-rt' || provenance.sourceId !== row.sourceId || provenance.feedGroupId !== owner?.feedGroupId
    || provenance.observedAt !== row.observedAt || provenance.observedAt !== owner?.observedAt
    || provenance.retrievedAt !== owner?.retrievedAt || provenance.sha256 !== owner?.sha256
    || !iso(provenance.observedAt) || !iso(provenance.retrievedAt) || !sha(provenance.sha256)) throw new Error();

  const decisions = exactRecord(row.decisions, ['feedHealth', 'serviceChange', 'admission']);
  const feedHealth = exactRecord(decisions.feedHealth, ['kind', 'reasonCode']);
  const serviceChange = exactRecord(decisions.serviceChange, ['kind', 'disposition']);
  const admission = exactRecord(decisions.admission, ['kind', 'disposition', 'reasonCode']);
  if (!['current', 'degraded', 'unavailable'].includes(String(feedHealth.kind)) || !boundedString(feedHealth.reasonCode)
    || !['eligible-context', 'resolved-suppression', 'arrival-claim-unavailable', 'quarantine-or-limitation'].includes(String(serviceChange.kind))
    || !['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(String(serviceChange.disposition))
    || !validServiceDecision(String(serviceChange.kind), String(serviceChange.disposition))) throw new Error();
  if (disposition === 'admitted') {
    if (admission.kind !== 'admitted' || admission.disposition !== 'admitted' || admission.reasonCode !== 'GOVERNED_ADMISSION'
      || feedHealth.kind !== 'current' || serviceChange.disposition !== 'eligible') throw new Error();
  } else if (admission.kind !== 'rejected' || admission.disposition !== 'suppressed' || admission.reasonCode !== suppression
    || (suppression === 'FEED_NOT_CURRENT') !== (feedHealth.kind !== 'current')
    || (suppression === 'SERVICE_CHANGE_NOT_ELIGIBLE') !== (feedHealth.kind === 'current' && serviceChange.disposition !== 'eligible')
    || (!['FEED_NOT_CURRENT', 'SERVICE_CHANGE_NOT_ELIGIBLE'].includes(String(suppression))
      && (feedHealth.kind !== 'current' || serviceChange.disposition !== 'eligible'))) throw new Error();
  return row as unknown as ShadowProgressClaim;
}

function validateSourceRecord(value: unknown, index: number, recordOutcome: string): Record<string, unknown> {
  const raw = value as Record<string, unknown>;
  const outcome = raw?.outcome;
  const accepted = outcome === 'accepted';
  const realtime = index < SOURCE_IDS.length - 1;
  const keys = accepted
    ? ['sourceId', 'role', 'outcome', 'reasonCode', ...(realtime ? ['feedGroupId'] : []), 'observedAt', 'retrievedAt', 'sha256']
    : ['sourceId', 'role', 'outcome', 'reasonCode'];
  const row = exactRecord(value, keys);
  if (row.sourceId !== SOURCE_IDS[index] || row.role !== (realtime ? 'subway-realtime' : 'subway-alerts')) throw new Error();
  if (recordOutcome === 'DRY_RUN_NO_NETWORK') {
    if (outcome !== 'not-run' || row.reasonCode !== 'DRY_RUN_NO_NETWORK') throw new Error();
  } else if (accepted) {
    if (row.reasonCode !== 'SOURCE_ACCEPTED' || (realtime && row.feedGroupId !== row.sourceId)
      || !iso(row.observedAt) || !iso(row.retrievedAt) || !sha(row.sha256)) throw new Error();
  } else if (outcome !== 'failed' || row.reasonCode !== 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED') throw new Error();
  return row;
}

function validateOutcome(sources: readonly Record<string, unknown>[], outcome: string): void {
  const accepted = sources.filter((source) => source.outcome === 'accepted').length;
  const failed = sources.filter((source) => source.outcome === 'failed').length;
  if ((outcome === 'DRY_RUN_NO_NETWORK' && (accepted !== 0 || failed !== 0))
    || (outcome === 'COMPLETED' && accepted !== SOURCE_IDS.length)
    || (outcome === 'COMPLETED_WITH_SOURCE_FAILURES' && failed === 0)) throw new Error();
}

function validateGateRecord(value: unknown, index: number): void {
  const row = exactRecord(value, ['stage', 'exposed', 'reasonCode', 'decision']);
  const expected = Object.entries(evaluateExposure({ mode: 'shadow' }).public)[index];
  if (!expected || row.stage !== expected[0] || row.exposed !== expected[1].exposed
    || row.reasonCode !== expected[1].reasonCode || row.decision !== expected[1].decision) throw new Error();
}

function validateComparisonRecord(value: unknown): ShadowProgressComparison {
  const row = exactRecord(value, [
    'sourceId', 'operationalTrainId', 'targetStopId', 'targetStopCallIdentity', 'earlierDisposition', 'laterDisposition',
    'dispositionTransition', 'result', 'reasonCode',
  ]);
  if (!['sourceId', 'operationalTrainId', 'targetStopId', 'targetStopCallIdentity'].every((key) => boundedString(row[key]))
    || !SOURCE_IDS.slice(0, -1).includes(row.sourceId as never) || !validStopCallIdentity(row.targetStopCallIdentity)
    || stopId(row.targetStopCallIdentity) !== row.targetStopId
    || !['admitted', 'suppressed'].includes(String(row.earlierDisposition))
    || !['admitted', 'suppressed', null].includes(row.laterDisposition as never)
    || row.dispositionTransition !== `${row.earlierDisposition}-to-${row.laterDisposition ?? 'missing'}`
    || !['progressed', 'not-observed', 'inconclusive'].includes(String(row.result))
    || !['NEXT_STOP_ADVANCED', 'NEXT_STOP_UNCHANGED', 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT', 'LATER_OBSERVATION_NOT_LATER',
      'TARGET_NOT_IN_LATER_PATH', 'PATH_CHANGED_OR_REROUTED'].includes(String(row.reasonCode))
    || (row.result === 'progressed') !== (row.reasonCode === 'NEXT_STOP_ADVANCED')
    || (row.result === 'not-observed') !== (row.reasonCode === 'NEXT_STOP_UNCHANGED')) throw new Error();
  return row as unknown as ShadowProgressComparison;
}

function assertUniqueClaims(claims: readonly ShadowProgressClaim[]): void {
  const ids = new Set<string>();
  const keys = new Set<string>();
  for (const claim of claims) {
    if (ids.has(claim.claimId) || keys.has(claim.claimKey)) throw new Error('Duplicate shadow claim identity');
    ids.add(claim.claimId);
    keys.add(claim.claimKey);
  }
}

function assertUniqueComparisons(comparisons: readonly ShadowProgressComparison[]): void {
  const keys = new Set<string>();
  for (const comparison of comparisons) {
    const key = encodeCanonicalStringTuple([comparison.sourceId, comparison.operationalTrainId, comparison.targetStopCallIdentity]);
    if (keys.has(key)) throw new Error('Duplicate shadow comparison identity');
    keys.add(key);
  }
}

function groupByTrain(claims: readonly ShadowProgressClaim[]): Map<string, ShadowProgressClaim[]> {
  const result = new Map<string, ShadowProgressClaim[]>();
  for (const claim of claims) result.set(trainKey(claim), [...(result.get(trainKey(claim)) ?? []), claim]);
  return result;
}

function trainKey(claim: ShadowProgressClaim): string {
  return encodeCanonicalStringTuple([claim.sourceId, claim.operationalTrainId]);
}

function stopId(identity: unknown): string | undefined {
  return typeof identity === 'string' && identity.includes('\0') ? identity.slice(0, identity.indexOf('\0')) : undefined;
}

function validStopCallIdentity(value: unknown): value is string {
  if (!boundedString(value)) return false;
  const parts = value.split('\0');
  if (parts.length !== 2 || !parts[0] || /[\p{C}]/u.test(parts[0])) return false;
  const sequence = /^sequence:([1-9]\d*)$/u.exec(parts[1]);
  if (sequence) return Number.isSafeInteger(Number(sequence[1]));
  return /^occurrence:[^\p{C}]+$/u.test(parts[1]);
}

function isSuppressionReason(value: unknown): value is ShadowSuppressionReason {
  return ['TRUSTED_HISTORY_UNAVAILABLE', 'STALE_MOVEMENT_EVIDENCE', 'MOVEMENT_EVIDENCE_UNAVAILABLE', 'FEED_NOT_CURRENT',
    'SERVICE_CHANGE_NOT_ELIGIBLE', 'TRACK_EVIDENCE_NOT_ELIGIBLE'].includes(String(value));
}

function validServiceDecision(kind: string, disposition: string): boolean {
  return (kind === 'eligible-context' && disposition === 'eligible')
    || (kind === 'resolved-suppression' && disposition === 'resolved-ineligible')
    || (kind === 'arrival-claim-unavailable' && disposition === 'high-impact-unresolved')
    || (kind === 'quarantine-or-limitation' && disposition === 'quarantined');
}

function boundedString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256;
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
  const row = value as Record<string, unknown>;
  if (keys.some((key) => !Object.hasOwn(row, key)) || Object.keys(row).some((key) => !keys.includes(key))) throw new Error();
  return row;
}

function iso(value: unknown): value is string {
  return typeof value === 'string' && new Date(value).toISOString() === value;
}

function sha(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
