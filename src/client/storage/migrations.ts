import { compareCanonicalIdentity, normalizeBoundedIdentity, normalizeCanonicalIdentity } from '../../shared/domain/canonical';
import type { Direction, SavedRecord } from '../../shared/domain/types';

const MAX_BYTES = 512 * 1_024;
const MAX_RECORDS = 512;
const MAX_ROUTE_FILTERS = 32;

export interface SavedEnvelopeV2 {
  readonly version: 2;
  readonly records: readonly SavedRecord[];
}

export type SavedEnvelopeDecode =
  | { readonly kind: 'current'; readonly envelope: SavedEnvelopeV2 }
  | { readonly kind: 'migrated'; readonly envelope: SavedEnvelopeV2 }
  | { readonly kind: 'future'; readonly raw: string; readonly version: number }
  | { readonly kind: 'invalid'; readonly raw: string; readonly reason: 'size-limit' | 'invalid-json' | 'invalid-schema' };

export function decodeSavedEnvelope(raw: string): SavedEnvelopeDecode {
  if (typeof raw !== 'string') return Object.freeze({ kind: 'invalid', raw: String(raw), reason: 'invalid-schema' });
  if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) {
    return Object.freeze({ kind: 'invalid', raw, reason: 'size-limit' });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Object.freeze({ kind: 'invalid', raw, reason: 'invalid-json' });
  }
  if (!isPlainRecord(parsed) || typeof parsed.version !== 'number' || !Number.isSafeInteger(parsed.version)) {
    return Object.freeze({ kind: 'invalid', raw, reason: 'invalid-schema' });
  }
  if (parsed.version > 2) return Object.freeze({ kind: 'future', raw, version: parsed.version });
  try {
    if (parsed.version === 2) {
      const root = strictRecord(parsed, ['version', 'records']);
      return deepFreeze({ kind: 'current', envelope: { version: 2, records: parseRecords(root.records, 'v2') } });
    }
    if (parsed.version === 1) {
      const root = strictRecord(parsed, ['version', 'records']);
      return deepFreeze({ kind: 'migrated', envelope: { version: 2, records: parseRecords(root.records, 'v1') } });
    }
  } catch {
    return Object.freeze({ kind: 'invalid', raw, reason: 'invalid-schema' });
  }
  return Object.freeze({ kind: 'invalid', raw, reason: 'invalid-schema' });
}

export function encodeSavedEnvelope(records: readonly SavedRecord[]): string {
  const canonical = parseRecords(records, 'v2');
  const encoded = JSON.stringify({ version: 2, records: canonical });
  if (new TextEncoder().encode(encoded).byteLength > MAX_BYTES) throw new Error('Saved envelope exceeds size limit');
  return encoded;
}

export function canonicalizeSavedRecords(records: readonly SavedRecord[]): readonly SavedRecord[] {
  return parseRecords(records, 'v2');
}

function parseRecords(input: unknown, version: 'v1' | 'v2'): readonly SavedRecord[] {
  if (!Array.isArray(input) || input.length > MAX_RECORDS) throw new Error('Invalid saved record count');
  const records = input.map((value) => parseRecord(value, version));
  assertUnique(records.map(({ id }) => id), 'saved ID');
  assertUnique(records.map(({ complexId, constituentId }) => tuple(complexId, constituentId)), 'saved station');
  records.sort((left, right) =>
    compareCanonicalIdentity(left.complexId, right.complexId)
    || compareCanonicalIdentity(left.constituentId, right.constituentId)
    || compareCanonicalIdentity(left.id, right.id));
  return deepFreeze(records);
}

function parseRecord(value: unknown, version: 'v1' | 'v2'): SavedRecord {
  if (!isPlainRecord(value)) throw new Error('Invalid saved record');
  const required = ['id', 'complexId', 'constituentId', 'routeFilters', 'accessibleRouteOnly', 'state'];
  const optional = version === 'v2'
    ? ['preferredEntrance', 'preferredRide', 'commonDestination', 'timeWindow']
    : [];
  const actual = Object.keys(value);
  if (required.some((key) => !actual.includes(key))
    || actual.some((key) => !required.includes(key) && !optional.includes(key))) throw new Error('Invalid saved record fields');
  if (!Array.isArray(value.routeFilters) || value.routeFilters.length > MAX_ROUTE_FILTERS) throw new Error('Invalid route filters');
  const routeFilters = value.routeFilters.map((route) => identity(route, 'route filter'));
  assertUnique(routeFilters, 'route filter');
  if (typeof value.accessibleRouteOnly !== 'boolean') throw new Error('Invalid accessibility preference');
  const record: SavedRecord = {
    id: identity(value.id, 'saved ID'),
    complexId: identity(value.complexId, 'saved complex'),
    constituentId: identity(value.constituentId, 'saved constituent'),
    ...(value.preferredEntrance === undefined ? {} : { preferredEntrance: preferredEntrance(value.preferredEntrance) }),
    ...(value.preferredRide === undefined ? {} : { preferredRide: preferredRide(value.preferredRide) }),
    routeFilters: Object.freeze([...routeFilters].sort(compareCanonicalIdentity)),
    accessibleRouteOnly: value.accessibleRouteOnly,
    ...(value.commonDestination === undefined ? {} : { commonDestination: stationTuple(value.commonDestination, 'common destination') }),
    ...(value.timeWindow === undefined ? {} : { timeWindow: timeWindow(value.timeWindow) }),
    state: enumeration(value.state, ['active', 'paused'] as const, 'saved state'),
  };
  return deepFreeze(record);
}

function preferredEntrance(value: unknown): NonNullable<SavedRecord['preferredEntrance']> {
  const record = strictRecord(value, ['entranceId', 'direction']);
  return deepFreeze({ entranceId: identity(record.entranceId, 'preferred entrance'), direction: direction(record.direction) });
}

function preferredRide(value: unknown): NonNullable<SavedRecord['preferredRide']> {
  const record = strictRecord(value, ['direction', 'actualDestination']);
  return deepFreeze({ direction: direction(record.direction), actualDestination: display(record.actualDestination, 'actual destination') });
}

function stationTuple(value: unknown, label: string): { readonly complexId: string; readonly constituentId: string } {
  const record = strictRecord(value, ['complexId', 'constituentId']);
  return deepFreeze({ complexId: identity(record.complexId, `${label} complex`), constituentId: identity(record.constituentId, `${label} constituent`) });
}

function timeWindow(value: unknown): NonNullable<SavedRecord['timeWindow']> {
  const record = strictRecord(value, ['weekdays', 'startsAt', 'endsAt']);
  if (!Array.isArray(record.weekdays) || record.weekdays.length === 0 || record.weekdays.length > 7) throw new Error('Invalid weekdays');
  const weekdays = record.weekdays.map((weekday) => {
    if (!Number.isSafeInteger(weekday) || (weekday as number) < 1 || (weekday as number) > 7) throw new Error('Invalid weekday');
    return weekday as number;
  });
  if (new Set(weekdays).size !== weekdays.length) throw new Error('Duplicate weekday');
  const startsAt = clockTime(record.startsAt);
  const endsAt = clockTime(record.endsAt);
  if (startsAt === endsAt) throw new Error('Equal time window');
  return deepFreeze({ weekdays: [...weekdays].sort((left, right) => left - right), startsAt, endsAt });
}

function direction(value: unknown): Direction {
  return enumeration(value, ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'] as const, 'direction');
}

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  return normalizeBoundedIdentity(value, label);
}

function display(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  const normalized = normalizeCanonicalIdentity(value).trim();
  if (!normalized || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error(`Invalid ${label}`);
  return normalized;
}

function clockTime(value: unknown): string {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Invalid clock time');
  return value;
}

function enumeration<const T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`Invalid ${label}`);
  return value as T[number];
}

function tuple(left: string, right: string): string {
  return `${left.length}:${left}${right.length}:${right}`;
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

function strictRecord(value: unknown, exactKeys: readonly string[]): Record<string, unknown> {
  if (!isPlainRecord(value)) throw new Error('Invalid persisted record');
  const keys = Object.keys(value);
  if (keys.length !== exactKeys.length || keys.some((key) => !exactKeys.includes(key))) throw new Error('Unknown persisted field');
  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
