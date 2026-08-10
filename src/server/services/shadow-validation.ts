import { classifyAlertSnapshot, type AlertSnapshotInput, type DeclaredServiceConsequence, type ServiceAlertEvidence, type StructuredAlertEffect } from '../../shared/domain/alert-scope';
import { encodeCanonicalStringTuple } from '../../shared/domain/canonical';
import { FeedHealthGovernor, type FeedHealthDecision } from '../../shared/domain/feed-health';
import { evaluateServiceChanges, type ServiceChangeDecision } from '../../shared/domain/service-impact';
import { canonicalStopCallIdentity } from '../../shared/domain/train-identity';
import type { AlertSnapshot, NormalizedAlert } from '../gtfs/alert-loader';
import type { NormalizedTripUpdate, RealtimeSnapshot } from '../gtfs/realtime-normalizer';
import type { ShadowProgressClaim, ShadowSuppressionReason } from './shadow-progress';

export type ShadowClaim = ShadowProgressClaim;

export interface AcceptedShadowRealtimeSource {
  readonly sourceId: string;
  readonly role: 'subway-realtime';
  readonly outcome: 'accepted';
  readonly reasonCode: 'SOURCE_ACCEPTED';
  readonly feedGroupId: string;
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly sha256: string;
}

export function projectShadowClaims(input: {
  readonly snapshot: RealtimeSnapshot;
  readonly sourceRecord: AcceptedShadowRealtimeSource;
  readonly alertSnapshot: AlertSnapshot | null;
  readonly decisionTime: Date;
}): readonly ShadowClaim[] {
  assertSourceOwnership(input.snapshot, input.sourceRecord);
  const feedHealth = new FeedHealthGovernor().observe(input.snapshot, input.decisionTime);
  const alertDecision = classifyAlertSnapshot(alertInput(input.alertSnapshot), input.decisionTime);
  const claims: ShadowClaim[] = [];
  for (const update of input.snapshot.tripUpdates) {
    if (claims.length >= 500) break;
    claims.push(...projectUpdateClaims(input, update, feedHealth, alertDecision).slice(0, 500 - claims.length));
  }
  return Object.freeze(claims);
}

function projectUpdateClaims(
  input: { readonly snapshot: RealtimeSnapshot; readonly sourceRecord: AcceptedShadowRealtimeSource; readonly decisionTime: Date },
  update: NormalizedTripUpdate,
  feedHealth: FeedHealthDecision,
  alertDecision: ReturnType<typeof classifyAlertSnapshot>,
): readonly ShadowClaim[] {
  const stops = update.remainingStopCalls;
  if (stops.length === 0 || stops.length > 64 || update.trip.routeId === null) return [];
  const routeId = update.trip.routeId;
  const direction = directionFor(update.trip.directionId);
  if (direction === null) return [];
  let stopCallIdentities: readonly string[];
  try {
    stopCallIdentities = stops.map(canonicalStopCallIdentity);
  } catch {
    return [];
  }
  const terminalDestinationStopId = stops.at(-1)!.stopId;
  return stops.flatMap((target, targetIndex): readonly ShadowClaim[] => {
    const targetStopCallIdentity = stopCallIdentities[targetIndex];
    const remainingStopCallIdentities = stopCallIdentities.slice(0, targetIndex + 1);
    const claimKey = encodeCanonicalStringTuple([input.snapshot.sourceId, update.trainInstanceId, targetStopCallIdentity]);
    const claimId = `${input.snapshot.sourceId}:${update.trainInstanceId}:${target.stopId}:${target.sourceStopSequence ?? targetIndex + 1}`;
    if (claimId.length > 256 || claimKey.length > 256) return [];
    const serviceChange = evaluateServiceChanges({
      snapshot: alertDecision,
      claim: {
        claimId,
        routeId,
        exactDirectionalStopId: target.stopId,
        constituentStopId: target.stopId,
        direction,
        tripId: update.trip.tripId,
        trainId: update.trainInstanceId,
      },
    });
    const trackDisposition = target.actualTrack && target.scheduledTrack && target.actualTrack === target.scheduledTrack
      ? 'eligible' as const : 'quarantined' as const;
    const reasonCode = suppressionReason(update, input.decisionTime, feedHealth, serviceChange, trackDisposition);
    return [Object.freeze({
      claimId,
      claimKey,
      sourceId: input.snapshot.sourceId,
      observedAt: input.snapshot.feedTimestamp.toISOString(),
      operationalTrainId: update.trainInstanceId,
      routeId,
      direction,
      terminalDestinationStopId,
      nextStopId: stops[0].stopId,
      nextStopCallIdentity: stopCallIdentities[0],
      targetStopId: target.stopId,
      targetStopCallIdentity,
      remainingStopCallIdentities,
      decisionTime: input.decisionTime.toISOString(),
      disposition: 'suppressed',
      suppressionReasonCode: reasonCode,
      provenance: {
        source: 'gtfs-rt' as const,
        sourceId: input.sourceRecord.sourceId,
        feedGroupId: input.sourceRecord.feedGroupId,
        observedAt: input.sourceRecord.observedAt,
        retrievedAt: input.sourceRecord.retrievedAt,
        sha256: input.sourceRecord.sha256,
      },
      decisions: {
        feedHealth: { kind: feedHealth.kind, reasonCode: feedHealth.reasonCode },
        serviceChange: { kind: serviceChange.kind, disposition: serviceChange.disposition },
        admission: { kind: 'rejected' as const, disposition: 'suppressed' as const, reasonCode },
      },
    })];
  });
}

function assertSourceOwnership(snapshot: RealtimeSnapshot, source: AcceptedShadowRealtimeSource): void {
  const exactKeys = ['sourceId', 'role', 'outcome', 'reasonCode', 'feedGroupId', 'observedAt', 'retrievedAt', 'sha256'];
  if (!source || typeof source !== 'object' || Object.keys(source).length !== exactKeys.length
    || exactKeys.some((key) => !Object.hasOwn(source, key))
    || source.role !== 'subway-realtime' || source.outcome !== 'accepted' || source.reasonCode !== 'SOURCE_ACCEPTED'
    || source.sourceId !== snapshot.sourceId || source.feedGroupId !== snapshot.feedGroupId
    || source.observedAt !== snapshot.feedTimestamp.toISOString()
    || source.retrievedAt !== snapshot.retrievedAt.toISOString()
    || source.retrievedAt !== snapshot.provenance.retrievedAt
    || source.sha256 !== snapshot.provenance.sha256
    || !/^[a-f0-9]{64}$/u.test(source.sha256)) {
    throw new Error('Shadow source ownership and provenance join failed');
  }
}

function suppressionReason(
  update: NormalizedTripUpdate,
  decisionTime: Date,
  feed: FeedHealthDecision,
  service: ServiceChangeDecision,
  track: 'eligible' | 'quarantined',
): ShadowSuppressionReason {
  if (feed.kind !== 'current') return 'FEED_NOT_CURRENT';
  if (service.disposition !== 'eligible') return 'SERVICE_CHANGE_NOT_ELIGIBLE';
  if (track !== 'eligible') return 'TRACK_EVIDENCE_NOT_ELIGIBLE';
  const movementAt = update.vehicleProgress?.movementTimestamp;
  if (movementAt && (decisionTime.getTime() - movementAt.getTime() > 90_000 || movementAt.getTime() > decisionTime.getTime())) {
    return 'STALE_MOVEMENT_EVIDENCE';
  }
  return 'TRUSTED_HISTORY_UNAVAILABLE';
}

function directionFor(value: number | null): 'northbound' | 'southbound' | null {
  if (value === 0) return 'northbound';
  if (value === 1) return 'southbound';
  return null;
}

function alertInput(snapshot: AlertSnapshot | null): AlertSnapshotInput {
  return snapshot ? {
    status: 'accepted', feedTimestamp: snapshot.feedTimestamp, retrievedAt: snapshot.retrievedAt,
    alerts: snapshot.alerts.map(serviceAlert),
  } : { status: 'missing' };
}

function serviceAlert(alert: NormalizedAlert): ServiceAlertEvidence {
  return {
    alertId: alert.id,
    activePeriods: alert.activePeriods,
    selectors: alert.informedEntities.map((entity, index) => ({
      selectorId: `${alert.id}:${index}`,
      ...(entity.routeId === null ? {} : { routeId: entity.routeId }),
      ...(entity.stopId === null ? {} : { exactDirectionalStopId: entity.stopId }),
      ...(entity.directionId === null ? {} : { direction: directionFor(entity.directionId) }),
      ...(entity.trip?.tripId ? { tripId: entity.trip.tripId } : {}),
      ...(entity.trip?.nyct.trainId ? { trainId: entity.trip.nyct.trainId } : {}),
    })),
    structuredEffect: structuredEffect(alert.effect),
    declaredConsequence: declaredConsequence(alert.effect),
    official: { headerRaw: alert.rawOfficialText, descriptionRaw: alert.rawDescription ?? '' },
  };
}

function structuredEffect(effect: string | null): StructuredAlertEffect {
  if (effect === 'NO_SERVICE' || effect === 'MODIFIED_SERVICE' || effect === 'SIGNIFICANT_DELAYS'
    || effect === 'ACCESSIBILITY_ISSUE' || effect === 'UNKNOWN_EFFECT') return effect;
  return 'OTHER_EFFECT';
}

function declaredConsequence(effect: string | null): DeclaredServiceConsequence {
  if (effect === 'NO_SERVICE') return 'full-suspension';
  if (effect === 'SIGNIFICANT_DELAYS') return 'delay-only';
  if (effect === 'ACCESSIBILITY_ISSUE') return 'entrance-equipment';
  return 'generic-affected';
}
