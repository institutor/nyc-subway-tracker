export interface ShadowProgressCandidate {
  readonly sourceId: string;
  readonly observedAt: string;
  readonly operationalTrainId: string;
  readonly routeId: string | null;
  readonly nextStopId: string;
  readonly targetStopId: string;
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
    | 'LATER_STOP_NOT_DEMONSTRATED';
}

export function compareShadowProgress(
  earlier: readonly ShadowProgressCandidate[],
  later: readonly ShadowProgressCandidate[],
): readonly ShadowProgressComparison[] {
  const laterByTrain = new Map(later.map((candidate) => [candidateKey(candidate), candidate]));
  return earlier.map((candidate): ShadowProgressComparison => {
    const next = laterByTrain.get(candidateKey(candidate));
    const base = {
      sourceId: candidate.sourceId,
      operationalTrainId: candidate.operationalTrainId,
      targetStopId: candidate.targetStopId,
    };
    if (!next) return { ...base, result: 'inconclusive', reasonCode: 'TRAIN_NOT_PRESENT_IN_LATER_SNAPSHOT' };
    if (Date.parse(next.observedAt) <= Date.parse(candidate.observedAt)) {
      return { ...base, result: 'inconclusive', reasonCode: 'LATER_OBSERVATION_NOT_LATER' };
    }
    if (next.nextStopId === candidate.nextStopId) {
      return { ...base, result: 'not-observed', reasonCode: 'NEXT_STOP_UNCHANGED' };
    }
    const laterIndex = candidate.remainingStopIds.indexOf(next.nextStopId);
    if (laterIndex > 0 && next.routeId === candidate.routeId) {
      return { ...base, result: 'progressed', reasonCode: 'NEXT_STOP_ADVANCED' };
    }
    return { ...base, result: 'inconclusive', reasonCode: 'LATER_STOP_NOT_DEMONSTRATED' };
  });
}

export function parseShadowProgressCandidate(value: unknown, maxRemainingStops: number): ShadowProgressCandidate | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  const stringFields = ['sourceId', 'observedAt', 'operationalTrainId', 'nextStopId', 'targetStopId'] as const;
  if (!stringFields.every((key) => boundedString(row[key]))) return undefined;
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
    remainingStopCount: Number(row.remainingStopCount),
    remainingStopIds: row.remainingStopIds.map(String),
  };
}

function boundedString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256;
}

function candidateKey(candidate: ShadowProgressCandidate): string {
  return `${candidate.sourceId}:${candidate.operationalTrainId}`;
}
