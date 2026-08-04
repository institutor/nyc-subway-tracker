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
