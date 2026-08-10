export interface StaticServiceCalendarData {
  readonly calendars: readonly {
    readonly serviceId: string;
    readonly weekdays: readonly boolean[];
    readonly startDate: string;
    readonly endDate: string;
  }[];
  readonly calendarDates: readonly {
    readonly serviceId: string;
    readonly date: string;
    readonly exceptionType: 1 | 2;
  }[];
}

/** Browser-safe schedule calendar evaluation shared by fallback and GTFS ingestion. */
export function isServiceActive(
  data: StaticServiceCalendarData,
  serviceId: string,
  serviceDate: string,
): boolean {
  assertServiceDate(serviceDate);
  const exceptions = data.calendarDates.filter(
    (row) => row.serviceId === serviceId && row.date === serviceDate,
  );
  if (exceptions.length > 1) {
    throw new Error(`Duplicate GTFS calendar_dates service_id,date: ${serviceId},${serviceDate}`);
  }
  const exception = exceptions[0];
  if (exception) return exception.exceptionType === 1;
  const calendars = data.calendars.filter((row) => row.serviceId === serviceId);
  if (calendars.length > 1) {
    throw new Error(`Duplicate GTFS calendar service_id: ${serviceId}`);
  }
  const calendar = calendars[0];
  if (!calendar || serviceDate < calendar.startDate || serviceDate > calendar.endDate) return false;
  const date = serviceDateToUtcDate(serviceDate);
  const mondayIndex = (date.getUTCDay() + 6) % 7;
  return calendar.weekdays[mondayIndex];
}

/** Browser-safe GTFS service clock conversion with explicit DST ambiguity rejection. */
export function serviceTimeToInstant(
  serviceDate: string,
  serviceTime: string,
  timeZone = 'America/New_York',
): Date {
  assertServiceDate(serviceDate);
  const seconds = parseServiceTime(serviceTime);
  const base = serviceDateToUtcDate(serviceDate);
  base.setUTCSeconds(base.getUTCSeconds() + seconds);
  const wanted = {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
    hour: base.getUTCHours(),
    minute: base.getUTCMinutes(),
    second: base.getUTCSeconds(),
  };
  const approximate = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute, wanted.second);
  const candidates: number[] = [];
  for (let offsetMinutes = -14 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 15) {
    const instant = approximate - offsetMinutes * 60_000;
    if (sameZonedParts(instant, timeZone, wanted)) candidates.push(instant);
  }
  if (candidates.length !== 1) {
    throw new Error(
      candidates.length === 0
        ? `GTFS service time does not map to a real ${timeZone} instant`
        : `GTFS service time is ambiguous in ${timeZone}`,
    );
  }
  return new Date(candidates[0]);
}

function parseServiceTime(value: string): number {
  const match = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`GTFS service time is required: ${value}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (minutes > 59 || seconds > 59) throw new Error(`Invalid GTFS time: ${value}`);
  return hours * 3600 + minutes * 60 + seconds;
}

function assertServiceDate(value: string): void {
  if (!/^\d{8}$/.test(value)) throw new Error(`Invalid GTFS service date: ${value}`);
  const date = serviceDateToUtcDate(value);
  const reconstructed = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
  if (reconstructed !== value) throw new Error(`Invalid GTFS service date: ${value}`);
}

function serviceDateToUtcDate(value: string): Date {
  return new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8))));
}

function sameZonedParts(
  instant: number,
  timeZone: string,
  wanted: Readonly<{ year: number; month: number; day: number; hour: number; minute: number; second: number }>,
): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const actual = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]),
  );
  return actual.year === wanted.year
    && actual.month === wanted.month
    && actual.day === wanted.day
    && actual.hour === wanted.hour
    && actual.minute === wanted.minute
    && actual.second === wanted.second;
}
