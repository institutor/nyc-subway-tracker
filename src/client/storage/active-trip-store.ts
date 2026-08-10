import { encodeCanonicalStringTuple, normalizeBoundedIdentity, normalizeCanonicalIdentity } from '../../shared/domain/canonical';
import { parseServiceDate } from '../../shared/domain/clock';
import type { Direction } from '../../shared/domain/types';
import { JOURNEY_CAPTURE_DISCLOSURE } from '../../shared/domain/journey-capture';
import { VALIDATION_RIDER_EVIDENCE_MANIFEST } from '../../shared/validation/rider-evidence';
import type { BrowserStorage } from './browser-store';

export const ACTIVE_TRIP_STORE_KEY = 'nyc-subway-tracker:active-trip:v3';
export const LEGACY_ACTIVE_TRIP_STORE_KEY = 'nyc-subway-tracker:active-trip:v2';

const MAX_BYTES = 512 * 1_024;
const MAX_LEGS = 16;
const MAX_POINTS = 512;
const MAX_CLAIMS = 128;
const MAX_STEPS = 64;

export interface ActiveTripPlace {
  readonly name: string;
  readonly complexId: string;
  readonly constituentId: string;
  readonly entranceId?: string;
}

export interface ActiveTripRoute {
  readonly id: string;
  readonly label: string;
  readonly spokenIdentity: string;
  readonly shape: 'circle' | 'diamond';
}

export interface ActiveTripPoint {
  readonly id: string;
  readonly kind: 'stop' | 'decision';
  readonly stationName: string;
  readonly complexId: string;
  readonly constituentId: string;
  readonly instruction: string;
}

export interface ActiveTripLeg {
  readonly id: string;
  readonly route: ActiveTripRoute;
  readonly boundDirection: Direction;
  readonly actualDestination: string;
  readonly points: readonly ActiveTripPoint[];
}

export interface ActiveTripTransfer {
  readonly id: string;
  readonly atPointId: string;
  readonly incomingLegId: string;
  readonly outgoingLegId: string;
  readonly incomingDirection: Direction;
  readonly incomingDestination: string;
  readonly outgoingDirection: Direction;
  readonly outgoingDestination: string;
  readonly steps: readonly string[];
  readonly connectionState?: string;
}

export type ActiveTripClaimScope =
  | { readonly kind: 'trip'; readonly tripId: string }
  | { readonly kind: 'leg'; readonly legId: string; readonly routeId: string; readonly direction: Direction }
  | { readonly kind: 'route'; readonly routeId: string }
  | { readonly kind: 'direction'; readonly routeId: string; readonly direction: Direction }
  | { readonly kind: 'station'; readonly stationId: string; readonly routeId: string; readonly direction: Direction }
  | {
    readonly kind: 'segment';
    readonly fromStationId: string;
    readonly toStationId: string;
    readonly routeId: string;
    readonly direction: Direction;
  };

export interface ActiveTripServiceClaim {
  readonly id: string;
  readonly scope: ActiveTripClaimScope;
  readonly state: 'normal' | 'changed' | 'unresolved' | 'suspended' | 'bypassed' | 'closed' | 'cancelled';
  readonly consequence: string;
  readonly lastCheckedAt: string;
}

export interface ActiveTripEquipmentClaim {
  readonly id: string;
  readonly equipmentId: string;
  readonly connectionId: string;
  readonly pathId: string;
  readonly observation: 'working' | 'out-of-service' | 'unknown';
  readonly lastCheckedAt: string;
}

export interface ActiveTripScheduledDeparture {
  readonly legId: string;
  readonly pointId: string;
  readonly clockTime: string;
  readonly evidence: 'scheduled';
  readonly timeZone: 'America/New_York';
}

interface ActiveTripTimedSchedule {
  readonly editionId: string;
  readonly anchorKind: 'published' | 'first-retrieved';
  readonly anchorAt: string;
  readonly lastRetrievedAt: string;
  readonly effectiveFrom: string;
  readonly effectiveUntil: string;
  readonly currencyAgeSeconds: number;
  readonly departures: readonly ActiveTripScheduledDeparture[];
}

export type ActiveTripSchedule =
  | ({ readonly kind: 'current' } & ActiveTripTimedSchedule)
  | ({ readonly kind: 'stale' } & ActiveTripTimedSchedule & { readonly staleCopy: 'Stored schedule—service changes may differ' })
  | {
    readonly kind: 'topology-only';
    readonly reason: 'aged' | 'superseded' | 'coverage-mismatch' | 'horizon-exceeded';
    readonly editionId: string;
    readonly anchorKind: 'published' | 'first-retrieved';
    readonly anchorAt: string;
    readonly lastRetrievedAt: string;
    readonly currencyAgeSeconds: number;
  }
  | { readonly kind: 'quarantined'; readonly reason: string }
  | { readonly kind: 'none' };

export interface ActiveTripLimitation {
  readonly id: string;
  readonly scope: ActiveTripClaimScope;
  readonly message: string;
  readonly ownerRecordId: string;
  readonly lastCheckedAt: string;
}

export interface ActiveTripPatternBoundary {
  readonly explanation: string;
  readonly ownerRecordId: string;
  readonly verifiedAt: string;
}

export type ActiveTripCaptureContext =
  | {
    readonly kind: 'response-owned';
    readonly itineraryId: string;
    readonly requestMode: 'online-current' | 'online-future' | 'offline-reference';
    readonly timing: 'timed' | 'untimed';
    readonly disclosure?: typeof JOURNEY_CAPTURE_DISCLOSURE;
    readonly validationEvidenceReceipt?: ActiveTripValidationEvidenceReceipt;
  }
  | { readonly kind: 'legacy-migrated' };

export interface ActiveTripValidity {
  readonly result: 'current-itinerary' | 'future-itinerary' | 'reference-itinerary' | 'untimed-structural-route' | 'untimed-structural-path';
  readonly serviceDate: string;
  readonly pattern: 'actual-now' | 'typical-weekday' | 'late-night' | 'unspecified';
  readonly schedule: ActiveTripSchedule;
  readonly warnings: readonly ActiveTripLimitation[];
  readonly vetoes: readonly ActiveTripLimitation[];
  readonly patternBoundary?: ActiveTripPatternBoundary;
}

export interface ActiveTripExitGuidance {
  readonly ownerRecordId: string;
  readonly exitId: string;
  readonly legId: string;
  readonly purpose: string;
  readonly verificationContext: string;
  readonly verifiedAt: string;
  readonly limitations: readonly string[];
  readonly destinationScope?: {
    readonly stationName: string;
    readonly stationComplexId: string;
    readonly constituentStationId: string;
    readonly platformId: string;
    readonly equipmentId: string;
  };
}

export interface ActiveTripValidationEvidenceReceipt {
  readonly bootstrapDecisionIdentity: string;
  readonly journeyDecisionIdentity: string;
  readonly decisionSnapshotIdentity: string;
  readonly stationCatalogVersion: string;
  readonly journeyGraphVersion: string;
  readonly mapDayVersion: string;
  readonly mapNightVersion: string;
  readonly canonicalItineraryIdentity: string;
  readonly capturePackageIdentity: string;
  readonly pathId: string;
  readonly originStationId: string;
  readonly originPlatformId: string;
  readonly destinationStationId: string;
  readonly destinationPlatformId: string;
  readonly routeId: string;
  readonly direction: Direction;
  readonly actualDestination: string;
}

export interface ActiveTripContingency {
  readonly id: string;
  readonly ownerRecordId: string;
  readonly trigger: string;
  readonly affectedLegId: string;
  readonly routeId: string;
  readonly direction: Direction;
  readonly stopPointIds: readonly string[];
  readonly transferIds: readonly string[];
  readonly actions: readonly string[];
  readonly accessibilityResult: 'not-applicable' | 'complete-structural-path';
  readonly accessiblePathOwnerRecordId?: string;
  readonly verificationContext: string;
  readonly lastCheckedAt: string;
  readonly limitations: readonly string[];
}

export interface ActiveTripRecord {
  readonly id: string;
  readonly capturedAt: string;
  readonly captureContext: ActiveTripCaptureContext;
  readonly origin: ActiveTripPlace;
  readonly destination: ActiveTripPlace;
  readonly accessibleRouteOnly: boolean;
  readonly legs: readonly ActiveTripLeg[];
  readonly transfers: readonly ActiveTripTransfer[];
  readonly serviceClaims: readonly ActiveTripServiceClaim[];
  readonly equipmentClaims: readonly ActiveTripEquipmentClaim[];
  readonly cursor: { readonly pointId: string };
  readonly validity: ActiveTripValidity;
  readonly exitGuidance?: ActiveTripExitGuidance;
  readonly contingencies?: readonly ActiveTripContingency[];
}

interface ActiveTripEnvelopeV3 {
  readonly version: 3;
  readonly trip: ActiveTripRecord | null;
}

type ActiveTripEnvelopeDecode =
  | { readonly kind: 'current'; readonly envelope: ActiveTripEnvelopeV3 }
  | { readonly kind: 'migrated'; readonly envelope: ActiveTripEnvelopeV3 }
  | { readonly kind: 'future'; readonly raw: string }
  | { readonly kind: 'invalid'; readonly raw: string };

export type ActiveTripStoreRead =
  | { readonly kind: 'ready'; readonly migrated: boolean; readonly trip: ActiveTripRecord | null }
  | { readonly kind: 'quarantined'; readonly reason: 'invalid' | 'future'; readonly raw: string };

export type ActiveTripStoreMutation =
  | { readonly kind: 'saved'; readonly trip: ActiveTripRecord | null }
  | {
    readonly kind: 'unavailable';
    readonly reason: 'quarantined' | 'invalid-trip' | 'invalid-cursor' | 'storage-write-failed';
  };

export interface BrowserActiveTripStore {
  read(): ActiveTripStoreRead;
  capture(trip: ActiveTripRecord): ActiveTripStoreMutation;
  setCursor(pointId: string): ActiveTripStoreMutation;
  clear(): ActiveTripStoreMutation;
}

export function createBrowserActiveTripStore(
  storage: BrowserStorage,
  key = ACTIVE_TRIP_STORE_KEY,
): BrowserActiveTripStore {
  const currentRaw = storage.getItem(key);
  const initialRaw = currentRaw ?? (key === ACTIVE_TRIP_STORE_KEY ? storage.getItem(LEGACY_ACTIVE_TRIP_STORE_KEY) : null);
  let decoded: ActiveTripEnvelopeDecode = initialRaw === null
    ? { kind: 'current', envelope: { version: 3, trip: null } }
    : decodeEnvelope(initialRaw);

  const read = (): ActiveTripStoreRead => {
    if (decoded.kind === 'future' || decoded.kind === 'invalid') {
      return deepFreeze({ kind: 'quarantined', reason: decoded.kind, raw: decoded.raw });
    }
    return deepFreeze({
      kind: 'ready',
      migrated: decoded.kind === 'migrated',
      trip: decoded.envelope.trip,
    });
  };

  const commit = (candidate: ActiveTripRecord | null): ActiveTripStoreMutation => {
    if (decoded.kind === 'future' || decoded.kind === 'invalid') {
      return Object.freeze({ kind: 'unavailable', reason: 'quarantined' });
    }
    let accepted: ActiveTripRecord | null;
    let serialized: string;
    try {
      accepted = candidate === null ? null : parseTrip(candidate);
      serialized = encodeEnvelope(accepted);
    } catch {
      return Object.freeze({ kind: 'unavailable', reason: 'invalid-trip' });
    }
    const priorRaw = storage.getItem(key);
    try {
      storage.setItem(key, serialized);
    } catch {
      rollbackUnexpectedMutation(storage, key, priorRaw);
      return Object.freeze({ kind: 'unavailable', reason: 'storage-write-failed' });
    }
    decoded = { kind: 'current', envelope: { version: 3, trip: accepted } };
    return deepFreeze({ kind: 'saved', trip: accepted });
  };

  return Object.freeze({
    read,
    capture: (candidate: ActiveTripRecord) => commit(candidate),
    setCursor: (rawPointId: string) => {
      if (decoded.kind === 'future' || decoded.kind === 'invalid') {
        return Object.freeze({ kind: 'unavailable', reason: 'quarantined' });
      }
      if (decoded.envelope.trip === null) return Object.freeze({ kind: 'unavailable', reason: 'invalid-cursor' });
      let pointId: string;
      try {
        pointId = identity(rawPointId, 'trip cursor point');
      } catch {
        return Object.freeze({ kind: 'unavailable', reason: 'invalid-cursor' });
      }
      if (!decoded.envelope.trip.legs.some((leg) => leg.points.some((point) => point.id === pointId))) {
        return Object.freeze({ kind: 'unavailable', reason: 'invalid-cursor' });
      }
      return commit({ ...decoded.envelope.trip, cursor: { pointId } });
    },
    clear: () => commit(null),
  });
}

function decodeEnvelope(raw: string): ActiveTripEnvelopeDecode {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > MAX_BYTES) {
    return Object.freeze({ kind: 'invalid', raw: String(raw) });
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return Object.freeze({ kind: 'invalid', raw });
  }
  if (!isPlainRecord(value) || !Number.isSafeInteger(value.version)) {
    return Object.freeze({ kind: 'invalid', raw });
  }
  if ((value.version as number) > 3) return Object.freeze({ kind: 'future', raw });
  try {
    if (value.version === 3) {
      const root = strictRecord(value, ['version', 'trip']);
      const migrated = root.trip !== null && hasLegacyAccessibilityClaims(root.trip);
      return deepFreeze({
        kind: migrated ? 'migrated' : 'current',
        envelope: { version: 3, trip: root.trip === null ? null : parseTrip(root.trip) },
      });
    }
    if (value.version === 2) {
      const root = strictRecord(value, ['version', 'trip']);
      return deepFreeze({
        kind: 'migrated',
        envelope: { version: 3, trip: root.trip === null ? null : migrateLegacyTrip(root.trip) },
      });
    }
    if (value.version === 1) {
      const root = strictRecord(value, ['version', 'activeTrip']);
      return deepFreeze({
        kind: 'migrated',
        envelope: { version: 3, trip: root.activeTrip === null ? null : migrateLegacyTrip(root.activeTrip) },
      });
    }
  } catch {
    return Object.freeze({ kind: 'invalid', raw });
  }
  return Object.freeze({ kind: 'invalid', raw });
}

function encodeEnvelope(trip: ActiveTripRecord | null): string {
  const encoded = JSON.stringify({ version: 3, trip });
  if (new TextEncoder().encode(encoded).byteLength > MAX_BYTES) throw new Error('Active trip exceeds storage limit');
  return encoded;
}

function migrateLegacyTrip(value: unknown): ActiveTripRecord {
  if (!isPlainRecord(value) || !isPlainRecord(value.validity)) throw new Error('Invalid legacy active trip');
  const legacy = value as Record<string, unknown>;
  const validity = value.validity as Record<string, unknown>;
  const serviceClaims = Array.isArray(legacy.serviceClaims)
    ? legacy.serviceClaims.filter((claim) => !isPlainRecord(claim) || claim.id !== 'service-capture')
    : legacy.serviceClaims;
  const equipmentClaims = Array.isArray(legacy.equipmentClaims)
    ? legacy.equipmentClaims.filter((claim) => !isPlainRecord(claim) || claim.equipmentId !== 'not-supplied')
    : legacy.equipmentClaims;
  const warnings = Array.isArray(validity.warnings)
    ? validity.warnings.filter((warning) => !isPlainRecord(warning) || warning.id !== 'capture-limitation')
    : validity.warnings;
  const vetoes = Array.isArray(validity.vetoes)
    ? validity.vetoes.filter((veto) => !isPlainRecord(veto) || veto.id !== 'capture-limitation')
    : validity.vetoes;
  return parseTrip({
    ...legacy,
    captureContext: { kind: 'legacy-migrated' },
    serviceClaims,
    equipmentClaims,
    validity: {
      ...validity,
      result: 'untimed-structural-route',
      pattern: 'unspecified',
      schedule: { kind: 'none' },
      warnings,
      vetoes,
    },
  });
}

function parseTrip(value: unknown): ActiveTripRecord {
  const root = strictRecord(
    value,
    ['id', 'capturedAt', 'captureContext', 'origin', 'destination', 'accessibleRouteOnly', 'legs', 'transfers', 'serviceClaims', 'equipmentClaims', 'cursor', 'validity'],
    ['exitGuidance', 'platformGuidance', 'accessiblePath', 'contingencies'],
  );
  if (typeof root.accessibleRouteOnly !== 'boolean') throw new Error('Invalid accessibility preference');
  const legs = boundedArray(root.legs, 1, MAX_LEGS, parseLeg, 'trip legs');
  const points = legs.flatMap((leg) => leg.points);
  assertUnique(legs.map(({ id }) => id), 'leg');
  assertUnique(points.map(({ id }) => id), 'trip point');
  const transfers = boundedArray(root.transfers, 0, Math.max(0, MAX_LEGS - 1), parseTransfer, 'transfers');
  assertUnique(transfers.map(({ id }) => id), 'transfer');
  const serviceClaims = boundedArray(root.serviceClaims, 0, MAX_CLAIMS, parseServiceClaim, 'service claims');
  const equipmentClaims = boundedArray(root.equipmentClaims, 0, MAX_CLAIMS, parseEquipmentClaim, 'equipment claims');
  assertUnique(serviceClaims.map(({ id }) => id), 'service claim');
  assertUnique(equipmentClaims.map(({ id }) => id), 'equipment claim');
  const cursor = strictRecord(root.cursor, ['pointId']);
  const record: ActiveTripRecord = {
    id: identity(root.id, 'trip'),
    capturedAt: instant(root.capturedAt, 'trip capture'),
    captureContext: parseCaptureContext(root.captureContext),
    origin: parsePlace(root.origin),
    destination: parsePlace(root.destination),
    accessibleRouteOnly: root.accessibleRouteOnly,
    legs,
    transfers,
    serviceClaims,
    equipmentClaims,
    cursor: { pointId: identity(cursor.pointId, 'trip cursor point') },
    validity: parseValidity(root.validity),
    ...(root.exitGuidance === undefined ? {} : { exitGuidance: parseExitGuidance(root.exitGuidance) }),
    ...(root.contingencies === undefined ? {} : {
      contingencies: boundedArray(root.contingencies, 1, 2, parseContingency, 'contingencies'),
    }),
  };
  validateTripReferences(record);
  return deepFreeze(record);
}

function parseCaptureContext(value: unknown): ActiveTripCaptureContext {
  if (!isPlainRecord(value)) throw new Error('Invalid capture context');
  if (value.kind === 'legacy-migrated') {
    strictRecord(value, ['kind']);
    return Object.freeze({ kind: 'legacy-migrated' });
  }
  const root = strictRecord(value, ['kind', 'itineraryId', 'requestMode', 'timing'], ['disclosure', 'validationEvidenceReceipt']);
  if (root.kind !== 'response-owned') throw new Error('Invalid capture context');
  return deepFreeze({
    kind: 'response-owned',
    itineraryId: identity(root.itineraryId, 'capture itinerary'),
    requestMode: enumeration(root.requestMode, ['online-current', 'online-future', 'offline-reference'] as const, 'capture request mode'),
    timing: enumeration(root.timing, ['timed', 'untimed'] as const, 'capture timing'),
    ...(root.disclosure === undefined ? {} : {
      disclosure: enumeration(root.disclosure, [JOURNEY_CAPTURE_DISCLOSURE] as const, 'capture disclosure'),
    }),
    ...(root.validationEvidenceReceipt === undefined ? {} : {
      validationEvidenceReceipt: parseValidationEvidenceReceipt(root.validationEvidenceReceipt),
    }),
  });
}

function parseValidationEvidenceReceipt(value: unknown): ActiveTripValidationEvidenceReceipt {
  const root = strictRecord(value, [
    'bootstrapDecisionIdentity', 'journeyDecisionIdentity', 'decisionSnapshotIdentity',
    'stationCatalogVersion', 'journeyGraphVersion', 'mapDayVersion', 'mapNightVersion',
    'canonicalItineraryIdentity', 'capturePackageIdentity', 'pathId',
    'originStationId', 'originPlatformId', 'destinationStationId', 'destinationPlatformId',
    'routeId', 'direction', 'actualDestination',
  ]);
  return deepFreeze({
    bootstrapDecisionIdentity: identity(root.bootstrapDecisionIdentity, 'validation bootstrap decision'),
    journeyDecisionIdentity: identity(root.journeyDecisionIdentity, 'validation journey decision'),
    decisionSnapshotIdentity: identity(root.decisionSnapshotIdentity, 'validation decision snapshot'),
    stationCatalogVersion: identity(root.stationCatalogVersion, 'validation station catalog'),
    journeyGraphVersion: identity(root.journeyGraphVersion, 'validation journey graph'),
    mapDayVersion: identity(root.mapDayVersion, 'validation day map'),
    mapNightVersion: identity(root.mapNightVersion, 'validation night map'),
    canonicalItineraryIdentity: display(root.canonicalItineraryIdentity, 'validation itinerary', 512),
    capturePackageIdentity: display(root.capturePackageIdentity, 'validation capture package', 512),
    pathId: identity(root.pathId, 'validation accessible path'),
    originStationId: identity(root.originStationId, 'validation origin'),
    originPlatformId: identity(root.originPlatformId, 'validation origin platform'),
    destinationStationId: identity(root.destinationStationId, 'validation destination'),
    destinationPlatformId: identity(root.destinationPlatformId, 'validation destination platform'),
    routeId: identity(root.routeId, 'validation route'),
    direction: direction(root.direction),
    actualDestination: display(root.actualDestination, 'validation actual destination'),
  });
}

function parsePlace(value: unknown): ActiveTripPlace {
  const root = strictRecord(value, ['name', 'complexId', 'constituentId'], ['entranceId']);
  return deepFreeze({
    name: display(root.name, 'station name'),
    complexId: identity(root.complexId, 'station complex'),
    constituentId: identity(root.constituentId, 'constituent station'),
    ...(root.entranceId === undefined ? {} : { entranceId: identity(root.entranceId, 'entrance') }),
  });
}

function parseRoute(value: unknown): ActiveTripRoute {
  const root = strictRecord(value, ['id', 'label', 'spokenIdentity', 'shape']);
  return deepFreeze({
    id: identity(root.id, 'route'),
    label: display(root.label, 'route label', 32),
    spokenIdentity: display(root.spokenIdentity, 'spoken route identity'),
    shape: enumeration(root.shape, ['circle', 'diamond'] as const, 'route shape'),
  });
}

function parsePoint(value: unknown): ActiveTripPoint {
  const root = strictRecord(value, ['id', 'kind', 'stationName', 'complexId', 'constituentId', 'instruction']);
  return deepFreeze({
    id: identity(root.id, 'trip point'),
    kind: enumeration(root.kind, ['stop', 'decision'] as const, 'point kind'),
    stationName: display(root.stationName, 'point station'),
    complexId: identity(root.complexId, 'point complex'),
    constituentId: identity(root.constituentId, 'point constituent'),
    instruction: display(root.instruction, 'point instruction'),
  });
}

function parseLeg(value: unknown): ActiveTripLeg {
  const root = strictRecord(value, ['id', 'route', 'boundDirection', 'actualDestination', 'points']);
  const points = boundedArray(root.points, 2, MAX_POINTS, parsePoint, 'leg points');
  assertUnique(points.map(({ id }) => id), 'leg point');
  return deepFreeze({
    id: identity(root.id, 'leg'),
    route: parseRoute(root.route),
    boundDirection: direction(root.boundDirection),
    actualDestination: display(root.actualDestination, 'actual destination'),
    points,
  });
}

function parseTransfer(value: unknown): ActiveTripTransfer {
  const root = strictRecord(
    value,
    ['id', 'atPointId', 'incomingLegId', 'outgoingLegId', 'incomingDirection', 'incomingDestination', 'outgoingDirection', 'outgoingDestination', 'steps'],
    ['connectionState'],
  );
  return deepFreeze({
    id: identity(root.id, 'transfer'),
    atPointId: identity(root.atPointId, 'transfer point'),
    incomingLegId: identity(root.incomingLegId, 'incoming leg'),
    outgoingLegId: identity(root.outgoingLegId, 'outgoing leg'),
    incomingDirection: direction(root.incomingDirection),
    incomingDestination: display(root.incomingDestination, 'incoming destination'),
    outgoingDirection: direction(root.outgoingDirection),
    outgoingDestination: display(root.outgoingDestination, 'outgoing destination'),
    steps: boundedStrings(root.steps, 1, MAX_STEPS, 'transfer steps'),
    ...(root.connectionState === undefined ? {} : { connectionState: display(root.connectionState, 'connection state') }),
  });
}

function parseClaimScope(value: unknown): ActiveTripClaimScope {
  if (!isPlainRecord(value)) throw new Error('Invalid claim scope');
  switch (value.kind) {
    case 'trip': {
      const root = strictRecord(value, ['kind', 'tripId']);
      return deepFreeze({ kind: 'trip', tripId: identity(root.tripId, 'claim trip') });
    }
    case 'leg': {
      const root = strictRecord(value, ['kind', 'legId', 'routeId', 'direction']);
      return deepFreeze({ kind: 'leg', legId: identity(root.legId, 'claim leg'), routeId: identity(root.routeId, 'claim route'), direction: direction(root.direction) });
    }
    case 'route': {
      const root = strictRecord(value, ['kind', 'routeId']);
      return deepFreeze({ kind: 'route', routeId: identity(root.routeId, 'claim route') });
    }
    case 'direction': {
      const root = strictRecord(value, ['kind', 'routeId', 'direction']);
      return deepFreeze({ kind: 'direction', routeId: identity(root.routeId, 'claim route'), direction: direction(root.direction) });
    }
    case 'station': {
      const root = strictRecord(value, ['kind', 'stationId', 'routeId', 'direction']);
      return deepFreeze({ kind: 'station', stationId: identity(root.stationId, 'claim station'), routeId: identity(root.routeId, 'claim route'), direction: direction(root.direction) });
    }
    case 'segment': {
      const root = strictRecord(value, ['kind', 'fromStationId', 'toStationId', 'routeId', 'direction']);
      return deepFreeze({
        kind: 'segment', fromStationId: identity(root.fromStationId, 'claim segment start'),
        toStationId: identity(root.toStationId, 'claim segment end'), routeId: identity(root.routeId, 'claim route'),
        direction: direction(root.direction),
      });
    }
    default: throw new Error('Invalid claim scope');
  }
}

function parseServiceClaim(value: unknown): ActiveTripServiceClaim {
  const root = strictRecord(value, ['id', 'scope', 'state', 'consequence', 'lastCheckedAt']);
  return deepFreeze({
    id: identity(root.id, 'service claim'),
    scope: parseClaimScope(root.scope),
    state: enumeration(root.state, ['normal', 'changed', 'unresolved', 'suspended', 'bypassed', 'closed', 'cancelled'] as const, 'service state'),
    consequence: display(root.consequence, 'service consequence'),
    lastCheckedAt: instant(root.lastCheckedAt, 'service claim'),
  });
}

function parseEquipmentClaim(value: unknown): ActiveTripEquipmentClaim {
  const root = strictRecord(value, ['id', 'equipmentId', 'connectionId', 'pathId', 'observation', 'lastCheckedAt']);
  return deepFreeze({
    id: identity(root.id, 'equipment claim'),
    equipmentId: identity(root.equipmentId, 'equipment'),
    connectionId: identity(root.connectionId, 'equipment connection'),
    pathId: identity(root.pathId, 'equipment path'),
    observation: enumeration(root.observation, ['working', 'out-of-service', 'unknown'] as const, 'equipment observation'),
    lastCheckedAt: instant(root.lastCheckedAt, 'equipment claim'),
  });
}

function parseDeparture(value: unknown): ActiveTripScheduledDeparture {
  const root = strictRecord(value, ['legId', 'pointId', 'clockTime', 'evidence', 'timeZone']);
  return deepFreeze({
    legId: identity(root.legId, 'scheduled leg'),
    pointId: identity(root.pointId, 'scheduled point'),
    clockTime: clockTime(root.clockTime),
    evidence: enumeration(root.evidence, ['scheduled'] as const, 'schedule evidence'),
    timeZone: enumeration(root.timeZone, ['America/New_York'] as const, 'schedule time zone'),
  });
}

function parseSchedule(value: unknown): ActiveTripSchedule {
  if (!isPlainRecord(value)) throw new Error('Invalid schedule context');
  if (value.kind === 'none') {
    strictRecord(value, ['kind']);
    return Object.freeze({ kind: 'none' });
  }
  if (value.kind === 'quarantined') {
    const root = strictRecord(value, ['kind', 'reason']);
    return deepFreeze({ kind: 'quarantined', reason: display(root.reason, 'quarantine reason') });
  }
  if (value.kind === 'topology-only') {
    const root = strictRecord(value, ['kind', 'reason', 'editionId', 'anchorKind', 'anchorAt', 'lastRetrievedAt', 'currencyAgeSeconds']);
    return deepFreeze({
      kind: 'topology-only',
      reason: enumeration(root.reason, ['aged', 'superseded', 'coverage-mismatch', 'horizon-exceeded'] as const, 'topology reason'),
      editionId: identity(root.editionId, 'schedule edition'),
      anchorKind: enumeration(root.anchorKind, ['published', 'first-retrieved'] as const, 'schedule anchor kind'),
      anchorAt: instant(root.anchorAt, 'schedule anchor'),
      lastRetrievedAt: instant(root.lastRetrievedAt, 'schedule retrieval'),
      currencyAgeSeconds: nonNegativeFinite(root.currencyAgeSeconds, 'schedule age'),
    });
  }
  if (value.kind !== 'current' && value.kind !== 'stale') throw new Error('Invalid schedule context');
  const stale = value.kind === 'stale';
  const root = strictRecord(
    value,
    ['kind', 'editionId', 'anchorKind', 'anchorAt', 'lastRetrievedAt', 'effectiveFrom', 'effectiveUntil', 'currencyAgeSeconds', 'departures'],
    stale ? ['staleCopy'] : [],
  );
  const common: ActiveTripTimedSchedule = {
    editionId: identity(root.editionId, 'schedule edition'),
    anchorKind: enumeration(root.anchorKind, ['published', 'first-retrieved'] as const, 'schedule anchor kind'),
    anchorAt: instant(root.anchorAt, 'schedule anchor'),
    lastRetrievedAt: instant(root.lastRetrievedAt, 'schedule retrieval'),
    effectiveFrom: serviceDate(root.effectiveFrom),
    effectiveUntil: serviceDate(root.effectiveUntil),
    currencyAgeSeconds: nonNegativeFinite(root.currencyAgeSeconds, 'schedule age'),
    departures: boundedArray(root.departures, 1, MAX_POINTS, parseDeparture, 'scheduled departures'),
  };
  if (common.effectiveFrom > common.effectiveUntil) throw new Error('Invalid schedule coverage');
  if (stale) {
    return deepFreeze({
      kind: 'stale', ...common,
      staleCopy: enumeration(root.staleCopy, ['Stored schedule—service changes may differ'] as const, 'stale schedule copy'),
    });
  }
  return deepFreeze({ kind: 'current', ...common });
}

function parseLimitation(value: unknown): ActiveTripLimitation {
  const root = strictRecord(value, ['id', 'scope', 'message', 'ownerRecordId', 'lastCheckedAt']);
  return deepFreeze({
    id: identity(root.id, 'limitation'),
    scope: parseClaimScope(root.scope),
    message: display(root.message, 'limitation message'),
    ownerRecordId: identity(root.ownerRecordId, 'limitation owner record'),
    lastCheckedAt: instant(root.lastCheckedAt, 'limitation'),
  });
}

function parseValidity(value: unknown): ActiveTripValidity {
  const root = strictRecord(value, ['result', 'serviceDate', 'pattern', 'schedule', 'warnings', 'vetoes'], ['patternBoundary']);
  const schedule = parseSchedule(root.schedule);
  const result = enumeration(root.result, [
    'current-itinerary', 'future-itinerary', 'reference-itinerary', 'untimed-structural-route', 'untimed-structural-path',
  ] as const, 'validity result');
  if ((schedule.kind === 'current' || schedule.kind === 'stale')
    !== ['current-itinerary', 'future-itinerary', 'reference-itinerary'].includes(result)) {
    throw new Error('Scheduled evidence does not own the validity result');
  }
  return deepFreeze({
    result,
    serviceDate: serviceDate(root.serviceDate),
    pattern: enumeration(root.pattern, ['actual-now', 'typical-weekday', 'late-night', 'unspecified'] as const, 'service pattern'),
    schedule,
    warnings: boundedArray(root.warnings, 0, MAX_CLAIMS, parseLimitation, 'validity warnings'),
    vetoes: boundedArray(root.vetoes, 0, MAX_CLAIMS, parseLimitation, 'validity vetoes'),
    ...(root.patternBoundary === undefined ? {} : { patternBoundary: parsePatternBoundary(root.patternBoundary) }),
  });
}

function parsePatternBoundary(value: unknown): ActiveTripPatternBoundary {
  const root = strictRecord(value, ['explanation', 'ownerRecordId', 'verifiedAt']);
  return deepFreeze({
    explanation: display(root.explanation, 'pattern boundary explanation'),
    ownerRecordId: identity(root.ownerRecordId, 'pattern boundary owner'),
    verifiedAt: instant(root.verifiedAt, 'pattern boundary'),
  });
}

function parseExitGuidance(value: unknown): ActiveTripExitGuidance {
  const root = strictRecord(value, ['ownerRecordId', 'exitId', 'legId', 'purpose', 'verificationContext', 'verifiedAt', 'limitations'], ['destinationScope']);
  return deepFreeze({
    ownerRecordId: identity(root.ownerRecordId, 'exit owner record'),
    exitId: identity(root.exitId, 'exit'),
    legId: identity(root.legId, 'exit leg'),
    purpose: display(root.purpose, 'exit purpose'),
    verificationContext: display(root.verificationContext, 'exit verification'),
    verifiedAt: instant(root.verifiedAt, 'exit guidance'),
    limitations: boundedStrings(root.limitations, 0, MAX_STEPS, 'exit limitations'),
    ...(root.destinationScope === undefined ? {} : { destinationScope: parseExitGuidanceScope(root.destinationScope) }),
  });
}

function parseExitGuidanceScope(value: unknown): NonNullable<ActiveTripExitGuidance['destinationScope']> {
  const root = strictRecord(value, ['stationName', 'stationComplexId', 'constituentStationId', 'platformId', 'equipmentId']);
  return deepFreeze({
    stationName: display(root.stationName, 'exit station name'),
    stationComplexId: identity(root.stationComplexId, 'exit station complex'),
    constituentStationId: identity(root.constituentStationId, 'exit constituent station'),
    platformId: identity(root.platformId, 'exit platform'),
    equipmentId: identity(root.equipmentId, 'exit equipment'),
  });
}

function parseContingency(value: unknown): ActiveTripContingency {
  const root = strictRecord(
    value,
    ['id', 'ownerRecordId', 'trigger', 'affectedLegId', 'routeId', 'direction', 'stopPointIds', 'transferIds', 'actions', 'accessibilityResult', 'verificationContext', 'lastCheckedAt', 'limitations'],
    ['accessiblePathOwnerRecordId'],
  );
  const accessibilityResult = enumeration(root.accessibilityResult, ['not-applicable', 'complete-structural-path'] as const, 'contingency accessibility result');
  if ((accessibilityResult === 'complete-structural-path') !== (root.accessiblePathOwnerRecordId !== undefined)) {
    throw new Error('Incomplete contingency accessibility evidence');
  }
  return deepFreeze({
    id: identity(root.id, 'contingency'),
    ownerRecordId: identity(root.ownerRecordId, 'contingency owner record'),
    trigger: display(root.trigger, 'contingency trigger'),
    affectedLegId: identity(root.affectedLegId, 'contingency leg'),
    routeId: identity(root.routeId, 'contingency route'),
    direction: direction(root.direction),
    stopPointIds: boundedIdentities(root.stopPointIds, 1, MAX_POINTS, 'contingency stops'),
    transferIds: boundedIdentities(root.transferIds, 0, MAX_LEGS, 'contingency transfers'),
    actions: boundedStrings(root.actions, 1, MAX_STEPS, 'contingency actions'),
    accessibilityResult,
    ...(root.accessiblePathOwnerRecordId === undefined ? {} : {
      accessiblePathOwnerRecordId: identity(root.accessiblePathOwnerRecordId, 'contingency path owner'),
    }),
    verificationContext: display(root.verificationContext, 'contingency verification'),
    lastCheckedAt: instant(root.lastCheckedAt, 'contingency'),
    limitations: boundedStrings(root.limitations, 0, MAX_STEPS, 'contingency limitations'),
  });
}

function validateTripReferences(trip: ActiveTripRecord): void {
  const legById = new Map(trip.legs.map((leg) => [leg.id, leg]));
  const pointById = new Map(trip.legs.flatMap((leg) => leg.points.map((point) => [point.id, point] as const)));
  const first = trip.legs[0].points[0];
  const lastLeg = trip.legs[trip.legs.length - 1];
  const last = lastLeg.points[lastLeg.points.length - 1];
  const timedSchedule = trip.validity.schedule.kind === 'current' || trip.validity.schedule.kind === 'stale';
  if (trip.captureContext.kind === 'legacy-migrated') {
    if (trip.validity.result !== 'untimed-structural-route' || trip.validity.pattern !== 'unspecified'
      || trip.validity.schedule.kind !== 'none') throw new Error('Legacy migration retained unowned timing context');
  } else {
    const expectedResult = trip.captureContext.requestMode === 'online-current'
      ? 'current-itinerary'
      : trip.captureContext.requestMode === 'online-future'
        ? 'future-itinerary'
        : trip.captureContext.timing === 'timed' ? 'reference-itinerary' : trip.validity.result;
    if (trip.validity.result !== expectedResult
      || (trip.captureContext.requestMode === 'online-current' && trip.validity.pattern !== 'actual-now')
      || (trip.captureContext.timing === 'timed') !== timedSchedule) {
      throw new Error('Capture context contradicts retained validity');
    }
    const receipt = trip.captureContext.validationEvidenceReceipt;
    if (receipt) {
      const manifest = VALIDATION_RIDER_EVIDENCE_MANIFEST;
      const onlyLeg = trip.legs.length === 1 ? trip.legs[0] : undefined;
      const expectedCaptureIdentity = encodeCanonicalStringTuple([
        'validation-capture-package-v1', receipt.journeyDecisionIdentity,
        trip.captureContext.itineraryId, trip.capturedAt, trip.origin.constituentId,
        trip.destination.constituentId, trip.captureContext.requestMode,
      ]);
      if (trip.captureContext.disclosure !== JOURNEY_CAPTURE_DISCLOSURE
        || receipt.decisionSnapshotIdentity !== manifest.decisionSnapshotIdentity
        || receipt.stationCatalogVersion !== manifest.stationCatalogVersion
        || receipt.journeyGraphVersion !== manifest.journeyGraphVersion
        || receipt.mapDayVersion !== manifest.mapDayVersion
        || receipt.mapNightVersion !== manifest.mapNightVersion
        || receipt.pathId !== manifest.pathId
        || receipt.originStationId !== manifest.originStationId
        || receipt.originPlatformId !== manifest.originPlatformId
        || receipt.destinationStationId !== manifest.destinationStationId
        || receipt.destinationPlatformId !== manifest.destinationPlatformId
        || receipt.routeId !== manifest.routeId
        || receipt.direction !== manifest.direction
        || receipt.actualDestination !== manifest.actualDestination
        || receipt.canonicalItineraryIdentity !== trip.captureContext.itineraryId
        || receipt.capturePackageIdentity !== expectedCaptureIdentity
        || receipt.originStationId !== trip.origin.constituentId
        || receipt.destinationStationId !== trip.destination.constituentId
        || !trip.accessibleRouteOnly || !onlyLeg || trip.transfers.length !== 0
        || onlyLeg.route.id !== receipt.routeId || onlyLeg.boundDirection !== receipt.direction
        || onlyLeg.actualDestination !== receipt.actualDestination
        || !trip.equipmentClaims.some((claim) => claim.pathId === receipt.pathId)) {
        throw new Error('Validation evidence receipt lost exact trip ownership');
      }
    }
  }
  if (first.complexId !== trip.origin.complexId || first.constituentId !== trip.origin.constituentId
    || last.complexId !== trip.destination.complexId || last.constituentId !== trip.destination.constituentId) {
    throw new Error('Trip endpoints do not own the ordered points');
  }
  if (!pointById.has(trip.cursor.pointId)) throw new Error('Trip cursor is outside the trip');
  for (let index = 0; index < trip.transfers.length; index += 1) {
    const transfer = trip.transfers[index];
    const incoming = legById.get(transfer.incomingLegId);
    const outgoing = legById.get(transfer.outgoingLegId);
    const incomingPoint = incoming?.points[incoming.points.length - 1];
    const outgoingPoint = outgoing?.points[0];
    if (!incoming || !outgoing || incoming !== trip.legs[index] || outgoing !== trip.legs[index + 1]
      || incomingPoint?.id !== transfer.atPointId
      || incomingPoint.complexId !== outgoingPoint?.complexId
      || incomingPoint.constituentId !== outgoingPoint.constituentId) throw new Error('Invalid transfer boundary');
    if (transfer.incomingDirection !== incoming.boundDirection || transfer.outgoingDirection !== outgoing.boundDirection
      || transfer.incomingDestination !== incoming.actualDestination || transfer.outgoingDestination !== outgoing.actualDestination) {
      throw new Error('Transfer direction is not owned by its legs');
    }
  }
  if (trip.transfers.length !== Math.max(0, trip.legs.length - 1)) throw new Error('Incomplete transfer sequence');
  for (const claim of trip.serviceClaims) {
    validateClaimScope(claim.scope, trip, legById);
    if (claim.lastCheckedAt > trip.capturedAt) throw new Error('Service claim postdates capture');
  }
  for (const claim of trip.equipmentClaims) {
    if (claim.lastCheckedAt > trip.capturedAt) throw new Error('Equipment claim postdates capture');
  }
  for (const limitation of [...trip.validity.warnings, ...trip.validity.vetoes]) {
    validateClaimScope(limitation.scope, trip, legById);
    if (limitation.lastCheckedAt > trip.capturedAt) throw new Error('Limitation postdates capture');
  }
  const schedule = trip.validity.schedule;
  if (schedule.kind === 'current' || schedule.kind === 'stale') {
    const exactAgeSeconds = (Date.parse(trip.capturedAt) - Date.parse(schedule.anchorAt)) / 1_000;
    if (trip.validity.serviceDate < schedule.effectiveFrom || trip.validity.serviceDate > schedule.effectiveUntil
      || schedule.lastRetrievedAt < schedule.anchorAt || schedule.lastRetrievedAt > trip.capturedAt
      || schedule.currencyAgeSeconds !== exactAgeSeconds) {
      throw new Error('Schedule chronology does not own the trip');
    }
    if ((schedule.kind === 'current' && schedule.currencyAgeSeconds > 7_200)
      || (schedule.kind === 'stale' && (schedule.currencyAgeSeconds <= 7_200 || schedule.currencyAgeSeconds > 86_400))) {
      throw new Error('Schedule currency label contradicts its retained age');
    }
  } else if (schedule.kind === 'topology-only') {
    const exactAgeSeconds = (Date.parse(trip.capturedAt) - Date.parse(schedule.anchorAt)) / 1_000;
    if (schedule.lastRetrievedAt < schedule.anchorAt || schedule.lastRetrievedAt > trip.capturedAt
      || schedule.currencyAgeSeconds !== exactAgeSeconds
      || (schedule.reason === 'aged' && schedule.currencyAgeSeconds <= 86_400)) {
      throw new Error('Topology schedule context is contradictory');
    }
  }
  for (const departure of trip.validity.schedule.kind === 'current' || trip.validity.schedule.kind === 'stale'
    ? trip.validity.schedule.departures : []) {
    const leg = legById.get(departure.legId);
    if (!leg?.points.some(({ id }) => id === departure.pointId)) throw new Error('Scheduled departure is outside its leg');
  }
  if (trip.exitGuidance) {
    if (!legById.has(trip.exitGuidance.legId) || trip.exitGuidance.verifiedAt > trip.capturedAt) {
      throw new Error('Exit guidance is outside the trip');
    }
    const scope = trip.exitGuidance.destinationScope;
    if (scope && (scope.stationComplexId !== trip.destination.complexId
      || scope.constituentStationId !== trip.destination.constituentId
      || !trip.equipmentClaims.some(({ equipmentId }) => equipmentId === scope.equipmentId))) {
      throw new Error('Exit guidance is not owned by the destination path');
    }
    const receipt = trip.captureContext.kind === 'response-owned'
      ? trip.captureContext.validationEvidenceReceipt
      : undefined;
    if (receipt && (!scope || scope.platformId !== receipt.destinationPlatformId
      || scope.equipmentId !== trip.equipmentClaims.find(({ pathId }) => pathId === receipt.pathId)?.equipmentId)) {
      throw new Error('Validation exit guidance lost its destination receipt');
    }
  }
  for (const contingency of trip.contingencies ?? []) {
    const leg = legById.get(contingency.affectedLegId);
    if (!leg || leg.route.id !== contingency.routeId || leg.boundDirection !== contingency.direction
      || contingency.stopPointIds.some((id) => !pointById.has(id))
      || contingency.transferIds.some((id) => !trip.transfers.some((transfer) => transfer.id === id))) {
      throw new Error('Contingency is outside the trip');
    }
    if (contingency.lastCheckedAt > trip.capturedAt) throw new Error('Contingency postdates capture');
  }
  assertUnique((trip.contingencies ?? []).map(({ id }) => id), 'contingency');
}

function hasLegacyAccessibilityClaims(value: unknown): boolean {
  return isPlainRecord(value) && (value.platformGuidance !== undefined || value.accessiblePath !== undefined);
}

function validateClaimScope(
  scope: ActiveTripClaimScope,
  trip: ActiveTripRecord,
  legById: ReadonlyMap<string, ActiveTripLeg>,
): void {
  const matchesRoute = (routeId: string, claimDirection?: Direction) => trip.legs.some((leg) =>
    leg.route.id === routeId && (claimDirection === undefined || leg.boundDirection === claimDirection));
  switch (scope.kind) {
    case 'trip':
      if (scope.tripId !== trip.id) throw new Error('Claim belongs to another trip');
      return;
    case 'leg': {
      const leg = legById.get(scope.legId);
      if (!leg || leg.route.id !== scope.routeId || leg.boundDirection !== scope.direction) throw new Error('Claim belongs to another leg');
      return;
    }
    case 'route':
      if (!matchesRoute(scope.routeId)) throw new Error('Claim belongs to another route');
      return;
    case 'direction':
      if (!matchesRoute(scope.routeId, scope.direction)) throw new Error('Claim belongs to another direction');
      return;
    case 'station':
      if (!trip.legs.some((leg) => leg.route.id === scope.routeId && leg.boundDirection === scope.direction
        && leg.points.some((point) => point.constituentId === scope.stationId))) throw new Error('Claim belongs to another station');
      return;
    case 'segment':
      if (!trip.legs.some((leg) => {
        if (leg.route.id !== scope.routeId || leg.boundDirection !== scope.direction) return false;
        const from = leg.points.findIndex((point) => point.constituentId === scope.fromStationId);
        const to = leg.points.findIndex((point) => point.constituentId === scope.toStationId);
        return from >= 0 && to > from;
      })) throw new Error('Claim belongs to another segment');
  }
}

function boundedArray<T>(
  value: unknown,
  minimum: number,
  maximum: number,
  parse: (item: unknown) => T,
  label: string,
): readonly T[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) throw new Error(`Invalid ${label}`);
  return deepFreeze(value.map(parse));
}

function boundedStrings(value: unknown, minimum: number, maximum: number, label: string): readonly string[] {
  return boundedArray(value, minimum, maximum, (item) => display(item, label), label);
}

function boundedIdentities(value: unknown, minimum: number, maximum: number, label: string): readonly string[] {
  const result = boundedArray(value, minimum, maximum, (item) => identity(item, label), label);
  assertUnique(result, label);
  return result;
}

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  return normalizeBoundedIdentity(value, label);
}

function display(value: unknown, label: string, maximum = 1_024): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  const normalized = normalizeCanonicalIdentity(value).trim();
  if (!normalized || [...normalized].length > maximum || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error(`Invalid ${label}`);
  return normalized;
}

function direction(value: unknown): Direction {
  return enumeration(value, ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'] as const, 'direction');
}

function serviceDate(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid service date');
  return parseServiceDate(value);
}

function clockTime(value: unknown): string {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Invalid scheduled clock');
  return value;
}

function instant(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label} time`);
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) throw new Error(`Invalid ${label} time`);
  return value;
}

function nonNegativeFinite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`Invalid ${label}`);
  return value;
}

function enumeration<const T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`Invalid ${label}`);
  return value as T[number];
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

function strictRecord(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> {
  if (!isPlainRecord(value)) throw new Error('Invalid persisted active-trip record');
  const keys = Object.keys(value);
  if (required.some((key) => !keys.includes(key))
    || keys.some((key) => !required.includes(key) && !optional.includes(key))) {
    throw new Error('Unknown persisted active-trip field');
  }
  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function rollbackUnexpectedMutation(storage: BrowserStorage, key: string, priorRaw: string | null): void {
  try {
    if (storage.getItem(key) === priorRaw) return;
    if (priorRaw === null) storage.removeItem(key);
    else storage.setItem(key, priorRaw);
  } catch {
    // The device store is failing; accepted in-memory evidence remains unchanged.
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
