import { useEffect, useRef, useState } from 'react';

import type {
  BootstrapDataDto,
  BootstrapEnvelopeDto,
  CatalogComplexDto,
  JourneyEnvelopeDto,
  JourneyItineraryDto,
  MapOverlayEnvelopeDto,
  MapReferenceDto,
  TransitApiClient,
} from '../api/client';
import { JourneyPlanner, type MapServiceMeaning } from '../components/JourneyPlanner';
import { StatusBanner } from '../components/StatusBanner';
import { VectorNetworkMap, type MapViewport } from '../components/VectorNetworkMap';
import type { StationChoice } from '../state/app-state';
import type { OfflineJourneyPlanner } from '../offline/plan-offline-journey';

export interface MapContext {
  readonly serviceMeaning: MapServiceMeaning;
  readonly spatialView: 'schematic' | 'geographic';
  readonly viewport: MapViewport;
  readonly selectedStationId?: string;
  readonly selectedRouteId?: string;
}

export function MapView({
  api,
  bootstrap,
  mapVersions,
  catalog,
  connected,
  recoveredOverlay,
  origin,
  initialContext,
  onContextChange,
  planOfflineJourney,
  onActivateTrip,
}: {
  readonly api: TransitApiClient;
  readonly bootstrap?: BootstrapEnvelopeDto;
  readonly mapVersions?: BootstrapDataDto['contentVersions']['maps'];
  readonly catalog: readonly CatalogComplexDto[];
  readonly connected: boolean;
  readonly recoveredOverlay?: MapOverlayEnvelopeDto;
  readonly origin?: StationChoice;
  readonly initialContext?: MapContext;
  readonly onContextChange: (context: MapContext) => void;
  readonly planOfflineJourney?: OfflineJourneyPlanner;
  readonly onActivateTrip: (itinerary: JourneyItineraryDto, response: JourneyEnvelopeDto) => void;
}) {
  const [context, setContext] = useState<MapContext>(() => initialContext ?? {
    serviceMeaning: 'actual-now', spatialView: 'schematic', viewport: { centerX: 40.7128, centerY: -74.006, zoom: 1 },
  });
  const desiredTheme = context.serviceMeaning === 'late-night' ? 'night' : 'day';
  const desiredContentVersion = mapVersions?.[desiredTheme] ?? bootstrap?.data.contentVersions.maps[desiredTheme];
  const referenceEligible = context.serviceMeaning !== 'actual-now' || connected;
  const referenceKey = `${desiredTheme}:${desiredContentVersion ?? 'missing'}:${referenceEligible ? 'eligible' : 'unavailable'}`;
  const [referenceState, setReferenceState] = useState<{
    readonly key: string;
    readonly phase: 'idle' | 'loading' | 'ready' | 'error';
    readonly data?: MapReferenceDto;
  }>({ key: '', phase: 'idle' });
  const [overlay, setOverlay] = useState<MapOverlayEnvelopeDto>();
  const referenceGeneration = useRef(0);
  const referenceAbort = useRef<AbortController | undefined>(undefined);
  const overlayAbort = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    overlayAbort.current?.abort();
    setOverlay(undefined);
    if (!connected || context.serviceMeaning !== 'actual-now') return;
    if (recoveredOverlay?.cacheState === 'network'
      && recoveredOverlay.data?.theme === 'day') {
      setOverlay(recoveredOverlay);
      return;
    }
    const controller = new AbortController();
    overlayAbort.current = controller;
    void api.mapOverlay('day', controller.signal).then((response) => {
      if (!controller.signal.aborted) setOverlay(response);
    }).catch(() => {
      if (!controller.signal.aborted) setOverlay(undefined);
    });
    return () => controller.abort();
  }, [api, connected, context.serviceMeaning, recoveredOverlay]);

  useEffect(() => {
    referenceAbort.current?.abort();
    const requestId = referenceGeneration.current + 1;
    referenceGeneration.current = requestId;
    if (!referenceEligible || !desiredContentVersion) {
      setReferenceState({ key: referenceKey, phase: desiredContentVersion ? 'idle' : 'error' });
      return undefined;
    }
    const controller = new AbortController();
    referenceAbort.current = controller;
    setReferenceState((current) => current.key === referenceKey && current.data
      ? current
      : { key: referenceKey, phase: 'loading' });
    void api.mapReference(desiredTheme, desiredContentVersion, controller.signal).then((response) => {
      if (controller.signal.aborted || requestId !== referenceGeneration.current) return;
      setReferenceState({
        key: referenceKey,
        phase: response.data ? 'ready' : 'error',
        ...(response.data ? { data: response.data } : {}),
      });
    }).catch(() => {
      if (controller.signal.aborted || requestId !== referenceGeneration.current) return;
      setReferenceState({ key: referenceKey, phase: 'error' });
    });
    return () => controller.abort();
  }, [api, desiredContentVersion, desiredTheme, referenceEligible, referenceKey]);

  useEffect(() => () => {
    referenceAbort.current?.abort();
    overlayAbort.current?.abort();
  }, []);

  const updateContext = (next: MapContext) => {
    setContext(next);
    onContextChange(next);
  };

  const chooseMeaning = (serviceMeaning: MapServiceMeaning) => {
    const next = { ...context, serviceMeaning };
    updateContext(next);
  };

  const actualUnavailable = !connected;
  const retainedHistoricalOverlay = overlay?.cacheState === 'historical';
  const serviceLabel = context.serviceMeaning === 'actual-now'
    ? 'Actual now'
    : context.serviceMeaning === 'typical-weekday' ? 'Typical weekday — reference' : 'Late night — reference';
  const offlineReference = !connected && context.serviceMeaning !== 'actual-now';
  const reference = referenceState.key === referenceKey ? referenceState.data : undefined;
  const mapPhase = referenceState.key === referenceKey ? referenceState.phase : 'loading';

  return (
    <section className="surface surface--map" aria-labelledby="map-heading" data-testid="map-context" data-selected-station={context.selectedStationId} data-selected-route={context.selectedRouteId}>
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Service meaning stays explicit</p>
          <h2 id="map-heading" className="surface-title">Map</h2>
        </div>
        <p id="map-appearance" data-testid="map-appearance">Dark appearance</p>
      </div>

      {!connected ? <StatusBanner tone="warning"><p>Current service information is unavailable. Choose a reference pattern to continue.</p></StatusBanner> : null}
      {retainedHistoricalOverlay ? <StatusBanner tone="warning"><p>A retained historical service overlay is available, but it is hidden because it is not current.</p></StatusBanner> : null}
      <div className="map-axis-controls" role="group" aria-label="Map service meaning">
        <button type="button" aria-pressed={context.serviceMeaning === 'actual-now'} disabled={actualUnavailable} onClick={() => chooseMeaning('actual-now')}>Actual now</button>
        <button type="button" aria-pressed={context.serviceMeaning === 'typical-weekday'} onClick={() => chooseMeaning('typical-weekday')}>Typical weekday</button>
        <button type="button" aria-pressed={context.serviceMeaning === 'late-night'} onClick={() => chooseMeaning('late-night')}>Late night</button>
      </div>
      {context.serviceMeaning !== 'actual-now' ? (
        <div className="map-truth-label" aria-live="polite">
          <strong>{serviceLabel}</strong>
          <span>{offlineReference ? 'Reference pattern—not live.' : 'Not current'}</span>
        </div>
      ) : null}
      <div className="map-axis-controls" role="group" aria-label="Map spatial view">
        <button type="button" aria-pressed={context.spatialView === 'schematic'} onClick={() => updateContext({ ...context, spatialView: 'schematic' })}>Schematic</button>
        <button type="button" aria-pressed={context.spatialView === 'geographic'} onClick={() => updateContext({ ...context, spatialView: 'geographic' })}>Geographic</button>
      </div>

      {mapPhase === 'loading' ? <p role="status">Opening stored subway reference…</p> : null}
      {mapPhase === 'error' && context.serviceMeaning !== 'actual-now' ? <StatusBanner tone="locked"><p>This map reference is not available on this device.</p></StatusBanner> : null}
      <VectorNetworkMap
        reference={reference}
        overlay={context.serviceMeaning === 'actual-now' && overlay?.cacheState === 'network' ? overlay.data ?? undefined : undefined}
        viewport={context.viewport}
        spatialView={context.spatialView}
        serviceLabel={offlineReference ? `${serviceLabel}. Reference pattern—not live.` : context.serviceMeaning === 'actual-now' ? serviceLabel : `${serviceLabel}. Not current`}
      />
      <div className="context-dock map-context-dock" role="toolbar" aria-label="Map controls">
        <button type="button" onClick={() => updateContext({ ...context, viewport: { ...context.viewport, zoom: Math.min(4, context.viewport.zoom + 0.25) } })}>Zoom in</button>
        <button type="button" onClick={() => updateContext({ ...context, viewport: { ...context.viewport, zoom: Math.max(0.5, context.viewport.zoom - 0.25) } })}>Zoom out</button>
        <button type="button" onClick={() => updateContext({ ...context, viewport: { ...context.viewport, centerX: 40.7128, centerY: -74.006 } })}>Center on me</button>
      </div>

      {context.serviceMeaning !== 'actual-now' || connected ? (
        <JourneyPlanner
          api={api}
          origin={origin}
          catalog={catalog}
          serviceMeaning={context.serviceMeaning}
          connected={connected}
          planOfflineJourney={planOfflineJourney}
          onActivateTrip={onActivateTrip}
        />
      ) : null}
    </section>
  );
}
