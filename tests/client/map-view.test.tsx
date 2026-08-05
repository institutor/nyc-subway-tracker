import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type {
  BootstrapEnvelopeDto,
  JourneyEnvelopeDto,
  MapReferenceEnvelopeDto,
  TransitApiClient,
} from '../../src/client/api/client';
import { JourneyPlanner } from '../../src/client/components/JourneyPlanner';
import { MapView } from '../../src/client/views/MapView';

afterEach(() => document.body.replaceChildren());

describe('independent map service meaning', () => {
  test('keeps dark appearance independent and loads Day/Night references only after explicit selection', async () => {
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
    expect(api.mapReference).not.toHaveBeenCalled();

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
    expect(screen.getByText('No unsupported current geometry is drawn.')).toBeInTheDocument();
  });
});

describe('journey planning and activation', () => {
  test('renders direct and transfer itineraries in exact server order without client reranking', async () => {
    const response = journeyResponse();
    const api = {
      ...mapApi(),
      searchStations: vi.fn(async () => ({ apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7', query: 'canal', results: [catalog[1]] })),
      planJourney: vi.fn(async () => response),
    } as unknown as TransitApiClient;
    const onActivateTrip = vi.fn();
    render(<JourneyPlanner
      api={api}
      origin={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
      catalog={catalog}
      serviceMeaning="typical-weekday"
      connected={false}
      onActivateTrip={onActivateTrip}
    />);

    const search = screen.getByRole('combobox', { name: 'Destination station' });
    fireEvent.change(search, { target: { value: 'canal' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /Canal St/ })).toBeInTheDocument());
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Plan reference trip' }));

    await waitFor(() => expect(screen.getByText('Reference itinerary')).toBeInTheDocument());
    const itineraries = screen.getAllByRole('article', { name: /itinerary/i });
    expect(itineraries).toHaveLength(2);
    expect(within(itineraries[0]).getByText('A toward Inwood–207 St')).toBeInTheDocument();
    expect(within(itineraries[1]).getByText('Transfer at 59 St')).toBeInTheDocument();
    expect(within(itineraries[1]).getByText('C toward Euclid Av')).toBeInTheDocument();
    expect(api.planJourney).toHaveBeenCalledWith({
      mode: 'offline-reference', originStationId: 'A12', destinationStationId: 'R20', accessibleRouteOnly: false,
    }, expect.any(AbortSignal));

    fireEvent.click(within(itineraries[1]).getByRole('button', { name: 'Use transfer itinerary underground' }));
    expect(onActivateTrip).toHaveBeenCalledWith(response.data && response.data.kind === 'planned' ? response.data.itineraries[1] : undefined, response);
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
});

const dynamic = {
  apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'response:map',
  decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
  runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' }, gates: {},
  demonstrationLabel: 'Demonstration data — not live', sourceHealth: [], provenance: [],
} as const;

const bootstrap = {
  ...dynamic,
  data: { productName: 'NYC Subway Tracker', unofficial: true, contentVersions: { stationCatalog: 'catalog-7', maps: { day: 'map-day-7', night: 'map-night-7' } } },
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

function journeyResponse(): JourneyEnvelopeDto {
  return {
    ...dynamic,
    data: {
      kind: 'planned', label: 'Reference itinerary',
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

function itinerary(
  id: string,
  legs: readonly { routeId: string; routeLabel: string; direction: 'northbound' | 'southbound'; destination: string; from: string; to: string }[],
  transfers: readonly any[],
) {
  return {
    id, transferIds: transfers.map(({ transferId }) => transferId), transfers: transfers.length,
    validity: 'valid' as const, accessibility: 'eligible' as const, risk: 'clear' as const, timing: 'timed' as const,
    arrivalSeconds: 600,
    legs: legs.map((leg, index) => ({
      patternId: `pattern-${id}-${index}`, routeId: leg.routeId, routeLabel: leg.routeLabel, direction: leg.direction,
      actualDestination: leg.destination, fromOccurrenceId: `occ-${leg.from}`, toOccurrenceId: `occ-${leg.to}`,
      orderedOccurrenceIds: [`occ-${leg.from}`, `occ-${leg.to}`], fromStationId: leg.from, toStationId: leg.to,
      orderedStationIds: [leg.from, leg.to],
    })),
    transferInstructions: transfers,
  };
}
