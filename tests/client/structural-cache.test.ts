import { describe, expect, test } from 'vitest';

import { createBrowserStructuralStore, STRUCTURAL_STORE_KEY } from '../../src/client/storage/structural-store';
import { MemoryStorage, catalogEnvelope } from '../helpers/client-fixtures';

describe('device-held structural subway metadata', () => {
  test('stores only exact catalog and Day/Night content identities for offline reload', () => {
    const storage = new MemoryStorage();
    const store = createBrowserStructuralStore(storage);

    expect(store.read()).toEqual({ kind: 'ready', value: null });
    expect(store.write({
      stationCatalog: catalogEnvelope.contentVersion,
      maps: { day: 'map-day-7', night: 'map-night-7' },
    }, catalogEnvelope)).toBe(true);

    expect(store.read()).toEqual({
      kind: 'ready',
      value: {
        contentVersions: {
          stationCatalog: catalogEnvelope.contentVersion,
          maps: { day: 'map-day-7', night: 'map-night-7' },
        },
        catalog: catalogEnvelope,
      },
    });
  });

  test.each([
    { version: 2, contentVersions: {}, catalog: {} },
    { version: 1, contentVersions: { stationCatalog: 'catalog-1', maps: { day: 'day-1', night: 'night-1' } }, catalog: { ...catalogEnvelope, arrivals: [] } },
    { version: 1, contentVersions: { stationCatalog: 'catalog-1', maps: { day: 'day-1', night: 'night-1' } }, catalog: { ...catalogEnvelope, coordinate: [-74, 40.7] } },
  ])('quarantines future or operationally widened structural bytes %#', (value) => {
    const storage = new MemoryStorage();
    storage.setItem(STRUCTURAL_STORE_KEY, JSON.stringify(value));
    const store = createBrowserStructuralStore(storage);

    expect(store.read().kind).toBe('quarantined');
    expect(store.write({ stationCatalog: 'catalog-1', maps: { day: 'day-1', night: 'night-1' } }, catalogEnvelope)).toBe(false);
  });

  test('rejects a catalog whose content identity does not own the bootstrap version', () => {
    const storage = new MemoryStorage();
    const store = createBrowserStructuralStore(storage);

    expect(store.write({ stationCatalog: 'another-catalog', maps: { day: 'day-1', night: 'night-1' } }, catalogEnvelope)).toBe(false);
    expect(storage.getItem(STRUCTURAL_STORE_KEY)).toBeNull();
  });
});
