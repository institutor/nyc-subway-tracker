import { createContext, type Dispatch, type PropsWithChildren, useContext, useMemo, useReducer } from 'react';

import type { LocationFixDto, NearbyEnvelopeDto } from '../api/client';
import type { Direction } from '../../shared/domain/types';

export const LAST_USED_STATION_KEY = 'nyc-subway-tracker:last-station:v1';

export interface StationChoice {
  readonly complexId: string;
  readonly constituentId: string;
  readonly name: string;
}

export interface AppState {
  readonly surface: 'nearby' | 'map' | 'commute' | 'saved' | 'data-status' | 'settings';
  readonly selectedStation?: StationChoice;
  readonly selectionOwner?: 'fallback' | 'explicit';
  readonly lastUsedStation?: StationChoice;
  readonly savedStations: readonly StationChoice[];
  readonly location: {
    readonly phase: 'idle' | 'requesting' | 'ready' | 'denied' | 'failed';
    readonly requestId: number;
    readonly fix?: LocationFixDto;
  };
  readonly nearby: {
    readonly phase: 'idle' | 'loading' | 'ready' | 'error';
    readonly requestId: number;
    readonly responseIdentity?: string;
    readonly response?: NearbyEnvelopeDto;
  };
  readonly refresh: { readonly phase: 'idle' | 'loading'; readonly requestId: number };
  readonly filters: { readonly routeIds: readonly string[]; readonly direction?: Direction };
  readonly warnings: readonly string[];
}

export type AppAction =
  | { readonly type: 'surface-changed'; readonly surface: AppState['surface'] }
  | { readonly type: 'personal-data-reset' }
  | { readonly type: 'location-requested'; readonly requestId: number }
  | { readonly type: 'location-resolved'; readonly requestId: number; readonly fix: LocationFixDto }
  | { readonly type: 'location-denied'; readonly requestId: number }
  | { readonly type: 'location-failed'; readonly requestId: number }
  | {
      readonly type: 'station-selected';
      readonly station: StationChoice;
      readonly owner: 'fallback' | 'explicit';
      readonly filters: AppState['filters'];
    }
  | { readonly type: 'nearby-requested'; readonly requestId: number }
  | { readonly type: 'nearby-resolved'; readonly requestId: number; readonly responseIdentity: string; readonly response?: NearbyEnvelopeDto }
  | { readonly type: 'nearby-failed'; readonly requestId: number }
  | { readonly type: 'filters-changed'; readonly routeIds: readonly string[]; readonly direction?: Direction }
  | { readonly type: 'warning-added'; readonly warning: string }
  | { readonly type: 'refresh-requested'; readonly requestId: number }
  | { readonly type: 'refresh-completed'; readonly requestId: number };

export function createInitialAppState(input: {
  readonly lastUsedStation?: StationChoice;
  readonly savedStations: readonly StationChoice[];
  readonly initialSurface?: AppState['surface'];
}): AppState {
  const lastUsedStation = input.lastUsedStation ? captureStation(input.lastUsedStation) : undefined;
  return freeze({
    surface: input.initialSurface ?? 'nearby',
    ...(lastUsedStation ? { selectedStation: lastUsedStation, selectionOwner: 'fallback' as const, lastUsedStation } : {}),
    savedStations: input.savedStations.map(captureStation),
    location: { phase: 'idle', requestId: 0 },
    nearby: { phase: 'idle', requestId: 0 },
    refresh: { phase: 'idle', requestId: 0 },
    filters: { routeIds: [] },
    warnings: [],
  });
}

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'surface-changed') return freeze({ ...state, surface: action.surface });
  if (action.type === 'personal-data-reset') return freeze({
    ...state,
    selectedStation: undefined,
    selectionOwner: undefined,
    lastUsedStation: undefined,
    savedStations: [],
    filters: { routeIds: [] },
    nearby: { phase: 'idle', requestId: state.nearby.requestId },
    location: { phase: 'idle', requestId: state.location.requestId },
  });
  if (action.type === 'location-requested') {
    return freeze({ ...state, location: { phase: 'requesting', requestId: requestId(action.requestId) } });
  }
  if (action.type === 'location-resolved') {
    if (action.requestId !== state.location.requestId) return state;
    return freeze({ ...state, location: { phase: 'ready', requestId: action.requestId, fix: captureFix(action.fix) } });
  }
  if (action.type === 'location-denied' || action.type === 'location-failed') {
    if (action.requestId !== state.location.requestId) return state;
    return freeze({
      ...state,
      location: { phase: action.type === 'location-denied' ? 'denied' : 'failed', requestId: action.requestId },
    });
  }
  if (action.type === 'station-selected') {
    return freeze({
      ...state,
      selectedStation: captureStation(action.station),
      selectionOwner: action.owner,
      filters: captureFilters(action.filters),
    });
  }
  if (action.type === 'nearby-requested') {
    return freeze({ ...state, nearby: { ...state.nearby, phase: 'loading', requestId: requestId(action.requestId) } });
  }
  if (action.type === 'nearby-resolved') {
    if (action.requestId !== state.nearby.requestId) return state;
    return freeze({
      ...state,
      nearby: {
        phase: 'ready', requestId: action.requestId, responseIdentity: identity(action.responseIdentity),
        ...(action.response ? { response: action.response } : {}),
      },
    });
  }
  if (action.type === 'nearby-failed') {
    if (action.requestId !== state.nearby.requestId) return state;
    return freeze({ ...state, nearby: { phase: 'error', requestId: action.requestId } });
  }
  if (action.type === 'filters-changed') {
    return freeze({ ...state, filters: captureFilters(action) });
  }
  if (action.type === 'warning-added') {
    const warning = display(action.warning);
    return state.warnings.includes(warning) ? state : freeze({ ...state, warnings: [...state.warnings, warning] });
  }
  if (action.type === 'refresh-requested') {
    return freeze({ ...state, refresh: { phase: 'loading', requestId: requestId(action.requestId) } });
  }
  if (action.type === 'refresh-completed') {
    if (action.requestId !== state.refresh.requestId) return state;
    return freeze({ ...state, refresh: { phase: 'idle', requestId: action.requestId } });
  }
  return state;
}

interface AppStateContextValue {
  readonly state: AppState;
  readonly dispatch: Dispatch<AppAction>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children, initialState }: PropsWithChildren<{ readonly initialState: AppState }>) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('App state is unavailable.');
  return value;
}

export function readLastUsedStation(storage: Pick<Storage, 'getItem'>): StationChoice | undefined {
  try {
    const raw = storage.getItem(LAST_USED_STATION_KEY);
    if (raw === null || new TextEncoder().encode(raw).byteLength > 2_048) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.getPrototypeOf(parsed) !== Object.prototype) return undefined;
    const record = parsed as Record<string, unknown>;
    if (Object.keys(record).length !== 3) return undefined;
    return captureStation({ complexId: record.complexId, constituentId: record.constituentId, name: record.name } as StationChoice);
  } catch {
    return undefined;
  }
}

export function writeLastUsedStation(storage: Pick<Storage, 'setItem'>, station: StationChoice): void {
  try {
    storage.setItem(LAST_USED_STATION_KEY, JSON.stringify(captureStation(station)));
  } catch {
    // A local preference write never blocks current transit information.
  }
}

function captureFix(value: LocationFixDto): LocationFixDto {
  const { latitude, longitude } = value.coordinate;
  if (![latitude, longitude, value.accuracyMeters].every((candidate) => Number.isFinite(candidate))
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || value.accuracyMeters <= 0) {
    throw new Error('Invalid location fix');
  }
  return { coordinate: { latitude, longitude }, accuracyMeters: value.accuracyMeters };
}

function captureStation(value: StationChoice): StationChoice {
  return { complexId: identity(value.complexId), constituentId: identity(value.constituentId), name: display(value.name) };
}

function captureFilters(value: AppState['filters']): AppState['filters'] {
  return { routeIds: unique(value.routeIds), ...(value.direction ? { direction: value.direction } : {}) };
}

function identity(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid station identity');
  const normalized = value.normalize('NFC');
  if (!normalized || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error('Invalid station identity');
  return normalized;
}

function display(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid display text');
  const normalized = value.normalize('NFC').trim();
  if (!normalized || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error('Invalid display text');
  return normalized;
}

function requestId(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid request generation');
  return value;
}

function unique(values: readonly string[]): readonly string[] {
  const captured = values.map(identity);
  if (new Set(captured).size !== captured.length) throw new Error('Duplicate filter');
  return captured;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
}
