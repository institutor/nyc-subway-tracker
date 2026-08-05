import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import type { Direction, SavedRecord } from '../shared/domain/types';
import {
  bindJourneyCapturePackage,
  type JourneyCaptureClaimScope,
  type JourneyCapturePackage,
} from '../shared/domain/journey-capture';
import {
  createTransitApiClient,
  type BoardEnvelopeDto,
  type BootstrapDataDto,
  type BootstrapEnvelopeDto,
  type CatalogComplexDto,
  type CatalogEnvelopeDto,
  type JourneyEnvelopeDto,
  type JourneyGraphReferenceDto,
  type JourneyItineraryDto,
  type LocationFixDto,
  type MapOverlayEnvelopeDto,
  TransitApiError,
  type TransitApiClient,
} from './api/client';
import { ActiveTripCard } from './components/ActiveTripCard';
import { AppHeader } from './components/AppHeader';
import { OfflineBanner } from './components/OfflineBanner';
import { StatusBanner } from './components/StatusBanner';
import { boardRequestKey, type NearbyBoardState } from './components/StationCard';
import { ThumbDock } from './components/ThumbDock';
import {
  useConnectivity,
  type ConnectivityState,
  type UseConnectivityOptions,
} from './hooks/use-connectivity';
import { useLocation } from './hooks/use-location';
import { createOfflineJourneyPlanner } from './offline/plan-offline-journey';
import {
  createAppReconnectionStageLoader,
  type AppReconnectionArtifacts,
} from './recovery/app-reconnection-loader';
import {
  runReconnection,
  type ReconnectionTransition,
} from './recovery/run-reconnection';
import {
  appReducer,
  createInitialAppState,
  readLastUsedStation,
  writeLastUsedStation,
  type AppState,
  type StationChoice,
} from './state/app-state';
import {
  createBrowserActiveTripStore,
  type ActiveTripRecord,
} from './storage/active-trip-store';
import {
  createBrowserSavedStore,
  type BrowserStorage,
  type BrowserStoreMutation,
} from './storage/browser-store';
import { createBrowserStructuralStore } from './storage/structural-store';
import { MapView, type MapContext } from './views/MapView';
import { NearbyView } from './views/NearbyView';
import { SavedView } from './views/SavedView';
import { StationView } from './views/StationView';
import type {
  PreservedReconnectionContext,
  ReconnectionScopeMembership,
  ReconnectionState,
} from '../shared/domain/reconnection';

export interface AppProps {
  readonly api?: TransitApiClient;
  readonly geolocation?: Pick<Geolocation, 'getCurrentPosition'> | null;
  readonly storage?: Storage;
  readonly connectivity?: ConnectivityState;
  readonly connectivityOptions?: UseConnectivityOptions;
  readonly recoveryNow?: () => Date;
  readonly onReconnectionTransition?: (transition: ReconnectionTransition) => void;
}

interface SelectedBoardState {
  readonly phase: 'idle' | 'loading' | 'ready' | 'error';
  readonly board?: BoardEnvelopeDto;
}

const DEFAULT_MAP_CONTEXT: MapContext = Object.freeze({
  serviceMeaning: 'actual-now',
  spatialView: 'schematic',
  viewport: Object.freeze({ centerX: 40.7128, centerY: -74.006, zoom: 1 }),
});

export function App({
  api,
  geolocation,
  storage: providedStorage,
  connectivity: connectivityOverride,
  connectivityOptions,
  recoveryNow,
  onReconnectionTransition,
}: AppProps = {}) {
  const apiClient = useMemo(() => api ?? createTransitApiClient(), [api]);
  const storage = useMemo(() => providedStorage ?? browserStorage(), [providedStorage]);
  const savedStore = useMemo(() => createBrowserSavedStore(storage as BrowserStorage), [storage]);
  const activeTripStore = useMemo(() => createBrowserActiveTripStore(storage as BrowserStorage), [storage]);
  const structuralStore = useMemo(() => createBrowserStructuralStore(storage as BrowserStorage), [storage]);
  const local = useMemo(
    () => readLocalState(storage, savedStore, activeTripStore, structuralStore),
    [activeTripStore, savedStore, storage, structuralStore],
  );
  const connectivity = useConnectivity(connectivityOptions);
  const connectivityState = connectivityOverride ?? connectivity.state;
  const [retainedHistorical, setRetainedHistorical] = useState(false);
  const connected = connectivityState === 'online' && !retainedHistorical;
  const offline = connectivityState === 'offline';
  const connectedRef = useRef(connected);
  connectedRef.current = connected;

  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialAppState({
    lastUsedStation: local.lastUsedStation,
    savedStations: local.savedRecords.map((record) => ({
      complexId: record.complexId, constituentId: record.constituentId, name: record.constituentId,
    })),
  }));
  const stateRef = useRef(state);
  stateRef.current = state;
  const [bootstrap, setBootstrap] = useState<BootstrapEnvelopeDto>();
  const [catalog, setCatalog] = useState<CatalogEnvelopeDto | undefined>(local.structural?.catalog);
  const [mapVersions, setMapVersions] = useState<BootstrapDataDto['contentVersions']['maps'] | undefined>(local.structural?.contentVersions.maps);
  const [journeyReference, setJourneyReference] = useState<JourneyGraphReferenceDto>();
  const initialServiceWorkerController = useRef(browserServiceWorker()?.controller ?? null);
  const [serviceWorkerClaimGeneration, setServiceWorkerClaimGeneration] = useState(0);
  const [savedRecords, setSavedRecords] = useState<readonly SavedRecord[]>(local.savedRecords);
  const [activeTrip, setActiveTrip] = useState<ActiveTripRecord | null>(local.activeTrip);
  const [activeTripOpen, setActiveTripOpen] = useState(offline);
  const [captureMessage, setCaptureMessage] = useState<string>();
  const [mapContext, setMapContext] = useState<MapContext>(DEFAULT_MAP_CONTEXT);
  const [recoveredMapOverlay, setRecoveredMapOverlay] = useState<MapOverlayEnvelopeDto>();
  const [reconnectionState, setReconnectionState] = useState<ReconnectionState>();
  const [nearbyBoards, setNearbyBoards] = useState<ReadonlyMap<string, NearbyBoardState>>(() => new Map());
  const [selectedBoard, setSelectedBoard] = useState<SelectedBoardState>({ phase: 'idle' });
  const [savedBoards, setSavedBoards] = useState<ReadonlyMap<string, BoardEnvelopeDto>>(() => new Map());
  const [stationOpen, setStationOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const nearbyGeneration = useRef(0);
  const nearbyAbort = useRef<AbortController | undefined>(undefined);
  const selectedGeneration = useRef(0);
  const selectedAbort = useRef<AbortController | undefined>(undefined);
  const savedAbort = useRef(new Map<string, AbortController>());
  const recoveryAbort = useRef<AbortController | undefined>(undefined);
  const recoveryGeneration = useRef(0);

  useEffect(() => {
    const serviceWorker = browserServiceWorker();
    if (!serviceWorker) return undefined;
    let accountedController = initialServiceWorkerController.current;
    const acceptController = () => {
      const controller = serviceWorker.controller;
      if (!controller || controller === accountedController) return;
      accountedController = controller;
      setServiceWorkerClaimGeneration((generation) => generation + 1);
    };
    serviceWorker.addEventListener('controllerchange', acceptController);
    acceptController();
    return () => serviceWorker.removeEventListener('controllerchange', acceptController);
  }, []);

  useEffect(() => {
    if (offline) setActiveTripOpen(Boolean(activeTrip));
  }, [activeTrip, offline]);

  useEffect(() => {
    if (!connected) return undefined;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const nextBootstrap = await apiClient.bootstrap(controller.signal);
        if (!active) return;
        connectivity.reportRequestResult('accepted');
        setBootstrap(nextBootstrap);
        const [nextCatalog, nextJourneyReference] = await Promise.all([
          apiClient.catalog(nextBootstrap.data.contentVersions.stationCatalog, controller.signal),
          apiClient.journeyReference(nextBootstrap.data.contentVersions.journeyGraph, controller.signal),
        ]);
        if (!active) return;
        connectivity.reportRequestResult('accepted');
        setCatalog(nextCatalog);
        setJourneyReference(nextJourneyReference.data);
        setMapVersions(nextBootstrap.data.contentVersions.maps);
        structuralStore.write(nextBootstrap.data.contentVersions, nextCatalog);
        void Promise.allSettled([
          apiClient.mapReference('day', nextBootstrap.data.contentVersions.maps.day, controller.signal),
          apiClient.mapReference('night', nextBootstrap.data.contentVersions.maps.night, controller.signal),
        ]);
      } catch (error) {
        if (!isAbort(error) && active) {
          connectivity.reportRequestResult(classifyRequestFailure(error));
          setBootstrap(undefined);
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiClient, connected, connectivity.reportRequestResult, structuralStore]);

  useEffect(() => {
    if (!connected || serviceWorkerClaimGeneration === 0 || !bootstrap) return undefined;
    const controller = new AbortController();
    const versions = bootstrap.data.contentVersions;
    void Promise.allSettled([
      apiClient.catalog(versions.stationCatalog, controller.signal),
      apiClient.journeyReference(versions.journeyGraph, controller.signal),
      apiClient.mapReference('day', versions.maps.day, controller.signal),
      apiClient.mapReference('night', versions.maps.night, controller.signal),
    ]);
    return () => controller.abort();
  }, [apiClient, bootstrap, connected, serviceWorkerClaimGeneration]);

  useEffect(() => {
    const contentVersion = local.structural?.contentVersions.journeyGraph;
    if (connectivityState !== 'offline' || !contentVersion) return undefined;
    const controller = new AbortController();
    void apiClient.journeyReference(contentVersion, controller.signal).then((reference) => {
      if (!controller.signal.aborted) setJourneyReference(reference.data);
    }).catch(() => {
      if (!controller.signal.aborted) setJourneyReference(undefined);
    });
    return () => controller.abort();
  }, [apiClient, connectivityState, local.structural?.contentVersions.journeyGraph]);

  const runNearby = useCallback((fix: LocationFixDto) => {
    if (!connectedRef.current) return;
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
        connectivity.reportRequestResult('accepted');
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
              if (board.cacheState === 'network') connectivity.reportRequestResult('accepted');
              settleNearbyBoard(key, { phase: 'ready', board });
            } catch (error) {
              if (!isAbort(error)) {
                connectivity.reportRequestResult(classifyRequestFailure(error));
                settleNearbyBoard(key, { phase: 'unavailable' });
              }
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
        if (!isAbort(error) && nearbyGeneration.current === requestId) {
          connectivity.reportRequestResult(classifyRequestFailure(error));
          dispatch({ type: 'nearby-failed', requestId });
        }
      }
    })();
  }, [apiClient, connectivity.reportRequestResult]);

  const runSelectedBoard = useCallback((station: StationChoice, filters: AppState['filters']) => {
    if (!connectedRef.current) return;
    selectedAbort.current?.abort();
    const controller = new AbortController();
    selectedAbort.current = controller;
    const requestId = selectedGeneration.current + 1;
    selectedGeneration.current = requestId;
    setSelectedBoard((current) => ({ phase: 'loading', ...(current.board ? { board: current.board } : {}) }));
    void apiClient.board(station.constituentId, filters, controller.signal).then((board) => {
      if (!controller.signal.aborted && selectedGeneration.current === requestId) {
        if (board.cacheState === 'network') connectivity.reportRequestResult('accepted');
        setSelectedBoard({ phase: 'ready', board });
      }
    }).catch((error: unknown) => {
      if (!isAbort(error) && selectedGeneration.current === requestId) {
        connectivity.reportRequestResult(classifyRequestFailure(error));
        setSelectedBoard((current) => ({ phase: 'error', ...(current.board ? { board: current.board } : {}) }));
      }
    });
  }, [apiClient, connectivity.reportRequestResult]);

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
    autoStart: connected,
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

  useEffect(() => {
    if (connected) return;
    nearbyAbort.current?.abort();
    selectedAbort.current?.abort();
    for (const controller of savedAbort.current.values()) controller.abort();
    savedAbort.current.clear();
  }, [connected]);

  const recoveryInputKey = reconnectionInputKey({
    state,
    stationOpen,
    mapContext,
    mapVersions,
    savedRecords,
    activeTrip,
  });

  useEffect(() => {
    if (connectivityState !== 'checking') return undefined;
    setRetainedHistorical(true);
    recoveryAbort.current?.abort();
    const controller = new AbortController();
    recoveryAbort.current = controller;
    const generation = recoveryGeneration.current + 1;
    recoveryGeneration.current = generation;
    const startedAt = exactRecoveryInstant(recoveryNow);
    const stationId = recoveryStationId(state, activeTrip, savedRecords);
    const context = createAppReconnectionContext({
      state,
      stationOpen,
      mapContext,
      mapVersions,
      savedRecords,
      activeTrip,
      stationId,
      recoveryInputKey,
      generation,
      startedAt,
    });
    const artifacts: AppReconnectionArtifacts = {};
    const loadStage = createAppReconnectionStageLoader({
      api: apiClient,
      stationId,
      filters: state.filters,
      hasUnrelatedSavedRecords: savedRecords.some(({ constituentId }) => constituentId !== stationId),
      artifacts,
      activeTrip,
      now: recoveryNow,
    });

    void runReconnection({
      context,
      initial: {
        historicalPositioningGuidance: false,
        historicalTransferGuidance: Boolean(activeTrip?.transfers.length),
      },
      loadStage,
      signal: controller.signal,
      now: recoveryNow,
      onTransition: (transition) => {
        if (controller.signal.aborted || recoveryGeneration.current !== generation) return;
        setReconnectionState(transition.state);
        onReconnectionTransition?.(transition);
      },
    }).then((result) => {
      if (controller.signal.aborted || recoveryGeneration.current !== generation) return;
      if (result.kind === 'network-unreachable') {
        connectivity.reportRequestResult('network-unreachable');
        return;
      }
      if (result.kind !== 'complete') return;
      setReconnectionState(result.state);
      if (result.state.visible.currentArrivalsRestored && artifacts.selectedBoard) {
        setSelectedBoard({ phase: 'ready', board: artifacts.selectedBoard });
      }
      const mapStage = result.state.stages.find(({ stage }) => stage === 5)?.result;
      if (mapStage?.stage === 5 && mapStage.maps.disposition === 'refreshed' && artifacts.mapOverlay) {
        setRecoveredMapOverlay(artifacts.mapOverlay);
      }
      setRetainedHistorical(!result.state.visible.currentArrivalsRestored);
      connectivity.completeRecovery();
    });

    return () => controller.abort();
  }, [
    activeTrip,
    apiClient,
    connectivity.completeRecovery,
    connectivity.reportRequestResult,
    connectivityState,
    mapContext,
    mapVersions,
    onReconnectionTransition,
    recoveryInputKey,
    recoveryNow,
    savedRecords,
    state,
    stationOpen,
  ]);

  useEffect(() => () => {
    nearbyAbort.current?.abort();
    selectedAbort.current?.abort();
    recoveryAbort.current?.abort();
    for (const controller of savedAbort.current.values()) controller.abort();
  }, []);

  const savedChoices = useMemo(() => savedRecords.map((record) => stationChoice(record, catalog?.data.complexes ?? [])), [catalog, savedRecords]);
  const offlineJourneyPlanner = useMemo(
    () => journeyReference ? createOfflineJourneyPlanner(journeyReference) : undefined,
    [journeyReference],
  );

  const selectStation = useCallback((station: StationChoice, filters: AppState['filters']) => {
    nearbyAbort.current?.abort();
    nearbyGeneration.current += 1;
    dispatch({ type: 'station-selected', station, owner: 'explicit', filters });
    writeLastUsedStation(storage, station);
    setPickerOpen(false);
    setStationOpen(true);
    runSelectedBoard(station, filters);
  }, [runSelectedBoard, storage]);

  const changeFilters = useCallback((filters: AppState['filters']) => {
    dispatch({ type: 'filters-changed', routeIds: filters.routeIds, ...(filters.direction ? { direction: filters.direction } : {}) });
    const station = stateRef.current.selectedStation;
    if (station) runSelectedBoard(station, filters);
  }, [runSelectedBoard]);

  const acceptSavedMutation = useCallback((result: BrowserStoreMutation) => {
    if (result.kind === 'saved') setSavedRecords(result.records);
    else dispatch({ type: 'warning-added', warning: 'Saved station changes could not be stored on this device.' });
  }, []);

  const saveCurrentStation = useCallback(() => {
    const station = stateRef.current.selectedStation;
    if (!station) return;
    const existing = savedRecords.find(({ complexId, constituentId }) => complexId === station.complexId && constituentId === station.constituentId);
    const direction = stateRef.current.filters.direction;
    const exactDirection = direction ? selectedBoard.board?.data?.directions.find((candidate) => candidate.direction === direction) : undefined;
    const actualDestination = exactDirection?.primary[0]?.destination ?? exactDirection?.secondary[0]?.destination;
    const record: SavedRecord = {
      id: existing?.id ?? `saved-${station.complexId}-${station.constituentId}`,
      complexId: station.complexId,
      constituentId: station.constituentId,
      ...(existing?.preferredEntrance ? { preferredEntrance: existing.preferredEntrance } : {}),
      ...(direction && actualDestination ? { preferredRide: { direction, actualDestination } } : existing?.preferredRide ? { preferredRide: existing.preferredRide } : {}),
      routeFilters: stateRef.current.filters.routeIds,
      accessibleRouteOnly: existing?.accessibleRouteOnly ?? false,
      ...(existing?.commonDestination ? { commonDestination: existing.commonDestination } : {}),
      ...(existing?.timeWindow ? { timeWindow: existing.timeWindow } : {}),
      state: existing?.state ?? 'active',
    };
    acceptSavedMutation(savedStore.upsert(record));
  }, [acceptSavedMutation, savedRecords, savedStore, selectedBoard.board]);

  const openSaved = useCallback((record: SavedRecord) => {
    dispatch({ type: 'surface-changed', surface: 'nearby' });
    selectStation(stationChoice(record, catalog?.data.complexes ?? []), {
      routeIds: record.routeFilters,
      ...(record.preferredRide ? { direction: record.preferredRide.direction } : {}),
    });
  }, [catalog, selectStation]);

  const refreshSaved = useCallback((record: SavedRecord) => {
    if (!connectedRef.current) return;
    savedAbort.current.get(record.id)?.abort();
    const controller = new AbortController();
    savedAbort.current.set(record.id, controller);
    void apiClient.board(record.constituentId, { routeIds: [] }, controller.signal).then((board) => {
      if (controller.signal.aborted || savedAbort.current.get(record.id) !== controller) return;
      if (board.cacheState === 'network') connectivity.reportRequestResult('accepted');
      setSavedBoards((current) => new Map(current).set(record.id, board));
    }).catch((error: unknown) => {
      if (!isAbort(error)) connectivity.reportRequestResult(classifyRequestFailure(error));
    });
  }, [apiClient, connectivity.reportRequestResult]);

  const saveRecord = useCallback((record: SavedRecord) => acceptSavedMutation(savedStore.upsert(record)), [acceptSavedMutation, savedStore]);
  const setSavedState = useCallback((id: string, nextState: SavedRecord['state']) => {
    const record = savedRecords.find((candidate) => candidate.id === id);
    if (record) acceptSavedMutation(savedStore.upsert({ ...record, state: nextState }));
  }, [acceptSavedMutation, savedRecords, savedStore]);
  const resetSaved = useCallback((id: string) => {
    const record = savedRecords.find((candidate) => candidate.id === id);
    if (!record) return;
    acceptSavedMutation(savedStore.upsert({
      id: record.id,
      complexId: record.complexId,
      constituentId: record.constituentId,
      routeFilters: [],
      accessibleRouteOnly: record.accessibleRouteOnly,
      state: record.state,
    }));
  }, [acceptSavedMutation, savedRecords, savedStore]);
  const deleteSaved = useCallback((id: string) => {
    acceptSavedMutation(savedStore.delete(id));
    setSavedBoards((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, [acceptSavedMutation, savedStore]);

  const activateTrip = useCallback((itinerary: JourneyItineraryDto, response: JourneyEnvelopeDto) => {
    const candidate = captureActiveTrip(itinerary, response, catalog?.data.complexes ?? []);
    if (!candidate) {
      setCaptureMessage('This trip cannot be stored until every required path and evidence field is available.');
      return;
    }
    const result = activeTripStore.capture(candidate);
    if (result.kind === 'saved') {
      setActiveTrip(result.trip);
      setActiveTripOpen(true);
      setCaptureMessage('Trip saved on this device for underground use.');
    } else {
      setCaptureMessage('This trip could not be stored on this device.');
    }
  }, [activeTripStore, catalog]);

  const moveTripCursor = useCallback((pointId: string) => {
    const result = activeTripStore.setCursor(pointId);
    if (result.kind === 'saved') setActiveTrip(result.trip);
  }, [activeTripStore]);
  const clearActiveTrip = useCallback(() => {
    const result = activeTripStore.clear();
    if (result.kind === 'saved') {
      setActiveTrip(null);
      setActiveTripOpen(false);
      setCaptureMessage(undefined);
    }
  }, [activeTripStore]);

  const currentRuntime = selectedBoard.board?.runtime ?? state.nearby.response?.runtime ?? bootstrap?.runtime;
  const fallback = state.location.phase === 'denied' ? 'denied' as const
    : state.location.phase === 'failed' ? 'failed' as const : undefined;
  const selectedStation = state.selectedStation;
  const selectedSaved = selectedStation
    ? savedRecords.some(({ complexId, constituentId }) => complexId === selectedStation.complexId && constituentId === selectedStation.constituentId)
    : false;

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <div className="app-frame">
        <AppHeader runtime={currentRuntime} />
        {offline ? <OfflineBanner /> : null}
        {reconnectionState?.visible.activeWarnings.map((warning) => (
          <StatusBanner tone="warning" key={warning.id}>
            <p><strong>Trip update:</strong> {warning.changedFact}</p>
            <p>{warning.consequence}</p>
          </StatusBanner>
        ))}
        {connectivityState === 'checking' ? <StatusBanner tone="warning"><p>Connection restored. Rechecking subway information before showing anything as current.</p></StatusBanner> : null}
        {connectivityState === 'online' && retainedHistorical ? <StatusBanner tone="warning"><p>Connection is available, but current subway information could not be reverified. Stored information remains historical.</p></StatusBanner> : null}
        {captureMessage ? <p className="capture-message" role="status">{captureMessage}</p> : null}
        {activeTrip ? (
          <section className="active-trip-shell" aria-label="Device-held active trip">
            <button type="button" aria-expanded={activeTripOpen} onClick={() => setActiveTripOpen((value) => !value)}>
              {activeTripOpen ? 'Hide active trip' : `Open active trip to ${activeTrip.destination.name}`}
            </button>
            {activeTripOpen ? <ActiveTripCard trip={activeTrip} offline={!connected} onSetCursor={moveTripCursor} onClear={clearActiveTrip} /> : null}
          </section>
        ) : null}
        <div className="surface-frame">
          {state.surface === 'nearby' && stationOpen && selectedStation ? (
            <>
              {fallback && !offline ? (
                <StatusBanner tone="warning" actions={(
                  <>
                    {fallback === 'failed' ? <button type="button" onClick={location.retry}>Try location again</button> : null}
                    <button type="button" onClick={() => { setStationOpen(false); setPickerOpen(true); }}>Choose a station</button>
                  </>
                )}>
                  <p>Location unavailable. Showing your last station.</p>
                  {fallback === 'denied' ? <p>Location permission is off. Enable location in your device settings to refresh Nearby.</p> : null}
                </StatusBanner>
              ) : null}
              <StationView
                station={selectedStation}
                board={selectedBoard.board}
                phase={selectedBoard.phase}
                filters={state.filters}
                historical={!connected || selectedBoard.board?.cacheState === 'historical'}
                onFiltersChange={changeFilters}
                onRefresh={() => runSelectedBoard(selectedStation, stateRef.current.filters)}
                onSave={saveCurrentStation}
                saved={selectedSaved}
              />
            </>
          ) : state.surface === 'nearby' && !connected && !state.nearby.response ? (
            <OfflineNearbyEmpty hasSaved={savedRecords.length > 0} hasTrip={Boolean(activeTrip)} />
          ) : state.surface === 'nearby' ? (
            <NearbyView
              phase={state.nearby.phase}
              response={state.nearby.response}
              boards={nearbyBoards}
              historical={!connected}
              savedChoices={savedChoices}
              pickerChoices={catalog?.data.complexes ?? []}
              fallback={fallback}
              pickerOpen={pickerOpen}
              onSelect={selectStation}
              onRetryLocation={location.retry}
              onOpenPicker={() => setPickerOpen(true)}
              onRefresh={() => {
                if (!connectedRef.current || stateRef.current.location.phase === 'denied') return;
                if (stateRef.current.location.fix) runNearby(stateRef.current.location.fix);
                else location.retry();
              }}
            />
          ) : state.surface === 'map' ? (
            <MapView
              api={apiClient}
              bootstrap={bootstrap}
              mapVersions={mapVersions}
              catalog={catalog?.data.complexes ?? []}
              connected={connected}
              recoveredOverlay={recoveredMapOverlay}
              origin={state.selectedStation ?? state.lastUsedStation ?? savedChoices[0]}
              initialContext={mapContext}
              onContextChange={setMapContext}
              planOfflineJourney={offlineJourneyPlanner}
              onActivateTrip={activateTrip}
            />
          ) : state.surface === 'saved' ? (
            <SavedView
              records={savedRecords}
              catalog={catalog?.data.complexes ?? []}
              boards={savedBoards}
              offline={!connected}
              onOpen={openSaved}
              onRefreshAll={refreshSaved}
              onSave={saveRecord}
              onPause={setSavedState}
              onReset={resetSaved}
              onDelete={deleteSaved}
            />
          ) : <FutureSurface />}
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

function OfflineNearbyEmpty({ hasSaved, hasTrip }: { readonly hasSaved: boolean; readonly hasTrip: boolean }) {
  return (
    <section className="surface offline-empty" aria-labelledby="nearby-heading">
      <p className="section-kicker">Device-held subway tools</p>
      <h2 id="nearby-heading">Nearby</h2>
      <StatusBanner tone="locked">
        <p>No current subway information is stored on this device.</p>
        <p>{hasSaved || hasTrip
          ? 'Your saved stations and active trip remain available without claiming current service.'
          : 'Map references become available only after an eligible stored map has been deliberately opened.'}</p>
      </StatusBanner>
    </section>
  );
}

function FutureSurface() {
  return (
    <section className="surface future-surface" aria-labelledby="commute-heading">
      <p className="section-kicker">Safety-gated subway tool</p>
      <h2 id="commute-heading">Commute</h2>
      <StatusBanner tone="locked"><p>Commute alerts remain locked until their safety stage is enabled.</p></StatusBanner>
    </section>
  );
}

function readLocalState(
  storage: Storage,
  savedStore: ReturnType<typeof createBrowserSavedStore>,
  activeTripStore: ReturnType<typeof createBrowserActiveTripStore>,
  structuralStore: ReturnType<typeof createBrowserStructuralStore>,
) {
  const saved = savedStore.read();
  const active = activeTripStore.read();
  const structural = structuralStore.read();
  return Object.freeze({
    lastUsedStation: readLastUsedStation(storage),
    savedRecords: saved.kind === 'ready' ? saved.records : [],
    activeTrip: active.kind === 'ready' ? active.trip : null,
    structural: structural.kind === 'ready' ? structural.value : null,
  });
}

function stationChoice(record: SavedRecord, catalog: readonly CatalogComplexDto[]): StationChoice {
  const complex = catalog.find(({ id }) => id === record.complexId);
  return {
    complexId: record.complexId,
    constituentId: record.constituentId,
    name: complex?.name ?? record.constituentId,
  };
}

export function captureActiveTrip(
  itinerary: JourneyItineraryDto,
  response: JourneyEnvelopeDto,
  catalog: readonly CatalogComplexDto[],
): ActiveTripRecord | undefined {
  if (!response.data || (response.data.kind !== 'planned' && response.data.kind !== 'untimed')) return undefined;
  if (response.data.scope.accessibleRouteOnly || itinerary.legs.length === 0) return undefined;
  const ownedItinerary = response.data.itineraries.find(({ id }) => id === itinerary.id);
  if (!ownedItinerary?.capture) return undefined;
  let capture: JourneyCapturePackage;
  try {
    capture = bindJourneyCapturePackage(ownedItinerary.capture, {
      itinerary: ownedItinerary,
      scope: response.data.scope,
      responseDecidedAt: response.decidedAt,
      responseDisclosure: response.demonstrationLabel,
    });
  } catch {
    return undefined;
  }
  const transferByLeg = new Map(ownedItinerary.transferInstructions.map((transfer, index) => [index, transfer]));
  if (ownedItinerary.legs.length > 1 && ownedItinerary.transferInstructions.length !== ownedItinerary.legs.length - 1) return undefined;
  const capturedAt = capture.capturedAt;
  const tripIndex = response.data.itineraries.findIndex(({ id }) => id === itinerary.id);
  const tripId = `trip-${response.responseIdentity}-${tripIndex + 1}`;
  const legs: ActiveTripRecord['legs'] = ownedItinerary.legs.map((leg, legIndex) => ({
    id: `leg-${legIndex + 1}`,
    route: { id: leg.routeId, label: leg.routeLabel, spokenIdentity: `${leg.routeLabel} train`, shape: 'circle' },
    boundDirection: leg.direction,
    actualDestination: leg.actualDestination,
    points: leg.orderedStationIds.map((stationId, pointIndex) => {
      const place = resolvePlace(stationId, catalog);
      const lastPoint = pointIndex === leg.orderedStationIds.length - 1;
      return {
        id: `point-${legIndex + 1}-${pointIndex + 1}`,
        kind: (lastPoint && legIndex < ownedItinerary.legs.length - 1) || (pointIndex === 0 && legIndex > 0) ? 'decision' as const : 'stop' as const,
        stationName: place.name,
        complexId: place.complexId,
        constituentId: place.constituentId,
        instruction: pointIndex === 0
          ? `Board the ${leg.routeLabel} train toward ${leg.actualDestination}.`
          : lastPoint ? legIndex < ownedItinerary.legs.length - 1 ? `Leave the ${leg.routeLabel} train for the transfer.` : 'Leave the train at your destination.'
            : `Remain on the ${leg.routeLabel} train.`,
      };
    }),
  }));
  if (legs.some(({ points }) => points.length < 2)) return undefined;
  const transfers: ActiveTripRecord['transfers'] = ownedItinerary.legs.slice(0, -1).map((leg, index) => {
    const instruction = transferByLeg.get(index);
    const incoming = legs[index];
    const outgoing = legs[index + 1];
    if (!instruction || !incoming || !outgoing) throw new Error('Incomplete transfer capture');
    return {
      id: `transfer-${index + 1}`,
      atPointId: incoming.points[incoming.points.length - 1]!.id,
      incomingLegId: incoming.id,
      outgoingLegId: outgoing.id,
      incomingDirection: instruction.fromDirection,
      incomingDestination: instruction.fromActualDestination,
      outgoingDirection: instruction.toDirection,
      outgoingDestination: instruction.toActualDestination,
      steps: [`At ${resolvePlace(instruction.stationId, catalog).name}, transfer from ${instruction.fromRouteId} to ${instruction.toRouteId}.`],
    };
  });
  const origin = resolvePlace(response.data.scope.originStationId, catalog);
  const destination = resolvePlace(response.data.scope.destinationStationId, catalog);
  try {
    return {
      id: tripId,
      capturedAt,
      captureContext: {
        kind: 'response-owned',
        itineraryId: capture.itineraryId,
        requestMode: capture.requestMode,
        timing: capture.timing,
        ...(capture.disclosure === undefined ? {} : { disclosure: capture.disclosure }),
      },
      origin,
      destination,
      accessibleRouteOnly: false,
      legs,
      transfers,
      serviceClaims: capture.serviceClaims.map((claim) => ({
        ...claim,
        scope: translateCaptureScope(claim.scope, tripId, ownedItinerary, legs),
      })),
      equipmentClaims: capture.equipmentClaims.map((claim) => ({ ...claim })),
      cursor: { pointId: legs[0]!.points[0]!.id },
      validity: {
        result: capture.validity.result,
        serviceDate: capture.serviceDate,
        pattern: capture.validity.pattern,
        schedule: translateCaptureSchedule(capture, ownedItinerary, legs),
        warnings: capture.validity.warnings.map((warning) => ({
          ...warning,
          scope: translateCaptureScope(warning.scope, tripId, ownedItinerary, legs),
        })),
        vetoes: capture.validity.vetoes.map((veto) => ({
          ...veto,
          scope: translateCaptureScope(veto.scope, tripId, ownedItinerary, legs),
        })),
        ...(capture.validity.patternBoundary === undefined ? {} : {
          patternBoundary: { ...capture.validity.patternBoundary },
        }),
      },
    };
  } catch {
    return undefined;
  }
}

function translateCaptureSchedule(
  capture: JourneyCapturePackage,
  itinerary: JourneyItineraryDto,
  legs: ActiveTripRecord['legs'],
): ActiveTripRecord['validity']['schedule'] {
  const schedule = capture.validity.schedule;
  if (schedule.kind === 'none') return { kind: 'none' };
  const departures = schedule.departures.map((departure) => {
    const legIndex = itinerary.legs.findIndex(({ patternId }) => patternId === departure.patternId);
    const occurrenceIndex = itinerary.legs[legIndex]?.orderedOccurrenceIds.indexOf(departure.occurrenceId) ?? -1;
    const leg = legs[legIndex];
    const point = leg?.points[occurrenceIndex];
    if (!leg || !point) throw new Error('Capture departure lost itinerary ownership');
    return {
      legId: leg.id,
      pointId: point.id,
      clockTime: departure.clockTime,
      evidence: departure.evidence,
      timeZone: departure.timeZone,
    };
  });
  return schedule.kind === 'stale'
    ? { ...schedule, departures }
    : { ...schedule, departures };
}

function translateCaptureScope(
  scope: JourneyCaptureClaimScope,
  tripId: string,
  itinerary: JourneyItineraryDto,
  legs: ActiveTripRecord['legs'],
): ActiveTripRecord['serviceClaims'][number]['scope'] {
  if (scope.kind === 'itinerary') return { kind: 'trip', tripId };
  if (scope.kind === 'route') return { kind: 'route', routeId: scope.routeId };
  if (scope.kind === 'direction') return { kind: 'direction', routeId: scope.routeId, direction: scope.direction };
  const legIndex = itinerary.legs.findIndex(({ patternId }) => patternId === scope.patternId);
  const leg = legs[legIndex];
  if (!leg) throw new Error('Capture claim lost itinerary ownership');
  if (scope.kind === 'pattern') {
    return { kind: 'leg', legId: leg.id, routeId: scope.routeId, direction: scope.direction };
  }
  const itineraryLeg = itinerary.legs[legIndex]!;
  if (scope.kind === 'station') {
    const pointIndex = itineraryLeg.orderedOccurrenceIds.indexOf(scope.occurrenceId);
    const point = leg.points[pointIndex];
    if (!point) throw new Error('Capture station claim lost occurrence ownership');
    return { kind: 'station', stationId: point.constituentId, routeId: scope.routeId, direction: scope.direction };
  }
  const fromIndex = itineraryLeg.orderedOccurrenceIds.indexOf(scope.fromOccurrenceId);
  const toIndex = itineraryLeg.orderedOccurrenceIds.indexOf(scope.toOccurrenceId);
  const from = leg.points[fromIndex];
  const to = leg.points[toIndex];
  if (!from || !to) throw new Error('Capture segment claim lost occurrence ownership');
  return {
    kind: 'segment', fromStationId: from.constituentId, toStationId: to.constituentId,
    routeId: scope.routeId, direction: scope.direction,
  };
}

function resolvePlace(stationId: string, catalog: readonly CatalogComplexDto[]): ActiveTripRecord['origin'] {
  const complex = catalog.find(({ id, constituents }) => id === stationId || constituents.some(({ id: constituentId }) => constituentId === stationId));
  const constituent = complex?.constituents.find(({ id }) => id === stationId) ?? complex?.constituents[0];
  return {
    name: complex?.name ?? stationId,
    complexId: complex?.id ?? stationId,
    constituentId: constituent?.id ?? stationId,
  };
}

function reconnectionInputKey(input: {
  readonly state: AppState;
  readonly stationOpen: boolean;
  readonly mapContext: MapContext;
  readonly mapVersions?: BootstrapDataDto['contentVersions']['maps'];
  readonly savedRecords: readonly SavedRecord[];
  readonly activeTrip: ActiveTripRecord | null;
}): string {
  return JSON.stringify({
    surface: input.state.surface,
    stationOpen: input.stationOpen,
    selectedStation: input.state.selectedStation,
    lastUsedStation: input.state.lastUsedStation,
    nearbyResponseIdentity: input.state.nearby.response?.responseIdentity ?? null,
    filters: input.state.filters,
    mapContext: input.mapContext,
    mapVersions: input.mapVersions ?? null,
    savedRecordIds: input.savedRecords.map(({ id, constituentId, state }) => [id, constituentId, state]),
    activeTrip: input.activeTrip ? { id: input.activeTrip.id, cursor: input.activeTrip.cursor } : null,
  });
}

function recoveryStationId(
  state: AppState,
  activeTrip: ActiveTripRecord | null,
  savedRecords: readonly SavedRecord[],
): string | null {
  const activePoint = activeTrip?.legs.flatMap(({ points }) => points)
    .find(({ id }) => id === activeTrip.cursor.pointId);
  const nearby = state.nearby.response?.data?.kind === 'ranked'
    ? state.nearby.response.data.cards[0]?.directions[0]?.constituentId
    : undefined;
  return state.selectedStation?.constituentId
    ?? state.lastUsedStation?.constituentId
    ?? activePoint?.constituentId
    ?? savedRecords[0]?.constituentId
    ?? nearby
    ?? null;
}

function createAppReconnectionContext(input: {
  readonly state: AppState;
  readonly stationOpen: boolean;
  readonly mapContext: MapContext;
  readonly mapVersions?: BootstrapDataDto['contentVersions']['maps'];
  readonly savedRecords: readonly SavedRecord[];
  readonly activeTrip: ActiveTripRecord | null;
  readonly stationId: string | null;
  readonly recoveryInputKey: string;
  readonly generation: number;
  readonly startedAt: string;
}): PreservedReconnectionContext {
  const cursor = input.activeTrip?.legs
    .map((leg, legIndex) => ({ leg, legIndex }))
    .find(({ leg }) => leg.points.some(({ id }) => id === input.activeTrip?.cursor.pointId));
  const direction = input.state.filters.direction ?? cursor?.leg.boundDirection ?? 'unknown';
  const routeFilters = input.state.filters.routeIds.length > 0
    ? input.state.filters.routeIds
    : cursor ? [cursor.leg.route.id] : [];
  const theme = input.mapContext.serviceMeaning === 'late-night' ? 'night' as const : 'day' as const;
  const storedTrainChoice = cursor ? activeTrainChoice(input.activeTrip, cursor.leg.id) : null;
  const viewportKey = `viewport-${fingerprint(JSON.stringify({
    viewport: input.mapContext.viewport,
    selectedStationId: input.mapContext.selectedStationId ?? null,
    selectedRouteId: input.mapContext.selectedRouteId ?? null,
  }))}`;
  const contextKey = `context-${fingerprint(input.recoveryInputKey)}`;
  const contextScope: ReconnectionScopeMembership = { kind: 'context', id: contextKey };
  const mapScope: ReconnectionScopeMembership = { kind: 'map', id: viewportKey };
  const stationOwnerScopes: readonly ReconnectionScopeMembership[] = input.stationId
    ? [{ kind: 'station', id: input.stationId }]
    : [contextScope];
  const remainingLegs = cursor && input.activeTrip
    ? input.activeTrip.legs.slice(cursor.legIndex)
    : [];
  const legOwnerScopes: readonly ReconnectionScopeMembership[] = remainingLegs.length > 0
    ? remainingLegs.map(({ id }) => ({ kind: 'leg' as const, id }))
    : stationOwnerScopes;
  const trainOwnerScopes: readonly ReconnectionScopeMembership[] = storedTrainChoice
    ? [{ kind: 'train', id: storedTrainChoice }]
    : stationOwnerScopes;
  const upcomingTransfers = cursor && input.activeTrip
    ? input.activeTrip.transfers.filter(({ incomingLegId }) => (
      input.activeTrip!.legs.findIndex(({ id }) => id === incomingLegId) >= cursor.legIndex
    ))
    : [];
  const transferOwnerScopes: readonly ReconnectionScopeMembership[] = upcomingTransfers.length > 0
    ? upcomingTransfers.map(({ id }) => ({ kind: 'transfer' as const, id }))
    : legOwnerScopes;
  const savedOwnerScopes: readonly ReconnectionScopeMembership[] = input.savedRecords
    .filter(({ constituentId }) => constituentId !== input.stationId)
    .map(({ id }) => ({ kind: 'saved-record' as const, id }));
  const scopes: ReconnectionScopeMembership[] = [
    contextScope,
    mapScope,
    ...(input.stationId ? [{ kind: 'station' as const, id: input.stationId }] : []),
    ...routeFilters.map((id) => ({ kind: 'route' as const, id })),
    { kind: 'direction', id: direction },
    ...input.savedRecords.map(({ id }) => ({ kind: 'saved-record' as const, id })),
    ...(input.activeTrip?.legs.map(({ id }) => ({ kind: 'leg' as const, id })) ?? []),
    ...(input.activeTrip?.transfers.map(({ id }) => ({ kind: 'transfer' as const, id })) ?? []),
    ...(storedTrainChoice ? [{ kind: 'train' as const, id: storedTrainChoice }] : []),
  ];
  const eligibleScopes = scopes.filter((scope, index) => scopes.findIndex((candidate) => (
    candidate.kind === scope.kind && candidate.id === scope.id
  )) === index);
  const focusTarget = typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
    ? document.activeElement.id || null
    : null;
  return {
    stationId: input.stationId,
    direction,
    routeFilters,
    accessibleRouteOnly: input.activeTrip?.accessibleRouteOnly ?? false,
    mapTuple: {
      referenceMode: input.mapContext.serviceMeaning === 'actual-now'
        ? 'actual'
        : input.mapContext.serviceMeaning,
      theme,
      contentVersion: input.mapVersions?.[theme] ?? 'not-stored',
      viewportKey,
    },
    activeTripId: input.activeTrip?.id ?? null,
    manualCursor: cursor && input.activeTrip
      ? { legIndex: cursor.legIndex, stopId: input.activeTrip.cursor.pointId }
      : null,
    hasStoredTrainChoice: storedTrainChoice !== null,
    guidanceRequirements: {
      positioning: 'none',
      transfer: upcomingTransfers.length > 0 ? 'required' : 'none',
    },
    activeSurface: input.state.surface === 'nearby' && input.stationOpen ? 'station' : input.state.surface,
    scrollOffset: typeof window === 'undefined' ? 0 : Math.max(0, window.scrollY || 0),
    focusTargetId: focusTarget,
    readingAnchorId: input.activeTrip?.cursor.pointId ?? null,
    recovery: {
      epochId: `epoch-${input.generation}-${fingerprint(input.startedAt)}`,
      requestIdentity: `recovery-${input.generation}-${fingerprint(`${input.startedAt}:${contextKey}`)}`,
      generation: input.generation,
      startedAt: input.startedAt,
      activeTripId: input.activeTrip?.id ?? null,
      contextKey,
      eligibleScopes,
      ownerScopes: {
        equipment: [],
        'accessible-path': [],
        'service-change': input.activeTrip ? legOwnerScopes : stationOwnerScopes,
        'feed-health': stationOwnerScopes,
        'train-admission': trainOwnerScopes,
        arrivals: stationOwnerScopes,
        positioning: [],
        'transfer-guidance': transferOwnerScopes,
        maps: [mapScope],
        saved: savedOwnerScopes.length > 0 ? savedOwnerScopes : [contextScope],
      },
    },
  };
}

function activeTrainChoice(activeTrip: ActiveTripRecord | null, legId: string): string | null {
  const schedule = activeTrip?.validity.schedule;
  if (schedule?.kind !== 'current' && schedule?.kind !== 'stale') return null;
  const departure = schedule.departures.find((candidate) => candidate.legId === legId);
  return departure ? `departure:${departure.legId}:${departure.pointId}:${departure.clockTime}` : null;
}

function exactRecoveryInstant(now: (() => Date) | undefined): string {
  const value = now?.() ?? new Date();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new Error('Recovery clock returned an invalid instant');
  }
  return new Date(value.getTime()).toISOString();
}

function fingerprint(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function classifyRequestFailure(error: unknown): 'network-unreachable' | 'domain-unavailable' {
  if (error instanceof TransitApiError) return error.category;
  if (error instanceof TypeError || (error instanceof DOMException && error.name === 'NetworkError')) return 'network-unreachable';
  return 'domain-unavailable';
}

function browserServiceWorker(): ServiceWorkerContainer | undefined {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  return navigator.serviceWorker;
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
