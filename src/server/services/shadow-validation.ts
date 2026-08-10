import { createHash } from 'node:crypto';

import { admitArrivalCandidate } from '../../shared/domain/arrival-admission';
import { classifyAlertSnapshot, type AlertSnapshotInput, type DeclaredServiceConsequence, type ServiceAlertEvidence, type StructuredAlertEffect } from '../../shared/domain/alert-scope';
import { encodeCanonicalStringTuple } from '../../shared/domain/canonical';
import { FeedHealthGovernor, type FeedHealthDecision } from '../../shared/domain/feed-health';
import { evaluateServiceChanges, type ServiceChangeDecision } from '../../shared/domain/service-impact';
import { canonicalStopCallIdentity } from '../../shared/domain/train-identity';
import type { AlertSnapshot, NormalizedAlert } from '../gtfs/alert-loader';
import type { NormalizedTripUpdate, RealtimeSnapshot } from '../gtfs/realtime-normalizer';
import { canonicalShadowClaimIdentity, MAX_SHADOW_COMPARISON_INTERVAL_MS, type ShadowProgressClaim, type ShadowProgressRecord, type ShadowSuppressionReason } from './shadow-progress';

export type ShadowClaim = ShadowProgressClaim;

export interface AcceptedShadowRealtimeSource {
  readonly sourceId: string; readonly role: 'subway-realtime'; readonly outcome: 'accepted'; readonly reasonCode: 'SOURCE_ACCEPTED';
  readonly feedGroupId: string; readonly observedAt: string; readonly retrievedAt: string; readonly sha256: string;
}
export type ShadowAlertSource = {
  readonly sourceId: 'subway-alerts'; readonly role: 'subway-alerts'; readonly outcome: 'accepted'; readonly reasonCode: 'SOURCE_ACCEPTED';
  readonly observedAt: string; readonly retrievedAt: string; readonly sha256: string;
} | {
  readonly sourceId: 'subway-alerts'; readonly role: 'subway-alerts'; readonly outcome: 'failed';
  readonly reasonCode: 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED';
};

export function projectShadowClaims(input: {
  readonly snapshot: RealtimeSnapshot; readonly sourceRecord: AcceptedShadowRealtimeSource;
  readonly alertSnapshot: AlertSnapshot | null; readonly alertSourceRecord: ShadowAlertSource;
  readonly priorRecord?: Pick<ShadowProgressRecord, 'decisionTime' | 'recordedAt' | 'claims'>;
  readonly decisionTime: Date;
}): readonly ShadowClaim[] {
  assertSourceOwnership(input.snapshot, input.sourceRecord);
  const alertEvidence = alertDecisionFor(input.alertSnapshot, input.alertSourceRecord, input.decisionTime);
  const feedHealth = new FeedHealthGovernor().observe(input.snapshot, input.decisionTime);
  const claims: ShadowClaim[] = [];
  for (const update of input.snapshot.tripUpdates) {
    if (claims.length >= 500) break;
    claims.push(...projectUpdateClaims(input, update, feedHealth, alertEvidence).slice(0, 500 - claims.length));
  }
  return Object.freeze(claims);
}

function projectUpdateClaims(
  input: Parameters<typeof projectShadowClaims>[0], update: NormalizedTripUpdate, feedHealth: FeedHealthDecision,
  alertEvidence: ReturnType<typeof alertDecisionFor>,
): readonly ShadowClaim[] {
  const stops = update.remainingStopCalls;
  if (stops.length === 0 || stops.length > 64 || update.trip.routeId === null) return [];
  const routeId = update.trip.routeId; const direction = directionFor(update.trip.directionId);
  if (direction === null) return [];
  let stopCallIdentities: readonly string[];
  try { stopCallIdentities = stops.map(canonicalStopCallIdentity); } catch { return []; }
  const terminalDestinationStopId = stops.at(-1)!.stopId;
  const serviceDate = /^\d{8}$/u.test(update.trip.startDate ?? '') ? update.trip.startDate : null;
  const serviceInstanceId = serviceIdentity(update, serviceDate);
  return stops.flatMap((target, targetIndex): readonly ShadowClaim[] => {
    const targetStopCallIdentity = stopCallIdentities[targetIndex]; const remainingStopCallIdentities = stopCallIdentities.slice(0, targetIndex + 1);
    const identity = canonicalShadowClaimIdentity([input.snapshot.sourceId, update.trainInstanceId, serviceDate, serviceInstanceId, targetStopCallIdentity]);
    const evaluatedService = evaluateServiceChanges({ snapshot: alertEvidence.decision, claim: {
      claimId: identity.claimId, routeId, exactDirectionalStopId: target.stopId, constituentStopId: target.stopId,
      direction, tripId: update.trip.tripId, trainId: update.trainInstanceId,
    } });
    const serviceChange = alertEvidence.usable ? evaluatedService
      : { kind: 'quarantine-or-limitation' as const, disposition: 'quarantined' as const };
    const serviceContext = alertEvidence.context.state === 'accepted'
      ? { ...alertEvidence.context, alertContextIdentity: `alert-context:${createHash('sha256').update(evaluatedService.alertContextIdentity).digest('hex')}` }
      : alertEvidence.context;
    const trackDisposition = target.actualTrack && target.scheduledTrack && target.actualTrack === target.scheduledTrack ? 'eligible' as const : 'quarantined' as const;
    const reasonCode = suppressionReason(update, input.decisionTime, feedHealth, serviceChange, trackDisposition, serviceDate, serviceInstanceId);
    const admitted = reasonCode === 'TRUSTED_HISTORY_UNAVAILABLE' && hasGovernedAdmission(input, update, serviceDate, serviceInstanceId,
      targetStopCallIdentity, target, remainingStopCallIdentities, terminalDestinationStopId, direction, evaluatedService,
      serviceContext, identity.claimId, trackDisposition);
    return [Object.freeze({
      ...identity, sourceId: input.snapshot.sourceId, observedAt: input.snapshot.feedTimestamp.toISOString(),
      operationalTrainId: update.trainInstanceId, serviceDate, serviceInstanceId, routeId, direction, terminalDestinationStopId,
      nextStopId: stops[0].stopId, nextStopCallIdentity: stopCallIdentities[0], targetStopId: target.stopId,
      targetStopCallIdentity, remainingStopCallIdentities, decisionTime: input.decisionTime.toISOString(),
      disposition: admitted ? 'admitted' as const : 'suppressed' as const,
      ...(!admitted ? { suppressionReasonCode: reasonCode } : {}),
      provenance: { source: 'gtfs-rt' as const, sourceId: input.sourceRecord.sourceId, feedGroupId: input.sourceRecord.feedGroupId,
        observedAt: input.sourceRecord.observedAt, retrievedAt: input.sourceRecord.retrievedAt, sha256: input.sourceRecord.sha256 },
      decisions: {
        feedHealth: shadowFeed(feedHealth),
        serviceChange: { kind: serviceChange.kind, disposition: serviceChange.disposition, alertContext: serviceContext },
        admission: admitted
          ? { kind: 'admitted' as const, disposition: 'admitted' as const, reasonCode: 'GOVERNED_ADMISSION' as const }
          : { kind: 'rejected' as const, disposition: 'suppressed' as const, reasonCode },
      },
    })];
  });
}

function hasGovernedAdmission(
  input: Parameters<typeof projectShadowClaims>[0], update: NormalizedTripUpdate, serviceDate: string | null,
  serviceInstanceId: string | null, targetIdentity: string, target: NormalizedTripUpdate['remainingStopCalls'][number],
  currentPath: readonly string[], destination: string, direction: 'northbound' | 'southbound',
  service: ServiceChangeDecision, alertContext: ReturnType<typeof alertDecisionFor>['context'], serviceClaimId: string,
  track: 'eligible' | 'quarantined',
): boolean {
  if (!input.priorRecord || !serviceDate || !serviceInstanceId || service.disposition !== 'eligible' || track !== 'eligible'
    || alertContext.state !== 'accepted') return false;
  const interval = input.decisionTime.getTime() - Date.parse(input.priorRecord.decisionTime);
  if (interval <= 0 || interval > MAX_SHADOW_COMPARISON_INTERVAL_MS) return false;
  const prior = input.priorRecord.claims.find((claim) => claim.sourceId === input.snapshot.sourceId
    && claim.operationalTrainId === update.trainInstanceId && claim.serviceDate === serviceDate && claim.serviceInstanceId === serviceInstanceId
    && claim.targetStopCallIdentity === targetIdentity && claim.routeId === update.trip.routeId && claim.direction === direction
    && claim.terminalDestinationStopId === destination);
  if (!prior || Date.parse(prior.observedAt) >= input.snapshot.feedTimestamp.getTime()) return false;
  const currentIndex = prior.remainingStopCallIdentities.indexOf(currentPath[0]);
  if (currentIndex <= 0 || !sameStrings(prior.remainingStopCallIdentities.slice(currentIndex), currentPath)) return false;
  const movement = update.vehicleProgress;
  if (!movement || movement.currentStatus === 'UNKNOWN' || !movement.movementTimestamp
    || movement.movementTimestamp.getTime() <= Date.parse(prior.observedAt)
    || input.decisionTime.getTime() - movement.movementTimestamp.getTime() > 90_000
    || movement.movementTimestamp.getTime() > input.decisionTime.getTime()) return false;
  const arrivalAt = target.arrivalTime ?? target.departureTime;
  if (!arrivalAt || arrivalAt.getTime() <= input.decisionTime.getTime()) return false;
  const decision = admitArrivalCandidate({
    stableTrainIdentity: update.trainInstanceId, publishedTripId: update.trip.tripId ?? update.trainInstanceId,
    patternIdentity: createHash('sha256').update(encodeCanonicalStringTuple(currentPath)).digest('hex'),
    feedGroupId: input.snapshot.feedGroupId, route: { id: update.trip.routeId!, label: update.trip.routeId! },
    routeOrderKind: /^[1-7]$/u.test(update.trip.routeId!) ? 'numbered' : 'lettered', direction, destination,
    remainingStopCalls: update.remainingStopCalls.map((call) => ({ stopId: call.stopId, sourceStopSequence: call.sourceStopSequence,
      arrivalAt: call.arrivalTime, departureAt: call.departureTime, scheduleRelationship: call.scheduleRelationship })),
    serviceChangeGate: service, serviceClaimId, serviceDisposition: service.disposition, trackDisposition: track,
    freshness: 'current', identityDisposition: 'coherent', recoveryDisposition: 'live-continuity', movementDisposition: 'plausible',
    confidence: { kind: 'live', supportedRange: { startsAt: arrivalAt, endsAt: arrivalAt } },
    provenance: { source: 'gtfs-rt', sourceId: input.sourceRecord.sourceId,
      observedAt: input.snapshot.feedTimestamp, retrievedAt: input.snapshot.retrievedAt },
  }, { feedGroupId: input.snapshot.feedGroupId, exactStopId: target.stopId, direction, destination, comparisonAt: input.decisionTime,
    serviceAssessmentAt: input.decisionTime, serviceAlertContextIdentity: service.alertContextIdentity });
  return decision.kind === 'admitted' && decision.stopCallIdentity === targetIdentity;
}

function alertDecisionFor(snapshot: AlertSnapshot | null, source: ShadowAlertSource, decisionTime: Date) {
  assertAlertSource(source);
  if (source.outcome === 'failed') {
    if (snapshot !== null) throw new Error('Alert ownership requires no snapshot for a failed canonical source');
    return { usable: false, decision: classifyAlertSnapshot({ status: 'failed' }, decisionTime), context: {
      state: 'failed' as const, sourceId: 'subway-alerts' as const, reasonCode: 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED' as const,
    } };
  }
  if (!snapshot || snapshot.sourceId !== source.sourceId || snapshot.feedTimestamp.toISOString() !== source.observedAt
    || snapshot.retrievedAt.toISOString() !== source.retrievedAt || snapshot.provenance.sha256 !== source.sha256) {
    throw new Error('Alert source ownership and provenance join failed');
  }
  const decision = classifyAlertSnapshot(alertInput(snapshot), decisionTime);
  const context = { state: 'accepted' as const, sourceId: 'subway-alerts' as const, observedAt: source.observedAt,
    retrievedAt: source.retrievedAt, sha256: source.sha256,
    alertContextIdentity: `alert-context:${createHash('sha256').update(encodeCanonicalStringTuple([source.sourceId, source.observedAt, source.retrievedAt, source.sha256])).digest('hex')}` };
  return { usable: decision.kind === 'current', decision, context };
}

function assertSourceOwnership(snapshot: RealtimeSnapshot, source: AcceptedShadowRealtimeSource): void {
  const keys = ['sourceId', 'role', 'outcome', 'reasonCode', 'feedGroupId', 'observedAt', 'retrievedAt', 'sha256'];
  if (!source || Object.keys(source).length !== keys.length || keys.some((key) => !Object.hasOwn(source, key))
    || source.role !== 'subway-realtime' || source.outcome !== 'accepted' || source.reasonCode !== 'SOURCE_ACCEPTED'
    || source.sourceId !== snapshot.sourceId || source.feedGroupId !== snapshot.feedGroupId
    || source.observedAt !== snapshot.feedTimestamp.toISOString() || source.retrievedAt !== snapshot.retrievedAt.toISOString()
    || source.retrievedAt !== snapshot.provenance.retrievedAt || source.sha256 !== snapshot.provenance.sha256 || !sha(source.sha256)) {
    throw new Error('Shadow source ownership and provenance join failed');
  }
}
function assertAlertSource(source: ShadowAlertSource): void {
  if (!source || source.sourceId !== 'subway-alerts' || source.role !== 'subway-alerts'
    || (source.outcome === 'accepted'
      ? Object.keys(source).length !== 7 || source.reasonCode !== 'SOURCE_ACCEPTED' || !iso(source.observedAt) || !iso(source.retrievedAt) || !sha(source.sha256)
      : Object.keys(source).length !== 4 || source.outcome !== 'failed' || source.reasonCode !== 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED')) {
    throw new Error('Invalid canonical alert source record');
  }
}
function serviceIdentity(update: NormalizedTripUpdate, serviceDate: string | null): string | null {
  if (!serviceDate || !update.trip.tripId || !update.trip.startTime || !update.trainInstanceId) return null;
  return `service:${createHash('sha256').update(encodeCanonicalStringTuple([
    update.trip.tripId, serviceDate, update.trip.startTime, update.trainInstanceId,
  ])).digest('hex')}`;
}
function shadowFeed(feed: FeedHealthDecision): ShadowProgressClaim['decisions']['feedHealth'] {
  return feed.kind === 'current' ? { kind: 'current', reasonCode: 'accepted-current' }
    : feed.kind === 'degraded' ? { kind: 'degraded', reasonCode: 'snapshot-age-degraded' }
      : { kind: 'unavailable', reasonCode: 'snapshot-age-unavailable' };
}
function suppressionReason(update: NormalizedTripUpdate, decisionTime: Date, feed: FeedHealthDecision, service: Pick<ServiceChangeDecision, 'disposition'>,
  track: 'eligible' | 'quarantined', serviceDate: string | null, serviceInstanceId: string | null): ShadowSuppressionReason {
  if (feed.kind !== 'current') return 'FEED_NOT_CURRENT'; if (service.disposition !== 'eligible') return 'SERVICE_CHANGE_NOT_ELIGIBLE';
  if (!serviceDate || !serviceInstanceId) return 'SERVICE_OWNERSHIP_UNAVAILABLE'; if (track !== 'eligible') return 'TRACK_EVIDENCE_NOT_ELIGIBLE';
  const movementAt = update.vehicleProgress?.movementTimestamp;
  if (movementAt && (decisionTime.getTime() - movementAt.getTime() > 90_000 || movementAt.getTime() > decisionTime.getTime())) return 'STALE_MOVEMENT_EVIDENCE';
  return 'TRUSTED_HISTORY_UNAVAILABLE';
}
function directionFor(value: number | null): 'northbound' | 'southbound' | null { return value === 0 ? 'northbound' : value === 1 ? 'southbound' : null; }
function alertInput(snapshot: AlertSnapshot): AlertSnapshotInput { return { status: 'accepted', feedTimestamp: snapshot.feedTimestamp, retrievedAt: snapshot.retrievedAt, alerts: snapshot.alerts.map(serviceAlert) }; }
function serviceAlert(alert: NormalizedAlert): ServiceAlertEvidence { return { alertId: alert.id, activePeriods: alert.activePeriods,
  selectors: alert.informedEntities.map((entity, index) => ({ selectorId: `${alert.id}:${index}`, ...(entity.routeId === null ? {} : { routeId: entity.routeId }),
    ...(entity.stopId === null ? {} : { exactDirectionalStopId: entity.stopId }), ...(entity.directionId === null ? {} : { direction: directionFor(entity.directionId) }),
    ...(entity.trip?.tripId ? { tripId: entity.trip.tripId } : {}), ...(entity.trip?.nyct.trainId ? { trainId: entity.trip.nyct.trainId } : {}) })),
  structuredEffect: structuredEffect(alert.effect), declaredConsequence: declaredConsequence(alert.effect),
  official: { headerRaw: alert.rawOfficialText, descriptionRaw: alert.rawDescription ?? '' } }; }
function structuredEffect(effect: string | null): StructuredAlertEffect { return ['NO_SERVICE', 'MODIFIED_SERVICE', 'SIGNIFICANT_DELAYS', 'ACCESSIBILITY_ISSUE', 'UNKNOWN_EFFECT'].includes(String(effect)) ? effect as StructuredAlertEffect : 'OTHER_EFFECT'; }
function declaredConsequence(effect: string | null): DeclaredServiceConsequence { return effect === 'NO_SERVICE' ? 'full-suspension' : effect === 'SIGNIFICANT_DELAYS' ? 'delay-only' : effect === 'ACCESSIBILITY_ISSUE' ? 'entrance-equipment' : 'generic-affected'; }
function iso(value: unknown): value is string { return typeof value === 'string' && new Date(value).toISOString() === value; }
function sha(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value); }
function sameStrings(a: readonly string[], b: readonly string[]): boolean { return a.length === b.length && a.every((value, index) => value === b[index]); }
