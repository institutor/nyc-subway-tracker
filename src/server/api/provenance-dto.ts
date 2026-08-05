import { compareCanonicalIdentity } from '../../shared/domain/canonical';
import type { FeedHealthState, SourceKind } from '../../shared/domain/types';
import type { SnapshotProvenance, SnapshotSourceHealth } from './decision-snapshot';

export type PublicSourceKind = SourceKind | 'unavailable';
export type PublicSourceReasonCode =
  | 'SOURCE_CURRENT'
  | 'SOURCE_DEGRADED'
  | 'SOURCE_UNAVAILABLE'
  | 'SOURCE_QUARANTINED';

export interface PublicSourceHandle {
  readonly source: PublicSourceKind;
  readonly sourceId: string;
}

export interface SourceHealthDto extends PublicSourceHandle {
  readonly state: FeedHealthState;
  readonly assessedAt: string;
  readonly lastAcceptedAt?: string;
  readonly reasonCode: PublicSourceReasonCode;
}

export interface ProvenanceDto extends PublicSourceHandle {
  readonly observedAt: string;
  readonly retrievedAt: string;
}

const PUBLIC_SOURCE_REGISTRY: Readonly<Record<string, PublicSourceHandle>> = Object.freeze({
  'regular-subway-gtfs': { source: 'regular-gtfs', sourceId: 'mta-static-schedule' },
  'supplemented-subway-gtfs': { source: 'supplemented-gtfs', sourceId: 'mta-supplemented-schedule' },
  'subway-rt-1234567s': { source: 'gtfs-rt', sourceId: 'mta-realtime-1234567s' },
  'subway-rt-ace': { source: 'gtfs-rt', sourceId: 'mta-realtime-ace' },
  'subway-rt-bdfm': { source: 'gtfs-rt', sourceId: 'mta-realtime-bdfm' },
  'subway-rt-g': { source: 'gtfs-rt', sourceId: 'mta-realtime-g' },
  'subway-rt-jz': { source: 'gtfs-rt', sourceId: 'mta-realtime-jz' },
  'subway-rt-l': { source: 'gtfs-rt', sourceId: 'mta-realtime-l' },
  'subway-rt-nqrw': { source: 'gtfs-rt', sourceId: 'mta-realtime-nqrw' },
  'subway-alerts': { source: 'alerts', sourceId: 'mta-service-alerts' },
  'subway-entrances-i9wp-a4ja': { source: 'entrances', sourceId: 'mta-station-entrances' },
  'station-accessibility-39hk-dx4f': { source: 'entrances', sourceId: 'mta-station-accessibility' },
  'equipment-inventory': { source: 'equipment', sourceId: 'mta-equipment-inventory' },
  'equipment-outages': { source: 'equipment', sourceId: 'mta-equipment-outages' },
  'practical-walk': { source: 'practical-walk', sourceId: 'audited-practical-walk' },
});

const PUBLIC_STATES: readonly FeedHealthState[] = ['current', 'degraded', 'unavailable', 'quarantined'];

export function projectPublicSource(source: unknown, sourceId: unknown): PublicSourceHandle {
  if (typeof sourceId === 'string' && Object.hasOwn(PUBLIC_SOURCE_REGISTRY, sourceId)) {
    const handle = PUBLIC_SOURCE_REGISTRY[sourceId];
    if (handle.source === source) return Object.freeze({ ...handle });
  }
  return Object.freeze({ source: 'unavailable', sourceId: 'source-unavailable' });
}

export function projectPublicProvenance(value: {
  readonly source: unknown;
  readonly sourceId: unknown;
  readonly observedAt: unknown;
  readonly retrievedAt: unknown;
}): ProvenanceDto {
  const handle = projectPublicSource(value.source, value.sourceId);
  return deepFreeze({
    ...handle,
    observedAt: iso(value.observedAt),
    retrievedAt: iso(value.retrievedAt),
  });
}

export function toSourceHealthDtos(values: readonly SnapshotSourceHealth[]): readonly SourceHealthDto[] {
  return deepFreeze(values.map((value) => {
    const handle = projectPublicSource(value.source, value.sourceId);
    const state = handle.source === 'unavailable' || !PUBLIC_STATES.includes(value.state)
      ? 'unavailable'
      : value.state;
    return {
      ...handle,
      state,
      assessedAt: iso(value.assessedAt),
      ...(value.lastAcceptedAt === undefined ? {} : { lastAcceptedAt: iso(value.lastAcceptedAt) }),
      reasonCode: publicReason(state),
    };
  }).sort(compareHealth));
}

export function toProvenanceDtos(values: readonly SnapshotProvenance[]): readonly ProvenanceDto[] {
  return deepFreeze(values.map(projectPublicProvenance).sort(compareProvenance));
}

function publicReason(state: FeedHealthState): PublicSourceReasonCode {
  if (state === 'current') return 'SOURCE_CURRENT';
  if (state === 'degraded') return 'SOURCE_DEGRADED';
  if (state === 'quarantined') return 'SOURCE_QUARANTINED';
  return 'SOURCE_UNAVAILABLE';
}

function compareHealth(left: SourceHealthDto, right: SourceHealthDto): number {
  return compareCanonicalIdentity(left.source, right.source)
    || compareCanonicalIdentity(left.sourceId, right.sourceId)
    || compareCanonicalIdentity(left.assessedAt, right.assessedAt);
}

function compareProvenance(left: ProvenanceDto, right: ProvenanceDto): number {
  return compareCanonicalIdentity(left.source, right.source)
    || compareCanonicalIdentity(left.sourceId, right.sourceId)
    || compareCanonicalIdentity(left.observedAt, right.observedAt)
    || compareCanonicalIdentity(left.retrievedAt, right.retrievedAt);
}

function iso(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== 'string') throw new Error('Invalid source time');
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) throw new Error('Invalid source time');
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
