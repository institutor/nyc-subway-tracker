import { createHash } from 'node:crypto';

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { transit_realtime } from 'gtfs-realtime-bindings';

import {
  normalizeRealtimeFeed,
  timestampToDate,
  type RealtimeProvenance,
  type RealtimeSnapshot,
} from './realtime-normalizer';

export type { RealtimeSnapshot } from './realtime-normalizer';

const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;

export function decodeRealtimeSnapshot(
  payload: Uint8Array,
  provenance: RealtimeProvenance,
  previous?: Pick<RealtimeSnapshot, 'feedTimestamp'>,
): RealtimeSnapshot {
  let feed: transit_realtime.FeedMessage;
  try {
    feed = FeedMessage.decode(payload);
  } catch (error) {
    throw new Error(`Unable to decode GTFS-Realtime protobuf: ${errorMessage(error)}`);
  }
  return loadDecodedRealtime(feed, provenance, previous, payload);
}

export function decodeRealtimeSnapshotJson(
  payload: unknown,
  provenance: RealtimeProvenance,
  previous?: Pick<RealtimeSnapshot, 'feedTimestamp'>,
): RealtimeSnapshot {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('GTFS-Realtime JSON payload must be an object');
  }
  let feed: transit_realtime.FeedMessage;
  try {
    feed = FeedMessage.fromObject(payload as Record<string, unknown>);
  } catch (error) {
    throw new Error(`Unable to parse GTFS-Realtime JSON: ${errorMessage(error)}`);
  }
  const encoded = FeedMessage.encode(feed).finish();
  return loadDecodedRealtime(feed, provenance, previous, encoded);
}

export function validateFeedHeader(
  feed: transit_realtime.FeedMessage,
  retrievedAt: Date,
  previousFeedTimestamp?: Date,
): Date {
  if (!validDate(retrievedAt)) throw new Error('Realtime retrieval time is invalid');
  if (!feed.header) throw new Error('GTFS-Realtime feed header is required');
  if (feed.header.gtfsRealtimeVersion !== '2.0') {
    throw new Error('Only GTFS-Realtime version 2.0 is accepted');
  }
  if (feed.header.incrementality !== GtfsRealtimeBindings.transit_realtime.FeedHeader.Incrementality.FULL_DATASET) {
    throw new Error('Only FULL_DATASET GTFS-Realtime snapshots are accepted');
  }
  if (!Object.prototype.hasOwnProperty.call(feed.header, 'timestamp')) {
    throw new Error('GTFS-Realtime feed header timestamp is required');
  }
  const feedTimestamp = timestampToDate(feed.header.timestamp!, 'GTFS-Realtime feed header timestamp');
  if (feedTimestamp > retrievedAt) throw new Error('GTFS-Realtime feed header timestamp is after retrieval time');
  if (previousFeedTimestamp && feedTimestamp < previousFeedTimestamp) {
    throw new Error('GTFS-Realtime feed header timestamp regressed');
  }
  return feedTimestamp;
}

export function hashRealtimePayload(payload: Uint8Array): string {
  return `sha256:${createHash('sha256').update(payload).digest('hex')}`;
}

function loadDecodedRealtime(
  feed: transit_realtime.FeedMessage,
  provenance: RealtimeProvenance,
  previous: Pick<RealtimeSnapshot, 'feedTimestamp'> | undefined,
  bytes: Uint8Array,
): RealtimeSnapshot {
  validateProvenance(provenance);
  const feedTimestamp = validateFeedHeader(feed, provenance.retrievedAt, previous?.feedTimestamp);
  return normalizeRealtimeFeed(feed, {
    ...provenance,
    feedTimestamp,
    contentHash: hashRealtimePayload(bytes),
  });
}

function validateProvenance(provenance: RealtimeProvenance): void {
  if (!provenance.sourceId.trim()) throw new Error('Realtime source id is required');
  if (!provenance.feedGroupId.trim()) throw new Error('Realtime feed-group id is required');
  if (!provenance.sourceUrl.trim()) throw new Error('Realtime source URL is required');
  if (!validDate(provenance.retrievedAt)) throw new Error('Realtime retrieval time is invalid');
}

function validDate(value: Date): boolean {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
