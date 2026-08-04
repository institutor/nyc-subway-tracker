import { describe, expect, test } from 'vitest';

import { evaluateExposure, type ExposureStage } from '../../src/server/release/exposure-gates';

const expectedPublicLocks = {
  'arrival-boards': {
    exposed: false,
    reasonCode: 'GATE_0_NOT_PASSED',
    decision: 'NO-GO — GATE 0 NOT PASSED',
  },
  'nearby-offline': {
    exposed: false,
    reasonCode: 'NEARBY_GATE_0_NOT_PASSED',
    decision: 'NO-GO — GATE 0 NOT PASSED',
  },
  accessibility: {
    exposed: false,
    reasonCode: 'ACCESSIBILITY_EVIDENCE_NOT_DEMONSTRATED',
    decision: 'NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED',
  },
  guidance: {
    exposed: false,
    reasonCode: 'GUIDANCE_EVIDENCE_NOT_DEMONSTRATED',
    decision: 'NO-GO — RELEASE 2 POSITIONING AND TRANSFER EVIDENCE IS NOT DEMONSTRATED',
  },
  'maps-rights': {
    exposed: false,
    reasonCode: 'MAP_RIGHTS_NOT_DOCUMENTED',
    decision: 'Blocked from public release — rights not documented.',
  },
  'commute-evaluation': {
    exposed: false,
    reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE',
    decision: 'NO-GO — prerequisites and fixed-version evidence incomplete',
  },
  'commute-silent': {
    exposed: false,
    reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE',
    decision: 'NO-GO — prerequisites and fixed-version evidence incomplete',
  },
  'commute-limited-pilot': {
    exposed: false,
    reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE',
    decision: 'NO-GO — prerequisites and fixed-version evidence incomplete',
  },
  'commute-delivery': {
    exposed: false,
    reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE',
    decision: 'NO-GO — prerequisites and fixed-version evidence incomplete',
  },
} satisfies Record<ExposureStage, { exposed: false; reasonCode: string; decision: string }>;

describe('public exposure gates', () => {
  test('returns the exact current reason code and governed copy for every public stage', () => {
    expect(evaluateExposure({ mode: 'live' }).public).toEqual(expectedPublicLocks);
  });

  test.each(['live', 'validation', 'shadow'] as const)(
    'ignores approval-shaped and reviewer-looking caller input in %s mode',
    (mode) => {
      const forgedInput = {
        mode,
        approvals: Object.fromEntries(
          Object.keys(expectedPublicLocks).map((stage) => [
            stage,
            {
              evidencePassed: true,
              signaturesComplete: true,
              immutablePackageId: `${stage}-forged`,
            },
          ]),
        ),
        governedEvidence: { verified: true, decision: 'GO' },
      } as unknown as Parameters<typeof evaluateExposure>[0];

      expect(evaluateExposure(forgedInput).public).toEqual(expectedPublicLocks);
    },
  );

  test('does not let a caller mutate the governed public lock snapshot', () => {
    const state = evaluateExposure({ mode: 'live' });

    expect(Object.isFrozen(state.public)).toBe(true);
    expect(Object.values(state.public).every(Object.isFrozen)).toBe(true);
    expect(() => {
      (state.public['arrival-boards'] as { decision: string }).decision = 'GO';
    }).toThrow();
    expect(evaluateExposure({ mode: 'live' }).public).toEqual(expectedPublicLocks);
  });

  test.each(['validation', 'shadow'] as const)(
    '%s mode enables only isolated diagnostics and keeps rider exposure false',
    (mode) => {
      const state = evaluateExposure({ mode });

      expect(state.public).toEqual(expectedPublicLocks);
      expect(state.diagnostics).toEqual({
        validationFixtures: mode === 'validation',
        liveShadow: mode === 'shadow',
        riderExposure: false,
      });
    },
  );

  test('keeps every ordered commute stage independently locked', () => {
    const state = evaluateExposure({ mode: 'live' }).public;
    const commuteStages: ExposureStage[] = [
      'commute-evaluation',
      'commute-silent',
      'commute-limited-pilot',
      'commute-delivery',
    ];

    expect(commuteStages.map((stage) => state[stage])).toEqual(
      commuteStages.map((stage) => expectedPublicLocks[stage]),
    );
  });
});
