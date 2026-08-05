import { useEffect, useMemo, useState } from 'react';

const readPerformanceNow = () => performance.now();

export interface BoardClockAnchor {
  readonly serverTimeMs: number;
  readonly validThroughMs: number;
  readonly receivedAtMonotonicMs: number;
}

export interface BoardClockReading {
  readonly nowMs: number;
  readonly expired: boolean;
}

export type ArrivalDisplayInput =
  | { readonly kind: 'live'; readonly displayAuthority: 'countdown'; readonly at: string }
  | { readonly kind: 'expected'; readonly displayAuthority: 'range'; readonly range: { readonly startsAt: string; readonly endsAt: string } }
  | { readonly kind: 'scheduled'; readonly displayAuthority: 'clock-time'; readonly at: string }
  | { readonly kind: 'holding'; readonly displayAuthority: 'status-only' }
  | { readonly kind: 'uncertain'; readonly displayAuthority: 'status-only' };

export function createBoardClockAnchor(
  serverTime: string,
  validThrough: string,
  receivedAtMonotonicMs = performance.now(),
): BoardClockAnchor {
  const serverTimeMs = parseIso(serverTime);
  const validThroughMs = parseIso(validThrough);
  if (!Number.isFinite(receivedAtMonotonicMs) || receivedAtMonotonicMs < 0 || validThroughMs < serverTimeMs) {
    throw new Error('Invalid board clock anchor');
  }
  return Object.freeze({ serverTimeMs, validThroughMs, receivedAtMonotonicMs });
}

export function readBoardClock(anchor: BoardClockAnchor, monotonicNow = performance.now()): BoardClockReading {
  if (!Number.isFinite(monotonicNow) || monotonicNow < 0) throw new Error('Invalid monotonic time');
  const nowMs = anchor.serverTimeMs + Math.max(0, monotonicNow - anchor.receivedAtMonotonicMs);
  return Object.freeze({ nowMs, expired: nowMs > anchor.validThroughMs });
}

export function useBoardClock(
  serverTime: string,
  validThrough: string,
  monotonicNow: () => number = readPerformanceNow,
  receivedAtMonotonicMs?: number,
  running = true,
): BoardClockReading {
  const anchor = useMemo(
    () => createBoardClockAnchor(serverTime, validThrough, receivedAtMonotonicMs ?? monotonicNow()),
    [serverTime, validThrough, monotonicNow, receivedAtMonotonicMs],
  );
  const [reading, setReading] = useState(() => readBoardClock(anchor, monotonicNow()));

  useEffect(() => {
    if (!running) return undefined;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      if (!active) return;
      const next = readBoardClock(anchor, monotonicNow());
      setReading(next);
      if (next.expired) return;
      const remaining = anchor.validThroughMs - next.nowMs;
      timer = setTimeout(tick, Math.max(1, Math.min(1_000, Math.floor(remaining) + 1)));
    };
    tick();
    return () => {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [anchor, monotonicNow, running]);

  return reading;
}

export function formatArrivalDisplay(input: ArrivalDisplayInput, reading: BoardClockReading): string {
  if (input.displayAuthority === 'status-only') return input.kind === 'holding' ? 'Holding' : 'Uncertain';
  if (reading.expired) return 'Refresh';
  if (input.displayAuthority === 'countdown') return relativeMinute(parseIso(input.at) - reading.nowMs);
  if (input.displayAuthority === 'range') {
    const start = relativeMinuteValue(parseIso(input.range.startsAt) - reading.nowMs);
    const end = relativeMinuteValue(parseIso(input.range.endsAt) - reading.nowMs);
    return start === end ? `${start} min` : `${start}–${end} min`;
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(parseIso(input.at));
}

function relativeMinute(milliseconds: number): string {
  const value = relativeMinuteValue(milliseconds);
  return value === 0 ? 'Due' : `${value} min`;
}

function relativeMinuteValue(milliseconds: number): number {
  return Math.max(0, Math.ceil(milliseconds / 60_000));
}

function parseIso(value: string): number {
  if (typeof value !== 'string') throw new Error('Invalid board time');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw new Error('Invalid board time');
  return date.getTime();
}
