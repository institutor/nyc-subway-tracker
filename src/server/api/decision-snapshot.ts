import { normalizeBoundedIdentity } from '../../shared/domain/canonical';
import type { NearbyRankingInput } from '../../shared/domain/station-ranking';
import type { BoardDecision, SourceKind } from '../../shared/domain/types';
import type { JourneyGraph } from '../../shared/domain/journey-router';
import type { JourneyCapturePackage } from '../../shared/domain/journey-capture';

export interface SnapshotSourceHealth {
  readonly source: string;
  readonly sourceId: string;
  readonly state: 'current' | 'degraded' | 'unavailable' | 'quarantined';
  readonly assessedAt: string;
  readonly lastAcceptedAt?: string;
  readonly reasonCode?: string;
}

export interface SnapshotProvenance {
  readonly source: string;
  readonly sourceId: string;
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly version?: string;
}

export type NearbySnapshot = Omit<NearbyRankingInput, 'walk' | 'accessibleRouteOnly' | 'locationAccuracyMeters'>;

export interface DecisionSnapshot {
  readonly identity: string;
  readonly sourceHealth: readonly SnapshotSourceHealth[];
  readonly provenance: readonly SnapshotProvenance[];
  readonly nearby?: NearbySnapshot;
  readonly boards?: readonly {
    readonly decision: BoardDecision;
    readonly validThrough: string;
  }[];
  readonly mapOverlays?: readonly MapOverlaySnapshot[];
  readonly journeyGraph?: JourneyGraph;
  readonly journeyCaptures?: readonly JourneyCapturePackage[];
}

export interface MapOverlaySnapshot {
  readonly theme: 'day' | 'night';
  readonly serviceEpoch: string;
  readonly sourceOwners: readonly {
    readonly source: Extract<SourceKind, 'supplemented-gtfs' | 'gtfs-rt' | 'alerts'>;
    readonly sourceId: string;
  }[];
  readonly segments: readonly {
    readonly id: string;
    readonly routeIds: readonly string[];
    readonly state: 'normal' | 'affected' | 'unavailable';
    readonly alertIds: readonly string[];
  }[];
}

export interface DecisionSnapshotProvider {
  capture(): DecisionSnapshot;
}

export function captureDecisionSnapshot(provider: DecisionSnapshotProvider): DecisionSnapshot {
  const captured = provider.capture();
  if (!captured || typeof captured !== 'object' || Array.isArray(captured)) throw new Error('Decision snapshot is unavailable');
  const detached = structuredClone(captured);
  normalizeBoundedIdentity(detached.identity, 'decision snapshot', 128);
  if (!Array.isArray(detached.sourceHealth) || !Array.isArray(detached.provenance)) throw new Error('Decision snapshot evidence is invalid');
  return deepFreeze(detached);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
