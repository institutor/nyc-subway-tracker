import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { transit_realtime } from 'gtfs-realtime-bindings';

import { hashRealtimePayload, validateFeedHeader } from './realtime-loader';
import { timestampToDate, type NormalizedTripDescriptor } from './realtime-normalizer';

const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;

export interface AlertLoaderContext {
  readonly sourceId: string;
  readonly sourceUrl: string;
  readonly retrievedAt: Date;
}

export interface AlertActivePeriod {
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
}

export interface AlertInformedEntity {
  readonly agencyId: string | null;
  readonly routeId: string | null;
  readonly routeType: number | null;
  readonly stopId: string | null;
  readonly directionId: number | null;
  readonly trip: NormalizedTripDescriptor | null;
}

export interface NormalizedAlert {
  readonly id: string;
  readonly kind: 'train-delay' | 'system';
  readonly officialText: string;
  readonly rawOfficialText: string;
  readonly description: string | null;
  readonly rawDescription: string | null;
  readonly language: string | null;
  readonly cause: string | null;
  readonly effect: string | null;
  readonly activePeriods: readonly AlertActivePeriod[];
  readonly informedEntities: readonly AlertInformedEntity[];
}

export interface AlertSnapshot extends AlertLoaderContext {
  readonly gtfsRealtimeVersion: '2.0';
  readonly incrementality: 'FULL_DATASET';
  readonly feedTimestamp: Date;
  readonly contentHash: string;
  readonly entityCount: number;
  readonly alerts: readonly NormalizedAlert[];
}

export function decodeAlertSnapshot(
  payload: Uint8Array,
  context: AlertLoaderContext,
  previous?: Pick<AlertSnapshot, 'feedTimestamp'>,
): AlertSnapshot {
  let feed: transit_realtime.FeedMessage;
  try {
    feed = FeedMessage.decode(payload);
  } catch (error) {
    throw new Error(`Unable to decode GTFS-Realtime alert protobuf: ${errorMessage(error)}`);
  }
  return normalizeAlertFeed(feed, context, previous, payload);
}

export function decodeAlertSnapshotJson(
  payload: unknown,
  context: AlertLoaderContext,
  previous?: Pick<AlertSnapshot, 'feedTimestamp'>,
): AlertSnapshot {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('GTFS-Realtime alert JSON payload must be an object');
  }
  let feed: transit_realtime.FeedMessage;
  try {
    feed = FeedMessage.fromObject(payload as Record<string, unknown>);
  } catch (error) {
    throw new Error(`Unable to parse GTFS-Realtime alert JSON: ${errorMessage(error)}`);
  }
  const encoded = FeedMessage.encode(feed).finish();
  return normalizeAlertFeed(feed, context, previous, encoded);
}

function normalizeAlertFeed(
  feed: transit_realtime.FeedMessage,
  context: AlertLoaderContext,
  previous: Pick<AlertSnapshot, 'feedTimestamp'> | undefined,
  bytes: Uint8Array,
): AlertSnapshot {
  requireText(context.sourceId, 'Alert source id');
  requireText(context.sourceUrl, 'Alert source URL');
  const feedTimestamp = validateFeedHeader(feed, context.retrievedAt, previous?.feedTimestamp);
  const ids = new Set<string>();
  const alerts = feed.entity.map((entity) => {
    const id = requireText(entity.id, 'Alert entity id');
    if (ids.has(id)) throw new Error(`Duplicate entity id ${id}`);
    ids.add(id);
    if (entity.isDeleted) throw new Error(`Full-dataset alert entity ${id} cannot be deleted`);
    if (!entity.alert || entity.tripUpdate || entity.vehicle || entity.shape || entity.stop || entity.tripModifications) {
      throw new Error(`Alert entity ${id} must contain exactly one alert payload`);
    }
    return normalizeAlert(id, entity.alert);
  });

  return deepFreeze({
    sourceId: context.sourceId,
    sourceUrl: context.sourceUrl,
    retrievedAt: new Date(context.retrievedAt),
    gtfsRealtimeVersion: '2.0' as const,
    incrementality: 'FULL_DATASET' as const,
    feedTimestamp,
    contentHash: hashRealtimePayload(bytes),
    entityCount: feed.entity.length,
    alerts,
  });
}

function normalizeAlert(id: string, alert: transit_realtime.IAlert): NormalizedAlert {
  const header = chooseTranslation(alert.headerText);
  if (!header) throw new Error(`Alert ${id} requires official header text`);
  const description = chooseTranslation(alert.descriptionText);
  const activePeriods = (alert.activePeriod ?? []).map((period, index) => {
    const startsAt = own(period, 'start') ? timestampToDate(period.start!, `Alert ${id} active period ${index + 1} start`) : null;
    const endsAt = own(period, 'end') ? timestampToDate(period.end!, `Alert ${id} active period ${index + 1} end`) : null;
    if (startsAt && endsAt && endsAt < startsAt) throw new Error(`Alert ${id} active period ends before it starts`);
    return Object.freeze({ startsAt, endsAt });
  });
  const informedEntities = (alert.informedEntity ?? []).map((scope, index) => normalizeScope(id, index, scope));
  const cause = own(alert, 'cause') ? alertEnum(GtfsRealtimeBindings.transit_realtime.Alert.Cause, alert.cause!) : null;
  const effect = own(alert, 'effect') ? alertEnum(GtfsRealtimeBindings.transit_realtime.Alert.Effect, alert.effect!) : null;
  const trainScoped = informedEntities.some((scope) => scope.trip !== null);

  return Object.freeze({
    id,
    kind: trainScoped && effect?.includes('DELAY') ? 'train-delay' as const : 'system' as const,
    officialText: plainText(header.text),
    rawOfficialText: header.text,
    description: description ? plainText(description.text) : null,
    rawDescription: description?.text ?? null,
    language: header.language,
    cause,
    effect,
    activePeriods: Object.freeze(activePeriods),
    informedEntities: Object.freeze(informedEntities),
  });
}

function normalizeScope(
  alertId: string,
  index: number,
  scope: transit_realtime.IEntitySelector,
): AlertInformedEntity {
  const routeId = optionalText(scope.routeId);
  const trip = scope.trip ? normalizeAlertTrip(scope.trip, `Alert ${alertId} scope ${index + 1}`) : null;
  const directionId = own(scope, 'directionId')
    ? safeInteger(scope.directionId, `Alert ${alertId} selector direction id`)
    : null;
  if (directionId !== null && directionId !== 0 && directionId !== 1) {
    throw new Error(`Alert ${alertId} selector direction id must be 0 or 1`);
  }
  if (routeId && trip?.routeId && routeId !== trip.routeId) {
    throw new Error(`Alert ${alertId} has contradictory selector and trip route scope`);
  }
  if (directionId !== null && trip && trip.directionId !== null && directionId !== trip.directionId) {
    throw new Error(`Alert ${alertId} has contradictory selector and trip direction scope`);
  }
  return Object.freeze({
    agencyId: optionalText(scope.agencyId),
    routeId,
    routeType: own(scope, 'routeType') ? safeInteger(scope.routeType, `Alert ${alertId} route type`) : null,
    stopId: optionalText(scope.stopId),
    directionId,
    trip,
  });
}

function normalizeAlertTrip(trip: transit_realtime.ITripDescriptor, label: string): NormalizedTripDescriptor {
  const directionId = own(trip, 'directionId') ? safeInteger(trip.directionId, `${label} direction id`) : null;
  if (directionId !== null && directionId !== 0 && directionId !== 1) throw new Error(`${label} direction id must be 0 or 1`);
  return Object.freeze({
    tripId: requireText(trip.tripId, `${label} trip id`),
    routeId: optionalText(trip.routeId),
    directionId,
    startDate: optionalText(trip.startDate),
    startTime: optionalText(trip.startTime),
  });
}

function chooseTranslation(value: transit_realtime.ITranslatedString | null | undefined): { text: string; language: string | null } | null {
  const translations = value?.translation ?? [];
  const selected = translations.find((item) => item.language?.toLowerCase().startsWith('en')) ?? translations[0];
  const text = optionalText(selected?.text);
  return text ? { text, language: optionalText(selected?.language) } : null;
}

function plainText(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeEntities(value: string): string {
  const textarea = globalThis.document?.createElement?.('textarea');
  if (textarea) {
    textarea.innerHTML = value;
    return textarea.value;
  }
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function alertEnum(values: object, value: number): string | null {
  const name = (values as Record<number, unknown>)[value];
  return typeof name === 'string' ? name : null;
}

function safeInteger(value: number | null | undefined, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer`);
  return value!;
}

function requireText(value: string | null | undefined, label: string): string {
  const text = optionalText(value);
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function optionalText(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function own(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}
