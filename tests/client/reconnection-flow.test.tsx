import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { App } from '../../src/client/App';
import type { BoardEnvelopeDto, MapOverlayEnvelopeDto } from '../../src/client/api/client';
import type { ReconnectionTransition } from '../../src/client/recovery/run-reconnection';
import { writeLastUsedStation } from '../../src/client/state/app-state';
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
      recoveryNow: () => new Date('2026-08-05T12:00:00.000Z'),
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
});

function recoveryBoard(identity: string, instant: string): BoardEnvelopeDto {
  const base = boardEnvelope();
  const at = Date.parse(instant);
  const validThrough = new Date(at + 90_000).toISOString();
  return {
    ...base,
    responseIdentity: identity,
    decidedAt: instant,
    serverTime: instant,
    cacheState: 'network',
    data: base.data ? {
      ...base.data,
      directions: base.data.directions.map((direction) => ({
        ...direction,
        primary: direction.primary.map((arrival) => arrival.kind === 'live'
          ? { ...arrival, at: new Date(at + 180_000).toISOString(), validThrough }
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
  return {
    ...boardEnvelope(),
    responseIdentity: 'recovery-overlay',
    decidedAt: '2026-08-05T12:00:04.000Z',
    serverTime: '2026-08-05T12:00:04.000Z',
    cacheState: 'network',
    data: { theme: 'night', serviceEpoch: 'recovery-map-7', segments: [] },
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
