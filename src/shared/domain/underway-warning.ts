import { isResolvedAccessibilityAlternativeSelection, type ResolvedAccessibilityAlternativeSelection } from './accessibility-alternatives';
import { isResolvedAccessiblePathDecision, type ResolvedAccessiblePathDecision } from './accessible-path';
import { isResolvedPathImpactDecision, type ResolvedPathImpactDecision } from './path-impact';

export type DecisionPointResult = { readonly status: 'known'; readonly pointId: string } | { readonly status: 'unknown' };
const warningBrand: unique symbol = Symbol('resolved-accessibility-warning');
export interface AccessibilityWarning {
  readonly [warningBrand]: true;
  readonly warningId: string;
  readonly active: boolean;
  readonly state: 'predeparture-action-required' | 'underway-known-point' | 'underway-immediate' | 'offline-preserved' | 'revalidating' | 'resolved';
  readonly priority: 'urgent';
  readonly content: readonly string[];
  readonly selectedPathId: string;
  readonly replacementPathIds: readonly string[];
  readonly destinationIntent: string;
  readonly accessibleRouteOnly: true;
  readonly acknowledged: boolean;
  readonly stale: boolean;
}

const resolvedWarnings = new WeakSet<object>();

export function deriveLastAccessibleDecisionPoint(input: { readonly cursorOrder: number; readonly affectedOrder: number; readonly points: readonly { readonly id: string; readonly order: number; readonly reachable: boolean | 'unknown'; readonly hasVerifiedSafeAction: boolean; readonly possiblyPassed?: boolean }[] }): DecisionPointResult {
  const candidates = input.points.filter((point) => point.order >= input.cursorOrder && point.order < input.affectedOrder);
  if (candidates.some((point) => point.reachable === 'unknown' || point.possiblyPassed === true)) return Object.freeze({ status: 'unknown' });
  const passing = candidates.filter((point) => point.reachable === true && point.hasVerifiedSafeAction).sort((a,b) => b.order-a.order);
  return passing.length ? Object.freeze({ status: 'known', pointId: passing[0].id }) : Object.freeze({ status: 'unknown' });
}

export function createAccessibilityWarning(input: {
  readonly fact: string;
  readonly connection: string;
  readonly consequence: string;
  readonly freshness: string;
  readonly phase: 'predeparture' | 'underway';
  readonly decisionPoint: DecisionPointResult;
  readonly impactDecision: ResolvedPathImpactDecision;
  readonly alternativeSelection: ResolvedAccessibilityAlternativeSelection;
}): AccessibilityWarning {
  if (!isResolvedPathImpactDecision(input.impactDecision) || input.impactDecision.kind === 'unrelated' || !input.impactDecision.affectedPathId) throw new Error('A resolved affected-path impact decision is required');
  if (!isResolvedAccessibilityAlternativeSelection(input.alternativeSelection)) throw new Error('A resolved accessibility alternative selection is required');
  const state = input.phase === 'predeparture' ? 'predeparture-action-required' : input.decisionPoint.status === 'known' ? 'underway-known-point' : 'underway-immediate';
  const point = input.decisionPoint.status === 'known' ? `Act before ${input.decisionPoint.pointId}, the last verified accessible decision point.` : 'Warn now—the last accessible decision point is not confirmed.';
  const safeAction = input.alternativeSelection.first?.label ?? 'No verified step-free subway route is available right now.';
  return resolveWarning({
    warningId: `warning:${input.impactDecision.decisionId}:${input.alternativeSelection.decisionId}`,
    active: true, state, priority: 'urgent', content: [input.fact,input.connection,input.consequence,point,input.freshness,safeAction],
    selectedPathId: input.impactDecision.affectedPathId,
    replacementPathIds: input.alternativeSelection.visible.map((candidate) => candidate.pathId),
    destinationIntent: input.impactDecision.destinationIntent, accessibleRouteOnly: true, acknowledged: false, stale: false,
  });
}

export type AccessibilityWarningEvent =
  | { readonly type: 'acknowledge'|'navigate'|'go-offline'|'reconnect'|'progress'|'lower-priority-recovered'|'single-machine-restored' }
  | { readonly type: 'replacement-selected'; readonly pathDecision: ResolvedAccessiblePathDecision }
  | { readonly type: 'owner-resolved'; readonly pathDecision: ResolvedAccessiblePathDecision };

export function transitionAccessibilityWarning(warning: AccessibilityWarning, event: AccessibilityWarningEvent): AccessibilityWarning {
  if (!isResolvedAccessibilityWarning(warning)) throw new Error('A resolved accessibility warning is required');
  if (!warning.active) return warning;
  if (event.type === 'replacement-selected' && isResolvedAccessiblePathDecision(event.pathDecision)
    && event.pathDecision.status === 'eligible' && warning.replacementPathIds.includes(event.pathDecision.pathId)) {
    return resolveWarning({ ...warning, active: false, state: 'resolved', selectedPathId: event.pathDecision.pathId });
  }
  if (event.type === 'owner-resolved' && isResolvedAccessiblePathDecision(event.pathDecision)
    && event.pathDecision.status === 'eligible' && event.pathDecision.pathId === warning.selectedPathId) {
    return resolveWarning({ ...warning, active: false, state: 'resolved' });
  }
  if (event.type === 'acknowledge') return resolveWarning({ ...warning, acknowledged: true });
  if (event.type === 'go-offline') return resolveWarning({ ...warning, state: 'offline-preserved', stale: true });
  if (event.type === 'reconnect' || event.type === 'single-machine-restored') return resolveWarning({ ...warning, state: 'revalidating' });
  return resolveWarning({ ...warning });
}

export function isResolvedAccessibilityWarning(value: unknown): value is AccessibilityWarning {
  return Boolean(value && typeof value === 'object' && resolvedWarnings.has(value));
}

function resolveWarning(value: Omit<AccessibilityWarning, typeof warningBrand>): AccessibilityWarning {
  const warning = deepFreeze({ [warningBrand]: true as const, ...value });
  resolvedWarnings.add(warning);
  return warning;
}

function deepFreeze<T>(value:T):T { if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value; }
