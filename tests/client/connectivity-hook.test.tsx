import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, test } from 'vitest';

import {
  useConnectivity,
  type ConnectivityRequestResult,
} from '../../src/client/hooks/use-connectivity';

describe('governed global connectivity', () => {
  test('enters Offline immediately from the browser connectivity result', () => {
    const events = new ControlledConnectivityEvents();
    render(<Harness navigatorState={{ onLine: false }} events={events} />);

    expect(screen.getByText('offline')).toBeTruthy();
  });

  test('keeps route and feed failure separate from global Offline', () => {
    const events = new ControlledConnectivityEvents();
    render(<Harness navigatorState={{ onLine: true }} events={events} />);

    act(() => events.report('domain-unavailable'));
    expect(screen.getByText('online')).toBeTruthy();
  });

  test('uses a governing unreachable request as Offline evidence without inventing a retry threshold', () => {
    const events = new ControlledConnectivityEvents();
    render(<Harness navigatorState={{ onLine: true }} events={events} />);

    act(() => events.report('network-unreachable'));
    expect(screen.getByText('offline')).toBeTruthy();
    act(() => events.report('accepted'));
    expect(screen.getByText('checking')).toBeTruthy();
    act(() => events.completeRecovery());
    expect(screen.getByText('online')).toBeTruthy();
  });

  test('waits in checking after an online event until a governed request succeeds', () => {
    const navigatorState = { onLine: false };
    const events = new ControlledConnectivityEvents();
    render(<Harness navigatorState={navigatorState} events={events} />);
    expect(screen.getByText('offline')).toBeTruthy();

    navigatorState.onLine = true;
    act(() => events.dispatch('online'));
    expect(screen.getByText('checking')).toBeTruthy();
    act(() => events.report('domain-unavailable'));
    expect(screen.getByText('checking')).toBeTruthy();
    act(() => events.report('accepted'));
    expect(screen.getByText('checking')).toBeTruthy();
    act(() => events.completeRecovery());
    expect(screen.getByText('online')).toBeTruthy();
  });

  test('an offline browser result cannot be cleared by a late accepted request', () => {
    const navigatorState = { onLine: true };
    const events = new ControlledConnectivityEvents();
    render(<Harness navigatorState={navigatorState} events={events} />);

    navigatorState.onLine = false;
    act(() => events.dispatch('offline'));
    act(() => events.report('accepted'));
    act(() => events.completeRecovery());
    expect(screen.getByText('offline')).toBeTruthy();
  });

  test('installs one listener pair under Strict Mode and removes it on unmount', () => {
    const events = new ControlledConnectivityEvents();
    const view = render(
      <StrictMode>
        <Harness navigatorState={{ onLine: true }} events={events} />
      </StrictMode>,
    );

    expect(events.listenerCount('online')).toBe(1);
    expect(events.listenerCount('offline')).toBe(1);
    view.unmount();
    expect(events.listenerCount('online')).toBe(0);
    expect(events.listenerCount('offline')).toBe(0);
  });
});

function Harness({
  navigatorState,
  events,
}: {
  readonly navigatorState: Pick<Navigator, 'onLine'>;
  readonly events: ControlledConnectivityEvents;
}) {
  const connectivity = useConnectivity({ navigator: navigatorState, eventTarget: events });
  events.bind(connectivity.reportRequestResult, connectivity.completeRecovery);
  return <p>{connectivity.state}</p>;
}

class ControlledConnectivityEvents implements Pick<Window, 'addEventListener' | 'removeEventListener'> {
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  private reporter: ((result: ConnectivityRequestResult) => void) | undefined;
  private completion: (() => void) | undefined;

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }

  bind(reporter: (result: ConnectivityRequestResult) => void, completion: () => void): void {
    this.reporter = reporter;
    this.completion = completion;
  }

  report(result: ConnectivityRequestResult): void {
    if (!this.reporter) throw new Error('Connectivity reporter is not bound.');
    this.reporter(result);
  }

  completeRecovery(): void {
    if (!this.completion) throw new Error('Connectivity recovery completion is not bound.');
    this.completion();
  }

  dispatch(type: 'online' | 'offline'): void {
    const event = new Event(type);
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    }
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}
