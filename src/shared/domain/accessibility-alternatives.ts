import { isResolvedAccessiblePathDecision, type ResolvedAccessiblePathDecision } from './accessible-path';
import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';

export type AccessibilityAlternativeTier = 'same-complex' | 'nearby-station' | 'subway-detour' | 'bus-inclusive';
export interface AccessibilityAlternative {
  readonly id: string;
  readonly label: string;
  readonly canonicalIdentity: string;
  readonly tier: AccessibilityAlternativeTier;
  readonly pathDecision: ResolvedAccessiblePathDecision;
  readonly singlePointElevatorDependencies: number;
  readonly transfers: number;
  readonly accessibleWalkingMeters: number;
  readonly disruptionRisk: number;
  readonly travelSeconds: number;
  readonly includesBus: boolean;
}

const selectionBrand: unique symbol = Symbol('resolved-accessibility-alternative-selection');
export interface ResolvedAccessibilityAlternativeSelection {
  readonly [selectionBrand]: true;
  readonly decisionId: string;
  readonly first: Readonly<AccessibilityAlternative> | null;
  readonly visible: readonly Readonly<AccessibilityAlternative>[];
  readonly selectedId: null;
  readonly accessibleRouteOnly: true;
  readonly reason?: string;
}

const resolvedSelections = new WeakSet<object>();
const TIERS: readonly AccessibilityAlternativeTier[] = ['same-complex','nearby-station','subway-detour','bus-inclusive'];

export function chooseAccessibilityAlternative(candidates: readonly AccessibilityAlternative[], options: { readonly includeBuses: boolean }): ResolvedAccessibilityAlternativeSelection {
  const eligible = candidates.filter((candidate) => isResolvedAccessiblePathDecision(candidate.pathDecision)
    && candidate.pathDecision.status === 'eligible'
    && candidate.pathDecision.pathId === candidate.canonicalIdentity
    && (!candidate.includesBus || options.includeBuses));
  const identities = new Set<string>();
  for (const candidate of eligible) {
    const identity = normalizeCanonicalIdentity(candidate.canonicalIdentity);
    if (identities.has(identity)) return resolveSelection(null, [], 'Duplicate canonical alternative identity.');
    identities.add(identity);
  }
  const tier = TIERS.find((item) => eligible.some((candidate) => candidate.tier === item));
  if (!tier) return resolveSelection(null, []);
  const within = eligible.filter((candidate) => candidate.tier === tier).sort((a,b) => a.singlePointElevatorDependencies-b.singlePointElevatorDependencies || a.transfers-b.transfers || a.accessibleWalkingMeters-b.accessibleWalkingMeters || a.disruptionRisk-b.disruptionRisk || a.travelSeconds-b.travelSeconds || compareCanonicalIdentity(a.canonicalIdentity,b.canonicalIdentity));
  const first = deepFreeze({ ...within[0] });
  return resolveSelection(first, [first]);
}

export function isResolvedAccessibilityAlternativeSelection(value: unknown): value is ResolvedAccessibilityAlternativeSelection {
  return Boolean(value && typeof value === 'object' && resolvedSelections.has(value));
}

function resolveSelection(first: Readonly<AccessibilityAlternative> | null, visible: readonly Readonly<AccessibilityAlternative>[], reason?: string): ResolvedAccessibilityAlternativeSelection {
  const decision = deepFreeze({
    [selectionBrand]: true as const,
    decisionId: `alternative:${first?.pathDecision.evaluationId ?? reason ?? 'none'}`,
    first,
    visible,
    selectedId: null,
    accessibleRouteOnly: true as const,
    ...(reason ? { reason } : {}),
  });
  resolvedSelections.add(decision);
  return decision;
}

function deepFreeze<T>(value:T):T { if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value; }
