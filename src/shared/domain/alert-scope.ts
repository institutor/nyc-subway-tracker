import { normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import type { Direction } from './types';
import { captureDateEpochMilliseconds } from './temporal';

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

export interface IndependentHighImpactBasis {
  readonly kind: 'verified-terminal-change' | 'verified-reroute' | 'verified-suspension';
  readonly evidenceId: string;
}

/** Shared-domain DTO; deliberately independent of server feed-loader types. */
export interface ServiceAlertEvidence {
  readonly alertId: string;
  readonly activePeriods: readonly AlertActivePeriod[];
  readonly selectors: readonly ServiceAlertSelector[];
  readonly structuredEffect: StructuredAlertEffect;
  readonly declaredConsequence: DeclaredServiceConsequence;
  readonly official: OfficialAlertFields;
  readonly independentHighImpactBasis?: IndependentHighImpactBasis;
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

export const CURRENT_ALERT_MAX_AGE_MS = 600_000;

export function classifyAlertSnapshot(input: AlertSnapshotInput, assessedAt: Date): AlertSnapshotDecision {
  const assessedAtMs = validDate(assessedAt, 'alert assessment instant');
  if (!input || typeof input !== 'object' || !['accepted', 'missing', 'failed', 'quarantined'].includes(input.status)) {
    throw new Error('Invalid alert snapshot status');
  }
  if (input.status !== 'accepted') {
    return freezeSnapshot(input.status, null, assessedAtMs, []);
  }
  const feedTimestampMs = validDate(input.feedTimestamp, 'authoritative alert feed timestamp');
  if (input.retrievedAt !== undefined) validDate(input.retrievedAt, 'alert retrieval instant');
  if (!Array.isArray(input.alerts)) throw new Error('Accepted alert snapshot requires alerts');
  for (const item of input.alerts) validateAlert(item);
  if (feedTimestampMs > assessedAtMs) return freezeSnapshot('quarantined', feedTimestampMs, assessedAtMs, []);
  const kind = assessedAtMs - feedTimestampMs <= CURRENT_ALERT_MAX_AGE_MS ? 'current' : 'stale';
  return freezeSnapshot(kind, feedTimestampMs, assessedAtMs, input.alerts.map(freezeAlert));
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
  return decodeEntities(withoutExecutable).replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().normalize('NFC');
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
  normalizeBoundedIdentity(alert.alertId, 'alert');
  if (alert.independentHighImpactBasis !== undefined
    && (!alert.independentHighImpactBasis || typeof alert.independentHighImpactBasis !== 'object'
      || !['verified-terminal-change', 'verified-reroute', 'verified-suspension'].includes(alert.independentHighImpactBasis.kind)
      || !alert.independentHighImpactBasis.evidenceId?.trim())) throw new Error('Invalid independent high-impact basis');
  if (alert.independentHighImpactBasis) {
    normalizeBoundedIdentity(alert.independentHighImpactBasis.evidenceId, 'independent high-impact evidence');
  }
  const seen = new Set<string>();
  for (const selector of alert.selectors) {
    if (!selector || typeof selector !== 'object' || !selector.selectorId?.trim()) throw new Error('Alert selector identity is required');
    const id = normalizeBoundedIdentity(selector.selectorId, 'alert selector');
    if (seen.has(id)) throw new Error('Duplicate alert selector identity');
    seen.add(id);
    if (selector.direction !== undefined && selector.direction !== null && !isResolvedDirection(selector.direction)) {
      throw new Error('Invalid alert selector direction');
    }
    for (const identity of [selector.routeId, selector.exactDirectionalStopId, selector.tripId, selector.trainId,
      selector.claimId]) {
      if (identity !== undefined && identity !== null) normalizeBoundedIdentity(identity, 'alert selector dimension');
    }
    for (const identities of [selector.constituentStopIds, selector.exactDirectionalSegmentStopIds]) {
      if (identities !== undefined && identities !== null) {
        if (!Array.isArray(identities)) throw new Error('Invalid alert selector identity list');
        identities.forEach((identity) => normalizeBoundedIdentity(identity, 'alert selector dimension'));
      }
    }
  }
}

function validateClaim(claim: ServiceClaimScope): void {
  if (!claim || typeof claim !== 'object' || !claim.claimId?.trim() || !claim.routeId?.trim()
    || !claim.exactDirectionalStopId?.trim() || !claim.constituentStopId?.trim() || !isResolvedDirection(claim.direction)) {
    throw new Error('Complete exact service claim scope is required');
  }
  [claim.claimId, claim.routeId, claim.exactDirectionalStopId, claim.constituentStopId, claim.tripId, claim.trainId]
    .forEach((identity) => {
      if (identity !== undefined) normalizeBoundedIdentity(identity, 'service claim');
    });
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
  feedTimestampMs: number | null,
  assessedAtMs: number,
  alerts: readonly ServiceAlertEvidence[],
): AlertSnapshotDecision {
  const snapshot = {
    kind,
    get feedTimestamp(): Date | null { return feedTimestampMs === null ? null : new Date(feedTimestampMs); },
    get assessedAt(): Date { return new Date(assessedAtMs); },
    alerts: Object.freeze([...alerts]),
  } satisfies AlertSnapshotDecision;
  return Object.freeze(snapshot);
}

function freezeAlert(alert: ServiceAlertEvidence): ServiceAlertEvidence {
  const selectors = alert.selectors.map((selector) => Object.freeze({
    selectorId: normalizeBoundedIdentity(selector.selectorId, 'alert selector'),
    ...(selector.routeId !== undefined ? { routeId: normalizeOptionalIdentity(selector.routeId) } : {}),
    ...(selector.constituentStopIds !== undefined ? {
      constituentStopIds: selector.constituentStopIds === null ? null
        : Object.freeze(selector.constituentStopIds.map(normalizeCanonicalIdentity)),
    } : {}),
    ...(selector.exactDirectionalStopId !== undefined
      ? { exactDirectionalStopId: normalizeOptionalIdentity(selector.exactDirectionalStopId) } : {}),
    ...(selector.exactDirectionalSegmentStopIds !== undefined ? {
      exactDirectionalSegmentStopIds: selector.exactDirectionalSegmentStopIds === null ? null
        : Object.freeze(selector.exactDirectionalSegmentStopIds.map(normalizeCanonicalIdentity)),
    } : {}),
    ...(selector.direction !== undefined ? { direction: selector.direction } : {}),
    ...(selector.tripId !== undefined ? { tripId: normalizeOptionalIdentity(selector.tripId) } : {}),
    ...(selector.trainId !== undefined ? { trainId: normalizeOptionalIdentity(selector.trainId) } : {}),
    ...(selector.claimId !== undefined ? { claimId: normalizeOptionalIdentity(selector.claimId) } : {}),
  }));
  const periods = alert.activePeriods.map(freezePeriod);
  const official = Object.freeze({ headerRaw: alert.official.headerRaw, descriptionRaw: alert.official.descriptionRaw });
  const basis = alert.independentHighImpactBasis ? Object.freeze({
    kind: alert.independentHighImpactBasis.kind,
    evidenceId: normalizeBoundedIdentity(alert.independentHighImpactBasis.evidenceId, 'independent high-impact evidence'),
  }) : undefined;
  return Object.freeze({
    alertId: normalizeBoundedIdentity(alert.alertId, 'alert'),
    activePeriods: Object.freeze(periods),
    selectors: Object.freeze(selectors),
    structuredEffect: alert.structuredEffect,
    declaredConsequence: alert.declaredConsequence,
    official,
    ...(basis ? { independentHighImpactBasis: basis } : {}),
    ...(alert.rawAuditFields ? { rawAuditFields: deepFreezeAuditRecord(alert.rawAuditFields) } : {}),
  });
}

function freezePeriod(period: AlertActivePeriod): AlertActivePeriod {
  const startsAtValue = period.startsAt;
  const endsAtValue = period.endsAt;
  const startsAt = startsAtValue === undefined ? undefined : startsAtValue === null ? null
    : captureDateEpochMilliseconds(startsAtValue, 'alert period start', { allowInvalid: true });
  const endsAt = endsAtValue === undefined ? undefined : endsAtValue === null ? null
    : captureDateEpochMilliseconds(endsAtValue, 'alert period end', { allowInvalid: true });
  const frozen: { startsAt?: Date | null; endsAt?: Date | null } = {};
  if (startsAt !== undefined) Object.defineProperty(frozen, 'startsAt', {
    enumerable: true,
    get: () => startsAt === null ? null : new Date(startsAt),
  });
  if (endsAt !== undefined) Object.defineProperty(frozen, 'endsAt', {
    enumerable: true,
    get: () => endsAt === null ? null : new Date(endsAt),
  });
  return Object.freeze(frozen);
}

function normalizeOptionalIdentity(value: string | null): string | null {
  return value === null ? null : normalizeBoundedIdentity(value, 'alert selector dimension');
}

function deepFreezeAuditRecord(record: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  const budget = { remaining: 5_000 };
  const seen = new Set<object>();
  const normalized = deepFreezeAuditValue(record, 0, budget, seen);
  if (!normalized || Array.isArray(normalized) || typeof normalized !== 'object') throw new Error('Invalid raw audit record');
  return normalized as Readonly<Record<string, unknown>>;
}

function deepFreezeAuditValue(
  value: unknown,
  depth: number,
  budget: { remaining: number },
  seen: Set<object>,
): unknown {
  budget.remaining -= 1;
  if (budget.remaining < 0 || depth > 16) throw new Error('Raw audit fields exceed normalization limits');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Unsupported raw audit field');
    return value;
  }
  if (typeof value === 'string') {
    const normalized = normalizeCanonicalIdentity(value);
    if (normalized.length > 65_536) throw new Error('Raw audit string exceeds normalization limits');
    return normalized;
  }
  if (value instanceof Date) return new Date(validDate(value, 'raw audit date')).toISOString();
  if (typeof value !== 'object') throw new Error('Unsupported raw audit field');
  if (seen.has(value)) throw new Error('Cyclic raw audit fields are not supported');
  seen.add(value);
  if (Array.isArray(value)) {
    if (value.length > 1_000) throw new Error('Raw audit array exceeds normalization limits');
    const result = Object.freeze(value.map((item) => deepFreezeAuditValue(item, depth + 1, budget, seen)));
    seen.delete(value);
    return result;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error('Unsupported raw audit object');
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 1_000) throw new Error('Raw audit object exceeds normalization limits');
  const normalizedEntries = entries.map(([key, item]) => {
    const normalizedKey = normalizeCanonicalIdentity(key);
    if (!normalizedKey || normalizedKey.length > 256 || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(normalizedKey)) {
      throw new Error('Raw audit key exceeds normalization limits');
    }
    if (['__proto__', 'constructor', 'prototype'].includes(normalizedKey)) throw new Error('Unsafe raw audit key');
    return [normalizedKey, item] as const;
  });
  const keys = new Set<string>();
  for (const [key] of normalizedEntries) {
    if (keys.has(key)) throw new Error('Canonical duplicate raw audit key');
    keys.add(key);
  }
  normalizedEntries.sort(([left], [right]) => compareText(left, right));
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const [key, item] of normalizedEntries) {
    Object.defineProperty(result, key, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: deepFreezeAuditValue(item, depth + 1, budget, seen),
    });
  }
  seen.delete(value);
  return Object.freeze(result);
}

function freezeOfficial(alert: ServiceAlertEvidence): ResolvedOfficialAlertDetails {
  return Object.freeze({
    alertId: normalizeCanonicalIdentity(alert.alertId),
    header: sanitizeOfficialText(alert.official.headerRaw),
    description: sanitizeOfficialText(alert.official.descriptionRaw),
  });
}

function freezeRawOfficialAudit(alert: ServiceAlertEvidence): RawOfficialAlertAudit {
  return Object.freeze({
    alertId: normalizeCanonicalIdentity(alert.alertId),
    rawHeader: alert.official.headerRaw,
    rawDescription: alert.official.descriptionRaw,
    ...(alert.rawAuditFields ? { rawAuditFields: alert.rawAuditFields } : {}),
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
  return captureDateEpochMilliseconds(value, label);
}
