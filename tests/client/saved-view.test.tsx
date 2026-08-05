import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { BoardEnvelopeDto, CatalogComplexDto, TransitApiClient } from '../../src/client/api/client';
import { StationSearch } from '../../src/client/components/StationSearch';
import { SavedView } from '../../src/client/views/SavedView';
import type { SavedRecord } from '../../src/shared/domain/types';

afterEach(() => document.body.replaceChildren());

const records: readonly SavedRecord[] = [
  {
    id: 'saved-b', complexId: 'B01', constituentId: 'B01', routeFilters: ['B'], accessibleRouteOnly: true,
    preferredRide: { direction: 'southbound', actualDestination: 'Brighton Beach' }, state: 'active',
  },
  {
    id: 'saved-a', complexId: 'A12', constituentId: 'A12', routeFilters: ['A'], accessibleRouteOnly: false,
    preferredRide: { direction: 'northbound', actualDestination: 'Inwood–207 St' }, state: 'paused',
  },
];

const completeRecord: SavedRecord = {
  id: 'saved-complete', complexId: 'B01', constituentId: 'B01',
  preferredEntrance: { entranceId: 'entrance-dekalb-north', direction: 'northbound' },
  preferredRide: { direction: 'southbound', actualDestination: 'Brighton Beach' },
  routeFilters: ['B'], accessibleRouteOnly: true,
  commonDestination: { complexId: 'A12', constituentId: 'A12' },
  timeWindow: { weekdays: [1, 3, 5], startsAt: '08:00', endsAt: '09:00' },
  state: 'active',
};

const catalog: readonly CatalogComplexDto[] = [
  { id: 'B01', name: 'DeKalb Av', routeIds: ['B', 'Q'], constituents: [{ id: 'B01', name: 'DeKalb Av', directionalStopIds: ['B01N', 'B01S'] }] },
  { id: 'A12', name: '125 St', routeIds: ['A', 'C'], constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N', 'A12S'] }] },
];

describe('Saved device-only rider intent', () => {
  test('renders deterministic exact intent immediately without mutating or refreshing it', () => {
    const onOpen = vi.fn();
    const onRefreshAll = vi.fn();
    render(<SavedView
      records={[records[0], records[1]]}
      catalog={catalog}
      boards={new Map()}
      onOpen={onOpen}
      onRefreshAll={onRefreshAll}
      onSave={vi.fn()}
      onPause={vi.fn()}
      onReset={vi.fn()}
      onDelete={vi.fn()}
    />);

    const headings = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent);
    expect(headings.slice(0, 2)).toEqual(['125 St', 'DeKalb Av']);
    expect(screen.getByText('Northbound toward Inwood–207 St')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'DeKalb Av' })).getByText('Accessible Route Only').closest('div')).toHaveTextContent('On');
    expect(within(screen.getByRole('article', { name: '125 St' })).getAllByText('Paused')).toHaveLength(2);
    expect(onOpen).not.toHaveBeenCalled();
    expect(onRefreshAll).not.toHaveBeenCalled();
  });

  test('refreshes every route and passenger direction while keeping a filtered-route disruption visible', () => {
    const onRefreshAll = vi.fn();
    const board = boardWithFilteredAlert();
    render(<SavedView
      records={[records[0]]}
      catalog={catalog}
      boards={new Map([['saved-b', board]])}
      onOpen={vi.fn()}
      onRefreshAll={onRefreshAll}
      onSave={vi.fn()}
      onPause={vi.fn()}
      onReset={vi.fn()}
      onDelete={vi.fn()}
    />);

    expect(screen.getByText('Q trains are rerouted via the R line.')).toBeInTheDocument();
    expect(screen.getByText(/Demonstration data/)).toBeInTheDocument();
    expect(screen.getByText(/Evidence observed/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh all DeKalb Av routes and directions' }));
    expect(onRefreshAll).toHaveBeenCalledWith(records[0]);
  });

  test('keeps draft edits local until explicit Save changes', () => {
    const onSave = vi.fn();
    render(<SavedView
      records={[records[0]]}
      catalog={catalog}
      boards={new Map()}
      onOpen={vi.fn()}
      onRefreshAll={vi.fn()}
      onSave={onSave}
      onPause={vi.fn()}
      onReset={vi.fn()}
      onDelete={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit saved station DeKalb Av' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Q' }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel editing DeKalb Av' }));
    expect(screen.getByText('Routes').closest('div')).toHaveTextContent('B');

    fireEvent.click(screen.getByRole('button', { name: 'Edit saved station DeKalb Av' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Q' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes for DeKalb Av' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'saved-b', routeFilters: ['B', 'Q'] }));
  });

  test('edits every rider-owned field in a detached draft and Cancel preserves the original bytes', () => {
    const onSave = vi.fn();
    const originalBytes = JSON.stringify(completeRecord);
    render(<SavedView
      records={[completeRecord]}
      catalog={catalog}
      boards={new Map()}
      onOpen={vi.fn()}
      onRefreshAll={vi.fn()}
      onSave={onSave}
      onPause={vi.fn()}
      onReset={vi.fn()}
      onDelete={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit saved station DeKalb Av' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Preferred entrance ID' }), { target: { value: 'entrance-dekalb-south' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Preferred entrance direction' }), { target: { value: 'southbound' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Personalization state' }), { target: { value: 'paused' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel editing DeKalb Av' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(JSON.stringify(completeRecord)).toBe(originalBytes);
    expect(screen.getByText('Preferred entrance').closest('div')).toHaveTextContent('entrance-dekalb-north');

    fireEvent.click(screen.getByRole('button', { name: 'Edit saved station DeKalb Av' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Preferred entrance ID' }), { target: { value: 'entrance-dekalb-south' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Preferred entrance direction' }), { target: { value: 'southbound' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Preferred actual destination' }), { target: { value: 'Coney Island' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Common destination station' }), { target: { value: 'B01\u0000B01' } });
    fireEvent.change(screen.getByLabelText('Commute window starts'), { target: { value: '07:30' } });
    fireEvent.change(screen.getByLabelText('Commute window ends'), { target: { value: '08:30' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tuesday' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Personalization state' }), { target: { value: 'paused' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes for DeKalb Av' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      preferredEntrance: { entranceId: 'entrance-dekalb-south', direction: 'southbound' },
      preferredRide: { direction: 'southbound', actualDestination: 'Coney Island' },
      commonDestination: { complexId: 'B01', constituentId: 'B01' },
      timeWindow: { weekdays: [1, 2, 3, 5], startsAt: '07:30', endsAt: '08:30' },
      state: 'paused',
    }));
  });

  test('pause, reset, and delete target only the selected record', () => {
    const onPause = vi.fn();
    const onReset = vi.fn();
    const onDelete = vi.fn();
    render(<SavedView
      records={records}
      catalog={catalog}
      boards={new Map()}
      onOpen={vi.fn()}
      onRefreshAll={vi.fn()}
      onSave={vi.fn()}
      onPause={onPause}
      onReset={onReset}
      onDelete={onDelete}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Resume personalization for 125 St' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset station preferences for DeKalb Av' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete saved station DeKalb Av' }));

    expect(onPause).toHaveBeenCalledWith('saved-a', 'active');
    expect(onReset).toHaveBeenCalledWith('saved-b');
    expect(onDelete).toHaveBeenCalledWith('saved-b');
  });
});

describe('exact catalog station search', () => {
  test('is an accessible abortable combobox and selects only an exact server result', async () => {
    let pendingSignal: AbortSignal | undefined;
    const api = {
      searchStations: vi.fn(async (_query: string, _limit: number, signal?: AbortSignal) => {
        pendingSignal = signal;
        return { apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7', query: 'canal', results: [catalog[0]] };
      }),
    } as unknown as TransitApiClient;
    const onSelect = vi.fn();
    const view = render(<StationSearch api={api} label="Destination station" onSelect={onSelect} />);

    const input = screen.getByRole('combobox', { name: 'Destination station' });
    fireEvent.change(input, { target: { value: 'canal' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /DeKalb Av/ })).toBeInTheDocument());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith({ complexId: 'B01', constituentId: 'B01', name: 'DeKalb Av' });
    expect(api.searchStations).toHaveBeenCalledWith('canal', 10, expect.any(AbortSignal));
    expect(pendingSignal).toBeInstanceOf(AbortSignal);

    view.unmount();
    expect(pendingSignal?.aborted).toBe(true);
  });
});

function boardWithFilteredAlert(): BoardEnvelopeDto {
  return {
    cacheState: 'network',
    apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'board-b',
    decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
    runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' }, gates: {},
    data: {
      station: { id: 'B01', name: 'DeKalb Av', complexId: 'B01', routeIds: ['B', 'Q'] }, mode: 'live',
      directions: [], explanations: [], sourceHealth: [], provenance: [],
      alerts: [{
        id: 'alert-q', text: 'Q trains are rerouted via the R line.', activeFrom: '2026-08-04T11:00:00.000Z',
        routeIds: ['Q'], stationIds: ['B01'], directions: ['northbound'],
        demonstrationLabel: 'Demonstration data — not live',
        provenance: { source: 'alerts', sourceId: 'mta-alerts', observedAt: '2026-08-04T11:59:00.000Z', retrievedAt: '2026-08-04T11:59:30.000Z' },
      }],
      capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
    },
  };
}
