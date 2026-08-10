import { describe, expect, test, vi } from 'vitest';

import type { BoardEnvelopeDto, JourneyEnvelopeDto, MapOverlayEnvelopeDto } from '../../src/client/api/client';
import {
  createAppReconnectionStageLoader,
  type AppReconnectionArtifacts,
} from '../../src/client/recovery/app-reconnection-loader';
import type { ActiveTripRecord } from '../../src/client/storage/active-trip-store';
import type { PreservedReconnectionContext } from '../../src/shared/domain/reconnection';
import { boardEnvelope, createClientApi, disclosure } from '../helpers/client-fixtures';
import { encodeCanonicalStringTuple } from '../../src/shared/domain/canonical';

const STARTED_AT = '2026-08-05T12:00:00.000Z';
const ACCEPTED_AT = '2026-08-05T12:00:02.000Z';
const FIRST_REALTIME_OWNER = {
  observedAt: '2026-08-05T12:00:00.100Z',
  retrievedAt: '2026-08-05T12:00:00.200Z',
  lastAcceptedAt: '2026-08-05T12:00:00.200Z',
  assessedAt: '2026-08-05T12:00:00.300Z',
} as const;
const SECOND_REALTIME_OWNER = {
  observedAt: '2026-08-05T12:00:01.100Z',
  retrievedAt: '2026-08-05T12:00:01.200Z',
  lastAcceptedAt: '2026-08-05T12:00:01.200Z',
  assessedAt: '2026-08-05T12:00:01.300Z',
} as const;

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

  test('ignores completed-leg changes and completed-leg vetoes when every remaining owned leg is current', async () => {
    const trip = twoLegActiveTrip();
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ planJourney: vi.fn(async () => completedLegChangedJourney(false)) }),
      stationId: 'D14',
      filters: { routeIds: ['C'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts: {},
      activeTrip: trip,
      now: () => new Date(ACCEPTED_AT),
    });

    const result = await loader(
      { stage: 2, context: recoveryContext(['leg-2']), state: null as any },
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      stage: 2,
      tripServicePattern: 'verified',
      serviceChanges: { gate: { scopeMembership: [{ kind: 'leg', id: 'leg-2' }] } },
      invalidation: null,
    });
  });

  test('applies an itinerary-wide veto to the remaining owned legs after completed travel', async () => {
    const trip = twoLegActiveTrip();
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ planJourney: vi.fn(async () => completedLegChangedJourney(true)) }),
      stationId: 'D14',
      filters: { routeIds: ['C'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts: {},
      activeTrip: trip,
      now: () => new Date(ACCEPTED_AT),
    });

    const result = await loader(
      { stage: 2, context: recoveryContext(['leg-2']), state: null as any },
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      stage: 2,
      tripServicePattern: 'unusable',
      invalidation: { scopes: [{ kind: 'leg', id: 'leg-2' }] },
    });
  });

  test('does not count different response wrappers over the same GTFS-RT owner snapshot twice', async () => {
    const unchangedOwnerBoard = withRealtimeOwner(storedTrainBoard(), FIRST_REALTIME_OWNER);
    const first = {
      ...unchangedOwnerBoard,
      responseIdentity: 'same-source-wrapper-1',
      decidedAt: '2026-08-05T12:00:01.000Z',
      serverTime: '2026-08-05T12:00:01.000Z',
    };
    const second = {
      ...unchangedOwnerBoard,
      responseIdentity: 'same-source-wrapper-2',
      decidedAt: '2026-08-05T12:00:02.000Z',
      serverTime: '2026-08-05T12:00:02.000Z',
    };
    const board = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ board }),
      stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts: {},
      activeTrip: timedActiveTrip(),
      now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 3, context: recoveryContext(), state: null as any },
      new AbortController().signal,
    )).resolves.toMatchObject({
      stage: 3,
      feedRecovery: { disposition: 'readmitted', gate: { disposition: 'accepted-fresh' } },
      trainReadmission: { disposition: 'blocked', gate: { disposition: 'governed-fail-closed' } },
      arrivals: {
        disposition: 'withheld',
        freshSnapshotCount: 1,
        freshSnapshots: [{
          evidenceId: 'gtfs-rt-owner:mta-realtime-ace:2026-08-05T12:00:00.100Z:2026-08-05T12:00:00.200Z:2026-08-05T12:00:00.200Z',
          evidenceAt: '2026-08-05T12:00:00.200Z',
          disposition: 'accepted-fresh',
        }],
      },
      storedTrainChoice: 'unverified',
      invalidation: { stage: 3, scopes: [{ kind: 'train', id: 'departure:leg-1:point-origin:08:15' }] },
    });
    expect(board).toHaveBeenCalledTimes(2);
  });

  test('restores a stored train choice only after two coherent fresh boards', async () => {
    const first = {
      ...withRealtimeOwner(storedTrainBoard(), FIRST_REALTIME_OWNER), responseIdentity: 'coherent-snapshot-1',
      decidedAt: '2026-08-05T12:00:01.000Z', serverTime: '2026-08-05T12:00:01.000Z',
    };
    const second = {
      ...withRealtimeOwner(storedTrainBoard(), SECOND_REALTIME_OWNER), responseIdentity: 'coherent-snapshot-2',
      decidedAt: '2026-08-05T12:00:02.000Z', serverTime: '2026-08-05T12:00:02.000Z',
    };
    const board = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    const artifacts: AppReconnectionArtifacts = {};
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ board }),
      stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false,
      artifacts,
      activeTrip: timedActiveTrip(),
      now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 3, context: recoveryContext(), state: null as any },
      new AbortController().signal,
    )).resolves.toMatchObject({
      stage: 3,
      feedRecovery: { disposition: 'readmitted' },
      trainReadmission: { disposition: 'admitted' },
      arrivals: {
        disposition: 'current',
        freshSnapshotCount: 2,
        freshSnapshots: [
          {
            evidenceId: 'gtfs-rt-owner:mta-realtime-ace:2026-08-05T12:00:00.100Z:2026-08-05T12:00:00.200Z:2026-08-05T12:00:00.200Z',
            evidenceAt: '2026-08-05T12:00:00.200Z',
          },
          {
            evidenceId: 'gtfs-rt-owner:mta-realtime-ace:2026-08-05T12:00:01.100Z:2026-08-05T12:00:01.200Z:2026-08-05T12:00:01.200Z',
            evidenceAt: '2026-08-05T12:00:01.200Z',
          },
        ],
      },
      storedTrainChoice: 'verified',
      invalidation: null,
    });
    expect(board).toHaveBeenCalledTimes(2);
    expect(artifacts.selectedBoard).toBe(second);
  });

  test('withholds the whole board when a sibling live GTFS-RT owner does not advance', async () => {
    const multiFeedBoard = withLiveSibling(storedTrainBoard());
    const unchangedSibling = {
      sourceId: 'mta-realtime-bdfm', routeIds: ['C'] as const, ...FIRST_REALTIME_OWNER,
    };
    const first = {
      ...withRouteRealtimeOwners(multiFeedBoard, [
        { sourceId: 'mta-realtime-ace', routeIds: ['A'], ...FIRST_REALTIME_OWNER },
        unchangedSibling,
      ]),
      responseIdentity: 'multi-owner-wrapper-1',
      decidedAt: '2026-08-05T12:00:01.000Z', serverTime: '2026-08-05T12:00:01.000Z',
    };
    const second = {
      ...withRouteRealtimeOwners(multiFeedBoard, [
        { sourceId: 'mta-realtime-ace', routeIds: ['A'], ...SECOND_REALTIME_OWNER },
        unchangedSibling,
      ]),
      responseIdentity: 'multi-owner-wrapper-2',
      decidedAt: '2026-08-05T12:00:02.000Z', serverTime: '2026-08-05T12:00:02.000Z',
    };
    const board = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ board }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' }, hasUnrelatedSavedRecords: false,
      artifacts: {}, activeTrip: timedActiveTrip(), now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 3, context: recoveryContext(), state: null as any }, new AbortController().signal,
    )).resolves.toMatchObject({
      stage: 3,
      arrivals: { disposition: 'withheld', freshSnapshotCount: 1 },
      storedTrainChoice: 'unverified',
    });
  });

  test('rejects a source snapshot assessed after its response server time', async () => {
    const first = {
      ...withRealtimeOwner(storedTrainBoard(), FIRST_REALTIME_OWNER), responseIdentity: 'clock-wrapper-1',
      decidedAt: '2026-08-05T12:00:01.000Z', serverTime: '2026-08-05T12:00:01.000Z',
    };
    const second = {
      ...withRealtimeOwner(storedTrainBoard(), SECOND_REALTIME_OWNER), responseIdentity: 'clock-wrapper-2',
      decidedAt: '2026-08-05T12:00:02.000Z', serverTime: '2026-08-05T12:00:01.050Z',
    };
    const board = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ board }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' }, hasUnrelatedSavedRecords: false,
      artifacts: {}, activeTrip: timedActiveTrip(), now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 3, context: recoveryContext(), state: null as any }, new AbortController().signal,
    )).resolves.toMatchObject({
      stage: 3,
      arrivals: { disposition: 'withheld', freshSnapshotCount: 1 },
      storedTrainChoice: 'unverified',
    });
  });

  test('does not query or certify a trip outside the preserved active-trip and train scope', async () => {
    const board = vi.fn(async () => withRealtimeOwner(storedTrainBoard(), FIRST_REALTIME_OWNER));
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ board }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' }, hasUnrelatedSavedRecords: false,
      artifacts: {}, activeTrip: { ...timedActiveTrip(), id: 'trip-other' }, now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 3, context: recoveryContext(), state: null as any }, new AbortController().signal,
    )).resolves.toBeUndefined();
    expect(board).not.toHaveBeenCalled();
  });

  test('rejects stale GTFS-RT provenance even when response wrappers are current and distinct', async () => {
    const staleOwnerBoard = withRealtimeOwner(storedTrainBoard(), {
      observedAt: '2026-08-04T12:00:00.100Z',
      retrievedAt: '2026-08-04T12:00:00.200Z',
      lastAcceptedAt: '2026-08-04T12:00:00.200Z',
      assessedAt: '2026-08-05T12:00:00.300Z',
    });
    const board = vi.fn()
      .mockResolvedValueOnce({
        ...staleOwnerBoard, responseIdentity: 'stale-source-wrapper-1',
        decidedAt: '2026-08-05T12:00:01.000Z', serverTime: '2026-08-05T12:00:01.000Z',
      })
      .mockResolvedValueOnce({
        ...staleOwnerBoard, responseIdentity: 'stale-source-wrapper-2',
        decidedAt: '2026-08-05T12:00:02.000Z', serverTime: '2026-08-05T12:00:02.000Z',
      });
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ board }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false, artifacts: {}, activeTrip: timedActiveTrip(),
      now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 3, context: recoveryContext(), state: null as any },
      new AbortController().signal,
    )).resolves.toBeUndefined();
    expect(board).toHaveBeenCalledTimes(1);
  });

  test('does not restore an unrelated same-route train outside the selected departure window', async () => {
    const unrelated = storedTrainBoard('2026-08-05T12:04:00.000Z');
    const first = {
      ...withRealtimeOwner(unrelated, FIRST_REALTIME_OWNER), responseIdentity: 'unrelated-snapshot-1',
      decidedAt: '2026-08-05T12:00:01.000Z', serverTime: '2026-08-05T12:00:01.000Z',
    };
    const second = {
      ...withRealtimeOwner(unrelated, SECOND_REALTIME_OWNER), responseIdentity: 'unrelated-snapshot-2',
      decidedAt: '2026-08-05T12:00:02.000Z', serverTime: '2026-08-05T12:00:02.000Z',
    };
    const board = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ board }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' },
      hasUnrelatedSavedRecords: false, artifacts: {}, activeTrip: timedActiveTrip(),
      now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 3, context: recoveryContext(), state: null as any },
      new AbortController().signal,
    )).resolves.toBeUndefined();
    expect(board).toHaveBeenCalledTimes(1);
  });

  test('does not refresh Actual-now from a new wrapper over pre-recovery overlay source evidence', async () => {
    const overlay = mapOverlayWithOwner({
      observedAt: '2026-08-04T12:00:00.100Z', retrievedAt: '2026-08-04T12:00:00.200Z',
      lastAcceptedAt: '2026-08-04T12:00:00.200Z', assessedAt: '2026-08-05T12:00:00.300Z',
    });
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ mapOverlay: vi.fn(async () => overlay) }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' }, hasUnrelatedSavedRecords: false,
      artifacts: {}, activeTrip: timedActiveTrip(), now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 5, context: recoveryContext(), state: null as any }, new AbortController().signal,
    )).resolves.toBeUndefined();
  });

  test('refreshes Actual-now with a source-owned gate only after current overlay evidence is admitted', async () => {
    const overlay = mapOverlayWithOwner(FIRST_REALTIME_OWNER);
    const artifacts: AppReconnectionArtifacts = {};
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ mapOverlay: vi.fn(async () => overlay) }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' }, hasUnrelatedSavedRecords: false,
      artifacts, activeTrip: timedActiveTrip(), now: () => new Date(ACCEPTED_AT),
    });

    await expect(loader(
      { stage: 5, context: recoveryContext(), state: null as any }, new AbortController().signal,
    )).resolves.toMatchObject({
      stage: 5,
      maps: {
        disposition: 'refreshed',
        gate: {
          evidenceId: 'map-owner:alerts:mta-service-alerts:2026-08-05T12:00:00.100Z:2026-08-05T12:00:00.200Z:2026-08-05T12:00:00.200Z',
          evidenceAt: '2026-08-05T12:00:00.200Z',
        },
      },
    });
    expect(artifacts.mapOverlay).toBe(overlay);
  });

  test('retains the complete canonical owner set in a composite map recovery gate', async () => {
    const alertOwner = mapOverlayWithOwner(FIRST_REALTIME_OWNER);
    const realtimeProvenance = {
      source: 'gtfs-rt' as const, sourceId: 'mta-realtime-ace',
      observedAt: SECOND_REALTIME_OWNER.observedAt, retrievedAt: SECOND_REALTIME_OWNER.retrievedAt,
    };
    const realtimeHealth = {
      source: 'gtfs-rt' as const, sourceId: 'mta-realtime-ace', state: 'current' as const,
      assessedAt: SECOND_REALTIME_OWNER.assessedAt, lastAcceptedAt: SECOND_REALTIME_OWNER.lastAcceptedAt,
      reasonCode: 'SOURCE_CURRENT' as const,
    };
    const overlay: MapOverlayEnvelopeDto = {
      ...alertOwner,
      decidedAt: '2026-08-05T12:00:02.000Z',
      serverTime: '2026-08-05T12:00:02.000Z',
      provenance: [...(alertOwner.provenance ?? []), realtimeProvenance],
      sourceHealth: [...(alertOwner.sourceHealth ?? []), realtimeHealth],
      data: alertOwner.data ? {
        ...alertOwner.data,
        sourceOwners: [
          ...alertOwner.data.sourceOwners,
          { ...realtimeProvenance, assessedAt: realtimeHealth.assessedAt, lastAcceptedAt: realtimeHealth.lastAcceptedAt },
        ],
      } : null,
    };
    const loader = createAppReconnectionStageLoader({
      api: createClientApi({ mapOverlay: vi.fn(async () => overlay) }), stationId: 'A12',
      filters: { routeIds: ['A'], direction: 'southbound' }, hasUnrelatedSavedRecords: false,
      artifacts: {}, activeTrip: timedActiveTrip(), now: () => new Date(ACCEPTED_AT),
    });
    const ownerTuple = encodeCanonicalStringTuple([
      'alerts', 'mta-service-alerts', FIRST_REALTIME_OWNER.observedAt,
      FIRST_REALTIME_OWNER.retrievedAt, FIRST_REALTIME_OWNER.lastAcceptedAt,
      'gtfs-rt', 'mta-realtime-ace', SECOND_REALTIME_OWNER.observedAt,
      SECOND_REALTIME_OWNER.retrievedAt, SECOND_REALTIME_OWNER.lastAcceptedAt,
    ]);

    await expect(loader(
      { stage: 5, context: recoveryContext(), state: null as any }, new AbortController().signal,
    )).resolves.toMatchObject({
      maps: { gate: { evidenceId: `map-owner-set:${ownerTuple}`, evidenceAt: SECOND_REALTIME_OWNER.lastAcceptedAt } },
    });
  });
});

function mapOverlayWithOwner(evidence: {
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly lastAcceptedAt: string;
  readonly assessedAt: string;
}): MapOverlayEnvelopeDto {
  const provenance = {
    source: 'alerts' as const, sourceId: 'mta-service-alerts',
    observedAt: evidence.observedAt, retrievedAt: evidence.retrievedAt,
  };
  const health = {
    source: 'alerts' as const, sourceId: 'mta-service-alerts', state: 'current' as const,
    assessedAt: evidence.assessedAt, lastAcceptedAt: evidence.lastAcceptedAt,
    reasonCode: 'SOURCE_CURRENT' as const,
  };
  return {
    ...boardEnvelope(), responseIdentity: 'overlay-wrapper-current', cacheState: 'network',
    decidedAt: '2026-08-05T12:00:01.000Z', serverTime: '2026-08-05T12:00:01.000Z',
    provenance: [provenance], sourceHealth: [health],
    data: {
      theme: 'day', serviceEpoch: 'overlay-current', segments: [],
      sourceOwners: [{ ...provenance, lastAcceptedAt: health.lastAcceptedAt, assessedAt: health.assessedAt }],
    },
  } as MapOverlayEnvelopeDto;
}

function storedTrainBoard(arrivalAt = '2026-08-05T12:15:00.000Z') {
  const envelope = boardEnvelope();
  return {
    ...envelope,
    data: envelope.data ? {
      ...envelope.data,
      directions: envelope.data.directions.map((direction) => direction.direction === 'southbound'
        ? {
            ...direction,
            primary: direction.primary.map((arrival) => arrival.kind === 'live'
              ? {
                  ...arrival,
                  destination: 'Far Rockaway',
                  at: arrivalAt,
                  validThrough: '2026-08-05T12:16:30.000Z',
                }
              : { ...arrival, destination: 'Far Rockaway' }),
          }
        : direction),
    } : null,
  };
}

function withRealtimeOwner(
  board: BoardEnvelopeDto,
  evidence: {
    readonly observedAt: string;
    readonly retrievedAt: string;
    readonly lastAcceptedAt: string;
    readonly assessedAt: string;
  },
): BoardEnvelopeDto {
  return withRouteRealtimeOwners(board, [{
    sourceId: 'mta-realtime-ace', routeIds: ['A', 'C'], ...evidence,
  }]);
}

function withLiveSibling(board: BoardEnvelopeDto): BoardEnvelopeDto {
  if (!board.data) return board;
  return {
    ...board,
    data: {
      ...board.data,
      directions: board.data.directions.map((direction, index) => {
        if (index !== 0) return direction;
        const template = direction.primary.find((arrival) => arrival.kind === 'live');
        if (!template) return direction;
        return {
          ...direction,
          primary: [...direction.primary, {
            ...template,
            id: `${template.id}:sibling-c`,
            route: { id: 'C', label: 'C' },
            destination: '168 St',
          }],
        };
      }),
    },
  };
}

function withRouteRealtimeOwners(
  board: BoardEnvelopeDto,
  owners: readonly {
    readonly sourceId: string;
    readonly routeIds: readonly string[];
    readonly observedAt: string;
    readonly retrievedAt: string;
    readonly lastAcceptedAt: string;
    readonly assessedAt: string;
  }[],
): BoardEnvelopeDto {
  const provenance = owners.map((owner) => ({
    source: 'gtfs-rt' as const,
    sourceId: owner.sourceId,
    observedAt: owner.observedAt,
    retrievedAt: owner.retrievedAt,
  }));
  const health = owners.map((owner) => ({
    source: 'gtfs-rt' as const,
    sourceId: owner.sourceId,
    state: 'current' as const,
    assessedAt: owner.assessedAt,
    lastAcceptedAt: owner.lastAcceptedAt,
    reasonCode: 'SOURCE_CURRENT' as const,
  }));
  const ownerForRoute = (routeId: string) => owners.find(({ routeIds }) => routeIds.includes(routeId));
  const arrivalProvenance = (arrival:
    | NonNullable<BoardEnvelopeDto['data']>['directions'][number]['primary'][number]
    | NonNullable<BoardEnvelopeDto['data']>['directions'][number]['secondary'][number]) => {
    const owner = ownerForRoute(arrival.route.id);
    return owner ? {
      source: 'gtfs-rt' as const, sourceId: owner.sourceId,
      observedAt: owner.observedAt, retrievedAt: owner.retrievedAt,
    } : arrival.provenance;
  };
  return {
    ...board,
    sourceHealth: health,
    provenance,
    data: board.data ? {
      ...board.data,
      sourceHealth: health,
      provenance,
      directions: board.data.directions.map((direction) => ({
        ...direction,
        primary: direction.primary.map((arrival) => ({ ...arrival, provenance: arrivalProvenance(arrival) })),
        secondary: direction.secondary.map((arrival) => ({ ...arrival, provenance: arrivalProvenance(arrival) })),
      })),
    } : null,
  };
}

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
    manualCursor: serviceLegIds[0] === 'leg-2'
      ? { legIndex: 1, stopId: 'point-transfer-out' }
      : { legIndex: 0, stopId: 'point-origin' },
    hasStoredTrainChoice: true,
    guidanceRequirements: { positioning: 'none', transfer: 'none' },
    activeSurface: 'station',
    scrollOffset: 0,
    focusTargetId: null,
    readingAnchorId: serviceLegIds[0] === 'leg-2' ? 'point-transfer-out' : 'point-origin',
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

function completedLegChangedJourney(itineraryWideVeto: boolean): JourneyEnvelopeDto {
  const base = currentJourney(false);
  if (base.data?.kind !== 'planned') throw new Error('Current journey fixture must be planned');
  const original = base.data.itineraries[0]!;
  if (!original.capture) throw new Error('Current journey fixture must own capture evidence');
  const scope = {
    mode: 'online-current' as const,
    originStationId: 'A12',
    destinationStationId: 'R20',
    accessibleRouteOnly: false,
  };
  const itineraryId = 'itinerary-completed-leg-changed';
  const completedLegVeto = {
    id: 'veto-completed-leg',
    scope: {
      kind: 'pattern' as const,
      patternId: 'pattern-a',
      routeId: 'A',
      direction: 'southbound' as const,
    },
    message: 'The already-traveled A pattern changed.',
    ownerRecordId: 'alert-completed-leg',
    lastCheckedAt: STARTED_AT,
  };
  const wholeItineraryVeto = {
    ...completedLegVeto,
    id: 'veto-whole-itinerary',
    scope: { kind: 'itinerary' as const, itineraryId },
    message: 'The remaining itinerary is no longer admitted.',
    ownerRecordId: 'alert-whole-itinerary',
  };
  return {
    ...base,
    responseIdentity: itineraryWideVeto ? 'journey-itinerary-veto' : 'journey-completed-leg-change',
    data: {
      kind: 'planned',
      scope,
      itineraries: [{
        ...original,
        id: itineraryId,
        legs: [
          {
            patternId: 'pattern-a', routeId: 'A', routeLabel: 'A', direction: 'southbound',
            actualDestination: 'Far Rockaway', fromOccurrenceId: 'occ-a12', toOccurrenceId: 'occ-d14-a',
            orderedOccurrenceIds: ['occ-a12', 'occ-a15', 'occ-d14-a'], fromStationId: 'A12', toStationId: 'D14',
            orderedStationIds: ['A12', 'A15', 'D14'],
          },
          {
            patternId: 'pattern-c', routeId: 'C', routeLabel: 'C', direction: 'southbound',
            actualDestination: 'Euclid Av', fromOccurrenceId: 'occ-d14-c', toOccurrenceId: 'occ-r20',
            orderedOccurrenceIds: ['occ-d14-c', 'occ-r20'], fromStationId: 'D14', toStationId: 'R20',
            orderedStationIds: ['D14', 'R20'],
          },
        ],
        transferIds: ['transfer-response-1'],
        transferInstructions: [{
          transferId: 'transfer-response-1', stationId: 'D14',
          fromRouteId: 'A', fromDirection: 'southbound', fromActualDestination: 'Far Rockaway',
          toRouteId: 'C', toDirection: 'southbound', toActualDestination: 'Euclid Av',
        }],
        transfers: 1,
        risk: 'blocked',
        capture: {
          ...original.capture,
          itineraryId,
          scope,
          validity: {
            ...original.capture.validity,
            vetoes: [itineraryWideVeto ? wholeItineraryVeto : completedLegVeto],
          },
        },
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
