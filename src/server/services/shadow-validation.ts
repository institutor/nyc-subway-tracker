import { admitArrivalCandidate, type ArrivalAdmissionDecision } from '../../shared/domain/arrival-admission';
import { classifyAlertSnapshot, type AlertSnapshotInput, type DeclaredServiceConsequence, type ServiceAlertEvidence, type StructuredAlertEffect } from '../../shared/domain/alert-scope';
import { FeedHealthGovernor, type FeedHealthDecision } from '../../shared/domain/feed-health';
import { evaluateServiceChanges, type ServiceChangeDecision } from '../../shared/domain/service-impact';
import type { Direction } from '../../shared/domain/types';
import { canonicalStopCallIdentity } from '../../shared/domain/train-identity';
import type { AlertSnapshot, NormalizedAlert } from '../gtfs/alert-loader';
import type { NormalizedTripUpdate, RealtimeSnapshot } from '../gtfs/realtime-normalizer';
import type { ShadowProgressCandidate } from './shadow-progress';

export interface ShadowClaim extends ShadowProgressCandidate {
  readonly claimId: string;
  readonly decisionTime: string;
  readonly targetStopCallIdentity: string;
  readonly disposition: 'admitted' | 'suppressed';
  readonly suppressionReasonCode?: ShadowSuppressionReason;
  readonly provenance: {
    readonly source: 'gtfs-rt';
    readonly sourceId: string;
    readonly feedGroupId: string;
    readonly observedAt: string;
    readonly retrievedAt: string;
    readonly sha256: string;
  };
  readonly decisions: {
    readonly feedHealth: Pick<FeedHealthDecision, 'kind' | 'reasonCode'>;
    readonly serviceChange: Pick<ServiceChangeDecision, 'kind' | 'disposition'>;
    readonly admission: ArrivalAdmissionDecision;
  };
}

export type ShadowSuppressionReason =
  | 'MOVEMENT_EVIDENCE_UNCONFIRMED'
  | 'FEED_NOT_CURRENT'
  | 'SERVICE_CHANGE_NOT_ELIGIBLE'
  | 'TRACK_EVIDENCE_NOT_ELIGIBLE'
  | 'ARRIVAL_CLAIM_NOT_ADMITTED';

export function projectShadowClaims(input: {
  readonly snapshot: RealtimeSnapshot;
  readonly alertSnapshot: AlertSnapshot | null;
  readonly decisionTime: Date;
}): readonly ShadowClaim[] {
  const feedHealth = new FeedHealthGovernor().observe(input.snapshot, input.decisionTime);
  const alertDecision = classifyAlertSnapshot(alertInput(input.alertSnapshot), input.decisionTime);
  const claims: ShadowClaim[] = [];
  for (const update of input.snapshot.tripUpdates) {
    if (claims.length >= 500) break;
    claims.push(...projectUpdateClaims(input, update, feedHealth, alertDecision).slice(0, 500 - claims.length));
  }
  return claims;
}

function projectUpdateClaims(
  input: { readonly snapshot: RealtimeSnapshot; readonly decisionTime: Date },
  update: NormalizedTripUpdate,
  feedHealth: FeedHealthDecision,
  alertDecision: ReturnType<typeof classifyAlertSnapshot>,
): readonly ShadowClaim[] {
    const stops = update.remainingStopCalls;
    if (stops.length === 0 || stops.length > 64 || update.trip.routeId === null) return [];
    const routeId = update.trip.routeId;
    const direction = directionFor(update.trip.directionId);
    if (direction === null) return [];
    return stops.map((target, targetIndex) => {
    const claimPath = stops.slice(0, targetIndex + 1);
    const claimId = `${input.snapshot.sourceId}:${update.trainInstanceId}:${target.stopId}:${target.sourceStopSequence ?? 'unknown'}`;
    const targetStopCallIdentity = canonicalStopCallIdentity(target);
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
    const movementDisposition = update.vehicleProgress?.movementTimestamp
      && update.vehicleProgress.currentStatus !== 'UNKNOWN' ? 'plausible' as const : 'uncertain' as const;
    const trackDisposition = target.actualTrack && target.scheduledTrack && target.actualTrack === target.scheduledTrack
      ? 'eligible' as const : 'quarantined' as const;
    const event = target.arrivalTime ?? target.departureTime;
    const supportedCenter = event ?? input.decisionTime;
    const admission = admitArrivalCandidate({
      stableTrainIdentity: update.trainInstanceId,
      publishedTripId: update.trip.tripId,
      patternIdentity: claimPath.map((stop) => `${stop.stopId}:${stop.sourceStopSequence ?? 'unknown'}`).join('>'),
      feedGroupId: input.snapshot.feedGroupId,
      route: { id: routeId, label: routeId },
      routeOrderKind: /^[0-9]+$/u.test(routeId) ? 'numbered' : routeId === 'S' ? 'shuttle' : 'lettered',
      direction,
      destination: target.stopId,
      remainingStopCalls: claimPath.map((stop) => ({
        stopId: stop.stopId,
        sourceStopSequence: stop.sourceStopSequence,
        arrivalAt: stop.arrivalTime,
        departureAt: stop.departureTime,
        scheduleRelationship: stop.scheduleRelationship,
      })),
      serviceChangeGate: serviceChange,
      serviceClaimId: claimId,
      serviceDisposition: serviceChange.disposition,
      trackDisposition,
      freshness: feedHealth.kind,
      identityDisposition: 'coherent',
      recoveryDisposition: 'live-continuity',
      movementDisposition,
      confidence: {
        kind: 'live',
        supportedRange: {
          startsAt: new Date(supportedCenter.getTime() - 15_000),
          endsAt: new Date(supportedCenter.getTime() + 15_000),
        },
      },
      provenance: {
        source: 'gtfs-rt',
        sourceId: input.snapshot.sourceId,
        observedAt: input.snapshot.feedTimestamp,
        retrievedAt: input.snapshot.retrievedAt,
      },
    }, {
      feedGroupId: input.snapshot.feedGroupId,
      exactStopId: target.stopId,
      direction,
      destination: target.stopId,
      comparisonAt: input.decisionTime,
      serviceAssessmentAt: alertDecision.assessedAt,
      serviceAlertContextIdentity: serviceChange.alertContextIdentity,
    });
    const disposition = admission.kind === 'admitted' ? 'admitted' as const : 'suppressed' as const;
    const claim: ShadowClaim = {
      claimId,
      sourceId: input.snapshot.sourceId,
      observedAt: input.snapshot.feedTimestamp.toISOString(),
      operationalTrainId: update.trainInstanceId,
      routeId,
      nextStopId: stops[0].stopId,
      targetStopId: target.stopId,
      targetStopCallIdentity,
      remainingStopCount: claimPath.length,
      remainingStopIds: claimPath.map(({ stopId }) => stopId),
      decisionTime: input.decisionTime.toISOString(),
      disposition,
      ...(disposition === 'suppressed' ? { suppressionReasonCode: suppressionReason(admission, feedHealth, serviceChange, trackDisposition) } : {}),
      provenance: {
        source: 'gtfs-rt',
        sourceId: input.snapshot.sourceId,
        feedGroupId: input.snapshot.feedGroupId,
        observedAt: input.snapshot.feedTimestamp.toISOString(),
        retrievedAt: input.snapshot.retrievedAt.toISOString(),
        sha256: input.snapshot.provenance.sha256,
      },
      decisions: {
        feedHealth: { kind: feedHealth.kind, reasonCode: feedHealth.reasonCode },
        serviceChange: { kind: serviceChange.kind, disposition: serviceChange.disposition },
        admission,
      },
    };
    return Object.freeze(claim);
  });
}

function directionFor(value: number | null): Exclude<Direction, 'unknown'> | null {
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

function suppressionReason(
  admission: ArrivalAdmissionDecision,
  feed: FeedHealthDecision,
  service: ServiceChangeDecision,
  track: 'eligible' | 'quarantined',
): ShadowSuppressionReason {
  if (admission.kind === 'secondary') return 'MOVEMENT_EVIDENCE_UNCONFIRMED';
  if (feed.kind !== 'current') return 'FEED_NOT_CURRENT';
  if (service.disposition !== 'eligible') return 'SERVICE_CHANGE_NOT_ELIGIBLE';
  if (track !== 'eligible') return 'TRACK_EVIDENCE_NOT_ELIGIBLE';
  return 'ARRIVAL_CLAIM_NOT_ADMITTED';
}
