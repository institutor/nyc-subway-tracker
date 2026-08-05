import type { BootstrapDataDto, CatalogEnvelopeDto } from '../api/client';
import type { BrowserStorage } from './browser-store';

export const STRUCTURAL_STORE_KEY = 'nyc-subway-tracker:structural:v2';

const MAX_BYTES = 2 * 1_024 * 1_024;

export interface StoredStructuralContent {
  readonly contentVersions: BootstrapDataDto['contentVersions'];
  readonly catalog: CatalogEnvelopeDto;
}

export type StructuralStoreRead =
  | { readonly kind: 'ready'; readonly value: StoredStructuralContent | null }
  | { readonly kind: 'quarantined'; readonly raw: string };

export interface BrowserStructuralStore {
  read(): StructuralStoreRead;
  write(contentVersions: BootstrapDataDto['contentVersions'], catalog: CatalogEnvelopeDto): boolean;
}

export function createBrowserStructuralStore(
  storage: BrowserStorage,
  key = STRUCTURAL_STORE_KEY,
): BrowserStructuralStore {
  const initialRaw = storage.getItem(key);
  let raw = initialRaw;
  let value: StoredStructuralContent | null | undefined = initialRaw === null ? null : decode(initialRaw);

  return Object.freeze({
    read: (): StructuralStoreRead => value === undefined
      ? deepFreeze({ kind: 'quarantined', raw: raw! })
      : deepFreeze({ kind: 'ready', value }),
    write: (
      contentVersions: BootstrapDataDto['contentVersions'],
      catalog: CatalogEnvelopeDto,
    ) => {
      if (value === undefined) return false;
      let captured: StoredStructuralContent;
      let serialized: string;
      try {
        captured = capture({ contentVersions, catalog });
        serialized = JSON.stringify({ version: 2, ...captured });
        if (new TextEncoder().encode(serialized).byteLength > MAX_BYTES) return false;
      } catch {
        return false;
      }
      const priorRaw = raw;
      try {
        storage.setItem(key, serialized);
      } catch {
        rollback(storage, key, priorRaw);
        return false;
      }
      raw = serialized;
      value = captured;
      return true;
    },
  });
}

function decode(raw: string): StoredStructuralContent | undefined {
  try {
    if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) return undefined;
    const root = strictRecord(JSON.parse(raw), ['version', 'contentVersions', 'catalog']);
    if (root.version !== 2) return undefined;
    return capture({ contentVersions: root.contentVersions, catalog: root.catalog });
  } catch {
    return undefined;
  }
}

function capture(value: unknown): StoredStructuralContent {
  const root = strictRecord(value, ['contentVersions', 'catalog']);
  const versions = captureVersions(root.contentVersions);
  const catalog = captureCatalog(root.catalog);
  if (catalog.contentVersion !== versions.stationCatalog) throw new Error('Catalog version mismatch');
  return deepFreeze({ contentVersions: versions, catalog });
}

function captureVersions(value: unknown): BootstrapDataDto['contentVersions'] {
  const root = strictRecord(value, ['stationCatalog', 'maps', 'journeyGraph']);
  const maps = strictRecord(root.maps, ['day', 'night']);
  return deepFreeze({
    stationCatalog: identity(root.stationCatalog),
    maps: { day: identity(maps.day), night: identity(maps.night) },
    journeyGraph: identity(root.journeyGraph),
  });
}

function captureCatalog(value: unknown): CatalogEnvelopeDto {
  const root = strictRecord(value, ['apiVersion', 'schemaVersion', 'contentVersion', 'data']);
  if (root.apiVersion !== 'v1' || root.schemaVersion !== '2026-08-04') throw new Error('Unsupported catalog schema');
  const data = strictRecord(root.data, ['complexes']);
  if (!Array.isArray(data.complexes) || data.complexes.length > 2_048) throw new Error('Invalid catalog complexes');
  const complexes = data.complexes.map((candidate) => {
    const complex = strictRecord(candidate, ['id', 'name', 'routeIds', 'constituents']);
    const routeIds = identities(complex.routeIds, 64);
    if (!Array.isArray(complex.constituents) || complex.constituents.length === 0 || complex.constituents.length > 64) {
      throw new Error('Invalid catalog constituents');
    }
    const constituents = complex.constituents.map((candidateConstituent) => {
      const constituent = strictRecord(candidateConstituent, ['id', 'name', 'directionalStopIds']);
      return {
        id: identity(constituent.id),
        name: display(constituent.name),
        directionalStopIds: identities(constituent.directionalStopIds, 64),
      };
    });
    unique(constituents.map(({ id }) => id));
    return { id: identity(complex.id), name: display(complex.name), routeIds, constituents };
  });
  unique(complexes.map(({ id }) => id));
  unique(complexes.flatMap(({ constituents }) => constituents.map(({ id }) => id)));
  return deepFreeze({
    apiVersion: 'v1',
    schemaVersion: '2026-08-04',
    contentVersion: identity(root.contentVersion),
    data: { complexes },
  });
}

function identities(value: unknown, maximum: number): readonly string[] {
  if (!Array.isArray(value) || value.length > maximum) throw new Error('Invalid identity list');
  const result = value.map(identity);
  unique(result);
  return result;
}

function identity(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid identity');
  const normalized = value.normalize('NFC');
  if (!normalized || [...normalized].length > 256 || /[\p{C}\p{Z}]/u.test(normalized)) throw new Error('Invalid identity');
  return normalized;
}

function display(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid display value');
  const normalized = value.normalize('NFC').trim();
  if (!normalized || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error('Invalid display value');
  return normalized;
}

function unique(values: readonly string[]): void {
  if (new Set(values).size !== values.length) throw new Error('Duplicate structural identity');
}

function strictRecord(value: unknown, exactKeys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error('Invalid structural record');
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== exactKeys.length || exactKeys.some((key) => !keys.includes(key))) throw new Error('Unknown structural field');
  return record;
}

function rollback(storage: BrowserStorage, key: string, priorRaw: string | null): void {
  try {
    if (storage.getItem(key) === priorRaw) return;
    if (priorRaw === null) storage.removeItem(key);
    else storage.setItem(key, priorRaw);
  } catch {
    // An already-failing store cannot widen the accepted in-memory state.
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
