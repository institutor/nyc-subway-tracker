import { describe, expect, test } from 'vitest';

import { createBrowserStructuralStore, STRUCTURAL_STORE_KEY } from '../../src/client/storage/structural-store';
import { MemoryStorage, catalogEnvelope } from '../helpers/client-fixtures';

const versions = {
  stationCatalog: catalogEnvelope.contentVersion,
  maps: { day: 'map-day-7', night: 'map-night-7' },
  journeyGraph: 'journey-graph-7',
} as const;

describe('device-held structural subway metadata', () => {
  test('stores exact catalog, map, and graph lookup identities without claiming graph bytes are locally ready', () => {
    const storage = new MemoryStorage();
    const store = createBrowserStructuralStore(storage);

    expect(store.read()).toEqual({ kind: 'ready', value: null });
    expect(store.write(versions, catalogEnvelope)).toBe(true);

    expect(store.read()).toEqual({
      kind: 'ready',
      value: {
        contentVersions: {
          stationCatalog: catalogEnvelope.contentVersion,
          maps: { day: 'map-day-7', night: 'map-night-7' },
          journeyGraph: 'journey-graph-7',
        },
        catalog: catalogEnvelope,
      },
    });
  });

  test.each([
    { version: 3, contentVersions: {}, catalog: {}, graph: {} },
    { version: 1, contentVersions: { stationCatalog: 'catalog-1', maps: { day: 'day-1', night: 'night-1' } }, catalog: { ...catalogEnvelope, arrivals: [] } },
    { version: 1, contentVersions: { stationCatalog: 'catalog-1', maps: { day: 'day-1', night: 'night-1' } }, catalog: { ...catalogEnvelope, coordinate: [-74, 40.7] } },
  ])('quarantines future or operationally widened structural bytes %#', (value) => {
    const storage = new MemoryStorage();
    storage.setItem(STRUCTURAL_STORE_KEY, JSON.stringify(value));
    const store = createBrowserStructuralStore(storage);

    expect(store.read().kind).toBe('quarantined');
    expect(store.write(versions, catalogEnvelope)).toBe(false);
  });

  test('rejects a catalog whose content identity does not own the bootstrap version', () => {
    const storage = new MemoryStorage();
    const store = createBrowserStructuralStore(storage);

    expect(store.write({ ...versions, stationCatalog: 'another-catalog' }, catalogEnvelope)).toBe(false);
    expect(storage.getItem(STRUCTURAL_STORE_KEY)).toBeNull();
  });

  test('does not advertise graph lookup metadata after the device quota rejects the write', () => {
    const storage = new QuotaStorage();
    const store = createBrowserStructuralStore(storage);

    expect(store.write(versions, catalogEnvelope)).toBe(false);
    expect(store.read()).toEqual({ kind: 'ready', value: null });
    expect(storage.getItem(STRUCTURAL_STORE_KEY)).toBeNull();
  });

});

class QuotaStorage extends MemoryStorage {
  override setItem(): void {
    throw new DOMException('Quota exceeded', 'QuotaExceededError');
  }
}
