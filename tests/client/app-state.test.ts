import { describe, expect, test } from 'vitest';

import { appReducer, createInitialAppState } from '../../src/client/state/app-state';

const lastStation = { complexId: 'A12', constituentId: 'A12', name: '125 St' } as const;
const chosenStation = { complexId: 'R20', constituentId: 'R20', name: 'Canal St' } as const;

describe('rider-owned application state', () => {
  test('never lets a late location result replace an explicit station choice', () => {
    let state = createInitialAppState({ lastUsedStation: lastStation, savedStations: [] });
    state = appReducer(state, { type: 'location-requested', requestId: 1 });
    state = appReducer(state, { type: 'station-selected', station: chosenStation, owner: 'explicit' });
    state = appReducer(state, {
      type: 'location-resolved', requestId: 1,
      fix: { coordinate: { latitude: 40.7, longitude: -74 }, accuracyMeters: 5 },
    });

    expect(state.selectedStation).toEqual(chosenStation);
    expect(state.selectionOwner).toBe('explicit');
    expect(state.location.fix).toBeUndefined();
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
    state = appReducer(state, { type: 'station-selected', station: lastStation, owner: 'explicit' });
    state = appReducer(state, { type: 'filters-changed', routeIds: ['A'], direction: 'northbound' });
    state = appReducer(state, { type: 'warning-added', warning: 'A trains are delayed.' });
    state = appReducer(state, { type: 'refresh-requested', requestId: 4 });

    expect(state.selectedStation).toEqual(lastStation);
    expect(state.selectionOwner).toBe('explicit');
    expect(state.filters).toEqual({ routeIds: ['A'], direction: 'northbound' });
    expect(state.warnings).toEqual(['A trains are delayed.']);
    expect(state.refresh).toEqual({ phase: 'loading', requestId: 4 });
  });
});
