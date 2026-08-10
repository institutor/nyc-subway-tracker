import type { Direction } from '../../shared/domain/types';
import { validateJourneyGraph, type JourneyGraph } from '../../shared/domain/journey-router';
import {
  bindJourneyCapturePackage,
  type JourneyCapturePackage,
} from '../../shared/domain/journey-capture';
import {
  admitOperationalSourceOwners,
  isCanonicalOperationalServiceEpoch,
} from '../../shared/domain/operational-source-owners';

const API_VERSION = 'v1';
const SCHEMA_VERSION = '2026-08-04';
const DEMONSTRATION_LABEL = 'Demonstration data — not live';
const GENERIC_ERROR = 'Transit information is unavailable.';

export interface LocationFixDto {
  readonly coordinate: { readonly latitude: number; readonly longitude: number };
  readonly accuracyMeters: number;
}

export interface RuntimeDto {
  readonly mode: 'live' | 'shadow' | 'validation';
  readonly surface: 'public' | 'demonstration';
  readonly availability: 'available' | 'locked' | 'unavailable';
}

export interface GateDecisionDto {
  readonly exposed: false;
  readonly reasonCode: string;
  readonly decision: string;
}

export interface ProvenanceDto {
  readonly source: 'regular-gtfs' | 'supplemented-gtfs' | 'gtfs-rt' | 'alerts' | 'entrances' | 'equipment' | 'practical-walk' | 'unavailable';
  readonly sourceId: string;
  readonly observedAt: string;
  readonly retrievedAt: string;
}

export interface SourceHealthDto {
  readonly source: ProvenanceDto['source'];
  readonly sourceId: string;
  readonly state: 'current' | 'degraded' | 'unavailable' | 'quarantined';
  readonly assessedAt: string;
  readonly lastAcceptedAt?: string;
  readonly reasonCode: 'SOURCE_CURRENT' | 'SOURCE_DEGRADED' | 'SOURCE_UNAVAILABLE' | 'SOURCE_QUARANTINED';
}

export interface DynamicEnvelopeBase {
  readonly apiVersion: typeof API_VERSION;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly responseIdentity: string;
  readonly decidedAt: string;
  readonly serverTime: string;
  readonly runtime: RuntimeDto;
  readonly gates: Readonly<Record<string, GateDecisionDto>>;
  readonly gateDecision?: GateDecisionDto;
  readonly sourceHealth?: readonly SourceHealthDto[];
  readonly provenance?: readonly ProvenanceDto[];
  readonly decisionSnapshotIdentity?: string;
  readonly demonstrationLabel?: typeof DEMONSTRATION_LABEL;
}

export interface BootstrapDataDto {
  readonly productName: 'NYC Subway Tracker';
  readonly unofficial: true;
  readonly contentVersions: {
    readonly stationCatalog: string;
    readonly maps: { readonly day: string; readonly night: string };
    readonly journeyGraph: string;
  };
}

export interface BootstrapEnvelopeDto extends DynamicEnvelopeBase {
  readonly data: BootstrapDataDto;
}

export interface CatalogConstituentDto {
  readonly id: string;
  readonly name: string;
  readonly directionalStopIds: readonly string[];
}

export interface CatalogComplexDto {
  readonly id: string;
  readonly name: string;
  readonly routeIds: readonly string[];
  readonly constituents: readonly CatalogConstituentDto[];
}

export interface CatalogEnvelopeDto {
  readonly apiVersion: typeof API_VERSION;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly contentVersion: string;
  readonly data: { readonly complexes: readonly CatalogComplexDto[] };
}

export interface StationSearchEnvelopeDto {
  readonly apiVersion: typeof API_VERSION;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly contentVersion: string;
  readonly query: string;
  readonly results: readonly CatalogComplexDto[];
}

export type MapThemeDto = 'day' | 'night';

export type MapGeometryDto =
  | { readonly type: 'Point'; readonly coordinates: readonly [number, number] }
  | { readonly type: 'LineString'; readonly coordinates: readonly (readonly [number, number])[] };

export interface MapFeatureDto {
  readonly id: string;
  readonly kind: 'line' | 'station' | 'transfer';
  readonly routeIds: readonly string[];
  readonly geometry: MapGeometryDto;
}

export interface MapReferenceDto {
  readonly theme: MapThemeDto;
  readonly contentVersion: string;
  readonly attribution: string;
  readonly features: readonly MapFeatureDto[];
}

export type MapReferenceEnvelopeDto =
  | {
      readonly apiVersion: typeof API_VERSION;
      readonly schemaVersion: typeof SCHEMA_VERSION;
      readonly contentVersion: string;
      readonly demonstrationLabel: typeof DEMONSTRATION_LABEL;
      readonly data: MapReferenceDto;
    }
  | (DynamicEnvelopeBase & { readonly data: null });

export interface JourneyGraphReferenceDto {
  readonly contentVersion: string;
  readonly graph: JourneyGraph;
}

export interface JourneyGraphReferenceEnvelopeDto {
  readonly apiVersion: typeof API_VERSION;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly contentVersion: string;
  readonly demonstrationLabel?: typeof DEMONSTRATION_LABEL;
  readonly data: JourneyGraphReferenceDto;
}

export interface MapOverlaySegmentDto {
  readonly id: string;
  readonly routeIds: readonly string[];
  readonly state: 'normal' | 'affected' | 'unavailable';
  readonly alertIds: readonly string[];
}

export interface MapOverlaySourceOwnerDto {
  readonly source: 'supplemented-gtfs' | 'gtfs-rt' | 'alerts';
  readonly sourceId: string;
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly lastAcceptedAt: string;
  readonly assessedAt: string;
}

export interface MapOverlayEnvelopeDto extends DynamicEnvelopeBase {
  readonly cacheState: TransportCacheState;
  readonly data: {
    readonly theme: MapThemeDto;
    readonly serviceEpoch: string | null;
    readonly segments: readonly MapOverlaySegmentDto[];
    readonly sourceOwners: readonly MapOverlaySourceOwnerDto[];
  } | null;
}

export interface JourneyRequestDto {
  readonly mode: 'online-current' | 'online-future' | 'offline-reference';
  readonly originStationId: string;
  readonly destinationStationId: string;
  readonly requiredFirstDirection?: Direction;
  readonly requiredActualDestination?: string;
  readonly serviceDate?: string;
  readonly accessibleRouteOnly: boolean;
}

export interface JourneyLegDto {
  readonly patternId: string;
  readonly routeId: string;
  readonly routeLabel: string;
  readonly direction: Direction;
  readonly actualDestination: string;
  readonly fromOccurrenceId: string;
  readonly toOccurrenceId: string;
  readonly orderedOccurrenceIds: readonly string[];
  readonly fromStationId: string;
  readonly toStationId: string;
  readonly orderedStationIds: readonly string[];
}

export interface JourneyTransferInstructionDto {
  readonly transferId: string;
  readonly stationId: string;
  readonly fromRouteId: string;
  readonly fromDirection: Direction;
  readonly fromActualDestination: string;
  readonly toRouteId: string;
  readonly toDirection: Direction;
  readonly toActualDestination: string;
}

export interface JourneyItineraryDto {
  readonly id: string;
  readonly legs: readonly JourneyLegDto[];
  readonly transferIds: readonly string[];
  readonly transferInstructions: readonly JourneyTransferInstructionDto[];
  readonly transfers: number;
  readonly validity: 'valid' | 'limited';
  readonly accessibility: 'eligible' | 'unknown' | 'ineligible';
  readonly risk: 'clear' | 'affected' | 'uncertain' | 'blocked';
  readonly timing: 'timed' | 'untimed';
  readonly practicalWalkRange?: WalkRangeDto;
  readonly arrivalSeconds?: number;
  readonly capture?: JourneyCapturePackage;
}

export interface JourneyScopeDto {
  readonly mode: JourneyRequestDto['mode'];
  readonly originStationId: string;
  readonly destinationStationId: string;
  readonly accessibleRouteOnly: boolean;
  readonly serviceDate?: string;
}

export type JourneyDecisionDto =
  | { readonly kind: 'planned'; readonly label?: 'Reference itinerary'; readonly scope: JourneyScopeDto; readonly itineraries: readonly JourneyItineraryDto[] }
  | { readonly kind: 'untimed'; readonly label: 'Untimed structural route'; readonly scope: JourneyScopeDto; readonly itineraries: readonly JourneyItineraryDto[] }
  | { readonly kind: 'no-path'; readonly reason: 'no-service-path'; readonly scope: JourneyScopeDto }
  | { readonly kind: 'unavailable'; readonly reason: 'no-verified-accessible-path' | 'incomparable-evidence' | 'search-limit-reached'; readonly scope: JourneyScopeDto };

export interface JourneyEnvelopeDto extends DynamicEnvelopeBase {
  readonly data: JourneyDecisionDto | null;
}

export interface WalkRangeDto {
  readonly minimumSeconds: number;
  readonly maximumSeconds: number;
}

export interface SelectedEntranceDto {
  readonly id: string;
  readonly publicDescription: string;
  readonly walkRange: WalkRangeDto;
  readonly nearestLabel?: 'One of the closest confirmed entrances.';
  readonly walkComparison?: 'About the same walk.';
}

export interface NearbyDirectionDto {
  readonly constituentId: string;
  readonly constituentPublicName: string;
  readonly directionalStopId: string;
  readonly direction: Direction;
  readonly actualDestination: string;
  readonly routeIds: readonly string[];
  readonly arrivalState: 'available' | 'limited' | 'unavailable';
  readonly selectedEntrance: SelectedEntranceDto;
}

export interface NearbyStationCardDto {
  readonly complexId: string;
  readonly complexName: string;
  readonly rankingRange: WalkRangeDto;
  readonly directions: readonly NearbyDirectionDto[];
  readonly walkComparison?: 'About the same walk.';
  readonly stationDetailAvailable: true;
}

export type NearbyPickerOptionDto =
  | {
      readonly complexId: string;
      readonly complexName: string;
      readonly entranceAvailability: 'confirmed';
      readonly stationDetailAvailable: true;
    }
  | {
      readonly complexId: string;
      readonly complexName: string;
      readonly entranceAvailability: 'unconfirmed';
      readonly message: 'Entrance availability not confirmed';
      readonly arrivalState: 'unavailable';
      readonly stationDetailAvailable: true;
    };

export type NearbyDecisionDto =
  | {
      readonly kind: 'ranked';
      readonly cards: readonly NearbyStationCardDto[];
      readonly picker: { readonly required: boolean; readonly bottomAnchored: true; readonly options: readonly NearbyPickerOptionDto[] };
    }
  | {
      readonly kind: 'picker';
      readonly reason: 'walk-unavailable' | 'walk-incomparable' | 'no-confirmed-entrance' | 'no-current-service';
      readonly cards: readonly [];
      readonly picker: { readonly required: true; readonly bottomAnchored: true; readonly options: readonly NearbyPickerOptionDto[] };
    };

export interface NearbyEnvelopeDto extends DynamicEnvelopeBase {
  readonly practicalWalkEvidence?: unknown;
  readonly data: NearbyDecisionDto | null;
}

export interface RouteDto {
  readonly id: string;
  readonly label: string;
}

interface ArrivalBaseDto {
  readonly id: string;
  readonly route: RouteDto;
  readonly direction: Direction;
  readonly destination: string;
  readonly validThrough: string;
  readonly demonstrationLabel: typeof DEMONSTRATION_LABEL;
  readonly provenance: ProvenanceDto;
}

export interface LiveArrivalDto extends ArrivalBaseDto {
  readonly kind: 'live';
  readonly displayAuthority: 'countdown';
  readonly at: string;
}

export interface ExpectedArrivalDto extends ArrivalBaseDto {
  readonly kind: 'expected';
  readonly displayAuthority: 'range';
  readonly estimateAt: string;
  readonly range: { readonly startsAt: string; readonly endsAt: string };
}

export interface ScheduledArrivalDto extends ArrivalBaseDto {
  readonly kind: 'scheduled';
  readonly displayAuthority: 'clock-time';
  readonly at: string;
  readonly serviceDate: string;
}

export interface HoldingArrivalDto extends ArrivalBaseDto {
  readonly kind: 'holding';
  readonly displayAuthority: 'status-only';
  readonly lastSupportedAt: string;
}

export interface UncertainArrivalDto extends ArrivalBaseDto {
  readonly kind: 'uncertain';
  readonly displayAuthority: 'status-only';
  readonly reason: string;
}

export type PrimaryArrivalDto = LiveArrivalDto | ExpectedArrivalDto | ScheduledArrivalDto;
export type SecondaryArrivalDto = HoldingArrivalDto | UncertainArrivalDto;
export type ArrivalDto = PrimaryArrivalDto | SecondaryArrivalDto;

export interface ExplanationDto {
  readonly code: string;
  readonly message: string;
  readonly provenance?: ProvenanceDto;
}

export interface BoardDirectionDto {
  readonly direction: Direction;
  readonly primary: readonly PrimaryArrivalDto[];
  readonly secondary: readonly SecondaryArrivalDto[];
  readonly explanations: readonly ExplanationDto[];
}

export interface AlertDto {
  readonly id: string;
  readonly text: string;
  readonly activeFrom: string;
  readonly activeUntil?: string;
  readonly routeIds: readonly string[];
  readonly stationIds: readonly string[];
  readonly directions: readonly Direction[];
  readonly demonstrationLabel: typeof DEMONSTRATION_LABEL;
  readonly provenance: ProvenanceDto;
}

export interface BoardDataDto {
  readonly station: { readonly id: string; readonly name: string; readonly complexId: string; readonly routeIds: readonly string[] } | null;
  readonly mode: 'live' | 'scheduled-fallback' | 'demonstration' | 'unavailable';
  readonly directions: readonly BoardDirectionDto[];
  readonly alerts: readonly AlertDto[];
  readonly explanations: readonly ExplanationDto[];
  readonly sourceHealth: readonly SourceHealthDto[];
  readonly provenance: readonly ProvenanceDto[];
  readonly capabilities: {
    readonly arrivals: 'locked' | 'available' | 'unavailable';
    readonly accessibility: 'locked' | 'available' | 'unavailable';
    readonly guidance: 'locked' | 'available' | 'unavailable';
    readonly commute: 'locked' | 'available' | 'unavailable';
  };
}

export interface BoardEnvelopeDto extends DynamicEnvelopeBase {
  readonly cacheState: TransportCacheState;
  readonly data: BoardDataDto | null;
  /** Local monotonic receipt evidence; never sourced from or sent to the server. */
  readonly receivedAtMonotonicMs?: number;
}

export interface StatusSourceSignalDto {
  readonly source: ProvenanceDto['source'];
  readonly sourceId: string;
  readonly state: SourceHealthDto['state'];
  readonly reasonCode: SourceHealthDto['reasonCode'];
  readonly ageSeconds?: number;
  readonly lastAcceptedAt?: string;
}

export interface StatusExposureGateDto extends GateDecisionDto {
  readonly stage: string;
}

export interface StatusDataDto {
  readonly alerts: readonly AlertDto[];
  readonly sourceHealth: readonly SourceHealthDto[];
  readonly provenance: readonly ProvenanceDto[];
  readonly explanations: readonly ExplanationDto[];
  readonly diagnostics: {
    readonly sourceSignals: readonly StatusSourceSignalDto[];
    readonly exposureGates: readonly StatusExposureGateDto[];
  };
}

export interface StatusEnvelopeDto extends DynamicEnvelopeBase {
  readonly data: StatusDataDto | null;
}

export interface TransitApiClient {
  status(signal?: AbortSignal): Promise<StatusEnvelopeDto>;
  bootstrap(signal?: AbortSignal): Promise<BootstrapEnvelopeDto>;
  catalog(contentVersion: string, signal?: AbortSignal): Promise<CatalogEnvelopeDto>;
  searchStations(query: string, limit?: number, signal?: AbortSignal): Promise<StationSearchEnvelopeDto>;
  mapReference(theme: MapThemeDto, contentVersion: string, signal?: AbortSignal): Promise<MapReferenceEnvelopeDto>;
  journeyReference(contentVersion: string, signal?: AbortSignal): Promise<JourneyGraphReferenceEnvelopeDto>;
  mapOverlay(theme: MapThemeDto, signal?: AbortSignal): Promise<MapOverlayEnvelopeDto>;
  planJourney(query: JourneyRequestDto, signal?: AbortSignal): Promise<JourneyEnvelopeDto>;
  nearby(fix: LocationFixDto, accessibleRouteOnly: boolean, signal?: AbortSignal): Promise<NearbyEnvelopeDto>;
  board(
    stationId: string,
    filters?: { readonly routeIds?: readonly string[]; readonly direction?: Direction },
    signal?: AbortSignal,
  ): Promise<BoardEnvelopeDto>;
}

export class TransitApiError extends Error {
  constructor(readonly category: 'network-unreachable' | 'domain-unavailable' = 'domain-unavailable') {
    super(GENERIC_ERROR);
    this.name = 'TransitApiError';
  }
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type TransportCacheState = 'network' | 'historical';

interface ReceivedJson {
  readonly value: unknown;
  readonly cacheState: TransportCacheState;
}

function networkValue(received: ReceivedJson): unknown {
  if (received.cacheState !== 'network') throw new TransitApiError();
  return received.value;
}

export function createTransitApiClient(fetcher: Fetcher = globalThis.fetch.bind(globalThis)): TransitApiClient {
  const get = (url: string, signal?: AbortSignal) => requestJson(fetcher, url, { signal });
  return Object.freeze({
    async status(signal?: AbortSignal) {
      return parseStatus(networkValue(await get('/api/v1/status', signal)));
    },
    async bootstrap(signal?: AbortSignal) {
      return parseBootstrap(networkValue(await get('/api/v1/bootstrap', signal)));
    },
    async catalog(contentVersion: string, signal?: AbortSignal) {
      return parseCatalog(networkValue(await get(`/api/v1/stations/catalog/${encodeIdentifier(contentVersion)}`, signal)));
    },
    async searchStations(query: string, limit = 10, signal?: AbortSignal) {
      const capturedQuery = searchQuery(query);
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25) invalid();
      const params = new URLSearchParams({ q: capturedQuery, limit: String(limit) });
      return parseStationSearch(networkValue(await get(`/api/v1/stations/search?${params.toString()}`, signal)), capturedQuery);
    },
    async mapReference(theme: MapThemeDto, contentVersion: string, signal?: AbortSignal) {
      const capturedTheme = parseMapTheme(theme);
      const capturedVersion = encodeIdentity(contentVersion);
      return parseMapReference(
        networkValue(await get(`/api/v1/maps/${capturedTheme}/reference/${encodeURIComponent(capturedVersion)}`, signal)),
        capturedTheme,
        capturedVersion,
      );
    },
    async journeyReference(contentVersion: string, signal?: AbortSignal) {
      const capturedVersion = encodeIdentity(contentVersion);
      return parseJourneyReference(
        networkValue(await get(`/api/v1/journeys/reference/${encodeURIComponent(capturedVersion)}`, signal)),
        capturedVersion,
      );
    },
    async mapOverlay(theme: MapThemeDto, signal?: AbortSignal) {
      const capturedTheme = parseMapTheme(theme);
      const received = await get(`/api/v1/maps/${capturedTheme}/overlay`, signal);
      return parseMapOverlay(received.value, capturedTheme, received.cacheState);
    },
    async planJourney(query: JourneyRequestDto, signal?: AbortSignal) {
      const captured = captureJourneyRequest(query);
      const value = await requestJson(fetcher, '/api/v1/journeys', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(captured), signal,
      });
      return parseJourney(networkValue(value), captured);
    },
    async nearby(fix: LocationFixDto, accessibleRouteOnly: boolean, signal?: AbortSignal) {
      const captured = captureLocationFix(fix);
      const value = await requestJson(fetcher, '/api/v1/nearby', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          location: {
            latitude: captured.coordinate.latitude,
            longitude: captured.coordinate.longitude,
            accuracyMeters: captured.accuracyMeters,
          },
          accessibleRouteOnly,
        }),
        signal,
      });
      return parseNearby(networkValue(value));
    },
    async board(
      stationId: string,
      filters: { readonly routeIds?: readonly string[]; readonly direction?: Direction } = {},
      signal?: AbortSignal,
    ) {
      const capturedStationId = encodeIdentity(stationId);
      const capturedRouteIds = filters.routeIds === undefined ? [] : identities(filters.routeIds, 32).map(encodeIdentity);
      const capturedDirection = filters.direction === undefined ? undefined : parseDirection(filters.direction);
      const params = new URLSearchParams();
      if (capturedRouteIds.length) params.set('routes', capturedRouteIds.join(','));
      if (capturedDirection) params.set('direction', capturedDirection);
      const query = params.size === 0 ? '' : `?${params.toString()}`;
      const received = await get(`/api/v1/stations/${encodeURIComponent(capturedStationId)}/board${query}`, signal);
      const receivedAtMonotonicMs = monotonicNow();
      return parseBoard(
        received.value,
        { stationId: capturedStationId, routeIds: capturedRouteIds, ...(capturedDirection ? { direction: capturedDirection } : {}) },
        receivedAtMonotonicMs,
        received.cacheState,
      );
    },
  });
}

const STATUS_STAGES = [
  'arrival-boards', 'nearby-offline', 'accessibility', 'guidance', 'maps-rights',
  'commute-evaluation', 'commute-silent', 'commute-limited-pilot', 'commute-delivery',
] as const;

const CANONICAL_STATUS_GATES = Object.freeze({
  'arrival-boards': { exposed: false, reasonCode: 'GATE_0_NOT_PASSED', decision: 'NO-GO — GATE 0 NOT PASSED' },
  'nearby-offline': { exposed: false, reasonCode: 'NEARBY_GATE_0_NOT_PASSED', decision: 'NO-GO — GATE 0 NOT PASSED' },
  accessibility: { exposed: false, reasonCode: 'ACCESSIBILITY_EVIDENCE_NOT_DEMONSTRATED', decision: 'NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED' },
  guidance: { exposed: false, reasonCode: 'GUIDANCE_EVIDENCE_NOT_DEMONSTRATED', decision: 'NO-GO — RELEASE 2 POSITIONING AND TRANSFER EVIDENCE IS NOT DEMONSTRATED' },
  'maps-rights': { exposed: false, reasonCode: 'MAP_RIGHTS_NOT_DOCUMENTED', decision: 'Blocked from public release — rights not documented.' },
  'commute-evaluation': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO — prerequisites and fixed-version evidence incomplete' },
  'commute-silent': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO — prerequisites and fixed-version evidence incomplete' },
  'commute-limited-pilot': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO — prerequisites and fixed-version evidence incomplete' },
  'commute-delivery': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO — prerequisites and fixed-version evidence incomplete' },
} satisfies Record<(typeof STATUS_STAGES)[number], GateDecisionDto>);

function parseStatus(value: unknown): StatusEnvelopeDto {
  const root = dynamicRoot(value, ['data']);
  const base = dynamicBase(root);
  const gateEntries = Object.entries(base.gates);
  if (gateEntries.length !== STATUS_STAGES.length || gateEntries.some(([stage, gate], index) =>
    stage !== STATUS_STAGES[index]
    || JSON.stringify(gate) !== JSON.stringify(CANONICAL_STATUS_GATES[STATUS_STAGES[index]]))) invalid();
  if (root.data === null) {
    if (base.runtime.availability !== 'locked') invalid();
    return freeze({ ...base, data: null });
  }
  if (base.runtime.mode !== 'validation' || base.runtime.surface !== 'demonstration'
    || base.runtime.availability !== 'available' || base.demonstrationLabel !== DEMONSTRATION_LABEL) invalid();
  const data = strictRecord(root.data, ['alerts', 'sourceHealth', 'provenance', 'explanations', 'diagnostics']);
  const sourceHealth = boundedArray(data.sourceHealth, 128).map(parseSourceHealth);
  const diagnostics = strictRecord(data.diagnostics, ['sourceSignals', 'exposureGates']);
  const sourceSignals = boundedArray(diagnostics.sourceSignals, 128).map(parseStatusSourceSignal);
  const signalOwnership = (signal: StatusSourceSignalDto | SourceHealthDto) => ({
    source: signal.source,
    sourceId: signal.sourceId,
    state: signal.state,
    reasonCode: signal.reasonCode,
    ...(signal.lastAcceptedAt === undefined ? {} : { lastAcceptedAt: signal.lastAcceptedAt }),
  });
  if (JSON.stringify(sourceSignals.map(signalOwnership)) !== JSON.stringify(sourceHealth.map(signalOwnership))) invalid();
  const exposureGates = boundedArray(diagnostics.exposureGates, STATUS_STAGES.length).map((candidate) => {
    const row = strictRecord(candidate, ['stage', 'exposed', 'reasonCode', 'decision']);
    const stage = enumeration(row.stage, STATUS_STAGES);
    const parsed = parseGate({ exposed: row.exposed, reasonCode: row.reasonCode, decision: row.decision });
    if (JSON.stringify(parsed) !== JSON.stringify(base.gates[stage])) invalid();
    return { stage, ...parsed };
  });
  if (exposureGates.length !== STATUS_STAGES.length
    || exposureGates.some(({ stage }, index) => stage !== STATUS_STAGES[index])) invalid();
  return freeze({
    ...base,
    data: {
      alerts: boundedArray(data.alerts, 256).map(parseAlert),
      sourceHealth,
      provenance: boundedArray(data.provenance, 128).map(parseProvenance),
      explanations: boundedArray(data.explanations, 256).map(parseExplanation),
      diagnostics: { sourceSignals, exposureGates },
    },
  });
}

function parseStatusSourceSignal(value: unknown): StatusSourceSignalDto {
  const row = strictRecord(value, ['source', 'sourceId', 'state', 'reasonCode'], ['ageSeconds', 'lastAcceptedAt']);
  const health = parseSourceHealth({
    source: row.source,
    sourceId: row.sourceId,
    state: row.state,
    reasonCode: row.reasonCode,
    assessedAt: '1970-01-01T00:00:00.000Z',
    ...(row.lastAcceptedAt === undefined ? {} : { lastAcceptedAt: row.lastAcceptedAt }),
  });
  if ((row.ageSeconds === undefined) !== (row.lastAcceptedAt === undefined)) invalid();
  if (row.ageSeconds !== undefined && (!Number.isSafeInteger(row.ageSeconds) || Number(row.ageSeconds) < 0)) invalid();
  return {
    source: health.source,
    sourceId: health.sourceId,
    state: health.state,
    reasonCode: health.reasonCode,
    ...(row.ageSeconds === undefined ? {} : {
      ageSeconds: Number(row.ageSeconds),
      lastAcceptedAt: health.lastAcceptedAt!,
    }),
  };
}

async function requestJson(fetcher: Fetcher, url: string, init: RequestInit): Promise<ReceivedJson> {
  let response: Response;
  try {
    response = await fetcher(url, init);
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new TransitApiError('network-unreachable');
  }
  if (!response.ok || !response.headers.get('content-type')?.toLocaleLowerCase('en-US').startsWith('application/json')) {
    throw new TransitApiError();
  }
  const cacheStateHeader = response.headers.get('x-subway-cache-state');
  const cacheState = cacheStateHeader === null ? 'network'
    : cacheStateHeader === 'historical' ? 'historical'
      : undefined;
  if (!cacheState) throw new TransitApiError();
  try {
    return { value: await response.json(), cacheState };
  } catch {
    throw new TransitApiError();
  }
}

function parseBootstrap(value: unknown): BootstrapEnvelopeDto {
  const root = dynamicRoot(value, ['data']);
  const data = strictRecord(root.data, ['productName', 'unofficial', 'contentVersions']);
  if (data.productName !== 'NYC Subway Tracker' || data.unofficial !== true) invalid();
  const versions = strictRecord(data.contentVersions, ['stationCatalog', 'maps', 'journeyGraph']);
  const maps = strictRecord(versions.maps, ['day', 'night']);
  return freeze({
    ...dynamicBase(root),
    data: {
      productName: 'NYC Subway Tracker', unofficial: true,
      contentVersions: {
        stationCatalog: identity(versions.stationCatalog),
        maps: { day: identity(maps.day), night: identity(maps.night) },
        journeyGraph: identity(versions.journeyGraph),
      },
    },
  });
}

function parseCatalog(value: unknown): CatalogEnvelopeDto {
  const root = strictRecord(value, ['apiVersion', 'schemaVersion', 'contentVersion', 'data']);
  apiHeader(root);
  const data = strictRecord(root.data, ['complexes']);
  const complexes = boundedArray(data.complexes, 10_000).map(parseCatalogComplex);
  assertUnique(complexes.map(({ id }) => id));
  return freeze({
    apiVersion: API_VERSION, schemaVersion: SCHEMA_VERSION, contentVersion: identity(root.contentVersion),
    data: { complexes },
  });
}

function parseStationSearch(value: unknown, requestQuery: string): StationSearchEnvelopeDto {
  const root = strictRecord(value, ['apiVersion', 'schemaVersion', 'contentVersion', 'query', 'results']);
  apiHeader(root);
  const query = searchQuery(root.query);
  if (query !== requestQuery) invalid();
  const results = boundedArray(root.results, 25).map(parseCatalogComplex);
  assertUnique(results.map(({ id }) => id));
  return freeze({
    apiVersion: API_VERSION, schemaVersion: SCHEMA_VERSION, contentVersion: identity(root.contentVersion), query, results,
  });
}

function parseMapReference(value: unknown, requestedTheme: MapThemeDto, requestedVersion: string): MapReferenceEnvelopeDto {
  const candidate = record(value);
  if (Object.hasOwn(candidate, 'runtime')) {
    const root = dynamicRoot(value, ['data']);
    const base = dynamicBase(root);
    if (base.runtime.availability !== 'locked' || root.data !== null) invalid();
    return freeze({ ...base, data: null });
  }
  const root = strictRecord(value, ['apiVersion', 'schemaVersion', 'contentVersion', 'demonstrationLabel', 'data']);
  apiHeader(root);
  if (root.demonstrationLabel !== DEMONSTRATION_LABEL) invalid();
  const contentVersion = identity(root.contentVersion);
  if (contentVersion !== requestedVersion) invalid();
  const data = parseMapReferenceData(root.data);
  if (data.theme !== requestedTheme || data.contentVersion !== contentVersion) invalid();
  return freeze({ apiVersion: API_VERSION, schemaVersion: SCHEMA_VERSION, contentVersion, demonstrationLabel: DEMONSTRATION_LABEL, data });
}

function parseMapReferenceData(value: unknown): MapReferenceDto {
  const row = strictRecord(value, ['theme', 'contentVersion', 'attribution', 'features']);
  const features = boundedArray(row.features, 50_000).map(parseMapFeature);
  assertUnique(features.map(({ id }) => id));
  return {
    theme: parseMapTheme(row.theme), contentVersion: identity(row.contentVersion), attribution: display(row.attribution), features,
  };
}

function parseJourneyReference(value: unknown, requestedVersion: string): JourneyGraphReferenceEnvelopeDto {
  const root = strictRecord(
    value,
    ['apiVersion', 'schemaVersion', 'contentVersion', 'data'],
    ['demonstrationLabel'],
  );
  apiHeader(root);
  const contentVersion = identity(root.contentVersion);
  if (contentVersion !== requestedVersion) invalid();
  const data = strictRecord(root.data, ['contentVersion', 'graph']);
  if (identity(data.contentVersion) !== contentVersion) invalid();
  let graph: JourneyGraph;
  try {
    graph = validateJourneyGraph(data.graph as JourneyGraph);
  } catch {
    invalid();
  }
  const demonstrationLabel = root.demonstrationLabel === undefined
    ? undefined
    : demonstration(root.demonstrationLabel);
  return freeze({
    apiVersion: API_VERSION,
    schemaVersion: SCHEMA_VERSION,
    contentVersion,
    ...(demonstrationLabel ? { demonstrationLabel } : {}),
    data: { contentVersion, graph },
  });
}

function parseMapFeature(value: unknown): MapFeatureDto {
  const row = strictRecord(value, ['id', 'kind', 'routeIds', 'geometry']);
  return {
    id: identity(row.id), kind: enumeration(row.kind, ['line', 'station', 'transfer'] as const),
    routeIds: identities(row.routeIds, 32), geometry: parseMapGeometry(row.geometry),
  };
}

function parseMapGeometry(value: unknown): MapGeometryDto {
  const row = strictRecord(value, ['type', 'coordinates']);
  if (row.type === 'Point') return { type: 'Point', coordinates: mapPoint(row.coordinates) };
  if (row.type !== 'LineString') invalid();
  const coordinates = boundedArray(row.coordinates, 10_000);
  if (coordinates.length < 2) invalid();
  return { type: 'LineString', coordinates: coordinates.map(mapPoint) };
}

function mapPoint(value: unknown): readonly [number, number] {
  if (!Array.isArray(value) || value.length !== 2) invalid();
  const [longitude, latitude] = value;
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) invalid();
  return [longitude, latitude];
}

function parseMapOverlay(
  value: unknown,
  requestedTheme: MapThemeDto,
  cacheState: TransportCacheState,
): MapOverlayEnvelopeDto {
  const root = dynamicRoot(value, ['data']);
  const base = dynamicBase(root);
  const data = root.data === null ? null : parseMapOverlayData(root.data);
  if ((base.runtime.availability === 'locked') !== (data === null)) invalid();
  if (data && data.theme !== requestedTheme) invalid();
  if (data?.serviceEpoch) {
    const admitted = admitOperationalSourceOwners({
      ownerRefs: data.sourceOwners,
      provenance: base.provenance ?? [],
      sourceHealth: base.sourceHealth ?? [],
      decidedAt: base.decidedAt,
      serverTime: base.serverTime,
      claimedReceipts: data.sourceOwners,
    });
    if (!admitted) invalid();
  }
  return freeze({ ...base, cacheState, data });
}

function parseMapOverlayData(value: unknown): NonNullable<MapOverlayEnvelopeDto['data']> {
  const row = strictRecord(value, ['theme', 'serviceEpoch', 'segments', 'sourceOwners']);
  const segments = boundedArray(row.segments, 50_000).map((candidate): MapOverlaySegmentDto => {
    const segment = strictRecord(candidate, ['id', 'routeIds', 'state', 'alertIds']);
    return {
      id: identity(segment.id), routeIds: identities(segment.routeIds, 32),
      state: enumeration(segment.state, ['normal', 'affected', 'unavailable'] as const),
      alertIds: identities(segment.alertIds, 256),
    };
  });
  assertUnique(segments.map(({ id }) => id));
  const sourceOwners = boundedArray(row.sourceOwners, 16).map((candidate): MapOverlaySourceOwnerDto => {
    const owner = strictRecord(candidate, [
      'source', 'sourceId', 'observedAt', 'retrievedAt', 'lastAcceptedAt', 'assessedAt',
    ]);
    return {
      source: enumeration(owner.source, ['supplemented-gtfs', 'gtfs-rt', 'alerts'] as const),
      sourceId: identity(owner.sourceId),
      observedAt: iso(owner.observedAt),
      retrievedAt: iso(owner.retrievedAt),
      lastAcceptedAt: iso(owner.lastAcceptedAt),
      assessedAt: iso(owner.assessedAt),
    };
  });
  assertUnique(sourceOwners.map(({ source, sourceId }) => `${source}\u0000${sourceId}`));
  const serviceEpoch = row.serviceEpoch === null ? null : identity(row.serviceEpoch);
  if (serviceEpoch !== null && !isCanonicalOperationalServiceEpoch(serviceEpoch)) invalid();
  if (serviceEpoch === null && (segments.length !== 0 || sourceOwners.length !== 0)) invalid();
  if (serviceEpoch !== null && sourceOwners.length === 0) invalid();
  return {
    theme: parseMapTheme(row.theme), serviceEpoch, segments, sourceOwners,
  };
}

function parseJourney(value: unknown, request: JourneyRequestDto): JourneyEnvelopeDto {
  const root = dynamicRoot(value, ['data']);
  const base = dynamicBase(root);
  const data = root.data === null ? null : parseJourneyDecision(root.data, request, base);
  if ((base.runtime.availability === 'locked') !== (data === null)) invalid();
  return freeze({ ...base, data });
}

function parseJourneyDecision(value: unknown, request: JourneyRequestDto, response: DynamicEnvelopeBase): JourneyDecisionDto {
  const candidate = record(value);
  const kind = enumeration(candidate.kind, ['planned', 'untimed', 'no-path', 'unavailable'] as const);
  if (kind === 'planned' || kind === 'untimed') {
    const row = strictRecord(value, ['kind', 'scope', 'itineraries'], ['label']);
    const scope = parseJourneyScope(row.scope, request);
    const itineraries = boundedArray(row.itineraries, 8).map((itinerary) => parseJourneyItinerary(itinerary, scope, response));
    if (itineraries.length === 0) invalid();
    assertUnique(itineraries.map(({ id }) => id));
    if (kind === 'planned') {
      if (request.mode === 'offline-reference' ? row.label !== 'Reference itinerary' : row.label !== undefined) invalid();
      return { kind, ...(row.label === undefined ? {} : { label: 'Reference itinerary' }), scope, itineraries };
    }
    if (row.label !== 'Untimed structural route' || itineraries.some(({ timing }) => timing !== 'untimed')) invalid();
    return { kind, label: 'Untimed structural route', scope, itineraries };
  }
  const row = strictRecord(value, ['kind', 'reason', 'scope']);
  const scope = parseJourneyScope(row.scope, request);
  if (kind === 'no-path') {
    if (row.reason !== 'no-service-path') invalid();
    return { kind, reason: 'no-service-path', scope };
  }
  return {
    kind, reason: enumeration(row.reason, ['no-verified-accessible-path', 'incomparable-evidence', 'search-limit-reached'] as const), scope,
  };
}

function parseJourneyScope(value: unknown, request: JourneyRequestDto): JourneyScopeDto {
  const row = strictRecord(value, ['mode', 'originStationId', 'destinationStationId', 'accessibleRouteOnly'], ['serviceDate']);
  const scope: JourneyScopeDto = {
    mode: enumeration(row.mode, ['online-current', 'online-future', 'offline-reference'] as const),
    originStationId: identity(row.originStationId), destinationStationId: identity(row.destinationStationId),
    accessibleRouteOnly: bool(row.accessibleRouteOnly),
    ...(row.serviceDate === undefined ? {} : { serviceDate: parseServiceDate(row.serviceDate) }),
  };
  if (scope.mode !== request.mode || scope.originStationId !== request.originStationId
    || scope.destinationStationId !== request.destinationStationId || scope.accessibleRouteOnly !== request.accessibleRouteOnly
    || scope.serviceDate !== request.serviceDate) invalid();
  return scope;
}

function parseJourneyItinerary(value: unknown, scope: JourneyScopeDto, response: DynamicEnvelopeBase): JourneyItineraryDto {
  const row = strictRecord(value, [
    'id', 'legs', 'transferIds', 'transferInstructions', 'transfers', 'validity', 'accessibility', 'risk', 'timing',
  ], ['practicalWalkRange', 'arrivalSeconds', 'capture']);
  const legs = boundedArray(row.legs, 8).map(parseJourneyLeg);
  if (legs.length === 0 || legs[0].fromStationId !== scope.originStationId || legs.at(-1)!.toStationId !== scope.destinationStationId) invalid();
  for (let index = 1; index < legs.length; index += 1) {
    if (legs[index - 1].toStationId !== legs[index].fromStationId) invalid();
  }
  if (!Number.isSafeInteger(row.transfers) || Number(row.transfers) < 0 || Number(row.transfers) > 4) invalid();
  const transfers = Number(row.transfers);
  const transferIds = identities(row.transferIds, 4);
  const transferInstructions = boundedArray(row.transferInstructions, 4).map(parseJourneyTransferInstruction);
  if (transferIds.length !== transfers || transferInstructions.length !== transfers || transfers !== Math.max(0, legs.length - 1)) invalid();
  for (let index = 0; index < transferInstructions.length; index += 1) {
    const instruction = transferInstructions[index];
    if (instruction.transferId !== transferIds[index] || instruction.stationId !== legs[index].toStationId
      || instruction.stationId !== legs[index + 1].fromStationId || instruction.fromRouteId !== legs[index].routeId
      || instruction.toRouteId !== legs[index + 1].routeId || instruction.fromDirection !== legs[index].direction
      || instruction.toDirection !== legs[index + 1].direction
      || instruction.fromActualDestination !== legs[index].actualDestination
      || instruction.toActualDestination !== legs[index + 1].actualDestination) invalid();
  }
  const timing = enumeration(row.timing, ['timed', 'untimed'] as const);
  const arrivalSeconds = row.arrivalSeconds === undefined ? undefined : boundedSeconds(row.arrivalSeconds);
  if (timing === 'untimed' && arrivalSeconds !== undefined) invalid();
  const itinerary: JourneyItineraryDto = {
    id: identity(row.id), legs, transferIds, transferInstructions, transfers,
    validity: enumeration(row.validity, ['valid', 'limited'] as const),
    accessibility: enumeration(row.accessibility, ['eligible', 'unknown', 'ineligible'] as const),
    risk: enumeration(row.risk, ['clear', 'affected', 'uncertain', 'blocked'] as const), timing,
    ...(row.practicalWalkRange === undefined ? {} : { practicalWalkRange: walkRange(row.practicalWalkRange) }),
    ...(arrivalSeconds === undefined ? {} : { arrivalSeconds }),
  };
  if (row.capture === undefined) return itinerary;
  try {
    const capture = bindJourneyCapturePackage(row.capture, {
      itinerary,
      scope,
      responseDecidedAt: response.decidedAt,
      responseDisclosure: response.demonstrationLabel,
    });
    return { ...itinerary, capture };
  } catch {
    return invalid();
  }
}

function parseJourneyLeg(value: unknown): JourneyLegDto {
  const row = strictRecord(value, [
    'patternId', 'routeId', 'routeLabel', 'direction', 'actualDestination', 'fromOccurrenceId', 'toOccurrenceId',
    'orderedOccurrenceIds', 'fromStationId', 'toStationId', 'orderedStationIds',
  ]);
  const orderedOccurrenceIds = identities(row.orderedOccurrenceIds, 256);
  const orderedStationIds = identities(row.orderedStationIds, 256);
  const fromOccurrenceId = identity(row.fromOccurrenceId);
  const toOccurrenceId = identity(row.toOccurrenceId);
  const fromStationId = identity(row.fromStationId);
  const toStationId = identity(row.toStationId);
  if (orderedOccurrenceIds.length < 2 || orderedStationIds.length !== orderedOccurrenceIds.length
    || orderedOccurrenceIds[0] !== fromOccurrenceId || orderedOccurrenceIds.at(-1) !== toOccurrenceId
    || orderedStationIds[0] !== fromStationId || orderedStationIds.at(-1) !== toStationId) invalid();
  return {
    patternId: identity(row.patternId), routeId: identity(row.routeId), routeLabel: display(row.routeLabel),
    direction: parseDirection(row.direction), actualDestination: display(row.actualDestination),
    fromOccurrenceId, toOccurrenceId, orderedOccurrenceIds, fromStationId, toStationId, orderedStationIds,
  };
}

function parseJourneyTransferInstruction(value: unknown): JourneyTransferInstructionDto {
  const row = strictRecord(value, [
    'transferId', 'stationId', 'fromRouteId', 'fromDirection', 'fromActualDestination',
    'toRouteId', 'toDirection', 'toActualDestination',
  ]);
  return {
    transferId: identity(row.transferId), stationId: identity(row.stationId),
    fromRouteId: identity(row.fromRouteId), fromDirection: parseDirection(row.fromDirection),
    fromActualDestination: display(row.fromActualDestination), toRouteId: identity(row.toRouteId),
    toDirection: parseDirection(row.toDirection), toActualDestination: display(row.toActualDestination),
  };
}

function parseCatalogComplex(value: unknown): CatalogComplexDto {
  const row = strictRecord(value, ['id', 'name', 'routeIds', 'constituents']);
  return {
    id: identity(row.id), name: display(row.name), routeIds: identities(row.routeIds, 32),
    constituents: boundedArray(row.constituents, 128).map((candidate) => {
      const constituent = strictRecord(candidate, ['id', 'name', 'directionalStopIds']);
      return {
        id: identity(constituent.id), name: display(constituent.name),
        directionalStopIds: identities(constituent.directionalStopIds, 256),
      };
    }),
  };
}

function parseNearby(value: unknown): NearbyEnvelopeDto {
  const root = dynamicRoot(value, ['data'], ['practicalWalkEvidence']);
  const base = dynamicBase(root);
  const data = root.data === null ? null : parseNearbyDecision(root.data);
  if ((base.runtime.availability === 'locked') !== (data === null)) invalid();
  return freeze({
    ...base,
    ...(root.practicalWalkEvidence === undefined ? {} : { practicalWalkEvidence: parseWalkEvidence(root.practicalWalkEvidence) }),
    data,
  });
}

function parseNearbyDecision(value: unknown): NearbyDecisionDto {
  const candidate = record(value);
  if (candidate.kind === 'ranked') {
    const row = strictRecord(value, ['kind', 'cards', 'picker']);
    const cards = boundedArray(row.cards, 3).map(parseNearbyCard);
    const picker = parsePicker(row.picker);
    return { kind: 'ranked', cards, picker: { ...picker, required: bool(picker.required) } };
  }
  const row = strictRecord(value, ['kind', 'reason', 'cards', 'picker']);
  if (row.kind !== 'picker' || !['walk-unavailable', 'walk-incomparable', 'no-confirmed-entrance', 'no-current-service'].includes(String(row.reason))) invalid();
  if (boundedArray(row.cards, 0).length !== 0) invalid();
  const picker = parsePicker(row.picker);
  if (picker.required !== true) invalid();
  return { kind: 'picker', reason: row.reason as NearbyDecisionDto & never, cards: [], picker: { ...picker, required: true } } as NearbyDecisionDto;
}

function parseNearbyCard(value: unknown): NearbyStationCardDto {
  const row = strictRecord(value, ['complexId', 'complexName', 'rankingRange', 'directions', 'stationDetailAvailable'], ['walkComparison']);
  if (row.stationDetailAvailable !== true) invalid();
  if (row.walkComparison !== undefined && row.walkComparison !== 'About the same walk.') invalid();
  return {
    complexId: identity(row.complexId), complexName: display(row.complexName), rankingRange: walkRange(row.rankingRange),
    directions: boundedArray(row.directions, 32).map(parseNearbyDirection),
    ...(row.walkComparison === undefined ? {} : { walkComparison: row.walkComparison }), stationDetailAvailable: true,
  };
}

function parseNearbyDirection(value: unknown): NearbyDirectionDto {
  const row = strictRecord(value, [
    'constituentId', 'constituentPublicName', 'directionalStopId', 'direction', 'actualDestination',
    'routeIds', 'arrivalState', 'selectedEntrance',
  ]);
  if (!['available', 'limited', 'unavailable'].includes(String(row.arrivalState))) invalid();
  return {
    constituentId: identity(row.constituentId), constituentPublicName: display(row.constituentPublicName),
    directionalStopId: identity(row.directionalStopId), direction: parseDirection(row.direction),
    actualDestination: display(row.actualDestination), routeIds: identities(row.routeIds, 32),
    arrivalState: row.arrivalState as NearbyDirectionDto['arrivalState'], selectedEntrance: parseEntrance(row.selectedEntrance),
  };
}

function parseEntrance(value: unknown): SelectedEntranceDto {
  const row = strictRecord(value, ['id', 'publicDescription', 'walkRange'], ['nearestLabel', 'walkComparison']);
  if (row.nearestLabel !== undefined && row.nearestLabel !== 'One of the closest confirmed entrances.') invalid();
  if (row.walkComparison !== undefined && row.walkComparison !== 'About the same walk.') invalid();
  return {
    id: identity(row.id), publicDescription: display(row.publicDescription), walkRange: walkRange(row.walkRange),
    ...(row.nearestLabel === undefined ? {} : { nearestLabel: row.nearestLabel }),
    ...(row.walkComparison === undefined ? {} : { walkComparison: row.walkComparison }),
  };
}

function parsePicker(value: unknown) {
  const row = strictRecord(value, ['required', 'bottomAnchored', 'options']);
  if (typeof row.required !== 'boolean' || row.bottomAnchored !== true) invalid();
  return {
    required: row.required, bottomAnchored: true as const,
    options: boundedArray(row.options, 10_000).map(parsePickerOption),
  };
}

function parsePickerOption(value: unknown): NearbyPickerOptionDto {
  const row = record(value);
  if (row.entranceAvailability === 'confirmed') {
    const exact = strictRecord(value, ['complexId', 'complexName', 'entranceAvailability', 'stationDetailAvailable']);
    if (exact.stationDetailAvailable !== true) invalid();
    return { complexId: identity(exact.complexId), complexName: display(exact.complexName), entranceAvailability: 'confirmed', stationDetailAvailable: true };
  }
  const exact = strictRecord(value, ['complexId', 'complexName', 'entranceAvailability', 'message', 'arrivalState', 'stationDetailAvailable']);
  if (exact.entranceAvailability !== 'unconfirmed' || exact.message !== 'Entrance availability not confirmed'
    || exact.arrivalState !== 'unavailable' || exact.stationDetailAvailable !== true) invalid();
  return {
    complexId: identity(exact.complexId), complexName: display(exact.complexName), entranceAvailability: 'unconfirmed',
    message: 'Entrance availability not confirmed', arrivalState: 'unavailable', stationDetailAvailable: true,
  };
}

function parseBoard(
  value: unknown,
  request: { readonly stationId: string; readonly routeIds: readonly string[]; readonly direction?: Direction },
  receivedAtMonotonicMs: number,
  cacheState: TransportCacheState,
): BoardEnvelopeDto {
  const root = dynamicRoot(value, ['data']);
  const base = dynamicBase(root);
  const data = root.data === null ? null : parseBoardData(root.data);
  if ((base.runtime.availability === 'locked') !== (data === null)) invalid();
  assertBoardClockBoundary(data, base.serverTime);
  if (data?.station && data.station.id !== request.stationId) invalid();
  if (request.direction && data?.directions.some(({ direction }) => direction !== request.direction)) invalid();
  if (request.routeIds.length > 0 && data?.directions.some(({ primary, secondary }) =>
    [...primary, ...secondary].some(({ route }) => !request.routeIds.includes(route.id)))) invalid();
  return freeze({ ...base, cacheState, data, receivedAtMonotonicMs });
}

function parseBoardData(value: unknown): BoardDataDto {
  const row = strictRecord(value, ['station', 'mode', 'directions', 'alerts', 'explanations', 'sourceHealth', 'provenance', 'capabilities']);
  if (!['live', 'scheduled-fallback', 'demonstration', 'unavailable'].includes(String(row.mode))) invalid();
  const station = row.station === null ? null : parseStation(row.station);
  if (station === null && row.mode !== 'unavailable') invalid();
  return {
    station, mode: row.mode as BoardDataDto['mode'], directions: boundedArray(row.directions, 16).map(parseBoardDirection),
    alerts: boundedArray(row.alerts, 256).map(parseAlert), explanations: boundedArray(row.explanations, 256).map(parseExplanation),
    sourceHealth: boundedArray(row.sourceHealth, 128).map(parseSourceHealth),
    provenance: boundedArray(row.provenance, 128).map(parseProvenance), capabilities: parseCapabilities(row.capabilities),
  };
}

function parseStation(value: unknown) {
  const row = strictRecord(value, ['id', 'name', 'complexId', 'routeIds']);
  return { id: identity(row.id), name: display(row.name), complexId: identity(row.complexId), routeIds: identities(row.routeIds, 32) };
}

function parseBoardDirection(value: unknown): BoardDirectionDto {
  const row = strictRecord(value, ['direction', 'primary', 'secondary', 'explanations']);
  const direction = parseDirection(row.direction);
  const primary = boundedArray(row.primary, 3).map(parsePrimaryArrival);
  const secondary = boundedArray(row.secondary, 64).map(parseSecondaryArrival);
  if ([...primary, ...secondary].some((arrival) => arrival.direction !== direction)) invalid();
  return {
    direction, primary, secondary,
    explanations: boundedArray(row.explanations, 128).map(parseExplanation),
  };
}

function assertBoardClockBoundary(data: BoardDataDto | null, serverTime: string): void {
  if (data === null) return;
  const boundaries = data.directions.flatMap(({ primary, secondary }) =>
    [...primary, ...secondary].map(({ validThrough }) => validThrough));
  if (boundaries.length === 0) return;
  if (new Set(boundaries).size !== 1 || Date.parse(boundaries[0]) < Date.parse(serverTime)) invalid();
}

function parsePrimaryArrival(value: unknown): PrimaryArrivalDto {
  const kind = record(value).kind;
  if (kind === 'live') return parseLive(value);
  if (kind === 'expected') return parseExpected(value);
  if (kind === 'scheduled') return parseScheduled(value);
  invalid();
}

function parseSecondaryArrival(value: unknown): SecondaryArrivalDto {
  const kind = record(value).kind;
  if (kind === 'holding') return parseHolding(value);
  if (kind === 'uncertain') return parseUncertain(value);
  invalid();
}

function arrivalBase(row: Record<string, unknown>): ArrivalBaseDto {
  if (row.demonstrationLabel !== DEMONSTRATION_LABEL) invalid();
  return {
    id: identity(row.id), route: parseRoute(row.route), direction: parseDirection(row.direction),
    destination: display(row.destination), validThrough: iso(row.validThrough), demonstrationLabel: DEMONSTRATION_LABEL,
    provenance: parseProvenance(row.provenance),
  };
}

function parseLive(value: unknown): LiveArrivalDto {
  const row = strictRecord(value, arrivalKeys(['at']));
  if (row.kind !== 'live' || row.displayAuthority !== 'countdown') invalid();
  return { ...arrivalBase(row), kind: 'live', displayAuthority: 'countdown', at: iso(row.at) };
}

function parseExpected(value: unknown): ExpectedArrivalDto {
  const row = strictRecord(value, arrivalKeys(['estimateAt', 'range']));
  if (row.kind !== 'expected' || row.displayAuthority !== 'range') invalid();
  const range = strictRecord(row.range, ['startsAt', 'endsAt']);
  const startsAt = iso(range.startsAt); const endsAt = iso(range.endsAt);
  if (Date.parse(endsAt) < Date.parse(startsAt)) invalid();
  return { ...arrivalBase(row), kind: 'expected', displayAuthority: 'range', estimateAt: iso(row.estimateAt), range: { startsAt, endsAt } };
}

function parseScheduled(value: unknown): ScheduledArrivalDto {
  const row = strictRecord(value, arrivalKeys(['at', 'serviceDate']));
  if (row.kind !== 'scheduled' || row.displayAuthority !== 'clock-time' || typeof row.serviceDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.serviceDate)) invalid();
  return { ...arrivalBase(row), kind: 'scheduled', displayAuthority: 'clock-time', at: iso(row.at), serviceDate: row.serviceDate };
}

function parseHolding(value: unknown): HoldingArrivalDto {
  const row = strictRecord(value, arrivalKeys(['lastSupportedAt']));
  if (row.kind !== 'holding' || row.displayAuthority !== 'status-only') invalid();
  return { ...arrivalBase(row), kind: 'holding', displayAuthority: 'status-only', lastSupportedAt: iso(row.lastSupportedAt) };
}

function parseUncertain(value: unknown): UncertainArrivalDto {
  const row = strictRecord(value, arrivalKeys(['reason']));
  if (row.kind !== 'uncertain' || row.displayAuthority !== 'status-only') invalid();
  return { ...arrivalBase(row), kind: 'uncertain', displayAuthority: 'status-only', reason: display(row.reason, 2_048) };
}

function arrivalKeys(extra: readonly string[]): string[] {
  return ['id', 'kind', 'route', 'direction', 'destination', 'validThrough', 'demonstrationLabel', 'displayAuthority', 'provenance', ...extra];
}

function parseAlert(value: unknown): AlertDto {
  const row = strictRecord(value, ['id', 'text', 'activeFrom', 'routeIds', 'stationIds', 'directions', 'demonstrationLabel', 'provenance'], ['activeUntil']);
  if (row.demonstrationLabel !== DEMONSTRATION_LABEL) invalid();
  return {
    id: identity(row.id), text: display(row.text, 2_048), activeFrom: iso(row.activeFrom),
    ...(row.activeUntil === undefined ? {} : { activeUntil: iso(row.activeUntil) }), routeIds: identities(row.routeIds, 32),
    stationIds: identities(row.stationIds, 256), directions: boundedArray(row.directions, 7).map(parseDirection),
    demonstrationLabel: DEMONSTRATION_LABEL, provenance: parseProvenance(row.provenance),
  };
}

function parseExplanation(value: unknown): ExplanationDto {
  const row = strictRecord(value, ['code', 'message'], ['provenance']);
  return {
    code: identity(row.code), message: display(row.message, 2_048),
    ...(row.provenance === undefined ? {} : { provenance: parseProvenance(row.provenance) }),
  };
}

function parseCapabilities(value: unknown): BoardDataDto['capabilities'] {
  const row = strictRecord(value, ['arrivals', 'accessibility', 'guidance', 'commute']);
  const capability = (candidate: unknown) => enumeration(candidate, ['locked', 'available', 'unavailable'] as const);
  return { arrivals: capability(row.arrivals), accessibility: capability(row.accessibility), guidance: capability(row.guidance), commute: capability(row.commute) };
}

function parseRoute(value: unknown): RouteDto {
  const row = strictRecord(value, ['id', 'label']);
  return { id: identity(row.id), label: display(row.label) };
}

function dynamicRoot(value: unknown, requiredTail: readonly string[], optionalTail: readonly string[] = []) {
  return strictRecord(value, [
    'apiVersion', 'schemaVersion', 'responseIdentity', 'decidedAt', 'serverTime', 'runtime', 'gates', ...requiredTail,
  ], ['gateDecision', 'sourceHealth', 'provenance', 'decisionSnapshotIdentity', 'demonstrationLabel', ...optionalTail]);
}

function dynamicBase(root: Record<string, unknown>): DynamicEnvelopeBase {
  apiHeader(root);
  return {
    apiVersion: API_VERSION, schemaVersion: SCHEMA_VERSION, responseIdentity: identity(root.responseIdentity),
    decidedAt: iso(root.decidedAt), serverTime: iso(root.serverTime), runtime: parseRuntime(root.runtime),
    gates: parseGates(root.gates),
    ...(root.gateDecision === undefined ? {} : { gateDecision: parseGate(root.gateDecision) }),
    ...(root.sourceHealth === undefined ? {} : { sourceHealth: boundedArray(root.sourceHealth, 128).map(parseSourceHealth) }),
    ...(root.provenance === undefined ? {} : { provenance: boundedArray(root.provenance, 128).map(parseProvenance) }),
    ...(root.decisionSnapshotIdentity === undefined ? {} : { decisionSnapshotIdentity: identity(root.decisionSnapshotIdentity) }),
    ...(root.demonstrationLabel === undefined ? {} : { demonstrationLabel: demonstration(root.demonstrationLabel) }),
  };
}

function parseRuntime(value: unknown): RuntimeDto {
  const row = strictRecord(value, ['mode', 'surface', 'availability']);
  return {
    mode: enumeration(row.mode, ['live', 'shadow', 'validation'] as const),
    surface: enumeration(row.surface, ['public', 'demonstration'] as const),
    availability: enumeration(row.availability, ['available', 'locked', 'unavailable'] as const),
  };
}

function parseGates(value: unknown): Readonly<Record<string, GateDecisionDto>> {
  const row = record(value);
  const result: Record<string, GateDecisionDto> = {};
  if (Object.keys(row).length > 32) invalid();
  for (const [key, candidate] of Object.entries(row)) result[identity(key)] = parseGate(candidate);
  return result;
}

function parseGate(value: unknown): GateDecisionDto {
  const row = strictRecord(value, ['exposed', 'reasonCode', 'decision']);
  if (row.exposed !== false) invalid();
  return { exposed: false, reasonCode: identity(row.reasonCode), decision: display(row.decision, 512) };
}

function parseProvenance(value: unknown): ProvenanceDto {
  const row = strictRecord(value, ['source', 'sourceId', 'observedAt', 'retrievedAt']);
  return {
    source: enumeration(row.source, ['regular-gtfs', 'supplemented-gtfs', 'gtfs-rt', 'alerts', 'entrances', 'equipment', 'practical-walk', 'unavailable'] as const),
    sourceId: identity(row.sourceId), observedAt: iso(row.observedAt), retrievedAt: iso(row.retrievedAt),
  };
}

function parseSourceHealth(value: unknown): SourceHealthDto {
  const row = strictRecord(value, ['source', 'sourceId', 'state', 'assessedAt', 'reasonCode'], ['lastAcceptedAt']);
  return {
    source: enumeration(row.source, ['regular-gtfs', 'supplemented-gtfs', 'gtfs-rt', 'alerts', 'entrances', 'equipment', 'practical-walk', 'unavailable'] as const),
    sourceId: identity(row.sourceId), state: enumeration(row.state, ['current', 'degraded', 'unavailable', 'quarantined'] as const),
    assessedAt: iso(row.assessedAt), ...(row.lastAcceptedAt === undefined ? {} : { lastAcceptedAt: iso(row.lastAcceptedAt) }),
    reasonCode: enumeration(row.reasonCode, ['SOURCE_CURRENT', 'SOURCE_DEGRADED', 'SOURCE_UNAVAILABLE', 'SOURCE_QUARANTINED'] as const),
  };
}

function parseWalkEvidence(value: unknown): unknown {
  const row = record(value);
  if (row.kind === 'unavailable') {
    const exact = strictRecord(value, ['kind', 'reason']);
    return { kind: 'unavailable', reason: identity(exact.reason) };
  }
  const exact = strictRecord(value, ['kind', 'source', 'sourceId', 'coverage']);
  if (exact.kind !== 'available' || exact.source !== 'practical-walk' || exact.sourceId !== 'audited-practical-walk') invalid();
  const coverage = record(exact.coverage);
  if (coverage.kind === 'complete-universe') strictRecord(exact.coverage, ['kind']);
  else strictRecord(exact.coverage, ['kind', 'consideredDestinationIds', 'excludedDestinationIds', 'thirdCardMaximumSeconds', 'excludedMinimumSeconds']);
  return structuredClone(exact);
}

function captureLocationFix(value: LocationFixDto): LocationFixDto {
  if (!value || typeof value !== 'object') invalid();
  const { latitude, longitude } = value.coordinate ?? {};
  if (![latitude, longitude, value.accuracyMeters].every((candidate) => typeof candidate === 'number' && Number.isFinite(candidate))) invalid();
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || value.accuracyMeters <= 0) invalid();
  return { coordinate: { latitude, longitude }, accuracyMeters: value.accuracyMeters };
}

function captureJourneyRequest(value: JourneyRequestDto): JourneyRequestDto {
  const row = strictRecord(value, ['mode', 'originStationId', 'destinationStationId', 'accessibleRouteOnly'], [
    'requiredFirstDirection', 'requiredActualDestination', 'serviceDate',
  ]);
  const mode = enumeration(row.mode, ['online-current', 'online-future', 'offline-reference'] as const);
  if (typeof row.accessibleRouteOnly !== 'boolean') invalid();
  if (mode === 'online-future' && row.serviceDate === undefined) invalid();
  const result: JourneyRequestDto = {
    mode, originStationId: encodeIdentity(row.originStationId), destinationStationId: encodeIdentity(row.destinationStationId),
    accessibleRouteOnly: row.accessibleRouteOnly,
    ...(row.requiredFirstDirection === undefined ? {} : { requiredFirstDirection: parseDirection(row.requiredFirstDirection) }),
    ...(row.requiredActualDestination === undefined ? {} : { requiredActualDestination: display(row.requiredActualDestination) }),
    ...(row.serviceDate === undefined ? {} : { serviceDate: parseServiceDate(row.serviceDate) }),
  };
  if (result.originStationId === result.destinationStationId) invalid();
  return result;
}

function searchQuery(value: unknown): string {
  if (typeof value !== 'string') invalid();
  const normalized = value.normalize('NFC').trim();
  if ([...normalized].length < 1 || [...normalized].length > 100
    || new TextEncoder().encode(normalized).byteLength > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) invalid();
  return normalized;
}

function parseMapTheme(value: unknown): MapThemeDto {
  return enumeration(value, ['day', 'night'] as const);
}

function parseServiceDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) invalid();
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) invalid();
  return value;
}

function boundedSeconds(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 86_400) invalid();
  return Number(value);
}

function walkRange(value: unknown): WalkRangeDto {
  const row = strictRecord(value, ['minimumSeconds', 'maximumSeconds']);
  if (!Number.isSafeInteger(row.minimumSeconds) || !Number.isSafeInteger(row.maximumSeconds)
    || Number(row.minimumSeconds) < 0 || Number(row.maximumSeconds) > 86_400 || Number(row.maximumSeconds) < Number(row.minimumSeconds)) invalid();
  return { minimumSeconds: Number(row.minimumSeconds), maximumSeconds: Number(row.maximumSeconds) };
}

function parseDirection(value: unknown): Direction {
  return enumeration(value, ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'] as const);
}

function encodeIdentifier(value: string): string {
  return encodeURIComponent(encodeIdentity(value));
}

function encodeIdentity(value: unknown): string {
  const parsed = identity(value);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(parsed) || parsed.includes('..')) invalid();
  return parsed;
}

function identities(value: unknown, maximum: number): readonly string[] {
  const result = boundedArray(value, maximum).map(identity);
  assertUnique(result);
  return result;
}

function assertUnique(values: readonly string[]): void {
  if (new Set(values).size !== values.length) invalid();
}

function identity(value: unknown): string {
  if (typeof value !== 'string') invalid();
  const normalized = value.normalize('NFC');
  if (normalized.length === 0 || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) invalid();
  return normalized;
}

function display(value: unknown, maximum = 256): string {
  if (typeof value !== 'string') invalid();
  const normalized = value.normalize('NFC').trim();
  if (!normalized || [...normalized].length > maximum || /[\u0000-\u001f\u007f]/u.test(normalized)) invalid();
  return normalized;
}

function iso(value: unknown): string {
  if (typeof value !== 'string') invalid();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) invalid();
  return value;
}

function demonstration(value: unknown): typeof DEMONSTRATION_LABEL {
  if (value !== DEMONSTRATION_LABEL) invalid();
  return DEMONSTRATION_LABEL;
}

function apiHeader(row: Record<string, unknown>): void {
  if (row.apiVersion !== API_VERSION || row.schemaVersion !== SCHEMA_VERSION) invalid();
}

function boundedArray(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) invalid();
  return value;
}

function strictRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  const row = record(value);
  const keys = Object.keys(row);
  const allowed = [...required, ...optional];
  if (required.some((key) => !Object.hasOwn(row, key)) || keys.some((key) => !allowed.includes(key))) invalid();
  return row;
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) invalid();
  return value as Record<string, unknown>;
}

function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') invalid();
  return value;
}

function enumeration<const T extends readonly string[]>(value: unknown, choices: T): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) invalid();
  return value as T[number];
}

function invalid(): never {
  throw new TransitApiError();
}

function monotonicNow(): number {
  const value = performance.now();
  if (!Number.isFinite(value) || value < 0) invalid();
  return value;
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
}
