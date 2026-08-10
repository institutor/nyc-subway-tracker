export interface ShadowProgressCandidate {
  readonly sourceId: string;
  readonly observedAt: string;
  readonly operationalTrainId: string;
  readonly routeId: string | null;
  readonly nextStopId: string;
  readonly targetStopId: string;
  readonly targetStopCallIdentity?: string;
  readonly remainingStopCount: number;
  readonly remainingStopIds: readonly string[];
}

export interface ShadowProgressComparison {
  readonly sourceId: string;
  readonly operationalTrainId: string;
  readonly targetStopId: string;
  readonly result: 'progressed' | 'not-observed' | 'inconclusive';
  readonly reasonCode:
    | 'NEXT_STOP_ADVANCED'
    | 'NEXT_STOP_UNCHANGED'
    | 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT'
    | 'LATER_OBSERVATION_NOT_LATER'
    | 'LATER_STOP_NOT_DEMONSTRATED'
    | 'CLAIM_TARGET_CHANGED'
    | 'TARGET_NOT_IN_LATER_PATH'
    | 'PATH_CHANGED_OR_REROUTED';
}

export function compareShadowProgress(
  earlier: readonly ShadowProgressCandidate[],
  later: readonly ShadowProgressCandidate[],
): readonly ShadowProgressComparison[] {
  const laterByClaim = new Map(later.map((candidate) => [candidateKey(candidate), candidate]));
  const laterByTrain = new Map<string, ShadowProgressCandidate[]>();
  for (const candidate of later) {
    const values = laterByTrain.get(trainKey(candidate)) ?? [];
    values.push(candidate);
    laterByTrain.set(trainKey(candidate), values);
  }
  return earlier.map((candidate): ShadowProgressComparison => {
    const next = laterByClaim.get(candidateKey(candidate));
    const trainCandidates = laterByTrain.get(trainKey(candidate)) ?? [];
    const base = {
      sourceId: candidate.sourceId,
      operationalTrainId: candidate.operationalTrainId,
      targetStopId: candidate.targetStopId,
    };
    if (!next) return trainCandidates.length === 0
      ? { ...base, result: 'inconclusive', reasonCode: 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT' }
      : { ...base, result: 'inconclusive', reasonCode: 'CLAIM_TARGET_CHANGED' };
    if (Date.parse(next.observedAt) <= Date.parse(candidate.observedAt)) {
      return { ...base, result: 'inconclusive', reasonCode: 'LATER_OBSERVATION_NOT_LATER' };
    }
    if (next.nextStopId === candidate.nextStopId) {
      return { ...base, result: 'not-observed', reasonCode: 'NEXT_STOP_UNCHANGED' };
    }
    if (next.targetStopId !== candidate.targetStopId) {
      return { ...base, result: 'inconclusive', reasonCode: 'CLAIM_TARGET_CHANGED' };
    }
    const laterIndex = candidate.remainingStopIds.indexOf(next.nextStopId);
    if (laterIndex <= 0 || next.routeId !== candidate.routeId) {
      return { ...base, result: 'inconclusive', reasonCode: 'LATER_STOP_NOT_DEMONSTRATED' };
    }
    if (!next.remainingStopIds.includes(candidate.targetStopId)) {
      return { ...base, result: 'inconclusive', reasonCode: 'TARGET_NOT_IN_LATER_PATH' };
    }
    const expectedPath = candidate.remainingStopIds.slice(laterIndex);
    if (JSON.stringify(expectedPath) !== JSON.stringify(next.remainingStopIds)) {
      return { ...base, result: 'inconclusive', reasonCode: 'PATH_CHANGED_OR_REROUTED' };
    }
    return { ...base, result: 'progressed', reasonCode: 'NEXT_STOP_ADVANCED' };
  });
}

export function parseShadowProgressRecord(value: unknown): readonly ShadowProgressCandidate[] {
  try {
    const row = exactRecord(value, [
      'schemaVersion', 'recordId', 'mode', 'recordedAt', 'decisionTime', 'riderExposure', 'boardsExposed',
      'outcome', 'sources', 'gates', 'claims', 'progressComparisons',
    ]);
    if (row.schemaVersion !== 'shadow-v2' || row.mode !== 'shadow' || row.riderExposure !== false || row.boardsExposed !== false
      || !boundedString(row.recordId) || !String(row.recordId).startsWith('shadow-') || !iso(row.recordedAt) || !iso(row.decisionTime)
      || Date.parse(row.decisionTime) > Date.parse(row.recordedAt) || !['DRY_RUN_NO_NETWORK', 'COMPLETED', 'COMPLETED_WITH_SOURCE_FAILURES'].includes(String(row.outcome))
      || !Array.isArray(row.sources) || !Array.isArray(row.gates) || !Array.isArray(row.claims)
      || !Array.isArray(row.progressComparisons) || row.sources.length !== 8 || row.gates.length !== 9
      || row.claims.length > 500 || row.progressComparisons.length > 500) throw new Error();
    row.sources.forEach(validateSourceRecord);
    row.gates.forEach((gate, index) => validateGateRecord(gate, index));
    row.progressComparisons.forEach(validateComparisonRecord);
    return row.claims.flatMap((claim) => {
      const claimRow = claimRecord(claim, String(row.decisionTime));
      const parsed = parseShadowProgressCandidate(claim, 64);
      if (!parsed || parsed.nextStopId !== parsed.remainingStopIds[0]
        || parsed.targetStopId !== parsed.remainingStopIds.at(-1)
        || parsed.remainingStopCount !== parsed.remainingStopIds.length
        || Date.parse(parsed.observedAt) > Date.parse(String(row.decisionTime))) throw new Error();
      return claimRow?.disposition === 'suppressed' ? [] : [parsed];
    });
  } catch {
    throw new Error('Invalid prior shadow record');
  }
}

export function parseShadowProgressCandidate(value: unknown, maxRemainingStops: number): ShadowProgressCandidate | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  const stringFields = ['sourceId', 'observedAt', 'operationalTrainId', 'nextStopId', 'targetStopId'] as const;
  if (!stringFields.every((key) => boundedString(row[key]))) return undefined;
  if (row.targetStopCallIdentity !== undefined && !boundedString(row.targetStopCallIdentity)) return undefined;
  if (row.routeId !== null && !boundedString(row.routeId)) return undefined;
  if (!Number.isSafeInteger(row.remainingStopCount) || Number(row.remainingStopCount) <= 0) return undefined;
  if (!Array.isArray(row.remainingStopIds) || row.remainingStopIds.length === 0
    || row.remainingStopIds.length > maxRemainingStops || !row.remainingStopIds.every(boundedString)) return undefined;
  if (!Number.isFinite(Date.parse(String(row.observedAt)))) return undefined;
  return {
    sourceId: String(row.sourceId),
    observedAt: String(row.observedAt),
    operationalTrainId: String(row.operationalTrainId),
    routeId: row.routeId === null ? null : String(row.routeId),
    nextStopId: String(row.nextStopId),
    targetStopId: String(row.targetStopId),
    ...(row.targetStopCallIdentity === undefined ? {} : { targetStopCallIdentity: String(row.targetStopCallIdentity) }),
    remainingStopCount: Number(row.remainingStopCount),
    remainingStopIds: row.remainingStopIds.map(String),
  };
}

function boundedString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256;
}

function candidateKey(candidate: ShadowProgressCandidate): string {
  return `${trainKey(candidate)}:${candidate.targetStopCallIdentity ?? candidate.targetStopId}`;
}

function trainKey(candidate: ShadowProgressCandidate): string {
  return `${candidate.sourceId}:${candidate.operationalTrainId}`;
}

function exactRecord(value: unknown, keys: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
  const row = value as Record<string, unknown>;
  const allowed = [...keys, ...optional];
  if (keys.some((key) => !Object.hasOwn(row, key)) || Object.keys(row).some((key) => !allowed.includes(key))) throw new Error();
  return row;
}

function iso(value: unknown): value is string {
  return typeof value === 'string' && new Date(value).toISOString() === value;
}

function claimRecord(value: unknown, decisionTime: string): { readonly disposition: 'admitted' | 'suppressed' } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
  const row = value as Record<string, unknown>;
  if (!Object.hasOwn(row, 'claimId')) {
    exactRecord(value, ['sourceId', 'observedAt', 'operationalTrainId', 'routeId', 'nextStopId', 'targetStopId', 'remainingStopCount', 'remainingStopIds']);
    return undefined;
  }
  if (row.disposition !== 'admitted' && row.disposition !== 'suppressed') throw new Error();
  const keys = [
    'claimId', 'sourceId', 'observedAt', 'operationalTrainId', 'routeId', 'nextStopId', 'targetStopId',
    'targetStopCallIdentity', 'remainingStopCount', 'remainingStopIds', 'decisionTime', 'disposition', 'provenance', 'decisions',
    ...(row.disposition === 'suppressed' ? ['suppressionReasonCode'] : []),
  ];
  exactRecord(value, keys);
  if (!boundedString(row.claimId) || !boundedString(row.targetStopCallIdentity) || row.decisionTime !== decisionTime) throw new Error();
  if (row.disposition === 'suppressed' && ![
    'MOVEMENT_EVIDENCE_UNCONFIRMED', 'FEED_NOT_CURRENT', 'SERVICE_CHANGE_NOT_ELIGIBLE',
    'TRACK_EVIDENCE_NOT_ELIGIBLE', 'ARRIVAL_CLAIM_NOT_ADMITTED',
  ].includes(String(row.suppressionReasonCode))) throw new Error();
  const provenance = exactRecord(row.provenance, ['source', 'sourceId', 'feedGroupId', 'observedAt', 'retrievedAt', 'sha256']);
  if (provenance.source !== 'gtfs-rt' || provenance.sourceId !== row.sourceId || provenance.observedAt !== row.observedAt
    || !boundedString(provenance.feedGroupId) || !iso(provenance.observedAt) || !iso(provenance.retrievedAt)
    || !/^[a-f0-9]{64}$/u.test(String(provenance.sha256))) throw new Error();
  const decisions = exactRecord(row.decisions, ['feedHealth', 'serviceChange', 'admission']);
  const feed = exactRecord(decisions.feedHealth, ['kind', 'reasonCode']);
  const service = exactRecord(decisions.serviceChange, ['kind', 'disposition']);
  if (!['current', 'degraded', 'unavailable'].includes(String(feed.kind)) || !boundedString(feed.reasonCode)
    || !['eligible-context', 'resolved-suppression', 'arrival-claim-unavailable', 'quarantine-or-limitation'].includes(String(service.kind))
    || !['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(String(service.disposition))
    || !decisions.admission || typeof decisions.admission !== 'object' || Array.isArray(decisions.admission)) throw new Error();
  const admission = decisions.admission as Record<string, unknown>;
  if (admission.kind === 'admitted') {
    exactRecord(admission, ['kind', 'confidence', 'stopCallIdentity', 'row']);
    if (row.disposition !== 'admitted' || !['live', 'expected'].includes(String(admission.confidence))
      || admission.stopCallIdentity !== row.targetStopCallIdentity || !admission.row || typeof admission.row !== 'object') throw new Error();
  } else if (admission.kind === 'secondary') {
    exactRecord(admission, ['kind', 'confidence', 'failedGate']);
    if (row.disposition !== 'suppressed' || !['holding', 'uncertain'].includes(String(admission.confidence))
      || admission.failedGate !== 'movement-time') throw new Error();
  } else if (admission.kind === 'rejected') {
    exactRecord(admission, ['kind', 'failedGate', 'disposition', 'boardTreatment'], [
      'riderCopy', 'serviceChange',
    ]);
    if (row.disposition !== 'suppressed' || !boundedString(admission.failedGate)
      || !boundedString(admission.disposition) || !boundedString(admission.boardTreatment)) throw new Error();
  } else throw new Error();
  return { disposition: row.disposition };
}

function validateSourceRecord(value: unknown): void {
  const row = value as Record<string, unknown>;
  const live = Boolean(row && typeof row === 'object' && Object.hasOwn(row, 'outcome'));
  exactRecord(value, live
    ? ['sourceId', 'role', 'outcome', 'reasonCode', ...(Object.hasOwn(row, 'retrievedAt') ? ['retrievedAt'] : [])]
    : ['sourceId', 'role']);
  if (!boundedString(row.sourceId) || !['subway-realtime', 'subway-alerts'].includes(String(row.role))) throw new Error();
  if (live && (!['accepted', 'failed', 'unavailable'].includes(String(row.outcome)) || !boundedString(row.reasonCode)
    || (row.retrievedAt !== undefined && !iso(row.retrievedAt)))) throw new Error();
}

const SHADOW_GATE_STAGES = [
  'arrival-boards', 'nearby-offline', 'accessibility', 'guidance', 'maps-rights',
  'commute-evaluation', 'commute-silent', 'commute-limited-pilot', 'commute-delivery',
] as const;

function validateGateRecord(value: unknown, index: number): void {
  const row = exactRecord(value, ['stage', 'exposed', 'reasonCode', 'decision']);
  if (row.stage !== SHADOW_GATE_STAGES[index] || row.exposed !== false || !boundedString(row.reasonCode) || !boundedString(row.decision)) throw new Error();
}

function validateComparisonRecord(value: unknown): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
  const row = value as Record<string, unknown>;
  const scoped = Object.hasOwn(row, 'sourceId');
  exactRecord(value, scoped
    ? ['sourceId', 'operationalTrainId', 'targetStopId', 'result', 'reasonCode']
    : ['result', 'reasonCode']);
  if (!['progressed', 'not-observed', 'inconclusive'].includes(String(row.result)) || !boundedString(row.reasonCode)
    || (scoped && (!boundedString(row.sourceId) || !boundedString(row.operationalTrainId) || !boundedString(row.targetStopId)))) throw new Error();
}
