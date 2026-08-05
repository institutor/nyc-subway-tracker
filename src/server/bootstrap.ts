import type { ServerConfig } from './config';
import { evaluateExposure, type ExposureEvaluation } from './release/exposure-gates';
import { systemClock, type Clock } from '../shared/domain/clock';
import { createCatalogService, type CatalogInput, type CatalogService } from './services/catalog-service';
import { parseCoordinate, type Coordinate } from '../shared/domain/geo';
import { compareCanonicalIdentity, normalizeBoundedIdentity } from '../shared/domain/canonical';
import type { DecisionSnapshotProvider } from './api/decision-snapshot';
import type { PracticalWalkDecision, PracticalWalkRequest } from './walk/practical-walk-adapter';
import { createMapService, type MapReferencesInput, type MapService } from './services/map-service';

export interface AppDependencies {
  readonly config: ServerConfig;
  readonly clock: Clock;
  readonly exposure: ExposureEvaluation;
  readonly catalog: CatalogService;
  readonly nearbyUniverse: readonly { readonly id: string; readonly coordinate: Coordinate }[];
  readonly walk: (
    request: PracticalWalkRequest,
    options: { readonly signal: AbortSignal },
  ) => Promise<PracticalWalkDecision>;
  readonly snapshotProvider: DecisionSnapshotProvider;
  readonly maps: MapService;
  readonly logger: SafeLogger;
}

export interface SafeLogEvent {
  readonly event: 'request_rejected';
  readonly method: string;
  readonly status: number;
  readonly code: string;
}

export interface SafeLogger {
  log(event: SafeLogEvent): void;
}

export interface ProductionDependencyOverrides {
  readonly clock?: Clock;
  readonly catalog?: CatalogInput;
  readonly nearbyUniverse?: readonly { readonly id: string; readonly coordinate: Coordinate }[];
  readonly walk?: AppDependencies['walk'];
  readonly snapshotProvider?: DecisionSnapshotProvider;
  readonly mapReferences?: MapReferencesInput;
  readonly logger?: SafeLogger;
}

export function createProductionDependencies(
  config: ServerConfig,
  overrides: ProductionDependencyOverrides = {},
): AppDependencies {
  return Object.freeze({
    config: deepFreeze(structuredClone(config)),
    clock: overrides.clock ?? systemClock,
    exposure: evaluateExposure({ mode: config.mode }),
    catalog: createCatalogService(overrides.catalog ?? { contentVersion: 'catalog-empty-v1', complexes: [] }),
    nearbyUniverse: captureNearbyUniverse(overrides.nearbyUniverse ?? []),
    walk: overrides.walk ?? (async () => Object.freeze({ kind: 'unavailable', reason: 'unsupported' })),
    snapshotProvider: overrides.snapshotProvider ?? Object.freeze({
      capture: () => Object.freeze({
        identity: 'production-empty-v1',
        sourceHealth: Object.freeze([]),
        provenance: Object.freeze([]),
      }),
    }),
    maps: createMapService(overrides.mapReferences ?? emptyMapReferences()),
    logger: overrides.logger ?? Object.freeze({ log: (_event: SafeLogEvent) => undefined }),
  });
}

function emptyMapReferences(): MapReferencesInput {
  return {
    day: { contentVersion: 'map-day-empty-v1', attribution: 'Unofficial app-owned subway reference geometry', features: [] },
    night: { contentVersion: 'map-night-empty-v1', attribution: 'Unofficial app-owned subway reference geometry', features: [] },
  };
}

function captureNearbyUniverse(
  values: readonly { readonly id: string; readonly coordinate: Coordinate }[],
): readonly { readonly id: string; readonly coordinate: Coordinate }[] {
  if (!Array.isArray(values) || values.length > 2_048) throw new Error('Nearby entrance universe limit exceeded');
  const captured = values.map((value) => ({
    id: normalizeBoundedIdentity(value.id, 'nearby entrance', 128),
    coordinate: parseCoordinate(value.coordinate),
  }));
  if (new Set(captured.map(({ id }) => id)).size !== captured.length) throw new Error('Duplicate nearby entrance identity');
  captured.sort((left, right) => compareCanonicalIdentity(left.id, right.id));
  return deepFreeze(captured);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
