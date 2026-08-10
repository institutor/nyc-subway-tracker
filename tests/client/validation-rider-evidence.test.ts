import { describe, expect, test } from 'vitest';

import { accessiblePathDecisionAllowsPresentation } from '../../src/shared/domain/accessible-path';
import { equipmentDecisionAllowsUse } from '../../src/shared/domain/equipment-status';
import { platformGuidanceAllowsPresentation } from '../../src/shared/domain/platform-guidance';
import { createValidationRiderEvidence } from '../../src/shared/validation/rider-evidence';

describe('production-owned validation rider evidence', () => {
  test('composes one exact A12-to-R20 accessible path and positioning decision through domain resolvers', () => {
    const decisionTime = new Date('2026-08-04T12:00:00.000Z');

    const evidence = createValidationRiderEvidence(decisionTime);

    expect(evidence).toBeDefined();
    if (!evidence) throw new Error('Expected validation rider evidence');
    expect(accessiblePathDecisionAllowsPresentation(evidence.path, 'validation', decisionTime)).toBe(true);
    expect(evidence.path).toMatchObject({
      status: 'eligible', surface: 'validation', accessibleRouteOnly: true,
      stationComplexId: 'A12', constituentStationId: 'A12', routeId: 'A', direction: 'southbound',
      equipmentIds: ['EL-A12-01'],
      journeyScope: {
        origin: { stationComplexId: 'A12', constituentStationId: 'A12' },
        destination: { stationComplexId: 'R20', constituentStationId: 'R20' },
      },
    });
    expect(evidence.equipment).toHaveLength(1);
    expect(equipmentDecisionAllowsUse(evidence.equipment[0]!.decision, decisionTime)).toBe(true);
    expect(evidence.equipment[0]).toMatchObject({ label: '125 St platform elevator', required: true });
    expect(platformGuidanceAllowsPresentation(evidence.guidance, 'validation', decisionTime)).toBe(true);
    expect(evidence.guidance).toMatchObject({
      route: 'A', direction: 'southbound', destination: 'Far Rockaway', position: 'middle',
      zoneBenefit: { position: 'middle', copy: 'Nearest verified elevator' },
    });
  });

  test('returns no branded evidence outside the committed validation decision window', () => {
    expect(createValidationRiderEvidence(new Date('2028-08-04T12:00:00.000Z'))).toBeUndefined();
  });
});
