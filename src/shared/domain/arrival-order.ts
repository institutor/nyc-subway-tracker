import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';
import type { SupportedArrivalRange } from './arrival-confidence';
import type { PrimaryArrival } from './types';

export type PublicRouteOrderKind = 'numbered' | 'lettered' | 'shuttle' | 'other';

export interface PrimaryOrderRow {
  readonly arrival: PrimaryArrival;
  readonly stableTrainIdentity: string;
  readonly routeOrderKind: PublicRouteOrderKind;
  readonly supportedRange: SupportedArrivalRange;
}

export function orderPrimaryArrivals(rows: readonly PrimaryOrderRow[], cap = 3): readonly PrimaryOrderRow[] {
  if (!Array.isArray(rows)) throw new Error('Primary arrival rows are required');
  if (!Number.isSafeInteger(cap) || cap < 0) throw new Error('Primary arrival cap must be a non-negative integer');
  const identities = new Set<string>();
  for (const row of rows) {
    validateRow(row);
    const identity = normalizeCanonicalIdentity(row.stableTrainIdentity);
    if (identities.has(identity)) throw new Error('Ambiguous duplicate primary train identity');
    identities.add(identity);
  }
  const initial = [...rows].sort(compareRows);
  const liveVisitOrder = initial.filter((row) => row.arrival.kind === 'live');
  const promoted = [...initial];
  for (const live of liveVisitOrder) {
    const index = promoted.indexOf(live);
    let blockStart = index;
    while (blockStart > 0) {
      const prior = promoted[blockStart - 1];
      if (prior.arrival.kind !== 'expected' || !overlaps(prior.supportedRange, live.supportedRange)) break;
      blockStart -= 1;
    }
    if (blockStart !== index) {
      promoted.splice(index, 1);
      promoted.splice(blockStart, 0, live);
    }
  }
  return Object.freeze(promoted.slice(0, cap).map(freezeRow));
}

function compareRows(left: PrimaryOrderRow, right: PrimaryOrderRow): number {
  return bestEstimate(left) - bestEstimate(right)
    || left.supportedRange.startsAt.getTime() - right.supportedRange.startsAt.getTime()
    || left.supportedRange.endsAt.getTime() - right.supportedRange.endsAt.getTime()
    || compareRoute(left, right)
    || compareCanonicalIdentity(left.arrival.destination.normalize('NFC'), right.arrival.destination.normalize('NFC'))
    || compareCanonicalIdentity(left.stableTrainIdentity, right.stableTrainIdentity);
}

function bestEstimate(row: PrimaryOrderRow): number {
  return row.arrival.kind === 'live'
    ? row.arrival.at.getTime()
    : row.supportedRange.startsAt.getTime() + (row.supportedRange.endsAt.getTime() - row.supportedRange.startsAt.getTime()) / 2;
}

function compareRoute(left: PrimaryOrderRow, right: PrimaryOrderRow): number {
  const rank = { numbered: 0, lettered: 1, shuttle: 2, other: 3 } as const;
  const category = rank[left.routeOrderKind] - rank[right.routeOrderKind];
  if (category !== 0) return category;
  if (left.routeOrderKind === 'numbered') {
    const numeric = Number(left.arrival.route.id) - Number(right.arrival.route.id);
    if (numeric !== 0) return numeric;
  }
  const leftLabel = left.routeOrderKind === 'shuttle' || left.routeOrderKind === 'other'
    ? left.arrival.route.label : left.arrival.route.id;
  const rightLabel = right.routeOrderKind === 'shuttle' || right.routeOrderKind === 'other'
    ? right.arrival.route.label : right.arrival.route.id;
  return compareCanonicalIdentity(leftLabel, rightLabel);
}

function overlaps(left: SupportedArrivalRange, right: SupportedArrivalRange): boolean {
  return left.startsAt.getTime() <= right.endsAt.getTime() && right.startsAt.getTime() <= left.endsAt.getTime();
}

function validateRow(row: PrimaryOrderRow): void {
  if (!row || typeof row !== 'object' || !row.stableTrainIdentity || !row.arrival?.destination) {
    throw new Error('Incomplete primary arrival row');
  }
  if (row.arrival.kind !== 'live' && row.arrival.kind !== 'expected') throw new Error('Only Live and Expected are primary arrivals');
  const start = validDate(row.supportedRange.startsAt, 'primary range start');
  const end = validDate(row.supportedRange.endsAt, 'primary range end');
  if (end < start) throw new Error('Primary range ends before it starts');
  const estimate = validDate(row.arrival.kind === 'live' ? row.arrival.at : row.arrival.estimateAt, 'primary estimate');
  if (row.arrival.kind === 'live' && (estimate < start || estimate > end)) {
    throw new Error('Live estimate is outside its supported range');
  }
  if (!['numbered', 'lettered', 'shuttle', 'other'].includes(row.routeOrderKind)) throw new Error('Public route order kind is required');
  if (row.routeOrderKind === 'numbered' && !/^\d+$/.test(row.arrival.route.id)) throw new Error('Numbered route requires a numeric public id');
}

function freezeRow(row: PrimaryOrderRow): PrimaryOrderRow {
  const provenance = Object.freeze({ ...row.arrival.provenance,
    observedAt: new Date(row.arrival.provenance.observedAt), retrievedAt: new Date(row.arrival.provenance.retrievedAt) });
  const route = Object.freeze({ ...row.arrival.route });
  const arrival: PrimaryArrival = row.arrival.kind === 'live'
    ? Object.freeze({ ...row.arrival, route, provenance, at: new Date(row.arrival.at) })
    : Object.freeze({ ...row.arrival, route, provenance, estimateAt: new Date(row.arrival.estimateAt),
      range: Object.freeze({ startsAt: new Date(row.arrival.range.startsAt), endsAt: new Date(row.arrival.range.endsAt) }) });
  return Object.freeze({
    ...row,
    arrival,
    supportedRange: Object.freeze({ startsAt: new Date(row.supportedRange.startsAt), endsAt: new Date(row.supportedRange.endsAt) }),
  });
}

function validDate(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
