import type { RuntimeMode } from '../config';

export type ExposureStage =
  | 'arrival-boards'
  | 'nearby-offline'
  | 'accessibility'
  | 'guidance'
  | 'maps-rights'
  | 'commute-alerts';

export interface StageApproval {
  immutablePackageId?: string;
  evidencePassed: boolean;
  signaturesComplete: boolean;
}

export interface ExposureEvaluation {
  public: Record<ExposureStage, { exposed: boolean; decision: string }>;
  diagnostics: {
    validationFixtures: boolean;
    liveShadow: boolean;
    riderExposure: false;
  };
}

const currentNoGo: Record<ExposureStage, string> = {
  'arrival-boards': 'NO-GO — GATE 0 NOT PASSED',
  'nearby-offline': 'NO-GO — RELEASE 1 EVIDENCE AND APPROVALS ARE NOT DEMONSTRATED',
  accessibility: 'NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED',
  guidance: 'NO-GO — RELEASE 2 POSITIONING AND TRANSFER EVIDENCE IS NOT DEMONSTRATED',
  'maps-rights': 'NO-GO — MAP RIGHTS OR REVIEWED NO-DEPENDENCY RESULT IS NOT DEMONSTRATED',
  'commute-alerts': 'NO-GO — PREREQUISITES AND FIXED-VERSION EVIDENCE INCOMPLETE',
};

export function evaluateExposure(input: {
  mode: RuntimeMode;
  approvals?: Partial<Record<ExposureStage, StageApproval>>;
}): ExposureEvaluation {
  const publicState = {} as ExposureEvaluation['public'];
  for (const stage of Object.keys(currentNoGo) as ExposureStage[]) {
    const approval = input.approvals?.[stage];
    const exposed = Boolean(
      input.mode === 'live' &&
        approval?.immutablePackageId &&
        approval.evidencePassed &&
        approval.signaturesComplete,
    );
    publicState[stage] = {
      exposed,
      decision: exposed ? 'GO — SAME-VERSION PACKAGE APPROVED' : currentNoGo[stage],
    };
  }

  return {
    public: publicState,
    diagnostics: {
      validationFixtures: input.mode === 'validation',
      liveShadow: input.mode === 'shadow',
      riderExposure: false,
    },
  };
}
