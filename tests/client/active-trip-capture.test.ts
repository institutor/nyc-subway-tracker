import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { captureActiveTrip } from '../../src/client/App';
import type { CatalogComplexDto, JourneyEnvelopeDto, JourneyItineraryDto } from '../../src/client/api/client';
import { ActiveTripCard } from '../../src/client/components/ActiveTripCard';

afterEach(() => document.body.replaceChildren());

const catalog: readonly CatalogComplexDto[] = [
  { id: 'A12', name: '125 St', routeIds: ['A'], constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N'] }] },
  { id: 'A15', name: '145 St', routeIds: ['A'], constituents: [{ id: 'A15', name: '145 St', directionalStopIds: ['A15N'] }] },
];

describe('response-owned active-trip translation', () => {
  test('preserves the exact schedule and explicit empty owner-claim arrays without placeholders', () => {
    const response = journeyResponse();
    const itinerary = (response.data as any).itineraries[0] as JourneyItineraryDto;

    const trip = captureActiveTrip(itinerary, response, catalog);

    expect(trip).toMatchObject({
      capturedAt: '2026-08-05T12:00:00.000Z',
      captureContext: {
        kind: 'response-owned', itineraryId: 'itinerary-a', requestMode: 'online-current', timing: 'timed',
        disclosure: 'Demonstration data \u2014 not live',
      },
      serviceClaims: [], equipmentClaims: [],
      validity: {
        result: 'current-itinerary', serviceDate: '2026-08-05', pattern: 'actual-now',
        schedule: {
          kind: 'current', editionId: 'supplemented-gtfs:edition-7', anchorKind: 'published',
          anchorAt: '2026-08-05T11:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
          effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 3_600,
          departures: [{ legId: 'leg-1', pointId: 'point-1-1', clockTime: '08:15', evidence: 'scheduled', timeZone: 'America/New_York' }],
        },
        warnings: [], vetoes: [],
      },
    });
    expect(JSON.stringify(trip)).not.toMatch(/service-capture|not-supplied|capture-limitation/);
    if (!trip) throw new Error('Expected exact trip capture');
    render(createElement(ActiveTripCard, { trip, offline: false, onSetCursor: () => undefined }));
    expect(screen.getByText('Current itinerary')).toBeTruthy();
    expect(screen.getByText('Demonstration data \u2014 not live')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Service context' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Equipment context' })).toBeNull();
  });

  test('refuses incomplete and timed-without-schedule capture evidence', () => {
    const complete = journeyResponse();
    const itinerary = (complete.data as any).itineraries[0] as JourneyItineraryDto;
    const missing = structuredClone(complete) as any;
    delete missing.data.itineraries[0].capture;
    const untimedSchedule = structuredClone(complete) as any;
    untimedSchedule.data.itineraries[0].capture.validity.schedule = { kind: 'none' };

    expect(captureActiveTrip(itinerary, missing as JourneyEnvelopeDto, catalog)).toBeUndefined();
    expect(captureActiveTrip(itinerary, untimedSchedule as JourneyEnvelopeDto, catalog)).toBeUndefined();
  });

  test('does not render disclosure copy when the owning public response had none', () => {
    const response = structuredClone(journeyResponse()) as any;
    delete response.demonstrationLabel;
    delete response.data.itineraries[0].capture.disclosure;
    const trip = captureActiveTrip(response.data.itineraries[0], response, catalog);
    if (!trip) throw new Error('Expected exact public trip capture');

    render(createElement(ActiveTripCard, { trip, offline: false, onSetCursor: () => undefined }));

    expect(screen.getByText('Current itinerary')).toBeTruthy();
    expect(screen.queryByText('Demonstration data \u2014 not live')).toBeNull();
  });

  test('retains an exact accessible-only constraint and its owned equipment evidence offline', () => {
    const response = structuredClone(journeyResponse()) as any;
    response.data.scope.accessibleRouteOnly = true;
    response.data.itineraries[0].capture.scope.accessibleRouteOnly = true;
    response.data.itineraries[0].capture.equipmentClaims = [{
      id: 'equipment-claim-el-a12-01',
      equipmentId: 'EL-A12-01',
      connectionId: 'connection-a12-platform',
      pathId: 'path-a12-r20-accessible',
      observation: 'working',
      lastCheckedAt: '2026-08-05T11:58:00.000Z',
    }];
    const itinerary = response.data.itineraries[0] as JourneyItineraryDto;

    const trip = captureActiveTrip(itinerary, response as JourneyEnvelopeDto, catalog);

    expect(trip).toMatchObject({
      accessibleRouteOnly: true,
      equipmentClaims: [{
        equipmentId: 'EL-A12-01', pathId: 'path-a12-r20-accessible', observation: 'working',
      }],
    });
    if (!trip) throw new Error('Expected an accessible-only active trip');
    render(createElement(ActiveTripCard, { trip, offline: true, onSetCursor: () => undefined }));
    expect(screen.getByText('Accessible Route Only · On', { exact: true })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Current elevator status cannot be verified offline');
    expect(screen.getByText(/EL-A12-01/).closest('article')?.textContent).toContain('Unknown offline');
  });
});

function journeyResponse(): JourneyEnvelopeDto {
  return {
    apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'response:journey-a',
    decidedAt: '2026-08-05T12:00:00.000Z', serverTime: '2026-08-05T12:00:00.000Z',
    runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
    gates: {}, demonstrationLabel: 'Demonstration data \u2014 not live', sourceHealth: [], provenance: [],
    data: {
      kind: 'planned',
      scope: { mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false },
      itineraries: [{
        id: 'itinerary-a', transferIds: [], transferInstructions: [], transfers: 0,
        validity: 'valid', accessibility: 'eligible', risk: 'clear', timing: 'timed', arrivalSeconds: 180,
        legs: [{
          patternId: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'northbound', actualDestination: 'Inwood-207 St',
          fromOccurrenceId: 'occ-a12', toOccurrenceId: 'occ-a15', orderedOccurrenceIds: ['occ-a12', 'occ-a15'],
          fromStationId: 'A12', toStationId: 'A15', orderedStationIds: ['A12', 'A15'],
        }],
        capture: {
          itineraryId: 'itinerary-a', requestMode: 'online-current',
          scope: { mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false },
          serviceDate: '2026-08-05', timing: 'timed', capturedAt: '2026-08-05T12:00:00.000Z',
          disclosure: 'Demonstration data \u2014 not live',
          validity: {
            result: 'current-itinerary', pattern: 'actual-now',
            schedule: {
              kind: 'current', editionId: 'supplemented-gtfs:edition-7', anchorKind: 'published',
              anchorAt: '2026-08-05T11:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
              effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 3_600,
              departures: [{
                patternId: 'pattern-a', occurrenceId: 'occ-a12', clockTime: '08:15',
                evidence: 'scheduled', timeZone: 'America/New_York',
              }],
            },
            warnings: [], vetoes: [],
          },
          serviceClaims: [], equipmentClaims: [],
        },
      }],
    },
  } as unknown as JourneyEnvelopeDto;
}
