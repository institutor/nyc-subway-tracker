import { normalizeCanonicalIdentity } from './canonical';
import type { RouteIdentity } from './types';
import type { AlertScopeKind, ResolvedServiceDirection } from './alert-scope';
import {
  CLAIM_SUPPRESSED_PRODUCTS,
  countQualifyingRecovery,
  type ClaimSuppressedProduct,
  type ServiceRecoveryUpdate,
  type ServiceRiskCarryover,
} from './service-impact';

export type StoppingPatternChangeKind = 'reroute' | 'express-running-local' | 'local-running-express';

export interface EffectiveSupplementedPattern {
  readonly sourceId: string;
  readonly routeId: string;
  readonly direction: ResolvedServiceDirection;
  readonly orderedDirectionalStopIds: readonly string[];
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
        | 'planned-pattern-required'
        | 'alert-scope-unrelated'
        | 'alert-scope-unresolved'
        | 'planned-pattern-conflicts-with-live-path'
        | 'target-not-in-coherent-live-remaining-stops'
        | 'independent-path-proof-missing'
        | 'conflicting-path-evidence'
        | 'target-not-explicitly-added';
    };

export function resolveRerouteClaim(input: RerouteClaimInput): RerouteClaimDecision {
  validateRerouteInput(input);
  const route = Object.freeze({ ...input.originalRoute });
  const limited = (reason: Extract<RerouteClaimDecision, { kind: 'quarantine-or-limitation' }>['reason']): RerouteClaimDecision =>
    Object.freeze({ kind: 'quarantine-or-limitation', route, targetExactDirectionalStopId: input.targetExactDirectionalStopId, reason });

  if (!coherentOrderedStops(input.originalDirectionalStopIds)
    || (input.effectiveSupplementedPattern && !coherentOrderedStops(input.effectiveSupplementedPattern.orderedDirectionalStopIds))) {
    return limited('invalid-ordered-stop-evidence');
  }

  if (input.planned && !input.effectiveSupplementedPattern) return limited('planned-pattern-required');
  const effective = input.effectiveSupplementedPattern;
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
  const supportingPaths = applicablePaths.filter((item) => includesIdentity(item.orderedDirectionalStopIds, input.targetExactDirectionalStopId));
  const contradictingPaths = applicablePaths.filter((item) => !includesIdentity(item.orderedDirectionalStopIds, input.targetExactDirectionalStopId));
  if (supportingPaths.length > 0 && contradictingPaths.length > 0) return limited('conflicting-path-evidence');
  if (supportingPaths.length === 0) return limited('independent-path-proof-missing');

  const labels = [...new Set(supportingPaths.map((item) => item.supportedViaLabel?.trim()).filter((value): value is string => Boolean(value)))];
  labels.sort(compareText);
  const supportedViaLabel = labels.length === 1 ? labels[0] : undefined;
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
  readonly priorRisk?: ServiceRiskCarryover | null;
  readonly recoveryUpdates?: readonly ServiceRecoveryUpdate[];
}

export interface TrackConflictDecision {
  readonly kind: 'eligible-context' | 'resolved-suppression';
  readonly disposition: 'eligible' | 'resolved-ineligible';
  readonly riderCopy: string | null;
  readonly suppressedProducts: readonly ClaimSuppressedProduct[];
  readonly carryover: ServiceRiskCarryover | null;
  readonly carriedForward: boolean;
  readonly recoveryCount: 0 | 1 | 2;
}

export function evaluateTrackConflict(input: TrackConflictInput): TrackConflictDecision {
  validateTrackInput(input);
  const claimIdentity = trackClaimIdentity(input);
  const priorRisk = input.priorRisk?.claimIdentity === claimIdentity ? input.priorRisk : null;
  const resolvedConflict = !input.terminal && Boolean(input.actualTrack) && Boolean(input.scheduledTrack)
    && !sameIdentity(input.actualTrack!, input.scheduledTrack!)
    && includesIdentity(input.downstreamExactDirectionalStopIds, input.targetExactDirectionalStopId);
  if (resolvedConflict) {
    const riderCopy = 'Track change—downstream arrival information is withheld.';
    const carryover: ServiceRiskCarryover = Object.freeze({
      kind: 'resolved-suppression', claimIdentity, adverseAt: new Date(input.observedAt), riderCopy,
      officialDetails: Object.freeze([]), rawOfficialAudit: Object.freeze([]), auditEvidence: Object.freeze([]),
      suppressedProducts: CLAIM_SUPPRESSED_PRODUCTS,
    });
    return freezeTrack('resolved-suppression', 'resolved-ineligible', riderCopy, CLAIM_SUPPRESSED_PRODUCTS, carryover, false, 0);
  }
  if (priorRisk) {
    const recoveryCount = countQualifyingRecovery(input.recoveryUpdates ?? [], priorRisk.adverseAt, input.observedAt);
    if (recoveryCount < 2) return freezeTrack('resolved-suppression', 'resolved-ineligible', priorRisk.riderCopy,
      priorRisk.suppressedProducts, priorRisk, true, recoveryCount);
    return freezeTrack('eligible-context', 'eligible', null, [], null, false, 2);
  }
  return freezeTrack('eligible-context', 'eligible', null, [], null, false, 0);
}

function validateRerouteInput(input: RerouteClaimInput): void {
  if (!input || typeof input !== 'object' || !['reroute', 'express-running-local', 'local-running-express'].includes(input.changeKind)
    || typeof input.planned !== 'boolean' || !['match', 'unrelated', 'unresolved'].includes(input.alertScope)
    || !input.originalRoute?.id?.trim() || !input.originalRoute.label?.trim()
    || !isResolvedDirection(input.direction) || !input.targetExactDirectionalStopId?.trim()
    || !Array.isArray(input.originalDirectionalStopIds) || !Array.isArray(input.liveRemainingStopIds)
    || !Array.isArray(input.pathEvidence)) throw new Error('Complete reroute claim evidence is required');
  if (input.effectiveSupplementedPattern) {
    if (!input.effectiveSupplementedPattern.sourceId?.trim() || !input.effectiveSupplementedPattern.routeId?.trim()
      || !isResolvedDirection(input.effectiveSupplementedPattern.direction)
      || !Array.isArray(input.effectiveSupplementedPattern.orderedDirectionalStopIds)) throw new Error('Invalid effective supplemented pattern');
  }
  for (const proof of input.pathEvidence) {
    if (!proof?.evidenceId?.trim() || !proof.routeId?.trim() || !isResolvedDirection(proof.direction)
      || !Array.isArray(proof.orderedDirectionalStopIds)) throw new Error('Invalid reroute path evidence');
  }
}

function validateTrackInput(input: TrackConflictInput): void {
  if (!input || typeof input !== 'object' || !input.evidenceId?.trim() || !input.routeId?.trim()
    || !isResolvedDirection(input.direction) || !input.conflictStopId?.trim() || !input.targetExactDirectionalStopId?.trim()
    || typeof input.terminal !== 'boolean' || !Array.isArray(input.downstreamExactDirectionalStopIds)
    || !(input.observedAt instanceof Date) || !Number.isFinite(input.observedAt.getTime())) {
    throw new Error('Complete resolved track evidence is required');
  }
}

function coherentOrderedStops(stops: readonly string[]): boolean {
  if (!Array.isArray(stops) || stops.some((item) => !item?.trim())) return false;
  const canonical = stops.map(normalizeCanonicalIdentity);
  return new Set(canonical).size === canonical.length;
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

function trackClaimIdentity(input: TrackConflictInput): string {
  return [input.routeId, input.direction, input.conflictStopId, input.targetExactDirectionalStopId]
    .map(normalizeCanonicalIdentity).join('\0');
}

function freezeTrack(
  kind: TrackConflictDecision['kind'],
  disposition: TrackConflictDecision['disposition'],
  riderCopy: string | null,
  suppressedProducts: readonly ClaimSuppressedProduct[],
  carryover: ServiceRiskCarryover | null,
  carriedForward: boolean,
  recoveryCount: 0 | 1 | 2,
): TrackConflictDecision {
  return Object.freeze({ kind, disposition, riderCopy, suppressedProducts: Object.freeze([...suppressedProducts]),
    carryover, carriedForward, recoveryCount });
}
