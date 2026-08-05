import { exposureAllowsEvaluation, type ResolvedGuidanceExposure } from './exposure-decision';
export type PlatformGuidancePosition = 'front' | 'middle' | 'back';
export interface PlatformGuidanceRecord {
  readonly coverageRowId:string; readonly immutableVersion:string; readonly supersededVersion:string; readonly complex:string; readonly constituent:string; readonly priorityCategory:string; readonly categoryEvidence:string; readonly route:string; readonly servicePattern:string; readonly direction:string; readonly destination:string; readonly platformId:string; readonly layoutOrientation:string; readonly frontRearOrder:string; readonly zoneGeometry:string; readonly objectiveType:string; readonly objectiveTarget:string; readonly physicalRelationships:string; readonly zoneBenefit:string; readonly certaintyCeiling:string; readonly accessiblePathVersion:string; readonly restrictions:string; readonly supportedScope:string; readonly unsupportedScope:string; readonly task7RecordVersion:string; readonly durableFieldEvidence:string; readonly verificationDate:string; readonly verifier:string; readonly reverificationTriggers:string; readonly reverificationStatus:string; readonly feedbackCorrections:string; readonly productDecision:string; readonly accessibilityDecision:string; readonly dataQualityDecision:string; readonly contentDecision:string; readonly operationsDecision:string; readonly disposition:string; readonly releasePackage:{ readonly packageVersion:string; readonly decisionId:string; readonly inclusion:'included'|'excluded'; readonly scope:string; readonly reason:string }; readonly position:PlatformGuidancePosition; readonly provenance:{ readonly sourceId:string; readonly version:string; readonly immutable:boolean; readonly reviewed:boolean };
}
const platformGuidanceBrand: unique symbol = Symbol('resolved-platform-guidance');
export type ResolvedPlatformGuidance = PlatformGuidanceRecord & {
  readonly [platformGuidanceBrand]: true;
  readonly exposureDecisionId: string;
  readonly releaseDecisionId: string;
};
const resolvedPlatformGuidance = new WeakSet<object>();
export interface PlatformGuidanceRequest { readonly complex:string; readonly constituent:string; readonly route:string; readonly servicePattern:string; readonly direction:string; readonly destination:string; readonly platformId:string; readonly orientation:string; readonly objectiveType:string; readonly objectiveTarget:string; readonly accessiblePathVersion:string; readonly now:Date; readonly platformState:'confirmed'|'expected'|'check-signs'; readonly rerouted:boolean; readonly exposure?:ResolvedGuidanceExposure }
const FIELDS = ['coverageRowId','immutableVersion','supersededVersion','complex','constituent','priorityCategory','categoryEvidence','route','servicePattern','direction','destination','platformId','layoutOrientation','frontRearOrder','zoneGeometry','objectiveType','objectiveTarget','physicalRelationships','zoneBenefit','certaintyCeiling','accessiblePathVersion','restrictions','supportedScope','unsupportedScope','task7RecordVersion','durableFieldEvidence','verificationDate','verifier','reverificationTriggers','reverificationStatus','feedbackCorrections','productDecision','accessibilityDecision','dataQualityDecision','contentDecision','operationsDecision','disposition','releasePackage','position','provenance'] as const;
export function validatePlatformGuidanceRegistry(raw: readonly unknown[]): readonly PlatformGuidanceRecord[] {
  const ids = new Set<string>(); return deepFreeze(raw.map((value) => {
    const root = strictRecord(value, FIELDS, 'platform guidance record');
    for (const field of FIELDS) if (root[field] === '' || root[field] == null) throw new Error(`Platform guidance coverage row missing ${field}`);
    strictRecord(root.releasePackage, ['packageVersion', 'decisionId', 'inclusion', 'scope', 'reason'], 'platform guidance release package');
    strictRecord(root.provenance, ['sourceId', 'version', 'immutable', 'reviewed'], 'platform guidance provenance');
    if (!['front', 'middle', 'back'].includes(String(root.position))) throw new Error('Platform guidance position is invalid');
    const record = root as unknown as PlatformGuidanceRecord; if (ids.has(record.coverageRowId)) throw new Error('Duplicate platform guidance coverage row identity'); ids.add(record.coverageRowId); return record;
  }));
}
export function resolvePlatformGuidance(raw: readonly unknown[], request: PlatformGuidanceRequest): ResolvedPlatformGuidance | undefined {
  if (request.rerouted || request.platformState !== 'confirmed' || !request.orientation) return undefined;
  const record = validatePlatformGuidanceRegistry(raw).find((candidate) => {
    const reviews=[candidate.productDecision,candidate.accessibilityDecision,candidate.dataQualityDecision,candidate.contentDecision,candidate.operationsDecision];
    const release = candidate.releasePackage;
    const releaseDecisionAllowed = request.exposure?.releaseDecisionId === release.decisionId
      && (request.exposure.surface === 'validation' || request.exposure.releaseStatus === 'approved');
    return exposureAllowsEvaluation(request.exposure, release.packageVersion, 'guidance') && release.inclusion==='included' && release.scope==='exact-scope' && releaseDecisionAllowed && Boolean(release.reason) && candidate.complex===request.complex && candidate.constituent===request.constituent && candidate.route===request.route && candidate.servicePattern===request.servicePattern && candidate.direction===request.direction && candidate.destination===request.destination && candidate.platformId===request.platformId && candidate.layoutOrientation===request.orientation && candidate.objectiveType===request.objectiveType && candidate.objectiveTarget===request.objectiveTarget && candidate.accessiblePathVersion===request.accessiblePathVersion && Number.isFinite(Date.parse(`${candidate.verificationDate}T00:00:00Z`)) && candidate.reverificationStatus.startsWith('current|') && candidate.disposition.startsWith('eligible-for-runtime-evaluation|') && reviews.every((decision)=>decision.startsWith(`approve|${candidate.immutableVersion}|`)) && candidate.provenance?.immutable===true && candidate.provenance.reviewed===true && candidate.provenance.version===candidate.immutableVersion && Boolean(candidate.provenance.sourceId);
  });
  if (!record || !request.exposure) return undefined;
  const resolved = deepFreeze({
    ...record,
    [platformGuidanceBrand]: true as const,
    exposureDecisionId: request.exposure.decisionId,
    releaseDecisionId: request.exposure.releaseDecisionId,
  });
  resolvedPlatformGuidance.add(resolved);
  return resolved;
}
export function isResolvedPlatformGuidance(value: unknown): value is ResolvedPlatformGuidance { return Boolean(value&&typeof value==='object'&&resolvedPlatformGuidance.has(value)); }
function deepFreeze<T>(value:T):T { if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);}return value; }
function strictRecord(value:unknown, fields:readonly string[], label:string):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(`${label} must be an object`);const root=value as Record<string,unknown>;const missing=fields.filter((field)=>!(field in root));const unexpected=Object.keys(root).filter((field)=>!fields.includes(field));if(missing.length||unexpected.length)throw new Error(`${label} must contain its exact schema; missing: ${missing.join(',')||'none'}; unexpected: ${unexpected.join(',')||'none'}`);return root;}
