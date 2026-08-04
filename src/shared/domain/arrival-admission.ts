import { evaluateExpectedEvidencePair, type ExpectedEvidencePolicy, type ExpectedEvidenceUpdate, type SupportedArrivalRange } from './arrival-confidence';
import type { PrimaryOrderRow, PublicRouteOrderKind } from './arrival-order';
import { canonicalStopCallIdentity } from './train-identity';
import type { Direction, LiveArrival, ExpectedArrival, Provenance, RouteIdentity } from './types';
import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';
import {
  validateServiceChangeDecision,
  type ServiceChangeDecision,
} from './service-impact';
import { captureDateEpochMilliseconds } from './temporal';

export type TypedGateDisposition = 'eligible' | 'resolved-ineligible' | 'high-impact-unresolved' | 'quarantined';

export interface ArrivalBoardScope {
  readonly feedGroupId: string;
  readonly exactStopId: string;
  readonly direction: Direction;
  readonly destination: string;
  readonly comparisonAt: Date;
  /** Exact alert assessment captured once for this board computation. */
  readonly serviceAssessmentAt?: Date;
  /** Stable identity of the exact alert snapshot used by this board. */
  readonly serviceAlertContextIdentity?: string;
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
  /** Structured Task 8 gate. When present it is evaluated before every feed-confidence gate. */
  readonly serviceChangeGate?: ServiceChangeDecision;
  /** Immutable claim identity used to prove the structured service gate belongs to this candidate. */
  readonly serviceClaimId?: string;
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
      readonly riderCopy?: string;
      readonly serviceChange?: ServiceChangeDecision;
    };

interface CapturedBoardEpoch {
  readonly comparisonAtMs: number;
  readonly serviceAssessmentAtMs: number | null;
  readonly serviceAlertContextIdentity: string | null;
}

interface CapturedSupportedRange {
  readonly startsAtMs: number;
  readonly endsAtMs: number;
  readonly centerAtMs: number;
}

interface CapturedStopCallEvidence {
  readonly stopId: string;
  readonly sourceStopSequence?: number | null;
  readonly occurrenceId?: string | null;
  readonly scheduleRelationship?: string | null;
  readonly arrivalAtMs: number | null;
  readonly departureAtMs: number | null;
}

type CapturedExpectedEvidenceUpdate = Omit<ExpectedEvidenceUpdate,
  'sourceTimestamp' | 'observedAt' | 'supportedRange'> & {
    readonly sourceTimestampMs: number;
    readonly observedAtMs: number;
    readonly supportedRange: CapturedSupportedRange;
  };

type CapturedCandidateConfidence =
  | { readonly kind: 'live'; readonly supportedRange: CapturedSupportedRange }
  | {
      readonly kind: 'expected';
      readonly updates: readonly CapturedExpectedEvidenceUpdate[];
      readonly rangeStable: NonNullable<ExpectedEvidencePolicy['rangeStable']> | null;
    };

interface CapturedCandidateProvenance {
  readonly source: Provenance['source'];
  readonly sourceId: string;
  readonly observedAtMs: number;
  readonly retrievedAtMs: number;
  readonly version?: string;
}

interface CapturedArrivalAdmissionCandidate {
  readonly stableTrainIdentity: string;
  readonly publishedTripId: string;
  readonly patternIdentity: string;
  readonly feedGroupId: string;
  readonly route: Readonly<RouteIdentity>;
  readonly routeOrderKind: PublicRouteOrderKind;
  readonly direction: Direction;
  readonly destination: string;
  readonly remainingStopCalls: readonly CapturedStopCallEvidence[];
  readonly serviceChangeGate?: ServiceChangeDecision;
  readonly serviceClaimId?: string;
  readonly serviceDisposition: TypedGateDisposition;
  readonly trackDisposition: TypedGateDisposition;
  readonly freshness: ArrivalAdmissionCandidate['freshness'];
  readonly identityDisposition: ArrivalAdmissionCandidate['identityDisposition'];
  readonly recoveryDisposition: ArrivalAdmissionCandidate['recoveryDisposition'];
  readonly movementDisposition: ArrivalAdmissionCandidate['movementDisposition'];
  readonly confidence: CapturedCandidateConfidence;
  readonly provenance: CapturedCandidateProvenance;
}

export function admitArrivalCandidate(
  candidate: ArrivalAdmissionCandidate,
  scope: ArrivalBoardScope,
): ArrivalAdmissionDecision {
  const boardEpoch = validateScope(scope);
  const captured = validateCandidate(candidate);
  if (captured.provenance.observedAtMs > captured.provenance.retrievedAtMs
    || captured.provenance.retrievedAtMs > boardEpoch.comparisonAtMs) {
    throw new Error('Invalid future or regressed primary arrival provenance');
  }
  if (captured.feedGroupId !== scope.feedGroupId) return rejected('candidate', 'different-feed-group');

  const exactCalls = captured.remainingStopCalls.filter((call) => call.stopId === scope.exactStopId
    && call.scheduleRelationship !== 'SKIPPED'
    && call.scheduleRelationship !== 'NO_DATA'
    && eventAt(call, boardEpoch.comparisonAtMs) > boardEpoch.comparisonAtMs);
  if (exactCalls.length === 0) return rejected('exact-stop', 'exact-future-stop-not-confirmed');
  const identified = exactCalls.map((call) => ({ call, identity: canonicalStopCallIdentity(call) }));
  const uniqueIdentities = new Set(identified.map((item) => item.identity));
  if (uniqueIdentities.size !== identified.length) return rejected('exact-stop', 'duplicate-exact-stop-occurrence');
  identified.sort((left, right) => eventAt(left.call, boardEpoch.comparisonAtMs) - eventAt(right.call, boardEpoch.comparisonAtMs)
    || compareCanonicalIdentity(left.identity, right.identity));
  const target = identified[0];

  if (captured.direction !== scope.direction
    || normalizeCanonicalIdentity(captured.destination) !== normalizeCanonicalIdentity(scope.destination)) {
    return rejected('destination-direction', 'resolved-board-context-mismatch');
  }
  const serviceGateBinding = captured.serviceChangeGate
    ? bindServiceChangeGate(captured.serviceChangeGate, captured, scope, boardEpoch)
    : 'absent';
  const structuredServiceDisposition = serviceGateBinding === 'mismatch' || serviceGateBinding === 'epoch-mismatch'
    || serviceGateBinding === 'unissued'
    ? 'quarantined'
    : serviceGateBinding === 'bound' ? captured.serviceChangeGate!.disposition : 'eligible';
  const serviceDisposition = worseDisposition(structuredServiceDisposition, captured.serviceDisposition);
  if (dispositionRank(captured.trackDisposition) > dispositionRank(serviceDisposition)) {
    return rejected('track', captured.trackDisposition);
  }
  if (serviceDisposition !== 'eligible') {
    if (serviceGateBinding === 'unissued' && serviceDisposition === 'quarantined') {
      return rejected('service', 'unissued-service-decision');
    }
    if (serviceGateBinding === 'mismatch' && serviceDisposition === 'quarantined') {
      return rejected('service', 'claim-scope-mismatch');
    }
    if (serviceGateBinding === 'epoch-mismatch' && serviceDisposition === 'quarantined') {
      return rejected('service', 'service-assessment-mismatch');
    }
    if (captured.serviceChangeGate && serviceGateBinding === 'bound' && structuredServiceDisposition === serviceDisposition) {
      return rejectedServiceChange(captured.serviceChangeGate);
    }
    return rejected('service', serviceDisposition);
  }
  if (captured.trackDisposition !== 'eligible') return rejected('track', captured.trackDisposition);
  if (captured.freshness !== 'current') return rejected('freshness', captured.freshness);
  if (captured.identityDisposition !== 'coherent'
    || captured.recoveryDisposition === 'precision-withheld'
    || captured.recoveryDisposition === 'hard-suppressed') {
    return rejected('identity-recovery', `${captured.identityDisposition}:${captured.recoveryDisposition}`);
  }
  if (captured.movementDisposition === 'holding' || captured.movementDisposition === 'uncertain') {
    return Object.freeze({ kind: 'secondary', confidence: captured.movementDisposition, failedGate: 'movement-time' });
  }
  if (captured.movementDisposition !== 'plausible') return rejected('movement-time', captured.movementDisposition);

  const common = {
    id: captured.stableTrainIdentity,
    route: captured.route,
    direction: captured.direction,
    destination: captured.destination,
    provenance: freezeProvenance(captured.provenance),
  };
  if (captured.confidence.kind === 'expected') {
    if (captured.recoveryDisposition !== 'live-continuity') return rejected('identity-recovery', 'recovery-cannot-restore-expected');
    const expected = evaluateCapturedExpectedEvidence(captured.confidence);
    const updates = captured.confidence.updates;
    const provenanceObservedAt = captured.provenance.observedAtMs;
    const expectedMatchesClaim = updates.every((update) =>
      sameIdentity(update.stableTrainIdentity, captured.stableTrainIdentity)
      && sameIdentity(update.patternIdentity, captured.patternIdentity)
      && update.direction === captured.direction
      && update.direction === scope.direction
      && sameIdentity(update.destination, captured.destination)
      && sameIdentity(update.destination, scope.destination)
      && sameIdentity(update.exactTargetStopCallIdentity, target.identity)
      && sameIdentity(update.feedGroupId, captured.feedGroupId)
      && sameIdentity(update.feedGroupId, scope.feedGroupId)
      && sameIdentity(update.sourceId, captured.provenance.sourceId)
      && update.sourceTimestampMs <= update.observedAtMs
      && update.observedAtMs <= provenanceObservedAt
      && update.observedAtMs <= boardEpoch.comparisonAtMs);
    if (!expected.eligible || !sameIdentity(expected.stableTrainIdentity, captured.stableTrainIdentity) || !expectedMatchesClaim) {
      return rejected('movement-time', expected.eligible ? 'expected-claim-or-provenance-mismatch' : expected.reason);
    }
    const supportedRange = updates[1].supportedRange;
    const arrival: ExpectedArrival = Object.freeze({
      ...common,
      kind: 'expected',
      estimateAt: new Date(supportedRange.centerAtMs),
      range: freezeSupportedRange(supportedRange),
    });
    return Object.freeze({
      kind: 'admitted', confidence: 'expected', stopCallIdentity: target.identity,
      row: freezeRow(captured, arrival, supportedRange),
    });
  }
  const liveEventAt = eventAt(target.call, boardEpoch.comparisonAtMs);
  if (liveEventAt < captured.confidence.supportedRange.startsAtMs
    || liveEventAt > captured.confidence.supportedRange.endsAtMs) {
    return rejected('movement-time', 'live-event-outside-supported-range');
  }
  const arrival: LiveArrival = Object.freeze({ ...common, kind: 'live', at: new Date(liveEventAt) });
  return Object.freeze({
    kind: 'admitted', confidence: 'live', stopCallIdentity: target.identity,
    row: freezeRow(captured, arrival, captured.confidence.supportedRange),
  });
}

function validateScope(scope: ArrivalBoardScope): CapturedBoardEpoch {
  if (!scope || typeof scope !== 'object' || !scope.feedGroupId || !scope.exactStopId || !scope.destination || !isResolvedDirection(scope.direction)) {
    throw new Error('Exact resolved arrival board scope is required');
  }
  const comparisonAt = scope.comparisonAt;
  const serviceAssessmentAt = scope.serviceAssessmentAt;
  const serviceAlertContextIdentity = scope.serviceAlertContextIdentity;
  const comparisonAtMs = captureDateEpochMilliseconds(comparisonAt, 'board comparison instant');
  const hasServiceAssessmentAt = serviceAssessmentAt !== undefined;
  const hasServiceContextIdentity = serviceAlertContextIdentity !== undefined;
  if (hasServiceAssessmentAt !== hasServiceContextIdentity) throw new Error('Incomplete board service assessment epoch');
  if (hasServiceAssessmentAt) {
    const serviceAssessmentAtMs = captureDateEpochMilliseconds(serviceAssessmentAt, 'board service assessment instant');
    if (serviceAssessmentAtMs !== comparisonAtMs
      || typeof serviceAlertContextIdentity !== 'string' || !serviceAlertContextIdentity) {
      throw new Error('Invalid board service assessment epoch');
    }
    return Object.freeze({ comparisonAtMs, serviceAssessmentAtMs, serviceAlertContextIdentity });
  }
  return Object.freeze({ comparisonAtMs, serviceAssessmentAtMs: null, serviceAlertContextIdentity: null });
}

function validateCandidate(candidate: ArrivalAdmissionCandidate): CapturedArrivalAdmissionCandidate {
  if (!candidate || typeof candidate !== 'object') throw new Error('Complete arrival candidate identity is required');
  const stableTrainIdentity = candidate.stableTrainIdentity;
  const publishedTripId = candidate.publishedTripId;
  const patternIdentity = candidate.patternIdentity;
  const feedGroupId = candidate.feedGroupId;
  const routeValue = candidate.route;
  const routeId = routeValue?.id;
  const routeLabel = routeValue?.label;
  const destination = candidate.destination;
  const provenanceValue = candidate.provenance;
  if (!stableTrainIdentity || !publishedTripId || !patternIdentity || !feedGroupId || !routeId || !routeLabel || !destination
    || !provenanceValue || typeof provenanceValue !== 'object') {
    throw new Error('Complete arrival candidate identity is required');
  }
  const direction = candidate.direction;
  const remainingStopCallsValue = candidate.remainingStopCalls;
  const serviceChangeGate = candidate.serviceChangeGate;
  const serviceClaimId = candidate.serviceClaimId;
  const serviceDisposition = candidate.serviceDisposition;
  const trackDisposition = candidate.trackDisposition;
  const freshness = candidate.freshness;
  const identityDisposition = candidate.identityDisposition;
  const recoveryDisposition = candidate.recoveryDisposition;
  const movementDisposition = candidate.movementDisposition;
  const routeOrderKind = candidate.routeOrderKind;
  const confidenceValue = candidate.confidence;
  if (!isResolvedDirection(direction)) throw new Error('A resolved direction is required');
  if (!Array.isArray(remainingStopCallsValue)) throw new Error('Ordered remaining stop calls are required');
  const remainingStopCalls = remainingStopCallsValue.map(captureStopCall);
  if (!['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(serviceDisposition)
    || !['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(trackDisposition)) {
    throw new Error('Typed service and track gate dispositions are required');
  }
  if (serviceClaimId !== undefined && !serviceClaimId.trim()) {
    throw new Error('Invalid service claim identity');
  }
  if (!['current', 'degraded', 'unavailable', 'quarantined'].includes(freshness)
    || !['coherent', 'ambiguous', 'duplicate', 'quarantined'].includes(identityDisposition)
    || !['live-continuity', 'precision-withheld', 'hard-suppressed', 'live-readmission-eligible'].includes(recoveryDisposition)
    || !['plausible', 'holding', 'uncertain', 'implausible'].includes(movementDisposition)
    || !['numbered', 'lettered', 'shuttle', 'other'].includes(routeOrderKind)) {
    throw new Error('Invalid arrival gate disposition');
  }
  const source = provenanceValue.source;
  const sourceId = provenanceValue.sourceId;
  const observedAtValue = provenanceValue.observedAt;
  const retrievedAtValue = provenanceValue.retrievedAt;
  const version = provenanceValue.version;
  const observedAtMs = captureDateEpochMilliseconds(observedAtValue, 'candidate observation instant');
  const retrievedAtMs = captureDateEpochMilliseconds(retrievedAtValue, 'candidate retrieval instant');
  if (!sourceId || !['regular-gtfs', 'supplemented-gtfs', 'gtfs-rt', 'alerts', 'entrances', 'equipment'].includes(source)) {
    throw new Error('Invalid candidate provenance');
  }
  if (source !== 'gtfs-rt') throw new Error('Invalid primary arrival provenance; GTFS-RT is required');
  if (!confidenceValue || !['live', 'expected'].includes(confidenceValue.kind)) throw new Error('Invalid arrival confidence kind');
  const confidence: CapturedCandidateConfidence = confidenceValue.kind === 'live'
    ? Object.freeze({ kind: 'live', supportedRange: captureSupportedRange(confidenceValue.supportedRange, 'supported range') })
    : captureExpectedConfidence(confidenceValue);
  const provenance = Object.freeze({
    source,
    sourceId,
    observedAtMs,
    retrievedAtMs,
    ...(version === undefined ? {} : { version }),
  });
  return Object.freeze({
    stableTrainIdentity,
    publishedTripId,
    patternIdentity,
    feedGroupId,
    route: Object.freeze({ id: routeId, label: routeLabel }),
    routeOrderKind,
    direction,
    destination,
    remainingStopCalls: Object.freeze(remainingStopCalls),
    ...(serviceChangeGate === undefined ? {} : { serviceChangeGate }),
    ...(serviceClaimId === undefined ? {} : { serviceClaimId }),
    serviceDisposition,
    trackDisposition,
    freshness,
    identityDisposition,
    recoveryDisposition,
    movementDisposition,
    confidence,
    provenance,
  });
}

function captureStopCall(call: ArrivalStopCallEvidence): CapturedStopCallEvidence {
  if (!call || typeof call !== 'object') throw new Error('Complete remaining stop call is required');
  const stopId = call.stopId;
  const sourceStopSequence = call.sourceStopSequence;
  const occurrenceId = call.occurrenceId;
  const arrivalAtValue = call.arrivalAt;
  const departureAtValue = call.departureAt;
  const scheduleRelationship = call.scheduleRelationship;
  if (!stopId || (arrivalAtValue === null && departureAtValue === null)) throw new Error('Complete remaining stop call is required');
  const arrivalAtMs = arrivalAtValue === null ? null
    : captureDateEpochMilliseconds(arrivalAtValue, 'stop arrival instant');
  const departureAtMs = departureAtValue === null ? null
    : captureDateEpochMilliseconds(departureAtValue, 'stop departure instant');
  if (arrivalAtMs !== null && departureAtMs !== null && departureAtMs < arrivalAtMs) {
    throw new Error('Stop departure precedes arrival');
  }
  if (scheduleRelationship != null
    && !['SCHEDULED', 'UNSCHEDULED', 'SKIPPED', 'NO_DATA'].includes(scheduleRelationship)) {
    throw new Error('Invalid stop-call schedule relationship');
  }
  return Object.freeze({ stopId, sourceStopSequence, occurrenceId, scheduleRelationship, arrivalAtMs, departureAtMs });
}

function captureExpectedConfidence(
  confidence: Extract<ArrivalCandidateConfidence, { readonly kind: 'expected' }>,
): CapturedCandidateConfidence {
  const updatesValue = confidence.updates;
  const policyValue = confidence.policy;
  if (!Array.isArray(updatesValue)) throw new Error('Expected confidence updates are required');
  if (policyValue !== undefined && (!policyValue || typeof policyValue !== 'object')) {
    throw new Error('Invalid Expected evidence policy');
  }
  const rangeStable = policyValue?.rangeStable;
  if (rangeStable !== undefined && typeof rangeStable !== 'function') throw new Error('Invalid Expected evidence policy');
  return Object.freeze({
    kind: 'expected',
    updates: Object.freeze(updatesValue.map(captureExpectedUpdate)),
    rangeStable: rangeStable ?? null,
  });
}

function captureExpectedUpdate(update: ExpectedEvidenceUpdate): CapturedExpectedEvidenceUpdate {
  if (!update || typeof update !== 'object') throw new Error('Incomplete Expected evidence update');
  const evidenceId = update.evidenceId;
  const sourceTimestampValue = update.sourceTimestamp;
  const observedAtValue = update.observedAt;
  const feedGroupId = update.feedGroupId;
  const sourceId = update.sourceId;
  const stableTrainIdentity = update.stableTrainIdentity;
  const patternIdentity = update.patternIdentity;
  const direction = update.direction;
  const destination = update.destination;
  const exactTargetStopCallIdentity = update.exactTargetStopCallIdentity;
  const assignedPhysicalTrain = update.assignedPhysicalTrain;
  const atOrigin = update.atOrigin;
  const movementObserved = update.movementObserved;
  const overdueVerdict = update.overdueVerdict;
  const supportedRangeValue = update.supportedRange;
  const accepted = update.accepted;
  const sourceTimestampMs = captureDateEpochMilliseconds(sourceTimestampValue, 'Expected source timestamp');
  const observedAtMs = captureDateEpochMilliseconds(observedAtValue, 'Expected observation timestamp');
  if (sourceTimestampMs > observedAtMs) throw new Error('Expected source timestamp cannot follow observation');
  return Object.freeze({
    evidenceId,
    sourceTimestampMs,
    observedAtMs,
    feedGroupId,
    sourceId,
    stableTrainIdentity,
    patternIdentity,
    direction,
    destination,
    exactTargetStopCallIdentity,
    assignedPhysicalTrain,
    atOrigin,
    movementObserved,
    overdueVerdict,
    supportedRange: captureSupportedRange(supportedRangeValue, 'Expected supported range'),
    accepted,
  });
}

function captureSupportedRange(range: SupportedArrivalRange, label: string): CapturedSupportedRange {
  if (!range || typeof range !== 'object') throw new Error(`Invalid ${label}`);
  const startsAtValue = range.startsAt;
  const endsAtValue = range.endsAt;
  const startsAtMs = captureDateEpochMilliseconds(startsAtValue, `${label} start`);
  const endsAtMs = captureDateEpochMilliseconds(endsAtValue, `${label} end`);
  if (endsAtMs < startsAtMs) throw new Error(`${label} ends before start`);
  return Object.freeze({
    startsAtMs,
    endsAtMs,
    centerAtMs: Math.trunc(startsAtMs / 2 + endsAtMs / 2),
  });
}

function bindServiceChangeGate(
  gate: ServiceChangeDecision,
  candidate: CapturedArrivalAdmissionCandidate,
  scope: ArrivalBoardScope,
  boardEpoch: CapturedBoardEpoch,
): 'bound' | 'mismatch' | 'epoch-mismatch' | 'unissued' {
  try {
    validateServiceChangeDecision(gate);
  } catch {
    // Do not inspect any attacker-controlled public fields after provenance
    // validation fails; Proxy traps and forged discriminants are untrusted.
    return 'unissued';
  }

  if (boardEpoch.serviceAssessmentAtMs === null
    || boardEpoch.serviceAssessmentAtMs !== gate.assessedAtMs
    || boardEpoch.serviceAlertContextIdentity !== gate.alertContextIdentity) return 'epoch-mismatch';

  const claim = gate.evaluatedClaim;
  const matches = candidate.serviceClaimId !== undefined
    && sameIdentity(claim.claimId, candidate.serviceClaimId)
    && sameIdentity(claim.routeId, candidate.route.id)
    && sameIdentity(claim.exactDirectionalStopId, scope.exactStopId)
    && claim.direction === candidate.direction
    && claim.direction === scope.direction
    && claim.tripId !== undefined
    && sameIdentity(claim.tripId, candidate.publishedTripId)
    && claim.trainId !== undefined
    && sameIdentity(claim.trainId, candidate.stableTrainIdentity);
  return matches ? 'bound' : 'mismatch';
}

function evaluateCapturedExpectedEvidence(
  confidence: Extract<CapturedCandidateConfidence, { readonly kind: 'expected' }>,
) {
  const trustedUpdates = confidence.updates.map(projectExpectedUpdate);
  const policy: ExpectedEvidencePolicy = confidence.rangeStable === null ? {} : Object.freeze({
    rangeStable: () => {
      const prior = confidence.updates[0];
      const current = confidence.updates[1];
      if (!prior || !current) throw new Error('Expected range-stability policy requires two captured updates');
      return confidence.rangeStable!(freezeSupportedRange(prior.supportedRange), freezeSupportedRange(current.supportedRange));
    },
  });
  return evaluateExpectedEvidencePair(trustedUpdates, policy);
}

function projectExpectedUpdate(update: CapturedExpectedEvidenceUpdate): ExpectedEvidenceUpdate {
  return Object.freeze({
    evidenceId: update.evidenceId,
    sourceTimestamp: new Date(update.sourceTimestampMs),
    observedAt: new Date(update.observedAtMs),
    feedGroupId: update.feedGroupId,
    sourceId: update.sourceId,
    stableTrainIdentity: update.stableTrainIdentity,
    patternIdentity: update.patternIdentity,
    direction: update.direction,
    destination: update.destination,
    exactTargetStopCallIdentity: update.exactTargetStopCallIdentity,
    assignedPhysicalTrain: update.assignedPhysicalTrain,
    atOrigin: update.atOrigin,
    movementObserved: update.movementObserved,
    overdueVerdict: update.overdueVerdict,
    supportedRange: freezeSupportedRange(update.supportedRange),
    accepted: update.accepted,
  });
}

function isResolvedDirection(value: Direction): boolean {
  return ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(value);
}

function sameIdentity(left: string, right: string): boolean {
  return normalizeCanonicalIdentity(left) === normalizeCanonicalIdentity(right);
}

function eventAt(call: CapturedStopCallEvidence, comparisonAt: number): number {
  if (call.arrivalAtMs !== null && call.arrivalAtMs > comparisonAt) return call.arrivalAtMs;
  return call.departureAtMs ?? call.arrivalAtMs ?? Number.NEGATIVE_INFINITY;
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

function rejectedServiceChange(serviceChange: ServiceChangeDecision): ArrivalAdmissionDecision {
  const boardTreatment = serviceChange.disposition === 'resolved-ineligible'
    ? 'resolved-suppression' as const
    : serviceChange.disposition === 'high-impact-unresolved'
      ? 'arrival-claim-unavailable' as const
      : 'quarantine-or-limitation' as const;
  return Object.freeze({
    kind: 'rejected' as const,
    failedGate: 'service' as const,
    disposition: serviceChange.disposition,
    boardTreatment,
    ...(serviceChange.riderCopy ? { riderCopy: serviceChange.riderCopy } : {}),
    serviceChange,
  });
}

function worseDisposition(left: TypedGateDisposition, right: TypedGateDisposition): TypedGateDisposition {
  return dispositionRank(left) >= dispositionRank(right) ? left : right;
}

function dispositionRank(disposition: TypedGateDisposition): number {
  return { eligible: 0, quarantined: 1, 'high-impact-unresolved': 2, 'resolved-ineligible': 3 }[disposition];
}

function freezeRow(
  candidate: CapturedArrivalAdmissionCandidate,
  arrival: LiveArrival | ExpectedArrival,
  range: CapturedSupportedRange,
): PrimaryOrderRow {
  return Object.freeze({
    stableTrainIdentity: candidate.stableTrainIdentity,
    routeOrderKind: candidate.routeOrderKind,
    supportedRange: freezeSupportedRange(range),
    arrival,
  });
}

function freezeSupportedRange(range: CapturedSupportedRange): SupportedArrivalRange {
  return Object.freeze({ startsAt: new Date(range.startsAtMs), endsAt: new Date(range.endsAtMs) });
}

function freezeProvenance(provenance: CapturedCandidateProvenance): Provenance {
  return Object.freeze({
    source: provenance.source,
    sourceId: provenance.sourceId,
    observedAt: new Date(provenance.observedAtMs),
    retrievedAt: new Date(provenance.retrievedAtMs),
    ...(provenance.version === undefined ? {} : { version: provenance.version }),
  });
}
