import { describe, expect, test } from 'vitest';
import {
  evaluateTrackConflict,
  resolveRerouteClaim,
  type RerouteClaimInput,
} from '../../src/shared/domain/reroute';

const BASE = new Date('2026-08-04T12:00:00.000Z');
const at = (seconds: number) => new Date(BASE.getTime() + seconds * 1_000);

const reroute = (overrides: Partial<RerouteClaimInput> = {}): RerouteClaimInput => ({
  changeKind: 'reroute',
  planned: true,
  alertScope: 'match',
  originalRoute: { id: 'F', label: 'F' },
  direction: 'northbound',
  targetExactDirectionalStopId: 'A24N',
  originalDirectionalStopIds: ['B02N', 'D15N', 'D16N', 'D17N', 'D18N'],
  effectiveSupplementedPattern: {
    sourceId: 'supplement-20260804',
    routeId: 'F',
    direction: 'northbound',
    orderedDirectionalStopIds: ['B02N', 'F14N', 'A24N', 'A25N', 'A27N'],
    provenance: {
      source: 'supplemented-gtfs', acceptance: 'accepted', currency: 'current',
      editionId: 'supplemented-gtfs:20260804-weekend', observedAt: BASE,
    },
  },
  liveRemainingStopIds: ['F14N', 'A24N', 'A25N', 'A27N'],
  pathEvidence: [{
    evidenceId: 'alert-path-1',
    routeId: 'F',
    direction: 'northbound',
    orderedDirectionalStopIds: ['F14N', 'A24N', 'A25N', 'A27N'],
    supportedViaLabel: 'Via E',
  }],
  ...overrides,
});

describe('route-on-route and stopping-pattern resolution', () => {
  test('admits an F at an exact E-line directional stop only with coherent live and independent path proof', () => {
    expect(resolveRerouteClaim(reroute())).toEqual({
      kind: 'admitted',
      route: { id: 'F', label: 'F' },
      targetExactDirectionalStopId: 'A24N',
      supportedViaLabel: 'Via E',
      reason: 'planned-effective-pattern-and-live-path-agree',
    });
  });

  test('preserves original F identity and never substitutes the host line identity', () => {
    const result = resolveRerouteClaim(reroute({
      pathEvidence: [{
        evidenceId: 'e-line-path', routeId: 'F', direction: 'northbound',
        orderedDirectionalStopIds: ['F14N', 'A24N'], supportedViaLabel: 'Via E',
      }],
    }));
    expect(result).toMatchObject({ kind: 'admitted', route: { id: 'F', label: 'F' }, supportedViaLabel: 'Via E' });
    expect(JSON.stringify(result)).not.toContain('"id":"E"');
  });

  test('fails closed for wrong direction, complex-only, absent exact stop, missing proof, and intermediate inference', () => {
    const cases: RerouteClaimInput[] = [
      reroute({ direction: 'southbound' }),
      reroute({ liveRemainingStopIds: ['F14N', 'D17N', 'A25N'] }),
      reroute({ liveRemainingStopIds: ['F14N', 'A25N'] }),
      reroute({ pathEvidence: [] }),
      reroute({
        targetExactDirectionalStopId: 'A23N',
        effectiveSupplementedPattern: { ...reroute().effectiveSupplementedPattern!, orderedDirectionalStopIds: ['F14N', 'A22N', 'A24N'] },
        liveRemainingStopIds: ['F14N', 'A22N', 'A24N'],
        pathEvidence: [{ evidenceId: 'no-inference', routeId: 'F', direction: 'northbound', orderedDirectionalStopIds: ['F14N', 'A22N', 'A24N'] }],
      }),
    ];
    for (const item of cases) expect(resolveRerouteClaim(item).kind).not.toBe('admitted');
  });

  test('suppresses an original F stop excluded by the accepted effective pattern', () => {
    expect(resolveRerouteClaim(reroute({
      targetExactDirectionalStopId: 'D17N',
      liveRemainingStopIds: ['F14N', 'A24N', 'A25N'],
      pathEvidence: [{
        evidenceId: 'bypass-proof', routeId: 'F', direction: 'northbound',
        orderedDirectionalStopIds: ['F14N', 'A24N', 'A25N'], supportedViaLabel: 'Via E',
      }],
    }))).toMatchObject({ kind: 'suppressed', reason: 'original-stop-excluded-by-effective-pattern' });
  });

  test('requires planned supplement and live agreement and fails closed on their conflict', () => {
    expect(resolveRerouteClaim(reroute({
      effectiveSupplementedPattern: { ...reroute().effectiveSupplementedPattern!, orderedDirectionalStopIds: ['F14N', 'A25N'] },
    }))).toMatchObject({ kind: 'quarantine-or-limitation', reason: 'planned-pattern-conflicts-with-live-path' });
    expect(resolveRerouteClaim(reroute({ liveRemainingStopIds: ['F14N', 'A25N'] })))
      .toMatchObject({ kind: 'quarantine-or-limitation', reason: 'target-not-in-coherent-live-remaining-stops' });
  });

  test('requires accepted current supplemented-GTFS pattern provenance and a nonempty usable edition', () => {
    const valid = reroute().effectiveSupplementedPattern!;
    const invalidPatterns = [
      { ...valid, provenance: { ...valid.provenance, source: 'regular-gtfs' as const } },
      { ...valid, provenance: { ...valid.provenance, currency: 'stale' as const } },
      { ...valid, provenance: { ...valid.provenance, acceptance: 'quarantined' as const } },
      { ...valid, provenance: { ...valid.provenance, editionId: '' } },
      { ...valid, orderedDirectionalStopIds: [] },
      { ...valid, orderedDirectionalStopIds: ['A24N', 'A24N'] },
    ];
    for (const effectiveSupplementedPattern of invalidPatterns) {
      expect(resolveRerouteClaim(reroute({ effectiveSupplementedPattern }))).toMatchObject({
        kind: 'quarantine-or-limitation',
      });
    }
    expect(resolveRerouteClaim(reroute({
      effectiveSupplementedPattern: { ...valid, provenance: { ...valid.provenance, source: 'forged' as never } },
    }))).toMatchObject({ kind: 'quarantine-or-limitation' });
  });

  test('resolves alert scope after the planned pattern and before live reroute evidence', () => {
    expect(resolveRerouteClaim(reroute({ alertScope: 'unrelated' }))).toMatchObject({
      kind: 'quarantine-or-limitation', reason: 'alert-scope-unrelated',
    });
    expect(resolveRerouteClaim(reroute({ alertScope: 'unresolved' }))).toMatchObject({
      kind: 'quarantine-or-limitation', reason: 'alert-scope-unresolved',
    });
    expect(resolveRerouteClaim(reroute({ alertScope: 'unrelated', liveRemainingStopIds: ['A24N', 'A24N'] })))
      .toMatchObject({ kind: 'quarantine-or-limitation', reason: 'alert-scope-unrelated' });
  });

  test('requires both coherent exact live stop and uncontradicted path proof for an unplanned reroute', () => {
    const unplanned = reroute({ planned: false, effectiveSupplementedPattern: null });
    expect(resolveRerouteClaim(unplanned).kind).toBe('admitted');
    expect(resolveRerouteClaim({ ...unplanned, pathEvidence: [] }).kind).not.toBe('admitted');
    expect(resolveRerouteClaim({ ...unplanned, liveRemainingStopIds: ['F14N', 'A25N'] }).kind).not.toBe('admitted');
  });

  test('does not let conflicting path records become first-record-wins', () => {
    const supporting = reroute().pathEvidence[0];
    const contradicting = {
      evidenceId: 'alert-path-conflict', routeId: 'F', direction: 'northbound' as const,
      orderedDirectionalStopIds: ['F14N', 'A25N', 'A27N'], supportedViaLabel: 'Via E',
    };
    const forward = resolveRerouteClaim(reroute({ pathEvidence: [supporting, contradicting] }));
    const reverse = resolveRerouteClaim(reroute({ pathEvidence: [contradicting, supporting] }));
    expect(forward).toEqual(reverse);
    expect(forward).toMatchObject({ kind: 'quarantine-or-limitation', reason: 'conflicting-path-evidence' });
  });

  test('requires cross-sequence stop order coherence, allowing only valid ordered partial proofs', () => {
    expect(resolveRerouteClaim(reroute({
      liveRemainingStopIds: ['A25N', 'A24N', 'F14N'],
    }))).toMatchObject({ kind: 'quarantine-or-limitation', reason: 'divergent-ordered-path-evidence' });
    expect(resolveRerouteClaim(reroute({
      pathEvidence: [{
        evidenceId: 'reversed-proof', routeId: 'F', direction: 'northbound',
        orderedDirectionalStopIds: ['A25N', 'A24N', 'F14N'], supportedViaLabel: 'Via E',
      }],
    }))).toMatchObject({ kind: 'quarantine-or-limitation', reason: 'divergent-ordered-path-evidence' });
    expect(resolveRerouteClaim(reroute({
      liveRemainingStopIds: ['A24N', 'A25N'],
      pathEvidence: [{
        evidenceId: 'ordered-partial', routeId: 'F', direction: 'northbound',
        orderedDirectionalStopIds: ['F14N', 'A24N', 'A25N', 'A27N'], supportedViaLabel: 'Via E',
      }],
    }))).toMatchObject({ kind: 'admitted', supportedViaLabel: 'Via E' });
    expect(resolveRerouteClaim(reroute({
      liveRemainingStopIds: ['F14N', 'A24N', 'A24N'],
    }))).toMatchObject({ kind: 'quarantine-or-limitation', reason: 'invalid-ordered-stop-evidence' });
  });

  test('sanitizes and bounds optional rider-facing Via labels', () => {
    const withLabel = (supportedViaLabel: string) => resolveRerouteClaim(reroute({
      pathEvidence: [{
        evidenceId: 'label-proof', routeId: 'F', direction: 'northbound',
        orderedDirectionalStopIds: ['F14N', 'A24N', 'A25N'], supportedViaLabel,
      }],
    }));
    expect(withLabel('<b>Via E</b>')).toMatchObject({ kind: 'admitted', supportedViaLabel: 'Via E' });
    for (const malformed of ['<b></b>', 'Via\u0001E', 'E line', `Via ${'E'.repeat(80)}`]) {
      expect(withLabel(malformed)).toMatchObject({ kind: 'quarantine-or-limitation', reason: 'invalid-via-label' });
    }
    expect(withLabel('Via Cafe\u0301')).toMatchObject({ kind: 'admitted', supportedViaLabel: 'Via Caf\u00e9' });
  });

  test('admits express-running-local only at an explicitly added stop and suppresses local-running-express only at an omitted local', () => {
    expect(resolveRerouteClaim(reroute({ changeKind: 'express-running-local' }))).toMatchObject({ kind: 'admitted' });
    expect(resolveRerouteClaim(reroute({
      changeKind: 'express-running-local', targetExactDirectionalStopId: 'A23N',
      effectiveSupplementedPattern: { ...reroute().effectiveSupplementedPattern!, orderedDirectionalStopIds: ['F14N', 'A22N', 'A24N'] },
      liveRemainingStopIds: ['F14N', 'A22N', 'A24N'],
      pathEvidence: [{ evidenceId: 'skip', routeId: 'F', direction: 'northbound', orderedDirectionalStopIds: ['F14N', 'A22N', 'A24N'] }],
    })).kind).not.toBe('admitted');

    expect(resolveRerouteClaim(reroute({
      changeKind: 'local-running-express', targetExactDirectionalStopId: 'D17N',
      affectedExactDirectionalSegmentStopIds: ['D17N'],
    }))).toMatchObject({ kind: 'suppressed', reason: 'explicit-local-stop-omitted' });
    expect(resolveRerouteClaim(reroute({
      changeKind: 'local-running-express', targetExactDirectionalStopId: 'D16N',
      affectedExactDirectionalSegmentStopIds: ['D17N'],
    })).kind).not.toBe('suppressed');
  });
});

describe('resolved track conflict', () => {
  test('suppresses only downstream claims for a non-terminal actual/scheduled-track conflict', () => {
    const conflict = {
      evidenceId: 'track-1', routeId: 'F', direction: 'northbound' as const,
      conflictStopId: 'D17N', targetExactDirectionalStopId: 'A24N',
      actualTrack: '2', scheduledTrack: '1', terminal: false,
      downstreamExactDirectionalStopIds: ['A24N', 'A25N'], observedAt: BASE,
    };
    expect(evaluateTrackConflict(conflict)).toMatchObject({ kind: 'resolved-suppression' });
    expect(evaluateTrackConflict({ ...conflict, targetExactDirectionalStopId: 'D16N' })).toMatchObject({ kind: 'eligible-context' });
    expect(evaluateTrackConflict({ ...conflict, terminal: true })).toMatchObject({ kind: 'eligible-context' });
    expect(evaluateTrackConflict({ ...conflict, actualTrack: '1' })).toMatchObject({ kind: 'eligible-context' });
  });

  test('requires two qualifying updates before a cleared track conflict restores downstream arrivals', () => {
    const conflict = {
      evidenceId: 'track-1', routeId: 'F', direction: 'northbound' as const,
      conflictStopId: 'D17N', targetExactDirectionalStopId: 'A24N', actualTrack: '2', scheduledTrack: '1',
      terminal: false, downstreamExactDirectionalStopIds: ['A24N'], observedAt: BASE,
    };
    const adverse = evaluateTrackConflict(conflict);
    if (!adverse.carryover) throw new Error('track conflict must carry risk');
    const update = (id: string, seconds: number) => ({
      evidenceId: id, sourceTimestamp: at(seconds), currentFeed: true, coherentIdentity: true,
      exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
    });
    const clear = { ...conflict, evidenceId: 'track-clear', actualTrack: '1', scheduledTrack: '1',
      observedAt: at(10), priorRisk: adverse.carryover };
    expect(evaluateTrackConflict({ ...clear, recoveryUpdates: [update('one', 1)] })).toMatchObject({
      kind: 'resolved-suppression', recoveryCount: 1,
    });
    expect(evaluateTrackConflict({ ...clear, recoveryUpdates: [update('one', 1), update('two', 2)] })).toMatchObject({
      kind: 'eligible-context', recoveryCount: 2,
    });
  });
});
