import {
  routeJourney,
  createOfflineStructuralJourneyGraph,
  validateJourneyGraph,
  type JourneyGraph,
  type JourneyQuery,
  type RoutedJourney,
} from '../../shared/domain/journey-router';
import {
  bindJourneyCapturePackage,
  type JourneyCapturePackage,
  type JourneyCaptureScope,
} from '../../shared/domain/journey-capture';
import { createResponseIdentity } from '../api/response-identity';

export interface JourneyGraphReference {
  readonly contentVersion: string;
  readonly graph: JourneyGraph;
}

export function createJourneyGraphReference(graph: JourneyGraph | undefined): JourneyGraphReference {
  const structural = createOfflineStructuralJourneyGraph(
    graph ?? { nodes: [], patterns: [], transfers: [] },
  );
  const digest = createResponseIdentity(['journey-graph-reference-v1', JSON.stringify(structural)])
    .slice('response:'.length);
  return deepFreeze({ contentVersion: `journey-graph-${digest}`, graph: structural });
}

export function planJourney(
  graph: JourneyGraph | undefined,
  query: JourneyQuery,
  captureOptions: {
    readonly capturePackages?: readonly JourneyCapturePackage[];
    readonly decidedAt?: string;
    readonly disclosure?: string;
  } = {},
) {
  const scope = captureScope(query);
  if (!graph) return deepFreeze({ kind: 'no-path' as const, reason: 'no-service-path' as const, scope });
  const validated = validateJourneyGraph(graph);
  const decision = routeJourney(validated, query);
  if (decision.kind !== 'planned' && decision.kind !== 'untimed') return deepFreeze({ ...decision, scope });
  const nodeByOccurrence = new Map(validated.nodes.map((node) => [node.occurrenceId, node]));
  return deepFreeze({
    ...decision,
    scope,
    itineraries: decision.itineraries.map((itinerary) => {
      const enriched = enrichItinerary(itinerary, nodeByOccurrence);
      const capture = bindExactCapture(enriched, scope, captureOptions);
      return { ...enriched, ...(capture === undefined ? {} : { capture }) };
    }),
  });
}

function bindExactCapture(
  itinerary: ReturnType<typeof enrichItinerary>,
  scope: JourneyCaptureScope,
  options: {
    readonly capturePackages?: readonly JourneyCapturePackage[];
    readonly decidedAt?: string;
    readonly disclosure?: string;
  },
): JourneyCapturePackage | undefined {
  if (!options.capturePackages || !options.decidedAt) return undefined;
  const accepted: JourneyCapturePackage[] = [];
  for (const candidate of options.capturePackages) {
    try {
      const bound = bindJourneyCapturePackage(candidate, {
        itinerary,
        scope,
        responseDecidedAt: options.decidedAt,
        responseDisclosure: options.disclosure,
      });
      accepted.push(bound);
    } catch {
      // Unowned, malformed, or incomplete capture evidence is omitted fail-closed.
    }
  }
  return accepted.length === 1 ? accepted[0] : undefined;
}

function enrichItinerary(
  itinerary: RoutedJourney,
  nodeByOccurrence: ReadonlyMap<string, JourneyGraph['nodes'][number]>,
) {
  const legs = itinerary.legs.map((leg) => {
    const orderedStationIds = leg.orderedOccurrenceIds.map((occurrenceId) => {
      const node = nodeByOccurrence.get(occurrenceId);
      if (!node) throw new Error('Journey occurrence lost structural ownership');
      return node.stationId;
    });
    return {
      ...leg,
      fromStationId: orderedStationIds[0],
      toStationId: orderedStationIds.at(-1)!,
      orderedStationIds,
    };
  });
  if (itinerary.transferIds.length !== Math.max(0, legs.length - 1)) {
    throw new Error('Journey transfer structure is incomplete');
  }
  const transferInstructions = itinerary.transferIds.map((transferId, index) => {
    const incoming = legs[index];
    const outgoing = legs[index + 1];
    if (incoming.toStationId !== outgoing.fromStationId) throw new Error('Journey transfer station is incoherent');
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
  return { ...itinerary, legs, transferInstructions };
}

function captureScope(query: JourneyQuery) {
  return {
    mode: query.mode,
    originStationId: query.originStationId,
    destinationStationId: query.destinationStationId,
    accessibleRouteOnly: query.accessibleRouteOnly,
    ...(query.serviceDate === undefined ? {} : { serviceDate: query.serviceDate }),
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
