import { describe, expect, test } from 'vitest';
import { chooseAccessibilityAlternative, type AccessibilityAlternative } from '../../src/shared/domain/accessibility-alternatives';
import { resolvedPath } from '../fixtures/accessibility-decisions';

const candidate = (id: string, tier: AccessibilityAlternative['tier'], overrides: Partial<AccessibilityAlternative> = {}): AccessibilityAlternative => ({
  id, label: `Use ${id}`, canonicalIdentity: id, tier, pathDecision: resolvedPath(id), singlePointElevatorDependencies: 1,
  transfers: 1, accessibleWalkingMeters: 200, disruptionRisk: 1, travelSeconds: 1200, includesBus: tier === 'bus-inclusive', ...overrides,
});

describe('accessible alternatives', () => {
  test('uses exact tier order and never lets a faster later tier overtake same-complex evidence', () => {
    const result = chooseAccessibilityAlternative([candidate('bus', 'bus-inclusive', { travelSeconds: 60 }), candidate('detour', 'subway-detour', { travelSeconds: 120 }), candidate('nearby', 'nearby-station', { travelSeconds: 180 }), candidate('same', 'same-complex', { travelSeconds: 900 })], { includeBuses: true });
    expect(result).toMatchObject({ first: { id: 'same' }, selectedId: null });
  });

  test('applies rider-relevant lexicographic order then canonical identity within one tier', () => {
    const options = [candidate('z', 'same-complex'), candidate('a', 'same-complex'), candidate('fewer-elevators', 'same-complex', { singlePointElevatorDependencies: 0, travelSeconds: 5000 })];
    expect(chooseAccessibilityAlternative(options, { includeBuses: false }).first?.id).toBe('fewer-elevators');
    expect(chooseAccessibilityAlternative(options.slice(0, 2), { includeBuses: false }).first?.id).toBe('a');
  });

  test('excludes unresolved and caller-authored path decisions and exposes only the first verified option', () => {
    const forged = candidate('forged', 'same-complex');
    const result = chooseAccessibilityAlternative([
      candidate('bad', 'same-complex', { pathDecision: resolvedPath('bad', 'ineligible') }),
      { ...forged, pathDecision: { ...forged.pathDecision } as never }, candidate('nearby', 'nearby-station'), candidate('detour', 'subway-detour'),
    ], { includeBuses: false });
    expect(result).toMatchObject({ first: { id: 'nearby' }, visible: [{ id: 'nearby' }], selectedId: null, accessibleRouteOnly: true });
  });

  test('requires a separate explicit choice before bus-inclusive options enter consideration', () => {
    expect(chooseAccessibilityAlternative([candidate('bus', 'bus-inclusive')], { includeBuses: false }).first).toBeNull();
    expect(chooseAccessibilityAlternative([candidate('bus', 'bus-inclusive')], { includeBuses: true }).first?.id).toBe('bus');
  });

  test('returns an opaque, immutable selection that rejects caller copying', () => {
    const selection = chooseAccessibilityAlternative([candidate('same', 'same-complex')], { includeBuses: false });
    expect(Object.isFrozen(selection)).toBe(true);
    expect(Object.isFrozen(selection.visible)).toBe(true);
    expect(chooseAccessibilityAlternative([{ ...candidate('copy', 'same-complex'), pathDecision: { status: 'eligible', pathId: 'copy' } as never }], { includeBuses: false }).first).toBeNull();
  });
});
