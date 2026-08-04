import { describe, expect, test } from 'vitest';

import {
  compareInstants,
  createFixedClock,
  newYorkCalendarDate,
  parseGtfsTime,
  parseServiceDate,
  serviceDateTimeToInstant,
} from '../../src/shared/domain/clock';

describe('New York transit time', () => {
  test('uses the New York calendar date for service chronology', () => {
    const instant = new Date('2026-01-01T04:30:00.000Z');

    expect(newYorkCalendarDate(instant)).toBe('2025-12-31');
    expect(createFixedClock(instant).now()).toEqual(instant);
  });

  test('keeps an after-midnight GTFS time on its source service date', () => {
    expect(parseGtfsTime('25:10:00')).toEqual({ dayOffset: 1, hour: 1, minute: 10, second: 0 });
    expect(serviceDateTimeToInstant('2026-08-03', '25:10:00').toISOString()).toBe(
      '2026-08-04T05:10:00.000Z',
    );
  });

  test('compares repeated DST wall times by their instants', () => {
    const firstFold = new Date('2026-11-01T01:30:00-04:00');
    const secondFold = new Date('2026-11-01T01:30:00-05:00');

    expect(compareInstants(firstFold, secondFold)).toBeLessThan(0);
  });

  test('uses chronological DST fold disambiguation when resolving a local service time', () => {
    expect(serviceDateTimeToInstant('2026-11-01', '01:30:00', 'earlier').toISOString()).toBe(
      '2026-11-01T05:30:00.000Z',
    );
    expect(serviceDateTimeToInstant('2026-11-01', '01:30:00', 'later').toISOString()).toBe(
      '2026-11-01T06:30:00.000Z',
    );
  });

  test('does not relabel a source-owned service date from its New York wall clock', () => {
    const TuesdayAfterMondayService = new Date('2026-08-04T05:10:00.000Z');
    const MondaySourceServiceDate = parseServiceDate('2026-08-03');

    expect(MondaySourceServiceDate).toBe('2026-08-03');
    expect(newYorkCalendarDate(TuesdayAfterMondayService)).toBe('2026-08-04');
  });

  test.each(['2026-02-29', '2026-02-30', '2026-13-01'])('rejects invalid Gregorian service date %s', (date) => {
    expect(() => serviceDateTimeToInstant(date, '01:00:00')).toThrow(
      'Invalid service date',
    );
  });
});
