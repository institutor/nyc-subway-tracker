import {
  alternativeSelectionAllowsUse,
  isResolvedAccessibilityAlternativeSelection,
  type ResolvedAccessibilityAlternativeOffer,
  type ResolvedAccessibilityAlternativeSelection,
} from './accessibility-alternatives';
import {
  accessiblePathDecisionAllowsUse,
  accessiblePathEquipmentDependenciesPostdate,
  type ResolvedAccessiblePathDecision,
} from './accessible-path';
import {
  impactDecisionAllowsUse,
  isResolvedPathImpactDecision,
  type ResolvedPathImpactDecision,
} from './path-impact';

const decisionPointBrand: unique symbol = Symbol('resolved-accessibility-decision-point');
export type DecisionPointResult = Readonly<({
  readonly [decisionPointBrand]: true;
  readonly decisionId: string;
  readonly evaluatedAt: string;
  readonly selectedPathEvaluationId: string;
} & (
  | { readonly status: 'known'; readonly pointId: string }
  | { readonly status: 'unknown' }
))>;

const warningBrand: unique symbol = Symbol('resolved-accessibility-warning');
export interface AccessibilityWarning {
  readonly [warningBrand]: true;
  readonly warningId: string;
  readonly impactDecisionId: string;
  readonly alternativeSelectionDecisionId: string;
  readonly decisionPointDecisionId: string;
  readonly active: boolean;
  readonly state: 'predeparture-action-required' | 'underway-known-point' | 'underway-immediate' | 'offline-preserved' | 'revalidating' | 'resolved';
  readonly priority: 'urgent';
  readonly content: readonly string[];
  readonly selectedPathId: string;
  readonly selectedPathEvaluationId: string;
  readonly selectedPathPackageVersion: string;
  readonly selectedEquipmentIds: readonly string[];
  readonly replacementOfferIds: readonly string[];
  readonly replacementPathIds: readonly string[];
  readonly replacementPathEvaluationIds: readonly string[];
  readonly stationComplexId: string;
  readonly constituentStationId: string;
  readonly routeId: string;
  readonly direction: ResolvedAccessiblePathDecision['direction'];
  readonly platformId: string;
  readonly equipmentSourceScopeId: string;
  readonly equipmentSourceVersion: string;
  readonly surface: ResolvedAccessiblePathDecision['surface'];
  readonly exposureDecisionId: string | null;
  readonly changedEquipmentId: string;
  readonly changedEquipmentState: ResolvedPathImpactDecision['changedEquipmentState'];
  readonly changedEquipmentAssessedAt: string;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly createdAt: string;
  readonly lastTransitionAt: string;
  readonly validThrough: string;
  readonly accessibleRouteOnly: true;
  readonly acknowledged: boolean;
  readonly stale: boolean;
}

const resolvedDecisionPoints = new WeakSet<object>();
const resolvedWarnings = new WeakSet<object>();

export function deriveLastAccessibleDecisionPoint(input: {
  readonly cursorOrder: number;
  readonly affectedOrder: number;
  readonly points: readonly {
    readonly id: string;
    readonly order: number;
    readonly reachable: boolean | 'unknown';
    readonly hasVerifiedSafeAction: boolean;
    readonly possiblyPassed?: boolean;
  }[];
  readonly selectedPath: ResolvedAccessiblePathDecision;
  readonly decisionTime: Date;
}): DecisionPointResult {
  const evaluatedAt = canonicalDate(input.decisionTime, 'decision-point evaluation time');
  if (!accessiblePathDecisionAllowsUse(input.selectedPath, input.decisionTime)) {
    throw new Error('Decision-point evaluation requires a current resolved selected path');
  }
  const candidates = input.points.filter((point) => point.order >= input.cursorOrder && point.order < input.affectedOrder);
  if (candidates.some((point) => point.reachable === 'unknown' || point.possiblyPassed === true)) {
    return resolveDecisionPoint({ status: 'unknown' }, evaluatedAt, input.selectedPath.evaluationId);
  }
  const passing = candidates.filter((point) => point.reachable === true && point.hasVerifiedSafeAction).sort((a, b) => b.order - a.order);
  return passing.length
    ? resolveDecisionPoint({ status: 'known', pointId: identity(passing[0].id, 'decision-point identity') }, evaluatedAt, input.selectedPath.evaluationId)
    : resolveDecisionPoint({ status: 'unknown' }, evaluatedAt, input.selectedPath.evaluationId);
}

export function createAccessibilityWarning(input: {
  readonly phase: 'predeparture' | 'underway';
  readonly decisionPoint: DecisionPointResult;
  readonly impactDecision: ResolvedPathImpactDecision;
  readonly alternativeSelection: ResolvedAccessibilityAlternativeSelection;
  readonly decisionTime: Date;
}): AccessibilityWarning {
  const createdAt = canonicalDate(input.decisionTime, 'warning creation time');
  if (!impactDecisionAllowsUse(input.impactDecision, input.decisionTime)
    || input.impactDecision.kind === 'unrelated' || !input.impactDecision.affectedPathId) {
    throw new Error('A current resolved affected-path impact decision is required');
  }
  if (!alternativeSelectionAllowsUse(input.alternativeSelection, input.decisionTime)) {
    throw new Error('A current resolved accessibility alternative selection is required');
  }
  if (!isResolvedDecisionPoint(input.decisionPoint) || input.decisionPoint.evaluatedAt !== createdAt
    || input.decisionPoint.selectedPathEvaluationId !== input.impactDecision.selectedPathEvaluationId) {
    throw new Error('A resolved decision point for the exact selected path and warning creation time is required');
  }
  if (!selectionMatchesImpact(input.alternativeSelection, input.impactDecision)) {
    throw new Error('The alternative selection does not match the exact impact decision');
  }
  const state = input.phase === 'predeparture'
    ? 'predeparture-action-required'
    : input.decisionPoint.status === 'known' ? 'underway-known-point' : 'underway-immediate';
  const point = input.decisionPoint.status === 'known'
    ? `Act before ${input.decisionPoint.pointId}, the last verified accessible decision point.`
    : 'Warn now—the last accessible decision point is not confirmed.';
  const safeAction = input.alternativeSelection.first?.label ?? 'No verified step-free subway route is available right now.';
  const offers = input.alternativeSelection.visible;
  const validThrough = new Date(Math.min(
    Date.parse(input.impactDecision.validThrough),
    Date.parse(input.alternativeSelection.validThrough),
  )).toISOString();
  return resolveWarning({
    warningId: `warning|${input.impactDecision.decisionId}|${input.alternativeSelection.decisionId}|${input.decisionPoint.decisionId}|${createdAt}`,
    impactDecisionId: input.impactDecision.decisionId,
    alternativeSelectionDecisionId: input.alternativeSelection.decisionId,
    decisionPointDecisionId: input.decisionPoint.decisionId,
    active: true,
    state,
    priority: 'urgent',
    content: [
      equipmentFact(input.impactDecision),
      `${directionLabel(input.impactDecision.direction)} ${input.impactDecision.routeId} platform ${input.impactDecision.platformId} step-free connection.`,
      input.impactDecision.kind === 'reroutable-within-station'
        ? 'The selected step-free path has changed; use only the verified offered replacement.'
        : 'The selected step-free path cannot be verified right now.',
      point,
      input.impactDecision.changedEquipmentFreshnessCopy,
      safeAction,
    ],
    selectedPathId: input.impactDecision.affectedPathId,
    selectedPathEvaluationId: input.impactDecision.selectedPathEvaluationId,
    selectedPathPackageVersion: input.impactDecision.selectedPathPackageVersion,
    selectedEquipmentIds: input.impactDecision.selectedEquipmentIds,
    replacementOfferIds: offers.map((offer) => offer.offerId),
    replacementPathIds: offers.map((offer) => offer.pathId),
    replacementPathEvaluationIds: offers.map((offer) => offer.pathEvaluationId),
    stationComplexId: input.impactDecision.stationComplexId,
    constituentStationId: input.impactDecision.constituentStationId,
    routeId: input.impactDecision.routeId,
    direction: input.impactDecision.direction,
    platformId: input.impactDecision.platformId,
    equipmentSourceScopeId: input.impactDecision.equipmentSourceScopeId,
    equipmentSourceVersion: input.impactDecision.equipmentSourceVersion,
    surface: input.impactDecision.surface,
    exposureDecisionId: input.impactDecision.exposureDecisionId,
    changedEquipmentId: input.impactDecision.changedEquipmentId,
    changedEquipmentState: input.impactDecision.changedEquipmentState,
    changedEquipmentAssessedAt: input.impactDecision.changedEquipmentAssessedAt,
    originIntent: input.impactDecision.originIntent,
    destinationIntent: input.impactDecision.destinationIntent,
    createdAt,
    lastTransitionAt: createdAt,
    validThrough,
    accessibleRouteOnly: true,
    acknowledged: false,
    stale: false,
  });
}

export type AccessibilityWarningEvent =
  | { readonly type: 'acknowledge' | 'navigate' | 'go-offline' | 'reconnect' | 'progress' | 'lower-priority-recovered' | 'single-machine-restored' }
  | {
    readonly type: 'replacement-selected';
    readonly alternativeSelection: ResolvedAccessibilityAlternativeSelection;
    readonly offerId: string;
    readonly pathDecision: ResolvedAccessiblePathDecision;
  }
  | { readonly type: 'owner-resolved'; readonly pathDecision: ResolvedAccessiblePathDecision };

export function transitionAccessibilityWarning(
  warning: AccessibilityWarning,
  event: AccessibilityWarningEvent,
  decisionTime: Date,
): AccessibilityWarning {
  if (!isResolvedAccessibilityWarning(warning)) throw new Error('A resolved accessibility warning is required');
  const transitionedAt = canonicalDate(decisionTime, 'warning transition time');
  if (Date.parse(transitionedAt) < Date.parse(warning.lastTransitionAt)) throw new Error('Warning transition time must be monotonic');
  if (!warning.active) return warning;
  if (event.type === 'replacement-selected'
    && alternativeSelectionAllowsUse(event.alternativeSelection, decisionTime)
    && event.alternativeSelection.decisionId === warning.alternativeSelectionDecisionId) {
    const offer = event.alternativeSelection.visible.find((candidate) => candidate.offerId === event.offerId);
    if (offer && replacementReevaluationPasses(warning, offer, event.pathDecision, decisionTime)) {
      return transitionWarning(warning, transitionedAt, { active: false, state: 'resolved', selectedPathId: event.pathDecision.pathId });
    }
  }
  if (event.type === 'owner-resolved' && ownerReevaluationPasses(warning, event.pathDecision, decisionTime)) {
    return transitionWarning(warning, transitionedAt, { active: false, state: 'resolved' });
  }
  if (event.type === 'acknowledge') return transitionWarning(warning, transitionedAt, { acknowledged: true });
  if (event.type === 'go-offline') return transitionWarning(warning, transitionedAt, { state: 'offline-preserved', stale: true });
  if (event.type === 'reconnect' || event.type === 'single-machine-restored') return transitionWarning(warning, transitionedAt, { state: 'revalidating' });
  return transitionWarning(warning, transitionedAt, {});
}

export function isResolvedAccessibilityWarning(value: unknown): value is AccessibilityWarning {
  return Boolean(value && typeof value === 'object' && resolvedWarnings.has(value));
}

export function warningMatchesAlternativeSelection(
  warning: unknown,
  selection: unknown,
  decisionTime: Date,
): selection is ResolvedAccessibilityAlternativeSelection {
  if (!isResolvedAccessibilityWarning(warning) || !warning.active
    || !alternativeSelectionAllowsUse(selection, decisionTime)
    || selection.decisionId !== warning.alternativeSelectionDecisionId
    || selection.selectedPathEvaluationId !== warning.selectedPathEvaluationId) return false;
  return selection.visible.length === warning.replacementOfferIds.length
    && selection.visible.every((offer, index) => offer.offerId === warning.replacementOfferIds[index]
      && offer.pathId === warning.replacementPathIds[index]
      && offer.pathEvaluationId === warning.replacementPathEvaluationIds[index]);
}

export function warningMatchesDisplayedPath(
  warning: unknown,
  path: unknown,
  decisionTime: Date,
): warning is AccessibilityWarning {
  if (!isResolvedAccessibilityWarning(warning) || !warning.active
    || !accessiblePathDecisionAllowsUse(path, decisionTime)) return false;
  const exactEvaluation = path.evaluationId === warning.selectedPathEvaluationId;
  const newerEvaluation = Date.parse(path.evaluatedAt) > Date.parse(warning.createdAt);
  return (exactEvaluation || newerEvaluation)
    && path.pathId === warning.selectedPathId
    && path.packageVersion === warning.selectedPathPackageVersion
    && path.stationComplexId === warning.stationComplexId
    && path.constituentStationId === warning.constituentStationId
    && path.originIntent === warning.originIntent
    && path.destinationIntent === warning.destinationIntent
    && path.routeId === warning.routeId
    && path.direction === warning.direction
    && path.platformId === warning.platformId
    && path.equipmentSourceScopeId === warning.equipmentSourceScopeId
    && path.equipmentSourceVersion === warning.equipmentSourceVersion
    && path.surface === warning.surface
    && path.exposureDecisionId === warning.exposureDecisionId
    && sameValues(path.equipmentIds, warning.selectedEquipmentIds);
}

function selectionMatchesImpact(
  selection: ResolvedAccessibilityAlternativeSelection,
  impact: ResolvedPathImpactDecision,
): boolean {
  return selection.selectedPathEvaluationId === impact.selectedPathEvaluationId
    && selection.stationComplexId === impact.stationComplexId
    && selection.constituentStationId === impact.constituentStationId
    && selection.originIntent === impact.originIntent
    && selection.destinationIntent === impact.destinationIntent
    && selection.surface === impact.surface
    && selection.exposureDecisionId === impact.exposureDecisionId;
}

function replacementReevaluationPasses(
  warning: AccessibilityWarning,
  offer: ResolvedAccessibilityAlternativeOffer,
  path: ResolvedAccessiblePathDecision,
  decisionTime: Date,
): boolean {
  return accessiblePathDecisionAllowsUse(path, decisionTime) && path.status === 'eligible'
    && Date.parse(path.evaluatedAt) > Date.parse(warning.createdAt)
    && accessiblePathEquipmentDependenciesPostdate(path, new Date(warning.changedEquipmentAssessedAt))
    && path.pathId === offer.pathId && path.packageVersion === offer.pathPackageVersion
    && path.stationComplexId === offer.stationComplexId && path.constituentStationId === offer.constituentStationId
    && path.originIntent === offer.originIntent && path.destinationIntent === offer.destinationIntent
    && path.routeId === offer.routeId && path.direction === offer.direction && path.platformId === offer.platformId
    && path.equipmentSourceScopeId === offer.equipmentSourceScopeId
    && path.equipmentSourceVersion === offer.equipmentSourceVersion
    && path.surface === offer.surface && path.exposureDecisionId === offer.exposureDecisionId;
}

function ownerReevaluationPasses(
  warning: AccessibilityWarning,
  path: ResolvedAccessiblePathDecision,
  decisionTime: Date,
): boolean {
  return accessiblePathDecisionAllowsUse(path, decisionTime) && path.status === 'eligible'
    && Date.parse(path.evaluatedAt) > Date.parse(warning.createdAt)
    && accessiblePathEquipmentDependenciesPostdate(path, new Date(warning.changedEquipmentAssessedAt))
    && path.pathId === warning.selectedPathId && path.packageVersion === warning.selectedPathPackageVersion
    && path.stationComplexId === warning.stationComplexId && path.constituentStationId === warning.constituentStationId
    && path.originIntent === warning.originIntent && path.destinationIntent === warning.destinationIntent
    && path.routeId === warning.routeId && path.direction === warning.direction && path.platformId === warning.platformId
    && path.equipmentSourceScopeId === warning.equipmentSourceScopeId
    && path.equipmentSourceVersion === warning.equipmentSourceVersion
    && path.surface === warning.surface && path.exposureDecisionId === warning.exposureDecisionId
    && sameValues(path.equipmentIds, warning.selectedEquipmentIds);
}

function isResolvedDecisionPoint(value: unknown): value is DecisionPointResult {
  return Boolean(value && typeof value === 'object' && resolvedDecisionPoints.has(value));
}

function resolveDecisionPoint(
  result: { readonly status: 'unknown' } | { readonly status: 'known'; readonly pointId: string },
  evaluatedAt: string,
  selectedPathEvaluationId: string,
): DecisionPointResult {
  const decision = Object.freeze({
    [decisionPointBrand]: true as const,
    decisionId: `decision-point|${selectedPathEvaluationId}|${evaluatedAt}|${result.status}|${result.status === 'known' ? result.pointId : 'unknown'}`,
    evaluatedAt,
    selectedPathEvaluationId,
    ...result,
  }) as DecisionPointResult;
  resolvedDecisionPoints.add(decision);
  return decision;
}

function equipmentFact(impact: ResolvedPathImpactDecision): string {
  if (impact.changedEquipmentState === 'out-of-service') return `Official status: ${impact.changedEquipmentId} is out of service.`;
  if (impact.changedEquipmentState === 'planned-outage') return `Official status: ${impact.changedEquipmentId} has a planned outage.`;
  if (impact.changedEquipmentState === 'out-of-service-rechecking') return `Official status: ${impact.changedEquipmentId} is out of service and being rechecked.`;
  return `Current official status for ${impact.changedEquipmentId} is unknown.`;
}

function directionLabel(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
function sameValues(left: readonly string[], right: readonly string[]): boolean { return left.length === right.length && left.every((value, index) => value === right[index]); }
function identity(value: unknown, label: string): string { if (typeof value !== 'string' || value.trim() !== value || !value || value.length > 240) throw new Error(`${label} is invalid`); return value; }
function canonicalDate(value: Date, label: string): string { if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`${label} is invalid`); return value.toISOString(); }
function resolveWarning(value: Omit<AccessibilityWarning, typeof warningBrand>): AccessibilityWarning {
  const warning = deepFreeze({ [warningBrand]: true as const, ...value });
  resolvedWarnings.add(warning);
  return warning;
}
function transitionWarning(
  warning: AccessibilityWarning,
  lastTransitionAt: string,
  changes: Partial<Omit<AccessibilityWarning, typeof warningBrand | 'warningId' | 'createdAt'>>,
): AccessibilityWarning {
  return resolveWarning({ ...warning, ...changes, lastTransitionAt });
}
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); } return value; }
