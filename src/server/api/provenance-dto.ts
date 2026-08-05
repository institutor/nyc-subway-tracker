import type { SnapshotProvenance, SnapshotSourceHealth } from './decision-snapshot';

export interface SourceHealthDto {
  readonly source: string;
  readonly sourceId: string;
  readonly state: SnapshotSourceHealth['state'];
  readonly assessedAt: string;
  readonly lastAcceptedAt?: string;
  readonly reasonCode?: string;
}

export interface ProvenanceDto {
  readonly source: string;
  readonly sourceId: string;
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly version?: string;
}

export function toSourceHealthDtos(values: readonly SnapshotSourceHealth[]): readonly SourceHealthDto[] {
  return deepFreeze(values.map((value) => ({
    source: boundedText(value.source),
    sourceId: boundedText(value.sourceId),
    state: value.state,
    assessedAt: iso(value.assessedAt),
    ...(value.lastAcceptedAt === undefined ? {} : { lastAcceptedAt: iso(value.lastAcceptedAt) }),
    ...(value.reasonCode === undefined ? {} : { reasonCode: boundedText(value.reasonCode) }),
  })));
}

export function toProvenanceDtos(values: readonly SnapshotProvenance[]): readonly ProvenanceDto[] {
  return deepFreeze(values.map((value) => ({
    source: boundedText(value.source),
    sourceId: boundedText(value.sourceId),
    observedAt: iso(value.observedAt),
    retrievedAt: iso(value.retrievedAt),
    ...(value.version === undefined ? {} : { version: boundedText(value.version) }),
  })));
}

function iso(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) throw new Error('Invalid source time');
  return value;
}

function boundedText(value: string): string {
  if (typeof value !== 'string' || !value || [...value].length > 256 || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error('Invalid source field');
  return value.normalize('NFC');
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
