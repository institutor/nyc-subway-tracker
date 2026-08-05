import { describe, expect, test } from 'vitest';

import { routeJourney, validateJourneyGraph, type JourneyGraph, type JourneyQuery } from '../../src/shared/domain/journey-router';

describe('exact directional occurrence journey graph', () => {
  test('routes a direct ride forward while preserving route identity, direction, destination, and ordered occurrences', () => {
    const result = routeJourney(directGraph(), query());
    expect(result).toMatchObject({
      kind: 'planned',
      itineraries: [{
        legs: [{
          patternId: 'pattern-a',
          routeId: 'A',
          direction: 'northbound',
          actualDestination: 'Uptown terminal',
          fromOccurrenceId: 'a-origin',
          toOccurrenceId: 'a-destination',
          orderedOccurrenceIds: ['a-origin', 'a-middle', 'a-destination'],
        }],
      }],
    });
  });

  test.each([
    { requiredFirstDirection: 'southbound' },
    { requiredActualDestination: 'Wrong terminal' },
    { originStationId: 'destination', destinationStationId: 'origin' },
  ] as const)('rejects wrong direction, destination, or reverse stop order %#', (override) => {
    expect(routeJourney(directGraph(), query(override))).toEqual({ kind: 'no-path', reason: 'no-service-path' });
  });

  test('uses an explicit transfer occurrence and never treats a bare station identity as an edge', () => {
    const graph = transferGraph('verified');
    const result = routeJourney(graph, query());
    expect(result.kind).toBe('planned');
    if (result.kind !== 'planned') return;
    expect(result.itineraries[0]).toMatchObject({
      transfers: 1,
      legs: [
        { patternId: 'pattern-a', fromOccurrenceId: 'a-origin', toOccurrenceId: 'a-transfer' },
        { patternId: 'pattern-b', fromOccurrenceId: 'b-transfer', toOccurrenceId: 'b-destination' },
      ],
    });

    const withoutTransfer = { ...graph, transfers: [] };
    expect(routeJourney(withoutTransfer, query())).toEqual({ kind: 'no-path', reason: 'no-service-path' });
  });

  test('online-current never lets static structure repair a missing or vetoed current pattern', () => {
    for (const status of ['missing', 'vetoed'] as const) {
      const graph = directGraph();
      graph.patterns[0].current = { status, serviceDecision: status === 'vetoed' ? 'veto' : 'unknown', validity: 'limited', risk: 'uncertain' };
      expect(routeJourney(graph, query())).toEqual({ kind: 'no-path', reason: 'no-service-path' });
    }
  });

  test('online-future requires the exact service date and owner occurrence, excluding regular inside a usable supplement mask', () => {
    const graph = directGraph();
    graph.patterns[0].future = [{
      serviceDate: '2026-08-08', owner: 'supplemented', occurrence: 'present',
      usableSupplementMask: true, serviceDecision: 'pass', validity: 'valid', risk: 'clear', arrivalSeconds: 300,
    }];
    expect(routeJourney(graph, query({ mode: 'online-future', serviceDate: '2026-08-08' })).kind).toBe('planned');
    expect(routeJourney(graph, query({ mode: 'online-future', serviceDate: '2026-08-09' }))).toEqual({ kind: 'no-path', reason: 'no-service-path' });
    graph.patterns[0].future = [{ ...graph.patterns[0].future![0], owner: 'regular' }];
    expect(routeJourney(graph, query({ mode: 'online-future', serviceDate: '2026-08-08' }))).toEqual({ kind: 'no-path', reason: 'no-service-path' });
  });

  test('offline timing uses only exact current or stale supplemented evidence with passing vetoes', () => {
    for (const schedule of ['current-supplemented', 'stale-supplemented'] as const) {
      const graph = directGraph();
      graph.patterns[0].offline = { schedule, serviceDecision: 'pass', patternMatch: 'exact', validity: 'valid', risk: 'clear', arrivalSeconds: 600 };
      expect(routeJourney(graph, query({ mode: 'offline-reference' }))).toMatchObject({
        kind: 'planned', label: 'Reference itinerary', itineraries: [{ timing: 'timed' }],
      });
    }
  });

  test.each(['regular-only', 'missing', 'quarantined', 'mismatch'] as const)(
    'keeps %s offline evidence as an untimed structural route without scheduled claims',
    (schedule) => {
      const graph = directGraph();
      graph.patterns[0].offline = {
        schedule,
        serviceDecision: 'pass',
        patternMatch: schedule === 'mismatch' ? 'mismatch' : 'exact',
        validity: 'limited',
        risk: 'uncertain',
      };
      const result = routeJourney(graph, query({ mode: 'offline-reference' }));
      expect(result).toMatchObject({ kind: 'untimed', label: 'Structural route only', itineraries: [{ timing: 'untimed' }] });
      expect(JSON.stringify(result)).not.toContain('arrivalSeconds');
    },
  );

  test('Accessible Route Only rejects Unknown and structural-only GTFS transfers without calling them walk or accessibility proof', () => {
    const unknown = directGraph();
    unknown.patterns[0].accessibility = 'unknown';
    expect(routeJourney(unknown, query({ accessibleRouteOnly: true }))).toEqual({
      kind: 'unavailable', reason: 'no-verified-accessible-path',
    });
    expect(routeJourney(transferGraph('structural-only'), query({ accessibleRouteOnly: true }))).toEqual({
      kind: 'unavailable', reason: 'no-verified-accessible-path',
    });
    expect(routeJourney(transferGraph('verified'), query({ accessibleRouteOnly: true })).kind).toBe('planned');
  });

  test('ranks validity, accessibility, worst risk, transfers, practical-walk tier, arrival, then neutral identity', () => {
    const graph = alternativesGraph([
      pattern('z-limited', { validity: 'limited', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 1 }),
      pattern('y-unknown', { validity: 'valid', risk: 'clear', accessibility: 'unknown', arrivalSeconds: 1 }),
      pattern('x-risk', { validity: 'valid', risk: 'affected', accessibility: 'eligible', arrivalSeconds: 1 }),
      pattern('w-slow', { validity: 'valid', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 100 }),
      pattern('v-early', { validity: 'valid', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 50 }),
      pattern('a-tie', { validity: 'valid', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 50 }),
    ]);
    const result = routeJourney(graph, query({
      practicalWalkEvidence: [
        { patternId: 'z-limited', range: { minimumSeconds: 1, maximumSeconds: 2 } },
        { patternId: 'y-unknown', range: { minimumSeconds: 1, maximumSeconds: 2 } },
        { patternId: 'x-risk', range: { minimumSeconds: 1, maximumSeconds: 2 } },
        { patternId: 'w-slow', range: { minimumSeconds: 30, maximumSeconds: 40 } },
        { patternId: 'v-early', range: { minimumSeconds: 10, maximumSeconds: 20 } },
        { patternId: 'a-tie', range: { minimumSeconds: 10, maximumSeconds: 20 } },
      ],
    }));
    expect(result.kind).toBe('planned');
    if (result.kind !== 'planned') return;
    expect(result.itineraries.map(({ legs }) => legs[0].patternId)).toEqual([
      'a-tie', 'v-early', 'w-slow', 'x-risk', 'y-unknown', 'z-limited',
    ]);
  });

  test('returns incomparable evidence instead of using canonical identity across a missing rider-relevant walk or arrival value', () => {
    const graph = alternativesGraph([
      pattern('a', { validity: 'valid', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 100 }),
      pattern('b', { validity: 'valid', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 100 }),
    ]);
    expect(routeJourney(graph, query({
      practicalWalkEvidence: [{ patternId: 'a', range: { minimumSeconds: 10, maximumSeconds: 20 } }],
    }))).toEqual({ kind: 'unavailable', reason: 'incomparable-evidence' });
    graph.patterns[1].current = { ...graph.patterns[1].current!, arrivalSeconds: undefined };
    expect(routeJourney(graph, query({
      practicalWalkEvidence: [
        { patternId: 'a', range: { minimumSeconds: 10, maximumSeconds: 20 } },
        { patternId: 'b', range: { minimumSeconds: 10, maximumSeconds: 20 } },
      ],
    }))).toEqual({ kind: 'unavailable', reason: 'incomparable-evidence' });
  });

  test('computes practical-walk overlap tiers only inside the equal higher-priority cohort', () => {
    const graph = alternativesGraph([
      pattern('p-one', { validity: 'valid', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 100 }),
      pattern('p-two', { validity: 'valid', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 1 }),
      pattern('z-bridge', { validity: 'limited', risk: 'clear', accessibility: 'eligible', arrivalSeconds: 1 }),
    ]);
    const result = routeJourney(graph, query({
      practicalWalkEvidence: [
        { patternId: 'p-one', range: { minimumSeconds: 0, maximumSeconds: 10 } },
        { patternId: 'z-bridge', range: { minimumSeconds: 10, maximumSeconds: 20 } },
        { patternId: 'p-two', range: { minimumSeconds: 20, maximumSeconds: 30 } },
      ],
    }));
    expect(result.kind).toBe('planned');
    if (result.kind !== 'planned') return;
    expect(result.itineraries.map(({ legs }) => legs[0].patternId)).toEqual(['p-one', 'p-two', 'z-bridge']);
  });

  test('is deterministic under shuffled packages, avoids cycles, and emits detached frozen results', () => {
    const graph = transferGraph('verified');
    graph.transfers.push({ id: 'cycle', fromOccurrenceId: 'b-transfer', toOccurrenceId: 'a-origin', evidence: { kind: 'verified', accessibility: 'eligible', risk: 'clear' } });
    const control = routeJourney(graph, query());
    const shuffled = structuredClone(graph);
    shuffled.nodes.reverse();
    shuffled.patterns.reverse();
    shuffled.transfers.reverse();
    const result = routeJourney(shuffled, query());
    expect(result).toEqual(control);
    expect(Object.isFrozen(result)).toBe(true);
    if (result.kind === 'planned') expect(Object.isFrozen(result.itineraries[0].legs)).toBe(true);
  });

  test('keeps ride occurrences and transfer identities type-delimited in canonical path identity', () => {
    const graph = directGraph();
    graph.nodes.push({ id: 'node-transfer-destination', occurrenceId: 'transfer-destination', stationId: 'destination', directionalStopId: 'destination-transfer-n' });
    graph.transfers.push({
      id: 'a-destination',
      fromOccurrenceId: 'a-middle',
      toOccurrenceId: 'transfer-destination',
      evidence: { kind: 'structural-only' },
    });
    const result = routeJourney(graph, query());
    expect(result.kind).toBe('planned');
    if (result.kind !== 'planned') return;
    expect(result.itineraries).toHaveLength(2);
    expect(new Set(result.itineraries.map(({ id }) => id)).size).toBe(2);
    expect(result.itineraries.map(({ transfers }) => transfers)).toEqual([0, 1]);
  });

  test('validates exact graph bounds, canonical references, and rejects transfer proof smuggled into structural GTFS rows', () => {
    const graph = directGraph();
    expect(Object.isFrozen(validateJourneyGraph(graph))).toBe(true);
    expect(() => validateJourneyGraph({ ...graph, nodes: [...graph.nodes, { ...graph.nodes[0], id: 'duplicate-id' }] })).toThrow(/occurrence identity|duplicate/i);
    expect(() => validateJourneyGraph({
      ...graph,
      transfers: [{
        id: 'bad', fromOccurrenceId: 'a-origin', toOccurrenceId: 'a-middle',
        evidence: { kind: 'structural-only', practicalWalkSeconds: 10 },
      }],
    } as unknown as JourneyGraph)).toThrow(/transfer evidence fields/i);
    expect(() => validateJourneyGraph({
      ...graph,
      patterns: [{ ...graph.patterns[0], orderedOccurrenceIds: ['a-origin', 'missing'] }],
    })).toThrow(/unknown occurrence/i);
    const tooManyNodes = Array.from({ length: 10_001 }, (_, index) => ({
      id: `node-${index}`, occurrenceId: `occurrence-${index}`, stationId: `station-${index}`, directionalStopId: `stop-${index}`,
    }));
    expect(() => validateJourneyGraph({ nodes: tooManyNodes, patterns: [], transfers: [] })).toThrow(/node limit/i);
    expect(() => validateJourneyGraph({
      nodes: [],
      patterns: Array.from({ length: 20_001 }, () => graph.patterns[0]),
      transfers: [],
    })).toThrow(/pattern limit/i);
    expect(() => validateJourneyGraph({
      nodes: [],
      patterns: [],
      transfers: Array.from({ length: 20_001 }, () => ({
        id: 'transfer',
        fromOccurrenceId: 'from',
        toOccurrenceId: 'to',
        evidence: { kind: 'structural-only' as const },
      })),
    })).toThrow(/transfer limit/i);
    expect(() => validateJourneyGraph({
      ...graph,
      patterns: [{
        ...graph.patterns[0],
        orderedOccurrenceIds: Array.from({ length: 257 }, (_, index) => `occurrence-${index}`),
      }],
    })).toThrow(/stops per journey pattern/i);
  });

  test('returns a typed search limit instead of truncating or canonically selecting an unproved optimum', () => {
    const graph = convergingGraph(65);
    expect(routeJourney(graph, query())).toEqual({ kind: 'unavailable', reason: 'search-limit-reached' });
  });
});

function query(overrides: Partial<JourneyQuery> = {}): JourneyQuery {
  return {
    mode: 'online-current',
    originStationId: 'origin',
    destinationStationId: 'destination',
    requiredFirstDirection: 'northbound',
    requiredActualDestination: 'Uptown terminal',
    accessibleRouteOnly: false,
    practicalWalkEvidence: [{ patternId: 'pattern-a', range: { minimumSeconds: 100, maximumSeconds: 120 } }],
    ...overrides,
  };
}

function directGraph(): JourneyGraph & { nodes: JourneyGraph['nodes'] extends readonly (infer T)[] ? T[] : never; patterns: any[]; transfers: any[] } {
  return {
    nodes: [
      { id: 'node-a-origin', occurrenceId: 'a-origin', stationId: 'origin', directionalStopId: 'origin-n' },
      { id: 'node-a-middle', occurrenceId: 'a-middle', stationId: 'middle', directionalStopId: 'middle-n' },
      { id: 'node-a-destination', occurrenceId: 'a-destination', stationId: 'destination', directionalStopId: 'destination-n' },
    ],
    patterns: [{
      id: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'northbound', actualDestination: 'Uptown terminal',
      orderedOccurrenceIds: ['a-origin', 'a-middle', 'a-destination'], accessibility: 'eligible',
      current: { status: 'admitted', serviceDecision: 'pass', validity: 'valid', risk: 'clear', arrivalSeconds: 300 },
      future: [],
      offline: { schedule: 'current-supplemented', serviceDecision: 'pass', patternMatch: 'exact', validity: 'valid', risk: 'clear', arrivalSeconds: 600 },
    }],
    transfers: [],
  };
}

function transferGraph(kind: 'verified' | 'structural-only'): ReturnType<typeof directGraph> {
  const graph = directGraph();
  graph.nodes = [
    { id: 'node-a-origin', occurrenceId: 'a-origin', stationId: 'origin', directionalStopId: 'origin-n' },
    { id: 'node-a-transfer', occurrenceId: 'a-transfer', stationId: 'transfer', directionalStopId: 'transfer-a-n' },
    { id: 'node-b-transfer', occurrenceId: 'b-transfer', stationId: 'transfer', directionalStopId: 'transfer-b-n' },
    { id: 'node-b-destination', occurrenceId: 'b-destination', stationId: 'destination', directionalStopId: 'destination-n' },
  ];
  graph.patterns = [
    { ...graph.patterns[0], orderedOccurrenceIds: ['a-origin', 'a-transfer'] },
    {
      ...structuredClone(graph.patterns[0]), id: 'pattern-b', routeId: 'B', routeLabel: 'B',
      orderedOccurrenceIds: ['b-transfer', 'b-destination'],
    },
  ];
  graph.transfers = [{
    id: 'transfer-ab', fromOccurrenceId: 'a-transfer', toOccurrenceId: 'b-transfer',
    evidence: kind === 'verified'
      ? { kind, accessibility: 'eligible', risk: 'clear' }
      : { kind },
  }];
  return graph;
}

function pattern(
  id: string,
  evidence: { validity: 'valid' | 'limited'; risk: 'clear' | 'affected' | 'uncertain'; accessibility: 'eligible' | 'unknown' | 'ineligible'; arrivalSeconds?: number },
) {
  return {
    id,
    routeId: id,
    routeLabel: id,
    direction: 'northbound' as const,
    actualDestination: 'Uptown terminal',
    orderedOccurrenceIds: [`${id}-origin`, `${id}-destination`],
    accessibility: evidence.accessibility,
    current: { status: 'admitted' as const, serviceDecision: 'pass' as const, validity: evidence.validity, risk: evidence.risk, arrivalSeconds: evidence.arrivalSeconds },
    future: [],
    offline: { schedule: 'missing' as const, serviceDecision: 'unknown' as const, patternMatch: 'exact' as const, validity: 'limited' as const, risk: 'uncertain' as const },
  };
}

function alternativesGraph(patterns: ReturnType<typeof pattern>[]): JourneyGraph & { nodes: any[]; patterns: any[]; transfers: any[] } {
  return {
    nodes: patterns.flatMap(({ id }) => [
      { id: `node-${id}-origin`, occurrenceId: `${id}-origin`, stationId: 'origin', directionalStopId: `${id}-origin-n` },
      { id: `node-${id}-destination`, occurrenceId: `${id}-destination`, stationId: 'destination', directionalStopId: `${id}-destination-n` },
    ]),
    patterns,
    transfers: [],
  };
}

function convergingGraph(count: number): JourneyGraph {
  const nodes = [{ id: 'hub-node', occurrenceId: 'hub', stationId: 'hub-station', directionalStopId: 'hub-n' }];
  const transfers = [];
  const patterns = [];
  for (let index = 0; index < count; index += 1) {
    nodes.push({ id: `origin-node-${index}`, occurrenceId: `origin-${index}`, stationId: 'origin', directionalStopId: `origin-${index}-n` });
    nodes.push({ id: `branch-node-${index}`, occurrenceId: `branch-${index}`, stationId: `branch-station-${index}`, directionalStopId: `branch-${index}-n` });
    patterns.push({
      ...structuredClone(directGraph().patterns[0]),
      id: `first-${index}`,
      routeId: `R${index}`,
      routeLabel: `R${index}`,
      orderedOccurrenceIds: [`origin-${index}`, `branch-${index}`],
    });
    transfers.push({ id: `to-hub-${index}`, fromOccurrenceId: `branch-${index}`, toOccurrenceId: 'hub', evidence: { kind: 'structural-only' as const } });
  }
  nodes.push({ id: 'destination-node', occurrenceId: 'destination-occurrence', stationId: 'destination', directionalStopId: 'destination-n' });
  return {
    nodes,
    patterns: [...patterns, {
      ...directGraph().patterns[0],
      orderedOccurrenceIds: ['hub', 'destination-occurrence'],
    }],
    transfers,
  };
}
