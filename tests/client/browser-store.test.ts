import { describe, expect, test } from 'vitest';

import { createBrowserSavedStore, SAVED_STORE_KEY, type BrowserStorage } from '../../src/client/storage/browser-store';
import { decodeSavedEnvelope, encodeSavedEnvelope } from '../../src/client/storage/migrations';
import type { SavedRecord } from '../../src/shared/domain/types';

const record = (id: string, overrides: Partial<SavedRecord> = {}): SavedRecord => ({
  id,
  complexId: `complex-${id}`,
  constituentId: `constituent-${id}`,
  routeFilters: [],
  accessibleRouteOnly: false,
  state: 'active',
  ...overrides,
});

class MemoryStorage implements BrowserStorage {
  readonly values = new Map<string, string>();
  writes = 0;
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes += 1;
    if (this.failWrites) throw new Error('simulated storage failure');
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('strict device-local saved-state migrations', () => {
  test('reads a v2 envelope canonically without writing and returns immutable detached records', () => {
    const storage = new MemoryStorage();
    storage.values.set(SAVED_STORE_KEY, JSON.stringify({ version: 2, records: [record('b'), record('a')] }));
    const store = createBrowserSavedStore(storage);

    const first = store.read();
    expect(first).toMatchObject({ kind: 'ready', migrated: false });
    if (first.kind !== 'ready') return;
    expect(first.records.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(storage.writes).toBe(0);
    expect(() => { (first.records[0] as { id: string }).id = 'mutated'; }).toThrow();
    expect(store.read()).toMatchObject({ records: [{ id: 'a' }, { id: 'b' }] });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.records)).toBe(true);
  });

  test('migrates v1 only with exact constituent identity and persists on the next explicit mutation', () => {
    const storage = new MemoryStorage();
    const v1 = JSON.stringify({
      version: 1,
      records: [{
        id: 'a', complexId: 'complex-a', constituentId: 'constituent-a',
        routeFilters: ['A'], accessibleRouteOnly: false, state: 'active',
      }],
    });
    storage.values.set(SAVED_STORE_KEY, v1);
    const store = createBrowserSavedStore(storage);

    expect(store.read()).toMatchObject({ kind: 'ready', migrated: true, records: [{ id: 'a' }] });
    expect(storage.values.get(SAVED_STORE_KEY)).toBe(v1);
    expect(storage.writes).toBe(0);
    expect(store.upsert(record('b'))).toMatchObject({ kind: 'saved' });
    expect(storage.writes).toBe(1);
    expect(JSON.parse(storage.values.get(SAVED_STORE_KEY)!)).toMatchObject({ version: 2, records: [{ id: 'a' }, { id: 'b' }] });
  });

  test.each([
    JSON.stringify({ version: 1, records: [{ id: 'old', stationId: 'ambiguous', routeFilters: [], accessibleRouteOnly: false, state: 'active' }] }),
    JSON.stringify({ version: 3, records: [] }),
    '{"version":2,"records":',
  ])('preserves invalid or future raw bytes and refuses to overwrite them', (raw) => {
    const storage = new MemoryStorage();
    storage.values.set(SAVED_STORE_KEY, raw);
    const store = createBrowserSavedStore(storage);
    expect(store.read()).toMatchObject({ kind: 'quarantined', raw });
    expect(store.upsert(record('new'))).toEqual({ kind: 'unavailable', reason: 'quarantined' });
    expect(storage.values.get(SAVED_STORE_KEY)).toBe(raw);
    expect(storage.writes).toBe(0);
  });

  test('enforces envelope, record, filter, string, and byte ceilings before copying', () => {
    const maximum = Array.from({ length: 512 }, (_, index) => record(`r-${String(index).padStart(3, '0')}`));
    expect(decodeSavedEnvelope(JSON.stringify({ version: 2, records: maximum })).kind).toBe('current');
    expect(decodeSavedEnvelope(JSON.stringify({ version: 2, records: [...maximum, record('extra')] })).kind).toBe('invalid');
    expect(decodeSavedEnvelope(JSON.stringify({ version: 2, records: [record('filters', { routeFilters: Array.from({ length: 33 }, (_, index) => `R${index}`) })] })).kind).toBe('invalid');
    expect(decodeSavedEnvelope(JSON.stringify({
      version: 2,
      records: [record('x'.repeat(256), { complexId: 'complex-x', constituentId: 'constituent-x' })],
    })).kind).toBe('current');
    expect(decodeSavedEnvelope(JSON.stringify({
      version: 2,
      records: [record('x'.repeat(257), { complexId: 'complex-x', constituentId: 'constituent-x' })],
    })).kind).toBe('invalid');
    expect(decodeSavedEnvelope(`${' '.repeat(524_289)}{}`)).toMatchObject({ kind: 'invalid', reason: 'size-limit' });
  });

  test.each([
    { version: 2, records: [], extra: true },
    { version: 2, records: [{ ...record('a'), order: 1 }] },
    { version: 2, records: [{ ...record('a'), coordinates: { latitude: 40.7, longitude: -74 } }] },
    { version: 2, records: [{ ...record('a'), arrivals: [] }] },
    { version: 2, records: [{ ...record('a'), alerts: [] }] },
    { version: 2, records: [{ ...record('a'), entranceAvailability: 'open' }] },
    { version: 2, records: [{ ...record('a'), accessibility: { pathId: 'p' } }] },
    { version: 2, records: [{ ...record('a'), equipment: { elevator: 'working' } }] },
    { version: 2, records: [{ ...record('a'), platform: 'uptown' }] },
    { version: 2, records: [{ ...record('a'), positioning: 'front' }] },
    { version: 2, records: [{ ...record('a'), guidance: { transfer: 'stairs' } }] },
    { version: 2, records: [{ ...record('a'), disruption: { status: 'resolved' } }] },
    { version: 2, records: [{ ...record('a'), walkRank: 1 }] },
    { version: 2, records: [{ ...record('a'), lastOpenedAt: '2026-08-04T00:00:00Z' }] },
    { version: 2, records: [{ ...record('a'), preferredRide: { direction: 'northbound', actualDestination: 'Terminal', risk: 'low' } }] },
  ])('recursively rejects unknown and operational-truth fields %#', (envelope) => {
    expect(decodeSavedEnvelope(JSON.stringify(envelope)).kind).toBe('invalid');
  });

  test('rejects duplicate record IDs and duplicate complex/constituent keys after NFC normalization', () => {
    expect(decodeSavedEnvelope(JSON.stringify({ version: 2, records: [record('é'), record('e\u0301')] })).kind).toBe('invalid');
    expect(decodeSavedEnvelope(JSON.stringify({
      version: 2,
      records: [record('a'), record('b', { complexId: 'complex-a', constituentId: 'constituent-a' })],
    })).kind).toBe('invalid');
  });

  test('write failure leaves prior raw storage and in-memory retrieval unchanged', () => {
    const storage = new MemoryStorage();
    const prior = encodeSavedEnvelope([record('a')]);
    storage.values.set(SAVED_STORE_KEY, prior);
    const store = createBrowserSavedStore(storage);
    storage.failWrites = true;

    expect(store.upsert(record('b'))).toEqual({ kind: 'unavailable', reason: 'storage-write-failed' });
    expect(storage.values.get(SAVED_STORE_KEY)).toBe(prior);
    expect(store.read()).toMatchObject({ records: [{ id: 'a' }] });
  });

  test('explicit replace and delete preserve canonical retrieval and never create account, sync, graph, or operational fields', () => {
    const storage = new MemoryStorage();
    const store = createBrowserSavedStore(storage);
    expect(store.replace([record('c'), record('a'), record('b')])).toMatchObject({ kind: 'saved' });
    expect(store.delete('b')).toMatchObject({ kind: 'saved', records: [{ id: 'a' }, { id: 'c' }] });
    const raw = storage.values.get(SAVED_STORE_KEY)!;
    expect(raw).not.toMatch(/account|sync|graph|coordinate|walk|arrival|alert|equipment|path|platform|guidance|timestamp|last.opened/i);
  });
});
