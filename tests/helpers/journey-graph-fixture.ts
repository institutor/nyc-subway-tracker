import type { JourneyGraph } from '../../src/shared/domain/journey-router';

export const journeyGraphFixture: JourneyGraph = {
  nodes: [
    { id: 'node-a12-direct', occurrenceId: 'occ-a12-direct', stationId: 'A12', directionalStopId: 'A12N' },
    { id: 'node-r20-direct', occurrenceId: 'occ-r20-direct', stationId: 'R20', directionalStopId: 'R20N' },
    { id: 'node-a12-transfer', occurrenceId: 'occ-a12-transfer', stationId: 'A12', directionalStopId: 'A12S' },
    { id: 'node-d14-in', occurrenceId: 'occ-d14-in', stationId: 'D14', directionalStopId: 'D14S' },
    { id: 'node-d14-out', occurrenceId: 'occ-d14-out', stationId: 'D14', directionalStopId: 'D14E' },
    { id: 'node-r20-transfer', occurrenceId: 'occ-r20-transfer', stationId: 'R20', directionalStopId: 'R20E' },
  ],
  patterns: [
    pattern('pattern-direct', 'A', 'northbound', 'Inwoodâ€“207 St', ['occ-a12-direct', 'occ-r20-direct']),
    pattern('pattern-transfer-a', 'A', 'southbound', 'Far Rockaway', ['occ-a12-transfer', 'occ-d14-in']),
    pattern('pattern-transfer-c', 'C', 'eastbound', 'Euclid Av', ['occ-d14-out', 'occ-r20-transfer']),
  ],
  transfers: [{
    id: 'transfer-d14',
    fromOccurrenceId: 'occ-d14-in',
    toOccurrenceId: 'occ-d14-out',
    evidence: { kind: 'structural-only' },
  }],
};

function pattern(
  id: string,
  routeId: string,
  direction: 'northbound' | 'southbound' | 'eastbound',
  actualDestination: string,
  orderedOccurrenceIds: readonly string[],
) {
  return {
    id,
    routeId,
    routeLabel: routeId,
    direction,
    actualDestination,
    orderedOccurrenceIds,
    accessibility: 'eligible' as const,
    current: {
      status: 'admitted' as const,
      serviceDecision: 'pass' as const,
      validity: 'valid' as const,
      risk: 'clear' as const,
      arrivalSeconds: 120,
    },
    future: [],
    offline: {
      schedule: 'current-supplemented' as const,
      serviceDecision: 'pass' as const,
      patternMatch: 'exact' as const,
      validity: 'valid' as const,
      risk: 'clear' as const,
      arrivalSeconds: 600,
    },
  };
}
