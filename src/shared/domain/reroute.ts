import {
  encodeCanonicalIdentityTuple,
  normalizeBoundedIdentity,
  normalizeCanonicalIdentity,
} from './canonical';
import type { RouteIdentity } from './types';
import { sanitizeOfficialText, type AlertScopeKind, type ResolvedServiceDirection } from './alert-scope';
import { classifyScheduleAge } from './schedule-owner';
import {
  CLAIM_SUPPRESSED_PRODUCTS,
  countQualifyingRecovery,
  type ClaimSuppressedProduct,
  type ServiceRecoveryUpdate,
} from './service-impact';
import { captureDateEpochMilliseconds, validateEpochMilliseconds } from './temporal';

export type StoppingPatternChangeKind = 'reroute' | 'express-running-local' | 'local-running-express';

export interface SupplementedPatternProvenance {
  readonly source: 'supplemented-gtfs' | 'regular-gtfs';
  readonly acceptance: 'accepted' | 'quarantined' | 'rejected';
  readonly currency: 'current' | 'stale';
  readonly editionId: string;
  readonly canonicalContentId: string;
  readonly publishedAt?: Date;
  readonly firstAcceptedRetrievedAt: Date;
  readonly observedAt: Date;
  readonly acceptedAt: Date;
  readonly sourceOrder: number;
  readonly priorAcceptedEdition?: AcceptedSupplementedPatternEdition;
}

export interface AcceptedSupplementedPatternEdition {
  readonly editionId: string;
  readonly canonicalContentId: string;
  readonly publishedAt?: Date;
  readonly firstAcceptedRetrievedAt: Date;
  readonly observedAt: Date;
  readonly acceptedAt: Date;
  readonly sourceOrder: number;
}

export interface EffectiveSupplementedPattern {
  readonly sourceId: string;
  readonly routeId: string;
  readonly direction: ResolvedServiceDirection;
  readonly orderedDirectionalStopIds: readonly string[];
  readonly provenance: SupplementedPatternProvenance;
}

export interface ReroutePathEvidence {
  readonly evidenceId: string;
  readonly routeId: string;
  readonly direction: ResolvedServiceDirection;
  readonly orderedDirectionalStopIds: readonly string[];
  readonly supportedViaLabel?: string;
}

export interface RerouteClaimInput {
  readonly changeKind: StoppingPatternChangeKind;
  readonly planned: boolean;
  readonly assessedAt: Date;
  readonly alertScope: AlertScopeKind;
  readonly originalRoute: RouteIdentity;
  readonly direction: ResolvedServiceDirection;
  readonly targetExactDirectionalStopId: string;
  readonly originalDirectionalStopIds: readonly string[];
  readonly effectiveSupplementedPattern: EffectiveSupplementedPattern | null;
  readonly liveRemainingStopIds: readonly string[];
  readonly pathEvidence: readonly ReroutePathEvidence[];
  readonly affectedExactDirectionalSegmentStopIds?: readonly string[];
}

export type RerouteClaimDecision =
  | {
      readonly kind: 'admitted';
      readonly route: RouteIdentity;
      readonly targetExactDirectionalStopId: string;
      readonly supportedViaLabel?: string;
      readonly reason: 'planned-effective-pattern-and-live-path-agree' | 'unplanned-live-and-path-agree';
    }
  | {
      readonly kind: 'suppressed';
      readonly route: RouteIdentity;
      readonly targetExactDirectionalStopId: string;
      readonly reason: 'original-stop-excluded-by-effective-pattern' | 'explicit-local-stop-omitted';
    }
  | {
      readonly kind: 'eligible-original';
      readonly route: RouteIdentity;
      readonly targetExactDirectionalStopId: string;
      readonly reason: 'not-an-explicit-omitted-local';
    }
  | {
      readonly kind: 'quarantine-or-limitation';
      readonly route: RouteIdentity;
      readonly targetExactDirectionalStopId: string;
      readonly reason:
        | 'direction-or-route-conflict'
        | 'invalid-ordered-stop-evidence'
        | 'unusable-supplemented-pattern'
        | 'planned-pattern-required'
        | 'alert-scope-unrelated'
        | 'alert-scope-unresolved'
        | 'planned-pattern-conflicts-with-live-path'
        | 'target-not-in-coherent-live-remaining-stops'
        | 'independent-path-proof-missing'
        | 'conflicting-path-evidence'
        | 'target-not-explicitly-added'
        | 'divergent-ordered-path-evidence'
        | 'invalid-via-label';
    };

export function resolveRerouteClaim(input: RerouteClaimInput): RerouteClaimDecision {
  const assessedAtMs = validateRerouteInput(input);
  const route = Object.freeze({ ...input.originalRoute });
  const limited = (reason: Extract<RerouteClaimDecision, { kind: 'quarantine-or-limitation' }>['reason']): RerouteClaimDecision =>
    Object.freeze({ kind: 'quarantine-or-limitation', route, targetExactDirectionalStopId: input.targetExactDirectionalStopId, reason });

  if (!coherentOrderedStops(input.originalDirectionalStopIds, true)) return limited('invalid-ordered-stop-evidence');
  if (input.planned && !input.effectiveSupplementedPattern) return limited('planned-pattern-required');
  const effective = input.effectiveSupplementedPattern;
  if (effective && !usableSupplementedPattern(effective, assessedAtMs)) return limited('unusable-supplemented-pattern');
  if (effective && (!sameIdentity(effective.routeId, input.originalRoute.id) || effective.direction !== input.direction)) {
    return limited('direction-or-route-conflict');
  }
  if (input.alertScope === 'unrelated') return limited('alert-scope-unrelated');
  if (input.alertScope === 'unresolved') return limited('alert-scope-unresolved');

  if (!coherentOrderedStops(input.liveRemainingStopIds)
    || input.pathEvidence.some((item) => !coherentOrderedStops(item.orderedDirectionalStopIds))) {
    return limited('invalid-ordered-stop-evidence');
  }

  if (input.changeKind === 'local-running-express') {
    const affected = input.affectedExactDirectionalSegmentStopIds;
    if (!affected || !coherentOrderedStops(affected)) return limited('invalid-ordered-stop-evidence');
    if (includesIdentity(affected, input.targetExactDirectionalStopId)) {
      return Object.freeze({ kind: 'suppressed', route, targetExactDirectionalStopId: input.targetExactDirectionalStopId,
        reason: 'explicit-local-stop-omitted' });
    }
    return Object.freeze({ kind: 'eligible-original', route, targetExactDirectionalStopId: input.targetExactDirectionalStopId,
      reason: 'not-an-explicit-omitted-local' });
  }

  const targetWasOriginal = includesIdentity(input.originalDirectionalStopIds, input.targetExactDirectionalStopId);
  const targetEffective = effective ? includesIdentity(effective.orderedDirectionalStopIds, input.targetExactDirectionalStopId) : false;
  const targetLive = includesIdentity(input.liveRemainingStopIds, input.targetExactDirectionalStopId);

  if (input.planned && targetWasOriginal && !targetEffective) {
    return Object.freeze({ kind: 'suppressed', route, targetExactDirectionalStopId: input.targetExactDirectionalStopId,
      reason: 'original-stop-excluded-by-effective-pattern' });
  }
  if (input.planned && !targetEffective) {
    return limited(targetLive ? 'planned-pattern-conflicts-with-live-path' : 'target-not-explicitly-added');
  }
  if (!targetLive) return limited('target-not-in-coherent-live-remaining-stops');

  const applicablePaths = input.pathEvidence.filter((item) => sameIdentity(item.routeId, input.originalRoute.id)
    && item.direction === input.direction);
  if (applicablePaths.length === 0) return limited('independent-path-proof-missing');

  if (effective && (!isOrderedSubsequence(input.liveRemainingStopIds, effective.orderedDirectionalStopIds)
    || applicablePaths.some((item) => !isOrderedSubsequence(item.orderedDirectionalStopIds,
      effective.orderedDirectionalStopIds)))) {
    return limited('divergent-ordered-path-evidence');
  }
  if (!effective && applicablePaths.some((item) => !relativeOrderCoherent(
    input.liveRemainingStopIds,
    item.orderedDirectionalStopIds,
  ))) return limited('divergent-ordered-path-evidence');

  const supportingPaths = applicablePaths.filter((item) => includesIdentity(item.orderedDirectionalStopIds, input.targetExactDirectionalStopId));
  const contradictingPaths = applicablePaths.filter((item) => !includesIdentity(item.orderedDirectionalStopIds, input.targetExactDirectionalStopId));
  if (supportingPaths.length > 0 && contradictingPaths.length > 0) return limited('conflicting-path-evidence');
  if (supportingPaths.length === 0) return limited('independent-path-proof-missing');

  const labels: string[] = [];
  for (const path of supportingPaths) {
    if (path.supportedViaLabel === undefined) continue;
    const sanitized = safeViaLabel(path.supportedViaLabel);
    if (sanitized === null) return limited('invalid-via-label');
    labels.push(sanitized);
  }
  const distinctLabels = [...new Set(labels.map((item) => item.normalize('NFC')))];
  if (distinctLabels.length > 1) return limited('conflicting-path-evidence');
  const canonicalLabels = distinctLabels;
  canonicalLabels.sort(compareText);
  const supportedViaLabel = canonicalLabels.length === 1 ? canonicalLabels[0] : undefined;
  return Object.freeze({
    kind: 'admitted',
    route,
    targetExactDirectionalStopId: input.targetExactDirectionalStopId,
    ...(supportedViaLabel ? { supportedViaLabel } : {}),
    reason: input.planned ? 'planned-effective-pattern-and-live-path-agree' : 'unplanned-live-and-path-agree',
  });
}

export interface TrackConflictInput {
  readonly evidenceId: string;
  readonly routeId: string;
  readonly direction: ResolvedServiceDirection;
  readonly conflictStopId: string;
  readonly targetExactDirectionalStopId: string;
  readonly actualTrack: string | null;
  readonly scheduledTrack: string | null;
  readonly terminal: boolean;
  readonly downstreamExactDirectionalStopIds: readonly string[];
  readonly observedAt: Date;
  readonly priorRisk?: TrackRiskCarryover | null;
  readonly recoveryUpdates?: readonly ServiceRecoveryUpdate[];
}

export interface TrackClaimScope {
  readonly routeId: string;
  readonly direction: ResolvedServiceDirection;
  readonly conflictStopId: string;
  readonly targetExactDirectionalStopId: string;
}

export interface TrackRiskCarryover {
  readonly kind: 'resolved-suppression';
  readonly claimIdentity: string;
  readonly evaluatedClaim: TrackClaimScope;
  readonly adverseAtMs: number;
  readonly riderCopy: string;
  readonly suppressedProducts: readonly ClaimSuppressedProduct[];
}

export interface TrackConflictDecision {
  readonly kind: 'eligible-context' | 'resolved-suppression' | 'quarantine-or-limitation';
  readonly disposition: 'eligible' | 'resolved-ineligible' | 'quarantined';
  readonly riderCopy: string | null;
  readonly suppressedProducts: readonly ClaimSuppressedProduct[];
  readonly carryover: TrackRiskCarryover | null;
  readonly carriedForward: boolean;
  readonly recoveryCount: 0 | 1 | 2;
}

const ISSUED_TRACK_RISK_CARRYOVERS = new WeakSet<object>();
const TRACK_LIMITATION_COPY = 'Track information could not be verified; downstream arrivals are withheld.';

export function evaluateTrackConflict(input: TrackConflictInput): TrackConflictDecision {
  const observedAtMs = validateTrackInput(input);
  const evaluatedClaim = freezeTrackClaim(input);
  const claimIdentity = trackClaimIdentity(evaluatedClaim);
  const priorRiskBinding = bindPriorTrackRisk(input.priorRisk, claimIdentity);
  if (priorRiskBinding.kind === 'invalid') {
    return freezeTrack('quarantine-or-limitation', 'quarantined', TRACK_LIMITATION_COPY, [], null, false, 0);
  }
  const priorRisk = priorRiskBinding.kind === 'bound' ? priorRiskBinding.risk : null;
  const actualTrack = normalizeTrackId(input.actualTrack);
  const scheduledTrack = normalizeTrackId(input.scheduledTrack);
  const resolvedConflict = !input.terminal && actualTrack !== null && scheduledTrack !== null
    && actualTrack !== scheduledTrack
    && includesIdentity(input.downstreamExactDirectionalStopIds, input.targetExactDirectionalStopId);
  if (resolvedConflict) {
    const riderCopy = 'Track change—downstream arrival information is withheld.';
    if (priorRisk && observedAtMs <= priorRisk.adverseAtMs) {
      return freezeTrack('resolved-suppression', 'resolved-ineligible', priorRisk.riderCopy,
        priorRisk.suppressedProducts, priorRisk, true, 0);
    }
    const carryover = freezeTrackRisk(evaluatedClaim, observedAtMs, riderCopy);
    return freezeTrack('resolved-suppression', 'resolved-ineligible', riderCopy, CLAIM_SUPPRESSED_PRODUCTS, carryover, false, 0);
  }
  if (priorRisk) {
    if (observedAtMs <= priorRisk.adverseAtMs) {
      return freezeTrack('resolved-suppression', 'resolved-ineligible', priorRisk.riderCopy,
        priorRisk.suppressedProducts, priorRisk, true, 0);
    }
    const recoveryCount = countQualifyingRecovery(input.recoveryUpdates ?? [], priorRisk.adverseAtMs, observedAtMs);
    if (recoveryCount < 2) return freezeTrack('resolved-suppression', 'resolved-ineligible', priorRisk.riderCopy,
      priorRisk.suppressedProducts, priorRisk, true, recoveryCount);
    return freezeTrack('eligible-context', 'eligible', null, [], null, false, 2);
  }
  return freezeTrack('eligible-context', 'eligible', null, [], null, false, 0);
}

function validateRerouteInput(input: RerouteClaimInput): number {
  if (!input || typeof input !== 'object' || !['reroute', 'express-running-local', 'local-running-express'].includes(input.changeKind)
    || typeof input.planned !== 'boolean' || !['match', 'unrelated', 'unresolved'].includes(input.alertScope)
    || !input.originalRoute?.id?.trim() || !input.originalRoute.label?.trim()
    || !isResolvedDirection(input.direction) || !input.targetExactDirectionalStopId?.trim()
    || !Array.isArray(input.originalDirectionalStopIds) || !Array.isArray(input.liveRemainingStopIds)
    || !Array.isArray(input.pathEvidence)) throw new Error('Complete reroute claim evidence is required');
  const assessedAtMs = captureDateEpochMilliseconds(input.assessedAt, 'reroute assessment instant');
  normalizeBoundedIdentity(input.originalRoute.id, 'reroute route');
  normalizeBoundedIdentity(input.targetExactDirectionalStopId, 'reroute target stop');
  if (input.effectiveSupplementedPattern) {
    if (!input.effectiveSupplementedPattern.sourceId?.trim() || !input.effectiveSupplementedPattern.routeId?.trim()
      || !isResolvedDirection(input.effectiveSupplementedPattern.direction)
      || !Array.isArray(input.effectiveSupplementedPattern.orderedDirectionalStopIds)) throw new Error('Invalid effective supplemented pattern');
  }
  for (const proof of input.pathEvidence) {
    if (!proof?.evidenceId?.trim() || !proof.routeId?.trim() || !isResolvedDirection(proof.direction)
      || !Array.isArray(proof.orderedDirectionalStopIds)) throw new Error('Invalid reroute path evidence');
    normalizeBoundedIdentity(proof.evidenceId, 'reroute path evidence');
    normalizeBoundedIdentity(proof.routeId, 'reroute path route');
  }
  return assessedAtMs;
}

function validateTrackInput(input: TrackConflictInput): number {
  if (!input || typeof input !== 'object' || !input.evidenceId?.trim() || !input.routeId?.trim()
    || !isResolvedDirection(input.direction) || !input.conflictStopId?.trim() || !input.targetExactDirectionalStopId?.trim()
    || typeof input.terminal !== 'boolean' || !Array.isArray(input.downstreamExactDirectionalStopIds)) {
    throw new Error('Complete resolved track evidence is required');
  }
  const observedAtMs = captureDateEpochMilliseconds(input.observedAt, 'track observation instant');
  normalizeBoundedIdentity(input.evidenceId, 'track evidence');
  normalizeBoundedIdentity(input.routeId, 'track route');
  normalizeBoundedIdentity(input.conflictStopId, 'track conflict stop');
  normalizeBoundedIdentity(input.targetExactDirectionalStopId, 'track target stop');
  input.downstreamExactDirectionalStopIds.forEach((stopId) => normalizeBoundedIdentity(stopId, 'track downstream stop'));
  return observedAtMs;
}

function coherentOrderedStops(stops: readonly string[], requireNonempty = false): boolean {
  if (!Array.isArray(stops) || (requireNonempty && stops.length === 0) || stops.some((item) => !item?.trim())) return false;
  let canonical: string[];
  try {
    canonical = stops.map((item) => normalizeBoundedIdentity(item, 'directional stop'));
  } catch {
    return false;
  }
  return new Set(canonical).size === canonical.length;
}

function usableSupplementedPattern(pattern: EffectiveSupplementedPattern, assessedAtMs: number): boolean {
  const provenance = pattern.provenance as SupplementedPatternProvenance | undefined;
  if (!pattern.sourceId?.trim() || !pattern.routeId?.trim() || !isResolvedDirection(pattern.direction)
    || !coherentOrderedStops(pattern.orderedDirectionalStopIds, true) || !provenance
    || provenance.source !== 'supplemented-gtfs' || provenance.acceptance !== 'accepted'
    || !['current', 'stale'].includes(provenance.currency)
    || !Number.isSafeInteger(provenance.sourceOrder) || provenance.sourceOrder < 0) return false;
  try {
    normalizeBoundedIdentity(pattern.sourceId, 'supplemented pattern source');
    normalizeBoundedIdentity(pattern.routeId, 'supplemented pattern route');
    const contentId = normalizeBoundedIdentity(provenance.canonicalContentId, 'supplemented content');
    const editionId = normalizeBoundedIdentity(provenance.editionId, 'supplemented edition');
    if (editionId !== `supplemented-gtfs:${contentId}`) return false;
    const assessed = validateEpochMilliseconds(assessedAtMs, 'reroute assessment instant');
    const publishedAt = provenance.publishedAt;
    const firstAcceptedRetrievedAt = provenance.firstAcceptedRetrievedAt;
    const observedAt = provenance.observedAt;
    const acceptedAt = provenance.acceptedAt;
    const published = publishedAt === undefined ? null : validInstant(publishedAt);
    const firstAcceptedRetrieved = validInstant(firstAcceptedRetrievedAt);
    const observed = validInstant(observedAt);
    const accepted = validInstant(acceptedAt);
    if ((published !== null && published > firstAcceptedRetrieved)
      || !(firstAcceptedRetrieved <= observed && observed <= accepted && accepted <= assessed)) return false;
    const ageAnchor = published ?? firstAcceptedRetrieved;
    const age = classifyScheduleAge(new Date(ageAnchor), new Date(assessed));
    if ((age.state !== 'current' && age.state !== 'stale') || age.state !== provenance.currency) return false;

    const prior = provenance.priorAcceptedEdition;
    if (prior) {
      if (!Number.isSafeInteger(prior.sourceOrder) || prior.sourceOrder < 0) return false;
      const priorContentId = normalizeBoundedIdentity(prior.canonicalContentId, 'prior supplemented content');
      const priorEditionId = normalizeBoundedIdentity(prior.editionId, 'prior supplemented edition');
      if (priorEditionId !== `supplemented-gtfs:${priorContentId}` || priorContentId === contentId) return false;
      const priorPublishedAt = prior.publishedAt;
      const priorFirstAcceptedRetrievedAt = prior.firstAcceptedRetrievedAt;
      const priorObservedAt = prior.observedAt;
      const priorAcceptedAt = prior.acceptedAt;
      const priorPublished = priorPublishedAt === undefined ? null : validInstant(priorPublishedAt);
      const priorFirstAcceptedRetrieved = validInstant(priorFirstAcceptedRetrievedAt);
      const priorObserved = validInstant(priorObservedAt);
      const priorAccepted = validInstant(priorAcceptedAt);
      const priorAgeAnchor = priorPublished ?? priorFirstAcceptedRetrieved;
      if ((priorPublished !== null && priorPublished > priorFirstAcceptedRetrieved)
        || !(priorFirstAcceptedRetrieved <= priorObserved && priorObserved <= priorAccepted && priorAccepted <= assessed)
        || ageAnchor <= priorAgeAnchor || firstAcceptedRetrieved <= priorFirstAcceptedRetrieved
        || observed <= priorObserved || accepted <= priorAccepted
        || provenance.sourceOrder <= prior.sourceOrder) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isOrderedSubsequence(candidate: readonly string[], reference: readonly string[]): boolean {
  const positions = new Map(reference.map((stopId, index) => [normalizeCanonicalIdentity(stopId), index]));
  let prior = -1;
  for (const stopId of candidate) {
    const position = positions.get(normalizeCanonicalIdentity(stopId));
    if (position === undefined || position <= prior) return false;
    prior = position;
  }
  return true;
}

function relativeOrderCoherent(left: readonly string[], right: readonly string[]): boolean {
  const rightSet = new Set(right.map(normalizeCanonicalIdentity));
  const leftCommon = left.map(normalizeCanonicalIdentity).filter((item) => rightSet.has(item));
  const leftSet = new Set(left.map(normalizeCanonicalIdentity));
  const rightCommon = right.map(normalizeCanonicalIdentity).filter((item) => leftSet.has(item));
  return leftCommon.length > 0 && leftCommon.every((item, index) => item === rightCommon[index]);
}

function safeViaLabel(raw: string): string | null {
  if (typeof raw !== 'string' || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  const sanitized = sanitizeOfficialText(raw).normalize('NFC');
  if (!sanitized || [...sanitized].length > 40
    || !/^Via\s+[\p{L}\p{N}][\p{L}\p{N}\s.&/()'’\-]*$/u.test(sanitized)) return null;
  return sanitized;
}

function includesIdentity(values: readonly string[], expected: string): boolean {
  return values.some((item) => sameIdentity(item, expected));
}

function sameIdentity(left: string, right: string): boolean {
  return normalizeCanonicalIdentity(left) === normalizeCanonicalIdentity(right);
}

function compareText(left: string, right: string): number {
  const a = normalizeCanonicalIdentity(left);
  const b = normalizeCanonicalIdentity(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

function isResolvedDirection(value: string): value is ResolvedServiceDirection {
  return ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(value);
}

function trackClaimIdentity(input: TrackClaimScope): string {
  return encodeCanonicalIdentityTuple(
    [input.routeId, input.direction, input.conflictStopId, input.targetExactDirectionalStopId],
    'track claim',
  );
}

function freezeTrackClaim(input: TrackClaimScope): TrackClaimScope {
  return Object.freeze({
    routeId: normalizeBoundedIdentity(input.routeId, 'track route'),
    direction: input.direction,
    conflictStopId: normalizeBoundedIdentity(input.conflictStopId, 'track conflict stop'),
    targetExactDirectionalStopId: normalizeBoundedIdentity(input.targetExactDirectionalStopId, 'track target stop'),
  });
}

type PriorTrackRiskBinding =
  | { readonly kind: 'absent' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'bound'; readonly risk: TrackRiskCarryover };

function bindPriorTrackRisk(
  risk: TrackRiskCarryover | null | undefined,
  expectedClaimIdentity: string,
): PriorTrackRiskBinding {
  if (risk == null) return { kind: 'absent' };
  try {
    validateTrackRiskCarryover(risk, expectedClaimIdentity);
    return { kind: 'bound', risk };
  } catch {
    return { kind: 'invalid' };
  }
}

function validateTrackRiskCarryover(
  risk: TrackRiskCarryover | null,
  expectedClaimIdentity: string,
): asserts risk is TrackRiskCarryover {
  if (!risk || typeof risk !== 'object' || !ISSUED_TRACK_RISK_CARRYOVERS.has(risk)) {
    throw new Error('Expected an issued track risk carryover');
  }
  if (!Object.isFrozen(risk) || risk.kind !== 'resolved-suppression'
    || risk.claimIdentity !== expectedClaimIdentity || !Object.isFrozen(risk.evaluatedClaim)
    || !isResolvedDirection(risk.evaluatedClaim.direction)
    || trackClaimIdentity(risk.evaluatedClaim) !== expectedClaimIdentity
    || !Number.isSafeInteger(risk.adverseAtMs)
    || typeof risk.riderCopy !== 'string' || !risk.riderCopy
    || !Array.isArray(risk.suppressedProducts) || !Object.isFrozen(risk.suppressedProducts)
    || risk.suppressedProducts.length !== CLAIM_SUPPRESSED_PRODUCTS.length
    || risk.suppressedProducts.some((product, index) => product !== CLAIM_SUPPRESSED_PRODUCTS[index])) {
    throw new Error('Invalid issued track risk carryover');
  }
}

function normalizeTrackId(value: string | null): string | null {
  if (typeof value !== 'string') return null;
  try {
    const normalized = normalizeCanonicalIdentity(value);
    const nonAsciiSpaces = normalized.replace(/ /g, '');
    if (!normalized || normalized.trim() !== normalized || [...normalized].length > 64
      || /\p{C}/u.test(normalized) || /\p{Z}/u.test(nonAsciiSpaces)) return null;
    return normalized;
  } catch {
    return null;
  }
}

function validInstant(value: Date): number {
  return captureDateEpochMilliseconds(value, 'chronology instant');
}

function freezeTrack(
  kind: TrackConflictDecision['kind'],
  disposition: TrackConflictDecision['disposition'],
  riderCopy: string | null,
  suppressedProducts: readonly ClaimSuppressedProduct[],
  carryover: TrackRiskCarryover | null,
  carriedForward: boolean,
  recoveryCount: 0 | 1 | 2,
): TrackConflictDecision {
  return Object.freeze({ kind, disposition, riderCopy, suppressedProducts: Object.freeze([...suppressedProducts]),
    carryover, carriedForward, recoveryCount });
}

function freezeTrackRisk(evaluatedClaim: TrackClaimScope, adverseAtMs: number, riderCopy: string): TrackRiskCarryover {
  const claim = freezeTrackClaim(evaluatedClaim);
  const boundaryMs = validateEpochMilliseconds(adverseAtMs, 'track conflict observation instant');
  const risk = Object.freeze({
    kind: 'resolved-suppression' as const,
    claimIdentity: trackClaimIdentity(claim),
    evaluatedClaim: claim,
    adverseAtMs: boundaryMs,
    riderCopy,
    suppressedProducts: CLAIM_SUPPRESSED_PRODUCTS,
  });
  ISSUED_TRACK_RISK_CARRYOVERS.add(risk);
  return risk;
}
