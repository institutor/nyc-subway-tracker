import { compareCanonicalIdentity, normalizeBoundedIdentity } from '../../shared/domain/canonical';

export type MapTheme = 'day' | 'night';

export interface MapFeatureInput {
  readonly id: string;
  readonly kind: 'line' | 'station' | 'transfer';
  readonly routeIds: readonly string[];
  readonly geometry: {
    readonly type: 'Point' | 'LineString';
    readonly coordinates: unknown;
  };
}

export interface MapReferenceInput {
  readonly contentVersion: string;
  readonly attribution: string;
  readonly features: readonly MapFeatureInput[];
}

export interface MapReferencesInput {
  readonly day: MapReferenceInput;
  readonly night: MapReferenceInput;
}

export interface MapReferenceDto extends MapReferenceInput {
  readonly theme: MapTheme;
}

export interface MapService {
  get(theme: MapTheme): MapReferenceDto;
}

export function createMapService(input: MapReferencesInput): MapService {
  const references = {
    day: captureReference('day', input.day),
    night: captureReference('night', input.night),
  };
  return Object.freeze({ get: (theme: MapTheme) => references[theme] });
}

function captureReference(theme: MapTheme, input: MapReferenceInput): MapReferenceDto {
  const features = input.features.map((feature) => ({
    id: normalizeBoundedIdentity(feature.id, 'map feature', 128),
    kind: feature.kind,
    routeIds: [...feature.routeIds].map((route) => normalizeBoundedIdentity(route, 'map route', 128)).sort(compareCanonicalIdentity),
    geometry: captureGeometry(feature.geometry),
  }));
  if (new Set(features.map(({ id }) => id)).size !== features.length) throw new Error('Duplicate map feature identity');
  features.sort((left, right) => compareCanonicalIdentity(left.id, right.id));
  const attribution = input.attribution.normalize('NFC').trim();
  if (!attribution || [...attribution].length > 256 || /[\u0000-\u001f\u007f]/u.test(attribution)) throw new Error('Invalid map attribution');
  return deepFreeze({
    theme,
    contentVersion: normalizeBoundedIdentity(input.contentVersion, 'map content version', 128),
    attribution,
    features,
  });
}

function captureGeometry(input: MapFeatureInput['geometry']) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid map geometry');
  if (input.type === 'Point') return { type: input.type, coordinates: point(input.coordinates) };
  if (input.type !== 'LineString' || !Array.isArray(input.coordinates) || input.coordinates.length < 2 || input.coordinates.length > 10_000) {
    throw new Error('Invalid map line geometry');
  }
  return { type: input.type, coordinates: input.coordinates.map(point) };
}

function point(input: unknown): readonly [number, number] {
  if (!Array.isArray(input) || input.length !== 2 || input.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error('Invalid map point');
  }
  const [x, y] = input as number[];
  if (x < -180 || x > 180 || y < -90 || y > 90) throw new Error('Invalid map point');
  return Object.freeze([x, y]) as readonly [number, number];
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
