import {
  encodeCanonicalIdentityTuple,
  encodeCanonicalStringTuple,
  normalizeBoundedIdentity,
  normalizeCanonicalIdentity,
} from './canonical';
import {
  resolveAlertScope,
  type AlertScopeDecision,
  type AlertSnapshotDecision,
  type RawOfficialAlertAudit,
  type ResolvedOfficialAlertDetails,
  type ServiceAlertEvidence,
  type ServiceClaimScope,
} from './alert-scope';
import { captureDateEpochMilliseconds, validateEpochMilliseconds } from './temporal';

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

export interface ServiceContextDetail {
  readonly relation: 'unrelated' | 'informational';
  readonly official: ResolvedOfficialAlertDetails;
}

export interface ServiceRiskCarryover {
  readonly kind: 'resolved-suppression' | 'arrival-claim-unavailable';
  readonly claimIdentity: string;
  readonly evaluatedClaim: ServiceClaimScope;
  readonly adverseAtMs: number;
  readonly riderCopy: string;
  readonly officialDetails: readonly ResolvedOfficialAlertDetails[];
  readonly rawOfficialAudit: readonly RawOfficialAlertAudit[];
  readonly auditEvidence: readonly ServiceAuditEvidence[];
  readonly suppressedProducts: readonly ClaimSuppressedProduct[];
}

export interface ServiceChangeDecision {
  readonly kind: ServiceChangeDecisionKind;
  readonly disposition: ServiceChangeGateDisposition;
  readonly claimIdentity: string;
  readonly evaluatedClaim: ServiceClaimScope;
  readonly riderCopy: string | null;
  readonly officialDetails: readonly ResolvedOfficialAlertDetails[];
  readonly contextDetails: readonly ServiceContextDetail[];
  readonly rawOfficialAudit: readonly RawOfficialAlertAudit[];
  readonly auditEvidence: readonly ServiceAuditEvidence[];
  readonly suppressedProducts: readonly ClaimSuppressedProduct[];
  readonly carryover: ServiceRiskCarryover | null;
  readonly carriedForward: boolean;
  readonly recoveryCount: 0 | 1 | 2;
  readonly contextKind: AlertSnapshotDecision['kind'];
  readonly assessedAtMs: number;
  readonly alertContextIdentity: string;
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

interface CanonicalAlert {
  readonly alert: ServiceAlertEvidence;
  readonly identityConflict: boolean;
}

interface CapturedAlertEpoch {
  readonly assessedAtMs: number;
  readonly feedTimestampMs: number | null;
}

const DESTRUCTIVE = new Set<ServiceAlertEvidence['declaredConsequence']>([
  'local-running-express',
  'reroute',
  'short-turn',
  'partial-suspension',
  'full-suspension',
  'station-closure',
]);

// Exact object provenance is intentionally private and cannot survive copying,
// serialization, descriptor cloning, symbols, or Proxy wrapping.
const ISSUED_SERVICE_CHANGE_DECISIONS = new WeakSet<object>();
const ISSUED_SERVICE_RISK_CARRYOVERS = new WeakSet<object>();

export function evaluateServiceChanges(input: ServiceChangeEvaluationInput): ServiceChangeDecision {
  const epochs = validateEvaluationInput(input);
  const assessmentAt = new Date(epochs.assessedAtMs);
  const evaluatedClaim = freezeClaim(input.claim);
  const claimIdentity = serviceClaimIdentity(evaluatedClaim);
  const priorRiskBinding = bindPriorServiceRisk(input.priorRisk, claimIdentity);
  const priorRisk = priorRiskBinding.kind === 'bound' ? priorRiskBinding.risk : null;

  if (input.snapshot.kind !== 'current') {
    if (priorRiskBinding.kind === 'invalid') {
      return freezeDecision('quarantine-or-limitation', 'quarantined', evaluatedClaim, SERVICE_CHANGE_LIMITATION_COPY,
        [], [], [], [], [], null, false, 0, input.snapshot, epochs);
    }
    if (priorRisk) return carryForward(priorRisk, evaluatedClaim, input.snapshot, epochs, 0);
    return freezeDecision('eligible-context', 'eligible', evaluatedClaim, null, [], [], [], [], [], null, false, 0,
      input.snapshot, epochs);
  }

  const alerts = canonicalAlerts(input.snapshot.alerts);
  const evaluated = alerts.map(({ alert, identityConflict }) =>
    evaluateAlert(alert, evaluatedClaim, assessmentAt, identityConflict));
  const related = evaluated.filter((item) => item.scope.kind !== 'unrelated');
  const contextual = evaluated.filter((item) => item.scope.kind === 'unrelated');
  const officialDetails = canonicalOfficial(related.map((item) => item.scope.official));
  const contextDetails = canonicalContext(contextual.map((item) => Object.freeze({
    relation: item.scope.temporalState === 'active' ? 'unrelated' as const : 'informational' as const,
    official: item.scope.official,
  })));
  const rawOfficialAudit = canonicalRawOfficial(input.snapshot.alerts.map(toRawOfficialAudit));
  const auditEvidence = canonicalAudit(evaluated.map(toAudit));
  const hard = evaluated.filter((item) => item.assessment === 'resolved-hard-risk');
  const unavailable = evaluated.filter((item) => item.assessment === 'high-impact-unresolved');
  const quarantined = evaluated.filter((item) => item.assessment === 'quarantined');
  const adverseAtMs = epochs.assessedAtMs;

  if (priorRisk && epochs.feedTimestampMs !== null && epochs.feedTimestampMs <= priorRisk.adverseAtMs) {
    const reset = resetRiskBoundary(priorRisk, evaluatedClaim, adverseAtMs);
    return carryForward(reset, evaluatedClaim, input.snapshot, epochs, 0, contextDetails);
  }

  if (hard.length > 0) {
    const riderCopy = hard.map((item) => item.scope.official.header).filter(Boolean).sort(compareText)[0]
      ?? 'Service change—this train is not serving this stop.';
    return adverseDecision('resolved-suppression', 'resolved-ineligible', evaluatedClaim, riderCopy, officialDetails,
      contextDetails, rawOfficialAudit, auditEvidence, adverseAtMs, input.snapshot, epochs);
  }

  if (priorRiskBinding.kind === 'invalid') {
    if (unavailable.length > 0) {
      return adverseDecision('arrival-claim-unavailable', 'high-impact-unresolved', evaluatedClaim,
        SERVICE_CHANGE_UNAVAILABLE_COPY, officialDetails, contextDetails, rawOfficialAudit, auditEvidence, adverseAtMs,
        input.snapshot, epochs);
    }
    return freezeDecision('quarantine-or-limitation', 'quarantined', evaluatedClaim, SERVICE_CHANGE_LIMITATION_COPY,
      officialDetails, contextDetails, rawOfficialAudit, auditEvidence, [], null, false, 0, input.snapshot, epochs);
  }

  // A current ambiguity cannot clear a prior hard veto. It starts a new recovery
  // boundary so updates captured before the contradiction cannot be donated later.
  if (priorRisk?.kind === 'resolved-suppression' && (unavailable.length > 0 || quarantined.length > 0)) {
    const reset = resetRiskBoundary(priorRisk, evaluatedClaim, adverseAtMs);
    return carryForward(reset, evaluatedClaim, input.snapshot, epochs, 0, contextDetails);
  }

  if (priorRisk?.kind === 'resolved-suppression') {
    return recoverOrCarry(priorRisk, evaluatedClaim, input, epochs, officialDetails, contextDetails, rawOfficialAudit,
      auditEvidence);
  }

  if (unavailable.length > 0) {
    return adverseDecision('arrival-claim-unavailable', 'high-impact-unresolved', evaluatedClaim,
      SERVICE_CHANGE_UNAVAILABLE_COPY, officialDetails, contextDetails, rawOfficialAudit, auditEvidence, adverseAtMs,
      input.snapshot, epochs);
  }

  if (priorRisk?.kind === 'arrival-claim-unavailable' && quarantined.length > 0) {
    const reset = resetRiskBoundary(priorRisk, evaluatedClaim, adverseAtMs);
    return carryForward(reset, evaluatedClaim, input.snapshot, epochs, 0, contextDetails);
  }

  if (priorRisk?.kind === 'arrival-claim-unavailable') {
    return recoverOrCarry(priorRisk, evaluatedClaim, input, epochs, officialDetails, contextDetails, rawOfficialAudit,
      auditEvidence);
  }

  if (quarantined.length > 0) {
    return freezeDecision('quarantine-or-limitation', 'quarantined', evaluatedClaim, SERVICE_CHANGE_LIMITATION_COPY,
      officialDetails, contextDetails, rawOfficialAudit, auditEvidence, [], null, false, 0, input.snapshot, epochs);
  }

  return freezeDecision('eligible-context', 'eligible', evaluatedClaim, null, officialDetails, contextDetails,
    rawOfficialAudit, auditEvidence, [], null, false, 0, input.snapshot, epochs);
}

export function serviceChangeClaimDisposition(decision: ServiceChangeDecision): ServiceChangeGateDisposition {
  validateServiceChangeDecision(decision);
  return decision.disposition;
}

export function validateServiceChangeDecision(decision: ServiceChangeDecision): void {
  if (!decision || typeof decision !== 'object' || !ISSUED_SERVICE_CHANGE_DECISIONS.has(decision)) {
    throw new Error('Expected an issued service-change decision');
  }
  if (!Object.isFrozen(decision)
    || !['eligible-context', 'resolved-suppression', 'arrival-claim-unavailable', 'quarantine-or-limitation'].includes(decision.kind)
    || !['eligible', 'resolved-ineligible', 'high-impact-unresolved', 'quarantined'].includes(decision.disposition)
    || typeof decision.claimIdentity !== 'string' || !decision.claimIdentity
    || !isExactClaim(decision.evaluatedClaim) || !Object.isFrozen(decision.evaluatedClaim)
    || decision.claimIdentity !== serviceClaimIdentity(decision.evaluatedClaim)
    || !Array.isArray(decision.officialDetails) || !Object.isFrozen(decision.officialDetails)
    || !Array.isArray(decision.contextDetails) || !Object.isFrozen(decision.contextDetails)
    || !Array.isArray(decision.rawOfficialAudit) || !Object.isFrozen(decision.rawOfficialAudit)
    || !Array.isArray(decision.auditEvidence) || !Object.isFrozen(decision.auditEvidence)
    || !Array.isArray(decision.suppressedProducts) || !Object.isFrozen(decision.suppressedProducts)
    || typeof decision.carriedForward !== 'boolean' || ![0, 1, 2].includes(decision.recoveryCount)
    || !['current', 'stale', 'missing', 'failed', 'quarantined'].includes(decision.contextKind)
    || !Number.isSafeInteger(decision.assessedAtMs)
    || typeof decision.alertContextIdentity !== 'string' || !decision.alertContextIdentity) {
    throw new Error('Invalid issued service-change decision');
  }
  const expectedDisposition: Record<ServiceChangeDecisionKind, ServiceChangeGateDisposition> = {
    'eligible-context': 'eligible',
    'resolved-suppression': 'resolved-ineligible',
    'arrival-claim-unavailable': 'high-impact-unresolved',
    'quarantine-or-limitation': 'quarantined',
  };
  if (decision.disposition !== expectedDisposition[decision.kind]) throw new Error('Invalid service-change discriminant');
  const suppresses = decision.kind === 'resolved-suppression' || decision.kind === 'arrival-claim-unavailable';
  if (suppresses !== hasExactSuppressedProducts(decision.suppressedProducts)) {
    throw new Error('Invalid service-change suppressed products');
  }

  if (decision.kind === 'eligible-context') {
    if (decision.riderCopy !== null || decision.suppressedProducts.length !== 0 || decision.carryover !== null
      || decision.carriedForward || ![0, 2].includes(decision.recoveryCount)
      || (decision.recoveryCount === 2 && decision.contextKind !== 'current')) {
      throw new Error('Invalid eligible service-change decision');
    }
    return;
  }
  if (decision.kind === 'quarantine-or-limitation') {
    if (decision.riderCopy !== SERVICE_CHANGE_LIMITATION_COPY || decision.suppressedProducts.length !== 0
      || decision.carryover !== null || decision.carriedForward || decision.recoveryCount !== 0) {
      throw new Error('Invalid limited service-change decision');
    }
    return;
  }

  const risk = decision.carryover;
  try {
    validateServiceRiskCarryover(risk, decision.claimIdentity);
  } catch {
    throw new Error('Invalid service-change carryover claim');
  }
  if (!risk || risk.kind !== decision.kind || typeof decision.riderCopy !== 'string' || !decision.riderCopy
    || risk.riderCopy !== decision.riderCopy || decision.recoveryCount === 2
    || (!decision.carriedForward && decision.recoveryCount !== 0)) throw new Error('Invalid service-change carryover claim');
}

function hasExactSuppressedProducts(products: readonly ClaimSuppressedProduct[]): boolean {
  return products.length === CLAIM_SUPPRESSED_PRODUCTS.length
    && products.every((item, index) => item === CLAIM_SUPPRESSED_PRODUCTS[index]);
}

/** Shared by service and track hard-risk recovery. */
export function countQualifyingRecovery(
  updates: readonly ServiceRecoveryUpdate[],
  after?: Date | number,
  through?: Date | number,
): 0 | 1 | 2 {
  if (!Array.isArray(updates)) throw new Error('Service recovery updates must be an array');
  const afterMs = after === undefined ? Number.NEGATIVE_INFINITY : captureRecoveryBoundary(after, 'adverse service-change instant');
  const throughMs = through === undefined ? Number.POSITIVE_INFINITY
    : captureRecoveryBoundary(through, 'recovery assessment instant');
  if (throughMs < afterMs) throw new Error('Recovery assessment precedes adverse service-change evidence');

  const groups = new Map<string, Map<string, { readonly update: ServiceRecoveryUpdate; readonly timestampMs: number }>>();
  for (const update of updates) {
    const timestampMs = validateRecoveryUpdate(update);
    const id = normalizeCanonicalIdentity(update.evidenceId);
    const variants = groups.get(id) ?? new Map<string, { readonly update: ServiceRecoveryUpdate; readonly timestampMs: number }>();
    variants.set(recoverySignature(update, timestampMs), { update, timestampMs });
    groups.set(id, variants);
  }
  if ([...groups.values()].some((variants) => variants.size > 1)) return 0;

  const ordered = [...groups.entries()]
    .map(([id, variants]) => ({ id, captured: variants.values().next().value as {
      readonly update: ServiceRecoveryUpdate; readonly timestampMs: number;
    } }))
    .filter(({ captured }) => captured.timestampMs > afterMs && captured.timestampMs <= throughMs)
    .sort((left, right) => left.captured.timestampMs - right.captured.timestampMs
      || compareText(left.id, right.id));
  let count: 0 | 1 | 2 = 0;
  let priorTimestamp = afterMs;
  for (const { captured: { update, timestampMs } } of ordered) {
    const timestamp = timestampMs;
    const strictlyNew = timestamp > priorTimestamp;
    const qualifies = strictlyNew && update.currentFeed && update.coherentIdentity && update.exactDirectionalStop
      && update.coherentPath && update.noCurrentVeto;
    count = qualifies ? (count === 0 ? 1 : 2) : 0;
    priorTimestamp = Math.max(priorTimestamp, timestamp);
  }
  return count;
}

function evaluateAlert(
  alert: ServiceAlertEvidence,
  claim: ServiceClaimScope,
  comparisonAt: Date,
  identityConflict: boolean,
): EvaluatedAlert {
  const scope = resolveAlertScope(alert, claim, comparisonAt);
  if (scope.temporalState === 'preactive' || scope.temporalState === 'expired' || scope.kind === 'unrelated') {
    return { alert, scope, assessment: 'context' };
  }
  if (identityConflict) return { alert, scope, assessment: 'quarantined' };
  if (scope.temporalState === 'indeterminate') {
    return { alert, scope, assessment: DESTRUCTIVE.has(alert.declaredConsequence) ? 'quarantined' : 'context' };
  }
  if (!DESTRUCTIVE.has(alert.declaredConsequence)) return { alert, scope, assessment: 'context' };
  if (!destructiveFieldsAgree(alert, scope.official)) return { alert, scope, assessment: 'quarantined' };

  if (alert.declaredConsequence === 'short-turn') {
    if (scope.kind === 'unresolved') {
      return { alert, scope, assessment: alert.independentHighImpactBasis?.kind === 'verified-terminal-change'
        ? 'high-impact-unresolved' : 'quarantined' };
    }
    return { alert, scope, assessment: hasExactShortTurnScope(alert, scope, claim)
      ? 'resolved-hard-risk' : 'quarantined' };
  }

  if (scope.kind === 'unresolved') return { alert, scope, assessment: 'high-impact-unresolved' };
  if (!hasNarrowClaimScope(alert, scope)) {
    if (alert.declaredConsequence === 'full-suspension') return { alert, scope, assessment: 'resolved-hard-risk' };
    return { alert, scope, assessment: 'high-impact-unresolved' };
  }
  return { alert, scope, assessment: 'resolved-hard-risk' };
}

function destructiveFieldsAgree(alert: ServiceAlertEvidence, official: ResolvedOfficialAlertDetails): boolean {
  const text = normalizeDestructiveText(`${official.header} ${official.description}`);
  if (contradictsDestructiveEffect(text)) return false;
  switch (alert.declaredConsequence) {
    case 'local-running-express':
      return ['MODIFIED_SERVICE', 'NO_SERVICE'].includes(alert.structuredEffect)
        && /\b(?:trains?\s+)?(?:run|runs|running)\s+express\b|\bnot\s+stopping\b|\bskip(?:s|ped|ping)?\b|\bbypass(?:es|ed|ing)?\b/.test(text);
    case 'reroute':
      return alert.structuredEffect === 'MODIFIED_SERVICE'
        && /\brerout(?:e|es|ed|ing)\b|\brun(?:s|ning)?\s+on\b|\brun(?:s|ning)?\s+via\b/.test(text);
    case 'short-turn':
      return alert.structuredEffect === 'MODIFIED_SERVICE'
        && /\bterminat(?:e|es|ed|ing)\b|\blast\s+stop\b|\bend(?:s|ed|ing)?\s+early\b/.test(text);
    case 'partial-suspension':
    case 'full-suspension':
      return alert.structuredEffect === 'NO_SERVICE'
        && /\bsuspend(?:ed|ing|s)?\b|\bno\s+[a-z0-9 -]*trains?\b|\bnot\s+running\b/.test(text);
    case 'station-closure':
      return alert.structuredEffect === 'NO_SERVICE'
        && /\bstation\s+(?:is\s+)?closed\b|\btrains?\s+(?:are\s+)?not\s+stopping\b|\btrains?\s+(?:do|does|did|will|would|can|could|shall|should|may|might)\s+not\s+stop\b|\btrains?\s+(?:skip|skips|are\s+skipping)\b|\bskip(?:ping)?\s+(?:this\s+|the\s+)?(?:station|stop)\b/.test(text);
    default:
      return false;
  }
}

function contradictsDestructiveEffect(text: string): boolean {
  const destructivePredicate = '(?:skip(?:s|ped|ping)?|bypass(?:es|ed|ing)?|terminat(?:e|es|ed|ing)|end(?:s|ed|ing)? early|(?:be )?(?:the )?last stop|rerout(?:e|es|ed|ing)|run(?:s|ning)? (?:express|on|via)|clos(?:e|es|ed|ing)|suspend(?:s|ed|ing)?)';
  const auxiliary = '(?:do|does|did|will|would|can|could|shall|should|may|might|is|are|was|were|has|have|had)';
  const auxiliaryNegation = new RegExp(`\\b${auxiliary}\\s+not\\s+(?:(?:be|being|been)\\s+)?${destructivePredicate}\\b`);
  const directNegation = new RegExp(`\\bnot\\s+(?:(?:be|being|been)\\s+)?${destructivePredicate}\\b`);
  const neverNegation = new RegExp(`\\bnever\\s+(?:(?:be|being|been)\\s+)?${destructivePredicate}\\b`);
  const withoutNegation = /\bwithout\s+(?:(?:any|ever)\s+)?(?:skipping|bypassing|terminating|ending\s+early|being\s+(?:the\s+)?last\s+stop|running\s+(?:express|on|via)|rerouting|closing|suspending|a\s+(?:reroute|closure|suspension))\b/;
  const noPredicate = /\bno\s+(?:(?:scheduled\s+)?stops?\s+(?:(?:are|were|will|would|can|could|shall|should|may|might)\s+(?:be\s+)?)?(?:skipped|bypassed)|bypasses|(?:early\s+)?terminations?|reroutes?|station\s+closures?|closures?|service\s+suspensions?|suspensions?)\b/;
  const recoveredService = /\bnormal service (?:(?:has|have|had) )?(?:resum(?:e|es|ed|ing)|continue(?:s|d|ing)?|return(?:s|ed|ing)?|been restored)\b|\bservice (?:is|was|has been|had been) back to normal\b/;
  return recoveredService.test(text) || auxiliaryNegation.test(text) || directNegation.test(text) || neverNegation.test(text)
    || withoutNegation.test(text) || noPredicate.test(text)
    || /\bnot\s+closed\b|\bremain(?:s|ed|ing)?\s+open\b|\bcontinue(?:s|d|ing)?\s+(?:to\s+)?(?:stop|stopping|serve|serving|make)\b|\ball\s+[a-z0-9 ]*stops?\s+continue\b|\ball\s+(?:scheduled\s+)?stops?\b|\bskip(?:s|ping)?\s+no\s+stops?\b|\bnormal\s+service\s+continue(?:s|d|ing)?\b/.test(text);
}

function normalizeDestructiveText(text: string): string {
  return text.normalize('NFKC').toLocaleLowerCase('en-US')
    .replace(/[\u2018\u2019\u02bc\uff07]/gu, "'")
    .replace(/\bwon't\b/gu, 'will not')
    .replace(/\bshan't\b/gu, 'shall not')
    .replace(/\bcan't\b/gu, 'can not')
    .replace(/\b([a-z]+)n't\b/gu, '$1 not')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
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

function hasExactShortTurnScope(
  alert: ServiceAlertEvidence,
  scope: AlertScopeDecision,
  claim: ServiceClaimScope,
): boolean {
  const matching = new Set(scope.matchingSelectorIds.map(normalizeCanonicalIdentity));
  const stopId = normalizeCanonicalIdentity(claim.exactDirectionalStopId);
  return alert.selectors.some((selector) => matching.has(normalizeCanonicalIdentity(selector.selectorId))
    && (selector.exactDirectionalStopId != null
      && normalizeCanonicalIdentity(selector.exactDirectionalStopId) === stopId
      || selector.exactDirectionalSegmentStopIds != null
      && selector.exactDirectionalSegmentStopIds.some((id) => normalizeCanonicalIdentity(id) === stopId)));
}

function canonicalAlerts(alerts: readonly ServiceAlertEvidence[]): CanonicalAlert[] {
  const groups = new Map<string, Map<string, ServiceAlertEvidence>>();
  for (const alert of alerts) {
    const id = normalizeCanonicalIdentity(alert.alertId);
    const variants = groups.get(id) ?? new Map<string, ServiceAlertEvidence>();
    variants.set(alertSignature(alert), alert);
    groups.set(id, variants);
  }
  const result: CanonicalAlert[] = [];
  for (const [id, variants] of groups) {
    const ordered = [...variants.entries()].sort((left, right) => compareText(left[0], right[0]));
    for (const [, alert] of ordered) result.push(Object.freeze({
      alert: Object.freeze({ ...alert, alertId: id }),
      identityConflict: ordered.length > 1,
    }));
  }
  result.sort((left, right) => compareText(left.alert.alertId, right.alert.alertId)
    || compareText(alertSignature(left.alert), alertSignature(right.alert)));
  return result;
}

function alertSignature(alert: ServiceAlertEvidence): string {
  const periods = alert.activePeriods.map((period) => `${dateSignature(period.startsAt)}/${dateSignature(period.endsAt)}`).sort();
  const selectors = alert.selectors.map((selector) => JSON.stringify({
    selectorId: normalizeCanonicalIdentity(selector.selectorId),
    routeId: selector.routeId == null ? selector.routeId : normalizeCanonicalIdentity(selector.routeId),
    exactDirectionalStopId: selector.exactDirectionalStopId == null ? selector.exactDirectionalStopId
      : normalizeCanonicalIdentity(selector.exactDirectionalStopId),
    constituentStopIds: selector.constituentStopIds
      ? selector.constituentStopIds.map(normalizeCanonicalIdentity).sort(compareText) : selector.constituentStopIds,
    exactDirectionalSegmentStopIds: selector.exactDirectionalSegmentStopIds
      ? selector.exactDirectionalSegmentStopIds.map(normalizeCanonicalIdentity).sort(compareText)
      : selector.exactDirectionalSegmentStopIds,
    direction: selector.direction,
    tripId: selector.tripId == null ? selector.tripId : normalizeCanonicalIdentity(selector.tripId),
    trainId: selector.trainId == null ? selector.trainId : normalizeCanonicalIdentity(selector.trainId),
    claimId: selector.claimId == null ? selector.claimId : normalizeCanonicalIdentity(selector.claimId),
  })).sort(compareText);
  return JSON.stringify({
    periods,
    selectors,
    effect: alert.structuredEffect,
    consequence: alert.declaredConsequence,
    header: alert.official.headerRaw.normalize('NFC'),
    description: alert.official.descriptionRaw.normalize('NFC'),
    independentHighImpactBasis: alert.independentHighImpactBasis
      ? { kind: alert.independentHighImpactBasis.kind,
        evidenceId: normalizeCanonicalIdentity(alert.independentHighImpactBasis.evidenceId) } : null,
  });
}

function dateSignature(value: Date | null | undefined): string {
  if (value == null) return '';
  try {
    return new Date(captureDateEpochMilliseconds(value, 'alert period signature instant')).toISOString();
  } catch {
    return 'invalid-date';
  }
}

function canonicalOfficial(details: readonly ResolvedOfficialAlertDetails[]): readonly ResolvedOfficialAlertDetails[] {
  const byKey = new Map<string, ResolvedOfficialAlertDetails>();
  for (const item of details) {
    const normalized = Object.freeze({ ...item, alertId: normalizeCanonicalIdentity(item.alertId) });
    byKey.set(encodeCanonicalStringTuple([normalized.alertId, normalized.header, normalized.description]), normalized);
  }
  return Object.freeze([...byKey.values()].sort((left, right) => compareText(left.alertId, right.alertId)
    || compareText(left.header, right.header) || compareText(left.description, right.description)));
}

function canonicalContext(details: readonly ServiceContextDetail[]): readonly ServiceContextDetail[] {
  const byKey = new Map<string, ServiceContextDetail>();
  for (const item of details) {
    const normalized = Object.freeze({ relation: item.relation, official: Object.freeze({
      ...item.official, alertId: normalizeCanonicalIdentity(item.official.alertId),
    }) });
    byKey.set(encodeCanonicalStringTuple([normalized.relation, normalized.official.alertId,
      normalized.official.header, normalized.official.description]),
      normalized);
  }
  return Object.freeze([...byKey.values()].sort((left, right) => compareText(left.official.alertId, right.official.alertId)
    || compareText(left.relation, right.relation) || compareText(left.official.header, right.official.header)));
}

function canonicalRawOfficial(details: readonly RawOfficialAlertAudit[]): readonly RawOfficialAlertAudit[] {
  const byKey = new Map<string, RawOfficialAlertAudit>();
  for (const item of details) {
    const normalized = Object.freeze({ ...item, alertId: normalizeCanonicalIdentity(item.alertId) });
    const key = encodeCanonicalStringTuple([normalized.alertId, normalized.rawHeader, normalized.rawDescription,
      stableAuditFields(normalized.rawAuditFields)]);
    byKey.set(key, normalized);
  }
  return Object.freeze([...byKey.values()].sort((left, right) => compareText(left.alertId, right.alertId)
    || compareText(left.rawHeader, right.rawHeader) || compareText(left.rawDescription, right.rawDescription)
    || compareText(stableAuditFields(left.rawAuditFields), stableAuditFields(right.rawAuditFields))));
}

function toRawOfficialAudit(alert: ServiceAlertEvidence): RawOfficialAlertAudit {
  return Object.freeze({
    alertId: normalizeCanonicalIdentity(alert.alertId),
    rawHeader: alert.official.headerRaw,
    rawDescription: alert.official.descriptionRaw,
    ...(alert.rawAuditFields ? { rawAuditFields: alert.rawAuditFields } : {}),
  });
}

function stableAuditFields(fields: Readonly<Record<string, unknown>> | undefined): string {
  if (!fields) return '';
  return stableValue(fields);
}

function alertSnapshotIdentity(snapshot: AlertSnapshotDecision, feedTimestampMs: number | null): string {
  const evidence = snapshot.alerts.map((item) => encodeCanonicalStringTuple([
    normalizeBoundedIdentity(item.alertId, 'alert'),
    alertSignature(item),
    stableAuditFields(item.rawAuditFields),
  ])).sort(compareText);
  return encodeCanonicalStringTuple([
    snapshot.kind,
    feedTimestampMs === null ? null : new Date(feedTimestampMs).toISOString(),
    ...evidence,
  ]);
}

function stableValue(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => compareText(left, right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableValue(item)}`).join(',')}}`;
}

function canonicalAudit(items: readonly ServiceAuditEvidence[]): readonly ServiceAuditEvidence[] {
  const byKey = new Map<string, ServiceAuditEvidence>();
  for (const item of items) {
    const normalized = Object.freeze({ ...item, alertId: normalizeCanonicalIdentity(item.alertId) });
    byKey.set(encodeCanonicalStringTuple([normalized.alertId, normalized.consequence, normalized.structuredEffect,
      normalized.temporalState, normalized.scope, normalized.assessment]),
      normalized);
  }
  return Object.freeze([...byKey.values()].sort((left, right) => compareText(left.alertId, right.alertId)
    || compareText(left.consequence, right.consequence) || compareText(left.assessment, right.assessment)));
}

function toAudit(item: EvaluatedAlert): ServiceAuditEvidence {
  return Object.freeze({
    alertId: normalizeCanonicalIdentity(item.alert.alertId),
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
  evaluatedClaim: ServiceClaimScope,
  riderCopy: string,
  officialDetails: readonly ResolvedOfficialAlertDetails[],
  contextDetails: readonly ServiceContextDetail[],
  rawOfficialAudit: readonly RawOfficialAlertAudit[],
  auditEvidence: readonly ServiceAuditEvidence[],
  adverseAtMs: number,
  snapshot: AlertSnapshotDecision,
  epochs: CapturedAlertEpoch,
): ServiceChangeDecision {
  const carryover = freezeRisk(kind, evaluatedClaim, adverseAtMs, riderCopy, officialDetails, rawOfficialAudit, auditEvidence);
  return freezeDecision(kind, disposition, evaluatedClaim, riderCopy, officialDetails, contextDetails, rawOfficialAudit,
    auditEvidence, CLAIM_SUPPRESSED_PRODUCTS, carryover, false, 0, snapshot, epochs);
}

function recoverOrCarry(
  risk: ServiceRiskCarryover,
  evaluatedClaim: ServiceClaimScope,
  input: ServiceChangeEvaluationInput,
  epochs: CapturedAlertEpoch,
  officialDetails: readonly ResolvedOfficialAlertDetails[],
  contextDetails: readonly ServiceContextDetail[],
  rawOfficialAudit: readonly RawOfficialAlertAudit[],
  auditEvidence: readonly ServiceAuditEvidence[],
): ServiceChangeDecision {
  if (epochs.assessedAtMs <= risk.adverseAtMs) {
    return carryForward(risk, evaluatedClaim, input.snapshot, epochs, 0, contextDetails);
  }
  const recoveryCount = countQualifyingRecovery(input.recoveryUpdates ?? [], risk.adverseAtMs, epochs.assessedAtMs);
  if (recoveryCount < 2) return carryForward(risk, evaluatedClaim, input.snapshot, epochs, recoveryCount, contextDetails);
  return freezeDecision('eligible-context', 'eligible', evaluatedClaim, null, officialDetails, contextDetails,
    rawOfficialAudit, auditEvidence, [], null, false, 2, input.snapshot, epochs);
}

function carryForward(
  risk: ServiceRiskCarryover,
  evaluatedClaim: ServiceClaimScope,
  snapshot: AlertSnapshotDecision,
  epochs: CapturedAlertEpoch,
  recoveryCount: 0 | 1 | 2,
  contextDetails: readonly ServiceContextDetail[] = [],
): ServiceChangeDecision {
  const disposition = risk.kind === 'resolved-suppression' ? 'resolved-ineligible' : 'high-impact-unresolved';
  return freezeDecision(risk.kind, disposition, evaluatedClaim, risk.riderCopy, risk.officialDetails, contextDetails,
    risk.rawOfficialAudit, risk.auditEvidence, risk.suppressedProducts, risk, true, recoveryCount, snapshot, epochs);
}

function resetRiskBoundary(
  risk: ServiceRiskCarryover,
  evaluatedClaim: ServiceClaimScope,
  adverseAtMs: number,
): ServiceRiskCarryover {
  const monotonicAdverseAtMs = Math.max(risk.adverseAtMs,
    validateEpochMilliseconds(adverseAtMs, 'adverse service-change instant'));
  return freezeRisk(risk.kind, evaluatedClaim, monotonicAdverseAtMs, risk.riderCopy, risk.officialDetails, risk.rawOfficialAudit,
    risk.auditEvidence);
}

function freezeRisk(
  kind: ServiceRiskCarryover['kind'],
  evaluatedClaim: ServiceClaimScope,
  adverseAtMs: number,
  riderCopy: string,
  officialDetails: readonly ResolvedOfficialAlertDetails[],
  rawOfficialAudit: readonly RawOfficialAlertAudit[],
  auditEvidence: readonly ServiceAuditEvidence[],
): ServiceRiskCarryover {
  const claim = freezeClaim(evaluatedClaim);
  const boundaryMs = validateEpochMilliseconds(adverseAtMs, 'adverse service-change instant');
  const risk = Object.freeze({
    kind,
    claimIdentity: serviceClaimIdentity(claim),
    evaluatedClaim: claim,
    adverseAtMs: boundaryMs,
    riderCopy,
    officialDetails: Object.freeze([...officialDetails]),
    rawOfficialAudit: Object.freeze([...rawOfficialAudit]),
    auditEvidence: Object.freeze([...auditEvidence]),
    suppressedProducts: CLAIM_SUPPRESSED_PRODUCTS,
  } satisfies ServiceRiskCarryover);
  ISSUED_SERVICE_RISK_CARRYOVERS.add(risk);
  return risk;
}

type PriorServiceRiskBinding =
  | { readonly kind: 'absent' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'bound'; readonly risk: ServiceRiskCarryover };

function bindPriorServiceRisk(
  risk: ServiceRiskCarryover | null | undefined,
  expectedClaimIdentity: string,
): PriorServiceRiskBinding {
  if (risk == null) return { kind: 'absent' };
  try {
    validateServiceRiskCarryover(risk, expectedClaimIdentity);
    return { kind: 'bound', risk };
  } catch {
    return { kind: 'invalid' };
  }
}

function validateServiceRiskCarryover(
  risk: ServiceRiskCarryover | null,
  expectedClaimIdentity: string,
): asserts risk is ServiceRiskCarryover {
  if (!risk || typeof risk !== 'object' || !ISSUED_SERVICE_RISK_CARRYOVERS.has(risk)) {
    throw new Error('Expected an issued service risk carryover');
  }
  if (!Object.isFrozen(risk) || !['resolved-suppression', 'arrival-claim-unavailable'].includes(risk.kind)
    || risk.claimIdentity !== expectedClaimIdentity || !isExactClaim(risk.evaluatedClaim)
    || !Object.isFrozen(risk.evaluatedClaim) || serviceClaimIdentity(risk.evaluatedClaim) !== expectedClaimIdentity
    || !Number.isSafeInteger(risk.adverseAtMs)
    || typeof risk.riderCopy !== 'string' || !risk.riderCopy
    || !Array.isArray(risk.officialDetails) || !Object.isFrozen(risk.officialDetails)
    || !Array.isArray(risk.rawOfficialAudit) || !Object.isFrozen(risk.rawOfficialAudit)
    || !Array.isArray(risk.auditEvidence) || !Object.isFrozen(risk.auditEvidence)
    || !Array.isArray(risk.suppressedProducts) || !Object.isFrozen(risk.suppressedProducts)
    || !hasExactSuppressedProducts(risk.suppressedProducts)) {
    throw new Error('Invalid issued service risk carryover');
  }
}

function freezeDecision(
  kind: ServiceChangeDecisionKind,
  disposition: ServiceChangeGateDisposition,
  evaluatedClaim: ServiceClaimScope,
  riderCopy: string | null,
  officialDetails: readonly ResolvedOfficialAlertDetails[],
  contextDetails: readonly ServiceContextDetail[],
  rawOfficialAudit: readonly RawOfficialAlertAudit[],
  auditEvidence: readonly ServiceAuditEvidence[],
  suppressedProducts: readonly ClaimSuppressedProduct[],
  carryover: ServiceRiskCarryover | null,
  carriedForward: boolean,
  recoveryCount: 0 | 1 | 2,
  snapshot: AlertSnapshotDecision,
  epochs: CapturedAlertEpoch,
): ServiceChangeDecision {
  const claim = freezeClaim(evaluatedClaim);
  const assessedAtMs = validateEpochMilliseconds(epochs.assessedAtMs, 'service-change assessment instant');
  const alertContextIdentity = alertSnapshotIdentity(snapshot, epochs.feedTimestampMs);
  const decision = Object.freeze({
    kind,
    disposition,
    claimIdentity: serviceClaimIdentity(claim),
    evaluatedClaim: claim,
    riderCopy,
    officialDetails: Object.freeze([...officialDetails]),
    contextDetails: Object.freeze([...contextDetails]),
    rawOfficialAudit: Object.freeze([...rawOfficialAudit]),
    auditEvidence: Object.freeze([...auditEvidence]),
    suppressedProducts: Object.freeze([...suppressedProducts]),
    carryover,
    carriedForward,
    recoveryCount,
    contextKind: snapshot.kind,
    assessedAtMs,
    alertContextIdentity,
  });
  ISSUED_SERVICE_CHANGE_DECISIONS.add(decision);
  return decision;
}

function freezeClaim(claim: ServiceClaimScope): ServiceClaimScope {
  return Object.freeze({
    claimId: normalizeBoundedIdentity(claim.claimId, 'service claim'),
    routeId: normalizeBoundedIdentity(claim.routeId, 'service claim'),
    exactDirectionalStopId: normalizeBoundedIdentity(claim.exactDirectionalStopId, 'service claim'),
    constituentStopId: normalizeBoundedIdentity(claim.constituentStopId, 'service claim'),
    direction: claim.direction,
    ...(claim.tripId !== undefined ? { tripId: normalizeBoundedIdentity(claim.tripId, 'service claim') } : {}),
    ...(claim.trainId !== undefined ? { trainId: normalizeBoundedIdentity(claim.trainId, 'service claim') } : {}),
  });
}

function serviceClaimIdentity(claim: ServiceClaimScope): string {
  return encodeCanonicalIdentityTuple([
    claim.claimId,
    claim.routeId,
    claim.exactDirectionalStopId,
    claim.constituentStopId,
    claim.direction,
    claim.tripId ?? null,
    claim.trainId ?? null,
  ], 'service claim');
}

function validateEvaluationInput(input: ServiceChangeEvaluationInput): CapturedAlertEpoch {
  if (!input || typeof input !== 'object' || !input.snapshot || !input.claim) throw new Error('Service-change evaluation input is required');
  const assessedAt = input.snapshot.assessedAt;
  const feedTimestamp = input.snapshot.feedTimestamp;
  if (!['current', 'stale', 'missing', 'failed', 'quarantined'].includes(input.snapshot.kind)
    || !Array.isArray(input.snapshot.alerts)) throw new Error('Invalid alert snapshot decision');
  const assessedAtMs = captureDateEpochMilliseconds(assessedAt, 'alert snapshot assessment instant');
  const feedTimestampMs = feedTimestamp === null ? null
    : captureDateEpochMilliseconds(feedTimestamp, 'alert snapshot feed instant');
  if (feedTimestampMs !== null && feedTimestampMs > assessedAtMs) throw new Error('Invalid alert snapshot chronology');
  if (input.snapshot.kind === 'current' && feedTimestampMs === null) {
    throw new Error('Current alert snapshot requires a feed timestamp');
  }
  if (!isExactClaim(input.claim)) throw new Error('Exact service claim is required');
  [input.claim.claimId, input.claim.routeId, input.claim.exactDirectionalStopId, input.claim.constituentStopId,
    input.claim.tripId, input.claim.trainId].forEach((identity) => {
    if (identity !== undefined) normalizeBoundedIdentity(identity, 'service claim');
  });
  if (input.recoveryUpdates !== undefined && !Array.isArray(input.recoveryUpdates)) throw new Error('Invalid service recovery updates');
  return Object.freeze({ assessedAtMs, feedTimestampMs });
}

function isExactClaim(claim: ServiceClaimScope): boolean {
  return Boolean(claim && typeof claim === 'object' && claim.claimId?.trim() && claim.routeId?.trim()
    && claim.exactDirectionalStopId?.trim() && claim.constituentStopId?.trim()
    && ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].includes(claim.direction)
    && (claim.tripId === undefined || Boolean(claim.tripId.trim()))
    && (claim.trainId === undefined || Boolean(claim.trainId.trim())));
}

function validateRecoveryUpdate(update: ServiceRecoveryUpdate): number {
  if (!update || typeof update !== 'object' || !update.evidenceId?.trim()
    || [update.currentFeed, update.coherentIdentity, update.exactDirectionalStop, update.coherentPath, update.noCurrentVeto]
      .some((value) => typeof value !== 'boolean')) throw new Error('Invalid service recovery evidence');
  normalizeBoundedIdentity(update.evidenceId, 'service recovery evidence');
  return captureDateEpochMilliseconds(update.sourceTimestamp, 'service recovery evidence instant');
}

function recoverySignature(update: ServiceRecoveryUpdate, timestampMs: number): string {
  return JSON.stringify({
    sourceTimestamp: new Date(timestampMs).toISOString(),
    currentFeed: update.currentFeed,
    coherentIdentity: update.coherentIdentity,
    exactDirectionalStop: update.exactDirectionalStop,
    coherentPath: update.coherentPath,
    noCurrentVeto: update.noCurrentVeto,
  });
}

function validDate(value: Date, label: string): number {
  return captureDateEpochMilliseconds(value, label);
}

function captureRecoveryBoundary(value: Date | number, label: string): number {
  return typeof value === 'number'
    ? validateEpochMilliseconds(value, label)
    : captureDateEpochMilliseconds(value, label);
}

function compareText(left: string, right: string): number {
  const a = normalizeCanonicalIdentity(left);
  const b = normalizeCanonicalIdentity(right);
  return a < b ? -1 : a > b ? 1 : 0;
}
