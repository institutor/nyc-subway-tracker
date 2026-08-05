import { platformGuidanceAllowsPresentation, type ResolvedPlatformGuidance } from '../../shared/domain/platform-guidance';
import type { ExposureSurface } from '../../shared/domain/exposure-decision';

interface PlatformGuidanceProps { readonly guidance: ResolvedPlatformGuidance | undefined; readonly decisionTime: Date }

export function PlatformGuidance(props: PlatformGuidanceProps) {
  return <PlatformGuidanceForSurface {...props} surface="public" />;
}

/** Explicit validation-only harness; App never imports or selects this component. */
export function ValidationPlatformGuidance(props: PlatformGuidanceProps) {
  return <PlatformGuidanceForSurface {...props} surface="validation" />;
}

function PlatformGuidanceForSurface({ guidance, decisionTime, surface }: PlatformGuidanceProps & { readonly surface: ExposureSurface }) {
  if (!platformGuidanceAllowsPresentation(guidance, surface, decisionTime)) return null;
  return <section className="platform-guidance" aria-label="Platform guidance">
    <p className="platform-guidance__position">Board near the {guidance.position}</p>
    <p>{guidance.zoneBenefit.copy}</p>
  </section>;
}
