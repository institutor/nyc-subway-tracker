import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { transit_realtime } from 'gtfs-realtime-bindings';

import { normalizeTripDescriptor, timestampToDate, type NormalizedTripDescriptor } from './realtime-normalizer';
import {
  acceptSourceEvidence,
  type RawSourceEvidence,
  type SourceLoaderContext,
} from './source-evidence';
import type { SourceProvenance } from '../data/fetch-source';

const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;

export type AlertLoaderContext = SourceLoaderContext;

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
  readonly evidenceId: string;
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

export interface AlertSnapshot {
  readonly sourceId: string;
  readonly sourceUrl: string;
  readonly retrievedAt: Date;
  readonly provenance: Readonly<SourceProvenance>;
  readonly rawEvidence: RawSourceEvidence;
  readonly gtfsRealtimeVersion: '1.0' | '2.0';
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
  const evidence = acceptSourceEvidence(payload, context);
  let feed: transit_realtime.FeedMessage;
  try {
    feed = FeedMessage.decode(payload);
  } catch (error) {
    throw new Error(`Unable to decode GTFS-Realtime alert protobuf: ${errorMessage(error)}`);
  }
  return normalizeAlertFeed(feed, evidence, previous);
}

export function decodeAlertSnapshotJson(
  payload: Uint8Array,
  context: AlertLoaderContext,
  previous?: Pick<AlertSnapshot, 'feedTimestamp'>,
): AlertSnapshot {
  const evidence = acceptSourceEvidence(payload, context);
  let object: unknown;
  try {
    object = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(payload));
  } catch (error) {
    throw new Error(`Unable to parse GTFS-Realtime alert JSON: ${errorMessage(error)}`);
  }
  if (!object || typeof object !== 'object' || Array.isArray(object)) {
    throw new Error('GTFS-Realtime alert JSON payload must be an object');
  }
  let feed: transit_realtime.FeedMessage;
  try {
    feed = FeedMessage.fromObject(object as Record<string, unknown>);
  } catch (error) {
    throw new Error(`Unable to parse GTFS-Realtime alert JSON: ${errorMessage(error)}`);
  }
  return normalizeAlertFeed(feed, evidence, previous);
}

function normalizeAlertFeed(
  feed: transit_realtime.FeedMessage,
  evidence: ReturnType<typeof acceptSourceEvidence>,
  previous: Pick<AlertSnapshot, 'feedTimestamp'> | undefined,
): AlertSnapshot {
  if (!feed.header) throw new Error('GTFS-Realtime alert feed header is required');
  const version = feed.header.gtfsRealtimeVersion;
  if (version !== '1.0' && version !== '2.0') throw new Error(`Unsupported GTFS-Realtime alert version ${version}`);
  if (feed.header.incrementality !== GtfsRealtimeBindings.transit_realtime.FeedHeader.Incrementality.FULL_DATASET) {
    throw new Error('Only FULL_DATASET alert snapshots are accepted');
  }
  if (!own(feed.header, 'timestamp')) throw new Error('GTFS-Realtime alert header timestamp is required');
  const feedTimestamp = timestampToDate(feed.header.timestamp!, 'GTFS-Realtime alert header timestamp');
  if (feedTimestamp > evidence.retrievedAt) throw new Error('GTFS-Realtime alert header timestamp is after retrieval time');
  if (previous && feedTimestamp < previous.feedTimestamp) throw new Error('GTFS-Realtime alert timestamp regressed');

  const ids = new Set<string>();
  const alerts = feed.entity.map((entity) => {
    const id = requiredText(entity.id, 'Alert entity id');
    if (ids.has(id)) throw new Error(`Duplicate entity id ${id}`);
    ids.add(id);
    if (entity.isDeleted) throw new Error(`Full-dataset alert entity ${id} cannot be deleted`);
    if (!entity.alert || entity.tripUpdate || entity.vehicle || entity.shape || entity.stop || entity.tripModifications) {
      throw new Error(`Alert entity ${id} must contain exactly one alert payload`);
    }
    return normalizeAlert(id, entity.alert, evidence.rawEvidence.evidenceId);
  });

  return deepFreeze({
    sourceId: evidence.provenance.sourceId,
    sourceUrl: evidence.provenance.sourceUrl,
    retrievedAt: new Date(evidence.retrievedAt),
    provenance: evidence.provenance,
    rawEvidence: evidence.rawEvidence,
    gtfsRealtimeVersion: version,
    incrementality: 'FULL_DATASET' as const,
    feedTimestamp,
    contentHash: evidence.rawEvidence.evidenceId,
    entityCount: feed.entity.length,
    alerts,
  });
}

function normalizeAlert(id: string, alert: transit_realtime.IAlert, evidenceId: string): NormalizedAlert {
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
  const scopeKeys = new Set<string>();
  for (const scope of informedEntities) {
    const key = JSON.stringify(scope);
    if (scopeKeys.has(key)) throw new Error(`Alert ${id} has duplicate informed-entity scope`);
    scopeKeys.add(key);
  }
  const cause = own(alert, 'cause') ? enumValue(GtfsRealtimeBindings.transit_realtime.Alert.Cause, alert.cause!) : null;
  const effect = own(alert, 'effect') ? enumValue(GtfsRealtimeBindings.transit_realtime.Alert.Effect, alert.effect!) : null;
  const trainScoped = informedEntities.some((scope) => scope.trip !== null);
  return Object.freeze({
    id,
    evidenceId,
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

function normalizeScope(id: string, index: number, scope: transit_realtime.IEntitySelector): AlertInformedEntity {
  const label = `Alert ${id} scope ${index + 1}`;
  const routeId = optionalText(scope.routeId);
  const trip = scope.trip ? normalizeTripDescriptor(scope.trip, `${label} trip`) : null;
  const directionId = own(scope, 'directionId') ? safeInteger(scope.directionId, `${label} direction id`) : null;
  if (directionId !== null && directionId !== 0 && directionId !== 1) throw new Error(`${label} direction id must be 0 or 1`);
  if (routeId && trip?.routeId && routeId !== trip.routeId) throw new Error(`Alert ${id} has contradictory selector and trip route scope`);
  if (directionId !== null && trip && trip.directionId !== null && directionId !== trip.directionId) {
    throw new Error(`Alert ${id} has contradictory selector and trip direction scope`);
  }
  return Object.freeze({
    agencyId: optionalText(scope.agencyId),
    routeId,
    routeType: own(scope, 'routeType') ? safeInteger(scope.routeType, `${label} route type`) : null,
    stopId: optionalText(scope.stopId),
    directionId,
    trip,
  });
}

function chooseTranslation(value: transit_realtime.ITranslatedString | null | undefined): { text: string; language: string | null } | null {
  const translations = value?.translation ?? [];
  const selected = translations.find((item) => item.text?.trim() && item.language?.toLowerCase().startsWith('en'))
    ?? translations.find((item) => item.text?.trim());
  return selected?.text?.trim() ? { text: selected.text, language: optionalText(selected.language) } : null;
}

function plainText(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function enumValue(values: object, value: number): string | null {
  const name = (values as Record<number, unknown>)[value];
  return typeof name === 'string' ? name : null;
}

function safeInteger(value: number | null | undefined, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer`);
  return value!;
}

function requiredText(value: string | null | undefined, label: string): string {
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
