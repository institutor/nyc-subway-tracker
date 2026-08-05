import { useCallback, useEffect, useRef } from 'react';

import type { LocationFixDto } from '../api/client';

export interface UseLocationOptions {
  readonly geolocation?: Pick<Geolocation, 'getCurrentPosition'> | null;
  readonly autoStart?: boolean;
  readonly onRequest: (requestId: number) => void;
  readonly onFix: (requestId: number, fix: LocationFixDto) => void;
  readonly onDenied: (requestId: number) => void;
  readonly onFailure: (requestId: number) => void;
}

export interface LocationController {
  readonly retry: () => void;
}

export function useLocation(options: UseLocationOptions): LocationController {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const generation = useRef(0);
  const autoStarted = useRef(false);

  const retry = useCallback(() => {
    autoStarted.current = true;
    const requestId = generation.current + 1;
    generation.current = requestId;
    const current = optionsRef.current;
    current.onRequest(requestId);
    const geolocation = current.geolocation === undefined
      ? globalThis.navigator?.geolocation
      : current.geolocation;
    if (!geolocation) {
      current.onFailure(requestId);
      return;
    }
    geolocation.getCurrentPosition(
      (position) => {
        if (generation.current !== requestId) return;
        const fix = capturePosition(position);
        if (!fix) current.onFailure(requestId);
        else current.onFix(requestId, fix);
      },
      (error) => {
        if (generation.current !== requestId) return;
        if (error.code === 1) current.onDenied(requestId);
        else current.onFailure(requestId);
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    if (options.autoStart === false || autoStarted.current) return;
    let active = true;
    queueMicrotask(() => {
      if (active && !autoStarted.current) retry();
    });
    return () => { active = false; };
  }, [options.autoStart, retry]);

  return Object.freeze({ retry });
}

function capturePosition(position: GeolocationPosition): LocationFixDto | undefined {
  const { latitude, longitude, accuracy } = position.coords;
  if (![latitude, longitude, accuracy].every((value) => Number.isFinite(value))
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || accuracy <= 0) return undefined;
  return Object.freeze({
    coordinate: Object.freeze({ latitude, longitude }),
    accuracyMeters: accuracy,
  });
}
