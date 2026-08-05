import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type {
  BootstrapEnvelopeDto,
  JourneyEnvelopeDto,
  MapReferenceDto,
  MapReferenceEnvelopeDto,
  TransitApiClient,
} from '../../src/client/api/client';
import { JourneyPlanner } from '../../src/client/components/JourneyPlanner';
import { VectorNetworkMap } from '../../src/client/components/VectorNetworkMap';
import { MapView } from '../../src/client/views/MapView';

afterEach(() => document.body.replaceChildren());

describe('independent map service meaning', () => {
  test('changes coordinate treatment when the rider switches from schematic to geographic', () => {
    const reference: MapReferenceDto = {
      theme: 'day', contentVersion: 'projection-proof', attribution: 'Test reference',
      features: [{
        id: 'projection-line', kind: 'line', routeIds: ['A'],
        geometry: { type: 'LineString', coordinates: [[-74, 0], [-73.9, 45], [-73.8, 80]] },
      }],
    };
    const viewport = { centerX: 40.7, centerY: -74, zoom: 1 };
    const view = render(<VectorNetworkMap reference={reference} viewport={viewport} spatialView="schematic" serviceLabel="Reference" />);
    const schematic = screen.getByRole('img').querySelector('polyline')?.getAttribute('points');

    view.rerender(<VectorNetworkMap reference={reference} viewport={viewport} spatialView="geographic" serviceLabel="Reference" />);
    const geographic = screen.getByRole('img').querySelector('polyline')?.getAttribute('points');

    expect(schematic).toBeTruthy();
    expect(geographic).toBeTruthy();
    expect(geographic).not.toBe(schematic);
  });

  test('keeps a stable structural base under Actual now and layers only the current owned overlay', async () => {
    const api = mapApi();
    render(<MapView
      api={api}
      bootstrap={bootstrap}
      catalog={catalog}
      connected
      initialContext={{ serviceMeaning: 'actual-now', spatialView: 'schematic', viewport: { centerX: 40.7, centerY: -74, zoom: 1.5 } }}
      onContextChange={vi.fn()}
      onActivateTrip={vi.fn()}
    />);

    expect(screen.getByRole('button', { name: 'Actual now' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(screen.getByTestId('vector-network-map').querySelector('[data-map-feature="line-a"]')).toBeInTheDocument());
    expect(api.mapReference).toHaveBeenCalledWith('day', 'map-day-7', expect.any(AbortSignal));
    expect(screen.getByTestId('vector-network-map').querySelector('[data-map-feature="line-a"]')).toHaveAttribute('data-state', 'normal');

    fireEvent.click(screen.getByRole('button', { name: 'Typical weekday' }));
    await waitFor(() => expect(screen.getByText('Typical weekday — reference')).toBeInTheDocument());
    expect(screen.getAllByText('Not current').length).toBeGreaterThan(0);
    expect(api.mapReference).toHaveBeenCalledWith('day', 'map-day-7', expect.any(AbortSignal));
    expect(screen.getByTestId('vector-network-map')).toHaveAttribute('data-viewport', '40.7,-74,1.5');

    fireEvent.click(screen.getByRole('button', { name: 'Late night' }));
    await waitFor(() => expect(screen.getByText('Late night — reference')).toBeInTheDocument());
    expect(api.mapReference).toHaveBeenCalledWith('night', 'map-night-7', expect.any(AbortSignal));
    expect(screen.getByTestId('map-appearance')).toHaveTextContent('Dark appearance');
  });

  test('removes the prior reference immediately while a different service meaning is still loading', async () => {
    const night = deferred<MapReferenceEnvelopeDto>();
    const api = mapApi();
    api.mapReference.mockImplementation(async (theme: 'day' | 'night') => {
      if (theme === 'night') return night.promise;
      return mapReference('day', 'day-line');
    });
    render(<MapView
      api={api}
      bootstrap={bootstrap}
      catalog={catalog}
      connected
      initialContext={{ serviceMeaning: 'typical-weekday', spatialView: 'schematic', viewport: { centerX: 40.7, centerY: -74, zoom: 1 } }}
      onContextChange={vi.fn()}
      onActivateTrip={vi.fn()}
    />);

    await waitFor(() => expect(screen.getByTestId('vector-network-map').querySelector('[data-map-feature="day-line"]')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Late night' }));

    expect(screen.queryByTestId('map-feature-day-line')).not.toBeInTheDocument();
    expect(screen.getByTestId('vector-network-map').querySelector('[data-map-feature="day-line"]')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Opening stored subway reference');

    night.resolve(mapReference('night', 'night-line'));
    await waitFor(() => expect(screen.getByTestId('vector-network-map').querySelector('[data-map-feature="night-line"]')).toBeInTheDocument());
  });

  test('preserves Actual-now intent and viewport when current evidence is lost without silently choosing a reference', async () => {
    const api = mapApi();
    const onContextChange = vi.fn();
    render(<MapView
      api={api}
      bootstrap={bootstrap}
      catalog={catalog}
      connected={false}
      initialContext={{
        serviceMeaning: 'actual-now', spatialView: 'geographic', viewport: { centerX: 40.73, centerY: -73.99, zoom: 2 },
        selectedStationId: 'A12', selectedRouteId: 'A',
      }}
      onContextChange={onContextChange}
      onActivateTrip={vi.fn()}
    />);

    expect(screen.getByRole('button', { name: 'Actual now' })).toBeDisabled();
    expect(screen.getByText('Current service information is unavailable. Choose a reference pattern to continue.')).toBeInTheDocument();
    expect(api.mapReference).not.toHaveBeenCalled();
    expect(screen.queryByText('Reference pattern—not live.')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-context')).toHaveAttribute('data-selected-station', 'A12');
    expect(screen.getByTestId('map-context')).toHaveAttribute('data-selected-route', 'A');

    fireEvent.click(screen.getByRole('button', { name: 'Typical weekday' }));
    await waitFor(() => expect(screen.getAllByText('Reference pattern—not live.').length).toBeGreaterThan(0));
    expect(screen.getByTestId('vector-network-map')).toHaveAttribute('data-viewport', '40.73,-73.99,2');
    expect(onContextChange).toHaveBeenCalledWith(expect.objectContaining({
      serviceMeaning: 'typical-weekday', spatialView: 'geographic', selectedStationId: 'A12', selectedRouteId: 'A',
    }));
  });

  test('never paints a retained historical overlay as Actual now while the navigator reports online', async () => {
    const api = mapApi('historical');
    render(<MapView
      api={api}
      bootstrap={bootstrap}
      catalog={catalog}
      connected
      initialContext={{ serviceMeaning: 'actual-now', spatialView: 'schematic', viewport: { centerX: 40.7, centerY: -74, zoom: 1 } }}
      onContextChange={vi.fn()}
      onActivateTrip={vi.fn()}
    />);

    expect(await screen.findByText('A retained historical service overlay is available, but it is hidden because it is not current.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('vector-network-map').querySelector('[data-map-feature="line-a"]')).toBeInTheDocument());
    expect(screen.getByTestId('vector-network-map').querySelector('[data-map-feature="line-a"]')).toHaveAttribute('data-state', 'normal');
  });
});

describe('journey planning and activation', () => {
  test('routes offline through the injected local planner with zero journey requests and no offline activation', async () => {
    const response = journeyResponse();
    const planOfflineJourney = vi.fn(() => response);
    const api = {
      ...mapApi(),
      searchStations: vi.fn(async () => ({ apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7', query: 'canal', results: [catalog[1]] })),
      planJourney: vi.fn(async () => { throw new Error('Offline planning must not use the API'); }),
    } as unknown as TransitApiClient;
    const onActivateTrip = vi.fn();
    render(<JourneyPlanner
      api={api}
      origin={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
      catalog={catalog}
      serviceMeaning="typical-weekday"
      connected={false}
      planOfflineJourney={planOfflineJourney}
      onActivateTrip={onActivateTrip}
    />);

    const search = screen.getByRole('combobox', { name: 'Destination station' });
    fireEvent.change(search, { target: { value: 'canal' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /Canal St/ })).toBeInTheDocument());
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Plan reference trip' }));

    await waitFor(() => expect(screen.getByText('Untimed structural route')).toBeInTheDocument());
    const itineraries = screen.getAllByRole('article', { name: /itinerary/i });
    expect(itineraries).toHaveLength(2);
    expect(within(itineraries[0]).getByText('A toward Inwood–207 St')).toBeInTheDocument();
    expect(within(itineraries[1]).getByText('Transfer at 59 St')).toBeInTheDocument();
    expect(within(itineraries[1]).getByText('C toward Euclid Av')).toBeInTheDocument();
    expect(planOfflineJourney).toHaveBeenCalledWith({
      mode: 'offline-reference', originStationId: 'A12', destinationStationId: 'R20', accessibleRouteOnly: false,
    });
    expect(api.planJourney).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Use .* itinerary underground/ })).not.toBeInTheDocument();
    expect(onActivateTrip).not.toHaveBeenCalled();
  });

  test('keeps a locked journey surface honest and never fabricates an itinerary', async () => {
    const api = {
      ...mapApi(),
      searchStations: vi.fn(async () => ({ apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7', query: 'canal', results: [catalog[1]] })),
      planJourney: vi.fn(async () => ({ ...dynamic, runtime: { mode: 'live', surface: 'public', availability: 'locked' }, data: null })),
    } as unknown as TransitApiClient;
    render(<JourneyPlanner
      api={api}
      origin={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
      catalog={catalog}
      serviceMeaning="actual-now"
      connected
      onActivateTrip={vi.fn()}
    />);

    const search = screen.getByRole('combobox', { name: 'Destination station' });
    fireEvent.change(search, { target: { value: 'canal' } });
    await waitFor(() => screen.getByRole('option', { name: /Canal St/ }));
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Plan current trip' }));

    await waitFor(() => expect(screen.getByText('Journey planning is not released yet.')).toBeInTheDocument());
    expect(screen.queryByRole('article', { name: /itinerary/i })).not.toBeInTheDocument();
  });

  test('rejects a late journey response after an exact request tuple input changes', async () => {
    const pending = deferred<JourneyEnvelopeDto>();
    const api = {
      ...mapApi(),
      searchStations: vi.fn(async () => ({ apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7', query: 'canal', results: [catalog[1]] })),
      planJourney: vi.fn(async () => pending.promise),
    } as unknown as TransitApiClient;
    render(<JourneyPlanner
      api={api}
      origin={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
      catalog={catalog}
      serviceMeaning="actual-now"
      connected
      onActivateTrip={vi.fn()}
    />);

    const search = screen.getByRole('combobox', { name: 'Destination station' });
    fireEvent.change(search, { target: { value: 'canal' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /Canal St/ })).toBeInTheDocument());
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Plan current trip' }));
    expect(api.planJourney).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Accessible Route Only' }));
    pending.resolve(onlineJourneyResponse());

    await waitFor(() => expect(screen.queryByText('Current itinerary')).not.toBeInTheDocument());
    expect(screen.queryByRole('article', { name: /itinerary/i })).not.toBeInTheDocument();
  });

  test('clears an exact destination as soon as its visible text is edited and invalidates the old trip', async () => {
    const pending = deferred<JourneyEnvelopeDto>();
    let journeySignal: AbortSignal | undefined;
    const api = {
      ...mapApi(),
      searchStations: vi.fn(async (query: string) => ({
        apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7', query,
        results: query === 'canal' ? [catalog[1]] : [catalog[2]],
      })),
      planJourney: vi.fn(async (_query, signal) => { journeySignal = signal; return pending.promise; }),
    } as unknown as TransitApiClient;
    const onActivateTrip = vi.fn();
    render(<JourneyPlanner
      api={api}
      origin={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
      catalog={catalog}
      serviceMeaning="actual-now"
      connected
      onActivateTrip={onActivateTrip}
    />);

    const search = screen.getByRole('combobox', { name: 'Destination station' });
    fireEvent.change(search, { target: { value: 'canal' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /Canal St/ })).toBeInTheDocument());
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    const plan = screen.getByRole('button', { name: 'Plan current trip' });
    fireEvent.click(plan);

    fireEvent.change(search, { target: { value: '59' } });
    expect(plan).toBeDisabled();
    expect(journeySignal?.aborted).toBe(true);
    pending.resolve(onlineJourneyResponse());

    await waitFor(() => expect(screen.queryByRole('article', { name: /itinerary/i })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Use .* itinerary underground/ })).not.toBeInTheDocument();
    expect(onActivateTrip).not.toHaveBeenCalled();
  });
});

const dynamic = {
  apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'response:map',
  decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
  runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' }, gates: {},
  demonstrationLabel: 'Demonstration data — not live', sourceHealth: [], provenance: [],
} as const;

const bootstrap = {
  ...dynamic,
  data: { productName: 'NYC Subway Tracker', unofficial: true, contentVersions: { stationCatalog: 'catalog-7', maps: { day: 'map-day-7', night: 'map-night-7' }, journeyGraph: 'journey-graph-7' } },
} as BootstrapEnvelopeDto;

const catalog = [
  { id: 'A12', name: '125 St', routeIds: ['A'], constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N'] }] },
  { id: 'R20', name: 'Canal St', routeIds: ['R'], constituents: [{ id: 'R20', name: 'Canal St', directionalStopIds: ['R20S'] }] },
  { id: 'D14', name: '59 St', routeIds: ['A', 'C'], constituents: [{ id: 'D14', name: '59 St', directionalStopIds: ['D14N', 'D14S'] }] },
] as const;

function mapApi(cacheState: 'network' | 'historical' = 'network') {
  const reference = (theme: 'day' | 'night'): MapReferenceEnvelopeDto => ({
    apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: theme === 'day' ? 'map-day-7' : 'map-night-7',
    demonstrationLabel: 'Demonstration data — not live',
    data: {
      theme, contentVersion: theme === 'day' ? 'map-day-7' : 'map-night-7', attribution: 'Unofficial app-owned subway reference geometry',
      features: [
        { id: 'line-a', kind: 'line', routeIds: ['A'], geometry: { type: 'LineString', coordinates: [[-74, 40.7], [-73.9, 40.8]] } },
        { id: 'station-a12', kind: 'station', routeIds: ['A'], geometry: { type: 'Point', coordinates: [-74, 40.7] } },
      ],
    },
  });
  return {
    mapReference: vi.fn(async (theme: 'day' | 'night') => reference(theme)),
    mapOverlay: vi.fn(async (theme: 'day' | 'night') => ({
      ...dynamic, cacheState, data: { theme, serviceEpoch: 'epoch-7', segments: [{ id: 'line-a', routeIds: ['A'], state: 'normal', alertIds: [] }] },
    })),
  } as unknown as TransitApiClient & { mapReference: ReturnType<typeof vi.fn>; mapOverlay: ReturnType<typeof vi.fn> };
}

function mapReference(theme: 'day' | 'night', featureId: string): MapReferenceEnvelopeDto {
  return {
    apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: theme === 'day' ? 'map-day-7' : 'map-night-7',
    demonstrationLabel: 'Demonstration data \u2014 not live',
    data: {
      theme, contentVersion: theme === 'day' ? 'map-day-7' : 'map-night-7', attribution: 'Unofficial app-owned subway reference geometry',
      features: [{ id: featureId, kind: 'line', routeIds: ['A'], geometry: { type: 'LineString', coordinates: [[-74, 40.7], [-73.9, 40.8]] } }],
    },
  };
}

function journeyResponse(): JourneyEnvelopeDto {
  return {
    ...dynamic,
    data: {
      kind: 'untimed', label: 'Untimed structural route',
      scope: { mode: 'offline-reference', originStationId: 'A12', destinationStationId: 'R20', accessibleRouteOnly: false },
      itineraries: [
        itinerary('direct', [{ routeId: 'A', routeLabel: 'A', direction: 'northbound', destination: 'Inwood–207 St', from: 'A12', to: 'R20' }], []),
        itinerary('transfer', [
          { routeId: 'A', routeLabel: 'A', direction: 'northbound', destination: 'Inwood–207 St', from: 'A12', to: 'D14' },
          { routeId: 'C', routeLabel: 'C', direction: 'southbound', destination: 'Euclid Av', from: 'D14', to: 'R20' },
        ], [{ transferId: 'xfer-59', stationId: 'D14', fromRouteId: 'A', fromDirection: 'northbound', fromActualDestination: 'Inwood–207 St', toRouteId: 'C', toDirection: 'southbound', toActualDestination: 'Euclid Av' }]),
      ],
    },
  };
}

function onlineJourneyResponse(): JourneyEnvelopeDto {
  const response = journeyResponse();
  if (!response.data || response.data.kind !== 'untimed') throw new Error('Expected offline fixture');
  return {
    ...response,
    data: {
      kind: 'planned',
      scope: { ...response.data.scope, mode: 'online-current' },
      itineraries: response.data.itineraries.map((value) => ({
        ...value,
        validity: 'valid',
        risk: 'clear',
        timing: 'timed',
      })),
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => { resolve = accept; });
  return { promise, resolve };
}

function itinerary(
  id: string,
  legs: readonly { routeId: string; routeLabel: string; direction: 'northbound' | 'southbound'; destination: string; from: string; to: string }[],
  transfers: readonly any[],
) {
  return {
    id, transferIds: transfers.map(({ transferId }) => transferId), transfers: transfers.length,
    validity: 'limited' as const, accessibility: 'eligible' as const, risk: 'uncertain' as const, timing: 'untimed' as const,
    legs: legs.map((leg, index) => ({
      patternId: `pattern-${id}-${index}`, routeId: leg.routeId, routeLabel: leg.routeLabel, direction: leg.direction,
      actualDestination: leg.destination, fromOccurrenceId: `occ-${leg.from}`, toOccurrenceId: `occ-${leg.to}`,
      orderedOccurrenceIds: [`occ-${leg.from}`, `occ-${leg.to}`], fromStationId: leg.from, toStationId: leg.to,
      orderedStationIds: [leg.from, leg.to],
    })),
    transferInstructions: transfers,
  };
}
