import { normalizeBoundedIdentity } from '../../shared/domain/canonical';
import type { SavedRecord } from '../../shared/domain/types';
import {
  canonicalizeSavedRecords,
  decodeSavedEnvelope,
  encodeSavedEnvelope,
  type SavedEnvelopeDecode,
} from './migrations';

export const SAVED_STORE_KEY = 'nyc-subway-tracker:saved:v2';

export interface BrowserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type BrowserStoreRead =
  | { readonly kind: 'ready'; readonly migrated: boolean; readonly records: readonly SavedRecord[] }
  | { readonly kind: 'quarantined'; readonly reason: 'invalid' | 'future'; readonly raw: string };

export type BrowserStoreMutation =
  | { readonly kind: 'saved'; readonly records: readonly SavedRecord[] }
  | { readonly kind: 'unavailable'; readonly reason: 'quarantined' | 'invalid-record' | 'storage-write-failed' };

export interface BrowserSavedStore {
  read(): BrowserStoreRead;
  replace(records: readonly SavedRecord[]): BrowserStoreMutation;
  upsert(record: SavedRecord): BrowserStoreMutation;
  delete(id: string): BrowserStoreMutation;
}

export function createBrowserSavedStore(storage: BrowserStorage, key = SAVED_STORE_KEY): BrowserSavedStore {
  const initialRaw = storage.getItem(key);
  let raw = initialRaw;
  let decoded: SavedEnvelopeDecode = initialRaw === null
    ? { kind: 'current', envelope: { version: 2, records: Object.freeze([]) } }
    : decodeSavedEnvelope(initialRaw);

  const read = (): BrowserStoreRead => {
    if (decoded.kind === 'invalid' || decoded.kind === 'future') {
      return deepFreeze({ kind: 'quarantined', reason: decoded.kind, raw: decoded.raw });
    }
    return deepFreeze({
      kind: 'ready',
      migrated: decoded.kind === 'migrated',
      records: decoded.envelope.records.map(cloneRecord),
    });
  };

  const commit = (nextRecords: readonly SavedRecord[]): BrowserStoreMutation => {
    if (decoded.kind === 'invalid' || decoded.kind === 'future') return Object.freeze({ kind: 'unavailable', reason: 'quarantined' });
    let canonical: readonly SavedRecord[];
    let serialized: string;
    try {
      canonical = canonicalizeSavedRecords(nextRecords);
      serialized = encodeSavedEnvelope(canonical);
    } catch {
      return Object.freeze({ kind: 'unavailable', reason: 'invalid-record' });
    }
    const priorRaw = raw;
    try {
      storage.setItem(key, serialized);
    } catch {
      rollbackUnexpectedMutation(storage, key, priorRaw);
      return Object.freeze({ kind: 'unavailable', reason: 'storage-write-failed' });
    }
    raw = serialized;
    decoded = { kind: 'current', envelope: { version: 2, records: canonical } };
    return deepFreeze({ kind: 'saved', records: canonical.map(cloneRecord) });
  };

  return Object.freeze({
    read,
    replace: (records: readonly SavedRecord[]) => commit(records),
    upsert: (record: SavedRecord) => {
      if (decoded.kind === 'invalid' || decoded.kind === 'future') return Object.freeze({ kind: 'unavailable', reason: 'quarantined' });
      const records = decoded.envelope.records.filter(({ id }) => id !== record.id);
      return commit([...records, record]);
    },
    delete: (id: string) => {
      if (decoded.kind === 'invalid' || decoded.kind === 'future') return Object.freeze({ kind: 'unavailable', reason: 'quarantined' });
      let normalized: string;
      try {
        normalized = normalizeBoundedIdentity(id, 'saved ID');
      } catch {
        return Object.freeze({ kind: 'unavailable', reason: 'invalid-record' });
      }
      return commit(decoded.envelope.records.filter((record) => record.id !== normalized));
    },
  });
}

function rollbackUnexpectedMutation(storage: BrowserStorage, key: string, priorRaw: string | null): void {
  try {
    if (storage.getItem(key) === priorRaw) return;
    if (priorRaw === null) storage.removeItem(key);
    else storage.setItem(key, priorRaw);
  } catch {
    // The storage implementation is already failing. In-memory accepted state remains unchanged.
  }
}

function cloneRecord(record: SavedRecord): SavedRecord {
  return {
    id: record.id,
    complexId: record.complexId,
    constituentId: record.constituentId,
    ...(record.preferredEntrance ? { preferredEntrance: { ...record.preferredEntrance } } : {}),
    ...(record.preferredRide ? { preferredRide: { ...record.preferredRide } } : {}),
    routeFilters: [...record.routeFilters],
    accessibleRouteOnly: record.accessibleRouteOnly,
    ...(record.commonDestination ? { commonDestination: { ...record.commonDestination } } : {}),
    ...(record.timeWindow ? { timeWindow: { ...record.timeWindow, weekdays: [...record.timeWindow.weekdays] } } : {}),
    state: record.state,
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
