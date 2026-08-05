import type { Direction } from '../../shared/domain/types';

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
  readonly demonstrationLabel?: typeof DEMONSTRATION_LABEL;
}

export interface BootstrapDataDto {
  readonly productName: 'NYC Subway Tracker';
  readonly unofficial: true;
  readonly contentVersions: {
    readonly stationCatalog: string;
    readonly maps: { readonly day: string; readonly night: string };
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
  readonly data: BoardDataDto | null;
  /** Local monotonic receipt evidence; never sourced from or sent to the server. */
  readonly receivedAtMonotonicMs?: number;
}

export interface TransitApiClient {
  bootstrap(signal?: AbortSignal): Promise<BootstrapEnvelopeDto>;
  catalog(contentVersion: string, signal?: AbortSignal): Promise<CatalogEnvelopeDto>;
  nearby(fix: LocationFixDto, accessibleRouteOnly: boolean, signal?: AbortSignal): Promise<NearbyEnvelopeDto>;
  board(
    stationId: string,
    filters?: { readonly routeIds?: readonly string[]; readonly direction?: Direction },
    signal?: AbortSignal,
  ): Promise<BoardEnvelopeDto>;
}

export class TransitApiError extends Error {
  constructor() {
    super(GENERIC_ERROR);
    this.name = 'TransitApiError';
  }
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createTransitApiClient(fetcher: Fetcher = globalThis.fetch.bind(globalThis)): TransitApiClient {
  const get = (url: string, signal?: AbortSignal) => requestJson(fetcher, url, { signal });
  return Object.freeze({
    async bootstrap(signal?: AbortSignal) {
      return parseBootstrap(await get('/api/v1/bootstrap', signal));
    },
    async catalog(contentVersion: string, signal?: AbortSignal) {
      return parseCatalog(await get(`/api/v1/stations/catalog/${encodeIdentifier(contentVersion)}`, signal));
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
      return parseNearby(value);
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
      const raw = await get(`/api/v1/stations/${encodeURIComponent(capturedStationId)}/board${query}`, signal);
      const receivedAtMonotonicMs = monotonicNow();
      return parseBoard(
        raw,
        { stationId: capturedStationId, routeIds: capturedRouteIds, ...(capturedDirection ? { direction: capturedDirection } : {}) },
        receivedAtMonotonicMs,
      );
    },
  });
}

async function requestJson(fetcher: Fetcher, url: string, init: RequestInit): Promise<unknown> {
  try {
    const response = await fetcher(url, init);
    if (!response.ok || !response.headers.get('content-type')?.toLocaleLowerCase('en-US').startsWith('application/json')) {
      throw new TransitApiError();
    }
    return await response.json();
  } catch (error) {
    if (isAbort(error)) throw error;
    if (error instanceof TransitApiError) throw error;
    throw new TransitApiError();
  }
}

function parseBootstrap(value: unknown): BootstrapEnvelopeDto {
  const root = dynamicRoot(value, ['data']);
  const data = strictRecord(root.data, ['productName', 'unofficial', 'contentVersions']);
  if (data.productName !== 'NYC Subway Tracker' || data.unofficial !== true) invalid();
  const versions = strictRecord(data.contentVersions, ['stationCatalog', 'maps']);
  const maps = strictRecord(versions.maps, ['day', 'night']);
  return freeze({
    ...dynamicBase(root),
    data: {
      productName: 'NYC Subway Tracker', unofficial: true,
      contentVersions: { stationCatalog: identity(versions.stationCatalog), maps: { day: identity(maps.day), night: identity(maps.night) } },
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
): BoardEnvelopeDto {
  const root = dynamicRoot(value, ['data']);
  const base = dynamicBase(root);
  const data = root.data === null ? null : parseBoardData(root.data);
  if ((base.runtime.availability === 'locked') !== (data === null)) invalid();
  if (data?.station && data.station.id !== request.stationId) invalid();
  if (request.direction && data?.directions.some(({ direction }) => direction !== request.direction)) invalid();
  if (request.routeIds.length > 0 && data?.directions.some(({ primary, secondary }) =>
    [...primary, ...secondary].some(({ route }) => !request.routeIds.includes(route.id)))) invalid();
  return freeze({ ...base, data, receivedAtMonotonicMs });
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
  return {
    direction: parseDirection(row.direction), primary: boundedArray(row.primary, 3).map(parsePrimaryArrival),
    secondary: boundedArray(row.secondary, 64).map(parseSecondaryArrival),
    explanations: boundedArray(row.explanations, 128).map(parseExplanation),
  };
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
  ], ['gateDecision', 'sourceHealth', 'provenance', 'demonstrationLabel', ...optionalTail]);
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
