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
  readonly unmatched: Readonly<{ readonly prior: readonly string[]; readonly current: readonly string[] }>;
  readonly quarantinedEvidence: readonly Readonly<{
    readonly role: 'prior' | 'current';
    readonly identity: string;
    readonly reason: 'track-path-unresolved' | 'ambiguous-continuity' | 'no-exclusive-continuity';
  }>[];
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
  const joinedPriors = new Set(joins.map((join) => join.priorIdentity));
  const joinedCurrents = new Set(joins.map((join) => join.currentIdentity));
  const unmatchedPrior = priors.map((item) => item.stableTrainIdentity).filter((id) => !joinedPriors.has(id)).sort(compareCanonicalIdentity);
  const unmatchedCurrent = currents.map((item) => item.stableTrainIdentity).filter((id) => !joinedCurrents.has(id)).sort(compareCanonicalIdentity);
  const ambiguous = new Set(quarantined.map(normalizeCanonicalIdentity));
  const unresolvedTracks = new Set<string>();
  for (const prior of priors) {
    if (!hasTrack(prior.track) && unmatchedPrior.includes(prior.stableTrainIdentity)) unresolvedTracks.add(`prior\0${normalizeCanonicalIdentity(prior.stableTrainIdentity)}`);
    for (const current of currents) {
      if ((!hasTrack(prior.track) || !hasTrack(current.track)) && couldMatchExceptTrack(prior, current, predicates)) {
        unresolvedTracks.add(`prior\0${normalizeCanonicalIdentity(prior.stableTrainIdentity)}`);
        unresolvedTracks.add(`current\0${normalizeCanonicalIdentity(current.stableTrainIdentity)}`);
      }
    }
  }
  for (const current of currents) {
    if (!hasTrack(current.track) && unmatchedCurrent.includes(current.stableTrainIdentity)) unresolvedTracks.add(`current\0${normalizeCanonicalIdentity(current.stableTrainIdentity)}`);
  }
  const quarantinedEvidence = [
    ...unmatchedCurrent.map((identity) => diagnostic('current', identity)),
    ...unmatchedPrior.map((identity) => diagnostic('prior', identity)),
  ];
  return Object.freeze({
    joins: Object.freeze(joins),
    quarantined: Object.freeze(quarantined),
    unmatched: Object.freeze({ prior: Object.freeze(unmatchedPrior), current: Object.freeze(unmatchedCurrent) }),
    quarantinedEvidence: Object.freeze(quarantinedEvidence),
  });

  function diagnostic(role: 'prior' | 'current', identity: string) {
    const normalized = normalizeCanonicalIdentity(identity);
    const reason = unresolvedTracks.has(`${role}\0${normalized}`)
      ? 'track-path-unresolved' as const
      : ambiguous.has(normalized) ? 'ambiguous-continuity' as const : 'no-exclusive-continuity' as const;
    return Object.freeze({ role, identity, reason });
  }
}

function isContinuityMatch(
  prior: PriorTrainContinuityEvidence,
  current: CurrentTrainContinuityEvidence,
  predicates: ContinuityPredicates,
): boolean {
  const markerMatches = prior.internalTrainMarker == null || current.internalTrainMarker == null
    || sameIdentity(prior.internalTrainMarker, current.internalTrainMarker);
  return markerMatches
    && current.appearedAt.getTime() >= prior.disappearedAt.getTime()
    && sameIdentity(prior.routeId, current.routeId)
    && prior.direction === current.direction
    && sameIdentity(prior.serviceDate, current.serviceDate)
    && sameStrings(prior.orderedStopCallIdentities, current.orderedStopCallIdentities)
    && hasTrack(prior.track)
    && hasTrack(current.track)
    && sameIdentity(prior.track, current.track)
    && sameIdentity(prior.destination, current.destination)
    && governedPredicate(predicates.similarTime, prior, current, 'similar-time')
    && governedPredicate(predicates.immediateReplacement, prior, current, 'immediate-replacement');
}

function couldMatchExceptTrack(
  prior: PriorTrainContinuityEvidence,
  current: CurrentTrainContinuityEvidence,
  predicates: ContinuityPredicates,
): boolean {
  const markerMatches = prior.internalTrainMarker == null || current.internalTrainMarker == null
    || sameIdentity(prior.internalTrainMarker, current.internalTrainMarker);
  return markerMatches
    && current.appearedAt.getTime() >= prior.disappearedAt.getTime()
    && sameIdentity(prior.routeId, current.routeId)
    && prior.direction === current.direction
    && sameIdentity(prior.serviceDate, current.serviceDate)
    && sameStrings(prior.orderedStopCallIdentities, current.orderedStopCallIdentities)
    && sameIdentity(prior.destination, current.destination)
    && governedPredicate(predicates.similarTime, prior, current, 'similar-time')
    && governedPredicate(predicates.immediateReplacement, prior, current, 'immediate-replacement');
}

function validateContinuityPopulation(values: readonly (PriorTrainContinuityEvidence | CurrentTrainContinuityEvidence)[], label: string): void {
  if (!Array.isArray(values)) throw new Error(`Invalid ${label} continuity population`);
  const identities = new Set<string>();
  for (const value of values) {
    if (!value.stableTrainIdentity || !value.publishedTripId || !value.routeId || !value.serviceDate || !value.destination) {
      throw new Error(`Incomplete ${label} train continuity evidence`);
    }
    if (!isResolvedDirection(value.direction) || !Array.isArray(value.orderedStopCallIdentities)) {
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
    const identity = normalizeCanonicalIdentity(value.stableTrainIdentity);
    if (identities.has(identity)) throw new Error(`Duplicate ${label} stable train identity`);
    identities.add(identity);
  }
}

function hasTrack(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => sameIdentity(value, right[index]));
}

function sameIdentity(left: string, right: string): boolean {
  return normalizeCanonicalIdentity(left) === normalizeCanonicalIdentity(right);
}

function governedPredicate(
  predicate: (prior: PriorTrainContinuityEvidence, current: CurrentTrainContinuityEvidence) => boolean,
  prior: PriorTrainContinuityEvidence,
  current: CurrentTrainContinuityEvidence,
  label: string,
): boolean {
  const result = predicate(prior, current);
  if (typeof result !== 'boolean') throw new Error(`Invalid governed ${label} result`);
  return result;
}

function isResolvedDirection(value: Direction): boolean {
  return ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(value);
}

function validDate(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
