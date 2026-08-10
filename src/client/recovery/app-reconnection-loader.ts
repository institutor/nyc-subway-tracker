import type {
  BoardEnvelopeDto,
  JourneyEnvelopeDto,
  JourneyItineraryDto,
  LiveArrivalDto,
  MapOverlayEnvelopeDto,
  TransitApiClient,
} from '../api/client';
import type { ActiveTripRecord } from '../storage/active-trip-store';
import type { Direction } from '../../shared/domain/types';
import { serviceDateTimeToInstant } from '../../shared/domain/clock';
import type {
  OwnerAcceptance,
  PreservedReconnectionContext,
  ReconnectionScopeKind,
  ReconnectionScopeMembership,
  ReconnectionStageResult,
} from '../../shared/domain/reconnection';
import type { ReconnectionStageRequest } from './run-reconnection';

const SELECTED_DEPARTURE_TOLERANCE_MS = 90_000;

export interface AppReconnectionArtifacts {
  selectedBoard?: BoardEnvelopeDto;
  mapOverlay?: MapOverlayEnvelopeDto;
}

export interface AppReconnectionLoaderOptions {
  readonly api: TransitApiClient;
  readonly stationId: string | null;
  readonly filters: {
    readonly routeIds: readonly string[];
    readonly direction?: Direction;
  };
  readonly hasUnrelatedSavedRecords: boolean;
  readonly artifacts: AppReconnectionArtifacts;
  readonly activeTrip: ActiveTripRecord | null;
  readonly now?: () => Date;
}

export function createAppReconnectionStageLoader(options: AppReconnectionLoaderOptions) {
  return async (
    request: ReconnectionStageRequest,
    signal: AbortSignal,
  ): Promise<ReconnectionStageResult | undefined> => {
    const { stage, context } = request;
    if (stage === 1 || stage === 4) return undefined;
    if (stage === 2) return loadServiceChanges(options, context, signal);
    if (stage === 3) return loadArrivals(options, context, signal);
    return loadBackground(options, context, signal);
  };
}

async function loadServiceChanges(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  if (context.activeTripId !== null) return loadActiveTripServiceChanges(options, context, signal);
  if (!options.stationId) return undefined;
  const board = await options.api.board(options.stationId, options.filters, signal);
  if (!isFreshBoard(board, context, options.stationId)) return undefined;
  const acceptedAt = exactNow(options.now);
  const serviceChanges = acceptedGate(
    context, 'service-change', board.responseIdentity, board.decidedAt, acceptedAt, ownerScope(context, 'service-change'),
  );
  return {
    stage: 2,
    serviceChanges: { gate: serviceChanges, disposition: 'resolved', vetoesApplied: true },
    tripServicePattern: 'not-applicable',
    invalidation: null,
  };
}

async function loadActiveTripServiceChanges(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  const trip = options.activeTrip;
  if (!trip || trip.id !== context.activeTripId || trip.legs.length === 0) return undefined;
  const firstLeg = trip.legs[0]!;
  const response = await options.api.planJourney({
    mode: 'online-current',
    originStationId: trip.origin.constituentId,
    destinationStationId: trip.destination.constituentId,
    requiredFirstDirection: firstLeg.boundDirection,
    requiredActualDestination: firstLeg.actualDestination,
    accessibleRouteOnly: trip.accessibleRouteOnly,
  }, signal);
  if (!isFreshJourney(response, context, trip)) return undefined;

  const acceptedAt = exactNow(options.now);
  const serviceChanges = acceptedGate(
    context,
    'service-change',
    response.responseIdentity,
    response.decidedAt,
    acceptedAt,
    ownerScope(context, 'service-change'),
  );
  const candidates = response.data?.kind === 'planned' ? response.data.itineraries : [];
  const exactCandidate = candidates.find((candidate) => (
    sameOwnedActiveTripPattern(candidate, trip, serviceChanges.scopeMembership)
  ));
  const evaluatedCandidate = exactCandidate ?? bestComparableCandidate(candidates, trip, serviceChanges.scopeMembership);
  const verified = Boolean(exactCandidate && currentCandidateAdmitsStoredPattern(
    exactCandidate,
    trip,
    serviceChanges.scopeMembership,
  ));
  const unusable = response.data?.kind === 'no-path'
    || Boolean(exactCandidate && !verified)
    || (response.data?.kind === 'planned' && !exactCandidate);
  return {
    stage: 2,
    serviceChanges: { gate: serviceChanges, disposition: 'resolved', vetoesApplied: true },
    tripServicePattern: verified ? 'verified' : unusable ? 'unusable' : 'unverified',
    invalidation: verified ? null : serviceInvalidation(
      context,
      serviceChanges,
      unusable,
      affectedServiceScopes(serviceChanges.scopeMembership, trip, evaluatedCandidate),
    ),
  };
}

function isFreshJourney(
  response: JourneyEnvelopeDto,
  context: PreservedReconnectionContext,
  trip: ActiveTripRecord,
): boolean {
  const scope = response.data?.scope;
  return response.runtime.availability === 'available'
    && response.data !== null
    && scope?.mode === 'online-current'
    && scope.originStationId === trip.origin.constituentId
    && scope.destinationStationId === trip.destination.constituentId
    && scope.accessibleRouteOnly === trip.accessibleRouteOnly
    && hasCurrentServiceOwner(response)
    && freshInstant(response.decidedAt, context.recovery.startedAt)
    && freshInstant(response.serverTime, context.recovery.startedAt);
}

function hasCurrentServiceOwner(response: JourneyEnvelopeDto): boolean {
  const provenance = response.provenance ?? [];
  return response.sourceHealth?.some((health) => (
    (health.source === 'alerts' || health.source === 'supplemented-gtfs')
    && health.state === 'current'
    && provenance.some((evidence) => (
      evidence.source === health.source && evidence.sourceId === health.sourceId
    ))
  )) === true;
}

function sameOwnedActiveTripPattern(
  candidate: JourneyItineraryDto,
  trip: ActiveTripRecord,
  ownerScopes: readonly ReconnectionScopeMembership[],
): boolean {
  if (candidate.legs.length !== trip.legs.length) return false;
  const ownedLegIds = new Set(ownerScopes.filter(({ kind }) => kind === 'leg').map(({ id }) => id));
  if (ownedLegIds.size === 0) {
    return candidate.legs.every((leg, index) => sameActiveTripLeg(leg, trip.legs[index]));
  }
  const storedOwnedLegs = trip.legs.filter(({ id }) => ownedLegIds.has(id));
  return storedOwnedLegs.length === ownedLegIds.size
    && candidate.legs.every((leg, index) => {
      const stored = trip.legs[index];
      return stored !== undefined && (!ownedLegIds.has(stored.id) || sameActiveTripLeg(leg, stored));
    });
}

function sameActiveTripLeg(
  candidate: JourneyItineraryDto['legs'][number],
  stored: ActiveTripRecord['legs'][number] | undefined,
): boolean {
  return stored !== undefined
    && candidate.routeId === stored.route.id
    && candidate.direction === stored.boundDirection
    && candidate.actualDestination === stored.actualDestination
    && sameStrings(candidate.orderedStationIds, stored.points.map(({ constituentId }) => constituentId));
}

function bestComparableCandidate(
  candidates: readonly JourneyItineraryDto[],
  trip: ActiveTripRecord,
  ownerScopes: readonly ReconnectionScopeMembership[],
): JourneyItineraryDto | undefined {
  const ownedLegIds = new Set(ownerScopes.filter(({ kind }) => kind === 'leg').map(({ id }) => id));
  return candidates
    .filter(({ legs }) => legs.length === trip.legs.length)
    .map((candidate, responseIndex) => ({
      candidate,
      responseIndex,
      matches: candidate.legs.reduce((count, leg, index) => (
        ownedLegIds.has(trip.legs[index]?.id ?? '') && sameActiveTripLeg(leg, trip.legs[index]) ? count + 1 : count
      ), 0),
    }))
    .sort((left, right) => right.matches - left.matches || left.responseIndex - right.responseIndex)[0]?.candidate;
}

function affectedServiceScopes(
  ownerScopes: readonly ReconnectionScopeMembership[],
  trip: ActiveTripRecord,
  candidate: JourneyItineraryDto | undefined,
): readonly (ReconnectionScopeMembership & { readonly kind: ReconnectionScopeKind })[] {
  const ownedLegScopes = ownerScopes.filter((scope): scope is ReconnectionScopeMembership & { readonly kind: 'leg' } => (
    scope.kind === 'leg'
  ));
  if (ownedLegScopes.length === 0) return ownerScopes.filter(isTripScope);
  if (!candidate || candidate.legs.length !== trip.legs.length) return ownedLegScopes;

  const ownedLegIds = new Set(ownedLegScopes.map(({ id }) => id));
  const affected = new Set<string>();
  candidate.legs.forEach((leg, index) => {
    const stored = trip.legs[index];
    if (stored && ownedLegIds.has(stored.id) && !sameActiveTripLeg(leg, stored)) affected.add(stored.id);
  });
  if (candidate.capture) {
    for (const claim of blockingServiceEvidence(candidate)) {
      for (const legId of claimLegIds(claim.scope, candidate, trip)) {
        if (ownedLegIds.has(legId)) affected.add(legId);
      }
    }
  }
  if (affected.size === 0) return ownedLegScopes;
  return ownedLegScopes.filter(({ id }) => affected.has(id));
}

function claimLegIds(
  scope: NonNullable<JourneyItineraryDto['capture']>['serviceClaims'][number]['scope'],
  candidate: JourneyItineraryDto,
  trip: ActiveTripRecord,
): readonly string[] {
  if (scope.kind === 'itinerary') return trip.legs.map(({ id }) => id);
  return candidate.legs.flatMap((leg, index) => {
    const stored = trip.legs[index];
    if (!stored) return [];
    if (scope.kind === 'route') return leg.routeId === scope.routeId ? [stored.id] : [];
    if (scope.kind === 'direction') {
      return leg.routeId === scope.routeId && leg.direction === scope.direction ? [stored.id] : [];
    }
    return leg.patternId === scope.patternId ? [stored.id] : [];
  });
}

function currentCandidateAdmitsStoredPattern(
  candidate: JourneyItineraryDto,
  trip: ActiveTripRecord,
  ownerScopes: readonly ReconnectionScopeMembership[],
): boolean {
  const capture = candidate.capture;
  if (!capture
    || capture.requestMode !== 'online-current'
    || capture.validity.result !== 'current-itinerary'
    || capture.validity.pattern !== 'actual-now'
    || candidate.validity !== 'valid'
    || (trip.accessibleRouteOnly && candidate.accessibility !== 'eligible')) return false;
  const blockingEvidence = blockingServiceEvidence(candidate);
  const ownedLegIds = new Set(ownerScopes.filter(({ kind }) => kind === 'leg').map(({ id }) => id));
  const relevantBlockingEvidence = blockingEvidence.some(({ scope }) => (
    ownedLegIds.size === 0
      || claimLegIds(scope, candidate, trip).some((legId) => ownedLegIds.has(legId))
  ));
  if (relevantBlockingEvidence) return false;
  return (candidate.risk !== 'blocked' && candidate.risk !== 'uncertain') || blockingEvidence.length > 0;
}

function blockingServiceEvidence(candidate: JourneyItineraryDto) {
  const capture = candidate.capture;
  if (!capture) return [];
  return [
    ...capture.validity.vetoes,
    ...capture.serviceClaims.filter(({ state }) => (
      state === 'unresolved' || state === 'suspended' || state === 'bypassed'
      || state === 'closed' || state === 'cancelled'
    )),
  ];
}

function serviceInvalidation(
  context: PreservedReconnectionContext,
  ownerGate: OwnerAcceptance,
  unusable: boolean,
  affectedScopes: readonly (ReconnectionScopeMembership & { readonly kind: ReconnectionScopeKind })[],
) {
  if (affectedScopes.length === 0) throw new Error('Active-trip service recovery requires an exact trip scope');
  return {
    id: `${context.recovery.requestIdentity}:warning:2:${ownerGate.evidenceId}`,
    stage: 2 as const,
    ownerGate,
    changedFact: unusable
      ? 'Current service evidence no longer admits the stored trip pattern.'
      : 'Current service evidence cannot verify the stored trip pattern.',
    scopes: affectedScopes.map((scope) => ({ ...scope, label: `${scope.kind} ${scope.id}` })),
    consequence: 'Do not continue on the stored service pattern until a current itinerary is verified.',
    lastVerifiedDecisionPoint: context.manualCursor
      ? { id: context.manualCursor.stopId, label: `Stored trip point ${context.manualCursor.stopId}` }
      : null,
    verifiedAlternative: null,
  };
}

function isTripScope(
  candidate: ReconnectionScopeMembership,
): candidate is ReconnectionScopeMembership & { readonly kind: ReconnectionScopeKind } {
  return candidate.kind !== 'context' && candidate.kind !== 'map' && candidate.kind !== 'saved-record';
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function loadArrivals(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  if (!options.stationId) return undefined;
  const first = await options.api.board(options.stationId, options.filters, signal);
  if (!isFreshBoard(first, context, options.stationId)) return undefined;
  const firstAcceptedAt = exactNow(options.now);
  if (context.hasStoredTrainChoice) {
    const second = await options.api.board(options.stationId, options.filters, signal);
    if (!isFreshBoard(second, context, options.stationId)
      || first.responseIdentity === second.responseIdentity
      || Date.parse(second.decidedAt) < Date.parse(first.decidedAt)
      || !coherentlyTracksStoredTrain(first, second, options.activeTrip)) {
      return oneSnapshotWithheld(context, first, firstAcceptedAt);
    }
    const secondAcceptedAt = exactNow(options.now);
    const scope = stationScope(context, options.stationId);
    const firstSnapshot = acceptedGate(
      context, 'arrivals', first.responseIdentity, first.decidedAt, firstAcceptedAt, scope,
    );
    const secondSnapshot = acceptedGate(
      context, 'arrivals', second.responseIdentity, second.decidedAt, secondAcceptedAt, scope,
    );
    options.artifacts.selectedBoard = second;
    return {
      stage: 3,
      feedRecovery: {
        gate: acceptedGate(context, 'feed-health', second.responseIdentity, second.decidedAt, secondAcceptedAt, scope),
        disposition: 'readmitted',
      },
      trainReadmission: {
        gate: acceptedGate(
          context, 'train-admission', second.responseIdentity, second.decidedAt, secondAcceptedAt,
          ownerScope(context, 'train-admission'),
        ),
        disposition: 'admitted',
      },
      arrivals: {
        gate: acceptedGate(
          context, 'arrivals', `${first.responseIdentity}:${second.responseIdentity}`,
          second.decidedAt, secondAcceptedAt, scope,
        ),
        disposition: 'current',
        freshSnapshotCount: 2,
        freshSnapshots: [firstSnapshot, secondSnapshot],
      },
      storedTrainChoice: 'verified',
      invalidation: null,
    };
  }
  const second = await options.api.board(options.stationId, options.filters, signal);
  if (!isFreshBoard(second, context, options.stationId)
    || first.responseIdentity === second.responseIdentity
    || Date.parse(second.decidedAt) < Date.parse(first.decidedAt)) return undefined;
  const secondAcceptedAt = exactNow(options.now);

  const scope = stationScope(context, options.stationId);
  const firstSnapshot = acceptedGate(context, 'arrivals', first.responseIdentity, first.decidedAt, firstAcceptedAt, scope);
  const secondSnapshot = acceptedGate(context, 'arrivals', second.responseIdentity, second.decidedAt, secondAcceptedAt, scope);
  options.artifacts.selectedBoard = second;
  return {
    stage: 3,
    feedRecovery: {
      gate: acceptedGate(context, 'feed-health', second.responseIdentity, second.decidedAt, secondAcceptedAt, scope),
      disposition: 'readmitted',
    },
    trainReadmission: {
      gate: acceptedGate(
        context, 'train-admission', second.responseIdentity, second.decidedAt, secondAcceptedAt,
        ownerScope(context, 'train-admission'),
      ),
      disposition: 'admitted',
    },
    arrivals: {
      gate: acceptedGate(
        context,
        'arrivals',
        `${first.responseIdentity}:${second.responseIdentity}`,
        second.decidedAt,
        secondAcceptedAt,
        scope,
      ),
      disposition: 'current',
      freshSnapshotCount: 2,
      freshSnapshots: [firstSnapshot, secondSnapshot],
    },
    storedTrainChoice: 'none',
    invalidation: null,
  };
}

function oneSnapshotWithheld(
  context: PreservedReconnectionContext,
  first: BoardEnvelopeDto,
  acceptedAt: string,
): ReconnectionStageResult {
  const stationScopes = ownerScope(context, 'arrivals');
  const trainScopes = ownerScope(context, 'train-admission');
  const feed = acceptedGate(
    context, 'feed-health', first.responseIdentity, first.decidedAt, acceptedAt, ownerScope(context, 'feed-health'),
  );
  const train = failClosedGate(
    context,
    'train-admission',
    acceptedAt,
    trainScopes,
    'A stored train requires two coherent fresh board snapshots.',
  );
  const snapshot = acceptedGate(
    context, 'arrivals', first.responseIdentity, first.decidedAt, acceptedAt, stationScopes,
  );
  const arrivals = acceptedGate(
    context, 'arrivals', `${first.responseIdentity}:one-coherent-snapshot`, first.decidedAt, acceptedAt, stationScopes,
  );
  return {
    stage: 3,
    feedRecovery: { gate: feed, disposition: 'readmitted' },
    trainReadmission: { gate: train, disposition: 'blocked' },
    arrivals: {
      gate: arrivals,
      disposition: 'withheld',
      freshSnapshotCount: 1,
      freshSnapshots: [snapshot],
    },
    storedTrainChoice: 'unverified',
    invalidation: {
      id: `${context.recovery.requestIdentity}:warning:3:${train.evidenceId}`,
      stage: 3,
      ownerGate: train,
      changedFact: 'The stored train choice has only one coherent fresh snapshot.',
      scopes: trainScopes.filter(isTripScope).map((scope) => ({ ...scope, label: `${scope.kind} ${scope.id}` })),
      consequence: 'Use the historical arrival only as a past observation.',
      lastVerifiedDecisionPoint: context.manualCursor
        ? { id: context.manualCursor.stopId, label: `Stored trip point ${context.manualCursor.stopId}` }
        : null,
      verifiedAlternative: null,
    },
  };
}

function coherentlyTracksStoredTrain(
  first: BoardEnvelopeDto,
  second: BoardEnvelopeDto,
  trip: ActiveTripRecord | null,
): boolean {
  if (!trip) return false;
  const cursorLeg = trip.legs.find((leg) => leg.points.some(({ id }) => id === trip.cursor.pointId));
  if (!cursorLeg) return false;
  const schedule = trip.validity.schedule;
  if (schedule.kind !== 'current' && schedule.kind !== 'stale') return false;
  const departures = schedule.departures.filter(({ legId, pointId }) => (
    legId === cursorLeg.id && pointId === trip.cursor.pointId
  ));
  if (departures.length !== 1) return false;
  const selectedDeparture = departures[0]!;
  let selectedAt: number;
  try {
    const clockTime = /^\d{2}:\d{2}$/u.test(selectedDeparture.clockTime)
      ? `${selectedDeparture.clockTime}:00`
      : selectedDeparture.clockTime;
    selectedAt = serviceDateTimeToInstant(trip.validity.serviceDate, clockTime, 'reject').getTime();
  } catch {
    return false;
  }
  const selectedWindowMs = SELECTED_DEPARTURE_TOLERANCE_MS;
  const candidates = (board: BoardEnvelopeDto) => board.data?.directions
    .flatMap(({ primary }) => primary)
    .filter((arrival): arrival is LiveArrivalDto => arrival.kind === 'live'
      && arrival.route.id === cursorLeg.route.id
      && arrival.direction === cursorLeg.boundDirection
      && arrival.destination === cursorLeg.actualDestination
      && Math.abs(Date.parse(arrival.at) - selectedAt) <= selectedWindowMs) ?? [];
  const firstCandidates = candidates(first);
  const secondCandidates = candidates(second);
  if (firstCandidates.length !== 1 || secondCandidates.length !== 1) return false;
  const previous = firstCandidates[0]!;
  const current = secondCandidates[0]!;
  return previous.id === current.id
    && Date.parse(current.at) >= Date.parse(previous.at)
    && Date.parse(current.at) - Date.parse(previous.at) <= selectedWindowMs;
}

async function loadBackground(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  const overlay = await options.api.mapOverlay(context.mapTuple.theme, signal);
  if (!isFreshOverlay(overlay, context)) return undefined;
  const acceptedAt = exactNow(options.now);
  const mapScope = exactScope(context, 'map', context.mapTuple.viewportKey);
  const savedScope = ownerScope(context, 'saved');
  const mapGate = acceptedGate(context, 'maps', overlay.responseIdentity, overlay.decidedAt, acceptedAt, mapScope);
  const savedGate: OwnerAcceptance = options.hasUnrelatedSavedRecords
    ? failClosedGate(context, 'saved', acceptedAt, savedScope, 'Saved-station owners were not refreshed by this request.')
    : acceptedGate(
        context, 'saved', `${overlay.responseIdentity}:empty-saved-scope`, overlay.decidedAt, acceptedAt, savedScope,
      );
  options.artifacts.mapOverlay = overlay;
  return {
    stage: 5,
    maps: { gate: mapGate, disposition: 'refreshed' },
    unrelatedSaved: {
      gate: savedGate,
      disposition: savedGate.disposition === 'accepted-fresh' ? 'refreshed' : 'unchanged-fail-closed',
    },
  };
}

function acceptedGate(
  context: PreservedReconnectionContext,
  domain: OwnerAcceptance['domain'],
  evidenceId: string,
  evidenceAt: string,
  acceptedAt: string,
  scopeMembership: readonly ReconnectionScopeMembership[],
): OwnerAcceptance {
  return {
    domain,
    ownerId: `${domain}-owner`,
    evidenceId,
    evidenceAt,
    acceptedAt,
    recoveryEpochId: context.recovery.epochId,
    requestIdentity: context.recovery.requestIdentity,
    generation: context.recovery.generation,
    activeTripId: context.recovery.activeTripId,
    contextKey: context.recovery.contextKey,
    scopeMembership,
    disposition: 'accepted-fresh',
  };
}

function failClosedGate(
  context: PreservedReconnectionContext,
  domain: OwnerAcceptance['domain'],
  acceptedAt: string,
  scopeMembership: readonly ReconnectionScopeMembership[],
  reason: string,
): OwnerAcceptance {
  return {
    ...acceptedGate(
      context, domain, `${context.recovery.requestIdentity}:${domain}:unavailable`, acceptedAt, acceptedAt, scopeMembership,
    ),
    disposition: 'governed-fail-closed',
    reason,
  };
}

function stationScope(context: PreservedReconnectionContext, stationId: string): readonly ReconnectionScopeMembership[] {
  return exactScope(context, 'station', stationId);
}

function exactScope(
  context: PreservedReconnectionContext,
  kind: ReconnectionScopeMembership['kind'],
  id: string,
): readonly ReconnectionScopeMembership[] {
  const scope = context.recovery.eligibleScopes.find((candidate) => candidate.kind === kind && candidate.id === id);
  if (!scope) throw new Error(`Recovery scope ${kind}:${id} is not eligible`);
  return [scope];
}

function ownerScope(
  context: PreservedReconnectionContext,
  domain: OwnerAcceptance['domain'],
): readonly ReconnectionScopeMembership[] {
  return context.recovery.ownerScopes[domain];
}

function exactNow(now: (() => Date) | undefined): string {
  const value = now?.() ?? new Date();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new Error('Recovery clock returned an invalid instant');
  }
  return new Date(value.getTime()).toISOString();
}

function isFreshBoard(
  board: BoardEnvelopeDto,
  context: PreservedReconnectionContext,
  stationId: string,
): boolean {
  return board.cacheState === 'network'
    && board.runtime.availability === 'available'
    && board.data?.mode === 'live'
    && board.data.station?.id === stationId
    && board.data.capabilities.arrivals === 'available'
    && board.data.directions.length > 0
    && board.data.sourceHealth.some(({ source, state }) => source === 'gtfs-rt' && state === 'current')
    && freshInstant(board.decidedAt, context.recovery.startedAt)
    && freshInstant(board.serverTime, context.recovery.startedAt);
}

function isFreshOverlay(overlay: MapOverlayEnvelopeDto, context: PreservedReconnectionContext): boolean {
  return overlay.cacheState === 'network'
    && overlay.runtime.availability === 'available'
    && overlay.data?.theme === context.mapTuple.theme
    && typeof overlay.data.serviceEpoch === 'string'
    && overlay.data.serviceEpoch.length > 0
    && freshInstant(overlay.decidedAt, context.recovery.startedAt)
    && freshInstant(overlay.serverTime, context.recovery.startedAt);
}

function freshInstant(candidate: string, epoch: string): boolean {
  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === candidate && parsed >= Date.parse(epoch);
}
