import { describe, expect, test } from 'vitest';

import { evaluateExposure, type ExposureStage } from '../../src/server/release/exposure-gates';

const stages: ExposureStage[] = [
  'arrival-boards',
  'nearby-offline',
  'accessibility',
  'guidance',
  'maps-rights',
  'commute-alerts',
];

describe('public exposure gates', () => {
  test('defaults every public stage to its current recorded NO-GO', () => {
    const state = evaluateExposure({ mode: 'live' });

    expect(Object.keys(state.public)).toEqual(stages);
    expect(state.public['arrival-boards']).toEqual({
      exposed: false,
      decision: 'NO-GO — GATE 0 NOT PASSED',
    });
    expect(state.public['nearby-offline'].exposed).toBe(false);
    expect(state.public.accessibility.decision).toContain('NO-GO');
    expect(state.public.guidance.decision).toContain('NO-GO');
    expect(state.public['maps-rights'].decision).toContain('NO-GO');
    expect(state.public['commute-alerts'].decision).toContain('NO-GO');
  });

  test.each(['validation', 'shadow'] as const)(
    '%s mode enables only isolated diagnostics and never mutates public state',
    (mode) => {
      const before = evaluateExposure({ mode: 'live' }).public;
      const state = evaluateExposure({ mode });

      expect(state.public).toEqual(before);
      expect(stages.every((stage) => state.public[stage].exposed === false)).toBe(true);
      expect(state.diagnostics).toEqual({
        validationFixtures: mode === 'validation',
        liveShadow: mode === 'shadow',
        riderExposure: false,
      });
    },
  );

  test.each(['validation', 'shadow'] as const)(
    '%s mode remains non-public even when supplied a passing release package',
    (mode) => {
      const state = evaluateExposure({
        mode,
        approvals: {
          'arrival-boards': {
            evidencePassed: true,
            signaturesComplete: true,
            immutablePackageId: 'gate-0-2026-08-04-v1',
          },
        },
      });

      expect(state.public['arrival-boards']).toEqual({
        exposed: false,
        decision: 'NO-GO — GATE 0 NOT PASSED',
      });
      expect(state.diagnostics.riderExposure).toBe(false);
    },
  );

  test('does not open a public stage without one immutable package and complete same-version approval', () => {
    expect(
      evaluateExposure({
        mode: 'live',
        approvals: {
          'arrival-boards': { evidencePassed: true, signaturesComplete: true },
        },
      }).public['arrival-boards'].exposed,
    ).toBe(false);

    expect(
      evaluateExposure({
        mode: 'live',
        approvals: {
          'arrival-boards': {
            evidencePassed: true,
            signaturesComplete: true,
            immutablePackageId: 'gate-0-2026-08-04-v1',
          },
        },
      }).public['arrival-boards'],
    ).toEqual({ exposed: true, decision: 'GO — SAME-VERSION PACKAGE APPROVED' });
  });
});
