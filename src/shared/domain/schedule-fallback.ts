import { compareCanonicalIdentity } from './canonical';
import { parseServiceDate } from './clock';
import type { PublicRouteOrderKind } from './arrival-order';
import type { ScheduleEditionRegistry, ScheduleCurrencyState } from './schedule-owner';
import type { Direction, Provenance, ScheduledArrival } from './types';
import {
  isServiceActive,
  serviceTimeToInstant,
  type NormalizedStaticGtfs,
  type StaticScheduleSource,
  type StopTimeRecord,
  type TripRecord,
} from '../../server/gtfs/static-normalizer';

export interface ScheduleFallbackFeedDecision {
  readonly feedGroupId: string;
  readonly kind: 'current' | 'degraded' | 'unavailable';
  readonly fallbackEligibility: 'blocked' | 'eligible';
  readonly presentation: 'live' | 'frozen-last-good' | 'none';
}

export interface ScheduleFallbackScope {
  readonly feedGroupId: string;
  readonly exactStopId: string;
  readonly direction: Direction;
  readonly operationalAxis: string;
  readonly comparisonAt: Date;
  readonly serviceDates: readonly string[];
  readonly routeIds: readonly string[];
  readonly routeServiceDates?: readonly Readonly<{ readonly routeId: string; readonly serviceDate: string }>[];
}

export interface ScheduledClaimContext {
  readonly occurrenceId: string;
  readonly tripId: string;
  readonly routeId: string;
  readonly stopId: string;
  readonly direction: Direction;
  readonly serviceDate: string;
  readonly at: Date;
}

export type ScheduledClaimDisposition = 'eligible' | 'resolved-ineligible' | 'high-impact-unresolved' | 'quarantined';
export type FallbackRecoveryDisposition = 'none' | 'precision-withheld' | 'hard-suppressed' | 'live-readmission-eligible';

export interface ScheduleFallbackInput {
  readonly feedDecision: ScheduleFallbackFeedDecision;
  readonly scope: ScheduleFallbackScope;
  readonly registry: ScheduleEditionRegistry;
  readonly claimDisposition?: (claim: ScheduledClaimContext) => ScheduledClaimDisposition;
  readonly recoveryDisposition?: (claim: ScheduledClaimContext) => FallbackRecoveryDisposition;
}

export interface ScheduledFallbackRow {
  readonly occurrenceId: string;
  readonly source: StaticScheduleSource;
  readonly currency: ScheduleCurrencyState;
  readonly arrival: ScheduledArrival;
}

export interface ScheduledFallbackExclusion {
  readonly occurrenceId: string;
  readonly disposition: Exclude<ScheduledClaimDisposition, 'eligible'> | Exclude<FallbackRecoveryDisposition, 'none'> | 'conflict'
    | 'ambiguous-service-time' | 'nonexistent-service-time';
}

export interface ScheduleFallbackDecision {
  readonly mode: 'scheduled-fallback' | 'not-eligible';
  readonly source: StaticScheduleSource | 'mixed' | 'none';
  readonly currency?: ScheduleCurrencyState;
  readonly rows: readonly ScheduledFallbackRow[];
  readonly exclusions: readonly ScheduledFallbackExclusion[];
  readonly explanation: 'No additional scheduled departures available.' | 'No scheduled departures available.' | null;
}

interface EnumeratedOccurrenceBase {
  readonly claim: ScheduledClaimContext;
  readonly routeLabel: string;
  readonly routeOrderKind: PublicRouteOrderKind;
  readonly destination: string;
  readonly rowIdentity: string;
}

interface EnumeratedOccurrence extends EnumeratedOccurrenceBase {
  readonly source: StaticScheduleSource;
  readonly currency: ScheduleCurrencyState;
  readonly sourceId: string;
  readonly sourceObservedAt: Date;
  readonly sourceRetrievedAt: Date;
}

export function buildScheduleFallback(input: ScheduleFallbackInput): ScheduleFallbackDecision {
  validateInput(input);
  if (input.feedDecision.feedGroupId !== input.scope.feedGroupId
    || input.feedDecision.kind !== 'unavailable'
    || input.feedDecision.fallbackEligibility !== 'eligible'
    || input.feedDecision.presentation !== 'none') {
    return frozenDecision('not-eligible', 'none', [], [], null);
  }

  const editions = input.registry.enumerationEditions();
  if (editions.length === 0) return frozenDecision('scheduled-fallback', 'none', [], [], 'No scheduled departures available.');
  const exclusions: ScheduledFallbackExclusion[] = [];
  const occurrences: EnumeratedOccurrence[] = [];
  type OwnerSelection = NonNullable<ReturnType<ScheduleEditionRegistry['resolveOwner']>>['selection'];
  const tupleOwners = new Map<string, Map<string, OwnerSelection>>();
  const recordTupleOwner = (routeId: string, serviceDate: string, selection: OwnerSelection): void => {
    if (!selection.editionId) return;
    const key = routeServiceDateKey(routeId, serviceDate);
    const owners = tupleOwners.get(key) ?? new Map<string, OwnerSelection>();
    owners.set(selection.editionId, selection);
    tupleOwners.set(key, owners);
  };
  for (const edition of editions) {
    const enumerated = enumerate(edition.candidate.data, edition.candidate.coverage, input.scope);
    exclusions.push(...enumerated.exclusions);
    for (const occurrence of enumerated.occurrences) {
      const owner = input.registry.resolveOwner({
        routeId: occurrence.claim.routeId,
        serviceDate: occurrence.claim.serviceDate,
        at: occurrence.claim.at.toISOString(),
        direction: occurrence.claim.direction,
        operationalAxis: input.scope.operationalAxis,
        occurrenceId: occurrence.claim.tripId,
        stopId: occurrence.claim.stopId,
        stopTimeOccurrenceId: occurrence.rowIdentity,
      }, input.scope.comparisonAt);
      if (!owner?.selection.editionId || !owner.selection.currency) continue;
      recordTupleOwner(occurrence.claim.routeId, occurrence.claim.serviceDate, owner.selection);
      if (owner.selection.editionId !== edition.editionId
        || owner.selection.currency === 'topology' || owner.selection.currency === 'quarantined') continue;
      const source: StaticScheduleSource = owner.selection.source as StaticScheduleSource;
      const observedAt = new Date(edition.candidate.publishedAt ?? edition.candidate.retrievedAt);
      const retrievedAt = new Date(edition.candidate.retrievedAt);
      occurrences.push(Object.freeze({
        ...occurrence,
        source,
        currency: owner.selection.currency,
        sourceId: owner.selection.editionId,
        sourceObservedAt: observedAt,
        sourceRetrievedAt: retrievedAt,
      }));
    }
  }
  for (const pair of requestedRouteServiceDates(input.scope)) {
    if ((tupleOwners.get(routeServiceDateKey(pair.routeId, pair.serviceDate))?.size ?? 0) > 0) continue;
    const owner = input.registry.resolveOwner({
      ...pair,
      at: input.scope.comparisonAt.toISOString(),
      direction: input.scope.direction,
      operationalAxis: input.scope.operationalAxis,
    }, input.scope.comparisonAt);
    if (owner?.selection.editionId) recordTupleOwner(pair.routeId, pair.serviceDate, owner.selection);
  }
  const eligible: EnumeratedOccurrence[] = [];
  for (const occurrence of occurrences) {
    const disposition = input.claimDisposition?.(freezeClaim(occurrence.claim)) ?? 'eligible';
    validateClaimDisposition(disposition);
    if (disposition !== 'eligible') {
      exclusions.push(Object.freeze({ occurrenceId: occurrence.claim.occurrenceId, disposition }));
      continue;
    }
    const recovery = input.recoveryDisposition?.(freezeClaim(occurrence.claim)) ?? 'none';
    validateRecoveryDisposition(recovery);
    // No token can turn static evidence in an Unavailable feed into a recovery update.
    if (recovery !== 'none') {
      exclusions.push(Object.freeze({ occurrenceId: occurrence.claim.occurrenceId, disposition: recovery }));
      continue;
    }
    eligible.push(occurrence);
  }
  eligible.sort(compareOccurrences);
  const rows = eligible.slice(0, 3).map(toRow);
  const hasScopedConsequence = exclusions.some((item) => item.disposition === 'resolved-ineligible'
    || item.disposition === 'high-impact-unresolved');
  const explanation = rows.length < 3 && !hasScopedConsequence
    ? rows.length === 0 ? 'No scheduled departures available.' as const : 'No additional scheduled departures available.' as const
    : null;
  const distinctExclusions = [...new Map(exclusions.map((item) => [`${item.occurrenceId}\0${item.disposition}`, item])).values()];
  distinctExclusions.sort((left, right) => compareCanonicalIdentity(left.occurrenceId, right.occurrenceId)
    || compareCanonicalIdentity(left.disposition, right.disposition));
  const ownerSelections = [...tupleOwners.values()].flatMap((owners) => [...owners.values()]);
  const sources = [...new Set(ownerSelections.map((owner) => owner.source).filter((source) => source !== 'none'))];
  const currencies = [...new Set(ownerSelections.map((owner) => owner.currency).filter((value) => value !== undefined))];
  const source = sources.length === 0 ? 'none' : sources.length === 1 ? sources[0] : 'mixed';
  return frozenDecision('scheduled-fallback', source, rows, distinctExclusions, explanation,
    currencies.length === 1 ? currencies[0] : undefined);
}

function enumerate(data: NormalizedStaticGtfs, coverage: readonly import('./schedule-owner').ScheduleCoverageMask[], scope: ScheduleFallbackScope): {
  occurrences: EnumeratedOccurrenceBase[];
  exclusions: ScheduledFallbackExclusion[];
} {
  validateStaticData(data);
  const tripById = new Map<string, TripRecord>();
  for (const trip of data.trips) {
    if (tripById.has(trip.tripId)) throw new Error(`Duplicate static trip identity ${trip.tripId}`);
    tripById.set(trip.tripId, trip);
  }
  const routeById = new Map(data.routes.map((route) => [route.routeId, route]));
  const patternByTrip = new Map(data.servicePatterns.map((pattern) => [pattern.tripId, pattern]));
  const grouped = new Map<string, StopTimeRecord[]>();
  for (const stopTime of data.stopTimes) {
    if (stopTime.stopId !== scope.exactStopId) continue;
    const key = `${stopTime.tripId}\0${stopTime.stopSequence}`;
    grouped.set(key, [...(grouped.get(key) ?? []), stopTime]);
  }
  const occurrences: EnumeratedOccurrenceBase[] = [];
  const exclusions: ScheduledFallbackExclusion[] = [];
  for (const { routeId, serviceDate } of requestedRouteServiceDates(scope)) {
    for (const [key, records] of grouped) {
      const trip = tripById.get(records[0].tripId);
      if (!trip || trip.routeId !== routeId || !isServiceActive(data, trip.serviceId, serviceDate)) continue;
      const occurrenceId = `${serviceDate}:${trip.tripId}:${records[0].stopSequence}`;
      const semantic = new Map(records.map((record) => [JSON.stringify({ arrivalTime: record.arrivalTime,
        departureTime: record.departureTime, stopId: record.stopId, stopSequence: record.stopSequence }), record]));
      if (semantic.size > 1) {
        exclusions.push(Object.freeze({ occurrenceId, disposition: 'conflict' }));
        continue;
      }
      const record = [...semantic.values()][0];
      if (record.departureSeconds === null || !record.departureTime) continue;
      const pattern = patternByTrip.get(trip.tripId);
      if (!pattern || pattern.direction !== scope.direction || !pattern.stopIds.includes(scope.exactStopId)
        || !pattern.headsign.trim()) continue;
      let at: Date;
      try {
        at = serviceTimeToInstant(serviceDate, record.departureTime);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const disposition = message.includes('ambiguous') ? 'ambiguous-service-time' as const
          : message.includes('does not map to a real') ? 'nonexistent-service-time' as const : null;
        if (!disposition) throw error;
        exclusions.push(Object.freeze({ occurrenceId, disposition }));
        continue;
      }
      if (at.getTime() <= scope.comparisonAt.getTime()) continue;
      if (!coverage.some((item) => item.routeIds.includes(trip.routeId)
        && item.serviceDates.includes(serviceDate)
        && at.toISOString() >= item.effectiveFrom
        && at.toISOString() <= item.effectiveUntil
        && (item.directions.length === 0 || item.directions.includes(scope.direction))
        && (!item.operationalAxes || item.operationalAxes.length === 0 || item.operationalAxes.includes(scope.operationalAxis)))) continue;
      const route = routeById.get(trip.routeId);
      if (!route) continue;
      occurrences.push(Object.freeze({
        claim: Object.freeze({ occurrenceId, tripId: trip.tripId, routeId: trip.routeId, stopId: record.stopId,
          direction: pattern.direction, serviceDate, at }),
        routeLabel: route.shortName || route.longName || route.routeId,
        routeOrderKind: classifyRoute(route.routeId, route.shortName),
        destination: pattern.headsign,
        rowIdentity: record.rowIdentity || key,
      }));
    }
  }
  return { occurrences, exclusions };
}

function requestedRouteServiceDates(scope: ScheduleFallbackScope): readonly Readonly<{ routeId: string; serviceDate: string }>[] {
  if (scope.routeServiceDates) return scope.routeServiceDates;
  return scope.routeIds.flatMap((routeId) => scope.serviceDates.map((serviceDate) => ({ routeId, serviceDate })));
}

function routeServiceDateKey(routeId: string, serviceDate: string): string {
  return `${routeId}\0${serviceDate}`;
}

function toRow(item: EnumeratedOccurrence): ScheduledFallbackRow {
  const serviceDate = parseServiceDate(`${item.claim.serviceDate.slice(0, 4)}-${item.claim.serviceDate.slice(4, 6)}-${item.claim.serviceDate.slice(6, 8)}`);
  const provenance: Provenance = Object.freeze({ source: item.source, sourceId: item.sourceId,
    observedAt: new Date(item.sourceObservedAt), retrievedAt: new Date(item.sourceRetrievedAt) });
  const arrival: ScheduledArrival = Object.freeze({
    id: item.claim.occurrenceId,
    route: Object.freeze({ id: item.claim.routeId, label: item.routeLabel }),
    direction: item.claim.direction,
    destination: item.destination,
    kind: 'scheduled',
    at: new Date(item.claim.at),
    serviceDate,
    provenance,
  });
  return Object.freeze({ occurrenceId: item.claim.occurrenceId, source: item.source, currency: item.currency, arrival });
}

function compareOccurrences(left: EnumeratedOccurrence, right: EnumeratedOccurrence): number {
  return left.claim.at.getTime() - right.claim.at.getTime()
    || compareRoute(left, right)
    || compareCanonicalIdentity(left.destination, right.destination)
    || compareCanonicalIdentity(left.claim.occurrenceId, right.claim.occurrenceId);
}

function compareRoute(left: EnumeratedOccurrence, right: EnumeratedOccurrence): number {
  const rank = { numbered: 0, lettered: 1, shuttle: 2, other: 3 } as const;
  const category = rank[left.routeOrderKind] - rank[right.routeOrderKind];
  if (category) return category;
  if (left.routeOrderKind === 'numbered') {
    const numeric = Number(left.claim.routeId) - Number(right.claim.routeId);
    if (numeric) return numeric;
  }
  return compareCanonicalIdentity(left.routeLabel, right.routeLabel);
}

function classifyRoute(routeId: string, shortName: string): PublicRouteOrderKind {
  if (/^\d+$/.test(shortName || routeId)) return 'numbered';
  if (/^[A-Z]+$/.test(shortName || routeId) && (shortName || routeId) !== 'S') return 'lettered';
  if ((shortName || routeId) === 'S' || /shuttle/i.test(shortName)) return 'shuttle';
  return 'other';
}

function validateInput(input: ScheduleFallbackInput): void {
  if (!input || typeof input !== 'object' || !input.registry || !input.feedDecision || !input.scope) {
    throw new Error('Schedule fallback input is required');
  }
  const scope = input.scope;
  if (!scope.feedGroupId || !scope.exactStopId || !scope.operationalAxis || !isResolvedDirection(scope.direction)
    || !Array.isArray(scope.routeIds) || scope.routeIds.length === 0 || scope.routeIds.some((routeId) => !routeId)
    || !Array.isArray(scope.serviceDates) || scope.serviceDates.length === 0) throw new Error('Exact schedule fallback scope is required');
  validDate(scope.comparisonAt, 'fallback comparison instant');
  for (const date of scope.serviceDates) if (!/^\d{8}$/.test(date)) throw new Error('Invalid fallback service date');
  if (scope.routeServiceDates === undefined && scope.routeIds.length > 1 && scope.serviceDates.length > 1) {
    throw new Error('Explicit route/service-date tuples are required for an ambiguous fallback scope');
  }
  if (!['current', 'degraded', 'unavailable'].includes(input.feedDecision.kind)
    || !['blocked', 'eligible'].includes(input.feedDecision.fallbackEligibility)
    || !['live', 'frozen-last-good', 'none'].includes(input.feedDecision.presentation)
    || !input.feedDecision.feedGroupId) throw new Error('Invalid fallback feed decision');
  if (input.claimDisposition !== undefined && typeof input.claimDisposition !== 'function') throw new Error('Invalid fallback claim callback');
  if (input.recoveryDisposition !== undefined && typeof input.recoveryDisposition !== 'function') throw new Error('Invalid fallback recovery callback');
  if (scope.routeServiceDates !== undefined) {
    if (!Array.isArray(scope.routeServiceDates) || scope.routeServiceDates.length === 0) throw new Error('Invalid route/service-date scope');
    const seen = new Set<string>();
    for (const pair of scope.routeServiceDates) {
      const key = `${pair?.routeId}\0${pair?.serviceDate}`;
      if (!pair?.routeId || !/^\d{8}$/.test(pair.serviceDate) || !scope.routeIds.includes(pair.routeId)
        || !scope.serviceDates.includes(pair.serviceDate) || seen.has(key)) throw new Error('Invalid route/service-date scope');
      seen.add(key);
    }
  }
  if (input.feedDecision.presentation === 'frozen-last-good' && input.feedDecision.fallbackEligibility === 'eligible') {
    throw new Error('Preserved rows cannot mix with Scheduled fallback');
  }
}

function isResolvedDirection(value: Direction): boolean {
  return ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(value);
}

function validateStaticData(data: NormalizedStaticGtfs): void {
  for (const name of ['routes', 'trips', 'stopTimes', 'calendars', 'calendarDates', 'servicePatterns'] as const) {
    if (!Array.isArray(data[name])) throw new Error(`Invalid static schedule ${name}`);
  }
}

function validateClaimDisposition(value: string): asserts value is ScheduledClaimDisposition {
  if (!['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(value)) {
    throw new Error('Invalid scheduled claim disposition');
  }
}

function validateRecoveryDisposition(value: string): asserts value is FallbackRecoveryDisposition {
  if (!['none', 'precision-withheld', 'hard-suppressed', 'live-readmission-eligible'].includes(value)) {
    throw new Error('Invalid fallback recovery disposition');
  }
}

function freezeClaim(claim: ScheduledClaimContext): ScheduledClaimContext {
  return Object.freeze({ ...claim, at: new Date(claim.at) });
}

function frozenDecision(
  mode: ScheduleFallbackDecision['mode'], source: ScheduleFallbackDecision['source'], rows: ScheduledFallbackRow[],
  exclusions: ScheduledFallbackExclusion[], explanation: ScheduleFallbackDecision['explanation'], currency?: ScheduleCurrencyState,
): ScheduleFallbackDecision {
  return Object.freeze({ mode, source, ...(currency ? { currency } : {}), rows: Object.freeze(rows),
    exclusions: Object.freeze(exclusions), explanation });
}

function validDate(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
