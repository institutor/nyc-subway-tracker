import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { App, selectCurrentValidationDecisionTime } from '../../src/client/App';
import type { BootstrapEnvelopeDto } from '../../src/client/api/client';
import {
  createBrowserActiveTripStore,
  type ActiveTripRecord,
} from '../../src/client/storage/active-trip-store';
import { createBrowserSavedStore } from '../../src/client/storage/browser-store';
import { encodeCanonicalStringTuple } from '../../src/shared/domain/canonical';
import {
  ControlledGeolocation,
  MemoryStorage,
  bootstrapEnvelope,
  createClientApi,
  nearbyEnvelope,
} from '../helpers/client-fixtures';

afterEach(() => document.body.replaceChildren());

describe('real App accessibility ownership', () => {
  test('uses only the current exact committed validation bootstrap to compose dynamic rider evidence', () => {
    const committed = {
      ...bootstrapEnvelope,
      responseIdentity: 'response:committed-validation-bootstrap',
      decisionSnapshotIdentity: 'validation-snapshot-2026-08-04-v2',
      data: { ...bootstrapEnvelope.data, contentVersions: {
        stationCatalog: 'validation-catalog-2026-08-04-v2',
        maps: { day: 'validation-map-day-2026-08-04-v2', night: 'validation-map-night-2026-08-04-v2' },
        journeyGraph: 'journey-graph-ca6e27786a0488d3dbdfe272ba834c89fec49413d22ae63407e23f4cf883831d',
      } },
    } as BootstrapEnvelopeDto;
    expect(selectCurrentValidationDecisionTime(committed)).toBe(committed.decidedAt);
    expect(selectCurrentValidationDecisionTime(bootstrapEnvelope)).toBeUndefined();

    const liveBootstrap: BootstrapEnvelopeDto = {
      ...committed,
      runtime: { mode: 'live', surface: 'public', availability: 'locked' },
    };
    expect(selectCurrentValidationDecisionTime(liveBootstrap)).toBeUndefined();
    expect(selectCurrentValidationDecisionTime(undefined)).toBeUndefined();
    expect(selectCurrentValidationDecisionTime({ ...committed, demonstrationLabel: undefined })).toBeUndefined();
    expect(selectCurrentValidationDecisionTime({
      ...committed,
      runtime: { ...committed.runtime, availability: 'locked' },
    })).toBeUndefined();
    expect(selectCurrentValidationDecisionTime({
      ...committed,
      data: { ...committed.data, contentVersions: { ...committed.data.contentVersions, stationCatalog: 'validation-catalog-other' } },
    })).toBeUndefined();
    expect(selectCurrentValidationDecisionTime({ ...committed, decisionSnapshotIdentity: 'validation-snapshot-other' } as BootstrapEnvelopeDto)).toBeUndefined();
  });

  test('lets a rider change Accessible Route Only before Nearby ranking and posts the constraint on the acquired fix', async () => {
    const nearby = vi.fn(async () => nearbyEnvelope);
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi({ nearby })} geolocation={geolocation} storage={new MemoryStorage()} />);

    const toggle = await screen.findByRole('checkbox', { name: 'Accessible Route Only' });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 18, { latitude: 40.811, longitude: -73.952 }));

    await waitFor(() => expect(nearby).toHaveBeenCalledWith({
      coordinate: { latitude: 40.811, longitude: -73.952 }, accuracyMeters: 18,
    }, true, expect.any(AbortSignal)));
  });

  test.each([
    ['live/public restart', () => ({
      ...committedBootstrap(), demonstrationLabel: undefined, decisionSnapshotIdentity: undefined,
      runtime: { mode: 'live' as const, surface: 'public' as const, availability: 'available' as const },
    })],
    ['validation restart with an exact parsed receipt', () => committedBootstrap()],
  ])('does not regenerate branded evidence for saved validation IDs after a %s', async (scenario, bootstrap) => {
    const storage = new MemoryStorage();
    const saved = validationTripFixture();
    expect(createBrowserActiveTripStore(storage).capture(saved)).toMatchObject({ kind: 'saved' });
    render(<App
      api={createClientApi({ bootstrap: async () => bootstrap() as BootstrapEnvelopeDto })}
      geolocation={new ControlledGeolocation()}
      storage={storage}
    />);

    const open = await screen.findByRole('button', { name: 'Open active trip to Canal St' });
    fireEvent.click(open);
    const active = screen.getByRole('region', { name: 'Device-held active trip' });
    expect(active).toHaveTextContent('Platform A34S');
    expect(active).toHaveTextContent('Equipment EL-A34-01');
    expect(active.querySelector('[aria-label="Step-free path"]')).toBeNull();
    expect(active.querySelector('[aria-label="Platform guidance"]')).toBeNull();
    expect(active).not.toHaveTextContent('Complete path verified');
    expect(active).not.toHaveTextContent('No official outage reported');
    expect(active).toHaveTextContent('Device-held historical guidance — current status unverified');
    expect(active).toHaveTextContent('Historical equipment — current status unverified');
  });

  test('withholds branded evidence after a joint receipt and equipment edit with a recomputed public tuple', async () => {
    const storage = new MemoryStorage();
    const saved = structuredClone(validationTripFixture());
    if (saved.captureContext.kind !== 'response-owned' || !saved.captureContext.validationEvidenceReceipt) {
      throw new Error('Expected response-owned validation fixture');
    }
    const forgedJourneyDecision = 'response:jointly-edited-journey';
    const receipt = saved.captureContext.validationEvidenceReceipt as any;
    receipt.journeyDecisionIdentity = forgedJourneyDecision;
    receipt.capturePackageIdentity = encodeCanonicalStringTuple([
      'validation-capture-package-v1', forgedJourneyDecision, saved.captureContext.itineraryId,
      saved.capturedAt, saved.origin.constituentId, saved.destination.constituentId,
      saved.captureContext.requestMode,
    ]);
    (saved as any).equipmentClaims = [{
      id: 'reviewer-added-equipment-claim', equipmentId: 'EL-A34-01',
      connectionId: 'connection-a34-platform', pathId: 'path-a15-a34-accessible',
      observation: 'working', lastCheckedAt: '2026-08-04T11:59:59.000Z',
    }];
    expect(createBrowserActiveTripStore(storage).capture(saved)).toMatchObject({ kind: 'saved' });

    render(<App
      api={createClientApi({ bootstrap: async () => committedBootstrap() })}
      geolocation={new ControlledGeolocation()}
      storage={storage}
    />);
    await screen.findByText('Validation view');
    fireEvent.click(screen.getByRole('button', { name: 'Open active trip to Canal St' }));

    const active = screen.getByRole('region', { name: 'Device-held active trip' });
    expect(active.querySelector('[aria-label="Step-free path"]')).toBeNull();
    expect(active.querySelector('[aria-label="Platform guidance"]')).toBeNull();
    expect(active).not.toHaveTextContent('Complete path verified');
    expect(active).not.toHaveTextContent('No official outage reported');
    expect(active).toHaveTextContent('Device-held historical guidance — current status unverified');
  });

  test('does not restore response-bound branding after an offline to online transition without recapture', async () => {
    const storage = new MemoryStorage();
    expect(createBrowserSavedStore(storage).upsert({
      id: 'saved-a15', complexId: 'A15', constituentId: 'A15', routeFilters: [],
      accessibleRouteOnly: true, state: 'active',
    })).toMatchObject({ kind: 'saved' });
    const stableBootstrap = committedBootstrap();
    const api = createClientApi({
      bootstrap: async () => stableBootstrap,
      catalog: async () => validationCatalog(),
      searchStations: async (query) => ({
        apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'validation-catalog-2026-08-04-v2',
        query, results: [validationCatalog().data.complexes[1]!],
      }),
      planJourney: async () => validationJourneyResponse(),
    });
    const app = (connectivity: 'online' | 'offline') => <App
      api={api}
      geolocation={new ControlledGeolocation()}
      storage={storage}
      connectivity={connectivity}
      initialSurface="map"
    />;
    const view = render(app('online'));

    const toggle = await screen.findByRole('checkbox', { name: 'Accessible Route Only' });
    fireEvent.click(toggle);
    const search = screen.getByRole('combobox', { name: 'Destination station' });
    fireEvent.change(search, { target: { value: 'Canal' } });
    fireEvent.click(await screen.findByRole('option', { name: /Canal St/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Plan current trip' }));
    const itinerary = await screen.findByRole('article', { name: 'Primary direct itinerary' });
    expect(itinerary.querySelector('[aria-label="Step-free path"]')).not.toBeNull();
    fireEvent.click(within(itinerary).getByRole('button', { name: 'Use this trip' }));
    const active = screen.getByRole('region', { name: 'Device-held active trip' });
    expect(active.querySelector('[aria-label="Step-free path"]')).not.toBeNull();

    view.rerender(app('offline'));
    await waitFor(() => expect(active.querySelector('[aria-label="Step-free path"]')).toBeNull());
    view.rerender(app('online'));
    await screen.findByRole('combobox', { name: 'Destination station' });

    expect(active.querySelector('[aria-label="Step-free path"]')).toBeNull();
    expect(active.querySelector('[aria-label="Platform guidance"]')).toBeNull();
    expect(active).not.toHaveTextContent('Complete path verified');
    expect(active).toHaveTextContent('Device-held historical guidance — current status unverified');
  });
});

function committedBootstrap(): BootstrapEnvelopeDto {
  return {
    ...bootstrapEnvelope,
    responseIdentity: 'response:committed-validation-bootstrap',
    decisionSnapshotIdentity: 'validation-snapshot-2026-08-04-v2',
    data: { ...bootstrapEnvelope.data, contentVersions: {
      stationCatalog: 'validation-catalog-2026-08-04-v2',
      maps: { day: 'validation-map-day-2026-08-04-v2', night: 'validation-map-night-2026-08-04-v2' },
      journeyGraph: 'journey-graph-ca6e27786a0488d3dbdfe272ba834c89fec49413d22ae63407e23f4cf883831d',
    } },
  };
}

function validationTripFixture(): ActiveTripRecord {
  const capturedAt = '2026-08-04T12:00:00.000Z';
  const journeyDecisionIdentity = 'response:validation-journey';
  const itineraryId = 'validation-direct-itinerary';
  return {
    id: 'validation-trip', capturedAt,
    captureContext: {
      kind: 'response-owned', itineraryId, requestMode: 'online-current', timing: 'timed',
      disclosure: 'Demonstration data — not live',
      validationEvidenceReceipt: {
        bootstrapDecisionIdentity: 'response:committed-validation-bootstrap', journeyDecisionIdentity,
        decisionSnapshotIdentity: 'validation-snapshot-2026-08-04-v2',
        stationCatalogVersion: 'validation-catalog-2026-08-04-v2',
        journeyGraphVersion: 'journey-graph-ca6e27786a0488d3dbdfe272ba834c89fec49413d22ae63407e23f4cf883831d',
        mapDayVersion: 'validation-map-day-2026-08-04-v2', mapNightVersion: 'validation-map-night-2026-08-04-v2',
        canonicalItineraryIdentity: itineraryId,
        capturePackageIdentity: encodeCanonicalStringTuple([
          'validation-capture-package-v1', journeyDecisionIdentity, itineraryId, capturedAt, 'A15', 'A34', 'online-current',
        ]),
        pathId: 'path-a15-a34-accessible', originStationId: 'A15', originPlatformId: 'A15S',
        destinationStationId: 'A34', destinationPlatformId: 'A34S',
        routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
      },
    },
    origin: { name: '125 St', complexId: 'A15', constituentId: 'A15' },
    destination: { name: 'Canal St', complexId: 'A34', constituentId: 'A34' },
    accessibleRouteOnly: true,
    legs: [{ id: 'validation-leg-1', route: { id: 'A', label: 'A', spokenIdentity: 'A train', shape: 'circle' },
      boundDirection: 'southbound', actualDestination: 'Far Rockaway', points: [
        { id: 'point-a15', kind: 'stop', stationName: '125 St', complexId: 'A15', constituentId: 'A15', instruction: 'Board the A train.' },
        { id: 'point-a34', kind: 'stop', stationName: 'Canal St', complexId: 'A34', constituentId: 'A34', instruction: 'Leave the train.' },
      ] }],
    transfers: [], serviceClaims: [],
    equipmentClaims: [{ id: 'claim-a34', equipmentId: 'EL-A34-01', connectionId: 'connection-a34-platform',
      pathId: 'path-a15-a34-accessible', observation: 'working', lastCheckedAt: '2026-08-04T11:59:59.000Z' }],
    cursor: { pointId: 'point-a15' },
    validity: { result: 'current-itinerary', serviceDate: '2026-08-04', pattern: 'actual-now',
      schedule: { kind: 'current', editionId: 'validation-edition', anchorKind: 'published',
        anchorAt: '2026-08-04T11:00:00.000Z', lastRetrievedAt: '2026-08-04T11:59:59.000Z',
        effectiveFrom: '2026-08-04', effectiveUntil: '2026-08-04', currencyAgeSeconds: 3_600,
        departures: [{ legId: 'validation-leg-1', pointId: 'point-a15', clockTime: '08:15', evidence: 'scheduled', timeZone: 'America/New_York' }] },
      warnings: [], vetoes: [] },
    exitGuidance: { ownerRecordId: 'validation-guidance-a34-v1', exitId: 'EXIT-A34-VALIDATION', legId: 'validation-leg-1',
      purpose: 'Nearest verified elevator at Canal St', verificationContext: 'At Canal St, use the middle platform zone.',
      verifiedAt: capturedAt, limitations: ['ordinary pattern only'], destinationScope: {
        stationName: 'Canal St', stationComplexId: 'A34', constituentStationId: 'A34', platformId: 'A34S', equipmentId: 'EL-A34-01',
      } },
  };
}

function validationCatalog() {
  return {
    apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'validation-catalog-2026-08-04-v2',
    data: { complexes: [
      { id: 'A15', name: '125 St', routeIds: ['A', 'B', 'C', 'D'],
        constituents: [{ id: 'A15', name: '125 St', directionalStopIds: ['A15N', 'A15S'] }] },
      { id: 'A34', name: 'Canal St', routeIds: ['A', 'C', 'E'],
        constituents: [{ id: 'A34', name: 'Canal St', directionalStopIds: ['A34N', 'A34S'] }] },
    ] },
  } as const;
}

function validationJourneyResponse() {
  return {
    apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'response:validation-journey-v2',
    decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
    decisionSnapshotIdentity: 'validation-snapshot-2026-08-04-v2',
    runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
    gates: {}, demonstrationLabel: 'Demonstration data — not live', sourceHealth: [], provenance: [],
    data: {
      kind: 'planned',
      scope: { mode: 'online-current', originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly: true },
      itineraries: [{
        id: 'validation-direct-itinerary', transferIds: [], transferInstructions: [], transfers: 0,
        validity: 'valid', accessibility: 'eligible', risk: 'clear', timing: 'timed', arrivalSeconds: 900,
        legs: [{
          patternId: 'pattern-direct', routeId: 'A', routeLabel: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
          fromOccurrenceId: 'occ-a15-direct', toOccurrenceId: 'occ-a34-direct',
          orderedOccurrenceIds: ['occ-a15-direct', 'occ-a34-direct'],
          fromStationId: 'A15', toStationId: 'A34', orderedStationIds: ['A15', 'A34'],
        }],
        capture: {
          itineraryId: 'validation-direct-itinerary', requestMode: 'online-current',
          scope: { mode: 'online-current', originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly: true },
          serviceDate: '2026-08-04', timing: 'timed', capturedAt: '2026-08-04T12:00:00.000Z',
          disclosure: 'Demonstration data — not live',
          validity: {
            result: 'current-itinerary', pattern: 'actual-now',
            schedule: {
              kind: 'current', editionId: 'validation-supplemented-edition-v1', anchorKind: 'published',
              anchorAt: '2026-08-04T11:00:00.000Z', lastRetrievedAt: '2026-08-04T11:59:59.000Z',
              effectiveFrom: '2026-08-04', effectiveUntil: '2026-08-04', currencyAgeSeconds: 3_600,
              departures: [{ patternId: 'pattern-direct', occurrenceId: 'occ-a15-direct', clockTime: '08:15',
                evidence: 'scheduled', timeZone: 'America/New_York' }],
            },
            warnings: [], vetoes: [],
          },
          serviceClaims: [],
          equipmentClaims: [{
            id: 'validation-equipment-claim-el-a34-01', equipmentId: 'EL-A34-01',
            connectionId: 'connection-a34-platform', pathId: 'path-a15-a34-accessible',
            observation: 'working', lastCheckedAt: '2026-08-04T11:59:59.000Z',
          }],
        },
      }],
    },
  } as const;
}
