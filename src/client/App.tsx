import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import {
  createTransitApiClient,
  type BoardEnvelopeDto,
  type BootstrapEnvelopeDto,
  type CatalogEnvelopeDto,
  type LocationFixDto,
  type TransitApiClient,
} from './api/client';
import { AppHeader } from './components/AppHeader';
import { StatusBanner } from './components/StatusBanner';
import { boardRequestKey, type NearbyBoardState } from './components/StationCard';
import { ThumbDock } from './components/ThumbDock';
import { useLocation } from './hooks/use-location';
import {
  appReducer,
  createInitialAppState,
  readLastUsedStation,
  writeLastUsedStation,
  type AppState,
  type StationChoice,
} from './state/app-state';
import { createBrowserSavedStore, type BrowserStorage } from './storage/browser-store';
import { NearbyView } from './views/NearbyView';
import { StationView } from './views/StationView';

export interface AppProps {
  readonly api?: TransitApiClient;
  readonly geolocation?: Pick<Geolocation, 'getCurrentPosition'> | null;
  readonly storage?: Storage;
}

interface SelectedBoardState {
  readonly phase: 'idle' | 'loading' | 'ready' | 'error';
  readonly board?: BoardEnvelopeDto;
}

export function App({ api, geolocation, storage: providedStorage }: AppProps = {}) {
  const apiClient = useMemo(() => api ?? createTransitApiClient(), [api]);
  const storage = useMemo(() => providedStorage ?? browserStorage(), [providedStorage]);
  const local = useMemo(() => readLocalState(storage), [storage]);
  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialAppState({
    lastUsedStation: local.lastUsedStation,
    savedStations: local.savedRecords.map((record) => ({
      complexId: record.complexId, constituentId: record.constituentId, name: record.constituentId,
    })),
  }));
  const stateRef = useRef(state);
  stateRef.current = state;
  const [bootstrap, setBootstrap] = useState<BootstrapEnvelopeDto>();
  const [catalog, setCatalog] = useState<CatalogEnvelopeDto>();
  const [nearbyBoards, setNearbyBoards] = useState<ReadonlyMap<string, NearbyBoardState>>(() => new Map());
  const [selectedBoard, setSelectedBoard] = useState<SelectedBoardState>({ phase: 'idle' });
  const [stationOpen, setStationOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const nearbyGeneration = useRef(0);
  const nearbyAbort = useRef<AbortController | undefined>(undefined);
  const selectedGeneration = useRef(0);
  const selectedAbort = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const nextBootstrap = await apiClient.bootstrap(controller.signal);
        if (!active) return;
        setBootstrap(nextBootstrap);
        const nextCatalog = await apiClient.catalog(nextBootstrap.data.contentVersions.stationCatalog, controller.signal);
        if (active) setCatalog(nextCatalog);
      } catch (error) {
        if (!isAbort(error) && active) {
          setBootstrap(undefined);
          setCatalog(undefined);
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiClient]);

  const runNearby = useCallback((fix: LocationFixDto) => {
    nearbyAbort.current?.abort();
    const controller = new AbortController();
    nearbyAbort.current = controller;
    const requestId = nearbyGeneration.current + 1;
    nearbyGeneration.current = requestId;
    dispatch({ type: 'nearby-requested', requestId });
    void (async () => {
      try {
        const response = await apiClient.nearby(fix, false, controller.signal);
        if (controller.signal.aborted || nearbyGeneration.current !== requestId) return;
        dispatch({ type: 'nearby-resolved', requestId, responseIdentity: response.responseIdentity, response });
        if (response.data?.kind !== 'ranked') {
          setNearbyBoards(new Map());
          return;
        }
        const exactDirections = response.data.cards.flatMap(({ directions }) => directions);
        const unique = new Map(exactDirections.map((direction) => [boardRequestKey(direction), direction]));
        setNearbyBoards(new Map([...unique.keys()].map((key) => [key, { phase: 'loading' } as const])));
        for (const [key, direction] of unique) {
          void (async () => {
            try {
              const board = await apiClient.board(direction.constituentId, {
                routeIds: direction.routeIds,
                direction: direction.direction,
              }, controller.signal);
              settleNearbyBoard(key, { phase: 'ready', board });
            } catch (error) {
              if (!isAbort(error)) settleNearbyBoard(key, { phase: 'unavailable' });
            }
          })();
        }

        function settleNearbyBoard(key: string, next: NearbyBoardState) {
          if (controller.signal.aborted || nearbyGeneration.current !== requestId) return;
          setNearbyBoards((current) => {
            const settled = new Map(current);
            settled.set(key, next);
            return settled;
          });
        }
      } catch (error) {
        if (!isAbort(error) && nearbyGeneration.current === requestId) dispatch({ type: 'nearby-failed', requestId });
      }
    })();
  }, [apiClient]);

  const runSelectedBoard = useCallback((station: StationChoice, filters: AppState['filters']) => {
    selectedAbort.current?.abort();
    const controller = new AbortController();
    selectedAbort.current = controller;
    const requestId = selectedGeneration.current + 1;
    selectedGeneration.current = requestId;
    setSelectedBoard((current) => ({ phase: 'loading', ...(current.board ? { board: current.board } : {}) }));
    void apiClient.board(station.constituentId, filters, controller.signal).then((board) => {
      if (!controller.signal.aborted && selectedGeneration.current === requestId) setSelectedBoard({ phase: 'ready', board });
    }).catch((error: unknown) => {
      if (!isAbort(error) && selectedGeneration.current === requestId) setSelectedBoard((current) => ({ phase: 'error', ...(current.board ? { board: current.board } : {}) }));
    });
  }, [apiClient]);

  const openFallbackStation = useCallback((kind: 'denied' | 'failed', requestId: number) => {
    const current = stateRef.current;
    dispatch({ type: kind === 'denied' ? 'location-denied' : 'location-failed', requestId });
    nearbyAbort.current?.abort();
    if (current.selectionOwner === 'explicit') return;
    if (current.lastUsedStation) {
      setPickerOpen(false);
      setStationOpen(true);
      runSelectedBoard(current.lastUsedStation, current.filters);
    } else {
      setStationOpen(false);
    }
  }, [runSelectedBoard]);

  const location = useLocation({
    geolocation,
    onRequest: (requestId) => dispatch({ type: 'location-requested', requestId }),
    onFix: (requestId, fix) => {
      const explicitSelection = stateRef.current.selectionOwner === 'explicit';
      dispatch({ type: 'location-resolved', requestId, fix });
      runNearby(fix);
      if (explicitSelection) return;
      setPickerOpen(false);
      setStationOpen(false);
    },
    onDenied: (requestId) => openFallbackStation('denied', requestId),
    onFailure: (requestId) => openFallbackStation('failed', requestId),
  });

  useEffect(() => () => {
    nearbyAbort.current?.abort();
    selectedAbort.current?.abort();
  }, []);

  const savedChoices = useMemo(() => local.savedRecords.map((record) => {
    const complex = catalog?.data.complexes.find(({ id }) => id === record.complexId);
    const constituent = complex?.constituents.find(({ id }) => id === record.constituentId);
    return {
      complexId: record.complexId,
      constituentId: record.constituentId,
      name: constituent ? complex!.name : record.constituentId,
    };
  }), [catalog, local.savedRecords]);

  const selectStation = useCallback((
    station: StationChoice,
    exactFilters?: { readonly routeIds: readonly string[]; readonly direction: NonNullable<AppState['filters']['direction']> },
  ) => {
    nearbyAbort.current?.abort();
    nearbyGeneration.current += 1;
    dispatch({ type: 'station-selected', station, owner: 'explicit' });
    if (exactFilters) {
      dispatch({ type: 'filters-changed', routeIds: exactFilters.routeIds, direction: exactFilters.direction });
    }
    writeLastUsedStation(storage, station);
    setPickerOpen(false);
    setStationOpen(true);
    runSelectedBoard(station, exactFilters ?? stateRef.current.filters);
  }, [runSelectedBoard, storage]);

  const changeFilters = useCallback((filters: AppState['filters']) => {
    dispatch({ type: 'filters-changed', routeIds: filters.routeIds, ...(filters.direction ? { direction: filters.direction } : {}) });
    const station = stateRef.current.selectedStation;
    if (station) runSelectedBoard(station, filters);
  }, [runSelectedBoard]);

  const currentRuntime = selectedBoard.board?.runtime ?? state.nearby.response?.runtime ?? bootstrap?.runtime;
  const fallback = state.location.phase === 'denied' ? 'denied' as const
    : state.location.phase === 'failed' ? 'failed' as const : undefined;
  const selectedStation = state.selectedStation;

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <div className="app-frame">
        <AppHeader runtime={currentRuntime} />
        <div className="surface-frame">
          {state.surface === 'nearby' && stationOpen && selectedStation ? (
            <>
              {fallback ? (
                <StatusBanner tone="warning" actions={(
                  <>
                    {fallback === 'failed' ? <button type="button" onClick={location.retry}>Try location again</button> : null}
                    <button type="button" onClick={() => { setStationOpen(false); setPickerOpen(true); }}>Choose a station</button>
                  </>
                )}>
                  <p>Location unavailable. Showing your last station.</p>
                  {fallback === 'denied'
                    ? <p>Location permission is off. Enable location in your device settings to refresh Nearby.</p>
                    : null}
                </StatusBanner>
              ) : null}
              <StationView
                station={selectedStation}
                board={selectedBoard.board}
                phase={selectedBoard.phase}
                filters={state.filters}
                onFiltersChange={changeFilters}
                onRefresh={() => runSelectedBoard(selectedStation, stateRef.current.filters)}
              />
            </>
          ) : state.surface === 'nearby' ? (
            <NearbyView
              phase={state.nearby.phase}
              response={state.nearby.response}
              boards={nearbyBoards}
              savedChoices={savedChoices}
              pickerChoices={catalog?.data.complexes ?? []}
              fallback={fallback}
              pickerOpen={pickerOpen}
              onSelect={selectStation}
              onRetryLocation={location.retry}
              onOpenPicker={() => setPickerOpen(true)}
              onRefresh={() => {
                if (stateRef.current.location.phase === 'denied') return;
                if (stateRef.current.location.fix) runNearby(stateRef.current.location.fix);
                else location.retry();
              }}
            />
          ) : <FutureSurface surface={state.surface} savedCount={savedChoices.length} />}
        </div>
      </div>
      <ThumbDock
        active={state.surface}
        onChange={(surface) => {
          dispatch({ type: 'surface-changed', surface });
          if (surface === 'nearby') setStationOpen(false);
        }}
      />
    </main>
  );
}

function FutureSurface({ surface, savedCount }: { readonly surface: Exclude<AppState['surface'], 'nearby'>; readonly savedCount: number }) {
  const copy = surface === 'map'
    ? { title: 'Map', body: 'Day and Night reference maps arrive with offline journey tools.' }
    : surface === 'commute'
      ? { title: 'Commute', body: 'Commute alerts remain locked until their safety stage is enabled.' }
      : { title: 'Saved', body: `${savedCount} saved ${savedCount === 1 ? 'station is' : 'stations are'} on this device. Editing arrives with offline tools.` };
  return (
    <section className="surface future-surface" aria-labelledby={`${surface}-heading`}>
      <p className="section-kicker">Next subway tool</p>
      <h2 id={`${surface}-heading`}>{copy.title}</h2>
      <StatusBanner tone="locked"><p>{copy.body}</p></StatusBanner>
    </section>
  );
}

function readLocalState(storage: Storage) {
  const savedStore = createBrowserSavedStore(storage as BrowserStorage);
  const saved = savedStore.read();
  return Object.freeze({
    lastUsedStation: readLastUsedStation(storage),
    savedRecords: saved.kind === 'ready' ? saved.records : [],
  });
}

function browserStorage(): Storage {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
