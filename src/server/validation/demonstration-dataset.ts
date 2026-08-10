import { DEMONSTRATION_LABEL } from '../api/contracts';
import type { DecisionSnapshot } from '../api/decision-snapshot';
import type { ProductionDependencyOverrides } from '../bootstrap';
import { createFixedClock } from '../../shared/domain/clock';
import type { JourneyGraph } from '../../shared/domain/journey-router';
import type { BoardDecision, Direction, Provenance, RouteIdentity } from '../../shared/domain/types';
import { planJourney } from '../services/journey-service';

const DECIDED_AT = new Date('2026-08-04T12:00:00.000Z');
const OBSERVED_AT = new Date('2026-08-04T11:59:58.000Z');
const RETRIEVED_AT = new Date('2026-08-04T11:59:59.000Z');
const VALID_THROUGH = '2026-08-04T12:01:30.000Z';
const SERVICE_DATE = '2026-08-04';

const catalog = {
  contentVersion: 'validation-catalog-2026-08-04-v2',
  complexes: [
    complex('A15', '125 St', ['A', 'B', 'C', 'D']),
    complex('A24', '59 St-Columbus Circle', ['A', 'B', 'C', 'D']),
    complex('L03', '14 St–Union Sq', ['L', 'N', 'Q', 'R', 'W']),
    complex('A34', 'Canal St', ['A', 'C', 'E']),
  ],
} as const;

const nearbyUniverse = [
  { id: 'entrance-a15', coordinate: { latitude: 40.811, longitude: -73.952 } },
  { id: 'entrance-a34', coordinate: { latitude: 40.719, longitude: -74.002 } },
  { id: 'entrance-l03', coordinate: { latitude: 40.735, longitude: -73.991 } },
] as const;

const journeyGraph: JourneyGraph = {
  nodes: [
    node('a15-direct', 'A15', 'A15S'), node('a34-direct', 'A34', 'A34S'),
    node('a15-transfer', 'A15', 'A15S'), node('a24-in', 'A24', 'A24S'),
    node('a24-out', 'A24', 'A24S'), node('a34-transfer', 'A34', 'A34S'),
  ],
  patterns: [
    pattern('direct', 'A', 'southbound', 'Far Rockaway', ['occ-a15-direct', 'occ-a34-direct']),
    pattern('transfer-a', 'A', 'southbound', 'Far Rockaway', ['occ-a15-transfer', 'occ-a24-in']),
    pattern('transfer-c', 'C', 'southbound', 'Euclid Av', ['occ-a24-out', 'occ-a34-transfer']),
  ],
  transfers: [{
    id: 'transfer-a24', fromOccurrenceId: 'occ-a24-in', toOccurrenceId: 'occ-a24-out',
    evidence: { kind: 'verified', accessibility: 'eligible', risk: 'clear' },
  }],
};

const referenceJourney = requireTwoItineraries(planJourney(journeyGraph, {
  mode: 'online-current', originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly: false,
}));

const mapReferences = {
  day: {
    contentVersion: 'validation-map-day-2026-08-04-v2',
    attribution: 'Unofficial app-owned subway reference geometry',
    features: mapFeatures(),
  },
  night: {
    contentVersion: 'validation-map-night-2026-08-04-v2',
    attribution: 'Unofficial app-owned subway reference geometry',
    features: mapFeatures(),
  },
} as const;

/**
 * The only deterministic rider dataset installed by the production server. It is selected
 * exclusively by explicit validation mode; network failures and live defaults never call it.
 */
export function createValidationDependencyOverrides(): ProductionDependencyOverrides {
  return {
    clock: createFixedClock(DECIDED_AT),
    catalog,
    nearbyUniverse,
    walk: async ({ destinations }) => Object.freeze({
      kind: 'available' as const,
      source: 'practical-walk' as const,
      sourceId: 'practical-walk',
      coverage: Object.freeze({ kind: 'complete-universe' as const }),
      results: Object.freeze(destinations.map(({ id }) => Object.freeze({
        destinationId: id,
        range: id === 'entrance-a15'
          ? { minimumSeconds: 95, maximumSeconds: 120 }
          : id === 'entrance-a34'
            ? { minimumSeconds: 135, maximumSeconds: 160 }
            : { minimumSeconds: 175, maximumSeconds: 205 },
      }))),
    }),
    mapReferences,
    snapshotProvider: Object.freeze({ capture: createSnapshot }),
  };
}

function createSnapshot(): DecisionSnapshot {
  return {
    identity: 'validation-snapshot-2026-08-04-v2',
    sourceHealth: [
      sourceHealth('gtfs-rt', 'subway-rt-ace'),
      sourceHealth('alerts', 'subway-alerts'),
      sourceHealth('equipment', 'equipment-outages'),
    ],
    provenance: [
      snapshotProvenance('gtfs-rt', 'subway-rt-ace'),
      snapshotProvenance('alerts', 'subway-alerts'),
      snapshotProvenance('equipment', 'equipment-outages'),
    ],
    nearby: nearbySnapshot(),
    boards: [
      { decision: board('A15', '125 St', ['A', 'B', 'C', 'D'], 'A', 'Inwood–207 St', 'Far Rockaway', true), validThrough: VALID_THROUGH },
      { decision: board('L03', '14 St–Union Sq', ['L'], 'L', '8 Av', 'Canarsie–Rockaway Pkwy'), validThrough: VALID_THROUGH },
      { decision: board('A34', 'Canal St', ['A', 'C', 'E'], 'A', 'Inwood–207 St', 'Far Rockaway', true), validThrough: VALID_THROUGH },
    ],
    mapOverlays: [
      {
        theme: 'day', serviceEpoch: 'validation-service-epoch-v1',
        sourceOwners: [
          { source: 'alerts', sourceId: 'subway-alerts' },
          { source: 'gtfs-rt', sourceId: 'subway-rt-ace' },
        ],
        segments: [
          { id: 'line-a', routeIds: ['A'], state: 'affected', alertIds: ['alert-a-north'] },
          { id: 'line-l', routeIds: ['L'], state: 'normal', alertIds: [] },
        ],
      },
      {
        theme: 'night', serviceEpoch: 'validation-service-epoch-v1',
        sourceOwners: [
          { source: 'alerts', sourceId: 'subway-alerts' },
          { source: 'gtfs-rt', sourceId: 'subway-rt-ace' },
        ],
        segments: [
          { id: 'line-a', routeIds: ['A'], state: 'affected', alertIds: ['alert-a-north'] },
          { id: 'line-l', routeIds: ['L'], state: 'normal', alertIds: [] },
        ],
      },
    ],
    journeyGraph,
    journeyCaptures: referenceJourney.itineraries.flatMap((itinerary) => [
      journeyCapture(itinerary, false),
      ...(itinerary.transfers === 0 ? [journeyCapture(itinerary, true)] : []),
    ]),
  };
}

function requireTwoItineraries(
  decision: ReturnType<typeof planJourney>,
): Extract<ReturnType<typeof planJourney>, { readonly kind: 'planned' }> {
  if (decision.kind !== 'planned' || decision.itineraries.length !== 2) {
    throw new Error('Validation journey graph must produce the direct and transfer itineraries');
  }
  return decision;
}

function nearbySnapshot(): NonNullable<DecisionSnapshot['nearby']> {
  const stations = [
    { id: 'A15', name: '125 St', routes: ['A', 'B', 'C', 'D'], north: 'Inwood–207 St', south: 'Far Rockaway' },
    { id: 'A34', name: 'Canal St', routes: ['A', 'C', 'E'], north: 'Inwood–207 St', south: 'Far Rockaway' },
    { id: 'L03', name: '14 St–Union Sq', routes: ['L'], north: '8 Av', south: 'Canarsie–Rockaway Pkwy' },
  ] as const;
  return {
    complexes: stations.map(({ id, name }) => ({ id, name })),
    constituents: stations.map(({ id, name }) => ({ id, complexId: id, publicName: name })),
    entrances: stations.map(({ id, name }) => ({
      id: `entrance-${id.toLocaleLowerCase('en-US')}`, complexId: id, constituentId: id,
      publicDescription: `${name} main entrance`, entryPermission: 'entry' as const, joinStatus: 'matched' as const,
      directionalStopIds: [`${id}N`, `${id}S`], usability: 'open' as const, accessibility: 'eligible' as const,
    })),
    services: stations.flatMap(({ id, routes, north, south }) => routes.flatMap((routeId) => ([
      service(id, routeId, 'northbound', north, `${id}N`),
      service(id, routeId, 'southbound', south, `${id}S`),
    ]))),
  };
}

function board(
  stationId: string,
  name: string,
  routeIds: readonly string[],
  primaryRoute: string,
  northDestination: string,
  southDestination: string,
  alert = false,
): BoardDecision {
  const route = { id: primaryRoute, label: primaryRoute };
  return {
    responseIdentity: `validation-board-${stationId}-v2`,
    mode: 'demonstration',
    station: { id: stationId, name, complexId: stationId, routeIds },
    directions: [
      direction('northbound', route, northDestination, [3, 6, 9]),
      direction('southbound', route, southDestination, [4, 7, 10]),
    ],
    feedHealth: [{ source: 'gtfs-rt', state: 'current', assessedAt: DECIDED_AT, lastAcceptedAt: RETRIEVED_AT }],
    alerts: alert ? [{
      id: 'alert-a-north', text: 'A trains are running with delays.',
      activeFrom: new Date('2026-08-04T11:45:00.000Z'), routeIds: ['A'], stationIds: [stationId],
      directions: ['northbound'], provenance: domainProvenance('alerts', 'subway-alerts'),
    }] : [],
    decidedAt: DECIDED_AT,
    explanations: alert ? [{ code: 'SERVICE_CONTEXT', message: 'Review current service information.' }] : [],
    capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
  };
}

function direction(
  bound: 'northbound' | 'southbound',
  route: RouteIdentity,
  destination: string,
  minutes: readonly number[],
) {
  return {
    direction: bound,
    primary: minutes.map((minute, index) => ({
      id: `validation-${route.id}-${bound}-${index + 1}`, kind: 'live' as const, route, direction: bound,
      destination, at: new Date(DECIDED_AT.getTime() + minute * 60_000),
      provenance: domainProvenance('gtfs-rt', 'subway-rt-ace'),
    })),
    secondary: [],
    explanations: [],
  };
}

function journeyCapture(
  itinerary: (typeof referenceJourney.itineraries)[number],
  accessibleRouteOnly: boolean,
) {
  return {
    itineraryId: itinerary.id,
    requestMode: 'online-current' as const,
    scope: { mode: 'online-current' as const, originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly },
    serviceDate: SERVICE_DATE,
    timing: 'timed' as const,
    capturedAt: DECIDED_AT.toISOString(),
    disclosure: DEMONSTRATION_LABEL,
    validity: {
      result: 'current-itinerary' as const,
      pattern: 'actual-now' as const,
      schedule: {
        kind: 'current' as const,
        editionId: 'validation-supplemented-edition-v1',
        anchorKind: 'published' as const,
        anchorAt: '2026-08-04T11:00:00.000Z',
        lastRetrievedAt: RETRIEVED_AT.toISOString(),
        effectiveFrom: SERVICE_DATE,
        effectiveUntil: SERVICE_DATE,
        currencyAgeSeconds: 3_600,
        departures: itinerary.legs.map((leg) => ({
          patternId: leg.patternId, occurrenceId: leg.orderedOccurrenceIds[0], clockTime: '08:15',
          evidence: 'scheduled' as const, timeZone: 'America/New_York' as const,
        })),
      },
      warnings: [],
      vetoes: [],
    },
    serviceClaims: itinerary.legs.map((leg) => ({
      id: `validation-service-claim-${leg.patternId}`,
      scope: { kind: 'pattern' as const, patternId: leg.patternId, routeId: leg.routeId, direction: leg.direction },
      state: 'normal' as const,
      consequence: `${leg.routeLabel} service context was checked when this demonstration trip was captured.`,
      lastCheckedAt: RETRIEVED_AT.toISOString(),
    })),
    equipmentClaims: accessibleRouteOnly ? [{
      id: 'validation-equipment-claim-el-a34-01',
      equipmentId: 'EL-A34-01',
      connectionId: 'connection-a34-platform',
      pathId: 'path-a15-a34-accessible',
      observation: 'working' as const,
      lastCheckedAt: RETRIEVED_AT.toISOString(),
    }] : [],
  };
}

function complex(id: string, name: string, routes: readonly string[]) {
  return { id, name, routeIds: routes, constituents: [{ id, name, directionalStopIds: [`${id}N`, `${id}S`] }] };
}

function node(id: string, stationId: string, directionalStopId: string) {
  return { id: `node-${id}`, occurrenceId: `occ-${id}`, stationId, directionalStopId };
}

function pattern(
  id: string,
  routeId: string,
  bound: Direction,
  actualDestination: string,
  orderedOccurrenceIds: readonly string[],
) {
  return {
    id: `pattern-${id}`, routeId, routeLabel: routeId, direction: bound, actualDestination, orderedOccurrenceIds,
    accessibility: 'eligible' as const,
    current: { status: 'admitted' as const, serviceDecision: 'pass' as const, validity: 'valid' as const, risk: 'clear' as const, arrivalSeconds: 120 },
    future: [],
    offline: { schedule: 'current-supplemented' as const, serviceDecision: 'pass' as const, patternMatch: 'exact' as const, validity: 'valid' as const, risk: 'clear' as const, arrivalSeconds: 600 },
  };
}

function service(stationId: string, routeId: string, bound: Direction, destination: string, stopId: string) {
  return {
    id: `service-${stationId}-${routeId}-${bound}`, complexId: stationId, constituentId: stationId,
    directionalStopId: stopId, routeId, direction: bound, actualDestination: destination,
    state: 'current' as const, arrivalState: 'available' as const,
  };
}

function mapFeatures() {
  return [
    { id: 'line-a', kind: 'line' as const, routeIds: ['A'], geometry: { type: 'LineString' as const, coordinates: [[-73.952, 40.811], [-74.002, 40.719]] } },
    { id: 'line-l', kind: 'line' as const, routeIds: ['L'], geometry: { type: 'LineString' as const, coordinates: [[-74.002, 40.74], [-73.991, 40.735]] } },
    { id: 'station-a15', kind: 'station' as const, routeIds: ['A', 'B', 'C', 'D'], geometry: { type: 'Point' as const, coordinates: [-73.952, 40.811] } },
    { id: 'station-a34', kind: 'station' as const, routeIds: ['A', 'C', 'E'], geometry: { type: 'Point' as const, coordinates: [-74.002, 40.719] } },
  ];
}

function sourceHealth(source: string, sourceId: string) {
  return { source, sourceId, state: 'current' as const, assessedAt: DECIDED_AT.toISOString(), lastAcceptedAt: RETRIEVED_AT.toISOString() };
}

function snapshotProvenance(source: string, sourceId: string) {
  return { source, sourceId, observedAt: OBSERVED_AT.toISOString(), retrievedAt: RETRIEVED_AT.toISOString(), version: 'validation-v1' };
}

function domainProvenance(source: Provenance['source'], sourceId: string): Provenance {
  return { source, sourceId, observedAt: OBSERVED_AT, retrievedAt: RETRIEVED_AT, version: 'validation-v1' };
}
