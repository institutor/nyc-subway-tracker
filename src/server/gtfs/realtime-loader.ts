import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { transit_realtime } from 'gtfs-realtime-bindings';

import { decodeNyctFeedHeader } from './nyct-realtime-extensions';
import {
  normalizeRealtimeFeed,
  timestampToDate,
  type RealtimeLoaderContext,
  type RealtimeSnapshot,
} from './realtime-normalizer';
import { acceptSourceEvidence } from './source-evidence';

export type { RealtimeLoaderContext, RealtimeSnapshot } from './realtime-normalizer';

const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;

export function decodeRealtimeSnapshot(
  payload: Uint8Array,
  context: RealtimeLoaderContext,
  previous?: Pick<RealtimeSnapshot, 'feedTimestamp'>,
): RealtimeSnapshot {
  if (!context.feedGroupId?.trim()) throw new Error('Realtime feed-group id is required');
  const sourceEvidence = acceptSourceEvidence(payload, context);
  let feed: transit_realtime.FeedMessage;
  try {
    feed = FeedMessage.decode(payload);
  } catch (error) {
    throw new Error(`Unable to decode GTFS-Realtime protobuf: ${errorMessage(error)}`);
  }
  if (!feed.header) throw new Error('GTFS-Realtime feed header is required');
  if (feed.header.gtfsRealtimeVersion !== '1.0') {
    throw new Error('NYCT subway route feeds require GTFS-Realtime version 1.0');
  }
  if (feed.header.incrementality !== GtfsRealtimeBindings.transit_realtime.FeedHeader.Incrementality.FULL_DATASET) {
    throw new Error('Only FULL_DATASET NYCT subway snapshots are accepted');
  }
  if (!Object.prototype.hasOwnProperty.call(feed.header, 'timestamp')) {
    throw new Error('GTFS-Realtime feed header timestamp is required');
  }
  const feedTimestamp = timestampToDate(feed.header.timestamp!, 'GTFS-Realtime feed header timestamp');
  if (feedTimestamp > sourceEvidence.retrievedAt) throw new Error('GTFS-Realtime feed header timestamp is after retrieval time');
  if (previous && feedTimestamp < previous.feedTimestamp) throw new Error('GTFS-Realtime feed header timestamp regressed');
  let nyctHeader;
  try {
    nyctHeader = decodeNyctFeedHeader(feed.header);
  } catch (error) {
    throw new Error(`Malformed NYCT feed header extension: ${errorMessage(error)}`);
  }
  return normalizeRealtimeFeed(feed, {
    ...sourceEvidence,
    feedGroupId: context.feedGroupId,
    feedTimestamp,
    nyctHeader,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
