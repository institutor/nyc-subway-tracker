import { evaluateExpectedEvidencePair, type ExpectedEvidencePolicy, type ExpectedEvidenceUpdate, type SupportedArrivalRange } from './arrival-confidence';
import type { PrimaryOrderRow, PublicRouteOrderKind } from './arrival-order';
import { canonicalStopCallIdentity } from './train-identity';
import type { Direction, LiveArrival, ExpectedArrival, Provenance, RouteIdentity } from './types';
import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';

export type TypedGateDisposition = 'eligible' | 'resolved-ineligible' | 'high-impact-unresolved' | 'quarantined';

export interface ArrivalBoardScope {
  readonly feedGroupId: string;
  readonly exactStopId: string;
  readonly direction: Direction;
  readonly destination: string;
  readonly comparisonAt: Date;
}

export interface ArrivalStopCallEvidence {
  readonly stopId: string;
  readonly sourceStopSequence?: number | null;
  readonly occurrenceId?: string | null;
  readonly arrivalAt: Date | null;
  readonly departureAt: Date | null;
  readonly scheduleRelationship?: string | null;
}

export type ArrivalCandidateConfidence =
  | { readonly kind: 'live'; readonly supportedRange: SupportedArrivalRange }
  | { readonly kind: 'expected'; readonly updates: readonly ExpectedEvidenceUpdate[]; readonly policy?: ExpectedEvidencePolicy };

export interface ArrivalAdmissionCandidate {
  readonly stableTrainIdentity: string;
  readonly publishedTripId: string;
  readonly patternIdentity: string;
  readonly feedGroupId: string;
  readonly route: RouteIdentity;
  readonly routeOrderKind: PublicRouteOrderKind;
  readonly direction: Direction;
  readonly destination: string;
  readonly remainingStopCalls: readonly ArrivalStopCallEvidence[];
  readonly serviceDisposition: TypedGateDisposition;
  readonly trackDisposition: TypedGateDisposition;
  readonly freshness: 'current' | 'degraded' | 'unavailable' | 'quarantined';
  readonly identityDisposition: 'coherent' | 'ambiguous' | 'duplicate' | 'quarantined';
  readonly recoveryDisposition: 'live-continuity' | 'precision-withheld' | 'hard-suppressed' | 'live-readmission-eligible';
  readonly movementDisposition: 'plausible' | 'holding' | 'uncertain' | 'implausible';
  readonly confidence: ArrivalCandidateConfidence;
  readonly provenance: Provenance;
}

export type AdmissionGate =
  | 'candidate'
  | 'exact-stop'
  | 'destination-direction'
  | 'service'
  | 'track'
  | 'freshness'
  | 'identity-recovery'
  | 'movement-time';

export type ArrivalAdmissionDecision =
  | { readonly kind: 'admitted'; readonly confidence: 'live' | 'expected'; readonly stopCallIdentity: string; readonly row: PrimaryOrderRow }
  | { readonly kind: 'secondary'; readonly confidence: 'holding' | 'uncertain'; readonly failedGate: 'movement-time' }
  | {
      readonly kind: 'rejected';
      readonly failedGate: AdmissionGate;
      readonly disposition: string;
      readonly boardTreatment: 'resolved-suppression' | 'arrival-claim-unavailable' | 'quarantine-or-limitation'
        | 'feed-updating' | 'precision-withheld';
    };

export function admitArrivalCandidate(
  candidate: ArrivalAdmissionCandidate,
  scope: ArrivalBoardScope,
): ArrivalAdmissionDecision {
  validateScope(scope);
  validateCandidate(candidate);
  if (candidate.provenance.observedAt.getTime() > candidate.provenance.retrievedAt.getTime()
    || candidate.provenance.retrievedAt.getTime() > scope.comparisonAt.getTime()) {
    throw new Error('Invalid future or regressed primary arrival provenance');
  }
  if (candidate.feedGroupId !== scope.feedGroupId) return rejected('candidate', 'different-feed-group');

  const exactCalls = candidate.remainingStopCalls.filter((call) => call.stopId === scope.exactStopId
    && call.scheduleRelationship !== 'SKIPPED'
    && call.scheduleRelationship !== 'NO_DATA'
    && eventAt(call, scope.comparisonAt.getTime()) > scope.comparisonAt.getTime());
  if (exactCalls.length === 0) return rejected('exact-stop', 'exact-future-stop-not-confirmed');
  const identified = exactCalls.map((call) => ({ call, identity: canonicalStopCallIdentity(call) }));
  const uniqueIdentities = new Set(identified.map((item) => item.identity));
  if (uniqueIdentities.size !== identified.length) return rejected('exact-stop', 'duplicate-exact-stop-occurrence');
  identified.sort((left, right) => eventAt(left.call, scope.comparisonAt.getTime()) - eventAt(right.call, scope.comparisonAt.getTime())
    || compareCanonicalIdentity(left.identity, right.identity));
  const target = identified[0];

  if (candidate.direction !== scope.direction
    || normalizeCanonicalIdentity(candidate.destination) !== normalizeCanonicalIdentity(scope.destination)) {
    return rejected('destination-direction', 'resolved-board-context-mismatch');
  }
  if (candidate.serviceDisposition !== 'eligible') return rejected('service', candidate.serviceDisposition);
  if (candidate.trackDisposition !== 'eligible') return rejected('track', candidate.trackDisposition);
  if (candidate.freshness !== 'current') return rejected('freshness', candidate.freshness);
  if (candidate.identityDisposition !== 'coherent'
    || candidate.recoveryDisposition === 'precision-withheld'
    || candidate.recoveryDisposition === 'hard-suppressed') {
    return rejected('identity-recovery', `${candidate.identityDisposition}:${candidate.recoveryDisposition}`);
  }
  if (candidate.movementDisposition === 'holding' || candidate.movementDisposition === 'uncertain') {
    return Object.freeze({ kind: 'secondary', confidence: candidate.movementDisposition, failedGate: 'movement-time' });
  }
  if (candidate.movementDisposition !== 'plausible') return rejected('movement-time', candidate.movementDisposition);

  const common = {
    id: candidate.stableTrainIdentity,
    route: Object.freeze({ ...candidate.route }),
    direction: candidate.direction,
    destination: candidate.destination,
    provenance: freezeProvenance(candidate.provenance),
  };
  if (candidate.confidence.kind === 'expected') {
    if (candidate.recoveryDisposition !== 'live-continuity') return rejected('identity-recovery', 'recovery-cannot-restore-expected');
    const expected = evaluateExpectedEvidencePair(candidate.confidence.updates, candidate.confidence.policy);
    const updates = candidate.confidence.updates;
    const provenanceObservedAt = candidate.provenance.observedAt.getTime();
    const expectedMatchesClaim = updates.every((update) =>
      sameIdentity(update.stableTrainIdentity, candidate.stableTrainIdentity)
      && sameIdentity(update.patternIdentity, candidate.patternIdentity)
      && update.direction === candidate.direction
      && update.direction === scope.direction
      && sameIdentity(update.destination, candidate.destination)
      && sameIdentity(update.destination, scope.destination)
      && sameIdentity(update.exactTargetStopCallIdentity, target.identity)
      && sameIdentity(update.feedGroupId, candidate.feedGroupId)
      && sameIdentity(update.feedGroupId, scope.feedGroupId)
      && sameIdentity(update.sourceId, candidate.provenance.sourceId)
      && update.sourceTimestamp.getTime() <= update.observedAt.getTime()
      && update.observedAt.getTime() <= provenanceObservedAt
      && update.observedAt.getTime() <= scope.comparisonAt.getTime());
    if (!expected.eligible || !sameIdentity(expected.stableTrainIdentity, candidate.stableTrainIdentity) || !expectedMatchesClaim) {
      return rejected('movement-time', expected.eligible ? 'expected-claim-or-provenance-mismatch' : expected.reason);
    }
    const estimateAt = rangeCenter(expected.supportedRange);
    const arrival: ExpectedArrival = Object.freeze({ ...common, kind: 'expected', estimateAt, range: expected.supportedRange });
    return Object.freeze({
      kind: 'admitted', confidence: 'expected', stopCallIdentity: target.identity,
      row: freezeRow(candidate, arrival, expected.supportedRange),
    });
  }
  const arrival: LiveArrival = Object.freeze({ ...common, kind: 'live', at: new Date(eventAt(target.call, scope.comparisonAt.getTime())) });
  return Object.freeze({
    kind: 'admitted', confidence: 'live', stopCallIdentity: target.identity,
    row: freezeRow(candidate, arrival, candidate.confidence.supportedRange),
  });
}

function validateScope(scope: ArrivalBoardScope): void {
  if (!scope || typeof scope !== 'object' || !scope.feedGroupId || !scope.exactStopId || !scope.destination || !isResolvedDirection(scope.direction)) {
    throw new Error('Exact resolved arrival board scope is required');
  }
  validDate(scope.comparisonAt, 'board comparison instant');
}

function validateCandidate(candidate: ArrivalAdmissionCandidate): void {
  if (!candidate || typeof candidate !== 'object' || !candidate.stableTrainIdentity || !candidate.publishedTripId
    || !candidate.patternIdentity || !candidate.feedGroupId || !candidate.route?.id || !candidate.route.label || !candidate.destination
    || !candidate.provenance || typeof candidate.provenance !== 'object') {
    throw new Error('Complete arrival candidate identity is required');
  }
  if (!isResolvedDirection(candidate.direction)) throw new Error('A resolved direction is required');
  if (!Array.isArray(candidate.remainingStopCalls)) throw new Error('Ordered remaining stop calls are required');
  for (const call of candidate.remainingStopCalls) {
    if (!call.stopId || (call.arrivalAt === null && call.departureAt === null)) throw new Error('Complete remaining stop call is required');
    if (call.arrivalAt !== null) validDate(call.arrivalAt, 'stop arrival instant');
    if (call.departureAt !== null) validDate(call.departureAt, 'stop departure instant');
    if (call.arrivalAt && call.departureAt && call.departureAt < call.arrivalAt) throw new Error('Stop departure precedes arrival');
  }
  if (!['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(candidate.serviceDisposition)
    || !['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(candidate.trackDisposition)) {
    throw new Error('Typed service and track gate dispositions are required');
  }
  if (!['current', 'degraded', 'unavailable', 'quarantined'].includes(candidate.freshness)
    || !['coherent', 'ambiguous', 'duplicate', 'quarantined'].includes(candidate.identityDisposition)
    || !['live-continuity', 'precision-withheld', 'hard-suppressed', 'live-readmission-eligible'].includes(candidate.recoveryDisposition)
    || !['plausible', 'holding', 'uncertain', 'implausible'].includes(candidate.movementDisposition)
    || !['numbered', 'lettered', 'shuttle', 'other'].includes(candidate.routeOrderKind)) {
    throw new Error('Invalid arrival gate disposition');
  }
  for (const call of candidate.remainingStopCalls) {
    if (call.scheduleRelationship != null
      && !['SCHEDULED', 'UNSCHEDULED', 'SKIPPED', 'NO_DATA'].includes(call.scheduleRelationship)) {
      throw new Error('Invalid stop-call schedule relationship');
    }
  }
  validDate(candidate.provenance.observedAt, 'candidate observation instant');
  validDate(candidate.provenance.retrievedAt, 'candidate retrieval instant');
  if (!candidate.provenance.sourceId || !['regular-gtfs', 'supplemented-gtfs', 'gtfs-rt', 'alerts', 'entrances', 'equipment'].includes(candidate.provenance.source)) {
    throw new Error('Invalid candidate provenance');
  }
  if (candidate.provenance.source !== 'gtfs-rt') throw new Error('Invalid primary arrival provenance; GTFS-RT is required');
  if (!candidate.confidence || !['live', 'expected'].includes(candidate.confidence.kind)) throw new Error('Invalid arrival confidence kind');
  if (candidate.confidence.kind === 'live') {
    validateSupportedRange(candidate.confidence.supportedRange);
  } else if (!Array.isArray(candidate.confidence.updates)) {
    throw new Error('Expected confidence updates are required');
  }
}

function validateSupportedRange(range: SupportedArrivalRange): void {
  if (!range || typeof range !== 'object') throw new Error('Invalid confidence supported range');
  if (validDate(range.endsAt, 'supported range end') < validDate(range.startsAt, 'supported range start')) {
    throw new Error('Supported range ends before start');
  }
}

function isResolvedDirection(value: Direction): boolean {
  return ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(value);
}

function sameIdentity(left: string, right: string): boolean {
  return normalizeCanonicalIdentity(left) === normalizeCanonicalIdentity(right);
}

function eventAt(call: ArrivalStopCallEvidence, comparisonAt: number): number {
  const arrival = call.arrivalAt?.getTime();
  if (arrival !== undefined && arrival > comparisonAt) return arrival;
  return call.departureAt?.getTime() ?? arrival ?? Number.NEGATIVE_INFINITY;
}

function rejected(failedGate: AdmissionGate, disposition: string): ArrivalAdmissionDecision {
  let boardTreatment: Extract<ArrivalAdmissionDecision, { kind: 'rejected' }>['boardTreatment'];
  if ((failedGate === 'service' || failedGate === 'track') && disposition === 'resolved-ineligible') {
    boardTreatment = 'resolved-suppression';
  } else if ((failedGate === 'service' || failedGate === 'track') && disposition === 'high-impact-unresolved') {
    boardTreatment = 'arrival-claim-unavailable';
  } else if (failedGate === 'freshness' && disposition === 'degraded') {
    boardTreatment = 'feed-updating';
  } else if (failedGate === 'identity-recovery' && disposition.includes('hard-suppressed')) {
    boardTreatment = 'resolved-suppression';
  } else if (failedGate === 'freshness' || failedGate === 'identity-recovery') {
    boardTreatment = 'precision-withheld';
  } else {
    boardTreatment = 'quarantine-or-limitation';
  }
  return Object.freeze({ kind: 'rejected', failedGate, disposition, boardTreatment });
}

function freezeRow(candidate: ArrivalAdmissionCandidate, arrival: LiveArrival | ExpectedArrival, range: SupportedArrivalRange): PrimaryOrderRow {
  const start = validDate(range.startsAt, 'supported range start');
  const end = validDate(range.endsAt, 'supported range end');
  if (end < start) throw new Error('Supported range ends before start');
  return Object.freeze({
    stableTrainIdentity: candidate.stableTrainIdentity,
    routeOrderKind: candidate.routeOrderKind,
    supportedRange: Object.freeze({ startsAt: new Date(start), endsAt: new Date(end) }),
    arrival,
  });
}

function rangeCenter(range: SupportedArrivalRange): Date {
  return new Date(range.startsAt.getTime() + (range.endsAt.getTime() - range.startsAt.getTime()) / 2);
}

function freezeProvenance(provenance: Provenance): Provenance {
  return Object.freeze({ ...provenance, observedAt: new Date(provenance.observedAt), retrievedAt: new Date(provenance.retrievedAt) });
}

function validDate(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
