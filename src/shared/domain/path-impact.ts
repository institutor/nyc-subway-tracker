import {
  accessiblePathDecisionAllowsUse,
  type ResolvedAccessiblePathDecision,
} from './accessible-path';
import { equipmentDecisionAllowsUse, type EquipmentStatusDecision } from './equipment-status';

const impactBrand: unique symbol = Symbol('resolved-path-impact');
export type ResolvedPathImpactDecision = Readonly<({
  readonly [impactBrand]: true;
  readonly decisionId: string;
  readonly equipmentDecisionId: string;
  readonly selectedPathEvaluationId: string;
  readonly selectedPathPackageVersion: string;
  readonly selectedEquipmentIds: readonly string[];
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
  readonly changedEquipmentState: EquipmentStatusDecision['state'];
  readonly changedEquipmentFreshnessCopy: string;
  readonly changedEquipmentAssessedAt: string;
  readonly affectedPathId: string | null;
  readonly accessibleRouteOnly: true;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly createdAt: string;
  readonly validThrough: string;
} & (
  | { readonly kind: 'unrelated' }
  | {
    readonly kind: 'reroutable-within-station';
    readonly replacementPathId: string;
    readonly replacementPathEvaluationId: string;
    readonly autoSelected: false;
    readonly evidenceState: EquipmentStatusDecision['state'];
  }
  | { readonly kind: 'blocking'; readonly evidenceState: EquipmentStatusDecision['state'] }
))>;

const resolvedImpacts = new WeakSet<object>();

export function classifyPathImpact(input: {
  readonly changedEquipment: EquipmentStatusDecision;
  readonly selectedPath: ResolvedAccessiblePathDecision;
  readonly alternatePaths: readonly ResolvedAccessiblePathDecision[];
  readonly decisionTime: Date;
}): ResolvedPathImpactDecision | undefined {
  if (!equipmentDecisionAllowsUse(input.changedEquipment, input.decisionTime)
    || !accessiblePathDecisionAllowsUse(input.selectedPath, input.decisionTime)
    || input.selectedPath.status !== 'eligible'
    || input.changedEquipment.sourceScopeId !== input.selectedPath.equipmentSourceScopeId
    || input.changedEquipment.sourceVersion !== input.selectedPath.equipmentSourceVersion
    || Date.parse(input.changedEquipment.assessedAt) < Date.parse(input.selectedPath.evaluatedAt)) return undefined;
  const selected = input.selectedPath;
  if (!selected.equipmentIds.includes(input.changedEquipment.targetEquipmentId)) {
    return resolveImpact({ kind: 'unrelated', affectedPathId: null }, input.changedEquipment, selected, undefined, input.decisionTime);
  }
  if (input.changedEquipment.state === 'no-official-outage-reported') return undefined;
  const alternate = input.alternatePaths.find((candidate) => accessiblePathDecisionAllowsUse(candidate, input.decisionTime)
    && candidate.status === 'eligible'
    && candidate.evaluationId !== selected.evaluationId
    && candidate.pathId !== selected.pathId
    && candidate.stationComplexId === selected.stationComplexId
    && candidate.constituentStationId === selected.constituentStationId
    && candidate.originIntent === selected.originIntent
    && candidate.destinationIntent === selected.destinationIntent
    && candidate.routeId === selected.routeId
    && candidate.direction === selected.direction
    && candidate.platformId === selected.platformId
    && candidate.equipmentSourceScopeId === selected.equipmentSourceScopeId
    && candidate.equipmentSourceVersion === selected.equipmentSourceVersion
    && candidate.surface === selected.surface
    && !candidate.equipmentIds.includes(input.changedEquipment.targetEquipmentId));
  if (alternate) return resolveImpact({
    kind: 'reroutable-within-station',
    affectedPathId: selected.pathId,
    replacementPathId: alternate.pathId,
    replacementPathEvaluationId: alternate.evaluationId,
    autoSelected: false,
    evidenceState: input.changedEquipment.state,
  }, input.changedEquipment, selected, alternate, input.decisionTime);
  return resolveImpact({
    kind: 'blocking', affectedPathId: selected.pathId, evidenceState: input.changedEquipment.state,
  }, input.changedEquipment, selected, undefined, input.decisionTime);
}

export function isResolvedPathImpactDecision(value: unknown): value is ResolvedPathImpactDecision {
  return Boolean(value && typeof value === 'object' && resolvedImpacts.has(value));
}

export function impactDecisionAllowsUse(value: unknown, decisionTime: Date): value is ResolvedPathImpactDecision {
  const time = decisionTime instanceof Date ? decisionTime.getTime() : Number.NaN;
  return isResolvedPathImpactDecision(value) && Number.isFinite(time)
    && time >= Date.parse(value.createdAt) && time <= Date.parse(value.validThrough);
}

function resolveImpact(
  value: ({ readonly affectedPathId: string | null } & (
    | { readonly kind: 'unrelated' }
    | {
      readonly kind: 'reroutable-within-station';
      readonly replacementPathId: string;
      readonly replacementPathEvaluationId: string;
      readonly autoSelected: false;
      readonly evidenceState: EquipmentStatusDecision['state'];
    }
    | { readonly kind: 'blocking'; readonly evidenceState: EquipmentStatusDecision['state'] }
  )),
  equipment: EquipmentStatusDecision,
  selected: ResolvedAccessiblePathDecision,
  replacement: ResolvedAccessiblePathDecision | undefined,
  decisionTime: Date,
): ResolvedPathImpactDecision {
  const createdAt = decisionTime.toISOString();
  const validThrough = new Date(Math.min(
    Date.parse(equipment.validThrough),
    Date.parse(selected.validThrough),
    ...(replacement ? [Date.parse(replacement.validThrough)] : []),
  )).toISOString();
  const decision = Object.freeze({
    [impactBrand]: true as const,
    decisionId: `${equipment.decisionId}|${selected.evaluationId}|${value.kind}|${replacement?.evaluationId ?? 'none'}|${createdAt}`,
    equipmentDecisionId: equipment.decisionId,
    selectedPathEvaluationId: selected.evaluationId,
    selectedPathPackageVersion: selected.packageVersion,
    selectedEquipmentIds: selected.equipmentIds,
    stationComplexId: selected.stationComplexId,
    constituentStationId: selected.constituentStationId,
    routeId: selected.routeId,
    direction: selected.direction,
    platformId: selected.platformId,
    equipmentSourceScopeId: selected.equipmentSourceScopeId,
    equipmentSourceVersion: selected.equipmentSourceVersion,
    surface: selected.surface,
    exposureDecisionId: selected.exposureDecisionId,
    changedEquipmentId: equipment.targetEquipmentId,
    changedEquipmentState: equipment.state,
    changedEquipmentFreshnessCopy: equipment.freshnessCopy,
    changedEquipmentAssessedAt: equipment.assessedAt,
    accessibleRouteOnly: true as const,
    originIntent: selected.originIntent,
    destinationIntent: selected.destinationIntent,
    createdAt,
    validThrough,
    ...value,
  }) as ResolvedPathImpactDecision;
  resolvedImpacts.add(decision);
  return decision;
}
