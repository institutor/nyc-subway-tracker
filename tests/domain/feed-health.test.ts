import { describe, expect, test } from 'vitest';

import {
  FeedHealthGovernor,
  classifyFeedAge,
  type FeedHealthDecision,
} from '../../src/shared/domain/feed-health';
import {
  assessSnapshotAnomaly,
  type NormalizedSnapshotEvidence,
} from '../../src/shared/domain/snapshot-anomaly';

const BASE = new Date('2026-08-04T12:00:00.000Z');

function at(seconds: number): Date {
  return new Date(BASE.getTime() + seconds * 1_000);
}

function snapshot(
  feedGroupId: string,
  seconds: number,
  entityCount: number,
  overrides: Partial<NormalizedSnapshotEvidence> = {},
): NormalizedSnapshotEvidence {
  return {
    sourceId: feedGroupId,
    feedGroupId,
    feedTimestamp: at(seconds),
    retrievedAt: at(seconds),
    contentHash: `${feedGroupId}-${seconds}-${entityCount}`,
    entityCount,
    coveredRouteIds: feedGroupId === 'ace' ? ['A', 'C', 'E'] : ['N', 'Q', 'R', 'W'],
    ...overrides,
  };
}

describe('feed age boundaries', () => {
  test.each([
    [90, 'current', 'accepted-current'],
    [91, 'degraded', 'snapshot-age-degraded'],
    [180, 'degraded', 'snapshot-age-degraded'],
    [181, 'unavailable', 'snapshot-age-unavailable'],
  ] as const)('classifies exactly %i whole seconds without rounding', (seconds, kind, reasonCode) => {
    expect(classifyFeedAge(at(0), at(seconds))).toMatchObject({
      kind,
      reasonCode,
      feedAgeSeconds: seconds,
    });
  });

  test('rejects future and invalid authoritative instants instead of clamping age', () => {
    expect(() => classifyFeedAge(at(1), at(0))).toThrow(/negative feed age/i);
    expect(() => classifyFeedAge(new Date(Number.NaN), at(0))).toThrow(/invalid/i);
  });
});

describe('snapshot anomaly quarantine', () => {
  test.each([
    [60, 'quarantined', 'bulk-population-loss'],
    [61, 'accepted', 'coherent-snapshot'],
  ] as const)('treats a candidate population of %i from 100 at the exact 40%% boundary', (count, kind, reasonCode) => {
    expect(assessSnapshotAnomaly(snapshot('ace', 30, count), snapshot('ace', 0, 100))).toMatchObject({
      kind,
      reasonCode,
      lossCount: 100 - count,
    });
  });

  test('39.x percent has no safe harbor when explicit context makes the loss suspicious', () => {
    expect(assessSnapshotAnomaly(snapshot('ace', 30, 607), snapshot('ace', 0, 1_000), {
      contextualConcerns: ['abnormal-route-population'],
    })).toMatchObject({
      kind: 'quarantined',
      reasonCode: 'contextual-population-loss',
      lossCount: 393,
      contextualConcerns: ['abnormal-route-population'],
    });
  });

  test('a below-40-percent loss without governed contextual evidence is not assigned an invented threshold', () => {
    expect(assessSnapshotAnomaly(snapshot('ace', 30, 61), snapshot('ace', 0, 100))).toMatchObject({
      kind: 'accepted',
      reasonCode: 'coherent-snapshot',
      lossCount: 39,
    });
  });

  test('quarantines suspicious emptiness even without prior context', () => {
    expect(assessSnapshotAnomaly(snapshot('ace', 0, 0))).toMatchObject({
      kind: 'quarantined',
      reasonCode: 'suspicious-empty-snapshot',
    });
  });

  test('quarantines an explicitly destructive route-population change below 40 percent', () => {
    expect(assessSnapshotAnomaly(
      snapshot('ace', 30, 70, { coveredRouteIds: ['A'] }),
      snapshot('ace', 0, 100),
      { contextualConcerns: ['destructive-route-coverage'] },
    )).toMatchObject({ kind: 'quarantined', reasonCode: 'destructive-snapshot' });
  });

  test('quarantines timestamp regression and distinguishes a byte-identical replay', () => {
    const prior = snapshot('ace', 30, 100);
    expect(assessSnapshotAnomaly(snapshot('ace', 29, 100), prior)).toMatchObject({
      kind: 'quarantined',
      reasonCode: 'timestamp-regression',
    });
    expect(assessSnapshotAnomaly({ ...prior }, prior)).toMatchObject({
      kind: 'replay',
      reasonCode: 'snapshot-replay',
    });
    expect(assessSnapshotAnomaly({ ...prior, contentHash: 'different' }, prior)).toMatchObject({
      kind: 'quarantined',
      reasonCode: 'nonadvancing-content-change',
    });
  });

  test('rejects cross-group population comparisons', () => {
    expect(() => assessSnapshotAnomaly(snapshot('ace', 30, 60), snapshot('nqrw', 0, 100)))
      .toThrow(/same feed group/i);
  });
});

describe('per-group preservation, fallback eligibility, and feed recovery', () => {
  test('freezes exact last-good provenance for one anomalous group without changing another', () => {
    const governor = new FeedHealthGovernor();
    const ace = snapshot('ace', 0, 100);
    const nqrw = snapshot('nqrw', 0, 80);
    governor.observe(ace, at(0));
    governor.observe(nqrw, at(0));

    const decision = governor.observe(snapshot('ace', 30, 60), at(30));

    expect(decision).toMatchObject({
      kind: 'unavailable',
      reasonCode: 'bulk-population-loss',
      triggerReasonCode: 'bulk-population-loss',
      presentation: 'frozen-last-good',
      fallbackEligibility: 'blocked',
      recoveryCount: 0,
      lastGood: {
        feedGroupId: 'ace',
        contentHash: ace.contentHash,
        feedTimestamp: ace.feedTimestamp.toISOString(),
        entityCount: 100,
      },
    });
    expect(governor.assess('nqrw', at(30))).toMatchObject({
      kind: 'current',
      reasonCode: 'accepted-current',
      feedGroupId: 'nqrw',
    });
  });

  test('preserves anomaly context through exactly 180 seconds, then uses ordinary age-based Unavailable', () => {
    const governor = new FeedHealthGovernor();
    governor.observe(snapshot('ace', 0, 100), at(0));
    governor.observe(snapshot('ace', 30, 0), at(30));

    expect(governor.assess('ace', at(180))).toMatchObject({
      kind: 'unavailable',
      presentation: 'frozen-last-good',
      fallbackEligibility: 'blocked',
      triggerReasonCode: 'suspicious-empty-snapshot',
      feedAgeSeconds: 180,
    });
    expect(governor.assess('ace', at(181))).toMatchObject({
      kind: 'unavailable',
      reasonCode: 'anomaly-preservation-expired',
      presentation: 'none',
      fallbackEligibility: 'eligible',
      triggerReasonCode: 'suspicious-empty-snapshot',
      feedAgeSeconds: 181,
    });
  });

  test.each([
    ['invalid-decoding', 'invalid-decoding'],
    ['malformed-snapshot', 'malformed-snapshot'],
    ['hard-fetch-validation', 'hard-fetch-validation'],
  ] as const)('fails closed on %s with no prior context', (reasonCode, expected) => {
    const governor = new FeedHealthGovernor();
    expect(governor.reject({
      feedGroupId: 'ace',
      evidenceId: `failure-${reasonCode}`,
      observedAt: at(0),
      reasonCode,
    })).toMatchObject({
      kind: 'unavailable',
      reasonCode: expected,
      presentation: 'none',
      fallbackEligibility: 'eligible',
      lastGood: null,
    });
  });

  test('applies simultaneous disappearance only to affected groups and never pools recovery counts', () => {
    const governor = new FeedHealthGovernor();
    for (const group of ['ace', 'nqrw', 'g'] as const) governor.observe(snapshot(group, 0, 100), at(0));

    governor.rejectSimultaneousLoss([
      { feedGroupId: 'nqrw', evidenceId: 'lost-nqrw' },
      { feedGroupId: 'ace', evidenceId: 'lost-ace' },
    ], at(30));

    expect(governor.assess('ace', at(30))).toMatchObject({ reasonCode: 'simultaneous-group-loss', recoveryCount: 0 });
    expect(governor.assess('nqrw', at(30))).toMatchObject({ reasonCode: 'simultaneous-group-loss', recoveryCount: 0 });
    expect(governor.assess('g', at(30))).toMatchObject({ kind: 'current' });

    governor.observe(snapshot('ace', 40, 99), at(40));
    governor.observe(snapshot('nqrw', 40, 99), at(40));
    governor.observe(snapshot('ace', 50, 98), at(50));

    expect(governor.assess('ace', at(50))).toMatchObject({ kind: 'current', recoveryCount: 0 });
    expect(governor.assess('nqrw', at(50))).toMatchObject({ kind: 'unavailable', recoveryCount: 1 });
  });

  test('one newer coherent recovery snapshot restores nothing and the second restores only candidacy', () => {
    const governor = new FeedHealthGovernor();
    governor.observe(snapshot('ace', 0, 100), at(0));
    governor.observe(snapshot('ace', 30, 60), at(30));

    expect(governor.observe(snapshot('ace', 40, 99), at(40))).toMatchObject({
      kind: 'unavailable',
      reasonCode: 'recovery-confirmation-required',
      recoveryCount: 1,
      presentation: 'frozen-last-good',
      liveEvidenceEligibility: 'blocked',
    });
    expect(governor.observe(snapshot('ace', 50, 98), at(50))).toMatchObject({
      kind: 'current',
      reasonCode: 'feed-recovered',
      triggerReasonCode: 'bulk-population-loss',
      recoveryCount: 0,
      liveEvidenceEligibility: 'reevaluate',
    });
  });

  test('recovery chronology uses source timestamps rather than later retrieval or assessment time', () => {
    const governor = new FeedHealthGovernor();
    governor.observe(snapshot('ace', 0, 100, { retrievedAt: at(5) }), at(5));
    governor.observe(snapshot('ace', 30, 60, { retrievedAt: at(60) }), at(60));

    expect(governor.observe(snapshot('ace', 50, 99, { retrievedAt: at(70) }), at(70))).toMatchObject({
      reasonCode: 'recovery-confirmation-required',
      recoveryCount: 1,
    });
  });

  test('a rejected future candidate cannot mutate the frozen accepted snapshot', () => {
    const governor = new FeedHealthGovernor();
    const accepted = snapshot('ace', 0, 100);
    governor.observe(accepted, at(0));

    expect(() => governor.observe(snapshot('ace', 20, 101), at(10))).toThrow(/negative feed age/i);
    expect(governor.assess('ace', at(10))).toMatchObject({
      kind: 'current',
      lastGood: { contentHash: accepted.contentHash },
      feedAgeSeconds: 10,
    });
  });

  test('a no-prior-context failure still reports recovery update one without restoring evidence', () => {
    const governor = new FeedHealthGovernor();
    governor.reject({
      feedGroupId: 'ace',
      evidenceId: 'malformed-initialization',
      observedAt: at(0),
      reasonCode: 'malformed-snapshot',
    });

    expect(governor.observe(snapshot('ace', 10, 100), at(10))).toMatchObject({
      kind: 'unavailable',
      reasonCode: 'recovery-confirmation-required',
      triggerReasonCode: 'malformed-snapshot',
      recoveryCount: 1,
      lastGood: null,
      liveEvidenceEligibility: 'blocked',
    });
    expect(governor.observe(snapshot('ace', 20, 99), at(20))).toMatchObject({
      kind: 'current',
      reasonCode: 'feed-recovered',
      triggerReasonCode: 'malformed-snapshot',
    });
  });

  test('initial degraded recovery compares against the accepted source timestamp, not retrieval time', () => {
    const governor = new FeedHealthGovernor();
    expect(governor.observe(snapshot('ace', 0, 100, { retrievedAt: at(100) }), at(100))).toMatchObject({
      kind: 'degraded',
      reasonCode: 'snapshot-age-degraded',
    });

    expect(governor.observe(snapshot('ace', 30, 99, { retrievedAt: at(110) }), at(110))).toMatchObject({
      kind: 'degraded',
      reasonCode: 'recovery-confirmation-required',
      recoveryCount: 1,
    });
  });

  test('a replay and every anomalous or incomplete recovery observation break the pair', () => {
    const governor = new FeedHealthGovernor();
    const firstRecovery = snapshot('ace', 40, 99);
    governor.observe(snapshot('ace', 0, 100), at(0));
    governor.observe(snapshot('ace', 30, 60), at(30));
    governor.observe(firstRecovery, at(40));

    expect(governor.observe({ ...firstRecovery }, at(41))).toMatchObject({ recoveryCount: 0 });
    expect(governor.observe(snapshot('ace', 50, 98), at(50))).toMatchObject({ recoveryCount: 1 });
    governor.reject({ feedGroupId: 'ace', evidenceId: 'incomplete', observedAt: at(55), reasonCode: 'incomplete-snapshot' });
    expect(governor.observe(snapshot('ace', 60, 97), at(60))).toMatchObject({ recoveryCount: 1 });
    expect(governor.observe(snapshot('ace', 70, 96), at(70))).toMatchObject({ kind: 'current', reasonCode: 'feed-recovered' });
  });

  test('source-order shuffling cannot change independent group decisions', () => {
    const run = (order: readonly string[]): Record<string, Pick<FeedHealthDecision, 'kind' | 'reasonCode'>> => {
      const governor = new FeedHealthGovernor();
      for (const group of order) governor.observe(snapshot(group, 0, 100), at(0));
      governor.observe(snapshot('ace', 30, 60), at(30));
      return Object.fromEntries(['ace', 'nqrw', 'g'].map((group) => {
        const decision = governor.assess(group, at(30));
        return [group, { kind: decision.kind, reasonCode: decision.reasonCode }];
      }));
    };

    expect(run(['ace', 'nqrw', 'g'])).toEqual(run(['g', 'ace', 'nqrw']));
  });
});
