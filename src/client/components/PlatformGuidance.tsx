import { isResolvedPlatformGuidance, type ResolvedPlatformGuidance } from '../../shared/domain/platform-guidance';

export function PlatformGuidance({ guidance }: { readonly guidance: ResolvedPlatformGuidance | undefined }) {
  if (!isResolvedPlatformGuidance(guidance)) return null;
  return <section className="platform-guidance" aria-label="Platform guidance">
    <p className="platform-guidance__position">Board near the {guidance.position}</p>
    <p>{guidance.zoneBenefit.split('|').at(-1)}</p>
  </section>;
}
