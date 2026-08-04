import type { RuntimeMode } from '../config';

export type ExposureStage =
  | 'arrival-boards'
  | 'nearby-offline'
  | 'accessibility'
  | 'guidance'
  | 'maps-rights'
  | 'commute-evaluation'
  | 'commute-silent'
  | 'commute-limited-pilot'
  | 'commute-delivery';

export type ExposureReasonCode =
  | 'GATE_0_NOT_PASSED'
  | 'NEARBY_GATE_0_NOT_PASSED'
  | 'ACCESSIBILITY_EVIDENCE_NOT_DEMONSTRATED'
  | 'GUIDANCE_EVIDENCE_NOT_DEMONSTRATED'
  | 'MAP_RIGHTS_NOT_DOCUMENTED'
  | 'COMMUTE_PREREQUISITES_INCOMPLETE';

export interface LockedExposureDecision {
  readonly exposed: false;
  readonly reasonCode: ExposureReasonCode;
  readonly decision: string;
}

export interface ExposureEvaluation {
  readonly public: Readonly<Record<ExposureStage, LockedExposureDecision>>;
  readonly diagnostics: {
    readonly validationFixtures: boolean;
    readonly liveShadow: boolean;
    readonly riderExposure: false;
  };
}

const locked = (
  reasonCode: ExposureReasonCode,
  decision: string,
): LockedExposureDecision => Object.freeze({ exposed: false, reasonCode, decision });

const CURRENT_PUBLIC_LOCKS: ExposureEvaluation['public'] = Object.freeze({
  'arrival-boards': locked('GATE_0_NOT_PASSED', 'NO-GO — GATE 0 NOT PASSED'),
  'nearby-offline': locked('NEARBY_GATE_0_NOT_PASSED', 'NO-GO — GATE 0 NOT PASSED'),
  accessibility: locked(
    'ACCESSIBILITY_EVIDENCE_NOT_DEMONSTRATED',
    'NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED',
  ),
  guidance: locked(
    'GUIDANCE_EVIDENCE_NOT_DEMONSTRATED',
    'NO-GO — RELEASE 2 POSITIONING AND TRANSFER EVIDENCE IS NOT DEMONSTRATED',
  ),
  'maps-rights': locked(
    'MAP_RIGHTS_NOT_DOCUMENTED',
    'Blocked from public release — rights not documented.',
  ),
  'commute-evaluation': locked(
    'COMMUTE_PREREQUISITES_INCOMPLETE',
    'NO-GO — prerequisites and fixed-version evidence incomplete',
  ),
  'commute-silent': locked(
    'COMMUTE_PREREQUISITES_INCOMPLETE',
    'NO-GO — prerequisites and fixed-version evidence incomplete',
  ),
  'commute-limited-pilot': locked(
    'COMMUTE_PREREQUISITES_INCOMPLETE',
    'NO-GO — prerequisites and fixed-version evidence incomplete',
  ),
  'commute-delivery': locked(
    'COMMUTE_PREREQUISITES_INCOMPLETE',
    'NO-GO — prerequisites and fixed-version evidence incomplete',
  ),
});

export function evaluateExposure(input: { mode: RuntimeMode }): ExposureEvaluation {
  return {
    public: CURRENT_PUBLIC_LOCKS,
    diagnostics: {
      validationFixtures: input.mode === 'validation',
      liveShadow: input.mode === 'shadow',
      riderExposure: false,
    },
  };
}
