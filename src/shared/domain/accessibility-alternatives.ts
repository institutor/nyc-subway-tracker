import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';
export type AccessibilityAlternativeTier = 'same-complex' | 'nearby-station' | 'subway-detour' | 'bus-inclusive';
export interface AccessibilityAlternative { readonly id: string; readonly canonicalIdentity: string; readonly tier: AccessibilityAlternativeTier; readonly independentlyVerified: boolean; readonly borrowedEvidence?: boolean; readonly singlePointElevatorDependencies: number; readonly transfers: number; readonly accessibleWalkingMeters: number; readonly disruptionRisk: number; readonly travelSeconds: number; readonly includesBus: boolean }
const TIERS: readonly AccessibilityAlternativeTier[] = ['same-complex','nearby-station','subway-detour','bus-inclusive'];
export function chooseAccessibilityAlternative(candidates: readonly AccessibilityAlternative[], options: { readonly includeBuses: boolean }) {
  const eligible = candidates.filter((candidate) => candidate.independentlyVerified && !candidate.borrowedEvidence && (!candidate.includesBus || options.includeBuses));
  const identities = new Set<string>();
  for (const candidate of eligible) { const identity = normalizeCanonicalIdentity(candidate.canonicalIdentity); if (identities.has(identity)) return Object.freeze({ first: null, visible: Object.freeze([]), selectedId: null, accessibleRouteOnly: true, reason: 'Duplicate canonical alternative identity.' }); identities.add(identity); }
  const tier = TIERS.find((item) => eligible.some((candidate) => candidate.tier === item));
  if (!tier) return Object.freeze({ first: null, visible: Object.freeze([]), selectedId: null, accessibleRouteOnly: true });
  const within = eligible.filter((candidate) => candidate.tier === tier).sort((a,b) => a.singlePointElevatorDependencies-b.singlePointElevatorDependencies || a.transfers-b.transfers || a.accessibleWalkingMeters-b.accessibleWalkingMeters || a.disruptionRisk-b.disruptionRisk || a.travelSeconds-b.travelSeconds || compareCanonicalIdentity(a.canonicalIdentity,b.canonicalIdentity));
  const first = Object.freeze({ ...within[0] }); return Object.freeze({ first, visible: Object.freeze([first]), selectedId: null, accessibleRouteOnly: true });
}
