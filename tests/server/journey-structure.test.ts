import { describe, expect, test } from 'vitest';

import { planJourney } from '../../src/server/services/journey-service';
import type { JourneyGraph, JourneyQuery } from '../../src/shared/domain/journey-router';

const graph: JourneyGraph = {
  nodes: [
    { id: 'n-a', occurrenceId: 'occ-a', stationId: 'A12', directionalStopId: 'A12N' },
    { id: 'n-b-in', occurrenceId: 'occ-b-in', stationId: 'A14', directionalStopId: 'A14N' },
    { id: 'n-b-out', occurrenceId: 'occ-b-out', stationId: 'A14', directionalStopId: 'A14E' },
    { id: 'n-c', occurrenceId: 'occ-c', stationId: 'A15', directionalStopId: 'A15E' },
  ],
  patterns: [
    pattern('pattern-a', 'A', 'northbound', 'Inwood–207 St', ['occ-a', 'occ-b-in']),
    pattern('pattern-c', 'C', 'eastbound', 'Euclid Av', ['occ-b-out', 'occ-c']),
  ],
  transfers: [{
    id: 'transfer-a-c', fromOccurrenceId: 'occ-b-in', toOccurrenceId: 'occ-b-out',
    evidence: { kind: 'verified', accessibility: 'eligible', risk: 'clear' },
  }],
};

describe('journey response structural ownership', () => {
  test('enriches exact graph-owned station order, transfer instructions, and request scope', () => {
    const decision = planJourney(graph, query('online-current'));

    expect(decision).toMatchObject({
      kind: 'planned',
      scope: { mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false },
      itineraries: [{
        legs: [
          { routeId: 'A', fromStationId: 'A12', toStationId: 'A14', orderedStationIds: ['A12', 'A14'] },
          { routeId: 'C', fromStationId: 'A14', toStationId: 'A15', orderedStationIds: ['A14', 'A15'] },
        ],
        transferInstructions: [{
          transferId: 'transfer-a-c', stationId: 'A14', fromRouteId: 'A', fromDirection: 'northbound',
          fromActualDestination: 'Inwood–207 St', toRouteId: 'C', toDirection: 'eastbound', toActualDestination: 'Euclid Av',
        }],
      }],
    });
  });

  test('uses exact offline labels and never invents a timed itinerary from structural-only evidence', () => {
    const timed = planJourney(graph, query('offline-reference'));
    expect(timed).toMatchObject({ kind: 'planned', label: 'Reference itinerary' });

    const untimedGraph: JourneyGraph = {
      ...graph,
      patterns: graph.patterns.map((value) => ({
        ...value,
        offline: { ...value.offline, schedule: 'missing' as const, arrivalSeconds: undefined },
      })),
    };
    const untimed = planJourney(untimedGraph, query('offline-reference'));
    expect(untimed).toMatchObject({ kind: 'untimed', label: 'Untimed structural route' });
    expect(JSON.stringify(untimed)).not.toMatch(/Reference itinerary|arrivalSeconds|Scheduled|Live|current reroute|equipment/i);
  });
});

function query(mode: JourneyQuery['mode']): JourneyQuery {
  return { mode, originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false };
}

function pattern(
  id: string,
  routeId: string,
  direction: 'northbound' | 'eastbound',
  actualDestination: string,
  orderedOccurrenceIds: readonly string[],
) {
  return {
    id, routeId, routeLabel: routeId, direction, actualDestination, orderedOccurrenceIds,
    accessibility: 'eligible' as const,
    current: { status: 'admitted' as const, serviceDecision: 'pass' as const, validity: 'valid' as const, risk: 'clear' as const, arrivalSeconds: 180 },
    future: [],
    offline: {
      schedule: 'current-supplemented' as const, serviceDecision: 'pass' as const, patternMatch: 'exact' as const,
      validity: 'valid' as const, risk: 'clear' as const, arrivalSeconds: 600,
    },
  };
}
