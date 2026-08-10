import { describe, expect, test } from 'vitest';

import { compareShadowProgress, type ShadowProgressCandidate } from '../../src/server/services/shadow-progress';

const earlier: ShadowProgressCandidate = {
  sourceId: 'subway-rt-ace',
  observedAt: '2026-08-10T12:00:00.000Z',
  operationalTrainId: 'train-1',
  routeId: 'A',
  nextStopId: 'A12N',
  targetStopId: 'A16N',
  remainingStopCount: 3,
  remainingStopIds: ['A12N', 'A14N', 'A16N'],
};

describe('shadow later-stop comparison', () => {
  test('calls only a stop demonstrated later in the earlier sequence progressed', () => {
    const later = { ...earlier, observedAt: '2026-08-10T12:02:00.000Z', nextStopId: 'A14N', remainingStopIds: ['A14N', 'A16N'], remainingStopCount: 2 };
    expect(compareShadowProgress([earlier], [later])).toEqual([expect.objectContaining({
      result: 'progressed', reasonCode: 'NEXT_STOP_ADVANCED',
    })]);
  });

  test('keeps an unrecognized changed stop inconclusive', () => {
    const later = { ...earlier, observedAt: '2026-08-10T12:02:00.000Z', nextStopId: 'D01N', remainingStopIds: ['D01N'], remainingStopCount: 1 };
    expect(compareShadowProgress([earlier], [later])).toEqual([expect.objectContaining({
      result: 'inconclusive', reasonCode: 'LATER_STOP_NOT_DEMONSTRATED',
    })]);
  });

  test('does not claim progress while the next stop is unchanged', () => {
    const later = { ...earlier, observedAt: '2026-08-10T12:02:00.000Z' };
    expect(compareShadowProgress([earlier], [later])).toEqual([expect.objectContaining({
      result: 'not-observed', reasonCode: 'NEXT_STOP_UNCHANGED',
    })]);
  });

  test.each([
    ['claim target changed', { targetStopId: 'A99N', remainingStopIds: ['A14N', 'A99N'] }, 'CLAIM_TARGET_CHANGED'],
    ['target no longer remains in path', { remainingStopIds: ['A14N'] }, 'TARGET_NOT_IN_LATER_PATH'],
    ['later path rerouted', { remainingStopIds: ['A14N', 'D01N', 'A16N'] }, 'PATH_CHANGED_OR_REROUTED'],
  ])('keeps %s inconclusive', (_label, changed, reasonCode) => {
    const later = {
      ...earlier, observedAt: '2026-08-10T12:02:00.000Z', nextStopId: 'A14N',
      remainingStopCount: changed.remainingStopIds.length, ...changed,
    };
    expect(compareShadowProgress([earlier], [later])).toEqual([expect.objectContaining({
      result: 'inconclusive', reasonCode,
    })]);
  });

  test('rejects the whole exact prior record when one claim row is malformed', async () => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    const exact = {
      schemaVersion: 'shadow-v2', recordId: 'shadow-a', mode: 'shadow',
      recordedAt: '2026-08-10T12:00:01.000Z', decisionTime: '2026-08-10T12:00:00.000Z',
      riderExposure: false, boardsExposed: false, outcome: 'COMPLETED',
      sources: [], gates: [], claims: [earlier], progressComparisons: [],
    };
    expect(() => module.parseShadowProgressRecord({
      ...exact, claims: [earlier, { ...earlier, remainingStopIds: ['A12N', 7, 'A16N'] }],
    })).toThrow(/invalid prior shadow record/i);
    expect(() => module.parseShadowProgressRecord({ ...exact, extra: true }))
      .toThrow(/invalid prior shadow record/i);
  });

  test.each([
    ['an extra claim field', (record: any) => { record.claims[0].extra = true; }],
    ['a disposition/suppression mismatch', (record: any) => { record.claims[0].suppressionReasonCode = 'MOVEMENT_EVIDENCE_UNCONFIRMED'; }],
    ['forged provenance ownership', (record: any) => { record.claims[0].provenance.sourceId = 'other-feed'; }],
    ['mismatched admission identity', (record: any) => { record.claims[0].decisions.admission.stopCallIdentity = 'A16N\u0000sequence:99'; }],
    ['an inconsistent remaining count', (record: any) => { record.claims[0].remainingStopCount = 4; }],
  ])('invalidates the whole v2 record on %s', async (_label, alter) => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    const record = fullShadowRecord();
    expect(module.parseShadowProgressRecord(record)).toEqual([
      expect.objectContaining({ targetStopCallIdentity: 'A16N\u0000sequence:3' }),
    ]);
    alter(record);
    expect(() => module.parseShadowProgressRecord(record)).toThrow(/invalid prior shadow record/i);
  });

  test('keeps two target claims for one train distinct instead of overwriting by train identity', () => {
    const near = { ...earlier, targetStopId: 'A14N', remainingStopCount: 2, remainingStopIds: ['A12N', 'A14N'] };
    const laterFar = { ...earlier, observedAt: '2026-08-10T12:02:00.000Z', nextStopId: 'A14N', remainingStopCount: 2, remainingStopIds: ['A14N', 'A16N'] };
    const laterNear = { ...near, observedAt: '2026-08-10T12:02:00.000Z' };
    expect(compareShadowProgress([near, earlier], [laterNear, laterFar])).toEqual([
      expect.objectContaining({ targetStopId: 'A14N', result: 'not-observed' }),
      expect.objectContaining({ targetStopId: 'A16N', result: 'progressed' }),
    ]);
  });
});

function fullShadowRecord() {
  const stages = [
    'arrival-boards', 'nearby-offline', 'accessibility', 'guidance', 'maps-rights',
    'commute-evaluation', 'commute-silent', 'commute-limited-pilot', 'commute-delivery',
  ];
  const claim = {
    ...earlier,
    targetStopCallIdentity: 'A16N\u0000sequence:3',
    claimId: 'subway-rt-ace:train-1:A16N:3', decisionTime: '2026-08-10T12:00:00.000Z',
    disposition: 'admitted',
    provenance: {
      source: 'gtfs-rt', sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace',
      observedAt: '2026-08-10T12:00:00.000Z', retrievedAt: '2026-08-10T12:00:00.000Z', sha256: 'a'.repeat(64),
    },
    decisions: {
      feedHealth: { kind: 'current', reasonCode: 'accepted-current' },
      serviceChange: { kind: 'eligible-context', disposition: 'eligible' },
      admission: { kind: 'admitted', confidence: 'live', stopCallIdentity: 'A16N\u0000sequence:3', row: {} },
    },
  };
  return {
    schemaVersion: 'shadow-v2', recordId: 'shadow-a', mode: 'shadow',
    recordedAt: '2026-08-10T12:00:01.000Z', decisionTime: '2026-08-10T12:00:00.000Z',
    riderExposure: false, boardsExposed: false, outcome: 'COMPLETED',
    sources: Array.from({ length: 8 }, (_, index) => ({ sourceId: `source-${index}`, role: index === 7 ? 'subway-alerts' : 'subway-realtime' })),
    gates: stages.map((stage) => ({ stage, exposed: false, reasonCode: 'LOCKED', decision: 'Locked' })),
    claims: [claim], progressComparisons: [],
  };
}
