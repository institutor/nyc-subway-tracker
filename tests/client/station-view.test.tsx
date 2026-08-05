import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test } from 'vitest';

import type { Direction } from '../../src/shared/domain/types';
import { StationView } from '../../src/client/views/StationView';
import { boardEnvelope, disclosure } from '../helpers/client-fixtures';

describe('governed station board', () => {
  test('keeps API primary order, both directions, and Holding in separate status-only context', () => {
    render(<StationHarness />);

    const north = screen.getByRole('region', { name: 'Uptown / Northbound trains' });
    const primary = within(north).getAllByTestId('primary-arrival');
    expect(primary).toHaveLength(2);
    expect(within(primary[0]).getByText('Inwood–207 St')).toBeTruthy();
    expect(within(primary[0]).getByText('3 min')).toBeTruthy();
    expect(within(primary[1]).getByText('Next northbound terminal')).toBeTruthy();
    expect(within(primary[1]).getByText('5–7 min')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Downtown / Southbound trains' })).toBeTruthy();

    const secondary = within(north).getByRole('region', { name: 'Additional train context' });
    expect(within(secondary).getByText('Holding')).toBeTruthy();
    expect(within(secondary).queryByText(/\d+ min/)).toBeNull();
  });

  test('renders route text identity plus exact disclosure and public source labels on every claim', () => {
    render(<StationHarness />);

    expect(screen.getAllByLabelText('A train').length).toBeGreaterThan(1);
    expect(screen.getAllByText(disclosure).length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText('MTA real-time').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText('MTA service alerts')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Service alert' }).textContent).toContain('A trains are running with delays.');
  });

  test('refresh preserves route and reversed-direction controls', () => {
    render(<StationHarness />);

    const route = screen.getByRole('button', { name: 'Show only A trains' });
    fireEvent.click(route);
    expect(route.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Reverse direction' }));
    expect(screen.getByRole('button', { name: 'Show southbound only' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh train times' }));

    expect(screen.getByRole('button', { name: 'Show only A trains' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Show southbound only' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Refreshed 1 time')).toBeTruthy();
  });

  test('renders locked arrival capability as unavailable without an empty fake board', () => {
    const locked = {
      ...boardEnvelope(),
      responseIdentity: 'response:locked',
      runtime: { mode: 'live', surface: 'public', availability: 'locked' } as const,
      data: null,
    };
    render(
      <StationView
        station={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
        board={locked}
        phase="ready"
        filters={{ routeIds: [] }}
        onFiltersChange={() => undefined}
        onRefresh={() => undefined}
      />,
    );
    expect(screen.getByText('Live arrivals are not released yet.')).toBeTruthy();
    expect(screen.queryByTestId('primary-arrival')).toBeNull();
  });
});

function StationHarness() {
  const [filters, setFilters] = useState<{ readonly routeIds: readonly string[]; readonly direction?: Direction }>({ routeIds: [] });
  const [refreshes, setRefreshes] = useState(0);
  return (
    <>
      <StationView
        station={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
        board={boardEnvelope()}
        phase="ready"
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={() => setRefreshes((value) => value + 1)}
      />
      <p>Refreshed {refreshes} {refreshes === 1 ? 'time' : 'times'}</p>
    </>
  );
}
