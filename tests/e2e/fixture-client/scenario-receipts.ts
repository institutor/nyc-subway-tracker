import type { BoardEnvelopeDto } from '../../../src/client/api/client';
import { runReconnection } from '../../../src/client/recovery/run-reconnection';
import type { ReconnectionTransition } from '../../../src/client/recovery/run-reconnection';
import {
  admitArrivalCandidate,
  type ArrivalAdmissionCandidate,
  type ArrivalAdmissionDecision,
  type ArrivalBoardScope,
} from '../../../src/shared/domain/arrival-admission';
import {
  classifyAlertSnapshot,
  type ServiceAlertEvidence,
  type ServiceClaimScope,
} from '../../../src/shared/domain/alert-scope';
import { createCommuteRuntimeWindow, resolveCommuteOccurrence } from '../../../src/shared/domain/commute-window';
import {
  materialNotificationDecision,
  type DeliveredNotificationBaseline,
  type NotificationDecision,
  type NotificationImpact,
} from '../../../src/shared/domain/notification-decision';
import { assessArrivalConfidence } from '../../../src/shared/domain/arrival-confidence';
import { orderPrimaryArrivals, type PrimaryOrderRow } from '../../../src/shared/domain/arrival-order';
import type {
  OwnerAcceptance,
  PreservedReconnectionContext,
  ReconnectionStage,
  ReconnectionStageResult,
  ReconnectionState,
} from '../../../src/shared/domain/reconnection';
import { TrainRecoveryGovernor, type TrainRecoveryDecision } from '../../../src/shared/domain/recovery';
import { canonicalStopCallIdentity } from '../../../src/shared/domain/train-identity';
import { evaluateServiceChanges, type ServiceChangeDecision, type ServiceRecoveryUpdate } from '../../../src/shared/domain/service-impact';
import { ScheduleEditionRegistry, type ScheduleCoverageMask } from '../../../src/shared/domain/schedule-owner';
import { buildScheduleFallback } from '../../../src/shared/domain/schedule-fallback';
import type { BoardDecision, SavedRecord } from '../../../src/shared/domain/types';
import type { NormalizedStaticGtfs, StaticGtfsEditionCandidate } from '../../../src/server/gtfs/static-normalizer';
import { buildBoardDto } from '../../../src/server/services/board-service';
import { boardEnvelope } from '../../helpers/client-fixtures';

export const RECONNECTION_SCENARIOS = [
  'Reconnect · stage 1 path invalidation',
  'Reconnect · stage 2 service invalidation',
  'Reconnect · stage 3 train invalidation',
  'Reconnect · stage 4 required guidance invalidation',
  'Reconnect · optional guidance removed',
] as const;
export type ReconnectionScenario = typeof RECONNECTION_SCENARIOS[number];

const BASE = new Date('2026-08-04T12:00:00.000Z');
const at = (seconds: number) => new Date(BASE.getTime() + seconds * 1_000);

export function liveOverlapBoard(): BoardEnvelopeDto {
  const base = boardEnvelope('A12', '125 St', ['A', 'C']);
  const earlier = admitTimelineArrival('expected', 'train-c-earlier', 'C', 90, 120);
  const overlapping = admitTimelineArrival('expected', 'train-c-overlap', 'C', 120, 210);
  const live = admitTimelineArrival('live', 'train-a-live', 'A', 170, 190);
  const rows = [earlier, overlapping, live].map((decision) => {
    if (decision.kind !== 'admitted') throw new Error('Timeline primary arrival was not admitted');
    return decision.row;
  });
  const ordered = orderPrimaryArrivals(rows, 3);
  if (ordered.map(({ stableTrainIdentity }) => stableTrainIdentity).join(',') !== 'train-c-earlier,train-a-live,train-c-overlap') {
    throw new Error('Live overlap ordering receipt is incoherent');
  }
  const holdingConfidence = assessArrivalConfidence({
    assessedAt: BASE, feedState: 'current', exactStopConfirmed: true, trackPathConfirmed: true,
    recoveryDisposition: 'live-continuity', trainPhase: 'running', progressAt: at(-100), predictedAt: at(240),
    lastSupportedAt: at(-100), dueStartedAt: null, unusualDwellVerdict: 'unusual',
  });
  if (holdingConfidence.kind !== 'holding' || holdingConfidence.exactTime === null) {
    throw new Error('Holding confidence receipt is unavailable');
  }
  const decision: BoardDecision = {
    responseIdentity: 'domain-board-live-overlap', mode: 'live',
    station: { id: 'A12', name: '125 St', complexId: 'A12', routeIds: ['A', 'C'] },
    directions: [{
      direction: 'northbound', primary: ordered.map(({ arrival }) => arrival),
      secondary: [{
        id: 'train-a-holding', kind: 'holding', route: { id: 'A', label: 'A' }, direction: 'northbound',
        destination: 'Inwood–207 St', lastSupportedAt: holdingConfidence.exactTime,
        provenance: { source: 'gtfs-rt', sourceId: 'bdfm-feed', observedAt: BASE, retrievedAt: BASE },
      }],
      explanations: [{ code: 'DWELL', message: 'One train is holding.' }],
    }],
    feedHealth: [{ source: 'gtfs-rt', state: 'current', assessedAt: BASE, lastAcceptedAt: BASE }],
    alerts: [], decidedAt: BASE, explanations: [],
    capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
  };
  const data = buildBoardDto(decision, at(300).toISOString(), { routeIds: [] }, [{
    source: 'gtfs-rt', sourceId: 'bdfm-feed', state: 'current', assessedAt: BASE.toISOString(), lastAcceptedAt: BASE.toISOString(),
  }], [{ source: 'gtfs-rt', sourceId: 'bdfm-feed', observedAt: BASE.toISOString(), retrievedAt: BASE.toISOString() }]);
  return {
    ...base,
    responseIdentity: decision.responseIdentity,
    decidedAt: BASE.toISOString(), serverTime: BASE.toISOString(),
    sourceHealth: data.sourceHealth, provenance: data.provenance, data: data as BoardEnvelopeDto['data'],
  };
}

export function scheduledFallbackBoard(): BoardEnvelopeDto {
  const base = boardEnvelope('A12', '125 St', ['A']);
  const registry = new ScheduleEditionRegistry();
  registry.observe(scheduleEdition());
  const fallback = buildScheduleFallback({
    feedDecision: { feedGroupId: 'ace', kind: 'unavailable', fallbackEligibility: 'eligible', presentation: 'none' },
    scope: {
      feedGroupId: 'ace', exactStopId: 'A12N', direction: 'northbound', operationalAxis: 'uptown',
      comparisonAt: new Date('2026-08-05T03:55:00.000Z'), serviceDates: ['20260804'], routeIds: ['A'],
    },
    registry,
  });
  if (fallback.mode !== 'scheduled-fallback' || fallback.rows.length === 0) {
    throw new Error('Supplemented schedule fixture did not own fallback rows');
  }
  const decision: BoardDecision = {
    responseIdentity: 'domain-board-scheduled-fallback', mode: 'scheduled-fallback',
    station: { id: 'A12', name: '125 St', complexId: 'A12', routeIds: ['A'] },
    directions: [{ direction: 'northbound', primary: fallback.rows.map(({ arrival }) => arrival), secondary: [], explanations: [] }],
    feedHealth: [{ source: 'gtfs-rt', state: 'unavailable', assessedAt: new Date('2026-08-05T03:55:00.000Z') }],
    alerts: [], decidedAt: new Date('2026-08-05T03:55:00.000Z'), explanations: [],
    capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
  };
  const sourceHealth = [{ source: 'gtfs-rt', sourceId: 'subway-rt-ace', state: 'unavailable' as const, assessedAt: '2026-08-05T03:55:00.000Z' }];
  const provenance = fallback.rows.map(({ arrival }) => ({
    source: arrival.provenance.source,
    sourceId: arrival.provenance.sourceId,
    observedAt: arrival.provenance.observedAt.toISOString(),
    retrievedAt: arrival.provenance.retrievedAt.toISOString(),
  }));
  const data = buildBoardDto(decision, '2026-08-05T04:10:00.000Z', { routeIds: [] }, sourceHealth, provenance);
  return {
    ...base,
    responseIdentity: 'response:board:scheduled-fallback',
    decidedAt: '2026-08-05T03:55:00.000Z', serverTime: '2026-08-05T03:55:00.000Z',
    sourceHealth: data.sourceHealth, provenance: data.provenance, data: data as BoardEnvelopeDto['data'],
  };
}

export function firstAbsenceTimeline(): { readonly before: BoardEnvelopeDto; readonly absence: TrainRecoveryDecision } {
  const admission = admitTimelineArrival('live', 'train-f-absence', 'F', 170, 190);
  if (admission.kind !== 'admitted') throw new Error('Initial train for first-absence timeline was not admitted');
  const governor = new TrainRecoveryGovernor({
    feedGroupId: 'subway-rt-bdfm',
    trainIdentity: 'train-f-1',
    targetStopId: 'A24N',
    initialEvidence: evidence('train-initial', 0),
    movementAt: at(-10),
  });
  const absence = governor.observeHealthySnapshot({ provenance: evidence('train-absence-1', 30), entity: { kind: 'absent' } });
  return {
    before: serviceBoardFromAdmissions([admission], 'F train evidence is current before the next healthy snapshot.'),
    absence,
  };
}

export function bypassDecisions(): {
  readonly affected: ServiceChangeDecision;
  readonly sibling: ServiceChangeDecision;
  readonly affectedAdmission: ArrivalAdmissionDecision;
  readonly siblingAdmission: ArrivalAdmissionDecision;
  readonly board: BoardEnvelopeDto;
} {
  const snapshot = alertSnapshot([bypassAlert()]);
  const affected = evaluateServiceChanges({ snapshot, claim: serviceClaim('F') });
  const sibling = evaluateServiceChanges({ snapshot, claim: serviceClaim('E') });
  const affectedAdmission = admitServiceArrival(affected);
  const siblingAdmission = admitServiceArrival(sibling);
  return {
    affected, sibling, affectedAdmission, siblingAdmission,
    board: serviceBoardFromAdmissions([affectedAdmission, siblingAdmission], affected.riderCopy ?? 'F service is bypassing 14 St.'),
  };
}

export function unresolvedDecisions(): {
  readonly affected: ServiceChangeDecision;
  readonly sibling: ServiceChangeDecision;
  readonly affectedAdmission: ArrivalAdmissionDecision;
  readonly siblingAdmission: ArrivalAdmissionDecision;
  readonly board: BoardEnvelopeDto;
} {
  const snapshot = alertSnapshot([{
    ...baseAlert(),
    alertId: 'unresolved-reroute',
    declaredConsequence: 'reroute',
    selectors: [{ selectorId: 'route-direction-unresolved', routeId: 'F', direction: null }],
    official: { headerRaw: 'F trains are rerouted', descriptionRaw: 'F trains run via another line.' },
  }]);
  const affected = evaluateServiceChanges({ snapshot, claim: serviceClaim('F') });
  const sibling = evaluateServiceChanges({ snapshot, claim: serviceClaim('E') });
  const affectedAdmission = admitServiceArrival(affected);
  const siblingAdmission = admitServiceArrival(sibling);
  return {
    affected, sibling, affectedAdmission, siblingAdmission,
    board: serviceBoardFromAdmissions([affectedAdmission, siblingAdmission], 'F stopping pattern is being verified.'),
  };
}

export function serviceRecoveryDecisions(): {
  readonly one: ServiceChangeDecision;
  readonly two: ServiceChangeDecision;
  readonly oneAdmission: ArrivalAdmissionDecision;
  readonly twoAdmission: ArrivalAdmissionDecision;
  readonly adverseBoard: BoardEnvelopeDto;
  readonly oneBoard: BoardEnvelopeDto;
  readonly twoBoard: BoardEnvelopeDto;
} {
  const adverseSnapshot = alertSnapshot([bypassAlert()]);
  const adverse = evaluateServiceChanges({ snapshot: adverseSnapshot, claim: serviceClaim('F') });
  if (!adverse.carryover) throw new Error('Bypass fixture did not create a risk boundary');
  const adverseAdmission = admitServiceArrival(adverse);
  const adverseSibling = admitServiceArrival(evaluateServiceChanges({ snapshot: adverseSnapshot, claim: serviceClaim('E') }));
  const clear = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(30), retrievedAt: at(30), alerts: [] }, at(30));
  const updates = [recoveryUpdate('recovery-1', 10), recoveryUpdate('recovery-2', 20)];
  const one = evaluateServiceChanges({
    snapshot: clear, claim: serviceClaim('F'), priorRisk: adverse.carryover, recoveryUpdates: updates.slice(0, 1),
  });
  const two = evaluateServiceChanges({
    snapshot: clear, claim: serviceClaim('F'), priorRisk: adverse.carryover, recoveryUpdates: updates,
  });
  const oneAdmission = admitServiceArrival(one);
  const twoAdmission = admitServiceArrival(two, 'live-readmission-eligible');
  const siblingAdmission = admitServiceArrival(evaluateServiceChanges({ snapshot: clear, claim: serviceClaim('E') }));
  return {
    one,
    two,
    oneAdmission,
    twoAdmission,
    adverseBoard: serviceBoardFromAdmissions([adverseAdmission, adverseSibling], adverse.riderCopy ?? 'F trains bypass 14 St.'),
    oneBoard: serviceBoardFromAdmissions([oneAdmission, siblingAdmission], 'One clean update has been accepted; F remains withheld.'),
    twoBoard: serviceBoardFromAdmissions([twoAdmission, siblingAdmission], 'F trains have resumed making scheduled stops at 14 St.'),
  };
}

export const commuteWindow = createCommuteRuntimeWindow({
  id: 'weekday-f', savedRecordId: 'saved-f', lifecycle: 'active', weekdays: [1], startsAt: '08:00', endsAt: '09:00',
  preparationLeadMinutes: 15, stage: 'deterministic-test', notificationEnabled: true,
  scope: {
    routeId: 'F', direction: 'southbound', actualDestination: 'Coney Island–Stillwell Av',
    originStationId: 'D15', destinationStationId: 'D21',
    segmentStationIds: ['D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21'],
  },
});

export const commuteSavedRecord: SavedRecord = {
  id: 'saved-f', complexId: 'D15', constituentId: 'D15', routeFilters: ['F'], accessibleRouteOnly: false,
  preferredRide: { direction: 'southbound', actualDestination: 'Coney Island–Stillwell Av' },
  commonDestination: { complexId: 'D21', constituentId: 'D21' },
  timeWindow: { weekdays: [1], startsAt: '08:00', endsAt: '09:00' }, state: 'active',
};

export type CommuteReceiptScenario = 'material' | 'duplicate' | 'correction' | 'escalation';

export function commuteDecision(kind: CommuteReceiptScenario): NotificationDecision {
  const occurrence = resolveCommuteOccurrence(commuteWindow, new Date('2026-08-03T12:00:00.000Z'));
  if (occurrence.kind !== 'watching') throw new Error('Commute fixture is outside its watched occurrence');
  const current = impact();
  const delivered = kind === 'material' ? [] : [baseline()];
  const selectedImpact = kind === 'correction'
    ? { ...current, correctionOnly: true }
    : kind === 'escalation'
      ? { ...current, addedJourneySeconds: 900 }
      : current;
  return materialNotificationDecision({ window: commuteWindow, occurrence, impact: selectedImpact, delivered });
}

export async function runReconnectionScenario(
  scenario: ReconnectionScenario,
  onTransition: (transition: ReconnectionTransition) => void,
): Promise<ReconnectionState> {
  const context = reconnectionContext(scenario);
  const failedStage = scenario === 'Reconnect · stage 1 path invalidation' ? 1
    : scenario === 'Reconnect · stage 2 service invalidation' ? 2
      : scenario === 'Reconnect · stage 3 train invalidation' ? 3
        : 4;
  const result = await runReconnection({
    context,
    initial: { historicalPositioningGuidance: true, historicalTransferGuidance: true },
    loadStage: async ({ stage }) => stage === failedStage
      ? stage === 3 ? oneSnapshotStage(context) : undefined
      : validStage(context, stage),
    now: () => new Date('2026-08-05T12:00:01.000Z'),
    onTransition,
  });
  if (result.kind !== 'complete') throw new Error('Validation recovery did not complete');
  return result.state;
}

function evidence(id: string, seconds: number) {
  return { feedGroupId: 'subway-rt-bdfm', evidenceId: id, observedAt: at(seconds), sourceTimestamp: at(seconds) };
}

function admitTimelineArrival(
  kind: 'live' | 'expected',
  trainIdentity: string,
  routeId: 'A' | 'C' | 'F',
  startsAtSeconds: number,
  endsAtSeconds: number,
): ArrivalAdmissionDecision {
  const centerSeconds = Math.round((startsAtSeconds + endsAtSeconds) / 2);
  const stopCall = {
    stopId: 'A12N', sourceStopSequence: 2, occurrenceId: `${trainIdentity}:A12N`,
    arrivalAt: at(centerSeconds), departureAt: at(centerSeconds + 10), scheduleRelationship: 'SCHEDULED',
  };
  const targetIdentity = canonicalStopCallIdentity(stopCall);
  const supportedRange = { startsAt: at(startsAtSeconds), endsAt: at(endsAtSeconds) };
  const expectedUpdates = [
    { id: `${trainIdentity}:expected-1`, seconds: -10 },
    { id: `${trainIdentity}:expected-2`, seconds: -5 },
  ].map(({ id, seconds }) => ({
    evidenceId: id, sourceTimestamp: at(seconds), observedAt: at(seconds), feedGroupId: 'bdfm', sourceId: 'bdfm-feed',
    stableTrainIdentity: trainIdentity, patternIdentity: `pattern:${trainIdentity}`, direction: 'northbound' as const,
    destination: routeId === 'A' ? 'Inwood–207 St' : '168 St', exactTargetStopCallIdentity: targetIdentity,
    assignedPhysicalTrain: true, atOrigin: true, movementObserved: false, overdueVerdict: 'not-overdue' as const,
    supportedRange, accepted: true,
  }));
  const confidenceReceipt = assessArrivalConfidence({
    assessedAt: BASE, feedState: 'current', exactStopConfirmed: true, trackPathConfirmed: true,
    recoveryDisposition: 'live-continuity', trainPhase: kind === 'live' ? 'running' : 'origin-awaiting-departure',
    progressAt: kind === 'live' ? at(-10) : null, predictedAt: at(centerSeconds), lastSupportedAt: at(-10),
    dueStartedAt: null, unusualDwellVerdict: 'not-unusual', expectedUpdates: kind === 'expected' ? expectedUpdates : undefined,
  });
  if (confidenceReceipt.kind !== kind || !confidenceReceipt.primary) {
    throw new Error(`Timeline ${kind} confidence was not admitted`);
  }
  const candidate: ArrivalAdmissionCandidate = {
    stableTrainIdentity: trainIdentity, publishedTripId: `trip:${trainIdentity}`, patternIdentity: `pattern:${trainIdentity}`,
    feedGroupId: 'bdfm', route: { id: routeId, label: routeId }, routeOrderKind: 'lettered', direction: 'northbound',
    destination: routeId === 'A' ? 'Inwood–207 St' : '168 St', remainingStopCalls: [stopCall],
    serviceDisposition: 'eligible', trackDisposition: 'eligible', freshness: 'current', identityDisposition: 'coherent',
    recoveryDisposition: 'live-continuity', movementDisposition: 'plausible',
    confidence: kind === 'live' ? { kind: 'live', supportedRange } : { kind: 'expected', updates: expectedUpdates },
    provenance: { source: 'gtfs-rt', sourceId: 'bdfm-feed', observedAt: BASE, retrievedAt: BASE },
  };
  return admitArrivalCandidate(candidate, {
    feedGroupId: 'bdfm', exactStopId: 'A12N', direction: 'northbound', destination: candidate.destination, comparisonAt: BASE,
  });
}

function serviceClaim(routeId: string): ServiceClaimScope {
  return {
    claimId: `claim-${routeId.toLowerCase()}-a24n`, routeId, exactDirectionalStopId: 'A24N',
    constituentStopId: 'A24', direction: 'northbound', tripId: `trip-${routeId.toLowerCase()}-1`,
    trainId: `train-${routeId.toLowerCase()}-1`,
  };
}

function baseAlert(): ServiceAlertEvidence {
  return {
    alertId: 'alert-f', activePeriods: [], selectors: [{ selectorId: 'route-f', routeId: 'F' }],
    structuredEffect: 'MODIFIED_SERVICE', declaredConsequence: 'generic-affected',
    official: { headerRaw: 'F trains are affected', descriptionRaw: 'Review current service.' },
  };
}

function bypassAlert(): ServiceAlertEvidence {
  return {
    ...baseAlert(),
    alertId: 'positive-bypass',
    declaredConsequence: 'local-running-express',
    selectors: [{ selectorId: 'exact-a24n', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N'] }],
    official: {
      headerRaw: 'F trains are bypassing 14 St on the express track.',
      descriptionRaw: 'F trains skip 14 St.',
    },
  };
}

function alertSnapshot(alerts: readonly ServiceAlertEvidence[]) {
  return classifyAlertSnapshot({ status: 'accepted', feedTimestamp: BASE, retrievedAt: BASE, alerts }, BASE);
}

function recoveryUpdate(evidenceId: string, seconds: number): ServiceRecoveryUpdate {
  return {
    evidenceId, sourceTimestamp: at(seconds), currentFeed: true, coherentIdentity: true,
    exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
  };
}

function admitServiceArrival(
  decision: ServiceChangeDecision,
  recoveryDisposition: ArrivalAdmissionCandidate['recoveryDisposition'] = 'live-continuity',
): ArrivalAdmissionDecision {
  const comparisonAt = new Date(decision.assessedAtMs);
  const plus = (seconds: number) => new Date(comparisonAt.getTime() + seconds * 1_000);
  const minus = (seconds: number) => new Date(comparisonAt.getTime() - seconds * 1_000);
  const confidence = assessArrivalConfidence({
    assessedAt: comparisonAt,
    feedState: 'current',
    exactStopConfirmed: true,
    trackPathConfirmed: true,
    recoveryDisposition,
    trainPhase: 'running',
    progressAt: minus(10),
    predictedAt: plus(180),
    lastSupportedAt: minus(5),
    dueStartedAt: null,
    unusualDwellVerdict: 'not-unusual',
  });
  const claim = decision.evaluatedClaim;
  const candidate: ArrivalAdmissionCandidate = {
    stableTrainIdentity: claim.trainId ?? `train-${claim.routeId.toLowerCase()}-1`,
    publishedTripId: claim.tripId ?? `trip-${claim.routeId.toLowerCase()}-1`,
    patternIdentity: `A23N:1>A24N:2>A25N:3:${claim.routeId}`,
    feedGroupId: 'bdfm',
    route: { id: claim.routeId, label: claim.routeId },
    routeOrderKind: 'lettered',
    direction: claim.direction,
    destination: claim.routeId === 'E' ? 'World Trade Center' : 'Jamaica–179 St',
    remainingStopCalls: [{
      stopId: claim.exactDirectionalStopId,
      sourceStopSequence: 2,
      arrivalAt: plus(180),
      departureAt: plus(190),
      scheduleRelationship: 'SCHEDULED',
    }],
    serviceChangeGate: decision,
    serviceClaimId: claim.claimId,
    serviceDisposition: 'eligible',
    trackDisposition: 'eligible',
    freshness: 'current',
    identityDisposition: 'coherent',
    recoveryDisposition,
    movementDisposition: confidence.kind === 'live' ? 'plausible' : confidence.kind === 'holding' ? 'holding' : 'uncertain',
    confidence: { kind: 'live', supportedRange: { startsAt: plus(160), endsAt: plus(200) } },
    provenance: { source: 'gtfs-rt', sourceId: 'bdfm-feed', observedAt: minus(5), retrievedAt: comparisonAt },
  };
  const scope: ArrivalBoardScope = {
    feedGroupId: 'bdfm', exactStopId: claim.exactDirectionalStopId, direction: claim.direction,
    destination: candidate.destination, comparisonAt,
    serviceAssessmentAt: comparisonAt,
    serviceAlertContextIdentity: decision.alertContextIdentity,
  };
  return admitArrivalCandidate(candidate, scope);
}

function serviceBoardFromAdmissions(admissions: readonly ArrivalAdmissionDecision[], alertText: string): BoardEnvelopeDto {
  const admitted = admissions.flatMap((receipt) => receipt.kind === 'admitted' ? [receipt.row.arrival] : []);
  const decidedAt = admitted.reduce((latest, row) => Math.max(latest, row.provenance.retrievedAt.getTime()), BASE.getTime());
  const decision: BoardDecision = {
    responseIdentity: `domain-board-service-${admitted.map(({ id }) => id).join('-') || 'none'}`,
    mode: 'live',
    station: { id: 'A24', name: '14 St', complexId: 'A24', routeIds: ['E', 'F'] },
    directions: [{ direction: 'northbound', primary: admitted, secondary: [], explanations: [] }],
    feedHealth: [{ source: 'gtfs-rt', state: 'current', assessedAt: new Date(decidedAt), lastAcceptedAt: new Date(decidedAt) }],
    alerts: [{
      id: 'alert-f-service-change', text: alertText, activeFrom: new Date(decidedAt - 60_000), routeIds: ['F'],
      stationIds: ['A24'], directions: ['northbound'],
      provenance: { source: 'alerts', sourceId: 'mta-service-alerts', observedAt: new Date(decidedAt), retrievedAt: new Date(decidedAt) },
    }],
    decidedAt: new Date(decidedAt), explanations: [],
    capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
  };
  const sourceHealth = [{
    source: 'gtfs-rt', sourceId: 'bdfm-feed', state: 'current' as const,
    assessedAt: new Date(decidedAt).toISOString(), lastAcceptedAt: new Date(decidedAt).toISOString(),
  }];
  const provenance = [
    { source: 'gtfs-rt', sourceId: 'bdfm-feed', observedAt: new Date(decidedAt - 5_000).toISOString(), retrievedAt: new Date(decidedAt).toISOString() },
    { source: 'alerts', sourceId: 'mta-service-alerts', observedAt: new Date(decidedAt).toISOString(), retrievedAt: new Date(decidedAt).toISOString() },
  ];
  const data = buildBoardDto(decision, new Date(decidedAt + 90_000).toISOString(), { routeIds: [] }, sourceHealth, provenance);
  const base = boardEnvelope('A24', '14 St', ['E', 'F']);
  return {
    ...base,
    responseIdentity: decision.responseIdentity,
    decidedAt: decision.decidedAt.toISOString(), serverTime: decision.decidedAt.toISOString(),
    sourceHealth: data.sourceHealth, provenance: data.provenance, data: data as BoardEnvelopeDto['data'],
  };
}

const SCHEDULE_BASE = new Date('2026-08-05T03:55:00.000Z');
const scheduleIso = (seconds: number) => new Date(SCHEDULE_BASE.getTime() + seconds * 1_000).toISOString();
const scheduleMask: ScheduleCoverageMask = {
  id: 'supplemented-weekend', routeIds: ['A'], serviceDates: ['20260804'],
  effectiveFrom: scheduleIso(-3_600), effectiveUntil: scheduleIso(7_200), directions: ['northbound'],
};

function scheduleEdition(): StaticGtfsEditionCandidate {
  return {
    source: 'supplemented-gtfs', canonicalContentId: 'supplemented-fixture-edition',
    retrievedAt: scheduleIso(-60), publishedAt: scheduleIso(-120), sourceOrder: 1,
    coverage: [scheduleMask], wrapper: {}, semanticTables: new Map(), data: scheduleData(),
  };
}

function scheduleData(): NormalizedStaticGtfs {
  const trips = [
    { tripId: 'a-supp-1', routeId: 'A', serviceId: 'WKND', headsign: 'Inwood–207 St', directionId: '0', shapeId: '', rowIdentity: 'trip:a-supp-1' },
    { tripId: 'a-supp-2', routeId: 'A', serviceId: 'WKND', headsign: 'Inwood–207 St', directionId: '0', shapeId: '', rowIdentity: 'trip:a-supp-2' },
  ];
  const stopTime = (tripId: string, time: string, sequence: number) => {
    const [hour, minute, second] = time.split(':').map(Number);
    const seconds = hour * 3_600 + minute * 60 + second;
    return {
      tripId, arrivalTime: time, departureTime: time, arrivalSeconds: seconds, departureSeconds: seconds,
      stopId: 'A12N', stopSequence: sequence, rowIdentity: `${tripId}:${sequence}:${time}`,
    };
  };
  return {
    agencies: [],
    routes: [{ routeId: 'A', agencyId: '', shortName: 'A', longName: '', rowIdentity: 'route:A' }],
    stops: [{ stopId: 'A12N', name: '125 St', latitude: null, longitude: null, locationType: '', parentStation: 'A12', direction: 'northbound', rowIdentity: 'stop:A12N' }],
    trips,
    stopTimes: [stopTime('a-supp-1', '24:05:00', 13), stopTime('a-supp-2', '24:08:00', 13)],
    calendars: [{ serviceId: 'WKND', weekdays: [true, true, true, true, true, true, true], startDate: '20260801', endDate: '20260831', rowIdentity: 'calendar:WKND' }],
    calendarDates: [], transfers: [], shapes: [], structuralTransfers: [], stationComplexes: [],
    servicePatterns: trips.map((trip) => ({
      tripId: trip.tripId, routeId: trip.routeId, direction: 'northbound' as const,
      headsign: trip.headsign, stopIds: ['A12N'],
    })),
  };
}

function impact(): NotificationImpact {
  return {
    episodeId: 'episode-1', kind: 'bypass', routeId: 'F', direction: 'southbound', affectedStationIds: ['D18'],
    activeFrom: new Date('2026-08-03T11:50:00.000Z'), activeUntil: new Date('2026-08-03T13:00:00.000Z'),
    evidenceCurrent: true, decisionChanging: true, correctionOnly: false, addedJourneySeconds: 600,
    recommendedActions: [{ id: 'use-a-c', tier: 1, riderRank: 1, label: 'Use the A/C from W 4 St.' }],
  };
}

function baseline(): DeliveredNotificationBaseline {
  return {
    episodeId: 'episode-1', impactKind: 'bypass', routeId: 'F', direction: 'southbound',
    affectedStationIds: ['D18'], addedJourneySeconds: 600, activeUntil: new Date('2026-08-03T13:00:00.000Z'),
    recommendedActionId: 'use-a-c', deliveredAt: new Date('2026-08-03T11:55:00.000Z'),
  };
}

function reconnectionContext(scenario: ReconnectionScenario): PreservedReconnectionContext {
  const optional = scenario === 'Reconnect · optional guidance removed';
  const context: PreservedReconnectionContext = {
    stationId: 'A12', direction: 'northbound', routeFilters: ['A'], accessibleRouteOnly: true,
    mapTuple: { referenceMode: 'actual', theme: 'night', contentVersion: 'map-7', viewportKey: 'viewport-7' },
    activeTripId: 'trip-7', manualCursor: { legIndex: 0, stopId: 'A12' }, hasStoredTrainChoice: true,
    guidanceRequirements: { positioning: optional ? 'optional' : 'required', transfer: optional ? 'optional' : 'required' },
    activeSurface: 'map', scrollOffset: 0, focusTargetId: 'map-point-a12', readingAnchorId: 'point-a12',
    recovery: {
      epochId: 'epoch-7', requestIdentity: `request-${scenario.replace(/[^a-z0-9]+/giu, '-').toLowerCase()}`,
      generation: 7, startedAt: '2026-08-05T12:00:00.000Z', activeTripId: 'trip-7', contextKey: 'context-7',
      eligibleScopes: [
        { kind: 'context', id: 'context-7' }, { kind: 'station', id: 'A12' }, { kind: 'route', id: 'A' },
        { kind: 'direction', id: 'northbound' }, { kind: 'transfer', id: 'transfer-7' },
        { kind: 'train', id: 'train-7' }, { kind: 'map', id: 'viewport-7' }, { kind: 'saved-record', id: 'saved-7' },
      ],
      ownerScopes: {
        equipment: [{ kind: 'station', id: 'A12' }], 'accessible-path': [{ kind: 'station', id: 'A12' }],
        'service-change': [{ kind: 'route', id: 'A' }, { kind: 'transfer', id: 'transfer-7' }], 'feed-health': [{ kind: 'station', id: 'A12' }],
        'train-admission': [{ kind: 'train', id: 'train-7' }], arrivals: [{ kind: 'station', id: 'A12' }],
        positioning: [{ kind: 'station', id: 'A12' }], 'transfer-guidance': [{ kind: 'transfer', id: 'transfer-7' }],
        maps: [{ kind: 'map', id: 'viewport-7' }], saved: [{ kind: 'saved-record', id: 'saved-7' }],
      },
    },
  };
  return context;
}

function ownerGate(context: PreservedReconnectionContext, domain: OwnerAcceptance['domain'], evidenceId = `${domain}-evidence`): OwnerAcceptance {
  return {
    domain, ownerId: `${domain}-owner`, evidenceId, evidenceAt: '2026-08-05T12:00:01.000Z', acceptedAt: '2026-08-05T12:00:01.000Z',
    recoveryEpochId: context.recovery.epochId, requestIdentity: context.recovery.requestIdentity,
    generation: context.recovery.generation, activeTripId: context.recovery.activeTripId,
    contextKey: context.recovery.contextKey, scopeMembership: context.recovery.ownerScopes[domain], disposition: 'accepted-fresh',
  };
}

function oneSnapshotStage(context: PreservedReconnectionContext): ReconnectionStageResult {
  const feed = ownerGate(context, 'feed-health', 'feed-readmitted');
  const train = ownerGate(context, 'train-admission', 'stored-train-awaiting-confirmation');
  const arrivals = ownerGate(context, 'arrivals', 'arrivals-aggregate-one-snapshot');
  const snapshot = ownerGate(context, 'arrivals', 'arrivals-snapshot-1');
  return {
    stage: 3,
    feedRecovery: { gate: feed, disposition: 'readmitted' },
    trainReadmission: { gate: train, disposition: 'admitted' },
    arrivals: { gate: arrivals, disposition: 'withheld', freshSnapshotCount: 1, freshSnapshots: [snapshot] },
    storedTrainChoice: 'unverified',
    invalidation: {
      id: `${context.recovery.requestIdentity}:warning:3`,
      stage: 3,
      ownerGate: train,
      changedFact: 'The stored train choice has only one fresh confirming snapshot.',
      scopes: [{ kind: 'train', id: 'train-7', label: 'train train-7' }],
      consequence: 'Use the historical arrival only as a past observation.',
      lastVerifiedDecisionPoint: { id: 'A12', label: 'Stored trip point A12' },
      verifiedAlternative: null,
    },
  };
}

function validStage(context: PreservedReconnectionContext, stage: ReconnectionStage): ReconnectionStageResult {
  const gate = (domain: OwnerAcceptance['domain'], evidenceId?: string) => ownerGate(context, domain, evidenceId);
  if (stage === 1) return {
    stage, equipment: { gate: gate('equipment'), disposition: 'verified-operational' },
    accessiblePath: { gate: gate('accessible-path'), requiredForActiveTrip: true, completeness: 'complete-exact-path', disposition: 'verified' },
    invalidation: null,
  };
  if (stage === 2) return {
    stage, serviceChanges: { gate: gate('service-change'), disposition: 'resolved', vetoesApplied: true },
    tripServicePattern: 'verified', invalidation: null,
  };
  if (stage === 3) return {
    stage, feedRecovery: { gate: gate('feed-health'), disposition: 'readmitted' },
    trainReadmission: { gate: gate('train-admission'), disposition: 'admitted' },
    arrivals: {
      gate: gate('arrivals', 'arrivals-aggregate'), disposition: 'current', freshSnapshotCount: 2,
      freshSnapshots: [gate('arrivals', 'arrivals-1'), gate('arrivals', 'arrivals-2')],
    },
    storedTrainChoice: 'verified', invalidation: null,
  };
  if (stage === 4) return {
    stage,
    positioning: { gate: gate('positioning'), requirement: context.guidanceRequirements.positioning, disposition: 'verified' },
    transferGuidance: { gate: gate('transfer-guidance'), requirement: context.guidanceRequirements.transfer, disposition: 'verified' },
    invalidation: null,
  };
  return {
    stage, maps: { gate: gate('maps'), disposition: 'refreshed' },
    unrelatedSaved: { gate: gate('saved'), disposition: 'refreshed' },
  };
}
