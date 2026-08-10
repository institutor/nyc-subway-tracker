import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';

import { encodeCanonicalStringTuple } from '../../src/shared/domain/canonical';
import { evaluateExposure } from '../../src/server/release/exposure-gates';

const EARLIER = '2026-08-10T12:00:00.000Z';
const LATER = '2026-08-10T12:02:00.000Z';
const SHA = 'a'.repeat(64);
const ALERT_SHA = 'b'.repeat(64);

describe('bound shadow comparison evidence', () => {
  test('binds exact prior bytes and every row to earlier/current records and claim keys', async () => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    expect(typeof module.createShadowComparisonContext).toBe('function');
    expect(typeof module.buildBoundedShadowRecord).toBe('function');
    expect(typeof module.validateShadowComparisonBinding).toBe('function');
    const earlier = record({ recordId: 'shadow-earlier', at: EARLIER, claims: [claim()] });
    const earlierBytes = `${JSON.stringify(earlier)}\n`;
    const laterBase = record({
      recordId: 'shadow-later', at: LATER,
      claims: [claim({
        at: LATER, nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2),
        remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)],
      })],
    });
    const context = module.createShadowComparisonContext({ earlier, earlierBytes, later: laterBase });
    const comparisons = module.compareShadowProgress(earlier, { ...laterBase, comparisonContext: context });
    const later = module.buildBoundedShadowRecord({ ...laterBase, comparisonContext: context, progressComparisons: comparisons });

    expect(context).toEqual({
      earlierRecordId: 'shadow-earlier',
      earlierRecordSha256: sha256(earlierBytes),
      earlierDecisionTime: EARLIER,
      earlierRecordedAt: plus(EARLIER, 1_000),
      laterRecordId: 'shadow-later',
      laterDecisionTime: LATER,
      laterRecordedAt: plus(LATER, 1_000),
      intervalMilliseconds: 120_000,
      maximumIntervalMilliseconds: 900_000,
    });
    expect(later.progressComparisons).toEqual([expect.objectContaining({
      earlierClaimKey: earlier.claims[0].claimKey,
      laterClaimKey: later.claims[0].claimKey,
      earlierObservedAt: EARLIER,
      laterObservedAt: LATER,
      serviceDate: '20260810',
      serviceInstanceId: serviceInstance(),
      result: 'progressed',
    })]);
    expect(() => module.validateShadowComparisonBinding(later, earlierBytes)).not.toThrow();
  });

  test.each([
    ['prior digest', (value: any) => { value.comparisonContext.earlierRecordSha256 = 'c'.repeat(64); }],
    ['earlier claim link', (value: any) => { value.progressComparisons[0].earlierClaimKey = `claim:${'d'.repeat(64)}`; }],
    ['later record link', (value: any) => { value.comparisonContext.laterRecordId = 'shadow-other'; }],
    ['serialized result', (value: any) => { value.progressComparisons[0].reasonCode = 'NEXT_STOP_UNCHANGED'; }],
  ])('rejects fabricated or unbound %s evidence', async (_label, alter) => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    const earlier = record({ recordId: 'shadow-bind-earlier', at: EARLIER, claims: [claim()] });
    const earlierBytes = JSON.stringify(earlier);
    const laterBase = record({
      recordId: 'shadow-bind-later', at: LATER,
      claims: [claim({ at: LATER, nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2), remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)] })],
    });
    const comparisonContext = module.createShadowComparisonContext({ earlier, earlierBytes, later: laterBase });
    const value = module.buildBoundedShadowRecord({
      ...laterBase, comparisonContext,
      progressComparisons: module.compareShadowProgress(earlier, { ...laterBase, comparisonContext }),
    });
    alter(value);
    expect(() => module.validateShadowComparisonBinding(value, earlierBytes)).toThrow(/invalid|bound|comparison/i);
  });

  test('never calls progress across a reused service identity or beyond the governed interval', async () => {
    const { compareShadowProgress } = await import('../../src/server/services/shadow-progress') as any;
    const earlier = record({ recordId: 'shadow-service-earlier', at: EARLIER, claims: [claim()] });
    const tooLate = '2026-08-10T12:15:00.001Z';
    const changedService = claim({
      at: tooLate, serviceDate: '20260811', serviceInstanceId: serviceInstance('20260811'),
      nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2),
      remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)],
    });
    const later = record({ recordId: 'shadow-service-later', at: tooLate, claims: [changedService] });
    expect(compareShadowProgress(earlier, later)).toEqual([expect.objectContaining({
      laterClaimKey: changedService.claimKey,
      result: 'inconclusive',
      reasonCode: 'COMPARISON_INTERVAL_EXCEEDED',
    })]);
  });

  test('never calls progress when exact non-null service ownership is unavailable', async () => {
    const { compareShadowProgress } = await import('../../src/server/services/shadow-progress') as any;
    const unowned = claim({ serviceDate: null, serviceInstanceId: null });
    const laterUnowned = claim({
      at: LATER, serviceDate: null, serviceInstanceId: null,
      nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2),
      remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)],
    });
    expect(compareShadowProgress(
      record({ recordId: 'shadow-null-earlier', at: EARLIER, claims: [unowned] }),
      record({ recordId: 'shadow-null-later', at: LATER, claims: [laterUnowned] }),
    )).toEqual([expect.objectContaining({ result: 'inconclusive', reasonCode: 'SERVICE_OWNERSHIP_UNAVAILABLE' })]);
  });
});

describe('exact shadow chronology and bounded composition', () => {
  test.each([
    ['an impossible Gregorian service date', (value: any) => { value.claims[0].serviceDate = '20260231'; canonicalizeClaim(value.claims[0]); }],
    ['a noncanonical service-instance identity', (value: any) => { value.claims[0].serviceInstanceId = 'service:arbitrary'; canonicalizeClaim(value.claims[0]); }],
    ['a noncanonical alert-context identity', (value: any) => { value.claims[0].decisions.serviceChange.alertContext.alertContextIdentity = 'alert-context:arbitrary'; }],
  ])('rejects %s', async (_label, alter) => {
    const { parseShadowProgressRecord } = await import('../../src/server/services/shadow-progress') as any;
    const value = record({ recordId: 'shadow-service-identity', at: EARLIER, claims: [claim()] });
    expect(() => parseShadowProgressRecord(value)).not.toThrow();
    alter(value);
    expect(() => parseShadowProgressRecord(value)).toThrow(/invalid prior shadow record/i);
  });

  test.each([
    ['source retrieval before observation', (value: any) => { value.sources[1].retrievedAt = plus(EARLIER, -1); }],
    ['source retrieval after decision', (value: any) => { value.sources[1].retrievedAt = plus(EARLIER, 1); }],
    ['claim retrieval after decision', (value: any) => { value.claims[0].provenance.retrievedAt = plus(EARLIER, 1); }],
    ['future claim observation', (value: any) => { value.claims[0].observedAt = plus(EARLIER, 1); value.claims[0].provenance.observedAt = plus(EARLIER, 1); }],
    ['reversed comparison chronology', (value: any) => {
      value.comparisonContext = comparisonContext(value, { earlierDecisionTime: plus(LATER, 1), intervalMilliseconds: -1 });
    }],
    ['feed kind/reason mismatch', (value: any) => { value.claims[0].decisions.feedHealth.reasonCode = 'snapshot-age-degraded'; }],
  ])('rejects %s', async (_label, alter) => {
    const { parseShadowProgressRecord } = await import('../../src/server/services/shadow-progress') as any;
    const value = record({ recordId: 'shadow-time', at: EARLIER, claims: [claim()] });
    alter(value);
    expect(() => parseShadowProgressRecord(value)).toThrow(/invalid prior shadow record/i);
  });

  test('deterministically truncates 500 longest permitted 64-call claims and comparisons under the byte ceiling', async () => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    expect(typeof module.buildBoundedShadowRecord).toBe('function');
    const claims = Array.from({ length: 500 }, (_, index) => maximalClaim(index));
    const comparisons = claims.map((row: any) => comparisonFor(row));
    const base = record({ recordId: 'shadow-budget', at: LATER, claims: [] });
    const context = comparisonContext(base);
    const first = module.buildBoundedShadowRecord({ ...base, comparisonContext: context, claims: [...claims].reverse(), progressComparisons: [...comparisons].reverse() });
    const second = module.buildBoundedShadowRecord({ ...base, comparisonContext: context, claims, progressComparisons: comparisons });

    expect(Buffer.byteLength(JSON.stringify(first), 'utf8')).toBeLessThanOrEqual(1_000_000);
    expect(first).toEqual(second);
    expect(first.claims.length).toBeGreaterThan(0);
    expect(first.claims.length).toBeLessThan(500);
    expect(first.progressComparisons.length).toBeGreaterThan(0);
    expect(first.progressComparisons.length).toBeLessThan(500);
    expect(first.truncation).toEqual({
      claims: { consideredCount: 500, includedCount: first.claims.length, omittedCount: 500 - first.claims.length, reasonCode: 'BYTE_BUDGET_EXHAUSTED' },
      comparisons: { consideredCount: 500, includedCount: first.progressComparisons.length, omittedCount: 500 - first.progressComparisons.length, reasonCode: 'BYTE_BUDGET_EXHAUSTED' },
    });
    expect(first.claims.map((row: any) => row.claimKey)).toEqual([...first.claims.map((row: any) => row.claimKey)].sort());
    expect(first.progressComparisons.map((row: any) => row.earlierClaimKey))
      .toEqual([...first.progressComparisons.map((row: any) => row.earlierClaimKey)].sort());
  });
});

function record(input: { recordId: string; at: string; claims: any[] }) {
  return {
    schemaVersion: 'shadow-v2', recordId: input.recordId, mode: 'shadow', recordedAt: plus(input.at, 1_000), decisionTime: input.at,
    riderExposure: false, boardsExposed: false, outcome: 'COMPLETED', sources: sources(input.at), gates: gates(),
    comparisonContext: null,
    truncation: {
      claims: { consideredCount: input.claims.length, includedCount: input.claims.length, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' },
      comparisons: { consideredCount: 0, includedCount: 0, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' },
    },
    claims: input.claims, progressComparisons: [],
  };
}

function claim(overrides: Record<string, unknown> = {}) {
  const at = typeof overrides.at === 'string' ? overrides.at : EARLIER;
  const serviceDate = Object.hasOwn(overrides, 'serviceDate') ? overrides.serviceDate : '20260810';
  const serviceInstanceId = Object.hasOwn(overrides, 'serviceInstanceId') ? overrides.serviceInstanceId : serviceInstance();
  const row: any = {
    claimId: '', claimKey: '', sourceId: 'subway-rt-ace', observedAt: at, operationalTrainId: 'train-1',
    serviceDate, serviceInstanceId, routeId: 'A', direction: 'northbound', terminalDestinationStopId: 'A16N',
    nextStopId: 'A12N', nextStopCallIdentity: stopCall('A12N', 1), targetStopId: 'A16N', targetStopCallIdentity: stopCall('A16N', 3),
    remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2), stopCall('A16N', 3)],
    decisionTime: at, disposition: 'suppressed', suppressionReasonCode: serviceDate && serviceInstanceId ? 'TRUSTED_HISTORY_UNAVAILABLE' : 'SERVICE_OWNERSHIP_UNAVAILABLE',
    provenance: { source: 'gtfs-rt', sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace', observedAt: at, retrievedAt: at, sha256: SHA },
    decisions: {
      feedHealth: { kind: 'current', reasonCode: 'accepted-current' },
      serviceChange: {
        kind: 'eligible-context', disposition: 'eligible',
        alertContext: { state: 'accepted', sourceId: 'subway-alerts', observedAt: at, retrievedAt: at, sha256: ALERT_SHA, alertContextIdentity: `alert-context:${ALERT_SHA}` },
      },
      admission: { kind: 'rejected', disposition: 'suppressed', reasonCode: serviceDate && serviceInstanceId ? 'TRUSTED_HISTORY_UNAVAILABLE' : 'SERVICE_OWNERSHIP_UNAVAILABLE' },
    },
    ...overrides,
  };
  delete row.at;
  canonicalizeClaim(row);
  return row;
}

function canonicalizeClaim(row: any) {
  const identity = [row.sourceId, row.operationalTrainId, row.serviceDate, row.serviceInstanceId, row.targetStopCallIdentity];
  const digest = sha256(encodeCanonicalStringTuple(identity));
  row.claimKey = `claim:${digest}`;
  row.claimId = `claim-id:${digest}`;
}

function maximalClaim(index: number) {
  const stopIds = Array.from({ length: 64 }, (_, stopIndex) => `${String(index).padStart(3, '0')}${String(stopIndex).padStart(2, '0')}${'S'.repeat(210)}`);
  const row = claim({
    at: LATER,
    operationalTrainId: `${String(index).padStart(3, '0')}${'T'.repeat(220)}`,
    serviceInstanceId: serviceInstance(`20260810-${index}`),
    terminalDestinationStopId: stopIds.at(-1), nextStopId: stopIds[0], nextStopCallIdentity: stopCall(stopIds[0], 1),
    targetStopId: stopIds.at(-1), targetStopCallIdentity: stopCall(stopIds.at(-1)!, 64),
    remainingStopCallIdentities: stopIds.map((stopId, stopIndex) => stopCall(stopId, stopIndex + 1)),
  });
  return row;
}

function comparisonFor(row: any) {
  return {
    earlierClaimKey: row.claimKey, laterClaimKey: row.claimKey,
    sourceId: row.sourceId, operationalTrainId: row.operationalTrainId, serviceDate: row.serviceDate, serviceInstanceId: row.serviceInstanceId,
    targetStopId: row.targetStopId, targetStopCallIdentity: row.targetStopCallIdentity,
    earlierObservedAt: EARLIER, laterObservedAt: LATER,
    earlierDisposition: 'suppressed', laterDisposition: 'suppressed', dispositionTransition: 'suppressed-to-suppressed',
    result: 'not-observed', reasonCode: 'NEXT_STOP_UNCHANGED',
  };
}

function comparisonContext(later: any, overrides: Record<string, unknown> = {}) {
  return {
    earlierRecordId: 'shadow-earlier', earlierRecordSha256: 'c'.repeat(64), earlierDecisionTime: EARLIER, earlierRecordedAt: plus(EARLIER, 1_000),
    laterRecordId: later.recordId, laterDecisionTime: later.decisionTime, laterRecordedAt: later.recordedAt,
    intervalMilliseconds: Date.parse(later.decisionTime) - Date.parse(EARLIER), maximumIntervalMilliseconds: 900_000,
    ...overrides,
  };
}

function sources(at: string) {
  return [...['subway-rt-1234567s', 'subway-rt-ace', 'subway-rt-bdfm', 'subway-rt-g', 'subway-rt-jz', 'subway-rt-l', 'subway-rt-nqrw'].map((sourceId) => ({
    sourceId, role: 'subway-realtime', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED', feedGroupId: sourceId,
    observedAt: at, retrievedAt: at, sha256: SHA,
  })), {
    sourceId: 'subway-alerts', role: 'subway-alerts', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
    observedAt: at, retrievedAt: at, sha256: ALERT_SHA,
  }];
}

function gates() {
  return Object.entries(evaluateExposure({ mode: 'shadow' }).public).map(([stage, gate]) => ({ stage, ...gate }));
}

function serviceInstance(seed = '20260810') {
  return `service:${sha256(encodeCanonicalStringTuple(['trip-1', seed, '12:00:00', 'train-1']))}`;
}

function stopCall(stopId: string, sequence: number) { return `${stopId}\u0000sequence:${sequence}`; }
function plus(value: string, milliseconds: number) { return new Date(Date.parse(value) + milliseconds).toISOString(); }
function sha256(value: string) { return createHash('sha256').update(value).digest('hex'); }
