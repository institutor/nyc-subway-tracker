import { useCallback, useEffect, useRef, useState } from 'react';

export type ConnectivityState = 'online' | 'offline' | 'checking';
export type ConnectivityRequestResult = 'accepted' | 'network-unreachable' | 'domain-unavailable';

export interface UseConnectivityOptions {
  readonly navigator?: Pick<Navigator, 'onLine'>;
  readonly eventTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export interface ConnectivityController {
  readonly state: ConnectivityState;
  readonly reportRequestResult: (result: ConnectivityRequestResult) => void;
  readonly completeRecovery: () => void;
}

/**
 * Keeps global connectivity separate from location and route/feed health.
 * Callers report only an owner-classified global network failure; a domain
 * unavailable result intentionally cannot enter the global Offline state.
 */
export function useConnectivity(options: UseConnectivityOptions = {}): ConnectivityController {
  const navigatorState = options.navigator ?? globalThis.navigator;
  const eventTarget = options.eventTarget ?? globalThis.window;
  const browserOffline = useRef(navigatorState?.onLine === false);
  const [state, setState] = useState<ConnectivityState>(() => browserOffline.current ? 'offline' : 'online');

  useEffect(() => {
    const offline = () => {
      browserOffline.current = true;
      setState('offline');
    };
    const online = () => {
      browserOffline.current = false;
      setState('checking');
    };
    eventTarget?.addEventListener('offline', offline);
    eventTarget?.addEventListener('online', online);
    return () => {
      eventTarget?.removeEventListener('offline', offline);
      eventTarget?.removeEventListener('online', online);
    };
  }, [eventTarget]);

  const reportRequestResult = useCallback((result: ConnectivityRequestResult) => {
    if (result === 'domain-unavailable') return;
    if (result === 'network-unreachable') {
      setState('offline');
      return;
    }
    if (!browserOffline.current) setState((current) => current === 'offline' ? 'checking' : current);
  }, []);

  const completeRecovery = useCallback(() => {
    if (!browserOffline.current) setState('online');
  }, []);

  return Object.freeze({ state, reportRequestResult, completeRecovery });
}
