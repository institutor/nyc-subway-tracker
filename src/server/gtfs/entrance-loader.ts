import { canonicalCsvRowIdentity } from './csv-reader';
import type { NormalizedStaticGtfs } from './static-normalizer';

export type EntryPermission = 'entry' | 'exit-only' | 'restricted' | 'unknown';

export interface EntranceCatalogMetadata {
  readonly sourceId: string;
  readonly retrievedAt: Date;
}

export interface ExactEntranceRecord {
  readonly id: string;
  readonly complexId: string;
  readonly complexName: string;
  readonly constituentStationId: string;
  readonly constituentStationName: string;
  readonly gtfsStopIds: readonly string[];
  readonly directionalStopIds: readonly string[];
  readonly routeIds: readonly string[];
  readonly entranceType: string;
  readonly entryPermission: EntryPermission;
  readonly exitAllowed: boolean | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly joinStatus: 'matched' | 'unmatched';
  readonly practicalWalkEvidence: false;
  readonly accessiblePathEvidence: false;
  readonly sourceId: string;
  readonly retrievedAt: string;
}

export interface EntranceConstituentRecord {
  readonly stationId: string;
  readonly name: string;
  readonly gtfsStopIds: readonly string[];
  readonly directionalStopIds: readonly string[];
  readonly entranceIds: readonly string[];
}

export interface EntranceComplexRecord {
  readonly complexId: string;
  readonly name: string;
  readonly constituents: readonly EntranceConstituentRecord[];
  readonly entranceIds: readonly string[];
}

export interface EntranceCatalog {
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly entrances: readonly ExactEntranceRecord[];
  readonly complexes: readonly EntranceComplexRecord[];
}

export function loadEntranceCatalog(
  rawRecords: readonly Readonly<Record<string, unknown>>[],
  staticGtfs: NormalizedStaticGtfs,
  metadata: EntranceCatalogMetadata,
): EntranceCatalog {
  const retrievedAt = validDate(metadata.retrievedAt).toISOString();
  if (!metadata.sourceId) throw new Error('Entrance source identity is required');
  const stopById = new Map(staticGtfs.stops.map((stop) => [stop.stopId, stop]));
  const entrances = rawRecords.map((raw) => {
    const complexId = requiredText(raw, 'complex_id');
    const complexName = requiredText(raw, 'stop_name');
    const constituentStationId = requiredText(raw, 'station_id');
    const constituentStationName = requiredText(raw, 'constituent_station_name');
    const gtfsStopIds = splitIds(requiredText(raw, 'gtfs_stop_id'));
    const latitude = finiteCoordinate(raw.entrance_latitude, 'entrance_latitude', -90, 90);
    const longitude = finiteCoordinate(raw.entrance_longitude, 'entrance_longitude', -180, 180);
    const entranceType = optionalText(raw.entrance_type);
    const entryPermission = parseEntryPermission(raw.entry_allowed, raw.exit_allowed);
    const exitAllowed = parseYesNo(raw.exit_allowed);
    const directionalStopIds = staticGtfs.stops
      .filter(
        (stop) =>
          stop.direction !== 'unknown' &&
          (gtfsStopIds.includes(stop.stopId) || (stop.parentStation !== '' && gtfsStopIds.includes(stop.parentStation))),
      )
      .map((stop) => stop.stopId)
      .sort(compareText);
    const matchedBase = gtfsStopIds.some((stopId) => stopById.has(stopId));
    const identityRow = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, value === null || value === undefined ? '' : String(value)]),
    );
    const rowIdentity = canonicalCsvRowIdentity(identityRow);
    const id = [
      'entrance',
      complexId,
      constituentStationId,
      gtfsStopIds.join('+'),
      latitude.toFixed(7),
      longitude.toFixed(7),
      entranceType,
      rowIdentity,
    ]
      .map((part) => encodeURIComponent(part))
      .join(':');
    return {
      id,
      complexId,
      complexName,
      constituentStationId,
      constituentStationName,
      gtfsStopIds: Object.freeze(gtfsStopIds),
      directionalStopIds: Object.freeze(directionalStopIds),
      routeIds: Object.freeze(splitIds(optionalText(raw.daytime_routes))),
      entranceType,
      entryPermission,
      exitAllowed,
      latitude,
      longitude,
      joinStatus: matchedBase && directionalStopIds.length > 0 ? ('matched' as const) : ('unmatched' as const),
      practicalWalkEvidence: false as const,
      accessiblePathEvidence: false as const,
      sourceId: metadata.sourceId,
      retrievedAt,
    };
  });
  entrances.sort((left, right) => compareText(left.id, right.id));
  validateUnique(entrances.map((entrance) => entrance.id), 'entrance identity');

  const complexes = [...groupBy(entrances, (entrance) => entrance.complexId)].map(([complexId, complexEntrances]) => {
    const constituents = [...groupBy(complexEntrances, (entrance) => entrance.constituentStationId)].map(
      ([stationId, constituentEntrances]) => ({
        stationId,
        name: singleValue(constituentEntrances.map((entrance) => entrance.constituentStationName), 'constituent name'),
        gtfsStopIds: Object.freeze(uniqueSorted(constituentEntrances.flatMap((entrance) => entrance.gtfsStopIds))),
        directionalStopIds: Object.freeze(
          uniqueSorted(constituentEntrances.flatMap((entrance) => entrance.directionalStopIds)),
        ),
        entranceIds: Object.freeze(constituentEntrances.map((entrance) => entrance.id).sort(compareText)),
      }),
    );
    return {
      complexId,
      name: singleValue(complexEntrances.map((entrance) => entrance.complexName), 'complex name'),
      constituents: Object.freeze(constituents.sort((left, right) => compareText(left.stationId, right.stationId))),
      entranceIds: Object.freeze(complexEntrances.map((entrance) => entrance.id).sort(compareText)),
    };
  });

  return deepFreeze({
    sourceId: metadata.sourceId,
    retrievedAt,
    entrances: Object.freeze(entrances),
    complexes: Object.freeze(complexes.sort((left, right) => compareText(left.complexId, right.complexId))),
  });
}

function parseEntryPermission(entry: unknown, exit: unknown): EntryPermission {
  const entryAllowed = parseYesNo(entry);
  const exitAllowed = parseYesNo(exit);
  if (entryAllowed === true) return 'entry';
  if (entryAllowed === false && exitAllowed === true) return 'exit-only';
  if (entryAllowed === false) return 'restricted';
  return 'unknown';
}

function parseYesNo(value: unknown): boolean | null {
  if (typeof value !== 'string') return null;
  if (value.toUpperCase() === 'YES') return true;
  if (value.toUpperCase() === 'NO') return false;
  return null;
}

function requiredText(record: Readonly<Record<string, unknown>>, field: string): string {
  const value = optionalText(record[field]);
  if (!value) throw new Error(`Entrance ${field} is required`);
  return value;
}

function optionalText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function splitIds(value: string): string[] {
  return uniqueSorted(value.split(/[\s,]+/).filter(Boolean));
}

function finiteCoordinate(value: unknown, field: string, minimum: number, maximum: number): number {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value !== '' ? Number(value) : NaN;
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error(`Entrance ${field} must be a valid coordinate`);
  }
  return number;
}

function validDate(value: Date): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('Invalid entrance retrieval time');
  return value;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareText);
}

function validateUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

function singleValue(values: string[], label: string): string {
  const unique = uniqueSorted(values);
  if (unique.length !== 1) throw new Error(`Conflicting ${label}`);
  return unique[0];
}

function groupBy<T>(values: readonly T[], key: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) groups.set(key(value), [...(groups.get(key(value)) ?? []), value]);
  return groups;
}

function compareText(left: string, right: string): number {
  return Buffer.from(left).compare(Buffer.from(right));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
