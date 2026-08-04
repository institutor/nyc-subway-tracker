export const NEW_YORK_TIME_ZONE = 'America/New_York';

declare const serviceDateBrand: unique symbol;

/** A validated operating date supplied by the source, never inferred from a display instant. */
export type ServiceDate = string & { readonly [serviceDateBrand]: 'ServiceDate' };
export type CalendarDate = `${number}-${number}-${number}`;

export interface Clock {
  now(): Date;
}

export interface GtfsTime {
  dayOffset: number;
  hour: number;
  minute: number;
  second: number;
}

export type LocalTimeDisambiguation = 'earlier' | 'later' | 'reject';

const newYorkFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NEW_YORK_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export const systemClock: Clock = {
  now: () => new Date(),
};

export function createFixedClock(instant: Date): Clock {
  const fixedInstant = new Date(instant.getTime());
  return { now: () => new Date(fixedInstant.getTime()) };
}

export function compareInstants(left: Date, right: Date): number {
  return left.getTime() - right.getTime();
}

export function newYorkCalendarDate(instant: Date): CalendarDate {
  const parts = newYorkParts(instant);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}` as CalendarDate;
}

export function parseServiceDate(value: string): ServiceDate {
  const date = parseGregorianDate(value);
  if (!date) throw new Error(`Invalid service date: ${value}`);
  return value as ServiceDate;
}

export function parseGtfsTime(value: string): GtfsTime {
  const match = /^(\d+):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid GTFS time: ${value}`);

  const totalHour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3]);
  if (minute > 59 || second > 59) throw new Error(`Invalid GTFS time: ${value}`);

  return {
    dayOffset: Math.floor(totalHour / 24),
    hour: totalHour % 24,
    minute,
    second,
  };
}

/** Converts a service-date GTFS clock value to an absolute New York instant. */
export function serviceDateTimeToInstant(
  sourceServiceDate: ServiceDate | string,
  gtfsTime: string,
  disambiguation: LocalTimeDisambiguation = 'earlier',
): Date {
  const serviceDate = parseServiceDate(sourceServiceDate);
  const date = parseGregorianDate(serviceDate);
  if (!date) throw new Error(`Invalid service date: ${sourceServiceDate}`);

  const parsed = parseGtfsTime(gtfsTime);
  const year = date.year;
  const month = date.month;
  const day = date.day + parsed.dayOffset;
  const wallTimeAsUtc = Date.UTC(year, month - 1, day, parsed.hour, parsed.minute, parsed.second);
  const matches = [-5, -4]
    .map((offsetHours) => new Date(wallTimeAsUtc - offsetHours * 60 * 60 * 1000))
    .filter((candidate) => sameNewYorkWallTime(candidate, year, month, day, parsed));

  if (matches.length === 0) {
    throw new Error(`Nonexistent New York local time: ${serviceDate} ${gtfsTime}`);
  }
  if (matches.length > 1 && disambiguation === 'reject') {
    throw new Error(`Ambiguous New York local time: ${serviceDate} ${gtfsTime}`);
  }

  matches.sort(compareInstants);
  return matches[disambiguation === 'later' ? matches.length - 1 : 0];
}

function parseGregorianDate(value: string): { year: number; month: number; day: number } | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    return undefined;
  }
  return { year, month, day };
}

function newYorkParts(instant: Date) {
  const values = Object.fromEntries(
    newYorkFormatter.formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;
  return values;
}

function sameNewYorkWallTime(candidate: Date, year: number, month: number, day: number, time: GtfsTime): boolean {
  const actual = newYorkParts(candidate);
  const expectedDate = new Date(Date.UTC(year, month - 1, day));
  return actual.year === expectedDate.getUTCFullYear()
    && actual.month === expectedDate.getUTCMonth() + 1
    && actual.day === expectedDate.getUTCDate()
    && actual.hour === time.hour
    && actual.minute === time.minute
    && actual.second === time.second;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
