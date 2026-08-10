import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';

import { encodeCanonicalStringTuple } from '../../src/shared/domain/canonical';
import { evaluateExposure } from '../../src/server/release/exposure-gates';

const EARLIER = '2026-08-10T12:00:00.000Z';
const LATER = '2026-08-10T12:02:00.000Z';
const SHA = 'a'.repeat(64);
const ALERT_SHA = 'b'.repeat(64);

describe('bound shadow comparison evidence', () => {
  test('binds compact admitted evidence to the exact prior claim and rejects every tampered admission constituent', async () => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    const { earlierBytes, later } = admittedPair(module);
    expect(() => module.validateShadowComparisonBinding(later, earlierBytes)).not.toThrow();
    for (const [label, alter] of [
      ['missing evidence', (value: any) => { delete value.claims[0].admissionEvidence; }],
      ['movement', (value: any) => { value.claims[0].admissionEvidence.movementTimestamp = plus(LATER, -1); }],
      ['target event', (value: any) => { value.claims[0].admissionEvidence.targetEventAt = LATER; }],
      ['different future target event', (value: any) => { value.claims[0].admissionEvidence.targetEventAt = plus(LATER, 60_001); }],
      ['track', (value: any) => { value.claims[0].admissionEvidence.actualTrack = '2'; }],
      ['different eligible track', (value: any) => { value.claims[0].admissionEvidence.actualTrack = '2'; value.claims[0].admissionEvidence.scheduledTrack = '2'; }],
      ['service digest', (value: any) => { value.claims[0].admissionEvidence.serviceDecisionDigest = `service-decision:${'e'.repeat(64)}`; }],
      ['prior key', (value: any) => { value.claims[0].admissionEvidence.priorClaimKey = `claim:${'f'.repeat(64)}`; }],
      ['standalone context', (value: any) => { value.comparisonContext = null; value.progressComparisons = []; value.truncation.comparisons = { consideredCount: 0, includedCount: 0, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' }; }],
    ] as const) {
      const tampered = structuredClone(later);
      alter(tampered);
      expect(() => module.validateShadowComparisonBinding(tampered, earlierBytes), label).toThrow(/invalid|bound|comparison/i);
    }
  });

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
      at: tooLate, serviceDate: '20260811', serviceIdentity: serviceIdentity('20260811'),
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
  test('rejects a standalone admitted claim when no exact prior comparison context exists', async () => {
    const { parseShadowProgressRecord } = await import('../../src/server/services/shadow-progress') as any;
    const admitted = claim();
    admitted.disposition = 'admitted';
    delete admitted.suppressionReasonCode;
    admitted.decisions.admission = { kind: 'admitted', disposition: 'admitted', reasonCode: 'GOVERNED_ADMISSION' };
    const value = record({ recordId: 'shadow-standalone-admitted', at: EARLIER, claims: [admitted] });
    expect(() => parseShadowProgressRecord(value)).toThrow(/invalid prior shadow record/i);
  });

  test.each([
    ['an arbitrary valid-hex service identity', (value: any) => {
      value.claims[0].serviceInstanceId = `service:${'c'.repeat(64)}`; canonicalizeClaim(value.claims[0]);
    }],
    ['an arbitrary valid-hex alert context identity', (value: any) => {
      value.claims[0].decisions.serviceChange.alertContext.alertContextIdentity = `alert-context:${'d'.repeat(64)}`;
    }],
  ])('rejects %s that is not recomputed from its canonical constituents', async (_label, alter) => {
    const { parseShadowProgressRecord } = await import('../../src/server/services/shadow-progress') as any;
    const value = record({ recordId: 'shadow-derived-identity', at: EARLIER, claims: [claim()] });
    expect(() => parseShadowProgressRecord(value)).not.toThrow();
    alter(value);
    expect(() => parseShadowProgressRecord(value)).toThrow(/invalid prior shadow record/i);
  });

  test('rejects eligible service from an accepted alert older than the shared ten-minute threshold', async () => {
    const { parseShadowProgressRecord } = await import('../../src/server/services/shadow-progress') as any;
    const value = record({ recordId: 'shadow-stale-alert', at: EARLIER, claims: [claim()] });
    const stale = plus(EARLIER, -600_001);
    value.sources[7].observedAt = stale;
    value.claims[0].decisions.serviceChange.alertContext.observedAt = stale;
    expect(() => parseShadowProgressRecord(value)).toThrow(/invalid prior shadow record/i);
  });

  test('requires canonical claim and comparison ordering', async () => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    const first = claim({ targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 2), remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2)] });
    const second = claim();
    const unordered = record({ recordId: 'shadow-unordered-claims', at: EARLIER, claims: [first, second].sort((a, b) => b.claimKey.localeCompare(a.claimKey)) });
    expect(() => module.parseShadowProgressRecord(unordered)).toThrow(/invalid prior shadow record/i);
  });

  test('rejects omitted comparison metadata that is not the exact deterministic rebuild', async () => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    const earlier = record({ recordId: 'shadow-trunc-earlier', at: EARLIER, claims: [
      claim({ targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 2), remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2)] }), claim(),
    ] });
    earlier.claims.sort((a: any, b: any) => a.claimKey.localeCompare(b.claimKey));
    const earlierBytes = JSON.stringify(earlier);
    const laterBase = record({ recordId: 'shadow-trunc-later', at: LATER, claims: earlier.claims.map((row: any) => claim({
      at: LATER, targetStopId: row.targetStopId, targetStopCallIdentity: row.targetStopCallIdentity,
      remainingStopCallIdentities: row.remainingStopCallIdentities,
    })) });
    laterBase.claims.sort((a: any, b: any) => a.claimKey.localeCompare(b.claimKey));
    const context = module.createShadowComparisonContext({ earlier, earlierBytes, later: laterBase });
    const comparisons = module.compareShadowProgress(earlier, { ...laterBase, comparisonContext: context });
    const later = module.buildBoundedShadowRecord({ ...laterBase, comparisonContext: context, progressComparisons: comparisons });
    later.progressComparisons.pop();
    later.truncation.comparisons = { consideredCount: comparisons.length, includedCount: comparisons.length - 1, omittedCount: 1, reasonCode: 'BYTE_BUDGET_EXHAUSTED' };
    expect(() => module.validateShadowComparisonBinding(later, earlierBytes)).toThrow(/invalid|bound|comparison/i);
  });

  test('rejects shuffled comparison rows even when every row is otherwise exact', async () => {
    const module = await import('../../src/server/services/shadow-progress') as any;
    const earlier = record({ recordId: 'shadow-order-earlier', at: EARLIER, claims: [
      claim({ targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 2), remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2)] }), claim(),
    ].sort((a, b) => a.claimKey.localeCompare(b.claimKey)) });
    const earlierBytes = JSON.stringify(earlier);
    const laterBase = record({ recordId: 'shadow-order-later', at: LATER, claims: earlier.claims.map((row: any) => claim({
      at: LATER, targetStopId: row.targetStopId, targetStopCallIdentity: row.targetStopCallIdentity,
      remainingStopCallIdentities: row.remainingStopCallIdentities,
    })).sort((a: any, b: any) => a.claimKey.localeCompare(b.claimKey)) });
    const context = module.createShadowComparisonContext({ earlier, earlierBytes, later: laterBase });
    const comparisons = module.compareShadowProgress(earlier, { ...laterBase, comparisonContext: context });
    const later = module.buildBoundedShadowRecord({ ...laterBase, comparisonContext: context, progressComparisons: comparisons });
    later.progressComparisons.reverse();
    expect(() => module.parseShadowProgressRecord(later)).toThrow(/invalid prior shadow record/i);
  });

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
  const ownedService = Object.hasOwn(overrides, 'serviceIdentity') ? overrides.serviceIdentity : serviceDate ? serviceIdentity(String(serviceDate)) : null;
  const serviceInstanceId = Object.hasOwn(overrides, 'serviceInstanceId') ? overrides.serviceInstanceId : ownedService ? serviceInstanceFrom(ownedService as any) : null;
  const row: any = {
    claimId: '', claimKey: '', sourceId: 'subway-rt-ace', observedAt: at, operationalTrainId: 'train-1',
    serviceDate, serviceInstanceId, serviceIdentity: ownedService, routeId: 'A', direction: 'northbound', terminalDestinationStopId: 'A16N',
    nextStopId: 'A12N', nextStopCallIdentity: stopCall('A12N', 1), targetStopId: 'A16N', targetStopCallIdentity: stopCall('A16N', 3),
    remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2), stopCall('A16N', 3)],
    decisionTime: at, disposition: 'suppressed', suppressionReasonCode: serviceDate && serviceInstanceId ? 'TRUSTED_HISTORY_UNAVAILABLE' : 'SERVICE_OWNERSHIP_UNAVAILABLE',
    provenance: { source: 'gtfs-rt', sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace', observedAt: at, retrievedAt: at, sha256: SHA },
    decisions: {
      feedHealth: { kind: 'current', reasonCode: 'accepted-current' },
      serviceChange: {
        kind: 'eligible-context', disposition: 'eligible',
        alertContext: { state: 'accepted', sourceId: 'subway-alerts', observedAt: at, retrievedAt: at, sha256: ALERT_SHA,
          snapshotState: 'current', alertContextIdentity: sourceAlertIdentity(at) },
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
    serviceIdentity: serviceIdentity('20260810', `${String(index).padStart(3, '0')}${'T'.repeat(220)}`, `trip-${index}`),
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

function serviceIdentity(startDate = '20260810', trainIdentity = 'train-1', tripId = 'trip-1') { return { tripId, startDate, startTime: '12:00:00', trainIdentity }; }
function serviceInstance(seed = '20260810') { return serviceInstanceFrom(serviceIdentity(seed)); }
function serviceInstanceFrom(value: any) { return `service:${sha256(encodeCanonicalStringTuple([value.tripId, value.startDate, value.startTime, value.trainIdentity]))}`; }
function sourceAlertIdentity(at: string) { return `alert-context:${sha256(encodeCanonicalStringTuple(['subway-alerts', at, at, ALERT_SHA]))}`; }

function admittedPair(module: any) {
  const earlierClaim = claim();
  const earlier = record({ recordId: 'shadow-admission-earlier', at: EARLIER, claims: [earlierClaim] });
  const earlierBytes = JSON.stringify(earlier);
  const laterClaim = claim({ at: LATER, nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2),
    remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)] });
  laterClaim.disposition = 'admitted'; delete laterClaim.suppressionReasonCode;
  laterClaim.decisions.admission = { kind: 'admitted', disposition: 'admitted', reasonCode: 'GOVERNED_ADMISSION' };
  const evidence: any = {
    earlierRecordId: earlier.recordId, priorClaimKey: earlierClaim.claimKey, priorObservedAt: earlierClaim.observedAt,
    priorRemainingStopCallIdentities: earlierClaim.remainingStopCallIdentities,
    movementTimestamp: LATER, movementStatus: 'IN_TRANSIT_TO',
    movementEvidenceIdentity: module.canonicalMovementEvidenceIdentity({ sourceId: laterClaim.sourceId,
      trainIdentity: laterClaim.operationalTrainId, movementTimestamp: LATER, movementStatus: 'IN_TRANSIT_TO', stopCallIdentity: laterClaim.nextStopCallIdentity }),
    targetEventAt: plus(LATER, 60_000), targetStopCallIdentity: laterClaim.targetStopCallIdentity,
    targetEvidenceIdentity: '', scheduledTrack: '1', actualTrack: '1', trackEvidenceIdentity: '', serviceClaimId: laterClaim.claimId,
    serviceClaimBindingDigest: module.canonicalServiceClaimBindingDigest(laterClaim), serviceAssessmentAt: LATER,
    serviceAlertContextIdentity: laterClaim.decisions.serviceChange.alertContext.alertContextIdentity,
    issuedAlertContextDigest: '', admittedStopCallIdentity: laterClaim.targetStopCallIdentity,
  };
  evidence.targetEvidenceIdentity = module.canonicalTargetEvidenceIdentity({ sourceId: laterClaim.sourceId,
    trainIdentity: laterClaim.operationalTrainId, targetStopCallIdentity: laterClaim.targetStopCallIdentity,
    targetEventAt: evidence.targetEventAt });
  evidence.trackEvidenceIdentity = module.canonicalTrackEvidenceIdentity({ sourceId: laterClaim.sourceId,
    trainIdentity: laterClaim.operationalTrainId, targetStopCallIdentity: laterClaim.targetStopCallIdentity,
    scheduledTrack: evidence.scheduledTrack, actualTrack: evidence.actualTrack });
  evidence.issuedAlertContextDigest = module.canonicalIssuedAlertContextDigest(evidence);
  evidence.serviceDecisionDigest = module.canonicalServiceDecisionDigest(evidence);
  laterClaim.admissionEvidence = evidence;
  const laterBase = record({ recordId: 'shadow-admission-later', at: LATER, claims: [laterClaim] });
  const comparisonContext = module.createShadowComparisonContext({ earlier, earlierBytes, later: laterBase });
  const comparisons = module.compareShadowProgress(earlier, { ...laterBase, comparisonContext });
  const later = module.buildBoundedShadowRecord({ ...laterBase, comparisonContext, progressComparisons: comparisons });
  return { earlierBytes, later };
}

function stopCall(stopId: string, sequence: number) { return `${stopId}\u0000sequence:${sequence}`; }
function plus(value: string, milliseconds: number) { return new Date(Date.parse(value) + milliseconds).toISOString(); }
function sha256(value: string) { return createHash('sha256').update(value).digest('hex'); }
