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

  test('attributes a later-leg-only service pattern change to that later remaining leg', async () => {
    const trip = twoLegActiveTrip();
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ planJourney: vi.fn(async () => laterLegChangedJourney()) }),
      stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts: {},
      activeTrip: trip,
      now: () => new Date(ACCEPTED_AT),
    });

    const result = await loader(
      { stage: 2, context: recoveryContext(['leg-1', 'leg-2']), state: null as any },
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      stage: 2,
      tripServicePattern: 'unusable',
      serviceChanges: {
        gate: {
          scopeMembership: [
            { kind: 'leg', id: 'leg-1' },
            { kind: 'leg', id: 'leg-2' },
          ],
        },
      },
      invalidation: {
        scopes: [{ kind: 'leg', id: 'leg-2' }],
      },
    });
  });
});

function recoveryContext(serviceLegIds: readonly string[] = ['leg-1']): PreservedReconnectionContext {
  const contextScope = [{ kind: 'context' as const, id: 'context-1' }];
  const stationScope = [{ kind: 'station' as const, id: 'A12' }];
  const legScope = serviceLegIds.map((id) => ({ kind: 'leg' as const, id }));
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

function twoLegActiveTrip(): ActiveTripRecord {
  const base = timedActiveTrip();
  const firstLeg: ActiveTripRecord['legs'][number] = {
    ...base.legs[0],
    points: [
      base.legs[0]!.points[0]!,
      {
        id: 'point-transfer-in', kind: 'decision', stationName: '42 St', complexId: 'D14', constituentId: 'D14',
        instruction: 'Leave the A train for the transfer.',
      },
    ],
  };
  const secondLeg: ActiveTripRecord['legs'][number] = {
    id: 'leg-2',
    route: { id: 'C', label: 'C', spokenIdentity: 'C train', shape: 'circle' },
    boundDirection: 'southbound',
    actualDestination: 'Euclid Av',
    points: [
      {
        id: 'point-transfer-out', kind: 'decision', stationName: '42 St', complexId: 'D14', constituentId: 'D14',
        instruction: 'Board the C train.',
      },
      {
        id: 'point-final', kind: 'stop', stationName: 'Canal St', complexId: 'R20', constituentId: 'R20',
        instruction: 'Leave the train.',
      },
    ],
  };
  return {
    ...base,
    destination: { name: 'Canal St', complexId: 'R20', constituentId: 'R20' },
    legs: [firstLeg, secondLeg],
    transfers: [{
      id: 'transfer-1', atPointId: 'point-transfer-in', incomingLegId: 'leg-1', outgoingLegId: 'leg-2',
      incomingDirection: 'southbound', incomingDestination: 'Far Rockaway',
      outgoingDirection: 'southbound', outgoingDestination: 'Euclid Av', steps: ['Transfer from A to C.'],
    }],
    validity: {
      ...base.validity,
      schedule: base.validity.schedule.kind === 'current' ? {
        ...base.validity.schedule,
        departures: [
          ...base.validity.schedule.departures,
          { legId: 'leg-2', pointId: 'point-transfer-out', clockTime: '08:35', evidence: 'scheduled', timeZone: 'America/New_York' },
        ],
      } : base.validity.schedule,
    },
  };
}

function laterLegChangedJourney(): JourneyEnvelopeDto {
  const base = currentJourney(false);
  const scope = {
    mode: 'online-current' as const,
    originStationId: 'A12',
    destinationStationId: 'R20',
    accessibleRouteOnly: false,
  };
  return {
    ...base,
    responseIdentity: 'journey-later-leg-change',
    data: {
      kind: 'planned',
      scope,
      itineraries: [{
        id: 'itinerary-later-leg-change',
        legs: [
          {
            patternId: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'southbound',
            actualDestination: 'Far Rockaway', fromOccurrenceId: 'occ-a12', toOccurrenceId: 'occ-d14-a',
            orderedOccurrenceIds: ['occ-a12', 'occ-d14-a'], fromStationId: 'A12', toStationId: 'D14',
            orderedStationIds: ['A12', 'D14'],
          },
          {
            patternId: 'pattern-e', routeId: 'E', routeLabel: 'E', direction: 'southbound',
            actualDestination: 'World Trade Center', fromOccurrenceId: 'occ-d14-e', toOccurrenceId: 'occ-r20',
            orderedOccurrenceIds: ['occ-d14-e', 'occ-r20'], fromStationId: 'D14', toStationId: 'R20',
            orderedStationIds: ['D14', 'R20'],
          },
        ],
        transferIds: ['transfer-response-1'],
        transferInstructions: [{
          transferId: 'transfer-response-1', stationId: 'D14',
          fromRouteId: 'A', fromDirection: 'southbound', fromActualDestination: 'Far Rockaway',
          toRouteId: 'E', toDirection: 'southbound', toActualDestination: 'World Trade Center',
        }],
        transfers: 1,
        validity: 'valid',
        accessibility: 'eligible',
        risk: 'affected',
        timing: 'timed',
        arrivalSeconds: 600,
      }],
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
