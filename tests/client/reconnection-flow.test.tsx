import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { App } from '../../src/client/App';
import type { BoardEnvelopeDto, MapOverlayEnvelopeDto } from '../../src/client/api/client';
import {
  createFailClosedReconnectionStage,
  type ReconnectionTransition,
} from '../../src/client/recovery/run-reconnection';
import { writeLastUsedStation } from '../../src/client/state/app-state';
import {
  ACTIVE_TRIP_STORE_KEY,
  createBrowserActiveTripStore,
  type ActiveTripRecord,
} from '../../src/client/storage/active-trip-store';
import {
  ControlledGeolocation,
  MemoryStorage,
  boardEnvelope,
  createClientApi,
} from '../helpers/client-fixtures';

describe('App reconnection flow', () => {
  test('keeps the retained board historical while runtime owners complete in exact five-stage order', async () => {
    const storage = new MemoryStorage();
    writeLastUsedStation(storage, { complexId: 'A12', constituentId: 'A12', name: '125 St' });
    const geolocation = new ControlledGeolocation();
    const navigatorState = { onLine: true };
    const events = new ControlledConnectivityEvents();
    const stage2 = deferred<BoardEnvelopeDto>();
    const firstSnapshot = deferred<BoardEnvelopeDto>();
    const secondSnapshot = deferred<BoardEnvelopeDto>();
    const mapStage = deferred<MapOverlayEnvelopeDto>();
    const boards = [
      Promise.resolve(boardEnvelope()),
      stage2.promise,
      firstSnapshot.promise,
      secondSnapshot.promise,
    ];
    const transitions: string[] = [];
    let recoveryClockCalls = 0;
    const recoveryNow = () => new Date(recoveryClockCalls++ === 0
      ? '2026-08-05T12:00:00.000Z'
      : '2026-08-05T12:00:10.000Z');
    const api = createClientApi({
      board: vi.fn(async () => {
        const next = boards.shift();
        if (!next) throw new Error('Unexpected board request');
        return next;
      }),
      mapOverlay: vi.fn(async () => mapStage.promise),
    });

    render(<App {...({
      api,
      geolocation,
      storage,
      connectivityOptions: { navigator: navigatorState, eventTarget: events },
      recoveryNow,
      onReconnectionTransition: (transition: ReconnectionTransition) => {
        transitions.push(`${transition.phase}:${transition.stage}`);
      },
    } as any)} />);

    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    act(() => geolocation.fail(0, 2));
    expect(await screen.findByText('Live and expected arrivals')).toBeInTheDocument();

    navigatorState.onLine = false;
    act(() => events.dispatch('offline'));
    expect(screen.getByText('Historical board · last checked 8:00 AM')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();

    navigatorState.onLine = true;
    act(() => events.dispatch('online'));
    await waitFor(() => expect(transitions).toEqual(['requested:1', 'presented:1', 'requested:2']));
    expect(screen.getByText('Historical board · last checked 8:00 AM')).toBeInTheDocument();

    await act(async () => stage2.resolve(recoveryBoard('stage-2', '2026-08-05T12:00:01.000Z')));
    await waitFor(() => expect(transitions.at(-1)).toBe('requested:3'));
    await act(async () => firstSnapshot.resolve(recoveryBoard('snapshot-1', '2026-08-05T12:00:02.000Z')));
    expect(transitions).not.toContain('presented:3');
    expect(screen.getByText('Historical board · last checked 8:00 AM')).toBeInTheDocument();

    await act(async () => secondSnapshot.resolve(recoveryBoard('snapshot-2', '2026-08-05T12:00:03.000Z')));
    await waitFor(() => expect(transitions.at(-1)).toBe('requested:5'));
    expect(screen.getByText(/Historical board/)).toBeInTheDocument();

    await act(async () => mapStage.resolve(recoveryOverlay()));
    await waitFor(() => expect(screen.queryByText(/Connection restored\. Rechecking/)).not.toBeInTheDocument());
    expect(transitions).toEqual([
      'requested:1', 'presented:1', 'requested:2', 'presented:2', 'requested:3', 'presented:3',
      'requested:4', 'presented:4', 'requested:5', 'presented:5',
    ]);
    expect(screen.getByText('Live and expected arrivals')).toBeInTheDocument();
    expect(screen.queryByText(/Historical board/)).not.toBeInTheDocument();
  });

  test('finishes checking after stage 5 while fail-closed recovery continues to withhold arrivals', async () => {
    const storage = new MemoryStorage();
    const geolocation = new ControlledGeolocation();
    const navigatorState = { onLine: false };
    const events = new ControlledConnectivityEvents();
    const mapStage = deferred<MapOverlayEnvelopeDto>();
    const api = createClientApi({
      board: vi.fn(async () => { throw new Error('A stationless recovery must not request a board'); }),
      mapOverlay: vi.fn(async () => mapStage.promise),
    });

    render(<App
      api={api}
      geolocation={geolocation}
      storage={storage}
      connectivityOptions={{ navigator: navigatorState, eventTarget: events }}
      recoveryNow={() => new Date('2026-08-05T12:00:00.000Z')}
    />);

    expect(screen.getByText('No current subway information is stored on this device.')).toBeInTheDocument();
    navigatorState.onLine = true;
    act(() => events.dispatch('online'));
    expect(await screen.findByText(/Connection restored\. Rechecking/)).toBeInTheDocument();

    await act(async () => mapStage.resolve(recoveryOverlay()));
    await waitFor(() => expect(screen.queryByText(/Connection restored\. Rechecking/)).not.toBeInTheDocument());
    expect(api.mapOverlay).toHaveBeenCalledTimes(1);
    expect(screen.getByText('No current subway information is stored on this device.')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  test('owns Actual-now with the Day map and preserves the exact response-owned train choice', async () => {
    const storage = new MemoryStorage();
    expect(createBrowserActiveTripStore(storage).capture(timedActiveTrip())).toMatchObject({ kind: 'saved' });
    const navigatorState = { onLine: false };
    const events = new ControlledConnectivityEvents();
    const transitions: ReconnectionTransition[] = [];

    render(<App
      api={createClientApi()}
      geolocation={new ControlledGeolocation()}
      storage={storage}
      connectivityOptions={{ navigator: navigatorState, eventTarget: events }}
      recoveryNow={() => new Date('2026-08-05T12:00:00.000Z')}
      onReconnectionTransition={(transition) => transitions.push(transition)}
    />);

    navigatorState.onLine = true;
    act(() => events.dispatch('online'));
    await waitFor(() => expect(transitions.length).toBeGreaterThan(0));

    const context = transitions[0]!.state.context;
    expect(context.mapTuple).toMatchObject({ referenceMode: 'actual', theme: 'day' });
    expect(context.hasStoredTrainChoice).toBe(true);
    expect(context.recovery.eligibleScopes).toContainEqual({
      kind: 'train',
      id: 'departure:leg-1:point-origin:08:15',
    });
  });

  test('scopes a middle-leg reconnect to remaining legs and upcoming transfers only', async () => {
    const storage = new MemoryStorage();
    expect(createBrowserActiveTripStore(storage).capture(fourLegActiveTripAtMiddle())).toMatchObject({ kind: 'saved' });
    const navigatorState = { onLine: false };
    const events = new ControlledConnectivityEvents();
    const transitions: ReconnectionTransition[] = [];

    render(<App
      api={createClientApi()}
      geolocation={new ControlledGeolocation()}
      storage={storage}
      connectivityOptions={{ navigator: navigatorState, eventTarget: events }}
      recoveryNow={() => new Date('2026-08-05T12:00:00.000Z')}
      onReconnectionTransition={(transition) => transitions.push(transition)}
    />);

    navigatorState.onLine = true;
    act(() => events.dispatch('online'));
    await waitFor(() => expect(transitions.length).toBeGreaterThan(0));

    const context = transitions[0]!.state.context;
    expect(context.manualCursor).toEqual({ legIndex: 1, stopId: 'point-transfer-1-out' });
    expect(context.recovery.ownerScopes['service-change']).toEqual([
      { kind: 'leg', id: 'leg-2' },
      { kind: 'leg', id: 'leg-3' },
      { kind: 'leg', id: 'leg-4' },
      { kind: 'transfer', id: 'transfer-2' },
      { kind: 'transfer', id: 'transfer-3' },
    ]);
    expect(context.recovery.ownerScopes['transfer-guidance']).toEqual([
      { kind: 'transfer', id: 'transfer-2' },
      { kind: 'transfer', id: 'transfer-3' },
    ]);
  });

  test('runs injected current owner scopes through the real App coordinator while preserving rider context', async () => {
    const storage = new MemoryStorage();
    const activeTrip = { ...fourLegActiveTripAtMiddle(), accessibleRouteOnly: true };
    expect(createBrowserActiveTripStore(storage).capture(activeTrip)).toMatchObject({ kind: 'saved' });
    const navigatorState = { onLine: false };
    const events = new ControlledConnectivityEvents();
    const transitions: ReconnectionTransition[] = [];
    let clock = 0;
    const loadStage = vi.fn(async (request: Parameters<typeof createFailClosedReconnectionStage>[0] extends never
      ? never
      : any) => request.stage === 1
      ? {
          kind: 'owner-result' as const,
          result: createFailClosedReconnectionStage(
            request.state,
            1,
            'Exact path and equipment owners are unavailable.',
            new Date(Date.parse(request.context.recovery.startedAt) + 1).toISOString(),
          ),
        }
      : { kind: 'use-default' as const });
    const reconnectionOwners = {
      ownerSetId: 'unit-current-owner-set',
      equipmentScopes: [{ kind: 'machine' as const, id: 'EL-unit-1' }],
      accessiblePathScopes: [{ kind: 'path' as const, id: 'path-unit-1' }],
      positioningScopes: [{ kind: 'platform' as const, id: 'platform-unit-1' }],
      guidanceRequirements: { positioning: 'required' as const, transfer: 'required' as const },
      loadStage,
    };

    render(<App {...({
      api: createClientApi(),
      geolocation: new ControlledGeolocation(),
      storage,
      connectivityOptions: { navigator: navigatorState, eventTarget: events },
      recoveryNow: () => new Date(Date.parse('2026-08-05T12:00:00.000Z') + clock++ * 1_000),
      reconnectionOwners,
      onReconnectionTransition: (transition: ReconnectionTransition) => transitions.push(transition),
    } as any)} />);

    navigatorState.onLine = true;
    act(() => events.dispatch('online'));
    await waitFor(() => expect(transitions.some(({ phase, stage }) => phase === 'presented' && stage === 1)).toBe(true));

    expect(loadStage).toHaveBeenCalledWith(expect.objectContaining({ stage: 1 }), expect.any(AbortSignal));
    const stageOne = transitions.find(({ phase, stage }) => phase === 'presented' && stage === 1)!.state;
    expect(stageOne.context).toMatchObject({
      accessibleRouteOnly: true,
      manualCursor: { legIndex: 1, stopId: 'point-transfer-1-out' },
      readingAnchorId: 'point-transfer-1-out',
      guidanceRequirements: { positioning: 'required', transfer: 'required' },
    });
    expect(stageOne.context.recovery.ownerScopes).toMatchObject({
      equipment: [{ kind: 'machine', id: 'EL-unit-1' }],
      'accessible-path': [{ kind: 'path', id: 'path-unit-1' }],
      positioning: [{ kind: 'platform', id: 'platform-unit-1' }],
      'service-change': expect.arrayContaining([
        { kind: 'leg', id: 'leg-2' },
        { kind: 'transfer', id: 'transfer-2' },
      ]),
    });
    expect(stageOne.visible.activeWarnings).toEqual([
      expect.objectContaining({
        stage: 1,
        scopes: [{ kind: 'path', id: 'path-unit-1', label: 'path path-unit-1' }],
      }),
    ]);
  });

  test('rejects legacy scalar claims but still fails closed for a retained Accessible Only trip', async () => {
    const storage = new MemoryStorage();
    const legacy = {
      ...timedActiveTrip(),
      accessibleRouteOnly: true,
      platformGuidance: {
        ownerRecordId: 'forged-platform-owner', legId: 'leg-1', routeId: 'A', direction: 'southbound',
        orientation: 'forward', zone: 'front', objective: 'Fast exit', certainty: 'high',
        verifiedAt: '2026-08-05T11:50:00.000Z',
      },
      accessiblePath: {
        ownerRecordId: 'forged-path-owner', verificationContext: 'Caller says reviewed',
        verifiedAt: '2026-08-05T11:50:00.000Z',
        connections: [{ id: 'forged-edge', from: 'Street', to: 'Platform', movement: 'elevator', equipmentId: 'EL-FORGED', restrictions: [] }],
      },
    } as unknown as ActiveTripRecord;
    storage.values.set(ACTIVE_TRIP_STORE_KEY, JSON.stringify({ version: 3, trip: legacy }));
    const navigatorState = { onLine: false };
    const events = new ControlledConnectivityEvents();
    const transitions: ReconnectionTransition[] = [];

    render(<App
      api={createClientApi()}
      geolocation={new ControlledGeolocation()}
      storage={storage}
      connectivityOptions={{ navigator: navigatorState, eventTarget: events }}
      recoveryNow={() => new Date('2026-08-05T12:00:00.000Z')}
      onReconnectionTransition={(transition) => transitions.push(transition)}
    />);

    expect(screen.getByRole('heading', { name: '125 St to 59 St' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Platform position' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Structurally step-free path' })).not.toBeInTheDocument();

    navigatorState.onLine = true;
    act(() => events.dispatch('online'));
    await waitFor(() => expect(transitions.length).toBeGreaterThan(0));
    const context = transitions[0]!.state.context;
    expect(context.guidanceRequirements.positioning).toBe('none');
    expect(context.recovery.ownerScopes.equipment).toEqual([{ kind: 'leg', id: 'leg-1' }]);
    expect(context.recovery.ownerScopes['accessible-path']).toEqual([{ kind: 'leg', id: 'leg-1' }]);
    expect(context.recovery.ownerScopes.positioning).toEqual([]);
    expect(context.recovery.eligibleScopes).not.toContainEqual({ kind: 'path', id: 'forged-path-owner' });
    expect(context.recovery.eligibleScopes).not.toContainEqual({ kind: 'platform', id: 'forged-platform-owner' });
    expect(context.recovery.ownerScopes['accessible-path']).not.toContainEqual({ kind: 'path', id: 'forged-path-owner' });
    expect(context.recovery.ownerScopes.positioning).not.toContainEqual({ kind: 'platform', id: 'forged-platform-owner' });
    const stageOne = transitions.find(({ phase, stage }) => phase === 'presented' && stage === 1)?.state;
    expect(stageOne?.stages[0]?.result).toMatchObject({
      stage: 1,
      equipment: { disposition: 'unknown' },
      accessiblePath: { requiredForActiveTrip: true, disposition: 'unverified' },
      invalidation: { stage: 1, scopes: [{ kind: 'leg', id: 'leg-1', label: 'leg leg-1' }] },
    });
    expect(stageOne?.visible.activeWarnings.some(({ stage }) => stage === 1)).toBe(true);
  });
});

function timedActiveTrip(): ActiveTripRecord {
  return {
    id: 'trip-current',
    capturedAt: '2026-08-05T12:00:00.000Z',
    captureContext: {
      kind: 'response-owned',
      itineraryId: 'itinerary-current',
      requestMode: 'online-current',
      timing: 'timed',
      disclosure: 'Demonstration data — not live',
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
        {
          id: 'point-origin', kind: 'stop', stationName: '125 St', complexId: 'A12', constituentId: 'A12',
          instruction: 'Board the A train.',
        },
        {
          id: 'point-destination', kind: 'stop', stationName: '59 St', complexId: 'A24', constituentId: 'A24',
          instruction: 'Leave the train.',
        },
      ],
    }],
    transfers: [],
    serviceClaims: [],
    equipmentClaims: [],
    cursor: { pointId: 'point-origin' },
    validity: {
      result: 'current-itinerary',
      serviceDate: '2026-08-05',
      pattern: 'actual-now',
      schedule: {
        kind: 'current',
        editionId: 'edition-current',
        anchorKind: 'published',
        anchorAt: '2026-08-05T11:00:00.000Z',
        lastRetrievedAt: '2026-08-05T11:58:00.000Z',
        effectiveFrom: '2026-08-05',
        effectiveUntil: '2026-08-05',
        currencyAgeSeconds: 3_600,
        departures: [{
          legId: 'leg-1', pointId: 'point-origin', clockTime: '08:15', evidence: 'scheduled',
          timeZone: 'America/New_York',
        }],
      },
      warnings: [],
      vetoes: [],
    },
  };
}

function fourLegActiveTripAtMiddle(): ActiveTripRecord {
  const base = timedActiveTrip();
  const route = (
    id: string,
    label: string,
    direction: ActiveTripRecord['legs'][number]['boundDirection'],
    actualDestination: string,
    points: ActiveTripRecord['legs'][number]['points'],
  ): ActiveTripRecord['legs'][number] => ({
    id,
    route: { id: label, label, spokenIdentity: `${label} train`, shape: 'circle' },
    boundDirection: direction,
    actualDestination,
    points,
  });
  const decision = (
    id: string,
    stationName: string,
    constituentId: string,
    instruction: string,
  ): ActiveTripRecord['legs'][number]['points'][number] => ({
    id, kind: 'decision', stationName, complexId: constituentId, constituentId, instruction,
  });
  const leg1 = route('leg-1', 'A', 'southbound', 'Far Rockaway', [
    base.legs[0]!.points[0]!,
    decision('point-transfer-1-in', '42 St', 'D14', 'Leave the A train for the transfer.'),
  ]);
  const leg2 = route('leg-2', 'C', 'southbound', 'Euclid Av', [
    decision('point-transfer-1-out', '42 St', 'D14', 'Board the C train.'),
    decision('point-transfer-2-in', 'Canal St', 'R20', 'Leave the C train for the transfer.'),
  ]);
  const leg3 = route('leg-3', 'N', 'northbound', 'Astoria–Ditmars Blvd', [
    decision('point-transfer-2-out', 'Canal St', 'R20', 'Board the N train.'),
    decision('point-transfer-3-in', 'Queensboro Plaza', 'Q01', 'Leave the N train for the transfer.'),
  ]);
  const leg4 = route('leg-4', '7', 'eastbound', 'Flushing–Main St', [
    decision('point-transfer-3-out', 'Queensboro Plaza', 'Q01', 'Board the 7 train.'),
    {
      id: 'point-final', kind: 'stop', stationName: '74 St–Broadway', complexId: '701', constituentId: '701',
      instruction: 'Leave the train.',
    },
  ]);
  return {
    ...base,
    destination: { name: '74 St–Broadway', complexId: '701', constituentId: '701' },
    legs: [leg1, leg2, leg3, leg4],
    transfers: [
      {
        id: 'transfer-1', atPointId: 'point-transfer-1-in', incomingLegId: 'leg-1', outgoingLegId: 'leg-2',
        incomingDirection: 'southbound', incomingDestination: 'Far Rockaway',
        outgoingDirection: 'southbound', outgoingDestination: 'Euclid Av', steps: ['Transfer from A to C.'],
      },
      {
        id: 'transfer-2', atPointId: 'point-transfer-2-in', incomingLegId: 'leg-2', outgoingLegId: 'leg-3',
        incomingDirection: 'southbound', incomingDestination: 'Euclid Av',
        outgoingDirection: 'northbound', outgoingDestination: 'Astoria–Ditmars Blvd', steps: ['Transfer from C to N.'],
      },
      {
        id: 'transfer-3', atPointId: 'point-transfer-3-in', incomingLegId: 'leg-3', outgoingLegId: 'leg-4',
        incomingDirection: 'northbound', incomingDestination: 'Astoria–Ditmars Blvd',
        outgoingDirection: 'eastbound', outgoingDestination: 'Flushing–Main St', steps: ['Transfer from N to 7.'],
      },
    ],
    cursor: { pointId: 'point-transfer-1-out' },
    validity: {
      ...base.validity,
      schedule: base.validity.schedule.kind === 'current' ? {
        ...base.validity.schedule,
        departures: [
          { legId: 'leg-1', pointId: 'point-origin', clockTime: '08:15', evidence: 'scheduled', timeZone: 'America/New_York' },
          { legId: 'leg-2', pointId: 'point-transfer-1-out', clockTime: '08:30', evidence: 'scheduled', timeZone: 'America/New_York' },
          { legId: 'leg-3', pointId: 'point-transfer-2-out', clockTime: '08:45', evidence: 'scheduled', timeZone: 'America/New_York' },
          { legId: 'leg-4', pointId: 'point-transfer-3-out', clockTime: '09:00', evidence: 'scheduled', timeZone: 'America/New_York' },
        ],
      } : base.validity.schedule,
    },
  };
}

function recoveryBoard(identity: string, instant: string): BoardEnvelopeDto {
  const base = boardEnvelope();
  const at = Date.parse(instant);
  const validThrough = new Date(at + 90_000).toISOString();
  const realtimeOwner = {
    source: 'gtfs-rt' as const,
    sourceId: 'mta-realtime-ace',
    observedAt: instant,
    retrievedAt: instant,
  };
  const realtimeHealth = {
    source: 'gtfs-rt' as const,
    sourceId: 'mta-realtime-ace',
    state: 'current' as const,
    assessedAt: instant,
    lastAcceptedAt: instant,
    reasonCode: 'SOURCE_CURRENT' as const,
  };
  const alertOwner = {
    source: 'alerts' as const,
    sourceId: 'mta-service-alerts',
    observedAt: instant,
    retrievedAt: instant,
  };
  const alertHealth = {
    source: 'alerts' as const,
    sourceId: 'mta-service-alerts',
    state: 'current' as const,
    assessedAt: instant,
    lastAcceptedAt: instant,
    reasonCode: 'SOURCE_CURRENT' as const,
  };
  return {
    ...base,
    responseIdentity: identity,
    decidedAt: instant,
    serverTime: instant,
    cacheState: 'network',
    provenance: [realtimeOwner, alertOwner],
    sourceHealth: [realtimeHealth, alertHealth],
    data: base.data ? {
      ...base.data,
      provenance: [realtimeOwner, alertOwner],
      sourceHealth: [realtimeHealth, alertHealth],
      alerts: base.data.alerts.map((alert) => ({ ...alert, provenance: alertOwner })),
      directions: base.data.directions.map((direction) => ({
        ...direction,
        primary: direction.primary.map((arrival) => arrival.kind === 'live'
          ? {
              ...arrival,
              at: new Date(at + 180_000).toISOString(),
              validThrough,
              provenance: realtimeOwner,
            }
          : arrival.kind === 'expected'
            ? {
                ...arrival,
                estimateAt: new Date(at + 360_000).toISOString(),
                range: {
                  startsAt: new Date(at + 300_000).toISOString(),
                  endsAt: new Date(at + 420_000).toISOString(),
                },
                validThrough,
              }
            : { ...arrival, at: new Date(at + 240_000).toISOString(), validThrough }),
        secondary: direction.secondary.map((arrival) => ({ ...arrival, validThrough })),
      })),
    } : null,
  };
}

function recoveryOverlay(): MapOverlayEnvelopeDto {
  const provenance = {
    source: 'alerts' as const, sourceId: 'mta-service-alerts',
    observedAt: '2026-08-05T12:00:03.000Z', retrievedAt: '2026-08-05T12:00:03.500Z',
  };
  const health = {
    source: 'alerts' as const, sourceId: 'mta-service-alerts', state: 'current' as const,
    assessedAt: '2026-08-05T12:00:04.000Z', lastAcceptedAt: '2026-08-05T12:00:03.500Z',
    reasonCode: 'SOURCE_CURRENT' as const,
  };
  return {
    ...boardEnvelope(),
    responseIdentity: 'recovery-overlay',
    decidedAt: '2026-08-05T12:00:04.000Z',
    serverTime: '2026-08-05T12:00:04.000Z',
    cacheState: 'network',
    provenance: [provenance], sourceHealth: [health],
    data: {
      theme: 'day', serviceEpoch: 'recovery-map-7', segments: [],
      sourceOwners: [{ ...provenance, assessedAt: health.assessedAt, lastAcceptedAt: health.lastAcceptedAt }],
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => { resolve = accept; });
  return { promise, resolve };
}

class ControlledConnectivityEvents implements Pick<Window, 'addEventListener' | 'removeEventListener'> {
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const group = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    group.add(listener);
    this.listeners.set(type, group);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: 'online' | 'offline'): void {
    const event = new Event(type);
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    }
  }
}
