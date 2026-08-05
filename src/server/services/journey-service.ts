import { routeJourney, type JourneyGraph, type JourneyQuery } from '../../shared/domain/journey-router';

export function planJourney(graph: JourneyGraph | undefined, query: JourneyQuery) {
  if (!graph) return Object.freeze({ kind: 'no-path' as const, reason: 'no-service-path' as const });
  return routeJourney(graph, query);
}
