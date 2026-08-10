import { describe, expect, test } from 'vitest';

import { appReducer, createInitialAppState, type AppAction } from '../../src/client/state/app-state';

const lastStation = { complexId: 'A12', constituentId: 'A12', name: '125 St' } as const;
const chosenStation = { complexId: 'R20', constituentId: 'R20', name: 'Canal St' } as const;

describe('rider-owned application state', () => {
  test('can initialize directly on the commute destination for notification deep links', () => {
    expect(createInitialAppState({ savedStations: [], initialSurface: 'commute' }).surface).toBe('commute');
  });

  test('never lets a late location result replace an explicit station choice', () => {
    let state = createInitialAppState({ lastUsedStation: lastStation, savedStations: [] });
    state = appReducer(state, { type: 'location-requested', requestId: 1 });
    state = appReducer(state, { type: 'station-selected', station: chosenStation, owner: 'explicit', filters: { routeIds: [] } });
    state = appReducer(state, {
      type: 'location-resolved', requestId: 1,
      fix: { coordinate: { latitude: 40.7, longitude: -74 }, accuracyMeters: 5 },
    } as unknown as AppAction);

    expect(state.selectedStation).toEqual(chosenStation);
    expect(state.selectionOwner).toBe('explicit');
    expect(state.location).toEqual({ phase: 'ready', requestId: 1 });
    expect(JSON.stringify(state)).not.toMatch(/40\.7|-74/u);
  });

  test('finishes a successful location retry without surrendering an explicit station', () => {
    let state = createInitialAppState({ savedStations: [] });
    state = appReducer(state, { type: 'station-selected', station: chosenStation, owner: 'explicit', filters: { routeIds: [] } });
    state = appReducer(state, { type: 'location-requested', requestId: 2 });
    state = appReducer(state, { type: 'location-resolved', requestId: 2 });

    expect(state.selectedStation).toEqual(chosenStation);
    expect(state.selectionOwner).toBe('explicit');
    expect(state.location).toEqual({ phase: 'ready', requestId: 2 });
  });

  test.each([
    ['location-denied', 'denied'],
    ['location-failed', 'failed'],
  ] as const)('finishes an unsuccessful explicit-station retry as %s', (type, phase) => {
    let state = createInitialAppState({ savedStations: [] });
    state = appReducer(state, { type: 'station-selected', station: chosenStation, owner: 'explicit', filters: { routeIds: [] } });
    state = appReducer(state, { type: 'location-requested', requestId: 3 });
    state = appReducer(state, { type, requestId: 3 });

    expect(state.selectedStation).toEqual(chosenStation);
    expect(state.selectionOwner).toBe('explicit');
    expect(state.location).toEqual({ phase, requestId: 3 });
  });

  test('accepts only the newest overlapping Nearby response', () => {
    let state = createInitialAppState({ savedStations: [] });
    state = appReducer(state, { type: 'nearby-requested', requestId: 11 });
    state = appReducer(state, { type: 'nearby-requested', requestId: 12 });
    state = appReducer(state, { type: 'nearby-resolved', requestId: 11, responseIdentity: 'stale' });
    expect(state.nearby.responseIdentity).toBeUndefined();

    state = appReducer(state, { type: 'nearby-resolved', requestId: 12, responseIdentity: 'current' });
    expect(state.nearby).toMatchObject({ phase: 'ready', responseIdentity: 'current', requestId: 12 });
  });

  test('refresh preserves station ownership, route and direction filters, and warnings', () => {
    let state = createInitialAppState({ lastUsedStation: lastStation, savedStations: [] });
    state = appReducer(state, { type: 'station-selected', station: lastStation, owner: 'explicit', filters: { routeIds: [] } });
    state = appReducer(state, { type: 'filters-changed', routeIds: ['A'], direction: 'northbound' });
    state = appReducer(state, { type: 'warning-added', warning: 'A trains are delayed.' });
    state = appReducer(state, { type: 'refresh-requested', requestId: 4 });

    expect(state.selectedStation).toEqual(lastStation);
    expect(state.selectionOwner).toBe('explicit');
    expect(state.filters).toEqual({ routeIds: ['A'], direction: 'northbound' });
    expect(state.warnings).toEqual(['A trains are delayed.']);
    expect(state.refresh).toEqual({ phase: 'loading', requestId: 4 });
  });

  test.each([
    [{ routeIds: [] }],
    [{ routeIds: ['F'], direction: 'northbound' as const }],
  ])('station selection atomically replaces filters with the new owner\'s %j', (filters) => {
    let state = createInitialAppState({ savedStations: [] });
    state = appReducer(state, { type: 'filters-changed', routeIds: ['A'], direction: 'southbound' });
    const selection = { type: 'station-selected' as const, station: chosenStation, owner: 'explicit' as const, filters };

    state = appReducer(state, selection);

    expect(state.selectedStation).toEqual(chosenStation);
    expect(state.filters).toEqual(filters);
  });
});
