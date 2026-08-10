import { platformGuidanceAllowsPresentation, type ResolvedPlatformGuidance } from '../../shared/domain/platform-guidance';
import type { ExposureSurface } from '../../shared/domain/exposure-decision';

interface PlatformGuidanceProps { readonly guidance: ResolvedPlatformGuidance | undefined; readonly decisionTime: Date }

export function PlatformGuidance(props: PlatformGuidanceProps) {
  return <PlatformGuidanceForSurface {...props} surface="public" />;
}

/** Validation-only presentation; callers must supply evidence admitted for the validation surface. */
export function ValidationPlatformGuidance(props: PlatformGuidanceProps) {
  return <PlatformGuidanceForSurface {...props} surface="validation" />;
}

function PlatformGuidanceForSurface({ guidance, decisionTime, surface }: PlatformGuidanceProps & { readonly surface: ExposureSurface }) {
  if (!platformGuidanceAllowsPresentation(guidance, surface, decisionTime)) return null;
  const positionCopy = guidance.objectiveType === 'accessible-exit'
    ? `${guidance.complex.name} exit · use the ${guidance.position} platform zone`
    : `Board near the ${guidance.position}`;
  return <section className="platform-guidance" aria-label="Platform guidance">
    <p className="platform-guidance__position">{positionCopy}</p>
    <p>{guidance.zoneBenefit.copy}</p>
  </section>;
}
