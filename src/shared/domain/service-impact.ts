import { normalizeCanonicalIdentity } from './canonical';
import {
  resolveAlertScope,
  type AlertScopeDecision,
  type AlertSnapshotDecision,
  type RawOfficialAlertAudit,
  type ResolvedOfficialAlertDetails,
  type ServiceAlertEvidence,
  type ServiceClaimScope,
} from './alert-scope';

export const SERVICE_CHANGE_UNAVAILABLE_COPY = 'Service change—arrival information is unavailable for this service.';
export const SERVICE_CHANGE_LIMITATION_COPY = 'Service change details are being verified.';

export const CLAIM_SUPPRESSED_PRODUCTS = Object.freeze([
  'live',
  'expected',
  'holding',
  'uncertain',
  'scheduled-fallback',
  'countdown',
  'dependent-guidance',
] as const);

export type ClaimSuppressedProduct = typeof CLAIM_SUPPRESSED_PRODUCTS[number];
export type ServiceChangeDecisionKind =
  | 'eligible-context'
  | 'resolved-suppression'
  | 'arrival-claim-unavailable'
  | 'quarantine-or-limitation';
export type ServiceChangeGateDisposition = 'eligible' | 'resolved-ineligible' | 'high-impact-unresolved' | 'quarantined';

export interface ServiceRecoveryUpdate {
  readonly evidenceId: string;
  readonly sourceTimestamp: Date;
  readonly currentFeed: boolean;
  readonly coherentIdentity: boolean;
  readonly exactDirectionalStop: boolean;
  readonly coherentPath: boolean;
  readonly noCurrentVeto: boolean;
}

export interface ServiceAuditEvidence {
  readonly alertId: string;
  readonly consequence: ServiceAlertEvidence['declaredConsequence'];
  readonly structuredEffect: ServiceAlertEvidence['structuredEffect'];
  readonly temporalState: AlertScopeDecision['temporalState'];
  readonly scope: AlertScopeDecision['kind'];
  readonly assessment: 'context' | 'resolved-hard-risk' | 'high-impact-unresolved' | 'quarantined';
}

export interface ServiceRiskCarryover {
  readonly kind: 'resolved-suppression' | 'arrival-claim-unavailable';
  readonly claimIdentity: string;
  readonly adverseAt: Date;
  readonly riderCopy: string;
  readonly officialDetails: readonly ResolvedOfficialAlertDetails[];
  readonly rawOfficialAudit: readonly RawOfficialAlertAudit[];
  readonly auditEvidence: readonly ServiceAuditEvidence[];
  readonly suppressedProducts: readonly ClaimSuppressedProduct[];
}

export interface ServiceChangeDecision {
  readonly kind: ServiceChangeDecisionKind;
  readonly disposition: ServiceChangeGateDisposition;
  readonly riderCopy: string | null;
  readonly officialDetails: readonly ResolvedOfficialAlertDetails[];
  readonly rawOfficialAudit: readonly RawOfficialAlertAudit[];
  readonly auditEvidence: readonly ServiceAuditEvidence[];
  readonly suppressedProducts: readonly ClaimSuppressedProduct[];
  readonly carryover: ServiceRiskCarryover | null;
  readonly carriedForward: boolean;
  readonly recoveryCount: 0 | 1 | 2;
  readonly contextKind: AlertSnapshotDecision['kind'];
}

export interface ServiceChangeEvaluationInput {
  readonly snapshot: AlertSnapshotDecision;
  readonly claim: ServiceClaimScope;
  readonly priorRisk?: ServiceRiskCarryover | null;
  readonly recoveryUpdates?: readonly ServiceRecoveryUpdate[];
}

interface EvaluatedAlert {
  readonly alert: ServiceAlertEvidence;
  readonly scope: AlertScopeDecision;
  readonly assessment: ServiceAuditEvidence['assessment'];
}

const DESTRUCTIVE = new Set<ServiceAlertEvidence['declaredConsequence']>([
  'local-running-express',
  'reroute',
  'short-turn',
  'partial-suspension',
  'full-suspension',
  'station-closure',
]);

export function evaluateServiceChanges(input: ServiceChangeEvaluationInput): ServiceChangeDecision {
  validateEvaluationInput(input);
  const claimIdentity = serviceClaimIdentity(input.claim);
  const priorRisk = input.priorRisk && input.priorRisk.claimIdentity === claimIdentity ? input.priorRisk : null;

  if (input.snapshot.kind !== 'current') {
    if (priorRisk) return carryForward(priorRisk, input.snapshot.kind, 0);
    return freezeDecision('eligible-context', 'eligible', null, [], [], [], [], null, false, 0, input.snapshot.kind);
  }

  const alerts = canonicalAlerts(input.snapshot.alerts);
  const evaluated = alerts.map((alert) => evaluateAlert(alert, input.claim, input.snapshot.assessedAt));
  const officialDetails = canonicalOfficial(evaluated.map((item) => item.scope.official));
  const rawOfficialAudit = canonicalRawOfficial(input.snapshot.alerts.map(toRawOfficialAudit));
  const auditEvidence = canonicalAudit(evaluated.map(toAudit));
  const hard = evaluated.filter((item) => item.assessment === 'resolved-hard-risk');
  const unavailable = evaluated.filter((item) => item.assessment === 'high-impact-unresolved');
  const quarantined = evaluated.filter((item) => item.assessment === 'quarantined');

  if (hard.length > 0) {
    const riderCopy = hard.map((item) => item.scope.official.header).filter(Boolean).sort(compareText)[0]
      ?? 'Service change—this train is not serving this stop.';
    return adverseDecision('resolved-suppression', 'resolved-ineligible', riderCopy,
      officialDetails, rawOfficialAudit, auditEvidence, claimIdentity, input.snapshot.feedTimestamp ?? input.snapshot.assessedAt,
      input.snapshot.kind);
  }
  if (unavailable.length > 0) {
    return adverseDecision('arrival-claim-unavailable', 'high-impact-unresolved', SERVICE_CHANGE_UNAVAILABLE_COPY,
      officialDetails, rawOfficialAudit, auditEvidence, claimIdentity, input.snapshot.feedTimestamp ?? input.snapshot.assessedAt,
      input.snapshot.kind);
  }
  if (quarantined.length > 0) {
    return freezeDecision('quarantine-or-limitation', 'quarantined', SERVICE_CHANGE_LIMITATION_COPY,
      officialDetails, rawOfficialAudit, auditEvidence, [], null, false, 0, input.snapshot.kind);
  }

  if (priorRisk) {
    const recoveryCount = countQualifyingRecovery(input.recoveryUpdates ?? [], priorRisk.adverseAt, input.snapshot.assessedAt);
    if (recoveryCount < 2) return carryForward(priorRisk, input.snapshot.kind, recoveryCount);
    return freezeDecision('eligible-context', 'eligible', null, officialDetails, rawOfficialAudit, auditEvidence, [], null, false, 2,
      input.snapshot.kind);
  }
  return freezeDecision('eligible-context', 'eligible', null, officialDetails, rawOfficialAudit, auditEvidence, [], null, false, 0,
    input.snapshot.kind);
}

export function serviceChangeClaimDisposition(decision: ServiceChangeDecision): ServiceChangeGateDisposition {
  validateServiceChangeDecision(decision);
  return decision.disposition;
}

export function validateServiceChangeDecision(decision: ServiceChangeDecision): void {
  if (!decision || typeof decision !== 'object'
    || !['eligible-context', 'resolved-suppression', 'arrival-claim-unavailable', 'quarantine-or-limitation'].includes(decision.kind)
    || !['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(decision.disposition)
    || !Array.isArray(decision.officialDetails) || !Array.isArray(decision.rawOfficialAudit) || !Array.isArray(decision.auditEvidence)
    || !Array.isArray(decision.suppressedProducts) || ![0, 1, 2].includes(decision.recoveryCount)
    || !['current', 'stale', 'missing', 'failed', 'quarantined'].includes(decision.contextKind)) {
    throw new Error('Invalid service-change decision');
  }
  const expectedDisposition: Record<ServiceChangeDecisionKind, ServiceChangeGateDisposition> = {
    'eligible-context': 'eligible',
    'resolved-suppression': 'resolved-ineligible',
    'arrival-claim-unavailable': 'high-impact-unresolved',
    'quarantine-or-limitation': 'quarantined',
  };
  if (decision.disposition !== expectedDisposition[decision.kind]) throw new Error('Invalid service-change discriminant');
  const suppresses = decision.kind === 'resolved-suppression' || decision.kind === 'arrival-claim-unavailable';
  if (suppresses !== (decision.suppressedProducts.length === CLAIM_SUPPRESSED_PRODUCTS.length)
    || decision.suppressedProducts.some((item, index) => item !== CLAIM_SUPPRESSED_PRODUCTS[index])) {
    throw new Error('Invalid service-change suppressed products');
  }
}

/** Shared by service and track hard-risk recovery. */
export function countQualifyingRecovery(updates: readonly ServiceRecoveryUpdate[], after?: Date, through?: Date): 0 | 1 | 2 {
  if (!Array.isArray(updates)) throw new Error('Service recovery updates must be an array');
  const afterMs = after === undefined ? Number.NEGATIVE_INFINITY : validDate(after, 'adverse service-change instant');
  const throughMs = through === undefined ? Number.POSITIVE_INFINITY : validDate(through, 'recovery assessment instant');
  if (throughMs < afterMs) throw new Error('Recovery assessment precedes adverse service-change evidence');
  const seenIds = new Set<string>();
  const ordered: ServiceRecoveryUpdate[] = [];
  for (const update of updates) {
    validateRecoveryUpdate(update);
    const id = normalizeCanonicalIdentity(update.evidenceId);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    if (update.sourceTimestamp.getTime() > afterMs && update.sourceTimestamp.getTime() <= throughMs) ordered.push(update);
  }
  ordered.sort((left, right) => left.sourceTimestamp.getTime() - right.sourceTimestamp.getTime()
    || compareText(left.evidenceId, right.evidenceId));
  let count: 0 | 1 | 2 = 0;
  let priorTimestamp = afterMs;
  for (const update of ordered) {
    const timestamp = update.sourceTimestamp.getTime();
    const strictlyNew = timestamp > priorTimestamp;
    const qualifies = strictlyNew && update.currentFeed && update.coherentIdentity && update.exactDirectionalStop
      && update.coherentPath && update.noCurrentVeto;
    count = qualifies ? (count === 0 ? 1 : 2) : 0;
    priorTimestamp = Math.max(priorTimestamp, timestamp);
  }
  return count;
}

function evaluateAlert(alert: ServiceAlertEvidence, claim: ServiceClaimScope, comparisonAt: Date): EvaluatedAlert {
  const scope = resolveAlertScope(alert, claim, comparisonAt);
  if (scope.temporalState === 'preactive' || scope.temporalState === 'expired' || scope.kind === 'unrelated') {
    return { alert, scope, assessment: 'context' };
  }
  if (scope.temporalState === 'indeterminate') {
    return { alert, scope, assessment: DESTRUCTIVE.has(alert.declaredConsequence) ? 'quarantined' : 'context' };
  }
  if (!DESTRUCTIVE.has(alert.declaredConsequence)) return { alert, scope, assessment: 'context' };
  if (!destructiveFieldsAgree(alert, scope.official)) return { alert, scope, assessment: 'quarantined' };
  if (scope.kind === 'unresolved') return { alert, scope, assessment: 'high-impact-unresolved' };
  if (!hasNarrowClaimScope(alert, scope)) {
    if (alert.declaredConsequence === 'full-suspension') return { alert, scope, assessment: 'resolved-hard-risk' };
    return { alert, scope, assessment: 'high-impact-unresolved' };
  }
  return { alert, scope, assessment: 'resolved-hard-risk' };
}

function destructiveFieldsAgree(alert: ServiceAlertEvidence, official: ResolvedOfficialAlertDetails): boolean {
  const text = `${official.header} ${official.description}`.toLocaleLowerCase('en-US');
  switch (alert.declaredConsequence) {
    case 'local-running-express':
      return ['MODIFIED_SERVICE', 'NO_SERVICE'].includes(alert.structuredEffect)
        && /(run(?:ning)? express|skip|not stopp)/.test(text);
    case 'reroute':
      return alert.structuredEffect === 'MODIFIED_SERVICE' && /(rerout|running on|run via| via )/.test(` ${text} `);
    case 'short-turn':
      return alert.structuredEffect === 'MODIFIED_SERVICE' && /(terminat|last stop|end(?:s|ing)? early)/.test(text);
    case 'partial-suspension':
    case 'full-suspension':
      return alert.structuredEffect === 'NO_SERVICE' && /(suspend|no [a-z0-9 ]*trains?|not running)/.test(text);
    case 'station-closure':
      return alert.structuredEffect === 'NO_SERVICE' && /(clos|not stopp|skip)/.test(text);
    default:
      return false;
  }
}

function hasNarrowClaimScope(alert: ServiceAlertEvidence, scope: AlertScopeDecision): boolean {
  const matching = new Set(scope.matchingSelectorIds.map(normalizeCanonicalIdentity));
  return alert.selectors.some((selector) => matching.has(normalizeCanonicalIdentity(selector.selectorId))
    && (selector.exactDirectionalStopId != null
    || (selector.constituentStopIds != null && selector.constituentStopIds.length > 0)
    || (selector.exactDirectionalSegmentStopIds != null && selector.exactDirectionalSegmentStopIds.length > 0)
    || selector.tripId != null
    || selector.trainId != null
    || selector.claimId != null));
}

function canonicalAlerts(alerts: readonly ServiceAlertEvidence[]): ServiceAlertEvidence[] {
  const groups = new Map<string, Map<string, ServiceAlertEvidence>>();
  for (const alert of alerts) {
    const id = normalizeCanonicalIdentity(alert.alertId);
    const variants = groups.get(id) ?? new Map<string, ServiceAlertEvidence>();
    variants.set(alertSignature(alert), alert);
    groups.set(id, variants);
  }
  const result: ServiceAlertEvidence[] = [];
  for (const variants of groups.values()) {
    const ordered = [...variants.entries()].sort((left, right) => compareText(left[0], right[0]));
    // Preserve contradictory same-ID records as separate audit evidence; evaluateServiceChanges
    // will deterministically quarantine the identity by replacing their consequence agreement.
    if (ordered.length === 1) {
      result.push(ordered[0][1]);
    } else {
      for (const [, alert] of ordered) result.push({
        ...alert,
        structuredEffect: 'OTHER_EFFECT',
        declaredConsequence: DESTRUCTIVE.has(alert.declaredConsequence) ? alert.declaredConsequence : 'generic-affected',
      });
    }
  }
  result.sort((left, right) => compareText(left.alertId, right.alertId) || compareText(alertSignature(left), alertSignature(right)));
  return result;
}

function alertSignature(alert: ServiceAlertEvidence): string {
  const periods = alert.activePeriods.map((period) => `${dateSignature(period.startsAt)}/${dateSignature(period.endsAt)}`).sort();
  const selectors = alert.selectors.map((selector) => JSON.stringify({
    selectorId: selector.selectorId,
    routeId: selector.routeId,
    exactDirectionalStopId: selector.exactDirectionalStopId,
    constituentStopIds: selector.constituentStopIds ? [...selector.constituentStopIds].sort(compareText) : selector.constituentStopIds,
    exactDirectionalSegmentStopIds: selector.exactDirectionalSegmentStopIds
      ? [...selector.exactDirectionalSegmentStopIds].sort(compareText) : selector.exactDirectionalSegmentStopIds,
    direction: selector.direction,
    tripId: selector.tripId,
    trainId: selector.trainId,
    claimId: selector.claimId,
  })).sort(compareText);
  return JSON.stringify({ periods, selectors, effect: alert.structuredEffect, consequence: alert.declaredConsequence,
    header: alert.official.headerRaw, description: alert.official.descriptionRaw });
}

function dateSignature(value: Date | null | undefined): string {
  if (value == null) return '';
  return Number.isFinite(value.getTime()) ? value.toISOString() : 'invalid-date';
}

function canonicalOfficial(details: readonly ResolvedOfficialAlertDetails[]): readonly ResolvedOfficialAlertDetails[] {
  const byKey = new Map<string, ResolvedOfficialAlertDetails>();
  for (const item of details) byKey.set(`${normalizeCanonicalIdentity(item.alertId)}\0${item.header}\0${item.description}`, item);
  return Object.freeze([...byKey.values()].sort((left, right) => compareText(left.alertId, right.alertId)
    || compareText(left.header, right.header) || compareText(left.description, right.description)));
}

function canonicalRawOfficial(details: readonly RawOfficialAlertAudit[]): readonly RawOfficialAlertAudit[] {
  const byKey = new Map<string, RawOfficialAlertAudit>();
  for (const item of details) {
    const key = `${normalizeCanonicalIdentity(item.alertId)}\0${item.rawHeader}\0${item.rawDescription}\0${stableAuditFields(item.rawAuditFields)}`;
    byKey.set(key, item);
  }
  return Object.freeze([...byKey.values()].sort((left, right) => compareText(left.alertId, right.alertId)
    || compareText(left.rawHeader, right.rawHeader) || compareText(left.rawDescription, right.rawDescription)
    || compareText(stableAuditFields(left.rawAuditFields), stableAuditFields(right.rawAuditFields))));
}

function toRawOfficialAudit(alert: ServiceAlertEvidence): RawOfficialAlertAudit {
  return Object.freeze({
    alertId: alert.alertId,
    rawHeader: alert.official.headerRaw,
    rawDescription: alert.official.descriptionRaw,
    ...(alert.rawAuditFields ? { rawAuditFields: Object.freeze({ ...alert.rawAuditFields }) } : {}),
  });
}

function stableAuditFields(fields: Readonly<Record<string, unknown>> | undefined): string {
  if (!fields) return '';
  return JSON.stringify(Object.fromEntries(Object.entries(fields).sort(([left], [right]) => compareText(left, right))));
}

function canonicalAudit(items: readonly ServiceAuditEvidence[]): readonly ServiceAuditEvidence[] {
  const byKey = new Map<string, ServiceAuditEvidence>();
  for (const item of items) byKey.set(`${normalizeCanonicalIdentity(item.alertId)}\0${item.consequence}\0${item.structuredEffect}\0${item.scope}\0${item.assessment}`, Object.freeze({ ...item }));
  return Object.freeze([...byKey.values()].sort((left, right) => compareText(left.alertId, right.alertId)
    || compareText(left.consequence, right.consequence) || compareText(left.assessment, right.assessment)));
}

function toAudit(item: EvaluatedAlert): ServiceAuditEvidence {
  return Object.freeze({
    alertId: item.alert.alertId,
    consequence: item.alert.declaredConsequence,
    structuredEffect: item.alert.structuredEffect,
    temporalState: item.scope.temporalState,
    scope: item.scope.kind,
    assessment: item.assessment,
  });
}

function adverseDecision(
  kind: 'resolved-suppression' | 'arrival-claim-unavailable',
  disposition: 'resolved-ineligible' | 'high-impact-unresolved',
  riderCopy: string,
  officialDetails: readonly ResolvedOfficialAlertDetails[],
  rawOfficialAudit: readonly RawOfficialAlertAudit[],
  auditEvidence: readonly ServiceAuditEvidence[],
  claimIdentity: string,
  adverseAt: Date,
  contextKind: AlertSnapshotDecision['kind'],
): ServiceChangeDecision {
  const carryover: ServiceRiskCarryover = Object.freeze({
    kind,
    claimIdentity,
    adverseAt: new Date(adverseAt),
    riderCopy,
    officialDetails,
    rawOfficialAudit,
    auditEvidence,
    suppressedProducts: CLAIM_SUPPRESSED_PRODUCTS,
  });
  return freezeDecision(kind, disposition, riderCopy, officialDetails, rawOfficialAudit, auditEvidence, CLAIM_SUPPRESSED_PRODUCTS,
    carryover, false, 0, contextKind);
}

function carryForward(
  risk: ServiceRiskCarryover,
  contextKind: AlertSnapshotDecision['kind'],
  recoveryCount: 0 | 1 | 2,
): ServiceChangeDecision {
  const disposition = risk.kind === 'resolved-suppression' ? 'resolved-ineligible' : 'high-impact-unresolved';
  return freezeDecision(risk.kind, disposition, risk.riderCopy, risk.officialDetails, risk.rawOfficialAudit, risk.auditEvidence,
    risk.suppressedProducts, risk, true, recoveryCount, contextKind);
}

function freezeDecision(
  kind: ServiceChangeDecisionKind,
  disposition: ServiceChangeGateDisposition,
  riderCopy: string | null,
  officialDetails: readonly ResolvedOfficialAlertDetails[],
  rawOfficialAudit: readonly RawOfficialAlertAudit[],
  auditEvidence: readonly ServiceAuditEvidence[],
  suppressedProducts: readonly ClaimSuppressedProduct[],
  carryover: ServiceRiskCarryover | null,
  carriedForward: boolean,
  recoveryCount: 0 | 1 | 2,
  contextKind: AlertSnapshotDecision['kind'],
): ServiceChangeDecision {
  return Object.freeze({ kind, disposition, riderCopy, officialDetails: Object.freeze([...officialDetails]),
    rawOfficialAudit: Object.freeze([...rawOfficialAudit]),
    auditEvidence: Object.freeze([...auditEvidence]), suppressedProducts: Object.freeze([...suppressedProducts]),
    carryover, carriedForward, recoveryCount, contextKind });
}

function serviceClaimIdentity(claim: ServiceClaimScope): string {
  return [claim.claimId, claim.routeId, claim.exactDirectionalStopId, claim.constituentStopId, claim.direction,
    claim.tripId ?? '', claim.trainId ?? ''].map(normalizeCanonicalIdentity).join('\0');
}

function validateEvaluationInput(input: ServiceChangeEvaluationInput): void {
  if (!input || typeof input !== 'object' || !input.snapshot || !input.claim) throw new Error('Service-change evaluation input is required');
  if (!['current', 'stale', 'missing', 'failed', 'quarantined'].includes(input.snapshot.kind)
    || !Array.isArray(input.snapshot.alerts) || !(input.snapshot.assessedAt instanceof Date)
    || !Number.isFinite(input.snapshot.assessedAt.getTime())) throw new Error('Invalid alert snapshot decision');
  if (!input.claim.claimId || !input.claim.routeId || !input.claim.exactDirectionalStopId || !input.claim.constituentStopId) {
    throw new Error('Exact service claim is required');
  }
  if (input.recoveryUpdates !== undefined && !Array.isArray(input.recoveryUpdates)) throw new Error('Invalid service recovery updates');
}

function validateRecoveryUpdate(update: ServiceRecoveryUpdate): void {
  if (!update || typeof update !== 'object' || !update.evidenceId?.trim()
    || !(update.sourceTimestamp instanceof Date) || !Number.isFinite(update.sourceTimestamp.getTime())
    || [update.currentFeed, update.coherentIdentity, update.exactDirectionalStop, update.coherentPath, update.noCurrentVeto]
      .some((value) => typeof value !== 'boolean')) throw new Error('Invalid service recovery evidence');
}

function validDate(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}

function compareText(left: string, right: string): number {
  const a = normalizeCanonicalIdentity(left);
  const b = normalizeCanonicalIdentity(right);
  return a < b ? -1 : a > b ? 1 : 0;
}
