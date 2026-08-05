import { describe, expect, test } from 'vitest';
import { acceptAccessibilityAlternativeRegistry, chooseAccessibilityAlternative } from '../../src/shared/domain/accessibility-alternatives';
import { acceptEquipmentHistory, acceptEquipmentInventory, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import { classifyPathImpact } from '../../src/shared/domain/path-impact';
import { createAccessibilityWarning, deriveLastAccessibleDecisionPoint, transitionAccessibilityWarning } from '../../src/shared/domain/underway-warning';
import { resolvedPath } from '../fixtures/accessibility-decisions';

const warningTime = new Date('2026-08-01T00:02:00.000Z');
const transitionTime = new Date('2026-08-01T00:03:00.000Z');

function impact() {
  const inventory = acceptEquipmentInventory({ inventoryId: 'inv', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment', sourceVersion: 'inv-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-1'] });
  const history = acceptEquipmentHistory({ historyId: 'history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', snapshots: [{ snapshotId: 'snap', sequenceOrdinal: 1, predecessorSnapshotId: null, evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', sourceTimestamp: '2026-08-01T00:01:00.000Z', acceptedAt: '2026-08-01T00:01:01.000Z', declaredRecordCount: 1, records: [{ recordId: 'out', equipmentId: 'EL-1', state: 'out-of-service' }] }] }, inventory);
  const changedEquipment = assessEquipmentStatus({ targetEquipmentId: 'EL-1', decisionTime: new Date('2026-08-01T00:02:00.000Z'), inventory, history });
  const selectedPath = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St' });
  return { decision: classifyPathImpact({ changedEquipment, selectedPath, alternatePaths: [], decisionTime: new Date('2026-08-01T00:02:00.000Z') })!, selectedPath };
}

function alternatives(selectedPath: ReturnType<typeof resolvedPath>) {
  const pathDecision = resolvedPath('alt', 'eligible', { originIntent: selectedPath.originIntent, destinationIntent: selectedPath.destinationIntent });
  const registry = acceptAccessibilityAlternativeRegistry({
    registryId: 'warning-alternatives', evidenceOwner: 'app-owned-accessibility-alternatives',
    selectedPathEvaluationId: selectedPath.evaluationId, createdAt: '2026-08-01T00:00:00.000Z', validThrough: '2026-08-01T00:04:00.000Z',
    offers: [{ offerId: 'alt', evidenceOwner: 'app-owned-accessibility-alternatives', label: 'Use the verified 127 St entrance path.', canonicalIdentity: pathDecision.pathId, pathEvaluationId: pathDecision.evaluationId, pathPackageVersion: pathDecision.packageVersion, tier: 'same-complex', originIntent: pathDecision.originIntent, destinationIntent: pathDecision.destinationIntent, singlePointElevatorDependencies: 0, transfers: 0, accessibleWalkingMeters: 100, disruptionRisk: 0, travelSeconds: 60, includesBus: false }],
  }, selectedPath, [pathDecision]);
  return { selection: chooseAccessibilityAlternative(registry, { decisionTime: new Date('2026-08-01T00:02:00.000Z') }), pathDecision };
}

function warning(phase: 'predeparture' | 'underway' = 'underway', decisionPoint?: ReturnType<typeof deriveLastAccessibleDecisionPoint>) {
  return warningContext(phase, decisionPoint).warning;
}

function unknownDecisionPoint(selectedPath: ReturnType<typeof resolvedPath>) {
  return deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [], selectedPath, decisionTime: warningTime });
}

function knownDecisionPoint(pointId: string) {
  const selectedPath = impact().selectedPath;
  return deriveLastAccessibleDecisionPoint({
    cursorOrder: 1, affectedOrder: 5,
    points: [{ id: pointId, order: 4, reachable: true, hasVerifiedSafeAction: true }],
    selectedPath, decisionTime: warningTime,
  });
}

function warningContext(
  phase: 'predeparture' | 'underway' = 'underway',
  decisionPoint?: ReturnType<typeof deriveLastAccessibleDecisionPoint>,
) {
  const impactContext = impact();
  const alternativeContext = alternatives(impactContext.selectedPath);
  const resolvedPoint = decisionPoint ?? unknownDecisionPoint(impactContext.selectedPath);
  return {
    warning: createAccessibilityWarning({
      phase, decisionPoint: resolvedPoint, impactDecision: impactContext.decision, alternativeSelection: alternativeContext.selection,
      decisionTime: warningTime,
    }),
    ...impactContext,
    ...alternativeContext,
  };
}

describe('underway accessibility warning', () => {
  test('chooses the latest still-reachable verified decision point before the affected connection', () => {
    const selectedPath = impact().selectedPath;
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [{ id: 'p2', order: 2, reachable: true, hasVerifiedSafeAction: true }, { id: 'p4', order: 4, reachable: true, hasVerifiedSafeAction: true }, { id: 'p6', order: 6, reachable: true, hasVerifiedSafeAction: true }], selectedPath, decisionTime: warningTime })).toMatchObject({ status: 'known', pointId: 'p4' });
  });

  test('returns Unknown when reachability is unknown or the point may have passed', () => {
    const selectedPath = impact().selectedPath;
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 4, affectedOrder: 5, points: [{ id: 'p4', order: 4, reachable: 'unknown', hasVerifiedSafeAction: true }], selectedPath, decisionTime: warningTime })).toMatchObject({ status: 'unknown' });
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [{ id: 'p4', order: 4, reachable: true, hasVerifiedSafeAction: true, possiblyPassed: true }], selectedPath, decisionTime: warningTime })).toMatchObject({ status: 'unknown' });
  });

  test('distinguishes predeparture, underway known-point, and immediate states with exact warning content', () => {
    expect(warning('predeparture', knownDecisionPoint('origin')).state).toBe('predeparture-action-required');
    expect(warning('underway', knownDecisionPoint('59 St')).state).toBe('underway-known-point');
    const immediate = warning();
    expect(immediate.state).toBe('underway-immediate');
    expect(immediate.content.at(-1)).toBe('Use the verified 127 St entrance path.');
  });

  test('rejects a copied decision-point result instead of accepting a structural lookalike', () => {
    const impactContext = impact();
    const point = deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [{ id: 'p4', order: 4, reachable: true, hasVerifiedSafeAction: true }], selectedPath: impactContext.selectedPath, decisionTime: warningTime });
    expect(() => createAccessibilityWarning({
      phase: 'underway',
      decisionPoint: { ...point }, impactDecision: impactContext.decision,
      alternativeSelection: alternatives(impactContext.selectedPath).selection, decisionTime: warningTime,
    } as never)).toThrow(/resolved decision point/i);
  });

  test('derives rider facts from exact impact and offer receipts instead of caller-written copy', () => {
    const impactContext = impact();
    const result = createAccessibilityWarning({
      fact: 'All elevators are working.', connection: 'Wrong station.', consequence: 'No consequence.', freshness: 'Never checked.',
      phase: 'underway', decisionPoint: unknownDecisionPoint(impactContext.selectedPath), impactDecision: impactContext.decision,
      alternativeSelection: alternatives(impactContext.selectedPath).selection, decisionTime: warningTime,
    } as never);
    expect(result.content).not.toContain('All elevators are working.');
    expect(result.content).not.toContain('Wrong station.');
  });

  test('rejects a genuine alternative selection resolved for a different selected path', () => {
    const impactContext = impact();
    const otherSelected = resolvedPath('other-selected', 'eligible', { destinationIntent: '168 St' });
    expect(() => createAccessibilityWarning({
      phase: 'underway', decisionPoint: unknownDecisionPoint(impactContext.selectedPath), impactDecision: impactContext.decision,
      alternativeSelection: alternatives(otherSelected).selection, decisionTime: warningTime,
    })).toThrow(/selection.*impact|impact.*selection/i);
  });

  test.each(['acknowledge', 'navigate', 'go-offline', 'reconnect', 'progress', 'lower-priority-recovered', 'single-machine-restored'] as const)(
    'persists through %s without silently clearing', (type) => {
      expect(transitionAccessibilityWarning(warning(), { type }, transitionTime)).toMatchObject({ active: true, selectedPathId: 'selected', destinationIntent: '168 St', accessibleRouteOnly: true, lastTransitionAt: transitionTime.toISOString() });
    },
  );

  test('clears only with an opaque eligible offered replacement or exact owner path reevaluation', () => {
    const context = warningContext();
    const replacementEvent = (pathDecision: ReturnType<typeof resolvedPath>) => ({
      type: 'replacement-selected' as const, alternativeSelection: context.selection, offerId: 'alt', pathDecision,
    });
    expect(transitionAccessibilityWarning(context.warning, replacementEvent(resolvedPath('other', 'eligible', { decisionTime: transitionTime.toISOString() })), transitionTime).active).toBe(true);
    expect(transitionAccessibilityWarning(context.warning, replacementEvent(resolvedPath('alt', 'ineligible', { originIntent: context.selectedPath.originIntent, destinationIntent: context.selectedPath.destinationIntent, decisionTime: transitionTime.toISOString() })), transitionTime).active).toBe(true);
    expect(transitionAccessibilityWarning(context.warning, replacementEvent(context.pathDecision), transitionTime).active).toBe(true);
    expect(transitionAccessibilityWarning(context.warning, { type: 'owner-resolved', pathDecision: resolvedPath('selected', 'ineligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St', decisionTime: transitionTime.toISOString() }) }, transitionTime).active).toBe(true);
    expect(transitionAccessibilityWarning(context.warning, { type: 'owner-resolved', pathDecision: context.selectedPath }, transitionTime).active).toBe(true);

    const freshReplacement = resolvedPath('alt', 'eligible', { originIntent: context.selectedPath.originIntent, destinationIntent: context.selectedPath.destinationIntent, decisionTime: transitionTime.toISOString() });
    expect(transitionAccessibilityWarning(context.warning, replacementEvent(freshReplacement), transitionTime)).toMatchObject({ active: false, selectedPathId: 'alt' });
    const freshOwner = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St', decisionTime: transitionTime.toISOString() });
    expect(transitionAccessibilityWarning(context.warning, { type: 'owner-resolved', pathDecision: freshOwner }, transitionTime).active).toBe(false);
  });

  test('rejects wrong-scope and expired genuine clearing receipts but permits later fresh owner resolution', () => {
    const context = warningContext();
    const wrongDestination = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: 'wrong', decisionTime: transitionTime.toISOString() });
    const wrongScope = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St', stationComplexId: 'B99', decisionTime: transitionTime.toISOString() });
    expect(transitionAccessibilityWarning(context.warning, { type: 'owner-resolved', pathDecision: wrongDestination }, transitionTime).active).toBe(true);
    expect(transitionAccessibilityWarning(context.warning, { type: 'owner-resolved', pathDecision: wrongScope }, transitionTime).active).toBe(true);

    const afterOfferExpiry = new Date('2026-08-01T00:04:00.001Z');
    const freshReplacement = resolvedPath('alt', 'eligible', { originIntent: context.selectedPath.originIntent, destinationIntent: context.selectedPath.destinationIntent, decisionTime: '2026-08-01T00:04:00.000Z' });
    expect(transitionAccessibilityWarning(context.warning, { type: 'replacement-selected', alternativeSelection: context.selection, offerId: 'alt', pathDecision: freshReplacement }, afterOfferExpiry).active).toBe(true);
    const laterOwner = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St', decisionTime: '2026-08-01T00:05:00.000Z' });
    expect(transitionAccessibilityWarning(context.warning, { type: 'owner-resolved', pathDecision: laterOwner }, new Date('2026-08-01T00:05:00.000Z')).active).toBe(false);
  });

  test('does not clear from a later path evaluation whose required equipment decisions predate the triggering adverse assessment', () => {
    const context = warningContext();
    const staleEvidenceOwner = resolvedPath('selected', 'eligible', {
      equipmentIds: ['EL-1'], destinationIntent: '168 St',
      decisionTime: transitionTime.toISOString(),
      equipmentDecisionTime: '2026-08-01T00:01:00.000Z',
    });

    expect(transitionAccessibilityWarning(
      context.warning,
      { type: 'owner-resolved', pathDecision: staleEvidenceOwner },
      transitionTime,
    ).active).toBe(true);
  });

  test('rejects scalar clearing assertions and caller-authored warnings', () => {
    const active = warning();
    expect(transitionAccessibilityWarning(active, { type: 'owner-resolved', freshFullPathPassed: true } as never, transitionTime).active).toBe(true);
    expect(() => transitionAccessibilityWarning({ ...active } as never, { type: 'acknowledge' }, transitionTime)).toThrow(/resolved accessibility warning/i);
    const advanced = transitionAccessibilityWarning(active, { type: 'navigate' }, transitionTime);
    expect(() => transitionAccessibilityWarning(advanced, { type: 'progress' }, warningTime)).toThrow(/monotonic/i);
  });
});
