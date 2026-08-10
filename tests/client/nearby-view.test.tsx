import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { App } from '../../src/client/App';
import { LAST_USED_STATION_KEY } from '../../src/client/state/app-state';
import { SAVED_STORE_KEY } from '../../src/client/storage/browser-store';
import { NearbyView } from '../../src/client/views/NearbyView';
import type { BoardEnvelopeDto, BootstrapEnvelopeDto, NearbyEnvelopeDto, TransitApiClient } from '../../src/client/api/client';
import {
  ControlledGeolocation,
  MemoryStorage,
  boardEnvelope,
  bootstrapEnvelope,
  catalogEnvelope,
  createClientApi,
  nearbyEnvelope,
} from '../helpers/client-fixtures';

describe('zero-tap Nearby rider view', () => {
  test('renders the cached shell and exact purpose before asking the browser for location', async () => {
    const geolocation = new ControlledGeolocation();
    const never = new Promise<BootstrapEnvelopeDto>(() => undefined);
    render(<App api={createClientApi({ bootstrap: async () => never })} geolocation={geolocation} storage={new MemoryStorage()} />);

    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'NYC Subway Train Time Tracker' })).toBeTruthy();
    expect(screen.getByText('Use your location to show nearby subway entrances and live arrivals.')).toBeTruthy();
    expect(screen.getByTestId('nearby-skeleton')).toBeTruthy();
    expect(geolocation.requests).toHaveLength(0);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
  });

  test.each([5, 1_000])('renders server-ranked practical-walk cards unchanged for a %s meter fix', async (accuracy) => {
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, accuracy));

    const cards = await screen.findAllByTestId('nearby-station-card');
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => within(card).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Canal St', '125 St', '14 St–Union Sq',
    ]);
    expect(within(cards[0]).getByRole('heading', { name: 'Uptown / Northbound' })).toBeTruthy();
    expect(within(cards[0]).getByRole('heading', { name: 'Downtown / Southbound' })).toBeTruthy();
  });

  test.each([false, true])('opens the exact platform board even when Nearby directions are reordered (%s)', async (reversed) => {
    const geolocation = new ControlledGeolocation();
    const sourceDirection = rankedNearbyData().cards[0].directions[0];
    const northbound = {
      ...sourceDirection,
      constituentId: 'CX-LOWER',
      constituentPublicName: 'Lower level',
      directionalStopId: 'CX-LOWERN',
      direction: 'northbound' as const,
      actualDestination: 'Jamaica–179 St',
      routeIds: ['F'],
    };
    const southbound = {
      ...sourceDirection,
      constituentId: 'CX-UPPER',
      constituentPublicName: 'Upper level',
      directionalStopId: 'CX-UPPERS',
      direction: 'southbound' as const,
      actualDestination: 'Coney Island–Stillwell Av',
      routeIds: ['F'],
    };
    const response: NearbyEnvelopeDto = {
      ...nearbyEnvelope,
      responseIdentity: `response:nearby:platform-order:${reversed}`,
      data: {
        kind: 'ranked',
        cards: [{
          complexId: 'CX',
          complexName: 'Transfer Hub',
          rankingRange: { minimumSeconds: 60, maximumSeconds: 90 },
          directions: reversed ? [southbound, northbound] : [northbound, southbound],
          stationDetailAvailable: true,
        }],
        picker: { required: false, bottomAnchored: true, options: [] },
      },
    };
    const board = vi.fn(async (stationId: string) => boardEnvelope(stationId, 'Transfer Hub', ['F']));
    render(<App api={createClientApi({ nearby: async () => response, board })} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 25));

    const exactAction = await screen.findByRole('button', {
      name: 'Open Uptown / Northbound board for Transfer Hub — Lower level',
    });
    expect(screen.queryByRole('button', { name: 'Full board' })).toBeNull();
    fireEvent.click(exactAction);

    await waitFor(() => expect(board.mock.calls.at(-1)).toEqual([
      'CX-LOWER',
      { routeIds: ['F'], direction: 'northbound' },
      expect.any(AbortSignal),
    ]));
  });

  test('resets exact platform filters when the rider next opens an ordinary saved station', async () => {
    const onSelect = vi.fn();
    const saved = { complexId: 'R20', constituentId: 'R20', name: 'Canal St' } as const;
    const common = {
      phase: 'ready' as const,
      response: transferHubNearbyEnvelope(),
      boards: new Map(),
      pickerChoices: catalogEnvelope.data.complexes,
      pickerOpen: false,
      onSelect,
      onRetryLocation: vi.fn(),
      onOpenPicker: vi.fn(),
      onRefresh: vi.fn(),
    };
    const view = render(<NearbyView {...common} savedChoices={[]} />);
    fireEvent.click(await screen.findByRole('button', {
      name: 'Open Uptown / Northbound board for Transfer Hub — Lower level',
    }));
    expect(onSelect).toHaveBeenLastCalledWith(
      { complexId: 'CX', constituentId: 'CX-LOWER', name: 'Transfer Hub' },
      { routeIds: ['F'], direction: 'northbound' },
    );

    view.rerender(<NearbyView {...common} fallback="failed" savedChoices={[saved]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Canal St saved station' }));

    expect(onSelect).toHaveBeenLastCalledWith(saved, { routeIds: [] });
  });

  test('resets exact platform filters when the rider next opens an ordinary picker station', async () => {
    const geolocation = new ControlledGeolocation();
    const board = vi.fn(async (stationId: string, filters?: Parameters<TransitApiClient['board']>[1]) => {
      const full = boardEnvelope(
        stationId,
        stationId === 'R20' ? 'Canal St' : 'Transfer Hub',
        stationId === 'R20' ? ['N', 'Q'] : ['F'],
      );
      if (stationId !== 'R20' || (!filters?.direction && (filters?.routeIds?.length ?? 0) === 0)) return full;
      return { ...full, data: full.data ? { ...full.data, directions: [] } : null };
    });
    render(<App
      api={createClientApi({ nearby: async () => transferHubNearbyEnvelope(), board })}
      geolocation={geolocation}
      storage={new MemoryStorage()}
    />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 25));
    fireEvent.click(await screen.findByRole('button', {
      name: 'Open Uptown / Northbound board for Transfer Hub — Lower level',
    }));
    expect(await screen.findByRole('heading', { name: 'Transfer Hub', level: 2 })).toBeTruthy();

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('button', { name: 'Nearby' }));
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'Nearby controls' })).getByRole('button', { name: 'Choose a station' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Canal St' }));

    expect(await screen.findByRole('heading', { name: 'Downtown / Southbound' })).toBeTruthy();
    await waitFor(() => expect(board.mock.calls.at(-1)).toEqual([
      'R20',
      { routeIds: [] },
      expect.any(AbortSignal),
    ]));
  });

  test('settles one rejected exact platform as unavailable while sibling arrivals remain useful', async () => {
    const geolocation = new ControlledGeolocation();
    const board = vi.fn(async (stationId: string, filters?: { readonly direction?: 'northbound' | 'southbound' }) => {
      if (stationId === 'R20' && filters?.direction === 'northbound') throw new Error('one platform failed');
      return boardEnvelope(stationId);
    });
    render(<App api={createClientApi({ board })} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 25));

    const canal = (await screen.findAllByTestId('nearby-station-card'))[0];
    const northbound = within(canal).getByRole('region', { name: 'Uptown / Northbound nearby service' });
    const southbound = within(canal).getByRole('region', { name: 'Downtown / Southbound nearby service' });
    expect(await within(northbound).findByText('Arrival information is unavailable for this exact platform.')).toBeTruthy();
    expect(within(northbound).queryByLabelText('Uptown / Northbound arrivals loading')).toBeNull();
    expect(await within(southbound).findByTestId('primary-arrival')).toBeTruthy();
  });

  test('renders resolved sibling platforms without waiting for another exact board request', async () => {
    const geolocation = new ControlledGeolocation();
    const pending = new Promise<BoardEnvelopeDto>(() => undefined);
    const board = vi.fn(async (stationId: string, filters?: { readonly direction?: 'northbound' | 'southbound' }) => {
      if (stationId === 'R20' && filters?.direction === 'northbound') return pending;
      return boardEnvelope(stationId);
    });
    render(<App api={createClientApi({ board })} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 25));

    const canal = (await screen.findAllByTestId('nearby-station-card'))[0];
    const northbound = within(canal).getByRole('region', { name: 'Uptown / Northbound nearby service' });
    const southbound = within(canal).getByRole('region', { name: 'Downtown / Southbound nearby service' });
    expect(within(northbound).getByLabelText('Uptown / Northbound arrivals loading')).toBeTruthy();
    expect(await within(southbound).findByTestId('primary-arrival')).toBeTruthy();
  });

  test('uses last-used station before saved choices when location is denied', async () => {
    const storage = new MemoryStorage();
    storage.setItem(LAST_USED_STATION_KEY, JSON.stringify({ complexId: 'A12', constituentId: 'A12', name: '125 St' }));
    storage.setItem(SAVED_STORE_KEY, JSON.stringify({
      version: 2,
      records: [{ id: 'canal', complexId: 'R20', constituentId: 'R20', routeFilters: [], accessibleRouteOnly: false, state: 'active' }],
    }));
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={storage} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.fail(0, 1));

    expect(await screen.findByRole('heading', { name: '125 St', level: 2 })).toBeTruthy();
    expect(screen.getByText('Location unavailable. Showing your last station.')).toBeTruthy();
    expect(screen.getByText(/enable location in your device settings/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try location again' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Canal St saved station' })).toBeNull();
  });

  test('shows saved choices without silently choosing one, then falls back to a closed-keyboard picker', async () => {
    const savedStorage = new MemoryStorage();
    savedStorage.setItem(SAVED_STORE_KEY, JSON.stringify({
      version: 2,
      records: [{ id: 'canal', complexId: 'R20', constituentId: 'R20', routeFilters: [], accessibleRouteOnly: false, state: 'active' }],
    }));
    const savedLocation = new ControlledGeolocation();
    const savedView = render(<App api={createClientApi()} geolocation={savedLocation} storage={savedStorage} />);
    await waitFor(() => expect(savedLocation.requests).toHaveLength(1));
    await act(async () => savedLocation.fail(0, 1));

    const choice = await screen.findByRole('button', { name: 'Canal St saved station' });
    expect(screen.queryByRole('heading', { name: 'Canal St', level: 2 })).toBeNull();
    fireEvent.click(choice);
    expect(await screen.findByRole('heading', { name: 'Canal St', level: 2 })).toBeTruthy();
    savedView.unmount();

    const emptyLocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={emptyLocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(emptyLocation.requests).toHaveLength(1));
    await act(async () => emptyLocation.fail(0, 1));
    expect(await screen.findByRole('heading', { name: 'Choose a station', level: 3 })).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  test('uses exact temporary-failure copy and actions while preserving the last station', async () => {
    const storage = new MemoryStorage();
    storage.setItem(LAST_USED_STATION_KEY, JSON.stringify({ complexId: 'A12', constituentId: 'A12', name: '125 St' }));
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={storage} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.fail(0, 2));

    expect(await screen.findByText('Location unavailable. Showing your last station.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try location again' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose a station' })).toBeTruthy();
    expect(await screen.findByRole('heading', { name: '125 St', level: 2 })).toBeTruthy();
  });

  test('uses the temporary-failure fallback when the browser has no location capability', async () => {
    const storage = new MemoryStorage();
    storage.setItem(LAST_USED_STATION_KEY, JSON.stringify({ complexId: 'A12', constituentId: 'A12', name: '125 St' }));
    render(<App api={createClientApi()} geolocation={null} storage={storage} />);

    expect(await screen.findByText('Location unavailable. Showing your last station.')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: '125 St', level: 2 })).toBeTruthy();
  });

  test('keeps an explicit saved choice when a late location callback arrives', async () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVED_STORE_KEY, JSON.stringify({
      version: 2,
      records: [{ id: 'canal', complexId: 'R20', constituentId: 'R20', routeFilters: [], accessibleRouteOnly: false, state: 'active' }],
    }));
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={storage} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.fail(0, 2));
    fireEvent.click(await screen.findByRole('button', { name: 'Canal St saved station' }));
    expect(await screen.findByRole('heading', { name: 'Canal St', level: 2 })).toBeTruthy();

    await act(async () => geolocation.succeed(0, 5));
    expect(screen.getByRole('heading', { name: 'Canal St', level: 2 })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '125 St', level: 2 })).toBeNull();
  });

  test('keeps an explicit picker choice when a retried location request later fails', async () => {
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.fail(0, 2));

    fireEvent.click(await screen.findByRole('button', { name: /^Canal St\b/ }));
    expect(await screen.findByRole('heading', { name: 'Canal St', level: 2 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try location again' }));
    await waitFor(() => expect(geolocation.requests).toHaveLength(2));
    await act(async () => geolocation.fail(1, 2));

    expect(screen.getByRole('heading', { name: 'Canal St', level: 2 })).toBeTruthy();
    expect(screen.getByText('Location unavailable. Showing your last station.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Choose a station' })).toBeNull();
  });

  test('refreshes Nearby suggestions after an explicit-station retry without replacing that station', async () => {
    const nearby = vi.fn(async () => nearbyEnvelope);
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi({ nearby })} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.fail(0, 2));
    fireEvent.click(await screen.findByRole('button', { name: /^Canal St\b/ }));
    expect(await screen.findByRole('heading', { name: 'Canal St', level: 2 })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try location again' }));
    await waitFor(() => expect(geolocation.requests).toHaveLength(2));
    await act(async () => geolocation.succeed(1, 50));

    await waitFor(() => expect(nearby).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { name: 'Canal St', level: 2 })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('button', { name: 'Nearby' }));
    expect(await screen.findAllByTestId('nearby-station-card')).toHaveLength(3);
  });

  test('reacquires a current exact fix for Nearby refresh instead of replaying retained coordinates', async () => {
    const storage = new MemoryStorage();
    const nearby = vi.fn(async () => nearbyEnvelope);
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi({ nearby })} geolocation={geolocation} storage={storage} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(
      0, 12, { latitude: 40.700123, longitude: -74.000456 },
    ));
    await waitFor(() => expect(nearby).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Refresh nearby stations' }));

    expect(geolocation.requests).toHaveLength(2);
    expect(nearby).toHaveBeenCalledTimes(1);
    await act(async () => geolocation.succeed(
      1, 18, { latitude: 40.711234, longitude: -73.991234 },
    ));
    await waitFor(() => expect(nearby).toHaveBeenCalledTimes(2));
    expect(nearby).toHaveBeenLastCalledWith({
      coordinate: { latitude: 40.711234, longitude: -73.991234 }, accuracyMeters: 18,
    }, false, expect.any(AbortSignal));
    expect([...storage.values.values()].join('\n')).not.toMatch(/40\.700123|-74\.000456|40\.711234|-73\.991234/u);
  });

  test('does not re-prompt from denial controls and instead gives device-settings guidance', async () => {
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.fail(0, 1));

    expect(await screen.findByText(/enable it in your device settings/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try location again' })).toBeNull();
    const refresh = screen.getByRole('button', { name: 'Refresh nearby stations' }) as HTMLButtonElement;
    expect(refresh.disabled).toBe(true);
    fireEvent.click(refresh);
    expect(geolocation.requests).toHaveLength(1);
  });

  test('does not post Nearby coordinates when the app unmounts before a location callback', async () => {
    const nearby = vi.fn(async () => nearbyEnvelope);
    const geolocation = new ControlledGeolocation();
    const view = render(<App api={createClientApi({ nearby })} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));

    view.unmount();
    act(() => geolocation.succeed(0, 25));

    expect(nearby).not.toHaveBeenCalled();
  });

  test('keeps the four frequent destinations in the specified bottom-navigation order', async () => {
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={new MemoryStorage()} />);
    await screen.findByText('Validation view');
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    const navigation = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(navigation).getAllByRole('button').map((button) => button.lastElementChild?.textContent)).toEqual([
      'Nearby', 'Map', 'Commute', 'Saved',
    ]);
  });

  test('keeps Nearby refresh and station choice in the bottom thumb-control area', async () => {
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi()} geolocation={geolocation} storage={new MemoryStorage()} />);

    const controls = screen.getByRole('toolbar', { name: 'Nearby controls' });
    expect(within(controls).getByRole('button', { name: 'Refresh nearby stations' })).toBeTruthy();
    expect(within(controls).getByRole('button', { name: 'Choose a station' })).toBeTruthy();
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
  });

  test('shows an honest gate instead of operational rows when public Nearby is locked', async () => {
    const geolocation = new ControlledGeolocation();
    const lockedApi = createClientApi({
      nearby: async () => ({
        ...bootstrapEnvelope,
        responseIdentity: 'response:nearby:locked',
        runtime: { mode: 'live', surface: 'public', availability: 'locked' },
        gateDecision: bootstrapEnvelope.gates['nearby-offline'],
        data: null,
      }),
      catalog: async () => catalogEnvelope,
    });
    render(<App api={lockedApi} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 25));

    expect(await screen.findByText('Nearby live information is not released yet.')).toBeTruthy();
    expect(screen.queryByTestId('primary-arrival')).toBeNull();
  });

  test('resolves a server picker complex to exact catalog constituents instead of guessing a board id', async () => {
    const geolocation = new ControlledGeolocation();
    const board = vi.fn(async (stationId: string) => boardEnvelope(stationId, stationId));
    const api = createClientApi({
      catalog: async () => ({
        ...catalogEnvelope,
        data: {
          complexes: [{
            id: 'CX', name: 'Transfer Hub', routeIds: ['F'],
            constituents: [
              { id: 'CX-LOWER', name: 'Lower level', directionalStopIds: ['CX-LOWERN'] },
              { id: 'CX-UPPER', name: 'Upper level', directionalStopIds: ['CX-UPPERN'] },
            ],
          }],
        },
      }),
      nearby: async () => ({
        ...nearbyEnvelope,
        responseIdentity: 'response:nearby:picker',
        data: {
          kind: 'picker', reason: 'walk-unavailable', cards: [],
          picker: {
            required: true, bottomAnchored: true,
            options: [{ complexId: 'CX', complexName: 'Transfer Hub', entranceAvailability: 'confirmed', stationDetailAvailable: true }],
          },
        },
      }),
      board,
    });
    render(<App api={api} geolocation={geolocation} storage={new MemoryStorage()} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 25));

    expect(await screen.findByRole('heading', { name: 'Choose a station', level: 3 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Transfer Hub — Upper level' }));

    await waitFor(() => expect(board).toHaveBeenCalled());
    expect(board.mock.calls.at(-1)?.[0]).toBe('CX-UPPER');
    expect(board.mock.calls.some(([stationId]) => stationId === 'CX')).toBe(false);
  });
});

function rankedNearbyData(): Extract<NearbyEnvelopeDto['data'], { readonly kind: 'ranked' }> {
  if (nearbyEnvelope.data?.kind !== 'ranked') throw new Error('Expected ranked Nearby fixture.');
  return nearbyEnvelope.data;
}

function transferHubNearbyEnvelope(): NearbyEnvelopeDto {
  const sourceDirection = rankedNearbyData().cards[0].directions[0];
  return {
    ...nearbyEnvelope,
    responseIdentity: 'response:nearby:transfer-hub',
    data: {
      kind: 'ranked',
      cards: [{
        complexId: 'CX',
        complexName: 'Transfer Hub',
        rankingRange: { minimumSeconds: 60, maximumSeconds: 90 },
        directions: [
          {
            ...sourceDirection,
            constituentId: 'CX-LOWER',
            constituentPublicName: 'Lower level',
            directionalStopId: 'CX-LOWERN',
            direction: 'northbound',
            actualDestination: 'Jamaica–179 St',
            routeIds: ['F'],
          },
          {
            ...sourceDirection,
            constituentId: 'CX-UPPER',
            constituentPublicName: 'Upper level',
            directionalStopId: 'CX-UPPERS',
            direction: 'southbound',
            actualDestination: 'Coney Island–Stillwell Av',
            routeIds: ['F'],
          },
        ],
        stationDetailAvailable: true,
      }],
      picker: { required: false, bottomAnchored: true, options: [] },
    },
  };
}
