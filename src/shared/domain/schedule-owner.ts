import type { StaticGtfsEditionCandidate, StaticScheduleSource } from '../../server/gtfs/static-normalizer';
import type { Direction } from './types';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface ScheduleCoverageMask {
  readonly id: string;
  readonly routeIds: readonly string[];
  readonly serviceDates: readonly string[];
  readonly effectiveFrom: string;
  readonly effectiveUntil: string;
  readonly directions: readonly Direction[];
  readonly operationalAxes?: readonly string[];
}

export interface ScheduleClaim {
  readonly routeId: string;
  readonly serviceDate: string;
  readonly at: string;
  readonly direction: Direction;
  readonly operationalAxis?: string;
  readonly occurrenceId?: string;
  readonly stopId?: string;
  readonly stopTimeOccurrenceId?: string;
}

export type ScheduleCurrencyState = 'current' | 'stale' | 'topology' | 'quarantined';

export interface ScheduleAgeClassification {
  readonly state: ScheduleCurrencyState;
  readonly ageMs: number;
}

/** Shared Task 4 age rule for any accepted schedule-edition provenance. */
export function classifyScheduleAge(ageAnchor: Date, comparisonAt: Date): ScheduleAgeClassification {
  const anchorMs = validDate(ageAnchor, 'schedule edition age anchor').getTime();
  const comparisonMs = validDate(comparisonAt, 'authoritative schedule comparison').getTime();
  const ageMs = comparisonMs - anchorMs;
  const state: ScheduleCurrencyState = ageMs < 0
    ? 'quarantined'
    : ageMs <= TWO_HOURS_MS
      ? 'current'
      : ageMs <= TWENTY_FOUR_HOURS_MS
        ? 'stale'
        : 'topology';
  return Object.freeze({ state, ageMs });
}

export interface ScheduleCurrencyDecision {
  readonly state: ScheduleCurrencyState;
  readonly ageAnchorKind: 'published' | 'first-retrieved';
  readonly ageMs: number;
  readonly lastRetrievalAgeMs: number;
  readonly superseded: boolean;
  readonly inCoverage: boolean;
  readonly reason: string;
}

export interface EditionObservationResult {
  readonly status: 'accepted-new' | 'accepted-observation' | 'quarantined';
  readonly editionId?: string;
  readonly reason?: string;
}

export interface ScheduleSelection {
  readonly source: StaticScheduleSource | 'none';
  readonly editionId?: string;
  readonly currency?: ScheduleCurrencyState;
  readonly occurrencePresent?: boolean;
  readonly reason: string;
}

/** The single scope-level positive owner selected before departure enumeration. */
export interface OwnedScheduleEdition {
  readonly selection: ScheduleSelection;
  readonly candidate: StaticGtfsEditionCandidate;
}

export interface FailedScheduleObservation {
  readonly source: StaticScheduleSource;
  readonly retrievedAt: Date | string;
  readonly reason: string;
}

interface StoredEdition {
  readonly editionId: string;
  readonly source: StaticScheduleSource;
  readonly canonicalContentId: string;
  readonly publishedAt?: string;
  readonly firstRetrievedAt: string;
  readonly sourceOrder?: number;
  readonly coverage: readonly ScheduleCoverageMask[];
  readonly candidate: StaticGtfsEditionCandidate;
  readonly ordinal: number;
  retrievals: string[];
  wrappers: readonly Readonly<Record<string, string>>[];
}

export class ScheduleEditionRegistry {
  readonly #editions: StoredEdition[] = [];
  readonly #failed: Array<{ source: StaticScheduleSource; retrievedAt: string; reason: string }> = [];
  #ordinal = 0;

  observe(candidate: StaticGtfsEditionCandidate): EditionObservationResult {
    if (!candidate || typeof candidate !== 'object' || !candidate.canonicalContentId
      || (candidate.source !== 'regular-gtfs' && candidate.source !== 'supplemented-gtfs')) {
      return quarantine('Invalid schedule edition identity');
    }
    const coverageFailure = validateCoverage(candidate.coverage);
    if (coverageFailure) return quarantine(coverageFailure);
    const retrievedAt = exactIso(candidate.retrievedAt, 'schedule retrieval time');
    const existing = this.#editions.find(
      (edition) => edition.source === candidate.source && edition.canonicalContentId === candidate.canonicalContentId,
    );
    if (existing) {
      existing.retrievals = uniqueSorted([...existing.retrievals, retrievedAt]);
      existing.wrappers = Object.freeze([...existing.wrappers, Object.freeze({ ...candidate.wrapper })]);
      return Object.freeze({ status: 'accepted-observation', editionId: existing.editionId });
    }

    const publishedAt = candidate.publishedAt ? exactIso(candidate.publishedAt, 'schedule publication time') : undefined;
    if (publishedAt && publishedAt > retrievedAt) {
      return quarantine('Future publication timestamp cannot anchor a schedule edition');
    }
    if (candidate.sourceOrder !== undefined && (!Number.isSafeInteger(candidate.sourceOrder) || candidate.sourceOrder < 0)) {
      return quarantine('Invalid source-supported chronology');
    }
    const previous = this.#editions.filter((edition) => edition.source === candidate.source);
    const chronologyFailure = validateChangedEditionChronology(
      candidate.source,
      candidate.sourceOrder,
      publishedAt,
      retrievedAt,
      previous,
    );
    if (chronologyFailure) return quarantine(chronologyFailure);

    const editionId = `${candidate.source}:${candidate.canonicalContentId}`;
    const edition: StoredEdition = {
      editionId,
      source: candidate.source,
      canonicalContentId: candidate.canonicalContentId,
      ...(publishedAt ? { publishedAt } : {}),
      firstRetrievedAt: retrievedAt,
      ...(candidate.sourceOrder === undefined ? {} : { sourceOrder: candidate.sourceOrder }),
      coverage: candidate.coverage,
      candidate,
      ordinal: ++this.#ordinal,
      retrievals: [retrievedAt],
      wrappers: [Object.freeze({ ...candidate.wrapper })],
    };
    this.#editions.push(edition);
    return Object.freeze({ status: 'accepted-new', editionId });
  }

  recordFailedObservation(observation: FailedScheduleObservation): void {
    if (!observation.reason) throw new Error('Failed schedule observation reason is required');
    const value =
      observation.retrievedAt instanceof Date
        ? validDate(observation.retrievedAt, 'failed observation retrieval').toISOString()
        : exactIso(observation.retrievedAt, 'failed observation retrieval');
    this.#failed.push(Object.freeze({ source: observation.source, retrievedAt: value, reason: observation.reason }));
  }

  failedObservations(): readonly Readonly<{ source: StaticScheduleSource; retrievedAt: string; reason: string }>[] {
    return Object.freeze([...this.#failed]);
  }

  editions(): readonly Readonly<{
    editionId: string;
    source: StaticScheduleSource;
    canonicalContentId: string;
    publishedAt?: string;
    firstRetrievedAt: string;
    lastRetrievedAt: string;
    retrievals: readonly string[];
    wrappers: readonly Readonly<Record<string, string>>[];
  }>[] {
    return Object.freeze(
      this.#editions.map((edition) =>
        Object.freeze({
          editionId: edition.editionId,
          source: edition.source,
          canonicalContentId: edition.canonicalContentId,
          ...(edition.publishedAt ? { publishedAt: edition.publishedAt } : {}),
          firstRetrievedAt: edition.firstRetrievedAt,
          lastRetrievedAt: edition.retrievals.at(-1)!,
          retrievals: Object.freeze([...edition.retrievals]),
          wrappers: Object.freeze([...edition.wrappers]),
        }),
      ),
    );
  }

  enumerationEditions(): readonly Readonly<{ editionId: string; candidate: StaticGtfsEditionCandidate }>[] {
    return Object.freeze(this.#editions
      .map((edition) => Object.freeze({ editionId: edition.editionId, candidate: edition.candidate }))
      .sort((left, right) => left.editionId.localeCompare(right.editionId)));
  }

  classify(editionId: string, claim: ScheduleClaim, comparisonAt: Date): ScheduleCurrencyDecision {
    const edition = this.#editions.find((candidate) => candidate.editionId === editionId);
    if (!edition) throw new Error(`Unknown schedule edition: ${editionId}`);
    const comparison = validDate(comparisonAt, 'authoritative schedule comparison').getTime();
    validateClaim(claim);
    const anchor = edition.publishedAt ?? edition.firstRetrievedAt;
    const age = classifyScheduleAge(new Date(anchor), new Date(comparison));
    const ageMs = age.ageMs;
    const lastRetrievalAgeMs = comparison - Date.parse(edition.retrievals.at(-1)!);
    const inCoverage = edition.coverage.some((mask) => maskContains(mask, claim));
    const superseded = this.#isSuperseded(edition, claim);
    const ageAnchorKind = edition.publishedAt ? ('published' as const) : ('first-retrieved' as const);

    if (age.state === 'quarantined') {
      return decision('quarantined', 'Edition age is negative', ageAnchorKind, ageMs, lastRetrievalAgeMs, superseded, inCoverage);
    }
    if (!inCoverage) {
      return decision('topology', 'Claim is outside edition coverage', ageAnchorKind, ageMs, lastRetrievalAgeMs, superseded, false);
    }
    if (superseded) {
      return decision('topology', 'Edition is superseded for this claim', ageAnchorKind, ageMs, lastRetrievalAgeMs, true, true);
    }
    if (age.state === 'current') {
      return decision('current', 'Current schedule', ageAnchorKind, ageMs, lastRetrievalAgeMs, false, true);
    }
    if (age.state === 'stale') {
      return decision('stale', 'Stored schedule—service changes may differ', ageAnchorKind, ageMs, lastRetrievalAgeMs, false, true);
    }
    return decision('topology', 'Edition is older than 24 hours', ageAnchorKind, ageMs, lastRetrievalAgeMs, false, true);
  }

  select(claim: ScheduleClaim, comparisonAt: Date): ScheduleSelection {
    validateClaim(claim);
    validDate(comparisonAt, 'authoritative schedule comparison');
    const supplemented = this.#editions
      .filter(
        (edition) =>
          edition.source === 'supplemented-gtfs' && edition.coverage.some((mask) => maskContains(mask, claim)),
      )
      .sort((left, right) => right.ordinal - left.ordinal);
    for (const edition of supplemented) {
      const currency = this.classify(edition.editionId, claim, comparisonAt);
      if (currency.state === 'current' || currency.state === 'stale') return selection(edition, claim, currency.state);
    }

    const regular = this.#editions
      .filter(
        (edition) => edition.source === 'regular-gtfs' && edition.coverage.some((mask) => maskContains(mask, claim)),
      )
      .sort((left, right) => right.ordinal - left.ordinal);
    for (const edition of regular) {
      const currency = this.classify(edition.editionId, claim, comparisonAt);
      if (currency.state === 'current' || currency.state === 'stale') return selection(edition, claim, currency.state);
    }
    return Object.freeze({ source: 'none', reason: 'No usable schedule covers this claim' });
  }

  resolveOwner(claim: ScheduleClaim, comparisonAt: Date): OwnedScheduleEdition | null {
    const selection = this.select(claim, comparisonAt);
    if (!selection.editionId || selection.source === 'none') return null;
    const edition = this.#editions.find((candidate) => candidate.editionId === selection.editionId);
    if (!edition) throw new Error('Selected schedule edition is unavailable');
    return Object.freeze({ selection, candidate: edition.candidate });
  }

  #isSuperseded(edition: StoredEdition, claim: ScheduleClaim): boolean {
    if (edition.source !== 'supplemented-gtfs' || !edition.coverage.some((mask) => maskContains(mask, claim))) return false;
    return this.#editions.some(
      (candidate) =>
        candidate.source === 'supplemented-gtfs' &&
        candidate.ordinal > edition.ordinal &&
        candidate.coverage.some((mask) => maskContains(mask, claim)),
    );
  }
}

function selection(edition: StoredEdition, claim: ScheduleClaim, currency: ScheduleCurrencyState): ScheduleSelection {
  const occurrencePresent = hasExactOccurrence(edition.candidate, claim);
  return Object.freeze({
    source: edition.source,
    editionId: edition.editionId,
    currency,
    occurrencePresent,
    reason:
      edition.source === 'supplemented-gtfs'
        ? 'Usable supplemented coverage mask owns the claim independently of occurrence presence'
        : 'Regular GTFS owns an otherwise uncovered claim',
  });
}

function maskContains(mask: ScheduleCoverageMask, claim: ScheduleClaim): boolean {
  return (
    mask.routeIds.includes(claim.routeId) &&
    mask.serviceDates.includes(claim.serviceDate) &&
    claim.at >= mask.effectiveFrom &&
    claim.at <= mask.effectiveUntil &&
    (mask.directions.length === 0 || mask.directions.includes(claim.direction))
    && (!mask.operationalAxes || mask.operationalAxes.length === 0
      || (claim.operationalAxis !== undefined && mask.operationalAxes.includes(claim.operationalAxis)))
  );
}

function validateClaim(claim: ScheduleClaim): void {
  if (!claim.routeId || !/^\d{8}$/.test(claim.serviceDate) || !isResolvedDirection(claim.direction)) {
    throw new Error('Invalid schedule claim scope');
  }
  if (claim.occurrenceId === '' || claim.stopId === '' || claim.stopTimeOccurrenceId === '') {
    throw new Error('Invalid empty schedule occurrence scope');
  }
  exactIso(claim.at, 'schedule claim instant');
}

function validateChangedEditionChronology(
  source: StaticScheduleSource,
  sourceOrder: number | undefined,
  publishedAt: string | undefined,
  retrievedAt: string,
  previous: readonly StoredEdition[],
): string | undefined {
  const isRetrievalOnlyRegularSequence =
    source === 'regular-gtfs' &&
    sourceOrder === undefined &&
    publishedAt === undefined &&
    previous.every((prior) => prior.sourceOrder === undefined && prior.publishedAt === undefined);
  if (isRetrievalOnlyRegularSequence) {
    const latestPriorRetrieval = previous
      .flatMap((prior) => prior.retrievals)
      .sort()
      .at(-1);
    if (latestPriorRetrieval !== undefined && retrievedAt <= latestPriorRetrieval) {
      return 'Regressed or contradictory regular retrieval chronology';
    }
    return undefined;
  }

  for (const prior of previous) {
    const sharedPublication = publishedAt !== undefined && prior.publishedAt !== undefined;
    const sharedSourceOrder = sourceOrder !== undefined && prior.sourceOrder !== undefined;
    if (!sharedPublication && !sharedSourceOrder) {
      return 'Changed schedule content has incomparable chronology with a prior accepted edition';
    }

    if (sharedPublication && sharedSourceOrder) {
      if (publishedAt! <= prior.publishedAt! || sourceOrder! <= prior.sourceOrder!) {
        return 'Contradictory chronology across multiple supported axes';
      }
      continue;
    }
    if (sharedPublication) {
      if (publishedAt! < prior.publishedAt!) return 'Regressed publication chronology';
      if (publishedAt === prior.publishedAt) {
        return 'Changed schedule content lacks strict source-supported chronology';
      }
      continue;
    }
    if (sourceOrder! <= prior.sourceOrder!) return 'Regressed or contradictory source chronology';
  }
  return undefined;
}

function hasExactOccurrence(candidate: StaticGtfsEditionCandidate, claim: ScheduleClaim): boolean {
  if (claim.occurrenceId && !candidate.data.trips.some((trip) => trip.tripId === claim.occurrenceId)) return false;
  if (claim.stopTimeOccurrenceId) {
    return candidate.data.stopTimes.some(
      (stopTime) =>
        stopTime.rowIdentity === claim.stopTimeOccurrenceId &&
        (claim.occurrenceId === undefined || stopTime.tripId === claim.occurrenceId) &&
        (claim.stopId === undefined || stopTime.stopId === claim.stopId),
    );
  }
  if (claim.stopId) {
    return candidate.data.stopTimes.some(
      (stopTime) =>
        stopTime.stopId === claim.stopId &&
        (claim.occurrenceId === undefined || stopTime.tripId === claim.occurrenceId),
    );
  }
  return claim.occurrenceId === undefined || candidate.data.trips.some((trip) => trip.tripId === claim.occurrenceId);
}

function exactIso(value: string, label: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) throw new Error(`Invalid ${label}`);
  return value;
}

function validDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value;
}

function quarantine(reason: string): EditionObservationResult {
  return Object.freeze({ status: 'quarantined', reason });
}

function decision(
  state: ScheduleCurrencyState,
  reason: string,
  ageAnchorKind: 'published' | 'first-retrieved',
  ageMs: number,
  lastRetrievalAgeMs: number,
  superseded: boolean,
  inCoverage: boolean,
): ScheduleCurrencyDecision {
  return Object.freeze({ state, reason, ageAnchorKind, ageMs, lastRetrievalAgeMs, superseded, inCoverage });
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function validateCoverage(coverage: readonly ScheduleCoverageMask[]): string | undefined {
  if (!Array.isArray(coverage) || coverage.length === 0) return 'Schedule edition coverage is required';
  const ids = new Set<string>();
  for (const mask of coverage) {
    if (!mask?.id || ids.has(mask.id) || !Array.isArray(mask.routeIds) || mask.routeIds.length === 0
      || mask.routeIds.some((routeId: string) => !routeId) || !Array.isArray(mask.serviceDates) || mask.serviceDates.length === 0
      || mask.serviceDates.some((serviceDate: string) => !/^\d{8}$/.test(serviceDate)) || !Array.isArray(mask.directions)
      || mask.directions.some((direction: Direction) => !isResolvedDirection(direction))) return 'Invalid schedule coverage mask';
    ids.add(mask.id);
    let effectiveFrom: string;
    let effectiveUntil: string;
    try {
      effectiveFrom = exactIso(mask.effectiveFrom, 'schedule coverage start');
      effectiveUntil = exactIso(mask.effectiveUntil, 'schedule coverage end');
    } catch {
      return 'Invalid schedule coverage interval';
    }
    if (effectiveUntil < effectiveFrom) return 'Schedule coverage ends before it starts';
    if (mask.operationalAxes && (!Array.isArray(mask.operationalAxes) || mask.operationalAxes.some((axis: string) => !axis))) {
      return 'Invalid schedule operational-axis coverage';
    }
  }
  return undefined;
}

function isResolvedDirection(value: Direction): boolean {
  return ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(value);
}
