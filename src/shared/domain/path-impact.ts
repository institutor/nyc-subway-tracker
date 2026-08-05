import { isResolvedAccessiblePathDecision, type ResolvedAccessiblePathDecision } from './accessible-path';
import { isResolvedEquipmentStatusDecision, type EquipmentStatusDecision } from './equipment-status';

export interface ImpactPath {
  readonly canonicalIdentity: string;
  readonly complexId: string;
  readonly origin: string;
  readonly destination: string;
  readonly routeId: string;
  readonly direction: string;
  readonly platformId: string;
  readonly equipmentIds: readonly string[];
  readonly pathDecision: ResolvedAccessiblePathDecision;
}

const impactBrand: unique symbol = Symbol('resolved-path-impact');
export type ResolvedPathImpactDecision = Readonly<({
  readonly [impactBrand]: true;
  readonly decisionId: string;
  readonly affectedPathId: string | null;
  readonly accessibleRouteOnly: true;
  readonly destinationIntent: string;
} & (
  | { readonly kind: 'unrelated' }
  | { readonly kind: 'reroutable-within-station'; readonly replacementPathId: string; readonly autoSelected: false; readonly evidenceState: EquipmentStatusDecision['state'] }
  | { readonly kind: 'blocking'; readonly evidenceState: EquipmentStatusDecision['state'] }
))>;

const resolvedImpacts = new WeakSet<object>();

export function classifyPathImpact(input: {
  readonly changedEquipment: EquipmentStatusDecision;
  readonly selectedPath: ImpactPath;
  readonly alternatePaths: readonly ImpactPath[];
  readonly destinationIntent: string;
}): ResolvedPathImpactDecision | undefined {
  if (!isResolvedEquipmentStatusDecision(input.changedEquipment) || !validPath(input.selectedPath)) return undefined;
  const selectedId = input.selectedPath.pathDecision.pathId;
  if (!input.selectedPath.equipmentIds.includes(input.changedEquipment.targetEquipmentId)) {
    return resolveImpact({ kind: 'unrelated', affectedPathId: null, destinationIntent: input.destinationIntent }, input.changedEquipment.decisionId);
  }
  const alternate = input.alternatePaths.find((candidate) => validPath(candidate)
    && candidate.pathDecision.status === 'eligible'
    && candidate.pathDecision.pathId !== selectedId
    && candidate.canonicalIdentity !== input.selectedPath.canonicalIdentity
    && candidate.complexId === input.selectedPath.complexId
    && candidate.origin === input.selectedPath.origin
    && candidate.destination === input.destinationIntent
    && candidate.routeId === input.selectedPath.routeId
    && candidate.direction === input.selectedPath.direction
    && candidate.platformId === input.selectedPath.platformId
    && !candidate.equipmentIds.includes(input.changedEquipment.targetEquipmentId));
  if (alternate) return resolveImpact({
    kind: 'reroutable-within-station', affectedPathId: selectedId, replacementPathId: alternate.pathDecision.pathId,
    autoSelected: false, evidenceState: input.changedEquipment.state, destinationIntent: input.destinationIntent,
  }, input.changedEquipment.decisionId);
  return resolveImpact({ kind: 'blocking', affectedPathId: selectedId, evidenceState: input.changedEquipment.state, destinationIntent: input.destinationIntent }, input.changedEquipment.decisionId);
}

export function isResolvedPathImpactDecision(value: unknown): value is ResolvedPathImpactDecision {
  return Boolean(value && typeof value === 'object' && resolvedImpacts.has(value));
}

function validPath(path: ImpactPath | undefined): path is ImpactPath {
  return Boolean(path && isResolvedAccessiblePathDecision(path.pathDecision)
    && path.pathDecision.pathId === path.canonicalIdentity
    && path.pathDecision.accessibleRouteOnly === true);
}

function resolveImpact(
  value: ({ readonly affectedPathId: string | null; readonly destinationIntent: string } & (
    | { readonly kind: 'unrelated' }
    | { readonly kind: 'reroutable-within-station'; readonly replacementPathId: string; readonly autoSelected: false; readonly evidenceState: EquipmentStatusDecision['state'] }
    | { readonly kind: 'blocking'; readonly evidenceState: EquipmentStatusDecision['state'] }
  )),
  equipmentDecisionId: string,
): ResolvedPathImpactDecision {
  const decision = Object.freeze({
    [impactBrand]: true as const,
    decisionId: `${equipmentDecisionId}:${value.kind}:${value.affectedPathId ?? 'unrelated'}`,
    accessibleRouteOnly: true as const,
    ...value,
  }) as ResolvedPathImpactDecision;
  resolvedImpacts.add(decision);
  return decision;
}
