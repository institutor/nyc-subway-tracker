import { describe, expect, test } from 'vitest';

import { createJourneyGraphReference, planJourney } from '../../src/server/services/journey-service';
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
  test('publishes a deterministic versioned graph with current, future, timing, and verified-transfer claims removed', () => {
    const first = createJourneyGraphReference(graph);
    const second = createJourneyGraphReference(structuredClone(graph));

    expect(first).toEqual(second);
    expect(first.contentVersion).toMatch(/^journey-graph-/);
    expect(first.graph.patterns).toEqual(graph.patterns.map((value) => expect.objectContaining({
      id: value.id,
      current: { status: 'missing', serviceDecision: 'unknown', validity: 'limited', risk: 'uncertain' },
      future: [],
      offline: { schedule: 'missing', serviceDecision: 'unknown', patternMatch: 'exact', validity: 'limited', risk: 'uncertain' },
    })));
    expect(first.graph.transfers[0]?.evidence).toEqual({ kind: 'structural-only' });
    expect(JSON.stringify(first.graph)).not.toMatch(/arrivalSeconds|current-supplemented|admitted/);
  });

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

  test('attaches only an exact itinerary-owned capture package without manufacturing optional claims', () => {
    const initial = planJourney(graph, query('online-current'));
    if (initial.kind !== 'planned') throw new Error('Expected planned journey fixture');
    const itinerary = initial.itineraries[0];
    const capture = {
      itineraryId: itinerary.id,
      requestMode: 'online-current' as const,
      scope: {
        mode: 'online-current' as const, originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false,
      },
      serviceDate: '2026-08-05', timing: 'timed' as const,
      capturedAt: '2026-08-05T12:00:00.000Z', disclosure: 'Demonstration data \u2014 not live' as const,
      validity: {
        result: 'current-itinerary' as const, pattern: 'actual-now' as const,
        schedule: {
          kind: 'current' as const, editionId: 'supplemented-gtfs:edition-7', anchorKind: 'published' as const,
          anchorAt: '2026-08-05T11:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
          effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 3_600,
          departures: [
            { patternId: 'pattern-a', occurrenceId: 'occ-a', clockTime: '08:15', evidence: 'scheduled' as const, timeZone: 'America/New_York' as const },
            { patternId: 'pattern-c', occurrenceId: 'occ-b-out', clockTime: '08:25', evidence: 'scheduled' as const, timeZone: 'America/New_York' as const },
          ],
        },
        warnings: [], vetoes: [],
      },
      serviceClaims: [], equipmentClaims: [],
    };

    const captured = planJourney(graph, query('online-current'), {
      capturePackages: [capture],
      decidedAt: '2026-08-05T12:00:00.000Z',
      disclosure: 'Demonstration data \u2014 not live',
    });

    expect(captured).toMatchObject({
      kind: 'planned',
      itineraries: [{ capture: { itineraryId: itinerary.id, validity: { schedule: capture.validity.schedule } } }],
    });
    expect(JSON.stringify(captured)).not.toMatch(/service-capture|not-supplied|capture-limitation/);
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
