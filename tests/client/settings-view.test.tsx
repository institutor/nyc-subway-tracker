import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, test, vi } from 'vitest';

import { App } from '../../src/client/App';
import { ACTIVE_TRIP_STORE_KEY } from '../../src/client/storage/active-trip-store';
import { SAVED_STORE_KEY } from '../../src/client/storage/browser-store';
import { STRUCTURAL_STORE_KEY } from '../../src/client/storage/structural-store';
import { LAST_USED_STATION_KEY } from '../../src/client/state/app-state';

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();
  readonly failOn = new Set<string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) {
    if (this.failOn.has(key)) throw new Error('device store unavailable');
    this.values.delete(key);
  }
}

describe('rider settings and deletion', () => {
  test('reaches Settings from utility navigation and deletes covered personal data without structural assets', async () => {
    const storage = new MemoryStorage();
    storage.values.set(SAVED_STORE_KEY, JSON.stringify({ version: 2, records: [] }));
    storage.values.set(ACTIVE_TRIP_STORE_KEY, JSON.stringify({ version: 3, trip: null }));
    storage.values.set(LAST_USED_STATION_KEY, JSON.stringify({ complexId: 'A12', constituentId: 'A12', name: '125 St' }));
    storage.values.set(STRUCTURAL_STORE_KEY, 'official-offline-assets');
    const unsubscribe = vi.fn(async () => undefined);

    render(<App storage={storage} connectivity="offline" commuteNotifications={{
      stage: 'delivery', deliveryAuthorized: false, runtimeWindows: [],
      environment: {
        supported: true, permission: 'granted', requestPermission: async () => 'granted',
        subscribe: async () => undefined, unsubscribe,
      },
    }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText(/Official subway information and offline map assets stay on this device/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete personal data' }));
    expect(screen.getByRole('heading', { name: 'Delete personal data?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));

    await waitFor(() => expect(screen.getByText('Personal data deletion finished.')).toBeInTheDocument());
    expect(storage.getItem(SAVED_STORE_KEY)).toBeNull();
    expect(storage.getItem(ACTIVE_TRIP_STORE_KEY)).toBeNull();
    expect(storage.getItem(LAST_USED_STATION_KEY)).toBeNull();
    expect(storage.getItem(STRUCTURAL_STORE_KEY)).toBe('official-offline-assets');
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Location and notification permission choices in device settings were not changed/i)).toBeInTheDocument();
  });

  test('reports an exact failed category and offers notification reset separately', async () => {
    const storage = new MemoryStorage();
    storage.values.set(LAST_USED_STATION_KEY, '{}');
    storage.failOn.add(LAST_USED_STATION_KEY);
    const unsubscribe = vi.fn(async () => { throw new Error('server unavailable'); });

    render(<App storage={storage} connectivity="offline" commuteNotifications={{
      stage: 'delivery', deliveryAuthorized: false, runtimeWindows: [],
      environment: {
        supported: true, permission: 'granted', requestPermission: async () => 'granted',
        subscribe: async () => undefined, unsubscribe,
      },
    }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete notification subscription' }));
    await waitFor(() => expect(screen.getByText('Notification subscription: Failed')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Delete personal data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));

    await waitFor(() => expect(screen.getByText('Last station and covered settings: Failed')).toBeInTheDocument());
    expect(storage.getItem(LAST_USED_STATION_KEY)).toBe('{}');
  });
});
