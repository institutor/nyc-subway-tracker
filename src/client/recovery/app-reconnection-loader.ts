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
import { encodeCanonicalStringTuple } from '../../shared/domain/canonical';
import type {
  OwnerAcceptance,
  PreservedReconnectionContext,
  ReconnectionScopeKind,
  ReconnectionScopeMembership,
  ReconnectionStageResult,
} from '../../shared/domain/reconnection';
import type { ReconnectionStageRequest } from './run-reconnection';
import {
  admitOperationalSourceOwners,
  isCanonicalOperationalServiceEpoch,
  operationalSourceOwnerEvidence,
  type OperationalSourceOwnerReceipt,
} from '../../shared/domain/operational-source-owners';

const SELECTED_DEPARTURE_TOLERANCE_MS = 90_000;

interface RealtimeOwnerEvidence {
  readonly sourceId: string;
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly lastAcceptedAt: string;
  readonly assessedAt: string;
  readonly evidenceId: string;
}

interface RealtimeOwnerPair {
  readonly first: RealtimeOwnerEvidence;
  readonly second: RealtimeOwnerEvidence;
}

interface StoredTrainSelection {
  readonly cursorLeg: ActiveTripRecord['legs'][number];
  readonly selectedAt: number;
}

interface StoredTrainRecoveryEvidence {
  readonly board: RealtimeOwnerPair;
  readonly train: RealtimeOwnerPair;
}

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
  const serviceOwners = freshStationServiceOwners(board, context);
  const serviceEvidence = serviceOwners && serviceSourceOwnerEvidence(serviceOwners);
  if (!serviceEvidence) return undefined;
  const acceptedAt = exactNow(options.now);
  const serviceChanges = acceptedGate(
    context, 'service-change', serviceEvidence.evidenceId, serviceEvidence.evidenceAt,
    acceptedAt, ownerScope(context, 'service-change'),
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
  const serviceOwners = freshJourneyServiceOwners(response, context);
  const serviceEvidence = serviceOwners && serviceSourceOwnerEvidence(serviceOwners);
  if (!serviceEvidence) return undefined;

  const acceptedAt = exactNow(options.now);
  const serviceChanges = acceptedGate(
    context,
    'service-change',
    serviceEvidence.evidenceId,
    serviceEvidence.evidenceAt,
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
    && freshInstant(response.decidedAt, context.recovery.startedAt)
    && freshInstant(response.serverTime, context.recovery.startedAt);
}

function freshJourneyServiceOwners(
  response: JourneyEnvelopeDto,
  context: PreservedReconnectionContext,
): readonly OperationalSourceOwnerReceipt[] | undefined {
  const ownerSources = new Set<string>(['alerts']);
  if (response.data?.kind === 'planned' || response.data?.kind === 'untimed') {
    if (response.data.itineraries.some(({ capture }) => {
      const schedule = capture?.validity.schedule;
      return schedule && schedule.kind !== 'none' && schedule.editionId.startsWith('supplemented-gtfs:');
    })) ownerSources.add('supplemented-gtfs');
  }
  const ownerRefs = serviceOwnerRefs(ownerSources, response.provenance ?? [], response.sourceHealth ?? []);
  if ([...ownerSources].some((source) => !ownerRefs.some((ref) => ref.source === source))) return undefined;
  return admitOperationalSourceOwners({
    ownerRefs,
    provenance: response.provenance ?? [],
    sourceHealth: response.sourceHealth ?? [],
    decidedAt: response.decidedAt,
    serverTime: response.serverTime,
    notBefore: context.recovery.startedAt,
  });
}

function freshStationServiceOwners(
  board: BoardEnvelopeDto,
  context: PreservedReconnectionContext,
): readonly OperationalSourceOwnerReceipt[] | undefined {
  if (!board.data) return undefined;
  const decisionProvenance = [
    ...board.data.alerts.map(({ provenance }) => provenance),
    ...board.data.explanations.flatMap(({ provenance }) => provenance ? [provenance] : []),
    ...board.data.directions.flatMap(({ primary, secondary, explanations }) => [
      ...primary.map(({ provenance }) => provenance),
      ...secondary.map(({ provenance }) => provenance),
      ...explanations.flatMap(({ provenance }) => provenance ? [provenance] : []),
    ]),
  ];
  const ownerSources = new Set<string>(['alerts']);
  if (decisionProvenance.some(({ source }) => source === 'supplemented-gtfs')) {
    ownerSources.add('supplemented-gtfs');
  }
  const ownerRefs = serviceOwnerRefs(
    ownerSources,
    board.provenance ?? [],
    board.sourceHealth ?? [],
    board.data.provenance,
    board.data.sourceHealth,
    decisionProvenance,
  );
  if ([...ownerSources].some((source) => !ownerRefs.some((ref) => ref.source === source))) return undefined;
  const envelopeOwners = admitOperationalSourceOwners({
    ownerRefs,
    provenance: board.provenance ?? [],
    sourceHealth: board.sourceHealth ?? [],
    decidedAt: board.decidedAt,
    serverTime: board.serverTime,
    notBefore: context.recovery.startedAt,
  });
  if (!envelopeOwners) return undefined;
  const dataOwners = admitOperationalSourceOwners({
    ownerRefs,
    provenance: board.data.provenance,
    sourceHealth: board.data.sourceHealth,
    decidedAt: board.decidedAt,
    serverTime: board.serverTime,
    claimedReceipts: envelopeOwners,
    notBefore: context.recovery.startedAt,
  });
  if (!dataOwners || decisionProvenance.some((provenance) => (
    isServiceSource(provenance.source)
    && !dataOwners.some((owner) => owner.source === provenance.source
      && owner.sourceId === provenance.sourceId
      && owner.observedAt === provenance.observedAt
      && owner.retrievedAt === provenance.retrievedAt)
  ))) return undefined;
  return dataOwners;
}

function serviceOwnerRefs(
  ownerSources: ReadonlySet<string>,
  ...groups: readonly (readonly { readonly source: string; readonly sourceId: string }[])[]
): readonly { readonly source: string; readonly sourceId: string }[] {
  const refs = groups.flat().filter(({ source }) => ownerSources.has(source) && isServiceSource(source));
  return refs.filter((ref, index) => refs.findIndex((candidate) => (
    candidate.source === ref.source && candidate.sourceId === ref.sourceId
  )) === index);
}

function isServiceSource(source: string): boolean {
  return source === 'alerts' || source === 'supplemented-gtfs';
}

function serviceSourceOwnerEvidence(
  owners: readonly OperationalSourceOwnerReceipt[],
): { readonly evidenceId: string; readonly evidenceAt: string } | undefined {
  if (owners.length === 0) return undefined;
  const evidenceAt = owners.map(({ lastAcceptedAt }) => lastAcceptedAt).sort().at(-1)!;
  if (owners.length === 1) {
    const owner = owners[0]!;
    return {
      evidenceId: `service-owner:${owner.source}:${owner.sourceId}:${owner.observedAt}:${owner.retrievedAt}:${owner.lastAcceptedAt}`,
      evidenceAt,
    };
  }
  return {
    evidenceId: `service-owner-set:${encodeCanonicalStringTuple(owners.flatMap((owner) => [
      owner.source, owner.sourceId, owner.observedAt, owner.retrievedAt, owner.lastAcceptedAt,
    ]))}`,
    evidenceAt,
  };
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
  const selection = context.hasStoredTrainChoice
    ? storedTrainSelection(options.activeTrip, context)
    : undefined;
  if (context.hasStoredTrainChoice && !selection) return undefined;
  const first = await options.api.board(options.stationId, options.filters, signal);
  if (!isFreshBoard(first, context, options.stationId)) return undefined;
  const firstAcceptedAt = exactNow(options.now);
  if (context.hasStoredTrainChoice) {
    const firstCandidate = storedTrainCandidate(first, selection!);
    const firstBoardOwner = combinedLiveOwnerEvidence(first, context);
    if (!firstCandidate || !ownerForArrival(first, firstCandidate, context) || !firstBoardOwner) return undefined;
    const second = await options.api.board(options.stationId, options.filters, signal);
    const recoveryEvidence = isFreshBoard(second, context, options.stationId)
      && first.responseIdentity !== second.responseIdentity
      && Date.parse(second.decidedAt) >= Date.parse(first.decidedAt)
      && Date.parse(second.serverTime) >= Date.parse(first.serverTime)
      ? coherentlyTracksStoredTrain(first, second, selection!, context)
      : null;
    if (recoveryEvidence === null) {
      return oneSnapshotWithheld(context, firstBoardOwner, firstAcceptedAt);
    }
    const secondAcceptedAt = exactNow(options.now);
    const scope = stationScope(context, options.stationId);
    const firstSnapshot = acceptedGate(
      context, 'arrivals', recoveryEvidence.board.first.evidenceId,
      recoveryEvidence.board.first.lastAcceptedAt, firstAcceptedAt, scope,
    );
    const secondSnapshot = acceptedGate(
      context, 'arrivals', recoveryEvidence.board.second.evidenceId,
      recoveryEvidence.board.second.lastAcceptedAt, secondAcceptedAt, scope,
    );
    options.artifacts.selectedBoard = second;
    return {
      stage: 3,
      feedRecovery: {
        gate: acceptedGate(
          context, 'feed-health', recoveryEvidence.board.second.evidenceId,
          recoveryEvidence.board.second.lastAcceptedAt, secondAcceptedAt, scope,
        ),
        disposition: 'readmitted',
      },
      trainReadmission: {
        gate: acceptedGate(
          context, 'train-admission', recoveryEvidence.train.second.evidenceId,
          recoveryEvidence.train.second.lastAcceptedAt, secondAcceptedAt,
          ownerScope(context, 'train-admission'),
        ),
        disposition: 'admitted',
      },
      arrivals: {
        gate: acceptedGate(
          context, 'arrivals', `${recoveryEvidence.board.second.evidenceId}:two-snapshot-progression`,
          recoveryEvidence.board.second.lastAcceptedAt, secondAcceptedAt, scope,
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
  const ownerPair = isFreshBoard(second, context, options.stationId)
    && first.responseIdentity !== second.responseIdentity
    && Date.parse(second.decidedAt) >= Date.parse(first.decidedAt)
    && Date.parse(second.serverTime) >= Date.parse(first.serverTime)
    ? advancingRealtimeOwnerPair(first, second, context)
    : null;
  if (ownerPair === null) return undefined;
  const secondAcceptedAt = exactNow(options.now);

  const scope = stationScope(context, options.stationId);
  const firstSnapshot = acceptedGate(
    context, 'arrivals', ownerPair.first.evidenceId, ownerPair.first.lastAcceptedAt, firstAcceptedAt, scope,
  );
  const secondSnapshot = acceptedGate(
    context, 'arrivals', ownerPair.second.evidenceId, ownerPair.second.lastAcceptedAt, secondAcceptedAt, scope,
  );
  options.artifacts.selectedBoard = second;
  return {
    stage: 3,
    feedRecovery: {
      gate: acceptedGate(
        context, 'feed-health', ownerPair.second.evidenceId, ownerPair.second.lastAcceptedAt, secondAcceptedAt, scope,
      ),
      disposition: 'readmitted',
    },
    trainReadmission: {
      gate: acceptedGate(
        context, 'train-admission', ownerPair.second.evidenceId, ownerPair.second.lastAcceptedAt, secondAcceptedAt,
        ownerScope(context, 'train-admission'),
      ),
      disposition: 'admitted',
    },
    arrivals: {
      gate: acceptedGate(
        context,
        'arrivals',
        `${ownerPair.second.evidenceId}:two-snapshot-progression`,
        ownerPair.second.lastAcceptedAt,
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
  first: RealtimeOwnerEvidence,
  acceptedAt: string,
): ReconnectionStageResult {
  const stationScopes = ownerScope(context, 'arrivals');
  const trainScopes = ownerScope(context, 'train-admission');
  const feed = acceptedGate(
    context, 'feed-health', first.evidenceId, first.lastAcceptedAt, acceptedAt, ownerScope(context, 'feed-health'),
  );
  const train = failClosedGate(
    context,
    'train-admission',
    acceptedAt,
    trainScopes,
    'A stored train requires two coherent fresh board snapshots.',
  );
  const snapshot = acceptedGate(
    context, 'arrivals', first.evidenceId, first.lastAcceptedAt, acceptedAt, stationScopes,
  );
  const arrivals = acceptedGate(
    context, 'arrivals', `${first.evidenceId}:one-coherent-snapshot`, first.lastAcceptedAt, acceptedAt, stationScopes,
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
  selection: StoredTrainSelection,
  context: PreservedReconnectionContext,
): StoredTrainRecoveryEvidence | null {
  const board = advancingRealtimeOwnerPair(first, second, context);
  const previous = storedTrainCandidate(first, selection);
  const current = storedTrainCandidate(second, selection);
  if (!board || !previous || !current) return null;
  if (!(previous.id === current.id
    && Date.parse(current.at) >= Date.parse(previous.at)
    && Date.parse(current.at) - Date.parse(previous.at) <= SELECTED_DEPARTURE_TOLERANCE_MS)) return null;
  const firstOwner = ownerForArrival(first, previous, context);
  const secondOwner = ownerForArrival(second, current, context);
  return firstOwner && secondOwner && advancesRealtimeOwner(firstOwner, secondOwner)
    ? { board, train: { first: firstOwner, second: secondOwner } }
    : null;
}

function storedTrainSelection(
  trip: ActiveTripRecord | null,
  context: PreservedReconnectionContext,
): StoredTrainSelection | undefined {
  if (!trip || trip.id !== context.activeTripId || trip.id !== context.recovery.activeTripId) return undefined;
  const cursorLeg = trip.legs.find((leg) => leg.points.some(({ id }) => id === trip.cursor.pointId));
  if (!cursorLeg) return undefined;
  if (context.manualCursor?.stopId !== trip.cursor.pointId) return undefined;
  const schedule = trip.validity.schedule;
  if (schedule.kind !== 'current' && schedule.kind !== 'stale') return undefined;
  const departures = schedule.departures.filter(({ legId, pointId }) => (
    legId === cursorLeg.id && pointId === trip.cursor.pointId
  ));
  if (departures.length !== 1) return undefined;
  const selectedDeparture = departures[0]!;
  let selectedAt: number;
  try {
    const clockTime = /^\d{2}:\d{2}$/u.test(selectedDeparture.clockTime)
      ? `${selectedDeparture.clockTime}:00`
      : selectedDeparture.clockTime;
    selectedAt = serviceDateTimeToInstant(trip.validity.serviceDate, clockTime, 'reject').getTime();
  } catch {
    return undefined;
  }
  const expectedTrainScope = `departure:${cursorLeg.id}:${trip.cursor.pointId}:${selectedDeparture.clockTime}`;
  const trainScopes = ownerScope(context, 'train-admission');
  if (trainScopes.length !== 1 || trainScopes[0]?.kind !== 'train' || trainScopes[0].id !== expectedTrainScope) {
    return undefined;
  }
  return { cursorLeg, selectedAt };
}

function storedTrainCandidate(
  board: BoardEnvelopeDto,
  selection: StoredTrainSelection,
): LiveArrivalDto | undefined {
  const { cursorLeg, selectedAt } = selection;
  const candidates = board.data?.directions
    .flatMap(({ primary }) => primary)
    .filter((arrival): arrival is LiveArrivalDto => arrival.kind === 'live'
      && arrival.route.id === cursorLeg.route.id
      && arrival.direction === cursorLeg.boundDirection
      && arrival.destination === cursorLeg.actualDestination
      && Math.abs(Date.parse(arrival.at) - selectedAt) <= SELECTED_DEPARTURE_TOLERANCE_MS) ?? [];
  return candidates.length === 1 ? candidates[0] : undefined;
}

async function loadBackground(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  const overlay = await options.api.mapOverlay(context.mapTuple.theme, signal);
  const sourceOwners = freshOverlayOwners(overlay, context);
  const mapEvidence = sourceOwners ? operationalSourceOwnerEvidence(sourceOwners) : undefined;
  if (!sourceOwners || !mapEvidence) return undefined;
  const acceptedAt = exactNow(options.now);
  const mapScope = exactScope(context, 'map', context.mapTuple.viewportKey);
  const savedScope = ownerScope(context, 'saved');
  const mapGate = acceptedGate(context, 'maps', mapEvidence.evidenceId, mapEvidence.evidenceAt, acceptedAt, mapScope);
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
  const live = liveArrivals(board);
  const owners = realtimeOwnerEvidence(board, context);
  return board.cacheState === 'network'
    && board.runtime.availability === 'available'
    && board.data?.mode === 'live'
    && board.data.station?.id === stationId
    && board.data.capabilities.arrivals === 'available'
    && board.data.directions.length > 0
    && live.length > 0
    && owners.length > 0
    && live.every((arrival) => owners.some((owner) => ownerOwnsArrival(owner, arrival)))
    && freshInstant(board.decidedAt, context.recovery.startedAt)
    && freshInstant(board.serverTime, context.recovery.startedAt);
}

function realtimeOwnerEvidence(
  board: BoardEnvelopeDto,
  context: PreservedReconnectionContext,
): readonly RealtimeOwnerEvidence[] {
  if (!board.data) return [];
  const owners = board.data.provenance
    .filter(({ source }) => source === 'gtfs-rt')
    .flatMap((provenance) => {
      const dataProvenance = board.data!.provenance.filter((candidate) => (
        candidate.source === 'gtfs-rt' && candidate.sourceId === provenance.sourceId
      ));
      const envelopeProvenance = (board.provenance ?? []).filter((candidate) => (
        candidate.source === 'gtfs-rt' && candidate.sourceId === provenance.sourceId
      ));
      const dataHealth = board.data!.sourceHealth.filter((candidate) => (
        candidate.source === 'gtfs-rt' && candidate.sourceId === provenance.sourceId
      ));
      const envelopeHealth = (board.sourceHealth ?? []).filter((candidate) => (
        candidate.source === 'gtfs-rt' && candidate.sourceId === provenance.sourceId
      ));
      if (dataProvenance.length !== 1 || envelopeProvenance.length !== 1
        || dataHealth.length !== 1 || envelopeHealth.length !== 1) return [];
      const health = dataHealth[0]!;
      if (health.state !== 'current' || health.lastAcceptedAt === undefined
        || !sameProvenance(provenance, envelopeProvenance[0]!)
        || !sameHealth(health, envelopeHealth[0]!)) return [];
      const owner = {
        sourceId: provenance.sourceId,
        observedAt: provenance.observedAt,
        retrievedAt: provenance.retrievedAt,
        lastAcceptedAt: health.lastAcceptedAt,
        assessedAt: health.assessedAt,
        evidenceId: `gtfs-rt-owner:${provenance.sourceId}:${provenance.observedAt}:${provenance.retrievedAt}:${health.lastAcceptedAt}`,
      };
      return coherentFreshOwner(owner, board.decidedAt, board.serverTime, context.recovery.startedAt) ? [owner] : [];
    });
  return owners
    .filter((owner, index) => owners.findIndex(({ sourceId }) => sourceId === owner.sourceId) === index)
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}

function liveArrivals(board: BoardEnvelopeDto): readonly LiveArrivalDto[] {
  return board.data?.directions.flatMap(({ primary }) => (
    primary.filter((arrival): arrival is LiveArrivalDto => arrival.kind === 'live')
  )) ?? [];
}

function ownerForArrival(
  board: BoardEnvelopeDto,
  arrival: LiveArrivalDto,
  context: PreservedReconnectionContext,
): RealtimeOwnerEvidence | undefined {
  return realtimeOwnerEvidence(board, context).find((owner) => ownerOwnsArrival(owner, arrival));
}

function ownerOwnsArrival(owner: RealtimeOwnerEvidence, arrival: LiveArrivalDto): boolean {
  return arrival.provenance.source === 'gtfs-rt'
    && arrival.provenance.sourceId === owner.sourceId
    && arrival.provenance.observedAt === owner.observedAt
    && arrival.provenance.retrievedAt === owner.retrievedAt;
}

function advancingRealtimeOwnerPair(
  first: BoardEnvelopeDto,
  second: BoardEnvelopeDto,
  context: PreservedReconnectionContext,
): RealtimeOwnerPair | null {
  if (Date.parse(second.decidedAt) < Date.parse(first.decidedAt)
    || Date.parse(second.serverTime) < Date.parse(first.serverTime)) return null;
  const firstOwners = liveOwnerSet(first, context);
  const secondOwners = liveOwnerSet(second, context);
  if (firstOwners.length === 0 || firstOwners.length !== secondOwners.length) return null;
  const pairs = firstOwners.map((owner) => ({
    first: owner,
    second: secondOwners.find(({ sourceId }) => sourceId === owner.sourceId),
  }));
  if (pairs.some(({ first: previous, second: current }) => (
    current === undefined || !advancesRealtimeOwner(previous, current)
  ))) return null;
  return {
    first: combineRealtimeOwners(pairs.map(({ first: owner }) => owner)),
    second: combineRealtimeOwners(pairs.map(({ second: owner }) => owner!)),
  };
}

function combinedLiveOwnerEvidence(
  board: BoardEnvelopeDto,
  context: PreservedReconnectionContext,
): RealtimeOwnerEvidence | undefined {
  const owners = liveOwnerSet(board, context);
  return owners.length > 0 ? combineRealtimeOwners(owners) : undefined;
}

function liveOwnerSet(
  board: BoardEnvelopeDto,
  context: PreservedReconnectionContext,
): readonly RealtimeOwnerEvidence[] {
  const owners = liveArrivals(board).map((arrival) => ownerForArrival(board, arrival, context));
  if (owners.some((owner) => owner === undefined)) return [];
  return (owners as RealtimeOwnerEvidence[])
    .filter((owner, index, values) => values.findIndex(({ sourceId }) => sourceId === owner.sourceId) === index)
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}

function combineRealtimeOwners(owners: readonly RealtimeOwnerEvidence[]): RealtimeOwnerEvidence {
  if (owners.length === 1) return owners[0]!;
  const latest = (field: 'observedAt' | 'retrievedAt' | 'lastAcceptedAt' | 'assessedAt') => (
    owners.map((owner) => owner[field]).sort().at(-1)!
  );
  return {
    sourceId: owners.map(({ sourceId }) => sourceId).join(','),
    observedAt: latest('observedAt'),
    retrievedAt: latest('retrievedAt'),
    lastAcceptedAt: latest('lastAcceptedAt'),
    assessedAt: latest('assessedAt'),
    evidenceId: `gtfs-rt-owner-set:${owners.length}:${evidenceDigest(owners.map(({ evidenceId }) => evidenceId).join('|'))}:${latest('observedAt')}:${latest('lastAcceptedAt')}`,
  };
}

function evidenceDigest(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (const byte of new TextEncoder().encode(value)) {
    first = Math.imul(first ^ byte, 0x01000193) >>> 0;
    second = Math.imul(second ^ byte, 0x85ebca6b) >>> 0;
  }
  return `${first.toString(16).padStart(8, '0')}${second.toString(16).padStart(8, '0')}`;
}

function advancesRealtimeOwner(first: RealtimeOwnerEvidence, second: RealtimeOwnerEvidence): boolean {
  return first.sourceId === second.sourceId
    && Date.parse(second.observedAt) > Date.parse(first.observedAt)
    && Date.parse(second.retrievedAt) >= Date.parse(first.retrievedAt)
    && Date.parse(second.lastAcceptedAt) > Date.parse(first.lastAcceptedAt)
    && Date.parse(second.assessedAt) >= Date.parse(first.assessedAt);
}

function coherentFreshOwner(
  owner: RealtimeOwnerEvidence,
  boardDecidedAt: string,
  boardServerTime: string,
  recoveryStartedAt: string,
): boolean {
  const observedAt = exactInstant(owner.observedAt);
  const retrievedAt = exactInstant(owner.retrievedAt);
  const lastAcceptedAt = exactInstant(owner.lastAcceptedAt);
  const assessedAt = exactInstant(owner.assessedAt);
  const decidedAt = exactInstant(boardDecidedAt);
  const serverTime = exactInstant(boardServerTime);
  const startedAt = exactInstant(recoveryStartedAt);
  return observedAt !== null && retrievedAt !== null && lastAcceptedAt !== null
    && assessedAt !== null && decidedAt !== null && serverTime !== null && startedAt !== null
    && observedAt <= retrievedAt
    && observedAt <= lastAcceptedAt
    && observedAt >= startedAt
    && retrievedAt >= startedAt
    && lastAcceptedAt >= startedAt
    && retrievedAt <= assessedAt
    && lastAcceptedAt <= assessedAt
    && assessedAt <= decidedAt
    && assessedAt <= serverTime;
}

function sameProvenance(
  left: NonNullable<BoardEnvelopeDto['data']>['provenance'][number],
  right: NonNullable<BoardEnvelopeDto['data']>['provenance'][number],
): boolean {
  return left.source === right.source && left.sourceId === right.sourceId
    && left.observedAt === right.observedAt && left.retrievedAt === right.retrievedAt;
}

function sameHealth(
  left: NonNullable<BoardEnvelopeDto['data']>['sourceHealth'][number],
  right: NonNullable<BoardEnvelopeDto['data']>['sourceHealth'][number],
): boolean {
  return left.source === right.source && left.sourceId === right.sourceId
    && left.state === right.state && left.assessedAt === right.assessedAt
    && left.lastAcceptedAt === right.lastAcceptedAt && left.reasonCode === right.reasonCode;
}

function exactInstant(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}

function freshOverlayOwners(
  overlay: MapOverlayEnvelopeDto,
  context: PreservedReconnectionContext,
): readonly OperationalSourceOwnerReceipt[] | undefined {
  if (overlay.cacheState !== 'network' || overlay.runtime.availability !== 'available'
    || overlay.data?.theme !== context.mapTuple.theme
    || !isCanonicalOperationalServiceEpoch(overlay.data.serviceEpoch)) return undefined;
  return admitOperationalSourceOwners({
    ownerRefs: overlay.data.sourceOwners,
    provenance: overlay.provenance ?? [],
    sourceHealth: overlay.sourceHealth ?? [],
    decidedAt: overlay.decidedAt,
    serverTime: overlay.serverTime,
    claimedReceipts: overlay.data.sourceOwners,
    notBefore: context.recovery.startedAt,
  });
}

function freshInstant(candidate: string, epoch: string): boolean {
  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === candidate && parsed >= Date.parse(epoch);
}
