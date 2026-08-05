import type {
  JourneyEnvelopeDto,
  JourneyGraphReferenceDto,
  JourneyItineraryDto,
  JourneyRequestDto,
} from '../api/client';
import {
  createOfflineStructuralJourneyGraph,
  routeJourney,
  validateJourneyQuery,
  type JourneyGraph,
  type RoutedJourney,
} from '../../shared/domain/journey-router';

const REFERENCE_INSTANT = '1970-01-01T00:00:00.000Z';

export type OfflineJourneyPlanner = (query: JourneyRequestDto) => JourneyEnvelopeDto;

export function createOfflineJourneyPlanner(reference: JourneyGraphReferenceDto): OfflineJourneyPlanner {
  const captured = captureReference(reference);
  return (query) => planOfflineJourney(captured, query);
}

export function planOfflineJourney(
  reference: JourneyGraphReferenceDto,
  rawQuery: JourneyRequestDto,
): JourneyEnvelopeDto {
  const captured = captureReference(reference);
  const query = validateJourneyQuery(rawQuery);
  if (query.mode !== 'offline-reference') throw new Error('Local planning requires offline-reference mode');
  const decision = routeJourney(captured.graph, query);
  const scope = {
    mode: query.mode,
    originStationId: query.originStationId,
    destinationStationId: query.destinationStationId,
    accessibleRouteOnly: query.accessibleRouteOnly,
  } as const;
  const data = decision.kind === 'planned' || decision.kind === 'untimed'
    ? {
        ...decision,
        scope,
        itineraries: decision.itineraries.map((itinerary) => enrichItinerary(itinerary, captured.graph)),
      }
    : { ...decision, scope };
  return deepFreeze({
    apiVersion: 'v1',
    schemaVersion: '2026-08-04',
    responseIdentity: `offline-reference-${fingerprint(JSON.stringify([
      captured.contentVersion,
      scope,
      data,
    ]))}`,
    decidedAt: REFERENCE_INSTANT,
    serverTime: REFERENCE_INSTANT,
    runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
    gates: {},
    demonstrationLabel: 'Demonstration data \u2014 not live',
    sourceHealth: [],
    provenance: [],
    data,
  });
}

function captureReference(reference: JourneyGraphReferenceDto): JourneyGraphReferenceDto {
  if (!reference || typeof reference !== 'object' || Array.isArray(reference)
    || typeof reference.contentVersion !== 'string' || reference.contentVersion.length === 0) {
    throw new Error('Offline journey graph reference is invalid');
  }
  return deepFreeze({
    contentVersion: reference.contentVersion,
    graph: createOfflineStructuralJourneyGraph(reference.graph),
  });
}

function enrichItinerary(
  itinerary: RoutedJourney,
  graph: JourneyGraph,
): JourneyItineraryDto {
  const nodeByOccurrence = new Map(graph.nodes.map((node) => [node.occurrenceId, node]));
  const legs = itinerary.legs.map((leg) => {
    const orderedStationIds = leg.orderedOccurrenceIds.map((occurrenceId) => {
      const node = nodeByOccurrence.get(occurrenceId);
      if (!node) throw new Error('Offline journey occurrence lost graph ownership');
      return node.stationId;
    });
    return {
      ...leg,
      fromStationId: orderedStationIds[0]!,
      toStationId: orderedStationIds.at(-1)!,
      orderedStationIds,
    };
  });
  if (itinerary.transferIds.length !== Math.max(0, legs.length - 1)) {
    throw new Error('Offline journey transfer structure is incomplete');
  }
  const transferInstructions = itinerary.transferIds.map((transferId, index) => {
    const incoming = legs[index]!;
    const outgoing = legs[index + 1]!;
    if (incoming.toStationId !== outgoing.fromStationId) {
      throw new Error('Offline journey transfer station is incoherent');
    }
    return {
      transferId,
      stationId: incoming.toStationId,
      fromRouteId: incoming.routeId,
      fromDirection: incoming.direction,
      fromActualDestination: incoming.actualDestination,
      toRouteId: outgoing.routeId,
      toDirection: outgoing.direction,
      toActualDestination: outgoing.actualDestination,
    };
  });
  return deepFreeze({ ...itinerary, legs, transferInstructions });
}

function fingerprint(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
