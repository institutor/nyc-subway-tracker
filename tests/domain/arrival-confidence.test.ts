import { describe, expect, test } from 'vitest';

import {
  assessArrivalConfidence,
  evaluateExpectedEvidencePair,
  type ArrivalConfidenceInput,
  type ExpectedEvidenceUpdate,
} from '../../src/shared/domain/arrival-confidence';

const BASE = new Date('2026-08-04T12:00:00.000Z');
const at = (seconds: number) => new Date(BASE.getTime() + seconds * 1_000);

function update(seconds: number, overrides: Partial<ExpectedEvidenceUpdate> = {}): ExpectedEvidenceUpdate {
  return {
    evidenceId: `e-${seconds}`,
    sourceTimestamp: at(seconds),
    stableTrainIdentity: 'train-a',
    patternIdentity: 'A23N:12>A24N:13>A25N:14',
    direction: 'northbound',
    destination: 'Inwood-207 St',
    exactTargetStopCallIdentity: 'A24N\u0000sequence:13',
    assignedPhysicalTrain: true,
    atOrigin: true,
    movementObserved: false,
    overdueVerdict: 'not-overdue',
    supportedRange: { startsAt: at(360), endsAt: at(480) },
    accepted: true,
    ...overrides,
  };
}

function confidence(overrides: Partial<ArrivalConfidenceInput> = {}): ArrivalConfidenceInput {
  return {
    assessedAt: BASE,
    feedState: 'current',
    exactStopConfirmed: true,
    trackPathConfirmed: true,
    recoveryDisposition: 'live-continuity',
    trainPhase: 'running',
    progressAt: at(-30),
    predictedAt: at(180),
    lastSupportedAt: at(180),
    dueStartedAt: null,
    unusualDwellVerdict: 'not-unusual',
    ...overrides,
  };
}

describe('Expected evidence admission', () => {
  test('requires two distinct consecutive accepted coherent updates with exactly stable supported range', () => {
    expect(evaluateExpectedEvidencePair([update(-10), update(0)])).toMatchObject({ eligible: true });
    for (const pair of [
      [update(0)],
      [update(-10), update(0, { overdueVerdict: 'overdue' })],
      [update(-10), update(0, { stableTrainIdentity: 'train-b' })],
      [update(-10), update(0, { patternIdentity: 'changed' })],
      [update(-10), update(0, { direction: 'southbound' })],
      [update(-10), update(0, { destination: 'Euclid Av' })],
      [update(-10), update(0, { exactTargetStopCallIdentity: 'A25N\u0000sequence:14' })],
      [update(-10), update(0, { supportedRange: { startsAt: at(361), endsAt: at(480) } })],
      [update(-10), update(-10, { evidenceId: 'e--10' })],
      [update(-10), update(0, { accepted: false })],
      [update(-10), update(0, { movementObserved: true })],
      [update(-10), update(0, { assignedPhysicalTrain: false })],
      [update(-10), update(0, { atOrigin: false })],
    ]) expect(evaluateExpectedEvidencePair(pair)).toMatchObject({ eligible: false });
  });

  test('accepts only an explicitly injected governed range-stability predicate when exact equality differs', () => {
    const pair = [update(-10), update(0, { supportedRange: { startsAt: at(361), endsAt: at(481) } })];
    expect(evaluateExpectedEvidencePair(pair, { rangeStable: () => true })).toMatchObject({ eligible: true });
  });

  test('long valid origin-terminal hold remains Expected and recovery never restores Expected', () => {
    expect(assessArrivalConfidence(confidence({
      trainPhase: 'origin-awaiting-departure', progressAt: null, expectedUpdates: [update(-600), update(0)],
    }))).toMatchObject({ kind: 'expected', primary: true, exactTime: null });
    expect(assessArrivalConfidence(confidence({
      trainPhase: 'origin-awaiting-departure', progressAt: null, expectedUpdates: [update(-10), update(0)],
      recoveryDisposition: 'live-readmission-eligible',
    }))).toMatchObject({ kind: 'withheld', primary: false });
  });
});

describe('independent movement and Due clocks', () => {
  test.each([
    [90, 'live', true], [90.001, 'holding', false], [180, 'holding', false], [180.001, 'uncertain', false],
  ] as const)('movement age %s seconds produces %s', (age, kind, primary) => {
    expect(assessArrivalConfidence(confidence({ progressAt: at(-age) }))).toMatchObject({ kind, primary });
  });

  test.each([
    [60, 30, 'live', 'due', true],
    [60.001, 61, 'holding', null, false],
    [120, 120, 'holding', null, false],
    [120.001, 120.001, 'holding', null, false],
    [120, 180.001, 'uncertain', null, false],
  ] as const)('Due elapsed %s and movement age %s uses stricter %s state', (dueAge, movementAge, kind, label, primary) => {
    expect(assessArrivalConfidence(confidence({ dueStartedAt: at(-dueAge), progressAt: at(-movementAge), predictedAt: at(-1) })))
      .toMatchObject({ kind, label, primary });
  });

  test('ETA-only changes do not reset Due while accepted progress begins a new episode', () => {
    const etaOnly = assessArrivalConfidence(confidence({ dueStartedAt: at(-61), progressAt: at(-70), predictedAt: at(300) }));
    expect(etaOnly).toMatchObject({ kind: 'holding', dueElapsedSeconds: 61 });
    const progressed = assessArrivalConfidence(confidence({ dueStartedAt: at(-10), progressAt: at(-5), predictedAt: at(300) }));
    expect(progressed).toMatchObject({ kind: 'live', label: 'due', dueElapsedSeconds: 5 });
  });

  test('Holding freezes and Uncertain removes exact precision; unusual dwell is diagnostic only', () => {
    expect(assessArrivalConfidence(confidence({ progressAt: at(-100), unusualDwellVerdict: 'unusual' }))).toMatchObject({
      kind: 'holding', primary: false, exactTime: at(180), unusualDwell: true,
    });
    expect(assessArrivalConfidence(confidence({ progressAt: at(-181), unusualDwellVerdict: 'unusual' }))).toMatchObject({
      kind: 'uncertain', primary: false, exactTime: null, unusualDwell: true,
    });
  });

  test('failed stop/path, degraded feed, and withheld recovery never become per-train Uncertain primary evidence', () => {
    expect(assessArrivalConfidence(confidence({ exactStopConfirmed: false }))).toMatchObject({ kind: 'withheld' });
    expect(assessArrivalConfidence(confidence({ trackPathConfirmed: false }))).toMatchObject({ kind: 'withheld' });
    expect(assessArrivalConfidence(confidence({ feedState: 'degraded' }))).toMatchObject({ kind: 'feed-updating', primary: false });
    expect(assessArrivalConfidence(confidence({ recoveryDisposition: 'precision-withheld' }))).toMatchObject({ kind: 'withheld' });
    expect(assessArrivalConfidence(confidence({ recoveryDisposition: 'hard-suppressed' }))).toMatchObject({ kind: 'withheld' });
  });

  test('invalid clock input throws without changing a repeated valid decision', () => {
    const before = assessArrivalConfidence(confidence());
    expect(() => assessArrivalConfidence(confidence({ assessedAt: new Date(Number.NaN) }))).toThrow(/invalid/i);
    expect(assessArrivalConfidence(confidence())).toEqual(before);
  });
});
