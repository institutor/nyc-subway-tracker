type EvidenceOwner = 'accessibility' | 'guidance';
interface ExposureBase<Owner extends EvidenceOwner> { readonly owner: Owner; readonly packageVersion: string; readonly immutable: boolean; readonly reviewed: boolean }
interface ValidationExposure<Owner extends EvidenceOwner> extends ExposureBase<Owner> { readonly surface: 'validation'; readonly exposed: true; readonly approval?: never }
interface LockedPublicExposure<Owner extends EvidenceOwner> extends ExposureBase<Owner> { readonly surface: 'public'; readonly exposed: false; readonly reason: 'pending'; readonly approval?: never }
interface ApprovedPublicExposure<Owner extends EvidenceOwner> extends ExposureBase<Owner> { readonly surface: 'public'; readonly exposed: true; readonly approval: { readonly status: 'approved'; readonly version: string; readonly immutable: boolean; readonly reviewed: boolean } }
export type AccessibilityExposureDecision = ValidationExposure<'accessibility'> | LockedPublicExposure<'accessibility'> | ApprovedPublicExposure<'accessibility'>;
export type GuidanceExposureDecision = ValidationExposure<'guidance'> | LockedPublicExposure<'guidance'> | ApprovedPublicExposure<'guidance'>;

export const PRODUCTION_ACCESSIBILITY_EXPOSURE: AccessibilityExposureDecision = deepFreeze({ owner: 'accessibility', surface: 'public', exposed: false, packageVersion: 'pending', immutable: false, reviewed: false, reason: 'pending' });
export const PRODUCTION_GUIDANCE_EXPOSURE: GuidanceExposureDecision = deepFreeze({ owner: 'guidance', surface: 'public', exposed: false, packageVersion: 'pending', immutable: false, reviewed: false, reason: 'pending' });

export function exposureAllowsEvaluation(decision: AccessibilityExposureDecision | GuidanceExposureDecision | null | undefined, packageVersion: string, owner: EvidenceOwner): boolean {
  if (!decision || decision.owner !== owner || !decision.exposed || !decision.immutable || !decision.reviewed || decision.packageVersion !== packageVersion) return false;
  if (decision.surface === 'validation') return true;
  return decision.approval.status === 'approved' && decision.approval.version === packageVersion && decision.approval.immutable && decision.approval.reviewed;
}
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object') Object.freeze(value); return value; }
