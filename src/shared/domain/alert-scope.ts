import { normalizeCanonicalIdentity } from './canonical';
import type { Direction } from './types';

export type ResolvedServiceDirection = Exclude<Direction, 'unknown'>;
export type AlertSnapshotStatus = 'accepted' | 'missing' | 'failed' | 'quarantined';
export type AlertSnapshotKind = 'current' | 'stale' | 'missing' | 'failed' | 'quarantined';
export type AlertTemporalState = 'active' | 'preactive' | 'expired' | 'indeterminate';
export type AlertScopeKind = 'match' | 'unrelated' | 'unresolved';

export type StructuredAlertEffect =
  | 'NO_SERVICE'
  | 'MODIFIED_SERVICE'
  | 'SIGNIFICANT_DELAYS'
  | 'ACCESSIBILITY_ISSUE'
  | 'UNKNOWN_EFFECT'
  | 'OTHER_EFFECT';

export type DeclaredServiceConsequence =
  | 'delay-only'
  | 'holding'
  | 'express-running-local'
  | 'local-running-express'
  | 'reroute'
  | 'short-turn'
  | 'partial-suspension'
  | 'full-suspension'
  | 'station-closure'
  | 'entrance-equipment'
  | 'platform-track'
  | 'generic-affected';

export interface AlertActivePeriod {
  readonly startsAt?: Date | null;
  readonly endsAt?: Date | null;
}

/**
 * One informed-entity selector. Every populated dimension is conjunctive inside
 * this selector; dimensions are never combined with another selector.
 * `null` means the source asserted the dimension but it could not be resolved.
 */
export interface ServiceAlertSelector {
  readonly selectorId: string;
  readonly routeId?: string | null;
  readonly exactDirectionalStopId?: string | null;
  readonly constituentStopIds?: readonly string[] | null;
  readonly exactDirectionalSegmentStopIds?: readonly string[] | null;
  readonly direction?: ResolvedServiceDirection | null;
  readonly tripId?: string | null;
  readonly trainId?: string | null;
  readonly claimId?: string | null;
}

export interface OfficialAlertFields {
  readonly headerRaw: string;
  readonly descriptionRaw: string;
}

/** Shared-domain DTO; deliberately independent of server feed-loader types. */
export interface ServiceAlertEvidence {
  readonly alertId: string;
  readonly activePeriods: readonly AlertActivePeriod[];
  readonly selectors: readonly ServiceAlertSelector[];
  readonly structuredEffect: StructuredAlertEffect;
  readonly declaredConsequence: DeclaredServiceConsequence;
  readonly official: OfficialAlertFields;
  readonly rawAuditFields?: Readonly<Record<string, unknown>>;
}

export interface ServiceClaimScope {
  readonly claimId: string;
  readonly routeId: string;
  readonly exactDirectionalStopId: string;
  readonly constituentStopId: string;
  readonly direction: ResolvedServiceDirection;
  readonly tripId?: string;
  readonly trainId?: string;
}

export interface AlertSnapshotInput {
  readonly status: AlertSnapshotStatus;
  readonly feedTimestamp?: Date;
  readonly retrievedAt?: Date;
  readonly alerts?: readonly ServiceAlertEvidence[];
}

export interface AlertSnapshotDecision {
  readonly kind: AlertSnapshotKind;
  readonly feedTimestamp: Date | null;
  readonly assessedAt: Date;
  readonly alerts: readonly ServiceAlertEvidence[];
}

export interface ResolvedOfficialAlertDetails {
  readonly alertId: string;
  readonly header: string;
  readonly description: string;
}

export interface RawOfficialAlertAudit {
  readonly alertId: string;
  readonly rawHeader: string;
  readonly rawDescription: string;
  readonly rawAuditFields?: Readonly<Record<string, unknown>>;
}

export interface AlertScopeDecision {
  readonly kind: AlertScopeKind;
  readonly temporalState: AlertTemporalState;
  readonly matchingSelectorIds: readonly string[];
  readonly unresolvedSelectorIds: readonly string[];
  readonly official: ResolvedOfficialAlertDetails;
  readonly rawOfficialAudit: RawOfficialAlertAudit;
}

const CURRENT_ALERT_MAX_AGE_MS = 600_000;

export function classifyAlertSnapshot(input: AlertSnapshotInput, assessedAt: Date): AlertSnapshotDecision {
  const assessedAtMs = validDate(assessedAt, 'alert assessment instant');
  if (!input || typeof input !== 'object' || !['accepted', 'missing', 'failed', 'quarantined'].includes(input.status)) {
    throw new Error('Invalid alert snapshot status');
  }
  if (input.status !== 'accepted') {
    return freezeSnapshot(input.status, null, assessedAt, []);
  }
  const feedTimestampMs = validDate(input.feedTimestamp, 'authoritative alert feed timestamp');
  if (input.retrievedAt !== undefined) validDate(input.retrievedAt, 'alert retrieval instant');
  if (!Array.isArray(input.alerts)) throw new Error('Accepted alert snapshot requires alerts');
  for (const item of input.alerts) validateAlert(item);
  if (feedTimestampMs > assessedAtMs) return freezeSnapshot('quarantined', input.feedTimestamp!, assessedAt, []);
  const kind = assessedAtMs - feedTimestampMs <= CURRENT_ALERT_MAX_AGE_MS ? 'current' : 'stale';
  return freezeSnapshot(kind, input.feedTimestamp!, assessedAt, input.alerts);
}

export function classifyAlertTemporalState(
  periods: readonly AlertActivePeriod[],
  comparisonAt: Date,
): AlertTemporalState {
  const comparisonAtMs = validDate(comparisonAt, 'alert comparison instant');
  if (!Array.isArray(periods)) throw new Error('Alert active periods are required');
  if (periods.length === 0) return 'active';
  let hasFuture = false;
  let hasPast = false;
  for (const period of periods) {
    if (!period || typeof period !== 'object') return 'indeterminate';
    let start = Number.NEGATIVE_INFINITY;
    let end = Number.POSITIVE_INFINITY;
    try {
      if (period.startsAt != null) start = validDate(period.startsAt, 'alert period start');
      if (period.endsAt != null) end = validDate(period.endsAt, 'alert period end');
    } catch {
      return 'indeterminate';
    }
    if (end <= start) return 'indeterminate';
    if (comparisonAtMs >= start && comparisonAtMs < end) return 'active';
    if (comparisonAtMs < start) hasFuture = true;
    if (comparisonAtMs >= end) hasPast = true;
  }
  if (hasFuture) return 'preactive';
  if (hasPast) return 'expired';
  return 'indeterminate';
}

export function resolveAlertScope(
  alert: ServiceAlertEvidence,
  claim: ServiceClaimScope,
  comparisonAt: Date,
): AlertScopeDecision {
  validateAlert(alert);
  validateClaim(claim);
  const temporalState = classifyAlertTemporalState(alert.activePeriods, comparisonAt);
  const official = freezeOfficial(alert);
  const rawOfficialAudit = freezeRawOfficialAudit(alert);
  if (temporalState === 'preactive' || temporalState === 'expired') {
    return freezeScope('unrelated', temporalState, [], [], official, rawOfficialAudit);
  }
  if (temporalState === 'indeterminate' || alert.selectors.length === 0) {
    return freezeScope('unresolved', temporalState, [], alert.selectors.map((item) => item.selectorId), official, rawOfficialAudit);
  }

  const matches: string[] = [];
  const unresolved: string[] = [];
  for (const selector of alert.selectors) {
    const result = resolveAtomicSelector(selector, claim);
    if (result === 'match') matches.push(selector.selectorId);
    if (result === 'unresolved') unresolved.push(selector.selectorId);
  }
  matches.sort(compareText);
  unresolved.sort(compareText);
  return freezeScope(matches.length > 0 ? 'match' : unresolved.length > 0 ? 'unresolved' : 'unrelated',
    temporalState, matches, unresolved, official, rawOfficialAudit);
}

export function sanitizeOfficialText(raw: string): string {
  if (typeof raw !== 'string') throw new Error('Official alert text must be a string');
  const withoutExecutable = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ');
  return decodeEntities(withoutExecutable).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function resolveAtomicSelector(selector: ServiceAlertSelector, claim: ServiceClaimScope): AlertScopeKind {
  if (!hasSelectorDimension(selector)) return 'unresolved';
  // Deliberate order: route, stop/constituent/segment, direction, trip/train/claim.
  const route = scalarDimension(selector.routeId, claim.routeId);
  if (route !== 'match') return route;

  const constituent = collectionDimension(selector.constituentStopIds, claim.constituentStopId);
  if (constituent !== 'match') return constituent;
  const exactStop = scalarDimension(selector.exactDirectionalStopId, claim.exactDirectionalStopId);
  if (exactStop !== 'match') return exactStop;
  const segment = collectionDimension(selector.exactDirectionalSegmentStopIds, claim.exactDirectionalStopId);
  if (segment !== 'match') return segment;

  const direction = scalarDimension(selector.direction, claim.direction);
  if (direction !== 'match') return direction;
  const trip = scalarDimension(selector.tripId, claim.tripId);
  if (trip !== 'match') return trip;
  const train = scalarDimension(selector.trainId, claim.trainId);
  if (train !== 'match') return train;
  return scalarDimension(selector.claimId, claim.claimId);
}

function hasSelectorDimension(selector: ServiceAlertSelector): boolean {
  return selector.routeId !== undefined
    || selector.constituentStopIds !== undefined
    || selector.exactDirectionalStopId !== undefined
    || selector.exactDirectionalSegmentStopIds !== undefined
    || selector.direction !== undefined
    || selector.tripId !== undefined
    || selector.trainId !== undefined
    || selector.claimId !== undefined;
}

function scalarDimension(expected: string | null | undefined, actual: string | undefined): AlertScopeKind {
  if (expected === undefined) return 'match';
  if (expected === null || actual === undefined || !expected.trim() || !actual.trim()) return 'unresolved';
  return sameIdentity(expected, actual) ? 'match' : 'unrelated';
}

function collectionDimension(expected: readonly string[] | null | undefined, actual: string): AlertScopeKind {
  if (expected === undefined) return 'match';
  if (expected === null || expected.length === 0 || expected.some((item) => !item?.trim())) return 'unresolved';
  return expected.some((item) => sameIdentity(item, actual)) ? 'match' : 'unrelated';
}

function validateAlert(alert: ServiceAlertEvidence): void {
  if (!alert || typeof alert !== 'object' || !alert.alertId?.trim() || !Array.isArray(alert.activePeriods)
    || !Array.isArray(alert.selectors) || !alert.official || typeof alert.official.headerRaw !== 'string'
    || typeof alert.official.descriptionRaw !== 'string') throw new Error('Complete service alert evidence is required');
  if (!['NO_SERVICE', 'MODIFIED_SERVICE', 'SIGNIFICANT_DELAYS', 'ACCESSIBILITY_ISSUE', 'UNKNOWN_EFFECT', 'OTHER_EFFECT']
    .includes(alert.structuredEffect)) throw new Error('Invalid structured alert effect');
  if (!['delay-only', 'holding', 'express-running-local', 'local-running-express', 'reroute', 'short-turn',
    'partial-suspension', 'full-suspension', 'station-closure', 'entrance-equipment', 'platform-track',
    'generic-affected'].includes(alert.declaredConsequence)) throw new Error('Invalid declared service consequence');
  const seen = new Set<string>();
  for (const selector of alert.selectors) {
    if (!selector || typeof selector !== 'object' || !selector.selectorId?.trim()) throw new Error('Alert selector identity is required');
    const id = normalizeCanonicalIdentity(selector.selectorId);
    if (seen.has(id)) throw new Error('Duplicate alert selector identity');
    seen.add(id);
    if (selector.direction !== undefined && selector.direction !== null && !isResolvedDirection(selector.direction)) {
      throw new Error('Invalid alert selector direction');
    }
  }
}

function validateClaim(claim: ServiceClaimScope): void {
  if (!claim || typeof claim !== 'object' || !claim.claimId?.trim() || !claim.routeId?.trim()
    || !claim.exactDirectionalStopId?.trim() || !claim.constituentStopId?.trim() || !isResolvedDirection(claim.direction)) {
    throw new Error('Complete exact service claim scope is required');
  }
}

function isResolvedDirection(direction: string): direction is ResolvedServiceDirection {
  return ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(direction);
}

function sameIdentity(left: string, right: string): boolean {
  return normalizeCanonicalIdentity(left) === normalizeCanonicalIdentity(right);
}

function compareText(left: string, right: string): number {
  const a = normalizeCanonicalIdentity(left);
  const b = normalizeCanonicalIdentity(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

function freezeSnapshot(
  kind: AlertSnapshotKind,
  feedTimestamp: Date | null,
  assessedAt: Date,
  alerts: readonly ServiceAlertEvidence[],
): AlertSnapshotDecision {
  return Object.freeze({
    kind,
    feedTimestamp: feedTimestamp ? new Date(feedTimestamp) : null,
    assessedAt: new Date(assessedAt),
    alerts: Object.freeze([...alerts]),
  });
}

function freezeOfficial(alert: ServiceAlertEvidence): ResolvedOfficialAlertDetails {
  return Object.freeze({
    alertId: alert.alertId,
    header: sanitizeOfficialText(alert.official.headerRaw),
    description: sanitizeOfficialText(alert.official.descriptionRaw),
  });
}

function freezeRawOfficialAudit(alert: ServiceAlertEvidence): RawOfficialAlertAudit {
  return Object.freeze({
    alertId: alert.alertId,
    rawHeader: alert.official.headerRaw,
    rawDescription: alert.official.descriptionRaw,
    ...(alert.rawAuditFields ? { rawAuditFields: Object.freeze({ ...alert.rawAuditFields }) } : {}),
  });
}

function freezeScope(
  kind: AlertScopeKind,
  temporalState: AlertTemporalState,
  matchingSelectorIds: readonly string[],
  unresolvedSelectorIds: readonly string[],
  official: ResolvedOfficialAlertDetails,
  rawOfficialAudit: RawOfficialAlertAudit,
): AlertScopeDecision {
  return Object.freeze({
    kind,
    temporalState,
    matchingSelectorIds: Object.freeze([...matchingSelectorIds]),
    unresolvedSelectorIds: Object.freeze([...unresolvedSelectorIds]),
    official,
    rawOfficialAudit,
  });
}

function decodeEntities(raw: string): string {
  const named: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return raw.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (whole, token: string) => {
    if (token[0] !== '#') return named[token.toLowerCase()] ?? whole;
    const radix = token[1]?.toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? token.slice(2) : token.slice(1);
    const value = Number.parseInt(digits, radix);
    return Number.isFinite(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : whole;
  });
}

function validDate(value: Date | undefined, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
