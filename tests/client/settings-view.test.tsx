import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  readonly reinsertOnce = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) {
    if (this.failOn.has(key)) throw new Error('device store unavailable');
    this.values.delete(key);
    const stale = this.reinsertOnce.get(key);
    if (stale !== undefined) {
      this.reinsertOnce.delete(key);
      queueMicrotask(() => this.values.set(key, stale));
    }
  }
}

const deletedNotification = Object.freeze({ state: 'Deleted', remote: 'Deleted', local: 'Deleted' });

describe('rider settings and deletion', () => {
  test('reaches Settings from utility navigation and deletes covered personal data without structural assets', async () => {
    const storage = new MemoryStorage();
    storage.values.set(SAVED_STORE_KEY, JSON.stringify({ version: 2, records: [] }));
    storage.values.set(ACTIVE_TRIP_STORE_KEY, JSON.stringify({ version: 3, trip: null }));
    storage.values.set(LAST_USED_STATION_KEY, JSON.stringify({ complexId: 'A12', constituentId: 'A12', name: '125 St' }));
    storage.values.set(STRUCTURAL_STORE_KEY, 'official-offline-assets');
    const unsubscribe = vi.fn(async () => deletedNotification);

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

  test('quiesces personal state before awaiting remote deletion and cleans one deferred stale write again', async () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: 2, records: [{
      id: 'saved-a', complexId: 'A12', constituentId: 'A12', routeFilters: [],
      accessibleRouteOnly: false, state: 'active',
    }] });
    storage.values.set(SAVED_STORE_KEY, raw);
    storage.reinsertOnce.set(SAVED_STORE_KEY, raw);
    let finish!: (value: typeof deletedNotification) => void;
    const unsubscribe = vi.fn(() => new Promise<typeof deletedNotification>((resolve) => { finish = resolve; }));

    render(<App storage={storage} connectivity="offline" commuteNotifications={{
      stage: 'disabled', deliveryAuthorized: false, runtimeWindows: [],
      environment: {
        supported: true, permission: 'granted', requestPermission: async () => 'granted',
        subscribe: async () => undefined, unsubscribe,
      },
    }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete personal data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
    await act(async () => undefined);

    expect(screen.queryByText('saved-a')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete notification subscription' })).toBeDisabled();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(storage.getItem(SAVED_STORE_KEY)).toBe(raw);

    finish(deletedNotification);
    await waitFor(() => expect(screen.getByText('Personal data deletion finished.')).toBeInTheDocument());
    expect(storage.getItem(SAVED_STORE_KEY)).toBeNull();
  });

  test('reports a hanging notification deletion as Pending instead of Deleted', async () => {
    vi.useFakeTimers();
    try {
      render(<App storage={new MemoryStorage()} connectivity="offline" commuteNotifications={{
        stage: 'disabled', deliveryAuthorized: false, runtimeWindows: [],
        environment: {
          supported: true, permission: 'granted', requestPermission: async () => 'granted',
          subscribe: async () => undefined, unsubscribe: () => new Promise(() => undefined),
        },
      }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete notification subscription' }));
      await act(async () => { vi.advanceTimersByTime(5_000); });
      expect(screen.getByText('Notification subscription: Pending')).toBeInTheDocument();
      expect(screen.getByText('Remote deletion: Pending; device subscription: Pending.')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  test('moves focus into destructive confirmation and restores it after cancel', () => {
    render(<App storage={new MemoryStorage()} connectivity="offline" />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const trigger = screen.getByRole('button', { name: 'Delete personal data' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Delete personal data?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm deletion' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Delete personal data' })).toHaveFocus();
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
