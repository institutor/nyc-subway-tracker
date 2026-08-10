import { compareCanonicalIdentity, normalizeBoundedIdentity } from './canonical';
import {
  newYorkCalendarDate,
  serviceDateTimeToInstant,
  type CalendarDate,
} from './clock';
import type { CommuteStage, Direction } from './types';

export type CommuteLifecycle = 'active' | 'paused' | 'expired';
export type CommuteWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CommuteTransitScope {
  readonly routeId: string;
  readonly direction: Exclude<Direction, 'unknown'>;
  readonly actualDestination: string;
  readonly originStationId: string;
  readonly destinationStationId: string;
  readonly segmentStationIds: readonly string[];
}

export interface CommuteRuntimeWindow {
  readonly id: string;
  readonly savedRecordId: string;
  readonly lifecycle: CommuteLifecycle;
  readonly weekdays: readonly CommuteWeekday[];
  readonly startsAt: string;
  readonly endsAt: string;
  readonly preparationLeadMinutes: number;
  readonly stage: CommuteStage;
  readonly notificationEnabled: boolean;
  readonly scope: CommuteTransitScope;
}

export interface WatchingCommuteOccurrence {
  readonly kind: 'watching';
  readonly occurrenceId: string;
  readonly localStartDate: CalendarDate;
  readonly localEndDate: CalendarDate;
  readonly opensAt: Date;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export type CommuteOccurrenceDecision = WatchingCommuteOccurrence | { readonly kind: 'outside-window' };

export function createCommuteRuntimeWindow(input: CommuteRuntimeWindow): CommuteRuntimeWindow {
  if (!Array.isArray(input.weekdays) || input.weekdays.length < 1 || input.weekdays.length > 7) invalid('weekdays');
  const weekdays = [...input.weekdays];
  if (weekdays.some((value) => !Number.isSafeInteger(value) || value < 1 || value > 7)
    || new Set(weekdays).size !== weekdays.length) invalid('weekdays');
  const startsAt = clockTime(input.startsAt);
  const endsAt = clockTime(input.endsAt);
  if (startsAt === endsAt) invalid('equal window');
  if (!Number.isSafeInteger(input.preparationLeadMinutes) || input.preparationLeadMinutes < 0) invalid('lead time');
  if (!['active', 'paused', 'expired'].includes(input.lifecycle)) invalid('lifecycle');
  if (!['disabled', 'deterministic-test', 'silent-evaluation', 'pilot', 'delivery'].includes(input.stage)) invalid('stage');
  if (typeof input.notificationEnabled !== 'boolean') invalid('notification setting');
  const scope = captureScope(input.scope);
  return deepFreeze({
    id: normalizeBoundedIdentity(input.id, 'commute window'),
    savedRecordId: normalizeBoundedIdentity(input.savedRecordId, 'saved record'),
    lifecycle: input.lifecycle,
    weekdays: weekdays.sort((left, right) => left - right),
    startsAt,
    endsAt,
    preparationLeadMinutes: input.preparationLeadMinutes,
    stage: input.stage,
    notificationEnabled: input.notificationEnabled,
    scope,
  });
}

export function resolveCommuteOccurrence(window: CommuteRuntimeWindow, at: Date): CommuteOccurrenceDecision {
  if (window.lifecycle !== 'active' || !window.notificationEnabled || !Number.isFinite(at.getTime())) {
    return { kind: 'outside-window' };
  }

  const possibleStartDates = candidateStartDates(window, at);
  const watching: WatchingCommuteOccurrence[] = [];
  for (const localStartDate of possibleStartDates) {
    if (!window.weekdays.includes(weekday(localStartDate))) continue;
    const localEndDate = isOvernight(window.startsAt, window.endsAt)
      ? addCalendarDays(localStartDate, 1)
      : localStartDate;
    try {
      const startsAt = serviceDateTimeToInstant(localStartDate, `${window.startsAt}:00`, 'earlier');
      const endsAt = serviceDateTimeToInstant(localEndDate, `${window.endsAt}:00`, 'later');
      const opensAt = new Date(startsAt.getTime() - window.preparationLeadMinutes * 60_000);
      if (at.getTime() >= opensAt.getTime() && at.getTime() < endsAt.getTime()) {
        watching.push({
          kind: 'watching',
          occurrenceId: `${window.id}:${localStartDate}`,
          localStartDate,
          localEndDate,
          opensAt,
          startsAt,
          endsAt,
        });
      }
    } catch {
      // A nonexistent New York wall-time endpoint creates no occurrence.
    }
  }
  if (watching.length === 0) return { kind: 'outside-window' };
  watching.sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime());
  return deepFreeze(watching[0]);
}

function candidateStartDates(window: CommuteRuntimeWindow, at: Date): CalendarDate[] {
  const today = newYorkCalendarDate(at);
  const latestStartDate = newYorkCalendarDate(new Date(at.getTime() + window.preparationLeadMinutes * 60_000));
  const candidates = new Set<CalendarDate>();
  for (const anchor of [today, latestStartDate]) {
    for (let offset = -8; offset <= 1; offset += 1) candidates.add(addCalendarDays(anchor, offset));
  }
  return [...candidates];
}

function captureScope(value: CommuteTransitScope): CommuteTransitScope {
  if (!value || typeof value !== 'object') invalid('scope');
  if (!['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(value.direction)) {
    invalid('direction');
  }
  const routeId = normalizeBoundedIdentity(value.routeId, 'route');
  const originStationId = normalizeBoundedIdentity(value.originStationId, 'origin station');
  const destinationStationId = normalizeBoundedIdentity(value.destinationStationId, 'destination station');
  if (originStationId === destinationStationId) invalid('journey');
  if (typeof value.actualDestination !== 'string' || !value.actualDestination.trim()) invalid('actual destination');
  if (!Array.isArray(value.segmentStationIds) || value.segmentStationIds.length < 2 || value.segmentStationIds.length > 512) invalid('segment');
  const segmentStationIds = value.segmentStationIds.map((id) => normalizeBoundedIdentity(id, 'segment station'));
  if (new Set(segmentStationIds).size !== segmentStationIds.length
    || !segmentStationIds.includes(originStationId) || !segmentStationIds.includes(destinationStationId)) invalid('segment');
  return {
    routeId,
    direction: value.direction,
    actualDestination: value.actualDestination.normalize('NFC').trim(),
    originStationId,
    destinationStationId,
    segmentStationIds: [...segmentStationIds].sort(compareCanonicalIdentity),
  };
}

function clockTime(value: string): string {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(value)) invalid('clock time');
  return value;
}

function isOvernight(start: string, end: string): boolean {
  return end < start;
}

function weekday(date: CalendarDate): CommuteWeekday {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (value === 0 ? 7 : value) as CommuteWeekday;
}

function addCalendarDays(date: CalendarDate, offset: number): CalendarDate {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + offset));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}` as CalendarDate;
}

function invalid(label: string): never {
  throw new Error(`Invalid commute ${label}`);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
