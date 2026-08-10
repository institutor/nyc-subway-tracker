import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { CommuteView } from '../../src/client/views/CommuteView';
import type { SavedRecord } from '../../src/shared/domain/types';

describe('Commute view notification capability', () => {
  test('shows an honest locked surface without requesting permission', () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(<CommuteView records={[record()]} catalog={catalog} stage="disabled" gateOpen={false} notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.getByRole('heading', { name: 'Commute' })).toBeInTheDocument();
    expect(screen.getByText(/alerts remain locked/i)).toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test.each(['deterministic-test', 'silent-evaluation'] as const)('never exposes subscription controls in %s stage', (stage) => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(<CommuteView records={[record()]} catalog={catalog} stage={stage} gateOpen notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.getByText(/alerts remain locked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enable disruption alerts/i })).not.toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test('states that unsupported background delivery is not guaranteed', () => {
    render(<CommuteView records={[record()]} catalog={catalog} stage="delivery" gateOpen notificationEnvironment={{
      supported: false, permission: 'default', requestPermission: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.getByText(/background alerts aren’t supported in this browser/i)).toBeInTheDocument();
    expect(screen.getByText(/review your saved commute here/i)).toBeInTheDocument();
  });

  test('permission denial preserves the saved commute and gives truthful settings copy', async () => {
    const requestPermission = vi.fn(async () => 'denied' as NotificationPermission);
    render(<CommuteView records={[record()]} catalog={catalog} stage="delivery" gateOpen notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    fireEvent.click(screen.getByRole('button', { name: /enable disruption alerts/i }));
    await waitFor(() => expect(screen.getByText(/blocked in your browser settings/i)).toBeInTheDocument());
    expect(screen.getByText('125 St to 14 St–Union Sq')).toBeInTheDocument();
  });

  test('binds an enabled subscription to the exact complete saved windows', async () => {
    const subscribe = vi.fn(async (_commuteWindowIds: readonly string[]) => undefined);
    render(<CommuteView records={[record()]} catalog={catalog} stage="pilot" gateOpen notificationEnvironment={{
      supported: true, permission: 'granted', requestPermission: vi.fn(), subscribe, unsubscribe: vi.fn(),
    }} />);
    fireEvent.click(screen.getByRole('button', { name: /enable disruption alerts/i }));
    await waitFor(() => expect(subscribe).toHaveBeenCalledWith(['saved-a']));
  });

  test('never requests notification permission without a complete saved commute window', () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    render(<CommuteView records={[]} catalog={catalog} stage="pilot" gateOpen notificationEnvironment={{
      supported: true, permission: 'default', requestPermission, subscribe: vi.fn(), unsubscribe: vi.fn(),
    }} />);
    expect(screen.queryByRole('button', { name: /enable disruption alerts/i })).not.toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test('does not label saved stations as home or work or promise all-clear messages', () => {
    render(<CommuteView records={[record()]} catalog={catalog} stage="disabled" gateOpen={false} />);
    expect(screen.queryByText(/home|work|good service|all clear/i)).not.toBeInTheDocument();
    expect(screen.getByText(/disruption-only/i)).toBeInTheDocument();
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
