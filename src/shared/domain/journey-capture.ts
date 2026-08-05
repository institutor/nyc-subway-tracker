import { normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import { parseServiceDate } from './clock';
import type { Direction } from './types';

export const JOURNEY_CAPTURE_DISCLOSURE = 'Demonstration data \u2014 not live' as const;
export const STALE_SCHEDULE_DISCLOSURE = 'Stored schedule\u2014service changes may differ' as const;

const MAX_CLAIMS = 128;
const MAX_DEPARTURES = 512;

export interface JourneyCaptureScope {
  readonly mode: 'online-current' | 'online-future' | 'offline-reference';
  readonly originStationId: string;
  readonly destinationStationId: string;
  readonly accessibleRouteOnly: boolean;
  readonly serviceDate?: string;
}

export type JourneyCaptureClaimScope =
  | { readonly kind: 'itinerary'; readonly itineraryId: string }
  | { readonly kind: 'pattern'; readonly patternId: string; readonly routeId: string; readonly direction: Direction }
  | { readonly kind: 'route'; readonly routeId: string }
  | { readonly kind: 'direction'; readonly routeId: string; readonly direction: Direction }
  | { readonly kind: 'station'; readonly occurrenceId: string; readonly patternId: string; readonly routeId: string; readonly direction: Direction }
  | {
    readonly kind: 'segment';
    readonly fromOccurrenceId: string;
    readonly toOccurrenceId: string;
    readonly patternId: string;
    readonly routeId: string;
    readonly direction: Direction;
  };

export interface JourneyCaptureServiceClaim {
  readonly id: string;
  readonly scope: JourneyCaptureClaimScope;
  readonly state: 'normal' | 'changed' | 'unresolved' | 'suspended' | 'bypassed' | 'closed' | 'cancelled';
  readonly consequence: string;
  readonly lastCheckedAt: string;
}

export interface JourneyCaptureEquipmentClaim {
  readonly id: string;
  readonly equipmentId: string;
  readonly connectionId: string;
  readonly pathId: string;
  readonly observation: 'working' | 'out-of-service' | 'unknown';
  readonly lastCheckedAt: string;
}

export interface JourneyCaptureLimitation {
  readonly id: string;
  readonly scope: JourneyCaptureClaimScope;
  readonly message: string;
  readonly ownerRecordId: string;
  readonly lastCheckedAt: string;
}

export interface JourneyCaptureDeparture {
  readonly patternId: string;
  readonly occurrenceId: string;
  readonly clockTime: string;
  readonly evidence: 'scheduled';
  readonly timeZone: 'America/New_York';
}

interface JourneyCaptureTimedSchedule {
  readonly editionId: string;
  readonly anchorKind: 'published' | 'first-retrieved';
  readonly anchorAt: string;
  readonly lastRetrievedAt: string;
  readonly effectiveFrom: string;
  readonly effectiveUntil: string;
  readonly currencyAgeSeconds: number;
  readonly departures: readonly JourneyCaptureDeparture[];
}

export type JourneyCaptureSchedule =
  | ({ readonly kind: 'current' } & JourneyCaptureTimedSchedule)
  | ({ readonly kind: 'stale'; readonly staleCopy: typeof STALE_SCHEDULE_DISCLOSURE } & JourneyCaptureTimedSchedule)
  | { readonly kind: 'none' };

export interface JourneyCapturePackage {
  readonly itineraryId: string;
  readonly requestMode: JourneyCaptureScope['mode'];
  readonly scope: JourneyCaptureScope;
  readonly serviceDate: string;
  readonly timing: 'timed' | 'untimed';
  readonly capturedAt: string;
  readonly disclosure?: typeof JOURNEY_CAPTURE_DISCLOSURE;
  readonly validity: {
    readonly result: 'current-itinerary' | 'future-itinerary' | 'reference-itinerary' | 'untimed-structural-route' | 'untimed-structural-path';
    readonly pattern: 'actual-now' | 'typical-weekday' | 'late-night';
    readonly schedule: JourneyCaptureSchedule;
    readonly warnings: readonly JourneyCaptureLimitation[];
    readonly vetoes: readonly JourneyCaptureLimitation[];
    readonly patternBoundary?: {
      readonly explanation: string;
      readonly ownerRecordId: string;
      readonly verifiedAt: string;
    };
  };
  readonly serviceClaims: readonly JourneyCaptureServiceClaim[];
  readonly equipmentClaims: readonly JourneyCaptureEquipmentClaim[];
}

export interface JourneyCaptureItineraryOwner {
  readonly id: string;
  readonly timing: 'timed' | 'untimed';
  readonly legs: readonly {
    readonly patternId: string;
    readonly routeId: string;
    readonly direction: Direction;
    readonly orderedOccurrenceIds: readonly string[];
  }[];
}

export function bindJourneyCapturePackage(
  raw: unknown,
  owner: {
    readonly itinerary: JourneyCaptureItineraryOwner;
    readonly scope: JourneyCaptureScope;
    readonly responseDecidedAt: string;
    readonly responseDisclosure: string | undefined;
  },
): JourneyCapturePackage {
  const capture = validateJourneyCapturePackage(raw);
  if (capture.itineraryId !== owner.itinerary.id
    || capture.requestMode !== owner.scope.mode
    || capture.timing !== owner.itinerary.timing
    || capture.capturedAt !== exactInstant(owner.responseDecidedAt, 'response decision')
    || capture.disclosure !== owner.responseDisclosure
    || !sameScope(capture.scope, owner.scope)
    || (owner.scope.serviceDate !== undefined && capture.serviceDate !== owner.scope.serviceDate)) {
    throw new Error('Journey capture does not belong to the response itinerary');
  }
  const resultMatchesMode = capture.requestMode === 'online-current'
    ? capture.validity.result === 'current-itinerary' && capture.validity.pattern === 'actual-now'
    : capture.requestMode === 'online-future'
      ? capture.validity.result === 'future-itinerary'
      : capture.timing === 'timed'
        ? capture.validity.result === 'reference-itinerary'
        : capture.validity.result === 'untimed-structural-route' || capture.validity.result === 'untimed-structural-path';
  if (!resultMatchesMode) throw new Error('Journey capture result contradicts its request mode');
  const legs = owner.itinerary.legs;
  if (capture.validity.schedule.kind === 'current' || capture.validity.schedule.kind === 'stale') {
    for (const departure of capture.validity.schedule.departures) {
      const leg = legs.find(({ patternId }) => patternId === departure.patternId);
      if (!leg?.orderedOccurrenceIds.includes(departure.occurrenceId)) throw new Error('Journey departure is outside its pattern');
    }
    for (const leg of legs) {
      if (!capture.validity.schedule.departures.some((departure) =>
        departure.patternId === leg.patternId && departure.occurrenceId === leg.orderedOccurrenceIds[0])) {
        throw new Error('Journey capture lacks a boarding departure');
      }
    }
  }
  for (const claim of [...capture.serviceClaims, ...capture.validity.warnings, ...capture.validity.vetoes]) {
    validateOwnedScope(claim.scope, capture.itineraryId, legs);
  }
  return capture;
}

export function validateJourneyCapturePackage(value: unknown): JourneyCapturePackage {
  const root = strictRecord(value, [
    'itineraryId', 'requestMode', 'scope', 'serviceDate', 'timing', 'capturedAt',
    'validity', 'serviceClaims', 'equipmentClaims',
  ], ['disclosure']);
  const capturedAt = exactInstant(root.capturedAt, 'journey capture');
  const scope = parseScope(root.scope);
  const timing = enumeration(root.timing, ['timed', 'untimed'] as const, 'journey timing');
  const serviceDate = parseServiceDateValue(root.serviceDate);
  const validity = parseValidity(root.validity, timing, serviceDate, capturedAt);
  const serviceClaims = boundedArray(root.serviceClaims, MAX_CLAIMS, parseServiceClaim, 'service claims');
  const equipmentClaims = boundedArray(root.equipmentClaims, MAX_CLAIMS, parseEquipmentClaim, 'equipment claims');
  for (const claim of [...serviceClaims, ...equipmentClaims, ...validity.warnings, ...validity.vetoes]) {
    if (claim.lastCheckedAt > capturedAt) throw new Error('Journey capture claim postdates capture');
  }
  assertUnique(serviceClaims.map(({ id }) => id), 'service claim');
  assertUnique(equipmentClaims.map(({ id }) => id), 'equipment claim');
  const result: JourneyCapturePackage = {
    itineraryId: identity(root.itineraryId, 'itinerary'),
    requestMode: enumeration(root.requestMode, ['online-current', 'online-future', 'offline-reference'] as const, 'request mode'),
    scope,
    serviceDate,
    timing,
    capturedAt,
    ...(root.disclosure === undefined ? {} : {
      disclosure: enumeration(root.disclosure, [JOURNEY_CAPTURE_DISCLOSURE] as const, 'capture disclosure'),
    }),
    validity,
    serviceClaims,
    equipmentClaims,
  };
  if (result.requestMode !== result.scope.mode || (result.scope.serviceDate !== undefined && result.scope.serviceDate !== serviceDate)) {
    throw new Error('Journey capture scope mismatch');
  }
  return deepFreeze(result);
}

function parseScope(value: unknown): JourneyCaptureScope {
  const root = strictRecord(value, ['mode', 'originStationId', 'destinationStationId', 'accessibleRouteOnly'], ['serviceDate']);
  if (typeof root.accessibleRouteOnly !== 'boolean') throw new Error('Invalid journey accessibility scope');
  return deepFreeze({
    mode: enumeration(root.mode, ['online-current', 'online-future', 'offline-reference'] as const, 'journey mode'),
    originStationId: identity(root.originStationId, 'journey origin'),
    destinationStationId: identity(root.destinationStationId, 'journey destination'),
    accessibleRouteOnly: root.accessibleRouteOnly,
    ...(root.serviceDate === undefined ? {} : { serviceDate: parseServiceDateValue(root.serviceDate) }),
  });
}

function parseValidity(
  value: unknown,
  timing: JourneyCapturePackage['timing'],
  serviceDate: string,
  capturedAt: string,
): JourneyCapturePackage['validity'] {
  const root = strictRecord(value, ['result', 'pattern', 'schedule', 'warnings', 'vetoes'], ['patternBoundary']);
  const schedule = parseSchedule(root.schedule, serviceDate, capturedAt);
  const result = enumeration(root.result, [
    'current-itinerary', 'future-itinerary', 'reference-itinerary', 'untimed-structural-route', 'untimed-structural-path',
  ] as const, 'capture result');
  if ((timing === 'timed') !== (schedule.kind === 'current' || schedule.kind === 'stale')
    || (['current-itinerary', 'future-itinerary', 'reference-itinerary'].includes(result))
      !== (schedule.kind === 'current' || schedule.kind === 'stale')) {
    throw new Error('Journey timing lacks exact schedule ownership');
  }
  const warnings = boundedArray(root.warnings, MAX_CLAIMS, parseLimitation, 'capture warnings');
  const vetoes = boundedArray(root.vetoes, MAX_CLAIMS, parseLimitation, 'capture vetoes');
  const patternBoundary = root.patternBoundary === undefined ? undefined : parsePatternBoundary(root.patternBoundary);
  if (patternBoundary && patternBoundary.verifiedAt > capturedAt) throw new Error('Pattern boundary postdates capture');
  return deepFreeze({
    result,
    pattern: enumeration(root.pattern, ['actual-now', 'typical-weekday', 'late-night'] as const, 'capture pattern'),
    schedule,
    warnings,
    vetoes,
    ...(patternBoundary === undefined ? {} : { patternBoundary }),
  });
}

function parseSchedule(value: unknown, serviceDate: string, capturedAt: string): JourneyCaptureSchedule {
  if (!isRecord(value)) throw new Error('Invalid capture schedule');
  if (value.kind === 'none') {
    strictRecord(value, ['kind']);
    return Object.freeze({ kind: 'none' });
  }
  const stale = value.kind === 'stale';
  if (value.kind !== 'current' && !stale) throw new Error('Invalid capture schedule');
  const root = strictRecord(value, [
    'kind', 'editionId', 'anchorKind', 'anchorAt', 'lastRetrievedAt', 'effectiveFrom', 'effectiveUntil',
    'currencyAgeSeconds', 'departures',
  ], stale ? ['staleCopy'] : []);
  const anchorAt = exactInstant(root.anchorAt, 'schedule anchor');
  const lastRetrievedAt = exactInstant(root.lastRetrievedAt, 'schedule retrieval');
  const effectiveFrom = parseServiceDateValue(root.effectiveFrom);
  const effectiveUntil = parseServiceDateValue(root.effectiveUntil);
  const currencyAgeSeconds = nonNegativeFinite(root.currencyAgeSeconds, 'schedule currency age');
  const exactAge = (Date.parse(capturedAt) - Date.parse(anchorAt)) / 1_000;
  if (lastRetrievedAt < anchorAt || lastRetrievedAt > capturedAt || effectiveFrom > effectiveUntil
    || serviceDate < effectiveFrom || serviceDate > effectiveUntil || currencyAgeSeconds !== exactAge
    || (stale ? currencyAgeSeconds <= 7_200 || currencyAgeSeconds > 86_400 : currencyAgeSeconds > 7_200)) {
    throw new Error('Capture schedule chronology is contradictory');
  }
  const departures = boundedArray(root.departures, MAX_DEPARTURES, parseDeparture, 'capture departures', 1);
  assertUnique(departures.map(({ patternId, occurrenceId }) => `${patternId}\u0000${occurrenceId}`), 'capture departure');
  const common = {
    editionId: identity(root.editionId, 'schedule edition'),
    anchorKind: enumeration(root.anchorKind, ['published', 'first-retrieved'] as const, 'schedule anchor kind'),
    anchorAt, lastRetrievedAt, effectiveFrom, effectiveUntil, currencyAgeSeconds, departures,
  };
  return stale
    ? deepFreeze({ kind: 'stale', ...common, staleCopy: enumeration(root.staleCopy, [STALE_SCHEDULE_DISCLOSURE] as const, 'stale disclosure') })
    : deepFreeze({ kind: 'current', ...common });
}

function parseDeparture(value: unknown): JourneyCaptureDeparture {
  const root = strictRecord(value, ['patternId', 'occurrenceId', 'clockTime', 'evidence', 'timeZone']);
  return deepFreeze({
    patternId: identity(root.patternId, 'departure pattern'), occurrenceId: identity(root.occurrenceId, 'departure occurrence'),
    clockTime: parseClock(root.clockTime), evidence: enumeration(root.evidence, ['scheduled'] as const, 'departure evidence'),
    timeZone: enumeration(root.timeZone, ['America/New_York'] as const, 'departure time zone'),
  });
}

function parseServiceClaim(value: unknown): JourneyCaptureServiceClaim {
  const root = strictRecord(value, ['id', 'scope', 'state', 'consequence', 'lastCheckedAt']);
  return deepFreeze({
    id: identity(root.id, 'service claim'), scope: parseClaimScope(root.scope),
    state: enumeration(root.state, ['normal', 'changed', 'unresolved', 'suspended', 'bypassed', 'closed', 'cancelled'] as const, 'service state'),
    consequence: display(root.consequence, 'service consequence'), lastCheckedAt: exactInstant(root.lastCheckedAt, 'service claim'),
  });
}

function parseEquipmentClaim(value: unknown): JourneyCaptureEquipmentClaim {
  const root = strictRecord(value, ['id', 'equipmentId', 'connectionId', 'pathId', 'observation', 'lastCheckedAt']);
  return deepFreeze({
    id: identity(root.id, 'equipment claim'), equipmentId: identity(root.equipmentId, 'equipment'),
    connectionId: identity(root.connectionId, 'equipment connection'), pathId: identity(root.pathId, 'equipment path'),
    observation: enumeration(root.observation, ['working', 'out-of-service', 'unknown'] as const, 'equipment observation'),
    lastCheckedAt: exactInstant(root.lastCheckedAt, 'equipment claim'),
  });
}

function parseLimitation(value: unknown): JourneyCaptureLimitation {
  const root = strictRecord(value, ['id', 'scope', 'message', 'ownerRecordId', 'lastCheckedAt']);
  return deepFreeze({
    id: identity(root.id, 'limitation'), scope: parseClaimScope(root.scope), message: display(root.message, 'limitation'),
    ownerRecordId: identity(root.ownerRecordId, 'limitation owner'), lastCheckedAt: exactInstant(root.lastCheckedAt, 'limitation'),
  });
}

function parsePatternBoundary(value: unknown) {
  const root = strictRecord(value, ['explanation', 'ownerRecordId', 'verifiedAt']);
  return deepFreeze({
    explanation: display(root.explanation, 'pattern boundary'), ownerRecordId: identity(root.ownerRecordId, 'pattern owner'),
    verifiedAt: exactInstant(root.verifiedAt, 'pattern boundary'),
  });
}

function parseClaimScope(value: unknown): JourneyCaptureClaimScope {
  if (!isRecord(value)) throw new Error('Invalid capture claim scope');
  if (value.kind === 'itinerary') {
    const root = strictRecord(value, ['kind', 'itineraryId']);
    return deepFreeze({ kind: 'itinerary', itineraryId: identity(root.itineraryId, 'claim itinerary') });
  }
  if (value.kind === 'route') {
    const root = strictRecord(value, ['kind', 'routeId']);
    return deepFreeze({ kind: 'route', routeId: identity(root.routeId, 'claim route') });
  }
  if (value.kind === 'direction') {
    const root = strictRecord(value, ['kind', 'routeId', 'direction']);
    return deepFreeze({ kind: 'direction', routeId: identity(root.routeId, 'claim route'), direction: parseDirection(root.direction) });
  }
  if (value.kind === 'pattern') {
    const root = strictRecord(value, ['kind', 'patternId', 'routeId', 'direction']);
    return deepFreeze({
      kind: 'pattern', patternId: identity(root.patternId, 'claim pattern'), routeId: identity(root.routeId, 'claim route'),
      direction: parseDirection(root.direction),
    });
  }
  if (value.kind === 'station') {
    const root = strictRecord(value, ['kind', 'occurrenceId', 'patternId', 'routeId', 'direction']);
    return deepFreeze({
      kind: 'station', occurrenceId: identity(root.occurrenceId, 'claim occurrence'), patternId: identity(root.patternId, 'claim pattern'),
      routeId: identity(root.routeId, 'claim route'), direction: parseDirection(root.direction),
    });
  }
  if (value.kind === 'segment') {
    const root = strictRecord(value, ['kind', 'fromOccurrenceId', 'toOccurrenceId', 'patternId', 'routeId', 'direction']);
    return deepFreeze({
      kind: 'segment', fromOccurrenceId: identity(root.fromOccurrenceId, 'claim segment start'),
      toOccurrenceId: identity(root.toOccurrenceId, 'claim segment end'), patternId: identity(root.patternId, 'claim pattern'),
      routeId: identity(root.routeId, 'claim route'), direction: parseDirection(root.direction),
    });
  }
  throw new Error('Invalid capture claim scope');
}

function validateOwnedScope(
  scope: JourneyCaptureClaimScope,
  itineraryId: string,
  legs: JourneyCaptureItineraryOwner['legs'],
): void {
  if (scope.kind === 'itinerary') {
    if (scope.itineraryId !== itineraryId) throw new Error('Claim belongs to another itinerary');
    return;
  }
  if (scope.kind === 'route') {
    if (!legs.some(({ routeId }) => routeId === scope.routeId)) throw new Error('Claim belongs to another route');
    return;
  }
  const candidates = legs.filter(({ routeId, direction }) => routeId === scope.routeId && direction === scope.direction);
  if (scope.kind === 'direction') {
    if (candidates.length === 0) throw new Error('Claim belongs to another direction');
    return;
  }
  const leg = candidates.find(({ patternId }) => patternId === scope.patternId);
  if (!leg) throw new Error('Claim belongs to another pattern');
  if (scope.kind === 'station' && !leg.orderedOccurrenceIds.includes(scope.occurrenceId)) throw new Error('Claim belongs to another station');
  if (scope.kind === 'segment') {
    const from = leg.orderedOccurrenceIds.indexOf(scope.fromOccurrenceId);
    const to = leg.orderedOccurrenceIds.indexOf(scope.toOccurrenceId);
    if (from < 0 || to <= from) throw new Error('Claim belongs to another segment');
  }
}

function sameScope(left: JourneyCaptureScope, right: JourneyCaptureScope): boolean {
  return left.mode === right.mode && left.originStationId === right.originStationId
    && left.destinationStationId === right.destinationStationId
    && left.accessibleRouteOnly === right.accessibleRouteOnly && left.serviceDate === right.serviceDate;
}

function parseDirection(value: unknown): Direction {
  return enumeration(value, ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'] as const, 'direction');
}

function parseServiceDateValue(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid service date');
  return parseServiceDate(value);
}

function parseClock(value: unknown): string {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Invalid schedule clock');
  return value;
}

function exactInstant(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) throw new Error(`Invalid ${label}`);
  return value;
}

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  return normalizeBoundedIdentity(value, label);
}

function display(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  const normalized = normalizeCanonicalIdentity(value).trim();
  if (!normalized || [...normalized].length > 512 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error(`Invalid ${label}`);
  return normalized;
}

function nonNegativeFinite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`Invalid ${label}`);
  return value;
}

function boundedArray<T>(
  value: unknown,
  maximum: number,
  parse: (candidate: unknown) => T,
  label: string,
  minimum = 0,
): readonly T[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) throw new Error(`Invalid ${label}`);
  return deepFreeze(value.map(parse));
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

function strictRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Invalid journey capture record');
  const keys = Object.keys(value);
  if (required.some((key) => !keys.includes(key)) || keys.some((key) => !required.includes(key) && !optional.includes(key))) {
    throw new Error('Invalid journey capture fields');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function enumeration<const T extends readonly string[]>(value: unknown, options: T, label: string): T[number] {
  if (typeof value !== 'string' || !options.includes(value)) throw new Error(`Invalid ${label}`);
  return value as T[number];
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
