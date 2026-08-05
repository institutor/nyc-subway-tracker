import { describe, expect, test } from 'vitest';

import { promoteSavedStations, type SavedPromotionCandidate } from '../../src/shared/domain/saved-ranking';
import type { SavedRecord } from '../../src/shared/domain/types';

const candidate = (id: string): SavedPromotionCandidate => ({
  complexId: id,
  constituentId: `${id}-constituent`,
  directions: [{ routeId: 'A', direction: 'northbound', actualDestination: `${id} terminal` }],
});

const saved = (id: string, overrides: Partial<SavedRecord> = {}): SavedRecord => ({
  id: `saved-${id}`,
  complexId: id,
  constituentId: `${id}-constituent`,
  routeFilters: [],
  accessibleRouteOnly: false,
  state: 'active',
  ...overrides,
});

describe('SAVE-O01 saved promotion', () => {
  test.each([
    [saved('D'), saved('C'), saved('B')],
    [saved('B'), saved('D'), saved('C')],
    [saved('C'), saved('B'), saved('D')],
  ])('always forms the B,C cohort inside baseline A,B,C and never promotes rank-four D', (...records) => {
    const result = promoteSavedStations(
      ['A', 'B', 'C', 'D'].map(candidate),
      records,
      new Date('2026-08-04T12:30:00.000Z'),
    );
    expect(result.map(({ complexId }) => complexId)).toEqual(['B', 'C', 'A']);
  });

  test('preserves baseline order inside both the applicable cohort and its remainder', () => {
    expect(promoteSavedStations(
      ['C', 'A', 'B', 'D'].map(candidate),
      [saved('B'), saved('C')],
      new Date('2026-08-04T12:30:00.000Z'),
    ).map(({ complexId }) => complexId)).toEqual(['C', 'B', 'A']);
  });

  test('requires exact active station, constituent, route, preferred direction, and actual destination scope', () => {
    const records = [
      saved('A', { state: 'paused' }),
      saved('B', { id: 'saved-wrong-constituent', constituentId: 'wrong' }),
      saved('C', { routeFilters: ['Z'] }),
    ];
    const scoped = saved('B', {
      preferredRide: { direction: 'northbound', actualDestination: 'B terminal' },
      preferredEntrance: { entranceId: 'B-entrance', direction: 'northbound' },
      routeFilters: ['A'],
    });
    expect(promoteSavedStations(
      ['A', 'B', 'C'].map(candidate),
      [...records, scoped],
      new Date('2026-08-04T12:30:00.000Z'),
    ).map(({ complexId }) => complexId)).toEqual(['B', 'A', 'C']);
  });

  test('uses half-open New York windows with ISO weekdays and overnight ownership by start weekday', () => {
    const weekday = saved('B', { timeWindow: { weekdays: [2], startsAt: '08:00', endsAt: '09:00' } });
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [weekday], new Date('2026-08-04T11:59:59.999Z'))[0].complexId).toBe('A');
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [weekday], new Date('2026-08-04T12:00:00.000Z'))[0].complexId).toBe('B');
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [weekday], new Date('2026-08-04T13:00:00.000Z'))[0].complexId).toBe('A');

    const overnight = saved('C', { timeWindow: { weekdays: [5], startsAt: '23:30', endsAt: '01:00' } });
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [overnight], new Date('2026-08-08T04:30:00.000Z'))[0].complexId).toBe('C');
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [overnight], new Date('2026-08-09T04:30:00.000Z'))[0].complexId).toBe('A');
  });

  test('evaluates repeated and skipped DST wall times without instant-duration arithmetic', () => {
    const fall = saved('B', { timeWindow: { weekdays: [7], startsAt: '01:00', endsAt: '02:00' } });
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [fall], new Date('2026-11-01T05:30:00.000Z'))[0].complexId).toBe('B');
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [fall], new Date('2026-11-01T06:30:00.000Z'))[0].complexId).toBe('B');

    const spring = saved('C', { timeWindow: { weekdays: [7], startsAt: '01:30', endsAt: '03:30' } });
    expect(promoteSavedStations(['A', 'B', 'C'].map(candidate), [spring], new Date('2026-03-08T07:15:00.000Z'))[0].complexId).toBe('C');
  });

  test.each([
    { weekdays: [0], startsAt: '08:00', endsAt: '09:00' },
    { weekdays: [1, 1], startsAt: '08:00', endsAt: '09:00' },
    { weekdays: [1], startsAt: '8:00', endsAt: '09:00' },
    { weekdays: [1], startsAt: '08:00', endsAt: '08:00' },
  ])('rejects invalid or equal local windows %#', (timeWindow) => {
    expect(() => promoteSavedStations(
      ['A', 'B', 'C'].map(candidate),
      [saved('B', { timeWindow })],
      new Date('2026-08-04T12:30:00.000Z'),
    )).toThrow(/time window|weekday/i);
  });

  test('returns detached frozen baseline records without mutating caller order', () => {
    const baseline = ['A', 'B', 'C', 'D'].map(candidate);
    const before = structuredClone(baseline);
    const result = promoteSavedStations(baseline, [saved('B')], new Date('2026-08-04T12:30:00.000Z'));
    (baseline[1].directions[0] as { actualDestination: string }).actualDestination = 'mutated';
    expect(baseline.map(({ complexId }) => complexId)).toEqual(before.map(({ complexId }) => complexId));
    expect(result[0].directions[0].actualDestination).toBe('B terminal');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0].directions)).toBe(true);
  });
});
