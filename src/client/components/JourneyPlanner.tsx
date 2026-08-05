import { useEffect, useRef, useState } from 'react';

import type {
  CatalogComplexDto,
  JourneyEnvelopeDto,
  JourneyItineraryDto,
  JourneyRequestDto,
  TransitApiClient,
} from '../api/client';
import type { StationChoice } from '../state/app-state';
import type { OfflineJourneyPlanner } from '../offline/plan-offline-journey';
import { RouteToken } from './RouteToken';
import { StationSearch } from './StationSearch';
import { StatusBanner } from './StatusBanner';

export type MapServiceMeaning = 'actual-now' | 'typical-weekday' | 'late-night';

export function JourneyPlanner({
  api,
  origin,
  catalog,
  serviceMeaning,
  connected,
  planOfflineJourney,
  onActivateTrip,
}: {
  readonly api: TransitApiClient;
  readonly origin?: StationChoice;
  readonly catalog: readonly CatalogComplexDto[];
  readonly serviceMeaning: MapServiceMeaning;
  readonly connected: boolean;
  readonly planOfflineJourney?: OfflineJourneyPlanner;
  readonly onActivateTrip: (itinerary: JourneyItineraryDto, response: JourneyEnvelopeDto) => void;
}) {
  const generation = useRef(0);
  const abort = useRef<AbortController | undefined>(undefined);
  const [destination, setDestination] = useState<StationChoice>();
  const [accessibleRouteOnly, setAccessibleRouteOnly] = useState(false);
  const [serviceDate, setServiceDate] = useState('');
  const [result, setResult] = useState<{
    readonly key: string;
    readonly phase: 'idle' | 'loading' | 'ready' | 'error';
    readonly response?: JourneyEnvelopeDto;
  }>({ key: '', phase: 'idle' });

  useEffect(() => () => abort.current?.abort(), []);

  const requestMode: JourneyRequestDto['mode'] = connected
    ? serviceMeaning === 'actual-now' ? 'online-current' : 'online-future'
    : 'offline-reference';
  const needsServiceDate = requestMode === 'online-future';
  const planLabel = requestMode === 'online-current' ? 'Plan current trip' : requestMode === 'online-future' ? 'Plan future trip' : 'Plan reference trip';
  const requestKey = JSON.stringify({
    origin: origin ? [origin.complexId, origin.constituentId] : null,
    destination: destination ? [destination.complexId, destination.constituentId] : null,
    mode: requestMode,
    connected,
    serviceDate: needsServiceDate ? serviceDate : null,
    accessibleRouteOnly,
  });
  const requestKeyRef = useRef(requestKey);
  requestKeyRef.current = requestKey;
  const phase = result.key === requestKey ? result.phase : 'idle';
  const response = result.key === requestKey ? result.response : undefined;

  useEffect(() => {
    abort.current?.abort();
    generation.current += 1;
  }, [requestKey]);

  const plan = () => {
    if (!origin || !destination || (needsServiceDate && !serviceDate)) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const requestId = generation.current + 1;
    generation.current = requestId;
    const query: JourneyRequestDto = {
      mode: requestMode,
      originStationId: origin.constituentId,
      destinationStationId: destination.constituentId,
      accessibleRouteOnly,
      ...(needsServiceDate ? { serviceDate } : {}),
    };
    const ownedKey = requestKey;
    setResult({ key: ownedKey, phase: 'loading' });
    const pending = connected
      ? api.planJourney(query, controller.signal)
      : planOfflineJourney
        ? Promise.resolve().then(() => planOfflineJourney(query))
        : Promise.reject(new Error('No device-held journey graph is available'));
    void pending.then((value) => {
      if (controller.signal.aborted || requestId !== generation.current || requestKeyRef.current !== ownedKey) return;
      if (!journeyOwnsRequest(value, query)) throw new Error('Journey response does not own the exact request');
      setResult({ key: ownedKey, phase: 'ready', response: value });
    }).catch((error: unknown) => {
      if (isAbort(error) || controller.signal.aborted || requestId !== generation.current || requestKeyRef.current !== ownedKey) return;
      setResult({ key: ownedKey, phase: 'error' });
    });
  };

  return (
    <section className="journey-planner" aria-labelledby="journey-planner-heading">
      <div className="journey-planner__heading">
        <p className="section-kicker">Before you descend</p>
        <h3 id="journey-planner-heading">Plan a trip</h3>
      </div>
      <p><strong>From:</strong> {origin?.name ?? 'Choose an origin station from Nearby or Saved.'}</p>
      <StationSearch
        api={api}
        label="Destination station"
        onSelect={setDestination}
        onSelectionClear={() => setDestination(undefined)}
        catalog={catalog}
        offline={!connected}
      />
      <label className="check-control">
        <input type="checkbox" checked={accessibleRouteOnly} onChange={(event) => setAccessibleRouteOnly(event.currentTarget.checked)} />
        Accessible Route Only
      </label>
      {needsServiceDate ? (
        <label>Operating service date
          <input type="date" value={serviceDate} onChange={(event) => setServiceDate(event.currentTarget.value)} />
        </label>
      ) : null}
      <button type="button" onClick={plan} disabled={!origin || !destination || (needsServiceDate && !serviceDate)}>{planLabel}</button>
      <p className="station-search__status" aria-live="polite">{phase === 'loading' ? 'Planning with supported subway evidence…' : ''}</p>
      {phase === 'error' ? <StatusBanner tone="warning"><p>Journey planning is unavailable. Your origin and destination remain selected.</p></StatusBanner> : null}
      {phase === 'ready' && response ? (
        <JourneyResults
          response={response}
          catalog={catalog}
          canActivate={connected && requestMode !== 'offline-reference'}
          onActivateTrip={onActivateTrip}
        />
      ) : null}
    </section>
  );
}

function JourneyResults({
  response,
  catalog,
  canActivate,
  onActivateTrip,
}: {
  readonly response: JourneyEnvelopeDto;
  readonly catalog: readonly CatalogComplexDto[];
  readonly canActivate: boolean;
  readonly onActivateTrip: (itinerary: JourneyItineraryDto, response: JourneyEnvelopeDto) => void;
}) {
  if (response.runtime.availability === 'locked' || response.data === null) {
    return <StatusBanner tone="locked"><p>Journey planning is not released yet.</p></StatusBanner>;
  }
  if (response.data.kind === 'no-path') return <StatusBanner tone="warning"><p>No supported subway path is available for this exact request.</p></StatusBanner>;
  if (response.data.kind === 'unavailable') {
    return <StatusBanner tone="warning"><p>{response.data.reason === 'no-verified-accessible-path' ? 'No complete verified accessible path is available.' : 'Journey evidence is not comparable enough to rank safely.'}</p></StatusBanner>;
  }
  const heading = response.data.kind === 'untimed'
    ? response.data.label
    : response.data.label ?? 'Current itinerary';
  return (
    <div className="journey-results">
      <h3>{heading}</h3>
      {response.demonstrationLabel ? <p className="claim-line"><span>{response.demonstrationLabel}</span></p> : null}
      {response.data.itineraries.map((itinerary, index) => {
        const transfer = itinerary.transfers > 0;
        return (
          <article className="journey-card" key={itinerary.id} aria-label={`${index === 0 ? 'Primary' : 'Alternative'} ${transfer ? 'transfer' : 'direct'} itinerary`}>
            <header>
              <p className="section-kicker">{index === 0 ? 'Primary' : 'Alternative'} · {transfer ? `${itinerary.transfers} transfer${itinerary.transfers === 1 ? '' : 's'}` : 'Direct'}</p>
              <h4>{itinerary.legs.map(({ routeLabel }) => routeLabel).join(' → ')}</h4>
            </header>
            <dl className="journey-facts">
              <div><dt>Validity</dt><dd>{itinerary.validity}</dd></div>
              <div><dt>Accessibility</dt><dd>{itinerary.accessibility}</dd></div>
              <div><dt>Transfer risk</dt><dd>{itinerary.risk}</dd></div>
              <div><dt>Timing</dt><dd>{itinerary.timing === 'timed' ? 'Supported timing evidence' : 'No supported departure time'}</dd></div>
            </dl>
            <ol className="journey-legs">
              {itinerary.legs.map((leg, legIndex) => {
                const instruction = itinerary.transferInstructions[legIndex];
                return (
                  <li key={`${itinerary.id}:${leg.patternId}`}>
                    <div className="journey-leg__route"><RouteToken route={{ id: leg.routeId, label: leg.routeLabel }} compact /><strong>{leg.routeLabel} toward {leg.actualDestination}</strong></div>
                    <p>{stationName(catalog, leg.fromStationId)} to {stationName(catalog, leg.toStationId)} · {titleDirection(leg.direction)}</p>
                    {instruction ? <p className="journey-transfer">Transfer at {stationName(catalog, instruction.stationId)}</p> : null}
                  </li>
                );
              })}
            </ol>
            {canActivate && itinerary.capture ? (
              <button type="button" onClick={() => onActivateTrip(itinerary, response)}>
                Use {transfer ? 'transfer' : 'direct'} itinerary underground
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function stationName(catalog: readonly CatalogComplexDto[], stationId: string): string {
  const exact = catalog.find(({ id, constituents }) => id === stationId || constituents.some(({ id: constituentId }) => constituentId === stationId));
  return exact?.name ?? stationId;
}

function titleDirection(value: string): string {
  return value.charAt(0).toLocaleUpperCase('en-US') + value.slice(1);
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function journeyOwnsRequest(response: JourneyEnvelopeDto, request: JourneyRequestDto): boolean {
  if (response.data === null) return true;
  const { scope } = response.data;
  return scope.mode === request.mode
    && scope.originStationId === request.originStationId
    && scope.destinationStationId === request.destinationStationId
    && scope.accessibleRouteOnly === request.accessibleRouteOnly
    && (scope.serviceDate ?? null) === (request.serviceDate ?? null);
}
