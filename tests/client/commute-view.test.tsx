import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { App } from '../../src/client/App';
import { CommuteView } from '../../src/client/views/CommuteView';
import type { SavedRecord } from '../../src/shared/domain/types';
import { createClientApi, MemoryStorage } from '../helpers/client-fixtures';

describe('Commute view notification capability', () => {
  test('shows an honest locked surface without requesting permission', () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(<CommuteView records={[record()]} catalog={catalog} stage="disabled" deliveryAuthorized={false} notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.getByRole('heading', { name: 'Commute' })).toBeInTheDocument();
    expect(screen.getByText(/alerts remain locked/i)).toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test.each(['deterministic-test', 'silent-evaluation'] as const)('never exposes subscription controls in %s stage', (stage) => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(<CommuteView records={[record()]} catalog={catalog} stage={stage} deliveryAuthorized runtimeWindows={[exactWindow({ stage })]} notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.getByText(/alerts remain locked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enable disruption alerts/i })).not.toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test('states that unsupported background delivery is not guaranteed', () => {
    render(<CommuteView records={[record()]} catalog={catalog} stage="delivery" deliveryAuthorized runtimeWindows={[exactWindow()]} notificationEnvironment={{
      supported: false, permission: 'default', requestPermission: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.getByText(/background alerts aren’t supported in this browser/i)).toBeInTheDocument();
    expect(screen.getByText(/review your saved commute here/i)).toBeInTheDocument();
  });

  test('permission denial preserves the saved commute and gives truthful settings copy', async () => {
    const requestPermission = vi.fn(async () => 'denied' as NotificationPermission);
    render(<CommuteView records={[record()]} catalog={catalog} stage="delivery" deliveryAuthorized runtimeWindows={[exactWindow()]} notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    fireEvent.click(await screen.findByRole('button', { name: /enable disruption alerts/i }));
    await waitFor(() => expect(screen.getByText(/blocked in your browser settings/i)).toBeInTheDocument());
    expect(screen.getByText('125 St to 14 St–Union Sq')).toBeInTheDocument();
  });

  test('binds an enabled subscription to the exact complete saved windows', async () => {
    const subscribe = vi.fn(async (_windows: readonly ReturnType<typeof exactWindow>[]) => undefined);
    render(<CommuteView records={[record()]} catalog={catalog} stage="pilot" deliveryAuthorized runtimeWindows={[exactWindow({ stage: 'pilot' })]} notificationEnvironment={{
      supported: true, permission: 'granted', requestPermission: vi.fn(), subscribe, unsubscribe: vi.fn(),
    }} />);
    fireEvent.click(await screen.findByRole('button', { name: /enable disruption alerts/i }));
    await waitFor(() => expect(subscribe).toHaveBeenCalledWith([exactWindow({ stage: 'pilot' })]));
  });

  test('never requests notification permission without a complete saved commute window', () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(<CommuteView records={[]} catalog={catalog} stage="pilot" deliveryAuthorized notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.queryByRole('button', { name: /enable disruption alerts/i })).not.toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test.each([
    ['a route', { routeFilters: [] }],
    ['a known direction', { preferredRide: { direction: 'unknown', actualDestination: 'Far Rockaway' } }],
  ])('fails persisted scope closed when it lacks %s', (_label, override) => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(<CommuteView records={[{ ...record(), ...override } as SavedRecord]} catalog={catalog} stage="delivery" deliveryAuthorized notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.queryByRole('button', { name: /enable disruption alerts/i })).not.toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test('requires an explicit used segment before exposing permission controls', () => {
    render(
      <CommuteView records={[record()]} runtimeWindows={[]} catalog={catalog} stage="delivery" deliveryAuthorized notificationEnvironment={{
        supported: true, permission: 'granted', requestPermission: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(),
      }} />,
    );
    expect(screen.queryByRole('button', { name: /enable disruption alerts/i })).not.toBeInTheDocument();
    expect(screen.getByText(/exact route segment/i)).toBeInTheDocument();
  });

  test('rehydrates the actual subscription and exposes an explicit scope update without prompting', async () => {
    const inspect = vi.fn(async () => 'stale' as const);
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(
      <CommuteView records={[record()]} runtimeWindows={[exactWindow()]} catalog={catalog} stage="delivery" deliveryAuthorized notificationEnvironment={{
        supported: true, permission: 'granted', inspect, requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
      }} />,
    );
    expect(await screen.findByRole('button', { name: /update disruption alerts/i })).toBeInTheDocument();
    expect(inspect).toHaveBeenCalledTimes(1);
    expect(inspect).toHaveBeenCalledWith([exactWindow()]);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test('reconciles an exact scope change even when the commute window identity stays the same', async () => {
    const inspect = vi.fn(async () => 'current' as const);
    const environment = {
      supported: true, permission: 'granted' as const, inspect,
      requestPermission: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(),
    };
    const { rerender } = render(
      <CommuteView records={[record()]} runtimeWindows={[exactWindow()]} catalog={catalog} stage="delivery" deliveryAuthorized notificationEnvironment={environment} />,
    );
    expect(await screen.findByRole('button', { name: /turn off disruption alerts/i })).toBeInTheDocument();

    const changed = exactWindow();
    changed.scope.segmentStationIds = ['A12', 'A15', 'L03'];
    rerender(
      <CommuteView records={[record()]} runtimeWindows={[changed]} catalog={catalog} stage="delivery" deliveryAuthorized notificationEnvironment={environment} />,
    );
    await waitFor(() => expect(inspect).toHaveBeenCalledTimes(2));
    expect(inspect).toHaveBeenLastCalledWith([changed]);
  });

  test('does not label saved stations as home or work or promise all-clear messages', () => {
    render(<CommuteView records={[record()]} catalog={catalog} stage="disabled" deliveryAuthorized={false} />);
    expect(screen.queryByText(/home|work|good service|all clear/i)).not.toBeInTheDocument();
    expect(screen.getByText(/disruption-only/i)).toBeInTheDocument();
  });

  test('wires an authorized injected commute configuration through the mounted app', async () => {
    const storage = new MemoryStorage();
    storage.setItem('nyc-subway-tracker:saved:v2', JSON.stringify({ version: 2, records: [record()] }));
    const inspect = vi.fn(async () => 'none' as const);
    render(
      <App
        api={createClientApi()}
        geolocation={null}
        storage={storage}
        connectivity="online"
        initialSurface="commute"
        commuteNotifications={{
          stage: 'delivery', deliveryAuthorized: true, runtimeWindows: [exactWindow()],
          environment: {
            supported: true, permission: 'granted', inspect,
            requestPermission: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(),
          },
        }}
      />,
    );
    expect(await screen.findByRole('button', { name: /enable disruption alerts/i })).toBeInTheDocument();
    expect(inspect).toHaveBeenCalledWith([exactWindow()]);
  });
});

function record(): SavedRecord {
  return {
    id: 'saved-a', complexId: 'A12', constituentId: 'A12',
    preferredRide: { direction: 'southbound', actualDestination: 'Far Rockaway' },
    routeFilters: ['A'], accessibleRouteOnly: false,
    commonDestination: { complexId: 'L03', constituentId: 'L03' },
    timeWindow: { weekdays: [1, 2, 3, 4, 5], startsAt: '08:00', endsAt: '09:00' }, state: 'active',
  };
}

const catalog = [
  { id: 'A12', name: '125 St', routeIds: ['A'], constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12S'] }] },
  { id: 'L03', name: '14 St–Union Sq', routeIds: ['L'], constituents: [{ id: 'L03', name: '14 St–Union Sq', directionalStopIds: ['L03S'] }] },
] as const;

function exactWindow(overrides: { stage?: 'deterministic-test' | 'silent-evaluation' | 'pilot' | 'delivery' } = {}) {
  return {
    id: 'commute-saved-a', savedRecordId: 'saved-a', lifecycle: 'active' as const,
    weekdays: [1, 2, 3, 4, 5] as const, startsAt: '08:00', endsAt: '09:00', preparationLeadMinutes: 15,
    stage: overrides.stage ?? 'delivery', notificationEnabled: true,
    scope: {
      routeId: 'A', direction: 'southbound' as const, actualDestination: 'Far Rockaway',
      originStationId: 'A12', destinationStationId: 'L03', segmentStationIds: ['A12', 'A14', 'L03'],
    },
  };
}
