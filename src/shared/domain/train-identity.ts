import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';
import type { Direction } from './types';

export interface StopCallIdentityEvidence {
  readonly stopId: string;
  readonly sourceStopSequence?: number | null;
  readonly occurrenceId?: string | null;
  readonly remainingOrder?: number;
}

export function canonicalStopCallIdentity(evidence: StopCallIdentityEvidence): string {
  if (!evidence || typeof evidence !== 'object' || !evidence.stopId?.trim()) {
    throw new Error('Exact directional stop identity is required');
  }
  const stopId = normalizeCanonicalIdentity(evidence.stopId.trim());
  if (evidence.sourceStopSequence !== undefined && evidence.sourceStopSequence !== null) {
    if (!Number.isSafeInteger(evidence.sourceStopSequence) || evidence.sourceStopSequence <= 0) {
      throw new Error('Stable stop-call source sequence must be a positive integer');
    }
    return `${stopId}\0sequence:${evidence.sourceStopSequence}`;
  }
  if (evidence.occurrenceId?.trim()) {
    return `${stopId}\0occurrence:${normalizeCanonicalIdentity(evidence.occurrenceId.trim())}`;
  }
  throw new Error('A stable stop-call occurrence or source sequence is required; remainingOrder is mutable');
}

export interface PriorTrainContinuityEvidence {
  readonly publishedTripId: string;
  readonly stableTrainIdentity: string;
  readonly internalTrainMarker?: string | null;
  readonly routeId: string;
  readonly direction: Direction;
  readonly serviceDate: string;
  readonly orderedStopCallIdentities: readonly string[];
  readonly track?: string | null;
  readonly destination: string;
  readonly predictedAt: Date;
  readonly disappearedAt: Date;
}

export interface CurrentTrainContinuityEvidence extends Omit<PriorTrainContinuityEvidence, 'disappearedAt'> {
  readonly appearedAt: Date;
  readonly disappearedAt?: Date;
}

export interface ContinuityPredicates {
  readonly similarTime: (prior: PriorTrainContinuityEvidence, current: CurrentTrainContinuityEvidence) => boolean;
  readonly immediateReplacement: (prior: PriorTrainContinuityEvidence, current: CurrentTrainContinuityEvidence) => boolean;
}

export interface TrainContinuityDecision {
  readonly joins: readonly { readonly priorIdentity: string; readonly currentIdentity: string }[];
  readonly quarantined: readonly string[];
}

export function resolveTrainContinuity(
  priors: readonly PriorTrainContinuityEvidence[],
  currents: readonly CurrentTrainContinuityEvidence[],
  predicates: ContinuityPredicates,
): TrainContinuityDecision {
  if (!predicates || typeof predicates.similarTime !== 'function' || typeof predicates.immediateReplacement !== 'function') {
    throw new Error('Governed similar-time and immediate-replacement predicates are required');
  }
  validateContinuityPopulation(priors, 'prior');
  validateContinuityPopulation(currents, 'current');
  const edges: Array<{ prior: PriorTrainContinuityEvidence; current: CurrentTrainContinuityEvidence }> = [];
  for (const prior of priors) {
    for (const current of currents) {
      if (isContinuityMatch(prior, current, predicates)) edges.push({ prior, current });
    }
  }
  const priorDegree = new Map<string, number>();
  const currentDegree = new Map<string, number>();
  for (const edge of edges) {
    priorDegree.set(edge.prior.stableTrainIdentity, (priorDegree.get(edge.prior.stableTrainIdentity) ?? 0) + 1);
    currentDegree.set(edge.current.stableTrainIdentity, (currentDegree.get(edge.current.stableTrainIdentity) ?? 0) + 1);
  }
  const joins = edges
    .filter((edge) => priorDegree.get(edge.prior.stableTrainIdentity) === 1 && currentDegree.get(edge.current.stableTrainIdentity) === 1)
    .map((edge) => Object.freeze({
      priorIdentity: edge.prior.stableTrainIdentity,
      currentIdentity: edge.current.stableTrainIdentity,
    }))
    .sort((left, right) => compareCanonicalIdentity(left.priorIdentity, right.priorIdentity)
      || compareCanonicalIdentity(left.currentIdentity, right.currentIdentity));
  const quarantined = [...new Set(edges
    .filter((edge) => priorDegree.get(edge.prior.stableTrainIdentity)! > 1 || currentDegree.get(edge.current.stableTrainIdentity)! > 1)
    .flatMap((edge) => [edge.prior.stableTrainIdentity, edge.current.stableTrainIdentity]))]
    .sort(compareCanonicalIdentity);
  return Object.freeze({ joins: Object.freeze(joins), quarantined: Object.freeze(quarantined) });
}

function isContinuityMatch(
  prior: PriorTrainContinuityEvidence,
  current: CurrentTrainContinuityEvidence,
  predicates: ContinuityPredicates,
): boolean {
  const markerMatches = prior.internalTrainMarker == null || current.internalTrainMarker == null
    || prior.internalTrainMarker === current.internalTrainMarker;
  return markerMatches
    && current.appearedAt.getTime() >= prior.disappearedAt.getTime()
    && prior.routeId === current.routeId
    && prior.direction === current.direction
    && prior.serviceDate === current.serviceDate
    && sameStrings(prior.orderedStopCallIdentities, current.orderedStopCallIdentities)
    && compatibleOptional(prior.track, current.track)
    && prior.destination === current.destination
    && predicates.similarTime(prior, current)
    && predicates.immediateReplacement(prior, current);
}

function validateContinuityPopulation(values: readonly (PriorTrainContinuityEvidence | CurrentTrainContinuityEvidence)[], label: string): void {
  if (!Array.isArray(values)) throw new Error(`Invalid ${label} continuity population`);
  const identities = new Set<string>();
  for (const value of values) {
    if (!value.stableTrainIdentity || !value.publishedTripId || !value.routeId || !value.serviceDate || !value.destination) {
      throw new Error(`Incomplete ${label} train continuity evidence`);
    }
    if (value.direction === 'unknown' || !Array.isArray(value.orderedStopCallIdentities)) {
      throw new Error(`Incomplete ${label} train continuity evidence`);
    }
    if (label === 'prior' && !('disappearedAt' in value)) throw new Error('Prior disappearance time is required');
    if (label === 'current' && !('appearedAt' in value)) throw new Error('Current appearance time is required');
    if (value.orderedStopCallIdentities.length === 0 || value.orderedStopCallIdentities.some((item: string) => !item)) {
      throw new Error(`Incomplete ${label} ordered stop-call identity evidence`);
    }
    validDate(value.predictedAt, `${label} prediction`);
    if ('disappearedAt' in value && value.disappearedAt !== undefined) validDate(value.disappearedAt, `${label} disappearance`);
    if ('appearedAt' in value) validDate(value.appearedAt, `${label} appearance`);
    if (identities.has(value.stableTrainIdentity)) throw new Error(`Duplicate ${label} stable train identity`);
    identities.add(value.stableTrainIdentity);
  }
}

function compatibleOptional(left: string | null | undefined, right: string | null | undefined): boolean {
  return left == null || right == null || left === right;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validDate(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
