export type DecisionPointResult = { readonly status: 'known'; readonly pointId: string } | { readonly status: 'unknown' };
export interface AccessibilityWarning { readonly active: boolean; readonly state: 'predeparture-action-required' | 'underway-known-point' | 'underway-immediate' | 'offline-preserved' | 'revalidating' | 'resolved'; readonly priority: 'urgent'; readonly content: readonly string[]; readonly selectedPathId: string; readonly destinationIntent: string; readonly accessibleRouteOnly: boolean; readonly acknowledged: boolean; readonly stale: boolean }
export function deriveLastAccessibleDecisionPoint(input: { readonly cursorOrder: number; readonly affectedOrder: number; readonly points: readonly { readonly id: string; readonly order: number; readonly reachable: boolean | 'unknown'; readonly hasVerifiedSafeAction: boolean; readonly possiblyPassed?: boolean }[] }): DecisionPointResult {
  const candidates = input.points.filter((point) => point.order >= input.cursorOrder && point.order < input.affectedOrder);
  if (candidates.some((point) => point.reachable === 'unknown' || point.possiblyPassed === true)) return Object.freeze({ status: 'unknown' });
  const passing = candidates.filter((point) => point.reachable === true && point.hasVerifiedSafeAction).sort((a,b) => b.order-a.order);
  return passing.length ? Object.freeze({ status: 'known', pointId: passing[0].id }) : Object.freeze({ status: 'unknown' });
}
export function createAccessibilityWarning(input: { readonly fact: string; readonly connection: string; readonly consequence: string; readonly freshness: string; readonly safeAction: string; readonly phase: 'predeparture' | 'underway'; readonly decisionPoint: DecisionPointResult; readonly selectedPathId: string; readonly destinationIntent: string; readonly accessibleRouteOnly: boolean }): AccessibilityWarning {
  const state = input.phase === 'predeparture' ? 'predeparture-action-required' : input.decisionPoint.status === 'known' ? 'underway-known-point' : 'underway-immediate';
  const point = input.decisionPoint.status === 'known' ? `Act before ${input.decisionPoint.pointId}, the last verified accessible decision point.` : 'Warn now—the last accessible decision point is not confirmed.';
  return Object.freeze({ active: true, state, priority: 'urgent', content: Object.freeze([input.fact,input.connection,input.consequence,point,input.freshness,input.safeAction]), selectedPathId: input.selectedPathId, destinationIntent: input.destinationIntent, accessibleRouteOnly: input.accessibleRouteOnly, acknowledged: false, stale: false });
}
export type AccessibilityWarningEvent = { readonly type: 'acknowledge'|'navigate'|'go-offline'|'reconnect'|'progress'|'lower-priority-recovered'|'single-machine-restored' } | { readonly type: 'replacement-selected'; readonly pathId: string; readonly stillPassing: boolean } | { readonly type: 'owner-resolved'; readonly freshFullPathPassed: boolean };
export function transitionAccessibilityWarning(warning: AccessibilityWarning, event: AccessibilityWarningEvent): AccessibilityWarning {
  if (!warning.active) return warning;
  if (event.type === 'replacement-selected' && event.stillPassing) return Object.freeze({ ...warning, active: false, state: 'resolved', selectedPathId: event.pathId });
  if (event.type === 'owner-resolved' && event.freshFullPathPassed) return Object.freeze({ ...warning, active: false, state: 'resolved' });
  if (event.type === 'acknowledge') return Object.freeze({ ...warning, acknowledged: true });
  if (event.type === 'go-offline') return Object.freeze({ ...warning, state: 'offline-preserved', stale: true });
  if (event.type === 'reconnect' || event.type === 'single-machine-restored') return Object.freeze({ ...warning, state: 'revalidating' });
  return Object.freeze({ ...warning });
}
