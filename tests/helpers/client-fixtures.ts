import type {
  BoardEnvelopeDto,
  BootstrapEnvelopeDto,
  CatalogEnvelopeDto,
  JourneyGraphReferenceEnvelopeDto,
  NearbyEnvelopeDto,
  TransitApiClient,
} from '../../src/client/api/client';
import { createOfflineStructuralJourneyGraph } from '../../src/shared/domain/journey-router';
import { journeyGraphFixture } from './journey-graph-fixture';

export const disclosure = 'Demonstration data — not live' as const;

export const gateDecision = {
  exposed: false, reasonCode: 'GATE_0_NOT_PASSED', decision: 'NO-GO — GATE 0 NOT PASSED',
} as const;

export const gates = {
  'arrival-boards': gateDecision,
  'nearby-offline': { ...gateDecision, reasonCode: 'NEARBY_GATE_0_NOT_PASSED' },
  accessibility: { ...gateDecision, reasonCode: 'ACCESSIBILITY_EVIDENCE_NOT_DEMONSTRATED' },
  guidance: { ...gateDecision, reasonCode: 'GUIDANCE_EVIDENCE_NOT_DEMONSTRATED' },
  'maps-rights': { ...gateDecision, reasonCode: 'MAP_RIGHTS_NOT_DOCUMENTED' },
  'commute-evaluation': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
  'commute-silent': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
  'commute-limited-pilot': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
  'commute-delivery': { ...gateDecision, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE' },
} as const;

const realtimeProvenance = {
  source: 'gtfs-rt', sourceId: 'mta-realtime-ace',
  observedAt: '2026-08-04T11:59:58.000Z', retrievedAt: '2026-08-04T11:59:59.000Z',
} as const;

const alertProvenance = {
  source: 'alerts', sourceId: 'mta-service-alerts',
  observedAt: '2026-08-04T11:59:00.000Z', retrievedAt: '2026-08-04T11:59:30.000Z',
} as const;

const sourceHealth = [{
  source: 'gtfs-rt', sourceId: 'mta-realtime-ace', state: 'current',
  assessedAt: '2026-08-04T11:59:58.000Z', lastAcceptedAt: '2026-08-04T11:59:58.000Z',
  reasonCode: 'SOURCE_CURRENT',
}] as const;

const provenance = [realtimeProvenance] as const;

const dynamicBase = {
  apiVersion: 'v1', schemaVersion: '2026-08-04',
  decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
  runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
  gates, demonstrationLabel: disclosure, sourceHealth, provenance,
} as const;

export const bootstrapEnvelope: BootstrapEnvelopeDto = {
  ...dynamicBase,
  responseIdentity: 'response:bootstrap',
  data: {
    productName: 'NYC Subway Tracker', unofficial: true,
    contentVersions: {
      stationCatalog: 'catalog-2026-08-04',
      maps: { day: 'map-day-2026-08-04', night: 'map-night-2026-08-04' },
      journeyGraph: 'journey-graph-2026-08-04',
    },
  },
};

export const journeyGraphReferenceEnvelope: JourneyGraphReferenceEnvelopeDto = {
  apiVersion: 'v1',
  schemaVersion: '2026-08-04',
  contentVersion: bootstrapEnvelope.data.contentVersions.journeyGraph,
  demonstrationLabel: disclosure,
  data: {
    contentVersion: bootstrapEnvelope.data.contentVersions.journeyGraph,
    graph: createOfflineStructuralJourneyGraph(journeyGraphFixture),
  },
};

export const catalogEnvelope: CatalogEnvelopeDto = {
  apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-2026-08-04',
  data: {
    complexes: [
      { id: 'R20', name: 'Canal St', routeIds: ['N', 'Q', 'R', 'W'], constituents: [{ id: 'R20', name: 'Canal St', directionalStopIds: ['R20N', 'R20S'] }] },
      { id: 'A12', name: '125 St', routeIds: ['A', 'C'], constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N', 'A12S'] }] },
      { id: 'L03', name: '14 St–Union Sq', routeIds: ['L', 'N', 'Q', 'R', 'W'], constituents: [{ id: 'L03', name: '14 St–Union Sq', directionalStopIds: ['L03N', 'L03S'] }] },
      { id: 'G08', name: 'Greenpoint Av', routeIds: ['G'], constituents: [{ id: 'G08', name: 'Greenpoint Av', directionalStopIds: ['G08N', 'G08S'] }] },
    ],
  },
};

function nearbyDirection(
  constituentId: string,
  direction: 'northbound' | 'southbound',
  destination: string,
  routes: readonly string[],
) {
  return {
    constituentId,
    constituentPublicName: catalogEnvelope.data.complexes.find(({ id }) => id === constituentId)?.name ?? constituentId,
    directionalStopId: `${constituentId}${direction === 'northbound' ? 'N' : 'S'}`,
    direction,
    actualDestination: destination,
    routeIds: routes,
    arrivalState: 'available' as const,
    selectedEntrance: {
      id: `entrance-${constituentId}-${direction}`,
      publicDescription: direction === 'northbound' ? 'North corner entrance' : 'South corner entrance',
      walkRange: { minimumSeconds: 100, maximumSeconds: 130 },
    },
  };
}

export const nearbyEnvelope: NearbyEnvelopeDto = {
  ...dynamicBase,
  responseIdentity: 'response:nearby',
  gateDecision: gates['nearby-offline'],
  practicalWalkEvidence: { kind: 'available', source: 'practical-walk', sourceId: 'audited-practical-walk', coverage: { kind: 'complete-universe' } },
  data: {
    kind: 'ranked',
    cards: [
      {
        complexId: 'R20', complexName: 'Canal St', rankingRange: { minimumSeconds: 80, maximumSeconds: 100 },
        directions: [
          nearbyDirection('R20', 'northbound', 'Astoria–Ditmars Blvd', ['N', 'Q']),
          nearbyDirection('R20', 'southbound', 'Coney Island–Stillwell Av', ['N', 'Q']),
        ],
        stationDetailAvailable: true,
      },
      {
        complexId: 'A12', complexName: '125 St', rankingRange: { minimumSeconds: 100, maximumSeconds: 130 },
        directions: [
          nearbyDirection('A12', 'northbound', 'Inwood–207 St', ['A', 'C']),
          nearbyDirection('A12', 'southbound', 'Far Rockaway', ['A', 'C']),
        ],
        stationDetailAvailable: true,
      },
      {
        complexId: 'L03', complexName: '14 St–Union Sq', rankingRange: { minimumSeconds: 160, maximumSeconds: 190 },
        directions: [
          nearbyDirection('L03', 'northbound', '8 Av', ['L']),
          nearbyDirection('L03', 'southbound', 'Canarsie–Rockaway Pkwy', ['L']),
        ],
        stationDetailAvailable: true,
      },
    ],
    picker: { required: false, bottomAnchored: true, options: [] },
  },
};

export function boardEnvelope(
  stationId = 'A12',
  stationName = catalogEnvelope.data.complexes.find(({ id }) => id === stationId)?.name ?? stationId,
  routeIds: readonly string[] = stationId === 'R20' ? ['N', 'Q'] : stationId === 'L03' ? ['L'] : ['A', 'C'],
): BoardEnvelopeDto {
  const primaryRoute = routeIds[0] ?? 'A';
  const secondRoute = routeIds[1] ?? primaryRoute;
  return {
    ...dynamicBase,
    cacheState: 'network',
    responseIdentity: `response:board:${stationId}`,
    gateDecision: gates['arrival-boards'],
    data: {
      station: { id: stationId, name: stationName, complexId: stationId, routeIds },
      mode: 'live',
      directions: [
        {
          direction: 'northbound',
          primary: [
            {
              id: `${stationId}-live`, kind: 'live', route: { id: primaryRoute, label: primaryRoute }, direction: 'northbound',
              destination: stationId === 'A12' ? 'Inwood–207 St' : 'Uptown terminal',
              validThrough: '2026-08-04T12:01:30.000Z', demonstrationLabel: disclosure,
              displayAuthority: 'countdown', at: '2026-08-04T12:03:00.000Z', provenance: realtimeProvenance,
            },
            {
              id: `${stationId}-expected`, kind: 'expected', route: { id: secondRoute, label: secondRoute }, direction: 'northbound',
              destination: 'Next northbound terminal', validThrough: '2026-08-04T12:01:30.000Z',
              demonstrationLabel: disclosure, displayAuthority: 'range', estimateAt: '2026-08-04T12:06:00.000Z',
              range: { startsAt: '2026-08-04T12:05:00.000Z', endsAt: '2026-08-04T12:07:00.000Z' }, provenance: realtimeProvenance,
            },
          ],
          secondary: [{
            id: `${stationId}-holding`, kind: 'holding', route: { id: primaryRoute, label: primaryRoute }, direction: 'northbound',
            destination: 'Uptown terminal', validThrough: '2026-08-04T12:01:30.000Z', demonstrationLabel: disclosure,
            displayAuthority: 'status-only', lastSupportedAt: '2026-08-04T11:58:30.000Z', provenance: realtimeProvenance,
          }],
          explanations: [{ code: 'DWELL', message: 'One train is holding.' }],
        },
        {
          direction: 'southbound',
          primary: [{
            id: `${stationId}-south`, kind: 'live', route: { id: primaryRoute, label: primaryRoute }, direction: 'southbound',
            destination: 'Downtown terminal', validThrough: '2026-08-04T12:01:30.000Z', demonstrationLabel: disclosure,
            displayAuthority: 'countdown', at: '2026-08-04T12:04:00.000Z', provenance: realtimeProvenance,
          }],
          secondary: [], explanations: [],
        },
      ],
      alerts: [{
        id: `${stationId}-alert`, text: `${primaryRoute} trains are running with delays.`, activeFrom: '2026-08-04T11:45:00.000Z',
        routeIds: [primaryRoute], stationIds: [stationId], directions: [], demonstrationLabel: disclosure,
        provenance: alertProvenance,
      }],
      explanations: [{ code: 'SERVICE_CONTEXT', message: 'Review current service information.' }],
      sourceHealth, provenance,
      capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
    },
  };
}

export function createClientApi(overrides: Partial<TransitApiClient> = {}): TransitApiClient {
  return {
    bootstrap: overrides.bootstrap ?? (async () => bootstrapEnvelope),
    catalog: overrides.catalog ?? (async () => catalogEnvelope),
    nearby: overrides.nearby ?? (async () => nearbyEnvelope),
    board: overrides.board ?? (async (stationId) => boardEnvelope(stationId)),
    searchStations: overrides.searchStations ?? (async () => { throw new Error('Station search fixture is not configured.'); }),
    mapReference: overrides.mapReference ?? (async () => { throw new Error('Map reference fixture is not configured.'); }),
    journeyReference: overrides.journeyReference ?? (async () => journeyGraphReferenceEnvelope),
    mapOverlay: overrides.mapOverlay ?? (async () => { throw new Error('Map overlay fixture is not configured.'); }),
    planJourney: overrides.planJourney ?? (async () => { throw new Error('Journey fixture is not configured.'); }),
  };
}

export class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

export class ControlledGeolocation implements Pick<Geolocation, 'getCurrentPosition'> {
  readonly requests: Array<{
    readonly success: PositionCallback;
    readonly failure: PositionErrorCallback | null | undefined;
  }> = [];

  getCurrentPosition(success: PositionCallback, failure?: PositionErrorCallback | null): void {
    this.requests.push({ success, failure });
  }

  succeed(index: number, accuracy: number): void {
    this.requests[index].success({
      coords: {
        latitude: 40.7, longitude: -74, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null,
        toJSON: () => ({ latitude: 40.7, longitude: -74, accuracy }),
      },
      timestamp: 1,
      toJSON: () => ({ timestamp: 1 }),
    });
  }

  fail(index: number, code: number): void {
    this.requests[index].failure?.({ code, message: 'browser detail', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  }
}
