import { compareCanonicalIdentity, normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import type { Direction, SavedRecord } from './types';

export interface SavedPromotionDirection {
  readonly routeId: string;
  readonly direction: Direction;
  readonly actualDestination: string;
}

export interface SavedPromotionCandidate {
  readonly complexId: string;
  readonly constituentId: string;
  readonly directions: readonly SavedPromotionDirection[];
  readonly accessibility?: 'eligible' | 'ineligible' | 'unknown';
}

export interface SavedPromotionContext {
  readonly destination?: {
    readonly complexId: string;
    readonly constituentId: string;
  };
}

const nyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function promoteSavedStations(
  rawBaseline: readonly SavedPromotionCandidate[],
  rawRecords: readonly SavedRecord[],
  rawNow: Date,
  rawContext: SavedPromotionContext = {},
): readonly SavedPromotionCandidate[] {
  const nowMs = validInstant(rawNow);
  const baseline = captureBaseline(rawBaseline);
  const records = captureRecords(rawRecords);
  const context = captureContext(rawContext);
  const firstThree = baseline.slice(0, 3);
  const local = newYorkLocal(nowMs);
  const promotedKeys = new Set(
    records
      .filter((record) => record.state === 'active' && recordApplies(record, firstThree, context, local))
      .map((record) => stationKey(record.complexId, record.constituentId)),
  );
  const cohort = firstThree.filter((candidate) => promotedKeys.has(stationKey(candidate.complexId, candidate.constituentId)));
  const remainder = firstThree.filter((candidate) => !promotedKeys.has(stationKey(candidate.complexId, candidate.constituentId)));
  return deepFreeze([...cohort, ...remainder].map(cloneCandidate));
}

function captureBaseline(values: readonly SavedPromotionCandidate[]): SavedPromotionCandidate[] {
  if (!Array.isArray(values) || values.length > 10_000) throw new Error('Invalid saved promotion baseline');
  const captured = values.map((value) => {
    const allowed = value && typeof value === 'object' && 'accessibility' in value
      ? ['complexId', 'constituentId', 'directions', 'accessibility']
      : ['complexId', 'constituentId', 'directions'];
    const record = strictRecord(value, allowed, 'promotion candidate');
    if (!Array.isArray(record.directions) || record.directions.length === 0 || record.directions.length > 256) {
      throw new Error('Invalid promotion directions');
    }
    const directions = record.directions.map((direction) => {
      const row = strictRecord(direction, ['routeId', 'direction', 'actualDestination'], 'promotion direction');
      return {
        routeId: identity(row.routeId, 'promotion route'),
        direction: parseDirection(row.direction),
        actualDestination: display(row.actualDestination, 'promotion destination'),
      };
    });
    const accessibility = record.accessibility === undefined
      ? undefined
      : enumeration(record.accessibility, ['eligible', 'ineligible', 'unknown'] as const, 'promotion accessibility');
    return {
      complexId: identity(record.complexId, 'promotion complex'),
      constituentId: identity(record.constituentId, 'promotion constituent'),
      directions: Object.freeze(directions),
      ...(accessibility === undefined ? {} : { accessibility }),
    };
  });
  assertUnique(captured.map((candidate) => stationKey(candidate.complexId, candidate.constituentId)), 'promotion station');
  return captured;
}

function captureRecords(values: readonly SavedRecord[]): SavedRecord[] {
  if (!Array.isArray(values) || values.length > 512) throw new Error('Invalid saved records');
  const records = values.map((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved record');
    const keys = ['id', 'complexId', 'constituentId', 'routeFilters', 'accessibleRouteOnly', 'state'];
    for (const optional of ['preferredEntrance', 'preferredRide', 'commonDestination', 'timeWindow']) {
      if (optional in value) keys.push(optional);
    }
    const record = strictRecord(value, keys, 'saved record');
    if (!Array.isArray(record.routeFilters) || record.routeFilters.length > 32) throw new Error('Invalid saved route filters');
    const routeFilters = record.routeFilters.map((route) => identity(route, 'saved route'));
    assertUnique(routeFilters, 'saved route');
    if (typeof record.accessibleRouteOnly !== 'boolean') throw new Error('Invalid saved accessibility preference');
    return {
      id: identity(record.id, 'saved record'),
      complexId: identity(record.complexId, 'saved complex'),
      constituentId: identity(record.constituentId, 'saved constituent'),
      ...(record.preferredEntrance === undefined ? {} : { preferredEntrance: capturePreferredEntrance(record.preferredEntrance) }),
      ...(record.preferredRide === undefined ? {} : { preferredRide: capturePreferredRide(record.preferredRide) }),
      routeFilters: Object.freeze(uniqueSorted(routeFilters)),
      accessibleRouteOnly: record.accessibleRouteOnly,
      ...(record.commonDestination === undefined ? {} : { commonDestination: captureStationTuple(record.commonDestination, 'common destination') }),
      ...(record.timeWindow === undefined ? {} : { timeWindow: captureTimeWindow(record.timeWindow) }),
      state: enumeration(record.state, ['active', 'paused'] as const, 'saved state'),
    };
  });
  assertUnique(records.map(({ id }) => id), 'saved record');
  assertUnique(records.map((record) => stationKey(record.complexId, record.constituentId)), 'saved station');
  return records;
}

function capturePreferredEntrance(value: unknown): NonNullable<SavedRecord['preferredEntrance']> {
  const record = strictRecord(value, ['entranceId', 'direction'], 'preferred entrance');
  return { entranceId: identity(record.entranceId, 'preferred entrance'), direction: parseDirection(record.direction) };
}

function capturePreferredRide(value: unknown): NonNullable<SavedRecord['preferredRide']> {
  const record = strictRecord(value, ['direction', 'actualDestination'], 'preferred ride');
  return { direction: parseDirection(record.direction), actualDestination: display(record.actualDestination, 'preferred destination') };
}

function captureStationTuple(value: unknown, label: string): { complexId: string; constituentId: string } {
  const record = strictRecord(value, ['complexId', 'constituentId'], label);
  return { complexId: identity(record.complexId, `${label} complex`), constituentId: identity(record.constituentId, `${label} constituent`) };
}

function captureTimeWindow(value: unknown): NonNullable<SavedRecord['timeWindow']> {
  const record = strictRecord(value, ['weekdays', 'startsAt', 'endsAt'], 'time window');
  if (!Array.isArray(record.weekdays) || record.weekdays.length === 0 || record.weekdays.length > 7) {
    throw new Error('Invalid time window weekdays');
  }
  const weekdays = record.weekdays.map((weekday) => {
    if (!Number.isSafeInteger(weekday) || (weekday as number) < 1 || (weekday as number) > 7) {
      throw new Error('Invalid time window weekday');
    }
    return weekday as number;
  });
  if (new Set(weekdays).size !== weekdays.length) throw new Error('Duplicate time window weekday');
  const startsAt = localTime(record.startsAt);
  const endsAt = localTime(record.endsAt);
  if (startsAt === endsAt) throw new Error('Time window endpoints must differ');
  return { weekdays: Object.freeze([...weekdays].sort((left, right) => left - right)), startsAt, endsAt };
}

function captureContext(value: SavedPromotionContext): SavedPromotionContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid promotion context');
  const keys = 'destination' in value ? ['destination'] : [];
  const record = strictRecord(value, keys, 'promotion context');
  return record.destination === undefined ? {} : { destination: captureStationTuple(record.destination, 'context destination') };
}

function recordApplies(
  record: SavedRecord,
  candidates: readonly SavedPromotionCandidate[],
  context: SavedPromotionContext,
  local: NewYorkLocal,
): boolean {
  const candidate = candidates.find((item) =>
    item.complexId === record.complexId && item.constituentId === record.constituentId);
  if (!candidate) return false;
  if (record.accessibleRouteOnly && candidate.accessibility !== 'eligible') return false;
  if (record.commonDestination) {
    if (!context.destination
      || context.destination.complexId !== record.commonDestination.complexId
      || context.destination.constituentId !== record.commonDestination.constituentId) return false;
  }
  if (record.timeWindow && !withinWindow(record.timeWindow, local)) return false;
  return candidate.directions.some((direction) =>
    (record.routeFilters.length === 0 || record.routeFilters.includes(direction.routeId))
    && (!record.preferredEntrance || record.preferredEntrance.direction === direction.direction)
    && (!record.preferredRide
      || (record.preferredRide.direction === direction.direction
        && record.preferredRide.actualDestination === direction.actualDestination)));
}

interface NewYorkLocal { weekday: number; minutes: number }

function newYorkLocal(instantMs: number): NewYorkLocal {
  const parts = Object.fromEntries(nyFormatter.formatToParts(new Date(instantMs))
    .filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, Number(value)])) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>;
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() || 7;
  return { weekday, minutes: parts.hour * 60 + parts.minute };
}

function withinWindow(window: NonNullable<SavedRecord['timeWindow']>, local: NewYorkLocal): boolean {
  const start = timeMinutes(window.startsAt);
  const end = timeMinutes(window.endsAt);
  if (start < end) return window.weekdays.includes(local.weekday) && local.minutes >= start && local.minutes < end;
  if (local.minutes >= start) return window.weekdays.includes(local.weekday);
  const previousWeekday = local.weekday === 1 ? 7 : local.weekday - 1;
  return local.minutes < end && window.weekdays.includes(previousWeekday);
}

function cloneCandidate(candidate: SavedPromotionCandidate): SavedPromotionCandidate {
  return {
    complexId: candidate.complexId,
    constituentId: candidate.constituentId,
    directions: candidate.directions.map((direction) => ({ ...direction })),
    ...(candidate.accessibility === undefined ? {} : { accessibility: candidate.accessibility }),
  };
}

function stationKey(complexId: string, constituentId: string): string {
  return `${complexId.length}:${complexId}${constituentId.length}:${constituentId}`;
}

function localTime(value: unknown): string {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Invalid time window local time');
  return value;
}

function timeMinutes(value: string): number {
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
}

function validInstant(value: Date): number {
  if (!value || Object.prototype.toString.call(value) !== '[object Date]') throw new Error('Invalid saved ranking instant');
  const epoch = Date.prototype.getTime.call(value);
  if (!Number.isFinite(epoch)) throw new Error('Invalid saved ranking instant');
  return epoch;
}

function strictRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`Invalid ${label}`);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) throw new Error(`Invalid ${label} fields`);
  return value as Record<string, unknown>;
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

function parseDirection(value: unknown): Direction {
  return enumeration(value, ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'] as const, 'direction');
}

function enumeration<const T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`Invalid ${label}`);
  return value as T[number];
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareCanonicalIdentity);
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} identity`);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
