import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { App } from '../../src/client/App';
import { ActiveTripCard } from '../../src/client/components/ActiveTripCard';
import { OfflineBanner } from '../../src/client/components/OfflineBanner';
import type { ActiveTripRecord } from '../../src/client/storage/active-trip-store';
import { createBrowserStructuralStore } from '../../src/client/storage/structural-store';
import { StationView } from '../../src/client/views/StationView';
import {
  ControlledGeolocation,
  MemoryStorage,
  boardEnvelope,
  bootstrapEnvelope,
  catalogEnvelope,
  createClientApi,
} from '../helpers/client-fixtures';

describe('explicit global Offline presentation', () => {
  test('keeps the exact persistent message available visually and to assistive technology', () => {
    render(<OfflineBanner />);

    const banner = screen.getByRole('status');
    expect(banner.textContent).toBe('Offline—live arrivals, alerts, and elevator status are unavailable.');
    expect(banner.getAttribute('aria-live')).toBe('assertive');
  });

  test('treats the retained station board as historical and freezes every former countdown', () => {
    render(
      <StationView
        station={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
        board={boardEnvelope()}
        phase="ready"
        filters={{ routeIds: [] }}
        historical
        onFiltersChange={() => undefined}
        onRefresh={() => undefined}
      />,
    );

    expect(screen.getByText('Historical board · last checked 8:00 AM')).toBeTruthy();
    expect(screen.getAllByText('Historical arrival').length).toBeGreaterThan(0);
    expect(screen.getByText('Was due 8:03 AM')).toBeTruthy();
    expect(screen.queryByText('3 min')).toBeNull();
    expect(screen.queryByText('Live')).toBeNull();
    expect(screen.getByRole('region', { name: 'Historical service alert' })).toBeTruthy();
  });

  test('a cold offline open does not request or synthesize transit data', () => {
    const geolocation = new ControlledGeolocation();
    const bootstrap = vi.fn(createClientApi().bootstrap);
    render(
      <App
        api={createClientApi({ bootstrap })}
        geolocation={geolocation}
        storage={new MemoryStorage()}
        connectivity="offline"
      />,
    );

    expect(screen.getByText('Offline—live arrivals, alerts, and elevator status are unavailable.')).toBeTruthy();
    expect(screen.getByText('No current subway information is stored on this device.')).toBeTruthy();
    expect(screen.queryByText(/Live and expected arrivals/)).toBeNull();
    expect(bootstrap).not.toHaveBeenCalled();
    expect(geolocation.requests).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Map' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Saved' })).toBeTruthy();
  });

  test('opens an explicitly selected stored map after reload without bootstrap or location waiting', async () => {
    const storage = new MemoryStorage();
    expect(createBrowserStructuralStore(storage).write(bootstrapEnvelope.data.contentVersions, catalogEnvelope)).toBe(true);
    const mapReference = vi.fn(async (theme: 'day' | 'night', contentVersion: string) => mapEnvelope(theme, contentVersion));
    const bootstrap = vi.fn(createClientApi().bootstrap);
    render(
      <App
        api={createClientApi({ bootstrap, mapReference })}
        geolocation={new ControlledGeolocation()}
        storage={storage}
        connectivity="offline"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    fireEvent.click(screen.getByRole('button', { name: 'Typical weekday' }));

    await waitFor(() => expect(mapReference).toHaveBeenCalledWith(
      'day', bootstrapEnvelope.data.contentVersions.maps.day, expect.any(AbortSignal),
    ));
    expect(screen.getAllByText('Reference pattern—not live.').length).toBeGreaterThan(0);
    expect(bootstrap).not.toHaveBeenCalled();
  });

  test('warms both app-owned vector references after structural versions are accepted online', async () => {
    const mapReference = vi.fn(async (theme: 'day' | 'night', contentVersion: string) => mapEnvelope(theme, contentVersion));
    render(
      <App
        api={createClientApi({ mapReference })}
        geolocation={null}
        storage={new MemoryStorage()}
        connectivity="online"
      />,
    );

    await waitFor(() => expect(mapReference).toHaveBeenCalledTimes(2));
    expect(mapReference).toHaveBeenCalledWith('day', bootstrapEnvelope.data.contentVersions.maps.day, expect.any(AbortSignal));
    expect(mapReference).toHaveBeenCalledWith('night', bootstrapEnvelope.data.contentVersions.maps.night, expect.any(AbortSignal));
  });
});

describe('complete device-held active trip', () => {
  test('renders every core claim with its own scope and time plus verified-only modules', () => {
    render(<ActiveTripCard trip={activeTrip()} offline onSetCursor={() => undefined} onClear={() => undefined} />);

    expect(screen.getByRole('heading', { name: '125 St to Canal St' })).toBeTruthy();
    expect(screen.getByText('Reference itinerary')).toBeTruthy();
    expect(screen.getByText('Typical weekday')).toBeTruthy();
    expect(screen.getByText('Service date August 5, 2026')).toBeTruthy();
    expect(screen.getByText('Current schedule')).toBeTruthy();
    expect(screen.getByText('Scheduled 8:15 AM')).toBeTruthy();
    expect(screen.getByText('Weekday service changes to late-night service after midnight.')).toBeTruthy();

    expect(screen.getByText('A toward Inwood-207 St')).toBeTruthy();
    expect(screen.getByText('C toward Euclid Av')).toBeTruthy();
    expect(screen.getByText('Transfer at 59 St')).toBeTruthy();
    expect(screen.getByText('Follow signs for downtown C trains.')).toBeTruthy();

    const service = screen.getByRole('region', { name: 'Historical service context' });
    expect(service.textContent).toContain('A service was changed on the first leg.');
    expect(service.textContent).toContain('Last checked 7:58 AM');
    const equipment = screen.getByRole('region', { name: 'Historical equipment context' });
    expect(equipment.textContent).toContain('EL-101');
    expect(equipment.textContent).toContain('Unknown offline');
    expect(equipment.textContent).toContain('Last checked 7:57 AM');

    expect(screen.getByRole('heading', { name: 'Exit guidance' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Platform position' })).toBeTruthy();
    expect(screen.getByText('Middle of the platform')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Structurally step-free path' })).toBeTruthy();
    expect(screen.getByText('Structurally step-free; live elevator status unavailable')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Previously verified contingency' })).toBeTruthy();
  });

  test('manual forward and backward correction changes only the rider cursor', () => {
    const original = activeTrip();
    const evidenceBefore = evidenceWithoutCursor(original);
    render(<ActiveTripHarness initial={original} />);

    expect(within(screen.getByTestId('trip-point-point-125')).getByText('Current')).toBeTruthy();
    fireEvent.click(within(screen.getByTestId('trip-point-point-59')).getByRole('button', { name: "I'm at this stop: 59 St" }));
    expect(within(screen.getByTestId('trip-point-point-59')).getByText('Current')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: "I'm at this stop: 125 St" }));
    expect(within(screen.getByTestId('trip-point-point-125')).getByText('Current')).toBeTruthy();
    expect(screen.getByTestId('evidence-snapshot').textContent).toBe(evidenceBefore);
  });

  test('omits unsupported conditional modules cleanly without placeholders', () => {
    const complete = activeTrip();
    const trip: ActiveTripRecord = {
      id: complete.id,
      capturedAt: complete.capturedAt,
      origin: complete.origin,
      destination: complete.destination,
      accessibleRouteOnly: false,
      legs: complete.legs,
      transfers: complete.transfers,
      serviceClaims: complete.serviceClaims,
      equipmentClaims: complete.equipmentClaims,
      cursor: complete.cursor,
      validity: complete.validity,
    };
    render(<ActiveTripCard trip={trip} offline onSetCursor={() => undefined} />);

    expect(screen.queryByRole('heading', { name: 'Exit guidance' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Platform position' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Structurally step-free path' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Previously verified contingency' })).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  test('station boards expose an explicit exact-scope save action', () => {
    const onSave = vi.fn();
    render(
      <StationView
        station={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
        board={boardEnvelope()}
        phase="ready"
        filters={{ routeIds: ['A'], direction: 'northbound' }}
        onFiltersChange={() => undefined}
        onRefresh={() => undefined}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save this station' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

function ActiveTripHarness({ initial }: { readonly initial: ActiveTripRecord }) {
  const [trip, setTrip] = useState(initial);
  return (
    <>
      <ActiveTripCard
        trip={trip}
        offline
        onSetCursor={(pointId) => setTrip((current) => ({ ...current, cursor: { pointId } }))}
      />
      <output data-testid="evidence-snapshot">{evidenceWithoutCursor(trip)}</output>
    </>
  );
}

function evidenceWithoutCursor(trip: ActiveTripRecord): string {
  const { cursor: _cursor, ...evidence } = trip;
  return JSON.stringify(evidence);
}

function activeTrip(): ActiveTripRecord {
  return {
    id: 'trip-a-c',
    capturedAt: '2026-08-05T12:00:00.000Z',
    origin: { name: '125 St', complexId: 'A12', constituentId: 'A12' },
    destination: { name: 'Canal St', complexId: 'A32', constituentId: 'A32' },
    accessibleRouteOnly: true,
    legs: [
      {
        id: 'leg-a',
        route: { id: 'A', label: 'A', spokenIdentity: 'A train', shape: 'circle' },
        boundDirection: 'southbound',
        actualDestination: 'Inwood-207 St',
        points: [
          { id: 'point-125', kind: 'stop', stationName: '125 St', complexId: 'A12', constituentId: 'A12', instruction: 'Board the A train.' },
          { id: 'point-59', kind: 'decision', stationName: '59 St', complexId: 'A24', constituentId: 'A24', instruction: 'Leave the A train and follow transfer signs.' },
        ],
      },
      {
        id: 'leg-c',
        route: { id: 'C', label: 'C', spokenIdentity: 'C train', shape: 'circle' },
        boundDirection: 'southbound',
        actualDestination: 'Euclid Av',
        points: [
          { id: 'point-59-c', kind: 'decision', stationName: '59 St', complexId: 'A24', constituentId: 'A24', instruction: 'Board the C train.' },
          { id: 'point-canal', kind: 'stop', stationName: 'Canal St', complexId: 'A32', constituentId: 'A32', instruction: 'Leave the train.' },
        ],
      },
    ],
    transfers: [{
      id: 'transfer-59', atPointId: 'point-59', incomingLegId: 'leg-a', outgoingLegId: 'leg-c',
      incomingDirection: 'southbound', incomingDestination: 'Inwood-207 St',
      outgoingDirection: 'southbound', outgoingDestination: 'Euclid Av',
      steps: ['Follow signs for downtown C trains.'], connectionState: 'Previously verified passage.',
    }],
    serviceClaims: [{
      id: 'service-a', scope: { kind: 'leg', legId: 'leg-a', routeId: 'A', direction: 'southbound' },
      state: 'changed', consequence: 'A service was changed on the first leg.', lastCheckedAt: '2026-08-05T11:58:00.000Z',
    }],
    equipmentClaims: [{
      id: 'equipment-el-101', equipmentId: 'EL-101', connectionId: 'connection-59', pathId: 'path-a-c',
      observation: 'working', lastCheckedAt: '2026-08-05T11:57:00.000Z',
    }],
    cursor: { pointId: 'point-125' },
    validity: {
      result: 'reference-itinerary', serviceDate: '2026-08-05', pattern: 'typical-weekday',
      schedule: {
        kind: 'current', editionId: 'edition-1', anchorKind: 'published',
        anchorAt: '2026-08-05T11:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
        effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 3_600,
        departures: [{ legId: 'leg-a', pointId: 'point-125', clockTime: '08:15', evidence: 'scheduled', timeZone: 'America/New_York' }],
      },
      warnings: [{
        id: 'warning-a', scope: { kind: 'route', routeId: 'A' }, message: 'Stored context may differ from service now.',
        ownerRecordId: 'warning-owner-a', lastCheckedAt: '2026-08-05T11:56:00.000Z',
      }],
      vetoes: [],
      patternBoundary: {
        explanation: 'Weekday service changes to late-night service after midnight.',
        ownerRecordId: 'pattern-owner', verifiedAt: '2026-08-05T11:55:00.000Z',
      },
    },
    exitGuidance: {
      ownerRecordId: 'exit-owner', exitId: 'exit-canal-north', legId: 'leg-c', purpose: 'Closest verified exit for Canal Street.',
      verificationContext: 'Reviewed station-exit record.', verifiedAt: '2026-08-05T11:54:00.000Z', limitations: ['Street access may change.'],
    },
    platformGuidance: {
      ownerRecordId: 'platform-owner', legId: 'leg-a', routeId: 'A', direction: 'southbound', orientation: 'forward',
      zone: 'middle', objective: 'Fastest verified transfer at 59 St.', certainty: 'high', verifiedAt: '2026-08-05T11:53:00.000Z',
    },
    accessiblePath: {
      ownerRecordId: 'path-owner', verificationContext: 'Complete reviewed structural chain.', verifiedAt: '2026-08-05T11:52:00.000Z',
      connections: [{ id: 'path-connection-1', from: '125 St entrance', to: 'A platform', movement: 'elevator', equipmentId: 'EL-101', restrictions: [] }],
    },
    contingencies: [{
      id: 'contingency-a', ownerRecordId: 'contingency-owner', trigger: 'A service becomes unavailable.', affectedLegId: 'leg-a',
      routeId: 'A', direction: 'southbound', stopPointIds: ['point-125'], transferIds: ['transfer-59'],
      actions: ['Remain at 125 St and review verified alternatives.'], accessibilityResult: 'complete-structural-path',
      accessiblePathOwnerRecordId: 'path-owner', verificationContext: 'Previously reviewed contingency.',
      lastCheckedAt: '2026-08-05T11:51:00.000Z', limitations: ['Not a current recommendation.'],
    }],
  };
}

function mapEnvelope(theme: 'day' | 'night', contentVersion: string) {
  return {
    apiVersion: 'v1' as const,
    schemaVersion: '2026-08-04' as const,
    contentVersion,
    demonstrationLabel: 'Demonstration data — not live' as const,
    data: {
      theme,
      contentVersion,
      attribution: 'Unofficial app-owned subway reference geometry',
      features: [{
        id: `line-${theme}`,
        kind: 'line' as const,
        routeIds: ['A'],
        geometry: { type: 'LineString' as const, coordinates: [[-74, 40.7], [-73.9, 40.8]] as const },
      }],
    },
  };
}
