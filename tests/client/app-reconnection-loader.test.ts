import { describe, expect, test, vi } from 'vitest';

import type { JourneyEnvelopeDto } from '../../src/client/api/client';
import { createAppReconnectionStageLoader } from '../../src/client/recovery/app-reconnection-loader';
import type { ActiveTripRecord } from '../../src/client/storage/active-trip-store';
import type { PreservedReconnectionContext } from '../../src/shared/domain/reconnection';
import { boardEnvelope, createClientApi, disclosure } from '../helpers/client-fixtures';

const STARTED_AT = '2026-08-05T12:00:00.000Z';
const ACCEPTED_AT = '2026-08-05T12:00:02.000Z';

describe('App reconnection owner loader', () => {
  test('revalidates an active trip through its exact current origin-to-destination owner path', async () => {
    const planJourney = vi.fn(async () => currentJourney(false));
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ planJourney }),
      stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts: {},
      activeTrip: timedActiveTrip(),
      now: () => new Date(ACCEPTED_AT),
    });

    const result = await loader({ stage: 2, context: recoveryContext(), state: null as any }, new AbortController().signal);

    expect(planJourney).toHaveBeenCalledWith({
      mode: 'online-current',
      originStationId: 'A12',
      destinationStationId: 'A24',
      requiredFirstDirection: 'southbound',
      requiredActualDestination: 'Far Rockaway',
      accessibleRouteOnly: false,
    }, expect.any(AbortSignal));
    expect(result).toMatchObject({
      stage: 2,
      serviceChanges: {
        disposition: 'resolved',
        vetoesApplied: true,
        gate: {
          evidenceAt: '2026-08-05T12:00:01.000Z',
          acceptedAt: ACCEPTED_AT,
          scopeMembership: [{ kind: 'leg', id: 'leg-1' }],
        },
      },
      tripServicePattern: 'verified',
      invalidation: null,
    });
  });

  test('applies response-owned capture vetoes before arrivals and invalidates only the exact active leg', async () => {
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ planJourney: vi.fn(async () => currentJourney(true)) }),
      stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts: {},
      activeTrip: timedActiveTrip(),
      now: () => new Date(ACCEPTED_AT),
    });

    const result = await loader({ stage: 2, context: recoveryContext(), state: null as any }, new AbortController().signal);

    expect(result).toMatchObject({
      stage: 2,
      serviceChanges: { disposition: 'resolved', vetoesApplied: true },
      tripServicePattern: 'unusable',
      invalidation: {
        stage: 2,
        scopes: [{ kind: 'leg', id: 'leg-1' }],
        ownerGate: { scopeMembership: [{ kind: 'leg', id: 'leg-1' }] },
      },
    });
  });

  test('does not let unrelated current GTFS-RT health certify service-change resolution', async () => {
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ planJourney: vi.fn(async () => currentJourney(false, false)) }),
      stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts: {},
      activeTrip: timedActiveTrip(),
      now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 2, context: recoveryContext(), state: null as any },
      new AbortController().signal,
    )).resolves.toBeUndefined();
  });
});

function recoveryContext(): PreservedReconnectionContext {
  const contextScope = [{ kind: 'context' as const, id: 'context-1' }];
  const stationScope = [{ kind: 'station' as const, id: 'A12' }];
  const legScope = [{ kind: 'leg' as const, id: 'leg-1' }];
  const trainScope = [{ kind: 'train' as const, id: 'departure:leg-1:point-origin:08:15' }];
  const mapScope = [{ kind: 'map' as const, id: 'viewport-1' }];
  return {
    stationId: 'A12',
    direction: 'southbound',
    routeFilters: ['A'],
    accessibleRouteOnly: false,
    mapTuple: { referenceMode: 'actual', theme: 'day', contentVersion: 'map-day', viewportKey: 'viewport-1' },
    activeTripId: 'trip-current',
    manualCursor: { legIndex: 0, stopId: 'point-origin' },
    hasStoredTrainChoice: true,
    guidanceRequirements: { positioning: 'none', transfer: 'none' },
    activeSurface: 'station',
    scrollOffset: 0,
    focusTargetId: null,
    readingAnchorId: 'point-origin',
    recovery: {
      epochId: 'epoch-1',
      requestIdentity: 'request-1',
      generation: 1,
      startedAt: STARTED_AT,
      activeTripId: 'trip-current',
      contextKey: 'context-1',
      eligibleScopes: [...contextScope, ...stationScope, { kind: 'route', id: 'A' }, { kind: 'direction', id: 'southbound' }, ...legScope, ...trainScope, ...mapScope],
      ownerScopes: {
        equipment: stationScope,
        'accessible-path': stationScope,
        'service-change': legScope,
        'feed-health': stationScope,
        'train-admission': trainScope,
        arrivals: stationScope,
        positioning: legScope,
        'transfer-guidance': legScope,
        maps: mapScope,
        saved: contextScope,
      },
    },
  };
}

function timedActiveTrip(): ActiveTripRecord {
  return {
    id: 'trip-current',
    capturedAt: STARTED_AT,
    captureContext: {
      kind: 'response-owned', itineraryId: 'itinerary-original', requestMode: 'online-current', timing: 'timed', disclosure,
    },
    origin: { name: '125 St', complexId: 'A12', constituentId: 'A12' },
    destination: { name: '59 St', complexId: 'A24', constituentId: 'A24' },
    accessibleRouteOnly: false,
    legs: [{
      id: 'leg-1',
      route: { id: 'A', label: 'A', spokenIdentity: 'A train', shape: 'circle' },
      boundDirection: 'southbound',
      actualDestination: 'Far Rockaway',
      points: [
        { id: 'point-origin', kind: 'stop', stationName: '125 St', complexId: 'A12', constituentId: 'A12', instruction: 'Board the A train.' },
        { id: 'point-destination', kind: 'stop', stationName: '59 St', complexId: 'A24', constituentId: 'A24', instruction: 'Leave the train.' },
      ],
    }],
    transfers: [],
    serviceClaims: [],
    equipmentClaims: [],
    cursor: { pointId: 'point-origin' },
    validity: {
      result: 'current-itinerary', serviceDate: '2026-08-05', pattern: 'actual-now', warnings: [], vetoes: [],
      schedule: {
        kind: 'current', editionId: 'edition-original', anchorKind: 'published',
        anchorAt: '2026-08-05T11:00:00.000Z', lastRetrievedAt: '2026-08-05T11:58:00.000Z',
        effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 3_600,
        departures: [{
          legId: 'leg-1', pointId: 'point-origin', clockTime: '08:15', evidence: 'scheduled', timeZone: 'America/New_York',
        }],
      },
    },
  };
}

function currentJourney(vetoed: boolean, serviceOwnerCurrent = true): JourneyEnvelopeDto {
  const base = boardEnvelope();
  const scope = {
    mode: 'online-current' as const,
    originStationId: 'A12',
    destinationStationId: 'A24',
    accessibleRouteOnly: false,
  };
  const vetoes = vetoed ? [{
    id: 'veto-current-leg',
    scope: { kind: 'pattern' as const, patternId: 'pattern-a', routeId: 'A', direction: 'southbound' as const },
    message: 'The stored A pattern is bypassing 59 St.',
    ownerRecordId: 'alert-veto-1',
    lastCheckedAt: STARTED_AT,
  }] : [];
  return {
    apiVersion: base.apiVersion,
    schemaVersion: base.schemaVersion,
    responseIdentity: vetoed ? 'journey-vetoed' : 'journey-current',
    decidedAt: '2026-08-05T12:00:01.000Z',
    serverTime: '2026-08-05T12:00:01.000Z',
    runtime: base.runtime,
    gates: base.gates,
    demonstrationLabel: disclosure,
    sourceHealth: [
      ...(base.sourceHealth ?? []),
      ...(serviceOwnerCurrent ? [{
        source: 'alerts' as const,
        sourceId: 'mta-service-alerts',
        state: 'current' as const,
        assessedAt: '2026-08-05T12:00:01.000Z',
        lastAcceptedAt: '2026-08-05T12:00:01.000Z',
        reasonCode: 'SOURCE_CURRENT' as const,
      }] : []),
    ],
    provenance: [
      ...(base.provenance ?? []),
      ...(serviceOwnerCurrent ? [{
        source: 'alerts' as const,
        sourceId: 'mta-service-alerts',
        observedAt: '2026-08-05T12:00:00.000Z',
        retrievedAt: '2026-08-05T12:00:01.000Z',
      }] : []),
    ],
    data: {
      kind: 'planned',
      scope,
      itineraries: [{
        id: 'itinerary-current',
        legs: [{
          patternId: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'southbound',
          actualDestination: 'Far Rockaway', fromOccurrenceId: 'occ-a12', toOccurrenceId: 'occ-a24',
          orderedOccurrenceIds: ['occ-a12', 'occ-a24'], fromStationId: 'A12', toStationId: 'A24',
          orderedStationIds: ['A12', 'A24'],
        }],
        transferIds: [], transferInstructions: [], transfers: 0, validity: 'valid', accessibility: 'eligible',
        risk: vetoed ? 'blocked' : 'clear', timing: 'timed', arrivalSeconds: 600,
        capture: {
          itineraryId: 'itinerary-current', requestMode: 'online-current', scope, serviceDate: '2026-08-05',
          timing: 'timed', capturedAt: '2026-08-05T12:00:01.000Z', disclosure,
          validity: {
            result: 'current-itinerary', pattern: 'actual-now', warnings: [], vetoes,
            schedule: {
              kind: 'current', editionId: 'edition-current', anchorKind: 'published',
              anchorAt: '2026-08-05T11:30:00.000Z', lastRetrievedAt: '2026-08-05T12:00:00.000Z',
              effectiveFrom: '2026-08-05', effectiveUntil: '2026-08-05', currencyAgeSeconds: 1_801,
              departures: [{
                patternId: 'pattern-a', occurrenceId: 'occ-a12', clockTime: '08:17', evidence: 'scheduled',
                timeZone: 'America/New_York',
              }],
            },
          },
          serviceClaims: [], equipmentClaims: [],
        },
      }],
    },
  };
}
