import { describe, expect, test } from 'vitest';
import {
  classifyAlertSnapshot,
  classifyAlertTemporalState,
  resolveAlertScope,
  sanitizeOfficialText,
  type AlertSnapshotInput,
  type ServiceAlertEvidence,
  type ServiceClaimScope,
} from '../../src/shared/domain/alert-scope';
import {
  countQualifyingRecovery,
  evaluateServiceChanges,
  type ServiceRecoveryUpdate,
  type ServiceRiskCarryover,
} from '../../src/shared/domain/service-impact';

const BASE = new Date('2026-08-04T12:00:00.000Z');
const at = (seconds: number) => new Date(BASE.getTime() + seconds * 1_000);

const claim = (overrides: Partial<ServiceClaimScope> = {}): ServiceClaimScope => ({
  claimId: 'claim-f-a24n',
  routeId: 'F',
  exactDirectionalStopId: 'A24N',
  constituentStopId: 'A24',
  direction: 'northbound',
  tripId: 'trip-f-1',
  trainId: 'train-f-1',
  ...overrides,
});

const alert = (overrides: Partial<ServiceAlertEvidence> = {}): ServiceAlertEvidence => ({
  alertId: 'alert-1',
  activePeriods: [],
  selectors: [{ selectorId: 'selector-1', routeId: 'F' }],
  structuredEffect: 'MODIFIED_SERVICE',
  declaredConsequence: 'generic-affected',
  official: {
    headerRaw: '<b>F trains are affected</b>',
    descriptionRaw: '<p>Allow additional travel time.</p>',
  },
  ...overrides,
});

const snapshot = (
  alerts: readonly ServiceAlertEvidence[],
  overrides: Partial<AlertSnapshotInput> = {},
) => classifyAlertSnapshot({
  status: 'accepted',
  feedTimestamp: BASE,
  retrievedAt: at(10_000),
  alerts,
  ...overrides,
}, BASE);

describe('authoritative alert currency and temporal scope', () => {
  test('uses feed time, keeps exactly 600 seconds current, and makes the first later instant stale', () => {
    expect(classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: BASE, retrievedAt: at(601), alerts: [],
    }, at(600)).kind).toBe('current');
    expect(classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: BASE, retrievedAt: at(601), alerts: [],
    }, new Date(BASE.getTime() + 600_001)).kind).toBe('stale');
  });

  test('treats active periods as half-open and supports multiple periods', () => {
    const periods = [
      { startsAt: at(10), endsAt: at(20) },
      { startsAt: at(30), endsAt: at(40) },
    ];
    expect(classifyAlertTemporalState(periods, at(9))).toBe('preactive');
    expect(classifyAlertTemporalState(periods, at(10))).toBe('active');
    expect(classifyAlertTemporalState(periods, at(15))).toBe('active');
    expect(classifyAlertTemporalState(periods, at(20))).toBe('preactive');
    expect(classifyAlertTemporalState(periods, at(30))).toBe('active');
    expect(classifyAlertTemporalState(periods, at(40))).toBe('expired');
    expect(classifyAlertTemporalState(periods, at(41))).toBe('expired');
    expect(classifyAlertTemporalState([], at(5))).toBe('active');
  });

  test('keeps pre-active informational and expired alerts from creating a veto', () => {
    const future = alert({
      declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE',
      activePeriods: [{ startsAt: at(30), endsAt: at(60) }],
      official: { headerRaw: 'F service is suspended', descriptionRaw: 'No F trains.' },
    });
    const expired = { ...future, alertId: 'expired', activePeriods: [{ startsAt: at(-30), endsAt: BASE }] };
    expect(evaluateServiceChanges({ snapshot: snapshot([future]), claim: claim() }).kind).toBe('eligible-context');
    expect(evaluateServiceChanges({ snapshot: snapshot([expired]), claim: claim() }).kind).toBe('eligible-context');
  });

  test('routes an indeterminate current active period to its owning limitation instead of a veto', () => {
    for (const activePeriods of [
      [{ startsAt: at(20), endsAt: at(10) }],
      [{ startsAt: new Date(Number.NaN), endsAt: at(10) }],
    ]) {
      const indeterminate = alert({
        declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE', activePeriods,
        official: { headerRaw: 'F service is suspended', descriptionRaw: 'No F trains.' },
      });
      expect(evaluateServiceChanges({ snapshot: snapshot([indeterminate]), claim: claim() })).toMatchObject({
        kind: 'quarantine-or-limitation', disposition: 'quarantined',
      });
    }
  });

  test('preserves prior current risk across stale, missing, failed, and quarantined context', () => {
    const adverse = evaluateServiceChanges({
      snapshot: snapshot([alert({
        declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE',
        official: { headerRaw: 'F service is suspended', descriptionRaw: 'No F trains are running.' },
      })]),
      claim: claim(),
    });
    expect(adverse.kind).toBe('resolved-suppression');
    if (!adverse.carryover) throw new Error('adverse fixture must produce carryover');

    const contexts = [
      classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(-601), alerts: [] }, BASE),
      classifyAlertSnapshot({ status: 'missing' }, BASE),
      classifyAlertSnapshot({ status: 'failed' }, BASE),
      classifyAlertSnapshot({ status: 'quarantined' }, BASE),
    ];
    for (const context of contexts) {
      expect(evaluateServiceChanges({ snapshot: context, claim: claim(), priorRisk: adverse.carryover }))
        .toMatchObject({ kind: 'resolved-suppression', carriedForward: true });
      expect(evaluateServiceChanges({ snapshot: context, claim: claim() }).kind).toBe('eligible-context');
    }
  });

  test('keeps prior hard suppression above a current contradiction until two later clean updates', () => {
    const closure = evaluateServiceChanges({
      snapshot: snapshot([alert({
        declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'closed', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping here.' },
      })]), claim: claim(),
    });
    if (!closure.carryover) throw new Error('closure fixture must carry hard risk');
    const contradictionSnapshot = classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(10), alerts: [alert({
        declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'contradiction', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official: { headerRaw: 'Closest entrance is open', descriptionRaw: 'F trains continue stopping here.' },
      })],
    }, at(10));
    const recovery = (id: string, seconds: number, currentFeed = true): ServiceRecoveryUpdate => ({
      evidenceId: id, sourceTimestamp: at(seconds), currentFeed, coherentIdentity: true,
      exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
    });
    const contradiction = evaluateServiceChanges({
      snapshot: contradictionSnapshot, claim: claim(), priorRisk: closure.carryover,
      recoveryUpdates: [recovery('donated-1', 1), recovery('donated-2', 2)],
    });
    expect(contradiction).toMatchObject({ kind: 'resolved-suppression', carriedForward: true, recoveryCount: 0 });
    if (!contradiction.carryover) throw new Error('contradiction must preserve hard risk');

    const clean = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(20), alerts: [] }, at(20));
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: contradiction.carryover,
      recoveryUpdates: [recovery('old-1', 1), recovery('old-2', 2)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 0 });
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: contradiction.carryover,
      recoveryUpdates: [recovery('new-1', 11)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 1 });
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: contradiction.carryover,
      recoveryUpdates: [recovery('new-1', 11), recovery('broken', 12, false), recovery('new-2', 13)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 1 });
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: contradiction.carryover,
      recoveryUpdates: [recovery('new-1', 11), recovery('new-2', 12)] }))
      .toMatchObject({ kind: 'eligible-context', recoveryCount: 2 });
  });

  test('never moves a recovery boundary backward when an accepted snapshot feed clock regresses', () => {
    const hardSnapshot = classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(10), alerts: [alert({
        declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'closed', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping here.' },
      })],
    }, at(10));
    const hard = evaluateServiceChanges({ snapshot: hardSnapshot, claim: claim() });
    if (!hard.carryover) throw new Error('hard fixture must carry risk');

    const contradiction = classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(5), alerts: [alert({
        declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'contradiction', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official: { headerRaw: 'Station is not closed', descriptionRaw: 'Normal service continues.' },
      })],
    }, at(20));
    const update = (evidenceId: string, seconds: number, currentFeed = true): ServiceRecoveryUpdate => ({
      evidenceId, sourceTimestamp: at(seconds), currentFeed, coherentIdentity: true,
      exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
    });
    const carried = evaluateServiceChanges({
      snapshot: contradiction,
      claim: claim(),
      priorRisk: hard.carryover,
      recoveryUpdates: [update('old-one', 6), update('old-two', 7)],
    });
    expect(carried).toMatchObject({ kind: 'resolved-suppression', recoveryCount: 0, carriedForward: true });
    expect(carried.carryover?.adverseAt.toISOString()).toBe(at(20).toISOString());
    if (!carried.carryover) throw new Error('regressed snapshot must retain risk');

    const earlierAssessment = classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(4), alerts: [alert({
        declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'older-contradiction', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official: { headerRaw: 'Station is not closed', descriptionRaw: 'Normal service continues.' },
      })],
    }, at(15));
    const neverBackward = evaluateServiceChanges({
      snapshot: earlierAssessment, claim: claim(), priorRisk: carried.carryover,
    });
    expect(neverBackward.carryover?.adverseAt.toISOString()).toBe(at(20).toISOString());

    const clean = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(30), alerts: [] }, at(30));
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: carried.carryover,
      recoveryUpdates: [update('old-one', 6), update('old-two', 7)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 0 });
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: carried.carryover,
      recoveryUpdates: [update('equal-one', 20), update('equal-two', 20)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 0 });
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: carried.carryover,
      recoveryUpdates: [update('new-one', 21), update('broken', 22, false), update('new-two', 23)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 1 });
    expect(evaluateServiceChanges({ snapshot: clean, claim: claim(), priorRisk: carried.carryover,
      recoveryUpdates: [update('new-one', 21), update('new-two', 22)] }))
      .toMatchObject({ kind: 'eligible-context', recoveryCount: 2 });
  });

  test('rejects cloned, rewritten, proxied, and cross-claim service risk lifecycle state', () => {
    const hardSnapshot = classifyAlertSnapshot({
      status: 'accepted', feedTimestamp: at(10), alerts: [alert({
        declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'issued-risk', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping here.' },
      })],
    }, at(10));
    const hard = evaluateServiceChanges({ snapshot: hardSnapshot, claim: claim() });
    if (!hard.carryover) throw new Error('hard fixture must carry risk');
    expect(Object.isFrozen(hard.carryover)).toBe(true);
    expect(Object.isFrozen(hard.carryover.evaluatedClaim)).toBe(true);

    const descriptorCopy = Object.freeze(Object.create(
      Object.getPrototypeOf(hard.carryover),
      Object.getOwnPropertyDescriptors(hard.carryover),
    )) as ServiceRiskCarryover;
    const rewritten = Object.freeze({ ...hard.carryover, adverseAt: BASE }) as ServiceRiskCarryover;
    const forgedRisks = [
      { ...hard.carryover },
      Object.freeze({ ...hard.carryover }),
      structuredClone(hard.carryover),
      JSON.parse(JSON.stringify(hard.carryover)) as ServiceRiskCarryover,
      descriptorCopy,
      new Proxy(hard.carryover, {}),
      rewritten,
    ] as readonly ServiceRiskCarryover[];
    const update = (evidenceId: string, seconds: number): ServiceRecoveryUpdate => ({
      evidenceId, sourceTimestamp: at(seconds), currentFeed: true, coherentIdentity: true,
      exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
    });
    const clear = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(20), alerts: [] }, at(20));
    for (const priorRisk of forgedRisks) {
      expect(() => evaluateServiceChanges({
        snapshot: clear, claim: claim(), priorRisk,
        recoveryUpdates: [update('forged-one', 1), update('forged-two', 2)],
      })).not.toThrow();
      expect(evaluateServiceChanges({
        snapshot: clear, claim: claim(), priorRisk,
        recoveryUpdates: [update('forged-one', 1), update('forged-two', 2)],
      })).toMatchObject({
        kind: 'quarantine-or-limitation', disposition: 'quarantined', recoveryCount: 0, carryover: null,
      });
    }

    const otherClaimRisk = evaluateServiceChanges({
      snapshot: hardSnapshot,
      claim: claim({ claimId: 'other-claim' }),
    }).carryover;
    if (!otherClaimRisk) throw new Error('cross-claim fixture must carry risk');
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: otherClaimRisk })).toMatchObject({
      kind: 'quarantine-or-limitation', disposition: 'quarantined', carryover: null,
    });
  });

  test('allows only an issued same-claim service lifecycle to release after a valid consecutive pair', () => {
    const hard = evaluateServiceChanges({
      snapshot: classifyAlertSnapshot({
        status: 'accepted', feedTimestamp: at(10), alerts: [alert({
          declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE',
          official: { headerRaw: 'F service suspended', descriptionRaw: 'No F trains.' },
        })],
      }, at(10)),
      claim: claim(),
    });
    if (!hard.carryover) throw new Error('hard fixture must carry risk');
    const update = (evidenceId: string, seconds: number, currentFeed = true): ServiceRecoveryUpdate => ({
      evidenceId, sourceTimestamp: at(seconds), currentFeed, coherentIdentity: true,
      exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
    });
    const clear = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(20), alerts: [] }, at(20));
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('equal', 10), update('one', 11)] })).toMatchObject({
      kind: 'resolved-suppression', recoveryCount: 1,
    });
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('one', 11), update('broken', 12, false), update('two', 13)] })).toMatchObject({
      kind: 'resolved-suppression', recoveryCount: 1,
    });
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('one', 11), update('two', 12)] })).toMatchObject({
      kind: 'eligible-context', recoveryCount: 2,
    });
  });
});

describe('atomic alert scope', () => {
  test('matches route, exact stop, constituent, segment, direction, trip, train, and claim independently', () => {
    const selectors = [
      { selectorId: 'route', routeId: 'F' },
      { selectorId: 'stop', exactDirectionalStopId: 'A24N' },
      { selectorId: 'constituent', constituentStopIds: ['A24'] },
      { selectorId: 'segment', exactDirectionalSegmentStopIds: ['A23N', 'A24N', 'A25N'] },
      { selectorId: 'direction', direction: 'northbound' as const },
      { selectorId: 'trip', tripId: 'trip-f-1' },
      { selectorId: 'train', trainId: 'train-f-1' },
      { selectorId: 'claim', claimId: 'claim-f-a24n' },
    ];
    for (const selector of selectors) {
      expect(resolveAlertScope(alert({ selectors: [selector] }), claim(), BASE).kind).toBe('match');
    }
  });

  test('isolates wrong direction, outside segment, unrelated route and train, and a shared complex', () => {
    const wrong = [
      { selectorId: 'direction', routeId: 'F', direction: 'southbound' as const },
      { selectorId: 'segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A25N', 'A26N'] },
      { selectorId: 'route', routeId: 'E' },
      { selectorId: 'train', routeId: 'F', trainId: 'other-train' },
      { selectorId: 'complex', routeId: 'F', exactDirectionalStopId: 'D17N', constituentStopIds: ['A24'] },
    ];
    for (const selector of wrong) {
      expect(resolveAlertScope(alert({ selectors: [selector] }), claim(), BASE).kind).toBe('unrelated');
    }
  });

  test('never donates fields across selectors or alerts', () => {
    const split = alert({ selectors: [
      { selectorId: 'right-route-wrong-stop', routeId: 'F', exactDirectionalStopId: 'A25N' },
      { selectorId: 'wrong-route-right-stop', routeId: 'E', exactDirectionalStopId: 'A24N' },
    ] });
    expect(resolveAlertScope(split, claim(), BASE).kind).toBe('unrelated');

    const decision = evaluateServiceChanges({
      snapshot: snapshot([
        alert({ alertId: 'route-only', selectors: [{ selectorId: 'r', routeId: 'F', exactDirectionalStopId: 'A25N' }] }),
        alert({ alertId: 'stop-only', selectors: [{ selectorId: 's', routeId: 'E', exactDirectionalStopId: 'A24N' }] }),
      ]),
      claim: claim(),
    });
    expect(decision.kind).toBe('eligible-context');
  });

  test('partitions unrelated alert details from claim details deterministically', () => {
    const related = alert({
      alertId: 'related', declaredConsequence: 'delay-only', structuredEffect: 'SIGNIFICANT_DELAYS',
      selectors: [{ selectorId: 'f-route', routeId: 'F' }],
      official: { headerRaw: 'F trains are delayed', descriptionRaw: 'Allow extra time.' },
    });
    const unrelated = alert({
      alertId: 'unrelated', declaredConsequence: 'delay-only', structuredEffect: 'SIGNIFICANT_DELAYS',
      selectors: [{ selectorId: 'e-route', routeId: 'E' }],
      official: { headerRaw: 'E trains are delayed', descriptionRaw: 'Allow extra time.' },
    });
    const forward = evaluateServiceChanges({ snapshot: snapshot([unrelated, related]), claim: claim() });
    const reverse = evaluateServiceChanges({ snapshot: snapshot([related, unrelated]), claim: claim() });
    expect(forward).toEqual(reverse);
    expect(forward.officialDetails.map((item) => item.alertId)).toEqual(['related']);
    expect(forward.contextDetails).toMatchObject([{
      relation: 'unrelated', official: { alertId: 'unrelated', header: 'E trains are delayed' },
    }]);
  });

  test('never donates an unrelated precise stop to a broad matching selector for a destructive alert', () => {
    const splitPrecision = alert({
      declaredConsequence: 'reroute',
      selectors: [
        { selectorId: 'broad-match', routeId: 'F' },
        { selectorId: 'precise-but-unrelated', routeId: 'F', exactDirectionalStopId: 'A25N' },
      ],
      official: { headerRaw: 'F trains are rerouted', descriptionRaw: 'F trains run via another line.' },
    });
    expect(evaluateServiceChanges({ snapshot: snapshot([splitPrecision]), claim: claim() })).toMatchObject({
      kind: 'arrival-claim-unavailable',
      disposition: 'high-impact-unresolved',
    });
  });

  test('returns unresolved only for an explicitly unresolved atomic selector', () => {
    expect(resolveAlertScope(alert({ selectors: [{ selectorId: 'u', routeId: 'F', direction: null }] }), claim(), BASE).kind)
      .toBe('unresolved');
    expect(resolveAlertScope(alert({ selectors: [] }), claim(), BASE).kind).toBe('unresolved');
    expect(resolveAlertScope(alert({ selectors: [{ selectorId: 'empty' }] }), claim(), BASE).kind).toBe('unresolved');
  });

  test('resolves selector dimensions in the governed order before later unresolved fields', () => {
    expect(resolveAlertScope(alert({ selectors: [{
      selectorId: 'constituent-first', routeId: 'F', constituentStopIds: ['A25'], exactDirectionalStopId: null,
    }] }), claim(), BASE).kind).toBe('unrelated');
    expect(resolveAlertScope(alert({ selectors: [{
      selectorId: 'exact-before-segment', routeId: 'F', constituentStopIds: ['A24'],
      exactDirectionalStopId: 'A25N', exactDirectionalSegmentStopIds: null,
    }] }), claim(), BASE).kind).toBe('unrelated');
  });

  test('sanitizes official text for riders while preserving raw fields in audit details', () => {
    expect(sanitizeOfficialText('<script>bad()</script><b>F &amp; E</b><br>Use &quot;local&quot; service.'))
      .toBe('F & E Use "local" service.');
    expect(sanitizeOfficialText('&lt;script&gt;bad()&lt;/script&gt; Safe rider text.')).toBe('bad() Safe rider text.');
    const destructive = alert({
      declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE',
      official: { headerRaw: '<b>F service is suspended</b>', descriptionRaw: '<p>No F trains.</p>' },
    });
    const result = evaluateServiceChanges({ snapshot: snapshot([destructive]), claim: claim() });
    expect(result.officialDetails[0]).toMatchObject({
      header: 'F service is suspended', description: 'No F trains.',
    });
    expect(result.officialDetails[0]).not.toHaveProperty('rawHeader');
    expect(result.rawOfficialAudit[0]).toMatchObject({
      rawHeader: '<b>F service is suspended</b>', rawDescription: '<p>No F trains.</p>',
    });
    expect(JSON.stringify(result.riderCopy)).not.toContain('<');
  });

  test('deep-copies classified snapshots so source or exposed Date mutation cannot change decisions', () => {
    const mutable = alert({
      declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
      activePeriods: [{ startsAt: at(-10), endsAt: at(10) }],
      selectors: [{ selectorId: 'mutable', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopIds: ['A24'] }],
      official: { headerRaw: '<b>Station closed</b>', descriptionRaw: 'F trains are not stopping here.' },
      rawAuditFields: { nested: { source: 'original' }, dates: [at(-5)] },
    });
    const sourceAlerts = [mutable];
    const classified = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: BASE, alerts: sourceAlerts }, BASE);
    const before = evaluateServiceChanges({ snapshot: classified, claim: claim() });

    (sourceAlerts as ServiceAlertEvidence[]).length = 0;
    (mutable.selectors[0] as { routeId: string }).routeId = 'E';
    (mutable.activePeriods[0].startsAt as Date).setTime(at(100).getTime());
    ((mutable.rawAuditFields as { nested: { source: string } }).nested).source = 'mutated';
    classified.assessedAt.setTime(at(100).getTime());
    classified.feedTimestamp?.setTime(at(-1_000).getTime());
    classified.alerts[0].activePeriods[0].startsAt?.setTime(at(100).getTime());

    expect(evaluateServiceChanges({ snapshot: classified, claim: claim() })).toEqual(before);
    expect(Object.isFrozen(classified.alerts[0])).toBe(true);
    expect(Object.isFrozen(classified.alerts[0].selectors[0])).toBe(true);
    expect(Object.isFrozen(classified.alerts[0].selectors[0].constituentStopIds)).toBe(true);
    expect(Object.isFrozen(classified.alerts[0].rawAuditFields)).toBe(true);
  });

  test('rejects canonical duplicate and prototype-sensitive raw audit keys without source-order choice', () => {
    const duplicateForward: Record<string, unknown> = {};
    duplicateForward['Caf\u00e9'] = { source: 'first' };
    duplicateForward['Cafe\u0301'] = { source: 'second' };
    const duplicateReverse: Record<string, unknown> = {};
    duplicateReverse['Cafe\u0301'] = { source: 'second' };
    duplicateReverse['Caf\u00e9'] = { source: 'first' };
    for (const rawAuditFields of [duplicateForward, duplicateReverse]) {
      const before = Object.entries(rawAuditFields).map(([key, value]) => [key, JSON.stringify(value)]);
      expect(() => snapshot([alert({ rawAuditFields })])).toThrow(/canonical duplicate raw audit key/i);
      expect(Object.entries(rawAuditFields).map(([key, value]) => [key, JSON.stringify(value)])).toEqual(before);
    }

    const dangerous = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"value":1},"prototype":{"value":2}}') as
      Record<string, unknown>;
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(() => snapshot([alert({ rawAuditFields: dangerous })])).toThrow(/unsafe raw audit key/i);
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(Object.keys(dangerous)).toEqual(['__proto__', 'constructor', 'prototype']);
  });

  test('uses null-prototype audit copies and bounds cycles, depth, keys, arrays, and strings', () => {
    const rawAuditFields = { nested: { value: 'safe' }, array: [{ value: 'safe' }] };
    const classified = snapshot([alert({ rawAuditFields })]);
    const frozenAudit = classified.alerts[0].rawAuditFields!;
    expect(Object.getPrototypeOf(frozenAudit)).toBeNull();
    expect(Object.getPrototypeOf(frozenAudit.nested)).toBeNull();
    expect(Object.getPrototypeOf((frozenAudit.array as readonly unknown[])[0])).toBeNull();
    expect(rawAuditFields).toEqual({ nested: { value: 'safe' }, array: [{ value: 'safe' }] });

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(() => snapshot([alert({ rawAuditFields: cycle })])).toThrow(/cyclic raw audit/i);

    let deep: Record<string, unknown> = { leaf: true };
    for (let depth = 0; depth < 18; depth += 1) deep = { nested: deep };
    expect(() => snapshot([alert({ rawAuditFields: deep })])).toThrow(/normalization limits/i);
    expect(() => snapshot([alert({ rawAuditFields: { values: Array.from({ length: 1_001 }, () => 1) } })]))
      .toThrow(/array exceeds normalization limits/i);
    expect(() => snapshot([alert({ rawAuditFields: Object.fromEntries(
      Array.from({ length: 1_001 }, (_, index) => [`key-${index}`, index]),
    ) })])).toThrow(/object exceeds normalization limits/i);
    expect(() => snapshot([alert({ rawAuditFields: { oversized: 'x'.repeat(65_537) } })]))
      .toThrow(/string exceeds normalization limits/i);
  });
});

describe('service consequence and deterministic disposition', () => {
  test('keeps delay-only visible and generic Affected context-only', () => {
    const delay = alert({
      declaredConsequence: 'delay-only', structuredEffect: 'SIGNIFICANT_DELAYS',
      official: { headerRaw: 'F trains are delayed', descriptionRaw: 'Allow additional time.' },
    });
    const generic = alert();
    for (const item of [delay, generic]) {
      const decision = evaluateServiceChanges({ snapshot: snapshot([item]), claim: claim() });
      expect(decision).toMatchObject({ kind: 'eligible-context', disposition: 'eligible' });
      expect(decision.officialDetails).toHaveLength(1);
    }
  });

  test('suppresses only the exact local-running-express bypass, suspension, closure, and short-turn scope', () => {
    const cases: ServiceAlertEvidence[] = [
      alert({
        alertId: 'express', declaredConsequence: 'local-running-express',
        selectors: [{ selectorId: 'express-segment', routeId: 'F', direction: 'northbound', exactDirectionalSegmentStopIds: ['A24N'] }],
        official: { headerRaw: 'F trains run express', descriptionRaw: 'Northbound F trains skip 14 St.' },
      }),
      alert({
        alertId: 'partial', declaredConsequence: 'partial-suspension', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'partial-segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N', 'A25N'] }],
        official: { headerRaw: 'F service is suspended in part', descriptionRaw: 'No F trains between these stops.' },
      }),
      alert({
        alertId: 'closure', declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'closed-constituent', routeId: 'F', constituentStopIds: ['A24'] }],
        official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping at 14 St.' },
      }),
      alert({
        alertId: 'short-turn', declaredConsequence: 'short-turn',
        selectors: [{ selectorId: 'downstream', routeId: 'F', direction: 'northbound', exactDirectionalSegmentStopIds: ['A24N', 'A25N'] }],
        official: { headerRaw: 'F trains end early', descriptionRaw: 'Jamaica-179 St-bound F trains terminate at 14 St.' },
      }),
      alert({
        alertId: 'full', declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE',
        official: { headerRaw: 'F service is suspended', descriptionRaw: 'No F trains are running.' },
      }),
    ];
    for (const item of cases) {
      expect(evaluateServiceChanges({ snapshot: snapshot([item]), claim: claim() })).toMatchObject({
        kind: 'resolved-suppression', disposition: 'resolved-ineligible',
        suppressedProducts: ['live', 'expected', 'holding', 'uncertain', 'scheduled-fallback', 'countdown', 'dependent-guidance'],
      });
    }
    const beforeShortTurn = { ...cases[3], selectors: [{ selectorId: 'downstream', routeId: 'F', direction: 'northbound' as const, exactDirectionalSegmentStopIds: ['A25N'] }] };
    expect(evaluateServiceChanges({ snapshot: snapshot([beforeShortTurn]), claim: claim() }).kind).toBe('eligible-context');
  });

  test('never suppresses train arrivals for equipment, entrance, or platform-only alerts', () => {
    const contextOnly: ServiceAlertEvidence[] = [
      alert({
        alertId: 'equipment', declaredConsequence: 'entrance-equipment', structuredEffect: 'ACCESSIBILITY_ISSUE',
        official: { headerRaw: 'Elevator outage', descriptionRaw: 'Use another entrance.' },
      }),
      alert({
        alertId: 'platform', declaredConsequence: 'platform-track',
        official: { headerRaw: 'Platform change', descriptionRaw: 'F trains may use another track.' },
      }),
    ];
    for (const item of contextOnly) {
      expect(evaluateServiceChanges({ snapshot: snapshot([item]), claim: claim() }).kind).toBe('eligible-context');
    }
  });

  test('uses unavailable only for independently supported current high-impact unresolved scope', () => {
    const unresolved = alert({
      declaredConsequence: 'reroute',
      selectors: [{ selectorId: 'route-with-unresolved-direction', routeId: 'F', direction: null }],
      official: { headerRaw: 'F trains are rerouted', descriptionRaw: 'F trains run via another line.' },
    });
    expect(evaluateServiceChanges({ snapshot: snapshot([unresolved]), claim: claim() })).toMatchObject({
      kind: 'arrival-claim-unavailable', disposition: 'high-impact-unresolved',
      riderCopy: 'Service change—arrival information is unavailable for this service.',
    });
    expect(evaluateServiceChanges({ snapshot: snapshot([unresolved]), claim: claim({ routeId: 'G' }) }).kind)
      .toBe('eligible-context');
  });

  test('routes contradictory structured/text evidence to an ordinary limitation, not unavailability', () => {
    const contradiction = alert({
      declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE',
      official: { headerRaw: 'F trains are delayed', descriptionRaw: 'F trains continue to make all stops.' },
    });
    expect(evaluateServiceChanges({ snapshot: snapshot([contradiction]), claim: claim() })).toMatchObject({
      kind: 'quarantine-or-limitation', disposition: 'quarantined',
      riderCopy: 'Service change details are being verified.',
    });
  });

  test('uses conservative closure phrases and rejects negation, continuing service, and near-word matches', () => {
    const falsePositives = [
      { headerRaw: 'Closest entrance is on 14 St', descriptionRaw: 'F trains continue stopping here.' },
      { headerRaw: 'Station is not closed', descriptionRaw: 'F trains continue to stop here.' },
      { headerRaw: 'Closure work nearby', descriptionRaw: 'All F stops continue to be served.' },
    ];
    for (const official of falsePositives) {
      expect(evaluateServiceChanges({ snapshot: snapshot([alert({
        declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
        selectors: [{ selectorId: 'exact', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official,
      })]), claim: claim() })).toMatchObject({ kind: 'quarantine-or-limitation', disposition: 'quarantined' });
    }
    expect(evaluateServiceChanges({ snapshot: snapshot([alert({
      declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
      selectors: [{ selectorId: 'exact', routeId: 'F', exactDirectionalStopId: 'A24N' }],
      official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping at 14 St.' },
    })]), claim: claim() }).kind).toBe('resolved-suppression');
  });

  test('rejects explicit destructive-predicate negation across case, punctuation, and Unicode whitespace', () => {
    const cases: ServiceAlertEvidence[] = [
      alert({
        alertId: 'skip-no-stops', declaredConsequence: 'local-running-express',
        selectors: [{ selectorId: 'exact-segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N'] }],
        official: { headerRaw: 'F trains run express?', descriptionRaw: 'F trains SKIP NO STOPS; normal service continues.' },
      }),
      alert({
        alertId: 'do-not-skip', declaredConsequence: 'local-running-express',
        selectors: [{ selectorId: 'exact-segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N'] }],
        official: { headerRaw: 'Service update', descriptionRaw: 'F trains\u00a0DO NOT SKIP 14 St.' },
      }),
      alert({
        alertId: 'not-bypassing', declaredConsequence: 'local-running-express',
        selectors: [{ selectorId: 'exact-segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N'] }],
        official: { headerRaw: 'F trains are not bypassing 14 St.', descriptionRaw: 'Normal service continues.' },
      }),
      alert({
        alertId: 'do-not-terminate', declaredConsequence: 'short-turn',
        selectors: [{ selectorId: 'exact-segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N'] }],
        official: { headerRaw: 'F trains DO NOT TERMINATE early.', descriptionRaw: 'Normal service continues.' },
      }),
      alert({
        alertId: 'do-not-run-via', declaredConsequence: 'reroute',
        selectors: [{ selectorId: 'exact-stop', routeId: 'F', exactDirectionalStopId: 'A24N' }],
        official: { headerRaw: 'F trains do not run via E.', descriptionRaw: 'Normal service continues.' },
      }),
    ];
    for (const item of cases) {
      expect(evaluateServiceChanges({ snapshot: snapshot([item]), claim: claim() })).toMatchObject({
        kind: 'quarantine-or-limitation', disposition: 'quarantined',
      });
    }

    const positiveBypass = alert({
      alertId: 'positive-bypass', declaredConsequence: 'local-running-express',
      selectors: [{ selectorId: 'exact-segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N'] }],
      official: { headerRaw: 'F trains run express', descriptionRaw: 'F trains skip 14 St.' },
    });
    const positiveClosure = alert({
      alertId: 'positive-closure', declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
      selectors: [{ selectorId: 'exact-stop', routeId: 'F', exactDirectionalStopId: 'A24N' }],
      official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping at 14 St.' },
    });
    expect(evaluateServiceChanges({ snapshot: snapshot([positiveBypass]), claim: claim() }).kind).toBe('resolved-suppression');
    expect(evaluateServiceChanges({ snapshot: snapshot([positiveClosure]), claim: claim() }).kind).toBe('resolved-suppression');
  });

  test('rejects modal, progressive, never, no-stop, and without destructive negations while preserving real vetoes', () => {
    const exactSelector = [{ selectorId: 'exact', routeId: 'F', exactDirectionalStopId: 'A24N' }];
    const segmentSelector = [{ selectorId: 'segment', routeId: 'F', exactDirectionalSegmentStopIds: ['A24N'] }];
    const destructive = (
      alertId: string,
      declaredConsequence: ServiceAlertEvidence['declaredConsequence'],
      structuredEffect: ServiceAlertEvidence['structuredEffect'],
      descriptionRaw: string,
      useSegment = false,
    ): ServiceAlertEvidence => alert({
      alertId,
      declaredConsequence,
      structuredEffect,
      selectors: useSegment ? segmentSelector : exactSelector,
      official: { headerRaw: 'Service change', descriptionRaw },
    });

    const negated: ServiceAlertEvidence[] = [];
    for (const modal of ['will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might']) {
      negated.push(destructive(`skip-${modal}`, 'local-running-express', 'MODIFIED_SERVICE',
        `F trains ${modal.toUpperCase()}\u00a0NOT—SKIP 14 St.`, true));
    }
    negated.push(
      destructive('skip-progressive', 'local-running-express', 'MODIFIED_SERVICE', 'F trains are not skipping 14 St.', true),
      destructive('skip-never', 'local-running-express', 'MODIFIED_SERVICE', 'F trains never skip 14 St.', true),
      destructive('skip-no-stops-passive', 'local-running-express', 'MODIFIED_SERVICE', 'No stops are skipped.', true),
      destructive('skip-without', 'local-running-express', 'MODIFIED_SERVICE', 'F trains continue without skipping 14 St.', true),
      destructive('bypass-modal', 'local-running-express', 'MODIFIED_SERVICE', 'F trains will not bypass 14 St.', true),
      destructive('terminate-modal', 'short-turn', 'MODIFIED_SERVICE', 'F trains would not terminate at 14 St.', true),
      destructive('terminate-progressive', 'short-turn', 'MODIFIED_SERVICE', 'F trains were not terminating at 14 St.', true),
      destructive('terminate-never', 'short-turn', 'MODIFIED_SERVICE', 'F trains never terminate at 14 St.', true),
      destructive('terminate-without', 'short-turn', 'MODIFIED_SERVICE', 'F trains continue without terminating at 14 St.', true),
      destructive('via-modal', 'reroute', 'MODIFIED_SERVICE', 'F trains might not run via E.'),
      destructive('via-progressive', 'reroute', 'MODIFIED_SERVICE', 'F trains are not running via E.'),
      destructive('via-never', 'reroute', 'MODIFIED_SERVICE', 'F trains never run via E.'),
      destructive('via-without', 'reroute', 'MODIFIED_SERVICE', 'F trains continue without running via E.'),
      destructive('closure-modal', 'station-closure', 'NO_SERVICE', 'The station will not be closed.'),
      destructive('closure-progressive', 'station-closure', 'NO_SERVICE', 'The station is not closing.'),
      destructive('closure-never', 'station-closure', 'NO_SERVICE', 'The station never closes.'),
      destructive('closure-without', 'station-closure', 'NO_SERVICE', 'Work continues without closing the station.'),
      destructive('suspension-modal', 'full-suspension', 'NO_SERVICE', 'F service should not be suspended.'),
      destructive('suspension-progressive', 'full-suspension', 'NO_SERVICE', 'F service is not being suspended.'),
      destructive('suspension-never', 'full-suspension', 'NO_SERVICE', 'F service is never suspended.'),
      destructive('suspension-without', 'full-suspension', 'NO_SERVICE', 'Work continues without suspending F service.'),
    );
    for (const item of negated) {
      expect(evaluateServiceChanges({ snapshot: snapshot([item]), claim: claim() })).toMatchObject({
        kind: 'quarantine-or-limitation', disposition: 'quarantined',
      });
    }

    const positives = [
      destructive('positive-bypass-verb', 'local-running-express', 'MODIFIED_SERVICE',
        'F trains bypass 14 St.', true),
      destructive('positive-does-not-stop', 'station-closure', 'NO_SERVICE',
        'F trains do not stop at 14 St.'),
      destructive('positive-will-not-stop', 'station-closure', 'NO_SERVICE',
        'F trains will not stop at 14 St.'),
      destructive('positive-closure', 'station-closure', 'NO_SERVICE', 'Station is closed.'),
      destructive('positive-suspension', 'full-suspension', 'NO_SERVICE', 'F service is suspended.'),
      destructive('positive-short-turn', 'short-turn', 'MODIFIED_SERVICE', 'F trains terminate at 14 St.', true),
      destructive('positive-reroute', 'reroute', 'MODIFIED_SERVICE', 'F trains run via E.'),
    ];
    for (const item of positives) {
      expect(evaluateServiceChanges({ snapshot: snapshot([item]), claim: claim() }).kind).toBe('resolved-suppression');
    }
  });

  test('requires exact downstream stop scope for short turns and independent basis for unresolved downstream risk', () => {
    const tripOnly = alert({
      declaredConsequence: 'short-turn', structuredEffect: 'MODIFIED_SERVICE',
      selectors: [{ selectorId: 'trip', routeId: 'F', direction: 'northbound', tripId: 'trip-f-1' }],
      official: { headerRaw: 'F trains end early', descriptionRaw: 'F trains terminate at 14 St.' },
    });
    expect(evaluateServiceChanges({ snapshot: snapshot([tripOnly]), claim: claim() })).toMatchObject({
      kind: 'quarantine-or-limitation', disposition: 'quarantined',
    });
    const independentlySupported = {
      ...tripOnly,
      selectors: [{ selectorId: 'unresolved-downstream', routeId: 'F', direction: 'northbound' as const,
        exactDirectionalSegmentStopIds: null }],
      independentHighImpactBasis: { kind: 'verified-terminal-change' as const, evidenceId: 'terminal-proof-1' },
    };
    expect(evaluateServiceChanges({ snapshot: snapshot([independentlySupported]), claim: claim() })).toMatchObject({
      kind: 'arrival-claim-unavailable', disposition: 'high-impact-unresolved',
    });
    const downstream = { ...tripOnly, selectors: [{ selectorId: 'after-terminal', routeId: 'F',
      direction: 'northbound' as const, exactDirectionalSegmentStopIds: ['A24N', 'A25N'] }] };
    expect(evaluateServiceChanges({ snapshot: snapshot([downstream]), claim: claim() }).kind).toBe('resolved-suppression');
    expect(evaluateServiceChanges({ snapshot: snapshot([downstream]), claim: claim({ exactDirectionalStopId: 'D17N' }) }).kind)
      .toBe('eligible-context');
  });

  test('applies suppression over unavailable over limitation and is duplicate/order independent without mutation', () => {
    const hard = alert({
      alertId: 'hard', declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
      selectors: [{ selectorId: 'hard-stop', routeId: 'F', exactDirectionalStopId: 'A24N' }],
      official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping here.' },
    });
    const unresolved = alert({
      alertId: 'unresolved', declaredConsequence: 'reroute',
      selectors: [{ selectorId: 'u', routeId: 'F', exactDirectionalStopId: null }],
      official: { headerRaw: 'F trains are rerouted', descriptionRaw: 'F trains run via another line.' },
    });
    const limitation = alert({
      alertId: 'limitation', declaredConsequence: 'partial-suspension', structuredEffect: 'NO_SERVICE',
      official: { headerRaw: 'F trains delayed', descriptionRaw: 'All stops continue.' },
    });
    const inputs = [hard, unresolved, limitation, hard];
    const before = JSON.stringify(inputs);
    const forward = evaluateServiceChanges({ snapshot: snapshot(inputs), claim: claim() });
    const reverse = evaluateServiceChanges({ snapshot: snapshot([...inputs].reverse()), claim: claim() });
    expect(forward.kind).toBe('resolved-suppression');
    expect(reverse).toEqual(forward);
    expect(forward.auditEvidence.map((item) => item.alertId)).toEqual(['hard', 'limitation', 'unresolved']);
    expect(JSON.stringify(inputs)).toBe(before);
  });

  test('preserves distinct raw provenance for semantic duplicates without making source order observable', () => {
    const hard = alert({
      alertId: 'duplicate-hard', declaredConsequence: 'station-closure', structuredEffect: 'NO_SERVICE',
      selectors: [{ selectorId: 'exact', routeId: 'F', exactDirectionalStopId: 'A24N' }],
      official: { headerRaw: '<b>Station closed</b>', descriptionRaw: 'F trains are not stopping here.' },
    });
    const inputs = [
      { ...hard, rawAuditFields: { sourceRecord: 'one' } },
      { ...hard, rawAuditFields: { sourceRecord: 'two' } },
    ];
    const forward = evaluateServiceChanges({ snapshot: snapshot(inputs), claim: claim() });
    const reverse = evaluateServiceChanges({ snapshot: snapshot([...inputs].reverse()), claim: claim() });
    expect(forward).toEqual(reverse);
    expect(forward.rawOfficialAudit).toHaveLength(2);
    expect(forward.rawOfficialAudit.map((item) => item.rawAuditFields)).toEqual([
      { sourceRecord: 'one' }, { sourceRecord: 'two' },
    ]);
  });

  test('does not collapse raw official provenance across embedded delimiter boundaries', () => {
    const first = alert({
      alertId: 'raw-boundary',
      official: { headerRaw: 'a\0b', descriptionRaw: 'c' },
    });
    const second = alert({
      alertId: 'raw-boundary',
      official: { headerRaw: 'a', descriptionRaw: 'b\0c' },
    });
    const forward = evaluateServiceChanges({ snapshot: snapshot([first, second]), claim: claim() });
    const reverse = evaluateServiceChanges({ snapshot: snapshot([second, first]), claim: claim() });
    expect(forward.rawOfficialAudit).toHaveLength(2);
    expect(reverse.rawOfficialAudit).toEqual(forward.rawOfficialAudit);
  });

  test('normalizes duplicate alert identities and deterministically quarantines conflicting variants', () => {
    const exact = alert({
      alertId: 'Caf\u00e9', declaredConsequence: 'delay-only', structuredEffect: 'SIGNIFICANT_DELAYS',
      official: { headerRaw: 'F trains are delayed', descriptionRaw: 'Allow extra time.' },
    });
    const canonicallySame = { ...exact, alertId: 'Cafe\u0301' };
    const exactForward = evaluateServiceChanges({ snapshot: snapshot([exact, canonicallySame]), claim: claim() });
    const exactReverse = evaluateServiceChanges({ snapshot: snapshot([canonicallySame, exact]), claim: claim() });
    expect(exactForward).toEqual(exactReverse);
    expect(exactForward.officialDetails).toHaveLength(1);
    expect(exactForward.officialDetails[0].alertId).toBe('Caf\u00e9');

    const conflict = { ...canonicallySame, declaredConsequence: 'station-closure' as const, structuredEffect: 'NO_SERVICE' as const,
      official: { headerRaw: 'Station closed', descriptionRaw: 'F trains are not stopping here.' } };
    const conflictForward = evaluateServiceChanges({ snapshot: snapshot([exact, conflict]), claim: claim() });
    const conflictReverse = evaluateServiceChanges({ snapshot: snapshot([conflict, exact]), claim: claim() });
    expect(conflictForward).toEqual(conflictReverse);
    expect(conflictForward).toMatchObject({ kind: 'quarantine-or-limitation', disposition: 'quarantined' });

    const contextConflict = { ...canonicallySame, declaredConsequence: 'generic-affected' as const,
      structuredEffect: 'UNKNOWN_EFFECT' as const,
      official: { headerRaw: 'F trains are affected', descriptionRaw: 'Check travel information.' } };
    expect(evaluateServiceChanges({ snapshot: snapshot([exact, contextConflict]), claim: claim() })).toMatchObject({
      kind: 'quarantine-or-limitation', disposition: 'quarantined',
    });
  });

  test('handles canonical duplicate recovery IDs without replay donation or first-record wins', () => {
    const update = (evidenceId: string, seconds: number, currentFeed = true): ServiceRecoveryUpdate => ({
      evidenceId, sourceTimestamp: at(seconds), currentFeed, coherentIdentity: true,
      exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
    });
    const exactDuplicates = [update('Caf\u00e9', 1), update('Cafe\u0301', 1), update('second', 2)];
    expect(countQualifyingRecovery(exactDuplicates, BASE, at(3))).toBe(2);
    expect(countQualifyingRecovery([...exactDuplicates].reverse(), BASE, at(3))).toBe(2);

    const conflicts = [update('Caf\u00e9', 1), update('Cafe\u0301', 1, false), update('second', 2)];
    expect(countQualifyingRecovery(conflicts, BASE, at(3))).toBe(0);
    expect(countQualifyingRecovery([...conflicts].reverse(), BASE, at(3))).toBe(0);
  });

  test('rejects delimiter-collision, control, separator, and oversized identities before risk replay', () => {
    const collisionClaims = [
      claim({ claimId: 'a\0b', routeId: 'c' }),
      claim({ claimId: 'a', routeId: 'b\0c' }),
    ];
    for (const malformed of collisionClaims) {
      expect(() => evaluateServiceChanges({ snapshot: snapshot([]), claim: malformed })).toThrow(/identity/i);
    }

    for (const separator of ['\u001f', '\u007f', '\u0085', '\u2028']) {
      expect(() => evaluateServiceChanges({
        snapshot: snapshot([]), claim: claim({ claimId: `claim${separator}split` }),
      })).toThrow(/identity/i);
      expect(() => snapshot([alert({ alertId: `alert${separator}split` })])).toThrow(/identity/i);
      expect(() => snapshot([alert({
        selectors: [{ selectorId: `selector${separator}split`, routeId: 'F' }],
      })])).toThrow(/identity/i);
      expect(() => countQualifyingRecovery([{
        evidenceId: `recovery${separator}split`, sourceTimestamp: at(1), currentFeed: true,
        coherentIdentity: true, exactDirectionalStop: true, coherentPath: true, noCurrentVeto: true,
      }], BASE, at(2))).toThrow(/identity/i);
    }
    expect(() => evaluateServiceChanges({
      snapshot: snapshot([]), claim: claim({ claimId: 'x'.repeat(257) }),
    })).toThrow(/identity/i);

    const prefixA = evaluateServiceChanges({ snapshot: snapshot([]), claim: claim({ claimId: 'ab', routeId: 'c' }) });
    const prefixB = evaluateServiceChanges({ snapshot: snapshot([]), claim: claim({ claimId: 'a', routeId: 'bc' }) });
    expect(prefixA.claimIdentity).not.toBe(prefixB.claimIdentity);
    const composed = evaluateServiceChanges({ snapshot: snapshot([]), claim: claim({ claimId: 'Caf\u00e9' }) });
    const decomposed = evaluateServiceChanges({ snapshot: snapshot([]), claim: claim({ claimId: 'Cafe\u0301' }) });
    expect(composed.claimIdentity).toBe(decomposed.claimIdentity);
  });

  test('binds every decision to an immutable exact evaluated claim scope', () => {
    const result = evaluateServiceChanges({ snapshot: snapshot([]), claim: claim() });
    expect(result.evaluatedClaim).toEqual(claim());
    expect(Object.isFrozen(result.evaluatedClaim)).toBe(true);
    expect(result.claimIdentity).toContain('claim-f-a24n');
    expect(() => ((result.evaluatedClaim as { routeId: string }).routeId = 'E')).toThrow();
  });

  test('requires two coherent updates proving all five recovery conditions after hard risk ends', () => {
    const hard = evaluateServiceChanges({
      snapshot: snapshot([alert({
        declaredConsequence: 'full-suspension', structuredEffect: 'NO_SERVICE',
        official: { headerRaw: 'F service suspended', descriptionRaw: 'No F trains.' },
      })]),
      claim: claim(),
    });
    if (!hard.carryover) throw new Error('hard fixture must carry risk');
    const update = (id: string, seconds: number, overrides: Partial<ServiceRecoveryUpdate> = {}): ServiceRecoveryUpdate => ({
      evidenceId: id,
      sourceTimestamp: at(seconds),
      currentFeed: true,
      coherentIdentity: true,
      exactDirectionalStop: true,
      coherentPath: true,
      noCurrentVeto: true,
      ...overrides,
    });
    const clear = classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at(10), alerts: [] }, at(10));
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('one', 1)] })).toMatchObject({ kind: 'resolved-suppression', recoveryCount: 1 });
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('one', 1), update('two', 2)] })).toMatchObject({ kind: 'eligible-context', recoveryCount: 2 });
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('one', 1), update('two', 2, { coherentPath: false })] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 0 });
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('one', 1), update('bad', 2, { currentFeed: false }), update('two', 3)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 1 });
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('before-risk', -1), update('after-risk', 1)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 1 });
    expect(evaluateServiceChanges({ snapshot: clear, claim: claim(), priorRisk: hard.carryover,
      recoveryUpdates: [update('current', 1), update('future', 11)] }))
      .toMatchObject({ kind: 'resolved-suppression', recoveryCount: 1 });
  });
});
