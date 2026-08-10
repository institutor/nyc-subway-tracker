import type { Direction } from '../../shared/domain/types';
import type { ScheduleCoverageMask } from '../../shared/domain/schedule-owner';
export { isServiceActive, serviceTimeToInstant } from '../../shared/domain/static-schedule-runtime';
import { canonicalCsvRowIdentity, type ParsedCsv } from './csv-reader';

export type StaticScheduleSource = 'regular-gtfs' | 'supplemented-gtfs';

export interface StaticGtfsLoadOptions {
  readonly source: StaticScheduleSource;
  readonly retrievedAt: Date;
  readonly publishedAt?: Date;
  readonly sourceOrder?: number;
  readonly coverage: readonly ScheduleCoverageMask[];
  readonly wrapper?: Readonly<Record<string, string>>;
}

export interface StaticGtfsEditionCandidate {
  readonly source: StaticScheduleSource;
  readonly canonicalContentId: string;
  readonly retrievedAt: string;
  readonly publishedAt?: string;
  readonly sourceOrder?: number;
  readonly coverage: readonly ScheduleCoverageMask[];
  readonly wrapper: Readonly<Record<string, string>>;
  readonly semanticTables: ReadonlyMap<string, string>;
  readonly data: NormalizedStaticGtfs;
}

interface IdentifiedRow {
  readonly rowIdentity: string;
}

export interface AgencyRecord extends IdentifiedRow {
  readonly agencyId: string;
  readonly name: string;
  readonly timezone: string;
}

export interface RouteRecord extends IdentifiedRow {
  readonly routeId: string;
  readonly agencyId: string;
  readonly shortName: string;
  readonly longName: string;
}

export interface StopRecord extends IdentifiedRow {
  readonly stopId: string;
  readonly name: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationType: string;
  readonly parentStation: string;
  readonly direction: Direction;
}

export interface TripRecord extends IdentifiedRow {
  readonly tripId: string;
  readonly routeId: string;
  readonly serviceId: string;
  readonly headsign: string;
  readonly directionId: string;
  readonly shapeId: string;
}

export interface StopTimeRecord extends IdentifiedRow {
  readonly tripId: string;
  readonly arrivalTime: string;
  readonly departureTime: string;
  readonly arrivalSeconds: number | null;
  readonly departureSeconds: number | null;
  readonly stopId: string;
  readonly stopSequence: number;
}

export interface CalendarRecord extends IdentifiedRow {
  readonly serviceId: string;
  readonly weekdays: readonly boolean[];
  readonly startDate: string;
  readonly endDate: string;
}

export interface CalendarDateRecord extends IdentifiedRow {
  readonly serviceId: string;
  readonly date: string;
  readonly exceptionType: 1 | 2;
}

export interface TransferRecord extends IdentifiedRow {
  readonly fromStopId: string;
  readonly toStopId: string;
  readonly transferType: string;
  readonly minTransferTime: number | null;
}

export interface ShapeRecord extends IdentifiedRow {
  readonly shapeId: string;
  readonly sequence: number;
  readonly latitude: number;
  readonly longitude: number;
}

export interface ServicePattern {
  readonly tripId: string;
  readonly routeId: string;
  readonly direction: Direction;
  readonly headsign: string;
  readonly stopIds: readonly string[];
}

export interface StructuralTransfer {
  readonly fromStopId: string;
  readonly toStopId: string;
  readonly transferType: string;
  readonly minTransferTime: number | null;
  readonly evidenceKind: 'structural-only';
  readonly practicalWalkEvidence: false;
  readonly accessiblePathEvidence: false;
}

export interface StationComplexRecord {
  readonly complexStopId: string;
  readonly name: string;
  readonly directionalStopIds: readonly string[];
}

export interface NormalizedStaticGtfs {
  readonly agencies: readonly AgencyRecord[];
  readonly routes: readonly RouteRecord[];
  readonly stops: readonly StopRecord[];
  readonly trips: readonly TripRecord[];
  readonly stopTimes: readonly StopTimeRecord[];
  readonly calendars: readonly CalendarRecord[];
  readonly calendarDates: readonly CalendarDateRecord[];
  readonly transfers: readonly TransferRecord[];
  readonly shapes: readonly ShapeRecord[];
  readonly servicePatterns: readonly ServicePattern[];
  readonly structuralTransfers: readonly StructuralTransfer[];
  readonly stationComplexes: readonly StationComplexRecord[];
}

export function normalizeGtfsTables(tables: ReadonlyMap<string, ParsedCsv>): NormalizedStaticGtfs {
  const agencies = tableRows(tables, 'agency.txt', ['agency_name', 'agency_timezone']).map((row) => ({
    agencyId: row.agency_id ?? '',
    name: required(row, 'agency_name', 'agency.txt'),
    timezone: required(row, 'agency_timezone', 'agency.txt'),
    rowIdentity: canonicalCsvRowIdentity(row),
  }));
  const routes = tableRows(tables, 'routes.txt', ['route_id']).map((row) => ({
    routeId: required(row, 'route_id', 'routes.txt'),
    agencyId: row.agency_id ?? '',
    shortName: row.route_short_name ?? '',
    longName: row.route_long_name ?? '',
    rowIdentity: canonicalCsvRowIdentity(row),
  }));
  const stops = tableRows(tables, 'stops.txt', ['stop_id', 'stop_name']).map((row) => ({
    stopId: required(row, 'stop_id', 'stops.txt'),
    name: required(row, 'stop_name', 'stops.txt'),
    latitude: optionalNumber(row.stop_lat, 'stop_lat'),
    longitude: optionalNumber(row.stop_lon, 'stop_lon'),
    locationType: row.location_type ?? '',
    parentStation: row.parent_station ?? '',
    direction: inferStopDirection(required(row, 'stop_id', 'stops.txt')),
    rowIdentity: canonicalCsvRowIdentity(row),
  }));
  const trips = tableRows(tables, 'trips.txt', ['route_id', 'service_id', 'trip_id']).map((row) => ({
    routeId: required(row, 'route_id', 'trips.txt'),
    serviceId: required(row, 'service_id', 'trips.txt'),
    tripId: required(row, 'trip_id', 'trips.txt'),
    headsign: row.trip_headsign ?? '',
    directionId: row.direction_id ?? '',
    shapeId: row.shape_id ?? '',
    rowIdentity: canonicalCsvRowIdentity(row),
  }));
  const stopTimes = tableRows(tables, 'stop_times.txt', ['trip_id', 'stop_id', 'stop_sequence']).map((row) => ({
    tripId: required(row, 'trip_id', 'stop_times.txt'),
    arrivalTime: row.arrival_time ?? '',
    departureTime: row.departure_time ?? '',
    arrivalSeconds: parseGtfsTime(row.arrival_time ?? ''),
    departureSeconds: parseGtfsTime(row.departure_time ?? ''),
    stopId: required(row, 'stop_id', 'stop_times.txt'),
    stopSequence: requiredInteger(row, 'stop_sequence', 'stop_times.txt'),
    rowIdentity: canonicalCsvRowIdentity(row),
  }));
  const calendars = optionalTableRows(tables, 'calendar.txt').map((row) => ({
    serviceId: required(row, 'service_id', 'calendar.txt'),
    weekdays: Object.freeze(
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
        (day) => weekdayFlag(row, day),
      ),
    ),
    startDate: requiredDate(row, 'start_date', 'calendar.txt'),
    endDate: requiredDate(row, 'end_date', 'calendar.txt'),
    rowIdentity: canonicalCsvRowIdentity(row),
  }));
  const calendarDates = optionalTableRows(tables, 'calendar_dates.txt').map((row) => {
    const parsedExceptionType = requiredInteger(row, 'exception_type', 'calendar_dates.txt');
    if (parsedExceptionType !== 1 && parsedExceptionType !== 2) {
      throw new Error('calendar_dates.txt exception_type must be 1 or 2');
    }
    const exceptionType: 1 | 2 = parsedExceptionType;
    return {
      serviceId: required(row, 'service_id', 'calendar_dates.txt'),
      date: requiredDate(row, 'date', 'calendar_dates.txt'),
      exceptionType,
      rowIdentity: canonicalCsvRowIdentity(row),
    };
  });
  const transfers = optionalTableRows(tables, 'transfers.txt').map((row) => ({
    fromStopId: required(row, 'from_stop_id', 'transfers.txt'),
    toStopId: required(row, 'to_stop_id', 'transfers.txt'),
    transferType: row.transfer_type ?? '',
    minTransferTime: optionalInteger(row.min_transfer_time, 'min_transfer_time'),
    rowIdentity: canonicalCsvRowIdentity(row),
  }));
  const shapes = optionalTableRows(tables, 'shapes.txt').map((row) => ({
    shapeId: required(row, 'shape_id', 'shapes.txt'),
    latitude: requiredNumber(row, 'shape_pt_lat', 'shapes.txt'),
    longitude: requiredNumber(row, 'shape_pt_lon', 'shapes.txt'),
    sequence: requiredInteger(row, 'shape_pt_sequence', 'shapes.txt'),
    rowIdentity: canonicalCsvRowIdentity(row),
  }));

  validateUnique(agencies, (row) => row.agencyId || row.name, 'agency');
  validateUnique(routes, (row) => row.routeId, 'route_id');
  validateUnique(stops, (row) => row.stopId, 'stop_id');
  validateUnique(trips, (row) => row.tripId, 'trip_id');
  validateUnique(stopTimes, (row) => `${row.tripId}\0${row.stopSequence}`, 'stop_times primary key');
  validateUnique(calendars, (row) => row.serviceId, 'calendar service_id');
  validateUnique(calendarDates, (row) => `${row.serviceId}\0${row.date}`, 'calendar_dates service_id,date');
  for (const calendar of calendars) {
    if (calendar.startDate > calendar.endDate) {
      throw new Error('calendar.txt start_date must not be after end_date');
    }
  }
  validateJoins(routes, stops, trips, stopTimes, transfers);

  const tripById = new Map(trips.map((trip) => [trip.tripId, trip]));
  const servicePatterns = trips.map((trip) => ({
    tripId: trip.tripId,
    routeId: trip.routeId,
    direction: inferTripDirection(trip, stopTimes, stops),
    headsign: trip.headsign,
    stopIds: Object.freeze(
      stopTimes
        .filter((stopTime) => stopTime.tripId === trip.tripId)
        .sort((left, right) => left.stopSequence - right.stopSequence)
        .map((stopTime) => stopTime.stopId),
    ),
  }));
  const structuralTransfers = transfers.map((transfer) => ({
    fromStopId: transfer.fromStopId,
    toStopId: transfer.toStopId,
    transferType: transfer.transferType,
    minTransferTime: transfer.minTransferTime,
    evidenceKind: 'structural-only' as const,
    practicalWalkEvidence: false as const,
    accessiblePathEvidence: false as const,
  }));
  const stationComplexes = stops
    .filter((stop) => stop.locationType === '1')
    .map((complex) => ({
      complexStopId: complex.stopId,
      name: complex.name,
      directionalStopIds: Object.freeze(
        stops
          .filter((stop) => stop.parentStation === complex.stopId && stop.direction !== 'unknown')
          .map((stop) => stop.stopId)
          .sort(compareText),
      ),
    }));

  void tripById;
  return deepFreeze({
    agencies: sortRecords(agencies),
    routes: sortRecords(routes),
    stops: sortRecords(stops),
    trips: sortRecords(trips),
    stopTimes: sortRecords(stopTimes),
    calendars: sortRecords(calendars),
    calendarDates: sortRecords(calendarDates),
    transfers: sortRecords(transfers),
    shapes: sortRecords(shapes),
    servicePatterns: servicePatterns.sort((a, b) => compareText(a.tripId, b.tripId)),
    structuralTransfers: structuralTransfers.sort((a, b) =>
      compareText(`${a.fromStopId}\0${a.toStopId}`, `${b.fromStopId}\0${b.toStopId}`),
    ),
    stationComplexes: stationComplexes.sort((a, b) => compareText(a.complexStopId, b.complexStopId)),
  });
}

export function parseGtfsTime(value: string): number | null {
  if (value === '') return null;
  const match = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid GTFS time: ${value}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (minutes > 59 || seconds > 59) throw new Error(`Invalid GTFS time: ${value}`);
  return hours * 3600 + minutes * 60 + seconds;
}

function tableRows(tables: ReadonlyMap<string, ParsedCsv>, name: string, requiredHeaders: string[]) {
  const table = tables.get(name);
  if (!table) throw new Error(`Missing parsed GTFS table ${name}`);
  for (const header of requiredHeaders) {
    if (!table.headers.includes(header)) throw new Error(`${name} requires ${header}`);
  }
  return table.rows;
}

function optionalTableRows(tables: ReadonlyMap<string, ParsedCsv>, name: string) {
  return tables.get(name)?.rows ?? [];
}

function required(row: Readonly<Record<string, string>>, field: string, table: string): string {
  const value = row[field];
  if (value === undefined || value === '') throw new Error(`${table} ${field} is required`);
  return value;
}

function requiredInteger(row: Readonly<Record<string, string>>, field: string, table: string): number {
  const value = required(row, field, table);
  if (!/^\d+$/.test(value)) throw new Error(`${table} ${field} must be an integer`);
  return Number(value);
}

function optionalInteger(value: string | undefined, field: string): number | null {
  if (value === undefined || value === '') return null;
  if (!/^\d+$/.test(value)) throw new Error(`${field} must be an integer`);
  return Number(value);
}

function requiredNumber(row: Readonly<Record<string, string>>, field: string, table: string): number {
  const value = Number(required(row, field, table));
  if (!Number.isFinite(value)) throw new Error(`${table} ${field} must be a finite number`);
  return value;
}

function optionalNumber(value: string | undefined, field: string): number | null {
  if (value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${field} must be a finite number`);
  return number;
}

function requiredDate(row: Readonly<Record<string, string>>, field: string, table: string): string {
  const value = required(row, field, table);
  assertServiceDate(value);
  return value;
}

function weekdayFlag(row: Readonly<Record<string, string>>, field: string): boolean {
  const value = required(row, field, 'calendar.txt');
  if (value !== '0' && value !== '1') throw new Error(`calendar.txt ${field} must be 0 or 1`);
  return value === '1';
}

function assertServiceDate(value: string): void {
  if (!/^\d{8}$/.test(value)) throw new Error(`Invalid GTFS service date: ${value}`);
  const date = serviceDateToUtcDate(value);
  const reconstructed = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
  if (reconstructed !== value) throw new Error(`Invalid GTFS service date: ${value}`);
}

function serviceDateToUtcDate(value: string): Date {
  return new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8))));
}

function inferStopDirection(stopId: string): Direction {
  if (stopId.endsWith('N')) return 'northbound';
  if (stopId.endsWith('S')) return 'southbound';
  return 'unknown';
}

function inferTripDirection(trip: TripRecord, stopTimes: StopTimeRecord[], stops: StopRecord[]): Direction {
  const stopById = new Map(stops.map((stop) => [stop.stopId, stop]));
  const directions = new Set(
    stopTimes.filter((time) => time.tripId === trip.tripId).map((time) => stopById.get(time.stopId)?.direction ?? 'unknown'),
  );
  directions.delete('unknown');
  if (directions.size === 1) return [...directions][0];
  return 'unknown';
}

function validateJoins(
  routes: RouteRecord[],
  stops: StopRecord[],
  trips: TripRecord[],
  stopTimes: StopTimeRecord[],
  transfers: TransferRecord[],
): void {
  const routeIds = new Set(routes.map((route) => route.routeId));
  const stopIds = new Set(stops.map((stop) => stop.stopId));
  const tripIds = new Set(trips.map((trip) => trip.tripId));
  for (const stop of stops) {
    if (stop.parentStation && !stopIds.has(stop.parentStation)) {
      throw new Error(`stops.txt parent_station ${stop.parentStation} is not present`);
    }
  }
  for (const trip of trips) {
    if (!routeIds.has(trip.routeId)) throw new Error(`trips.txt route_id ${trip.routeId} is not present`);
  }
  for (const stopTime of stopTimes) {
    if (!tripIds.has(stopTime.tripId)) throw new Error(`stop_times.txt trip_id ${stopTime.tripId} is not present`);
    if (!stopIds.has(stopTime.stopId)) throw new Error(`stop_times.txt stop_id ${stopTime.stopId} is not present`);
  }
  for (const transfer of transfers) {
    if (!stopIds.has(transfer.fromStopId)) {
      throw new Error(`transfers.txt from_stop_id ${transfer.fromStopId} is not present`);
    }
    if (!stopIds.has(transfer.toStopId)) {
      throw new Error(`transfers.txt to_stop_id ${transfer.toStopId} is not present`);
    }
  }
}

function validateUnique<T>(rows: T[], identity: (row: T) => string, label: string): void {
  const seen = new Set<string>();
  for (const row of rows) {
    const id = identity(row);
    if (seen.has(id)) throw new Error(`Duplicate GTFS ${label}: ${id}`);
    seen.add(id);
  }
}

function sortRecords<T extends IdentifiedRow>(records: T[]): T[] {
  return records.sort((left, right) => compareText(left.rowIdentity, right.rowIdentity));
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
