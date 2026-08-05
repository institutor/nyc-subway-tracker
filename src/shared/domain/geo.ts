export interface Coordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface LocationFix {
  readonly coordinate: Coordinate;
  readonly accuracyMeters: number;
}

export interface WalkRange {
  readonly minimumSeconds: number;
  readonly maximumSeconds: number;
}

const COORDINATE_KEYS = new Set(['latitude', 'longitude']);
const LOCATION_FIX_KEYS = new Set(['coordinate', 'accuracyMeters']);
const WALK_RANGE_KEYS = new Set(['minimumSeconds', 'maximumSeconds']);

export function parseCoordinate(input: unknown): Coordinate {
  const record = exactRecord(input, COORDINATE_KEYS, 'coordinate');
  const latitude = boundedFinite(record.latitude, -90, 90, 'coordinate latitude');
  const longitude = boundedFinite(record.longitude, -180, 180, 'coordinate longitude');
  return deepFreeze({ latitude, longitude });
}

export function parseLocationFix(input: unknown): LocationFix {
  const record = exactRecord(input, LOCATION_FIX_KEYS, 'location fix');
  const accuracyMeters = boundedFinite(record.accuracyMeters, Number.MIN_VALUE, Number.MAX_VALUE, 'location accuracy');
  if (!(accuracyMeters > 0)) throw new Error('Location accuracy must be positive');
  return deepFreeze({ coordinate: parseCoordinate(record.coordinate), accuracyMeters });
}

export function parseWalkRange(input: unknown): WalkRange {
  const record = exactRecord(input, WALK_RANGE_KEYS, 'walk range');
  const minimumSeconds = boundedSafeInteger(record.minimumSeconds, 0, 86_400, 'walk range minimum');
  const maximumSeconds = boundedSafeInteger(record.maximumSeconds, 0, 86_400, 'walk range maximum');
  if (minimumSeconds > maximumSeconds) throw new Error('Walk range minimum must not exceed maximum');
  return deepFreeze({ minimumSeconds, maximumSeconds });
}

function exactRecord(input: unknown, allowed: ReadonlySet<string>, label: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) {
    throw new Error(`Invalid ${label}`);
  }
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => !allowed.has(key)) || keys.length !== allowed.size) throw new Error(`Invalid ${label} fields`);
  return record;
}

function boundedFinite(value: unknown, minimum: number, maximum: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function boundedSafeInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`Invalid ${label}`);
  }
  return value as number;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
