import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';

import {
  createBoardClockAnchor,
  formatArrivalDisplay,
  readBoardClock,
  useBoardClock,
} from '../../src/client/hooks/use-board-clock';

describe('response-anchored board clock', () => {
  test('uses monotonic elapsed time and expires strictly after validThrough', () => {
    const anchor = createBoardClockAnchor(
      '2026-08-04T12:00:00.000Z',
      '2026-08-04T12:01:30.000Z',
      250,
    );

    expect(readBoardClock(anchor, 90_250)).toEqual({
      nowMs: Date.parse('2026-08-04T12:01:30.000Z'), expired: false,
    });
    expect(readBoardClock(anchor, 90_250.001)).toEqual({
      nowMs: Date.parse('2026-08-04T12:01:30.000Z') + 0.001, expired: true,
    });
  });

  test('obeys each display authority without consulting the device wall clock', () => {
    const wallClock = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('device wall clock must not be read');
    });
    const reading = { nowMs: Date.parse('2026-08-04T12:00:00.000Z'), expired: false };

    expect(formatArrivalDisplay({
      kind: 'live', displayAuthority: 'countdown', at: '2026-08-04T12:03:00.000Z',
    }, reading)).toBe('3 min');
    expect(formatArrivalDisplay({
      kind: 'expected', displayAuthority: 'range',
      range: { startsAt: '2026-08-04T12:05:00.000Z', endsAt: '2026-08-04T12:07:00.000Z' },
    }, reading)).toBe('5–7 min');
    expect(formatArrivalDisplay({
      kind: 'scheduled', displayAuthority: 'clock-time', at: '2026-08-04T12:08:00.000Z',
    }, reading)).toBe('8:08 AM');
    expect(formatArrivalDisplay({ kind: 'holding', displayAuthority: 'status-only' }, reading)).toBe('Holding');
    expect(formatArrivalDisplay({ kind: 'uncertain', displayAuthority: 'status-only' }, reading)).toBe('Uncertain');
    wallClock.mockRestore();
  });

  test('removes precision after validity expires and never turns Holding into a countdown', () => {
    const expired = { nowMs: Date.parse('2026-08-04T12:01:30.001Z'), expired: true };
    expect(formatArrivalDisplay({
      kind: 'live', displayAuthority: 'countdown', at: '2026-08-04T12:03:00.000Z',
    }, expired)).toBe('Refresh');
    expect(formatArrivalDisplay({ kind: 'holding', displayAuthority: 'status-only' }, expired)).toBe('Holding');
  });

  test('keeps its response anchor stable across the hook own state update', () => {
    let renders = 0;
    function Harness() {
      renders += 1;
      if (renders > 8) throw new Error('board clock render loop');
      useBoardClock('2026-08-04T12:00:00.000Z', '2026-08-04T12:01:30.000Z');
      return null;
    }

    render(createElement(Harness));
    expect(renders).toBeLessThanOrEqual(2);
  });

  test('honors a monotonic receipt captured before the board enters the render queue', () => {
    let reading: { readonly nowMs: number } | undefined;
    const monotonicNow = () => 2_000;
    function Harness() {
      reading = (useBoardClock as unknown as (
        serverTime: string,
        validThrough: string,
        clock: () => number,
        receivedAtMonotonicMs: number,
      ) => { readonly nowMs: number })(
        '2026-08-04T12:00:00.000Z',
        '2026-08-04T12:01:30.000Z',
        monotonicNow,
        1_000,
      );
      return null;
    }

    render(createElement(Harness));
    expect(reading?.nowMs).toBe(Date.parse('2026-08-04T12:00:01.000Z'));
  });
});
