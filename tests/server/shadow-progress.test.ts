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
});
