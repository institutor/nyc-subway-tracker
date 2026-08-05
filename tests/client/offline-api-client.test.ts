import { describe, expect, test, vi } from 'vitest';

import { createTransitApiClient } from '../../src/client/api/client';

const gate = { exposed: false, reasonCode: 'NEARBY_GATE_0_NOT_PASSED', decision: 'NO-GO — GATE 0 NOT PASSED' } as const;
const dynamic = {
  apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'response:offline-tools',
  decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
  runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
  gates: { 'nearby-offline': gate }, gateDecision: gate,
  demonstrationLabel: 'Demonstration data — not live', sourceHealth: [], provenance: [],
} as const;

const complex = {
  id: 'A12', name: '125 St', routeIds: ['A'],
  constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N', 'A12S'] }],
} as const;

describe('offline tools API boundary', () => {
  test('searches the exact server catalog with a bounded abortable query and sends no location', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => json({
      apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7',
      query: '125 st', results: [complex],
    }));
    const controller = new AbortController();
    const client = createTransitApiClient(fetcher);

    const result = await client.searchStations(' 125 st ', 8, controller.signal);

    expect(result.results).toEqual([complex]);
    expect(fetcher).toHaveBeenCalledWith('/api/v1/stations/search?q=125+st&limit=8', { signal: controller.signal });
    expect(JSON.stringify(fetcher.mock.calls)).not.toMatch(/latitude|longitude|coordinate|location/i);
  });

  test('rejects search results that do not echo the exact normalized query', async () => {
    const client = createTransitApiClient(async () => json({
      apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'catalog-7',
      query: 'another rider', results: [complex],
    }));

    await expect(client.searchStations('125 st')).rejects.toThrow('Transit information is unavailable.');
  });

  test('loads and validates an immutable app-owned vector reference without accepting extra geometry fields', async () => {
    const reference = {
      apiVersion: 'v1', schemaVersion: '2026-08-04', contentVersion: 'map-day-7',
      demonstrationLabel: 'Demonstration data — not live',
      data: {
        theme: 'day', contentVersion: 'map-day-7', attribution: 'Unofficial app-owned subway reference geometry',
        features: [{ id: 'line-a', kind: 'line', routeIds: ['A'], geometry: { type: 'LineString', coordinates: [[-74, 40.7], [-73.9, 40.8]] } }],
      },
    } as const;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => json(reference));
    const client = createTransitApiClient(fetcher);

    const result = await client.mapReference('day', 'map-day-7');

    expect(result.data?.features[0].geometry).toEqual({ type: 'LineString', coordinates: [[-74, 40.7], [-73.9, 40.8]] });
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/maps/day/reference/map-day-7');

    const forged = structuredClone(reference) as any;
    (forged.data.features[0].geometry as Record<string, unknown>).currentService = true;
    await expect(createTransitApiClient(async () => json(forged)).mapReference('day', 'map-day-7'))
      .rejects.toThrow('Transit information is unavailable.');
  });

  test('keeps dynamic Actual-now overlay separate and validates its exact service epoch', async () => {
    const client = createTransitApiClient(async () => json({
      ...dynamic,
      data: {
        theme: 'day', serviceEpoch: 'epoch-7',
        segments: [{ id: 'segment-a', routeIds: ['A'], state: 'affected', alertIds: ['alert-a'] }],
      },
    }, { 'x-subway-cache-state': 'historical' }));

    const result = await client.mapOverlay('day');

    expect(result.data).toEqual({
      theme: 'day', serviceEpoch: 'epoch-7',
      segments: [{ id: 'segment-a', routeIds: ['A'], state: 'affected', alertIds: ['alert-a'] }],
    });
    expect(result.cacheState).toBe('historical');
  });

  test('posts a coordinate-free owned journey request and accepts exact ordered station structure', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => json({
      ...dynamic,
      data: {
        kind: 'planned', label: 'Reference itinerary',
        scope: { mode: 'offline-reference', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false },
        itineraries: [{
          id: 'journey-a', transferIds: [], transfers: 0, validity: 'valid', accessibility: 'eligible',
          risk: 'clear', timing: 'timed', arrivalSeconds: 600,
          legs: [{
            patternId: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'northbound',
            actualDestination: 'Inwood–207 St', fromOccurrenceId: 'occ-a12', toOccurrenceId: 'occ-a15',
            orderedOccurrenceIds: ['occ-a12', 'occ-a15'], fromStationId: 'A12', toStationId: 'A15',
            orderedStationIds: ['A12', 'A15'],
          }],
          transferInstructions: [],
        }],
      },
    }));
    const client = createTransitApiClient(fetcher);
    const controller = new AbortController();

    const result = await client.planJourney({
      mode: 'offline-reference', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false,
    }, controller.signal);

    expect(result.data?.kind).toBe('planned');
    if (result.data?.kind !== 'planned') throw new Error('Expected a planned response');
    expect(result.data.itineraries[0].legs[0].orderedStationIds).toEqual(['A12', 'A15']);
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/journeys');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'POST', signal: controller.signal });
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      mode: 'offline-reference', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false,
    });
    expect(JSON.stringify(fetcher.mock.calls)).not.toMatch(/latitude|longitude|coordinate|activeTrip|cursor/i);
  });

  test('rejects a journey response owned by another origin or with a broken ordered leg boundary', async () => {
    const response = {
      ...dynamic,
      data: {
        kind: 'planned',
        scope: { mode: 'online-current', originStationId: 'forged', destinationStationId: 'A15', accessibleRouteOnly: false },
        itineraries: [{
          id: 'journey-a', transferIds: [], transfers: 0, validity: 'valid', accessibility: 'eligible', risk: 'clear', timing: 'timed',
          legs: [{
            patternId: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'northbound', actualDestination: 'Inwood–207 St',
            fromOccurrenceId: 'occ-a12', toOccurrenceId: 'occ-a15', orderedOccurrenceIds: ['occ-a12', 'occ-a15'],
            fromStationId: 'A12', toStationId: 'A15', orderedStationIds: ['A12', 'A14'],
          }], transferInstructions: [],
        }],
      },
    };
    const client = createTransitApiClient(async () => json(response));

    await expect(client.planJourney({
      mode: 'online-current', originStationId: 'A12', destinationStationId: 'A15', accessibleRouteOnly: false,
    })).rejects.toThrow('Transit information is unavailable.');
  });
});

function json(value: unknown, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json', ...Object.fromEntries(new Headers(headers)) } });
}
