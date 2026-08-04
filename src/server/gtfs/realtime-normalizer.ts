import { createHash } from 'node:crypto';

import type { transit_realtime } from 'gtfs-realtime-bindings';

import {
  decodeNyctStopTimeUpdate,
  decodeNyctTripDescriptor,
  type NyctFeedHeaderEvidence,
  type NyctTripDescriptorEvidence,
} from './nyct-realtime-extensions';
import type { AcceptedSourceEvidence, RawSourceEvidence } from './source-evidence';
import type { SourceProvenance } from '../data/fetch-source';

export interface RealtimeLoaderContext {
  readonly feedGroupId: string;
  readonly provenance: SourceProvenance;
}

export interface NormalizedTripDescriptor {
  readonly tripId: string;
  readonly routeId: string | null;
  readonly directionId: number | null;
  readonly startDate: string | null;
  readonly startTime: string | null;
  readonly nyct: NyctTripDescriptorEvidence;
}

export interface NormalizedStopCall {
  readonly remainingOrder: number;
  readonly sourceStopSequence: number | null;
  readonly stopId: string;
  readonly arrivalTime: Date | null;
  readonly departureTime: Date | null;
  readonly scheduleRelationship: string | null;
  readonly scheduledTrack: string | null;
  readonly actualTrack: string | null;
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
  readonly evidenceId: string;
  readonly trainInstanceId: string;
  readonly trip: NormalizedTripDescriptor;
  readonly updateTimestamp: Date | null;
  readonly remainingStopCalls: readonly NormalizedStopCall[];
  readonly vehicleProgress: NormalizedVehicleProgress | null;
}

export interface NormalizedVehiclePosition extends NormalizedVehicleProgress {
  readonly evidenceId: string;
  readonly trainInstanceId: string;
  readonly trip: NormalizedTripDescriptor;
}

export interface EmbeddedTrainAlert {
  readonly id: string;
  readonly evidenceId: string;
  readonly kind: 'train-delay';
  readonly officialText: string;
  readonly rawOfficialText: string;
  readonly language: string | null;
  readonly effect: string | null;
  readonly activePeriods: readonly { startsAt: Date | null; endsAt: Date | null }[];
  readonly informedTrips: readonly NormalizedTripDescriptor[];
}

export interface RealtimeSnapshot {
  readonly sourceId: string;
  readonly feedGroupId: string;
  readonly sourceUrl: string;
  readonly retrievedAt: Date;
  readonly provenance: Readonly<SourceProvenance>;
  readonly rawEvidence: RawSourceEvidence;
  readonly gtfsRealtimeVersion: '1.0';
  readonly nyctSubwayVersion: '1.0';
  readonly incrementality: 'FULL_DATASET';
  readonly feedTimestamp: Date;
  readonly contentHash: string;
  readonly entityCount: number;
  readonly coveredRouteIds: readonly string[];
  readonly tripReplacementPeriods: NyctFeedHeaderEvidence['tripReplacementPeriods'];
  readonly tripUpdates: readonly NormalizedTripUpdate[];
  readonly vehiclePositions: readonly NormalizedVehiclePosition[];
  readonly embeddedTrainAlerts: readonly EmbeddedTrainAlert[];
}

interface NormalizeRealtimeInput extends AcceptedSourceEvidence {
  readonly feedGroupId: string;
  readonly feedTimestamp: Date;
  readonly nyctHeader: NyctFeedHeaderEvidence;
}

interface PreliminaryTripUpdate extends Omit<NormalizedTripUpdate, 'vehicleProgress'> {
  vehicleProgress: NormalizedVehicleProgress | null;
}

export function normalizeRealtimeFeed(
  feed: transit_realtime.FeedMessage,
  input: NormalizeRealtimeInput,
): RealtimeSnapshot {
  const entityIds = new Set<string>();
  const tripEntities: Array<{ entityId: string; update: transit_realtime.ITripUpdate }> = [];
  const vehicleEntities: Array<{ entityId: string; vehicle: transit_realtime.IVehiclePosition }> = [];
  const alertEntities: Array<{ entityId: string; alert: transit_realtime.IAlert }> = [];

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
    else if (entity.alert) alertEntities.push({ entityId, alert: entity.alert });
    else throw new Error(`NYCT route-feed entity ${entityId} has an unsupported payload`);
  }

  const tripUpdates: PreliminaryTripUpdate[] = tripEntities.map(({ entityId, update }) =>
    normalizeTripUpdate(entityId, update, input));
  const identities = new Set<string>();
  for (const update of tripUpdates) {
    if (identities.has(update.trainInstanceId)) throw new Error(`Duplicate normalized train instance ${update.trainInstanceId}`);
    identities.add(update.trainInstanceId);
  }

  const vehiclePositions = vehicleEntities.map(({ entityId, vehicle }) => normalizeVehicle(entityId, vehicle, input));
  for (const vehicle of vehiclePositions) {
    const sameTripId = tripUpdates.filter((update) => update.trip.tripId === vehicle.trip.tripId);
    const compatible = sameTripId.filter((update) => descriptorsCompatible(update.trip, vehicle.trip));
    if (compatible.length > 1) throw new Error(`Vehicle entity ${vehicle.entityId} has ambiguous vehicle trip descriptor`);
    if (compatible.length === 0) {
      if (sameTripId.length > 0) throw new Error(`Vehicle entity ${vehicle.entityId} has contradictory vehicle trip descriptor`);
      throw new Error(`Vehicle entity ${vehicle.entityId} has no matching trip update`);
    }
    if (compatible[0].vehicleProgress !== null) {
      throw new Error(`Train instance ${compatible[0].trainInstanceId} has duplicate vehicle progress`);
    }
    compatible[0].vehicleProgress = withoutTrip(vehicle);
  }

  const embeddedTrainAlerts = alertEntities.map(({ entityId, alert }) => normalizeEmbeddedAlert(entityId, alert, input));
  const coveredRouteIds = [...new Set([
    ...tripUpdates.map((item) => item.trip.routeId),
    ...vehiclePositions.map((item) => item.trip.routeId),
    ...embeddedTrainAlerts.flatMap((item) => item.informedTrips.map((trip) => trip.routeId)),
  ].filter((value): value is string => value !== null))].sort(compareText);

  return deepFreeze({
    sourceId: input.provenance.sourceId,
    feedGroupId: input.feedGroupId,
    sourceUrl: input.provenance.sourceUrl,
    retrievedAt: new Date(input.retrievedAt),
    provenance: input.provenance,
    rawEvidence: input.rawEvidence,
    gtfsRealtimeVersion: '1.0' as const,
    nyctSubwayVersion: '1.0' as const,
    incrementality: 'FULL_DATASET' as const,
    feedTimestamp: new Date(input.feedTimestamp),
    contentHash: input.rawEvidence.evidenceId,
    entityCount: feed.entity.length,
    coveredRouteIds,
    tripReplacementPeriods: input.nyctHeader.tripReplacementPeriods,
    tripUpdates: tripUpdates.map((update) => Object.freeze({ ...update })),
    vehiclePositions,
    embeddedTrainAlerts,
  });
}

function normalizeTripUpdate(
  entityId: string,
  update: transit_realtime.ITripUpdate,
  input: NormalizeRealtimeInput,
): PreliminaryTripUpdate {
  if (!update.trip) throw new Error(`Trip update ${entityId} requires a trip descriptor`);
  const trip = normalizeTripDescriptor(update.trip, `Trip update ${entityId}`);
  const updates = update.stopTimeUpdate ?? [];
  if (updates.length === 0) throw new Error(`Trip update ${entityId} requires remaining stop-time updates`);
  const remainingStopCalls = updates.map((call, index) => {
    const label = `Trip update ${entityId} stop ${index + 1}`;
    const stopId = requiredText(call.stopId, `${label} id`);
    const arrivalTime = normalizeEventTime(call.arrival, `${label} arrival`);
    const departureTime = normalizeEventTime(call.departure, `${label} departure`);
    if (!arrivalTime && !departureTime) throw new Error(`${label} requires an absolute event time`);
    if (arrivalTime && departureTime && departureTime < arrivalTime) throw new Error(`${label} departure precedes arrival`);
    const nyct = decodeNyctStopTimeUpdate(call, label);
    if (index > 0 && nyct.actualTrack !== null) throw new Error(`${label} has actual track outside the first remaining stop`);
    return Object.freeze({
      remainingOrder: index,
      sourceStopSequence: own(call, 'stopSequence') ? positiveInteger(call.stopSequence, `${label} source sequence`) : null,
      stopId,
      arrivalTime,
      departureTime,
      scheduleRelationship: own(call, 'scheduleRelationship')
        ? enumName({ 0: 'SCHEDULED', 1: 'SKIPPED', 2: 'NO_DATA', 3: 'UNSCHEDULED' } as const, call.scheduleRelationship!)
        : null,
      scheduledTrack: nyct.scheduledTrack,
      actualTrack: nyct.actualTrack,
    });
  });
  const updateTimestamp = own(update, 'timestamp')
    ? sourceTimestamp(update.timestamp!, `Trip update timestamp for entity ${entityId}`, input)
    : null;
  return {
    entityId,
    evidenceId: input.rawEvidence.evidenceId,
    trainInstanceId: canonicalTrainInstanceId(trip),
    trip,
    updateTimestamp,
    remainingStopCalls: Object.freeze(remainingStopCalls),
    vehicleProgress: null,
  };
}

function normalizeVehicle(
  entityId: string,
  vehicle: transit_realtime.IVehiclePosition,
  input: NormalizeRealtimeInput,
): NormalizedVehiclePosition {
  if (!vehicle.trip) throw new Error(`Vehicle entity ${entityId} requires a trip descriptor`);
  const trip = normalizeTripDescriptor(vehicle.trip, `Vehicle entity ${entityId}`);
  const status = own(vehicle, 'currentStatus')
    ? enumName({ 0: 'INCOMING_AT', 1: 'STOPPED_AT', 2: 'IN_TRANSIT_TO' } as const, vehicle.currentStatus!)
    : 'UNKNOWN';
  if (status === null) throw new Error(`Vehicle entity ${entityId} has invalid current status`);
  return Object.freeze({
    entityId,
    evidenceId: input.rawEvidence.evidenceId,
    trainInstanceId: canonicalTrainInstanceId(trip),
    trip,
    vehicleId: optionalText(vehicle.vehicle?.id),
    currentStopSequence: own(vehicle, 'currentStopSequence')
      ? positiveInteger(vehicle.currentStopSequence, `Vehicle entity ${entityId} current stop sequence`)
      : null,
    stopId: optionalText(vehicle.stopId),
    currentStatus: status,
    movementTimestamp: own(vehicle, 'timestamp')
      ? sourceTimestamp(vehicle.timestamp!, `Vehicle movement timestamp for entity ${entityId}`, input)
      : null,
  });
}

function normalizeEmbeddedAlert(
  id: string,
  alert: transit_realtime.IAlert,
  input: NormalizeRealtimeInput,
): EmbeddedTrainAlert {
  const selected = selectTranslation(alert.headerText);
  if (!selected) throw new Error(`Embedded alert ${id} requires official header text`);
  const officialText = plainText(selected.text);
  if (officialText.toLocaleLowerCase('en-US') !== 'train delayed') {
    throw new Error(`Embedded alert ${id} is not the official Train delayed alert`);
  }
  const informedTrips = (alert.informedEntity ?? []).map((scope, index) => {
    if (!scope.trip || scope.agencyId || scope.routeId || scope.stopId || own(scope, 'directionId')) {
      throw new Error(`Embedded alert ${id} scope ${index + 1} must contain only a trip descriptor`);
    }
    return normalizeTripDescriptor(scope.trip, `Embedded alert ${id} trip ${index + 1}`);
  });
  if (informedTrips.length === 0) throw new Error(`Embedded alert ${id} requires an informed trip`);
  const scopeIds = new Set<string>();
  for (const trip of informedTrips) {
    const identity = canonicalTrainInstanceId(trip);
    if (scopeIds.has(identity)) throw new Error(`Embedded alert ${id} has duplicate informed trip scope`);
    scopeIds.add(identity);
  }
  const activePeriods = (alert.activePeriod ?? []).map((period, index) => {
    const startsAt = own(period, 'start') ? timestampToDate(period.start!, `Embedded alert ${id} period ${index + 1} start`) : null;
    const endsAt = own(period, 'end') ? timestampToDate(period.end!, `Embedded alert ${id} period ${index + 1} end`) : null;
    if (startsAt && endsAt && endsAt < startsAt) throw new Error(`Embedded alert ${id} active period ends before start`);
    return Object.freeze({ startsAt, endsAt });
  });
  const effect = own(alert, 'effect')
    ? alertEnumName(alert.effect!, (value) => GtfsRealtimeBindingsProxy.effect(value))
    : null;
  return Object.freeze({
    id,
    evidenceId: input.rawEvidence.evidenceId,
    kind: 'train-delay' as const,
    officialText,
    rawOfficialText: selected.text,
    language: selected.language,
    effect,
    activePeriods: Object.freeze(activePeriods),
    informedTrips: Object.freeze(informedTrips),
  });
}

export function normalizeTripDescriptor(
  trip: transit_realtime.ITripDescriptor,
  label: string,
): NormalizedTripDescriptor {
  const directionId = own(trip, 'directionId') ? integer(trip.directionId!, `${label} direction id`) : null;
  if (directionId !== null && directionId !== 0 && directionId !== 1) throw new Error(`${label} direction id must be 0 or 1`);
  const startDate = optionalText(trip.startDate);
  if (startDate !== null) validateServiceDate(startDate, label);
  const startTime = optionalText(trip.startTime);
  if (startTime !== null && !/^\d{2,3}:[0-5]\d:[0-5]\d$/.test(startTime)) {
    throw new Error(`${label} has invalid GTFS start time`);
  }
  return Object.freeze({
    tripId: requiredText(trip.tripId, `${label} trip id`),
    routeId: optionalText(trip.routeId),
    directionId,
    startDate,
    startTime,
    nyct: decodeNyctTripDescriptor(trip, label),
  });
}

function validateServiceDate(value: string, label: string): void {
  if (!/^\d{8}$/.test(value)) throw new Error(`${label} has invalid Gregorian service date`);
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`${label} has invalid Gregorian service date`);
  }
}

function canonicalTrainInstanceId(trip: NormalizedTripDescriptor): string {
  const canonical = JSON.stringify({
    tripId: trip.tripId,
    routeId: trip.routeId,
    startDate: trip.startDate,
    startTime: trip.startTime,
    directionId: trip.directionId,
    nyctDirection: trip.nyct.direction,
    nyctTrainId: trip.nyct.trainId,
    isAssigned: trip.nyct.isAssigned,
  });
  return `nyct-train:sha256:${createHash('sha256').update(canonical).digest('hex')}`;
}

function descriptorsCompatible(left: NormalizedTripDescriptor, right: NormalizedTripDescriptor): boolean {
  const pairs: ReadonlyArray<readonly [unknown, unknown]> = [
    [left.tripId, right.tripId], [left.routeId, right.routeId], [left.startDate, right.startDate],
    [left.startTime, right.startTime], [left.directionId, right.directionId],
    [left.nyct.direction, right.nyct.direction], [left.nyct.trainId, right.nyct.trainId],
    [left.nyct.isAssigned, right.nyct.isAssigned],
  ];
  return pairs.every(([a, b]) => a === null || b === null || a === b);
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

function sourceTimestamp(
  value: number | { toString(): string },
  label: string,
  input: NormalizeRealtimeInput,
): Date {
  const date = timestampToDate(value, label);
  if (date > input.feedTimestamp) throw new Error(`${label} is after feed header timestamp`);
  if (date > input.retrievedAt) throw new Error(`${label} is after accepted retrieval time`);
  return date;
}

function normalizeEventTime(event: transit_realtime.TripUpdate.IStopTimeEvent | null | undefined, label: string): Date | null {
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

function selectTranslation(value: transit_realtime.ITranslatedString | null | undefined): { text: string; language: string | null } | null {
  const translations = value?.translation ?? [];
  const selected = translations.find((item) => item.text?.trim() && item.language?.toLowerCase().startsWith('en'))
    ?? translations.find((item) => item.text?.trim());
  return selected?.text?.trim() ? { text: selected.text, language: optionalText(selected.language) } : null;
}

function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}

const GtfsRealtimeBindingsProxy = {
  effect(value: number): string | null {
    const effects: Record<number, string> = {
      1: 'NO_SERVICE', 2: 'REDUCED_SERVICE', 3: 'SIGNIFICANT_DELAYS', 4: 'DETOUR', 5: 'ADDITIONAL_SERVICE',
      6: 'MODIFIED_SERVICE', 7: 'OTHER_EFFECT', 8: 'UNKNOWN_EFFECT', 9: 'STOP_MOVED', 10: 'NO_EFFECT',
      11: 'ACCESSIBILITY_ISSUE',
    };
    return effects[value] ?? null;
  },
};

function alertEnumName(value: number, lookup: (value: number) => string | null): string | null {
  return lookup(value);
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

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'en-US');
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}
