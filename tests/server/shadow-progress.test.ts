import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';

import { encodeCanonicalStringTuple } from '../../src/shared/domain/canonical';
import { evaluateExposure } from '../../src/server/release/exposure-gates';
import { compareShadowProgress, parseShadowProgressRecord } from '../../src/server/services/shadow-progress';

const observedAt = '2026-08-10T12:00:00.000Z';
const laterObservedAt = '2026-08-10T12:02:00.000Z';
const sha256 = 'a'.repeat(64);
const aceSource = 'subway-rt-ace';

describe('exact shadow-v2 parsing and later-stop comparison', () => {
  test.each([
    ['source retrieval before observation', (record: any) => {
      record.sources[0].observedAt = laterObservedAt;
    }],
    ['source retrieval after the governing decision', (record: any) => {
      record.sources[0].retrievedAt = laterObservedAt;
    }],
    ['feed kind/reason mismatch', (record: any) => {
      record.claims[0].decisions.feedHealth.reasonCode = 'snapshot-age-degraded';
    }],
  ])('rejects %s even when the rest of the current schema is valid', (_label, alter) => {
    const record = shadowRecord({ recordId: 'shadow-time-invalid', claims: [claim()] });
    expect(() => parseShadowProgressRecord(record)).not.toThrow();
    alter(record);
    expect(() => parseShadowProgressRecord(record)).toThrow(/invalid prior shadow record/i);
  });

  test('compares a suppressed claim with later physical progress and records its disposition transition', () => {
    const earlier = shadowRecord({
      recordId: 'shadow-earlier',
      claims: [claim({ disposition: 'suppressed', suppressionReasonCode: 'TRUSTED_HISTORY_UNAVAILABLE' })],
    });
    const later = shadowRecord({
      recordId: 'shadow-later',
      observedAt: laterObservedAt,
      claims: [claim({
        observedAt: laterObservedAt,
        nextStopId: 'A14N',
        nextStopCallIdentity: stopCall('A14N', 2),
        remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)],
        disposition: 'suppressed',
      })],
    });

    expect(compareShadowProgress(parseShadowProgressRecord(earlier), parseShadowProgressRecord(later))).toEqual([
      expect.objectContaining({
        sourceId: aceSource,
        operationalTrainId: 'train-1',
        targetStopId: 'A16N',
        targetStopCallIdentity: stopCall('A16N', 3),
        earlierDisposition: 'suppressed',
        laterDisposition: 'suppressed',
        dispositionTransition: 'suppressed-to-suppressed',
        result: 'progressed',
        reasonCode: 'NEXT_STOP_ADVANCED',
      }),
    ]);
  });

  test('uses exact ordered stop-call identities so repeated stop occurrences cannot be conflated', () => {
    const firstOccurrence = claim({
      claimId: 'claim-train-1-A14N-2',
      targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 2),
      remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2)],
    });
    const repeatedOccurrence = claim({
      claimId: 'claim-train-1-A14N-4',
      targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 4),
      remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2), stopCall('A16N', 3), stopCall('A14N', 4)],
    });
    const laterFirst = claim({
      claimId: 'claim-train-1-A14N-2',
      observedAt: laterObservedAt,
      targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 2),
      remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2)],
    });
    const laterRepeated = claim({
      claimId: 'claim-train-1-A14N-4',
      observedAt: laterObservedAt,
      nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2),
      targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 4),
      remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3), stopCall('A14N', 4)],
    });
    const comparisons = compareShadowProgress(
      parseShadowProgressRecord(shadowRecord({ recordId: 'shadow-repeat-earlier', claims: [firstOccurrence, repeatedOccurrence] })),
      parseShadowProgressRecord(shadowRecord({ recordId: 'shadow-repeat-later', observedAt: laterObservedAt, claims: [laterFirst, laterRepeated] })),
    );

    expect(comparisons).toEqual(expect.arrayContaining([
      expect.objectContaining({ targetStopCallIdentity: stopCall('A14N', 2), result: 'not-observed' }),
      expect.objectContaining({ targetStopCallIdentity: stopCall('A14N', 4), result: 'progressed' }),
    ]));
  });

  test.each([
    ['rerouted path', (record: any) => {
      record.claims[0].remainingStopCallIdentities = [stopCall('A14N', 2), stopCall('D01N', 8), stopCall('A16N', 3)];
    }, 'PATH_CHANGED_OR_REROUTED'],
    ['target removed from later path', (record: any) => {
      record.claims = [claim({
        observedAt: laterObservedAt,
        nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2),
        targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 2),
        remainingStopCallIdentities: [stopCall('A14N', 2)],
      })];
    }, 'TARGET_NOT_IN_LATER_PATH'],
  ])('keeps %s inconclusive', (_label, alterLater, reasonCode) => {
    const earlier = shadowRecord({ recordId: 'shadow-path-earlier', claims: [claim()] });
    const later = shadowRecord({
      recordId: 'shadow-path-later', observedAt: laterObservedAt,
      claims: [claim({
        observedAt: laterObservedAt, nextStopId: 'A14N', nextStopCallIdentity: stopCall('A14N', 2),
        remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)],
      })],
    });
    alterLater(later);
    expect(compareShadowProgress(parseShadowProgressRecord(earlier), parseShadowProgressRecord(later)))
      .toEqual([expect.objectContaining({ result: 'inconclusive', reasonCode })]);
  });

  test.each([
    ['legacy claim fields', (record: any) => {
      const row = record.claims[0];
      delete row.nextStopCallIdentity;
      delete row.remainingStopCallIdentities;
      row.remainingStopIds = ['A12N', 'A14N', 'A16N'];
      row.remainingStopCount = 3;
    }],
    ['nested admission extras', (record: any) => { record.claims[0].decisions.admission.rawAudit = {}; }],
    ['a raw decision row', (record: any) => { record.claims[0].decisions.admission = {}; }],
    ['a malformed target stop-call identity', (record: any) => {
      record.claims[0].targetStopCallIdentity = 'A16N\u0000sequence:0';
      record.claims[0].remainingStopCallIdentities[2] = 'A16N\u0000sequence:0';
      canonicalizeClaim(record.claims[0]);
    }],
    ['disposition and admission mismatch', (record: any) => {
      record.claims[0].disposition = 'admitted';
      delete record.claims[0].suppressionReasonCode;
    }],
    ['feed decision and suppression-reason mismatch', (record: any) => {
      record.claims[0].suppressionReasonCode = 'FEED_NOT_CURRENT';
      record.claims[0].decisions.admission.reasonCode = 'FEED_NOT_CURRENT';
    }],
    ['service decision and suppression-reason mismatch', (record: any) => {
      record.claims[0].suppressionReasonCode = 'SERVICE_CHANGE_NOT_ELIGIBLE';
      record.claims[0].decisions.admission.reasonCode = 'SERVICE_CHANGE_NOT_ELIGIBLE';
    }],
    ['forged provenance ownership', (record: any) => { record.claims[0].provenance.sha256 = 'b'.repeat(64); }],
    ['noncanonical claim key', (record: any) => { record.claims[0].claimKey = 'forged'; }],
    ['duplicate claim ID', (record: any) => {
      const duplicate = claim({ targetStopId: 'A14N', targetStopCallIdentity: stopCall('A14N', 2) });
      duplicate.claimId = record.claims[0].claimId;
      record.claims.push(duplicate);
    }],
    ['duplicate canonical claim key', (record: any) => { record.claims.push({ ...record.claims[0], claimId: 'claim-other' }); }],
    ['duplicate source ID', (record: any) => { record.sources[1].sourceId = record.sources[0].sourceId; }],
    ['noncanonical source order', (record: any) => { record.sources.reverse(); }],
    ['source outcome/reason mismatch', (record: any) => { record.sources[0].reasonCode = 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED'; }],
    ['noncanonical gate decision', (record: any) => { record.gates[0].decision = 'Locked'; }],
    ['an extra record field', (record: any) => { record.extra = true; }],
    ['a comparison result/reason mismatch', (record: any) => {
      record.progressComparisons = [{
        sourceId: aceSource, operationalTrainId: 'train-1', targetStopId: 'A16N', targetStopCallIdentity: stopCall('A16N', 3),
        earlierDisposition: 'suppressed', laterDisposition: 'suppressed', dispositionTransition: 'suppressed-to-suppressed',
        result: 'progressed', reasonCode: 'NEXT_STOP_UNCHANGED',
      }];
    }],
  ])('invalidates the whole exact record for %s', (_label, alter) => {
    const record = shadowRecord({ recordId: 'shadow-invalid', claims: [claim()] });
    expect(() => parseShadowProgressRecord(record)).not.toThrow();
    alter(record);
    expect(() => parseShadowProgressRecord(record)).toThrow(/invalid prior shadow record/i);
  });

  test('rejects duplicate current keys instead of silently choosing the last Map value', () => {
    const earlier = parseShadowProgressRecord(shadowRecord({ recordId: 'shadow-dupe-earlier', claims: [claim()] }));
    const later = parseShadowProgressRecord(shadowRecord({ recordId: 'shadow-dupe-later', observedAt: laterObservedAt, claims: [claim({ observedAt: laterObservedAt })] }));
    expect(() => compareShadowProgress(earlier, { ...later, claims: [later.claims[0], later.claims[0]] } as any))
      .toThrow(/duplicate.*claim/i);
  });

  test('requires distinct record identities for an earlier/later comparison', () => {
    const record = parseShadowProgressRecord(shadowRecord({ recordId: 'shadow-same', claims: [claim()] }));
    expect(() => compareShadowProgress(record, record)).toThrow(/record.*identit/i);
  });

  test('rejects a serialized record over the fixed byte ceiling before accepting nested data', () => {
    const record = shadowRecord({ recordId: 'shadow-oversize', claims: [claim()] });
    record.sources[0].sourceId = `subway-rt-1234567s${'x'.repeat(1_000_000)}`;
    expect(() => parseShadowProgressRecord(record)).toThrow(/invalid prior shadow record/i);
  });
});

function shadowRecord(input: {
  recordId: string;
  claims: any[];
  observedAt?: string;
}) {
  const decisionTime = input.observedAt ?? observedAt;
  return {
    schemaVersion: 'shadow-v2',
    recordId: input.recordId,
    mode: 'shadow',
    recordedAt: new Date(Date.parse(decisionTime) + 1_000).toISOString(),
    decisionTime,
    riderExposure: false,
    boardsExposed: false,
    outcome: 'COMPLETED',
    sources: canonicalSources(decisionTime),
    gates: Object.entries(evaluateExposure({ mode: 'shadow' }).public).map(([stage, gate]) => ({ stage, ...gate })),
    comparisonContext: null,
    truncation: {
      claims: { consideredCount: input.claims.length, includedCount: input.claims.length, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' },
      comparisons: { consideredCount: 0, includedCount: 0, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' },
    },
    claims: [...input.claims].sort((left, right) => left.claimKey.localeCompare(right.claimKey)),
    progressComparisons: [],
  };
}

function canonicalSources(at: string) {
  return [...[
    'subway-rt-1234567s', 'subway-rt-ace', 'subway-rt-bdfm', 'subway-rt-g',
    'subway-rt-jz', 'subway-rt-l', 'subway-rt-nqrw',
  ].map((sourceId) => ({
    sourceId, role: 'subway-realtime', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
    feedGroupId: sourceId, observedAt: at, retrievedAt: at, sha256,
  })), {
    sourceId: 'subway-alerts', role: 'subway-alerts', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
    observedAt: at, retrievedAt: at, sha256,
  }];
}

function claim(overrides: Record<string, unknown> = {}) {
  const claimObservedAt = typeof overrides.observedAt === 'string' ? overrides.observedAt : observedAt;
  const row: any = {
    claimId: 'claim-train-1-A16N-3',
    claimKey: '',
    sourceId: aceSource,
    observedAt: claimObservedAt,
    operationalTrainId: 'train-1',
    serviceDate: '20260810',
    serviceInstanceId: `service:${createHash('sha256').update(encodeCanonicalStringTuple(['trip-1', '20260810', '12:00:00', 'train-1'])).digest('hex')}`,
    serviceIdentity: { tripId: 'trip-1', startDate: '20260810', startTime: '12:00:00', trainIdentity: 'train-1' },
    routeId: 'A',
    direction: 'northbound',
    terminalDestinationStopId: 'A16N',
    nextStopId: 'A12N',
    nextStopCallIdentity: stopCall('A12N', 1),
    targetStopId: 'A16N',
    targetStopCallIdentity: stopCall('A16N', 3),
    remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2), stopCall('A16N', 3)],
    decisionTime: claimObservedAt,
    disposition: 'suppressed',
    suppressionReasonCode: 'TRUSTED_HISTORY_UNAVAILABLE',
    provenance: {
      source: 'gtfs-rt', sourceId: aceSource, feedGroupId: aceSource,
      observedAt: claimObservedAt, retrievedAt: claimObservedAt, sha256,
    },
    decisions: {
      feedHealth: { kind: 'current', reasonCode: 'accepted-current' },
      serviceChange: { kind: 'eligible-context', disposition: 'eligible', alertContext: {
        state: 'accepted', sourceId: 'subway-alerts', observedAt: claimObservedAt, retrievedAt: claimObservedAt,
        sha256, snapshotState: 'current',
        alertContextIdentity: `alert-context:${createHash('sha256').update(encodeCanonicalStringTuple(['subway-alerts', claimObservedAt, claimObservedAt, sha256])).digest('hex')}`,
      } },
      admission: { kind: 'rejected', disposition: 'suppressed', reasonCode: 'TRUSTED_HISTORY_UNAVAILABLE' },
    },
    ...overrides,
  };
  if (row.disposition === 'admitted') {
    delete row.suppressionReasonCode;
    row.decisions = {
      ...row.decisions,
      admission: { kind: 'admitted', disposition: 'admitted', reasonCode: 'GOVERNED_ADMISSION' },
    };
  }
  canonicalizeClaim(row);
  return row;
}

function canonicalizeClaim(row: any): void {
  const digest = createHash('sha256').update(encodeCanonicalStringTuple([
    row.sourceId, row.operationalTrainId, row.serviceDate, row.serviceInstanceId, row.targetStopCallIdentity,
  ])).digest('hex');
  row.claimKey = `claim:${digest}`;
  row.claimId = `claim-id:${digest}`;
}

function stopCall(stopId: string, sequence: number): string {
  return `${stopId}\u0000sequence:${sequence}`;
}
