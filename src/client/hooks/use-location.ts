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
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, []);

  const retry = useCallback(() => {
    if (!mounted.current) return;
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
        if (!mounted.current || generation.current !== requestId) return;
        const fix = capturePosition(position);
        if (!fix) current.onFailure(requestId);
        else current.onFix(requestId, fix);
      },
      (error) => {
        if (!mounted.current || generation.current !== requestId) return;
        if (error.code === 1) current.onDenied(requestId);
        else current.onFailure(requestId);
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    if (options.autoStart === false || autoStarted.current) return;
    return scheduleAfterPaint(() => {
      if (!autoStarted.current) retry();
    });
  }, [options.autoStart, retry]);

  return Object.freeze({ retry });
}

function scheduleAfterPaint(callback: () => void): () => void {
  let active = true;
  let firstFrame: number | undefined;
  let secondFrame: number | undefined;
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (!active) return;
    active = false;
    if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
    callback();
  };
  if (typeof globalThis.requestAnimationFrame === 'function') {
    firstFrame = globalThis.requestAnimationFrame(() => {
      if (!active) return;
      secondFrame = globalThis.requestAnimationFrame(finish);
    });
  } else {
    fallbackTimer = setTimeout(finish, 0);
  }
  return () => {
    active = false;
    if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
    if (typeof globalThis.cancelAnimationFrame === 'function') {
      if (firstFrame !== undefined) globalThis.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) globalThis.cancelAnimationFrame(secondFrame);
    }
  };
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
