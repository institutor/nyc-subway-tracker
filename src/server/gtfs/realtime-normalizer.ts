import type { transit_realtime } from 'gtfs-realtime-bindings';

export interface RealtimeProvenance {
  readonly sourceId: string;
  readonly feedGroupId: string;
  readonly sourceUrl: string;
  readonly retrievedAt: Date;
}

export interface NormalizedTripDescriptor {
  readonly tripId: string;
  readonly routeId: string | null;
  readonly directionId: number | null;
  readonly startDate: string | null;
  readonly startTime: string | null;
}

export interface NormalizedStopCall {
  readonly stopId: string;
  readonly stopSequence: number;
  readonly arrivalTime: Date | null;
  readonly departureTime: Date | null;
  readonly scheduleRelationship: string | null;
}

export interface NormalizedVehicleProgress {
  readonly entityId: string;
  readonly vehicleId: string | null;
  readonly currentStopSequence: number | null;
  readonly stopId: string | null;
  readonly currentStatus: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO' | 'UNKNOWN';
  readonly movementTimestamp: Date | null;
}

export interface NormalizedTripUpdate {
  readonly entityId: string;
  readonly trip: NormalizedTripDescriptor;
  readonly updateTimestamp: Date | null;
  readonly futureStopCalls: readonly NormalizedStopCall[];
  readonly vehicleProgress: NormalizedVehicleProgress | null;
}

export interface NormalizedVehiclePosition extends NormalizedVehicleProgress {
  readonly trip: NormalizedTripDescriptor;
}

export interface RealtimeSnapshot extends RealtimeProvenance {
  readonly gtfsRealtimeVersion: '2.0';
  readonly incrementality: 'FULL_DATASET';
  readonly feedTimestamp: Date;
  readonly contentHash: string;
  readonly entityCount: number;
  readonly coveredRouteIds: readonly string[];
  readonly tripUpdates: readonly NormalizedTripUpdate[];
  readonly vehiclePositions: readonly NormalizedVehiclePosition[];
}

interface NormalizeRealtimeInput extends RealtimeProvenance {
  readonly feedTimestamp: Date;
  readonly contentHash: string;
}

export function normalizeRealtimeFeed(
  feed: transit_realtime.FeedMessage,
  input: NormalizeRealtimeInput,
): RealtimeSnapshot {
  const entityIds = new Set<string>();
  const tripEntities: Array<{ entityId: string; update: transit_realtime.ITripUpdate }> = [];
  const vehicleEntities: Array<{ entityId: string; vehicle: transit_realtime.IVehiclePosition }> = [];

  for (const entity of feed.entity) {
    const entityId = requiredText(entity.id, 'GTFS-Realtime entity id');
    if (entityIds.has(entityId)) throw new Error(`Duplicate entity id ${entityId}`);
    entityIds.add(entityId);
    if (entity.isDeleted) throw new Error(`Full-dataset entity ${entityId} cannot be deleted`);

    const payloads = [entity.tripUpdate, entity.vehicle, entity.alert, entity.shape, entity.stop, entity.tripModifications]
      .filter((value) => value != null);
    if (payloads.length !== 1) throw new Error(`Entity ${entityId} must contain exactly one payload`);
    if (entity.tripUpdate) tripEntities.push({ entityId, update: entity.tripUpdate });
    else if (entity.vehicle) vehicleEntities.push({ entityId, vehicle: entity.vehicle });
    else throw new Error(`Realtime feed entity ${entityId} is not a trip update or vehicle position`);
  }

  const vehiclePositions = vehicleEntities.map(({ entityId, vehicle }) => normalizeVehicle(entityId, vehicle));
  const tripUpdates = tripEntities.map(({ entityId, update }) => {
    if (!update.trip) throw new Error(`Trip update ${entityId} requires a trip descriptor`);
    const trip = normalizeTripDescriptor(update.trip, `Trip update ${entityId}`);
    const stopTimeUpdates = update.stopTimeUpdate ?? [];
    if (stopTimeUpdates.length === 0) throw new Error(`Trip update ${entityId} requires stop-time updates`);
    let lastSequence = 0;
    const allCalls = stopTimeUpdates.map((call, index) => {
      const stopId = requiredText(call.stopId, `Trip update ${entityId} stop ${index + 1} id`);
      const stopSequence = own(call, 'stopSequence')
        ? positiveInteger(call.stopSequence, `Trip update ${entityId} stop ${stopId} sequence`)
        : fail(`Trip update ${entityId} stop ${stopId} requires stop sequence`);
      if (stopSequence <= lastSequence) {
        throw new Error(`Trip update ${entityId} stop sequence must be strictly increasing`);
      }
      lastSequence = stopSequence;
      const arrivalTime = normalizeEventTime(call.arrival, `Trip update ${entityId} stop ${stopId} arrival`);
      const departureTime = normalizeEventTime(call.departure, `Trip update ${entityId} stop ${stopId} departure`);
      if (!arrivalTime && !departureTime) throw new Error(`Trip update ${entityId} stop ${stopId} requires an absolute event time`);
      if (arrivalTime && departureTime && departureTime < arrivalTime) {
        throw new Error(`Trip update ${entityId} stop ${stopId} departure precedes arrival`);
      }
      return Object.freeze({
        stopId,
        stopSequence,
        arrivalTime,
        departureTime,
        scheduleRelationship: own(call, 'scheduleRelationship')
          ? enumName(transitScheduleRelationship, call.scheduleRelationship!)
          : null,
      });
    });
    const futureStopCalls = allCalls.filter((call) => {
      const latest = call.departureTime ?? call.arrivalTime;
      return latest !== null && latest >= input.feedTimestamp;
    });
    const matching = vehiclePositions.filter((position) => position.trip.tripId === trip.tripId);
    for (const candidate of matching) assertCompatibleTrip(trip, candidate.trip, entityId);
    if (matching.length > 1) throw new Error(`Trip update ${entityId} has ambiguous vehicle progress`);

    return Object.freeze({
      entityId,
      trip,
      updateTimestamp: own(update, 'timestamp')
        ? timestampToDate(update.timestamp!, `Trip update ${entityId} timestamp`)
        : null,
      futureStopCalls: Object.freeze(futureStopCalls),
      vehicleProgress: matching[0] ? withoutTrip(matching[0]) : null,
    });
  });

  const coveredRouteIds = [...new Set([
    ...tripUpdates.map((item) => item.trip.routeId),
    ...vehiclePositions.map((item) => item.trip.routeId),
  ].filter((value): value is string => value !== null))].sort(compareText);

  return deepFreeze({
    sourceId: input.sourceId,
    feedGroupId: input.feedGroupId,
    sourceUrl: input.sourceUrl,
    retrievedAt: new Date(input.retrievedAt),
    gtfsRealtimeVersion: '2.0' as const,
    incrementality: 'FULL_DATASET' as const,
    feedTimestamp: new Date(input.feedTimestamp),
    contentHash: input.contentHash,
    entityCount: feed.entity.length,
    coveredRouteIds,
    tripUpdates,
    vehiclePositions,
  });
}

const transitScheduleRelationship = {
  0: 'SCHEDULED', 1: 'SKIPPED', 2: 'NO_DATA', 3: 'UNSCHEDULED',
} as const;

function normalizeVehicle(entityId: string, vehicle: transit_realtime.IVehiclePosition): NormalizedVehiclePosition {
  if (!vehicle.trip) throw new Error(`Vehicle entity ${entityId} requires a trip descriptor`);
  const trip = normalizeTripDescriptor(vehicle.trip, `Vehicle entity ${entityId}`);
  const status = own(vehicle, 'currentStatus')
    ? enumName({ 0: 'INCOMING_AT', 1: 'STOPPED_AT', 2: 'IN_TRANSIT_TO' } as const, vehicle.currentStatus!)
    : 'UNKNOWN';
  if (status === null) throw new Error(`Vehicle entity ${entityId} has invalid current status`);
  return Object.freeze({
    entityId,
    trip,
    vehicleId: optionalText(vehicle.vehicle?.id),
    currentStopSequence: own(vehicle, 'currentStopSequence')
      ? positiveInteger(vehicle.currentStopSequence, `Vehicle entity ${entityId} current stop sequence`)
      : null,
    stopId: optionalText(vehicle.stopId),
    currentStatus: status,
    movementTimestamp: own(vehicle, 'timestamp')
      ? timestampToDate(vehicle.timestamp!, `Vehicle entity ${entityId} movement timestamp`)
      : null,
  });
}

function normalizeTripDescriptor(
  trip: transit_realtime.ITripDescriptor,
  label: string,
): NormalizedTripDescriptor {
  const directionId = own(trip, 'directionId')
    ? integer(trip.directionId!, `${label} direction id`)
    : null;
  if (directionId !== null && directionId !== 0 && directionId !== 1) {
    throw new Error(`${label} direction id must be 0 or 1`);
  }
  const startDate = optionalText(trip.startDate);
  if (startDate !== null && !/^\d{8}$/.test(startDate)) throw new Error(`${label} has invalid start date`);
  const startTime = optionalText(trip.startTime);
  if (startTime !== null && !/^\d{2}:\d{2}:\d{2}$/.test(startTime)) throw new Error(`${label} has invalid start time`);
  return Object.freeze({
    tripId: requiredText(trip.tripId, `${label} trip id`),
    routeId: optionalText(trip.routeId),
    directionId,
    startDate,
    startTime,
  });
}

function assertCompatibleTrip(
  update: NormalizedTripDescriptor,
  vehicle: NormalizedTripDescriptor,
  entityId: string,
): void {
  for (const field of ['routeId', 'directionId', 'startDate', 'startTime'] as const) {
    if (update[field] !== null && vehicle[field] !== null && update[field] !== vehicle[field]) {
      throw new Error(`Trip update ${entityId} has contradictory vehicle trip ${field}`);
    }
  }
}

function withoutTrip(position: NormalizedVehiclePosition): NormalizedVehicleProgress {
  return Object.freeze({
    entityId: position.entityId,
    vehicleId: position.vehicleId,
    currentStopSequence: position.currentStopSequence,
    stopId: position.stopId,
    currentStatus: position.currentStatus,
    movementTimestamp: position.movementTimestamp,
  });
}

function normalizeEventTime(
  event: transit_realtime.TripUpdate.IStopTimeEvent | null | undefined,
  label: string,
): Date | null {
  if (!event) return null;
  if (!own(event, 'time')) throw new Error(`${label} requires an absolute time`);
  return timestampToDate(event.time!, label);
}

export function timestampToDate(value: number | { toString(): string }, label: string): Date {
  const seconds = integer(value, label);
  if (seconds <= 0) throw new Error(`${label} must be a positive Unix timestamp`);
  const milliseconds = seconds * 1000;
  if (!Number.isSafeInteger(milliseconds)) throw new Error(`${label} is outside the supported Date range`);
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) throw new Error(`${label} is invalid`);
  return date;
}

function integer(value: number | { toString(): string }, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value.toString());
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label} must be a safe integer`);
  return parsed;
}

function positiveInteger(value: number | null | undefined, label: string): number {
  const parsed = integer(value ?? Number.NaN, label);
  if (parsed <= 0) throw new Error(`${label} must be positive`);
  return parsed;
}

function requiredText(value: string | null | undefined, label: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function optionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function enumName<T extends Readonly<Record<number, string>>>(values: T, value: number): T[keyof T] | null {
  return values[value as keyof T] ?? null;
}

function own(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function fail(message: string): never {
  throw new Error(message);
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'en-US');
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}
